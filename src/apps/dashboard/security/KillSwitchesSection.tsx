/**
 * KillSwitchesSection.tsx — the 42 circuit breakers.
 *
 * Grouped by family (cost / safety / agents / tools). Each switch renders
 * with its label, a one-line "what it cuts" description, owner attribution,
 * and a toggle. The current OFF count is surfaced in the page header.
 */
import { useMemo, useState } from 'react';
import { Power } from 'lucide-react';
import { KILL_SWITCHES, type KillSwitch, type KillSwitchFamily } from './seed';
import { Card, ChokepointStrip, GroupHead, Pill, SectionHeader, Toggle } from './shared';

const FAMILY_LABELS: Record<KillSwitchFamily, string> = {
  cost: 'Cost Controls',
  safety: 'Safety & Guardrails',
  agents: 'Agents',
  tools: 'Tools',
};

const FAMILY_HINTS: Record<KillSwitchFamily, string> = {
  cost: 'circuit breakers on the variable spend',
  safety: 'bypassable protections — only off in test',
  agents: 'kill individual agents without touching the rest',
  tools: 'block the orchestrator from specific surfaces',
};

function SwitchCard({ sw, onToggle }: { sw: KillSwitch; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13.5px] font-bold text-[var(--theme-text)] truncate">{sw.label}</span>
          </div>
          <p className="text-[11.5px] text-[var(--theme-text-muted)] leading-snug mt-1">{sw.cuts}</p>
        </div>
        <Toggle on={sw.on} onClick={onToggle} ariaLabel={`Toggle ${sw.label}`} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--panel-border-subtle)]">
        <Pill tone={sw.on ? 'ok' : 'danger'}>
          {sw.on ? 'On — running' : 'Off — blocked'}
        </Pill>
        <span className="text-[10px] text-[var(--theme-text-dim)] font-mono">
          Set by {sw.setBy} · {sw.lastFlipped}
        </span>
      </div>
    </div>
  );
}

export function KillSwitchesSection() {
  const [switches, setSwitches] = useState(KILL_SWITCHES);
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? switches.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            s.cuts.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q)
        )
      : switches;
    const byFamily: Record<KillSwitchFamily, KillSwitch[]> = {
      cost: [], safety: [], agents: [], tools: [],
    };
    filtered.forEach((s) => byFamily[s.family].push(s));
    return byFamily;
  }, [switches, query]);

  const offCount = switches.filter((s) => !s.on).length;
  const toggle = (id: string) =>
    setSwitches((prev) => prev.map((s) => (s.id === id ? { ...s, on: !s.on, lastFlipped: '2026-08-06' } : s)));

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Kill Switches"
        subtitle="Circuit breakers for emergency control. Green means running normally; switch off to block a behavior. The cost cap fails closed — if it cannot compute today's spend, it stops rather than letting spend run."
        icon={Power}
        badge={
          <Pill tone={offCount === 0 ? 'ok' : 'danger'}>
            {offCount === 0 ? 'all running' : `${offCount} off`}
          </Pill>
        }
      />

      {/* The turn chokepoint — the single pipe everything passes through. */}
      <div className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">
          Turn chokepoint
        </div>
        <ChokepointStrip current="cost cap (fail-closed)" />
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search switches by name or description…"
          className="w-full px-4 py-2.5 text-[12.5px] rounded-xl border border-[var(--panel-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] focus:outline-none focus:border-[var(--theme-accent)]"
        />
      </div>

      {(['cost', 'safety', 'agents', 'tools'] as KillSwitchFamily[]).map((fam) => {
        const list = grouped[fam];
        if (list.length === 0) return null;
        return (
          <div key={fam} className="mb-4">
            <GroupHead title={FAMILY_LABELS[fam]} count={list.length} hint={FAMILY_HINTS[fam]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((sw) => (
                <SwitchCard key={sw.id} sw={sw} onToggle={() => toggle(sw.id)} />
              ))}
            </div>
          </div>
        );
      })}

      {/* 42 switch invariant */}
      <Card className="mt-6 p-4 flex items-center gap-3">
        <div className="text-[12px] text-[var(--theme-text-muted)]">
          Total kill switches: <span className="font-bold text-[var(--theme-text)] tabular-nums">{switches.length}</span> / 42
        </div>
        <div className="ml-auto">
          <Pill tone={switches.length === 42 ? 'ok' : 'danger'}>
            {switches.length === 42 ? 'invariant met' : `${switches.length - 42} off-spec`}
          </Pill>
        </div>
      </Card>
    </div>
  );
}