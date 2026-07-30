/**
 * FinanceDetailPage.tsx — KPI strip + dense data table (trust serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 11
 */
import { ArrowLeft, Banknote } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface FinanceDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  kpis: { label: string; value: string; delta?: string }[];
  rows: Record<string, string>[];
  fields: DetailField[];
}

interface FinanceDetailPageProps {
  item: FinanceDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function FinanceDetailPage({
  item,
  onBack,
  backLabel = 'Back to Finance',
}: FinanceDetailPageProps): JSX.Element {
  const columns = item.rows.length > 0 ? Object.keys(item.rows[0]!) : [];

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
            Finance
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{item.subtitle}</p>

        <section
          className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--panel-border)] sm:grid-cols-3"
          style={{ background: 'var(--panel-border)' }}
        >
          {item.kpis.map((k, i) => (
            <div key={i} className="p-5" style={{ background: 'var(--theme-surface)' }}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
                <Banknote className="h-3 w-3" /> {k.label}
              </div>
              <div className="mt-2 text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
                {k.value}
              </div>
              {k.delta ? (
                <div className="mt-1 text-xs text-stone-500">{k.delta}</div>
              ) : null}
            </div>
          ))}
        </section>

        {item.rows.length > 0 ? (
          <section
            className="mt-6 overflow-x-auto rounded-2xl border border-[var(--panel-border)]"
            style={{ background: 'var(--theme-surface)' }}
          >
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-stone-100 text-left text-[10px] uppercase tracking-wider text-stone-500">
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-bold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.rows.map((row, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-stone-800">{row[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </div>
  );
}
