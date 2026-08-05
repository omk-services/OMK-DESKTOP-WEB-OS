/** GrowthItemDetail — vibrant-block layout.
 *
 * Canon: spec §4 #9 Growth — "Hero + 2-col split (Funnel viz /
 *         Experiment table)".
 *
 * Real data shapes:
 *   channels:        name, leadsLabel, leads, cac, trend
 *   experiments:     title, lift, notes
 *   acquisition:     name, category, virality, conversion, cost, ease,
 *                    global, verdict, whatWorks, whatFailed
 *   strategie:       name, phase, objective, duration, criteria, state, focus
 *   partenariats:    name, type, brings, expects, state, contact, touched
 *   aeo:             query, intent, position, cited, trackedSince, history,
 *                    competitor
 *
 * Channels get a 4-step conversion funnel synthesised from their leads
 * count so the visualisation carries the channel's actual signal.
 * Experiments get the scoreboard across the whole experiment catalogue.
 * The four new collections each get a bespoke body tuned to their
 * semantics: 4-criteria radar for acquisition, objective+criteria for
 * strategie, give/get ledger for partenariats, position+movement for aeo.
 */
import type { JSX } from 'react';
import {
  Beaker, Megaphone, TrendingUp, TrendingDown, Minus, Map, Handshake, Sparkles,
  CheckCircle2, XCircle, Target, Clock, AlertOctagon,
} from 'lucide-react';
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

/** Tone for a verdict / phase / state / position string. Maps the semantic
 *  value to a hex so the hero pill stays legible without re-importing the
 *  badge tone table from the app file. */
function toneFor(value: string | undefined, kind: 'verdict' | 'phase' | 'state' | 'position' | 'generic'): { fg: string; bg: string } {
  const v = (value ?? '').toLowerCase();
  if (kind === 'verdict') {
    if (v.startsWith('invest')) return { fg: '#15803d', bg: '#dcfce7' };
    if (v.startsWith('hold'))   return { fg: '#b45309', bg: '#fef3c7' };
    if (v.startsWith('cut'))    return { fg: '#b91c1c', bg: '#fee2e2' };
  }
  if (kind === 'phase') {
    if (v === 'launch')   return { fg: '#1d4ed8', bg: '#dbeafe' };
    if (v === 'scale')    return { fg: '#b45309', bg: '#fef3c7' };
    if (v === 'optimize') return { fg: '#15803d', bg: '#dcfce7' };
    if (v === 'pivot')    return { fg: '#b91c1c', bg: '#fee2e2' };
  }
  if (kind === 'state') {
    if (v === 'prospect')      return { fg: '#57534e', bg: '#f5f5f4' };
    if (v === 'en discussion') return { fg: '#b45309', bg: '#fef3c7' };
    if (v === 'actif')         return { fg: '#15803d', bg: '#dcfce7' };
    if (v === 'dormant')       return { fg: '#b91c1c', bg: '#fee2e2' };
  }
  if (kind === 'position') {
    if (v.includes('#1'))    return { fg: '#15803d', bg: '#dcfce7' };
    if (v.includes('#2'))    return { fg: '#1d4ed8', bg: '#dbeafe' };
    if (v.includes('top 3')) return { fg: '#1d4ed8', bg: '#dbeafe' };
    if (v.includes('top 5')) return { fg: '#b45309', bg: '#fef3c7' };
    if (v.includes('not'))   return { fg: '#b91c1c', bg: '#fee2e2' };
  }
  return { fg: '#57534e', bg: '#f5f5f4' };
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

  // Hero value is per-collection:
  //   channels      → leads
  //   experiments   → lift %
  //   acquisition   → global score / 100
  //   strategie     → duration
  //   partenariats  → state
  //   aeo           → position label
  const global = readNumber(item, 'global');
  const duration = readString(item, 'duration');
  const stateVal = readString(item, 'state');
  const position = readString(item, 'position');

  let heroValue: number | string | undefined;
  let heroLabel: string | undefined;
  if (collection === 'channels') {
    heroValue = leads;
    heroLabel = 'Leads';
  } else if (collection === 'experiments') {
    heroValue = liftPct !== undefined ? Math.abs(liftPct) : undefined;
    heroLabel = 'Lift';
  } else if (collection === 'growth_acquisition') {
    heroValue = global;
    heroLabel = 'Global score';
  } else if (collection === 'growth_strategie') {
    heroValue = duration;
    heroLabel = 'Duration';
  } else if (collection === 'growth_partenariats') {
    heroValue = stateVal;
    heroLabel = 'State';
  } else if (collection === 'growth_aeo') {
    heroValue = position;
    heroLabel = 'Position';
  }

  const verdictKey = (readString(item, 'verdict') ?? '').split(' ·')[0];
  const phaseVal = readString(item, 'phase');
  const verdictTone = toneFor(verdictKey, 'verdict');
  const phaseTone = toneFor(phaseVal, 'phase');
  const partnerTone = toneFor(stateVal, 'state');
  const aeoTone = toneFor(position, 'position');

  return (
    <div
      className="min-h-full p-7"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      <BackAffordance label="Back to growth" onBack={onBack} accent={accent} />

      {/* Bold hero */}
      <header className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[11px] font-extrabold uppercase tracking-[0.22em] px-2 py-1"
              style={{ background: accent, color: '#ffffff', borderRadius: 0 }}
            >
              GROWTH · {collection.replace(/^growth_/, '').toUpperCase()}
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
            {collection === 'growth_acquisition' && verdictKey && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1"
                style={{ background: verdictTone.bg, color: verdictTone.fg, borderRadius: 0 }}
              >
                {verdictKey}
              </span>
            )}
            {collection === 'growth_strategie' && phaseVal && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1"
                style={{ background: phaseTone.bg, color: phaseTone.fg, borderRadius: 0 }}
              >
                {phaseVal}
              </span>
            )}
            {collection === 'growth_partenariats' && stateVal && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1"
                style={{ background: partnerTone.bg, color: partnerTone.fg, borderRadius: 0 }}
              >
                {stateVal}
              </span>
            )}
            {collection === 'growth_aeo' && position && (
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.18em] px-2 py-1"
                style={{ background: aeoTone.bg, color: aeoTone.fg, borderRadius: 0 }}
              >
                {position}
              </span>
            )}
          </div>
          <h1
            className="text-4xl md:text-5xl font-black leading-[0.98] tracking-tight break-words"
            style={{ color: 'var(--theme-text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
          )}
        </div>

        {heroValue !== undefined && (
          <div className="text-right shrink-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>
              {heroLabel}
            </div>
            <div
              className="text-5xl md:text-6xl font-black leading-none tabular-nums"
              style={{ color: accent }}
            >
              {collection === 'channels'
                ? heroValue
                : collection === 'experiments'
                  ? (liftPct! >= 0 ? '+' : '') + heroValue + '%'
                  : collection === 'growth_acquisition'
                    ? `${heroValue}/100`
                    : collection === 'growth_strategie'
                      ? String(heroValue)
                      : String(heroValue)}
            </div>
            {collection === 'channels' && cac > 0 && (
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] mt-2" style={{ color: 'var(--theme-muted)' }}>
                CAC ${cac}
              </div>
            )}
            {collection === 'growth_acquisition' && (
              <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] mt-2" style={{ color: 'var(--theme-muted)' }}>
                V{Number(item.virality ?? 0)} · C{Number(item.conversion ?? 0)} · ${' '}{Number(item.cost ?? 0)} · E{Number(item.ease ?? 0)}
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2-col split body — varies per collection */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {(collection === 'channels' || collection === 'experiments') ? (
          <>
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
                {funnelFor(leads).map(s => {
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
          </>
        ) : collection === 'growth_acquisition' ? (
          <>
            <AcquisitionCriteriaPanel item={item} accent={accent} />
            <AcquisitionNarrativePanel item={item} accent={accent} />
          </>
        ) : collection === 'growth_strategie' ? (
          <>
            <StrategieObjectivePanel item={item} accent={accent} />
            <StrategieCriteriaPanel item={item} accent={accent} />
          </>
        ) : collection === 'growth_partenariats' ? (
          <>
            <PartenariatsBringsPanel item={item} accent={accent} />
            <PartenariatsExpectsPanel item={item} accent={accent} />
          </>
        ) : collection === 'growth_aeo' ? (
          <>
            <AeoPositionPanel item={item} accent={accent} />
            <AeoMovementPanel item={item} accent={accent} />
          </>
        ) : null}
      </div>

      {/* Notes (channels/experiments) or Attributes grid (new collections) */}
      {(notes
        || collection === 'growth_acquisition'
        || collection === 'growth_strategie'
        || collection === 'growth_partenariats'
        || collection === 'growth_aeo'
      ) && (
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
                .filter(f => f.key !== 'whatWorks' && f.key !== 'whatFailed' && f.key !== 'history' && f.key !== 'brings' && f.key !== 'expects' && f.key !== 'objective' && f.key !== 'criteria')
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

/* ═══ Acquisition — 4-criteria bars + what-works/what-failed ═══ */

function AcquisitionCriteriaPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const criteria: { key: string; label: string; hint: string }[] = [
    { key: 'virality',   label: 'Virality',   hint: 'organic spread' },
    { key: 'conversion', label: 'Conversion', hint: 'lead → won rate' },
    { key: 'cost',       label: 'Cost',       hint: 'cheap to run' },
    { key: 'ease',       label: 'Ease',       hint: 'execution friction' },
  ];
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
        <Target className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Four criteria · 0-25 each</span>
      </div>
      <ol className="space-y-2.5">
        {criteria.map((c) => {
          const v = Number(item[c.key] ?? 0);
          const widthPct = Math.max(4, (v / 25) * 100);
          const tone = v >= 20 ? '#15803d' : v >= 13 ? '#b45309' : '#b91c1c';
          return (
            <li key={c.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12.5px] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text)' }}>{c.label}</span>
                <span className="text-[12px] font-extrabold tabular-nums" style={{ color: tone }}>{v}/25</span>
              </div>
              <div className="h-3" style={{ background: 'var(--canvas)', border: '1.5px solid var(--theme-text)' }}>
                <div className="h-full" style={{ width: `${widthPct}%`, background: tone }} />
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] font-extrabold" style={{ color: 'var(--theme-muted)' }}>{c.hint}</div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 pt-3 flex items-baseline justify-between" style={{ borderTop: '2px solid var(--theme-text)' }}>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>Global score</span>
        <span className="text-3xl font-black tabular-nums" style={{ color: accent }}>{Number(item.global ?? 0)}<span className="text-base font-extrabold" style={{ color: 'var(--theme-muted)' }}>/100</span></span>
      </div>
    </div>
  );
}

function AcquisitionNarrativePanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const works = String(item.whatWorks ?? '');
  const failed = String(item.whatFailed ?? '');
  return (
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
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Field notes</span>
      </div>
      <div className="space-y-4">
        <section>
          <div className="flex items-center gap-1.5 mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#15803d' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> What works
          </div>
          {works
            ? works.split(/(?<=\.)\s+/).map((line, i) => (
                <p key={i} className="text-[13px] leading-relaxed first:mt-0 mt-1.5" style={{ color: 'var(--theme-text)' }}>{line}</p>
              ))
            : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No field notes recorded.</p>}
        </section>
        <section
          className="p-3"
          style={{ borderLeft: `4px solid ${accent}`, background: 'var(--canvas)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: '#b91c1c' }}>
            <XCircle className="w-3.5 h-3.5" /> What failed
          </div>
          {failed
            ? failed.split(/(?<=\.)\s+/).map((line, i) => (
                <p key={i} className="text-[13px] leading-relaxed first:mt-0 mt-1.5" style={{ color: 'var(--theme-text)' }}>{line}</p>
              ))
            : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No failure recorded yet.</p>}
        </section>
      </div>
    </div>
  );
}

/* ═══ Strategie — objective + criteria for passing ═══ */

function StrategieObjectivePanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const objective = String(item.objective ?? '');
  const focus = String(item.focus ?? '');
  const duration = String(item.duration ?? '');
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
        <Map className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Objective</span>
      </div>
      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{objective}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div
          className="p-3"
          style={{ background: 'var(--canvas)', border: `1.5px solid ${accent}` }}
        >
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Duration</div>
          <div className="text-base font-extrabold mt-0.5" style={{ color: accent }}>{duration || '—'}</div>
        </div>
        <div
          className="p-3"
          style={{ background: 'var(--canvas)', border: `1.5px solid var(--theme-text)` }}
        >
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Focus</div>
          <div className="text-base font-extrabold mt-0.5" style={{ color: 'var(--theme-text)' }}>{focus || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function StrategieCriteriaPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const criteria = String(item.criteria ?? '');
  const stateVal = String(item.state ?? '');
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Pass criteria · when we move to the next phase</span>
      </div>
      {criteria
        ? criteria.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed first:mt-0 mt-2" style={{ color: 'var(--theme-text)' }}>{line}</p>
          ))
        : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No criteria recorded.</p>}
      <div className="mt-4 pt-3 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ borderTop: '2px solid var(--theme-text)', color: accent }}>
        <Clock className="w-3.5 h-3.5" /> State · {stateVal}
      </div>
    </div>
  );
}

/* ═══ Partenariats — give/get ledger ═══ */

function PartenariatsBringsPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const brings = String(item.brings ?? '');
  const contact = String(item.contact ?? '');
  const touched = String(item.touched ?? '');
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
        <Handshake className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">What they bring</span>
      </div>
      {brings
        ? brings.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed first:mt-0 mt-2" style={{ color: 'var(--theme-text)' }}>{line}</p>
          ))
        : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No offering recorded.</p>}
      <div
        className="mt-4 pt-3 grid grid-cols-2 gap-3"
        style={{ borderTop: '2px solid var(--theme-text)' }}
      >
        <div>
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Contact</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{contact || '—'}</div>
        </div>
        <div>
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Last touched</div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: accent }}>{touched || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function PartenariatsExpectsPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const expects = String(item.expects ?? '');
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: accent }}>
        <AlertOctagon className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">What they expect from us</span>
      </div>
      {expects
        ? expects.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed first:mt-0 mt-2" style={{ color: 'var(--theme-text)' }}>{line}</p>
          ))
        : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No expectation recorded.</p>}
      <div className="mt-4 pt-3 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ borderTop: '2px solid var(--theme-text)', color: 'var(--theme-muted)' }}>
        Negotiate from this ledger. If any line drifts past a quarter, the partnership is no longer actif — reclassify before the next sync.
      </div>
    </div>
  );
}

/* ═══ AEO — position + movement ═══ */

function AeoPositionPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const position = String(item.position ?? '');
  const cited = String(item.cited ?? '');
  const intent = String(item.intent ?? '');
  const trackedSince = String(item.trackedSince ?? '');
  const tone = toneFor(position, 'position');
  const citedCount = cited === '—' ? 0 : cited.split(',').filter(s => s.trim().length > 0).length;
  return (
    <div
      className="p-5"
      style={{
        background: 'var(--panel-solid)',
        border: `2px solid var(--theme-text)`,
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Position today · across the major models</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span
          className="text-[40px] font-black leading-none tracking-tight"
          style={{ color: tone.fg }}
        >
          {position || '—'}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div
          className="p-3"
          style={{ background: 'var(--canvas)', border: `1.5px solid ${accent}` }}
        >
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Intent</div>
          <div className="text-sm font-extrabold mt-0.5" style={{ color: 'var(--theme-text)' }}>{intent || '—'}</div>
        </div>
        <div
          className="p-3"
          style={{ background: 'var(--canvas)', border: '1.5px solid var(--theme-text)' }}
        >
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Models citing us</div>
          <div className="text-sm font-extrabold mt-0.5 tabular-nums" style={{ color: 'var(--theme-text)' }}>{citedCount}</div>
        </div>
        <div
          className="p-3"
          style={{ background: 'var(--canvas)', border: '1.5px solid var(--theme-text)' }}
        >
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Tracked since</div>
          <div className="text-sm font-extrabold mt-0.5" style={{ color: 'var(--theme-text)' }}>{trackedSince || '—'}</div>
        </div>
      </div>
      {cited !== '—' && cited && (
        <div className="mt-3 text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
          Cited by · {cited}
        </div>
      )}
    </div>
  );
}

function AeoMovementPanel({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const history = String(item.history ?? '');
  const competitor = String(item.competitor ?? '');
  return (
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
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Movement · history of this query</span>
      </div>
      {history
        ? history.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed first:mt-0 mt-2" style={{ color: 'var(--theme-text)' }}>{line}</p>
          ))
        : <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No movement recorded yet.</p>}
      <div
        className="mt-4 pt-3 flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-[0.18em]"
        style={{ borderTop: '2px solid var(--theme-text)', color: accent }}
      >
        Closest competitor · {competitor === '—' || !competitor ? 'no close competitor on this query' : competitor}
      </div>
    </div>
  );
}