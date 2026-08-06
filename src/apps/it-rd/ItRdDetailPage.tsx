/**
 * ItRdDetailPage.tsx — Terminal-style logs + deploys (mono, cyberpunk).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 4
 */
import { ArrowLeft, Terminal } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ItRdDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  logs: { ts: string; level: 'info' | 'warn' | 'error'; line: string }[];
  deploys: { sha: string; at: string; status: 'live' | 'rolled-back' | 'building' }[];
  fields: DetailField[];
}

interface ItRdDetailPageProps {
  item: ItRdDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const LEVEL_COLOR: Record<ItRdDetailItem['logs'][number]['level'], string> = {
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
};

const DEPLOY_BADGE: Record<ItRdDetailItem['deploys'][number]['status'], string> = {
  live: 'bg-emerald-500/20 text-emerald-300',
  'rolled-back': 'bg-rose-500/20 text-rose-300',
  building: 'bg-amber-500/20 text-amber-300',
};

export function ItRdDetailPage({
  item,
  onBack,
  backLabel = 'Back to IT / R&D',
}: ItRdDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-5xl px-6 py-8 font-mono">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--theme-text-muted)] transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--theme-text-dim)]">
            it-rd
          </span>
        </div>

        <h1 tabIndex={-1} className="font-mono text-xl font-bold text-[var(--theme-text)]">
          <Terminal className="mr-2 inline h-5 w-5" />
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section
            className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-bg)] p-5"
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              logs.stream
            </h2>
            <pre className="overflow-x-auto text-[12px] leading-relaxed text-[var(--theme-text)]">
              {item.logs.map((l, i) => (
                <div key={i} className={LEVEL_COLOR[l.level]}>
                  <span className="text-[var(--theme-text-muted)]">{l.ts}</span> {l.line}
                </div>
              ))}
            </pre>
          </section>

          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              deploys
            </h2>
            <ul className="space-y-2">
              {item.deploys.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[var(--panel-border)] px-3 py-2"
                >
                  <code className="text-[12px] text-[var(--theme-text)]">{d.sha}</code>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${DEPLOY_BADGE[d.status]}`}>
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
