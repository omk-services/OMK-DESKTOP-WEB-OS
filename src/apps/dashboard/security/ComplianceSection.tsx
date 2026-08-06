/**
 * ComplianceSection.tsx — SOC 2 / HIPAA control coverage.
 *
 * For each control: a level (met / partial / gap / manual), a category, a
 * one-line label, a detail, sub-checks, and a "fix:" brief — the prompt you
 * paste into a model to remediate the gap.
 */
import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { COMPLIANCE_CONTROLS, type ComplianceControl, type ComplianceFramework } from './seed';
import { Pill, SectionHeader, type Tone } from './shared';

const STATUS_TONE: Record<ComplianceControl['status'], Tone> = {
  met: 'ok',
  partial: 'warn',
  gap: 'danger',
  manual: 'neutral',
};

function BreakdownBar({ controls }: { controls: ComplianceControl[] }) {
  const counts: Record<ComplianceControl['status'], number> = { met: 0, partial: 0, gap: 0, manual: 0 };
  controls.forEach((c) => counts[c.status]++);
  const total = controls.length;
  const segments = [
    { key: 'gap',     color: '#dc2626', label: 'Gap',     n: counts.gap },
    { key: 'partial', color: '#d97706', label: 'Partial', n: counts.partial },
    { key: 'met',     color: '#16a34a', label: 'Met',     n: counts.met },
    { key: 'manual',  color: '#6366f1', label: 'Manual',  n: counts.manual },
  ];
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden border border-[var(--panel-border-subtle)]">
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${(s.n / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.n}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-[10.5px]">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[var(--theme-text-muted)]">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="font-bold tabular-nums text-[var(--theme-text)]">{s.n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ControlCard({ control }: { control: ComplianceControl }) {
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-bold text-[var(--theme-text)]">{control.label}</span>
          </div>
          <p className="text-[11.5px] text-[var(--theme-text-muted)] leading-snug mt-1">{control.detail}</p>
        </div>
        <Pill tone={STATUS_TONE[control.status]}>{control.status}</Pill>
      </div>

      {control.subChecks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {control.subChecks.map((s) => (
            <span
              key={s}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-surface-hover)] text-[var(--theme-text-muted)]"
            >
              · {s}
            </span>
          ))}
        </div>
      )}

      {control.fixPrompt && control.status !== 'met' && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 leading-snug">
          <span className="font-bold">Fix:</span> {control.fixPrompt}
        </div>
      )}
    </div>
  );
}

export function ComplianceSection() {
  const [framework, setFramework] = useState<ComplianceFramework>('soc2');
  const filtered = COMPLIANCE_CONTROLS.filter((c) => c.framework === framework);
  const met = filtered.filter((c) => c.status === 'met').length;
  const score = Math.round((met / filtered.length) * 100);

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="Compliance"
        subtitle="SOC 2 and HIPAA coverage scored against your live posture. Re-scan any time; generate a remediation brief to paste into Claude Code; fix a batch; rescan. Repeat until only manual items remain."
        icon={ClipboardCheck}
      />

      <div className="mb-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4">
        <div className="flex items-center gap-4 border-b border-[var(--panel-border-subtle)] mb-3">
          {(['soc2', 'hipaa'] as ComplianceFramework[]).map((f) => {
            const fwControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === f);
            const fwMet = fwControls.filter((c) => c.status === 'met').length;
            const fwScore = fwControls.length === 0 ? 0 : Math.round((fwMet / fwControls.length) * 100);
            return (
              <button
                key={f}
                onClick={() => setFramework(f)}
                className={`pb-2 text-[12.5px] font-bold uppercase tracking-wider transition-colors ${
                  framework === f
                    ? 'text-[var(--theme-text)] border-b-2 border-[var(--theme-accent)]'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
                }`}
              >
                {f === 'soc2' ? 'SOC 2' : 'HIPAA'} {fwScore}%
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline gap-4 mb-3">
          <span className="text-3xl font-extrabold text-[var(--theme-text)] tabular-nums">{score}%</span>
          <span className="text-[11.5px] text-[var(--theme-text-muted)]">
            <span className="font-bold tabular-nums text-[var(--theme-text)]">{filtered.length}</span> verifiable controls scored
          </span>
        </div>

        <BreakdownBar controls={filtered} />
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <ControlCard key={c.id} control={c} />
        ))}
      </div>
    </div>
  );
}