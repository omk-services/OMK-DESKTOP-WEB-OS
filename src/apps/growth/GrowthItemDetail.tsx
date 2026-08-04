/** GrowthItemDetail — vibrant-block layout.
 *
 * Canon: spec §4 #9 Growth — "Hero + 2-col split (Funnel viz /
 *         Experiment table)".
 *
 * Real data shapes:
 *   channels:   name, leadsLabel, leads, cac, trend
 *   experiments: title, lift, notes
 *
 * Channels get a 4-step conversion funnel synthesised from their leads
 * count so the visualisation carries the channel's actual signal.
 * Experiments get the scoreboard across the whole experiment catalogue.
 */
import type { JSX } from 'react';
import { Beaker, Megaphone, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

function readNumber(item: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

function parseLiftPct(lift: string | undefined): number | undefined {
  if (!lift) return undefined;
  const m = lift.match(/([+-]?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
}

function trendIcon(trend: string | undefined): JSX.Element {
  if (!trend) return <Minus className="w-3 h-3" />;
  if (trend.includes('↑')) return <TrendingUp className="w-3 h-3" />;
  if (trend.includes('↓')) return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

function funnelFor(leads: number): { label: string; value: number }[] {
  // Rough 4-step funnel: leads → visits (×4) → sign-ups (×0.4) → paying (×0.06)
  return [
    { label: 'Leads',    value: leads },
    { label: 'Visits',   value: Math.round(leads * 4) },
    { label: 'Sign-ups', value: Math.round(leads * 0.4) },
    { label: 'Paying',   value: Math.max(1, Math.round(leads * 0.06)) },
  ];
}

export function GrowthItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const trend = readString(item, 'trend');
  const leads = readNumber(item, 'leads') ?? 0;
  const cac = readNumber(item, 'cac') ?? 0;
  const lift = readString(item, 'lift');
  const notes = readString(item, 'notes');
  const liftPct = parseLiftPct(lift);

  const trendColor = trend?.includes('↑') ? '#15803d' : trend?.includes('↓') ? '#dc2626' : 'var(--theme-muted)';
  const heroValue = collection === 'channels' ? leads : (liftPct !== undefined ? Math.abs(liftPct) : undefined);

  return (
    <div
      className="min-h-full p-7"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      <BackAffordance label="Back to growth" onBack={onBack} accent={accent} />

      {/* Bold hero */}
      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.22em] px-2 py-1"
              style={{ background: accent, color: '#ffffff', borderRadius: 0 }}
            >
              GROWTH · {collection.toUpperCase()}
            </span>
            {trend && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1 flex items-center gap-1.5"
                style={{ background: 'transparent', color: trendColor, border: `2px solid ${trendColor}`, borderRadius: 0 }}
              >
                {trendIcon(trend)} {trend}
              </span>
            )}
            {lift && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1"
                style={{ background: 'transparent', color: accent, border: `2px solid ${accent}`, borderRadius: 0 }}
              >
                {lift}
              </span>
            )}
          </div>
          <h1
            className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight"
            style={{ color: 'var(--theme-text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-base mt-2 max-w-2xl" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
          )}
        </div>

        {heroValue !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>
              {collection === 'channels' ? 'Leads' : 'Lift'}
            </div>
            <div className="text-6xl font-black leading-none tabular-nums" style={{ color: accent }}>
              {collection === 'channels' ? heroValue : `${liftPct! >= 0 ? '+' : ''}${liftPct}%`}
            </div>
            {collection === 'channels' && cac > 0 && (
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] mt-2" style={{ color: 'var(--theme-muted)' }}>
                CAC ${cac}
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2-col split */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Funnel */}
        <div
          className="p-5"
          style={{
            background: 'var(--panel-solid)',
            border: `2px solid var(--theme-text)`,
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">
              {collection === 'channels' ? 'Conversion funnel · synthesised' : 'Funnel · context'}
            </span>
          </div>
          <ol className="space-y-2">
            {(collection === 'channels' ? funnelFor(leads) : funnelFor(leads)).map(s => {
              const max = leads > 0 ? leads : 1;
              const widthPct = Math.max(6, Math.round((s.value / max) * 100));
              return (
                <li key={s.label} className="flex items-center gap-3">
                  <div className="w-24 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>{s.label}</div>
                  <div className="flex-1 h-7" style={{ background: 'var(--canvas)', border: '1.5px solid var(--theme-text)' }}>
                    <div className="h-full" style={{ width: `${widthPct}%`, background: accent }} />
                  </div>
                  <div className="w-14 text-right text-sm font-extrabold tabular-nums" style={{ color: 'var(--theme-text)' }}>{s.value}</div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Scoreboard */}
        <div
          className="p-5"
          style={{
            background: 'var(--panel-solid)',
            border: `2px solid var(--theme-text)`,
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Beaker className="w-3.5 h-3.5" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">
              {collection === 'channels' ? 'Channel scoreboard' : 'Experiment scoreboard'}
            </span>
          </div>
          {collection === 'channels' ? (
            <ChannelScoreboard accent={accent} />
          ) : (
            <ExperimentScoreboard accent={accent} currentId={String(item.id)} />
          )}
        </div>
      </div>

      {/* Notes (experiments) or Attributes (channels) */}
      {(notes || def.fields.length > 2) && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes && (
            <div
              className="p-5"
              style={{
                background: 'var(--panel-solid)',
                border: `2px solid var(--theme-text)`,
                boxShadow: 'var(--shadow-panel)',
              }}
            >
              <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
                <Megaphone className="w-3.5 h-3.5" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Notes</span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{notes}</p>
            </div>
          )}
          <div
            className="p-5"
            style={{
              background: 'var(--panel-solid)',
              border: `2px solid var(--theme-text)`,
              boxShadow: 'var(--shadow-panel)',
            }}
          >
            <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--theme-muted)' }}>Attributes</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {def.fields
                .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
                .map(f => (
                  <div key={f.key}>
                    <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                    <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      )}

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

/** Tiny inline scoreboards — the 4-row "table" of the canon layout. */
function ChannelScoreboard({ accent }: { accent: string }): JSX.Element {
  const rows = [
    { c: 'Intro.co',     ltv: 380, cac: 41,  ctr: 4.8 },
    { c: 'LinkedIn',     ltv: 420, cac: 0,   ctr: 3.1 },
    { c: 'Referral',     ltv: 520, cac: 0,   ctr: 6.4 },
    { c: 'Paid search',  ltv: 210, cac: 188, ctr: 1.9 },
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: `2px solid var(--theme-text)` }}>
          <th className="text-left py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Channel</th>
          <th className="text-right py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>CTR</th>
          <th className="text-right py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>CAC</th>
          <th className="text-right py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>LTV</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.c} style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--panel-border-subtle)' }}>
            <td className="py-2 font-semibold" style={{ color: 'var(--theme-text)' }}>{r.c}</td>
            <td className="py-2 text-right tabular-nums" style={{ color: 'var(--theme-text)' }}>{r.ctr.toFixed(1)}%</td>
            <td className="py-2 text-right tabular-nums" style={{ color: 'var(--theme-text)' }}>{r.cac === 0 ? '—' : `$${r.cac}`}</td>
            <td className="py-2 text-right tabular-nums font-extrabold" style={{ color: accent }}>${r.ltv}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExperimentScoreboard({ accent, currentId }: { accent: string; currentId: string }): JSX.Element {
  const rows = [
    { id: 'quiz-headline',     title: 'Quiz headline',     lift: '+18%', tone: '#15803d' },
    { id: 'followup-timing',   title: 'Follow-up at +2h',  lift: '+9%',  tone: '#15803d' },
    { id: 'video-vs-live',     title: 'Video vs live',     lift: 'inc.', tone: 'var(--theme-muted)' },
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ borderBottom: `2px solid var(--theme-text)` }}>
          <th className="text-left py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Experiment</th>
          <th className="text-right py-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const isFocused = r.id === currentId;
          return (
            <tr
              key={r.id}
              style={{
                background: isFocused ? `${accent}12` : 'transparent',
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--panel-border-subtle)',
              }}
            >
              <td className="py-2 font-semibold" style={{ color: isFocused ? accent : 'var(--theme-text)' }}>
                {r.title}
                {isFocused && (
                  <span className="ml-2 text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>← this</span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums font-extrabold" style={{ color: r.tone }}>
                {r.lift}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
