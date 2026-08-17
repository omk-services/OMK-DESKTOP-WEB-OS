// _config/cms/workspace.ts
// Configuration WorkSpaces — defaults et seuils.
//
// Ce fichier n'est pas un CMS — il décrit les invariants du système de
// branches WorkSpaces. Les valeurs servent de garde-fou si quelqu'un
// propose un changement de comportement dans un brief suivant.

import type { MembershipRole } from '../../src/lib/workspace/types';

/** Nom canonique de la branche par défaut. */
export const MAIN_BRANCH_NAME = 'main';

/** Nombre minimum d'`approve` requis pour qu'une PR passe en approved. */
export const APPROVES_REQUIS = 2;

/** Un seul `reject` suffit à fermer une PR. */
export const REJECTS_POUR_FERMER = 1;

/** Acteurs autorisés à merger. */
export const ROLES_PEUVENT_MERGER: ReadonlyArray<MembershipRole> = ['owner'];

/** Acteurs autorisés à créer une branche. */
export const ROLES_PEUVENT_CREER_BRANCHE: ReadonlyArray<MembershipRole> = [
  'owner',
  'admin',
];

/** Acteurs autorisés à reviewer une PR (owner + admin — owner peut
 *  reviewer sa propre PR, admin ne le peut pas). */
export const ROLES_PEUVENT_REVIEWER_PR: ReadonlyArray<MembershipRole> = [
  'owner',
  'admin',
];

/** Acteurs autorisés à supprimer une branche (uniquement non-main). */
export const ROLES_PEUVENT_SUPPRIMER_BRANCHE: ReadonlyArray<MembershipRole> = [
  'owner',
];

/** Longueur max d'un nom de branche (slug). */
export const BRANCH_NAME_MAX_LENGTH = 64;

/** Regex validant un nom de branche. kebab/snake, alnum + tirets. */
export const BRANCH_NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;