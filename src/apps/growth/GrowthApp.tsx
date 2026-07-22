import { Sprout, Filter, Radio, FlaskConical } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge, StatCard } from '../_ui/kit';
import { FunnelStep, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#16a34a';

function Funnel() {
  return (
    <div className="p-7">
      <SectionHead title="Acquisition funnel" subtitle="Marketplace coach → paying client" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Visitors" value="1,240" hint="this month" />
        <StatCard label="Diagnosed" value="86" tone="accent" />
        <StatCard label="Won" value="6" tone="ok" hint="33% of demos" />
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-3">
          <FunnelStep label="Visited landing" value="1,240" pct={100} accent={ACCENT} />
          <FunnelStep label="Took the quiz" value="312" pct={25} accent={ACCENT} />
          <FunnelStep label="Booked demo" value="86" pct={7} accent={ACCENT} />
          <FunnelStep label="Closed won" value="6" pct={2} accent={ACCENT} />
        </div>
      </Card>
    </div>
  );
}

export function GrowthApp() {
  const channels = useCmsStore(s => s.items['growth_channels']) ?? [];
  const channelsDrill = useCollectionDrill('growth_channels', 'Channels');
  const experimentsDrill = useCollectionDrill('growth_experiments', 'Experiments');

  const Channels = () => {
    if (channelsDrill.openId) {
      return <DynamicPageView collectionId="growth_channels" itemId={channelsDrill.openId} onBack={channelsDrill.close} onNavigate={channelsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Channels" subtitle="Where diagnosed leads come from" />
        <Card>
          <Table
            head={['Channel', 'Leads', 'CAC', 'Trend']}
            onRowClick={(i) => channelsDrill.open(String(channels[i].id))}
            rows={channels.map(c => [
              String(c.name),
              String(c.leads),
              c.cac ? `$${c.cac}` : '$0',
              <Badge tone={String(c.trend).startsWith('↑') ? 'ok' : String(c.trend).startsWith('↓') ? 'danger' : 'neutral'}>{String(c.trend)}</Badge>,
            ])}
          />
        </Card>
      </div>
    );
  };

  const Experiments = () => {
    if (experimentsDrill.openId) {
      return <DynamicPageView collectionId="growth_experiments" itemId={experimentsDrill.openId} onBack={experimentsDrill.close} onNavigate={experimentsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Experiments" subtitle="Growth bets & results" />
        <CollectionRepeater collectionId="growth_experiments" onOpen={experimentsDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'funnel', label: 'Funnel', icon: Filter, render: Funnel },
    { id: 'channels', label: 'Channels', icon: Radio, render: Channels },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
  ];

  return <AppFrame title="Growth" subtitle="Superman domain" icon={Sprout} accent={ACCENT} sections={sections} />;
}
