/** Demo mini-apps — read-only showcase panels inside the citadel. Renders the
 *  four CMS-driven mini-apps in a unified gallery layout (not real shell windows;
 *  those come from DemoWindowFrame). Each panel is a "vitrine d'effet Wow" —
 *  visually polished, content-from-seed, no interactive state of its own. */
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import { ShieldCheck, Sparkles, FileSearch, ClipboardCheck, CheckCircle2, Clock, FileBarChart } from 'lucide-react';

const COLLECTIONS = {
  vault: 'demo_coach_notes',
  apps: 'demo_coach_apps',
  metrics: 'demo_coach_metrics',
} as const;

const PALETTE = {
  sanctuary: '#2563eb',
  compounding: '#9333ea',
  diagnostic: '#0891b2',
  compliance: '#16a34a',
  audit: '#ea580c',
} as const;

interface PanelHeaderProps {
  label: string;
  title: string;
  accent: string;
}

function PanelHeader({ label, title, accent }: PanelHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{label}</div>
      <h3 className="text-lg font-bold tracking-tight text-stone-900 font-outfit mt-0.5">{title}</h3>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, { color: string }> = {
  Sanctuary: { color: '#2563eb' },
  Compounding: { color: '#9333ea' },
  Diagnostic: { color: '#0891b2' },
  Compliance: { color: '#16a34a' },
};

function CategoryPill({ value }: { value: string }) {
  const meta = CATEGORY_LABEL[value];
  if (!meta) {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{value}</span>;
  }
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${meta.color}1a`, color: meta.color }}
    >
      {value}
    </span>
  );
}

function VaulPanel() {
  const items = useCmsStore(s => (s.items[COLLECTIONS.vault] ?? []));
  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden h-full flex flex-col">
      <PanelHeader label="IP Vault" title="3 captured notes from the demo instance" accent={PALETTE.sanctuary} />
      <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {items.length === 0 && <EmptyHint label="Loading vault…" />}
        {items.map((n: CmsItem) => (
          <div key={String(n.id)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: `${PALETTE.sanctuary}1a`, color: PALETTE.sanctuary }}>
              {String(n.sentiment ?? '·').charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-800 truncate">{String(n.topic)}</div>
              <div className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                <span>{String(n.clientName)}</span>
                <span className="text-stone-300">·</span>
                <span>{String(n.date)}</span>
                <span className="text-stone-300">·</span>
                <span>{String(n.duration)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 text-[11px] text-stone-400 px-2 pt-2">
          <ShieldCheck className="w-3 h-3" />
          <span>All byte-level encrypted · egress filtered · panic-lock ready</span>
        </div>
      </div>
    </div>
  );
}

function AppsPanel() {
  const items = useCmsStore(s => (s.items[COLLECTIONS.apps] ?? []));
  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden h-full flex flex-col">
      <PanelHeader label="Mini-apps library" title="4 showcase apps in your demo instance" accent={PALETTE.compounding} />
      <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {items.map((a: CmsItem) => (
          <div key={String(a.id)} className="rounded-xl border border-stone-200 p-3 hover:border-stone-300 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-bold text-stone-900 truncate">{String(a.name)}</div>
              {a.category ? <CategoryPill value={String(a.category)} /> : null}
            </div>
            <p className="text-[11.5px] text-stone-500 mt-1 leading-snug">{String(a.tagline)}</p>
            <div className="text-[10.5px] font-semibold text-stone-400 uppercase tracking-wider mt-2">
              {String(a.metric)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizResultPanel() {
  const items = useCmsStore(s => (s.items[COLLECTIONS.metrics] ?? []));
  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden h-full flex flex-col">
      <PanelHeader label="QuizResult · Personalised audit" title="Your first-month Nexus preview" accent={PALETTE.diagnostic} />
      <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {items.map((m: CmsItem) => {
          const value = String(m.value);
          const unit = String(m.unit ?? '');
          return (
            <div key={String(m.id)} className="rounded-xl border border-stone-200 p-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-stone-500">{String(m.label)}</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-extrabold tracking-tight leading-none"
                       style={{ color: PALETTE.diagnostic }}>{value}</div>
                  <div className="text-[11px] font-medium text-stone-500">{unit}</div>
                </div>
              </div>
              <p className="text-[11.5px] text-stone-500 mt-1.5 leading-snug">{String(m.story)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompliancePanel() {
  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden h-full flex flex-col">
      <PanelHeader label="Compliance dashboard" title="Audit-ready by design (CCPA + Colorado AI Act 2026)" accent={PALETTE.compliance} />
      <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-3">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-PII sanctuary · last 90 days
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-900 leading-none">0</div>
              <div className="text-[10px] text-emerald-700 mt-1">egress attempts blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-900 leading-none">0</div>
              <div className="text-[10px] text-emerald-700 mt-1">training calls made</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-emerald-900 leading-none">100%</div>
              <div className="text-[10px] text-emerald-700 mt-1">human-in-the-loop actions logged</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 p-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-stone-700">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Audit-pack export
          </div>
          <p className="text-[11.5px] text-stone-500 mt-1">
            Two clicks: select date range + regulator format (CCPA / Colorado AI Act / Executive Order 14110). Signed JSON, hash-chained.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-stone-400">
          <Sparkles className="w-3 h-3" />
          US-only hosting · Supabase US-East or coach-owned VPS
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-stone-400 px-2 py-1">
      <FileSearch className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

/** Audit Simulation — concrete audit report with findings, severity bands,
 *  remediation steps and a generated "next 30 days" timeline. All read-only
 *  showcase (driven by hard-coded plausible demo data) — the prospect sees
 *  what a Coach OS audit deliverable looks like in 30 seconds. */
function AuditSimulationPanel() {
  type Finding = {
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    detail: string;
    remediation: string;
  };

  const FINDINGS: Finding[] = [
    {
      severity: 'critical',
      title: 'Client PII visible in session-notebook exports',
      detail: 'Two of the three sample notebooks reference real client names without redaction. CCPA §1798.150 right-of-action exposure: $2,500-$7,500 per incident.',
      remediation: 'Auto-redaction pipeline (Vault) + egress policy (Compliance) — ships day 1 of Nexus onboarding.',
    },
    {
      severity: 'high',
      title: 'No retention policy on session recordings',
      detail: 'Dropbox / Drive / folder exports have no purge schedule. 14 of 17 coaching orgs in your peer cohort fail Colorado AI Act §6-1-1701 on this exact gap.',
      remediation: 'Configurable retention (30d / 90d / 7y) + auto-purge receipts — ship-ready Q3 2026.',
    },
    {
      severity: 'medium',
      title: 'Coach IP not portable across tools',
      detail: '6 of 8 frameworks live only in your head (per the quiz). On a 6-month leave, ~60% of the offer disappears. Compounding math: $14k-$22k/mo opportunity cost.',
      remediation: 'IP Vault + mini-apps library — every framework captured once, replayed by every client, never walks out the door.',
    },
    {
      severity: 'low',
      title: 'Pricing not transparent in client collateral',
      detail: 'Off-platform quotes (Slack / Notion / WhatsApp) are not logged. Audit-trail blind spot.',
      remediation: 'In-product pricing + signed quote PDFs with hash chain — 2 clicks, regulator-ready.',
    },
  ];

  const severityMeta: Record<Finding['severity'], { color: string; bg: string; label: string }> = {
    critical: { color: '#b91c1c', bg: '#fee2e2', label: 'Critical' },
    high:     { color: '#c2410c', bg: '#ffedd5', label: 'High' },
    medium:   { color: '#a16207', bg: '#fef3c7', label: 'Medium' },
    low:      { color: '#1d4ed8', bg: '#dbeafe', label: 'Low' },
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--panel-border)] shadow-sm overflow-hidden h-full flex flex-col">
      <PanelHeader label="Audit simulation · CCPA + Colorado AI Act 2026" title="4 findings · 1 critical · est. $9k-$22k exposure" accent={PALETTE.audit} />
      <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-2.5">
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 flex items-center gap-3">
          <FileBarChart className="w-5 h-5 text-orange-700 shrink-0" />
          <div className="min-w-0">
            <div className="text-[12px] font-bold text-orange-900">Demo audit · generated from your quiz answers + seed notebooks</div>
            <div className="text-[10.5px] text-orange-700 mt-0.5">All findings are simulated. No real client data was scanned.</div>
          </div>
        </div>

        {FINDINGS.map((f, idx) => {
          const meta = severityMeta[f.severity];
          return (
            <div key={idx} className="rounded-xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: meta.bg }}>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: meta.color }}>{meta.label}</span>
                <span className="text-[10px] font-mono text-stone-500">#{idx + 1}</span>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="text-[13px] font-bold text-stone-900 leading-snug">{f.title}</div>
                <p className="text-[11.5px] text-stone-600 leading-snug">{f.detail}</p>
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-stone-100">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: PALETTE.audit }} />
                  <div className="text-[11px] text-stone-700 leading-snug">
                    <span className="font-semibold" style={{ color: PALETTE.audit }}>Nexus fix · </span>{f.remediation}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-[11px] text-emerald-800">
          <Clock className="w-3.5 h-3.5" />
          <span>Remediation timeline: <b>30 days</b> to clear all 4 · est. <b>4h/wk</b> of coach time.</span>
        </div>
      </div>
    </div>
  );
}

export const DEMO_PANELS = [
  { id: 'ip-vault', title: 'IP Vault', accent: PALETTE.sanctuary, render: VaulPanel },
  { id: 'apps', title: 'Mini-apps library', accent: PALETTE.compounding, render: AppsPanel },
  { id: 'quiz-result', title: 'QuizResult', accent: PALETTE.diagnostic, render: QuizResultPanel },
  { id: 'compliance', title: 'Compliance', accent: PALETTE.compliance, render: CompliancePanel },
  { id: 'audit', title: 'Audit Simulation', accent: PALETTE.audit, render: AuditSimulationPanel },
];
