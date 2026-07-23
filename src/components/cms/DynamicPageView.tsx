/** DynamicPageView — the "dynamic page" half of the Wix CMS pattern: ONE template
 *  bound to whichever item is open, shared across every item in EVERY collection.
 *  Each collection's own accent + field types give the page a distinct identity
 *  (Clients reads as a sanctuary vault, Invoices as a ledger, Deploys as a console)
 *  without needing a bespoke template per app — the data shape drives the look. */
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsField } from '../../lib/cms/types';
import { badgeTone } from '../../lib/badgeTone';

interface DynamicPageViewProps {
  collectionId: string;
  itemId: string;
  onBack: () => void;
  onNavigate: (itemId: string) => void;
}

function formatFieldValue(value: unknown, type: CmsField['type']): ReactNode {
  if (value === undefined || value === null || value === '') return <span className="text-stone-300">—</span>;
  if (type === 'currency') return `$${Number(value).toLocaleString('en-US')}`;
  return String(value);
}

export function DynamicPageView({ collectionId, itemId, onBack, onNavigate }: DynamicPageViewProps) {
  const def = useCmsStore(s => s.collections[collectionId]);
  const items = useCmsStore(s => s.items[collectionId]) ?? [];
  const index = items.findIndex(it => it.id === itemId);
  const item = items[index];

  if (!def || !item) return null;

  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;
  const badgeValue = def.badgeField ? item[def.badgeField] : undefined;

  const heroField = def.fields.find(f => f.type === 'number') ?? def.fields.find(f => f.type === 'currency');
  const skipKeys = new Set([def.subtitleField, def.badgeField, heroField?.key].filter(Boolean) as string[]);
  const gridFields = def.fields.filter(f => f.type !== 'longtext' && !skipKeys.has(f.key));
  const proseFields = def.fields.filter(f => f.type === 'longtext' && !skipKeys.has(f.key));

  const prev = items[index - 1];
  const next = items[index + 1];
  const initial = title.charAt(0).toUpperCase() || '?';

  return (
    <div className="p-7">
      <button onClick={onBack} className="group inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" /> All {def.name.toLowerCase()}
      </button>

      <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden">
        {/* Header — accent glow, seal, hero metric */}
        <div
          className="relative px-7 pt-7 pb-6 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${def.accent}14 0%, transparent 65%)` }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none"
            style={{ background: `${def.accent}22` }}
          />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0 shadow-sm"
                style={{ background: `${def.accent}1f`, color: def.accent }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: def.accent }}>{def.singular}</span>
                  <ShieldCheck className="w-3 h-3 text-stone-300" aria-label="Zero-PII sanctuary" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 tracking-tight font-outfit truncate">{title}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
                  {badgeValue != null && badgeValue !== '' && (() => {
                    const tone = badgeTone(String(badgeValue));
                    return (
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {String(badgeValue)}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {heroField && (
              <div className="text-right shrink-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{heroField.label}</div>
                <div className="text-3xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: def.accent }}>
                  {formatFieldValue(item[heroField.key], heroField.type)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Field grid — two columns, real label/value hierarchy */}
        {gridFields.length > 0 && (
          <div className="grid grid-cols-2 gap-px bg-[var(--hairline)] border-y border-[var(--hairline)]">
            {gridFields.map(f => (
              <div key={f.key} className="bg-white px-6 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-0.5">{f.label}</div>
                <div className="text-sm font-medium text-stone-800">{formatFieldValue(item[f.key], f.type)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Long-form content — full-width prose, not crammed into a row */}
        {proseFields.map(f => {
          const value = item[f.key];
          if (value === undefined || value === null || value === '') return null;
          return (
            <div key={f.key} className="px-6 py-5 border-b border-[var(--hairline)] last:border-b-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-2">{f.label}</div>
              <p className="text-[13.5px] leading-relaxed text-stone-600 whitespace-pre-line">{String(value)}</p>
            </div>
          );
        })}

        {/* Prev/Next — same template, different bound item */}
        <div className="flex items-center justify-between px-3 py-3 bg-[var(--canvas)] border-t border-[var(--panel-border-subtle)]">
          <button
            disabled={!prev}
            onClick={() => prev && onNavigate(prev.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {prev ? String(prev[def.titleField]) : 'Start'}
          </button>
          <span className="text-[11px] text-stone-300 tabular-nums">{index + 1} / {items.length}</span>
          <button
            disabled={!next}
            onClick={() => next && onNavigate(next.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
          >
            {next ? String(next[def.titleField]) : 'End'} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
