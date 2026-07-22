import { Cpu, FlaskConical, Rocket, Server } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#7c3aed';

export function ItRdApp() {
  const servicesDrill = useCollectionDrill('services', 'Kernel');
  const experimentsDrill = useCollectionDrill('it_experiments', 'Experiments');
  const deploysDrill = useCollectionDrill('deploys', 'Deploys');
  const experiments = useCmsStore(s => s.items['it_experiments']) ?? [];
  const okCount = useCmsStore(s => (s.items['services'] ?? []).filter(x => x.status === 'ok').length);
  const totalServices = useCmsStore(s => s.items['services']?.length ?? 0);

  const Kernel = () => {
    if (servicesDrill.openId) {
      return <DynamicPageView collectionId="services" itemId={servicesDrill.openId} onBack={servicesDrill.close} onNavigate={servicesDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="IT Software Kernel" subtitle="Live service health" action={<Badge tone="ok">{okCount} / {totalServices} nominal</Badge>} />
        <CollectionRepeater collectionId="services" onOpen={servicesDrill.open} />
      </div>
    );
  };

  const Experiments = () => {
    if (experimentsDrill.openId) {
      return <DynamicPageView collectionId="it_experiments" itemId={experimentsDrill.openId} onBack={experimentsDrill.close} onNavigate={experimentsDrill.open} />;
    }
    const byStage = (stage: string) => experiments.filter(e => e.stage === stage);
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Experiments" subtitle="R&D board" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Idea', accent: '#a78bfa', items: byStage('idea').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} onClick={() => experimentsDrill.open(e.id)} />
            )) },
            { title: 'Building', accent: ACCENT, items: byStage('building').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent={ACCENT} onClick={() => experimentsDrill.open(e.id)} />
            )) },
            { title: 'Shipped', accent: '#16a34a', items: byStage('shipped').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent="#16a34a" onClick={() => experimentsDrill.open(e.id)} />
            )) },
          ]} />
        </div>
      </div>
    );
  };

  const Deploys = () => {
    if (deploysDrill.openId) {
      return <DynamicPageView collectionId="deploys" itemId={deploysDrill.openId} onBack={deploysDrill.close} onNavigate={deploysDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Deploys" subtitle="Recent shipments" />
        <CollectionRepeater collectionId="deploys" onOpen={deploysDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'kernel', label: 'Kernel', icon: Server, render: Kernel },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
    { id: 'deploys', label: 'Deploys', icon: Rocket, render: Deploys },
  ];

  return <AppFrame title="IT / R&D" subtitle="Cyborg domain" icon={Cpu} accent={ACCENT} sections={sections} />;
}
