/** CMS store — generic collections registry (Zustand), the same pattern any app
 *  can reuse: register a collection definition + seed items once, then bind
 *  <CollectionRepeater> + <DynamicPageView> to that collection id anywhere.
 *  Phase 1: hydrates from Supabase when a coach is signed in (org_id resolved),
 *  otherwise transparently keeps the bundled seed — no auth UI exists yet, so
 *  today this always falls back to seed, but the live path is wired and ready. */
import { create } from 'zustand';
import type { CmsCollectionDef, CmsItem } from './types';
import { hydrateCollection, upsertItem as repoUpsertItem, upsertCollectionDef } from './repository';

interface CmsState {
  collections: Record<string, CmsCollectionDef>;
  items: Record<string, CmsItem[]>;
  registerCollection: (def: CmsCollectionDef, seedItems: CmsItem[]) => void;
  updateItem: (collectionId: string, id: string, patch: Partial<CmsItem>) => void;
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
}));

export function getCollectionDef(collectionId: string): CmsCollectionDef | undefined {
  return useCmsStore.getState().collections[collectionId];
}

export function getCollectionItems(collectionId: string): CmsItem[] {
  return useCmsStore.getState().items[collectionId] ?? [];
}
