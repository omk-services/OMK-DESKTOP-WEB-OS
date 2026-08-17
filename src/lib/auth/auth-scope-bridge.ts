/**
 * auth-scope-bridge.ts — colle le scope localStorage à l'état d'auth Supabase.
 *
 * Rôle : observer `supabase.auth.onAuthStateChange` et, à chaque
 * transition SIGNED_IN / SIGNED_OUT, mettre à jour le scope géré par
 * `storage-scope.ts`. Le scope change ⇒ les écritures suivantes vont
 * dans des clés différentes ; les lectures passent par le wrapper scopé
 * ⇒ chaque utilisateur voit ses données, pas celles du voisin.
 *
 * Pourquoi un bridge et pas une logique inline dans chaque store :
 *  - Un store isolé ne sait pas qu'un autre utilisateur vient de se
 *    connecter. Seul un observateur global peut dire « le scope a
 *    changé, rechargez-vous tous ».
 *  - Le `persist.rehydrate()` est coûteux (lit localStorage, parse,
 *    fusionne) ; on ne l'invoque qu'aux vrais moments de transition
 *    (login/logout), pas à chaque set.
 *
 * Pourquoi ce module n'importe PAS les stores :
 *  - Ça créerait un cycle (storage-scope → bridge → stores →
 *    storage-scope) et le résultat à l'import est imprévisible.
 *  - À la place, les stores s'enregistrent eux-mêmes via
 *    `registerPersistedStore`. La liste est donc assemblée par les
 *    stores, dans leur ordre de chargement naturel — le bridge n'a
 *    pas à les connaître à la compilation.
 *
 * Patch de `supabase.auth.signOut` :
 *  - Le brief exige que la purge ait lieu MÊME SI l'appel Supabase
 *    échoue (réseau down, session déjà expirée). Le `SIGNED_OUT` ne
 *    fire que sur succès, donc on ne peut pas s'y fier pour la purge.
 *  - On enveloppe `signOut` : on capture l'original, on appelle
 *    l'original dans un try/catch, puis on purge dans un `finally`.
 *    Le try/catch ne fait que logger — il ne propage pas l'erreur,
 *    car le caller (TopBar) veut rediriger vers /site/index.html même
 *    en cas d'échec.
 */
import { supabase, supabaseConfigured } from '../supabase';
import {
  clearScope,
  createScopedStorage,
  getScope,
  purgeAllCoachOsKeys,
  setScope,
} from './storage-scope';

/** Forme minimale d'un store persisté. Zustand expose
 *  `useStore.persist.rehydrate()` ; on s'en sert directement. */
export interface PersistedStore {
  /** Nom logique, pour le diagnostic (logs, telemetry). */
  name: string;
  /** API persist du store Zustand — `rehydrate()` lit et applique le
   *  blob persisté courant. Le type exact est opaque ici pour ne pas
   *  coupler le bridge au type interne de Zustand. */
  persist: {
    rehydrate: () => Promise<void> | void;
  };
}

const registered = new Set<PersistedStore>();
let installed = false;
let unsubscribeAuth: (() => void) | null = null;
let originalSignOut: ((...args: unknown[]) => Promise<unknown>) | null = null;

/** Enregistre un store pour qu'il rehydrate aux transitions d'auth.
 *  Idempotent : un même store enregistré deux fois ne l'est qu'une
 *  fois. */
export function registerPersistedStore(store: PersistedStore): void {
  registered.add(store);
}

/** Liste des stores enregistrés (snapshot). Utile aux tests. */
export function listRegisteredStores(): PersistedStore[] {
  return Array.from(registered);
}

/** Détermine le tenant actif. Ordre de priorité :
 *  1. Le store Zustand `useTenantStore.activeTenantId` est la source de
 *     vérité en mémoire, mais on l'évite ici pour ne pas créer un cycle
 *     d'import (ce module est importé transitivement par `storage-scope`,
 *     que `tenant.store` importe aussi).
 *  2. Fallback : on lit la clé scopée `coach-os:activeTenantId` dans le
 *     scope COURANT (le scope est posé par un sign-in antérieur ou par
 *     l'état anonyme). Le tenant lu ici est le dernier tenant actif
 *     que l'utilisateur a choisi — c'est la bonne valeur à re-appliquer
 *     à la reconnexion.
 *  3. Fallback final : `'default'` pour ne jamais exposer `undefined`
 *     dans une clé (un `undefined` se transformerait en chaîne
 *     `"undefined"` et mixerait les utilisateurs qui partagent la
 *     même absence d'info).
 */
function resolveActiveTenantId(): string {
  try {
    const raw = createScopedStorage().getItem('coach-os:activeTenantId');
    if (raw && raw.length > 0) return raw;
  } catch {
    // localStorage indisponible — fallback default.
  }
  return 'default';
}

/** Réhydrate tous les stores enregistrés. Chaque appel à
 *  `persist.rehydrate()` est asynchrone ; on les lance en parallèle
 *  sans bloquer le caller. Une erreur individuelle n'arrête pas les
 *  autres. */
function rehydrateAll(): void {
  for (const s of registered) {
    try {
      void Promise.resolve(s.persist.rehydrate()).catch(() => {
        // best-effort — un rehydrate raté ne doit pas faire tomber
        // l'application, le store retombant sur son état initial.
      });
    } catch {
      // idem — englobe les stores dont `rehydrate` n'est pas une
      // fonction (defense en profondeur).
    }
  }
}

/** Purge + clear scope + rehydrate. Appelé sur SIGNED_OUT et par le
 *  patch `signOut` (dans les deux chemins, succès et échec). */
function performSignOutCleanup(): void {
  clearScope();
  purgeAllCoachOsKeys();
  rehydrateAll();
}

/** Pose le scope et rehydrate. Appelé sur INITIAL_SESSION et
 *  SIGNED_IN. Si on était déjà sur ce scope, on évite le rehydrate
 *  inutile. */
function performSignIn(userId: string): void {
  const tenantId = resolveActiveTenantId();
  const before = getScope();
  if (before.userId === userId && before.tenantId === tenantId) {
    return;
  }
  setScope(userId, tenantId);
  rehydrateAll();
}

/** Patche `supabase.auth.signOut` pour garantir la purge, succès ou
 *  échec. Capture l'original la première fois ; les installations
 *  suivantes sont no-op. */
function patchSignOut(): void {
  if (originalSignOut !== null) return;
  if (!supabaseConfigured) return;
  const auth = supabase.auth as unknown as {
    signOut: (...args: unknown[]) => Promise<unknown>;
  };
  if (typeof auth.signOut !== 'function') return;
  originalSignOut = auth.signOut.bind(supabase.auth);
  const wrapped = async (...args: unknown[]): Promise<unknown> => {
    try {
      const result = await originalSignOut!(...args);
      // Purge aussi sur succès — `SIGNED_OUT` va fire plus tard et
      // rappeler `performSignOutCleanup`. C'est idempotent, mais on
      // évite de dépendre du timing de l'event.
      performSignOutCleanup();
      return result;
    } catch (err) {
      // Échec réseau ou autre. Le brief est clair : on purge QUAND
      // MÊME, sinon la donnée confidentielle reste sur le disque.
      // On log pour ne pas faire disparaître un échec en silence —
      // mais on ne rethrow pas, car TopBar attend de pouvoir
      // rediriger vers /site/index.html même en cas d'échec.
      // eslint-disable-next-line no-console
      console.error('[auth-scope-bridge] signOut a échoué, purge forcée', err);
      performSignOutCleanup();
      return { error: err };
    }
  };
  auth.signOut = wrapped;
}

/** Installe le bridge. Idempotent : un deuxième appel est no-op. Le
 *  side-effect est réel : on s'abonne à Supabase et on patche
 *  `signOut`. */
export function installAuthScopeBridge(): void {
  if (installed) return;
  installed = true;

  // Patch en premier — si quelqu'un appelle signOut pendant l'install,
  // il tape déjà dans la version nettoyée.
  patchSignOut();

  if (!supabaseConfigured) {
    // Pas de Supabase branché : on garde le scope anonyme, on ne peut
    // pas écouter d'event. La purge manuelle reste possible via
    // `signOutAndPurge()` ou `purgeAllCoachOsKeys()` directement.
    return;
  }

  // `onAuthStateChange` fire `INITIAL_SESSION` au montage si une
  // session existe déjà. Notre handler traite ce cas comme un login.
  const sub = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session?.user?.id) {
        performSignIn(session.user.id);
      } else {
        // INITIAL_SESSION avec session=null = pas d'utilisateur
        // branché. On reste en scope anonyme ; aucun rehydrate.
        clearScope();
      }
    } else if (event === 'SIGNED_OUT') {
      performSignOutCleanup();
    }
    // TOKEN_REFRESHED, USER_UPDATED, etc. — pas de transition de
    // scope, donc rien à faire.
  });
  // `onAuthStateChange` renvoie `{ data: { subscription } }` dans
  // les versions modernes de @supabase/supabase-js. On accepte les
  // deux formes pour rester portable.
  const maybeSubscription = (sub as unknown as { data?: { subscription?: { unsubscribe: () => void } } }).data?.subscription;
  unsubscribeAuth = () => {
    if (maybeSubscription && typeof maybeSubscription.unsubscribe === 'function') {
      maybeSubscription.unsubscribe();
    } else if (typeof sub === 'function') {
      (sub as unknown as () => void)();
    }
  };
}

/** Désinstalle le bridge. Réservé aux tests : annule l'abonnement
 *  Supabase et restaure le `signOut` original. */
export function uninstallAuthScopeBridge(): void {
  if (unsubscribeAuth) {
    try { unsubscribeAuth(); } catch { /* best-effort */ }
    unsubscribeAuth = null;
  }
  if (originalSignOut && supabaseConfigured) {
    (supabase.auth as unknown as { signOut: (...args: unknown[]) => Promise<unknown> }).signOut = originalSignOut;
    originalSignOut = null;
  }
  installed = false;
  registered.clear();
}