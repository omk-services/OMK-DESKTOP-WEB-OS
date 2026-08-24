// src/lib/tooling/adapters/acp-ibm.ts
// ACP (IBM) — Agent Communication Protocol.
//
// COLLISION DE NOM A NE JAMAIS LAISSER PASSER
//
// Deux protocoles portent le sigle ACP, et ils n'occupent pas le meme etage :
//
//   acp.ts      Agent CLIENT Protocol       client -> agent   (editeur pilote)
//   acp-ibm.ts  Agent COMMUNICATION Protocol agent <-> agent  (cycle de vie)
//
// Citer « ACP » sans qualifier ne designe rien. Les deux fichiers existent
// separement pour que le choix soit force a l'ecriture, jamais devine a la
// lecture.
//
// Objet propre a celui-ci : interfaces standard d'interaction ET gestion du
// CYCLE DE VIE d'un agent — c'est ce que l'Agent Client Protocol ne couvre pas.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

/** Etats du cycle de vie. Un agent sans etat declare est en absence, pas au repos. */
export type EtatCycleVie =
  | 'declare'      // decrit, jamais instancie
  | 'provisionne'  // ressources allouees
  | 'actif'        // accepte des invocations
  | 'suspendu'     // conserve son etat, refuse les invocations
  | 'retire';      // ressources liberees, journal conserve

export interface DescripteurAgentACP {
  id: string;
  name: string;
  description: string;
  lifecycle: EtatCycleVie;
  /** Interfaces exposees, derivees du registre. */
  interfaces: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
}

/**
 * Transitions legales. Une matrice explicite plutot qu'un `if` disperse :
 * un cycle de vie ou n'importe quel etat mene a n'importe quel autre n'est
 * pas un cycle de vie.
 */
const TRANSITIONS: Record<EtatCycleVie, EtatCycleVie[]> = {
  declare: ['provisionne', 'retire'],
  provisionne: ['actif', 'retire'],
  actif: ['suspendu', 'retire'],
  suspendu: ['actif', 'retire'],
  retire: [],
};

export function transitionLegale(de: EtatCycleVie, vers: EtatCycleVie): boolean {
  return TRANSITIONS[de].includes(vers);
}

export function buildDescripteurACP(lifecycle: EtatCycleVie = 'actif'): DescripteurAgentACP {
  return {
    id: 'coach-os',
    name: 'Coach OS',
    description: 'Business OS a huit domaines, expose sur quinze adaptateurs.',
    lifecycle,
    interfaces: list().map((t: ToolDefinition) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToInputSchema(t.schema),
    })),
  };
}

/** Demande de transition. Refus explicite et motive : jamais un echec muet. */
export function demanderTransition(de: EtatCycleVie, vers: EtatCycleVie): Record<string, unknown> {
  if (!transitionLegale(de, vers)) {
    return {
      ok: false,
      motif: `transition illegale ${de} -> ${vers}`,
      transitions_possibles: TRANSITIONS[de],
    };
  }
  return { ok: true, de, vers, note: vers === 'retire' ? 'journal conserve : rien ne se perd' : null };
}
