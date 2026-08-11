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
} from '@modelcontextprotocol/sdk/types.js';
import { parseArgs } from '../defineTool';
import { get, list } from '../registry';
import { zodToInputSchema } from './mcp-schema.js';
import { registerAll } from '../catalog/index.js';
import type { ToolContext } from '../types';

const DEFAULT_TENANT = 'demo';
const DEFAULT_ACTOR = 'agent:mcp';

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
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: list().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToInputSchema(tool.schema),
      })),
    };
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
    const ctx: ToolContext = {
      tenantId:
        (args && typeof args === 'object' && '__tenantId' in args
          ? String((args as { __tenantId?: unknown }).__tenantId)
          : null) ?? DEFAULT_TENANT,
      actorId:
        (args && typeof args === 'object' && '__actorId' in args
          ? String((args as { __actorId?: unknown }).__actorId)
          : null) ?? DEFAULT_ACTOR,
    };
    try {
      const result = await tool.execute(parsed.args, ctx);
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
