// src/lib/workspace/diff.ts
// Diff entre deux WorkspaceData — trois catégories :
//   - collections ajoutées / supprimées
//   - items ajoutés / modifiés / supprimés
//   - membres ajoutés / révoqués
//
// Algorithme : on indexe par id, on compare les ensembles. Un item est
// « modifié » si ses data (sérialisées canoniquement) diffèrent.
// Un membre est « ajouté » s'il apparaît dans `b` mais pas dans `a`,
// « révoqué » s'il apparaît dans `a` mais plus dans `b` (status n'est
// pas `active` côté `b`).

import type { Diff, ItemLite, WorkspaceData } from './types';
import { canonicalJson } from './snapshot';

function indexById<T extends { id: string }>(arr: ReadonlyArray<T>): Map<string, T> {
  const m = new Map<string, T>();
  for (const x of arr) m.set(x.id, x);
  return m;
}

function indexItems(arr: ReadonlyArray<ItemLite>): Map<string, ItemLite> {
  const m = new Map<string, ItemLite>();
  for (const x of arr) m.set(`${x.collectionId}:${x.id}`, x);
  return m;
}

export function diff(a: WorkspaceData, b: WorkspaceData): Diff {
  // Collections
  const colA = indexById(a.collections);
  const colB = indexById(b.collections);

  const collectionsAdded = b.collections.filter((c) => !colA.has(c.id));
  const collectionsRemoved = a.collections
    .filter((c) => !colB.has(c.id))
    .map((c) => c.id);

  // Items
  const itA = indexItems(a.items);
  const itB = indexItems(b.items);
  const itemsAdded: ItemLite[] = [];
  const itemsModified: Array<{ before: ItemLite; after: ItemLite }> = [];
  const itemsRemoved: string[] = [];

  for (const [key, itemB] of itB.entries()) {
    const itemA = itA.get(key);
    if (!itemA) {
      itemsAdded.push(itemB);
    } else if (canonicalJsonForItem(itemA) !== canonicalJsonForItem(itemB)) {
      itemsModified.push({ before: itemA, after: itemB });
    }
  }
  for (const key of itA.keys()) {
    if (!itB.has(key)) itemsRemoved.push(key);
  }

  // Memberships — actif vs tout
  const memA = new Map(a.memberships.map((m) => [m.userId, m]));
  const memB = new Map(b.memberships.map((m) => [m.userId, m]));
  const membersAdded: typeof a.memberships[number][] = [];
  const membersRevoked: string[] = [];
  for (const [uid, mB] of memB.entries()) {
    if (!memA.has(uid) && mB.status === 'active') membersAdded.push(mB);
  }
  for (const [uid] of memA.entries()) {
    const inB = memB.get(uid);
    if (!inB || inB.status !== 'active') membersRevoked.push(uid);
  }

  return {
    collectionsAdded,
    collectionsRemoved,
    itemsAdded,
    itemsModified,
    itemsRemoved,
    membersAdded,
    membersRevoked,
  };
}

function canonicalJsonForItem(it: ItemLite): string {
  // On sérialise juste la partie data, pas le wrapper, pour ignorer
  // les champs éventuellement ajoutés par les appelants.
  return canonicalJson({
    collections: [],
    items: [it],
    memberships: [],
  });
}

/** Helper : un diff est-il vide ? */
export function diffEstVide(d: Diff): boolean {
  return (
    d.collectionsAdded.length === 0 &&
    d.collectionsRemoved.length === 0 &&
    d.itemsAdded.length === 0 &&
    d.itemsModified.length === 0 &&
    d.itemsRemoved.length === 0 &&
    d.membersAdded.length === 0 &&
    d.membersRevoked.length === 0
  );
}