/**
 * ClientsDetailPage.tsx — Client portrait + 3-pill status stack (claymorphism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 5
 */
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ClientsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  portrait: { initials: string; gradient: string };
  pills: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }[];
  fields: DetailField[];
}

interface ClientsDetailPageProps {
  item: ClientsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const TONE_CLASS: Record<NonNullable<ClientsDetailItem['pills'][number]['tone']>, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-stone-50 text-stone-700 border-stone-200',
};

export function ClientsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Clients',
}: ClientsDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
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
            Client
          </span>
        </div>

        <section className="mb-6 flex flex-col items-center text-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold text-white shadow-lg"
            style={{ background: item.portrait.gradient }}
            aria-hidden="true"
          >
            {item.portrait.initials}
          </div>
          <h1 tabIndex={-1} className="mt-5 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
            {item.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>
          <span
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
          >
            <UserCircle2 className="h-3 w-3" /> {item.status}
          </span>
        </section>

        <ul className="space-y-2">
          {item.pills.map((p, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${TONE_CLASS[p.tone]}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider">{p.label}</span>
              <span className="text-[14px] font-semibold">{p.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
