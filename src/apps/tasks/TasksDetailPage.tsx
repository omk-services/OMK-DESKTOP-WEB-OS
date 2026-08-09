/**
 * TasksDetailPage.tsx — "Command console" redesign.
 *
 * Style: AI-Native UI + Minimalism (UI UX Pro Max catalogue).
 * Near-monochrome, one accent, a lot of air, precise small-caps mono labels,
 * command-palette affordances (breadcrumb prompt, blinking caret, keycaps,
 * a command rail). Ruthlessly reduced — only what is needed to act.
 *
 * Theme contract: every colour / surface / border / radius / shadow comes from
 * the runtime CSS variables injected by ThemeApplier (src/lib/themes/store.ts).
 * The single deviation is TASKS_ACCENT — the Tasks app's own accent (same hex as
 * TasksApp's ACCENT / the CMS `tasks` collection accent) — used only for the
 * signature moments: icon chip, caret, live ladder node, primary command.
 *
 * Canonical theme for appId `tasks` (tokens.ts CANONICAL_APP_THEMES): `editorial`.
 * The page is theme-agnostic and verified against dark themes (dark-oled,
 * cyberpunk, aurora) as well as light ones.
 *
 * Public surface is unchanged: `TasksDetailPage` + `TasksDetailItem`,
 * props { item, onBack, backLabel? }.
 */

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  CornerDownLeft,
  Hash,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { DetailField } from '../../components/DetailPage';

export interface TasksDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  dueAt: string;
  body: string;
  fields: DetailField[];
}

interface TasksDetailPageProps {
  item: TasksDetailItem;
  onBack: () => void;
  backLabel?: string;
}

/** The Tasks app accent — the one saturated colour allowed on this page. */
const TASKS_ACCENT = '#0d9488';
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface LadderStep {
  key: string;
  label: string;
  note: string;
}

const STEPS: LadderStep[] = [
  { key: 'captured', label: 'Captured', note: 'Written down. It exists outside your head.' },
  { key: 'scheduled', label: 'Scheduled', note: 'Parked on the upcoming rail — not yet in play.' },
  { key: 'today', label: 'Today', note: 'In the working set. This is what needs you now.' },
  { key: 'complete', label: 'Complete', note: 'Closed out. Nothing further is owed here.' },
];

function stepIndexFor(status: string, done: boolean): number {
  if (done) return 3;
  if (/today|now|due/i.test(status)) return 2;
  return 1;
}

function titleCase(value: string): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ── Primitives ─────────────────────────────────────────────────────────── */

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[var(--theme-text-dim)]">
      {children}
    </span>
  );
}

function Keycap({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-[var(--theme-radius-sm)] border border-[var(--theme-border)] bg-[var(--theme-bg)] px-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-[var(--theme-text-dim)]">
      {children}
    </kbd>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <Label>{title}</Label>
      <span className="h-px flex-1 bg-[var(--theme-border-subtle)]" aria-hidden="true" />
      {hint ? (
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function Caret({ reduced }: { reduced: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className="ml-2 inline-block h-[0.78em] w-[0.4em] translate-y-[0.02em] align-middle"
      style={{ background: TASKS_ACCENT, borderRadius: '1px' }}
      animate={reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.15, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: 'linear' }
      }
    />
  );
}

interface RevealProps {
  delay: number;
  reduced: boolean;
  className?: string;
  children: ReactNode;
}

function Reveal({ delay, reduced, className, children }: RevealProps) {
  return (
    <motion.section
      className={className}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.34, delay: reduced ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function TasksDetailPage({
  item,
  onBack,
  backLabel = 'Back to Tasks',
}: TasksDetailPageProps) {
  const reduced = useReducedMotion() ?? false;

  // Command-palette behaviour: esc closes the detail. Genuinely wired, so the
  // `esc` keycaps in the UI are not decoration.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const isDone = /done|complete|closed/i.test(item.status);
  const active = stepIndexFor(item.status, isDone);
  const liveStep = STEPS[active];
  const laneLabel = titleCase(item.status);
  const hasBody = item.body.trim().length > 0;
  const fieldCount = item.fields.length;

  const tiles: { label: string; value: string; icon: LucideIcon; live: boolean }[] = [
    { label: 'Due', value: item.dueAt || '—', icon: Clock3, live: !isDone },
    { label: 'Lane', value: laneLabel, icon: Inbox, live: false },
    { label: 'State', value: isDone ? 'Complete' : 'Open', icon: isDone ? Check : CircleDot, live: isDone },
    { label: 'Ref', value: item.id, icon: Hash, live: false },
  ];

  return (
    <div
      className="min-h-full w-full bg-[var(--theme-bg)] text-[var(--theme-text)]"
      style={{ fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto w-full max-w-[860px] px-5 py-8 sm:px-10 sm:py-14">
        {/* ── Command rail (top) ── */}
        <div className="mb-9 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group inline-flex items-center gap-2 rounded-[var(--theme-radius-sm)] border border-transparent px-2 py-1.5 transition-colors hover:border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)] focus:outline-none focus-visible:border-[var(--theme-border)] focus-visible:bg-[var(--theme-surface-hover)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[var(--theme-text-dim)] transition-colors group-hover:text-[var(--theme-text)]" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--theme-text-muted)] transition-colors group-hover:text-[var(--theme-text)]">
              {backLabel}
            </span>
            <Keycap>esc</Keycap>
          </button>

          <div className="flex shrink-0 items-center gap-2.5">
            <Label>Task</Label>
            <span className="h-3 w-px bg-[var(--theme-border)]" aria-hidden="true" />
            <span
              className="h-1.5 w-1.5 rounded-full"
              aria-hidden="true"
              style={{
                background: isDone ? 'var(--theme-text-dim)' : TASKS_ACCENT,
                boxShadow: isDone ? 'none' : `0 0 0 3px ${TASKS_ACCENT}24`,
              }}
            />
          </div>
        </div>

        {/* ── Hero: the palette result ── */}
        <Reveal
          delay={0}
          reduced={reduced}
          className="overflow-hidden rounded-[var(--theme-radius-lg)] border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[var(--theme-shadow)]"
        >
          <div
            className="h-px w-full"
            aria-hidden="true"
            style={{ background: `linear-gradient(90deg, ${TASKS_ACCENT}, transparent 62%)` }}
          />

          <div className="px-5 py-7 sm:px-9 sm:py-9">
            {/* prompt breadcrumb */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
              <span>tasks</span>
              <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />
              <span>{laneLabel}</span>
              <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />
              <span style={{ color: TASKS_ACCENT }}>{item.id}</span>
            </div>

            <div className="flex items-start gap-4">
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--theme-radius-sm)]"
                aria-hidden="true"
                style={{
                  background: `${TASKS_ACCENT}18`,
                  color: TASKS_ACCENT,
                  boxShadow: `inset 0 0 0 1px ${TASKS_ACCENT}33`,
                }}
              >
                {isDone ? <Check className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <h1
                  tabIndex={-1}
                  className="text-[25px] font-semibold leading-[1.14] tracking-[-0.022em] text-[var(--theme-text)] outline-none sm:text-[31px]"
                >
                  <span className="break-words">{item.title}</span>
                  <Caret reduced={reduced} />
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-[var(--theme-radius-sm)] px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{
                      background: `${TASKS_ACCENT}14`,
                      color: TASKS_ACCENT,
                      boxShadow: `inset 0 0 0 1px ${TASKS_ACCENT}2e`,
                    }}
                  >
                    {item.status}
                  </span>
                  {item.subtitle ? (
                    <span className="font-mono text-[11px] text-[var(--theme-text-muted)]">
                      {item.subtitle}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* metric strip — hairline grid via gap-px */}
          <div className="grid grid-cols-2 gap-px border-t border-[var(--theme-border-subtle)] bg-[var(--theme-border-subtle)] sm:grid-cols-4">
            {tiles.map((tile) => {
              const TileIcon = tile.icon;
              return (
                <div
                  key={tile.label}
                  className="min-w-0 bg-[var(--theme-surface)] px-4 py-4 transition-colors hover:bg-[var(--theme-surface-hover)] sm:px-5"
                >
                  <Label>{tile.label}</Label>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <TileIcon
                      className="h-3 w-3 shrink-0"
                      aria-hidden="true"
                      style={{ color: tile.live ? TASKS_ACCENT : 'var(--theme-text-dim)' }}
                    />
                    <span className="min-w-0 break-words font-mono text-[12px] font-medium text-[var(--theme-text)]">
                      {tile.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* ── Composed section 1 · state ladder ── */}
        <Reveal delay={0.06} reduced={reduced} className="mt-12">
          <SectionHeading title="State" hint={`${active + 1} / ${STEPS.length}`} />

          <ol className="flex items-stretch gap-2 sm:gap-3">
            {STEPS.map((step, index) => {
              const passed = index <= active;
              const live = index === active;
              return (
                <li key={step.key} className="min-w-0 flex-1">
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--theme-border)]">
                    <motion.div
                      className="h-full w-full origin-left rounded-full"
                      style={{
                        background: passed ? TASKS_ACCENT : 'transparent',
                        opacity: passed ? (live ? 1 : 0.4) : 0,
                      }}
                      initial={reduced ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reduced ? 0 : 0.45,
                        delay: reduced ? 0 : 0.12 + index * 0.07,
                        ease: EASE,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      aria-hidden="true"
                      style={{
                        background: passed ? TASKS_ACCENT : 'var(--theme-border)',
                        boxShadow: live ? `0 0 0 3px ${TASKS_ACCENT}26` : 'none',
                      }}
                    />
                    <span
                      className={`truncate font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] ${
                        live ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-dim)]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--theme-text-muted)]">
            <span
              className="mt-[5px] inline-block h-[10px] w-[2px] shrink-0"
              aria-hidden="true"
              style={{ background: TASKS_ACCENT }}
            />
            {liveStep.note}
          </p>
        </Reveal>

        {/* ── Brief (task body) ── */}
        <Reveal delay={0.1} reduced={reduced} className="mt-12">
          <SectionHeading title="Brief" hint={hasBody ? undefined : 'empty'} />
          <div className="relative pl-5">
            <span
              className="absolute bottom-1 left-0 top-1 w-px"
              aria-hidden="true"
              style={{ background: `linear-gradient(180deg, ${TASKS_ACCENT}, transparent)` }}
            />
            {hasBody ? (
              <p className="max-w-[62ch] whitespace-pre-line text-[14.5px] leading-[1.75] text-[var(--theme-text-muted)]">
                {item.body}
              </p>
            ) : (
              <p className="font-mono text-[12px] leading-relaxed text-[var(--theme-text-dim)]">
                No notes captured. The title is the whole instruction.
              </p>
            )}
          </div>
        </Reveal>

        {/* ── Attributes (raw fields, preserved) ── */}
        {fieldCount > 0 ? (
          <Reveal delay={0.14} reduced={reduced} className="mt-12">
            <SectionHeading
              title="Attributes"
              hint={`${fieldCount} field${fieldCount === 1 ? '' : 's'}`}
            />
            <dl>
              {item.fields.map((field) => (
                <div
                  key={field.label}
                  className="-mx-3 flex flex-wrap items-start gap-x-4 gap-y-1 rounded-[var(--theme-radius-sm)] border-b border-[var(--theme-border-subtle)] px-3 py-3.5 transition-colors last:border-b-0 hover:bg-[var(--theme-surface-hover)]"
                >
                  <dt className="w-28 shrink-0 pt-[3px] font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
                    {field.label}
                  </dt>
                  <dd className="min-w-0 flex-1 break-words text-[13.5px] leading-snug text-[var(--theme-text)]">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ) : null}

        {/* ── Composed section 2 · command rail ── */}
        <Reveal delay={0.18} reduced={reduced} className="mt-12">
          <SectionHeading title="Commands" hint="1 available" />
          <div className="overflow-hidden rounded-[var(--theme-radius)] border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[var(--theme-shadow)]">
            <button
              type="button"
              onClick={onBack}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--theme-surface-hover)] focus:outline-none focus-visible:bg-[var(--theme-surface-hover)]"
              style={{ borderLeft: `2px solid ${TASKS_ACCENT}` }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--theme-radius-sm)]"
                aria-hidden="true"
                style={{ background: `${TASKS_ACCENT}18`, color: TASKS_ACCENT }}
              >
                <CornerDownLeft className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--theme-text)]">
                {backLabel}
              </span>
              <Keycap>esc</Keycap>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-dim)]"
                aria-hidden="true"
              />
            </button>
          </div>
        </Reveal>

        {/* ── Footer legend ── */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--theme-border-subtle)] pt-5">
          <span className="inline-flex items-center gap-2">
            <Keycap>esc</Keycap>
            <Label>close</Label>
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
            tasks/{item.id}
          </span>
        </div>
      </div>
    </div>
  );
}
