/**
 * DashboardDetailPage.tsx — Dashboard record console.
 *
 * Style: "SaaS Analytics Dashboard" (UI UX Pro Max / uupm.cc)
 *   Glassmorphism + Flat Design. Frosted translucent panels floating over a soft
 *   accent wash, crisp data-first tabular typography, a top KPI strip, generous
 *   whitespace. Calm, executive, legible at a glance.
 *
 * Theming contract: every surface / text / border / radius / shadow reads from the
 * runtime theme CSS variables (--theme-*). The single sanctioned deviation is
 * ACCENT — the Dashboard app's own hex, mirrored from DashboardApp.tsx — used only
 * for signature moments (icon chip, gauge arc, active pill, chart fill, glow).
 *
 * Public contract unchanged: same export names, same props signature.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Hash,
  LayoutDashboard,
  Minus,
  Signal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { DetailField } from '../../components/DetailPage';

export interface DashboardDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  /** Big number — shown in the 56px hero metric block. */
  heroMetric: { value: string; label: string };
  kpis: { label: string; value: string; delta?: string }[];
  activity: { at: string; text: string }[];
  fields: DetailField[];
}

interface DashboardDetailPageProps {
  item: DashboardDetailItem;
  onBack: () => void;
  backLabel?: string;
}

/* ───────────────────────────── design primitives ───────────────────────────── */

/** Dashboard app accent (mirrors ACCENT in DashboardApp.tsx). */
const ACCENT = '#059669';

/** Frosted panel: translucent theme surface + blur + theme border/radius/shadow. */
function glass(surfaceAlpha = 72, radius = 'var(--theme-radius-lg)'): CSSProperties {
  return {
    background: `color-mix(in srgb, var(--theme-surface) ${surfaceAlpha}%, transparent)`,
    border: '1px solid color-mix(in srgb, var(--theme-border) 60%, transparent)',
    borderRadius: radius,
    boxShadow: 'var(--theme-shadow)',
    backdropFilter: 'blur(22px) saturate(150%)',
    WebkitBackdropFilter: 'blur(22px) saturate(150%)',
  };
}

/** Flat inner tile — no blur, sits inside a frosted panel. */
function tile(): CSSProperties {
  return {
    background: 'color-mix(in srgb, var(--theme-text) 4%, transparent)',
    borderRadius: 'var(--theme-radius-sm)',
  };
}

const RANGES = [
  { id: '7D', points: 7, caption: 'last 7 days' },
  { id: '30D', points: 14, caption: 'last 30 days' },
  { id: '90D', points: 22, caption: 'last 90 days' },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

const LADDER = ['Lead', 'Onboarding', 'Active', 'Expansion'] as const;

/** Deterministic pseudo-series (FNV-1a seeded) so a record always draws the same trend. */
function seededSeries(seed: string, count: number, base: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  let cur = base;
  for (let i = 0; i < count; i += 1) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const r = ((h >>> 0) % 1000) / 1000;
    cur = Math.max(8, Math.min(100, cur + (r - 0.44) * 21));
    out.push(Math.round(cur));
  }
  // Land the series on the true current value so the chart agrees with the gauge.
  out[out.length - 1] = Math.round(base);
  return out;
}

function toPercent(raw: string): number | null {
  if (!raw.includes('%')) return null;
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function deltaTone(delta: string): 'up' | 'down' | 'flat' {
  const t = delta.trim();
  if (t.startsWith('+')) return 'up';
  if (t.startsWith('-') || t.startsWith('−')) return 'down';
  return 'flat';
}

/* ───────────────────────────── small components ───────────────────────────── */

function SectionLabel({
  icon: Icon,
  title,
  caption,
}: {
  icon: typeof Activity;
  title: string;
  caption?: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center"
        style={{
          borderRadius: 'var(--theme-radius-sm)',
          background: `${ACCENT}1f`,
          color: ACCENT,
        }}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text)]">
        {title}
      </h2>
      {caption ? (
        <span className="truncate text-[11px] text-[var(--theme-text-dim)]">{caption}</span>
      ) : null}
    </div>
  );
}

function Sparkline({ values, height = 26 }: { values: number[]; height?: number }): JSX.Element {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }} aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background:
              i === values.length - 1
                ? ACCENT
                : `color-mix(in srgb, ${ACCENT} ${28 + Math.round((i / values.length) * 34)}%, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── page ───────────────────────────── */

export function DashboardDetailPage({
  item,
  onBack,
  backLabel = 'Back to Dashboard',
}: DashboardDetailPageProps): JSX.Element {
  const [range, setRange] = useState<RangeId>('30D');
  const reduced = useReducedMotion() ?? false;

  const pct = toPercent(item.heroMetric.value);
  const baseline = pct ?? 62;
  const activeRange = RANGES.find((r) => r.id === range) ?? RANGES[1];

  const series = useMemo(
    () => seededSeries(`${item.id}:${range}`, activeRange.points, baseline),
    [item.id, range, activeRange.points, baseline],
  );
  const seriesMax = Math.max(...series, 1);
  const seriesAvg = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  const first = series[0] ?? 0;
  const last = series[series.length - 1] ?? 0;
  const drift = last - first;

  const ladderIndex = LADDER.findIndex(
    (s) => s.toLowerCase() === item.status.trim().toLowerCase(),
  );
  const stages: string[] = ladderIndex >= 0 ? [...LADDER] : [...LADDER, item.status];
  const activeStage = ladderIndex >= 0 ? ladderIndex : stages.length - 1;

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar"
      style={{
        background: `radial-gradient(110% 68% at 6% -8%, ${ACCENT}26, transparent 58%), radial-gradient(80% 55% at 98% 2%, ${ACCENT}14, transparent 60%), radial-gradient(70% 50% at 50% 108%, ${ACCENT}0f, transparent 65%), var(--theme-bg)`,
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      {/* ── sticky command bar ─────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-5 py-3 sm:px-7"
        style={{
          background: 'color-mix(in srgb, var(--theme-bg) 62%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--theme-border) 45%, transparent)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        }}
      >
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-[var(--theme-text)] transition-all hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--theme-accent)] motion-reduce:transform-none motion-reduce:transition-none"
            style={glass(58, 'var(--theme-radius)')}
          >
            <ArrowLeft className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            {backLabel}
          </button>

          <nav
            aria-label="Breadcrumb"
            className="hidden min-w-0 items-center gap-1.5 text-[11px] text-[var(--theme-text-dim)] sm:flex"
          >
            <span className="font-semibold uppercase tracking-[0.16em]">Dashboard</span>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-[0.16em]">Ecosystem</span>
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate font-semibold text-[var(--theme-text-muted)]">
              {item.title}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
                style={{ background: ACCENT }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: ACCENT }}
              />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="@container mx-auto max-w-[1080px] px-5 pb-12 pt-7 sm:px-7">
        {/* ── identity header, flat on the wash ────────────────────────── */}
        <header className="mb-8">
          <div className="flex flex-wrap items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center text-white"
              style={{
                borderRadius: 'var(--theme-radius)',
                background: `linear-gradient(140deg, ${ACCENT}, color-mix(in srgb, ${ACCENT} 55%, var(--theme-accent)))`,
                boxShadow: `0 10px 30px -8px ${ACCENT}8c`,
              }}
              aria-hidden="true"
            >
              <LayoutDashboard className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">
                Client record · Ecosystem vitals
              </p>
              <h1
                tabIndex={-1}
                className="mt-1.5 truncate text-[30px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--theme-text)] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--theme-accent)]"
                style={{ fontFamily: 'var(--theme-font-display)' }}
              >
                {item.title}
              </h1>
              <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
                {item.subtitle || 'No segment recorded'}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  borderRadius: 'var(--theme-radius-sm)',
                  background: `${ACCENT}1f`,
                  color: ACCENT,
                  border: `1px solid ${ACCENT}45`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: ACCENT }}
                  aria-hidden="true"
                />
                {item.status}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--theme-text-dim)]">
                <Hash className="h-3 w-3" aria-hidden="true" />
                <span className="font-mono">{item.id}</span>
              </span>
            </div>
          </div>
        </header>

        {/* ── top KPI strip ────────────────────────────────────────────── */}
        {item.kpis.length > 0 ? (
          <section aria-label="Key indicators" className="mb-5">
            <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
              {item.kpis.map((k, i) => {
                const tone = k.delta ? deltaTone(k.delta) : 'flat';
                const DeltaIcon =
                  tone === 'up' ? TrendingUp : tone === 'down' ? TrendingDown : Minus;
                return (
                  <div
                    key={k.label}
                    className="group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    style={glass(70)}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
                      style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
                      aria-hidden="true"
                    />
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-[var(--theme-text-dim)]">
                        {k.label}
                      </p>
                      {k.delta ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            borderRadius: 'var(--theme-radius-sm)',
                            background:
                              tone === 'up'
                                ? `${ACCENT}1f`
                                : 'color-mix(in srgb, var(--theme-text) 8%, transparent)',
                            color: tone === 'up' ? ACCENT : 'var(--theme-text-muted)',
                          }}
                        >
                          <DeltaIcon className="h-3 w-3" aria-hidden="true" />
                          {k.delta}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className="mt-2 truncate text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-[var(--theme-text)]"
                      style={{ fontFamily: 'var(--theme-font-display)' }}
                      title={k.value}
                    >
                      {k.value}
                    </p>
                    <div className="mt-3">
                      <Sparkline
                        values={seededSeries(`${item.id}:${k.label}:${i}`, 12, baseline)}
                        height={22}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── featured metric + trend ──────────────────────────────────── */}
        <section aria-label="Headline metric and trend" className="mb-5">
          <div className="grid gap-3 @4xl:grid-cols-[300px_1fr]">
            {/* gauge card */}
            <div className="flex flex-col items-center justify-center p-6" style={glass(76)}>
              {pct === null ? (
                <>
                  <p
                    className="text-[52px] font-extrabold leading-none tracking-[-0.04em] tabular-nums"
                    style={{ fontFamily: 'var(--theme-font-display)', color: ACCENT }}
                  >
                    {item.heroMetric.value}
                  </p>
                  <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                    {item.heroMetric.label}
                  </p>
                </>
              ) : (
                <>
                  <div className="relative h-[148px] w-[148px]">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from -90deg, ${ACCENT} 0turn ${pct / 100}turn, color-mix(in srgb, var(--theme-text) 12%, transparent) ${pct / 100}turn 1turn)`,
                        boxShadow: `0 0 44px -10px ${ACCENT}99`,
                      }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full"
                      style={{
                        background: 'color-mix(in srgb, var(--theme-surface) 94%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--theme-border) 50%, transparent)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      }}
                    >
                      <span
                        className="text-[38px] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-[var(--theme-text)]"
                        style={{ fontFamily: 'var(--theme-font-display)' }}
                      >
                        {item.heroMetric.value}
                      </span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                        of 100
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">
                    {item.heroMetric.label}
                  </p>
                  <div className="mt-3 flex w-full items-center gap-2">
                    <div
                      className="h-1.5 flex-1 overflow-hidden"
                      style={{
                        borderRadius: 'var(--theme-radius-sm)',
                        background: 'color-mix(in srgb, var(--theme-text) 10%, transparent)',
                      }}
                      role="img"
                      aria-label={`${item.heroMetric.label}: ${item.heroMetric.value}`}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, color-mix(in srgb, ${ACCENT} 55%, transparent), ${ACCENT})`,
                          borderRadius: 'inherit',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-[var(--theme-text-dim)]">
                      100
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* trend chart */}
            <div className="p-5" style={glass(70)}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <SectionLabel
                  icon={BarChart3}
                  title="Trajectory"
                  caption={`modeled · ${activeRange.caption}`}
                />
                <div
                  className="inline-flex p-0.5"
                  style={{
                    borderRadius: 'var(--theme-radius-sm)',
                    background: 'color-mix(in srgb, var(--theme-text) 7%, transparent)',
                  }}
                  role="group"
                  aria-label="Trend range"
                >
                  {RANGES.map((r) => {
                    const on = r.id === range;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRange(r.id)}
                        aria-pressed={on}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--theme-accent)] motion-reduce:transition-none"
                        style={{
                          borderRadius: 'var(--theme-radius-sm)',
                          background: on ? ACCENT : 'transparent',
                          color: on ? '#ffffff' : 'var(--theme-text-muted)',
                        }}
                      >
                        {r.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative h-[164px] pl-8">
                {/* gridlines + y labels */}
                {[100, 75, 50, 25, 0].map((g) => (
                  <div
                    key={g}
                    className="pointer-events-none absolute left-0 right-0 flex items-center gap-2"
                    style={{ bottom: `${g}%` }}
                    aria-hidden="true"
                  >
                    <span className="w-7 shrink-0 text-right text-[9px] font-semibold tabular-nums text-[var(--theme-text-dim)]">
                      {g}
                    </span>
                    <span
                      className="h-px flex-1"
                      style={{
                        background:
                          'color-mix(in srgb, var(--theme-border) 55%, transparent)',
                        opacity: g === 0 ? 1 : 0.55,
                      }}
                    />
                  </div>
                ))}
                {/* average marker */}
                <div
                  className="pointer-events-none absolute left-8 right-0 flex items-center"
                  style={{ bottom: `${seriesAvg}%` }}
                  aria-hidden="true"
                >
                  <span
                    className="h-px flex-1"
                    style={{
                      background: `repeating-linear-gradient(90deg, ${ACCENT} 0 5px, transparent 5px 10px)`,
                      opacity: 0.75,
                    }}
                  />
                  <span
                    className="ml-1 px-1 text-[9px] font-bold tabular-nums"
                    style={{
                      color: ACCENT,
                      background: `${ACCENT}1a`,
                      borderRadius: 'var(--theme-radius-sm)',
                    }}
                  >
                    avg {seriesAvg}
                  </span>
                </div>

                {/* bars */}
                <div className="relative flex h-full items-end gap-[3px]">
                  {series.map((v, i) => {
                    const isLast = i === series.length - 1;
                    return (
                      <div key={`${range}-${i}`} className="group/bar relative flex h-full flex-1 items-end">
                        <motion.span
                          className="w-full"
                          style={{
                            height: `${Math.max(4, (v / seriesMax) * 100)}%`,
                            transformOrigin: 'bottom',
                            borderRadius: 'var(--theme-radius-sm)',
                            background: isLast
                              ? `linear-gradient(180deg, ${ACCENT}, color-mix(in srgb, ${ACCENT} 45%, transparent))`
                              : `linear-gradient(180deg, color-mix(in srgb, ${ACCENT} 62%, transparent), color-mix(in srgb, ${ACCENT} 16%, transparent))`,
                            boxShadow: isLast ? `0 0 18px -4px ${ACCENT}` : undefined,
                          }}
                          initial={reduced ? false : { scaleY: 0, opacity: 0 }}
                          animate={{ scaleY: 1, opacity: 1 }}
                          transition={{
                            duration: reduced ? 0 : 0.4,
                            delay: reduced ? 0 : i * 0.018,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                        <span
                          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-bold tabular-nums opacity-0 transition-opacity group-hover/bar:opacity-100 motion-reduce:transition-none"
                          style={{
                            borderRadius: 'var(--theme-radius-sm)',
                            background: 'var(--theme-surface)',
                            border: '1px solid color-mix(in srgb, var(--theme-border) 70%, transparent)',
                            color: 'var(--theme-text)',
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pl-8 text-[10px] text-[var(--theme-text-dim)]">
                <span className="font-semibold uppercase tracking-[0.12em]">
                  {activeRange.caption}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-bold tabular-nums"
                  style={{ color: drift >= 0 ? ACCENT : 'var(--theme-text-muted)' }}
                >
                  {drift >= 0 ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  )}
                  {drift >= 0 ? '+' : ''}
                  {drift} pts over window
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── lifecycle ladder ─────────────────────────────────────────── */}
        <section aria-label="Lifecycle stage" className="mb-5 p-5" style={glass(70)}>
          <SectionLabel icon={Signal} title="Lifecycle" caption="account status ladder" />
          <ol className="mt-5 flex flex-col gap-2 @2xl:flex-row @2xl:items-stretch">
            {stages.map((stage, i) => {
              const done = i < activeStage;
              const on = i === activeStage;
              return (
                <li key={stage} className="flex flex-1 items-center gap-2">
                  <div
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 transition-all"
                    style={{
                      borderRadius: 'var(--theme-radius-sm)',
                      background: on
                        ? `${ACCENT}1c`
                        : 'color-mix(in srgb, var(--theme-text) 4%, transparent)',
                      border: on
                        ? `1px solid ${ACCENT}66`
                        : '1px solid color-mix(in srgb, var(--theme-border) 40%, transparent)',
                      boxShadow: on ? `0 8px 24px -12px ${ACCENT}` : undefined,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums"
                      style={{
                        background: done || on ? ACCENT : 'transparent',
                        border:
                          done || on
                            ? 'none'
                            : '1px solid color-mix(in srgb, var(--theme-text) 25%, transparent)',
                        color: done || on ? '#ffffff' : 'var(--theme-text-dim)',
                      }}
                      aria-hidden="true"
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span
                      className="truncate text-[12px] font-semibold"
                      style={{
                        color: on
                          ? 'var(--theme-text)'
                          : done
                            ? 'var(--theme-text-muted)'
                            : 'var(--theme-text-dim)',
                      }}
                    >
                      {stage}
                    </span>
                    {on ? (
                      <span
                        className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: ACCENT }}
                      >
                        now
                      </span>
                    ) : null}
                  </div>
                  {i < stages.length - 1 ? (
                    <ChevronRight
                      className="hidden h-3.5 w-3.5 shrink-0 text-[var(--theme-text-dim)] @2xl:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── activity + attributes ────────────────────────────────────── */}
        <div className="grid gap-3 @4xl:grid-cols-[1.15fr_1fr]">
          <section aria-label="Activity" className="p-5" style={glass(70)}>
            <SectionLabel icon={Activity} title="Signal feed" caption="most recent first" />
            {item.activity.length === 0 ? (
              <p className="mt-4 text-[12px] text-[var(--theme-text-dim)]">
                No signals recorded for this account yet.
              </p>
            ) : (
              <ol className="relative mt-5 space-y-4 pl-5">
                <span
                  className="absolute bottom-2 left-[5px] top-2 w-px"
                  style={{
                    background: `linear-gradient(180deg, ${ACCENT}, color-mix(in srgb, var(--theme-border) 70%, transparent))`,
                  }}
                  aria-hidden="true"
                />
                {item.activity.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="relative">
                    <span
                      className="absolute -left-5 top-1 h-[11px] w-[11px] rounded-full"
                      style={{
                        background: i === 0 ? ACCENT : 'var(--theme-surface)',
                        border:
                          i === 0
                            ? `2px solid ${ACCENT}`
                            : '2px solid color-mix(in srgb, var(--theme-border) 85%, transparent)',
                        boxShadow: i === 0 ? `0 0 14px -2px ${ACCENT}` : undefined,
                      }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{
                          borderRadius: 'var(--theme-radius-sm)',
                          background: i === 0 ? `${ACCENT}1a` : 'transparent',
                          color: i === 0 ? ACCENT : 'var(--theme-text-dim)',
                        }}
                      >
                        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                        {a.at}
                      </span>
                      <span className="text-[13px] leading-snug text-[var(--theme-text)]">
                        {a.text}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-label="Attributes" className="p-5" style={glass(70)}>
            <SectionLabel icon={LayoutDashboard} title="Attributes" caption="record fields" />
            <dl className="mt-5 grid grid-cols-1 gap-2 @xl:grid-cols-2">
              <div className="p-3" style={tile()}>
                <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                  Segment
                </dt>
                <dd className="mt-1 truncate text-[13px] font-semibold text-[var(--theme-text)]">
                  {item.subtitle || '—'}
                </dd>
              </div>
              <div className="p-3" style={tile()}>
                <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                  Status
                </dt>
                <dd className="mt-1 truncate text-[13px] font-semibold" style={{ color: ACCENT }}>
                  {item.status}
                </dd>
              </div>
              <div className="p-3" style={tile()}>
                <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                  {item.heroMetric.label}
                </dt>
                <dd className="mt-1 truncate text-[13px] font-semibold tabular-nums text-[var(--theme-text)]">
                  {item.heroMetric.value}
                </dd>
              </div>
              <div className="p-3" style={tile()}>
                <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                  Record id
                </dt>
                <dd className="mt-1 truncate font-mono text-[13px] font-semibold text-[var(--theme-text)]">
                  {item.id}
                </dd>
              </div>
              {item.fields.map((f) => (
                <div key={f.label} className="p-3" style={tile()}>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-semibold leading-snug text-[var(--theme-text)]">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* ── footer action ────────────────────────────────────────────── */}
        <footer className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--theme-accent)] motion-reduce:transform-none motion-reduce:transition-none"
            style={{
              borderRadius: 'var(--theme-radius)',
              background: `linear-gradient(120deg, ${ACCENT}, color-mix(in srgb, ${ACCENT} 62%, var(--theme-accent)))`,
              boxShadow: `0 14px 34px -14px ${ACCENT}`,
            }}
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
            {backLabel}
          </button>
          <span
            className="px-4 py-3 text-[11px] font-semibold text-[var(--theme-text-dim)]"
            style={glass(52, 'var(--theme-radius)')}
          >
            {item.kpis.length} indicators · {item.activity.length} signals
          </span>
        </footer>
      </div>
    </div>
  );
}
