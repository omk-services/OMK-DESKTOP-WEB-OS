import { Boxes, Map, ListTodo, Tag } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';

const ACCENT = '#9333ea';

export function ProductApp() {
  const items = useCmsStore(s => s.items['product_items']) ?? [];
  const drill = useCollectionDrill('product_items', ['Roadmap', 'Backlog']);
  const releasesDrill = useCollectionDrill('product_releases', 'Releases');

  const byStage = (stage: string) => items.filter(i => i.stage === stage);

  const Roadmap = () => {
    if (drill.openId) {
      return <DynamicPageView collectionId="product_items" itemId={drill.openId} onBack={drill.close} onNavigate={drill.open} />;
    }
    return (
      <div className="p-7 h-full flex flex-col">
        <SectionHead title="Roadmap" subtitle="What ships now, next, later" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Now', accent: ACCENT, items: byStage('now').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} accent={ACCENT} onClick={() => drill.open(String(i.id))} />
            )) },
            { title: 'Next', accent: '#c084fc', items: byStage('next').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} onClick={() => drill.open(String(i.id))} />
            )) },
            { title: 'Later', accent: '#a8a29e', items: byStage('later').map(i => (
              <KanbanCard key={String(i.id)} title={String(i.title)} meta={String(i.meta)} onClick={() => drill.open(String(i.id))} />
            )) },
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
    if (releasesDrill.openId) {
      return <DynamicPageView collectionId="product_releases" itemId={releasesDrill.openId} onBack={releasesDrill.close} onNavigate={releasesDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Releases" subtitle="Shipped versions" />
        <CollectionRepeater collectionId="product_releases" onOpen={releasesDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'roadmap', label: 'Roadmap', icon: Map, render: Roadmap },
    { id: 'backlog', label: 'Backlog', icon: ListTodo, render: Backlog },
    { id: 'releases', label: 'Releases', icon: Tag, render: Releases },
  ];

  return <AppFrame title="Product" subtitle="Flash domain" icon={Boxes} accent={ACCENT} sections={sections} />;
}
