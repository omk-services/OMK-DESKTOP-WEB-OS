// src/lib/tooling/adapters/ucp.ts
// Universal Context Protocol — le contexte qui survit au changement de harnais.
//
// LE PROBLEME QU'IL FERME
//
// Un travail commence sous un harnais et fini sous un autre perd tout ce qui
// n'etait pas ecrit : l'historique vit dans une fenetre de contexte, et la
// fenetre appartient au harnais. C'est ce qui rend une substitution de harnais
// theorique — le bridge sait router, mais le travail repart de zero.
//
// UCP porte le contexte hors des fenetres : un paquet portable, adressable par
// contenu, que le harnais suivant reconstruit.
//
// Statut : la surface est declaree, la specification amont n'est pas mesuree.
// Ce fichier pose la forme minimale dont le runtime a besoin ; il sera aligne
// quand la spec le sera. Ne pas le presenter comme conforme a un standard.

import { createHash } from 'node:crypto';

/**
 * Un fragment adressable par contenu.
 *
 * Le hachage par fragment, plutot que sur le paquet entier, donne le diff exact
 * entre deux etats : on voit QUEL morceau a change, pas seulement QUE quelque
 * chose a change.
 */
export interface FragmentUCP {
  id: string;
  role: 'systeme' | 'doctrine' | 'historique' | 'artefact' | 'outil';
  contenu: string;
}

export interface PaquetUCP {
  version: 1;
  source: 'coach-os';
  /** Domaine d'origine : un contexte sans domaine n'est pas rattachable. */
  domaine: string | null;
  fragments: FragmentUCP[];
  /** Empreinte de l'ensemble, pour detecter une reprise partielle. */
  empreinte: string;
}

function hacher(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 12);
}

export function fragment(role: FragmentUCP['role'], contenu: string): FragmentUCP {
  return { id: hacher(role + contenu), role, contenu };
}

export function empaqueter(domaine: string | null, fragments: FragmentUCP[]): PaquetUCP {
  return {
    version: 1,
    source: 'coach-os',
    domaine,
    fragments,
    empreinte: hacher(fragments.map((f) => f.id).join('|')),
  };
}

/**
 * Diff entre deux paquets : quels fragments ont change.
 *
 * C'est la fonction qui rend un changement de harnais verifiable. Sans elle on
 * suppose que le contexte a ete transmis ; avec elle on le montre.
 */
export function diff(a: PaquetUCP, b: PaquetUCP): { ajoutes: string[]; retires: string[]; identique: boolean } {
  const ia = new Set(a.fragments.map((f) => f.id));
  const ib = new Set(b.fragments.map((f) => f.id));
  return {
    ajoutes: [...ib].filter((x) => !ia.has(x)),
    retires: [...ia].filter((x) => !ib.has(x)),
    identique: a.empreinte === b.empreinte,
  };
}
