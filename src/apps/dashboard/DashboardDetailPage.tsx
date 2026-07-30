/**
 * DashboardDetailPage.tsx — Dashboard in-app detail (hero metric + KPI grid + activity).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 1
 */
import { ArrowLeft, LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface DashboardDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  /** Big number — shown in the 56px hero metric block. */
  heroMetric: { value: string; label: string };
  kpis: { label: string; value: string; delta?: string }[];
  activity: { at: string; text: string }[];
  fields: DetailField[];
}

interface DashboardDetailPageProps {
  item: DashboardDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function DashboardDetailPage({
  item,
  onBack,
  backLabel = 'Back to Dashboard',
}: DashboardDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
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
            Dashboard
          </span>
        </div>

        {/* Hero metric */}
        <section
          className="mb-6 rounded-2xl border border-[var(--panel-border)] p-6"
          style={{ background: 'var(--theme-surface)' }}
        >
          <div className="mb-2 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: 'var(--theme-accent)' }}
              aria-hidden="true"
            >
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
          </div>
          <h1 tabIndex={-1} className="text-[56px] font-extrabold leading-none text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {item.heroMetric.value}
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-text-muted)]">{item.heroMetric.label}</p>
          <p className="mt-4 text-lg text-[var(--theme-text)]">{item.title}</p>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
        </section>

        {/* KPI grid 2-col dense, 4 cards */}
        <section
          className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--panel-border)] sm:grid-cols-2"
          style={{ background: 'var(--panel-border)' }}
        >
          {item.kpis.map((k) => (
            <div key={k.label} className="p-4" style={{ background: 'var(--theme-surface)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                {k.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
                  {k.value}
                </div>
                {k.delta ? (
                  <div className="text-xs font-semibold text-[var(--theme-text-muted)]">{k.delta}</div>
                ) : null}
              </div>
            </div>
          ))}
        </section>

        {/* Activity timeline */}
        <section
          className="rounded-2xl border border-[var(--panel-border)] p-5"
          style={{ background: 'var(--theme-surface)' }}
        >
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
            Activity
          </h2>
          <ol className="space-y-3">
            {item.activity.map((a, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="shrink-0 font-mono text-[11px] text-[var(--theme-text-dim)]">{a.at}</span>
                <span className="text-[var(--theme-text)]">{a.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
