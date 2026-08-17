// src/stores/migrationDefensive.integration.test.ts
// Test d'integration : on remonte un faux `localStorage`, on
// pre-peuple avec un payload de version anterieure, corrompu, ou
// valide, et on observe le resultat apres le `rehydrate()` du
// store Zustand. C'est la verification de bout en bout du contrat
// FIX-8 : un store demarre sur son defaut quand la charge est
// mauvaise, sans jeter dans la console ni casser l'app.
//
// Strategie : on utilise un store minimal qui imite la config
// d'un de mes stores reeles (theme store). Le but est de valider
// la composition `defensiveMigrate + defensiveMerge` que mes
// 9 stores utilisent, pas de re-monter chaque store.
//
// Si un jour un store diverge de cette composition, le test de
// la spec par-store (cf. migrationDefensive.stores.test.ts)
// continuera de le verifier au niveau du validateur.

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defensiveMerge, defensiveMigrate } from './migrationDefensive';

function makeMockStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear() { data.clear(); },
    getItem(key: string): string | null {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    key(i: number): string | null {
      return Array.from(data.keys())[i] ?? null;
    },
    removeItem(key: string) { data.delete(key); },
    setItem(key: string, value: string) { data.set(key, value); },
  };
}

type S = { name: string; count: number; reset: () => void };

function buildStore(storage: Storage) {
  return create<S>()(
    persist(
      (set) => ({
        name: 'default',
        count: 0,
        reset: () => set({ name: 'default', count: 0 }),
      }),
      {
        name: 'integration-test-v1',
        storage: createJSONStorage(() => storage),
        version: 1,
        migrate: defensiveMigrate<{ name: string; count: number }>(1),
        merge: defensiveMerge<S>({
          validators: {
            name: (v) => (typeof v === 'string' ? v : 'default'),
            count: (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0),
          },
        }),
      },
    ),
  );
}

describe('integration — defensiveMigrate + defensiveMerge derriere Zustand persist', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeMockStorage();
  });

  it('cas 1 : version anterieure -> store demarre sur defaut, sans jet', async () => {
    // On pose un blob de version 0, avec des donnees qui ne
    // correspondent plus a la forme courante. Le store doit
    // les jeter et tomber sur ses defaults.
    storage.setItem('integration-test-v1', JSON.stringify({
      version: 0,
      state: { name: 'persisted', count: 42, obsoleteField: true },
    }));
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(s.name).toBe('default');
    expect(s.count).toBe(0);
    expect((s as unknown as { obsoleteField?: unknown }).obsoleteField).toBeUndefined();
  });

  it('cas 2 : charge corrompue `{ toto: 1 }` -> defaults', async () => {
    storage.setItem('integration-test-v1', JSON.stringify({
      version: 1,
      state: { toto: 1 },
    }));
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(s.name).toBe('default');
    expect(s.count).toBe(0);
  });

  it('cas 2 : charge corrompue en string -> defaults', async () => {
    storage.setItem('integration-test-v1', 'not json at all');
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(s.name).toBe('default');
    expect(s.count).toBe(0);
  });

  it('cas 2 : state de la bonne version mais champ du mauvais type -> merge retombe sur default', async () => {
    storage.setItem('integration-test-v1', JSON.stringify({
      version: 1,
      state: { name: 42, count: 'hello' },
    }));
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(s.name).toBe('default');
    expect(s.count).toBe(0);
  });

  it('cas 3 : charge valide -> respectee', async () => {
    storage.setItem('integration-test-v1', JSON.stringify({
      version: 1,
      state: { name: 'persisted', count: 7 },
    }));
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(s.name).toBe('persisted');
    expect(s.count).toBe(7);
  });

  it('les methodes de current survivent au merge', async () => {
    storage.setItem('integration-test-v1', JSON.stringify({
      version: 1,
      state: { name: 'A', count: 1 },
    }));
    const store = buildStore(storage);
    await store.persist.rehydrate();
    const s = store.getState();
    expect(typeof s.reset).toBe('function');
    // On verifie que reset() fait ce qu'on attend (les defaults
    // reprennent la main) — preuve que la methode est bien
    // preservee par le merge.
    s.reset();
    expect(store.getState().name).toBe('default');
    expect(store.getState().count).toBe(0);
  });
});
