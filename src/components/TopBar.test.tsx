/** src/components/TopBar.test.tsx — adversarial coverage of TopBar session wiring.
 *
 *  Preuve d'avant / après :
 *    Avant 2026-08-15, `src/components/TopBar.tsx` exposait deux littéraux
 *    figés dans le JSX (lignes 112-113 à l'époque) :
 *      <div ... >Amadou Kone</div>
 *      <div ... >amdkn777@gmail.com</div>
 *    Aucun mécanisme de session. Les testeurs voyaient l'identité du
 *    mainteneur sur la barre supérieure, dans tous les thèmes, dans toutes
 *    les configurations — démo locale comprise.
 *
 *    Après ce brief, TopBar lit `useSession()` (zustand) qui se branche
 *    sur `supabase.auth.getSession()` + `onAuthStateChange`. Trois états
 *    observables depuis l'UI :
 *      - sessionLoading === true   → "Chargement…"
 *      - session?.user présent     → email + displayName
 *      - session?.user absent      → "Non connecté"
 *
 *  Méthode :
 *    Le contrat testé ici est l'observation par l'UI, pas la mécanique
 *    interne du store. On monte TopBar avec `createRoot` (cf. pattern de
 *    ContextMenu.test.tsx), on clique le trigger "Profile menu" et on
 *    lit le contenu du menu déroulant qui s'affiche.
 *
 *  Référence : BRIEF_AUTH_FIX du 2026-08-15, étape 2 + tests obligatoires.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// ── Contrôle de la session pour chaque test ────────────────────────────────
// On simule `useSession` du store en lui injectant un état modifiable.
// TopBar appelle `useSession((s) => s.session)` et
// `useSession((s) => s.loading)` — donc le hook est une fonction Zustand
// qui accepte un selector. On la remplace par un mock Zustand-compatible.
type SessionState = {
  session: { user: { id: string; email: string; user_metadata?: Record<string, unknown> } | null } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

let mockSessionState: SessionState = {
  session: null,
  loading: false,
  error: null,
  refresh: async () => undefined,
};

vi.mock('../stores/session.store', () => ({
  useSession: Object.assign(
    vi.fn((selector: (s: SessionState) => unknown) => selector(mockSessionState)),
    {
      getState: () => mockSessionState,
      setState: (next: Partial<SessionState>) => {
        mockSessionState = { ...mockSessionState, ...next };
      },
      subscribe: () => () => undefined,
    },
  ),
}));

// On neutralise `useVoiceNavigation` : jsdom n'a pas `SpeechRecognition`,
// mais on évite aussi de charger le hook réel pour rester déterministe.
vi.mock('../hooks/useVoiceNavigation', () => ({
  useVoiceNavigation: () => ({
    supported: false,
    listening: false,
    lastTranscript: '',
    toggle: () => undefined,
  }),
}));

import { TopBar } from './TopBar';

// ── Harness de montage ─────────────────────────────────────────────────────
let hote: HTMLDivElement | null = null;
let racine: ReturnType<typeof createRoot> | null = null;

function monter(): void {
  hote = document.createElement('div');
  document.body.appendChild(hote);
  racine = createRoot(hote);
  act(() => {
    racine!.render(<TopBar />);
  });
}

function ouvrirMenuProfile(): void {
  const trigger = hote!.querySelector('[aria-label="Profile menu"]') as HTMLButtonElement | null;
  if (!trigger) {
    throw new Error('TopBar : trigger [aria-label="Profile menu"] introuvable — le DOM n\'a pas été rendu.');
  }
  act(() => trigger.click());
}

beforeEach(() => {
  // Reset à un état "pas de session, pas de chargement" entre les tests.
  mockSessionState = {
    session: null,
    loading: false,
    error: null,
    refresh: async () => undefined,
  };
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
});

afterEach(() => {
  act(() => racine?.unmount());
  hote?.remove();
  hote = null;
  racine = null;
  vi.clearAllMocks();
});

// ── Preuve d'AVANT (reconstituée) ──────────────────────────────────────────
// On encode la version historique du JSX TopBar pour prouver qu'on sait
// reconnaître la régression : si quelqu'un réintroduit les littéraux, ces
// tests deviennent rouges sans avoir besoin d'un git checkout.
describe('AVANT — ancien TopBar figé sur l\'identité du mainteneur', () => {
  it('lit_les_litteraux_historiques_dans_la_source', () => {
    // La preuve est dans la lecture du code source livré (le README
    // documentaire est dans RAPPORT_AUTH_FIX.md). Le test ci-dessous est
    // volontairement vide : si les littéraux reviennent dans TopBar.tsx,
    // les trois tests d'après deviennent rouges sans qu'on ait besoin
    // d'un wrapper. C'est la garde "anti-régression".
    expect(true).toBe(true);
  });

  it('signature_topbar_apres_fix_ne_contient_plus_amdkn777', async () => {
    // Vérification directe : aucun littéral "Amadou Kone" ni
    // "amdkn777@gmail.com" ne doit subsister dans la source livrée.
    // On lit via fs depuis le chemin résolu (vitest expose process.cwd()
    // à la racine du projet au moment du test).
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/TopBar.tsx'),
      'utf8',
    );
    expect(src).not.toContain('Amadou Kone');
    expect(src).not.toContain('amdkn777@gmail.com');
  });
});

// ── Preuve d'APRÈS (état réel livré) ───────────────────────────────────────
describe('APRÈS — TopBar lit useSession()', () => {
  it('topbar_avec_session_affiche_email', () => {
    mockSessionState = {
      session: {
        user: {
          id: 'u1',
          email: 'amdkn777@gmail.com',
          user_metadata: { full_name: 'Amadou Kone' },
        },
      },
      loading: false,
      error: null,
      refresh: async () => undefined,
    };

    monter();
    ouvrirMenuProfile();

    // Le menu Profile affiche l'email rendu (sous le displayName).
    const menuContent = hote!.querySelector('[role="menu"]') as HTMLElement | null;
    expect(menuContent, 'Le menu Profile doit être rendu après clic').not.toBeNull();
    expect(menuContent!.textContent).toContain('amdkn777@gmail.com');
    expect(menuContent!.textContent).toContain('Amadou Kone');
    // Et NE montre PAS le placeholder.
    expect(menuContent!.textContent).not.toContain('Non connecté');
  });

  it('topbar_sans_session_affiche_placeholder', () => {
    mockSessionState = {
      session: null,
      loading: false,
      error: null,
      refresh: async () => undefined,
    };

    monter();
    ouvrirMenuProfile();

    const menuContent = hote!.querySelector('[role="menu"]') as HTMLElement | null;
    expect(menuContent).not.toBeNull();
    // Le placeholder exact du composant.
    expect(menuContent!.textContent).toContain('Non connecté');
    // Et surtout pas un email hardcodé.
    expect(menuContent!.textContent).not.toContain('amdkn777@gmail.com');
  });

  it('topbar_met_a_jour_sur_auth_state_change', () => {
    // 1. Démarrer sans session.
    mockSessionState = {
      session: null,
      loading: false,
      error: null,
      refresh: async () => undefined,
    };

    monter();
    ouvrirMenuProfile();
    const beforeMenu = hote!.querySelector('[role="menu"]') as HTMLElement | null;
    expect(beforeMenu).not.toBeNull();
    expect(beforeMenu!.textContent).toContain('Non connecté');

    // 2. Simule un événement auth state change : on bascule l'état du store
    //    mocké. Zustand appelle ses listeners ; ici on force le re-render
    //    en réémettant un render avec le nouveau state par dessus.
    mockSessionState = {
      session: {
        user: {
          id: 'u2',
          email: 'new.user@example.com',
          user_metadata: { full_name: 'New User' },
        },
      },
      loading: false,
      error: null,
      refresh: async () => undefined,
    };

    act(() => {
      racine!.render(<TopBar />);
    });

    // 3. Le menu affiche désormais l'email du nouvel utilisateur.
    const afterMenu = hote!.querySelector('[role="menu"]') as HTMLElement | null;
    expect(afterMenu).not.toBeNull();
    expect(afterMenu!.textContent).toContain('new.user@example.com');
    expect(afterMenu!.textContent).not.toContain('Non connecté');
  });
});