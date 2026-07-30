/**
 * MarketplaceDetailPage.tsx — Bento 2x2 (glassmorphism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 7
 */
import { ArrowLeft, Package } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface MarketplaceDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  install: { installed: boolean; version: string; size: string };
  stats: { label: string; value: string }[];
  fields: DetailField[];
}

interface MarketplaceDetailPageProps {
  item: MarketplaceDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function MarketplaceDetailPage({
  item,
  onBack,
  backLabel = 'Back to Marketplace',
}: MarketplaceDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Marketplace
          </span>
        </div>

        <header className="mb-6 flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md backdrop-blur"
            style={{ background: 'var(--theme-accent)' }}
            aria-hidden="true"
          >
            <Package className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
            <h1 tabIndex={-1} className="mt-2 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {item.title}
            </h1>
            <p className="text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {/* screenshots tile (spans 2 cols) */}
          <section
            className="col-span-2 h-40 rounded-2xl border border-[var(--panel-border)] backdrop-blur"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent)',
            }}
            aria-label="Screenshots preview"
          >
            <div className="flex h-full items-center justify-center text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Screenshots
            </div>
          </section>

          {/* install state */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-4 backdrop-blur"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Install
            </div>
            <div className="mt-2 text-lg font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
              {item.install.installed ? 'Installed' : 'Available'}
            </div>
            <div className="mt-1 text-xs text-[var(--theme-text-muted)]">
              v{item.install.version} · {item.install.size}
            </div>
          </section>

          {/* stats */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-4 backdrop-blur"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Stats
            </div>
            <dl className="mt-2 space-y-1">
              {item.stats.map((s) => (
                <div key={s.label} className="flex justify-between text-[12px]">
                  <dt className="text-[var(--theme-text-muted)]">{s.label}</dt>
                  <dd className="font-semibold text-[var(--theme-text)]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
