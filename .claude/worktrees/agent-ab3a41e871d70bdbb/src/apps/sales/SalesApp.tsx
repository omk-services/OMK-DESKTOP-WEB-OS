import { Handshake, GitBranch, Table2, LineChart, Briefcase, Receipt } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { StatCard } from '../_ui/kit';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';

const ACCENT = '#ea580c';

const STAGE_TONE: Record<string, 'ok' | 'warn' | 'accent' | 'neutral' | 'danger'> = {
  Won: 'ok', Qualified: 'warn', Proposal: 'accent', Lost: 'danger', Negotiation: 'accent',
};
const STAGE_ACCENT: Record<string, string> = {
  Won: '#16a34a', Qualified: '#fb923c', Proposal: ACCENT, Lost: '#dc2626', Negotiation: ACCENT,
};

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

  const Pipeline = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="deals" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Sales pipeline" subtitle="Deals by stage (Fleet view)" />
        <FleetItemGrid cols={2}>
          {deals.map(d => (
            <FleetItemCard
              key={String(d.id)}
              title={String(d.client)}
              subtitle={String(d.offer)}
              statusLabel={String(d.stage)}
              statusTone={STAGE_TONE[String(d.stage)] ?? 'neutral'}
              accent={STAGE_ACCENT[String(d.stage)] ?? ACCENT}
              icon={<Briefcase className="w-5 h-5" />}
              metricLabel="value"
              metricValue={`$${d.value}/mo`}
              meta={`stage: ${String(d.stage)}`}
              onClick={() => drill.open(String(d.id))}
            />
          ))}
        </FleetItemGrid>
      </div>
    );
  };

  const Deals = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="deals" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Deals" subtitle="All opportunities" />
        <FleetItemGrid cols={2}>
          {deals.map(d => (
            <FleetItemCard
              key={String(d.id)}
              title={String(d.client)}
              subtitle={String(d.offer)}
              statusLabel={String(d.stage)}
              statusTone={STAGE_TONE[String(d.stage)] ?? 'neutral'}
              accent={STAGE_ACCENT[String(d.stage)] ?? ACCENT}
              icon={<Receipt className="w-5 h-5" />}
              metricLabel="MRR"
              metricValue={`$${d.value}`}
              meta={`updated: this week`}
              onClick={() => drill.open(String(d.id))}
            />
          ))}
        </FleetItemGrid>
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
