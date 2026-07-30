/**
 * OperationsDetailPage.tsx — Runbook 2-col split + incident chips.
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 3
 */
import { ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface OperationsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  body: string;
  sidebar: { label: string; value: string }[];
  incidents: { severity: 'low' | 'medium' | 'high'; title: string; at: string }[];
  fields: DetailField[];
}

interface OperationsDetailPageProps {
  item: OperationsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const SEVERITY_BG: Record<OperationsDetailItem['incidents'][number]['severity'], string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function OperationsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Operations',
}: OperationsDetailPageProps): JSX.Element {
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
            Operations
          </span>
        </div>

        <h1 tabIndex={-1} className="text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            className="md:col-span-2 rounded-2xl border border-[var(--panel-border)] p-6"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <BookOpen className="h-3.5 w-3.5" /> Runbook
            </h2>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--theme-text)]">{item.body}</p>
          </article>

          <aside
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Meta
            </h2>
            <dl className="space-y-2">
              {item.sidebar.map((m) => (
                <div key={m.label} className="text-[13px]">
                  <dt className="text-[var(--theme-text-muted)]">{m.label}</dt>
                  <dd className="font-medium text-[var(--theme-text)]">{m.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {item.incidents.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              <AlertTriangle className="h-3.5 w-3.5" /> Incidents
            </h2>
            <ul className="space-y-2">
              {item.incidents.map((i, idx) => (
                <li
                  key={idx}
                  className={`rounded-xl border px-3 py-2 text-[13px] font-medium ${SEVERITY_BG[i.severity]}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span>{i.title}</span>
                    <span className="text-[11px] opacity-70">{i.at}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
