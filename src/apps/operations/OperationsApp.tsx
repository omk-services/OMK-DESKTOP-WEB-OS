import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, AlertOctagon, BookText, GraduationCap, FileWarning, ShieldCheck } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { OperationsDetailPage, type OperationsDetailItem } from './OperationsDetailPage';
import { CMSCardList } from '../_ui/CMSCardList';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { OperationsItemDetail } from './OperationsItemDetail';

registerItemDetail('operations', OperationsItemDetail);

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
  const runbooks = useCmsStore(s => s.items['runbooks']) ?? [];
  const articles = useCmsStore(s => s.items['articles']) ?? [];
  const incidents = useCmsStore(s => s.items['incidents']) ?? [];
  const [detail, setDetail] = useState<OperationsDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const openRunbook = (id: string): void => {
    const item = runbooks.find(c => c.id === id);
    if (!item) { runbooksDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.category ?? ''),
      status: String(item.category ?? 'active'),
      body: String(item.steps ?? ''),
      sidebar: [
        { label: 'Category', value: String(item.category ?? '—') },
        { label: 'Updated', value: String(item.updated ?? '—') },
        { label: 'Steps', value: `${String(item.steps ?? '').split('→').length}` },
      ],
      incidents: [],
      fields: [],
    });
    runbooksDrill.open(id);
  };

  const openArticle = (id: string): void => {
    const item = articles.find(c => c.id === id);
    if (!item) { knowledgeDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.topic ?? ''),
      status: String(item.topic ?? 'active'),
      body: String(item.body ?? ''),
      sidebar: [
        { label: 'Topic', value: String(item.topic ?? '—') },
        { label: 'Citations', value: `${Number(item.citations ?? 0)} this month` },
        { label: 'Updated', value: String(item.updated ?? '—') },
      ],
      incidents: [],
      fields: [],
    });
    knowledgeDrill.open(id);
  };

  const openIncident = (id: string): void => {
    const item = incidents.find(c => c.id === id);
    if (!item) { incidentsDrill.open(id); return; }
    const sev = String(item.severity ?? 'ok');
    const sevLevel: 'low' | 'medium' | 'high' = sev === 'danger' ? 'high' : sev === 'warn' ? 'medium' : 'low';
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.when ?? ''),
      status: sev,
      body: String(item.resolution ?? ''),
      sidebar: [
        { label: 'When', value: String(item.when ?? '—') },
        { label: 'Severity', value: sev },
      ],
      incidents: [{ severity: sevLevel, title: String(item.title ?? 'Incident'), at: String(item.when ?? '') }],
      fields: [],
    });
    incidentsDrill.open(id);
  };

  const Runbooks = () => {
    return (
      <div className="p-7">
        <SectionHead title="Runbooks" subtitle="The operating procedures your agents follow" />
        <CMSCardList<RunbookItem>
          collectionId="runbooks"
          onOpen={openRunbook}
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
    return (
      <div className="p-7">
        <SectionHead title="Knowledge base" subtitle="Answers your agents cite — one shared page template (CMS-driven)" />
        <CMSCardList<ArticleItem>
          collectionId="articles"
          onOpen={openArticle}
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
    return (
      <div className="p-7">
        <SectionHead title="Incidents" subtitle="What the ops watchdog caught" />
        <CMSCardList<IncidentItem>
          collectionId="incidents"
          onOpen={openIncident}
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

  return (
    <>
      <AppFrame title="Operations" subtitle="Batman domain" icon={ClipboardList} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="operations"
          accent="#4f46e5"
          onBack={() => setDetail(null)}
          motion={{ kind: 'fade-up', durationMs: 200 }}
        >
          <OperationsDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
    </>
  );
}
