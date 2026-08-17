// src/lib/tooling/adapters/mcp.ts
// Adaptateur MCP. Un serveur stdio qui multiplexe tous les outils.
// Plus économe qu'un serveur par outil (1 connexion vs N) — c'est
// aussi la recommandation explicite de ARCHITECTURE_V1 §4.
//
// Wire protocol : JSON-RPC 2.0 sur stdin/stdout, format imposé par le
// SDK @modelcontextprotocol/sdk. On utilise la classe Server officielle
// pour ne PAS réinventer le framing — un agent distant qui se branche
// saura déjà parler ce dialecte.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { parseArgs } from '../defineTool';
import { get, list } from '../registry';
import { zodToInputSchema } from './mcp-schema.js';
import { metaUi, listerRessourcesUi, lireRessourceUi } from './mcp-apps.js';
import { registerAll } from '../catalog/index.js';
import { resolveIdentity } from '../identity';
import { assertPermission } from '../permissions';
import { appendEvent } from '../../audit/logger';
import type { ToolContext } from '../types';

/** Construit un server MCP prêt à l'emploi. Exporté à part pour les
 *  tests ; le serveur final l'instancie et le branche sur StdioServerTransport. */
export function buildMcpServer(): Server {
  registerAll();
  const server = new Server(
    {
      name: 'coach-os',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        // MCP Apps : les interfaces sont servies comme des ressources `ui://`.
        // Sans cette capacite declaree, l'hote ne demandera jamais la page et
        // l'outil retombera silencieusement sur son rendu texte.
        resources: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: list().map((tool) => {
        const meta = metaUi(tool);
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: zodToInputSchema(tool.schema),
          // `_meta.ui.resourceUri` est ce qui distingue un outil-fonction d'un
          // outil-interface. Absent quand l'outil n'a pas d'UI : un `_meta`
          // vide ferait croire a l'hote qu'une page existe.
          ...(meta ? { _meta: meta } : {}),
        };
      }),
    };
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: listerRessourcesUi(),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const contenu = lireRessourceUi(req.params.uri);
    if (!contenu) {
      throw new Error(`Ressource inconnue : "${req.params.uri}".`);
    }
    return { contents: [contenu] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const tool = get(name);
    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: false, error: `Outil inconnu : "${name}".` }),
          },
        ],
        isError: true,
      };
    }
    const parsed = parseArgs(tool, args);
    if (!parsed.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: false, error: parsed.error }),
          },
        ],
        isError: true,
      };
    }
    const identity = resolveIdentity({
      tenantId:
        args && typeof args === 'object' && '__tenantId' in args
          ? (args as { __tenantId?: unknown }).__tenantId
          : undefined,
      actorId:
        args && typeof args === 'object' && '__actorId' in args
          ? (args as { __actorId?: unknown }).__actorId
          : undefined,
      role:
        args && typeof args === 'object' && '__role' in args
          ? (args as { __role?: unknown }).__role
          : undefined,
    });
    if (!identity.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: `Identité refusée par le serveur MCP : ${identity.error}`,
              missing: identity.missing,
            }),
          },
        ],
        isError: true,
      };
    }
    const ctx: ToolContext = identity.ctx;
    const permission = await assertPermission(ctx, tool, parsed.args as Record<string, unknown>);
    if (!permission.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: `Permission refusée : ${permission.error}`,
              code: permission.code,
            }),
          },
        ],
        isError: true,
      };
    }
    try {
      const result = await tool.execute(parsed.args, ctx);

      // Audit log (NOUVEAU 2026-08-15). On log chaque appel d'outil —
      // succès ou échec — pour la traçabilité. Le résultat métier
      // reste dans `result` ; on rend isError selon ok:false.
      try {
        void appendEvent({
          tenantId: ctx.tenantId,
          actorId: ctx.actorId,
          actorRole: ctx.role,
          action: 'observer.event', // Action générique d'appel d'outil via MCP — voir audit/event.ts.
          targetType: 'tool',
          targetId: name,
          metadata: {
            adapter: 'mcp',
            category: tool.category,
            ok: result.ok,
            ...(result.ok ? {} : { error: result.error }),
          },
          observerSource: 'external',
        });
      } catch {
        /* appendEvent est no-throw ; filet supplémentaire */
      }

      // Conformité MCP : on rend du texte (JSON) avec un flag isError
      // si l'outil a renvoyé ok:false.
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.ok,
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: `Erreur interne : ${err instanceof Error ? err.message : String(err)}`,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/** Démarre le serveur MCP sur stdio. Le process doit avoir été
 *  invoqué sans TTY (cf. `mcp.json` qui demande `coach-os mcp`). */
export async function runMcpStdio(): Promise<void> {
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Le server tourne jusqu'à ce que stdin ferme. Aucune tâche à
  // lancer ici : le transport gère le framing.
}
