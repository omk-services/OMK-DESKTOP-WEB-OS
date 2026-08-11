/**
 * ProviderButtons — les trois boutons OAuth (Google, Apple, Microsoft).
 *
 * Les boutons sont dans la carte sanctuaire : ils ne deplacent pas le
 * formulaire, ils l'etendent verticalement. Aucun changement de position.
 *
 * Conformite au branding :
 *   - Google : logo multicolore officiel, contour gris, fond blanc, label
 *     "Continuer avec Google" en francais
 *   - Apple  : fond noir plein, logo blanc, label "Continuer avec Apple"
 *   - Microsoft : logo 4 carres, contour gris, fond blanc, label
 *     "Continuer avec Microsoft"
 *
 * Etats :
 *   - `idle` : affichage normal
 *   - `loading` : spinner inline, desactive, on ne touche pas au label
 *   - `unconfigured` : bouton grise, hint visible, pas d'appel reseau
 *
 * Si le fournisseur n'est pas actif cote Supabase, le bouton le dit
 * calmement (toast discret) au lieu de partir sur une page d'erreur.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AUTH_PROVIDERS,
  probeProviderStatus,
  startOAuth,
  type AuthProvider,
  type ProviderId,
  type ProviderStatus,
} from '../../lib/authProviders';

export interface ProviderButtonsProps {
  /** Callback quand un bouton est clique — utile si l'orchestrateur veut
   *  afficher un toast. */
  onAttempt?: (provider: AuthProvider, status: ProviderStatus) => void;
  /** Niveau d'entree (transmis a Supabase via metadata). */
  level: 'architect' | 'coach';
}

export function ProviderButtons({ onAttempt, level }: ProviderButtonsProps): import('react').ReactNode {
  const [statuses, setStatuses] = useState<Record<ProviderId, ProviderStatus>>({
    google: { state: 'unknown' },
    apple: { state: 'unknown' },
    azure: { state: 'unknown' },
  });
  const [loading, setLoading] = useState<ProviderId | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        AUTH_PROVIDERS.map(async (p) => [p.id, await probeProviderStatus(p.id)] as const),
      );
      if (cancelled) return;
      setStatuses((prev) => {
        const next = { ...prev };
        for (const [id, status] of results) next[id] = status;
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const handleClick = async (provider: AuthProvider): Promise<void> => {
    const status = statuses[provider.id];
    onAttempt?.(provider, status);
    if (status.state === 'unknown' || status.state === 'unconfigured' || status.state === 'unreachable') {
      return;
    }
    setLoading(provider.id);
    try {
      await startOAuth(provider.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      onAttempt?.(provider, { state: 'unreachable' });
      // eslint-disable-next-line no-console
      console.warn('[auth] OAuth demarrage impossible:', msg);
    } finally {
      setLoading(null);
    }
  };

  // Pour eviter d'encombrer la carte, on ne montre les hints que si un
  // provider est reellement non configure. On les accumule en pied de
  // bloc.
  const allDisabled = AUTH_PROVIDERS.every((p) => statuses[p.id].state === 'unconfigured');

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-stone-500">
        <span className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.12)' }} />
        <span>ou continuer avec</span>
        <span className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.12)' }} />
      </div>

      {AUTH_PROVIDERS.map((p) => {
        const status = statuses[p.id];
        const disabled =
          loading !== null ||
          status.state === 'unconfigured' ||
          status.state === 'unreachable' ||
          status.state === 'unknown';
        const isLoading = loading === p.id;

        return (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => { void handleClick(p); }}
            disabled={disabled}
            data-provider={p.id}
            data-status={status.state}
            whileHover={disabled ? undefined : { y: -1 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            style={providerButtonStyle(p, status)}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <img
                src={p.logoSvg}
                alt=""
                aria-hidden
                width={20}
                height={20}
                style={{ width: 20, height: 20 }}
              />
            )}
            <span>{p.label}</span>
          </motion.button>
        );
      })}

      {allDisabled && (
        <p className="text-[11px] text-stone-500 leading-snug mt-1">
          Les fournisseurs OAuth ne sont pas encore actives cote Supabase. Voir
          <code className="mx-1 px-1 rounded bg-stone-100">FOURNISSEURS.md</code>
          pour la procedure complete.
        </p>
      )}

      <p className="text-[10px] text-stone-400 text-center mt-1">
        Niveau selectionne : <strong>{level === 'architect' ? 'Architecte (INTERN)' : 'Coach client (CUSTOMERS)'}</strong>
      </p>
    </div>
  );
}

function providerButtonStyle(p: AuthProvider, _status: ProviderStatus): React.CSSProperties {
  void _status;
  if (p.id === 'apple') {
    return {
      background: '#000000',
      color: '#ffffff',
      border: '1px solid #000000',
    };
  }
  return {
    background: '#ffffff',
    color: '#0f172a',
    border: `1px solid ${p.brandColor}33`,
  };
}