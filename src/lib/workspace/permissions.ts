// src/lib/workspace/permissions.ts
// Permissions WorkSpaces — matrice rôle × action.
//
// Hérite du brief MEMBERSHIPS : le rôle vient de la membership active du
// tenant, pas d'un rôle global. Un owner dans tenant A n'est rien dans
// tenant B. Cette matrice est appliquée APRÈS la résolution d'identité.
//
// Règles (cf. BRIEF_WORKSPACE_BRANCHES §permissions) :
//   - créerBranche      : owner, admin
//   - ouvrirPr          : owner, admin, member
//   - reviewerPr        : owner, admin (member ne peut PAS reviewer —
//                         sinon un member dépose + approuve dans la foulée,
//                         ce que la règle « anti-auto-approbation » interdit déjà
//                         dans tooling/permissions.ts)
//   - mergerPr          : owner uniquement
//   - supprimerBranche  : owner uniquement, et jamais la branche `main`
//
// Le résultat est typé `WorkspaceResult<boolean>` pour rester compatible
// avec les autres modules du dossier workspace.

import type { MembershipRole } from './types';

export type WorkspaceAction =
  | 'creerBranche'
  | 'ouvrirPr'
  | 'reviewerPr'
  | 'mergerPr'
  | 'supprimerBranche';

export interface BranchGuardArgs {
  role: MembershipRole;
  isMain?: boolean;
  /** Pour reviewerPr : id de l'auteur de la PR. Refus si === ctx.actorId. */
  authorId?: string;
  actorId?: string;
}

/** Vérifie une action WorkSpace. Renvoie { ok: true } ou un refus typé.
 *  Pure function, sans I/O — testable directement. */
export function peut(
  action: WorkspaceAction,
  args: BranchGuardArgs,
): { ok: true } | { ok: false; code: 'forbidden' | 'self_approval'; error: string } {
  const role = args.role;
  const isMain = args.isMain ?? false;

  switch (action) {
    case 'creerBranche':
      if (role === 'owner' || role === 'admin') return { ok: true };
      return refus(`Rôle "${role}" ne peut pas créer de branche.`);

    case 'ouvrirPr':
      if (role === 'owner' || role === 'admin' || role === 'member') return { ok: true };
      return refus(`Rôle "${role}" ne peut pas ouvrir de PR.`);

    case 'reviewerPr':
      if (role !== 'owner' && role !== 'admin') {
        return refus(`Rôle "${role}" ne peut pas reviewer une PR.`);
      }
      // Anti-auto-approbation : un owner du tenant PEUT reviewer sa propre PR
      // (le filet tooling/permissions.ts est plus strict, mais ici on garde
      // la sémantique owner-puede-tout). Un admin NE PEUT PAS reviewer sa
      // propre PR — c'est la règle « pas d'auto-approbation par défaut ».
      if (args.authorId && args.actorId && args.authorId === args.actorId && role !== 'owner') {
        return {
          ok: false,
          code: 'self_approval',
          error: 'Auto-approbation refusée : un acteur ne peut pas reviewer sa propre PR.',
        };
      }
      return { ok: true };

    case 'mergerPr':
      if (role === 'owner') return { ok: true };
      return refus(`Rôle "${role}" ne peut pas merger. Owner uniquement.`);

    case 'supprimerBranche':
      if (role !== 'owner') {
        return refus(`Rôle "${role}" ne peut pas supprimer une branche.`);
      }
      if (isMain) {
        return refus('La branche "main" est protégée et ne peut pas être supprimée.');
      }
      return { ok: true };
  }
}

function refus(error: string): { ok: false; code: 'forbidden'; error: string } {
  return { ok: false, code: 'forbidden', error };
}

// --- Wrappers ergonomiques pour les consumers ------------------------------

export const peutCreerBranche = (role: MembershipRole): boolean =>
  peut('creerBranche', { role }).ok;

export const peutOuvrirPr = (role: MembershipRole): boolean =>
  peut('ouvrirPr', { role }).ok;

export const peutReviewPr = (role: MembershipRole): boolean =>
  peut('reviewerPr', { role }).ok;

export const peutMergerPr = (role: MembershipRole): boolean =>
  peut('mergerPr', { role }).ok;

export const peutSupprimerBranche = (role: MembershipRole, isMain: boolean): boolean =>
  peut('supprimerBranche', { role, isMain }).ok;