import { BookOpen, ClipboardList, AlertOctagon, BookText, GraduationCap, FileWarning, ShieldCheck } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { CMSCardList } from '../_ui/CMSCardList';

const ACCENT = '#4f46e5';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Onboarding: <GraduationCap className="w-5 h-5" />,
  'Finance ops': <FileWarning className="w-5 h-5" />,
  Security: <ShieldCheck className="w-5 h-5" />,
  Support: <BookText className="w-5 h-5" />,
};

const CATEGORY_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'primary' | 'neutral'> = {
  Onboarding: 'accent',
  'Finance ops': 'warn',
  Security: 'danger',
  Support: 'ok',
};

const CATEGORY_ACCENT: Record<string, string> = {
  Onboarding: '#3b82f6',
  'Finance ops': '#f59e0b',
  Security: '#dc2626',
  Support: '#16a34a',
};

interface RunbookItem extends Record<string, unknown> {
  id: string;
  title: string;
  category: string;
  updated: string;
  steps: string;
}

interface ArticleItem extends Record<string, unknown> {
  id: string;
  title: string;
  topic: string;
  citations: number;
  updated: string;
  body: string;
}

interface IncidentItem extends Record<string, unknown> {
  id: string;
  title: string;
  when: string;
  severity: 'ok' | 'warn' | 'danger';
  resolution: string;
}

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
        <CMSCardList<RunbookItem>
          collectionId="runbooks"
          onOpen={runbooksDrill.open}
          cols={2}
          render={(r) => ({
            title: r.title,
            subtitle: `${r.steps.split('→').length} steps · ${r.category}`,
            description: r.steps.split('→').slice(0, 3).join(' → '),
            statusLabel: r.category,
            statusTone: CATEGORY_TONE[r.category] ?? 'neutral',
            accent: CATEGORY_ACCENT[r.category] ?? ACCENT,
            icon: CATEGORY_ICON[r.category] ?? <BookText className="w-5 h-5" />,
            metricLabel: 'updated',
            metricValue: r.updated,
            meta: r.steps.split('→').length + ' steps',
          })}
        />
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
        <CMSCardList<ArticleItem>
          collectionId="articles"
          onOpen={knowledgeDrill.open}
          cols={2}
          render={(a) => ({
            title: a.title,
            subtitle: a.topic,
            description: a.body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 160),
            statusLabel: a.topic,
            statusTone: 'accent',
            accent: ACCENT,
            icon: <BookOpen className="w-5 h-5" />,
            metricLabel: 'citations',
            metricValue: `${a.citations} this month`,
            meta: `updated ${a.updated}`,
          })}
        />
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
        <CMSCardList<IncidentItem>
          collectionId="incidents"
          onOpen={incidentsDrill.open}
          cols={2}
          render={(i) => ({
            title: i.title,
            subtitle: i.when,
            description: i.resolution,
            statusLabel: i.severity,
            statusTone: i.severity === 'danger' ? 'danger' : i.severity === 'warn' ? 'warn' : 'ok',
            accent: i.severity === 'danger' ? '#dc2626' : i.severity === 'warn' ? '#f59e0b' : '#16a34a',
            icon: <AlertOctagon className="w-5 h-5" />,
            meta: i.severity === 'danger' ? 'auto-resolved' : i.severity === 'warn' ? 'monitored' : 'verified',
          })}
        />
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
