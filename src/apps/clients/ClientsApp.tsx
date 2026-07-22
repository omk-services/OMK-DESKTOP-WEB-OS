import { Contact, UserPlus, TrendingDown, Building2, Users } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { ProgressRow } from '../_ui/widgets';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#2563eb';

export function ClientsApp() {
  const clients = useCmsStore(s => s.items['clients']) ?? [];
  const drill = useCollectionDrill('clients', ['Active', 'Onboarding', 'Churn Risk', 'Directory']);

  const activeClients = clients.filter(c => c.status === 'Active');
  const onboardingClients = clients.filter(c => c.status === 'Onboarding');
  const riskClients = clients.filter(c => c.status === 'At risk');

  const Active = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Active clients" subtitle="Health from engagement + outcomes" action={<Badge tone="ok">{activeClients.length}</Badge>} />
        <div className="grid grid-cols-1 gap-3">
          {activeClients.map(c => {
            const health = Number(c.health ?? 0);
            return (
              <button key={String(c.id)} onClick={() => drill.open(String(c.id))} className="w-full text-left">
                <Card className="p-5 hover:border-[var(--theme-accent)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-4.5 h-4.5 text-blue-600" /></span>
                      <div>
                        <div className="text-sm font-semibold text-stone-800">{String(c.name)}</div>
                        <div className="text-xs text-stone-400">{String(c.segment)}</div>
                      </div>
                    </div>
                    <Badge tone={health >= 80 ? 'ok' : 'warn'}>{health >= 80 ? 'healthy' : 'watch'}</Badge>
                  </div>
                  <ProgressRow label="Health score" value={health} accent={ACCENT} />
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const Onboarding = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Onboarding" subtitle="Agents run the 7-step welcome" />
        <div className="flex flex-col gap-3">
          {onboardingClients.map(c => {
            const [step, total] = String(c.onboardingStep ?? '0 / 7').split(' / ').map(Number);
            return (
              <button key={String(c.id)} onClick={() => drill.open(String(c.id))} className="w-full text-left">
                <Card className="p-5 hover:border-[var(--theme-accent)] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-stone-800">{String(c.name)}</span>
                    <span className="text-xs font-semibold text-stone-500">step {step} / {total}</span>
                  </div>
                  <ProgressRow label="Progress" value={(step / total) * 100} hint={`${Math.round((step / total) * 100)}%`} accent={ACCENT} />
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const Risk = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Churn risk" subtitle="Flagged by the retention agent" />
        <div className="flex flex-col gap-3">
          {riskClients.map(c => (
            <button key={String(c.id)} onClick={() => drill.open(String(c.id))} className="w-full text-left bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3 hover:border-red-400 transition-colors">
              <TrendingDown className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-stone-800">{String(c.name)}</div>
                <div className="text-xs text-stone-500">{String(c.nextSession)}</div>
              </div>
              <Badge tone="danger">high risk</Badge>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const Directory = () => {
    if (drill.openId) return <DynamicPageView collectionId="clients" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    return (
      <div className="p-7">
        <SectionHead title="Directory" subtitle="Every client — one shared page template (CMS-driven)" />
        <CollectionRepeater collectionId="clients" onOpen={drill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'active', label: 'Active', icon: Contact, render: Active },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, render: Onboarding },
    { id: 'risk', label: 'Churn Risk', icon: TrendingDown, render: Risk },
    { id: 'directory', label: 'Directory', icon: Users, render: Directory },
  ];

  return <AppFrame title="Clients" subtitle="Accounts" icon={Contact} accent={ACCENT} sections={sections} />;
}
