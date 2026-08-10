import { useEffect, useState } from 'react';
import { Sprout, Filter, Radio, FlaskConical, TrendingUp, Map, Handshake, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';
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
import { FleetItemGrid } from '../_ui/FleetItemCard';
import { seedGrowthCms } from './seed';
import { useShellStore } from '../../stores/shell.store';

seedGrowthCms();
registerItemDetail('growth', GrowthItemDetail);

const ACCENT = '#16a34a';

function Funnel() {
  // Données honnêtes : on ne montre que ce qu'on peut dériver du CMS. Les
  // étapes intermédiaires (quiz, demo booked) ne sont pas trackées en
  // l'état — on les omet plutôt que d'inventer un chiffre. Si la collection
  // est vide, on affiche un état vide explicite (jamais "0 leads" muet).
  const channels = useCmsStore((s) => s.items['growth_channels']) ?? [];
  const deals = useCmsStore((s) => s.items['deals']) ?? [];
  const totalLeads = channels.reduce((sum, c) => sum + Number(c.leads ?? 0), 0);
  const wonDeals = deals.filter((d) => String(d.stage) === 'Won').length;
  const hasData = channels.length > 0 || deals.length > 0;

  if (!hasData) {
    return (
      <div className="p-7">
        <SectionHead title="Acquisition funnel" subtitle="Marketplace coach → paying client" />
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            No funnel data yet — register a channel in the Channels section, or close a Won deal in Sales,
            and the funnel will fill in.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--theme-text-dim)' }}>
            Until then, leads stay at 0 and conversion stays at —.
          </p>
        </div>
      </div>
    );
  }

  // Only the two stages we can honestly derive. Lead counts come from the
  // channels collection (sum of `leads`); won deals come from the unified
  // `deals` CMS collection.
  const stages: { label: string; value: number; pct: number; hint?: string }[] = [
    { label: 'Leads (channels)', value: totalLeads, pct: 100, hint: `${channels.length} channel${channels.length > 1 ? 's' : ''}` },
  ];
  if (wonDeals > 0 || deals.length > 0) {
    stages.push({
      label: 'Closed won',
      value: wonDeals,
      pct: totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0,
      hint: `${wonDeals} of ${totalLeads} leads → ${totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0}%`,
    });
  }

  return (
    <div className="p-7">
      <SectionHead title="Acquisition funnel" subtitle="Marketplace coach → paying client" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Leads" value={totalLeads.toLocaleString('en-US')} hint={`${channels.length} channels`} />
        <StatCard
          label="Won"
          value={wonDeals.toLocaleString('en-US')}
          tone={wonDeals > 0 ? 'ok' : 'default'}
          hint={totalLeads > 0 ? `${Math.round((wonDeals / totalLeads) * 100)}% conversion` : 'no leads yet'}
        />
        <StatCard
          label="Conversion"
          value={totalLeads > 0 ? `${Math.round((wonDeals / totalLeads) * 100)}%` : '—'}
          tone="accent"
          hint="leads → won"
        />
      </div>
      <div className="rounded-2xl border p-5" style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}>
        <div className="flex flex-col gap-3">
          {stages.map((s) => (
            <FunnelStep key={s.label} label={s.label} value={s.value.toLocaleString('en-US')} pct={s.pct} accent={ACCENT} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Acquisition, Strategie, Partenariats, AEO — typed shapes ═══ */

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
  const acquisition = useCmsStore(s => s.items['growth_acquisition']) ?? [];
  const channelsDrill = useCollectionDrill('growth_channels', 'Channels');
  const experimentsDrill = useCollectionDrill('growth_experiments', 'Experiments');
  const acquisitionDrill = useCollectionDrill('growth_acquisition', 'Acquisition');
  const strategieDrill = useCollectionDrill('growth_strategie', 'Strategie');
  const partenariatsDrill = useCollectionDrill('growth_partenariats', 'Partenariats');
  const aeoDrill = useCollectionDrill('growth_aeo', 'AEO');
  const updateItem = useCmsStore(s => s.updateItem);
  const addToast = useShellStore(s => s.addToast);
  const [detail, setDetail] = useState<GrowthDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  /** Cycle the verdict on an acquisition channel: invest more → hold steady →
   *  cut or rework → hold steady → invest more. The global score stays the
   *  same — what changes is the team's stance. The brief calls for a
   *  mutation, not a re-computation: the rerating would be a separate flow. */
  const cycleVerdict = (id: string): void => {
    const item = acquisition.find((a) => a.id === id);
    if (!item) return;
    const currentKey = String(item.verdict).split(' ·')[0];
    const order = ['invest more', 'hold steady', 'cut or rework'];
    const idx = order.indexOf(currentKey);
    const next = idx === -1 ? 'hold steady' : order[(idx + 1) % order.length];
    const global = Number(item.global ?? 0);
    const nextVerdict = `${next} · ${global}/100`;
    const result = updateItem('growth_acquisition', id, { verdict: nextVerdict });
    if (result !== undefined) {
      addToast({ source: 'Growth', type: 'success', message: `${String(item.name)} → ${next}` });
    }
  };

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
    return (
      <div className="p-7">
        <SectionHead
          title="Acquisition"
          subtitle="Every channel scored on virality, conversion, cost, ease of execution — the global score drives the verdict"
        />
        <FleetItemGrid cols={2}>
          {acquisition.map((a) => {
            const verdictKey = String(a.verdict).split(' ·')[0];
            const tone = ACQ_VERDICT_TONE[verdictKey] ?? 'neutral';
            const accent = ACQ_VERDICT_ACCENT[verdictKey] ?? ACCENT;
            const nextVerdict = (() => {
              const order = ['invest more', 'hold steady', 'cut or rework'];
              const idx = order.indexOf(verdictKey);
              return idx === -1 ? 'hold steady' : order[(idx + 1) % order.length];
            })();
            const VerdictIcon = nextVerdict === 'invest more' ? ArrowUp : nextVerdict === 'cut or rework' ? ArrowDown : Minus;
            const itemName = String(a.name);
            const itemCategory = String(a.category);
            const itemWhatWorks = String(a.whatWorks);
            return (
              <div
                key={String(a.id)}
                className="relative rounded-2xl border shadow-sm"
                style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
              >
                <button
                  type="button"
                  onClick={() => acquisitionDrill.open(String(a.id))}
                  className="flex w-full items-start gap-4 p-4 text-left"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: accent }}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-[9rem] flex-1">
                        <div className="text-[14px] font-bold" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {itemName}
                        </div>
                        <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                          {itemCategory}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: tone === 'ok' ? '#15803d' : tone === 'warn' ? '#b45309' : tone === 'danger' ? '#b91c1c' : '#57534e',
                          background: tone === 'ok' ? '#dcfce7' : tone === 'warn' ? '#fef3c7' : tone === 'danger' ? '#fee2e2' : '#f5f5f4',
                        }}
                      >
                        {verdictKey}
                      </span>
                    </div>
                    <p className="text-[12px] leading-snug line-clamp-2 mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {itemWhatWorks.split('.')[0] ?? itemWhatWorks}
                    </p>
                    <div
                      className="flex items-center gap-3 text-[10.5px] font-mono mt-2.5 pt-2 border-t"
                      style={{ color: 'var(--theme-text-dim)', borderColor: 'var(--panel-border-subtle)' }}
                    >
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                        <span className="mr-1" style={{ color: 'var(--theme-text-dim)' }}>global</span>
                        {String(a.global)}/100
                      </span>
                      <span className="truncate flex-1">V{String(a.virality)} · C{String(a.conversion)} · ${String(a.cost)} · E{String(a.ease)}</span>
                    </div>
                  </div>
                </button>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-t"
                  style={{ borderColor: 'var(--panel-border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cycleVerdict(String(a.id)); }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: 'var(--theme-surface-hover)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                    aria-label={`Cycle verdict on ${itemName}`}
                  >
                    <VerdictIcon className="w-3.5 h-3.5" />
                    Switch to {nextVerdict}
                  </button>
                </div>
              </div>
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const Strategie = () => {
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
    const updateItem = useCmsStore(s => s.updateItem);
    const partenariats = useCmsStore(s => s.items['growth_partenariats']) ?? [];
    const cyclePartnerState = (id: string): void => {
      const item = partenariats.find((p) => p.id === id);
      if (!item) return;
      const order = ['prospect', 'en discussion', 'actif', 'dormant'];
      const idx = order.indexOf(String(item.state));
      const next = idx === -1 ? 'prospect' : order[(idx + 1) % order.length];
      const result = updateItem('growth_partenariats', id, { state: next });
      if (result !== undefined) {
        addToast({ source: 'Growth', type: 'success', message: `${String(item.name)} → ${next}` });
      }
    };
    return (
      <div className="p-7">
        <SectionHead
          title="Partenariats"
          subtitle="Ce qu'ils apportent, ce qu'ils attendent, etat de la relation"
        />
        <FleetItemGrid cols={2}>
          {partenariats.map((p) => {
            const tone = PARTNER_STATE_TONE[String(p.state)] ?? 'neutral';
            const accent = PARTNER_STATE_ACCENT[String(p.state)] ?? ACCENT;
            const stateOrder = ['prospect', 'en discussion', 'actif', 'dormant'];
            const curIdx = stateOrder.indexOf(String(p.state));
            const nextState = curIdx === -1 ? 'prospect' : stateOrder[(curIdx + 1) % stateOrder.length];
            const partnerName = String(p.name);
            const partnerType = String(p.type);
            const partnerContact = String(p.contact);
            const partnerBrings = String(p.brings);
            const partnerExpects = String(p.expects);
            return (
              <div
                key={String(p.id)}
                className="relative rounded-2xl border shadow-sm"
                style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
              >
                <button
                  type="button"
                  onClick={() => partenariatsDrill.open(String(p.id))}
                  className="flex w-full items-start gap-4 p-4 text-left"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: accent }}
                  >
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-[9rem] flex-1">
                        <div className="text-[14px] font-bold" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {partnerName}
                        </div>
                        <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                          {partnerType} · {partnerContact}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: tone === 'ok' ? '#15803d' : tone === 'warn' ? '#b45309' : tone === 'danger' ? '#b91c1c' : tone === 'accent' ? '#1d4ed8' : '#57534e',
                          background: tone === 'ok' ? '#dcfce7' : tone === 'warn' ? '#fef3c7' : tone === 'danger' ? '#fee2e2' : tone === 'accent' ? '#dbeafe' : '#f5f5f4',
                        }}
                      >
                        {String(p.state)}
                      </span>
                    </div>
                    <p className="text-[12px] leading-snug line-clamp-2 mt-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {partnerBrings.split('.')[0] ?? partnerBrings}
                    </p>
                    <div
                      className="flex items-center gap-3 text-[10.5px] font-mono mt-2.5 pt-2 border-t"
                      style={{ color: 'var(--theme-text-dim)', borderColor: 'var(--panel-border-subtle)' }}
                    >
                      <span className="font-semibold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                        <span className="mr-1" style={{ color: 'var(--theme-text-dim)' }}>touched</span>
                        {String(p.touched)}
                      </span>
                      <span className="truncate flex-1">{partnerExpects.split('.')[0] ?? partnerExpects}</span>
                    </div>
                  </div>
                </button>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-t"
                  style={{ borderColor: 'var(--panel-border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cyclePartnerState(String(p.id)); }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: 'var(--theme-surface-hover)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--panel-border)',
                    }}
                    aria-label={`Cycle state on ${partnerName}`}
                  >
                    Move to {nextState}
                  </button>
                </div>
              </div>
            );
          })}
        </FleetItemGrid>
      </div>
    );
  };

  const AEO = () => {
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

  /* ── Drill registry — every CMS drill for this app, in one place. Used
       both to render the dynamic detail at the top level (sibling of
       AppFrame, so the theme follows the top bar, not the sidebar) and to
       skip the section's inline view when another drill is open. */
  const drillRegistry = [
    { drill: acquisitionDrill, collection: 'growth_acquisition' as const },
    { drill: strategieDrill, collection: 'growth_strategie' as const },
    { drill: partenariatsDrill, collection: 'growth_partenariats' as const },
    { drill: aeoDrill, collection: 'growth_aeo' as const },
  ];
  const openDrillEntry = drillRegistry.find((d) => d.drill.openId !== null);
  const openDrillCollection = openDrillEntry?.collection ?? null;
  const openDrillId = openDrillEntry?.drill.openId ?? null;
  const closeOpenDrill = (): void => {
    for (const entry of drillRegistry) entry.drill.close();
  };
  const navigateOpenDrill = (id: string): void => {
    openDrillEntry?.drill.open(id);
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
      {openDrillCollection !== null && openDrillId !== null ? (
        <AppDetailOverlay
          appId="growth"
          accent="#16a34a"
          onBack={closeOpenDrill}
          motion={{ kind: 'fade-up', durationMs: 220 }}
        >
          <DynamicPageView
            collectionId={openDrillCollection}
            itemId={openDrillId}
            onBack={closeOpenDrill}
            onNavigate={navigateOpenDrill}
          />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}