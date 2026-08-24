// src/lib/tooling/adapters/fcp.ts
// FCP — Function Call Protocol (OpenAI). Invocation de fonction LLM avec
// contrainte de schema, arguments valides et sorties typees.
//
// CE QU IL AJOUTE
//
// MCP et FCP decrivent tous deux un appel. FCP impose en plus la VALIDATION
// STRICTE des arguments avant execution — `strict: true` interdit toute
// propriete non declaree. C est la difference entre un modele qui invente un
// champ et un appel qui echoue proprement.
//
// Le format est aussi celui que consomment la majorite des clients existants :
// l exposer coute peu et ouvre large.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

export interface FonctionFCP {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    /** Vrai : aucune propriete hors schema. Un modele qui invente echoue tot. */
    strict: true;
  };
}

/**
 * Les noms d outils portent des points (`app.open`). FCP accepte
 * `[a-zA-Z0-9_-]` : le point est traduit, et la traduction est reversible pour
 * que le routage retrouve l outil d origine.
 */
export function nomFCP(nom: string): string {
  return nom.replace(/\./g, '__');
}

export function depuisNomFCP(nom: string): string {
  return nom.replace(/__/g, '.');
}

export function buildFCP(): FonctionFCP[] {
  return list().map((t: ToolDefinition) => ({
    type: 'function' as const,
    function: {
      name: nomFCP(t.name),
      description: t.description,
      parameters: durcir(zodToInputSchema(t.schema)),
      strict: true as const,
    },
  }));
}

/**
 * `strict: true` exige `additionalProperties: false` a chaque niveau objet.
 * L omettre fait rejeter l appel par le fournisseur, avec un message qui
 * pointe le schema et non la cause — d ou le durcissement recursif ici.
 */
function durcir(schema: Record<string, unknown>): Record<string, unknown> {
  if (schema.type !== 'object') return schema;
  const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const durcies: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) durcies[k] = durcir(v);
  return {
    ...schema,
    properties: durcies,
    additionalProperties: false,
    // En mode strict, toute propriete doit figurer dans `required`.
    required: Object.keys(props),
  };
}

/** Resout un appel FCP entrant vers le nom d outil du registre. */
export function resoudreAppel(nomAppele: string): { outil: string; connu: boolean } {
  const outil = depuisNomFCP(nomAppele);
  return { outil, connu: list().some((t) => t.name === outil) };
}
