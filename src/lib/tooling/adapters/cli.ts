// src/lib/tooling/adapters/cli.ts
// Adaptateur CLI. Le binaire `coach-os` lit argv, résout l'outil
// ciblé, parse les args, et appelle execute. Sortie : JSON par défaut,
// --detailed pour la forme complète, --brief pour la version tronquée.
//
// Le but est d'éviter qu'un agent qui boucle sur le CLI ne pollue son
// contexte avec 2 000 tokens par appel. Une ligne par résultat --brief
// ; la forme complète reste accessible sans relancer tous les agents.

import { parseArgs, toolResultToShort } from '../defineTool';
import { get, list } from '../registry';
import { registerAll } from '../catalog/index.js';
import { resolveIdentity } from '../identity';
import { assertPermission } from '../permissions';
import { appendEvent } from '../../audit/logger';
import type { ToolContext, ToolDefinition } from '../types';

export interface CliRunOptions {
  argv: string[];
  /** Couleur activée (TTY). */
  color?: boolean;
  /** Mode sortie : 'json' (défaut), 'brief', 'names'. */
  output?: 'json' | 'brief' | 'names';
  /** En-tête `x-coach-os-tenant` posée par --tenant. */
  tenantId?: string;
  /** En-tête `x-coach-os-actor` posée par --actor. */
  actorId?: string;
  /** Rôle de l'acteur (option CLI --role). La couche permissions
   *  (étape 3) consomme cette valeur. */
  role?: string;
}

export interface CliRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Une commande parse et exécute. La résolution du format de sortie
 *  se fait ici, pas dans la boucle principale — c'est ce qui permet
 *  aux outils de rendre ce qu'ils veulent sans connaître le CLI. */
export function runCli(opts: CliRunOptions): Promise<CliRunResult> {
  registerAll();
  const argv = opts.argv.slice(2); // strip `node` and script
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    return Promise.resolve(helpText());
  }
  if (argv[0] === '--version' || argv[0] === '-v') {
    return Promise.resolve({ code: 0, stdout: 'coach-os 0.1.0\n', stderr: '' });
  }
  if (argv[0] === 'tools' && argv[1] === 'list') {
    return Promise.resolve(listTools(opts.output ?? 'names'));
  }
  if (argv[0] === 'mcp') {
    return Promise.resolve({ code: 2, stdout: '', stderr: 'Le sous-process MCP se lance via `coach-os mcp-serve` (voir ci-dessous). Reformulation : `node mcp/server.mjs`' });
  }

  const toolName = argv[0];
  const tool = get(toolName);
  if (!tool) {
    return Promise.resolve({
      code: 1,
      stdout: '',
      stderr: `Outil inconnu : "${toolName}". Lister avec \`coach-os tools list\`.`,
    });
  }

  // Parsing simple : --flag value pairs et --flag=value. La V1 ne
  // supporte pas les listes ou les objets imbriqués — pour ça, le
  // caller passe --json '{...}'.
  const rawArgs: Record<string, unknown> = {};
  const positional: unknown[] = [];
  let i = 1;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok === '--json') {
      try {
        const parsed = JSON.parse(argv[++i] ?? '{}');
        Object.assign(rawArgs, parsed);
      } catch (err) {
        return Promise.resolve({ code: 1, stdout: '', stderr: `--json invalide : ${err instanceof Error ? err.message : String(err)}` });
      }
      i++;
      continue;
    }
    if (tok === '--detailed') {
      opts.output = 'json';
      i++;
      continue;
    }
    if (tok === '--brief') {
      opts.output = 'brief';
      i++;
      continue;
    }
    if (tok === '--tenant') {
      opts.tenantId = argv[++i];
      i++;
      continue;
    }
    if (tok === '--actor') {
      opts.actorId = argv[++i];
      i++;
      continue;
    }
    if (tok === '--role') {
      opts.role = argv[++i];
      i++;
      continue;
    }
    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=');
      const key = eq >= 0 ? tok.slice(2, eq) : tok.slice(2);
      const value = eq >= 0 ? tok.slice(eq + 1) : argv[++i];
      rawArgs[key] = coerceValue(value);
      i++;
      continue;
    }
    positional.push(coerceValue(tok));
    i++;
  }
  if (positional.length === 1) {
    // Convention: premier positionnel = premier champ texte déclaré
    // par le schema. C'est ce qui rend `coach-os collection.read tasks`
    // (et pas de JSON) tolérable.
    const shape = (tool.schema as z.ZodObject<z.ZodRawShape>).shape;
    if (shape) {
      const firstKey = Object.keys(shape)[0];
      if (firstKey && rawArgs[firstKey] === undefined) {
        rawArgs[firstKey] = positional[0];
      }
    }
  }

  const parsed = parseArgs(tool, rawArgs);
  if (!parsed.ok) {
    return Promise.resolve({ code: 1, stdout: '', stderr: parsed.error });
  }
  const identity = resolveIdentity({
    tenantId: opts.tenantId,
    actorId: opts.actorId,
    role: opts.role,
  });
  if (!identity.ok) {
    return Promise.resolve({
      code: 1,
      stdout: '',
      stderr: `Identité refusée : ${identity.error}`,
    });
  }
  const ctx: ToolContext = identity.ctx;
  return (async () => {
    const perm = await assertPermission(ctx, tool, parsed.args as Record<string, unknown>);
    if (!perm.ok) {
      return {
        code: 1 as const,
        stdout: '',
        stderr: `Permission refusée (${perm.code}) : ${perm.error}`,
      };
    }
    try {
      const result = await tool.execute(parsed.args, ctx);

      // Audit log (NOUVEAU 2026-08-15). appendEvent ne lève JAMAIS.
      try {
        void appendEvent({
          tenantId: ctx.tenantId,
          actorId: ctx.actorId,
          actorRole: ctx.role,
          action: 'observer.event',
          targetType: 'tool',
          targetId: tool.name,
          metadata: {
            adapter: 'cli',
            category: tool.category,
            ok: result.ok,
            ...(result.ok ? {} : { error: result.error }),
          },
          observerSource: 'external',
        });
      } catch { /* no-throw */ }

      return formatResult(result, opts.output ?? 'json');
    } catch (err) {
      return {
        code: 1 as const,
        stdout: '',
        stderr: `Erreur interne : ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  })();
}

/** z est utilisé dans le typage : on l'importe ici pour rester proche
 *  de l'endroit qui s'en sert. */
import { z } from 'zod';

function coerceValue(v: string | undefined): unknown {
  if (v === undefined) return '';
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function listTools(output: 'json' | 'brief' | 'names'): CliRunResult {
  const tools = list();
  if (output === 'json') {
    return { code: 0, stdout: JSON.stringify({ count: tools.length, tools: tools.map(briefTool) }, null, 2), stderr: '' };
  }
  if (output === 'brief') {
    return { code: 0, stdout: tools.map((t) => `${t.name}\t${t.category}\t${t.description}`).join('\n') + '\n', stderr: '' };
  }
  return { code: 0, stdout: tools.map((t) => t.name).join('\n') + '\n', stderr: '' };
}

function briefTool(t: ToolDefinition): Record<string, string> {
  return { name: t.name, category: t.category, description: t.description };
}

function formatResult(result: { ok: true; data: unknown } | { ok: false; error: string }, output: 'json' | 'brief' | 'names'): CliRunResult {
  if (output === 'brief') {
    return { code: result.ok ? 0 : 1, stdout: toolResultToShort(result) + '\n', stderr: '' };
  }
  return {
    code: result.ok ? 0 : 1,
    stdout: JSON.stringify(result, null, 2) + '\n',
    stderr: result.ok ? '' : 'commande échouée',
  };
}

function helpText(): CliRunResult {
  const lines = [
    'coach-os — exposition AI-natif',
    '',
    'Usage:',
    '  coach-os <tool> [--flag value ...]',
    '  coach-os tools list',
    '  coach-os --help    affiche cette aide',
    '  coach-os --version affiche la version',
    '',
    'Drapeaux globaux :',
    '  --brief       sortie courte (une ligne)',
    '  --detailed    sortie JSON complète',
    '  --json {...}  passe des args JSON complexes',
    '  --tenant ID   pose le tenant (obligatoire hors mode démo)',
    '  --actor  ID   pose l\'acteur (obligatoire hors mode démo)',
    '  --role   R    pose le rôle : owner | admin | member | guest',
    '',
    'Outils disponibles : `coach-os tools list`',
    '',
  ];
  return { code: 0, stdout: lines.join('\n'), stderr: '' };
}
