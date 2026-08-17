/**
 * storage-scope.ts — helper qui rend les clés localStorage propres à
 * (user, tenant) pour éviter la fuite entre comptes sur un même navigateur.
 *
 * Le défaut reproduit à l'écran (deux comptes Gmail, un même déploiement) :
 * les stores Zustand et tous les helpers qui écrivent dans `localStorage`
 * utilisent des clés globales (`coach-os-themes-v1`, `coach-os-assistant-v1`,
 * `coach-os-scenarios-v1`, `coach-os-three-apps-v1`, `coach-os-canvas-fx-v1`,
 * `coach-os-shell-layout-v1`, `coach-os:activeTenantId`,
 * `coach-os:dock:v1`, `coach-os-wallpaper-data-v1`,
 * `coach-os-wallpaper-fit-v1`, `coach-os:tour-fired:<id>`,
 * `coach-os-app-visibility-v1`, `coach-os-desktop-layout-v1`,
 * `coach-os-ontology-scope-v1`, `coach-os-saas-ledger-v1`,
 * `coach-os.activeTenantId`). `localStorage` est cloisonné par ORIGINE,
 * pas par compte — donc chaque nouvel utilisateur hérite des choix du
 * précédent. L'historique de conversation, le thème, le fond d'écran et le
 * scénario agent traversent les comptes.
 *
 * Le correctif a deux mesures, et ce fichier porte la première :
 *
 *   1. PRÉFIXER chaque clé par `coach-os:<userId>:<tenantId>:<nom-du-store>`.
 *      Le `userId` est l'id Supabase ; le `tenantId` est l'id du tenant
 *      actif. Avant connexion, l'espace est anonyme : `coach-os:anon:…`,
 *      et **il n'est jamais relu** une fois quelqu'un de connecté (la
 *      wrapper ci-dessous ne tape que dans la clé correspondant au scope
 *      courant). Toute donnée configurée anonymement est abandonnée au
 *      login — c'est une perte UX volontaire pour fermer la fuite.
 *   2. PURGER à la déconnexion. Vit dans `sign-out.ts` ; déclenchée par
 *      `auth-scope-bridge.ts` qui observe les changements d'auth Supabase.
 *
 * Pourquoi un wrapper `Storage` plutôt qu'un `name` dynamique :
 *   Zustand `persist` ne résout le `name` qu'une fois, au chargement du
 *   module. Si on posait `name: 'coach-os:user:tenant:themes-v1'` dans le
 *   code, ce serait figé pour la session. Avec un wrapper `Storage`, on
 *   traduit la clé logique en clé scopée à CHAQUE `getItem`/`setItem`,
 *   ce qui suit le scope courant sans avoir à recréer le store.
 *
 * Pourquoi le wrapper strippe aussi un éventuel préfixe `coach-os` :
 *   Le code existant utilise déjà `coach-os-themes-v1` etc. Le wrapper
 *   doit accepter la clé telle quelle et la transformer. Stripping le
 *   préfixe évite `coach-os:user:tenant:coach-os-themes-v1` (laid et
 *   source de bugs visuels dans les DevTools).
 */
import { installAuthScopeBridge } from './auth-scope-bridge';

/** Préfixe canonique. Tous les stores l'utilisent ; le helper ne fait
 *  qu'ajouter le scope par-dessus. */
export const COACH_OS_PREFIX = 'coach-os';

/** Scope anonyme — utilisé tant que personne n'est connecté. Le nom
 *  `anon` est délibéré : pas de PII, pas d'id utilisateur réel, et
 *  c'est ce qu'on lit dans les DevTools quand on débugge. */
const ANON_USER = 'anon';
const ANON_TENANT = 'public';

/** Forme du scope courant. Mis à jour par `setScope()` au login, par
 *  `clearScope()` à la déconnexion. Lisible via `getScope()`. */
export interface StorageScope {
  userId: string;
  tenantId: string;
}

let currentScope: StorageScope = { userId: ANON_USER, tenantId: ANON_TENANT };

/** Lit le scope courant. Renvoie une copie : ne pas muter la référence
 *  retournée. */
export function getScope(): StorageScope {
  return { ...currentScope };
}

/** Pose le scope. Utilisé par le bridge d'auth à la connexion ; exposé
 *  pour les tests. Ne fait QUE poser le scope : ne touche pas au
 *  localStorage, ne rehydrate rien. C'est le métier du bridge. */
export function setScope(userId: string, tenantId: string): void {
  currentScope = { userId, tenantId };
}

/** Réinitialise le scope à l'état anonyme. Appelé par le bridge à la
 *  déconnexion ; exposé pour les tests. Idem `setScope` : ne fait que
 *  l'état du scope, le reste est au bridge. */
export function clearScope(): void {
  currentScope = { userId: ANON_USER, tenantId: ANON_TENANT };
}

/** Construit la clé scopée à partir d'un nom logique. Le nom logique
 *  peut déjà porter `coach-os` ou `coach-os:` ; le préfixe est strippé
 *  avant d'ajouter le scope, sinon la clé devient illisible et les
 *  DevTools montrent un double préfixe. */
export function scopedKey(name: string): string {
  let bare = name;
  if (bare.startsWith(`${COACH_OS_PREFIX}:`)) {
    bare = bare.slice(COACH_OS_PREFIX.length + 1);
  } else if (bare.startsWith(`${COACH_OS_PREFIX}-`)) {
    bare = bare.slice(COACH_OS_PREFIX.length + 1);
  } else if (bare === COACH_OS_PREFIX) {
    bare = '';
  }
  return `${COACH_OS_PREFIX}:${currentScope.userId}:${currentScope.tenantId}:${bare}`;
}

/** Prédicat : la clé est-elle gérée par ce helper (et donc éligible à
 *  la purge à la déconnexion) ? Le préfixe canonique suffit — on
 *  accepte toutes les variantes (tiret, deux-points, etc.). */
export function isCoachOsKey(key: string): boolean {
  return key === COACH_OS_PREFIX
    || key.startsWith(`${COACH_OS_PREFIX}-`)
    || key.startsWith(`${COACH_OS_PREFIX}:`);
}

/** Supprime TOUTES les clés `coach-os*` du localStorage. Comptées
 *  puis effacées une par une pour éviter de muter la liste pendant
 *  l'itération (un `removeItem` peut modifier `key(i)`). Renvoie le
 *  nombre de clés effacées — utile pour les tests et la télémétrie. */
export function purgeAllCoachOsKeys(): number {
  if (typeof localStorage === 'undefined') return 0;
  const toErase: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k !== null && isCoachOsKey(k)) toErase.push(k);
  }
  let erased = 0;
  for (const k of toErase) {
    try {
      localStorage.removeItem(k);
      erased += 1;
    } catch {
      // best-effort — quota, mode privé, etc.
    }
  }
  return erased;
}

/** Fabrique un wrapper qui traduit chaque clé logique en clé scopée.
 *  Le wrapper respecte le contrat DOM `Storage` (méthodes sync). Les
 *  méthodes non utilisées par Zustand (`key`, `clear`) sont fournies
 *  pour la conformité ; `key` itère sur les clés scopées existantes
 *  pour le scope courant, et `clear` n'efface QUE les clés scopées au
 *  scope courant (le reste est laissé tel quel — `clear` est rarement
 *  appelé, mais le contrat exige une sémantique). */
export function createScopedStorage(backend: Storage = localStorage): Storage {
  const scopedPrefix = (): string =>
    `${COACH_OS_PREFIX}:${currentScope.userId}:${currentScope.tenantId}:`;
  const wrapper = {
    get length(): number {
      const prefix = scopedPrefix();
      let n = 0;
      for (let i = 0; i < backend.length; i += 1) {
        const k = backend.key(i);
        if (k !== null && k.startsWith(prefix)) n += 1;
      }
      return n;
    },
    clear(): void {
      // On n'efface QUE ce qui appartient au scope courant. Une autre
      // session active dans un autre onglet pourrait taper dans la
      // même origin — toucher à ses clés serait un vol de données.
      const prefix = scopedPrefix();
      const toErase: string[] = [];
      for (let i = 0; i < backend.length; i += 1) {
        const k = backend.key(i);
        if (k !== null && k.startsWith(prefix)) toErase.push(k);
      }
      for (const k of toErase) {
        try { backend.removeItem(k); } catch { /* best-effort */ }
      }
    },
    getItem(key: string): string | null {
      try {
        return backend.getItem(scopedKey(key));
      } catch {
        return null;
      }
    },
    key(index: number): string | null {
      // On itère les clés scopées au scope courant ; on renvoie le
      // nom logique (post-traduction inverse). Si l'index dépasse, null.
      const prefix = scopedPrefix();
      let seen = -1;
      for (let i = 0; i < backend.length; i += 1) {
        const k = backend.key(i);
        if (k === null || !k.startsWith(prefix)) continue;
        seen += 1;
        if (seen === index) {
          return k.slice(prefix.length);
        }
      }
      return null;
    },
    removeItem(key: string): void {
      try {
        backend.removeItem(scopedKey(key));
      } catch {
        // best-effort
      }
    },
    setItem(key: string, value: string): void {
      try {
        backend.setItem(scopedKey(key), value);
      } catch {
        // best-effort — quota / mode privé
      }
    },
  };
  return wrapper as Storage;
}

/** Side-effect au chargement du module : on installe le bridge d'auth.
 *  Tous les modules du périmètre qui importent ce fichier déclenchent
 *  donc l'installation — c'est le seul mécanisme qui marche sans avoir
 *  à modifier main.tsx ou App.tsx, qui sont hors périmètre. Idempotent
 *  (le bridge se flag lui-même). */
installAuthScopeBridge();