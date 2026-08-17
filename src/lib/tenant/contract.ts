/**
 * tenant/contract.ts — multi-tenant CMS contract (Phase 3 signatures only).
 *
 * This file declares the public surface of the tenant-aware store. It is NOT an
 * implementation: bodies are `throw` placeholders so the file compiles and
 * downstream code can already be wired against the new shapes, but no
 * behaviour runs until Phase 3 deliberately activates it.
 *
 * The contract preserves the current single-tenant behaviour as long as
 * `useTenant()` has never been called: when no tenant is active, every read
 * and write falls back to the bundled seed the same way the current store
 * does today. Phase 2 today. Phase 3 unifies, multi-tenant aware.
 *
 * Why signatures only — and not an implementation:
 *   - The audit (AUDIT_FINAL.md) classifies the existing store as
 *     NEAR-DONE: the existing CRUD + Supabase dual-write already proves the
 *     pattern. Wiring `tenant_id` end-to-end touches every app, every
 *     collection, every query — that is Phase 3 work, not a one-file patch.
 *   - Putting the contract here gives every app a single importable shape to
 *     reference in their `exclude-scope` brief without forcing a runtime
 *     dependency on Phase 3.
 *   - All bodies throw so any accidental call surfaces immediately rather
 *     than silently behaving like the legacy store.
 *
 * Hard rules:
 *   1. tenant_id is REQUIRED on every CmsItem + every CmsCollectionDef after
 *      Phase 3 flips the gate. Today the field is optional with a default of
 *      '__default__' to keep the existing seed working unchanged.
 *   2. Every read filter MUST include `tenant_id`; every write MUST stamp
 *      `tenant_id` before reaching Supabase.
 *   3. seedFor(tenantId) is the ONLY way to hydrate a fresh tenant — it
 *      seeds every collection with that tenant_id in one call.
 *   4. The legacy `useCmsStore` keeps working until Phase 3 flips a build
 *      flag; the new `useCmsStoreForTenant(tenantId)` is the migration path.
 *   5. No app code may import this file's implementation paths (tenant.store,
 *      tenant.repository) — only the contract. The audit calls this out per
 *      app via "exclusive scope" so two parallel agents do not collide.
 */

import type { CmsCollectionDef, CmsItem } from '../cms/types';

/* ──────────────────────────────────────────────────────────────────────────
 * Tenant identity
 * ────────────────────────────────────────────────────────────────────────── */

/** Sentinel for the single-tenant backwards-compat mode. Phase 3 keeps the
 *  legacy store working under this tenant until the migration flag flips. */
export const TENANT_DEFAULT = '__default__' as const;

/** A real tenant id — opaque to the front, opaque to Supabase RLS.
 *  TenantId = slug local (clé de partition `localStorage`, partitions du
 *  store CMS, `storage-scope.ts`). Ce n'est PAS un identifiant côté DB :
 *  le côté DB utilise `OrgId` (uuid), voir plus bas. */
export type TenantId = string & { readonly __brand: 'TenantId' };

/** Org id (uuid) — identité d'une organisation en base, canon 2026-08-17.
 *  Distinct de `TenantId` : les deux notions se ressemblent (toutes deux
 *  désignent « l'organisation courante ») mais vivent dans des espaces
 *  disjoints. `TenantId` reste légitime côté navigateur pour partitionner
 *  le cache ; `OrgId` est ce qu'on envoie à Supabase (clé étrangère,
 *  claim JWT, filtre RLS). Brand distincté ⇒ le compilateur refuse de
 *  passer l'un pour l'autre. */
export type OrgId = string & { readonly __brand: 'OrgId' };

/** Format uuid v4 (lower, hex). Tolère la casse parce que le cast
 *  Postgres `::uuid` accepte les deux. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Prédicat : la chaîne ressemble à un uuid. N'effectue pas de lookup
 *  base — c'est un test de forme, pas d'existence. */
export function isValidOrgId(s: string): s is OrgId {
  return UUID_RE.test(s);
}

/** Convertit un `string` en `OrgId` typé. Ne fait PAS de validation de
 *  forme — pour ça, voir `isValidOrgId`. À utiliser quand on est sûr
 *  de la source (claim JWT, réponse Supabase typée). */
export function toOrgId(raw: string): OrgId {
  return raw as OrgId;
}

/** Shape every tenant context provider must return. */
export interface TenantContext {
  /** Stable id for the active tenant. Defaults to TENANT_DEFAULT when no
   *  provider has mounted — this is what makes the contract a no-op for
   *  the current single-tenant code paths. */
  tenantId: TenantId;
  /** Display name only; never used as a key. */
  displayName: string;
  /** True while tenant hydration is in flight (Supabase query pending). */
  isLoading: boolean;
  /** Surfaced from the tenant store, never thrown. */
  error: string | null;
  /** Switch the active tenant. Phase 3 implementation: persists to localStorage,
   *  flushes cms state for the previous tenant, runs seedFor() if needed. */
  switchTenant: (next: TenantId) => Promise<void>;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Updated CMS shapes — additive, backwards compatible
 * ────────────────────────────────────────────────────────────────────────── */

/** A CMS row tagged with the tenant that owns it. The existing CmsItem is
 *  `{ id; [key: string]: unknown }` — tenant_id is additive, not breaking. */
export interface CmsItemTenant extends CmsItem {
  /** Required from Phase 3 onward. Optional in Phase 2 with default
   *  TENANT_DEFAULT — kept optional so legacy seed data still compiles. */
  tenant_id?: TenantId;
}

/** A collection definition scoped to a tenant. Collections are shared across
 *  tenants by id, but the *instances* of items live in their tenant scope. */
export interface CmsCollectionDefTenant extends CmsCollectionDef {
  tenant_id?: TenantId;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tenant store contract
 * ────────────────────────────────────────────────────────────────────────── */

/** The Zustand slice that owns the active tenant + the per-tenant caches.
 *  Implementation lives in `tenant.store.ts` (NOT this file). */
export interface TenantState {
  /** The single source of truth for "who am I right now". */
  activeTenantId: TenantId;
  /** Display name only. */
  displayName: string;
  /** True while initial hydration or a switchTenant() is pending. */
  isLoading: boolean;
  /** Last tenant switch error, null if healthy. */
  error: string | null;
  /** Known tenants (id + label) — populated from memberships on mount. */
  knownTenants: ReadonlyArray<{ tenantId: TenantId; displayName: string }>;
}

/** Public actions on the tenant store. */
export interface TenantActions {
  /** Mount the tenant store: read the persisted id from localStorage, then
   *  hydrate knownTenants from Supabase `memberships`. No-op when no auth. */
  bootstrap: () => Promise<void>;
  /** Change the active tenant. Clears the cms cache for the old tenant
   *  (so two tenants never bleed across), calls seedFor() if the new
   *  tenant has never been seen, then resolves once collections are ready. */
  switchTenant: (next: TenantId) => Promise<void>;
  /** Add a freshly-created tenant to the known list (used by the onboarding
   *  flow after the Supabase `sign-up-organization` edge function returns). */
  registerTenant: (input: { tenantId: TenantId; displayName: string }) => void;
}

/** The composite store shape. */
export interface TenantStore extends TenantState, TenantActions {}

/** Singleton accessor — mirrors the pattern of useCmsStore. */
export interface UseTenantStoreApi {
  (): TenantStore;
  getState: () => TenantStore;
  setState: (partial: Partial<TenantStore> | ((s: TenantStore) => Partial<TenantStore>)) => void;
  subscribe: (listener: (s: TenantStore, prev: TenantStore) => void) => () => void;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Tenant-aware CMS store contract
 * ────────────────────────────────────────────────────────────────────────── */

/** Result of a tenant-scoped write — same shape as the legacy store, plus
 *  tenant_id in every successful item. */
export interface TenantAddItemResult {
  ok: boolean;
  item?: CmsItemTenant;
  error?: string;
}

/** Tenant-aware CMS store. Same operations as the legacy `useCmsStore`,
 *  plus `seedFor()` and a tenant-scoped read API. Every method is
 *  documented as "what the call MUST do" — implementation is in
 *  `tenant-aware-cms.store.ts` (also NOT this file). */
export interface CmsStateForTenant {
  /* ── collections + items, partitioned by tenant ── */
  collections: Record<TenantId, Record<string, CmsCollectionDefTenant>>;
  items: Record<TenantId, Record<string, CmsItemTenant[]>>;

  /* ── CRUD — every signature here is a tenant-scoped projection of the
   *    legacy store's surface ── */
  registerCollection: (
    tenantId: TenantId,
    def: CmsCollectionDefTenant,
    seedItems: CmsItemTenant[]
  ) => void;
  updateItem: (
    tenantId: TenantId,
    collectionId: string,
    id: string,
    patch: Partial<CmsItemTenant>
  ) => void;
  addItem: (
    tenantId: TenantId,
    collectionId: string,
    partial: Omit<CmsItemTenant, 'id'>
  ) => TenantAddItemResult;
  removeItem: (
    tenantId: TenantId,
    collectionId: string,
    id: string
  ) => { ok: boolean; error?: string };

  /* ── tenant lifecycle ── */
  /** Hydrate a fresh tenant with the canonical seed for every collection.
   *  Idempotent: calling twice with the same tenantId is a no-op. */
  seedFor: (tenantId: TenantId) => Promise<void>;
  /** Wipe everything cached for a tenant (used on logout + tenant switch). */
  purge: (tenantId: TenantId) => void;
}

/** The tenant-aware CMS store singleton. Implementation deferred. */
export interface UseCmsStoreForTenantApi {
  (): CmsStateForTenant;
  getState: () => CmsStateForTenant;
}

/* ──────────────────────────────────────────────────────────────────────────
 * React surface — hook signatures
 * ────────────────────────────────────────────────────────────────────────── */

/** The active tenant + actions. Throws when called outside a `<TenantProvider>`.
 *  The provider is mounted at the App root in `src/App.tsx`. */
export declare function useTenant(): TenantContext;

/** Like the legacy `useCmsStore` but bound to the active tenant. Reads and
 *  writes through this hook are automatically scoped to `useTenant().tenantId`.
 *  Implementation: a thin wrapper around `useCmsStoreForTenant` that injects
 *  the active id on every call. */
export declare function useTenantCms(): CmsStateForTenant;

/** Selector form of `useTenantCms`. Re-renders only when the selected slice
 *  changes — same ergonomics as Zustand's `useStore(selector)`. */
export declare function useTenantCmsSelector<T>(
  selector: (state: CmsStateForTenant) => T,
  equalityFn?: (a: T, b: T) => boolean
): T;

/* ──────────────────────────────────────────────────────────────────────────
 * Repository contract (Supabase side)
 * ────────────────────────────────────────────────────────────────────────── */

/** Read every collection + every item for a tenant. Returns null when no
 *  auth/session — same shape as the legacy `hydrateCollection`. */
export interface TenantRepository {
  hydrateTenant: (
    tenantId: TenantId
  ) => Promise<{
    collections: CmsCollectionDefTenant[];
    items: Record<string, CmsItemTenant[]>;
  } | null>;
  upsertItem: (
    tenantId: TenantId,
    collectionId: string,
    item: CmsItemTenant
  ) => Promise<void>;
  removeItem: (
    tenantId: TenantId,
    collectionId: string,
    id: string
  ) => Promise<void>;
  upsertCollectionDef: (
    tenantId: TenantId,
    def: CmsCollectionDefTenant
  ) => Promise<void>;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Backwards-compat seam
 * ────────────────────────────────────────────────────────────────────────── */

/** Bridge from the legacy `useCmsStore` (single-tenant) to the new
 *  `useCmsStoreForTenant`. Phase 2 keeps returning the legacy store
 *  unchanged; Phase 3 swaps the implementation when the build flag flips.
 *
 *  Apps that want to opt in early can call `useTenantCms()` directly —
 *  both shapes return the same field names, the only difference being
 *  the leading `tenantId` argument on every write. */
export interface LegacyCmsBridge {
  /** True while the bridge is in Phase 2 (no-op) mode. */
  isLegacy: boolean;
  /** The Phase 3 gate. When true, every app should call `useTenantCms`. */
  multiTenantEnabled: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Placeholder throws — Phase 3 fills these
 *
 *  These bodies exist ONLY so the file compiles. Any accidental call at
 *  runtime will throw loudly. Real implementations land in:
 *    - src/lib/tenant/tenant.store.ts
 *    - src/lib/tenant/tenant-aware-cms.store.ts
 *    - src/lib/tenant/repository.ts
 *  Audit callers should treat a thrown `Tenant contract — not implemented`
 *  as a signal that they have wandered into Phase 3 territory during the
 *  audit window.
 * ────────────────────────────────────────────────────────────────────────── */

export function useCmsStoreForTenant(): never {
  throw new Error('Tenant contract — useCmsStoreForTenant not implemented (Phase 3).');
}

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 3 — multi-utilisateurs par tenant (brief 2026-08-15 MEMBERSHIPS)
 *
 * Ces types sont exportés pour que le contrat Phase 3 (tenant + users) soit
 * importable par `src/lib/auth/memberships.ts`, par le store Zustand des
 * memberships, et par l'UI d'invitation. Ils ne sont **pas** une
 * implémentation : les corps vivent dans le module `memberships.ts`.
 *
 * Règles (cf. brief MEMBERSHIPS) :
 *   - `tenantId` côté client correspond à `org_id` côté DB.
 *   - Quatre rôles : 'owner' > 'admin' > 'member' > 'guest'.
 *   - Trois statuts : 'pending' (invitation pas acceptée), 'active',
 *     'revoked' (audit préservé).
 *   - Le membership est la cloison d'isolation : pas d'accès entre
 *     tenants via le rôle global ; on lit toujours la membership du
 *     tenant actif.
 * ────────────────────────────────────────────────────────────────────────── */

export type MembershipRole = 'owner' | 'admin' | 'member' | 'guest';

export type MembershipStatus = 'pending' | 'active' | 'revoked';

export const MEMBERSHIP_ROLES: readonly MembershipRole[] = ['owner', 'admin', 'member', 'guest'] as const;
export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = ['pending', 'active', 'revoked'] as const;

/** Une ligne de la jonction user ↔ tenant. Source de vérité côté API,
 *  miroir de la table `public.memberships` côté DB.
 *
 *  Les deux identifiants cohabitent volontairement :
 *  - `tenantId` (slug) = clé de partition locale, posée par le backend
 *    in-memory pour cloisonner le cache ;
 *  - `orgId` (uuid) = identité réelle en base, posée par le backend
 *    Supabase à partir du claim JWT. Optionnelle parce que le backend
 *    in-memory n'a pas d'uuid à fournir. */
export interface MembershipRecord {
  /** UUID côté DB. */
  id: string;
  /** Tenant id (slug kebab, conforme `TENANT_KEY_RE`). Clé de partition
   *  LOCALE — n'est PAS utilisée pour les requêtes Supabase. Voir
   *  `orgId` pour l'identité côté DB. */
  tenantId: TenantId;
  /** Org id (uuid) — identité en base (`memberships.org_id`). Toujours
   *  défini pour les rows venues de Supabase, `undefined` pour le
   *  backend in-memory. Optionnel pour ne pas casser les tests
   *  qui seedent des records purement locaux. */
  orgId?: OrgId;
  /** User id (UUID Supabase). */
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  /** User id de l'inviteur, `null` pour le owner fondateur. */
  invitedBy: string | null;
  /** ISO 8601. */
  invitedAt: string;
  /** ISO 8601 si acceptée, `null` tant que `status === 'pending'`. */
  acceptedAt: string | null;
}
