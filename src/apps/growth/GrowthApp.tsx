import { useEffect, useState } from 'react';
import { Sprout, Filter, Radio, FlaskConical } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge, StatCard } from '../_ui/kit';
import { FunnelStep, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { GrowthDetailPage, type GrowthDetailItem } from './GrowthDetailPage';

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
  const experiments = useCmsStore(s => s.items['growth_experiments']) ?? [];
  const channelsDrill = useCollectionDrill('growth_channels', 'Channels');
  const experimentsDrill = useCollectionDrill('growth_experiments', 'Experiments');
  const [detail, setDetail] = useState<GrowthDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const openChannel = (id: string): void => {
    const item = channels.find(c => c.id === id);
    if (!item) { channelsDrill.open(id); return; }
    const leads = Number(item.leads ?? 0);
    setDetail({
      id: String(item.id),
      title: String(item.name ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status: String(item.trend ?? '—'),
      funnel: [
        { stage: 'Leads', pct: 100, absolute: leads },
        { stage: 'CAC', pct: Math.min(100, Math.round((Number(item.cac ?? 0) / Math.max(leads, 1)) * 100)), absolute: Number(item.cac ?? 0) },
      ],
      experiments: [],
      fields: [],
    });
    channelsDrill.open(id);
  };

  const openExperiment = (id: string): void => {
    const item = experiments.find(c => c.id === id);
    if (!item) { experimentsDrill.open(id); return; }
    const status = String(item.status ?? 'live') as 'live' | 'done' | 'draft';
    setDetail({
      id: String(item.id),
      title: String(item.name ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status,
      funnel: [],
      experiments: [{ name: String(item.name ?? 'Experiment'), variant: String(item.variant ?? 'control'), lift: String(item.lift ?? '—'), status }],
      fields: [],
    });
    experimentsDrill.open(id);
  };

  const Channels = () => {
    return (
      <div className="p-7">
        <SectionHead title="Channels" subtitle="Where diagnosed leads come from" />
        <Card>
          <Table
            head={['Channel', 'Leads', 'CAC', 'Trend']}
            onRowClick={(i) => openChannel(String(channels[i].id))}
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
    return (
      <div className="p-7">
        <SectionHead title="Experiments" subtitle="Growth bets & results" />
        <CollectionRepeater collectionId="growth_experiments" onOpen={openExperiment} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'funnel', label: 'Funnel', icon: Filter, render: Funnel },
    { id: 'channels', label: 'Channels', icon: Radio, render: Channels },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
  ];

  return (
    <>
      <AppFrame title="Growth" subtitle="Superman domain" icon={Sprout} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="growth"
          accent="#16a34a"
          onBack={() => setDetail(null)}
          motion={{ kind: 'fade-up', durationMs: 220 }}
        >
          <GrowthDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
