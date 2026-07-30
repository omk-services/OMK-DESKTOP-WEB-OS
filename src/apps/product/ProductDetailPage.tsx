/**
 * ProductDetailPage.tsx — Roadmap row + 2-col spec/channels (brutalism).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 8
 */
import { ArrowLeft, Map } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface ProductDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  roadmap: { stage: string; state: 'done' | 'doing' | 'todo' }[];
  spec: string;
  channels: { name: string; audience: string }[];
  fields: DetailField[];
}

interface ProductDetailPageProps {
  item: ProductDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const STAGE_BADGE: Record<NonNullable<ProductDetailItem['roadmap'][number]['state']>, string> = {
  done: 'bg-emerald-500 text-white',
  doing: 'bg-amber-500 text-stone-900',
  todo: 'bg-stone-200 text-stone-700',
};

export function ProductDetailPage({
  item,
  onBack,
  backLabel = 'Back to Product',
}: ProductDetailPageProps): JSX.Element {
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
            Product
          </span>
        </div>

        <h1 tabIndex={-1} className="text-2xl font-extrabold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
            <Map className="h-3.5 w-3.5" /> Roadmap
          </h2>
          <ol className="flex flex-wrap gap-2">
            {item.roadmap.map((r, i) => (
              <li
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-none border-2 border-stone-900 px-3 py-1.5 text-[11px] font-bold uppercase ${STAGE_BADGE[r.state]}`}
              >
                {r.stage}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            className="md:col-span-2 rounded-none border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Spec
            </h2>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--theme-text)]">{item.spec}</p>
          </article>
          <aside
            className="rounded-none border-2 border-stone-900 p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Channels
            </h2>
            <ul className="space-y-2">
              {item.channels.map((c, i) => (
                <li key={i} className="text-[13px]">
                  <div className="font-bold text-[var(--theme-text)]">{c.name}</div>
                  <div className="text-[var(--theme-text-muted)]">{c.audience}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
