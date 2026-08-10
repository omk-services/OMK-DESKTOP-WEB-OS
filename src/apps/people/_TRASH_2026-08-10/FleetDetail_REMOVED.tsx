/**
 * FleetDetail_REMOVED.tsx — version archivée 2026-08-10.
 *
 * Pourquoi ce fichier existe :
 *   Avant la correction de DETTE 1, PeopleApp contenait une fonction
 *   `FleetDetail({ agent, onBack })` qui rendait une fiche agent inline
 *   (~148 lignes, glassmorphism + status badge + 4 métriques + load bar +
 *   recent runs + peers + model footer). C'était un doublon stylistique
 *   de la fiche riche `PeopleDetailPage` (799 lignes, soft-UI avec
 *   vitals + ladder + signal log + capabilities + handoffs).
 *
 * Pourquoi on l'a retirée :
 *   1. La branche `{detail ? ...}` de PeopleApp (qui rend la fiche riche
 *      dans l'overlay `AppDetailOverlay`) était morte parce que `setDetail`
 *      n'était jamais appelé. La fiche riche était donc invisible.
 *   2. Le clic sur une carte de la Fleet déclenchait l'ancien
 *      `FleetDetail` inline via `selectedCode` local, qui court-circuitait
 *      le rendu overlay sans jamais montrer la fiche riche.
 *   3. La correction de DETTE 1 rebranche le clic sur la fiche riche :
 *      `openAgentDetail(agent)` peuple `detail`, l'overlay s'ouvre, et
 *      `PeopleDetailPage` rend sa surface complète (vitals, ladder,
 *      signal log, capabilities, handoffs).
 *
 * Conséquence : le rendu inline `FleetDetail` est désormais non utilisé.
 * Conformément à la doctrine D4 (append-only), il est archivé ici plutôt
 * que hard-deleted. Si la fiche riche s'avère un jour trop lourde pour
 * un usage donné, ce code peut servir de point de départ pour un rendu
 * plus léger.
 */
import type { FleetAgent } from '../fleet';
import { STATE_META } from '../fleet';

export function FleetDetail_REMOVED({ agent, onBack }: { agent: FleetAgent; onBack: () => void }) {
  const state = STATE_META[agent.state];
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar p-7">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-[11px] font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition-colors"
      >
        ← Back to Fleet
      </button>
      <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${agent.accent}25, ${agent.accent}08)`, border: `1px solid ${agent.accent}40` }}>
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[color:#fff] text-2xl font-extrabold shrink-0" style={{ background: agent.accent, boxShadow: `0 8px 24px ${agent.accent}40` }}>
            {agent.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[28px] font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>{agent.name}</h2>
              <span className="font-mono text-[11px] font-bold text-[var(--theme-text-muted)] px-2 py-0.5 rounded bg-[var(--panel-border-subtle)]">{agent.code}</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${state.pulse ? 'animate-pulse' : ''}`} style={{ color: state.color, background: state.bg }}>
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
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          {agent.capabilities.map(c => (
            <span key={c} className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${agent.accent}15`, color: agent.accent, boxShadow: `inset 0 0 0 1px ${agent.accent}30` }}>
              {c}
            </span>
          ))}
        </div>
      </div>
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
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)] mb-2">
          <span>Current load</span>
          <span className="text-[var(--theme-text)] font-bold text-[14px]">{agent.load}% · {agent.task}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--panel-border-subtle)] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${agent.load}%`, background: agent.load > 80 ? '#b91c1c' : agent.load > 50 ? '#0891b2' : '#16a34a' }} />
        </div>
      </div>
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--panel-border-subtle)] flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">RECENT RUNS · last 30 min</span>
          <span className="ml-auto text-[10px] font-mono text-[var(--theme-text-dim)]">share · <span className="text-[var(--theme-text)] font-bold">{agent.share}%</span></span>
        </div>
        <ul className="divide-y divide-[var(--panel-border-subtle)]">
          {agent.recentRuns.map((r, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-2.5 text-[12px]">
              <span className="font-mono text-[10.5px] text-[var(--theme-text-dim)] w-12 shrink-0">{r.ts}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.status === 'ok' ? '#16a34a' : r.status === 'warn' ? '#f59e0b' : '#dc2626' }} />
              <span className="text-[var(--theme-text)] flex-1 truncate">{r.task}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: r.status === 'ok' ? '#15803d' : r.status === 'warn' ? '#b45309' : '#b91c1c', background: r.status === 'ok' ? '#dcfce7' : r.status === 'warn' ? '#fef3c7' : '#fee2e2' }}>
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-[var(--panel-solid)] rounded-2xl border border-[var(--panel-border)] shadow-sm p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)] mb-2">PEERS · MANAGER→WORKER HANDOFFS</div>
        <div className="flex items-center gap-2 flex-wrap">
          {agent.peers.map(p => (
            <span key={p} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--theme-surface-hover)] text-[var(--theme-text)] border border-[var(--panel-border)]">
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="text-[10px] font-mono text-[var(--theme-text-dim)] text-center pt-2">
        default model · <span className="text-[var(--theme-text)] font-bold">{agent.defaultModel}</span> · 4 log entries shown
      </div>
    </div>
  );
}