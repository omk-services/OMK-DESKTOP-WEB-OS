/**
 * OperationsDetailPage.tsx — "CONTROL BOARD" redesign.
 *
 * Style: Vibrant & Block-based (UI UX Pro Max — vibrant-block-based).
 * Flat colour blocks, 3–6px confident dividers, oversized section numerals,
 * hard offset shadows, caution-tape signature strips. Reads like a control board.
 *
 * Theming contract: every neutral (surface / text / border / bg) comes from the
 * runtime --theme-* CSS variables. The only fixed colours are:
 *   - ACCENT (#4f46e5) — the Operations app accent, used for signature moments.
 *   - The 3 severity tones — these are *domain data*, mirrored from OperationsApp.tsx.
 * Both are only ever used as tints / borders / rails / numerals; readable text is
 * always var(--theme-text), so light AND dark themes both survive.
 *
 * Props signature and exported names are unchanged (wired from OperationsApp.tsx).
 */
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Activity,
  ListChecks,
  Database,
  ShieldCheck,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';

export interface OperationsDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  body: string;
  sidebar: { label: string; value: string }[];
  incidents: { severity: 'low' | 'medium' | 'high'; title: string; at: string }[];
  fields: DetailField[];
}

interface OperationsDetailPageProps {
  item: OperationsDetailItem;
  onBack: () => void;
  backLabel?: string;
}

/** Operations accent — the one allowed non-theme colour (matches OperationsApp ACCENT). */
const ACCENT = '#4f46e5';

/** Severity tones = domain data (mirrored from OperationsApp CATEGORY/severity map). */
const TONE: Record<string, string> = {
  low: '#16a34a',
  ok: '#16a34a',
  medium: '#f59e0b',
  warn: '#f59e0b',
  high: '#dc2626',
  danger: '#dc2626',
};

const SEVERITY_ORDER: readonly ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

function toneOf(key: string): string {
  return TONE[key.trim().toLowerCase()] ?? ACCENT;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

interface Segment {
  kind: 'head' | 'step';
  text: string;
  /** step ordinal (0-based); -1 for headings */
  index: number;
}

/** Runbooks arrive as "a → b → c"; knowledge articles arrive as markdown-ish lines. */
function parseBody(body: string): Segment[] {
  const raw = body ?? '';
  const out: Segment[] = [];
  let n = 0;

  if (raw.includes('→')) {
    for (const chunk of raw.split('→')) {
      const text = chunk.trim();
      if (!text) continue;
      out.push({ kind: 'step', text, index: n });
      n += 1;
    }
    return out;
  }

  for (const line of raw.split('\n')) {
    const text = line.trim();
    if (!text) continue;
    if (text.startsWith('#')) {
      out.push({ kind: 'head', text: text.replace(/^#+\s*/, ''), index: -1 });
      continue;
    }
    out.push({ kind: 'step', text: text.replace(/^[-*]\s*/, ''), index: n });
    n += 1;
  }
  return out;
}

interface RiseProps {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; delay: number };
}

function makeRise(reduced: boolean, i: number): RiseProps {
  if (reduced) {
    return { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0, delay: 0 } };
  }
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.34, delay: 0.05 * i },
  };
}

/** Signature element — diagonal caution tape in the app accent. */
function TapeStrip() {
  return (
    <div
      aria-hidden="true"
      className="h-[10px] w-full"
      style={{ backgroundImage: `repeating-linear-gradient(45deg, ${ACCENT} 0 8px, transparent 8px 16px)` }}
    />
  );
}

function SectionHeader({
  numeral,
  title,
  note,
  Icon,
}: {
  numeral: string;
  title: string;
  note: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-1 border-b-[5px] border-[color:var(--theme-text)] pb-1.5">
      <span
        className="text-[54px] font-black leading-[0.72] tracking-[-0.05em]"
        style={{ color: ACCENT, fontFamily: 'var(--theme-font-display)' }}
      >
        {numeral}
      </span>
      <h2 className="flex items-center gap-2 pb-1 text-[14px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)]">
        <Icon className="h-4 w-4" strokeWidth={3} />
        {title}
      </h2>
      <span className="ml-auto pb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
        {note}
      </span>
    </div>
  );
}

function Readout({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      className="min-w-[128px] flex-1 border-r-[3px] border-[color:var(--theme-text)] px-4 py-3 last:border-r-0"
      style={{ background: `${tone}12` }}
    >
      <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">{label}</div>
      <div className="mt-1 truncate text-[22px] font-black uppercase leading-none tracking-[-0.02em] text-[var(--theme-text)]">
        {value}
      </div>
    </div>
  );
}

export function OperationsDetailPage({
  item,
  onBack,
  backLabel = 'Back to Operations',
}: OperationsDetailPageProps) {
  const reduced = useReducedMotion() ?? false;
  const segments = useMemo<Segment[]>(() => parseBody(item.body), [item.body]);
  const steps = useMemo<Segment[]>(() => segments.filter((s) => s.kind === 'step'), [segments]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const verified = steps.reduce((acc, s) => (checked[s.index] ? acc + 1 : acc), 0);
  const allDone = steps.length > 0 && verified === steps.length;

  const toggle = (index: number): void => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleAll = (): void => {
    if (allDone) {
      setChecked({});
      return;
    }
    const next: Record<number, boolean> = {};
    for (const s of steps) next[s.index] = true;
    setChecked(next);
  };

  const statusTone = toneOf(item.status);
  const worstSeverity = SEVERITY_ORDER.reduce<'low' | 'medium' | 'high' | null>(
    (acc, sev) => (item.incidents.some((i) => i.severity === sev) ? sev : acc),
    null
  );

  const maxLen = steps.reduce((m, s) => Math.max(m, s.text.length), 1);
  const recordCode = `OPS-${item.id.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase() || '000000'}`;
  const meta: { label: string; value: string }[] = [...item.sidebar, ...item.fields];

  return (
    <div
      className="min-h-full w-full overflow-x-hidden bg-[var(--theme-bg)]"
      style={{ fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-7 sm:py-7">
        {/* ── CONTROL RAIL ─────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-[6px] border-[color:var(--theme-text)] pb-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-2 border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--theme-text)] shadow-[5px_5px_0_var(--theme-text)] transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3.5} />
            {backLabel}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--theme-text-dim)]">
              Operations · Control board
            </span>
            <span
              className="border-[2px] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--theme-text)]"
              style={{ borderColor: ACCENT, background: `${ACCENT}14` }}
            >
              {recordCode}
            </span>
          </div>
        </div>

        {/* ── HERO BLOCK ───────────────────────────────────────────── */}
        <motion.section
          {...makeRise(reduced, 0)}
          className="mb-8 border-[4px] border-[color:var(--theme-text)] bg-[var(--theme-surface)]"
          style={{ boxShadow: `10px 10px 0 ${ACCENT}` }}
        >
          <TapeStrip />
          <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
            <div
              className="flex h-[76px] w-[76px] shrink-0 items-center justify-center border-[3px]"
              style={{ borderColor: ACCENT, background: `${ACCENT}1f` }}
            >
              <ClipboardList className="h-9 w-9" strokeWidth={2.5} style={{ color: ACCENT }} />
            </div>

            <div className="min-w-[240px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="border-[2px] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)]"
                  style={{ borderColor: statusTone, background: `${statusTone}22` }}
                >
                  {item.status}
                </span>
                {worstSeverity ? (
                  <span
                    className="inline-flex items-center gap-1.5 border-[2px] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)]"
                    style={{ borderColor: toneOf(worstSeverity), background: `${toneOf(worstSeverity)}18` }}
                  >
                    <AlertTriangle className="h-3 w-3" strokeWidth={3} />
                    {worstSeverity} severity
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border-[2px] border-[color:var(--theme-border)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
                    <ShieldCheck className="h-3 w-3" strokeWidth={3} />
                    clear
                  </span>
                )}
              </div>

              <h1
                tabIndex={-1}
                className="mt-3 text-[clamp(26px,3vw,40px)] font-black uppercase leading-[0.94] tracking-[-0.025em] text-[var(--theme-text)] focus:outline-none"
                style={{ fontFamily: 'var(--theme-font-display)' }}
              >
                {item.title}
              </h1>
              {item.subtitle ? (
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-muted)]">
                  {item.subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap border-t-[4px] border-[color:var(--theme-text)]">
            <Readout label="Steps" value={pad(steps.length)} tone={ACCENT} />
            <Readout label="Verified" value={`${pad(verified)}/${pad(steps.length)}`} tone={allDone ? TONE.low : ACCENT} />
            <Readout label="Incidents" value={pad(item.incidents.length)} tone={worstSeverity ? toneOf(worstSeverity) : ACCENT} />
            <Readout label="State" value={item.status} tone={statusTone} />
          </div>
        </motion.section>

        {/* ── 01 · PROCEDURE ───────────────────────────────────────── */}
        <motion.section {...makeRise(reduced, 1)} className="mb-9">
          <SectionHeader
            numeral="01"
            title="Procedure"
            note={steps.length > 0 ? `${verified} of ${steps.length} verified` : 'no steps recorded'}
            Icon={ListChecks}
          />

          {steps.length > 0 ? (
            <div
              className="mb-4 flex gap-1.5 border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] p-1.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={verified}
              aria-label="Steps verified"
            >
              {steps.map((s) => (
                <div
                  key={`seg-${s.index}`}
                  className="h-3 flex-1 transition-colors duration-200 motion-reduce:transition-none"
                  style={{ background: checked[s.index] ? ACCENT : `${ACCENT}1f` }}
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-2.5">
            {segments.length === 0 ? (
              <div className="border-[3px] border-dashed border-[color:var(--theme-border)] bg-[var(--theme-surface)] px-4 py-8 text-center text-[12px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
                No procedure recorded
              </div>
            ) : null}

            {segments.map((seg, i) => {
              if (seg.kind === 'head') {
                return (
                  <div
                    key={`h-${i}`}
                    className="mt-5 border-l-[8px] bg-[var(--theme-surface)] px-3 py-2 text-[12px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)]"
                    style={{ borderColor: ACCENT }}
                  >
                    {seg.text}
                  </div>
                );
              }
              const done = Boolean(checked[seg.index]);
              return (
                <button
                  key={`s-${seg.index}`}
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggle(seg.index)}
                  className="flex w-full items-stretch border-[3px] border-[color:var(--theme-text)] text-left transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-[6px_6px_0_var(--theme-text)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{ background: done ? `${ACCENT}1a` : 'var(--theme-surface)' }}
                >
                  <span
                    className="flex w-[56px] shrink-0 items-center justify-center border-r-[3px] border-[color:var(--theme-text)] text-[22px] font-black leading-none tracking-[-0.04em]"
                    style={{ background: done ? `${ACCENT}33` : `${ACCENT}12`, color: ACCENT }}
                  >
                    {pad(seg.index + 1)}
                  </span>
                  <span
                    className={`flex-1 px-4 py-3.5 text-[13.5px] font-semibold leading-snug text-[var(--theme-text)] ${done ? 'opacity-70' : ''}`}
                  >
                    {seg.text}
                  </span>
                  <span className="flex w-[50px] shrink-0 items-center justify-center border-l-[3px] border-[color:var(--theme-text)]">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5" strokeWidth={3} style={{ color: ACCENT }} />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--theme-text-dim)]" strokeWidth={3} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── 02 · LOAD PROFILE (div chart) ────────────────────────── */}
        {steps.length > 1 ? (
          <motion.section {...makeRise(reduced, 2)} className="mb-9">
            <SectionHeader numeral="02" title="Load profile" note="relative step weight" Icon={Activity} />
            <div
              role="img"
              aria-label={`Relative weight of each of the ${steps.length} procedure steps`}
              className="border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] p-4"
            >
              <div className="flex h-[132px] items-end gap-1.5">
                {steps.map((s) => {
                  const pct = Math.max(9, Math.round((s.text.length / maxLen) * 100));
                  const done = Boolean(checked[s.index]);
                  return (
                    <div
                      key={`bar-${s.index}`}
                      className="flex h-full flex-1 items-end"
                      title={`Step ${pad(s.index + 1)} — ${s.text.length} chars`}
                    >
                      <div
                        className="w-full border-t-[3px] border-[color:var(--theme-text)] transition-[height,background-color] duration-300 motion-reduce:transition-none"
                        style={{ height: `${pct}%`, background: done ? ACCENT : `${ACCENT}40` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-0 flex gap-1.5 border-t-[4px] border-[color:var(--theme-text)] pt-1.5">
                {steps.map((s) => (
                  <span
                    key={`tick-${s.index}`}
                    className="flex-1 text-center text-[9px] font-black tracking-[0.06em] text-[var(--theme-text-dim)]"
                  >
                    {pad(s.index + 1)}
                  </span>
                ))}
              </div>
            </div>
          </motion.section>
        ) : null}

        {/* ── 03 · INCIDENT LEDGER ─────────────────────────────────── */}
        <motion.section {...makeRise(reduced, 3)} className="mb-9">
          <SectionHeader
            numeral="03"
            title="Incident ledger"
            note={item.incidents.length > 0 ? `${item.incidents.length} on record` : 'nothing on record'}
            Icon={AlertTriangle}
          />

          <div className="flex flex-wrap gap-4">
            <div className="min-w-[260px] flex-[2] space-y-2.5">
              {item.incidents.length > 0 ? (
                item.incidents.map((inc, idx) => {
                  const tone = toneOf(inc.severity);
                  return (
                    <article
                      key={`inc-${idx}`}
                      className="flex items-stretch border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)]"
                    >
                      <span aria-hidden="true" className="w-[12px] shrink-0" style={{ background: tone }} />
                      <div className="min-w-0 flex-1 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="border-[2px] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)]"
                            style={{ borderColor: tone, background: `${tone}1f` }}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                            {inc.at}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[14px] font-black leading-snug text-[var(--theme-text)]">{inc.title}</p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="flex items-center gap-4 border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] px-5 py-6">
                  <span
                    className="text-[52px] font-black leading-[0.7] tracking-[-0.05em]"
                    style={{ color: `${ACCENT}55`, fontFamily: 'var(--theme-font-display)' }}
                  >
                    00
                  </span>
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)]">
                    No incidents attached to this record
                  </span>
                </div>
              )}
            </div>

            {/* severity ladder */}
            <div className="min-w-[190px] flex-1 border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] p-3">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">
                Severity ladder
              </div>
              <div className="space-y-1.5">
                {[...SEVERITY_ORDER].reverse().map((sev) => {
                  const active = worstSeverity === sev;
                  const count = item.incidents.filter((i) => i.severity === sev).length;
                  const tone = toneOf(sev);
                  return (
                    <div
                      key={sev}
                      className="flex items-center justify-between border-[2px] px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--theme-text)]"
                      style={{
                        borderColor: active ? tone : 'var(--theme-border)',
                        background: active ? `${tone}22` : 'transparent',
                        opacity: count > 0 ? 1 : 0.45,
                      }}
                    >
                      <span>{sev}</span>
                      <span style={{ color: count > 0 ? tone : undefined }}>{pad(count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 04 · RECORD INDEX ────────────────────────────────────── */}
        <motion.section {...makeRise(reduced, 4)} className="mb-8">
          <SectionHeader numeral="04" title="Record index" note={`${meta.length} entries`} Icon={Database} />
          {meta.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(184px,1fr))] gap-3">
              {meta.map((m, idx) => (
                <div
                  key={`${m.label}-${idx}`}
                  className="border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] px-3.5 py-3 shadow-[5px_5px_0_var(--theme-border)] transition-transform duration-150 hover:-translate-y-[2px] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">
                    {m.label}
                  </div>
                  <div className="mt-1.5 text-[16px] font-black uppercase leading-tight tracking-[-0.01em] text-[var(--theme-text)]">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-[3px] border-dashed border-[color:var(--theme-border)] px-4 py-6 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-dim)]">
              No metadata on record
            </div>
          )}
        </motion.section>

        {/* ── ACTION BAR ───────────────────────────────────────────── */}
        <motion.div
          {...makeRise(reduced, 5)}
          className="border-[4px] border-[color:var(--theme-text)] bg-[var(--theme-surface)]"
          style={{ boxShadow: `8px 8px 0 ${ACCENT}` }}
        >
          <TapeStrip />
          <div className="flex flex-wrap items-center gap-3 p-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 border-[3px] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--theme-text)] shadow-[5px_5px_0_var(--theme-text)] transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              style={{ borderColor: ACCENT, background: `${ACCENT}26` }}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3.5} />
              {backLabel}
            </button>

            {steps.length > 0 ? (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 border-[3px] border-[color:var(--theme-text)] bg-[var(--theme-surface)] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--theme-text)] shadow-[5px_5px_0_var(--theme-text)] transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
              >
                {allDone ? <RotateCcw className="h-3.5 w-3.5" strokeWidth={3.5} /> : <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3.5} />}
                {allDone ? 'Reset checks' : 'Verify all steps'}
              </button>
            ) : null}

            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.22em] text-[var(--theme-text-dim)]">
              {recordCode} · {pad(verified)}/{pad(steps.length)} verified
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
