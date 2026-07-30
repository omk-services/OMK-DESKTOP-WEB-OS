/**
 * LegalDetailPage.tsx — Contract accordion (trust serif).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 12
 */
import { ArrowLeft, ChevronDown, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { DetailField } from '../../components/DetailPage';

export interface LegalDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  clauses: { title: string; body: string }[];
  fields: DetailField[];
}

interface LegalDetailPageProps {
  item: LegalDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function LegalDetailPage({
  item,
  onBack,
  backLabel = 'Back to Legal',
}: LegalDetailPageProps): JSX.Element {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
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
            Legal
          </span>
        </div>

        <h1 tabIndex={-1} className="text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm italic text-stone-500">{item.subtitle}</p>
        <span
          className="mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
        >
          {item.status}
        </span>

        <ol className="mt-8 space-y-2">
          {item.clauses.map((c, i) => {
            const isOpen = open.has(i);
            return (
              <li
                key={i}
                className="rounded-2xl border border-[var(--panel-border)]"
                style={{ background: 'var(--theme-surface)' }}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
                    {c.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-stone-700">
                    {c.body}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
