import { Handshake, GitBranch, Table2, LineChart } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge, StatCard } from '../_ui/kit';
import { KanbanBoard, KanbanCard, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#ea580c';

const stageTone: Record<string, 'ok' | 'warn' | 'accent'> = { Won: 'ok', Qualified: 'warn', Proposal: 'accent' };

function Forecast() {
  return (
    <div className="p-7">
      <SectionHead title="Forecast" subtitle="Weighted by stage probability" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Committed MRR" value="$3,600" tone="ok" hint="2 Citadelle clients" />
        <StatCard label="Best case (Q)" value="$11,300" tone="accent" />
        <StatCard label="Win rate" value="33%" hint="demo → won" />
      </div>
    </div>
  );
}

export function SalesApp() {
  const deals = useCmsStore(s => s.items['deals']) ?? [];
  const drill = useCollectionDrill('deals', ['Pipeline', 'Deals']);

  const byStage = (stage: string) => deals.filter(d => d.stage === stage);

  const Pipeline = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="deals" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Sales pipeline" subtitle="Deals by stage" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Qualified', accent: '#fb923c', items: byStage('Qualified').map(d => (
              <KanbanCard key={String(d.id)} title={String(d.client)} meta={`$${d.value} · ${d.offer}`} accent="#fb923c" onClick={() => drill.open(String(d.id))} />
            )) },
            { title: 'Proposal', accent: ACCENT, items: byStage('Proposal').map(d => (
              <KanbanCard key={String(d.id)} title={String(d.client)} meta={`$${d.value} · ${d.offer}`} accent={ACCENT} onClick={() => drill.open(String(d.id))} />
            )) },
            { title: 'Won', accent: '#16a34a', items: byStage('Won').map(d => (
              <KanbanCard key={String(d.id)} title={String(d.client)} meta={`$${d.value}/mo · ${d.offer}`} accent="#16a34a" onClick={() => drill.open(String(d.id))} />
            )) },
          ]} />
        </div>
      </div>
    );
  };

  const Deals = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="deals" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Deals" subtitle="All open opportunities" />
        <Card>
          <Table
            head={['Client', 'Offer', 'Value', 'Stage']}
            onRowClick={(i) => drill.open(String(deals[i].id))}
            rows={deals.map(d => [
              <span className="font-semibold text-stone-800">{String(d.client)}</span>,
              String(d.offer),
              `$${d.value}`,
              <Badge tone={stageTone[String(d.stage)] ?? 'neutral'}>{String(d.stage)}</Badge>,
            ])}
          />
        </Card>
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch, render: Pipeline },
    { id: 'deals', label: 'Deals', icon: Table2, render: Deals },
    { id: 'forecast', label: 'Forecast', icon: LineChart, render: Forecast },
  ];

  return <AppFrame title="Sales Sanctum" subtitle="John Jones domain" icon={Handshake} accent={ACCENT} sections={sections} />;
}
