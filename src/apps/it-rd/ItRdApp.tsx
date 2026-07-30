import { useEffect, useState } from 'react';
import { Cpu, FlaskConical, Rocket, Server } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { ItRdDetailPage, type ItRdDetailItem } from './ItRdDetailPage';

const ACCENT = '#7c3aed';

export function ItRdApp() {
  const servicesDrill = useCollectionDrill('services', 'Kernel');
  const experimentsDrill = useCollectionDrill('it_experiments', 'Experiments');
  const deploysDrill = useCollectionDrill('deploys', 'Deploys');
  const [detail, setDetail] = useState<ItRdDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);
  const experiments = useCmsStore(s => s.items['it_experiments']) ?? [];
  const services = useCmsStore(s => s.items['services']) ?? [];
  const deploys = useCmsStore(s => s.items['deploys']) ?? [];
  const okCount = useCmsStore(s => (s.items['services'] ?? []).filter(x => x.status === 'ok').length);
  const totalServices = useCmsStore(s => s.items['services']?.length ?? 0);

  const openService = (id: string): void => {
    const item = services.find(c => c.id === id);
    if (!item) { servicesDrill.open(id); return; }
    const logsRaw = String(item.logs ?? '');
    const logs = logsRaw
      ? logsRaw.split('\n').filter(Boolean).slice(0, 20).map((line, i) => ({
          ts: `${String(i + 1).padStart(2, '0')}:00`,
          level: (line.toLowerCase().includes('error') ? 'error' : line.toLowerCase().includes('warn') ? 'warn' : 'info') as 'info' | 'warn' | 'error',
          line,
        }))
      : [];
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status: String(item.status ?? 'ok'),
      logs,
      deploys: [],
      fields: [],
    });
    servicesDrill.open(id);
  };

  const openExperiment = (id: string): void => {
    const item = experiments.find(c => c.id === id);
    if (!item) { experimentsDrill.open(id); return; }
    const logs = item.stage
      ? [{ ts: '00:00', level: 'info' as const, line: `Stage: ${String(item.stage)}` }]
      : [];
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.meta ?? ''),
      status: String(item.stage ?? 'idea'),
      logs,
      deploys: [],
      fields: [],
    });
    experimentsDrill.open(id);
  };

  const openDeploy = (id: string): void => {
    const item = deploys.find(c => c.id === id);
    if (!item) { deploysDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status: String(item.status ?? 'live'),
      logs: [{ ts: '00:00', level: 'info', line: String(item.subtitle ?? 'Deploy') }],
      deploys: [{ sha: String(item.sha ?? id), at: String(item.at ?? ''), status: (String(item.status ?? 'live') === 'rolled-back' ? 'rolled-back' : String(item.status ?? 'live') === 'building' ? 'building' : 'live') as 'live' | 'rolled-back' | 'building' }],
      fields: [],
    });
    deploysDrill.open(id);
  };

  const Kernel = () => {
    return (
      <div className="p-7">
        <SectionHead title="IT Software Kernel" subtitle="Live service health" action={<Badge tone="ok">{okCount} / {totalServices} nominal</Badge>} />
        <CollectionRepeater collectionId="services" onOpen={openService} />
      </div>
    );
  };

  const Experiments = () => {
    const byStage = (stage: string) => experiments.filter(e => e.stage === stage);
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Experiments" subtitle="R&D board" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Idea', accent: '#a78bfa', items: byStage('idea').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} onClick={() => openExperiment(e.id)} />
            )) },
            { title: 'Building', accent: ACCENT, items: byStage('building').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent={ACCENT} onClick={() => openExperiment(e.id)} />
            )) },
            { title: 'Shipped', accent: '#16a34a', items: byStage('shipped').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent="#16a34a" onClick={() => openExperiment(e.id)} />
            )) },
          ]} />
        </div>
      </div>
    );
  };

  const Deploys = () => {
    return (
      <div className="p-7">
        <SectionHead title="Deploys" subtitle="Recent shipments" />
        <CollectionRepeater collectionId="deploys" onOpen={openDeploy} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'kernel', label: 'Kernel', icon: Server, render: Kernel },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
    { id: 'deploys', label: 'Deploys', icon: Rocket, render: Deploys },
  ];

  return (
    <>
      <AppFrame title="IT / R&D" subtitle="Cyborg domain" icon={Cpu} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="it-rd"
          accent="#7c3aed"
          onBack={() => setDetail(null)}
          motion={{ kind: 'type-in', durationMs: 280 }}
        >
          <ItRdDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
