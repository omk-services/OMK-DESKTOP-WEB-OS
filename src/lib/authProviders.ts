/**
 * authProviders.ts — liste des fournisseurs OAuth supportes par Coach OS.
 *
 * Chaque fournisseur porte :
 *   - son identifiant technique (celui qu'attend Supabase `signInWithOAuth({ provider })`)
 *   - son libelle humain (FR par defaut)
 *   - son logo (SVG inline ; on evite ainsi une dependance externe et on garde
 *     le rendu net en clair comme en sombre)
 *   - les couleurs de marque officielles (Google, Apple, Microsoft publient
 *     leurs guidelines ; on les respecte a la lettre — Apple refuse les
 *     implementations qui s'en ecartent)
 *
 * L'etat `configured` est resolu cote composant via une sonde reseau, jamais
 * ici : un fichier de configuration peut affirmer qu'un fournisseur est
 * disponible sans que Supabase le soit reellement. Voir
 * `probeProviderStatus()` dans ce module.
 */

import { supabase, supabaseConfigured } from './supabase';

export type ProviderId = 'google' | 'apple' | 'azure';

export type ProviderStatus =
  | { state: 'unknown' }
  | { state: 'ready' }
  | { state: 'unconfigured' }
  | { state: 'unreachable' };

export interface AuthProvider {
  id: ProviderId;
  /** Libelle visible sur le bouton, dans la langue de l'utilisateur. */
  label: string;
  /** Logo inline (SVG en data-uri, accessible sans import). */
  logoSvg: string;
  /** Couleur officielle pour la bordure / un anneau sur le bouton. */
  brandColor: string;
  /** Le bouton doit-il apparaitre plein (Apple = noir, Google = blanc) ou
   *  en contour ? Les guidelines sont ici traduites en booleen. */
  solid: boolean;
  /** Note visible a cote du bouton quand le fournisseur est `unconfigured`
   *  ou `unreachable` — l'utilisateur voit la cause, pas un crash. */
  setupHint: string;
}

const googleLogo = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">' +
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.7 0 5.1.9 7 2.5l5.7-5.7C33.2 6.1 28.8 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/>' +
    '<path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.7 0 5.1.9 7 2.5l5.7-5.7C33.2 6.1 28.8 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>' +
    '<path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36.5 24 36.5c-5.2 0-9.6-3.4-11.2-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>' +
    '<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.4l6.2 5.2C40.9 35.9 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/>' +
    '</svg>',
);
const appleLogo = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">' +
    '<path fill="currentColor" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.65-2.323-7.34 0-4.31 2.797-6.6 5.552-6.6 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.08-2.567 1.5-2.567 4.5 0 3.52 3.098 4.74 3.148 4.78z"/>' +
    '</svg>',
);
const microsoftLogo = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">' +
    '<rect x="1" y="1" width="10" height="10" fill="#F25022"/>' +
    '<rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>' +
    '<rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>' +
    '<rect x="13" y="13" width="10" height="10" fill="#FFB900"/>' +
    '</svg>',
);

export const AUTH_PROVIDERS: AuthProvider[] = [
  {
    id: 'google',
    label: 'Continuer avec Google',
    logoSvg: `data:image/svg+xml;utf8,${googleLogo}`,
    brandColor: '#4285F4',
    solid: false,
    setupHint:
      'Google OAuth n’est pas encore active. Voir FOURNISSEURS.md pour configurer Google Cloud + Supabase.',
  },
  {
    id: 'apple',
    label: 'Continuer avec Apple',
    logoSvg: `data:image/svg+xml;utf8,${appleLogo}`,
    brandColor: '#000000',
    solid: true,
    setupHint:
      'Apple Sign-In n’est pas encore active. Voir FOURNISSEURS.md pour configurer Apple Developer + Supabase.',
  },
  {
    id: 'azure',
    label: 'Continuer avec Microsoft',
    logoSvg: `data:image/svg+xml;utf8,${microsoftLogo}`,
    brandColor: '#0078D4',
    solid: false,
    setupHint:
      'Microsoft n’est pas encore active. Voir FOURNISSEURS.md pour configurer Azure App Registration + Supabase.',
  },
];

export const authProviderById = (id: ProviderId): AuthProvider | undefined =>
  AUTH_PROVIDERS.find((p) => p.id === id);

/**
 * Le niveau d'entree de l'utilisateur. Voir SOCLE.md du brief : Niveau 0
 * = Architecte + compte de demo (projet INTERN), Niveau 1 = coachs
 * clients (projet CUSTOMERS), demo = ouverture sur le seed local sans
 * toucher Supabase.
 *
 * Cette enum est transmise par l'interface ; la logique serveur (qui
 * branche sur quel projet Supabase, quel JWT claim `org_id`) est du
 * ressort de l'agent B.
 */
export type TenantLevel = 'architect' | 'coach' | 'demo';

export const TENANT_LEVELS: {
  id: TenantLevel;
  label: string;
  helper: string;
  /** Chemin logique du projet Supabase ; indicatif pour l'agent B. */
  project: 'INTERN' | 'CUSTOMERS' | 'LOCAL_SEED';
}[] = [
  {
    id: 'architect',
    label: 'Architecte (interne)',
    helper: 'Toi et le compte de demonstration — le projet INTERN.',
    project: 'INTERN',
  },
  {
    id: 'coach',
    label: 'Coach client',
    helper: 'Tes clients coachs en preuve de concept — le projet CUSTOMERS.',
    project: 'CUSTOMERS',
  },
  {
    id: 'demo',
    label: 'Decouvrir sans compte',
    helper: 'Bureau de demonstration, seed local, aucune donnee envoyee.',
    project: 'LOCAL_SEED',
  },
];

/**
 * Quels fournisseurs sont reellement actifs ?
 *
 *  La premiere version envoyait un HEAD sur `/auth/v1/authorize?provider=<id>`
 *  et devinait l'etat d'apres le code HTTP. Mesure faite sur la production :
 *  cet endpoint **n'accepte pas HEAD** et rend 405 — soit trois lignes rouges
 *  en console a chaque chargement, une par fournisseur, et un etat toujours
 *  faux puisque 405 tombait dans la branche « injoignable ».
 *
 *  C'est le meme defaut que la sonde de `supabase.ts` corrigee en meme temps :
 *  interroger un endpoint avec une methode qu'il ne sert pas, puis inferer un
 *  sens du code d'erreur. **Supabase dit lui-meme quels fournisseurs sont
 *  actifs** : `GET /auth/v1/settings` rend un objet de booleens
 *  (`{ google: false, apple: false, azure: false, ... }`).
 *
 *  Une seule requete pour tous les fournisseurs, au lieu d'une par
 *  fournisseur, et une reponse affirmative au lieu d'une devinette.
 */
let settingsPromise: Promise<Record<string, unknown> | null> | null = null;

function supabaseUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? null;
}

function fetchAuthSettings(): Promise<Record<string, unknown> | null> {
  if (settingsPromise) return settingsPromise;
  settingsPromise = (async () => {
    const base = supabaseUrl();
    const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!base || !cle) return null;
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: { apikey: cle },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      // Selon la version de GoTrue, la carte est a la racine ou sous `external`.
      const externe = data.external;
      return (externe && typeof externe === 'object' ? externe : data) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();
  return settingsPromise;
}

export function probeProviderStatus(id: ProviderId): Promise<ProviderStatus> {
  return (async (): Promise<ProviderStatus> => {
    if (!supabaseConfigured) return { state: 'unconfigured' };
    const actifs = await fetchAuthSettings();
    // Pas de reponse exploitable : Supabase est configure mais ne repond pas.
    if (!actifs) return { state: 'unreachable' };
    return actifs[id] === true ? { state: 'ready' } : { state: 'unconfigured' };
  })();
}

export function resetProviderProbes(): void {
  settingsPromise = null;
}

/**
 * Lance le flow OAuth reel pour le provider. Utilise l'API officielle
 * Supabase. Cette fonction declenche une redirection — elle ne retourne
 * que si la redirection echoue.
 */
export async function startOAuth(providerId: ProviderId): Promise<void> {
  if (!supabaseConfigured) {
    throw new Error('Supabase non configure. Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: providerId as 'google' | 'apple' | 'azure',
    options: {
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
    },
  });
  if (error) throw error;
}

/** Re-export pour les composants : vrai si le client Supabase est utilisable. */
export function isSupabaseReady(): boolean {
  return supabaseConfigured;
}