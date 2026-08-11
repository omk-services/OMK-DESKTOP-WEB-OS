/**
 * AuthPage — l'ecran complet d'authentification, rendu a la racine de
 * l'application avant que le bureau ne s'initialise.
 *
 * Composition :
 *   1. RotatingBackdrop — decor anime (cf. composant)
 *   2. AuthCard — formulaire sanctuaire (cf. composant)
 *   3. ProviderButtons — Google, Apple, Microsoft
 *   4. LevelSelector — Architecte / Coach / Decouvrir
 *   5. Bandeau inferieur — mention d'aide
 *
 * Cette page est rendue par App.tsx en amont de <Desktop />. Elle
 * utilise Supabase pour les appels reels ; quand la config manque, on
 * bascule sur le mode demo (entree "Decouvrir sans compte") sans rien
 * afficher de cassé.
 */

import { useCallback, useState } from 'react';
import { RotatingBackdrop } from '../../components/auth/RotatingBackdrop';
import { AuthCard, type AuthCardValues, type AuthMode } from '../../components/auth/AuthCard';
import { ProviderButtons } from '../../components/auth/ProviderButtons';
import { LevelSelector } from '../../components/auth/LevelSelector';
import {
  TENANT_LEVELS,
  isSupabaseReady,
  type AuthProvider,
  type ProviderStatus,
  type TenantLevel,
} from '../../lib/authProviders';
import { supabase } from '../../lib/supabase';
import { useShellStore } from '../../stores/shell.store';

export interface AuthPageProps {
  /** Callback quand l'authentification (email ou OAuth) reussit, ou
   *  quand l'utilisateur choisit la demo. Le parent (App.tsx) utilise
   *  ce signal pour derouler le bureau. */
  onAuthenticated: (session: { mode: 'supabase' | 'demo'; level: TenantLevel; email?: string }) => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps): import('react').ReactNode {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [level, setLevel] = useState<TenantLevel>('architect');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (v: AuthCardValues): Promise<void> => {
      setSubmitting(true);
      setErrorMessage(null);
      const selectedLevel = v.level;
      try {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: v.email,
            password: v.password,
            options: {
              data: {
                level: selectedLevel,
                project: TENANT_LEVELS.find((l) => l.id === selectedLevel)?.project,
              },
            },
          });
          if (error) throw error;
          if (!data.session) {
            // Confirmation par courriel requise : on confirme sans derouler
            // le bureau. Le toast est explicite.
            useShellStore.getState().addToast({
              message: 'Verifie ta boite mail pour confirmer le compte.',
              source: 'auth',
              type: 'info',
            });
            setMode('signin');
            return;
          }
          onAuthenticated({ mode: 'supabase', level: selectedLevel, email: v.email });
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: v.email,
            password: v.password,
          });
          if (error) throw error;
          if (!data.session) throw new Error('Session invalide.');
          onAuthenticated({ mode: 'supabase', level: selectedLevel, email: v.email });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
        // On rend le message lisible en francais quand c'est generique.
        setErrorMessage(translateAuthError(msg));
      } finally {
        setSubmitting(false);
      }
    },
    [mode, onAuthenticated],
  );

  const handleDemo = useCallback((): void => {
    onAuthenticated({ mode: 'demo', level: 'demo' });
  }, [onAuthenticated]);

  const handleProviderAttempt = useCallback(
    (_p: AuthProvider, s: ProviderStatus): void => {
      if (s.state === 'unconfigured') {
        useShellStore.getState().addToast({
          message: `${_p.label.replace('Continuer avec ', '')} n’est pas encore active. Voir FOURNISSEURS.md.`,
          source: 'auth',
          type: 'warning',
        });
      } else if (s.state === 'unreachable') {
        useShellStore.getState().addToast({
          message: 'Impossible de joindre Supabase. Verifie ta connexion.',
          source: 'auth',
          type: 'error',
        });
      }
    },
    [],
  );

  // Si le niveau demo est selectionne, le formulaire ne sert a rien. On
  // bascule l'UI pour mettre en avant le CTA demo.
  const showDemoPath = level === 'demo';

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex items-start sm:items-center justify-center px-4 py-8"
      style={{ zIndex: 9999 }}
      data-testid="auth-page"
      data-mode={mode}
      data-level={level}
    >
      {/* Decor anime en arriere-plan. On commence sur "aurora" (skin
          fonce tres visible) pour montrer tout de suite que le decor
          existe. Cycle de 2s : crossfade 1s, 1s plein. Visuellement la
          scene evolue toutes les ~1 secondes sans clignotement. */}
      <RotatingBackdrop initialSkinId="aurora" intervalMs={2000} />

      {/* Bandeau discret en haut pour signaler l'etat reseau si besoin */}
      {!isSupabaseReady() && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] font-medium"
          style={{
            zIndex: 50,
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: '#7f1d1d',
          }}
        >
          Supabase non configure — seule l’entree « Decouvrir sans compte » est disponible.
        </div>
      )}

      {/* Conteneur sanctuaire : la carte ne bouge pas. */}
      <div
        className="relative w-[420px] max-w-[calc(100vw-32px)] shrink-0 my-auto"
        style={{ zIndex: 100, maxHeight: 'calc(100vh - 32px)' }}
        data-testid="auth-sanctuary"
      >
        {showDemoPath ? (
          <DemoEntryCard onEnter={handleDemo} onSwitchToForm={() => setLevel('architect')} />
        ) : (
          <AuthCard
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            defaultLevel={level}
            loading={submitting}
            errorMessage={errorMessage}
          />
        )}

        {/* Les boutons OAuth et le selecteur de niveau restent attaches a
            la carte. Ils etendent la carte vers le bas sans la deplacer. */}
        {!showDemoPath && (
          <div
            className="mt-4 p-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(14px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
              border: '1px solid rgba(15,23,42,0.08)',
            }}
          >
            <ProviderButtons onAttempt={handleProviderAttempt} level={level} />
            <LevelSelector value={level} onChange={setLevel} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Carte dediee a l'entree demo. Legerement differente pour signaler
 *  qu'aucun mot de passe n'est demande. */
function DemoEntryCard({
  onEnter,
  onSwitchToForm,
}: {
  onEnter: () => void;
  onSwitchToForm: () => void;
}): import('react').ReactNode {
  return (
    <div
      className="p-8 rounded-3xl"
      style={{
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(15,23,42,0.10)',
        boxShadow: '0 30px 80px -28px rgba(15,23,42,0.40)',
      }}
    >
      <h1
        className="text-[26px] font-bold tracking-tight text-stone-900"
        style={{ fontFamily: 'var(--theme-font-display)' }}
      >
        Decouvrir Coach OS
      </h1>
      <p className="text-sm text-stone-500 mt-1">
        Le bureau de demonstration. Aucune donnee envoyee, tu peux casser
        tout ce que tu veux — c’est ton bac a sable.
      </p>
      <button
        type="button"
        onClick={onEnter}
        className="mt-6 w-full py-3 rounded-xl font-semibold text-white text-sm"
        style={{
          background: 'linear-gradient(135deg, #f08143 0%, #e07535 100%)',
          boxShadow: '0 10px 24px -10px rgba(240,129,67,0.6)',
        }}
      >
        Ouvrir le bureau
      </button>
      <button
        type="button"
        onClick={onSwitchToForm}
        className="mt-3 w-full text-xs text-stone-500 underline"
      >
        Non, je veux me connecter ou m’inscrire
      </button>
    </div>
  );
}

/** Traduit les messages d'erreur Supabase les plus courants en francais
 *  comprehensible. Si le message est nouveau, on l'affiche tel quel. */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Courriel ou mot de passe incorrect.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme d’abord ton adresse courriel via le lien recu par mail.';
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'Cette adresse est deja inscrite. Essaie de te connecter.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Trop de tentatives. Patiente une minute avant de ressayer.';
  }
  if (m.includes('weak password')) {
    return 'Ce mot de passe est trop court. Minimum 12 caracteres a l’inscription.';
  }
  return msg;
}