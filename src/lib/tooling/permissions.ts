// src/lib/tooling/permissions.ts
// Couche permissions (étape 3, campagne 2026-08-14).
//
// Deux gardes superposées :
//
//  1. Rôle vs catégorie — le minimum syndical :
//     - 'lecture'   : tous rôles (owner, admin, member, guest)
//     - 'navigation': tous rôles
//     - 'ecriture'  : owner, admin, member (PAS guest)
//
//  2. Anti-auto-approbation pour `scenario.approve` :
//     un acteur ne peut PAS approuver une proposition qu'il a lui-même
//     créée, sauf si son rôle est 'owner'. C'est le filet du wargame
//     W12 : un agent qui dépose puis approuve dans la foulée doit
//     échouer.
//
// Cette fonction est appelée par chaque adaptateur qui exécute
// (mcp, rest, cli). Les autres surfaces (in-app) la consomment via
// `assertPermissionOrThrow` quand un binding est défini.
//
// ÉTAPE 4 (campagne 2026-08-15, MEMBERSHIPS)
// ------------------------------------------
// La résolution whitelist dans `identity.ts` valide **un** rôle.
// Depuis les memberships, le rôle final est lu côté DB. Deux
// extensions ici :
//   - `canRoleStrict()` : matrice stricte, paramétrable par rôle.
//     Pas de changement de signature de `canRole()` (les tests
//     existants reposent dessus).
//   - `assertMembershipRolePresent()` : refuse un appel si le
//     ctx.role n'est pas un rôle "membership" (defense en
//     profondeur — la couche identity doit avoir fait son travail).

import type { ToolContext, ToolDefinition } from './types';
import { getProposal } from './serverStore';
import type { MembershipRole } from '../tenant/contract';

export type PermissionCode = 'FORBIDDEN' | 'SELF_APPROVAL' | 'NO_MEMBERSHIP_ROLE';

export type PermissionResult =
  | { ok: true }
  | { ok: false; code: PermissionCode; error: string };

/** Matrice rôle × catégorie. Conservée explicite (pas de tableau
 *  magique) pour qu'une revue de code la valide d'un coup d'œil. */
export function canRole(category: ToolDefinition['category'], role: ToolContext['role']): boolean {
  switch (category) {
    case 'lecture':
      // Lecture : tout rôle. Même un guest a le droit de LIRE l'état.
      return true;
    case 'navigation':
      // Navigation : tout rôle. Ouvrir une fenêtre n'est pas un effet
      // de bord persistant — le client voit bouger et corrige.
      return true;
    case 'ecriture':
      // Écriture : PAS guest. Un guest dépose une proposition, elle
      // atterrit dans la file du tenant. C'est trop pour un invité.
      return role === 'owner' || role === 'admin' || role === 'member';
  }
}

export class PermissionDeniedError extends Error {
  readonly code: PermissionCode;
  constructor(code: PermissionCode, error: string) {
    super(error);
    this.name = 'PermissionDeniedError';
    this.code = code;
  }
}

/** Variante explicite : prend un `MembershipRole` plutôt qu'un
 *  `ToolContext['role']`. Utile aux fonctions membres (`inviter`,
 *  `changerRole`, etc.) où le rôle vient explicitement d'une
 *  membership. Reporte à `canRole()`. */
export function canRoleStrict(
  category: ToolDefinition['category'],
  role: MembershipRole,
): boolean {
  return canRole(category, role);
}

/** Refuse un appel si le `ctx.role` n'est pas un rôle issu d'une
 *  membership. C'est la **défense en profondeur** : la couche
 *  `identity.ts` doit avoir résolu un rôle membership. Si ce n'est
 *  pas le cas (par exemple, un rôle porté par l'input sans lookup
 *  actif), on refuse explicitement. */
export function assertMembershipRolePresent(
  ctx: Pick<ToolContext, 'role'>,
  source: 'input' | 'membership' | 'unknown' = 'unknown',
): PermissionResult {
  if (source === 'membership') return { ok: true };
  return {
    ok: false,
    code: 'NO_MEMBERSHIP_ROLE',
    error: `ctx.role="${ctx.role}" n'est pas issu d'une membership (source=${source}). Refus en profondeur.`,
  };
}

/** Applique les deux gardes. Rend `{ ok: true }` ou un refus
 *  structuré. Les adaptateurs traduisent en enveloppe `ok:false`. */
export async function assertPermission(
  ctx: ToolContext,
  tool: ToolDefinition,
  args: Record<string, unknown> | undefined,
): Promise<PermissionResult> {
  // Gate 1 — rôle vs catégorie.
  if (!canRole(tool.category, ctx.role)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: `Rôle "${ctx.role}" insuffisant pour la catégorie "${tool.category}" de l'outil "${tool.name}".`,
    };
  }

  // Gate 2 — anti-auto-approbation pour scenario.approve.
  // On lit la proposition sous le tenant du caller : si l'id existe
  // dans un autre tenant, getProposal renvoie null et on n'a pas la
  // moindre info — c'est la cloison qui protège, pas nous.
  if (tool.name === 'scenario.approve') {
    const proposalId =
      args && typeof args === 'object' && 'proposalId' in args
        ? String((args as { proposalId?: unknown }).proposalId ?? '')
        : '';
    if (proposalId) {
      const prop = await getProposal(ctx.tenantId, proposalId);
      if (prop && prop.actorId === ctx.actorId && ctx.role !== 'owner') {
        return {
          ok: false,
          code: 'SELF_APPROVAL',
          error: `Auto-approbation refusée : l'acteur "${ctx.actorId}" ne peut pas approuver sa propre proposition "${proposalId}" avec le rôle "${ctx.role}". Seul "owner" le peut.`,
        };
      }
    }
  }

  return { ok: true };
}

/** Variante jetant. Pratique pour in-app et pour les tests. */
export async function assertPermissionOrThrow(
  ctx: ToolContext,
  tool: ToolDefinition,
  args: Record<string, unknown> | undefined,
): Promise<void> {
  const r = await assertPermission(ctx, tool, args);
  if (!r.ok) {
    throw new PermissionDeniedError(r.code, r.error);
  }
}
