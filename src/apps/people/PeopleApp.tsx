/** People / Agents — Domaine 1 of the SOB Convergence: RH & Méta-Gouvernance.
 *  Agent Factory where B2 Visionaries (Green Lanterns) design and B3 specialists
 *  (X-Men) ship. B1 Gatekeeper (the coach) approves what ships.
 *  Subpages:
 *    - Overview  → operating doctrine + today's standup
 *    - Team      → human squad (X-Men)
 *    - Agents    → agent list
 *    - Squads    → B3 bench: 5 specialist AI agents with state/load/latency/tokens
 *    - Content   → per-agent docs library
 *    - Cadence   → 7-day × 24-hour standup heatmap + sprint tasks
 *    - Culture   → operating values
 *  2-level subpage nav: section (left sidebar) → item detail (drill via CMS). */
import { useEffect, useState } from 'react';
import {
  Users, Bot, Heart, Cpu, FileText, Calendar, Clock, Zap,
  Atom, LayoutDashboard, Crown, Activity, CheckCircle2, Play,
  UserSearch, Brain, BookMarked, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { CMSCardList } from '../_ui/CMSCardList';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { PeopleItemDetail } from './PeopleItemDetail';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';

registerItemDetail('people', PeopleItemDetail);
import { launchTour, TOUR_IDS } from '../../lib/tours';
import { PeopleDetailPage, type PeopleDetailItem } from './PeopleDetailPage';
import {
  FLEET_AGENTS, STATE_META, type FleetAgent,
  CONTENT_DOCS,
  DAYS, HOURS, SCHEDULE_GRID, SCHEDULE_TASKS, type ScheduleTask,
} from './fleet';
import { seedPeopleCms } from './seed';
import type { CmsItem } from '../../lib/cms/types';

seedPeopleCms();

// Green Lantern accent — emerald. Matches Domaine 1 brand for the SOB convergence.
const ACCENT = '#059669';
const ACCENT_SOFT = '#10b981';

/** Map agent roles to their squad. Green Lanterns = B2 Visionaries (design/governance),
 *  X-Men = B3 Specialists (execute shippable work). */
function squadForAgent(agent: FleetAgent): 'green-lanterns' | 'xmen' {
  // Orchestrator is the B2 Visionary routing all work.
  return agent.code === 'A-00' ? 'green-lanterns' : 'xmen';
}

const SQUAD_META: Record<'green-lanterns' | 'xmen', { label: string; tagline: string; accent: string }> = {
  'green-lanterns': { label: 'Green Lanterns', tagline: 'B2 Visionaries · design and govern', accent: '#059669' },
  'xmen':          { label: 'X-Men',          tagline: 'B3 Specialists · execute the work',  accent: '#0d9488' },
};

function Culture() {
  const values = ['Client outcomes first', 'Bias to shipped, not perfect', 'Sober by default', 'Own the mistake, keep the receipt'];
  return (
    <div className="p-7">
      <SectionHead title="Culture" subtitle="The operating values every agent inherits" />
      <div className="grid grid-cols-2 gap-3">
        {values.map((v, i) => (
          <div key={i} className="bg-[var(--panel-solid)] rounded-xl border border-[var(--panel-border)] shadow-sm p-5 flex items-start gap-3">
            <Heart className="w-5 h-5 text-[var(--theme-text-muted)] shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-[var(--theme-text)]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Overview — the default landing. Sets the doctrine (Agent Factory + B1 Gatekeeper),
 *  shows the daily standup, and gives the coach ONE primary action.
 *  Implements the Border Beam visual effect on the standup hero card. */
function Overview() {
  const active   = FLEET_AGENTS.filter(a => a.state === 'EXECUTING');
  const idle     = FLEET_AGENTS.filter(a => a.state === 'IDLE');
  const blocked  = FLEET_AGENTS.filter(a => a.state === 'RETRY' || a.state === 'BLOCKED' || a.state === 'AWAITING');

  // T2 — first standup tour. Fires once when the user lands on the People
  // Overview section (after the localStorage guard in launchTour is checked).
  useEffect(() => {
    void launchTour(TOUR_IDS.FIRST_STANDUP);
  }, []);

  const steps: { n: string; title: string; body: string }[] = [
    { n: '1', title: 'Standup at 9am',       body: 'Your agents post overnight work to your inbox.' },
    { n: '2', title: 'Agents ship work',      body: 'Specialists run on autopilot inside the boundaries you set.' },
    { n: '3', title: 'You approve in 10 min', body: 'Yes or no on the queue. Ship or kill. Move on.' },
  ];

  return (
    <div className="p-7 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      {/* Eyebrow + Headline */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
          Domaine 01 · RH & Méta-Gouvernance
        </span>
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
          Your Agent Factory. Your daily standup.
        </h1>
        <p className="text-[13.5px] text-[var(--theme-text-muted)] max-w-2xl leading-relaxed">
          You govern {FLEET_AGENTS.length} specialist agents here. Run a 10-minute standup every morning, approve what they ship, and bring new capabilities online through 2-week sprints. Your agents do the work. You stay the Gatekeeper.
        </p>
      </div>

      {/* How it works — 3 steps, capped, concrete */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">— HOW IT WORKS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4 flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[color:#fff] text-[13px] font-extrabold shrink-0"
                style={{ background: ACCENT }}
              >
                {s.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[var(--theme-text)]">{s.title}</div>
                <div className="text-[11.5px] text-[var(--theme-text-muted)] mt-0.5 leading-snug">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Standup — Border Beam on the hero card */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">— TODAY'S STANDUP</span>
          <span className="text-[10px] font-mono text-[var(--theme-text-dim)]">· {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="relative rounded-2xl p-[2px] overflow-hidden" style={{ background: 'linear-gradient(120deg, transparent 0%, rgba(16,185,129,0.0) 30%, #10b981 50%, rgba(16,185,129,0.0) 70%, transparent 100%)', backgroundSize: '200% 200%', animation: 'border-beam 4s linear infinite' }}>
          <style>{`
            @keyframes border-beam {
              0%   { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
          `}</style>
          <div className="bg-[var(--panel-solid)] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[color:#fff] shrink-0"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SOFT})`, boxShadow: `0 6px 18px ${ACCENT}30` }}
              >
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[var(--theme-text)]">B1 Gatekeeper standing by</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">You</span>
                </div>
                <p className="text-[12.5px] text-[var(--theme-text-muted)] mt-1 leading-snug">
                  {active.length} of {FLEET_AGENTS.length} agents ran overnight. {blocked.length > 0 ? `${blocked.length} need your call.` : 'No blockers.'}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:#fff] px-3.5 py-2 rounded-xl shrink-0 transition-all hover:scale-[1.02] active:scale-[0.99]"
                style={{ background: ACCENT, boxShadow: `0 4px 12px ${ACCENT}30` }}
              >
                <Play className="w-3.5 h-3.5" /> Start standup
              </button>
            </div>

            {/* Standup metrics — act / idle / blocked */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-700">Active</span>
                </div>
                <div className="text-[24px] font-bold text-emerald-900 mt-1 tabular-nums">{active.length}</div>
                <div className="text-[10.5px] text-emerald-700/80 mt-0.5 truncate">
                  {active.map(a => a.name).join(', ') || 'none'}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--panel-border-subtle)] p-3.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-muted)]">Idle</span>
                </div>
                <div className="text-[24px] font-bold text-[var(--theme-text)] mt-1 tabular-nums">{idle.length}</div>
                <div className="text-[10.5px] text-[var(--theme-text-muted)] mt-0.5 truncate">
                  {idle.map(a => a.name).join(', ') || 'none'}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-amber-700">Blocked</span>
                </div>
                <div className="text-[24px] font-bold text-amber-900 mt-1 tabular-nums">{blocked.length}</div>
                <div className="text-[10.5px] text-amber-800/80 mt-0.5 truncate">
                  {blocked.map(a => a.name).join(', ') || 'none'}
                </div>
              </div>
            </div>

            {/* Next concrete action */}
            <div className="mt-5 pt-4 border-t border-[var(--panel-border-subtle)] flex items-center gap-2 text-[11.5px] text-[var(--theme-text-muted)]">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Next</span>
              <span>Open <span className="font-semibold text-[var(--theme-text)]">Squads</span> to clear the {blocked.length > 0 ? 'blocked' : 'queue'}</span>
              <span className="ml-auto text-[9.5px] font-mono text-[var(--theme-text-dim)]">~10 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer micro-CTA (i-have-adhd: action-first, one primary) */}
      <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-muted)]">
        <span>Coach OS ships what you approve. Nothing more.</span>
        <span className="font-mono uppercase tracking-wider text-[9.5px]">v2.0 · SOB Convergence</span>
      </div>
    </div>
  );
}

/** Fleet card — per-agent status card matching the template's "agent-cards"
 *  section. Clickable to open the agent's detail page. */
function FleetCard({ agent, onClick }: { agent: FleetAgent; onClick: () => void }) {
  const state = STATE_META[agent.state];
  const isProcessing = agent.state === 'EXECUTING' || agent.state === 'RETRY';
  return (
    <button
      onClick={onClick}
      className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4 flex flex-col gap-3 text-left transition-all hover:scale-[1.015] hover:shadow-md active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-[color:#fff]"
            style={{ background: agent.accent }}
          >
            {agent.initials}
          </div>
          <span
            className="absolute -top-0.5 -right-0.5 inline-flex"
            title={isProcessing ? 'Processing now' : 'Idle'}
            aria-hidden="true"
          >
            {isProcessing ? (
              <span className="relative inline-flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative rounded-full w-2.5 h-2.5 bg-emerald-500 ring-2 ring-white" />
              </span>
            ) : (
              <span className="relative inline-flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-[var(--theme-text-dim)]" />
              </span>
            )}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-[var(--theme-text)] truncate">{agent.name}</span>
            <span className="font-mono text-[9px] font-bold text-[var(--theme-text-dim)] px-1.5 py-0.5 rounded bg-[var(--panel-border-subtle)]">{agent.code}</span>
          </div>
          <div className="text-[11px] text-[var(--theme-text-muted)] truncate">{agent.role} · <span className="font-mono text-[var(--theme-text-dim)]">{agent.channel}</span></div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${state.pulse ? 'animate-pulse' : ''}`}
          style={{ color: state.color, background: state.bg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: state.color }} />
          {state.label}
        </span>
      </div>

      <p className="text-[12px] text-[var(--theme-text)] leading-snug line-clamp-2">{agent.task}</p>

      {/* Load bar */}
      <div>
        <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)] mb-1">
          <span>Load</span>
          <span className="text-[var(--theme-text)] font-bold">{agent.load}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--panel-border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${agent.load}%`,
              background: agent.load > 80 ? '#b91c1c' : agent.load > 50 ? '#0891b2' : '#16a34a',
            }}
          />
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Tasks</div>
          <div className="text-[13px] font-bold text-[var(--theme-text)] tabular-nums">{agent.tasksToday}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Tokens</div>
          <div className="text-[13px] font-bold text-[var(--theme-text)] tabular-nums">{agent.tokens}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Latency</div>
          <div className="text-[13px] font-bold text-[var(--theme-text)] tabular-nums">{agent.latency}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Succ.</div>
          <div className="text-[13px] font-bold text-[var(--theme-text)] tabular-nums">{agent.success}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] font-mono text-[var(--theme-text-dim)] pt-1.5 border-t border-[var(--panel-border-subtle)]">
        <span>model · <span className="text-[var(--theme-text-muted)]">{agent.defaultModel}</span></span>
        <span>share · <span className="text-[var(--theme-text-muted)] font-bold">{agent.share}%</span></span>
        <span className="ml-auto text-[var(--theme-text-muted)]">Open ›</span>
      </div>
    </button>
  );
}

/** Agent detail page — full Fleet design for one agent. */
function FleetDetail({ agent, onBack }: { agent: FleetAgent; onBack: () => void }) {
  const state = STATE_META[agent.state];
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar p-7">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-[11px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors"
      >
        ← Back to Fleet
      </button>

      {/* Hero — agent identity + state */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${agent.accent}25, ${agent.accent}08)`,
          border: `1px solid ${agent.accent}40`,
        }}
      >
        <div className="flex items-start gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-[color:#fff] text-2xl font-extrabold shrink-0"
            style={{ background: agent.accent, boxShadow: `0 8px 24px ${agent.accent}40` }}
          >
            {agent.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[28px] font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>{agent.name}</h2>
              <span className="font-mono text-[11px] font-bold text-[var(--theme-text-muted)] px-2 py-0.5 rounded bg-[var(--panel-border-subtle)]">{agent.code}</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${state.pulse ? 'animate-pulse' : ''}`}
                style={{ color: state.color, background: state.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: state.color }} />
                {state.label}
              </span>
            </div>
            <div className="text-[13px] text-[var(--theme-text-muted)] mt-1">
              {agent.role} · <span className="font-mono text-[var(--theme-text-muted)]">{agent.channel}</span>
            </div>
            <p className="text-[13px] text-[var(--theme-text)] mt-3 leading-relaxed max-w-2xl">{agent.bio}</p>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          {agent.capabilities.map(c => (
            <span
              key={c}
              className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${agent.accent}15`, color: agent.accent, boxShadow: `inset 0 0 0 1px ${agent.accent}30` }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics grid — Tasks / Tokens / Latency / Success */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Tasks today</div>
          <div className="text-[32px] font-bold text-[var(--theme-text)] mt-1 tabular-nums">{agent.tasksToday}</div>
        </div>
        <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Tokens used</div>
          <div className="text-[32px] font-bold text-[var(--theme-text)] mt-1 tabular-nums">{agent.tokens}</div>
        </div>
        <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Avg latency</div>
          <div className="text-[32px] font-bold text-[var(--theme-text)] mt-1 tabular-nums">{agent.latency}</div>
        </div>
        <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Success rate</div>
          <div className="text-[32px] font-bold tabular-nums mt-1" style={{ color: agent.success >= 99 ? '#15803d' : agent.success >= 95 ? '#0891b2' : '#b45309' }}>{agent.success}%</div>
        </div>
      </div>

      {/* Load bar (full width) */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)] mb-2">
          <span>Current load</span>
          <span className="text-[var(--theme-text)] font-bold text-[14px]">{agent.load}% · {agent.task}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--panel-border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${agent.load}%`,
              background: agent.load > 80 ? '#b91c1c' : agent.load > 50 ? '#0891b2' : '#16a34a',
            }}
          />
        </div>
      </div>

      {/* Recent runs */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--panel-border-subtle)] flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">RECENT RUNS · last 30 min</span>
          <span className="ml-auto text-[10px] font-mono text-[var(--theme-text-dim)]">share · <span className="text-[var(--theme-text)] font-bold">{agent.share}%</span></span>
        </div>
        <ul className="divide-y divide-[var(--panel-border-subtle)]">
          {agent.recentRuns.map((r, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-2.5 text-[12px]">
              <span className="font-mono text-[10.5px] text-[var(--theme-text-dim)] w-12 shrink-0">{r.ts}</span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: r.status === 'ok' ? '#16a34a' : r.status === 'warn' ? '#f59e0b' : '#dc2626' }}
              />
              <span className="text-[var(--theme-text)] flex-1 truncate">{r.task}</span>
              <span
                className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  color: r.status === 'ok' ? '#15803d' : r.status === 'warn' ? '#b45309' : '#b91c1c',
                  background: r.status === 'ok' ? '#dcfce7' : r.status === 'warn' ? '#fef3c7' : '#fee2e2',
                }}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Peers (Manager→Worker) */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)] mb-2">PEERS · MANAGER→WORKER HANDOFFS</div>
        <div className="flex items-center gap-2 flex-wrap">
          {agent.peers.map(p => (
            <span
              key={p}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-surface-hover)] text-[var(--theme-text)] border border-[var(--panel-border)]"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Model + share footer */}
      <div className="text-[10px] font-mono text-[var(--theme-text-dim)] text-center pt-2">
        default model · <span className="text-[var(--theme-text)] font-bold">{agent.defaultModel}</span> · 4 log entries shown
      </div>
    </div>
  );
}

function Fleet() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { setDetail } = useWindowPage();
  const selected = selectedCode ? FLEET_AGENTS.find(a => a.code === selectedCode) : null;

  useEffect(() => {
    if (selected) {
      setDetail({ label: selected.name, onBack: () => setSelectedCode(null) });
    } else {
      setDetail(null);
    }
  }, [selected, setDetail]);

  // T3 — squad drill-down tour. Fires the first time the user opens an
  // agent's detail page. The launchTour guard keeps it idempotent.
  useEffect(() => {
    if (selectedCode !== null) {
      void launchTour(TOUR_IDS.SQUAD_DRILLDOWN);
    }
  }, [selectedCode]);

  if (selected) {
    return <FleetDetail agent={selected} onBack={() => setSelectedCode(null)} />;
  }

  const grouped: Array<{ key: 'green-lanterns' | 'xmen'; agents: FleetAgent[] }> = [
    { key: 'green-lanterns', agents: FLEET_AGENTS.filter(a => squadForAgent(a) === 'green-lanterns') },
    { key: 'xmen',          agents: FLEET_AGENTS.filter(a => squadForAgent(a) === 'xmen') },
  ];

  return (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="B3 Agent Bench"
        subtitle="Squads · live state by Green Lanterns and X-Men"
        action={
          <div className="flex items-center gap-2">
            <Badge tone="accent">{FLEET_AGENTS.length} agents</Badge>
            <Badge tone="ok">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
              {FLEET_AGENTS.filter(a => a.state === 'EXECUTING').length} executing
            </Badge>
          </div>
        }
      />
      <div className="flex flex-col gap-6">
        {grouped.map(({ key, agents }) => {
          const meta = SQUAD_META[key];
          if (agents.length === 0) return null;
          return (
            <div key={key} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-5 rounded-full" style={{ background: meta.accent }} />
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--theme-text)]">{meta.label}</span>
                  <span className="text-[10.5px] text-[var(--theme-text-muted)] truncate">{meta.tagline}</span>
                </div>
                <span className="ml-auto text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
                  {agents.length} on bench
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {agents.map(a => (
                  <FleetCard
                    key={a.code}
                    agent={a}
                    /* Le clic renseigne `selectedCode`, rien d'autre.
                       Il posait auparavant une fiche riche via `setDetail(...)`
                       SANS toucher a `selectedCode` : l'effet ci-dessus voyait
                       donc `selected` toujours nul et rappelait aussitot
                       `setDetail(null)`, effacant la fiche a peine posee. La
                       page de detail ne s'ouvrait jamais, et l'etat de detail
                       incoherent bloquait la navigation entre sections.
                       `selectedCode` est la seule source de verite ici : il
                       fait rendre <FleetDetail />, et l'effet se charge du
                       fil d'Ariane. */
                    onClick={() => setSelectedCode(a.code)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Content() {
  const [filter, setFilter] = useState<'all' | 'orchestrator' | 'scout' | 'scribe' | 'reach' | 'dev'>('all');
  const docs = filter === 'all' ? CONTENT_DOCS : CONTENT_DOCS.filter(d => d.agentKey === filter);
  const filters: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'orchestrator', label: 'Orchestrator' },
    { id: 'scout', label: 'Scout' },
    { id: 'scribe', label: 'Scribe' },
    { id: 'reach', label: 'Reach' },
    { id: 'dev', label: 'Dev' },
  ];
  return (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="Content library"
        subtitle="Per-agent docs · versioned by date"
        action={
          <div className="flex items-center gap-1.5">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all ${
                  filter === f.id ? 'text-[color:#fff]' : 'text-[var(--theme-text-muted)] hover:bg-[var(--panel-border-subtle)]'
                }`}
                style={filter === f.id ? { background: ACCENT } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex flex-col gap-2.5">
        {docs.map(d => {
          const agent = FLEET_AGENTS.find(a => a.code.toLowerCase() === 'a-' + (d.agentKey === 'orchestrator' ? '00' : d.agentKey === 'scribe' ? '02' : d.agentKey === 'reach' ? '03' : d.agentKey === 'dev' ? '04' : '01') || a.role.toLowerCase().includes(d.agentKey));
          return (
            <div key={d.id} className="bg-[var(--panel-solid)] rounded-xl border border-[var(--panel-border)] shadow-sm p-4 hover:border-[var(--theme-accent)] transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[10px] tracking-wider text-[color:#fff] shrink-0"
                  style={{ background: agent?.accent ?? 'var(--theme-text-dim)' }}
                >
                  {agent?.initials ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-[var(--theme-text)] truncate">{d.title}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {d.tags.map(t => (
                        <span key={t} className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--panel-border-subtle)] text-[var(--theme-text-muted)]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10.5px] font-mono text-[var(--theme-text-dim)] mt-0.5">{d.filename}</div>
                  <p className="text-[12px] text-[var(--theme-text-muted)] leading-snug mt-2 line-clamp-2">{d.excerpt}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--theme-text-dim)] mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(d.modifiedAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{d.size} bytes</span>
                    <span className="ml-auto">by <span className="text-[var(--theme-text-muted)] font-semibold">{agent?.name ?? d.agentKey}</span></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function heatColor(value: number): string {
  // 0 = transparent, 100 = ember (orange) full opacity
  if (value === 0) return 'rgba(0,0,0,0)';
  const opacity = Math.min(0.95, Math.max(0.06, value / 100));
  return `rgba(var(--theme-accent-rgb), ${opacity.toFixed(2)})`;
}

const TASK_KIND_COLOR: Record<ScheduleTask['kind'], string> = {
  sync:    '#0891b2',
  run:     '#0d9488',
  audit:   '#9333ea',
  review:  '#ca8a04',
  'sync-up': '#b91c1c',
};

/** Map task kind to the SOB sprint cadence terminology coaches actually use. */
const TASK_KIND_LABEL: Record<ScheduleTask['kind'], string> = {
  sync:     'Daily Standup',
  run:      'Sprint Work',
  audit:    'Sprint Review',
  review:   'Sprint Review',
  'sync-up': 'Retrospective',
};

function Schedule() {
  // Stats: peak hour + quietest + weekday avg
  const colSums = Array.from({ length: 24 }, (_, h) =>
    SCHEDULE_GRID.reduce((s, day) => s + (day[h] ?? 0), 0) / 7
  );
  const peakHour = colSums.indexOf(Math.max(...colSums));
  const quietestHour = colSums.indexOf(Math.min(...colSums));
  const weekdayAvg = Math.round(SCHEDULE_GRID.slice(0, 5).flat().reduce((s, v) => s + v, 0) / (5 * 24));

  // T4 — cadence tour. Fires once on first mount of the Cadence section.
  useEffect(() => {
    void launchTour(TOUR_IDS.CADENCE);
  }, []);

  return (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="Standup Cadence"
        subtitle="Daily standup, sprint review, retrospective · 7-day × 24-hour"
        action={<Badge tone="accent">UTC</Badge>}
      />

      {/* Heatmap */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">— ACTIVITY HEATMAP · 7d × 24h</div>
            <div className="text-[12px] text-[var(--theme-text-muted)] mt-0.5">When the squads are busiest, UTC</div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
            <span>quiet</span>
            <div className="flex gap-0.5">
              {[0.06, 0.25, 0.5, 0.75, 0.95].map(o => (
                <div key={o} className="w-3 h-3 rounded-sm" style={{ background: `rgba(var(--theme-accent-rgb), ${o})` }} />
              ))}
            </div>
            <span>busy</span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[700px]">
            {/* Header row: hours */}
            <div className="grid" style={{ gridTemplateColumns: '40px repeat(24, 1fr)', gap: '2px' }}>
              <div />
              {HOURS.map(h => (
                <div key={h} className="text-[9px] font-mono text-[var(--theme-text-dim)] text-center">
                  {h % 6 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {/* Day rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="grid mt-1" style={{ gridTemplateColumns: '40px repeat(24, 1fr)', gap: '2px' }}>
                <div className="text-[10px] font-mono uppercase text-[var(--theme-text-muted)] font-semibold pr-2 text-right self-center">{day}</div>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="h-5 rounded-sm transition-all hover:ring-1 hover:ring-[var(--theme-accent)] cursor-pointer"
                    style={{ background: heatColor(SCHEDULE_GRID[dayIdx][h]) }}
                    title={`${day} ${h}:00 — activity ${SCHEDULE_GRID[dayIdx][h]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-3 border-t border-[var(--panel-border-subtle)] grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Peak hour</div>
            <div className="text-[20px] font-bold text-[var(--theme-text)] mt-0.5">{String(peakHour).padStart(2, '0')}:00 UTC</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Quietest</div>
            <div className="text-[20px] font-bold text-[var(--theme-text)] mt-0.5">{String(quietestHour).padStart(2, '0')}:00 UTC</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Weekday avg</div>
            <div className="text-[20px] font-bold text-emerald-700 mt-0.5">{weekdayAvg}%</div>
          </div>
        </div>
      </div>

      {/* Planned tasks — reframed as Daily Standup / Sprint Review / Retrospective */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-emerald-700" />
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">— SPRINT CADENCE · THIS WEEK</div>
        </div>
        <div className="flex flex-col gap-2">
          {SCHEDULE_TASKS.map(t => {
            const kindColor = TASK_KIND_COLOR[t.kind];
            const cadenceLabel = TASK_KIND_LABEL[t.kind];
            return (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--theme-text-muted)] w-10 shrink-0">{t.day}</span>
                <span className="font-mono text-[11px] text-[var(--theme-text)] tabular-nums w-24 shrink-0">
                  {String(t.startHour).padStart(2, '0')}:00–{String(t.endHour).padStart(2, '0')}:00
                </span>
                <span
                  className="inline-flex items-center text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: kindColor, background: `${kindColor}1a` }}
                  title={`Kind: ${t.kind}`}
                >
                  {cadenceLabel}
                </span>
                <span className="text-[12.5px] text-[var(--theme-text)] truncate flex-1">{t.label}</span>
                <span className="text-[10px] font-mono text-[var(--theme-text-dim)] shrink-0">@ {t.agent}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PeopleApp() {
  const teamDrill = useCollectionDrill('team', 'Team');
  const agentsDrill = useCollectionDrill('people_agents', 'Agents');
  const personasDrill = useCollectionDrill('personas', 'Personas');
  const memoryDrill = useCollectionDrill('memory', 'Mémoire');
  const codexDrill = useCollectionDrill('codex', 'Codex');
  const teamCount = useCmsStore(s => s.items['team']?.length ?? 0);
  const agentsCount = useCmsStore(s => s.items['people_agents']?.length ?? 0);
  const personasCount = useCmsStore(s => s.items['personas']?.length ?? 0);
  const memoryCount = useCmsStore(s => s.items['memory']?.length ?? 0);
  const codexCount = useCmsStore(s => s.items['codex']?.length ?? 0);
  const [detail, setDetail] = useState<PeopleDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const Team = () => {
    return (
      <div className="p-7">
        <SectionHead title="Team" subtitle="Your human squad (X-Men doctrine)" action={<Badge tone="accent">{teamCount} members</Badge>} />
        <CollectionRepeater collectionId="team" onOpen={teamDrill.open} />
      </div>
    );
  };

  const Agents = () => {
    return (
      <div className="p-7">
        <SectionHead title="Agents" subtitle="AI workers on the People domain" action={<Badge tone="accent">{agentsCount} configured</Badge>} />
        <CollectionRepeater collectionId="people_agents" onOpen={agentsDrill.open} />
      </div>
    );
  };

  /* Cyan accent for the 3 depth sections (per the brief). Mirrors the
   * AppDetailOverlay accent and the load-bar mid range in Fleet cards. */
  const DEPTH_ACCENT = '#0891b2';

  const ANCHOR_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
    entretien: 'accent',
    appel:     'accent',
    atelier:   'accent',
    ticket:    'neutral',
    informel:  'warn',
    'no-anchor': 'danger',
  };

  const VERIFY_TONE: Record<string, 'ok' | 'warn' | 'danger'> = {
    confirmed:    'ok',
    contradicted: 'danger',
    'to-verify':  'warn',
  };

  const Personas = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Personas"
          subtitle="Premier-class profiles drawn from real sources. The anchor makes the difference — a persona without one is an invention."
          action={<Badge tone="accent">{personasCount} profiles</Badge>}
        />
        <CMSCardList<CmsItem>
          collectionId="personas"
          onOpen={personasDrill.open}
          cols={2}
          render={(p) => {
            const anchorKind = String(p.anchorKind ?? '—');
            const domain = String(p.domain ?? '');
            const wants = String(p.wants ?? '');
            return {
              title: String(p.name ?? '—'),
              subtitle: `${String(p.role ?? '')}${domain ? ' · ' + domain : ''}`,
              description: wants.split(/(?<=\.)/)[0]?.trim() ?? wants,
              statusLabel: anchorKind,
              statusTone: ANCHOR_TONE[anchorKind] ?? 'neutral',
              accent: DEPTH_ACCENT,
              icon: <UserSearch className="w-5 h-5" />,
              metricLabel: 'anchored',
              metricValue: String(p.anchorDate ?? '—'),
              meta: p.anchor ? `${String(p.anchor).split(/[.·]/)[0].trim().slice(0, 48)}…` : 'no anchor — invention',
            };
          }}
        />
      </div>
    );
  };

  const Memoire = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Mémoire"
          subtitle="Curated organisational memory. Raw memory is a dump — what matters here is what has been checked."
          action={<Badge tone="accent">{memoryCount} facts</Badge>}
        />
        <CMSCardList<CmsItem>
          collectionId="memory"
          onOpen={memoryDrill.open}
          cols={2}
          render={(m) => {
            const verification = String(m.verification ?? '');
            const provenance = String(m.provenance ?? '');
            const fact = String(m.fact ?? '');
            return {
              title: fact.split(/(?<=\.)/)[0]?.trim() ?? fact,
              subtitle: provenance,
              description: fact.split(/(?<=\.)/)[1]?.trim() ?? fact,
              statusLabel: verification,
              statusTone: VERIFY_TONE[verification] ?? 'neutral',
              accent: verification === 'contradicted' ? '#dc2626'
                    : verification === 'to-verify'  ? '#f59e0b'
                    : '#16a34a',
              icon: verification === 'contradicted' ? <AlertTriangle className="w-5 h-5" />
                    : verification === 'to-verify'  ? <ShieldCheck className="w-5 h-5" />
                    : <Brain className="w-5 h-5" />,
              metricLabel: 'retained',
              metricValue: String(m.retainedOn ?? '—'),
              meta: m.recheckOn ? `re-check ${m.recheckOn}` : '',
            };
          }}
        />
      </div>
    );
  };

  const Codex = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Codex"
          subtitle="Patterns that have proven themselves. A success repeated once is an anecdote; a method is a success repeated enough."
          action={<Badge tone="accent">{codexCount} patterns</Badge>}
        />
        <CMSCardList<CmsItem>
          collectionId="codex"
          onOpen={codexDrill.open}
          cols={2}
          render={(c) => {
            const situation = String(c.situation ?? '');
            const recipe = String(c.recipe ?? '');
            const count = Number(c.appliedCount ?? 0);
            return {
              title: situation.split(/(?<=\.)/)[0]?.trim() ?? situation,
              subtitle: recipe.split(/\.\s/)[0]?.trim() ?? recipe,
              description: recipe.split(/\.\s/).slice(1, 3).join('. ').trim(),
              statusLabel: String(c.domain ?? '—'),
              statusTone: 'accent',
              accent: DEPTH_ACCENT,
              icon: <BookMarked className="w-5 h-5" />,
              metricLabel: 'applied',
              metricValue: `${count}×`,
              meta: c.lastApplied ? `last ${c.lastApplied}` : '',
            };
          }}
        />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, render: Overview },
    { id: 'team',     label: 'Team',     icon: Users,           render: Team },
    { id: 'agents',   label: 'Agents',   icon: Bot,             render: Agents },
    { id: 'fleet',    label: 'Squads',   icon: Cpu,             render: () => <Fleet /> },
    { id: 'content',  label: 'Content',  icon: FileText,        render: Content },
    { id: 'schedule', label: 'Cadence',  icon: Calendar,        render: Schedule },
    { id: 'culture',  label: 'Culture',  icon: Heart,           render: Culture },
    { id: 'personas', label: 'Personas', icon: UserSearch,      render: Personas },
    { id: 'memory',   label: 'Mémoire',  icon: Brain,           render: Memoire },
    { id: 'codex',    label: 'Codex',    icon: BookMarked,      render: Codex },
  ];

  const groups: Record<string, string> = {
    overview: 'SOB',
    team:     'Squads',
    agents:   'Squads',
    fleet:    'B3 Agents',
    content:  'B3 Agents',
    schedule: 'Cadence',
    culture:  'Culture',
    personas: 'Profondeur',
    memory:   'Profondeur',
    codex:    'Profondeur',
  };

  // Picked drill (if any) — one of the 5 CMS collections exposed via
  // useCollectionDrill. The DynamicPageView is rendered in the overlay
  // (sibling of AppFrame) so it inherits the global topbar theme instead
  // of the per-app theme that AppFrame writes on its content.
  const drillViews: ReadonlyArray<{
    drill: { openId: string | null; open: (id: string) => void; close: () => void };
    collectionId: string;
  }> = [
    { drill: teamDrill,     collectionId: 'team' },
    { drill: agentsDrill,   collectionId: 'people_agents' },
    { drill: personasDrill, collectionId: 'personas' },
    { drill: memoryDrill,   collectionId: 'memory' },
    { drill: codexDrill,    collectionId: 'codex' },
  ];
  const activeDrill = drillViews.find((d) => d.drill.openId) ?? null;

  return (
    <>
      <AppFrame title="RH & Méta-Gouvernance" subtitle="Agent Factory · B1 Gatekeeper" icon={Atom} accent={ACCENT} sections={sections} groups={groups} />
      {detail ? (
        <AppDetailOverlay
          appId="people"
          accent="#0891b2"
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-left', durationMs: 220 }}
        >
          <PeopleDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : activeDrill && activeDrill.drill.openId ? (
        <AppDetailOverlay
          appId="people"
          accent="#0891b2"
          onBack={() => activeDrill.drill.close()}
          motion={{ kind: 'slide-left', durationMs: 220 }}
        >
          <DynamicPageView
            collectionId={activeDrill.collectionId}
            itemId={activeDrill.drill.openId}
            onBack={() => activeDrill.drill.close()}
            onNavigate={activeDrill.drill.open}
          />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
