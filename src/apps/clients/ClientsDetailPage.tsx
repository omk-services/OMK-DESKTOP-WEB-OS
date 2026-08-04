/**
 * ClientsDetailPage.tsx — Client dossier, Claymorphism (UI UX Pro Max).
 *
 * Style: puffy 3D clay slabs, thick soft shadows, oversized rounded corners,
 * pastel-tinted signature accent. The relationship-facing app, so the page is
 * built to feel tactile and human rather than tabular.
 *
 * Theming contract: every surface / text / border / radius / shadow reads from
 * the runtime `--theme-*` CSS variables (src/lib/themes/store.ts). The clay
 * relief is composed from theme vars only:
 *   highlight = --theme-surface-hover (lighter than surface in light AND dark themes)
 *   shade     = --theme-text at low alpha (reads as shade in light, rim-light in dark)
 *   depth     = --theme-shadow-lg  (never --theme-shadow: it is `none` in some themes,
 *               and `none` inside a comma list invalidates the whole box-shadow)
 * `--theme-bg` / `--theme-canvas` are NEVER used inside color-mix(): several
 * themes define them as gradients, which would break the declaration.
 *
 * Allowed deviation: APP_ACCENT (the Clients app hex, mirrors ClientsApp ACCENT)
 * for signature moments only — health dial, section chips, active beads, CTA.
 * Status hues come from the design-system vars --ok / --warn / --danger.
 *
 * Spec lineage: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 5
 */
import type { CSSProperties, ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Check,
  CircleUserRound,
  Clock3,
  HeartHandshake,
  MessagesSquare,
  NotebookPen,
  Route,
  Sparkles,
  Tag,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { DetailField } from '../../components/DetailPage';

export interface ClientsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  portrait: { initials: string; gradient: string };
  pills: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }[];
  fields: DetailField[];
}

interface ClientsDetailPageProps {
  item: ClientsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

type Pill = ClientsDetailItem['pills'][number];
type Tone = Pill['tone'];

/* ── Signature accent (Clients app) — the one non-theme colour, per brief ── */
const APP_ACCENT = '#2563eb';

/* ── Status hues from the design-system vars declared in src/index.css :root ── */
const TONE_HUE: Record<Tone, string> = {
  good: 'var(--ok)',
  warn: 'var(--warn)',
  bad: 'var(--danger)',
  neutral: 'var(--theme-text-dim)',
};

/* ── Clay shape language — oversized, but still derived from the theme radius ── */
const R_SLAB = 'calc(var(--theme-radius-lg) * 1.5)';
const R_TILE = 'calc(var(--theme-radius-lg) * 1.15)';

/** Puffy raised clay surface. `tint` colours the soft drop-shadow underneath. */
function clayRaised(depth: number, tint: string, tintPct: number, radius: string = R_SLAB): CSSProperties {
  const soft = Math.round(depth * 0.55);
  return {
    background: 'var(--theme-surface)',
    borderRadius: radius,
    boxShadow: [
      `inset 0 ${depth}px ${depth * 2}px -${soft}px color-mix(in srgb, var(--theme-surface-hover) 92%, transparent)`,
      `inset 0 -${depth}px ${depth * 2}px -${soft}px color-mix(in srgb, var(--theme-text) 10%, transparent)`,
      `0 ${depth * 2}px ${depth * 4}px -${depth}px color-mix(in srgb, ${tint} ${tintPct}%, transparent)`,
      'var(--theme-shadow-lg)',
    ].join(', '),
  };
}

/** Pressed clay well — used for tracks, gutters and the dial hole. */
function clayInset(depth: number, radius: string = R_TILE): CSSProperties {
  return {
    background: 'var(--theme-surface)',
    borderRadius: radius,
    boxShadow: [
      `inset ${depth}px ${depth}px ${depth * 2}px color-mix(in srgb, var(--theme-text) 13%, transparent)`,
      `inset -${depth}px -${depth}px ${depth * 2}px color-mix(in srgb, var(--theme-surface-hover) 95%, transparent)`,
    ].join(', '),
  };
}

/* ── Data readers — everything below is derived from `item`, nothing invented ── */

function findPill(pills: Pill[], key: string): Pill | undefined {
  return pills.find((p) => p.label.toLowerCase().includes(key));
}

function readPct(value: string | undefined): number | null {
  if (!value) return null;
  const m = /(\d+(?:\.\d+)?)/.exec(value);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

interface Steps {
  step: number;
  total: number;
}

function readSteps(value: string | undefined): Steps | null {
  if (!value) return null;
  const m = /(\d+)\s*\/\s*(\d+)/.exec(value);
  if (m) {
    const total = Number(m[2]);
    const step = Number(m[1]);
    if (total > 0 && total <= 12) return { step: Math.min(step, total), total };
    return null;
  }
  if (value.trim().toLowerCase() === 'complete') return { step: 7, total: 7 };
  return null;
}

/** The 7-step welcome runbook (Operations › Runbooks › "Client onboarding"). */
const WELCOME_STEPS = [
  'Welcome call',
  'Contract',
  'Zero-PII walkthrough',
  'First diagnostic',
  'Calendar sync',
  'First session brief',
  '30-day check-in',
];

const LIFECYCLE = ['Prospect', 'Onboarding', 'Active', 'At risk', 'Churned'];

const LIFECYCLE_TONE: Tone[] = ['neutral', 'warn', 'good', 'bad', 'bad'];

interface TimelineEntry {
  icon: LucideIcon;
  eyebrow: string;
  headline: string;
  detail: string;
  tone: Tone;
}

function buildTimeline(item: ClientsDetailItem): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  if (item.subtitle.trim().length > 0) {
    out.push({
      icon: Route,
      eyebrow: 'Relationship',
      headline: item.subtitle,
      detail: 'How this account is shaped',
      tone: 'neutral',
    });
  }
  const next = findPill(item.pills, 'next');
  if (next) {
    out.push({ icon: CalendarClock, eyebrow: 'Cadence', headline: next.value, detail: 'Next scheduled touchpoint', tone: next.tone });
  }
  const threads = findPill(item.pills, 'thread');
  if (threads) {
    out.push({ icon: MessagesSquare, eyebrow: 'Inbox', headline: `${threads.value} open`, detail: 'Threads awaiting a reply', tone: threads.tone });
  }
  const ticket = findPill(item.pills, 'ticket');
  if (ticket) {
    out.push({ icon: Wallet, eyebrow: 'Commitment', headline: ticket.value, detail: 'Recurring monthly value', tone: ticket.tone });
  }
  const duration = findPill(item.pills, 'duration');
  if (duration) {
    out.push({ icon: Clock3, eyebrow: 'Session length', headline: duration.value, detail: 'Captured in the IP Vault', tone: duration.tone });
  }
  const date = findPill(item.pills, 'date');
  if (date) {
    out.push({ icon: CalendarClock, eyebrow: 'Captured', headline: date.value, detail: 'Session date', tone: date.tone });
  }
  out.push({
    icon: Activity,
    eyebrow: 'Now',
    headline: item.status,
    detail: 'Current standing',
    tone: 'neutral',
  });
  return out;
}

interface NextMove {
  headline: string;
  body: string;
}

function buildNextMove(item: ClientsDetailItem, health: number | null, steps: Steps | null): NextMove {
  const status = item.status.trim().toLowerCase();
  const next = findPill(item.pills, 'next')?.value ?? '—';
  const threads = findPill(item.pills, 'thread')?.value ?? '0';
  if (status === 'at risk') {
    return {
      headline: 'Re-open the relationship',
      body: `Cadence reads "${next}" and ${threads} thread(s) are open. The retention agent flagged this account — a human touch outranks another automated nudge.`,
    };
  }
  if (steps && steps.step < steps.total) {
    const left = steps.total - steps.step;
    return {
      headline: 'Finish the welcome',
      body: `${steps.step} of ${steps.total} onboarding steps are done — ${left} left before "${WELCOME_STEPS[steps.total - 1] ?? 'the final step'}". Next up: ${WELCOME_STEPS[steps.step] ?? `step ${steps.step + 1}`}.`,
    };
  }
  if (health !== null && health >= 80) {
    return {
      headline: 'Protect the momentum',
      body: `Health sits at ${health}% with ${threads} open thread(s). Next touchpoint: ${next}. Nothing to fix — keep the rhythm.`,
    };
  }
  if (health !== null) {
    return {
      headline: 'Warm it back up',
      body: `Health sits at ${health}%. ${threads} thread(s) open, next touchpoint "${next}". Worth a personal check-in before the number drifts.`,
    };
  }
  return {
    headline: 'Keep the thread alive',
    body: `${item.title} · ${item.status}. ${threads} thread(s) open, next touchpoint "${next}".`,
  };
}

/* ── Presentational clay primitives ── */

interface SectionProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  index: number;
  reduced: boolean;
  children: ReactNode;
}

function ClaySection({ icon: Icon, title, caption, index, reduced, children }: SectionProps): JSX.Element {
  return (
    <motion.section
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0.12 } : { duration: 0.5, delay: 0.06 * index, ease: 'easeOut' }}
      className="p-6 sm:p-7"
      style={clayRaised(5, APP_ACCENT, 14)}
    >
      <header className="mb-5 flex items-center gap-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{
            background: APP_ACCENT,
            boxShadow: `0 8px 18px -6px color-mix(in srgb, ${APP_ACCENT} 60%, transparent), inset 0 2px 4px color-mix(in srgb, var(--theme-surface-hover) 55%, transparent)`,
          }}
          aria-hidden="true"
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h2
            className="truncate text-[15px] font-bold leading-tight text-[var(--theme-text)]"
            style={{ fontFamily: 'var(--theme-font-display)' }}
          >
            {title}
          </h2>
          <p className="truncate text-[11.5px] font-medium text-[var(--theme-text-muted)]">{caption}</p>
        </div>
      </header>
      {children}
    </motion.section>
  );
}

interface DialProps {
  pct: number;
}

/** Health dial — conic arc + pressed clay hole, built from divs only. */
function HealthDial({ pct }: DialProps): JSX.Element {
  const deg = Math.round((pct / 100) * 360);
  return (
    <div className="relative h-[124px] w-[124px] shrink-0" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 180deg, ${APP_ACCENT} 0deg, color-mix(in srgb, ${APP_ACCENT} 55%, transparent) ${deg}deg, color-mix(in srgb, var(--theme-text) 9%, transparent) ${deg}deg 360deg)`,
          boxShadow: `0 16px 30px -14px color-mix(in srgb, ${APP_ACCENT} 65%, transparent)`,
        }}
      />
      <div className="absolute inset-[13px] rounded-full" style={clayInset(4, '9999px')} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[30px] font-extrabold leading-none text-[var(--theme-text)]"
          style={{ fontFamily: 'var(--theme-font-display)' }}
        >
          {pct}
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
          health
        </span>
      </div>
    </div>
  );
}

interface BeadProps {
  pill: Pill;
  index: number;
  reduced: boolean;
}

function VitalBead({ pill, index, reduced }: BeadProps): JSX.Element {
  const hue = TONE_HUE[pill.tone];
  return (
    <motion.li
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0.12 } : { duration: 0.42, delay: 0.04 * index, ease: 'easeOut' }}
      className="group relative overflow-hidden px-5 py-4 transition-transform duration-200 hover:-translate-y-1"
      style={clayRaised(5, hue, 26, R_TILE)}
    >
      <span
        className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full transition-transform duration-200 group-hover:scale-125"
        style={{ background: hue, boxShadow: `0 0 0 4px color-mix(in srgb, ${hue} 16%, transparent)` }}
        aria-hidden="true"
      />
      <span className="block pr-6 text-[9.5px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text-dim)]">
        {pill.label}
      </span>
      <span
        className="mt-2 block truncate text-[20px] font-extrabold leading-tight text-[var(--theme-text)]"
        style={{ fontFamily: 'var(--theme-font-display)' }}
        title={pill.value}
      >
        {pill.value}
      </span>
    </motion.li>
  );
}

/* ── Page ── */

export function ClientsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Clients',
}: ClientsDetailPageProps): JSX.Element {
  const reduced = useReducedMotion() === true;

  const health = readPct(findPill(item.pills, 'health')?.value);
  const steps = readSteps(findPill(item.pills, 'onboarding')?.value);
  const stageIdx = LIFECYCLE.findIndex((s) => s.toLowerCase() === item.status.trim().toLowerCase());
  const timeline = buildTimeline(item);
  const nextMove = buildNextMove(item, health, steps);

  let sectionIndex = 0;
  const nextIndex = (): number => {
    sectionIndex += 1;
    return sectionIndex;
  };

  return (
    <div
      className="min-h-full w-full bg-[var(--theme-bg)] pb-14"
      style={{ fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto w-full max-w-[1080px] px-5 pt-6 sm:px-8">
        {/* ── Top rail: back affordance + dossier eyebrow ── */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group inline-flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold text-[var(--theme-text)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]/40"
            style={clayRaised(4, APP_ACCENT, 22, '9999px')}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            {backLabel}
          </button>
          <span
            className="inline-flex items-center gap-2 px-4 py-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]"
            style={clayInset(3, '9999px')}
          >
            <CircleUserRound className="h-3.5 w-3.5" />
            Client dossier
          </span>
        </div>

        {/* ── Hero slab ── */}
        <motion.header
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0.14 } : { duration: 0.55, ease: 'easeOut' }}
          className="relative overflow-hidden p-7 sm:p-9"
          style={clayRaised(7, APP_ACCENT, 22)}
        >
          {/* pastel clay blobs — decorative */}
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: item.portrait.gradient }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: APP_ACCENT }}
            aria-hidden="true"
          />

          <div className="relative flex flex-wrap items-center gap-7">
            {/* portrait */}
            <div className="relative shrink-0">
              <div
                className="flex h-[124px] w-[124px] items-center justify-center text-[38px] font-extrabold text-white"
                style={{
                  background: item.portrait.gradient,
                  borderRadius: '42%',
                  boxShadow: `0 22px 40px -16px color-mix(in srgb, ${APP_ACCENT} 75%, transparent), inset 0 6px 12px color-mix(in srgb, var(--theme-surface-hover) 45%, transparent), inset 0 -8px 16px color-mix(in srgb, var(--theme-text) 22%, transparent)`,
                  fontFamily: 'var(--theme-font-display)',
                }}
                aria-hidden="true"
              >
                {item.portrait.initials}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: 'var(--theme-surface)',
                  boxShadow: `0 8px 16px -6px color-mix(in srgb, var(--theme-text) 30%, transparent), inset 0 2px 4px color-mix(in srgb, var(--theme-surface-hover) 90%, transparent)`,
                }}
                aria-hidden="true"
              >
                <HeartHandshake className="h-4 w-4" style={{ color: APP_ACCENT }} />
              </span>
            </div>

            {/* identity */}
            <div className="min-w-[240px] flex-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em]"
                style={{
                  background: `color-mix(in srgb, ${APP_ACCENT} 14%, var(--theme-surface))`,
                  color: APP_ACCENT,
                  boxShadow: `inset 0 2px 4px color-mix(in srgb, var(--theme-text) 10%, transparent)`,
                }}
              >
                <Sparkles className="h-3 w-3" />
                {item.status}
              </span>
              <h1
                tabIndex={-1}
                className="mt-3 text-[34px] font-extrabold leading-[1.06] tracking-tight text-[var(--theme-text)] focus:outline-none"
                style={{ fontFamily: 'var(--theme-font-display)' }}
              >
                {item.title}
              </h1>
              <p className="mt-2 max-w-xl text-[14px] font-medium leading-relaxed text-[var(--theme-text-muted)]">
                {item.subtitle}
              </p>
            </div>

            {/* health dial */}
            {health !== null ? <HealthDial pct={health} /> : null}
          </div>
        </motion.header>

        {/* ── Vitals bead grid ── */}
        {item.pills.length > 0 ? (
          <div className="mt-6">
            <ClaySection
              icon={Activity}
              title="Vitals"
              caption="Every signal this account carries right now"
              index={nextIndex()}
              reduced={reduced}
            >
              <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-4 p-0">
                {item.pills.map((p, i) => (
                  <VitalBead key={`${p.label}-${i}`} pill={p} index={i} reduced={reduced} />
                ))}
              </ul>
            </ClaySection>
          </div>
        ) : null}

        {/* ── Lifecycle ladder ── */}
        {stageIdx >= 0 ? (
          <div className="mt-6">
            <ClaySection
              icon={Route}
              title="Lifecycle"
              caption="Where the relationship stands on the arc"
              index={nextIndex()}
              reduced={reduced}
            >
              <ol className="flex list-none flex-wrap items-stretch gap-3 p-0">
                {LIFECYCLE.map((stage, i) => {
                  const done = i < stageIdx;
                  const current = i === stageIdx;
                  const hue = TONE_HUE[LIFECYCLE_TONE[i]];
                  return (
                    <li
                      key={stage}
                      aria-current={current ? 'step' : undefined}
                      className="flex min-w-[124px] flex-1 items-center gap-2.5 px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
                      style={
                        current
                          ? {
                              ...clayRaised(5, hue, 34, R_TILE),
                              background: `color-mix(in srgb, ${hue} 12%, var(--theme-surface))`,
                            }
                          : clayInset(3)
                      }
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                        style={{
                          background: current || done ? hue : 'color-mix(in srgb, var(--theme-text) 10%, transparent)',
                          color: current || done ? '#ffffff' : 'var(--theme-text-dim)',
                        }}
                        aria-hidden="true"
                      >
                        {done ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      <span
                        className="truncate text-[12px] font-bold"
                        style={{ color: current ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}
                      >
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </ClaySection>
          </div>
        ) : null}

        {/* ── Onboarding journey ── */}
        {steps ? (
          <div className="mt-6">
            <ClaySection
              icon={Sparkles}
              title="Welcome journey"
              caption={`${steps.step} of ${steps.total} steps complete — the onboarding agent runs this`}
              index={nextIndex()}
              reduced={reduced}
            >
              {/* clay progress gutter */}
              <div className="mb-5 h-4 w-full overflow-hidden p-1" style={clayInset(3, '9999px')}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, color-mix(in srgb, ${APP_ACCENT} 70%, transparent), ${APP_ACCENT})`,
                    boxShadow: `0 2px 8px -2px color-mix(in srgb, ${APP_ACCENT} 80%, transparent)`,
                  }}
                  initial={reduced ? { width: `${(steps.step / steps.total) * 100}%` } : { width: '0%' }}
                  animate={{ width: `${(steps.step / steps.total) * 100}%` }}
                  transition={reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3 p-0">
                {Array.from({ length: steps.total }, (_, i) => {
                  const done = i < steps.step;
                  const current = i === steps.step;
                  const label = WELCOME_STEPS[i] ?? `Step ${i + 1}`;
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 px-3.5 py-3 transition-transform duration-200 hover:-translate-y-0.5"
                      style={done || current ? clayRaised(4, APP_ACCENT, done ? 30 : 16, R_TILE) : clayInset(3)}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                        style={{
                          background: done
                            ? APP_ACCENT
                            : current
                              ? `color-mix(in srgb, ${APP_ACCENT} 22%, var(--theme-surface))`
                              : 'color-mix(in srgb, var(--theme-text) 8%, transparent)',
                          color: done ? '#ffffff' : current ? APP_ACCENT : 'var(--theme-text-dim)',
                          boxShadow: done
                            ? `0 6px 12px -4px color-mix(in srgb, ${APP_ACCENT} 70%, transparent)`
                            : 'none',
                        }}
                        aria-hidden="true"
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span
                        className="text-[11.5px] font-bold leading-tight"
                        style={{ color: done || current ? 'var(--theme-text)' : 'var(--theme-text-dim)' }}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </ClaySection>
          </div>
        ) : null}

        {/* ── Care timeline ── */}
        {timeline.length > 0 ? (
          <div className="mt-6">
            <ClaySection
              icon={CalendarClock}
              title="Care rhythm"
              caption="The relationship, read top to bottom"
              index={nextIndex()}
              reduced={reduced}
            >
              <ol className="relative list-none space-y-3 p-0 pl-8">
                <span
                  className="absolute bottom-4 left-[13px] top-4 w-[3px] rounded-full"
                  style={{ background: `color-mix(in srgb, var(--theme-text) 10%, transparent)` }}
                  aria-hidden="true"
                />
                {timeline.map((entry, i) => {
                  const Icon = entry.icon;
                  const hue = TONE_HUE[entry.tone];
                  return (
                    <motion.li
                      key={`${entry.eyebrow}-${i}`}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={reduced ? { duration: 0.12 } : { duration: 0.4, delay: 0.05 * i, ease: 'easeOut' }}
                      className="relative flex items-center gap-4 px-4 py-3.5 transition-transform duration-200 hover:translate-x-1"
                      style={clayRaised(4, hue, 20, R_TILE)}
                    >
                      <span
                        className="absolute -left-[27px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
                        style={{
                          background: hue,
                          boxShadow: `0 0 0 4px var(--theme-bg), 0 0 0 6px color-mix(in srgb, ${hue} 22%, transparent)`,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `color-mix(in srgb, ${hue} 14%, var(--theme-surface))`,
                          color: hue,
                          boxShadow: `inset 0 2px 4px color-mix(in srgb, var(--theme-text) 10%, transparent)`,
                        }}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9.5px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text-dim)]">
                          {entry.eyebrow}
                        </span>
                        <span className="block truncate text-[14.5px] font-bold text-[var(--theme-text)]">
                          {entry.headline}
                        </span>
                      </div>
                      <span className="hidden shrink-0 text-[11.5px] font-medium text-[var(--theme-text-muted)] sm:block">
                        {entry.detail}
                      </span>
                    </motion.li>
                  );
                })}
              </ol>
            </ClaySection>
          </div>
        ) : null}

        {/* ── Field notes (raw fields — empty today, kept wired) ── */}
        {item.fields.length > 0 ? (
          <div className="mt-6">
            <ClaySection
              icon={NotebookPen}
              title="Field notes"
              caption="Everything else recorded on this record"
              index={nextIndex()}
              reduced={reduced}
            >
              <dl className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                {item.fields.map((field) => (
                  <div key={field.label} className="px-4 py-3.5" style={clayInset(3)}>
                    <dt className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text-dim)]">
                      {field.label}
                    </dt>
                    <dd className="mt-1.5 text-[13.5px] font-semibold leading-snug text-[var(--theme-text)]">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </ClaySection>
          </div>
        ) : null}

        {/* ── Next move + back CTA ── */}
        <motion.section
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.12 } : { duration: 0.5, delay: 0.06 * nextIndex(), ease: 'easeOut' }}
          className="relative mt-6 overflow-hidden p-7 sm:p-8"
          style={clayRaised(7, APP_ACCENT, 28)}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
            style={{ background: APP_ACCENT }}
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-[260px] flex-1">
              <span className="inline-flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                <Tag className="h-3 w-3" />
                Next move
              </span>
              <h2
                className="mt-2 text-[21px] font-extrabold leading-tight text-[var(--theme-text)]"
                style={{ fontFamily: 'var(--theme-font-display)' }}
              >
                {nextMove.headline}
              </h2>
              <p className="mt-2 max-w-2xl text-[13.5px] font-medium leading-relaxed text-[var(--theme-text-muted)]">
                {nextMove.body}
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex shrink-0 items-center gap-2.5 px-7 py-4 text-[14px] font-extrabold text-white transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]/45"
              style={{
                background: `linear-gradient(150deg, color-mix(in srgb, ${APP_ACCENT} 78%, transparent), ${APP_ACCENT})`,
                borderRadius: '9999px',
                boxShadow: `0 18px 32px -12px color-mix(in srgb, ${APP_ACCENT} 85%, transparent), inset 0 3px 6px color-mix(in srgb, var(--theme-surface-hover) 40%, transparent), inset 0 -4px 8px color-mix(in srgb, var(--theme-text) 22%, transparent)`,
              }}
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              {backLabel}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
