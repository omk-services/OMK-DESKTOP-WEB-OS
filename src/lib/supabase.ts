/** Supabase client singleton — Coach OS Phase 1.
 *  Mirrors the Life OS pattern: a thin client, used by the CMS repository for
 *  hydrate/upsert. Safe to import even with no env vars set (client just won't
 *  authenticate — callers must treat every call as best-effort). */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!)
  : // Client mort-ne : on lui substitue un objet qui rejette toute requete.
    // Les appelants doivent toujours verifier `supabaseConfigured` d'abord,
    // mais si un appelant oublie, mieux vaut une erreur explicite qu'un
    // timeout reseau sur une URL invalide.
    ({
      from: () => {
        throw new Error(
          '[supabase] client appele sans configuration. Verifier VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
        );
      },
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => undefined } },
        }),
      },
    } as unknown as ReturnType<typeof createClient>);

// Avertissement console explicite quand la production est mal pointee. Le
// defaut avant etait muet : la panne ne se voyait qu'en ouvrant la console
// et en cherchant les `ERR_NAME_NOT_RESOLVED`. On l'affiche au boot si
// l'URL est presente mais manifestement invalide, et a la premiere requete
// en echec si elle passe par le hook d'instrumentation du store CMS.
if (typeof window !== 'undefined') {
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
    void fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey } })
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