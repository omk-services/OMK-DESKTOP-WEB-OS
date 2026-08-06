/**
 * PanicSection.tsx — emergency all-stop.
 *
 * Engaging panic snapshots the current kill-switch state, then trips every
 * switch at once. The page should inspire caution: a single toggle, but
 * a long list of what it stops, what survives, and how reversal works.
 */
import { useState } from 'react';
import { Siren } from 'lucide-react';
import { PANIC_STATE } from './seed';
import { Card, Pill, SectionHeader, StatRow, Toggle } from './shared';

export function PanicSection() {
  const [active, setActive] = useState(PANIC_STATE.active);
  const [releasedBy, setReleasedBy] = useState<string | null>(PANIC_STATE.releasedBy);
  const [releasedAt, setReleasedAt] = useState<string | null>(PANIC_STATE.releasedAt);
  const [reason, setReason] = useState(PANIC_STATE.reason ?? '');
  const [confirmArmed, setConfirmArmed] = useState(false);

  const engage = () => {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setActive(true);
    setReleasedBy('owner');
    setReleasedAt(now);
  };

  const release = () => {
    setActive(false);
    setConfirmArmed(false);
  };

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Panic"
        subtitle="Emergency all-stop. Engaging panic snapshots the current kill-switch state, then trips every switch at once. Use it only for an active incident. The current state is snapshotted so it can be restored afterward."
        icon={Siren}
        badge={
          <Pill tone={active ? 'danger' : 'ok'}>
            {active ? 'PANIC ACTIVE' : 'no panic active'}
          </Pill>
        }
      />

      <Card accent={active ? '#dc2626' : undefined} className="p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[var(--theme-text)]">
              {active ? 'Panic engaged — agent activity blocked' : 'Panic disengaged'}
            </div>
            <p className="text-[11.5px] text-[var(--theme-text-muted)] mt-1 leading-relaxed">
              {active
                ? 'All agent turns halted, every kill switch tripped, write-once audit log keeps accepting events. Inspect snapshot to restore later.'
                : 'Switch on to engage. You will be asked to confirm. The action itself is audited.'}
            </p>
          </div>
          <Toggle
            on={active}
            onClick={active ? release : engage}
            ariaLabel="Engage panic"
          />
        </div>

        {confirmArmed && !active && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11.5px] text-amber-900">
            <span className="font-bold">Confirm:</span> click the toggle a second time to engage panic. The action is irreversible until an owner restores the snapshot.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mt-5 pt-4 border-t border-[var(--panel-border-subtle)]">
          <StatRow label="Released by" value={releasedBy ?? '—'} tone="neutral" />
          <StatRow label="Released at" value={releasedAt ?? '—'} tone="neutral" />
          <div className="sm:col-span-2 py-3 border-b border-[var(--panel-border-subtle)]">
            <label className="text-[12px] font-medium text-[var(--theme-text-muted)] uppercase tracking-wide block mb-1.5">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Incident description"
              className="w-full px-3 py-2 text-[12.5px] rounded-lg border border-[var(--panel-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text-dim)] focus:outline-none focus:border-[var(--theme-accent)]"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">
            Stops
          </div>
          <ul className="text-[11.5px] text-[var(--theme-text)] space-y-1.5">
            {PANIC_STATE.stops.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 shrink-0 mt-0.5">×</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">
            Survives
          </div>
          <ul className="text-[11.5px] text-[var(--theme-text)] space-y-1.5">
            {PANIC_STATE.survives.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2">
            Reversal
          </div>
          <p className="text-[11.5px] text-[var(--theme-text)] leading-relaxed">{PANIC_STATE.reversal}</p>
        </Card>
      </div>
    </div>
  );
}