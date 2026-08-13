/**
 * App — racine du produit.
 *
 * Le contrat d'auth :
 *   - si on a une session Supabase au boot, on deroule directement le bureau
 *   - sinon on affiche la page d'auth (login / signup / demo)
 *   - la page d'auth appelle onAuthenticated() quand l'utilisateur est
 *     pret, ce qui deroule le bureau (et persiste le mode choisi)
 *
 * `authMode` n'est pas securite cote serveur : le serveur reste la source
 * de verite. C'est un signal local pour piloter l'UI.
 */
import { useEffect, useState } from 'react';
import { Desktop } from './components/Desktop';
import { ThemeApplier } from './lib/themes/ThemeApplier';
import { AuthPage } from './apps/auth/AuthPage';
import { OAuthCallback } from './apps/auth/OAuthCallback';
import { supabase } from './lib/supabase';
import type { TenantLevel } from './lib/authProviders';

type AuthMode = 'pending' | 'supabase' | 'demo';

const AUTH_BOOT_KEY = 'coach-os:auth:v1';

interface AuthBootState {
  mode: AuthMode;
  level: TenantLevel;
  email?: string;
}

function isOAuthCallbackPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.toLowerCase().startsWith('/auth/callback');
}

/** Le site arrive-t-il en demandant explicitement la porte d'entree ?
 *
 *  `?auth=1` force l'affichage de la page de connexion, meme si un mode a ete
 *  memorise. Sans ca, le bouton « Entrer en demo » du site ouvrait le bureau
 *  directement des la deuxieme visite : l'etat `demo` reste en localStorage, et
 *  `readBootState()` le rend tel quel.
 *
 *  Le bureau ne doit jamais s'afficher en dehors de la porte. Un visiteur qui
 *  arrive depuis le site doit voir ce qu'il achete — la page d'entree — pas
 *  l'interieur d'un espace de travail dont il ne sait pas a qui il appartient.
 *
 *  On efface aussi l'etat memorise : sinon un simple rechargement sans le
 *  parametre reouvrirait le bureau, et la porte n'aurait servi qu'une fois. */
function demandeLaPorte(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('auth');
}

function readBootState(): AuthBootState {
  if (typeof window === 'undefined') return { mode: 'pending', level: 'architect' };
  if (demandeLaPorte()) {
    try { window.localStorage.removeItem(AUTH_BOOT_KEY); } catch { /* navigation privee */ }
    return { mode: 'pending', level: 'architect' };
  }
  try {
    const brut = window.localStorage.getItem(AUTH_BOOT_KEY);
    if (!brut) return { mode: 'pending', level: 'architect' };
    const parsed = JSON.parse(brut) as Partial<AuthBootState>;
    if (parsed.mode === 'demo') {
      return { mode: 'demo', level: 'demo' };
    }
    return { mode: 'pending', level: 'architect' };
  } catch {
    return { mode: 'pending', level: 'architect' };
  }
}

function writeBootState(state: AuthBootState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_BOOT_KEY, JSON.stringify(state));
  } catch {
    // quota plein ou navigation privee : on survit, le bureau se
    // rechargera la prochaine fois.
  }
}

export default function App() {
  const [boot, setBoot] = useState<AuthBootState>(() => readBootState());

  useEffect(() => {
    // Si la persistance locale indique deja un mode (demo choisi
    // precedemment), on l'autorise sans demander de session Supabase.
    if (boot.mode !== 'pending') return;
    let cancelled = false;
    // En parallele, on tente de restaurer une session existante.
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setBoot({ mode: 'supabase', level: 'architect', email: data.session.user.email ?? undefined });
        }
      } catch {
        // Pas de session, on reste sur l'auth page.
      }
    })();
    return () => { cancelled = true; };
  }, [boot.mode]);

  const handleAuthenticated = (session: { mode: 'supabase' | 'demo'; level: TenantLevel; email?: string }): void => {
    const next: AuthBootState = {
      mode: session.mode === 'demo' ? 'demo' : 'supabase',
      level: session.level,
      email: session.email,
    };
    writeBootState(next);
    setBoot(next);
  };

  return (
    <>
      <ThemeApplier />
      {isOAuthCallbackPath() ? (
        <OAuthCallback />
      ) : boot.mode === 'pending' ? (
        <AuthPage onAuthenticated={handleAuthenticated} />
      ) : (
        <Desktop />
      )}
    </>
  );
}