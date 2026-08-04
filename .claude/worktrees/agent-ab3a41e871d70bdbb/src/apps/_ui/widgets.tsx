/** Extra shared widgets for Coach OS apps — used across distinct app layouts */
import React from 'react';

export function Avatar({ name, accent = 'var(--theme-accent)' }: { name: string; accent?: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
      style={{ background: accent }}
    >
      {initials}
    </div>
  );
}

export function Dot({ tone = 'ok' }: { tone?: 'ok' | 'warn' | 'danger' | 'idle' }) {
  const c = { ok: '#16a34a', warn: '#d97706', danger: '#dc2626', idle: '#a8a29e' }[tone];
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: c }} />;
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${on ? 'bg-[var(--theme-accent)]' : 'bg-stone-300'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export function ProgressRow({ label, value, hint, accent = 'var(--theme-accent)' }: {
  label: string; value: number; hint?: string; accent?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <span className="text-xs font-semibold text-stone-500 tabular-nums">{hint ?? `${v}%`}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: accent }} />
      </div>
    </div>
  );
}

export function KanbanBoard({ columns }: { columns: { title: string; accent?: string; items: React.ReactNode[] }[] }) {
  return (
    <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col min-h-0 bg-[var(--canvas)] rounded-xl border border-[var(--panel-border-subtle)]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--panel-border-subtle)]">
            <span className="w-2 h-2 rounded-full" style={{ background: col.accent ?? 'var(--theme-accent)' }} />
            <span className="text-[12px] font-bold uppercase tracking-wide text-stone-500">{col.title}</span>
            <span className="ml-auto text-[11px] font-semibold text-stone-400">{col.items.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 flex flex-col gap-2.5">
            {col.items}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanbanCard({ title, meta, accent, onClick }: { title: string; meta?: string; accent?: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg border border-[var(--panel-border)] p-3 shadow-sm ${onClick ? 'hover:border-[var(--theme-accent)] hover:shadow-md transition-all cursor-pointer' : ''}`}
    >
      {accent && <span className="block w-8 h-1 rounded-full mb-2" style={{ background: accent }} />}
      <div className="text-sm font-semibold text-stone-800 leading-snug">{title}</div>
      {meta && <div className="text-xs text-stone-400 mt-1">{meta}</div>}
    </Comp>
  );
}

/** Simple data table — rows are optionally clickable (opens a detail page) */
export function Table({ head, rows, onRowClick }: { head: string[]; rows: React.ReactNode[][]; onRowClick?: (index: number) => void }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-stone-400">
            {head.map((h, i) => <th key={i} className="font-semibold px-4 py-2.5">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
              className={`border-t border-[var(--hairline)] hover:bg-stone-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {r.map((cell, j) => <td key={j} className="px-4 py-3 text-stone-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal funnel row */
export function FunnelStep({ label, value, pct, accent = 'var(--theme-accent)' }: {
  label: string; value: string; pct: number; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm font-medium text-stone-600 shrink-0">{label}</div>
      <div className="flex-1 h-9 rounded-lg bg-stone-100 overflow-hidden relative">
        <div className="h-full rounded-lg flex items-center px-3 text-xs font-bold text-white transition-all duration-500"
          style={{ width: `${Math.max(12, pct)}%`, background: accent }}>
          {value}
        </div>
      </div>
      <div className="w-12 text-right text-xs font-semibold text-stone-400 tabular-nums">{pct}%</div>
    </div>
  );
}
