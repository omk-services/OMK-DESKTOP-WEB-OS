import { LayoutDashboard, Wind, GitBranch, BarChart3, Building2, Compass, AlertTriangle } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { StatCard, Badge } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';

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
      <FleetItemGrid cols={2}>
        {validations.map((v, i) => (
          <FleetItemCard
            key={i}
            title={v.t}
            subtitle={v.when}
            statusLabel={v.tone === 'warn' ? 'review' : v.tone === 'danger' ? 'blocker' : 'action'}
            statusTone={v.tone}
            accent={v.tone === 'warn' ? '#f59e0b' : v.tone === 'danger' ? '#dc2626' : '#3b82f6'}
            icon={v.tone === 'warn' ? <AlertTriangle className="w-5 h-5" /> : v.tone === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            meta={`Reported ${v.when}`}
            onClick={() => { /* TODO: open validation detail */ }}
          />
        ))}
      </FleetItemGrid>
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
        <SectionHead title="Client pipeline" subtitle="Top accounts ranked by status weight" action={<Badge tone="ok">{activeCount} active</Badge>} />
        <FleetItemGrid cols={2}>
          {clients.map(c => {
            const w = weightOf(c);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={String(c.segment)}
                statusLabel={String(c.status)}
                statusTone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}
                accent={ACCENT}
                icon={<Building2 className="w-5 h-5" />}
                metricLabel="weight"
                metricValue={`${w}%`}
                meta={`Status: ${String(c.status)}`}
                onClick={() => drill.open(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Pipeline = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Client ledger" subtitle="Every account, every weight" />
        <FleetItemGrid cols={2}>
          {clients.map(c => (
            <FleetItemCard
              key={String(c.id)}
              title={String(c.name)}
              subtitle={String(c.segment)}
              statusLabel={String(c.status)}
              statusTone={c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : 'danger'}
              accent={ACCENT}
              icon={<GitBranch className="w-5 h-5" />}
              metricLabel="weight"
              metricValue={`${weightOf(c)}%`}
              meta="Pipeline tier"
              onClick={() => drill.open(String(c.id))}
            />
          ))}
        </FleetItemGrid>
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
