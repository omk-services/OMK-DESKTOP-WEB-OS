// src/lib/tooling/adapters/a2a.ts
// Agent to Agent — l'etage ou les 8 VP se parlent sans passer par le CEO.
//
// POURQUOI CETTE SURFACE N'EST PAS UN LUXE
//
// Sans A2A, tout couplage entre domaines remonte a B1. Un blocage privacy
// detecte par Cyborg devrait atteindre Aquaman directement ; le faire transiter
// par Summers transforme un signal pair en decision de direction, et sature le
// seul goulot qu'on cherche a proteger.
//
// La doctrine le nomme deja : un blocker pair brise la dormance mecaniquement,
// sans debat. A2A est le transport de ce mecanisme.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

/** Carte d'agent : ce que Coach OS annonce a ses pairs. */
export interface CarteAgent {
  name: string;
  description: string;
  version: string;
  /** Competences annoncees, derivees du registre. */
  skills: Array<{ id: string; name: string; description: string; inputSchema: Record<string, unknown> }>;
  /** Domaines joignables, pour qu'un pair adresse le bon capitaine. */
  domains: string[];
  authentication: { schemes: string[] };
}

const DOMAINES_JOIGNABLES = [
  'rh-meta-gouvernance', 'operations-loops', 'product-growth', 'sales-cognition',
  'people-acquisition', 'finance-roi', 'rd-it', 'legal-compliance',
];

export function buildCarteAgent(): CarteAgent {
  return {
    name: 'coach-os',
    description: 'Business OS a huit domaines. Chaque domaine porte un veto categoriel opposable a ses pairs.',
    version: '1',
    skills: list().map((t: ToolDefinition) => ({
      id: t.name,
      name: t.displayName ? t.displayName({} as never) : t.name,
      description: t.description,
      inputSchema: zodToInputSchema(t.schema),
    })),
    domains: DOMAINES_JOIGNABLES,
    authentication: { schemes: ['bearer'] },
  };
}

/** Une tache deleguee par un pair. */
export interface TacheA2A {
  id: string;
  domaine: string;
  /** Un blocker pair brise la dormance mecaniquement : il ne se negocie pas. */
  type: 'blocker' | 'demande' | 'information';
  motif: string;
  emetteur: string;
}

/**
 * Accuse reception d'une tache pair.
 *
 * Un `blocker` reveille le domaine sans debat prealable — c'est la regle
 * canonique. Une `demande` entre en file. Une `information` ne reveille rien :
 * un domaine dormant qui se reveille sur une information produirait un cout
 * sans contrepartie.
 */
export function recevoirTache(t: TacheA2A): Record<string, unknown> {
  const reveille = t.type === 'blocker';
  return {
    accepte: DOMAINES_JOIGNABLES.includes(t.domaine),
    tache: t.id,
    domaine: t.domaine,
    reveille,
    consignation: reveille
      ? '04_Business_Domains/B2_DC_DIRECTION_COUNCIL_DECISIONS.md'
      : null,
    note: reveille
      ? 'blocker pair : reveil mecanique, sans debat au Council'
      : 'mise en file : ne reveille pas un domaine dormant',
  };
}
