/**
 * tenant.store.ts — active tenant Zustand store (Phase 3 implementation).
 *
 * The single source of truth for "who am I right now". One process, many
 * tenants: switching this store switches every consumer in lock-step. Today
 * there is only one tenant (`demo-coach`) — the brief explicitly asks for a
 * default that matches the existing seed — but the wiring is complete so
 * adding a second tenant is a one-line change.
 *
 * The contract lives in `src/lib/tenant/contract.ts`. This file is its
 * runtime implementation. The split is intentional: the contract can be
 * imported by every app for type-only references, while this file is
 * imported exactly once (at the app root) for the live store.
 *
 * Lifecycle:
 *   1. `bootstrap()` runs at startup — picks the persisted tenant from
 *      localStorage, falls back to `'demo-coach'` for the bundled seed.
 *   2. The CMS store mirrors `activeTenantId` so reads/writes resolve to
 *      the right slice. `seedFor(activeTenantId)` runs once at bootstrap
 *      and registers every collection under that tenant.
 *   3. `switchTenant(next)` is reserved for Phase 3 multi-tenant onboarding
 *      flows; today it just resets the active id without hydrating another
 *      tenant (no second tenant exists yet, so this is a no-op aside from
 *      the id change).
 */

import { create } from 'zustand';
import {
  TENANT_DEFAULT,
  type TenantId,
  type TenantState,
  type TenantActions,
} from '../lib/tenant/contract';
import { createScopedStorage } from '../lib/auth/storage-scope';

/** The default tenant for the single-tenant demo seed. Picked deliberately
 *  to match the `demo_coach_*` collections in `cms/seed.ts` and the existing
 *  25-collection seed that the audit classifies at DoD 9/9 for `marketplace`
 *  and `tasks`. Phase 3 replaces it with a real org id from `memberships`. */
export const TENANT_DEMO_COACH: TenantId = 'demo-coach' as TenantId;

// FIX-2 (2026-08-17) — clé logique ; le wrapper ajoute `coach-os:<scope>:`.
// Avant, c'était `coach-os.activeTenantId` (avec un point), incohérent
// avec les autres clés du projet. Le passage à `:` aligne sur le helper
// `scopedKey()` qui strippe `coach-os:` avant d'ajouter le scope.
//
// FIX-8 (2026-08-17) — versioning. La clé `STORAGE_KEY` porte un tenant
// brut, lue aussi par `auth-scope-bridge.ts` au login. On ne peut pas
// la reformater en enveloppe sans toucher au bridge (hors périmètre).
// Solution : la clé `VERSION_KEY` porte la version du schéma ; sans
// elle (legacy) ou avec une version antérieure, on retombe sur le
// tenant par défaut. La clé `STORAGE_KEY` reste inchangée pour le
// bridge.
const STORAGE_KEY = 'coach-os:activeTenantId';
const VERSION_KEY = 'coach-os:activeTenantId.version';
const SCHEMA_VERSION = 1;

function readPersistedTenant(): TenantId {
  if (typeof window === 'undefined') return TENANT_DEMO_COACH;
  try {
    // Si la version est absente ou trop ancienne, on jette la charge
    // et on retombe sur le tenant par défaut. Le brief est clair :
    // le défaut est toujours préférable à l'échec.
    const versionRaw = createScopedStorage().getItem(VERSION_KEY);
    const version = versionRaw ? Number.parseInt(versionRaw, 10) : 0;
    if (!Number.isFinite(version) || version < SCHEMA_VERSION) {
      return TENANT_DEMO_COACH;
    }
    const raw = createScopedStorage().getItem(STORAGE_KEY);
    if (raw && raw.length > 0) return raw as TenantId;
  } catch {
    // localStorage blocked — fall back to default
  }
  return TENANT_DEMO_COACH;
}

function persistTenant(next: TenantId): void {
  if (typeof window === 'undefined') return;
  try {
    createScopedStorage().setItem(STORAGE_KEY, next);
    // On écrit la version en parallèle, pour que la prochaine lecture
    // n'écarte pas la valeur qu'on vient de poser.
    createScopedStorage().setItem(VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    // best-effort — survives private mode and quota errors
  }
}

export const useTenantStore = create<TenantState & TenantActions>((set, get) => ({
  activeTenantId: readPersistedTenant(),
  displayName: 'demo-coach',
  isLoading: false,
  error: null,
  knownTenants: [
    { tenantId: TENANT_DEMO_COACH, displayName: 'demo-coach' },
  ],

  bootstrap: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // Phase 3 hook: read memberships from Supabase and populate knownTenants.
      // Today there is no auth UI, so this is a no-op beyond confirming the
      // persisted tenant is still valid.
      const persisted = readPersistedTenant();
      set({
        activeTenantId: persisted,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  switchTenant: async (next: TenantId): Promise<void> => {
    set({ isLoading: true, error: null });
    persistTenant(next);
    set({
      activeTenantId: next,
      isLoading: false,
      // Display name best-effort: look up the known tenant, default to the
      // raw id (it's the only signal we have for brand-new tenants).
      displayName: get().knownTenants.find((t) => t.tenantId === next)?.displayName ?? next,
    });
  },

  registerTenant: (input: { tenantId: TenantId; displayName: string }): void => {
    const existing = get().knownTenants;
    if (existing.some((t) => t.tenantId === input.tenantId)) return;
    set({
      knownTenants: [...existing, { tenantId: input.tenantId, displayName: input.displayName }],
    });
  },
}));

/** Backwards-compat helper for tests + legacy code that imports the
 *  default sentinel directly. New code should read `activeTenantId` from
 *  the store instead — this exists so anything that referenced
 *  `TENANT_DEFAULT` keeps compiling. */
export function getDefaultTenantId(): TenantId {
  return TENANT_DEFAULT as TenantId;
}
