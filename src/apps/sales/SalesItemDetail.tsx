/** SalesItemDetail — liquid-glass layout.
 *
 * Canon: spec §4 #10 Sales — "Hero + 2-col (Context card / Action stack)
 *         — content plate MUST stay opaque (fix 5b8fc74)".
 *
 * Real data shape (seed: deals): client, offer, value, stage.
 * We branch on the offer (Citadelle vs Programme) and on the stage to
 * give each deal a distinct surface — they're not interchangeable.
 */
import type { JSX } from 'react';
import { Building2, Handshake, Sparkles, Target } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

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

/** Crude probability guess from the stage — real deals carry this elsewhere. */
function probabilityFor(stage: string | undefined, value: number | undefined): number {
  const s = (stage ?? '').toLowerCase();
  if (s.includes('won') || s.includes('closed')) return 100;
  if (s.includes('proposal')) return 60;
  if (s.includes('qualified')) return 30;
  if (s.includes('discovery')) return 15;
  return value ? Math.min(50, Math.round(value / 50)) : 0;
}

const OFFER_BLURBS: Record<string, string> = {
  Citadelle:
    'Flagship high-touch engagement — weekly sessions, async voice memos, the full Citadel OS at the client\'s service.',
  Programme:
    'Twelve-week cohort programme — group coaching plus async support, the on-ramp into the practice.',
};

export function SalesItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const offer = readString(item, 'offer') ?? '';
  const stage = readString(item, 'stage', 'status');
  const amount = readNumber(item, 'value', 'amount');
  const prob = probabilityFor(stage, amount);
  const weightedValue = amount !== undefined ? Math.round((amount * prob) / 100) : undefined;
  const offerBlurb = OFFER_BLURBS[offer] ?? `Coaching engagement for ${title}. Stage: ${stage ?? 'open'}.`;

  return (
    <div
      className="min-h-full p-7 relative"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      {/* Refractive glass shell — bright wash, blurry */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(70% 60% at 30% 0%, ${accent}40 0%, transparent 60%), radial-gradient(60% 50% at 90% 30%, ${accent}30 0%, transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-16 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      <div className="relative">
        <BackAffordance label="Back to sales sanctum" onBack={onBack} accent={accent} />

        {/* Hero — OPAQUE plate (fix 5b8fc74) */}
        <div
          className="mt-5 rounded-3xl p-6"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 24px 60px -28px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5" style={{ color: accent }} />
                <span
                  className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  Sales · {def.singular}
                </span>
                {offer && <PillBadge accent={accent}>{offer}</PillBadge>}
                {stage && <PillBadge accent={accent}>{stage}</PillBadge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm mt-1.5" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
              )}
            </div>
            {amount !== undefined && (
              <div className="text-right shrink-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-muted)' }}>Deal value</div>
                <div
                  className="text-5xl font-extrabold leading-none mt-1 tabular-nums"
                  style={{ color: accent }}
                >
                  ${amount.toLocaleString('en-US')}
                </div>
                {weightedValue !== undefined && (
                  <div className="text-xs font-semibold mt-2 flex items-center gap-1 justify-end" style={{ color: 'var(--theme-muted)' }}>
                    <Target className="w-3 h-3" /> {prob}% likely · ${weightedValue.toLocaleString('en-US')} weighted
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2-col: Offer blurb / Pipeline lane */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Context — OPAQUE */}
          <div
            className="md:col-span-2 rounded-2xl p-5"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 18px 36px -22px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Offer & deal context</span>
            </div>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--theme-text)' }}
            >
              {offerBlurb}
            </p>

            {/* Probability bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  Stage probability
                </div>
                <div className="text-[11px] font-extrabold tabular-nums" style={{ color: accent }}>{prob}%</div>
              </div>
              <div
                className="h-2 overflow-hidden"
                style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <div
                  className="h-full"
                  style={{ width: `${prob}%`, background: accent }}
                />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {def.fields
                .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
                .map(f => (
                  <div key={f.key}>
                    <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                    <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Action stack — OPAQUE */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--panel-solid)',
              border: '1px solid var(--panel-border)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 18px 36px -22px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
              <Handshake className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Move it forward</span>
            </div>

            <ul className="space-y-2.5">
              {[
                { label: stage?.toLowerCase().includes('won') ? 'Mark Paid · Send onboarding' : 'Send proposal' },
                { label: 'Schedule 30-min check-in' },
                { label: 'Open in Sales pipeline' },
                { label: 'Open in Tasks as next action' },
              ].map((a, i) => (
                <li key={i}>
                  <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: 'var(--canvas)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border-subtle)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                    <span className="min-w-0 truncate">{a.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--panel-border-subtle)' }}>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-muted)' }}>
                Weighted forecast
              </div>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: accent }}>
                {weightedValue !== undefined ? `$${weightedValue.toLocaleString('en-US')}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
