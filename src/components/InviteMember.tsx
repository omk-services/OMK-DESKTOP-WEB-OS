// src/components/InviteMember.tsx
// Modal d'invitation owner → member (Phase 3, brief 2026-08-15 MEMBERSHIPS).
//
// Cosmetique + collecte d'intentions. L'envoi réel passe par
// `inviterMembre(ctx, tenantId, email, role)` (cf. lib/auth/memberships.ts)
// qui est appelé par le parent (ProfileWorkspaceSection). Ce composant
// ne touche pas l'API lui-même : il rend son `onSubmit({ email, role })`
// et se ferme.
//
// Accessibilité : `role="dialog"`, `aria-modal="true"`, fermeture
// par Echap, focus piégé dans le formulaire tant que la modale
// est ouverte.
//
// Rôle sélectionné : owner / admin / member / guest. La liste vient
// de `MEMBERSHIP_ROLES_UI` (config) pour rester alignée avec le
// contrat.
//
// Pas de magic link custom dans ce brief : l'invitation envoie un
// email via Supabase Auth `admin.inviteUserByEmail()`. Le composant
// n'envoie rien — il remonte l'intention.

import { useEffect, useRef, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { MEMBERSHIP_ROLES_UI } from '../../_config/cms/memberships';
import type { MembershipRole } from '../lib/tenant/contract';

export interface InviteMemberProps {
  /** Modale visible. */
  open: boolean;
  /** Nom du tenant (affichage uniquement). */
  tenantLabel: string;
  /** Pré-sélection du rôle (par défaut : 'member'). */
  defaultRole?: MembershipRole;
  /** Désactivé pendant un envoi en cours. */
  busy?: boolean;
  /** Ferme la modale. */
  onClose: () => void;
  /** Remonte l'intention au caller. Le caller appelle inviterMembre(). */
  onSubmit: (input: { email: string; role: MembershipRole }) => void;
}

export function InviteMember(props: InviteMemberProps): React.ReactNode | null {
  const { open, tenantLabel, defaultRole = 'member', busy = false, onClose, onSubmit } = props;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail('');
      setRole(defaultRole);
      setError(null);
      // Focus le champ email à l'ouverture.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, defaultRole]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email requis.');
      return;
    }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!ok) {
      setError('Email invalide.');
      return;
    }
    setError(null);
    onSubmit({ email: trimmed, role });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Inviter un membre dans ${tenantLabel}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="invite-member-modal"
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 p-4 rounded-lg min-w-[360px] max-w-[480px]"
        style={{
          background: 'var(--theme-surface)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-window)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <div className="text-sm font-semibold">Inviter un membre</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] opacity-70">
          Le membre recevra un email standard de Supabase Auth. Il
          accepte, et sa membership passe <code>active</code> à
          l'arrivée.
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            Email
          </span>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="membre@example.com"
            disabled={busy}
            className="px-2 py-1.5 rounded-md text-[12px] outline-none"
            style={{
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
            }}
            aria-label="Adresse email du membre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
            Rôle
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MembershipRole)}
            disabled={busy}
            className="px-2 py-1.5 rounded-md text-[12px] outline-none"
            style={{
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
            }}
            aria-label="Rôle du membre"
          >
            {MEMBERSHIP_ROLES_UI.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.description}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <div
            className="text-[11px] px-2 py-1.5 rounded"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--theme-danger, #ef4444)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-[11px] font-medium"
            style={{
              background: 'var(--theme-surface-hover)',
              color: 'var(--theme-text-muted)',
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold"
            style={{
              background: 'var(--theme-accent)',
              color: '#fff',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'Envoi…' : 'Envoyer l\'invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}
