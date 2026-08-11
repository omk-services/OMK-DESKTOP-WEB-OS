// src/lib/tooling/defineTool.ts
// Primitive : un outil = un defineTool. Cinq adaptateurs consomment la
// même définition (REST, MCP, CLI, Skill, in-app).
//
// Trois exigences enracinées dans l'expérience du dépôt :
//
// 1. La catégorie 'ecriture' ne s'exécute jamais directement. L'executeur
//    retourne une ProposalRef ; le client (scenario store) dépose la
//    proposition. C'est cette séparation qui empêche un agent de toucher
//    aux données réelles sans arbitre humain.
//
// 2. La description reste courte. Toujours dans le contexte du modèle.
//    Le détail d'usage (erreurs fréquentes, exemples, edge cases) va
//    dans la skill, chargée à la demande. C'est la distinction que
//    Melvynx souligne — un screenshot de Lumail où la description de
//    l'outil tient en deux lignes, et la skill porte le reste.
//
// 3. Les args sont validés une fois, à un seul endroit. Tout adaptateur
//    qui veut exécuter doit passer par `parseArgs`, sinon il ment à ses
//    appelants. Un outil qui n'a pas validé ses args est un outil bugué.

import type { z } from 'zod';
import type { ToolCategory, ToolContext, ToolDefinition, ToolResult } from './types';

export interface DefineToolOptions<TSchema extends z.ZodTypeAny, TOut> {
  name: string;
  description: string;
  category: ToolCategory;
  schema: TSchema;
  /** Étiquette humaine affichée dans la file d'approbation. */
  displayName: (args: z.infer<TSchema>) => string;
  execute: (
    args: z.infer<TSchema>,
    ctx: ToolContext,
  ) => ToolResult<TOut> | Promise<ToolResult<TOut>>;
}

/** Forme canonique du nom d'outil. Validé à la définition, pas à
 *  l'exécution. C'est ici qu'on détecte un outil non conforme avant
 *  qu'un adaptateur ne le publie. */
export const TOOL_NAME = /^[a-z0-9][a-z0-9.-]{0,63}$/;

export function defineTool<TSchema extends z.ZodTypeAny, TOut>(
  opts: DefineToolOptions<TSchema, TOut>,
): ToolDefinition<TSchema, TOut> {
  if (!TOOL_NAME.test(opts.name)) {
    throw new Error(
      `Nom d'outil invalide : "${opts.name}". Attendu : kebab-case, 1-64 caractères, [a-z0-9.-], ne commence pas par un point ou un tiret.`,
    );
  }
  if (opts.description.length > 240) {
    throw new Error(
      `Description trop longue (${opts.description.length} > 240) : "${opts.name}". La description est TOUJOURS dans le contexte du modèle. Le détail va dans la skill.`,
    );
  }
  if (opts.category === 'ecriture' && !opts.displayName) {
    throw new Error(
      `Outil "${opts.name}" est 'ecriture' : displayName est obligatoire (label humain dans la file d'approbation).`,
    );
  }
  return {
    name: opts.name,
    description: opts.description,
    category: opts.category,
    schema: opts.schema,
    displayName: opts.displayName,
    execute: opts.execute,
  };
}

/** Valide `args` contre le schema d'un outil. Une seule passe, un seul
 *  endroit. Les adaptateurs qui appellent cet helper sont bons ; ceux
 *  qui ne le font pas sont bugués. */
export function parseArgs<TSchema extends z.ZodTypeAny>(
  tool: ToolDefinition<TSchema, unknown>,
  raw: unknown,
): { ok: true; args: z.infer<TSchema> } | { ok: false; error: string } {
  const r = tool.schema.safeParse(raw);
  if (!r.success) {
    const issues = r.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return { ok: false, error: `Invalid arguments for ${tool.name}: ${issues}` };
  }
  return { ok: true, args: r.data };
}

/** Forme-string d'un ToolResult, pour les sorties courtes (CLI --brief,
 *  logs MCP). Tronquée à 240 caractères. Ce n'est pas perdu : un mode
 *  --detailed rend la forme complète. */
export function toolResultToShort(result: ToolResult<unknown>): string {
  if (!result.ok) return `error: ${result.error}`;
  const data = result.data;
  if (data == null) return 'ok';
  if (typeof data === 'string') return data;
  try {
    const json = JSON.stringify(data);
    return json.length > 240 ? json.slice(0, 237) + '...' : json;
  } catch {
    return 'ok';
  }
}
