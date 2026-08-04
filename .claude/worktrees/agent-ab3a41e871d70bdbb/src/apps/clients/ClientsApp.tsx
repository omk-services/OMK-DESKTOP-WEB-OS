import { Contact, UserPlus, TrendingDown, Building2, Users, Vault as VaultIcon, BookText, GraduationCap } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';
import { CMSCardList } from '../_ui/CMSCardList';

const ACCENT = '#2563eb';

export function ClientsApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Active', 'Onboarding', 'Churn Risk', 'Directory']);
  const vaultDrill = useCollectionDrill('session_notes', 'IP Vault');

  const activeClients = clients.filter(c => c.status === 'Active');
  const onboardingClients = clients.filter(c => c.status === 'Onboarding');
  const riskClients = clients.filter(c => c.status === 'At risk');

  const Active = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Active clients" subtitle="Health from engagement + outcomes" action={<Badge tone="ok">{activeClients.length}</Badge>} />
        <FleetItemGrid cols={2}>
          {activeClients.map(c => {
            const health = Number(c.health ?? 0);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={String(c.segment)}
                statusLabel={health >= 80 ? 'healthy' : 'watch'}
                statusTone={health >= 80 ? 'ok' : 'warn'}
                accent={ACCENT}
                icon={<Building2 className="w-5 h-5" />}
                metricLabel="health"
                metricValue={`${health}%`}
                meta="Active · High-touch"
                onClick={() => drill.open(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Onboarding = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Onboarding" subtitle="Agents run the 7-step welcome" />
        <FleetItemGrid cols={2}>
          {onboardingClients.map(c => {
            const [step, total] = String(c.onboardingStep ?? '0 / 7').split(' / ').map(Number);
            const pct = Math.round((step / total) * 100);
            return (
              <FleetItemCard
                key={String(c.id)}
                title={String(c.name)}
                subtitle={`Step ${step} / ${total}`}
                statusLabel={`${pct}%`}
                statusTone={pct >= 70 ? 'accent' : pct >= 30 ? 'warn' : 'danger'}
                accent="#f59e0b"
                icon={<GraduationCap className="w-5 h-5" />}
                metricLabel="progress"
                metricValue={`${pct}%`}
                meta={`${step} of ${total} steps complete`}
                onClick={() => drill.open(String(c.id))}
              />
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Risk = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Churn risk" subtitle="Flagged by the retention agent" />
        <FleetItemGrid cols={2}>
          {riskClients.map(c => (
            <FleetItemCard
              key={String(c.id)}
              title={String(c.name)}
              subtitle={String(c.nextSession)}
              statusLabel="high risk"
              statusTone="danger"
              accent="#dc2626"
              icon={<TrendingDown className="w-5 h-5" />}
              metricLabel="next"
              metricValue={String(c.nextSession)}
              meta="Retention agent flagged"
              onClick={() => drill.open(String(c.id))}
            />
          ))}
        </FleetItemGrid>
      </div>
    );
  };

  const Directory = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Directory" subtitle="Every client — one shared page template (CMS-driven)" />
        <CMSCardList
          collectionId="clients"
          onOpen={drill.open}
          cols={2}
          render={(c: Record<string, unknown>) => ({
            title: String(c.name),
            subtitle: String(c.segment),
            description: `Status: ${String(c.status)}${c.health ? ` · Health: ${c.health}%` : ''}`,
            statusLabel: String(c.status),
            statusTone: c.status === 'Active' ? 'ok' : c.status === 'Onboarding' ? 'warn' : c.status === 'At risk' ? 'danger' : 'neutral',
            accent: ACCENT,
            icon: <Contact className="w-5 h-5" />,
            metricLabel: 'health',
            metricValue: c.health ? `${c.health}%` : '—',
            meta: `segment: ${String(c.segment)}`,
          })}
        />
      </div>
    );
  };

  const Vault = () => {
    if (vaultDrill.openId) return <DynamicPageView collectionId="session_notes" itemId={vaultDrill.openId} onBack={vaultDrill.close} onNavigate={vaultDrill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="IP Vault" subtitle="Every session, captured — the coach's knowledge, sanctuarized" />
        <CMSCardList
          collectionId="session_notes"
          onOpen={vaultDrill.open}
          cols={2}
          render={(n: Record<string, unknown>) => ({
            title: String(n.title),
            subtitle: `${String(n.client ?? '—')} · ${String(n.date ?? '')}`,
            description: String(n.summary ?? n.body ?? '').slice(0, 160),
            statusLabel: String(n.tag ?? 'note'),
            statusTone: 'accent',
            accent: '#8b5cf6',
            icon: <BookText className="w-5 h-5" />,
            metricLabel: 'duration',
            metricValue: String(n.duration ?? '—'),
            meta: String(n.tag ?? 'session note'),
          })}
        />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'active', label: 'Active', icon: Contact, render: Active },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, render: Onboarding },
    { id: 'risk', label: 'Churn Risk', icon: TrendingDown, render: Risk },
    { id: 'directory', label: 'Directory', icon: Users, render: Directory },
    { id: 'vault', label: 'IP Vault', icon: VaultIcon, render: Vault },
  ];

  return <AppFrame title="Clients" subtitle="Accounts" icon={Contact} accent={ACCENT} sections={sections} />;
}
