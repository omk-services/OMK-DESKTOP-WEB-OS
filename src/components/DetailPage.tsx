/**
 * DetailPage.tsx — Phase 48 canon generic detail page.
 *
 * Extracted from SalesDetailPage (Phase 38) into a reusable pattern that all
 * Coach OS apps share. Sister to PeopleApp FleetDetail (useWindowPage pattern).
 *
 * Sister pattern: src/apps/people/PeopleApp.tsx → FleetDetail, line 483-485.
 *
 * Usage in any app:
 *   1. Local state useState<DetailItem | null>(null) (in app)
 *   2. useEffect mirror → useWindowPage().setDetail({label, onBack})
 *   3. early-return <DetailPage item={detail} onBack={...} onNavigate={...} kindMeta={kindMeta} />
 *   4. Pass kindMeta from app's own DETAIL_META table (icon, accent, action)
 *
 * D4 append-only: refactor extraction, no behaviour change for existing Sales.
 */

import { ArrowLeft, ExternalLink, type LucideIcon } from 'lucide-react';

export interface DetailField {
  label: string;
  value: string;
}

export interface DetailItemBase {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  summary: string;
  fields: DetailField[];
}

export interface DetailMeta {
  /** Header label shown top-right (e.g. 'Deal workspace', 'Agent drill', 'Stack connector'). */
  label: string;
  /** Lucide icon shown in the title block. */
  icon: LucideIcon;
  /** Hex color for the icon background + status pill tint. */
  accent: string;
  /** Optional action button (e.g. 'Open in Tasks', 'Review Sovereign Gate'). */
  action?: { label: string; appId: string };
}

interface DetailPageProps {
  item: DetailItemBase;
  /** Back button label (e.g. 'Back to Sales OS', 'Back to People'). */
  backLabel: string;
  /** Called when user clicks 'Back' button. */
  onBack: () => void;
  /** Optional callback when user clicks the action button. */
  onNavigate?: (appId: string) => void;
  /** App-specific meta (label, icon, accent, action). */
  meta: DetailMeta;
}

export function DetailPage({ item, backLabel, onBack, onNavigate, meta }: DetailPageProps): JSX.Element {
  const Icon = meta.icon;

  const handleAction = (): void => {
    if (!meta.action || !onNavigate) return;
    onNavigate(meta.action.appId);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header — back button + meta label */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-stone-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {meta.label}
          </span>
        </div>

        {/* Title block — icon + status + title + subtitle */}
        <div className="mb-6 flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ background: meta.accent }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${meta.accent}16`, color: meta.accent }}
            >
              {item.status}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-900">
              {item.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{item.subtitle}</p>
          </div>
        </div>

        {/* Full context section */}
        <section className="mb-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-5">
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Full context
          </h2>
          <p className="text-[13.5px] leading-relaxed text-stone-700">{item.summary}</p>
        </section>

        {/* Fields dl */}
        <dl className="mb-6 divide-y divide-stone-100 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] px-5">
          {item.fields.map((field) => (
            <div key={field.label} className="py-4">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {field.label}
              </dt>
              <dd className="mt-1 text-[13.5px] font-medium leading-snug text-stone-800">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Action button */}
        {meta.action && onNavigate ? (
          <button
            type="button"
            onClick={handleAction}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.99]"
            style={{ background: meta.accent }}
          >
            {meta.action.label}
            <ExternalLink className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
