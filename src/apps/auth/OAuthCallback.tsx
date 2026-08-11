/**
 * OAuthCallback — page de retour apres authentification OAuth.
 *
 * Pourquoi elle existe : `signInWithOAuth` redirige vers
 * `<origin>/auth/callback#access_token=...&refresh_token=...`.
 * Sans page ici, le navigateur sert une 404 (Vercel) ou la racine,
 * et la session OAuth n'est jamais materialisee cote client.
 *
 * Comportement :
 *   1. Le client Supabase detecte le hash et stocke la session
 *      automatiquement (detectSessionInUrl=true par defaut dans
 *      createClient). On attend donc un evenement SIGNED_IN ou un
 *      getSession() resolu.
 *   2. Succes : on redirige vers `/` (la racine), ce qui deroule le
 *      bureau apres que App.tsx ait restaure la session.
 *   3. Echec (pas de hash, hash invalide, timeout) : carte d'erreur
 *      explicite, jamais une page blanche.
 *
 * Cette page est rendue par App.tsx quand `window.location.pathname`
 * vaut `/auth/callback`. Elle n'a pas d'autre entree.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';

type Status =
  | { kind: 'waiting' }
  | { kind: 'success'; redirecting: boolean }
  | { kind: 'error'; reason: string };

const SESSION_TIMEOUT_MS = 5000;

export function OAuthCallback(): import('react').ReactNode {
  const [status, setStatus] = useState<Status>({ kind: 'waiting' });

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus({
        kind: 'error',
        reason:
          'Supabase n’est pas configure. Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
      });
      return;
    }

    let resolved = false;
    const finish = (s: Status): void => {
      if (resolved) return;
      resolved = true;
      setStatus(s);
    };

    // 1. Ecouter le signal explicite de Supabase : quand la session
    //    OAuth est materialisee cote client, on recoit SIGNED_IN.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        finish({ kind: 'success', redirecting: true });
      } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Pas un signal de succes ici ; on laisse le timeout ou
        // la verification explicite trancher.
      }
    });

    // 2. Verification directe : getSession() lit le hash si on vient
    //    d'arriver (detectSessionInUrl). Si la session est deja la,
    //    on n'attend pas le timeout.
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          finish({ kind: 'error', reason: error.message });
          return;
        }
        if (data.session) {
          finish({ kind: 'success', redirecting: true });
        }
      } catch (err) {
        finish({
          kind: 'error',
          reason: err instanceof Error ? err.message : 'Erreur inconnue.',
        });
      }
    })();

    // 3. Filet de securite : si rien n'arrive en 5s, on affiche
    //    l'erreur plutot que de laisser un spinner tourner pour
    //    toujours.
    const t = window.setTimeout(() => {
      if (typeof window !== 'undefined' && !window.location.hash) {
        finish({
          kind: 'error',
          reason:
            'Aucun jeton recu dans l’URL. La connexion OAuth n’a pas abouti, ou le fournisseur n’est pas actif.',
        });
      } else if (!resolved) {
        finish({
          kind: 'error',
          reason:
            'La session n’a pas pu etre recuperee dans le temps imparti. Reessaie depuis l’ecran de connexion.',
        });
      }
    }, SESSION_TIMEOUT_MS);

    return () => {
      window.clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  // Une fois la session confirmee, on redirige vers la racine.
  useEffect(() => {
    if (status.kind !== 'success' || !status.redirecting) return;
    const t = window.setTimeout(() => {
      window.location.replace('/');
    }, 600);
    return () => window.clearTimeout(t);
  }, [status]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 9999, background: 'rgba(248,247,244,1)' }}
      data-testid="oauth-callback"
      data-status={status.kind}
    >
      <div
        className="w-[420px] max-w-[calc(100vw-32px)] p-8 rounded-3xl"
        style={{
          background: 'rgba(255,255,255,0.94)',
          border: '1px solid rgba(15,23,42,0.10)',
          boxShadow: '0 30px 80px -28px rgba(15,23,42,0.40)',
        }}
      >
        {status.kind === 'waiting' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-stone-400" />
            <h1
              className="text-xl font-semibold tracking-tight text-stone-900"
              style={{ fontFamily: 'var(--theme-font-display)' }}
            >
              Connexion en cours…
            </h1>
            <p className="text-sm text-stone-500">
              On finalise ta session avec le fournisseur. Une seconde.
            </p>
          </div>
        )}

        {status.kind === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <h1
              className="text-xl font-semibold tracking-tight text-stone-900"
              style={{ fontFamily: 'var(--theme-font-display)' }}
            >
              Connecte. Ouverture du bureau…
            </h1>
            <p className="text-sm text-stone-500">
              Tu y es. On t’y emmene.
            </p>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 shrink-0" />
              <div>
                <h1
                  className="text-lg font-semibold text-stone-900"
                  style={{ fontFamily: 'var(--theme-font-display)' }}
                >
                  La connexion a echoue
                </h1>
                <p className="text-sm text-stone-600 mt-1">{status.reason}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                style={{
                  background: 'linear-gradient(135deg, #f08143 0%, #e07535 100%)',
                  boxShadow: '0 10px 24px -10px rgba(240,129,67,0.6)',
                }}
              >
                Revenir a l’ecran de connexion
              </button>
              <p className="text-xs text-stone-500 text-center">
                Si le probleme persiste, regarde FOURNISSEURS.md pour verifier
                la configuration cote fournisseur et cote Supabase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}