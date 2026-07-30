/**
 * TasksDetailPage.tsx — Task as prose (editorial, serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 6
 */
import { ArrowLeft, CalendarClock } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface TasksDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  dueAt: string;
  body: string;
  fields: DetailField[];
}

interface TasksDetailPageProps {
  item: TasksDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function TasksDetailPage({
  item,
  onBack,
  backLabel = 'Back to Tasks',
}: TasksDetailPageProps): JSX.Element {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <article className="mx-auto max-w-2xl px-6 py-12">
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
            Task
          </span>
        </div>

        <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          <CalendarClock className="h-3 w-3" /> Due {item.dueAt}
        </p>
        <h1
          tabIndex={-1}
          className="mb-3 text-3xl font-bold leading-tight text-stone-900"
          style={{ fontFamily: 'var(--theme-font-display)' }}
        >
          {item.title}
        </h1>
        <p className="mb-8 text-sm italic text-stone-500">{item.subtitle}</p>

        <span
          className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
        >
          {item.status}
        </span>

        <div className="prose prose-stone mt-8 max-w-none text-[15px] leading-relaxed text-stone-800">
          {item.body}
        </div>
      </article>
    </div>
  );
}
