/** TasksItemDetail — editorial layout.
 *
 * Canon: spec §4 #6 Tasks — "Hero + vertical single-column (prose serif)
 *         + due-date eyebrow".
 * Theme: editorial (serif display, generous leading).
 * Motion: slide-bottom 220ms.
 */
import type { JSX } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

export function TasksItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const due = readString(item, 'due', 'dueDate', 'deadline');
  const priority = readString(item, 'priority');
  const status = readString(item, 'status', 'state');
  const body = readString(item, 'body', 'notes', 'description');

  const dueDate = due ? new Date(due) : undefined;
  const dueLabel = dueDate && !Number.isNaN(dueDate.getTime())
    ? dueDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : due;

  return (
    <div
      className="min-h-full p-8 md:p-12"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      <BackAffordance label="Back to tasks" onBack={onBack} accent={accent} />

      <article className="mt-6 max-w-3xl mx-auto">
        {/* Editorial eyebrow */}
        <div
          className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] mb-4"
          style={{ color: accent }}
        >
          <span aria-hidden className="h-px w-10" style={{ background: accent }} />
          <span>The task · {def.singular}</span>
        </div>

        {/* Title — serif display, generous leading */}
        <h1
          className="text-4xl md:text-5xl tracking-tight leading-[1.05]"
          style={{
            color: 'var(--theme-text)',
            fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
          }}
        >
          {title}
        </h1>

        {/* Due-date eyebrow */}
        {dueLabel && (
          <div className="mt-3 flex items-center gap-1.5 text-sm italic" style={{ color: 'var(--theme-muted)' }}>
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Due {dueLabel}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-5">
          {priority && <PillBadge accent={accent}>{priority}</PillBadge>}
          {status && <PillBadge accent={accent}>{status}</PillBadge>}
        </div>

        {/* Single-column body — serif prose */}
        {subtitle && (
          <p
            className="mt-6 text-xl leading-relaxed"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {subtitle}
          </p>
        )}

        {body && (
          <div
            className="mt-6 text-[15px] leading-[1.75] space-y-4"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {body.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Quiet attribute footer — serif, low contrast */}
        <footer
          className="mt-10 pt-5"
          style={{ borderTop: '1px solid var(--hairline)' }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Notes from the editor</span>
          </div>
          <dl className="space-y-2.5">
            {def.fields
              .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
              .map(f => (
                <div key={f.key} className="flex items-baseline gap-3">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] shrink-0 w-32" style={{ color: 'var(--theme-muted)' }}>
                    {f.label}
                  </dt>
                  <dd className="text-sm italic" style={{ color: 'var(--theme-text)' }}>
                    {formatField(item[f.key], f.type)}
                  </dd>
                </div>
              ))}
          </dl>
        </footer>
      </article>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
