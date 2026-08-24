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
import { peut as rbacPeut, type Affectation, type Perimetre } from './rbac';

export type PermissionCode = 'FORBIDDEN' | 'SELF_APPROVAL' | 'NO_MEMBERSHIP_ROLE' | 'HORS_PERIMETRE';

export type PermissionResult =
  | { ok: true }
  | { ok: false; code: PermissionCode; error: string };

// CONTRAT (campagne 2026-08-23, FIX_RBAC)
// -----------------------------------------
// `rbac.ts` décrit un modèle de sécurité par périmètre (workspace/sandbox)
// mais n'était appelé par aucun adaptateur de production — `assertPermission`
// ne recevait jamais de `Perimetre` ni d'`Affectation` (cf. `_audit/AUDIT_RBAC.md`
// finding #1). `ContextePerimetre` est une extension ADDITIVE de `ToolContext` :
// les deux champs sont optionnels, donc tout `ToolContext` existant reste
// valide tel quel — aucun appelant actuel n'a besoin d'être touché, et le
// comportement d'`assertPermission` ne change PAS quand ces champs sont
// absents. C'est précisément la contrainte dure du brief : le refus/octroi
// pour un appel sans périmètre reste celui d'avant ce chantier.
export interface ContextePerimetre extends ToolContext {
  /** Périmètre (workspace/sandbox) dans lequel l'appel s'exécute. Absent =
   *  gate rbac non évaluée, comportement historique inchangé. */
  perimetre?: Perimetre;
  /** Table d'affectations à consulter pour ce périmètre. Absent = traité
   *  comme une liste vide (aucune affectation ⇒ `peut()` refuse). */
  affectations?: readonly Affectation[];
}

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

/** Applique les gardes. Rend `{ ok: true }` ou un refus
 *  structuré. Les adaptateurs traduisent en enveloppe `ok:false`. */
export async function assertPermission(
  ctx: ContextePerimetre,
  tool: ToolDefinition,
  args: Record<string, unknown> | undefined,
): Promise<PermissionResult> {
  // Gate 1 — rôle vs catégorie. INCHANGÉ : ce gate ignore les périmètres,
  // c'est le socle qui existait avant ce chantier. Un appel qui ne fournit
  // pas de `perimetre` s'arrête entièrement ici (ou passe), exactement
  // comme avant — c'est la contrainte dure du brief.
  if (!canRole(tool.category, ctx.role)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: `Rôle "${ctx.role}" insuffisant pour la catégorie "${tool.category}" de l'outil "${tool.name}".`,
    };
  }

  // Gate rbac (périmètre) — évaluée UNIQUEMENT si l'appelant a fourni un
  // `perimetre`. C'est ce qui manquait pour que le modèle de `rbac.ts` soit
  // réellement appliqué (cf. `_audit/AUDIT_RBAC.md` finding #1) : avant ce
  // changement, `peut()` n'était consultée par aucun chemin d'exécution.
  //
  // Les deux gates se CUMULENT, elles ne se remplacent jamais : le gate 1
  // a déjà eu l'occasion de refuser ci-dessus (et si il a refusé, on n'
  // atteint jamais cette ligne). Ici, on ajoute une seconde condition — si
  // le périmètre refuse, c'est ce refus, plus strict, qui gagne, même si le
  // gate 1 avait laissé passer (ex. un `member` autorisé à écrire en
  // général mais qui tente d'écrire dans un périmètre où son affectation ne
  // le permet pas, ou pas du tout affecté).
  if (ctx.perimetre) {
    const verdict = rbacPeut(
      ctx.actorId,
      ctx.tenantId,
      ctx.perimetre,
      tool.category,
      ctx.affectations ?? [],
    );
    if (!verdict.autorise) {
      return {
        ok: false,
        code: 'HORS_PERIMETRE',
        error: `Refus de périmètre (${verdict.motif}) : ${verdict.detail}`,
      };
    }
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
  ctx: ContextePerimetre,
  tool: ToolDefinition,
  args: Record<string, unknown> | undefined,
): Promise<void> {
  const r = await assertPermission(ctx, tool, args);
  if (!r.ok) {
    throw new PermissionDeniedError(r.code, r.error);
  }
}
