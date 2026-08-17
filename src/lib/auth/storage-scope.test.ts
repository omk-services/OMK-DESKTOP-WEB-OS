// src/lib/auth/storage-scope.test.ts
// Tests du helper de scope localStorage — FIX-2 (fuite inter-comptes).
//
// Trois contrats verrouillés ici :
//   1. Deux utilisateurs qui écrivent dans le même store ne se voient
//      pas l'un l'autre (les clés localStorage sont distinctes).
//   2. Une purge à la déconnexion efface toutes les clés `coach-os*`.
//   3. La purge a lieu même quand l'appel Supabase de signOut rejette.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// On mocke Supabase AVANT tout import du bridge. Sans ça, le bridge
// installerait le vrai client (qui n'est pas configurable en test) et
// on ne pourrait pas simuler un signOut qui rejette.
//
// Le mock expose un `__mock.signOut` qui reste l'original même après
// que le bridge a wrappé `auth.signOut` — c'est sur ce vi.fn qu'on
// fait `mockRejectedValueOnce` dans les tests.
vi.mock('../supabase', () => {
  const handlers: Array<(event: string, session: unknown) => void> = [];
  const signOut = vi.fn(async () => ({ error: null as null | { message: string } }));
  const auth = {
    signOut,
    onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
      handlers.push(cb);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    __fire: (event: string, session: unknown) => {
      for (const h of handlers) h(event, session);
    },
  };
  return {
    supabase: { auth },
    supabaseConfigured: true,
    __mock: { signOut },
  };
});

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  clearScope,
  createScopedStorage,
  getScope,
  isCoachOsKey,
  purgeAllCoachOsKeys,
  scopedKey,
  setScope,
} from './storage-scope';
import {
  installAuthScopeBridge,
  listRegisteredStores,
  registerPersistedStore,
  uninstallAuthScopeBridge,
} from './auth-scope-bridge';
import { supabase } from '../supabase';
import { signOutAndPurge } from './sign-out';

// Référence au `signOut` ORIGINAL (avant wrapping par le bridge). C'est
// ce vi.fn qu'on manipule dans les tests pour simuler un échec.
const mockedAuth = supabase.auth as unknown as {
  signOut: (...args: unknown[]) => Promise<unknown>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
  __fire: (event: string, session: unknown) => void;
};
// Accès au vi.fn original via le mock — survit au wrapping du bridge.
type SupabaseMock = { signOut: ReturnType<typeof vi.fn> };
// Le `vi.mock` factory n'expose pas directement `__mock` ; on va le
// récupérer en relisant le module. Pour rester simple, on importe
// le module mocké et on extrait la propriété.
import * as supabaseMockMod from '../supabase';
const mockMod = supabaseMockMod as unknown as { __mock: SupabaseMock };
const originalSignOutMock = mockMod.__mock.signOut;

beforeEach(() => {
  // Chaque test part d'un localStorage vide et d'un scope anonyme.
  if (typeof localStorage !== 'undefined') localStorage.clear();
  clearScope();
  // On désinstalle puis on réinstalle pour purger la liste des stores
  // enregistrés au tour précédent.
  uninstallAuthScopeBridge();
  installAuthScopeBridge();
});

afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
  uninstallAuthScopeBridge();
  vi.clearAllMocks();
});

/* ──────────────────────────────────────────────────────────────────────────
 * scopedKey et isCoachOsKey — unité pure
 * ────────────────────────────────────────────────────────────────────────── */

describe('scopedKey', () => {
  it('préfixe par coach-os:<user>:<tenant>:', () => {
    setScope('alice', 'acme');
    expect(scopedKey('themes-v1')).toBe('coach-os:alice:acme:themes-v1');
  });

  it('strippe un préfixe coach-os: redondant', () => {
    setScope('alice', 'acme');
    expect(scopedKey('coach-os:themes-v1')).toBe('coach-os:alice:acme:themes-v1');
  });

  it('strippe un préfixe coach-os- redondant', () => {
    setScope('alice', 'acme');
    expect(scopedKey('coach-os-themes-v1')).toBe('coach-os:alice:acme:themes-v1');
  });

  it('utilise le scope anonyme par défaut', () => {
    clearScope();
    expect(scopedKey('themes-v1')).toBe('coach-os:anon:public:themes-v1');
  });

  it('isole deux utilisateurs sur la même clé logique', () => {
    setScope('alice', 'acme');
    const aKey = scopedKey('themes-v1');
    setScope('bob', 'acme');
    const bKey = scopedKey('themes-v1');
    expect(aKey).not.toBe(bKey);
    expect(aKey).toBe('coach-os:alice:acme:themes-v1');
    expect(bKey).toBe('coach-os:bob:acme:themes-v1');
  });
});

describe('isCoachOsKey', () => {
  it('matche le préfixe tiret', () => {
    expect(isCoachOsKey('coach-os-themes-v1')).toBe(true);
  });
  it('matche le préfixe deux-points', () => {
    expect(isCoachOsKey('coach-os:themes-v1')).toBe(true);
  });
  it('matche la clé préfixée par le scope', () => {
    expect(isCoachOsKey('coach-os:alice:acme:themes-v1')).toBe(true);
  });
  it('rejette les clés hors coach-os', () => {
    expect(isCoachOsKey('sb-proj-auth-token')).toBe(false);
    expect(isCoachOsKey('not-coach-os')).toBe(false);
  });
});

describe('createScopedStorage', () => {
  it('écrit sous la clé scopée', () => {
    setScope('alice', 'acme');
    const s = createScopedStorage();
    s.setItem('themes-v1', '{"x":1}');
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBe('{"x":1}');
  });

  it('relit sous la clé scopée', () => {
    setScope('alice', 'acme');
    localStorage.setItem('coach-os:alice:acme:themes-v1', '{"x":1}');
    const s = createScopedStorage();
    expect(s.getItem('themes-v1')).toBe('{"x":1}');
  });

  it('change de scope = change de vue', () => {
    setScope('alice', 'acme');
    const s = createScopedStorage();
    s.setItem('themes-v1', 'alice-data');
    setScope('bob', 'acme');
    // Sous le scope de bob, on ne voit plus la donnée d'alice :
    // le wrapper lit `coach-os:bob:acme:themes-v1`, qui n'existe pas.
    expect(s.getItem('themes-v1')).toBeNull();
    s.setItem('themes-v1', 'bob-data');
    // La donnée d'alice est intacte sur disque.
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBe('alice-data');
    expect(localStorage.getItem('coach-os:bob:acme:themes-v1')).toBe('bob-data');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * CONTRAT 1 — deux users ne se voient pas l'un l'autre
 * ────────────────────────────────────────────────────────────────────────── */

describe('CONTRAT 1 — isolation inter-comptes via le wrapper scopé', () => {
  it('chaque utilisateur a ses propres clés localStorage', () => {
    setScope('alice', 'acme');
    const aliceStorage = createScopedStorage();
    aliceStorage.setItem('themes-v1', JSON.stringify({ globalTheme: 'dark', appThemes: {} }));
    aliceStorage.setItem('scenarios-v1', JSON.stringify({ state: { scenarios: { s1: { id: 's1' } } } }));

    setScope('bob', 'acme');
    const bobStorage = createScopedStorage();
    bobStorage.setItem('themes-v1', JSON.stringify({ globalTheme: 'light', appThemes: {} }));
    bobStorage.setItem('scenarios-v1', JSON.stringify({ state: { scenarios: { s2: { id: 's2' } } } }));

    // Alice relit : ses données, pas celles de Bob.
    setScope('alice', 'acme');
    expect(createScopedStorage().getItem('themes-v1')).toContain('"globalTheme":"dark"');
    expect(createScopedStorage().getItem('scenarios-v1')).toContain('"s1"');

    // Bob relit : ses données, pas celles d'Alice.
    setScope('bob', 'acme');
    expect(createScopedStorage().getItem('themes-v1')).toContain('"globalTheme":"light"');
    expect(createScopedStorage().getItem('scenarios-v1')).toContain('"s2"');

    // Quatre clés distinctes sont bien sur disque.
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).not.toBeNull();
    expect(localStorage.getItem('coach-os:alice:acme:scenarios-v1')).not.toBeNull();
    expect(localStorage.getItem('coach-os:bob:acme:themes-v1')).not.toBeNull();
    expect(localStorage.getItem('coach-os:bob:acme:scenarios-v1')).not.toBeNull();
  });

  it('un store Zustand persisté écrit sous des clés distinctes par scope', async () => {
    // Le test ci-dessus prouve l'isolation au niveau localStorage (le
    // contrat de sécurité). Le rehydrate Zustand ne réinitialise PAS
    // l'état en mémoire quand la nouvelle clé est vide — c'est une
    // limite d'API documentée, pas un défaut du correctif. Le rapport
    // note ce point en suivi UX ; ici, on verrouille la garantie de
    // sécurité (les données ne se croisent pas sur disque).
    type S = { theme: string; setTheme: (t: string) => void };
    const store = create<S>()(
      persist(
        (set) => ({
          theme: 'default',
          setTheme: (theme: string) => set({ theme }),
        }),
        {
          name: 'theme',
          storage: createJSONStorage(() => createScopedStorage()),
        },
      ),
    );
    registerPersistedStore({ name: 'test-store', persist: store.persist });

    // Alice écrit son thème sous `coach-os:alice:acme:theme`.
    setScope('alice', 'acme');
    await store.persist.rehydrate();
    store.getState().setTheme('dark-alice');

    // Bob écrit sous `coach-os:bob:acme:theme`. La clé d'Alice reste
    // intacte sur disque.
    setScope('bob', 'acme');
    await store.persist.rehydrate();
    store.getState().setTheme('light-bob');

    // Les DEUX clés sont présentes et distinctes.
    const aliceRaw = localStorage.getItem('coach-os:alice:acme:theme');
    const bobRaw = localStorage.getItem('coach-os:bob:acme:theme');
    expect(aliceRaw).not.toBeNull();
    expect(bobRaw).not.toBeNull();
    expect(aliceRaw).not.toBe(bobRaw);
    expect(aliceRaw).toContain('dark-alice');
    expect(bobRaw).toContain('light-bob');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * CONTRAT 2 — purge à la déconnexion
 * ────────────────────────────────────────────────────────────────────────── */

describe('CONTRAT 2 — purge à la déconnexion', () => {
  it('supprime toutes les clés coach-os* après SIGNED_OUT', () => {
    // Alice laisse des traces sous son scope.
    setScope('alice', 'acme');
    createScopedStorage().setItem('themes-v1', 'alice-themes');
    createScopedStorage().setItem('scenarios-v1', 'alice-scenarios');
    createScopedStorage().setItem('wallpaper-data-v1', 'alice-wallpaper');

    // Bob aussi.
    setScope('bob', 'acme');
    createScopedStorage().setItem('themes-v1', 'bob-themes');

    // On simule un signOut : Supabase fire SIGNED_OUT avec session=null.
    mockedAuth.__fire('SIGNED_OUT', null);

    // La purge déclenchée par le bridge doit effacer TOUTES les clés
    // coach-os* — Alice, Bob, et tout le reste.
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBeNull();
    expect(localStorage.getItem('coach-os:alice:acme:scenarios-v1')).toBeNull();
    expect(localStorage.getItem('coach-os:alice:acme:wallpaper-data-v1')).toBeNull();
    expect(localStorage.getItem('coach-os:bob:acme:themes-v1')).toBeNull();

    // Le scope est repassé à anon.
    expect(getScope().userId).toBe('anon');
    expect(getScope().tenantId).toBe('public');
  });

  it('purgeAllCoachOsKeys ne touche pas aux clés hors coach-os', () => {
    setScope('alice', 'acme');
    createScopedStorage().setItem('themes-v1', 'alice-themes');
    localStorage.setItem('sb-proj-auth-token', 'supabase-token');
    localStorage.setItem('app-setting', 'unrelated');

    const erased = purgeAllCoachOsKeys();
    expect(erased).toBeGreaterThanOrEqual(1);
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBeNull();
    // Les clés hors coach-os survivent.
    expect(localStorage.getItem('sb-proj-auth-token')).toBe('supabase-token');
    expect(localStorage.getItem('app-setting')).toBe('unrelated');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * CONTRAT 3 — la purge a lieu même si Supabase rejette
 * ────────────────────────────────────────────────────────────────────────── */

describe('CONTRAT 3 — purge même quand signOut échoue', () => {
  it('signOutAndPurge purge localStorage même si supabase.auth.signOut rejette', async () => {
    setScope('alice', 'acme');
    createScopedStorage().setItem('themes-v1', 'alice-themes');
    createScopedStorage().setItem('assistant-v1', 'alice-history');

    // Supabase rejette — par exemple réseau down. On agit sur le
    // vi.fn ORIGINAL (avant wrapping par le bridge).
    originalSignOutMock.mockRejectedValueOnce(new Error('NetworkError: failed to fetch'));

    // Le helper ne rethrow pas. On continue.
    const result = await signOutAndPurge();
    expect(result.supabaseErrored).toBe(true);

    // MAIS la purge a bien eu lieu.
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBeNull();
    expect(localStorage.getItem('coach-os:alice:acme:assistant-v1')).toBeNull();
    expect(getScope().userId).toBe('anon');
  });

  it('le patch global de supabase.auth.signOut purge aussi en cas d echec', async () => {
    setScope('alice', 'acme');
    createScopedStorage().setItem('themes-v1', 'alice-themes');

    // Le bridge a été installé dans beforeEach. Toute la machinerie
    // d'origine est wrappée. On rejette sur l'original.
    originalSignOutMock.mockRejectedValueOnce(new Error('NetworkError'));

    // L'appel direct via le wrapper patché (auth.signOut est désormais
    // la version wrappée) doit quand même purger. C'est le filet de
    // sécurité : tout caller futur qui appelle supabase.auth.signOut()
    // bénéficie de la purge.
    await mockedAuth.signOut();
    expect(localStorage.getItem('coach-os:alice:acme:themes-v1')).toBeNull();
    expect(getScope().userId).toBe('anon');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Bridge — détails
 * ────────────────────────────────────────────────────────────────────────── */

describe('auth-scope-bridge', () => {
  it('un store enregistré est rehydraté à chaque transition SIGNED_IN', async () => {
    const rehydrated: string[] = [];
    const fakeStore = {
      name: 'fake',
      persist: {
        rehydrate: vi.fn(async () => {
          rehydrated.push('hydrate');
        }),
      },
    };
    registerPersistedStore(fakeStore);

    mockedAuth.__fire('SIGNED_IN', { user: { id: 'alice' } });
    // Le rehydrate est async ; on laisse le microtask passer.
    await new Promise((r) => setTimeout(r, 0));
    expect(rehydrated).toContain('hydrate');
  });

  it('listRegisteredStores renvoie la liste des stores', () => {
    const before = listRegisteredStores().length;
    registerPersistedStore({ name: 'x', persist: { rehydrate: vi.fn() } });
    expect(listRegisteredStores().length).toBe(before + 1);
  });
});