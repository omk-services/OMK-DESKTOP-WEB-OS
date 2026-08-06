/**
 * PeopleDetailPage.tsx — People / Agents drill ("Soft Roster" workspace).
 *
 * Style signature: **Neumorphism + Soft UI Evolution** (uupm.cc catalogue).
 * Everything is either extruded (pillow) or pressed (groove) out of the SAME
 * surface — no cards-on-background, no hard borders, no dividers. Depth is
 * carried by a dual-tone shadow pair derived at runtime from the active theme:
 *
 *   --nm-shade  = the theme surface pushed toward black  (bottom-right shade)
 *   --nm-glow   = the theme surface pushed toward white  (top-left  highlight)
 *
 * Because both are `color-mix()` on `var(--theme-surface)`, the extrusion
 * inverts correctly on dark themes (People's canonical theme is `aurora`,
 * a dark gradient) without a single hardcoded neutral.
 *
 * Content contract (unchanged): every field of PeopleDetailItem still renders —
 * title, subtitle, status, initials, meta[], squad[], fields[] — plus the
 * back callback. `fields[]` was previously declared but never painted; it now
 * has its own "Dossier" block.
 *
 * Composed sections beyond the raw fields:
 *   1. Vitals strip     — 4 telemetry dials (live agent) or meta dials (fallback)
 *   2. Capacity meter   — pressed groove + extruded accent fill + fleet share
 *   3. Lifecycle ladder — 5 rungs, the current state extruded out of the rail
 *   4. Signal log       — activity feed with a filter toggle
 *   5. Handoffs / capabilities — related-item pebbles
 *
 * Live telemetry is joined from ./fleet by agent code or name; when the item is
 * not a fleet agent the page degrades to the meta/fields/squad it was given.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import {
  Activity,
  ArrowLeft,
  Bot,
  Clock,
  Cpu,
  ExternalLink,
  Fingerprint,
  Gauge,
  Radio,
  Send,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { DetailField } from '../../components/DetailPage';
import { useReducedMotion } from '../../components/cms/overlayMotions';
import { useThemeFor } from '../../lib/themes/store';
import { FLEET_AGENTS, STATE_META, type FleetAgent } from './fleet';

export interface PeopleDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  initials: string;
  fields: DetailField[];
  squad: { name: string; color: string }[];
  meta: { label: string; value: string }[];
}

interface PeopleDetailPageProps {
  item: PeopleDetailItem;
  onBack: () => void;
  backLabel?: string;
  /** Optional cross-app jump. When absent the secondary pillow is not rendered. */
  onNavigate?: (appId: string) => void;
}

/** People's own identity meta — emerald Domaine 01 (Green Lantern / Agent Factory). */
export const PEOPLE_DETAIL_META: {
  label: string;
  icon: LucideIcon;
  accent: string;
  action: { label: string; appId: string };
} = {
  label: 'Roster profile',
  icon: Users,
  accent: '#059669',
  action: { label: 'Open in Tasks', appId: 'tasks' },
};

/* ── Soft UI primitives ──────────────────────────────────────────────────── */

/** Runtime-derived extrusion pair. Declared on the page root, inherited by all. */
const SOFT_VARS: Record<string, string> = {
  '--nm-shade': 'color-mix(in srgb, color-mix(in srgb, var(--theme-surface) 54%, #05060b) 62%, transparent)',
  '--nm-glow': 'color-mix(in srgb, color-mix(in srgb, var(--theme-surface) 54%, #ffffff) 60%, transparent)',
};

const RAISED: CSSProperties = {
  background: 'var(--theme-surface)',
  boxShadow: '9px 9px 22px var(--nm-shade), -9px -9px 22px var(--nm-glow)',
};
const RAISED_SM: CSSProperties = {
  background: 'var(--theme-surface)',
  boxShadow: '5px 5px 13px var(--nm-shade), -5px -5px 13px var(--nm-glow)',
};
const RAISED_XS: CSSProperties = {
  background: 'var(--theme-surface)',
  boxShadow: '3px 3px 7px var(--nm-shade), -3px -3px 7px var(--nm-glow)',
};
const SUNK: CSSProperties = {
  boxShadow: 'inset 6px 6px 13px var(--nm-shade), inset -5px -5px 12px var(--nm-glow)',
};
const SUNK_XS: CSSProperties = {
  boxShadow: 'inset 3px 3px 6px var(--nm-shade), inset -2px -2px 5px var(--nm-glow)',
};

/** Pillow radius: theme radius plus a soft-UI bias so hard-edged themes stay pillowy. */
const R_LG = 'calc(var(--theme-radius-lg) + 10px)';
const R_MD = 'calc(var(--theme-radius) + 8px)';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]';

/* ── Lifecycle ladder ────────────────────────────────────────────────────── */

const LADDER: FleetAgent['state'][] = ['IDLE', 'AWAITING', 'EXECUTING', 'RETRY', 'BLOCKED'];

interface Vital {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  pct: number | null;
}

interface Rise {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; delay: number; ease: [number, number, number, number] };
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PeopleDetailPage({
  item,
  onBack,
  backLabel = 'Back to People',
  onNavigate,
}: PeopleDetailPageProps): JSX.Element {
  const reduced = useReducedMotion();
  const isDark = useThemeFor('people').isDark;
  const [logFilter, setLogFilter] = useState<'all' | 'attention'>('all');
  const [pinged, setPinged] = useState(false);

  const agent = useMemo<FleetAgent | null>(() => {
    const code = item.id.trim().toLowerCase();
    const name = item.title.trim().toLowerCase();
    return (
      FLEET_AGENTS.find((a) => a.code.toLowerCase() === code || a.name.toLowerCase() === name) ?? null
    );
  }, [item.id, item.title]);

  const accent = agent?.accent ?? PEOPLE_DETAIL_META.accent;
  const initials = (item.initials || item.title.slice(0, 2)).toUpperCase();

  const activeState: FleetAgent['state'] | null =
    agent?.state ?? LADDER.find((s) => s === item.status.trim().toUpperCase()) ?? null;
  const activeIdx = activeState ? LADDER.indexOf(activeState) : -1;
  const stateMeta = activeState ? STATE_META[activeState] : null;

  /* Status ink/pad flip so semantic state colours stay legible on dark themes. */
  const statusInk = stateMeta ? (isDark ? stateMeta.bg : stateMeta.color) : accent;
  const statusPad = stateMeta ? (isDark ? `${stateMeta.color}66` : stateMeta.bg) : `${accent}1f`;

  const vitals: Vital[] = agent
    ? [
        {
          icon: Gauge,
          label: 'Tasks today',
          value: String(agent.tasksToday),
          hint: `${agent.share}% of fleet cycles`,
          pct: Math.min(100, Math.round((agent.tasksToday / 350) * 100)),
        },
        { icon: Zap, label: 'Tokens burned', value: agent.tokens, hint: `model · ${agent.defaultModel}`, pct: null },
        { icon: Clock, label: 'Avg latency', value: agent.latency, hint: `channel ${agent.channel}`, pct: null },
        {
          icon: ShieldCheck,
          label: 'Success rate',
          value: `${agent.success}%`,
          hint: 'rolling 24 h',
          pct: agent.success,
        },
      ]
    : item.meta.slice(0, 4).map((m) => ({
        icon: Fingerprint,
        label: m.label,
        value: m.value,
        hint: '',
        pct: null,
      }));

  const runs = agent
    ? agent.recentRuns.filter((r) => (logFilter === 'all' ? true : r.status !== 'ok'))
    : [];

  const rise = (i: number): Rise => ({
    initial: reduced ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.04 * i, ease: EASE },
  });

  const rootVars: CSSProperties = { ...SOFT_VARS, '--nm-accent': accent } as CSSProperties;

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]"
      style={{ ...rootVars, fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-6 sm:px-7 sm:py-8">
        {/* ── Top rail: back pebble + app identity eyebrow ─────────────── */}
        <motion.header {...rise(0)} className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            style={RAISED_SM}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--theme-text-muted)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-[var(--theme-text)] active:translate-y-0 active:scale-95 ${FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div
            style={{ ...RAISED_SM, borderRadius: 999 }}
            className="flex min-w-0 items-center gap-2 px-3.5 py-2"
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
              style={{ background: `${accent}24`, color: accent }}
            >
              <Bot className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--theme-text-muted)]">
              People · Agent Factory
            </span>
          </div>

          <span className="ml-auto hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)] sm:block">
            {PEOPLE_DETAIL_META.label}
          </span>
        </motion.header>

        {/* ── HERO — avatar-forward pillow ─────────────────────────────── */}
        <motion.section
          {...rise(1)}
          style={{ ...RAISED, borderRadius: R_LG }}
          className="relative overflow-hidden p-5 sm:p-7"
        >
          {/* soft accent bloom, top-right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-60"
            style={{ background: `radial-gradient(circle, ${accent}2e 0%, transparent 68%)` }}
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar — extruded disc inside a pressed ring */}
            <div className="mx-auto shrink-0 md:mx-0">
              <div
                className="relative grid h-[134px] w-[134px] place-items-center rounded-full"
                style={SUNK}
              >
                <div
                  className="grid h-[104px] w-[104px] place-items-center rounded-full text-[30px] font-extrabold tracking-wide text-[color:#fff]"
                  style={{
                    background: `linear-gradient(145deg, ${accent}, ${accent}b8)`,
                    boxShadow: `7px 7px 16px var(--nm-shade), -6px -6px 14px var(--nm-glow), inset 0 2px 6px rgba(255,255,255,0.30), inset 0 -3px 8px ${accent}`,
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                {/* presence pebble */}
                <span
                  className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full"
                  style={RAISED_XS}
                  title={stateMeta ? stateMeta.label : item.status}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${stateMeta?.pulse && !reduced ? 'animate-pulse' : ''}`}
                    style={{ background: statusInk, boxShadow: `0 0 8px ${statusInk}` }}
                  />
                </span>
              </div>
            </div>

            {/* Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
                  style={{ background: statusPad, color: statusInk }}
                >
                  <Radio className="h-3 w-3" />
                  {stateMeta ? stateMeta.label : item.status}
                </span>
                {agent ? (
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-[var(--theme-text-muted)]"
                    style={SUNK_XS}
                  >
                    {agent.code}
                  </span>
                ) : null}
              </div>

              <h1
                tabIndex={-1}
                className="mt-3 text-[30px] font-bold leading-[1.05] tracking-tight text-[var(--theme-text)] focus:outline-none sm:text-[36px]"
                style={{ fontFamily: 'var(--theme-font-display)' }}
              >
                {item.title}
              </h1>

              <p className="mt-1.5 text-[13.5px] text-[var(--theme-text-muted)]">
                {item.subtitle}
                {agent ? <span className="font-mono text-[var(--theme-text-dim)]"> · {agent.channel}</span> : null}
              </p>

              {agent ? (
                <p className="mt-3.5 max-w-2xl text-[13px] leading-relaxed text-[var(--theme-text-muted)]">
                  {agent.bio}
                </p>
              ) : null}

              {/* Squad pebbles */}
              {item.squad.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)]">
                    Squad
                  </span>
                  {item.squad.map((s) => (
                    <span
                      key={s.name}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-[var(--theme-text)]"
                      style={RAISED_XS}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.color, boxShadow: `0 0 6px ${s.color}99` }}
                      />
                      {s.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Action stack */}
            <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-[196px]">
              <button
                type="button"
                onClick={() => setPinged((p) => !p)}
                aria-pressed={pinged}
                style={
                  pinged
                    ? { ...SUNK_XS, background: 'var(--theme-surface)', color: accent, borderRadius: R_MD }
                    : {
                        background: `linear-gradient(145deg, ${accent}, ${accent}c4)`,
                        boxShadow: `6px 6px 14px var(--nm-shade), -5px -5px 12px var(--nm-glow), inset 0 1px 0 rgba(255,255,255,0.28)`,
                        borderRadius: R_MD,
                      }
                }
                className={`inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-[12.5px] font-bold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
                  pinged ? '' : 'text-[color:#fff]'
                } ${FOCUS}`}
              >
                <Send className="h-3.5 w-3.5" />
                {pinged ? 'Queued for standup' : `Ping ${agent?.name ?? 'agent'}`}
              </button>

              {onNavigate ? (
                <button
                  type="button"
                  onClick={() => onNavigate(PEOPLE_DETAIL_META.action.appId)}
                  style={{ ...RAISED_SM, borderRadius: R_MD }}
                  className={`inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-[12.5px] font-bold text-[var(--theme-text-muted)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-[var(--theme-text)] active:translate-y-0 active:scale-[0.98] ${FOCUS}`}
                >
                  {PEOPLE_DETAIL_META.action.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : null}

              <p className="px-1 text-center text-[10px] leading-snug text-[var(--theme-text-dim)] md:text-left">
                {pinged
                  ? 'The Gatekeeper reviews pings at the 9am standup.'
                  : 'Nothing ships without your approval.'}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── VITALS strip ─────────────────────────────────────────────── */}
        {vitals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {vitals.map((v, i) => {
              const VIcon = v.icon;
              return (
                <motion.div
                  key={`${v.label}-${i}`}
                  {...rise(2 + i)}
                  style={{ ...RAISED_SM, borderRadius: R_MD }}
                  className="flex flex-col gap-2 p-4 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                      style={{ ...SUNK_XS, color: accent }}
                    >
                      <VIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                      {v.label}
                    </span>
                  </div>

                  <div className="truncate text-[26px] font-bold leading-none tabular-nums text-[var(--theme-text)]">
                    {v.value}
                  </div>

                  {v.pct !== null ? (
                    <div className="mt-0.5 h-2 w-full rounded-full" style={SUNK_XS}>
                      <div
                        className="h-2 rounded-full transition-[width] duration-700"
                        style={{
                          width: `${Math.max(4, v.pct)}%`,
                          background: `linear-gradient(90deg, ${accent}, ${accent}9c)`,
                          boxShadow: `0 1px 4px ${accent}66`,
                        }}
                      />
                    </div>
                  ) : null}

                  {v.hint ? (
                    <span className="truncate text-[10.5px] text-[var(--theme-text-muted)]">{v.hint}</span>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* ── MAIN GRID ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left column */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            {/* Capacity meter */}
            {agent ? (
              <motion.section
                {...rise(6)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <SoftHead icon={Gauge} accent={accent} title="Current load" note={`${agent.load}%`} />

                <div className="mt-4 h-5 w-full rounded-full p-1" style={SUNK}>
                  <div
                    className="h-3 rounded-full transition-[width] duration-700"
                    style={{
                      width: `${Math.max(4, agent.load)}%`,
                      background: `linear-gradient(135deg, ${accent}, ${accent}a0)`,
                      boxShadow: `0 2px 8px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
                    }}
                  />
                </div>

                <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--theme-text-muted)]">
                  {agent.task}
                </p>

                {/* Fleet share — 10 pressed segments, filled ones extruded */}
                <div className="mt-5 flex items-center gap-3">
                  <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                    Fleet share
                  </span>
                  <div className="flex flex-1 items-center gap-1.5">
                    {Array.from({ length: 10 }, (_, i) => {
                      const on = i < Math.round(agent.share / 10);
                      return (
                        <span
                          key={i}
                          className="h-2.5 flex-1 rounded-full"
                          style={
                            on
                              ? { background: accent, boxShadow: `0 1px 5px ${accent}70` }
                              : SUNK_XS
                          }
                        />
                      );
                    })}
                  </div>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--theme-text)]">
                    {agent.share}%
                  </span>
                </div>
              </motion.section>
            ) : null}

            {/* Lifecycle ladder */}
            <motion.section
              {...rise(7)}
              style={{ ...RAISED, borderRadius: R_LG }}
              className="p-5 sm:p-6"
            >
              <SoftHead
                icon={Radio}
                accent={accent}
                title="Lifecycle"
                note={stateMeta ? stateMeta.label : item.status}
              />

              <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
                {LADDER.map((s, i) => {
                  const isActive = i === activeIdx;
                  const isPast = activeIdx > i;
                  return (
                    <li key={s} className="sm:flex-1">
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1.5"
                        style={
                          isActive
                            ? { ...RAISED_SM, borderRadius: R_MD }
                            : { ...SUNK_XS, borderRadius: R_MD }
                        }
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background: isActive
                              ? accent
                              : isPast
                                ? 'var(--theme-text-muted)'
                                : 'var(--theme-text-dim)',
                            boxShadow: isActive ? `0 0 8px ${accent}` : 'none',
                          }}
                        />
                        <span
                          className="truncate text-[11px] font-bold uppercase tracking-[0.1em]"
                          style={{ color: isActive ? accent : 'var(--theme-text-dim)' }}
                        >
                          {STATE_META[s].label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-3.5 text-[11.5px] leading-relaxed text-[var(--theme-text-muted)]">
                B1 Gatekeeper gates every rung. An agent only leaves{' '}
                <span className="font-semibold text-[var(--theme-text)]">Awaiting</span> once you approve
                what it proposes to ship.
              </p>
            </motion.section>

            {/* Signal log */}
            {agent ? (
              <motion.section
                {...rise(8)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <SoftHead icon={Activity} accent={accent} title="Signal log" note="last 30 min" />
                  <div className="ml-auto flex items-center gap-1 rounded-full p-1" style={SUNK_XS}>
                    {(['all', 'attention'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLogFilter(f)}
                        aria-pressed={logFilter === f}
                        style={
                          logFilter === f
                            ? { ...RAISED_XS, color: accent, borderRadius: 999 }
                            : { borderRadius: 999 }
                        }
                        className={`px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
                          logFilter === f ? '' : 'text-[var(--theme-text-dim)] hover:text-[var(--theme-text-muted)]'
                        } ${FOCUS}`}
                      >
                        {f === 'all' ? 'All' : 'Attention'}
                      </button>
                    ))}
                  </div>
                </div>

                <ol className="mt-4 flex flex-col gap-2">
                  {runs.map((r, i) => {
                    const ink = r.status === 'ok' ? 'var(--theme-text-muted)' : accent;
                    return (
                      <li
                        key={`${r.ts}-${i}`}
                        className="flex items-center gap-3 rounded-[var(--theme-radius)] px-2.5 py-2 transition-colors hover:bg-[var(--theme-surface-hover)]"
                      >
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[8.5px] font-bold text-[var(--theme-text-dim)]"
                          style={SUNK_XS}
                        >
                          {r.ts.replace(':', '')}
                        </span>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            background: ink,
                            boxShadow: r.status === 'ok' ? 'none' : `0 0 7px ${accent}`,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--theme-text)]">
                          {r.task}
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                          style={
                            r.status === 'ok'
                              ? { ...SUNK_XS, color: 'var(--theme-text-dim)' }
                              : { background: `${accent}20`, color: accent }
                          }
                        >
                          {r.status}
                        </span>
                      </li>
                    );
                  })}
                  {runs.length === 0 ? (
                    <li className="px-2.5 py-6 text-center text-[12px] text-[var(--theme-text-dim)]">
                      Nothing needs your attention in this window.
                    </li>
                  ) : null}
                </ol>
              </motion.section>
            ) : null}
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            {/* Profile / meta */}
            {item.meta.length > 0 ? (
              <motion.section
                {...rise(9)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <SoftHead icon={Fingerprint} accent={accent} title="Profile" note={`${item.meta.length}`} />
                <dl className="mt-4 flex flex-col gap-2">
                  {item.meta.map((m) => (
                    <div
                      key={m.label}
                      className="flex items-baseline justify-between gap-4 px-3.5 py-2.5"
                      style={{ ...SUNK_XS, borderRadius: R_MD }}
                    >
                      <dt className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--theme-text-dim)]">
                        {m.label}
                      </dt>
                      <dd className="min-w-0 truncate text-right text-[13px] font-semibold text-[var(--theme-text)]">
                        {m.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.section>
            ) : null}

            {/* Dossier — the raw fields, engraved */}
            {item.fields.length > 0 ? (
              <motion.section
                {...rise(10)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <SoftHead icon={Bot} accent={accent} title="Dossier" note={`${item.fields.length}`} />
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {item.fields.map((f) => (
                    <div
                      key={f.label}
                      className="flex flex-col gap-1 px-3.5 py-3"
                      style={{ ...SUNK_XS, borderRadius: R_MD }}
                    >
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--theme-text-dim)]">
                        {f.label}
                      </span>
                      <span className="text-[13px] font-semibold leading-snug text-[var(--theme-text)]">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : null}

            {/* Capabilities */}
            {agent && agent.capabilities.length > 0 ? (
              <motion.section
                {...rise(11)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <SoftHead icon={Zap} accent={accent} title="Capabilities" note={`${agent.capabilities.length}`} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-[var(--theme-text-muted)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-[var(--theme-text)]"
                      style={RAISED_XS}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </motion.section>
            ) : null}

            {/* Handoffs */}
            {agent && agent.peers.length > 0 ? (
              <motion.section
                {...rise(12)}
                style={{ ...RAISED, borderRadius: R_LG }}
                className="p-5 sm:p-6"
              >
                <SoftHead icon={Cpu} accent={accent} title="Handoffs" note="manager → worker" />
                <ul className="mt-4 flex flex-col gap-2">
                  {agent.peers.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-3 px-3.5 py-2.5 transition-transform duration-200 hover:-translate-y-0.5"
                      style={{ ...RAISED_XS, borderRadius: R_MD }}
                    >
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[9px] font-bold"
                        style={{ background: `${accent}1f`, color: accent }}
                      >
                        {p.slice(2, 4)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--theme-text)]">
                        {p}
                      </span>
                      <Users className="h-3.5 w-3.5 shrink-0 text-[var(--theme-text-dim)]" />
                    </li>
                  ))}
                </ul>
              </motion.section>
            ) : null}
          </div>
        </div>

        {/* ── Footer back bar ──────────────────────────────────────────── */}
        <motion.div {...rise(13)} className="pb-2">
          <button
            type="button"
            onClick={onBack}
            style={{ ...RAISED_SM, borderRadius: R_MD }}
            className={`flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.14em] text-[var(--theme-text-muted)] transition-transform duration-200 hover:-translate-y-0.5 hover:text-[var(--theme-text)] active:translate-y-0 active:scale-[0.995] ${FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Engraved section head ───────────────────────────────────────────────── */

function SoftHead({
  icon: Icon,
  accent,
  title,
  note,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  note?: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
        style={{ ...SUNK_XS, color: accent }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--theme-text-muted)]">
        {title}
      </h2>
      {note ? (
        <span className="truncate text-[10.5px] font-semibold tabular-nums text-[var(--theme-text-dim)]">
          {note}
        </span>
      ) : null}
    </div>
  );
}
