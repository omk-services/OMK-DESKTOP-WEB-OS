/**
 * AlertingSection.tsx — alerts configured for security-relevant events.
 *
 * Each row: trigger (what), threshold (plain expression), recipient (who),
 * and last fired timestamp. The recipient column is what makes alerting
 * security.
 */
import { Bell } from 'lucide-react';
import { ALERTS, type AlertConfig } from './seed';
import { Pill, SectionHeader, Toggle } from './shared';

export function AlertingSection() {
  const enabled = ALERTS.filter((a) => a.enabled).length;
  const fired = ALERTS.filter((a) => a.lastFired).length;

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Alerting"
        subtitle="Security-relevant events with a destination. Every alert goes to a recipient and has a threshold expressed in domain terms. The recipient column is the part that turns a log into a notification."
        icon={Bell}
        badge={
          <div className="flex gap-1.5">
            <Pill tone="ok">{enabled} enabled</Pill>
            <Pill tone={fired > 0 ? 'warn' : 'neutral'}>{fired} fired (lifetime)</Pill>
          </div>
        }
      />

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-[var(--theme-surface-hover)] text-left text-[10.5px] uppercase tracking-wider text-[var(--theme-text-muted)]">
              <th className="font-semibold px-4 py-2.5 w-[60px]">On</th>
              <th className="font-semibold px-4 py-2.5">Trigger</th>
              <th className="font-semibold px-4 py-2.5">Threshold</th>
              <th className="font-semibold px-4 py-2.5">Recipient</th>
              <th className="font-semibold px-4 py-2.5">Last fired</th>
            </tr>
          </thead>
          <tbody>
            {ALERTS.map((a: AlertConfig) => (
              <tr key={a.id} className="border-t border-[var(--panel-border-subtle)]">
                <td className="px-4 py-2.5">
                  <Toggle on={a.enabled} onClick={() => { /* wired in a later phase */ }} ariaLabel={a.trigger} />
                </td>
                <td className="px-4 py-2.5 text-[var(--theme-text)] font-medium">{a.trigger}</td>
                <td className="px-4 py-2.5 text-[var(--theme-text-muted)] font-mono text-[11px]">{a.threshold}</td>
                <td className="px-4 py-2.5 text-[var(--theme-text)] text-[11.5px]">{a.recipient}</td>
                <td className="px-4 py-2.5">
                  {a.lastFired ? (
                    <span className="font-mono text-[11px] text-[var(--theme-text-muted)]">{a.lastFired}</span>
                  ) : (
                    <Pill tone="neutral">never</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[10.5px] font-mono text-[var(--theme-text-dim)]">
        Total alerts: <span className="text-[var(--theme-text)] font-bold tabular-nums">{ALERTS.length}</span>
      </div>
    </div>
  );
}