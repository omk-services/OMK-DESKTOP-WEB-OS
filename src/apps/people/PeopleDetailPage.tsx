/**
 * PeopleDetailPage.tsx — People/Agents drill (3-column profile).
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 2
 *
 * D6 honest: the existing inline FleetDetail in PeopleApp.tsx:313-460 stays as
 * the field-source. The new file gives the layout signature + a11y contract.
 */
import { ArrowLeft, Users, type LucideIcon } from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface PeopleDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  initials: string;
  fields: DetailField[];
  squad: { name: string; color: string }[];
  meta: { label: string; value: string }[];
}

interface PeopleDetailPageProps {
  item: PeopleDetailItem;
  onBack: () => void;
  backLabel?: string;
}

export function PeopleDetailPage({
  item,
  onBack,
  backLabel = 'Back to People',
}: PeopleDetailPageProps): JSX.Element {
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
            People / Agents
          </span>
        </div>

        <h1 tabIndex={-1} className="mb-1 text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          {item.title}
        </h1>
        <p className="mb-6 text-sm text-[var(--theme-text-muted)]">{item.subtitle}</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Avatar block */}
          <section
            className="flex flex-col items-center justify-center rounded-2xl border border-[var(--panel-border)] p-6"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-md"
              style={{ background: 'var(--theme-accent)' }}
              aria-hidden="true"
            >
              {item.initials}
            </div>
            <span
              className="mt-4 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)', color: 'var(--theme-accent)' }}
            >
              {item.status}
            </span>
          </section>

          {/* Meta stack */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Meta
            </h2>
            <dl className="space-y-2">
              {item.meta.map((m) => (
                <div key={m.label} className="flex justify-between text-[13px]">
                  <dt className="text-[var(--theme-text-muted)]">{m.label}</dt>
                  <dd className="font-medium text-[var(--theme-text)]">{m.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Squad chips */}
          <section
            className="rounded-2xl border border-[var(--panel-border)] p-5"
            style={{ background: 'var(--theme-surface)' }}
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-dim)]">
              Squad
            </h2>
            <ul className="flex flex-wrap gap-2">
              {item.squad.map((s) => (
                <li
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: `${s.color}1A`, color: s.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
