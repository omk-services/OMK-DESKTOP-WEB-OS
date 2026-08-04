/** DashboardItemDetail — dark-oled layout.
 *
 * Canon: spec §4 #1 Dashboard — "Hero metric 56px + grid 2-col dense
 *         (KPI cards 4×) + Activity timeline".
 * Theme: dark-oled (deep surfaces, tabular numerals).
 * Motion: fade-up 220ms.
 *
 * Covers: clients (the "Client Pipeline" view).
 */
import type { JSX } from 'react';
import { Activity, ArrowUpRight, Layers, TrendingUp } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function numeric(item: Record<string, unknown>, key: string): number | undefined {
  const v = item[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function DashboardItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const heroValue = numeric(item, def.titleField) ?? numeric(item, 'arr') ?? numeric(item, 'mrr') ?? numeric(item, 'value');
  const arr = numeric(item, 'arr');
  const mrr = numeric(item, 'mrr');
  const cac = numeric(item, 'cac');
  const churn = numeric(item, 'churn');
  const owner = typeof item.owner === 'string' ? item.owner : undefined;
  const stage = typeof item.stage === 'string' ? item.stage : undefined;
  const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : undefined;

  return (
    <div className="min-h-full p-7" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      <BackAffordance label="Back to pipeline" onBack={onBack} accent={accent} />

      {/* Hero metric */}
      <div
        className="mt-5 rounded-2xl p-6"
        style={{
          background: 'var(--panel-solid)',
          border: '1px solid var(--panel-border)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {stage && <PillBadge accent={accent}>{stage}</PillBadge>}
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                {def.singular}
              </span>
            </div>
            <h1 className="text-3xl font-bold font-outfit tracking-tight" style={{ color: 'var(--theme-text)' }}>{title}</h1>
            {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>}
          </div>
          {heroValue !== undefined && (
            <div className="text-right shrink-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Hero metric</div>
              <div
                className="text-5xl font-extrabold leading-none mt-1 tabular-nums tracking-tight"
                style={{ color: accent }}
              >
                ${heroValue.toLocaleString('en-US')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI grid 4× */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {[
          { label: 'ARR', value: arr, prefix: '$' },
          { label: 'MRR', value: mrr, prefix: '$' },
          { label: 'CAC', value: cac, prefix: '$' },
          { label: 'Churn', value: churn, suffix: '%' },
        ].map(k => (
          <div
            key={k.label}
            className="rounded-xl p-4"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border)',
              boxShadow: 'var(--shadow-panel)',
            }}
          >
            <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>{k.label}</div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums" style={{ color: k.value !== undefined ? accent : 'var(--theme-muted)' }}>
              {k.value !== undefined ? `${k.prefix ?? ''}${k.value.toLocaleString('en-US')}${k.suffix ?? ''}` : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Field grid + Activity timeline */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className="md:col-span-2 rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attributes</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {def.fields
              .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
              .map(f => (
                <div key={f.key}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                  <dd className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
                </div>
              ))}
          </dl>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Activity timeline</span>
          </div>

          <ol className="relative pl-4 space-y-3">
            <span aria-hidden className="absolute left-1.5 top-1.5 bottom-1.5 w-px" style={{ background: 'var(--panel-border-subtle)' }} />
            {owner && (
              <li className="relative">
                <span className="absolute -left-3 top-1.5 w-2 h-2 rounded-full" style={{ background: accent }} />
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Owner</div>
                <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{owner}</div>
              </li>
            )}
            {updatedAt && (
              <li className="relative">
                <span className="absolute -left-3 top-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--theme-muted)' }} />
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Last update</div>
                <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{updatedAt}</div>
              </li>
            )}
            {heroValue !== undefined && (
              <li className="relative">
                <span className="absolute -left-3 top-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--theme-muted)' }} />
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Pipeline</div>
                <div className="flex items-center gap-1 text-sm font-medium" style={{ color: accent }}>
                  <TrendingUp className="w-3.5 h-3.5" /> ${heroValue.toLocaleString('en-US')}
                </div>
              </li>
            )}
            <li className="relative">
              <span className="absolute -left-3 top-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--theme-muted)' }} />
              <a
                href="#"
                onClick={e => { e.preventDefault(); onBack(); }}
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: accent }}
              >
                Open workspace <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
          </ol>
        </div>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
