/** CMS store — generic collections registry (Zustand), the same pattern any app
 *  can reuse: register a collection definition + seed items once, then bind
 *  <CollectionRepeater> + <DynamicPageView> to that collection id anywhere.
 *  Phase 1: hydrates from Supabase when a coach is signed in (org_id resolved),
 *  otherwise transparently keeps the bundled seed — no auth UI exists yet, so
 *  today this always falls back to seed, but the live path is wired and ready.
 *
 *  Brief-F (couche d'écriture, 2026-08-07) — `updateItem` n'était plus seul.
 *  `addItem` et `removeItem` suivent exactement la même voie : set optimiste,
 *  puis persistance best-effort via le repository. L'identifiant est généré,
 *  pas deviné. Les champs déclarés par la collection (titleField,
 *  subtitleField, badgeField) sont lus depuis `def` — on ne réinvente pas la
 *  forme par app. Le `removeItem` du repository Supabase est ajouté à part,
 *  pour suivre le contrat « supprimer seulement ce qu'on a créé ».
 *
 *  Phase 3 (multi-tenant, 2026-08-09) — the canonical storage is now
 *  tenant-partitioned (`itemsByTenant`, `collectionsByTenant`), matching
 *  `src/lib/tenant/contract.ts` §7.1. A flat view (`items`, `collections`)
 *  is kept alongside it as a mirror of the *active tenant's* slice — this
 *  is what every existing app selector still reads via
 *  `useCmsStore(s => s.items['tasks'])`. The brief allows minimal app
 *  edits only; the mirror keeps the 19 apps working unchanged. On
 *  `setTenant(id)` the flat view is regenerated from the new tenant's
 *  slice; on every mutation, both the partition and the mirror update.
 *
 *  Retro-compat: items without `tenant_id` (e.g. legacy seed data
 *  registered before the migration) are tagged with the active tenant on
 *  the next read or mutation. The contract invariant #5 holds:
 *  `multiTenantEnabled` stays false (the gate is not flipped yet), so
 *  `useCmsStore` keeps behaving exactly like it did before. */
import { create } from 'zustand';
import type { CmsCollectionDef, CmsItem } from './types';
import {
  hydrateCollection,
  upsertItem as repoUpsertItem,
  upsertCollectionDef,
  removeItem as repoRemoveItem,
} from './repository';
import type {
  CmsItemTenant,
  CmsCollectionDefTenant,
  TenantId,
} from '../tenant/contract';
import { TENANT_DEFAULT } from '../tenant/contract';
import { useTenantStore, TENANT_DEMO_COACH } from '../../stores/tenant.store';

interface AddItemResult {
  ok: boolean;
  item?: CmsItem;
  error?: string;
}

/** Cast helper: every legacy item is at minimum a CmsItemTenant once it
 *  passes through the store (we stamp `tenant_id` on the way in). The
 *  type-only widening keeps the public API compatible with both shapes. */
type AnyItem = CmsItem & Partial<CmsItemTenant>;
type AnyCollection = CmsCollectionDef & Partial<CmsCollectionDefTenant>;

interface CmsState {
  /** The active tenant id (mirrored from `useTenantStore`). Reads/writes
   *  flow through this id. Kept on the CMS store too so it is captured
   *  in any single `useCmsStore.setState({ activeTenantId })` call. */
  activeTenantId: TenantId;

  /* ── Canonical partition (per contract §7.1) ────────────────────────── */
  collectionsByTenant: Record<TenantId, Record<string, CmsCollectionDefTenant>>;
  itemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>>;

  /* ── Flat view: legacy app selectors read these. Mirrors the active
   *    tenant's slice. Regenerated on `setTenant`. ────────────────────── */
  collections: Record<string, CmsCollectionDefTenant>;
  items: Record<string, CmsItemTenant[]>;

  /* ── Legacy CRUD (active tenant, flat view) ─────────────────────────── */
  registerCollection: (def: CmsCollectionDef, seedItems: CmsItem[]) => void;
  updateItem: (collectionId: string, id: string, patch: Partial<CmsItem>) => void;
  addItem: (collectionId: string, partial: Omit<CmsItem, 'id'>) => AddItemResult;
  removeItem: (collectionId: string, id: string) => { ok: boolean; error?: string };

  /* ── Tenant-aware CRUD (partition shape) ────────────────────────────── */
  registerCollectionFor: (
    tenantId: TenantId,
    def: CmsCollectionDefTenant,
    seedItems: CmsItemTenant[]
  ) => void;
  updateItemFor: (
    tenantId: TenantId,
    collectionId: string,
    id: string,
    patch: Partial<CmsItemTenant>
  ) => void;
  addItemFor: (
    tenantId: TenantId,
    collectionId: string,
    partial: Omit<CmsItemTenant, 'id'>
  ) => AddItemResult;
  removeItemFor: (
    tenantId: TenantId,
    collectionId: string,
    id: string
  ) => { ok: boolean; error?: string };

  /* ── Tenant lifecycle ───────────────────────────────────────────────── */
  setTenant: (tenantId: TenantId) => void;
  seedFor: (tenantId: TenantId) => Promise<void>;
  purge: (tenantId: TenantId) => void;
}

/** Génère un identifiant stable et unique pour une ligne CMS.
 *
 *  Le préfixe porte la collection pour qu'un humain qui lit un export
 *  (Supabase, journal) reconnaisse d'où vient la ligne sans ouvrir la table.
 *  `Date.now()` est la base du tri, le suffixe aléatoire tranche les conflits
 *  quand deux créations tombent dans la même milliseconde — ce qui arrive
 *  quand un formulaire est validé deux fois ou qu'un agent dépose deux
 *  propositions côte à côte. */
function makeId(collectionId: string): string {
  return `${collectionId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Tag an item with the active tenant if it does not already carry one.
 *  This is the retro-compat path called out in the brief: legacy seed
 *  items registered without `tenant_id` get stamped with the active
 *  tenant on first read or first mutation. */
function stampTenant(item: AnyItem, tenantId: TenantId): CmsItemTenant {
  if (item.tenant_id) return item as CmsItemTenant;
  return { ...item, tenant_id: tenantId };
}

function stampCollection(def: AnyCollection, tenantId: TenantId): CmsCollectionDefTenant {
  if ((def as CmsCollectionDefTenant).tenant_id) return def as CmsCollectionDefTenant;
  return { ...def, tenant_id: tenantId };
}

/** Rebuild the flat view (`items`, `collections`) from the active
 *  tenant's slice in the partition. Called on every mutation and on
 *  `setTenant`. Keeps the mirror in lock-step so app selectors like
 *  `useCmsStore(s => s.items['tasks'])` keep returning the right data. */
function rebuildFlatView(
  collectionsByTenant: Record<TenantId, Record<string, CmsCollectionDefTenant>>,
  itemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>>,
  activeTenantId: TenantId,
): { collections: Record<string, CmsCollectionDefTenant>; items: Record<string, CmsItemTenant[]> } {
  return {
    collections: { ...(collectionsByTenant[activeTenantId] ?? {}) },
    items: { ...(itemsByTenant[activeTenantId] ?? {}) },
  };
}

export const useCmsStore = create<CmsState>((set, get) => ({
  activeTenantId: TENANT_DEMO_COACH,
  collectionsByTenant: {
    [TENANT_DEMO_COACH]: {},
    [TENANT_DEFAULT]: {},
  },
  itemsByTenant: {
    [TENANT_DEMO_COACH]: {},
    [TENANT_DEFAULT]: {},
  },
  // Flat view mirrors active tenant (defaults to demo-coach on first render).
  collections: {},
  items: {},

  /* ── Tenant-aware registration ─────────────────────────────────────── */
  registerCollectionFor: (tenantId, def, seedItems) => {
    const stampedDef = stampCollection(def, tenantId);
    const stampedItems = seedItems.map((it) => stampTenant(it, tenantId));

    set((s) => {
      const tenantCollections = s.collectionsByTenant[tenantId] ?? {};
      const tenantItems = s.itemsByTenant[tenantId] ?? {};
      if (tenantCollections[stampedDef.id]) return s; // idempotent — HMR-safe

      const nextCollectionsByTenant: Record<TenantId, Record<string, CmsCollectionDefTenant>> = {
        ...s.collectionsByTenant,
        [tenantId]: { ...tenantCollections, [stampedDef.id]: stampedDef },
      };
      const nextItemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>> = {
        ...s.itemsByTenant,
        [tenantId]: { ...tenantItems, [stampedDef.id]: stampedItems },
      };
      const isActive = s.activeTenantId === tenantId;
      return {
        collectionsByTenant: nextCollectionsByTenant,
        itemsByTenant: nextItemsByTenant,
        ...(isActive
          ? rebuildFlatView(nextCollectionsByTenant, nextItemsByTenant, tenantId)
          : {}),
      };
    });

    // Best-effort persistence (Supabase side, single-tenant today).
    void upsertCollectionDef(stampedDef);
    void hydrateCollection(stampedDef.id).then((liveItems) => {
      if (liveItems && liveItems.length > 0) {
        const stamped = liveItems.map((it) => stampTenant(it, tenantId));
        set((s) => {
          const tenantItemsMap = (s.itemsByTenant[tenantId] ?? {}) as Record<string, CmsItemTenant[]>;
          const nextItemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>> = {
            ...s.itemsByTenant,
            [tenantId]: { ...tenantItemsMap, [stampedDef.id]: stamped },
          };
          const isActive = s.activeTenantId === tenantId;
          const nextFlat = isActive
            ? { ...(nextItemsByTenant[tenantId] as Record<string, CmsItemTenant[]>) }
            : {};
          return {
            itemsByTenant: nextItemsByTenant,
            ...(isActive ? { items: nextFlat } : {}),
          };
        });
      }
    });
  },

  /* ── Legacy registration — routes to active tenant ─────────────────── */
  registerCollection: (def, seedItems) => {
    const tenantId = get().activeTenantId;
    get().registerCollectionFor(tenantId, def, seedItems);
  },

  /* ── Tenant-aware update ───────────────────────────────────────────── */
  updateItemFor: (tenantId, collectionId, id, patch) => {
    set((s) => {
      const tenantItems = (s.itemsByTenant[tenantId] ?? {}) as Record<string, CmsItemTenant[]>;
      const list = tenantItems[collectionId] ?? [];
      const nextList = list.map((it) => (it.id === id ? { ...it, ...patch, tenant_id: tenantId } : it));
      const nextItemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>> = {
        ...s.itemsByTenant,
        [tenantId]: { ...tenantItems, [collectionId]: nextList },
      };
      const isActive = s.activeTenantId === tenantId;
      const nextFlat = isActive
        ? { ...(nextItemsByTenant[tenantId] as Record<string, CmsItemTenant[]>) }
        : {};
      return {
        itemsByTenant: nextItemsByTenant,
        ...(isActive ? { items: nextFlat } : {}),
      };
    });

    const updated = get().itemsByTenant[tenantId]?.[collectionId]?.find((it) => it.id === id);
    if (updated) void repoUpsertItem(collectionId, updated);
  },

  updateItem: (collectionId, id, patch) => {
    const tenantId = get().activeTenantId;
    get().updateItemFor(tenantId, collectionId, id, patch);
  },

  /* ── Tenant-aware add ──────────────────────────────────────────────── */
  addItemFor: (tenantId, collectionId, partial) => {
    const def = get().collectionsByTenant[tenantId]?.[collectionId];
    if (!def) return { ok: false, error: `Collection inconnue : "${collectionId}".` };
    const id = makeId(collectionId);
    const item: CmsItemTenant = { id, tenant_id: tenantId, ...partial };
    set((s) => {
      const tenantItems = (s.itemsByTenant[tenantId] ?? {}) as Record<string, CmsItemTenant[]>;
      const list = tenantItems[collectionId] ?? [];
      const nextItemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>> = {
        ...s.itemsByTenant,
        [tenantId]: { ...tenantItems, [collectionId]: [...list, item] },
      };
      const isActive = s.activeTenantId === tenantId;
      const nextFlat = isActive
        ? { ...(nextItemsByTenant[tenantId] as Record<string, CmsItemTenant[]>) }
        : {};
      return {
        itemsByTenant: nextItemsByTenant,
        ...(isActive ? { items: nextFlat } : {}),
      };
    });
    void repoUpsertItem(collectionId, item);
    return { ok: true, item };
  },

  addItem: (collectionId, partial) => {
    const tenantId = get().activeTenantId;
    return get().addItemFor(tenantId, collectionId, partial);
  },

  /* ── Tenant-aware remove ───────────────────────────────────────────── */
  removeItemFor: (tenantId, collectionId, id) => {
    const def = get().collectionsByTenant[tenantId]?.[collectionId];
    if (!def) return { ok: false, error: `Collection inconnue : "${collectionId}".` };
    const before = get().itemsByTenant[tenantId]?.[collectionId] ?? [];
    if (!before.some((it) => it.id === id)) {
      return { ok: false, error: `Item introuvable : "${id}" dans "${collectionId}".` };
    }
    set((s) => {
      const tenantItems = (s.itemsByTenant[tenantId] ?? {}) as Record<string, CmsItemTenant[]>;
      const list = tenantItems[collectionId] ?? [];
      const nextItemsByTenant: Record<TenantId, Record<string, CmsItemTenant[]>> = {
        ...s.itemsByTenant,
        [tenantId]: {
          ...tenantItems,
          [collectionId]: list.filter((it) => it.id !== id),
        },
      };
      const isActive = s.activeTenantId === tenantId;
      const nextFlat = isActive
        ? { ...(nextItemsByTenant[tenantId] as Record<string, CmsItemTenant[]>) }
        : {};
      return {
        itemsByTenant: nextItemsByTenant,
        ...(isActive ? { items: nextFlat } : {}),
      };
    });
    void repoRemoveItem(collectionId, id);
    return { ok: true };
  },

  removeItem: (collectionId, id) => {
    const tenantId = get().activeTenantId;
    return get().removeItemFor(tenantId, collectionId, id);
  },

  /* ── Tenant lifecycle ──────────────────────────────────────────────── */
  setTenant: (tenantId) => {
    // Une partition inconnue doit être HYDRATÉE, pas seulement créée vide.
    //
    // Avant ce correctif, basculer sur un second espace de travail posait
    // `{}` et s'arrêtait là : les 19 apps affichaient des listes vides, et
    // le moindre formulaire répondait « Collection inconnue : "alerts" »
    // puisque aucune définition de collection n'existait dans la partition.
    // Le contrat (`src/lib/tenant/contract.ts` §66 et §113) prévoyait
    // pourtant l'appel à `seedFor()` — il était documenté, jamais écrit.
    const needsSeed = !get().collectionsByTenant[tenantId];

    set((s) => {
      const nextCollectionsByTenant = s.collectionsByTenant[tenantId]
        ? s.collectionsByTenant
        : { ...s.collectionsByTenant, [tenantId]: {} };
      const nextItemsByTenant = s.itemsByTenant[tenantId]
        ? s.itemsByTenant
        : { ...s.itemsByTenant, [tenantId]: {} };
      const flat = rebuildFlatView(nextCollectionsByTenant, nextItemsByTenant, tenantId);
      return {
        activeTenantId: tenantId,
        collectionsByTenant: nextCollectionsByTenant,
        itemsByTenant: nextItemsByTenant,
        collections: flat.collections,
        items: flat.items,
      };
    });

    // `seedFor` est asynchrone (import dynamique pour casser le cycle
    // seed ↔ store) : on le déclenche après la bascule, et il republiera la
    // vue plate quand il aura fini. L'échec est signalé mais ne casse pas la
    // bascule — l'utilisateur se retrouve sur un espace vide plutôt que sur
    // une application figée.
    if (needsSeed) {
      void get()
        .seedFor(tenantId)
        .catch((err: unknown) => {
          console.error(`[cms] hydratation de l'espace "${tenantId}" échouée`, err);
        });
    }
  },

  seedFor: async (tenantId) => {
    // Lazy import — `seed.ts` imports `cms.store.ts`, so we cannot statically
    // import it here without a cycle. The function only runs at bootstrap or
    // on tenant switch, so the dynamic import cost is one-shot.
    const { seedCms } = await import('./seed');
    // On amorce DIRECTEMENT l'espace demande.
    //
    // Avant : `seedCms()` sans argument, puis recopie de
    // `collectionsByTenant[activeTenantId]` vers `tenantId`. Deux fautes se
    // composaient. D'abord `seedCms()` rendait la main sans rien faire, son
    // drapeau module etant deja pose au demarrage. Ensuite `setTenant` avait
    // DEJA bascule `activeTenantId` sur le nouvel espace et lui avait pose une
    // partition vide : la recopie lisait donc cette partition vide et copiait
    // du vide dans du vide. Le nouvel espace n'avait aucune collection, et le
    // premier formulaire repondait « Collection inconnue : "invoices" ».
    seedCms(tenantId);

    // `registerCollectionFor` a deja ecrit dans la partition de `tenantId` et
    // republie la vue plate si cet espace est l'actif. Il ne reste qu'a
    // republier au cas ou la bascule s'est faite pendant l'import dynamique.
    set((s) =>
      s.activeTenantId === tenantId
        ? rebuildFlatView(s.collectionsByTenant, s.itemsByTenant, tenantId)
        : s
    );
  },

  purge: (tenantId) => {
    set((s) => {
      const { [tenantId]: _c, ...restCollections } = s.collectionsByTenant;
      const { [tenantId]: _i, ...restItems } = s.itemsByTenant;
      const isActive = s.activeTenantId === tenantId;
      return {
        collectionsByTenant: restCollections as Record<TenantId, Record<string, CmsCollectionDefTenant>>,
        itemsByTenant: restItems as Record<TenantId, Record<string, CmsItemTenant[]>>,
        ...(isActive ? { collections: {}, items: {} } : {}),
      };
    });
  },
}));

/* ── Cross-store wiring — keep `useTenantStore.activeTenantId` in lock-step
 *    with `useCmsStore.activeTenantId`. `useTenantStore` is the single source
 *    of truth; `useCmsStore` mirrors it via subscription so a single
 *    `setTenant()` call propagates everywhere without callers needing to
 *    know about both stores. */
useTenantStore.subscribe((state, prev) => {
  if (state.activeTenantId !== prev.activeTenantId) {
    useCmsStore.getState().setTenant(state.activeTenantId);
  }
});

/** Backwards-compat helper. Reads the active tenant's def. */
export function getCollectionDef(collectionId: string): CmsCollectionDef | undefined {
  return useCmsStore.getState().collections[collectionId];
}

/** Backwards-compat helper. Reads the active tenant's items. */
export function getCollectionItems(collectionId: string): CmsItem[] {
  return useCmsStore.getState().items[collectionId] ?? [];
}
