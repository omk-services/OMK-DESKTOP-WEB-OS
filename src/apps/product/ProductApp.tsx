/** Product app — Flash domain (E-Myth B2-03 manager).
 *  Refactored to the 3-column layout (sidebar + content + AI Tools panel)
 *  following the AgenticOS pole pattern:
 *    - Sidebar (left): pole pages (Roadmap / Backlog / Releases / Specs / Channels)
 *    - Content: items list → drill detail (or channels log, or spec table)
 *    - Tools (right): 4 AI assistants with status + free model router
 *  Each section can host 2-level subpage navigation via tabs (e.g. a
 *  release's changelog → specific sprint). */
import { useState } from 'react';
import { Boxes, Map, ListTodo, Tag, ClipboardList, Sparkles, Calendar, FileText, ShieldCheck, GitBranch } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge, Card } from '../_ui/kit';
import { KanbanBoard, KanbanCard, Table } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { PRODUCT_CHANNELS, CHANNEL_STATUS_META, CHANNEL_ICON } from './channels';
import type { ToolDef } from '../../components/AppFrame';

const ACCENT = '#9333ea';

/** Tab strip — subpage navigation inside a section. Pattern forked from
 *  AgenticOS pole pages (Dashboard / Statistics / Veille / Branding) where
 *  each page can host multiple sub-views. */
function SubTabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; badge?: string }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="flex items-center gap-1 mb-4 border-b border-[var(--panel-border-subtle)]">
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
              isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {t.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{t.badge}</span>}
            </span>
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full" style={{ background: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );
}

export function ProductApp() {
  const items = useCmsStore(s => s.items['product_items']) ?? [];
  const releases = useCmsStore(s => s.items['product_releases']) ?? [];
  const drill = useCollectionDrill('product_items', ['Roadmap', 'Backlog', 'Specs']);
  const releasesDrill = useCollectionDrill('product_releases', 'Releases');

  const byStage = (stage: string) => items.filter(i => i.stage === stage);

  const Roadmap = () => {
    const [tab, setTab] = useState<'now' | 'next' | 'later'>('now');
    if (drill.openId) {
      return <DynamicPageView collectionId="product_items" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    const tabs = [
      { id: 'now' as const, label: 'Now', badge: String(byStage('now').length) },
      { id: 'next' as const, label: 'Next', badge: String(byStage('next').length) },
      { id: 'later' as const, label: 'Later', badge: String(byStage('later').length) },
    ];
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Roadmap" subtitle="What ships now, next, later" />
        <SubTabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            {
              title: tabs.find(t => t.id === tab)!.label,
              accent: ACCENT,
              items: byStage(tab).map(i => (
                <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} accent={ACCENT} onClick={() => drill.open(String(i.id))} />
              )),
            },
          ]} />
        </div>
      </div>
    );
  };

  const Backlog = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="product_items" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Backlog" subtitle="Groomed, not yet scheduled" action={<Badge tone="neutral">{byStage('backlog').length}</Badge>} />
        <CollectionRepeater collectionId="product_items" onOpen={drill.open} filter={i => i.stage === 'backlog'} />
      </div>
    );
  };

  const Releases = () => {
    const [tab, setTab] = useState<string>(releases[0] ? String((releases[0] as Record<string, unknown>).id) : 'all');
    if (releasesDrill.openId) {
      return <DynamicPageView collectionId="product_releases" itemId={releasesDrill.openId} onBack={releasesDrill.close} onNavigate={releasesDrill.open} />;
    }
    const tabs = [
      { id: 'all', label: 'All', badge: String(releases.length) },
      ...releases.slice(0, 6).map(r => ({ id: String((r as Record<string, unknown>).id), label: String((r as Record<string, unknown>).title ?? 'v?') })),
    ];
    return (
      <div className="p-7">
        <SectionHead title="Releases" subtitle="Shipped versions + draft notes" />
        <SubTabs tabs={tabs} active={tab} onChange={setTab as (id: string) => void} />
        {tab === 'all' ? (
          <CollectionRepeater collectionId="product_releases" onOpen={releasesDrill.open} />
        ) : (
          <div className="space-y-3">
            <button onClick={() => releasesDrill.open(tab)} className="w-full text-left">
              <Card className="p-5 hover:border-[var(--theme-accent)] transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Tag className="w-4 h-4" style={{ color: ACCENT }} />
                  <span className="text-sm font-semibold text-stone-800">{(releases.find(r => String((r as Record<string, unknown>).id) === tab) as Record<string, unknown>)?.title as string ?? 'Release'}</span>
                </div>
                <p className="text-[12px] text-stone-500 leading-snug">Click to open changelog + spec diff.</p>
              </Card>
            </button>
          </div>
        )}
      </div>
    );
  };

  const Specs = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="product_items" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Specs" subtitle="Every product_items row has a spec (CMS-driven)" action={<Badge tone="accent">{items.length}</Badge>} />
        <Card>
          <Table
            head={['Title', 'Stage', 'Spec status', 'Owner']}
            onRowClick={(i) => drill.open(String(items[i].id))}
            rows={items.slice(0, 20).map(it => {
              const specStatus = String((it as Record<string, unknown>).specStatus ?? 'draft');
              return [
                <span className="font-semibold text-stone-800">{String((it as Record<string, unknown>).title)}</span>,
                <Badge tone="neutral">{String((it as Record<string, unknown>).stage)}</Badge>,
                <Badge tone={specStatus === 'approved' ? 'ok' : specStatus === 'review' ? 'warn' : 'neutral'}>{specStatus}</Badge>,
                <span className="text-[11px] text-stone-500">{String((it as Record<string, unknown>).owner ?? '—')}</span>,
              ];
            })}
          />
        </Card>
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

  const tools: ToolDef[] = [
    {
      id: 'roadmap-strategist',
      name: 'Roadmap Strategist',
      description: 'Suggests Now/Next/Later prioritization based on customer impact + effort.',
      status: 'running',
      lastActivity: 'just now',
      icon: Sparkles,
      modelLabel: 'gemma-4-free',
    },
    {
      id: 'sprint-planner',
      name: 'Sprint Planner',
      description: 'Breaks down a roadmap item into sprints + acceptance criteria.',
      status: 'idle',
      lastActivity: '14m ago',
      icon: Calendar,
      modelLabel: 'gemma-4-free',
    },
    {
      id: 'release-notes',
      name: 'Release Notes Generator',
      description: 'Drafts changelog entries from a release bundle (human-reviewed before publish).',
      status: 'awaiting',
      lastActivity: '8m ago',
      icon: FileText,
      modelLabel: 'gemma-4-free',
    },
    {
      id: 'spec-auditor',
      name: 'Spec Auditor',
      description: 'Flags scope creep, untestable criteria, and missing edge cases in spec drafts.',
      status: 'idle',
      lastActivity: '1h ago',
      icon: ShieldCheck,
      modelLabel: 'gemma-4-free',
    },
    {
      id: 'git-intel',
      name: 'Git Intel',
      description: 'Cross-references open PRs with roadmap items + spec acceptance criteria.',
      status: 'idle',
      lastActivity: '2h ago',
      icon: GitBranch,
      modelLabel: 'gemma-4-free',
    },
  ];

  return <AppFrame title="Product" subtitle="Flash domain" icon={Boxes} accent={ACCENT} sections={sections} groups={groups} tools={tools} />;
}
