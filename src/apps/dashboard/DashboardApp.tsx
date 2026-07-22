import { LayoutDashboard, Wind, GitBranch, BarChart3 } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { StatCard, Card, Badge } from '../_ui/kit';
import { ProgressRow, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#059669';

const validations = [
  { t: 'Validation devis client TechFlow', when: 'Today', tone: 'warn' as const },
  { t: 'Retard livraison projet GreenScale', when: 'Yesterday', tone: 'danger' as const },
  { t: 'Mise à jour Stripe requise', when: '2 days ago', tone: 'accent' as const },
];

function Validation() {
  return (
    <div className="p-7">
      <SectionHead title="Wind Direction" subtitle="Things requiring your validation" />
      <div className="flex flex-col gap-3">
        {validations.map((v, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-[var(--panel-border)] shadow-sm px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${v.tone === 'warn' ? 'bg-amber-500' : v.tone === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />
              <div>
                <div className="text-sm font-medium text-stone-800">{v.t}</div>
                <div className="text-xs text-stone-400">{v.when}</div>
              </div>
            </div>
            <button className="text-xs font-semibold text-emerald-700 hover:underline">Review →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Overview', 'Client Pipeline']);
  const activeCount = clients.filter(c => c.status === 'Active').length;
  const onboardingCount = clients.filter(c => c.status === 'Onboarding').length;

  const weightOf = (c: (typeof clients)[number]) => Number(c.health ?? (c.status === 'Onboarding' ? 45 : 20));

  const Overview = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Ecosystem Vitals" subtitle="Live data from omk_saas.clients and omk_saas.agents" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Active clients" value={activeCount} hint={`of ${clients.length} total`} tone="ok" />
          <StatCard label="Active agents" value="2" hint="of 2 total" tone="accent" />
          <StatCard label="Onboarding" value={onboardingCount} hint="awaiting first session" />
          <StatCard label="Total clients" value={clients.length} hint="across all statuses" />
        </div>
        <Card title="Client pipeline" aside={<Badge tone="ok">{activeCount} active</Badge>}>
          <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
            {clients.map(c => (
              <button key={String(c.id)} onClick={() => drill.open(String(c.id))} className="w-full text-left">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800 hover:text-[var(--theme-accent)] transition-colors">{String(c.name)}</span>
                    <span className="text-[11px] text-stone-400">{String(c.segment)}</span>
                  </div>
                  <Badge tone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}>{String(c.status)}</Badge>
                </div>
                <ProgressRow label="Status weight" value={weightOf(c)} accent={ACCENT} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const Pipeline = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Client ledger" subtitle="Every account, every weight" />
        <Card>
          <Table
            head={['Client', 'Segment', 'Weight', 'Status']}
            onRowClick={(i) => drill.open(String(clients[i].id))}
            rows={clients.map(c => [
              <span className="font-semibold text-stone-800">{String(c.name)}</span>,
              String(c.segment),
              <span className="tabular-nums">{weightOf(c)}%</span>,
              <Badge tone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}>{String(c.status)}</Badge>,
            ])}
          />
        </Card>
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, render: Overview },
    { id: 'validation', label: 'Wind Direction', icon: Wind, render: Validation },
    { id: 'pipeline', label: 'Client Pipeline', icon: GitBranch, render: Pipeline },
  ];

  return <AppFrame title="Dashboard" subtitle="Ecosystem Vitals" icon={LayoutDashboard} accent={ACCENT} sections={sections} />;
}
