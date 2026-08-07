/**
 * Sessions — filterable table of the last sessions. Filters: agent, channel,
 * outcome. Columns: agent, channel, started-at, duration, tokens, cost,
 * outcome pill.
 */
import { useMemo, useState, type JSX } from 'react';
import { Filter, History } from 'lucide-react';
import { AGENTS, SESSIONS } from '../seed';
import type { DashboardSession } from '../seed';
import { ACCENT, IconChip, Panel, Pill, SectionTitle } from '../Primitives';

type OutcomeFilter = 'all' | 'completed' | 'escalated' | 'failed' | 'flagged';
type ChannelFilter = 'all' | 'in-app' | 'email' | 'slack' | 'telegram' | 'webhook';

export function Sessions(): JSX.Element {
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const filtered = useMemo(() => {
    return SESSIONS.filter((s) => {
      if (agentFilter !== 'all' && s.agentId !== agentFilter) return false;
      if (outcomeFilter !== 'all' && s.outcome !== outcomeFilter) return false;
      if (channelFilter !== 'all' && s.channel !== channelFilter) return false;
      return true;
    });
  }, [agentFilter, outcomeFilter, channelFilter]);

  const totals = useMemo(() => {
    const tokens = filtered.reduce((acc, s) => acc + s.tokens, 0);
    const cost = filtered.reduce((acc, s) => acc + s.cost, 0);
    const duration = filtered.reduce((acc, s) => acc + s.durationMin, 0);
    return { tokens, cost, duration };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Operations"
        title="Sessions"
        subtitle={`${filtered.length} ligne${filtered.length > 1 ? 's' : ''} · ${totals.tokens.toLocaleString()} tokens · $${totals.cost.toFixed(2)} · ${totals.duration} min`}
        action={<Pill tone="info">vue 24 h</Pill>}
      />

      {/* Filters */}
      <Panel pad="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-muted)' }}>
            <Filter className="h-3 w-3" /> Filtres
          </span>
          <Select label="Agent" value={agentFilter} onChange={setAgentFilter} options={[
            { id: 'all', label: 'Tous' },
            ...AGENTS.map((a) => ({ id: a.id, label: a.name })),
          ]} />
          <Select label="Canal" value={channelFilter} onChange={(v) => setChannelFilter(v as ChannelFilter)} options={[
            { id: 'all',     label: 'Tous' },
            { id: 'in-app',  label: 'In-app' },
            { id: 'email',   label: 'Email' },
            { id: 'slack',   label: 'Slack' },
            { id: 'telegram',label: 'Telegram' },
            { id: 'webhook', label: 'Webhook' },
          ]} />
          <Select label="Issue" value={outcomeFilter} onChange={(v) => setOutcomeFilter(v as OutcomeFilter)} options={[
            { id: 'all',       label: 'Toutes' },
            { id: 'completed', label: 'completed' },
            { id: 'escalated', label: 'escalated' },
            { id: 'flagged',   label: 'flagged' },
            { id: 'failed',    label: 'failed' },
          ]} />
        </div>
      </Panel>

      {/* Table */}
      <Panel pad="p-0" className="relative">
        <div
          className="overflow-x-auto custom-scrollbar"
          style={{
            backgroundImage:
              'linear-gradient(to right, transparent calc(100% - 40px), var(--theme-surface) 100%)',
            backgroundAttachment: 'local, local, scroll, scroll',
          }}
        >
          <table className="w-full text-left text-[12px]" style={{ minWidth: '760px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)' }}>
                {['Heure', 'Agent', 'Canal', 'Durée', 'Tokens', 'Coût', 'Issue'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] whitespace-nowrap ${i === 0 ? 'pl-6' : ''}`}
                    style={{ color: 'var(--theme-text-dim)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                    Aucun résultat pour ces filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => <SessionRow key={s.id} session={s} />)
              )}
            </tbody>
          </table>
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
          style={{ background: 'linear-gradient(to right, transparent, var(--theme-surface))' }}
          aria-hidden="true"
        />
      </Panel>
    </div>
  );
}

function SessionRow({ session }: { session: DashboardSession }): JSX.Element {
  const agent = AGENTS.find((a) => a.id === session.agentId);
  const tone =
    session.outcome === 'failed' ? 'danger'
    : session.outcome === 'escalated' ? 'warn'
    : session.outcome === 'flagged' ? 'warn'
    : 'ok';
  return (
    <tr style={{ borderBottom: '1px solid var(--panel-border-subtle)' }}>
      <td className="pl-6 pr-4 py-3 font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--theme-text-muted)' }}>
        {session.startedAt}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <IconChip tone={agent?.state === 'healthy' ? 'ok' : agent?.state === 'degraded' ? 'warn' : 'danger'} size={24}>
            <History className="h-3 w-3" />
          </IconChip>
          <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'var(--theme-text)' }}>
            {agent?.name ?? session.agentId}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-[11px] uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--theme-text-dim)' }}>
        {session.channel}
      </td>
      <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: 'var(--theme-text)' }}>
        {session.durationMin} min
      </td>
      <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: 'var(--theme-text)' }}>
        {session.tokens.toLocaleString()}
      </td>
      <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: ACCENT }}>
        ${session.cost.toFixed(3)}
      </td>
      <td className="px-4 py-3 pr-6 whitespace-nowrap">
        <Pill tone={tone}>{session.outcome}</Pill>
      </td>
    </tr>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
}): JSX.Element {
  return (
    <label className="inline-flex items-center gap-2 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
      <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-2 py-1 text-[11.5px] font-semibold outline-none"
        style={{
          background: 'var(--theme-surface-hover)',
          color: 'var(--theme-text)',
          border: '1px solid var(--panel-border)',
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
