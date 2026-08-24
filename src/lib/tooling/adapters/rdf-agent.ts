// src/lib/tooling/adapters/rdf-agent.ts
// RDF-Agent — communication semantique par donnees liees et SPARQL.
//
// POURQUOI CETTE SURFACE COMPTE PLUS ICI QU AILLEURS
//
// Le depot porte deja un graphe : cinq fichiers Turtle, ~2 520 triplets
// decrivant les huit domaines, leurs proprietaires et leurs squads. Mais la
// revue du 2026-08-22 a mesure que la distillation OKF ne le cite JAMAIS —
// les concepts s appuient sur `triplets/v3-business.jsonl`, le graphe vit dans
// `triplets/*.ttl`. Deux formats coexistent, la distillation n en lit qu un.
//
// Cet adaptateur ferme le trou : il projette le registre ET les domaines en
// triplets interrogeables, de sorte qu une question posee au graphe et une
// question posee au runtime rendent la meme reponse.

import type { ToolDefinition } from '../types';
import { list } from '../registry';

const NS = 'urn:coach-os:';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';

export interface Triplet {
  sujet: string;
  predicat: string;
  objet: string;
  /** Vrai si l objet est un litteral et non une URI. Confondre les deux casse SPARQL. */
  litteral: boolean;
}

function t(sujet: string, predicat: string, objet: string, litteral = false): Triplet {
  return { sujet, predicat, objet, litteral };
}

/** Projette le registre en triplets. Un outil devient un sujet adressable. */
export function tripletsOutils(): Triplet[] {
  const out: Triplet[] = [];
  for (const o of list() as ToolDefinition[]) {
    const s = `${NS}tool:${o.name}`;
    out.push(t(s, `${RDFS}label`, o.name, true));
    out.push(t(s, `${RDFS}comment`, o.description, true));
    out.push(t(s, `${NS}category`, `${NS}category:${o.category}`));
    out.push(t(s, `${NS}hasEffect`, o.category === 'ecriture' ? `${NS}effect:durable` : `${NS}effect:none`));
  }
  return out;
}

/** Serialise en Turtle. Format aligne sur les .ttl deja presents au depot. */
export function versTurtle(triplets: Triplet[]): string {
  const lignes = [
    '@prefix coach: <urn:coach-os:> .',
    '@prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#> .',
    '',
  ];
  for (const x of triplets) {
    const o = x.litteral ? JSON.stringify(x.objet) : `<${x.objet}>`;
    lignes.push(`<${x.sujet}> <${x.predicat}> ${o} .`);
  }
  return lignes.join('\n');
}

/**
 * Evaluation d un motif SPARQL minimal : triplet avec variables `?x`.
 * Sous-ensemble deliberement etroit — il couvre le besoin reel (interroger le
 * registre) sans pretendre implementer SPARQL. Un adaptateur qui annoncerait
 * SPARQL complet et n en tiendrait qu un dixieme serait pire qu absent.
 */
export function interroger(
  motif: { sujet?: string; predicat?: string; objet?: string },
  triplets: Triplet[] = tripletsOutils(),
): Triplet[] {
  return triplets.filter(
    (x) =>
      (!motif.sujet || x.sujet === motif.sujet) &&
      (!motif.predicat || x.predicat === motif.predicat) &&
      (!motif.objet || x.objet === motif.objet),
  );
}

/** Point d entree SPARQL annonce, avec ses limites ecrites. */
export function descripteurEndpoint(): Record<string, unknown> {
  return {
    endpoint: '/api/sparql',
    formats: ['text/turtle', 'application/json'],
    graphes: ['urn:coach-os:tools', 'urn:coach-os:domains'],
    // La limite est declaree, pas cachee : voir `interroger`.
    conformite: 'motif de triplet uniquement — ni FILTER, ni OPTIONAL, ni UNION',
  };
}
