// src/components/audit/AuditLogViewer.tsx
// Vue lecture seule de l'audit log (campagne 2026-08-15).
//
// Rendue accessible depuis l'app Audit (`src/apps/audit/index.tsx`).
// Trois exigences :
//   1. **Lecture seule** : la RLS refuse UPDATE/DELETE côté serveur.
//   2. **Filtres** : par actor, action, target_type, et une fenêtre
//      temporelle.
//   3. **Pagination 50** : on charge les 50 derniers, on offre un
//      bouton "Charger plus" pour étendre.
//
// En mode démo (Supabase non configuré), la source est le buffer
// in-memory du logger.

import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Filter, AlertTriangle } from 'lucide-react';
import { listAuditEvents, type AuditEventRow } from '../../lib/audit/queries';
import type { AuditAction } from '../../lib/audit/event';

const PAGE_SIZE = 50;

const ALL_ACTIONS: readonly AuditAction[] = [
  'item.create', 'item.update', 'item.delete',
  'proposal.create', 'proposal.approve', 'proposal.reject',
  'auth.signin', 'auth.signup', 'auth.signout',
  'member.invite', 'member.accept', 'member.revoke', 'member.role_change',
  'workspace.branch_create', 'workspace.merge',
  'workspace.pr_open', 'workspace.pr_review', 'workspace.pr_merge',
  'quota.exceeded', 'observer.event',
];

export interface AuditLogViewerProps {
  /** Tenant à observer. Si vide, on lit sans filtre (mode debug). */
  tenantId?: string;
}

// Pas d'annotation de retour : React 19 a retire le namespace global `JSX`,
// et TypeScript infere le type correctement. Ecrire `React.JSX.Element` ici
// obligerait a importer React uniquement pour un type.
export function AuditLogViewer({ tenantId = 'demo' }: AuditLogViewerProps) {
  const [rows, setRows] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // Filtres
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [targetType, setTargetType] = useState('');

  const filters = useMemo(
    () => ({
      ...(actorId ? { actorId } : {}),
      ...(action ? { action } : {}),
      ...(targetType ? { targetType } : {}),
    }),
    [actorId, action, targetType],
  );

  const refresh = async (next = 0): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await listAuditEvents(
        tenantId,
        filters,
        { limit: PAGE_SIZE + next },
      );
      setRows(fetched);
      setOffset(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, filters]);

  const canLoadMore = rows.length === PAGE_SIZE + offset;

  return (
    <div className="p-6 flex flex-col gap-4" data-testid="audit-log-viewer">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
          Audit log
          <span className="ml-2 text-xs font-mono" style={{ color: 'var(--theme-text-dim)' }}>
            tenant={tenantId || '*'} · {rows.length} ligne{rows.length > 1 ? 's' : ''}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => void refresh(offset)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wider border"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            color: 'var(--theme-text)',
          }}
          aria-label="Rafraîchir l'audit log"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Rafraîchir
        </button>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3" style={{ color: 'var(--theme-text-dim)' }} aria-hidden />
        <input
          type="text"
          placeholder="actor (ex. agent:alice)"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          className="rounded border px-2 py-1 text-[11px] font-mono"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            color: 'var(--theme-text)',
          }}
        />
        <select
          value={action}
          onChange={(e) => setAction((e.target.value || '') as AuditAction | '')}
          className="rounded border px-2 py-1 text-[11px] font-mono"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            color: 'var(--theme-text)',
          }}
        >
          <option value="">— action —</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="target_type (ex. item)"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="rounded border px-2 py-1 text-[11px] font-mono"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            color: 'var(--theme-text)',
          }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded border px-3 py-2 text-[12px]"
          style={{
            background: 'rgba(220,38,38,0.08)',
            borderColor: '#fca5a5',
            color: '#b91c1c',
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {rows.length === 0 && !loading ? (
        <div
          className="text-center text-[12px] py-8 rounded border"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border-subtle)',
            color: 'var(--theme-text-dim)',
          }}
        >
          Aucun événement pour ces filtres.
        </div>
      ) : (
        <ul className="flex flex-col gap-1" role="list">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded border px-3 py-2 font-mono text-[11.5px] flex flex-wrap items-center gap-3"
              style={{
                background: 'var(--theme-surface)',
                borderColor: 'var(--panel-border-subtle)',
                color: 'var(--theme-text)',
              }}
            >
              <span className="shrink-0" style={{ color: 'var(--theme-text-dim)' }}>
                {formatTime(r.createdAt)}
              </span>
              <span className="font-bold shrink-0" style={{ color: actionColor(r.action) }}>
                {r.action}
              </span>
              <span className="shrink-0">
                <span style={{ color: 'var(--theme-text-dim)' }}>par</span>{' '}
                <span style={{ color: 'var(--theme-text)' }}>{r.actorId ?? '—'}</span>
                {r.actorRole ? (
                  <span className="ml-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>
                    ({r.actorRole})
                  </span>
                ) : null}
              </span>
              {r.targetType ? (
                <span className="shrink-0" style={{ color: 'var(--theme-text-dim)' }}>
                  sur{' '}
                  <span style={{ color: 'var(--theme-text)' }}>
                    {r.targetType}
                    {r.targetId ? `:${r.targetId}` : ''}
                  </span>
                </span>
              ) : null}
              {r.observerSource ? (
                <span
                  className="ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: 'rgba(99,102,241,0.14)',
                    color: '#4338ca',
                    border: '1px solid #c7d2fe',
                  }}
                >
                  obs:{r.observerSource}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canLoadMore && (
        <button
          type="button"
          onClick={() => void refresh(offset + PAGE_SIZE)}
          className="self-center rounded px-3 py-1.5 text-[12px] font-bold border"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
            color: 'var(--theme-text)',
          }}
        >
          Charger {PAGE_SIZE} de plus
        </button>
      )}
    </div>
  );
}

function actionColor(action: string): string {
  if (action.startsWith('item.')) return '#0ea5e9';
  if (action.startsWith('proposal.')) return '#7c3aed';
  if (action.startsWith('auth.')) return '#f59e0b';
  if (action.startsWith('member.')) return '#ec4899';
  if (action.startsWith('workspace.')) return '#10b981';
  if (action.startsWith('quota.')) return '#b91c1c';
  if (action.startsWith('observer.')) return '#4338ca';
  return 'var(--theme-text)';
}

function formatTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}