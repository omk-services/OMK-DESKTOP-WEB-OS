/** DynamicPageView — single integration point that delegates to the owning app.
 *
 *  Before: ONE generic template bound to every item in every collection across
 *  every sub-page. That is why "Professor X" in People and an invoice in Finance
 *  looked identical. The user's verdict was "je ne veux plus voir de page de
 *  détail basique" — and the spec ratifies per-app layouts.
 *
 *  After: this file resolves the owning app via itemDetailRegistry, mounts that
 *  app's <App>ItemDetail component, and only falls back to a generic-but-clean
 *  reading body if no component is registered yet. Theme colors come from the
 *  runtime CSS variables (no hardcoded neutrals).
 *
 *  Canon: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md
 */
import type { ReactNode } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsField } from '../../lib/cms/types';
import { badgeTone } from '../../lib/badgeTone';
import { getItemDetail, resolveAppIdForCollection, type ItemDetailProps } from './itemDetailRegistry';

interface DynamicPageViewProps {
  collectionId: string;
  itemId: string;
  onBack: () => void;
  onNavigate: (itemId: string) => void;
}

function formatFieldValue(value: unknown, type: CmsField['type']): ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: 'var(--theme-muted)', opacity: 0.4 }}>—</span>;
  }
  if (type === 'currency') return `$${Number(value).toLocaleString('en-US')}`;
  return String(value);
}

/** Generic fallback — only used when no per-app component is registered.
 *  Composed enough to be readable in light + dark themes, never the polished
 *  presentation. Every Coach OS app should replace it via registerItemDetail. */
function GenericItemDetail({ def, item, index, total, accent, onBack, prev, next, onNavigate }: ItemDetailProps) {
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : undefined;
  const badgeValue = def.badgeField ? item[def.badgeField] : undefined;
  const heroField = def.fields.find(f => f.type === 'number') ?? def.fields.find(f => f.type === 'currency');
  const skipKeys = new Set([def.subtitleField, def.badgeField, heroField?.key].filter(Boolean) as string[]);
  const gridFields = def.fields.filter(f => f.type !== 'longtext' && !skipKeys.has(f.key));
  const proseFields = def.fields.filter(f => f.type === 'longtext' && !skipKeys.has(f.key));
  const initial = title.charAt(0).toUpperCase() || '?';

  return (
    <div className="p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-xs font-semibold transition-colors mb-5"
        style={{ color: 'var(--theme-muted)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        All {def.name.toLowerCase()}
      </button>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        {/* Hero header */}
        <div
          className="relative px-7 pt-7 pb-6 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 65%)` }}
        >
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none"
            style={{ background: `${accent}22` }}
          />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0"
                style={{
                  background: `${accent}1f`,
                  color: accent,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
                    {def.singular}
                  </span>
                  <ShieldCheck className="w-3 h-3" style={{ color: 'var(--theme-muted)', opacity: 0.4 }} aria-hidden />
                </div>
                <h1 className="text-2xl font-bold tracking-tight font-outfit truncate" style={{ color: 'var(--theme-text)' }}>
                  {title}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {subtitle && <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
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
                <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-muted)' }}>
                  {heroField.label}
                </div>
                <div className="text-3xl font-extrabold leading-none mt-1 tabular-nums" style={{ color: accent }}>
                  {formatFieldValue(item[heroField.key], heroField.type)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Field grid */}
        {gridFields.length > 0 && (
          <div className="grid grid-cols-2 gap-px border-y" style={{ background: 'var(--hairline)', borderColor: 'var(--hairline)' }}>
            {gridFields.map(f => (
              <div key={f.key} className="px-6 py-3.5" style={{ background: 'var(--panel-solid)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--theme-muted)' }}>
                  {f.label}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  {formatFieldValue(item[f.key], f.type)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prose blocks */}
        {proseFields.map(f => {
          const value = item[f.key];
          if (value === undefined || value === null || value === '') return null;
          return (
            <div key={f.key} className="px-6 py-5 border-b last:border-b-0" style={{ borderColor: 'var(--hairline)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--theme-muted)' }}>
                {f.label}
              </div>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text)' }}>
                {String(value)}
              </p>
            </div>
          );
        })}

        {/* Prev / next */}
        <div
          className="flex items-center justify-between px-3 py-3 border-t"
          style={{ background: 'var(--canvas)', borderColor: 'var(--panel-border-subtle)' }}
        >
          <button
            disabled={!prev}
            onClick={() => prev && onNavigate(prev.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-muted)' }}
          >
            ◀ {prev ? String(prev[def.titleField]) : 'Start'}
          </button>
          <span className="text-[11px] tabular-nums" style={{ color: 'var(--theme-muted)' }}>
            {index + 1} / {total}
          </span>
          <button
            disabled={!next}
            onClick={() => next && onNavigate(next.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-muted)' }}
          >
            {next ? String(next[def.titleField]) : 'End'} ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export function DynamicPageView({ collectionId, itemId, onBack, onNavigate }: DynamicPageViewProps): import('react').ReactNode {
  const def = useCmsStore(s => s.collections[collectionId]);
  const items = useCmsStore(s => s.items[collectionId]) ?? [];
  const index = items.findIndex(it => it.id === itemId);
  const item = items[index];

  if (!def || !item) return null;

  const appId = resolveAppIdForCollection(collectionId);
  const AppComponent = appId ? getItemDetail(appId) : undefined;

  const props: ItemDetailProps = {
    def,
    item,
    index,
    total: items.length,
    accent: def.accent,
    onBack,
    prev: items[index - 1],
    next: items[index + 1],
    onNavigate,
  };

  if (AppComponent) {
    return <AppComponent {...props} />;
  }

  // No per-app detail registered for this collection — render the generic body.
  // It still works and respects the theme; it just isn't the canon layout.
  return <GenericItemDetail {...props} />;
}
