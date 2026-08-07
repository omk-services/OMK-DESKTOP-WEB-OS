/** Product app — Flash domain (E-Myth B2-03 manager).
 *  Layout:
 *    - Sidebar: PLAN (Roadmap, Backlog) · SHIP (Releases, Specs) · ORCHESTRATION (Channels)
 *    - Content: items list → drill detail (or channels log)
 *  2-column (sidebar + content). Per-app "Tools" panel removed per A+ feedback —
 *  AI tools are scoped to the DETAIL pages, not the app-wide level. The
 *  AppFrame refactor (3-column + tools) stays in the codebase for future
 *  apps that want it, but Product itself uses the standard 2-column layout.
 */
import { useEffect, useState } from 'react';
import { Boxes, Map, ListTodo, Tag, ClipboardList, Lightbulb, Package, FileCode, Trophy, Send, Hammer, Sparkles } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { ProductDetailPage, type ProductDetailItem } from './ProductDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { ProductItemDetail } from './ProductItemDetail';
import { CMSCardList } from '../_ui/CMSCardList';
import { FleetItemCard, FleetItemGrid } from '../_ui/FleetItemCard';
import { PRODUCT_CHANNELS, CHANNEL_STATUS_META, CHANNEL_ICON } from './channels';
import { seedProductCms } from './seed';

registerItemDetail('product', ProductItemDetail);
seedProductCms();

const STAGE_TONE: Record<string, 'accent' | 'warn' | 'neutral'> = {
  now: 'accent', next: 'warn', later: 'neutral', backlog: 'neutral',
};
const STAGE_ACCENT: Record<string, string> = {
  now: '#9333ea', next: '#c084fc', later: '#a8a29e', backlog: '#737373',
};
const STAGE_ICON: Record<string, React.ReactNode> = {
  now: <Lightbulb className="w-5 h-5" />,
  next: <Lightbulb className="w-5 h-5" />,
  later: <Lightbulb className="w-5 h-5" />,
  backlog: <FileCode className="w-5 h-5" />,
};
const SPEC_TONE: Record<string, 'ok' | 'warn' | 'neutral'> = {
  approved: 'ok', review: 'warn', draft: 'neutral',
};

const TIER_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral' | 'accent'> = {
  S: 'ok', A: 'accent', B: 'neutral', F: 'danger',
};
const TIER_ACCENT: Record<string, string> = {
  S: '#16a34a', A: '#1d4ed8', B: '#57534e', F: '#dc2626',
};

const STAGE2_TONE: Record<string, 'ok' | 'warn' | 'accent' | 'primary' | 'neutral'> = {
  validate: 'accent',
  presell: 'warn',
  launch: 'ok',
  audience: 'primary',
  productize: 'primary',
};
const STAGE2_ACCENT: Record<string, string> = {
  validate: '#7c3aed', presell: '#f59e0b', launch: '#16a34a', audience: '#0c0a09', productize: '#0c0a09',
};

const OVERFLOW_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'accent'> = {
  ok: 'ok', feature: 'accent', client: 'warn', problem: 'danger',
};
const OVERFLOW_ACCENT: Record<string, string> = {
  ok: '#16a34a', feature: '#7c3aed', client: '#f59e0b', problem: '#dc2626',
};

const TREND_TONE: Record<string, 'ok' | 'warn' | 'neutral'> = {
  high: 'ok', med: 'warn', low: 'neutral',
};
const TREND_ACCENT: Record<string, string> = {
  high: '#16a34a', med: '#f59e0b', low: '#a8a29e',
};

interface ProductItem extends Record<string, unknown> {
  id: string;
  title: string;
  stage: 'now' | 'next' | 'later' | 'backlog';
  meta: string;
  specStatus?: 'approved' | 'review' | 'draft';
  owner?: string;
}

interface ReleaseItem extends Record<string, unknown> {
  id: string;
  title: string;
  name?: string;
  version?: string;
  shippedAt?: string;
  shippedRelative?: string;
  when?: string;
  status?: 'shipped' | 'draft' | 'archived';
  changelog?: string;
  notes?: string;
}

interface RankingItem extends Record<string, unknown> {
  id: string;
  name: string;
  tier: 'S' | 'A' | 'B' | 'F';
  body: string;
  score: number;
  area: string;
  owner: string;
  source: string;
}

interface LaunchItem extends Record<string, unknown> {
  id: string;
  name: string;
  stage: 'validate' | 'presell' | 'launch' | 'audience' | 'productize';
  state: 'done' | 'doing' | 'todo';
  cohort: string;
  body: string;
  eta: string;
  owner: string;
  metric: string;
}

interface MvpItem extends Record<string, unknown> {
  id: string;
  name: string;
  feature: string;
  client: string;
  body: string;
  overflow: 'ok' | 'feature' | 'client' | 'problem';
  weeksToShip: number;
  eta: string;
  owner: string;
  successMetric: string;
}

interface IdeaItem extends Record<string, unknown> {
  id: string;
  name: string;
  trend: 'high' | 'med' | 'low';
  opportunity: 'high' | 'med' | 'low';
  demand: 'observed' | 'latent' | 'none';
  economicSize: 'large' | 'mid' | 'small';
  summary: string;
  body: string;
  source: string;
}

const ACCENT = '#ea580c';

export function ProductApp() {
  const items = useCmsStore(s => s.items['product_items']) ?? [];
  const releases = useCmsStore(s => s.items['product_releases']) ?? [];
  const drill = useCollectionDrill('product_items', ['Roadmap', 'Backlog', 'Specs']);
  const releasesDrill = useCollectionDrill('product_releases', 'Releases');
  const rankingsDrill = useCollectionDrill('product_rankings', 'Classement');
  const launchesDrill = useCollectionDrill('product_launches', 'Lancement');
  const mvpsDrill = useCollectionDrill('product_mvps', 'MVP');
  const ideasDrill = useCollectionDrill('product_ideas', 'Idéation');
  const [detail, setDetail] = useState<ProductDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const byStage = (stage: string) => items.filter(i => i.stage === stage);

  const openItem = (id: string): void => {
    const item = items.find(c => c.id === id);
    if (!item) { drill.open(id); return; }
    const stageState: 'doing' | 'done' | 'todo' = item.stage === 'now' ? 'doing' : item.stage === 'backlog' ? 'todo' : 'todo';
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.meta ?? ''),
      status: String(item.stage ?? 'now'),
      roadmap: [{ stage: String(item.stage ?? 'now'), state: stageState }],
      spec: String(item.specStatus ?? 'draft'),
      channels: [],
      fields: [],
    });
    drill.open(id);
  };

  const openRelease = (id: string): void => {
    const item = releases.find(c => c.id === id);
    if (!item) { releasesDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.version ?? '—'),
      status: String(item.status ?? 'shipped'),
      roadmap: [{ stage: 'shipped', state: 'done' }],
      spec: String(item.changelog ?? ''),
      channels: [],
      fields: [],
    });
    releasesDrill.open(id);
  };

  const Roadmap = () => {
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Roadmap" subtitle="What ships now, next, later" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Now', accent: ACCENT, items: byStage('now').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} accent={ACCENT} onClick={() => openItem(String(i.id))} />
            )) },
            { title: 'Next', accent: '#c084fc', items: byStage('next').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} onClick={() => openItem(String(i.id))} />
            )) },
            { title: 'Later', accent: '#a8a29e', items: byStage('later').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} onClick={() => openItem(String(i.id))} />
            )) },
          ]} />
        </div>
      </div>
    );
  };

  const Backlog = () => {
    const backlogItems = byStage('backlog');
    return (
      <div className="p-7">
        <SectionHead title="Backlog" subtitle="Groomed, not yet scheduled" action={<Badge tone="neutral">{backlogItems.length}</Badge>} />
        {backlogItems.length === 0 ? (
          <div className="text-center text-[12px] py-8" style={{ color: 'var(--theme-text-dim)' }}>
            No backlog items yet.
          </div>
        ) : (
          <FleetItemGrid cols={2}>
            {backlogItems.map((raw) => {
              const it = raw as unknown as ProductItem;
              return (
                <FleetItemCard
                  key={String(it.id)}
                  title={String(it.title)}
                  subtitle={String(it.meta ?? '')}
                  description={it.specStatus ? `Spec status: ${it.specStatus}${it.owner ? ` · Owner: ${it.owner}` : ''}` : `Owner: ${it.owner ?? '—'}`}
                  statusLabel={String(it.stage)}
                  statusTone={STAGE_TONE[it.stage] ?? 'neutral'}
                  accent={STAGE_ACCENT[it.stage] ?? ACCENT}
                  icon={STAGE_ICON[it.stage] ?? <FileCode className="w-5 h-5" />}
                  meta="backlog · drag to Roadmap to schedule"
                  onClick={() => openItem(String(it.id))}
                />
              );
            })}
          </FleetItemGrid>
        )}
      </div>
    );
  };

  const Releases = () => {
    return (
      <div className="p-7">
        <SectionHead title="Releases" subtitle="Shipped versions + draft notes" />
        <CMSCardList<ReleaseItem>
          collectionId="product_releases"
          onOpen={openRelease}
          cols={2}
          render={(r) => ({
            title: String(r.title ?? r.name ?? 'Untitled release'),
            subtitle: r.shippedRelative ? `Shipped ${r.shippedRelative}` : (r.shippedAt ?? r.when ?? '—'),
            description: r.changelog ?? r.notes ?? '',
            statusLabel: r.status ?? 'shipped',
            statusTone: r.status === 'archived' ? 'neutral' : r.status === 'draft' ? 'warn' : 'ok',
            accent: r.status === 'archived' ? '#737373' : '#16a34a',
            icon: <Package className="w-5 h-5" />,
            metricLabel: 'version',
            metricValue: r.version ?? '—',
            meta: r.shippedRelative ?? r.shippedAt ?? r.when,
          })}
        />
      </div>
    );
  };

  const Specs = () => {
    return (
      <div className="p-7">
        <SectionHead title="Specs" subtitle="Every product_items row has a spec (CMS-driven)" action={<Badge tone="accent">{items.length}</Badge>} />
        <CMSCardList<ProductItem>
          collectionId="product_items"
          onOpen={openItem}
          cols={2}
          render={(it) => ({
            title: it.title,
            subtitle: `${it.stage} · ${it.meta}`,
            description: `Spec: ${it.specStatus ?? 'draft'}${it.owner ? ` · Owner: ${it.owner}` : ''}`,
            statusLabel: it.specStatus ?? 'draft',
            statusTone: SPEC_TONE[it.specStatus ?? 'draft'] ?? 'neutral',
            accent: STAGE_ACCENT[it.stage] ?? ACCENT,
            icon: <FileCode className="w-5 h-5" />,
            metricLabel: 'owner',
            metricValue: it.owner ?? '—',
            meta: `stage: ${it.stage}`,
          })}
        />
      </div>
    );
  };

  const Channels = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Channels"
          subtitle="AI↔AI Manager → Worker handoffs (AgenticOS pattern)"
          action={<Badge tone="accent">{PRODUCT_CHANNELS.length} entries</Badge>}
        />
        <div className="flex flex-col gap-2.5">
          {PRODUCT_CHANNELS.slice().reverse().map(ch => {
            const meta = CHANNEL_STATUS_META[ch.status];
            const arrow = ch.direction === 'mgr→wkr' ? '→' : ch.direction === 'wkr→mgr' ? '←' : '⇢';
            return (
              <div key={ch.id} className="bg-[var(--theme-surface)] rounded-xl border border-[var(--panel-border)] shadow-sm p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-bold text-[var(--theme-text)]">{ch.manager}</span>
                  <span className="text-[var(--theme-text-dim)] font-mono">{arrow}</span>
                  <span className="font-semibold text-[var(--theme-text)]">{ch.worker}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--theme-text)]">{ch.task}</div>
                {ch.payload && (
                  <div className="text-[10.5px] font-mono text-[var(--theme-text-muted)] bg-[var(--theme-surface)] rounded px-2 py-1 break-all">{ch.payload}</div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-[var(--theme-text-dim)]">
                  <span>channel · <span className="text-[var(--theme-text-muted)]">{ch.channel}</span></span>
                  <span>model · <span className="font-mono text-[var(--theme-text-muted)]">{ch.model}</span></span>
                  {ch.latencyMs && <span>· {ch.latencyMs}ms</span>}
                  <span className="ml-auto font-mono">{new Date(ch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Classement = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Classement"
          subtitle="S / A / B / F — chaque placement porte son critère de justification"
          action={<Badge tone="warn">placement ≠ opinion</Badge>}
        />
        <CMSCardList<RankingItem>
          collectionId="product_rankings"
          onOpen={rankingsDrill.open}
          cols={2}
          render={(it) => ({
            title: it.name,
            subtitle: `${it.area} · ${it.owner}`,
            description: it.body,
            statusLabel: `tier ${it.tier}`,
            statusTone: TIER_TONE[it.tier] ?? 'neutral',
            accent: TIER_ACCENT[it.tier] ?? ACCENT,
            icon: <Trophy className="w-5 h-5" />,
            metricLabel: 'score',
            metricValue: `${it.score}/100`,
            meta: it.source,
          })}
          emptyMessage="Aucun classement pour l'instant."
        />
      </div>
    );
  };

  const Lancement = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Lancement"
          subtitle="5 étapes canoniques : valider · pré-vendre · lancer · audience · produitiser"
        />
        <CMSCardList<LaunchItem>
          collectionId="product_launches"
          onOpen={launchesDrill.open}
          cols={2}
          render={(it) => ({
            title: it.name,
            subtitle: `${it.cohort} · ${it.owner}`,
            description: it.body,
            statusLabel: it.stage,
            statusTone: STAGE2_TONE[it.stage] ?? 'neutral',
            accent: STAGE2_ACCENT[it.stage] ?? ACCENT,
            icon: <Send className="w-5 h-5" />,
            metricLabel: it.state === 'done' ? 'état' : 'ETA',
            metricValue: it.state === 'done' ? '✓' : it.eta,
            meta: it.metric,
          })}
          emptyMessage="Aucun lancement suivi pour l'instant."
        />
      </div>
    );
  };

  const MVP = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="MVP"
          subtitle="Plus petit livrable : une fonctionnalité, un client, un problème — signal quand l'un déborde"
          action={<Badge tone="accent">discipline du plus petit</Badge>}
        />
        <CMSCardList<MvpItem>
          collectionId="product_mvps"
          onOpen={mvpsDrill.open}
          cols={2}
          render={(it) => ({
            title: it.name,
            subtitle: `client · ${it.client}`,
            description: it.body,
            statusLabel: it.overflow === 'ok' ? 'discipliné' : `overflow · ${it.overflow}`,
            statusTone: OVERFLOW_TONE[it.overflow] ?? 'neutral',
            accent: OVERFLOW_ACCENT[it.overflow] ?? ACCENT,
            icon: <Hammer className="w-5 h-5" />,
            metricLabel: 'semaines',
            metricValue: `${it.weeksToShip}`,
            meta: `${it.feature.split(' ').slice(0, 6).join(' ')}…`,
          })}
          emptyMessage="Aucun MVP défini pour l'instant."
        />
      </div>
    );
  };

  const Ideation = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Idéation"
          subtitle="Idées à l'état brut — 4 angles : tendance, opportunité, demande, taille économique"
          action={<Badge tone="neutral">triage = lire la table</Badge>}
        />
        <CMSCardList<IdeaItem>
          collectionId="product_ideas"
          onOpen={ideasDrill.open}
          cols={2}
          render={(it) => ({
            title: it.name,
            subtitle: it.summary,
            description: it.source,
            statusLabel: `tendance · ${it.trend}`,
            statusTone: TREND_TONE[it.trend] ?? 'neutral',
            accent: TREND_ACCENT[it.trend] ?? ACCENT,
            icon: <Sparkles className="w-5 h-5" />,
            metricLabel: 'économie',
            metricValue: it.economicSize,
            meta: `demande ${it.demand} · opp ${it.opportunity}`,
          })}
          emptyMessage="Aucune idée en idéation pour l'instant."
        />
      </div>
    );
  };

  /* ── Drill registry — every CMS drill for this app, in one place. Used
       both to render the dynamic detail at the top level (sibling of
       AppFrame, so the theme follows the top bar, not the sidebar) and to
       skip the section's inline view when another drill is open. */
  const drillRegistry = [
    { drill: rankingsDrill, collection: 'product_rankings' as const },
    { drill: launchesDrill, collection: 'product_launches' as const },
    { drill: mvpsDrill, collection: 'product_mvps' as const },
    { drill: ideasDrill, collection: 'product_ideas' as const },
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
    { id: 'roadmap', label: 'Roadmap', icon: Map, render: Roadmap },
    { id: 'backlog', label: 'Backlog', icon: ListTodo, render: Backlog },
    { id: 'releases', label: 'Releases', icon: Tag, render: Releases },
    { id: 'specs', label: 'Specs', icon: ClipboardList, render: Specs },
    { id: 'classement', label: 'Classement', icon: Trophy, render: Classement },
    { id: 'lancement', label: 'Lancement', icon: Send, render: Lancement },
    { id: 'mvp', label: 'MVP', icon: Hammer, render: MVP },
    { id: 'ideation', label: 'Idéation', icon: Sparkles, render: Ideation },
    { id: 'channels', label: 'Channels', icon: CHANNEL_ICON, render: Channels },
  ];

  const groups: Record<string, string> = {
    roadmap: 'Plan',
    backlog: 'Plan',
    releases: 'Ship',
    specs: 'Ship',
    classement: 'Strategy',
    lancement: 'Strategy',
    mvp: 'Discovery',
    ideation: 'Discovery',
    channels: 'Orchestration',
  };

  return (
    <>
      <AppFrame title="Product" subtitle="Flash domain" icon={Boxes} accent={ACCENT} sections={sections} groups={groups} />
      {detail ? (
        <AppDetailOverlay
          appId="product"
          accent="#ea580c"
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-right', durationMs: 220 }}
        >
          <ProductDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
      {openDrillCollection !== null && openDrillId !== null ? (
        <AppDetailOverlay
          appId="product"
          accent="#ea580c"
          onBack={closeOpenDrill}
          motion={{ kind: 'slide-right', durationMs: 220 }}
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
