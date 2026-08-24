// src/lib/tooling/adapters/tdf.ts
// TDF — Task Definition Format (Stanford). Schema declaratif de tache :
// entrees, sorties, objectifs d optimisation.
//
// CE QU IL APPORTE QUE LES AUTRES N ONT PAS
//
// MCP dit COMMENT appeler. TAP dit A QUEL COUT. TDF dit POURQUOI — quel
// objectif la tache optimise, et a quelle contrainte elle est soumise.
//
// C est la piece qui rend un Rock executable. Un rock formule comme un resultat
// au passe verifiable est deja une definition de tache : il lui manquait
// seulement un format que la machine lit.

export interface Contrainte {
  nom: string;
  /** Expression evaluable. Une contrainte non evaluable est un souhait. */
  predicat: string;
  dure: boolean;
}

export interface DefinitionTache {
  tdf_version: 1;
  id: string;
  domaine: string;
  /** Resultat attendu, au passe, verifiable. Jamais une sequence. */
  objectif: string;
  entrees: Array<{ nom: string; type: string; requis: boolean }>;
  sorties: Array<{ nom: string; type: string; verifiable_par: string }>;
  contraintes: Contrainte[];
  /** Metrique unique. Deux metriques concurrentes ne s optimisent pas. */
  optimise: { metrique: string; sens: 'maximiser' | 'minimiser' };
}

/**
 * Contraintes portees par tout Rock du Business OS, quel que soit le domaine.
 * Elles sont dures : une tache qui les viole n est pas degradee, elle est refusee.
 */
export const CONTRAINTES_CANONIQUES: Contrainte[] = [
  { nom: 'segment_nomme', predicat: 'entrees.segment_id != null', dure: false },
  { nom: 'sortie_verifiable', predicat: 'sorties.every(s => s.verifiable_par != null)', dure: true },
  { nom: 'pas_engagement_sans_mandat', predicat: 'contexte.mandat_ref != null || !effets.financiers', dure: true },
];

export function definirTache(
  id: string,
  domaine: string,
  objectif: string,
  options: Partial<Omit<DefinitionTache, 'tdf_version' | 'id' | 'domaine' | 'objectif'>> = {},
): DefinitionTache {
  return {
    tdf_version: 1,
    id,
    domaine,
    objectif,
    entrees: options.entrees ?? [],
    sorties: options.sorties ?? [],
    contraintes: [...CONTRAINTES_CANONIQUES, ...(options.contraintes ?? [])],
    optimise: options.optimise ?? { metrique: 'delta_observable', sens: 'maximiser' },
  };
}

/**
 * Valide une definition. Une sortie sans moyen de verification est le defaut
 * le plus courant et le plus couteux : elle produit un « Done » que personne
 * ne peut contredire.
 */
export function valider(d: DefinitionTache): { ok: boolean; defauts: string[] } {
  const defauts: string[] = [];
  if (!d.objectif.trim()) defauts.push('objectif vide');
  if (!d.sorties.length) defauts.push('aucune sortie declaree : rien ne pourra etre verifie');
  for (const s of d.sorties) {
    if (!s.verifiable_par) defauts.push(`sortie ${s.nom} sans moyen de verification`);
  }
  for (const c of d.contraintes.filter((x) => x.dure)) {
    if (!c.predicat.trim()) defauts.push(`contrainte dure ${c.nom} sans predicat evaluable`);
  }
  return { ok: defauts.length === 0, defauts };
}
