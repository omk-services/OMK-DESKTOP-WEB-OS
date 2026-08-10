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
import { useEffect, useMemo, useState } from 'react';
import {
  Users, Bot, Heart, Cpu, FileText, Calendar, Zap,
  Atom, LayoutDashboard, Crown, Activity, CheckCircle2, Play,
  UserSearch, Brain, BookMarked,
  ListChecks,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { PeopleItemDetail } from './PeopleItemDetail';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { ApprovalsView } from './ApprovalsView';
import { useScenariosStore } from '../../stores/scenarios.store';

registerItemDetail('people', PeopleItemDetail);
import { launchTour, TOUR_IDS } from '../../lib/tours';
import { PeopleDetailPage, type PeopleDetailItem } from './PeopleDetailPage';
import {
  FLEET_AGENTS, STATE_META, type FleetAgent,
  DAYS, HOURS, SCHEDULE_GRID, SCHEDULE_TASKS, type ScheduleTask,
} from './fleet';
import { seedPeopleCms } from './seed';

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
  const values = [
    { id: 'client-first',     label: 'Client outcomes first',  body: 'Everything we ship has to move a client needle. If it does not, it is craft for its own sake.' },
    { id: 'ship-bias',        label: 'Bias to shipped, not perfect', body: 'A shipped thing that is wrong is a fixable thing. A perfect thing in a drawer is a missed quarter.' },
    { id: 'sober-default',    label: 'Sober by default',       body: 'No breathless copy. No hype. Concrete numbers, plain language, calibrated tone.' },
    { id: 'own-mistake',      label: 'Own the mistake, keep the receipt', body: 'When a call is wrong, name it, fix it, and write down what we changed so we do not relearn it.' },
  ];
  const openMemory = (anchorKind: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('coach-os:open-app-section', {
        detail: { appId: 'people', sectionId: 'memory', query: { anchorKind } },
      }),
    );
  };

  return (
    <div className="p-7">
      <SectionHead
        title="Culture"
        subtitle="The operating values every agent inherits"
        action={
          <div className="flex items-center gap-1.5">
            <Badge tone="accent">{values.length} valeurs</Badge>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {values.map((v) => (
          <div
            key={v.id}
            data-culture-value={v.id}
            className="bg-[var(--panel-solid)] rounded-xl border border-[var(--panel-border)] shadow-sm p-5 flex flex-col gap-2"
          >
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-[var(--theme-text-muted)] shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-[var(--theme-text)]">{v.label}</span>
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {v.body}
            </p>
            <div className="pt-2 mt-auto border-t border-[var(--panel-border-subtle)]">
              <button
                type="button"
                onClick={() => openMemory(v.id)}
                className="text-[10.5px] font-semibold uppercase tracking-wider hover:underline"
                style={{ color: ACCENT }}
                data-culture-link={v.id}
                title="Voir les faits liés dans Mémoire"
              >
                Voir la mémoire liée →
              </button>
            </div>
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
  const pendingScenarios = useScenariosStore((s) => s.scenarioOrder.filter((id) => s.scenarios[id]?.status === 'pending').length);

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
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: '#15803d', background: 'rgba(22,163,74,0.12)', border: '1px solid #86efac' }}
                  >
                    You
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--theme-text-muted)] mt-1 leading-snug">
                  {active.length} of {FLEET_AGENTS.length} agents ran overnight. {blocked.length > 0 ? `${blocked.length} need your call.` : 'No blockers.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  // `coach-os:open-app-section` est le SEUL événement de navigation
                  // inter-sections que quelqu'un écoute (cf. AppFrame). Un
                  // `coach-os:navigate` part dans le vide : le bouton paraît câblé
                  // et ne fait rien.
                  window.dispatchEvent(
                    new CustomEvent('coach-os:open-app-section', {
                      detail: { appId: 'people', sectionId: 'approvals' },
                    }),
                  );
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:#fff] px-3.5 py-2 rounded-xl shrink-0 transition-all hover:scale-[1.02] active:scale-[0.99]"
                style={{ background: ACCENT, boxShadow: `0 4px 12px ${ACCENT}30` }}
              >
                <Play className="w-3.5 h-3.5" /> Start standup
              </button>
            </div>

            {/* Standup metrics — act / idle / blocked */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid #86efac' }}
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" style={{ color: '#15803d' }} />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: '#15803d' }}>Active</span>
                </div>
                <div className="text-[24px] font-bold mt-1 tabular-nums" style={{ color: '#166534' }}>{active.length}</div>
                <div className="text-[10.5px] mt-0.5 truncate" style={{ color: '#15803d' }}>
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
              <div
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid #fcd34d' }}
              >
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" style={{ color: '#b45309' }} />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: '#b45309' }}>Blocked</span>
                </div>
                <div className="text-[24px] font-bold mt-1 tabular-nums" style={{ color: '#92400e' }}>{blocked.length}</div>
                <div className="text-[10.5px] mt-0.5 truncate" style={{ color: '#b45309' }}>
                  {blocked.map(a => a.name).join(', ') || 'none'}
                </div>
              </div>
            </div>

            {/* Next concrete action */}
            <div className="mt-5 pt-4 border-t border-[var(--panel-border-subtle)] flex items-center gap-2 text-[11.5px] text-[var(--theme-text-muted)]">
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">Next</span>
              {pendingScenarios > 0 ? (
                <>
                  <span>Open <span className="font-semibold text-[var(--theme-text)]">Approvals</span> — {pendingScenarios} scénario{pendingScenarios === 1 ? '' : 's'} à trancher</span>
                  <span className="ml-auto text-[9.5px] font-mono text-[var(--theme-text-dim)]">~10 min</span>
                </>
              ) : (
                <>
                  <span>Open <span className="font-semibold text-[var(--theme-text)]">Squads</span> to clear the {blocked.length > 0 ? 'blocked' : 'queue'}</span>
                  <span className="ml-auto text-[9.5px] font-mono text-[var(--theme-text-dim)]">~10 min</span>
                </>
              )}
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
function FleetCard({ agent, onClick, 'data-fleet-card': fleetCardAttr }: { agent: FleetAgent; onClick: () => void; 'data-fleet-card'?: string }) {
  const state = STATE_META[agent.state];
  const isProcessing = agent.state === 'EXECUTING' || agent.state === 'RETRY';
  return (
    <button
      onClick={onClick}
      data-fleet-card={fleetCardAttr}
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
                <span className="absolute inset-0 rounded-full opacity-75 animate-ping" style={{ background: '#16a34a' }} />
                <span
                  className="relative rounded-full w-2.5 h-2.5"
                  style={{ background: '#16a34a', boxShadow: '0 0 0 2px var(--theme-surface)' }}
                />
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

/** Ancien rendu inline `FleetDetail` (148 lignes) — archivé 2026-08-10.
 *  Le clic sur une carte de la Fleet peuple désormais `detail` du PeopleApp,
 *  ce qui rend la fiche riche `<PeopleDetailPage>` dans l'overlay. Le rendu
 *  inline faisait doublon avec la fiche riche et ne s'ouvrait plus depuis
 *  la régression qui a vidé la branche `{detail ? ...}`. Conservé ici à
 *  titre de comparaison (suppression matérielle interdite par la doctrine). */
function _UnusedLegacyFleetDetail_REMOVED() { return null; }

function Fleet({ onAgentClick }: { onAgentClick: (agent: FleetAgent) => void }) {
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
              <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ background: '#16a34a' }} />
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
                    data-fleet-card={a.code}
                    /* Le clic peuple le state `detail` du PeopleApp, ce qui :
                       1) rend `<PeopleDetailPage>` dans l'overlay (la fiche riche),
                       2) synchronise le fil d'Ariane via l'effet de PeopleApp.
                       Avant cette correction, ce clic n'ouvrait qu'une fiche
                       simplifiée inline (`FleetDetail`) et la fiche riche
                       799 lignes (`PeopleDetailPage`) restait morte. */
                    onClick={() => onAgentClick(a)}
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
  const contentDrill = useCollectionDrill('content', 'Content');
  const contentCount = useCmsStore((s) => s.items['content']?.length ?? 0);
  return (
    <div className="p-7">
      <SectionHead
        title="Content library"
        subtitle="Per-agent docs · versioned by date"
        action={<Badge tone="accent">{contentCount} pieces</Badge>}
      />
      <CollectionRepeater collectionId="content" onOpen={contentDrill.open} />
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

  const [picked, setPicked] = useState<{ day: typeof DAYS[number]; hour: number } | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // T4 — cadence tour. Fires once on first mount of the Cadence section.
  useEffect(() => {
    void launchTour(TOUR_IDS.CADENCE);
  }, []);

  const agentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of SCHEDULE_TASKS) set.add(t.agent);
    return ['all', ...Array.from(set).sort()];
  }, []);

  const filteredTasks = picked
    ? SCHEDULE_TASKS.filter((t) => {
        const matchesDay = t.day === picked.day;
        const matchesHour = picked.hour >= t.startHour && picked.hour < t.endHour;
        const matchesAgent = agentFilter === 'all' || t.agent === agentFilter;
        return matchesDay && matchesHour && matchesAgent;
      })
    : [];

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
            <div className="text-[12px] text-[var(--theme-text-muted)] mt-0.5">
              Clique une case pour voir les tâches prévues
              {picked ? ` · ${picked.day} ${String(picked.hour).padStart(2, '0')}:00` : ''}
            </div>
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
                {HOURS.map(h => {
                  const isPicked = picked?.day === day && picked.hour === h;
                  const hasTask = SCHEDULE_TASKS.some(
                    (t) => t.day === day && h >= t.startHour && h < t.endHour,
                  );
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setPicked({ day, hour: h })}
                      data-cadence-cell
                      data-day={day}
                      data-hour={h}
                      aria-label={`${day} ${h}:00 — activity ${SCHEDULE_GRID[dayIdx][h]}${hasTask ? ' · a des tâches prévues' : ''}`}
                      className="h-5 rounded-sm transition-all hover:ring-1 hover:ring-[var(--theme-accent)] focus:outline-none"
                      style={{
                        background: heatColor(SCHEDULE_GRID[dayIdx][h]),
                        boxShadow: isPicked ? '0 0 0 2px var(--theme-accent)' : hasTask ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  );
                })}
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
            <div className="text-[20px] font-bold mt-0.5" style={{ color: '#15803d' }}>{weekdayAvg}%</div>
          </div>
        </div>
      </div>

      {/* Picked cell detail — what runs at this hour/day */}
      {picked && (
        <div
          data-cadence-detail
          className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">
              — CASE · {picked.day} {String(picked.hour).padStart(2, '0')}:00 UTC
            </div>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              data-cadence-agent-filter
              className="ml-auto px-2 py-1 rounded-lg text-[10.5px] font-semibold outline-none"
              style={{
                background: 'var(--theme-bg)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
            >
              {agentOptions.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'Tous les agents' : a}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setPicked(null); setAgentFilter('all'); }}
              className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] text-[11px] font-semibold"
              data-cadence-close
              aria-label="Fermer le détail"
            >
              Fermer
            </button>
          </div>
          {filteredTasks.length === 0 ? (
            <p className="text-[12px] italic" style={{ color: 'var(--theme-muted)' }}>
              Aucune tâche prévue à ce créneau
              {agentFilter !== 'all' ? ` pour ${agentFilter}` : ''}.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredTasks.map((t) => {
                const kindColor = TASK_KIND_COLOR[t.kind];
                const cadenceLabel = TASK_KIND_LABEL[t.kind];
                return (
                  <li
                    key={t.id}
                    data-cadence-task={t.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--canvas)', border: '1px solid var(--panel-border-subtle)' }}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--theme-text-muted)] w-10 shrink-0">{t.day}</span>
                    <span className="font-mono text-[11px] text-[var(--theme-text)] tabular-nums w-24 shrink-0">
                      {String(t.startHour).padStart(2, '0')}:00–{String(t.endHour).padStart(2, '0')}:00
                    </span>
                    <span
                      className="inline-flex items-center text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: kindColor, background: `${kindColor}1a` }}
                    >
                      {cadenceLabel}
                    </span>
                    <span className="text-[12.5px] text-[var(--theme-text)] truncate flex-1">{t.label}</span>
                    <span className="text-[10px] font-mono text-[var(--theme-text-dim)] shrink-0">@ {t.agent}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Planned tasks — reframed as Daily Standup / Sprint Review / Retrospective */}
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: '#15803d' }} />
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
  const contentDrill = useCollectionDrill('content', 'Content');
  const teamCount = useCmsStore(s => s.items['team']?.length ?? 0);
  const agentsCount = useCmsStore(s => s.items['people_agents']?.length ?? 0);
  const personasCount = useCmsStore(s => s.items['personas']?.length ?? 0);
  const memoryCount = useCmsStore(s => s.items['memory']?.length ?? 0);
  const codexCount = useCmsStore(s => s.items['codex']?.length ?? 0);
  const contentCount = useCmsStore(s => s.items['content']?.length ?? 0);
  const [detail, setDetail] = useState<PeopleDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  /** Open the rich fiche for a Fleet agent.
   *  Constructs a PeopleDetailItem so `<PeopleDetailPage>` can render its
   *  full soft-UI surface (vitals, ladder, signal log, capabilities,
   *  handoffs). T3 tour fires once on first open. */
  const openAgentDetail = (agent: FleetAgent) => {
    const squadLabel = squadForAgent(agent) === 'green-lanterns' ? 'Green Lanterns' : 'X-Men';
    setDetail({
      id: agent.code,
      title: agent.name,
      subtitle: `${agent.role} · ${agent.channel}`,
      status: agent.state,
      initials: agent.initials,
      fields: [],
      squad: [{ name: squadLabel, color: agent.accent }],
      meta: [
        { label: 'Channel',         value: agent.channel },
        { label: 'Default model',   value: agent.defaultModel },
        { label: 'Tasks today',     value: String(agent.tasksToday) },
        { label: 'Share of fleet',  value: `${agent.share}%` },
      ],
    });
  };

  // T3 — squad drill-down tour. Fires the first time the user opens a
  // Fleet agent's detail page. The launchTour guard keeps it idempotent.
  useEffect(() => {
    if (detail !== null) {
      void launchTour(TOUR_IDS.SQUAD_DRILLDOWN);
    }
  }, [detail]);

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

  const Personas = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Personas"
          subtitle="Premier-class profiles drawn from real sources. The anchor makes the difference — a persona without one is an invention."
          action={<Badge tone="accent">{personasCount} profiles</Badge>}
        />
        <CollectionRepeater collectionId="personas" onOpen={personasDrill.open} />
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
        <CollectionRepeater collectionId="memory" onOpen={memoryDrill.open} />
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
        <CollectionRepeater collectionId="codex" onOpen={codexDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'overview',  label: 'Overview',   icon: LayoutDashboard, render: Overview },
    { id: 'approvals', label: 'Approvals',  icon: ListChecks,       render: () => <ApprovalsView /> },
    { id: 'team',      label: 'Team',       icon: Users,            render: Team },
    { id: 'agents',    label: 'Agents',     icon: Bot,              render: Agents },
    { id: 'fleet',     label: 'Squads',     icon: Cpu,              render: () => <Fleet onAgentClick={openAgentDetail} /> },
    { id: 'content',   label: 'Content',    icon: FileText,         render: Content },
    { id: 'schedule',  label: 'Cadence',    icon: Calendar,         render: Schedule },
    { id: 'culture',   label: 'Culture',    icon: Heart,            render: Culture },
    { id: 'personas',  label: 'Personas',   icon: UserSearch,       render: Personas },
    { id: 'memory',    label: 'Mémoire',    icon: Brain,            render: Memoire },
    { id: 'codex',     label: 'Codex',      icon: BookMarked,       render: Codex },
  ];

  const groups: Record<string, string> = {
    overview:  'SOB',
    approvals: 'SOB',
    team:      'Squads',
    agents:    'Squads',
    fleet:     'B3 Agents',
    content:   'B3 Agents',
    schedule:  'Cadence',
    culture:   'Culture',
    personas:  'Profondeur',
    memory:    'Profondeur',
    codex:     'Profondeur',
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
    { drill: contentDrill,  collectionId: 'content' },
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
