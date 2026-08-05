import { useEffect, useState } from 'react';
import { Sprout, Filter, Radio, FlaskConical, TrendingUp, Map, Handshake, Sparkles } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge, StatCard } from '../_ui/kit';
import { FunnelStep, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { GrowthDetailPage, type GrowthDetailItem } from './GrowthDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { GrowthItemDetail } from './GrowthItemDetail';
import { CMSCardList } from '../_ui/CMSCardList';
import { seedGrowthCms } from './seed';

seedGrowthCms();
registerItemDetail('growth', GrowthItemDetail);

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
      <div className="rounded-2xl border p-5" style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}>
        <div className="flex flex-col gap-3">
          <FunnelStep label="Visited landing" value="1,240" pct={100} accent={ACCENT} />
          <FunnelStep label="Took the quiz" value="312" pct={25} accent={ACCENT} />
          <FunnelStep label="Booked demo" value="86" pct={7} accent={ACCENT} />
          <FunnelStep label="Closed won" value="6" pct={2} accent={ACCENT} />
        </div>
      </div>
    </div>
  );
}

/* ═══ Acquisition, Strategie, Partenariats, AEO — typed shapes ═══ */

interface AcquisitionItem extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  virality: number;
  conversion: number;
  cost: number;
  ease: number;
  global: number;
  verdict: string;
  whatWorks: string;
  whatFailed: string;
}

interface StrategieItem extends Record<string, unknown> {
  id: string;
  name: string;
  phase: string;
  objective: string;
  duration: string;
  criteria: string;
  state: string;
  focus: string;
}

interface PartenariatItem extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  brings: string;
  expects: string;
  state: string;
  contact: string;
  touched: string;
}

interface AeoItem extends Record<string, unknown> {
  id: string;
  query: string;
  intent: string;
  position: string;
  cited: string;
  trackedSince: string;
  history: string;
  competitor: string;
}

/** Verdict → tone (for the badge on acquisition cards). */
const ACQ_VERDICT_TONE: Record<string, 'ok' | 'warn' | 'danger'> = {
  'invest more': 'ok',
  'hold steady': 'warn',
  'cut or rework': 'danger',
};

const ACQ_VERDICT_ACCENT: Record<string, string> = {
  'invest more': '#16a34a',
  'hold steady': '#f59e0b',
  'cut or rework': '#dc2626',
};

/** Phase → tone (strategie). */
const STRAT_PHASE_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  Launch: 'accent',
  Scale: 'warn',
  Optimize: 'ok',
  Pivot: 'danger',
};

const STRAT_PHASE_ACCENT: Record<string, string> = {
  Launch: '#1d4ed8',
  Scale: '#f59e0b',
  Optimize: '#16a34a',
  Pivot: '#dc2626',
};

/** State → tone (partenariats). */
const PARTNER_STATE_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  prospect: 'neutral',
  'en discussion': 'warn',
  actif: 'ok',
  dormant: 'danger',
};

const PARTNER_STATE_ACCENT: Record<string, string> = {
  prospect: '#57534e',
  'en discussion': '#f59e0b',
  actif: '#16a34a',
  dormant: '#dc2626',
};

/** Position → tone (AEO). */
const AEO_POSITION_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  'cited · #1': 'ok',
  'cited · #2': 'accent',
  'cited · top 3': 'accent',
  'cited · top 5': 'warn',
  'not cited': 'danger',
};

const AEO_POSITION_ACCENT: Record<string, string> = {
  'cited · #1': '#16a34a',
  'cited · #2': '#1d4ed8',
  'cited · top 3': '#1d4ed8',
  'cited · top 5': '#f59e0b',
  'not cited': '#dc2626',
};

export function GrowthApp() {
  const channels = useCmsStore(s => s.items['growth_channels']) ?? [];
  const experiments = useCmsStore(s => s.items['growth_experiments']) ?? [];
  const channelsDrill = useCollectionDrill('growth_channels', 'Channels');
  const experimentsDrill = useCollectionDrill('growth_experiments', 'Experiments');
  const acquisitionDrill = useCollectionDrill('growth_acquisition', 'Acquisition');
  const strategieDrill = useCollectionDrill('growth_strategie', 'Strategie');
  const partenariatsDrill = useCollectionDrill('growth_partenariats', 'Partenariats');
  const aeoDrill = useCollectionDrill('growth_aeo', 'AEO');
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
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}>
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
        </div>
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

  const Acquisition = () => {
    if (acquisitionDrill.openId) {
      return (
        <DynamicPageView
          collectionId="growth_acquisition"
          itemId={acquisitionDrill.openId}
          onBack={acquisitionDrill.close}
          onNavigate={acquisitionDrill.open}
        />
      );
    }
    return (
      <div className="p-7">
        <SectionHead
          title="Acquisition"
          subtitle="Every channel scored on virality, conversion, cost, ease of execution — the global score drives the verdict"
        />
        <CMSCardList<AcquisitionItem>
          collectionId="growth_acquisition"
          onOpen={acquisitionDrill.open}
          cols={2}
          render={(a) => {
            const verdictKey = String(a.verdict).split(' ·')[0];
            const tone = ACQ_VERDICT_TONE[verdictKey] ?? 'neutral';
            const accent = ACQ_VERDICT_ACCENT[verdictKey] ?? ACCENT;
            return {
              title: a.name,
              subtitle: `${a.category} · ${a.verdict}`,
              description: a.whatWorks.split('.')[0] ?? a.whatWorks,
              statusLabel: verdictKey,
              statusTone: tone,
              accent,
              icon: <TrendingUp className="w-5 h-5" />,
              metricLabel: 'global',
              metricValue: `${a.global}/100`,
              meta: `V${a.virality} · C${a.conversion} · $${a.cost} · E${a.ease}`,
            };
          }}
        />
      </div>
    );
  };

  const Strategie = () => {
    if (strategieDrill.openId) {
      return (
        <DynamicPageView
          collectionId="growth_strategie"
          itemId={strategieDrill.openId}
          onBack={strategieDrill.close}
          onNavigate={strategieDrill.open}
        />
      );
    }
    return (
      <div className="p-7">
        <SectionHead
          title="Strategie"
          subtitle="Phasage d'une offre — lancement, montee en charge, optimisation — chaque phase tient sur des criteres de passage"
        />
        <CMSCardList<StrategieItem>
          collectionId="growth_strategie"
          onOpen={strategieDrill.open}
          cols={2}
          render={(p) => {
            const tone = STRAT_PHASE_TONE[p.phase] ?? 'neutral';
            const accent = STRAT_PHASE_ACCENT[p.phase] ?? ACCENT;
            return {
              title: p.name,
              subtitle: `${p.duration} · ${p.focus}`,
              description: p.objective.split('.')[0] ?? p.objective,
              statusLabel: p.phase,
              statusTone: tone,
              accent,
              icon: <Map className="w-5 h-5" />,
              metricLabel: 'state',
              metricValue: p.state,
              meta: p.criteria.split('.')[0] ?? p.criteria,
            };
          }}
        />
      </div>
    );
  };

  const Partenariats = () => {
    if (partenariatsDrill.openId) {
      return (
        <DynamicPageView
          collectionId="growth_partenariats"
          itemId={partenariatsDrill.openId}
          onBack={partenariatsDrill.close}
          onNavigate={partenariatsDrill.open}
        />
      );
    }
    return (
      <div className="p-7">
        <SectionHead
          title="Partenariats"
          subtitle="Ce qu'ils apportent, ce qu'ils attendent, etat de la relation"
        />
        <CMSCardList<PartenariatItem>
          collectionId="growth_partenariats"
          onOpen={partenariatsDrill.open}
          cols={2}
          render={(p) => {
            const tone = PARTNER_STATE_TONE[p.state] ?? 'neutral';
            const accent = PARTNER_STATE_ACCENT[p.state] ?? ACCENT;
            return {
              title: p.name,
              subtitle: `${p.type} · ${p.contact}`,
              description: p.brings.split('.')[0] ?? p.brings,
              statusLabel: p.state,
              statusTone: tone,
              accent,
              icon: <Handshake className="w-5 h-5" />,
              metricLabel: 'touched',
              metricValue: p.touched,
              meta: p.expects.split('.')[0] ?? p.expects,
            };
          }}
        />
      </div>
    );
  };

  const AEO = () => {
    if (aeoDrill.openId) {
      return (
        <DynamicPageView
          collectionId="growth_aeo"
          itemId={aeoDrill.openId}
          onBack={aeoDrill.close}
          onNavigate={aeoDrill.open}
        />
      );
    }
    return (
      <div className="p-7">
        <SectionHead
          title="AEO"
          subtitle="Visibilite dans les reponses des modeles de langage — requetes qui citent la marque, celles qui citent un concurrent"
        />
        <CMSCardList<AeoItem>
          collectionId="growth_aeo"
          onOpen={aeoDrill.open}
          cols={2}
          render={(a) => {
            const tone = AEO_POSITION_TONE[a.position] ?? 'neutral';
            const accent = AEO_POSITION_ACCENT[a.position] ?? ACCENT;
            return {
              title: a.query,
              subtitle: `${a.intent} · tracked since ${a.trackedSince}`,
              description: a.history.split('.')[0] ?? a.history,
              statusLabel: a.position,
              statusTone: tone,
              accent,
              icon: <Sparkles className="w-5 h-5" />,
              metricLabel: 'cited by',
              metricValue: a.cited === '—' ? '—' : `${a.cited.split(',').length} models`,
              meta: a.competitor === '—' ? 'no close competitor' : `closest: ${a.competitor}`,
            };
          }}
        />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'funnel', label: 'Funnel', icon: Filter, render: Funnel },
    { id: 'channels', label: 'Channels', icon: Radio, render: Channels },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
    { id: 'acquisition', label: 'Acquisition', icon: TrendingUp, render: Acquisition },
    { id: 'strategie', label: 'Strategie', icon: Map, render: Strategie },
    { id: 'partenariats', label: 'Partenariats', icon: Handshake, render: Partenariats },
    { id: 'aeo', label: 'AEO', icon: Sparkles, render: AEO },
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