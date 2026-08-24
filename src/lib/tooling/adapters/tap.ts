// src/lib/tooling/adapters/tap.ts
// TAP — Tool Abstraction Protocol (LangChain).
// Schema JSON standardise pour les metadonnees d outil et leur execution.
//
// DIFFERENCE AVEC MCP, ET ELLE N EST PAS COSMETIQUE
//
// MCP transporte. TAP DECRIT. TAP porte ce que MCP laisse implicite : le cout
// d un appel, son idempotence, s il peut etre rejoue.
//
// Ce sont exactement les metadonnees dont un orchestrateur a besoin pour
// decider s il RELANCE apres un echec — question a laquelle MCP ne repond pas,
// et que chaque runtime finit par redecouvrir a ses depens.

import type { ToolDefinition } from '../types';
import { list } from '../registry';
import { zodToInputSchema } from './mcp-schema';

export interface DescripteurTAP {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  metadata: {
    /** Un appel repete donne-t-il le meme resultat ? Decide si un retry est sur. */
    idempotent: boolean;
    /** Effet durable ? Gouverne l exposition sur les surfaces publiques. */
    effet_durable: boolean;
    /** Cout indicatif, pour arbitrer un budget d inference. */
    cout: 'nul' | 'faible' | 'eleve';
    rejouable: boolean;
  };
}

export function buildTAP(): DescripteurTAP[] {
  return list().map((t: ToolDefinition) => {
    const ecriture = t.category === 'ecriture';
    return {
      name: t.name,
      description: t.description,
      schema: zodToInputSchema(t.schema),
      metadata: {
        // Lecture et navigation sont idempotentes par construction : elles ne
        // laissent rien derriere elles.
        idempotent: !ecriture,
        effet_durable: ecriture,
        cout: ecriture ? ('eleve' as const) : ('faible' as const),
        // Rejouer une ecriture dupliquerait un effet de bord. Le dire ici evite
        // qu une boucle de retry naive le decouvre en production.
        rejouable: !ecriture,
      },
    };
  });
}

/**
 * Un retry n est sur que si l outil est idempotent.
 * Repondre non EST une reponse : une politique de reprise qui ne sait pas
 * refuser transforme un echec unique en effet multiplie.
 */
export function retrySur(nom: string): { sur: boolean; motif: string } {
  const d = buildTAP().find((x) => x.name === nom);
  if (!d) return { sur: false, motif: `outil inconnu : ${nom}` };
  return d.metadata.idempotent
    ? { sur: true, motif: 'idempotent : un rejeu donne le meme resultat' }
    : { sur: false, motif: 'effet durable : un rejeu dupliquerait l effet de bord' };
}
