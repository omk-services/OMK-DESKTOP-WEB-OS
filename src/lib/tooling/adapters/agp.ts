// src/lib/tooling/adapters/agp.ts
// AGP — Agent Gateway Protocol. Pont entre agents et systemes externes.
//
// CE QU'IL FERME
//
// MCP suppose que l'outil parle deja MCP. AGP couvre le cas contraire : un
// systeme externe qui ne parle aucun protocole d'agent et qu'il faut traduire,
// filtrer et autoriser au passage.
//
// Trois responsabilites — transformation de message, traduction de protocole,
// controle d'acces. Le controle est cite en dernier mais s'applique EN PREMIER
// a l'execution : traduire puis refuser reviendrait a avoir deja lu ce qu'on
// n'avait pas le droit de lire.

import type { ToolDefinition } from '../types';
import { list } from '../registry';

export type ProtocoleExterne = 'rest' | 'graphql' | 'grpc' | 'soap' | 'webhook';

export interface RegleAcces {
  /** Motif de nom autorise. Une regle sans motif n autorise rien. */
  motif: string;
  categories: string[];
  origines: string[];
}

/**
 * Refus par defaut. Le motif `$^` ne peut correspondre a aucune chaine.
 * Une passerelle qui laisse passer ce qui n est pas nomme n est pas une
 * passerelle : c est un trou avec une documentation.
 */
export const REGLE_VIDE: RegleAcces = { motif: '$^', categories: [], origines: [] };

export function autoriser(
  outil: string,
  categorie: string,
  origine: string,
  regles: RegleAcces[],
): boolean {
  return regles.some(
    (r) =>
      new RegExp(r.motif).test(outil) &&
      r.categories.includes(categorie) &&
      r.origines.includes(origine),
  );
}

/** Traduit un descripteur vers la forme attendue par un systeme externe. */
export function traduire(t: ToolDefinition, vers: ProtocoleExterne): Record<string, unknown> {
  const base = { nom: t.name, description: t.description, categorie: t.category };
  switch (vers) {
    case 'rest':
      return { ...base, methode: t.category === 'ecriture' ? 'POST' : 'GET', chemin: `/api/tools/${t.name}` };
    case 'graphql':
      return { ...base, champ: t.name.replace(/[.-]/g, '_'), type: t.category === 'ecriture' ? 'Mutation' : 'Query' };
    case 'grpc':
      return { ...base, service: 'CoachOs', rpc: t.name.replace(/[.-]/g, '') };
    case 'soap':
      return { ...base, action: `urn:coach-os:${t.name}` };
    case 'webhook':
      return { ...base, evenement: `coach-os.${t.name}` };
  }
}

/** Projection de la passerelle, filtree par les regles. Compte ce qui est ecarte. */
export function buildPasserelle(
  vers: ProtocoleExterne,
  origine: string,
  regles: ReadonlyArray<RegleAcces> = [REGLE_VIDE],
): Record<string, unknown> {
  const tous = list();
  const autorises = tous.filter((t) => autoriser(t.name, t.category, origine, regles as RegleAcces[]));
  return {
    protocole: vers,
    origine,
    outils_exposes: autorises.length,
    // Le compte des filtres est rendu : une passerelle silencieuse sur ce
    // qu elle bloque empeche de distinguer un filtre trop large d un registre vide.
    outils_filtres: tous.length - autorises.length,
    descripteurs: autorises.map((t) => traduire(t, vers)),
  };
}
