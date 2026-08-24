// src/lib/tooling/identity.ts
// Résolution d'identité UNIFIÉE pour les sept surfaces d'outils.
//
// Avant (état mesuré dans RAPPORT_WARGAME_ACCES §1 et §2) : chaque
// adaptateur lisait l'identité à sa façon — `args.__tenantId` en MCP,
// `header x-coach-os-tenant` en REST, `--tenant` en CLI. Le serveur
// n'avait aucune source d'autorité sur l'identité. Sept surfaces,
// sept politiques.
//
// Ici : une seule fonction `resolveIdentity()`. Elle est appelée par
// les adaptateurs qui construisent un `ToolContext` (mcp, rest, cli,
// in-app). Les autres (skill, mcp-schema, mcp-apps) n'en ont pas
// besoin — leur surface ne touche pas à l'identité.
//
// CONTRAT (étape 2, campagne 2026-08-14)
//
//  1. Si `tenantId` OU `actorId` est absent ou vide, `resolveIdentity`
//     REFUSE par défaut — pas de repli silencieux.
//
//  2. Le mode démo est explicite : il faut `COACH_OS_DEMO_MODE=1` dans
//     l'environnement pour autoriser des défauts. Sans ce drapeau, un
//     appel sans identité lève. C'est exactement ce que le brief
//     demande (« jamais un `??` en fin de ligne »).
//
//  3. `role` est obligatoire pour la couche permissions (étape 3).
//     Valeurs autorisées : 'owner' | 'admin' | 'member' | 'guest'.
//     Une valeur hors whitelist est refusée.
//
// CONTRAT (étape 4, campagne 2026-08-15 — MEMBERSHIPS)
//
//  4. La résolution whitelist reste **synchrone** et **pure** : pas
//     de lecture Supabase ici. Le rôle porté par l'input est validé
//     contre la whitelist, point.
//
//  5. Une **deuxième** fonction, `resolveIdentityWithMembership`,
//     est chargée de **relire** le rôle côté `memberships`. Elle
//     accepte un `MembershipLookup` injectable — par défaut aucun
//     (pour rester testable sans Supabase). Côté serveur V2 ce
//     lookup est branché sur Supabase via `setMembershipLookup()`
//     au démarrage.
//
//  6. La cloison reste souveraine : la relit membership utilise
//     **toujours** `tenantId` côté appelant. Un role issu d'un
//     autre tenant ne traverse pas.
//
// CONTRAT (campagne 2026-08-17 — FIX_1_identite, fermeture W03)
//
//  7. **Échec fermé en production.** Sans `setMembershipLookup()`,
//     `resolveIdentityWithMembership` REFUSE en production (pas de
//     repli silencieux sur l'input). Sans cette règle, l'identité
//     restait forgeable : un appelant pouvait déclarer `--role owner`
//     (CLI), `__role: "owner"` (MCP), ou `x-coach-os-role: owner` (REST)
//     sans que personne ne le contredise. Mesuré dans RAPPORT_C §4.1.
//
//  8. **Le rôle effectif vient de la membership, jamais de l'input.**
//     Si l'appelant déclare `owner` et que la table `memberships`
//     dit `member`, c'est `member` qui s'applique. La couche
//     `permissions.ts` opère sur ce rôle, pas sur la déclaration.
//
//  9. **Mode démo explicite, jamais déclenchable par le réseau.**
//     `COACH_OS_DEMO_MODE=1` reste le seul moyen d'activer le mode
//     démo (court-circuit du lookup). Lu dans `process.env` par
//     `isDemoMode()`, jamais dans un input réseau.

import type { ToolContext } from './types';
import type { MembershipRole, TenantId } from '../tenant/contract';

export const TENANT_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const ACTOR_KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,127}$/;
// CONTRAT (campagne 2026-08-23, FIX_RBAC) — `client` rejoint la whitelist.
//
// `rbac.ts` définit `client` depuis le départ (RoleEtendu) mais ce rôle était
// INATTEIGNABLE par la vraie chaîne d'identité : `isValidRole()` le
// rejetait avant même d'arriver à la couche permissions. Un modèle de
// sécurité qui protège un rôle qu'aucun appelant ne peut jamais porter
// n'est pas un modèle appliqué, c'est une promesse — voir
// `_audit/AUDIT_RBAC.md` finding #2.
//
// Portée réelle de ce changement : `ROLES` (ci-dessous) et `Role` gouvernent
// la validation de l'INPUT (ce que `resolveIdentity()` accepte). Le champ
// `ToolContext['role']` (src/lib/tooling/types.ts) reste, lui, figé sur les
// quatre valeurs historiques — ce fichier est hors du périmètre de ce
// chantier. Conséquence assumée et documentée dans le rapport
// `_audit/FIX_RBAC.md` : construire un `ToolContext` avec `role: 'client'`
// exige un cast local vers `ToolContext['role']` (voir plus bas), parce que
// le type public n'a pas encore été élargi pour en tenir compte. Le
// runtime, lui, porte bien la vraie valeur `'client'` — seul le type
// déclaré du champ ment par omission tant que `types.ts` n'est pas mis à
// jour dans un chantier séparé.
export const ROLES = ['owner', 'admin', 'member', 'client', 'guest'] as const;
export type Role = (typeof ROLES)[number];

export type ResolvedIdentity =
  | { ok: true; ctx: ToolContext; source: 'full' | 'demo' }
  | { ok: false; error: string; missing: ReadonlyArray<'tenantId' | 'actorId' | 'role'> };

/** Entrée brute d'un adaptateur. Chaque champ est `unknown` parce que
 *  chaque surface le porte dans un type différent : string (header),
 *  string (CLI flag), string ou number (args JSON-RPC). */
export interface IdentityInputs {
  tenantId?: unknown;
  actorId?: unknown;
  role?: unknown;
}

function isDemoMode(): boolean {
  return process.env.COACH_OS_DEMO_MODE === '1';
}

function normalize(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isValidTenant(s: string): boolean {
  return TENANT_KEY_RE.test(s);
}

function isValidActor(s: string): boolean {
  return ACTOR_KEY_RE.test(s);
}

function isValidRole(s: string): s is Role {
  return (ROLES as readonly string[]).includes(s);
}

/** Résout l'identité d'un appelant à partir des inputs portés par la
 *  surface. Renvoie un refus explicite si l'identité est insuffisante,
 *  sauf en mode démo (COACH_OS_DEMO_MODE=1). */
export function resolveIdentity(inputs: IdentityInputs): ResolvedIdentity {
  const demo = isDemoMode();
  const tenant = normalize(inputs.tenantId);
  const actor = normalize(inputs.actorId);
  const role = normalize(inputs.role);

  const missing: Array<'tenantId' | 'actorId' | 'role'> = [];
  if (!tenant) missing.push('tenantId');
  else if (!isValidTenant(tenant)) {
    return {
      ok: false,
      error: `tenantId invalide : "${tenant}". Attendu kebab/snake, 1-64 caractères, [a-z0-9_-].`,
      missing: ['tenantId'],
    };
  }
  if (!actor) missing.push('actorId');
  else if (!isValidActor(actor)) {
    return {
      ok: false,
      error: `actorId invalide : "${actor}".`,
      missing: ['actorId'],
    };
  }
  if (!role) missing.push('role');
  else if (!isValidRole(role)) {
    return {
      ok: false,
      error: `role invalide : "${role}". Valeurs : ${ROLES.join(', ')}.`,
      missing: ['role'],
    };
  }

  if (missing.length === 0) {
    return {
      ok: true,
      // `role! as ToolContext['role']` (pas `as Role`) : `Role` porte
      // désormais `'client'`, un membre que `ToolContext['role']` ne
      // déclare pas encore (types.ts est hors périmètre ici — voir le
      // commentaire au-dessus de `ROLES`). Le cast vise directement le
      // type de champ attendu pour que l'assignation compile sans `any`
      // ni `@ts-ignore` ; la valeur runtime reste fidèlement 'client'
      // quand c'est ce que l'appelant a fourni et validé.
      ctx: { tenantId: tenant!, actorId: actor!, role: role! as ToolContext['role'] },
      source: 'full',
    };
  }

  // Mode démo : on complète ce qui manque avec des défauts EXPLICITES,
  // marqués comme tels dans la source. Ce n'est pas un repli silencieux
  // parce que (a) c'est gated par env var, (b) le résolveur rend
  // `source: 'demo'` au lieu de `'full'`, ce que les tests vérifient.
  if (demo) {
    const ctx: ToolContext = {
      tenantId: tenant ?? 'demo',
      actorId: actor ?? 'agent:anon',
      // Même remarque que ci-dessus : cast vers le type de champ réel.
      role: (role as ToolContext['role'] | null) ?? 'guest',
    };
    return { ok: true, ctx, source: 'demo' };
  }

  return {
    ok: false,
    error: `Identité insuffisante : ${missing.join(', ')}. Mode démo ? Positionner COACH_OS_DEMO_MODE=1.`,
    missing,
  };
}

/** Helper de convenance pour les adaptateurs : jette une exception
 *  structurée si la résolution refuse. Le `code` distingue les cas. */
export class IdentityResolutionError extends Error {
  readonly code = 'IDENTITY_INSUFFICIENT';
  readonly missing: ReadonlyArray<'tenantId' | 'actorId' | 'role'>;
  constructor(error: string, missing: ReadonlyArray<'tenantId' | 'actorId' | 'role'>) {
    super(error);
    this.name = 'IdentityResolutionError';
    this.missing = missing;
  }
}

export function resolveIdentityOrThrow(inputs: IdentityInputs): { ctx: ToolContext; source: 'full' | 'demo' } {
  const r = resolveIdentity(inputs);
  if (!r.ok) {
    throw new IdentityResolutionError(r.error, r.missing);
  }
  return { ctx: r.ctx, source: r.source };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Étape 4 — MEMBERSHIPS : lecture optionnelle du rôle côté `memberships`
 * ────────────────────────────────────────────────────────────────────────── */

/** Forme publique du lookup injecté. Permet à la V2 de brancher un
 *  adapter Supabase sans toucher ce fichier. */
export interface MembershipLookup {
  /** Renvoie la `MembershipRole` ACTIVE du couple (userId, tenantId).
   *  Renvoie `null` si aucune membership active. */
  activeRoleFor(userId: string, tenantId: TenantId): Promise<MembershipRole | null>;
}

/** Par défaut, aucun lookup n'est branché. Les tests pourront
 *  injecter `setMembershipLookup()`. */
let _lookup: MembershipLookup | null = null;

export function setMembershipLookup(lookup: MembershipLookup | null): void {
  _lookup = lookup;
}

export function getMembershipLookup(): MembershipLookup | null {
  return _lookup;
}

/** Variante enrichie : après la résolution whitelist, on relit
 *  la **membership active** côté `memberships`. Le rôle résultant
 *  prime sur le rôle porté par l'input : c'est la **cloison** qui
 *  parle, pas l'adaptateur.
 *
 *  Politique de fermeture (campagne 2026-08-17, FIX_1_identite) :
 *   - En mode démo (`COACH_OS_DEMO_MODE=1`), on garde la résolution
 *     whitelist. Le mode démo est permissif mais **explicite** : il
 *     n'est déclenchable QUE par variable d'environnement, jamais
 *     par un input réseau (header, JSON-RPC args, flag CLI).
 *   - En production, sans `lookup` configuré (i.e. `setMembershipLookup`
 *     jamais appelé au démarrage du serveur), REFUS. Sinon l'appelant
 *     pourrait à nouveau proclamer n'importe quel rôle.
 *   - Si le lookup jette (réseau, base absente, RLS qui bloque), REFUS
 *     explicite — pas de repli silencieux en `guest`.
 *   - Si la table `memberships` ne rend rien pour le couple
 *     (actorId, tenantId), REFUS.
 *
 *  Le rôle retourné prime sur l'input : un appelant qui déclare
 *  `owner` alors que la table dit `member` se voit appliquer `member`. */
export type ResolvedIdentityWithMembership =
  | { ok: true; ctx: ToolContext; source: 'full' | 'demo' | 'membership'; roleSource: 'input' | 'membership' }
  | { ok: false; error: string; missing: ReadonlyArray<'tenantId' | 'actorId' | 'role' | 'membership'> };

export async function resolveIdentityWithMembership(
  inputs: IdentityInputs,
  lookup: MembershipLookup | null = _lookup,
): Promise<ResolvedIdentityWithMembership> {
  const base = resolveIdentity(inputs);
  if (!base.ok) {
    return {
      ok: false,
      error: base.error,
      missing: base.missing,
    };
  }
  // Mode démo : on garde la résolution whitelist. Court-circuité ICI,
  // avant toute vérification de présence du lookup, pour que les tests
  // sans DB puissent tourner sans setup. Le seul moyen de basculer
  // en démo est `process.env.COACH_OS_DEMO_MODE === '1'` — lu dans
  // `isDemoMode()` — donc impossible depuis un input réseau. C'est
  // l'env qui parle, pas le fait que l'input soit complet ou non :
  // si l'appelant a tout fourni mais que l'env est '1', on est en démo.
  if (isDemoMode()) {
    return {
      ok: true,
      ctx: base.ctx,
      source: 'demo',
      roleSource: 'input',
    };
  }

  // Production : pas de lookup configuré → REFUS. La résolution
  // whitelist seule ne protège rien (l'appelant déclare son propre
  // rôle). C'est précisément le défaut mesuré en W03 et documenté
  // dans RAPPORT_C §4.1.
  if (!lookup) {
    return {
      ok: false,
      error: `Lookup membership non configuré : appel refusé en production. setMembershipLookup() doit être invoqué au démarrage du serveur (voir src/lib/auth/memberships.ts).`,
      missing: ['membership'],
    };
  }

  let role: MembershipRole | null;
  try {
    role = await lookup.activeRoleFor(base.ctx.actorId, base.ctx.tenantId as TenantId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Lookup membership a échoué (${msg}) : appel refusé en production.`,
      missing: ['membership'],
    };
  }

  if (role === null) {
    return {
      ok: false,
      error: `Aucun membership actif pour l'acteur "${base.ctx.actorId}" sur le tenant "${base.ctx.tenantId}".`,
      missing: ['membership'],
    };
  }

  return {
    ok: true,
    ctx: { ...base.ctx, role },
    source: 'membership',
    roleSource: 'membership',
  };
}
