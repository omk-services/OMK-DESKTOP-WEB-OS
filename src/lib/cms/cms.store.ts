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
 *  pour suivre le contrat « supprimer seulement ce qu'on a créé ». */
import { create } from 'zustand';
import type { CmsCollectionDef, CmsItem } from './types';
import {
  hydrateCollection,
  upsertItem as repoUpsertItem,
  upsertCollectionDef,
  removeItem as repoRemoveItem,
} from './repository';

interface AddItemResult {
  ok: boolean;
  item?: CmsItem;
  error?: string;
}

interface CmsState {
  collections: Record<string, CmsCollectionDef>;
  items: Record<string, CmsItem[]>;
  registerCollection: (def: CmsCollectionDef, seedItems: CmsItem[]) => void;
  updateItem: (collectionId: string, id: string, patch: Partial<CmsItem>) => void;
  addItem: (collectionId: string, partial: Omit<CmsItem, 'id'>) => AddItemResult;
  removeItem: (collectionId: string, id: string) => { ok: boolean; error?: string };
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

export const useCmsStore = create<CmsState>((set, get) => ({
  collections: {},
  items: {},

  registerCollection: (def, seedItems) => {
    if (get().collections[def.id]) return; // idempotent — HMR-safe

    set((s) => ({
      collections: { ...s.collections, [def.id]: def },
      items: { ...s.items, [def.id]: seedItems },
    }));

    // Best-effort: if a coach is signed in, prefer their live data over the seed.
    void upsertCollectionDef(def);
    void hydrateCollection(def.id).then((liveItems) => {
      if (liveItems && liveItems.length > 0) {
        set((s) => ({ items: { ...s.items, [def.id]: liveItems } }));
      }
    });
  },

  updateItem: (collectionId, id, patch) => {
    set((s) => ({
      items: {
        ...s.items,
        [collectionId]: (s.items[collectionId] ?? []).map(it => it.id === id ? { ...it, ...patch } : it),
      },
    }));

    const updated = get().items[collectionId]?.find(it => it.id === id);
    if (updated) void repoUpsertItem(collectionId, updated);
  },

  addItem: (collectionId, partial) => {
    const def = get().collections[collectionId];
    if (!def) return { ok: false, error: `Collection inconnue : "${collectionId}".` };
    const id = makeId(collectionId);
    const item: CmsItem = { id, ...partial };
    set((s) => ({
      items: {
        ...s.items,
        [collectionId]: [...(s.items[collectionId] ?? []), item],
      },
    }));
    void repoUpsertItem(collectionId, item);
    return { ok: true, item };
  },

  removeItem: (collectionId, id) => {
    const def = get().collections[collectionId];
    if (!def) return { ok: false, error: `Collection inconnue : "${collectionId}".` };
    const before = get().items[collectionId] ?? [];
    if (!before.some((it) => it.id === id)) {
      return { ok: false, error: `Item introuvable : "${id}" dans "${collectionId}".` };
    }
    set((s) => ({
      items: {
        ...s.items,
        [collectionId]: (s.items[collectionId] ?? []).filter((it) => it.id !== id),
      },
    }));
    void repoRemoveItem(collectionId, id);
    return { ok: true };
  },
}));

export function getCollectionDef(collectionId: string): CmsCollectionDef | undefined {
  return useCmsStore.getState().collections[collectionId];
}

export function getCollectionItems(collectionId: string): CmsItem[] {
  return useCmsStore.getState().items[collectionId] ?? [];
}
