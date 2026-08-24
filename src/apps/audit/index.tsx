// src/apps/audit/index.tsx
// Étend l'app Audit avec une section "Audit log" — la vue serveur
// des events générés par appendEvent() (campagne 2026-08-15).
//
// L'app Audit historique contient 6 grilles diagnostiques (maturité,
// arbitrage, contexte, données, automatabilité, ROI). On ajoute une
// 7ᵉ section "Journal" qui rend le composant AuditLogViewer, lequel
// lit la table `audit_events` (RLS: owners uniquement).

import { useState, type JSX } from 'react';
import { AuditApp } from './AuditApp';
import { AuditLogViewer } from '../../components/audit/AuditLogViewer';
import { useSessionStoreSafe } from './session-hook';

type Section = 'canon' | 'journal';

export function AuditAppEntry(): JSX.Element {
  const [section, setSection] = useState<Section>('canon');
  const session = useSessionStoreSafe();
  const tenantId = (session?.tenantId ?? 'demo') as string;

  return (
    <div className="flex flex-col h-full">
      <nav
        className="flex items-center gap-1 px-4 py-2 border-b"
        style={{ borderColor: 'var(--panel-border-subtle)' }}
        aria-label="Sections de l'app Audit"
      >
        <button
          type="button"
          onClick={() => setSection('canon')}
          aria-pressed={section === 'canon'}
          className="rounded px-3 py-1.5 text-[12px] font-bold border"
          style={
            section === 'canon'
              ? { background: 'var(--theme-accent)', color: 'white', borderColor: 'var(--theme-accent)' }
              : { background: 'transparent', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }
          }
        >
          Canon diagnostique
        </button>
        <button
          type="button"
          onClick={() => setSection('journal')}
          aria-pressed={section === 'journal'}
          className="rounded px-3 py-1.5 text-[12px] font-bold border"
          style={
            section === 'journal'
              ? { background: 'var(--theme-accent)', color: 'white', borderColor: 'var(--theme-accent)' }
              : { background: 'transparent', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }
          }
        >
          Journal d'audit
        </button>
      </nav>

      <div className="flex-1 overflow-auto">
        {section === 'canon' ? <AuditApp /> : <AuditLogViewer tenantId={tenantId} />}
      </div>
    </div>
  );
}

// Re-export pour les imports existants.
export { AuditApp } from './AuditApp';

export default AuditAppEntry;