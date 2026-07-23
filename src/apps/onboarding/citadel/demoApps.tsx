/** Demo mini-apps — read-only showcase panels inside the citadel. Renders the
 *  four CMS-driven mini-apps in a unified gallery layout (not real shell windows;
 *  those come from DemoWindowFrame). Each panel is a "vitrine d'effet Wow" —
 *  visually polished, content-from-seed, no interactive state of its own. */
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import { ShieldCheck, Sparkles, FileSearch, ClipboardCheck } from 'lucide-react';

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

export const DEMO_PANELS = [
  { id: 'ip-vault', title: 'IP Vault', accent: PALETTE.sanctuary, render: VaulPanel },
  { id: 'apps', title: 'Mini-apps library', accent: PALETTE.compounding, render: AppsPanel },
  { id: 'quiz-result', title: 'QuizResult', accent: PALETTE.diagnostic, render: QuizResultPanel },
  { id: 'compliance', title: 'Compliance', accent: PALETTE.compliance, render: CompliancePanel },
];
