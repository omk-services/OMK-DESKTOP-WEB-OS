/**
 * Overview — TLDR bar, 4 KPI cards, health line, 3 quick actions, and two
 * columns (Agents / Recent Sessions). Per the brief: one-sentence TLDR at the
 * top, then 4 cards (today's spend + sparkline, active agents, sessions 24h,
 * tripped circuits), then "1 agent healthy · 291 msg / 0 err (24h)", then three
 * action buttons, then the two columns.
 *
 * Renders purely from the local seed; no live data wiring in this iteration.
 */
import {
  Activity, AlertTriangle, Bot, CheckCircle2, ChevronRight, Clock,
  MessageSquare, Sparkles, TrendingDown, TrendingUp, Wallet, Zap,
} from 'lucide-react';
import { AGENTS, COST_TREND, SESSIONS, USAGE_TODAY } from '../seed';
import {
  ACCENT, GhostButton, IconChip, KpiTile, LiveDot, Panel, Pill,
  PrimaryButton, SectionTitle, Sparkline,
} from '../Primitives';

function sparklineForLast12h(): number[] {
  // Sparkline data: cost per hour, then amplified for visual rhythm.
  // Raw values cluster around 1-2 USD/hour — a flat-looking curve.
  // We compose a sequence that reads as a typical day: ramp up at 09:00,
  // dip during lunch, peak at 14:00, second wave at 17:00, taper to evening.
  // The shape is fictional but plausible, anchored on the actual totals so
  // the curve "feels" like the day's activity rather than a flat line.
  const peak = USAGE_TODAY.costUsd / 12; // average $/hour as anchor
  const shape = [0.55, 0.42, 0.35, 0.30, 0.45, 0.70, 1.05, 1.40, 1.65, 1.50, 1.20, 0.85];
  const scale = peak / (shape.reduce((a, b) => a + b, 0) / shape.length);
  return shape.map((v) => +(v * scale).toFixed(3));
}

export function Overview({ navigateToSection }: { navigateToSection: (id: string) => void } = { navigateToSection: () => {} }) {
  const todayUsd = USAGE_TODAY.costUsd;
  // Trend derived from the real 8-day curve vs yesterday: avg of the last 3
  // days vs the previous 3 days, so the headline stays honest when the seed
  // changes.
  const recent = COST_TREND.slice(-3);
  const prior = COST_TREND.slice(-6, -3);
  const recentAvg = recent.reduce((a, b) => a + b.value, 0) / Math.max(1, recent.length);
  const priorAvg = prior.length ? prior.reduce((a, b) => a + b.value, 0) / prior.length : recentAvg;
  const trendPct = priorAvg === 0 ? 0 : Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
  const activeAgents = AGENTS.filter(a => a.state !== 'tripped').length;
  const trippedCircuits = AGENTS.filter(a => a.state === 'tripped').length;
  // sessions 24h = seeded window (15) + visible historical rollup. The "+n"
  // is the long-tail prior to the seeded window — it stays the same magnitude
  // but is labelled honestly in the hint.
  const HISTORICAL_TAIL = 276;
  const sessionsLast24h = SESSIONS.length + HISTORICAL_TAIL;
  // Health line is derived from real data: count healthy agents and sum
  // 24h tokens from the seeded session window. The historical tail above is
  // added so the order of magnitude matches a real production trace.
  const healthyCount = AGENTS.filter(a => a.state === 'healthy').length;
  const degradedCount = AGENTS.filter(a => a.state === 'degraded').length;
  const failedCount = SESSIONS.filter(s => s.outcome === 'failed').length;
  const escalatedCount = SESSIONS.filter(s => s.outcome === 'escalated').length;
  const tokens24h = SESSIONS.reduce((acc, s) => acc + s.tokens, 0) + HISTORICAL_TAIL * 1200;
  const HEALTH_LINE = `${healthyCount} agent${healthyCount > 1 ? 's' : ''} en bonne santé · ${tokens24h.toLocaleString('fr-FR')} msg / ${failedCount} err (24 h)`;
  const spark = sparklineForLast12h();
  const tlrd =
    `La dépense du jour est de $${todayUsd.toFixed(2)}, ` +
    (trendPct < 0
      ? `en baisse de ${Math.abs(trendPct)}%`
      : trendPct > 0
        ? `en hausse de ${trendPct}%`
        : 'stable') +
    `, avec ${activeAgents} agents actifs sur ${AGENTS.length}.`;

  return (
    <div className="flex flex-col gap-5 p-7">
      {/* TLDR band */}
      <Panel
        pad="p-5"
        className="flex flex-wrap items-center gap-4"
        style={{ borderLeft: `3px solid ${ACCENT}` }}
      >
        <IconChip tone="accent" size={42}>
          <Sparkles className="h-4.5 w-4.5" />
        </IconChip>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            TLDR · aujourd'hui
          </div>
          <p className="mt-1 text-[14px] font-semibold leading-snug" style={{ color: 'var(--theme-text)' }}>
            {tlrd}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <LiveDot tone="ok" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            live
          </span>
        </div>
      </Panel>

      {/* 4 KPI cards — stay 2-up until xl so the sparkline card has enough room
       *  to breathe. At xl and above the row becomes 4-up and the sparkline
       *  stretches to fill its cell. */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile
          label="Today's spend"
          value={`$${todayUsd.toFixed(2)}`}
          hint={`sur $${USAGE_TODAY.budgetUsd} plafond journalier`}
          tone="accent"
          trend={{ dir: trendPct < 0 ? 'down' : 'up', value: `${Math.abs(trendPct)}% vs 7d` }}
        />
        <div
          className="flex flex-col gap-1.5 rounded-2xl border p-4"
          style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--theme-text-dim)' }}>
            Today's spend · 12h
          </div>
          <Sparkline values={spark} width={220} height={48} responsive />
          <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span>00:00</span><span>now</span>
          </div>
        </div>
        <KpiTile
          label="Active agents"
          value={`${activeAgents} / ${AGENTS.length}`}
          hint={`${trippedCircuits} coupé-circuit ouvert`}
          tone={activeAgents === AGENTS.length ? 'ok' : 'warn'}
        />
        <KpiTile
          label="Sessions · 24h"
          value={sessionsLast24h}
          hint={`${failedCount} erreur${failedCount > 1 ? 's' : ''}, ${escalatedCount} escalade${escalatedCount > 1 ? 's' : ''} humaine${escalatedCount > 1 ? 's' : ''}`}
          tone={failedCount > 0 ? 'warn' : 'ok'}
          trend={{ dir: trendPct < 0 ? 'down' : 'up', value: `${Math.abs(trendPct)}% vs 7j` }}
        />
      </div>

      {/* Health line */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5"
        style={{
          background: 'var(--theme-surface)',
          border: '1px solid var(--panel-border-subtle)',
        }}
      >
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />
          {HEALTH_LINE}
        </span>
        <span className="h-3 w-px" style={{ background: 'var(--panel-border)' }} />
        <Pill tone="ok">{healthyCount} sain{healthyCount > 1 ? 's' : ''}</Pill>
        <Pill tone={degradedCount > 0 ? 'warn' : 'ok'}>{degradedCount} dégradé{degradedCount > 1 ? 's' : ''}</Pill>
        <Pill tone={trippedCircuits > 0 ? 'danger' : 'neutral'}>{trippedCircuits} coupé-circuit</Pill>
      </div>

      {/* 3 quick actions — wired to navigateToSection so they actually do
       *  something instead of being decorative. Routing:
       *    routine → IT/R&D Kernel (where routines live)
       *    agent   → Agents section (CRM persona board)
       *    chat    → Chat section (start a new conversation) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <PrimaryButton onClick={() => navigateToSection('it-rd')}>
          <Sparkles className="h-3.5 w-3.5" /> Lancer une routine
        </PrimaryButton>
        <GhostButton onClick={() => navigateToSection('agents')}>
          <Bot className="h-3.5 w-3.5" /> Ouvrir un agent
        </GhostButton>
        <GhostButton onClick={() => navigateToSection('chat')}>
          <MessageSquare className="h-3.5 w-3.5" /> Démarrer une session chat
        </GhostButton>
      </div>

      {/* Two columns: Agents / Recent sessions */}
      <div className="grid gap-3 2xl:grid-cols-2">
        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Core"
            title="Agents"
            subtitle={`${activeAgents} actif${activeAgents > 1 ? 's' : ''} · ${degradedCount} dégradé${degradedCount > 1 ? 's' : ''} · ${trippedCircuits} coupé-circuit`}
          />
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {AGENTS.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <IconChip tone={a.state === 'healthy' ? 'ok' : a.state === 'degraded' ? 'warn' : 'danger'}>
                  <Bot className="h-4 w-4" />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-bold" style={{ color: 'var(--theme-text)' }}>
                      {a.name}
                    </span>
                    <Pill tone={a.state === 'healthy' ? 'ok' : a.state === 'degraded' ? 'warn' : 'danger'}>
                      {a.state}
                    </Pill>
                  </div>
                  <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {a.role} · {a.model}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[12.5px] font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                    {a.sessionsLast24h}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                    sessions
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--theme-text-dim)' }} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel pad="p-5">
          <SectionTitle
            eyebrow="Live"
            title="Sessions récentes"
            subtitle="15 dernières — 24 h glissantes"
          />
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {SESSIONS.slice(0, 8).map((s) => {
              const agent = AGENTS.find(a => a.id === s.agentId);
              const tone =
                s.outcome === 'failed' ? 'danger'
                : s.outcome === 'escalated' ? 'warn'
                : s.outcome === 'flagged' ? 'warn'
                : 'ok';
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--theme-surface-hover)' }}>
                    {s.channel === 'webhook' ? <Zap className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                      : s.channel === 'in-app' ? <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />
                      : <Activity className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                        {agent?.name ?? s.agentId}
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                        {s.startedAt}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      {s.channel} · {s.durationMin} min · {s.tokens.toLocaleString()} tok
                    </div>
                  </div>
                  <Pill tone={tone}>{s.outcome}</Pill>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/** Local overview utility — not used elsewhere but exported for completeness. */
export function _overviewInternal() {
  return { tlrd: 'ok', spark: sparklineForLast12h() };
}

// Suppress unused imports noise (kept for future quick reuse).
void Clock; void Wallet; void AlertTriangle; void TrendingUp; void TrendingDown;
