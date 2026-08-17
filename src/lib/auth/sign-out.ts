/**
 * sign-out.ts — sortie propre : ferme la session Supabase ET vide
 * les caches locaux, en tolérant un échec réseau.
 *
 * Pourquoi un helper explicite en plus du patch dans
 * `auth-scope-bridge.ts` :
 *  - Le patch de `supabase.auth.signOut` couvre tous les callers
 *    existants (TopBar, tests, futurs appels). C'est la défense en
 *    profondeur.
 *  - Mais un helper nommé rend le geste lisible : un composant qui
 *    sait qu'il déconnecte l'utilisateur appelle `signOutAndPurge()`,
 *    pas `signOut()` à l'aveugle. C'est aussi ce que les tests
 *    exercent directement.
 *
 * Contrat :
 *  - Ferme la session Supabase. Tolère un échec (réseau, session
 *    déjà expirée) et continue.
 *  - PURGE TOUTES les clés `coach-os*` du localStorage, même en cas
 *    d'échec Supabase. C'est la mesure 2 du correctif (cf. brief).
 *  - NE redirige PAS. La redirection vers /site/index.html reste à
 *    l'appelant — c'est un geste de navigation, pas un geste
 *    d'auth.
 *
 * Pourquoi `purgeAllCoachOsKeys()` plutôt que `localStorage.clear()` :
 *  - Le scope peut cohabiter avec d'autres apps sur la même origin
 *    (rare mais possible). On ne touche qu'à ce qui nous appartient.
 */
import { supabase, supabaseConfigured } from '../supabase';
import { purgeAllCoachOsKeys } from './storage-scope';

export interface SignOutResult {
  /** L'appel Supabase a-t-il renvoyé une erreur ? `true` signifie que
   *  la session est fermée localement (cookie Supabase effacé), mais
   *  que le serveur n'a pas confirmé. `false` = tout est clean. */
  supabaseErrored: boolean;
  /** Nombre de clés `coach-os*` effacées. */
  purged: number;
}

/** Ferme la session Supabase et purge `coach-os*`. Ne redirige pas.
 *  Renvoie un diagnostic — utile en tests, et pour qu'un caller
 *  puisse décider quoi afficher si la fermeture serveur a échoué. */
export async function signOutAndPurge(): Promise<SignOutResult> {
  let supabaseErrored = false;
  if (supabaseConfigured) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) supabaseErrored = true;
    } catch (err) {
      // On ne rethrow pas — le caller veut continuer (purge +
      // redirection) même si le serveur est injoignable. Le brief
      // est clair : la purge doit avoir lieu QUAND MÊME.
      supabaseErrored = true;
      // eslint-disable-next-line no-console
      console.error('[sign-out] supabase.auth.signOut a échoué', err);
    }
  }
  const purged = purgeAllCoachOsKeys();
  return { supabaseErrored, purged };
}