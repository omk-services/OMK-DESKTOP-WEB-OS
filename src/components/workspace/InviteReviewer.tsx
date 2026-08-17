// src/components/workspace/InviteReviewer.tsx
// Modal d'invitation reviewer.
//
// Cosmetique uniquement : la sélection est remontée au caller qui fait
// l'appel réel `inviterMembre(...)` côté MEMBERSHIPS. Ce composant
// n'envoie rien par lui-même.

import { useState } from 'react';
import { X } from 'lucide-react';
import type { MembershipLite } from '../../lib/workspace/types';

export interface InviteReviewerProps {
  open: boolean;
  members: ReadonlyArray<MembershipLite>;
  onClose: () => void;
  onSubmit: (userIds: string[]) => void;
}

export function InviteReviewer(props: InviteReviewerProps): React.ReactNode | null {
  const { open, members, onClose, onSubmit } = props;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggle = (uid: string): void => {
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelected(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Inviter des reviewers"
    >
      <div
        className="flex flex-col gap-3 p-4 rounded-lg min-w-[360px] max-w-[480px]"
        style={{
          background: 'var(--theme-surface)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-window)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Inviter des reviewers</div>
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
          Sélectionnez les membres à inviter comme reviewers. Chacun recevra
          une notification par email (Supabase Auth).
        </div>

        <ul className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {members.length === 0 ? (
            <li className="text-[11px] italic" style={{ color: 'var(--theme-text-dim)' }}>
              Aucun membre actif dans ce tenant.
            </li>
          ) : (
            members.map((m) => (
              <li key={m.userId}>
                <label
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] cursor-pointer"
                  style={{
                    background: selected.has(m.userId) ? 'var(--theme-surface-hover)' : 'transparent',
                    color: 'var(--theme-text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(m.userId)}
                    onChange={() => toggle(m.userId)}
                  />
                  <span className="font-mono">{m.userId.slice(0, 8)}</span>
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      background: 'var(--theme-accent-soft)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    {m.role}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold"
            style={{
              background: 'var(--theme-surface-hover)',
              color: 'var(--theme-text-muted)',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onSubmit([...selected]);
              setSelected(new Set());
            }}
            disabled={selected.size === 0}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold disabled:opacity-50"
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            Inviter ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}