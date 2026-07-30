/**
 * GrowthDetailPage.tsx — Funnel viz + experiment table (vibrant-block).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 9
 */
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface GrowthDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  funnel: { stage: string; pct: number; absolute: number }[];
  experiments: { name: string; variant: string; lift: string; status: 'live' | 'done' | 'draft' }[];
  fields: DetailField[];
}

interface GrowthDetailPageProps {
  item: GrowthDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const EXP_BADGE: Record<NonNullable<GrowthDetailItem['experiments'][number]['status']>, string> = {
  live: 'bg-emerald-500 text-white',
  done: 'bg-stone-200 text-stone-800',
  draft: 'bg-amber-500 text-stone-900',
};

export function GrowthDetailPage({
  item,
  onBack,
  backLabel = 'Back to Growth',
}: GrowthDetailPageProps): JSX.Element {
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
            Growth
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section
            className="rounded-2xl border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <TrendingUp className="h-3.5 w-3.5" /> Funnel
            </h2>
            <ol className="space-y-2">
              {item.funnel.map((f, i) => (
                <li key={i}>
                  <div className="flex justify-between text-[12px] font-bold uppercase">
                    <span className="text-[var(--theme-text)]">{f.stage}</span>
                    <span className="text-[var(--theme-text-muted)]">
                      {f.absolute} · {f.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, f.pct)}%`,
                        background: 'var(--theme-accent)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="rounded-2xl border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Experiments
            </h2>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--theme-text-dim)]">
                  <th className="py-1 font-bold">Name</th>
                  <th className="font-bold">Variant</th>
                  <th className="font-bold">Lift</th>
                  <th className="font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {item.experiments.map((e, i) => (
                  <tr key={i} className="border-t border-[var(--panel-border)]">
                    <td className="py-2 font-semibold text-[var(--theme-text)]">{e.name}</td>
                    <td className="text-[var(--theme-text-muted)]">{e.variant}</td>
                    <td className="font-mono text-[var(--theme-text)]">{e.lift}</td>
                    <td>
                      <span className={`rounded-none px-1.5 py-0.5 text-[10px] font-bold uppercase ${EXP_BADGE[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
