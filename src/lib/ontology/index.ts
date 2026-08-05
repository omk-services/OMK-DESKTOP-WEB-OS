/**
 * API publique du registre d'ontologie.
 *
 * Surface importable par les apps :
 *   - getEntity(id)
 *   - listEntities(opts?)
 *   - listAttributesOf(id, opts?)
 *   - relationsOf(entityId)
 *   - contractOf(entityId)
 *
 * Les modules internes (entities, relations, contracts) ne sont JAMAIS
 * importes depuis l'exterieur. Ce fichier est la seule porte : les
 * consommateurs ne peuvent pas acceder aux tables brutes.
 *
 * Aucun composant React, aucun fichier .tsx, aucun appel reseau, aucun
 * acces disque, aucune dependance ajoutee. Le registre vit en memoire
 * TypeScript.
 */

import { ENTITIES } from './entities';
import { RELATIONS } from './relations';
import { CONTRACTS } from './contracts';

import type { EntityId, EntityDef, AttributeType, EntityAttribute, AttributeScope } from './entities';
import type { Relation, Cardinality } from './relations';
import type { Contract } from './contracts';

/**
 * Portee demandee par un consommateur. `'all'` est le defaut et conserve
 * le comportement historique : tous les attributs sont rendus, quel que
 * soit leur scope. Cf. story 3 de l'epic couche-ontologie.
 */
export type ScopeFilter = AttributeScope | 'all';

// Re-exports des types de la surface publique. Les constantes internes
// (ENTITIES, RELATIONS, CONTRACTS) ne sont JAMAIS re-exportees : les
// consommateurs passent par les 4 fonctions ci-dessous.

export type { EntityId, EntityDef, AttributeType, EntityAttribute, AttributeScope, Relation, Cardinality, Contract };

/**
 * Gele en profondeur l'instance rendue a un consommateur. Les annotations
 * `readonly` des types `EntityDef` / `EntityAttribute` / `Contract` ne
 * protegent que des reassignations : sans freeze, un consommateur peut
 * toujours muter en place l'objet rendu (par exemple
 * `getEntity('Client').attributes[0].name = 'autre'`) et corrompre le
 * registre partage entre les trois apps de l'epic. Le freeze est
 * implemente comme une copie superficielle pour eviter de muter les
 * tables source ; les attributs d'entite sont copies par valeur puis
 * re-geles. TypeScript ne voit que `readonly` ; c'est volontaire, c'est
 * la barriere d'execution.
 */
function deepFreezeEntity(e: EntityDef): EntityDef {
  const attributes = Object.freeze(
    e.attributes.map((a) => Object.freeze({ ...a })),
  ) as readonly EntityAttribute[];
  return Object.freeze({ ...e, attributes });
}

function deepFreezeRelation(r: Relation): Relation {
  return Object.freeze({ ...r });
}

function deepFreezeContract(c: Contract): Contract {
  return Object.freeze({
    triggers: Object.freeze([...c.triggers]),
    allowedActions: Object.freeze([...c.allowedActions]),
  });
}

/**
 * Decide si un attribut matche le scope demande. Convention centrale :
 * l'absence du champ `scope` equivaut a `scope === 'org'`. Le test
 * d'invariant `ontology.test.ts` verrouille ce contrat. `'all'` ignore
 * le champ et renvoie `true` (laisses-passer global).
 */
function matchesScope(a: EntityAttribute, scope: ScopeFilter): boolean {
  if (scope === 'all') return true;
  const effective: AttributeScope = a.scope ?? 'org';
  return effective === scope;
}

/**
 * Renvoie la definition d'une entite par son identifiant, ou `undefined`
 * si l'identifiant n'existe pas dans le registre.
 *
 * Pas d'exception : les apps peuvent appeler cette fonction en branche
 * ouverte (par exemple sur un identifiant issu d'une URL ou d'un import)
 * sans devoir pre-valider. L'instance rendue est gelee en profondeur.
 */
export function getEntity(id: EntityId): EntityDef | undefined {
  const found = ENTITIES.find((e) => e.id === id);
  return found ? deepFreezeEntity(found) : undefined;
}

/**
 * Renvoie la liste des 12 entites, dans un ordre stable (l'ordre de
 * declaration dans `entities.ts`). Chaque entite est gelee en
 * profondeur ; le tableau lui-meme est gele mais laisse visible.
 *
 * Le filtre `scope` est une **conservation** : on garde toujours les 12
 * entites, on n'en masque aucune. Justification (cf. Design Notes spec
 * 3) : la grille sert de plan du registre, un utilisateur qui bascule
 * en `scope: 'org'` cherche a voir ce qui releve de l'organisation, pas
 * a voir disparaitre des entites entieres. Si une entite n'a que des
 * attributs personnels, le rendu reste present mais vide (l'app UI
 * devra afficher un message « aucun attribut organisationnel »).
 */
export function listEntities(opts?: { scope?: ScopeFilter }): readonly EntityDef[] {
  const scope = opts?.scope ?? 'all';
  const copies = ENTITIES.map(deepFreezeEntity);
  // Le filtre ne modifie pas la collection : on garde toutes les entites
  // pour conserver le plan. Le `scope` est laisse a la disposition des
  // tests pour compter les entites dont au moins un attribut matche.
  if (scope === 'all') {
    return Object.freeze(copies) as readonly EntityDef[];
  }
  return Object.freeze(copies) as readonly EntityDef[];
}

/**
 * Renvoie les attributs d'une entite, filtres par scope. Defaut : `'all'`
 * (comportement historique, tous les attributs). Le retour est un
 * nouveau tableau gele : le tableau d'attributs de l'entite d'origine
 * (deja gele) n'est pas partage.
 *
 * Si l'identifiant n'existe pas dans le registre, renvoie `[]` : pas
 * d'exception (cf. matrice d'I/O spec 3).
 */
export function listAttributesOf(
  entityId: EntityId,
  opts?: { scope?: ScopeFilter },
): readonly EntityAttribute[] {
  const scope = opts?.scope ?? 'all';
  const found = ENTITIES.find((e) => e.id === entityId);
  if (!found) return Object.freeze([]) as readonly EntityAttribute[];
  const filtered = found.attributes
    .filter((a) => matchesScope(a, scope))
    .map((a) => Object.freeze({ ...a }));
  return Object.freeze(filtered) as readonly EntityAttribute[];
}

/**
 * Renvoie toutes les relations dont la source OU la cible vaut
 * `entityId`. Une relation est incluse des qu'une seule de ses extremites
 * touche l'entite — c'est ce que demande l'acceptance test. Chaque
 * relation rendue est gelee.
 */
export function relationsOf(entityId: EntityId): readonly Relation[] {
  const copies = RELATIONS.filter((r) => r.source === entityId || r.target === entityId).map(deepFreezeRelation);
  return Object.freeze(copies) as readonly Relation[];
}

/**
 * Renvoie le contrat semantique d'une entite (declencheurs et actions
 * permises), ou `undefined` si l'entite n'a pas de contrat. Chaque entite
 * de `entities.ts` est censee avoir une entree dans `CONTRACTS` ; la
 * coherence est verifiee par `ontology.test.ts`. Le contrat rendu est
 * gele en profondeur.
 */
export function contractOf(entityId: EntityId): Contract | undefined {
  const c = CONTRACTS[entityId];
  return c ? deepFreezeContract(c) : undefined;
}
