/// <reference types="vite/client" />
/** Supabase client singleton — Coach OS Phase 1.
 *
 *  La référence `vite/client` ci-dessus est nécessaire, et locale au fichier
 *  à dessein : `api/tsconfig.json` ne charge pas les types client de Vite —
 *  ces fonctions tournent dans Node. Sans elle, `tsc -p api/tsconfig.json`
 *  rend `TS2339: Property 'env' does not exist on type 'ImportMeta'` sur ce
 *  module, qu'il compile parce que les routes `api/v1/*` l'importent.
 *  L'élargir dans le tsconfig serveur donnerait les types DOM à du code Node.
 *  Mirrors the Life OS pattern: a thin client, used by the CMS repository for
 *  hydrate/upsert. Safe to import even with no env vars set (client just won't
 *  authenticate — callers must treat every call as best-effort). */
import { createClient } from '@supabase/supabase-js';
import { estNavigateur } from './env';

// ACCES STATIQUE OBLIGATOIRE — ne pas passer par un helper.
//
// Vite remplace le motif LITTERAL `import.meta.env.VITE_XXX` par sa valeur au
// build du client. Un acces dynamique (`env[cle]`, ou un helper qui aliase
// `import.meta`) casse ce remplacement : la variable disparait du bundle et
// l'app demarre en croyant Supabase non configure. C'est exactement ce qui
// s'est produit le 2026-08-17 — l'ecran de connexion affichait « Supabase non
// configure », aucun compte ne fonctionnait, et seul le mode demo restait.
//
// L'optional chaining protege Node : `api/v1/*` importe ce module
// transitivement, et la-bas `import.meta.env` vaut `undefined`. Le `?.` rend
// `undefined` au lieu de jeter, sans empecher Vite d'inliner.
//
// Le test `src/lib/supabase.inlining.test.ts` verrouille la propriete.
const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// `supabaseConfigured` est faux si l'URL ou la cle manquent. On detecte aussi
// les URL manifestement fantaisistes (placeholder) pour eviter qu'un build
// embarque une URL de demonstration et empile des requetes DNS-mortes en
// production : la production interroge `qjrwcdzaebyqponqkiqs.supabase.co`
// qui ne resout pas, et 12 requetes echouees a chaque ouverture d'app
// masquaient la panne. Un placeholder dans l'URL rend `supabaseConfigured`
// faux et l'app bascule sur le seed local au lieu de hurler en silence.
export const supabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes('placeholder') &&
    !url.includes('example.supabase.co') &&
    url.startsWith('https://'),
);

const STUB_ERROR = (op: string): Error =>
  new Error(`[supabase] ${op} appele sans configuration. Verifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.`);

// Client mort-ne : on lui substitue un objet qui rejette toute requete.
// Les appelants doivent toujours verifier `supabaseConfigured` d'abord,
// mais si un appelant oublie, mieux vaut une erreur explicite qu'un
// timeout reseau sur une URL invalide. `signUp`/`signIn*`/`signOut`/
// `resetPasswordForEmail` RETOURNENT `{ error }` au lieu de throw, parce
// que `AuthPage.tsx` (et autres appelants) utilisent
// `if (error) throw error` : un throw ici donnerait "is not a function"
// en local parce que les methodes etaient absentes de l'ancien stub.
const STUB_AUTH = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => undefined } },
  }),
  signUp: async () => ({
    data: { session: null, user: null },
    error: STUB_ERROR('auth.signUp'),
  }),
  signInWithPassword: async () => ({
    data: { session: null, user: null },
    error: STUB_ERROR('auth.signInWithPassword'),
  }),
  signInWithOAuth: async () => ({
    data: { provider: null, url: null },
    error: STUB_ERROR('auth.signInWithOAuth'),
  }),
  signOut: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({
    data: null,
    error: STUB_ERROR('auth.resetPasswordForEmail'),
  }),
};

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!)
  : ({
      from: () => {
        throw STUB_ERROR('from()');
      },
      auth: STUB_AUTH,
    } as unknown as ReturnType<typeof createClient>);

// Avertissement console explicite quand la production est mal pointee. Le
// defaut avant etait muet : la panne ne se voyait qu'en ouvrant la console
// et en cherchant les `ERR_NAME_NOT_RESOLVED`. On l'affiche au boot si
// l'URL est presente mais manifestement invalide, et a la premiere requete
// en echec si elle passe par le hook d'instrumentation du store CMS.
if (estNavigateur()) {
  if (!supabaseConfigured && (url || anonKey)) {
    // Une des deux manque OU l'URL est un placeholder. C'est le regime
    // "demonstration locale" : silencieux.
  }
  if (supabaseConfigured) {
    // Sonde de joignabilite, une fois, en parallele, sans bloquer l'app.
    //
    // La premiere version tapait `/auth/v1/` en HEAD, sans cle et en
    // `mode: 'no-cors'`. Elle echouait des deux cotes a la fois : Supabase
    // rendait 401 faute de cle — deux lignes rouges en console a chaque
    // chargement de la production — et la reponse opaque du mode `no-cors`
    // ne rejette jamais, donc le `.catch` ne se declenchait pas. Elle
    // polluait sans rien mesurer.
    //
    // `/auth/v1/health` avec la cle anonyme rend 200 (verifie sur INTERN).
    // La cle est publique par conception : elle est deja embarquee dans le
    // JavaScript livre.
    // `supabaseConfigured` (garde ci-dessus) prouve déjà que `anonKey` est
    // renseignée — même assertion que la construction du client en ligne 84.
    void fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey! } })
      .then((r) => {
        if (r.ok) return;
        // eslint-disable-next-line no-console
        console.warn(
          `[supabase] configure mais repond ${r.status} — bascule sur le seed local.`,
          { url },
        );
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.warn(
          '[supabase] configure mais injoignable — bascule sur le seed local.',
          { url },
        );
      });
  }
}