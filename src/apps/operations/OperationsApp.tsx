import { BookOpen, ClipboardList, AlertOctagon } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';

const ACCENT = '#4f46e5';

export function OperationsApp() {
  const runbooksDrill = useCollectionDrill('runbooks', 'Runbooks');
  const knowledgeDrill = useCollectionDrill('articles', 'Knowledge Base');
  const incidentsDrill = useCollectionDrill('incidents', 'Incidents');

  const Runbooks = () => {
    if (runbooksDrill.openId) {
      return <DynamicPageView collectionId="runbooks" itemId={runbooksDrill.openId} onBack={runbooksDrill.close} onNavigate={runbooksDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Runbooks" subtitle="The operating procedures your agents follow" />
        <CollectionRepeater collectionId="runbooks" onOpen={runbooksDrill.open} />
      </div>
    );
  };

  const Knowledge = () => {
    if (knowledgeDrill.openId) {
      return <DynamicPageView collectionId="articles" itemId={knowledgeDrill.openId} onBack={knowledgeDrill.close} onNavigate={knowledgeDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Knowledge base" subtitle="Answers your agents cite — one shared page template (CMS-driven)" />
        <CollectionRepeater collectionId="articles" onOpen={knowledgeDrill.open} />
      </div>
    );
  };

  const Incidents = () => {
    if (incidentsDrill.openId) {
      return <DynamicPageView collectionId="incidents" itemId={incidentsDrill.openId} onBack={incidentsDrill.close} onNavigate={incidentsDrill.open} />;
    }
    return (
      <div className="p-7">
        <SectionHead title="Incidents" subtitle="What the ops watchdog caught" />
        <CollectionRepeater collectionId="incidents" onOpen={incidentsDrill.open} />
      </div>
    );
  };

  const sections: AppSection[] = [
    { id: 'runbooks', label: 'Runbooks', icon: ClipboardList, render: Runbooks },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, render: Knowledge },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon, render: Incidents },
  ];

  return <AppFrame title="Operations" subtitle="Batman domain" icon={ClipboardList} accent={ACCENT} sections={sections} />;
}
