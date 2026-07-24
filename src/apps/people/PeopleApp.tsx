/** People / Agents — Green Lantern domain (E-Myth B2-01 manager).
 *  Subpages (aligned to KomputerMechanic Hermes Mission Control template):
 *    - Team     → human squad (X-Men)
 *    - Agents   → basic agent list
 *    - Fleet    → 5 specialist AI agents with state/load/latency/tokens
 *                 (template: route-agents + AGENTS)
 *    - Content  → per-agent docs library
 *                 (template: route-content + DEMO_CONTENT_DOCS)
 *    - Schedule → 7-day × 24-hour activity heatmap + planned tasks
 *                 (template: route-schedule + HEAT + tasks)
 *    - Culture  → operating values
 *  2-level subpage nav: section (left sidebar) → item detail (drill via CMS). */
import { useState } from 'react';
import { Users, Bot, Heart, Cpu, FileText, Calendar, Clock, Zap } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import {
  FLEET_AGENTS, STATE_META, type FleetAgent,
  CONTENT_DOCS,
  DAYS, HOURS, SCHEDULE_GRID, SCHEDULE_TASKS, type ScheduleTask,
} from './fleet';

const ACCENT = '#0891b2';

function Culture() {
  const values = ['Client outcomes first', 'Bias to shipped, not perfect', 'Sober by default', 'Own the mistake, keep the receipt'];
  return (
    <div className="p-7">
      <SectionHead title="Culture" subtitle="The operating values every agent inherits" />
      <div className="grid grid-cols-2 gap-3">
        {values.map((v, i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-5 flex items-start gap-3">
            <Heart className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-stone-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fleet card — per-agent status card matching the template's "agent-cards"
 *  section (state pill, code, name, role, channel, current task, load%,
 *  tokens, latency, success, tasksToday, share, model). */
function FleetCard({ agent }: { agent: FleetAgent }) {
  const state = STATE_META[agent.state];
  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[11px] tracking-wider text-white shrink-0"
          style={{ background: agent.accent }}
        >
          {agent.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold text-stone-900 truncate">{agent.name}</span>
            <span className="font-mono text-[9px] font-bold text-stone-400 px-1.5 py-0.5 rounded bg-stone-100">{agent.code}</span>
          </div>
          <div className="text-[11px] text-stone-500 truncate">{agent.role} · <span className="font-mono text-stone-400">{agent.channel}</span></div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${state.pulse ? 'animate-pulse' : ''}`}
          style={{ color: state.color, background: state.bg }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: state.color }} />
          {state.label}
        </span>
      </div>

      <p className="text-[12px] text-stone-700 leading-snug line-clamp-2">{agent.task}</p>

      {/* Load bar */}
      <div>
        <div className="flex items-center justify-between text-[9.5px] font-mono uppercase tracking-wider text-stone-400 mb-1">
          <span>Load</span>
          <span className="text-stone-700 font-bold">{agent.load}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
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
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Tasks</div>
          <div className="text-[13px] font-bold text-stone-800 tabular-nums">{agent.tasksToday}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Tokens</div>
          <div className="text-[13px] font-bold text-stone-800 tabular-nums">{agent.tokens}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Latency</div>
          <div className="text-[13px] font-bold text-stone-800 tabular-nums">{agent.latency}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Succ.</div>
          <div className="text-[13px] font-bold text-stone-800 tabular-nums">{agent.success}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] font-mono text-stone-400 pt-1.5 border-t border-stone-100">
        <span>model · <span className="text-stone-600">{agent.defaultModel}</span></span>
        <span>share · <span className="text-stone-600 font-bold">{agent.share}%</span></span>
      </div>
    </div>
  );
}

function Fleet() {
  return (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="Fleet"
        subtitle="5 specialist AI agents · live state"
        action={
          <div className="flex items-center gap-2">
            <Badge tone="accent">{FLEET_AGENTS.length} agents</Badge>
            <Badge tone="ok">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
              {FLEET_AGENTS.filter(a => a.state === 'EXECUTING').length} executing
            </Badge>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FLEET_AGENTS.map(a => <FleetCard key={a.code} agent={a} />)}
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
                  filter === f.id ? 'text-white' : 'text-stone-600 hover:bg-stone-100'
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
            <div key={d.id} className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-4 hover:border-cyan-400 transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[10px] tracking-wider text-white shrink-0"
                  style={{ background: agent?.accent ?? '#64748b' }}
                >
                  {agent?.initials ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-stone-900 truncate">{d.title}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {d.tags.map(t => (
                        <span key={t} className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10.5px] font-mono text-stone-400 mt-0.5">{d.filename}</div>
                  <p className="text-[12px] text-stone-600 leading-snug mt-2 line-clamp-2">{d.excerpt}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(d.modifiedAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{d.size} bytes</span>
                    <span className="ml-auto">by <span className="text-stone-600 font-semibold">{agent?.name ?? d.agentKey}</span></span>
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
  return `rgba(15, 118, 110, ${opacity.toFixed(2)})`;
}

const TASK_KIND_COLOR: Record<ScheduleTask['kind'], string> = {
  sync:    '#0891b2',
  run:     '#0d9488',
  audit:   '#9333ea',
  review:  '#ca8a04',
  'sync-up': '#b91c1c',
};

function Schedule() {
  // Stats: peak hour + quietest + weekday avg
  const colSums = Array.from({ length: 24 }, (_, h) =>
    SCHEDULE_GRID.reduce((s, day) => s + (day[h] ?? 0), 0) / 7
  );
  const peakHour = colSums.indexOf(Math.max(...colSums));
  const quietestHour = colSums.indexOf(Math.min(...colSums));
  const weekdayAvg = Math.round(SCHEDULE_GRID.slice(0, 5).flat().reduce((s, v) => s + v, 0) / (5 * 24));

  return (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="Schedule"
        subtitle="7-day × 24-hour fleet activity"
        action={<Badge tone="accent">UTC</Badge>}
      />

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">— ACTIVITY HEATMAP · 7d × 24h</div>
            <div className="text-[12px] text-stone-600 mt-0.5">When the fleet is busiest, UTC</div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-stone-400">
            <span>quiet</span>
            <div className="flex gap-0.5">
              {[0.06, 0.25, 0.5, 0.75, 0.95].map(o => (
                <div key={o} className="w-3 h-3 rounded-sm" style={{ background: `rgba(15, 118, 110, ${o})` }} />
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
                <div key={h} className="text-[9px] font-mono text-stone-400 text-center">
                  {h % 6 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {/* Day rows */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="grid mt-1" style={{ gridTemplateColumns: '40px repeat(24, 1fr)', gap: '2px' }}>
                <div className="text-[10px] font-mono uppercase text-stone-500 font-semibold pr-2 text-right self-center">{day}</div>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="h-5 rounded-sm transition-all hover:ring-1 hover:ring-cyan-400 cursor-pointer"
                    style={{ background: heatColor(SCHEDULE_GRID[dayIdx][h]) }}
                    title={`${day} ${h}:00 — activity ${SCHEDULE_GRID[dayIdx][h]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Peak hour</div>
            <div className="text-[20px] font-bold text-stone-900 mt-0.5">{String(peakHour).padStart(2, '0')}:00 UTC</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Quietest</div>
            <div className="text-[20px] font-bold text-stone-900 mt-0.5">{String(quietestHour).padStart(2, '0')}:00 UTC</div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-stone-400">Weekday avg</div>
            <div className="text-[20px] font-bold text-cyan-700 mt-0.5">{weekdayAvg}%</div>
          </div>
        </div>
      </div>

      {/* Planned tasks */}
      <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-700" />
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">— PLANNED TASKS · THIS WEEK</div>
        </div>
        <div className="flex flex-col gap-2">
          {SCHEDULE_TASKS.map(t => {
            const kindColor = TASK_KIND_COLOR[t.kind];
            return (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 w-10 shrink-0">{t.day}</span>
                <span className="font-mono text-[11px] text-stone-700 tabular-nums w-24 shrink-0">
                  {String(t.startHour).padStart(2, '0')}:00–{String(t.endHour).padStart(2, '0')}:00
                </span>
                <span
                  className="inline-flex items-center text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: kindColor, background: `${kindColor}1a` }}
                >
                  {t.kind}
                </span>
                <span className="text-[12.5px] text-stone-700 truncate flex-1">{t.label}</span>
                <span className="text-[10px] font-mono text-stone-400 shrink-0">@ {t.agent}</span>
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
  const teamCount = useCmsStore(s => s.items['team']?.length ?? 0);
  const agentsCount = useCmsStore(s => s.items['people_agents']?.length ?? 0);

  const Team = () => {
    if (teamDrill.openId) {
      return <DynamicPageView collectionId="team" itemId={teamDrill.openId} onBack={teamDrill.close} onNavigate={teamDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Team" subtitle="Your People squad (X-Men doctrine)" action={<Badge tone="accent">{teamCount} members</Badge>} />
        <CollectionRepeater collectionId="team" onOpen={teamDrill.open} />
      </div>
    );
  };

  const Agents = () => {
    if (agentsDrill.openId) {
      return <DynamicPageView collectionId="people_agents" itemId={agentsDrill.openId} onBack={agentsDrill.close} onNavigate={agentsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Agents" subtitle="Autonomous workers on the People domain" action={<Badge tone="accent">{agentsCount} configured</Badge>} />
        <CollectionRepeater collectionId="people_agents" onOpen={agentsDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'team', label: 'Team', icon: Users, render: Team },
    { id: 'agents', label: 'Agents', icon: Bot, render: Agents },
    { id: 'fleet', label: 'Fleet', icon: Cpu, render: Fleet },
    { id: 'content', label: 'Content', icon: FileText, render: Content },
    { id: 'schedule', label: 'Schedule', icon: Calendar, render: Schedule },
    { id: 'culture', label: 'Culture', icon: Heart, render: Culture },
  ];

  const groups: Record<string, string> = {
    team: 'People',
    agents: 'People',
    fleet: 'AI Specialists',
    content: 'AI Specialists',
    schedule: 'AI Specialists',
    culture: 'Ops',
  };

  return <AppFrame title="People / Agents" subtitle="Green Lantern domain" icon={Users} accent={ACCENT} sections={sections} groups={groups} />;
}
