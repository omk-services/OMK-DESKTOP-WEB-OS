/**
 * DlpSection.tsx — 9 DLP patterns on every outbound reply.
 *
 * 7 blocking (AWS access keys, API key headers, PEM private keys, Slack tokens,
 * GitHub PATs, credit cards, US SSNs) and 2 warning (AWS-secret-key-shaped
 * strings, JWTs). The nuance between block and warn is the whole point of the
 * page — it is shown explicitly.
 */
import { ShieldAlert } from 'lucide-react';
import { DLP_PATTERNS, type DlpPattern } from './seed';
import { Card, Pill, SectionHeader } from './shared';

function PatternCard({ pattern }: { pattern: DlpPattern }) {
  const tone = pattern.action === 'block' ? 'danger' : 'warn';
  return (
    <Card accent={pattern.action === 'block' ? '#dc2626' : '#d97706'} className="p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold text-[var(--theme-text)]">{pattern.label}</div>
          <p className="text-[11.5px] text-[var(--theme-text-muted)] leading-snug mt-1">{pattern.rationale}</p>
        </div>
        <Pill tone={tone}>{pattern.action}</Pill>
      </div>
      <div className="font-mono text-[10.5px] text-[var(--theme-text-dim)] bg-[var(--theme-surface-hover)] rounded px-2 py-1.5 break-all">
        {pattern.pattern}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--panel-border-subtle)] text-[10.5px]">
        <span className="text-[var(--theme-text-muted)]">
          <span className="font-bold tabular-nums text-[var(--theme-text)]">{pattern.hitsLast24h}</span> hit(s) in last 24h
        </span>
        <span className="text-[var(--theme-text-dim)] font-mono">
          {pattern.lastTriggered ?? 'never'}
        </span>
      </div>
    </Card>
  );
}

export function DlpSection() {
  const blocking = DLP_PATTERNS.filter((p) => p.action === 'block');
  const warning = DLP_PATTERNS.filter((p) => p.action === 'warn');

  return (
    <div className="p-7 text-[var(--theme-text)]">
      <SectionHeader
        title="DLP & Exfil"
        subtitle="Nine patterns scanned on every outbound reply. Seven block the reply outright; two surface a warning so the caller can decide. The split is the whole nuance of the page."
        icon={ShieldAlert}
        badge={
          <div className="flex gap-1.5">
            <Pill tone="danger">{blocking.length} blocking</Pill>
            <Pill tone="warn">{warning.length} warning</Pill>
          </div>
        }
      />

      <div className="mb-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 flex items-start gap-3">
        <Pill tone="danger">block</Pill>
        <div className="text-[12px] text-[var(--theme-text-muted)] leading-relaxed">
          The reply is dropped, the audit log records a <span className="font-mono text-[11px]">dlp.block</span> event, and the agent receives a refusal stub. The user is told the message was scrubbed, not why.
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {blocking.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      <div className="mt-6 mb-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--theme-surface)] p-4 flex items-start gap-3">
        <Pill tone="warn">warn</Pill>
        <div className="text-[12px] text-[var(--theme-text-muted)] leading-relaxed">
          The reply still goes out — but the caller is told a likely-secret string was detected, and the audit log records a <span className="font-mono text-[11px]">dlp.warn</span>. Use warn for shapes that have legitimate non-secret uses.
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {warning.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>

      <div className="mt-6 text-[10.5px] font-mono text-[var(--theme-text-dim)]">
        Total patterns: <span className="text-[var(--theme-text)] font-bold tabular-nums">{DLP_PATTERNS.length}</span> / 9
        · blocking <span className="text-[var(--theme-text)] font-bold tabular-nums">{blocking.length}</span>/7
        · warning <span className="text-[var(--theme-text)] font-bold tabular-nums">{warning.length}</span>/2
      </div>
    </div>
  );
}