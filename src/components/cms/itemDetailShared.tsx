/** itemDetailShared — presentational helpers shared by every per-app item detail.
 *  Every helper pulls its colors from the runtime CSS theme variables so a
 *  page looks right under any of the 12 themes (light and dark). */

import type { ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

export function BackAffordance({
  label,
  onBack,
  accent,
}: {
  label: string;
  onBack: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="group inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-colors"
      style={{ color: accent ?? 'var(--theme-muted)' }}
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </button>
  );
}

export function PrevNextFooter({
  def,
  index,
  total,
  prev,
  next,
  onNavigate,
}: {
  def: CmsCollectionDef;
  index: number;
  total: number;
  prev?: CmsItem;
  next?: CmsItem;
  onNavigate: (itemId: string) => void;
}) {
  const labelPrev = prev ? String(prev[def.titleField]) : 'Start';
  const labelNext = next ? String(next[def.titleField]) : 'End';
  return (
    <div
      className="flex items-center justify-between px-4 py-3 mt-8"
      style={{
        background: 'var(--canvas)',
        borderTop: '1px solid var(--panel-border-subtle)',
      }}
    >
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onNavigate(prev.id)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: 'var(--theme-muted)' }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="max-w-[16ch] truncate">{labelPrev}</span>
      </button>
      <span
        className="text-[11px] tabular-nums tracking-wider uppercase font-semibold"
        style={{ color: 'var(--theme-muted)' }}
      >
        {index + 1} / {total}
      </span>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onNavigate(next.id)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: 'var(--theme-muted)' }}
      >
        <span className="max-w-[16ch] truncate">{labelNext}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function PillBadge({
  children,
  accent,
  tone = 'soft',
}: {
  children: ReactNode;
  accent: string;
  tone?: 'soft' | 'solid';
}) {
  const bg = tone === 'solid' ? accent : `${accent}1f`;
  const fg = tone === 'solid' ? '#ffffff' : accent;
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: bg,
        color: fg,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </span>
  );
}

/** Compose a field value as text or currency. Returns the same placeholder
 *  shape the previous DynamicPageView used — keeps CMS field definitions
 *  from leaking into app code. */
export function formatField(value: unknown, type: 'text' | 'longtext' | 'badge' | 'date' | 'currency' | 'number'): ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: 'var(--theme-muted)', opacity: 0.4 }}>—</span>;
  }
  if (type === 'currency') return `$${Number(value).toLocaleString('en-US')}`;
  if (type === 'date' && typeof value === 'string') {
    // Render ISO-ish dates more legibly. Falls back to the string itself if unparseable.
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    }
  }
  return String(value);
}
