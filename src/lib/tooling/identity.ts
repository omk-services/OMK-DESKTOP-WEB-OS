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
//     lookup sera branché sur Supabase.
//
//  6. La cloison reste souveraine : la relit membership utilise
//     **toujours** `tenantId` côté appelant. Un role issu d'un
//     autre tenant ne traverse pas.

import type { ToolContext } from './types';
import type { MembershipRole, TenantId } from '../tenant/contract';

export const TENANT_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const ACTOR_KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,127}$/;
export const ROLES = ['owner', 'admin', 'member', 'guest'] as const;
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
      ctx: { tenantId: tenant!, actorId: actor!, role: role! as Role },
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
      role: (role as Role | null) ?? 'guest',
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
 *  parle, pas l'adaptateur. Si plusieurs actives existent (état
 *  incohérent), refus. Si aucune active, refus. */
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
  // Mode démo : on garde la résolution whitelist. La relit
  // membership est incompatible avec ce mode (pas de DB).
  if (base.source === 'demo' || !lookup) {
    return {
      ok: true,
      ctx: base.ctx,
      source: base.source,
      roleSource: 'input',
    };
  }

  const role = await lookup.activeRoleFor(base.ctx.actorId, base.ctx.tenantId as TenantId);
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
