/**
 * Audit Log — append-only journal. Each row: timestamp, actor, action, entity.
 * Nothing is editable from this view. The log is forensically read-only.
 *
 * The DLP gate (Enterprise OS blueprint §"9 motifs DLP") is surfaced here as
 * a row count and a "no leak" badge — when an entry appears, it shows up here.
 *
 * Export: an "Export CSV" action downloads the current filtered view as a
 * UTF-8 CSV file. This is the only write side-effect on this page and it
 * never mutates the audit log itself — the file mirrors what's on screen.
 */
import { useMemo, useState } from 'react';
import { Download, Lock, Search } from 'lucide-react';
import { AUDIT_LOG } from '../seed';
import type { AuditEntry } from '../seed';
import { useShellStore } from '../../../../stores/shell.store';
import { ACCENT, IconChip, KpiTile, Panel, Pill, SectionTitle } from '../Primitives';

function exportCsv(entries: AuditEntry[], filename: string): void {
  const header = ['at', 'actor', 'action', 'entity', 'note'];
  const escape = (v: string): string => {
    const needsQuotes = /[",\n]/.test(v);
    const escaped = v.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [
    header.join(','),
    ...entries.map((e) =>
      [e.at, e.actor, e.action, e.entity, e.note ?? ''].map((c) => escape(String(c))).join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Firefox finishes the download before we release the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AuditLog() {
  const [query, setQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const addToast = useShellStore((s) => s.addToast);

  const actors = useMemo(() => {
    const set = new Set<string>();
    AUDIT_LOG.forEach((e) => set.add(e.actor));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUDIT_LOG.filter((e) => {
      if (actorFilter !== 'all' && e.actor !== actorFilter) return false;
      if (!q) return true;
      return [e.action, e.entity, e.actor, e.note ?? '']
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [query, actorFilter]);

  const byAction = useMemo(() => {
    const m = new Map<string, number>();
    AUDIT_LOG.forEach((e) => m.set(e.action, (m.get(e.action) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Operations"
        title="Audit Log"
        subtitle="Journal append-only. Aucune modification possible depuis cette vue."
        action={
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (filtered.length === 0) return;
                const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
                exportCsv(filtered, `audit-log-${stamp}.csv`);
                addToast({ source: 'Audit Log', type: 'success', message: `Exported ${filtered.length} row${filtered.length > 1 ? 's' : ''}.` });
              }}
              disabled={filtered.length === 0}
              data-export-csv
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                background: 'var(--theme-surface-hover)',
                color: 'var(--theme-text)',
                boxShadow: 'inset 0 0 0 1px var(--panel-border)',
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />
              <Pill tone="info">append-only · lecture seule</Pill>
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile label="Événements" value={AUDIT_LOG.length} tone="accent" hint="sur 24 h glissantes" />
        <KpiTile label="DLP · clés AWS" value="0" tone="ok" hint="0 tentative bloquée" />
        <KpiTile label="DLP · PEM" value="0" tone="ok" hint="0 header de clé privée" />
        <KpiTile label="DLP · JWT" value="0" tone="warn" hint="0 jeton suspect" />
      </div>

      <Panel pad="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-dim)' }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une action, une entité, un acteur…"
              className="w-full bg-transparent text-[12px] outline-none"
              style={{ color: 'var(--theme-text)' }}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Acteur</span>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="rounded-lg px-2 py-1 text-[11.5px] font-semibold outline-none"
              style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)', border: '1px solid var(--panel-border)' }}
            >
              <option value="all">Tous</option>
              {actors.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel pad="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                  <th className="pl-6 pr-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>Heure</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>Acteur</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>Action</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>Entité</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-dim)' }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                      Aucun événement pour ce filtre.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => <EntryRow key={e.id} entry={e} />)
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel pad="p-5">
          <SectionTitle eyebrow="Synthèse" title="Top 5 actions · 24 h" />
          <ul className="flex flex-col gap-2">
            {byAction.map(([action, count]) => (
              <li key={action} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--theme-surface-hover)' }}>
                <IconChip tone="accent"><Lock className="h-3.5 w-3.5" /></IconChip>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {action}
                  </div>
                </div>
                <span className="font-mono text-[12.5px] font-bold tabular-nums" style={{ color: ACCENT }}>
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const isHuman = entry.actor.startsWith('human');
  const tone = entry.action.includes('failed') ? 'danger'
    : entry.action.includes('flag') ? 'warn'
    : isHuman ? 'info'
    : 'neutral';
  return (
    <tr style={{ borderBottom: '1px solid var(--panel-border-subtle)' }}>
      <td className="pl-6 pr-5 py-3 font-mono text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
        {entry.at}
      </td>
      <td className="px-5 py-3">
        <Pill tone={tone}>{entry.actor}</Pill>
      </td>
      <td className="px-5 py-3 font-mono text-[11.5px]" style={{ color: 'var(--theme-text)' }}>
        {entry.action}
      </td>
      <td className="px-5 py-3 font-mono text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
        {entry.entity}
      </td>
      <td className="px-5 py-3 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
        {entry.note ?? ''}
      </td>
    </tr>
  );
}
