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
import { Boxes, Map, ListTodo, Tag, ClipboardList, Lightbulb, Package, FileCode } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { ProductDetailPage, type ProductDetailItem } from './ProductDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { ProductItemDetail } from './ProductItemDetail';

registerItemDetail('product', ProductItemDetail);
import { CMSCardList } from '../_ui/CMSCardList';
import { PRODUCT_CHANNELS, CHANNEL_STATUS_META, CHANNEL_ICON } from './channels';

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
  version?: string;
  shippedAt?: string;
  shippedRelative?: string;
  status?: 'shipped' | 'draft' | 'archived';
  changelog?: string;
}

const ACCENT = '#9333ea';

export function ProductApp() {
  const items = useCmsStore(s => s.items['product_items']) ?? [];
  const releases = useCmsStore(s => s.items['product_releases']) ?? [];
  const drill = useCollectionDrill('product_items', ['Roadmap', 'Backlog', 'Specs']);
  const releasesDrill = useCollectionDrill('product_releases', 'Releases');
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
    return (
      <div className="p-7">
        <SectionHead title="Backlog" subtitle="Groomed, not yet scheduled" action={<Badge tone="neutral">{byStage('backlog').length}</Badge>} />
        <CMSCardList<ProductItem>
          collectionId="product_items"
          onOpen={openItem}
          cols={2}
          render={(it) => ({
            title: it.title,
            subtitle: it.meta,
            description: it.specStatus ? `Spec status: ${it.specStatus}${it.owner ? ` · Owner: ${it.owner}` : ''}` : `Owner: ${it.owner ?? '—'}`,
            statusLabel: it.stage,
            statusTone: STAGE_TONE[it.stage] ?? 'neutral',
            accent: STAGE_ACCENT[it.stage] ?? ACCENT,
            icon: STAGE_ICON[it.stage] ?? <FileCode className="w-5 h-5" />,
            meta: 'backlog · drag to Roadmap to schedule',
          })}
          // Filter to backlog items only
          emptyMessage="No backlog items yet."
        />
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
            title: r.title,
            subtitle: r.shippedRelative ? `Shipped ${r.shippedRelative}` : (r.shippedAt ?? '—'),
            description: r.changelog,
            statusLabel: r.status ?? 'shipped',
            statusTone: r.status === 'archived' ? 'neutral' : r.status === 'draft' ? 'warn' : 'ok',
            accent: r.status === 'archived' ? '#737373' : '#16a34a',
            icon: <Package className="w-5 h-5" />,
            metricLabel: 'version',
            metricValue: r.version ?? '—',
            meta: r.shippedRelative ?? r.shippedAt,
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
              <div key={ch.id} className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="font-bold text-stone-900">{ch.manager}</span>
                  <span className="text-stone-400 font-mono">{arrow}</span>
                  <span className="font-semibold text-stone-700">{ch.worker}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <div className="text-[12px] text-stone-700">{ch.task}</div>
                {ch.payload && (
                  <div className="text-[10.5px] font-mono text-stone-500 bg-stone-50 rounded px-2 py-1 break-all">{ch.payload}</div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                  <span>channel · <span className="text-stone-600">{ch.channel}</span></span>
                  <span>model · <span className="font-mono text-stone-500">{ch.model}</span></span>
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

  const sections: AppSection[] = [
    { id: 'roadmap', label: 'Roadmap', icon: Map, render: Roadmap },
    { id: 'backlog', label: 'Backlog', icon: ListTodo, render: Backlog },
    { id: 'releases', label: 'Releases', icon: Tag, render: Releases },
    { id: 'specs', label: 'Specs', icon: ClipboardList, render: Specs },
    { id: 'channels', label: 'Channels', icon: CHANNEL_ICON, render: Channels },
  ];

  const groups: Record<string, string> = {
    roadmap: 'Plan',
    backlog: 'Plan',
    releases: 'Ship',
    specs: 'Ship',
    channels: 'Orchestration',
  };

  return (
    <>
      <AppFrame title="Product" subtitle="Flash domain" icon={Boxes} accent={ACCENT} sections={sections} groups={groups} />
      {detail ? (
        <AppDetailOverlay
          appId="product"
          accent="#9333ea"
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-right', durationMs: 220 }}
        >
          <ProductDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
