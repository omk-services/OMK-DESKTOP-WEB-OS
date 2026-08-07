import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, AlertOctagon, BookText, GraduationCap, FileWarning, ShieldCheck, Network, Workflow, Gauge, GitBranch, Siren } from 'lucide-react';
import { OntologySection } from '../_ui/ontology/OntologySection';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { OperationsDetailPage, type OperationsDetailItem } from './OperationsDetailPage';
import { CMSCardList } from '../_ui/CMSCardList';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { OperationsItemDetail } from './OperationsItemDetail';
import { seedOperationsCms } from './seed';

seedOperationsCms();
registerItemDetail('operations', OperationsItemDetail);

const ACCENT = '#4f46e5';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Onboarding: <GraduationCap className="w-5 h-5" />,
  'Finance ops': <FileWarning className="w-5 h-5" />,
  Security: <ShieldCheck className="w-5 h-5" />,
  Support: <BookText className="w-5 h-5" />,
  Knowledge: <BookOpen className="w-5 h-5" />,
  Sales: <ClipboardList className="w-5 h-5" />,
};

const CATEGORY_TONE: Record<string, 'accent' | 'ok' | 'warn' | 'danger' | 'primary' | 'neutral'> = {
  Onboarding: 'accent',
  'Finance ops': 'warn',
  Security: 'danger',
  Support: 'ok',
  Knowledge: 'accent',
  Sales: 'accent',
};

const CATEGORY_ACCENT: Record<string, string> = {
  Onboarding: '#3b82f6',
  'Finance ops': '#f59e0b',
  Security: '#dc2626',
  Support: '#16a34a',
  Knowledge: '#4f46e5',
  Sales: '#ea580c',
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
  topic?: string;
  category?: string;
  reads: number;
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

interface ProcessItem extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  status: string;
  owner: string;
  inputs: string;
  outputs: string;
  dependsOn: string;
  cadence: string;
}

interface BenchmarkItem extends Record<string, unknown> {
  id: string;
  title: string;
  target: string;
  difficulty: string;
  passRate: number;
  lastRun: string;
  status: 'passed' | 'failed' | 'flaky';
  failureMode: string;
}

interface ChangeItem extends Record<string, unknown> {
  id: string;
  title: string;
  summary: string;
  why: string;
  risk: 'low' | 'med' | 'high';
  policy: string;
  status: 'proposed' | 'approved' | 'rejected';
  proposedBy: string;
}

interface AlertItem extends Record<string, unknown> {
  id: string;
  title: string;
  when: string;
  severity: 'ok' | 'warn' | 'danger';
  enrichment: 'enriched' | 'raw';
  source: string;
  riskScore: string;
  hypothesis: string;
  trace: string;
}

const BENCHMARK_TONE: Record<BenchmarkItem['status'], 'ok' | 'warn' | 'danger' | 'neutral'> = {
  passed: 'ok',
  failed: 'danger',
  flaky: 'warn',
};

const BENCHMARK_ACCENT: Record<BenchmarkItem['status'], string> = {
  passed: '#16a34a',
  failed: '#dc2626',
  flaky: '#f59e0b',
};

const CHANGE_TONE: Record<ChangeItem['status'], 'accent' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  proposed: 'accent',
  approved: 'ok',
  rejected: 'danger',
};

const ENRICHMENT_TONE: Record<AlertItem['enrichment'], 'ok' | 'warn'> = {
  enriched: 'ok',
  raw: 'warn',
};

export function OperationsApp() {
  const runbooksDrill = useCollectionDrill('runbooks', 'Runbooks');
  const knowledgeDrill = useCollectionDrill('articles', 'Knowledge Base');
  const incidentsDrill = useCollectionDrill('incidents', 'Incidents');
  const processesDrill = useCollectionDrill('processes', 'Processus');
  const benchmarksDrill = useCollectionDrill('benchmarks', 'Benchmarks');
  const changesDrill = useCollectionDrill('changes', 'Changements');
  const alertsDrill = useCollectionDrill('alerts', 'Alertes');
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
      subtitle: String(item.category ?? item.topic ?? ''),
      status: String(item.category ?? item.topic ?? 'active'),
      body: String(item.body ?? ''),
      sidebar: [
        { label: 'Category', value: String(item.category ?? item.topic ?? '—') },
        { label: 'Citations', value: `${Number(item.reads ?? 0)} this month` },
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
            subtitle: a.category ?? a.topic ?? '',
            description: a.body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.slice(0, 160),
            statusLabel: a.category ?? a.topic ?? '',
            statusTone: 'accent',
            accent: ACCENT,
            icon: <BookOpen className="w-5 h-5" />,
            metricLabel: 'citations',
            metricValue: `${a.reads} this month`,
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

  const Processus = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Processus"
          subtitle="Cartographie des processus de l'organisation — qui depend de quoi, et quoi faire quand ca casse"
        />
        <CMSCardList<ProcessItem>
          collectionId="processes"
          cols={2}
          render={(p) => ({
            title: p.name,
            subtitle: `${p.cadence} · owner ${p.owner}`,
            description: `Inputs: ${p.inputs}`,
            statusLabel: p.category,
            statusTone: CATEGORY_TONE[p.category] ?? 'neutral',
            accent: CATEGORY_ACCENT[p.category] ?? ACCENT,
            icon: CATEGORY_ICON[p.category] ?? <Workflow className="w-5 h-5" />,
            metricLabel: 'depends on',
            metricValue: `${p.dependsOn.split('·').length} upstream`,
            meta: `outputs · ${p.outputs.split('·').length}`,
          })}
        />
      </div>
    );
  };

  const Benchmarks = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Benchmarks"
          subtitle="Les tests qui savent dire non — passe, echoue, instable"
        />
        <CMSCardList<BenchmarkItem>
          collectionId="benchmarks"
          cols={2}
          render={(b) => ({
            title: b.title,
            subtitle: `${b.difficulty} · last run ${b.lastRun}`,
            description: b.target,
            statusLabel: b.status,
            statusTone: BENCHMARK_TONE[b.status],
            accent: BENCHMARK_ACCENT[b.status],
            icon: <Gauge className="w-5 h-5" />,
            metricLabel: 'pass rate',
            metricValue: `${b.passRate}%`,
            meta: b.failureMode.split('.')[0] ?? '',
          })}
        />
      </div>
    );
  };

  const Changements = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Changements"
          subtitle="File des modifications proposees par les agents, en attente de decision humaine"
        />
        <CMSCardList<ChangeItem>
          collectionId="changes"
          cols={2}
          render={(c) => ({
            title: c.title,
            subtitle: c.summary,
            description: c.why.split('.')[0] ?? c.why,
            statusLabel: c.status,
            statusTone: CHANGE_TONE[c.status],
            accent: ACCENT,
            icon: <GitBranch className="w-5 h-5" />,
            metricLabel: 'risk',
            metricValue: c.risk,
            meta: `${c.policy} · ${c.proposedBy}`,
          })}
        />
      </div>
    );
  };

  const Alertes = () => {
    return (
      <div className="p-7">
        <SectionHead
          title="Alertes"
          subtitle="Incidents pre-enrichis a froid — traces, extrait de log, hypothese et risque deja poses"
        />
        <CMSCardList<AlertItem>
          collectionId="alerts"
          cols={2}
          render={(a) => {
            const sevTone = a.severity === 'danger' ? 'danger' : a.severity === 'warn' ? 'warn' : 'ok';
            const sevAccent = a.severity === 'danger' ? '#dc2626' : a.severity === 'warn' ? '#f59e0b' : '#16a34a';
            return {
              title: a.title,
              subtitle: `${a.when} · ${a.source}`,
              description: a.hypothesis.split('.')[0] ?? a.hypothesis,
              statusLabel: a.enrichment,
              statusTone: ENRICHMENT_TONE[a.enrichment],
              accent: sevAccent,
              icon: <Siren className="w-5 h-5" />,
              metricLabel: 'severity',
              metricValue: a.severity === 'danger' ? 'high' : a.severity === 'warn' ? 'medium' : 'low',
              meta: `risk ${a.riskScore} · ${sevTone === 'danger' ? 'page on-call' : sevTone === 'warn' ? 'monitored' : 'clear'}`,
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
    { drill: processesDrill, collection: 'processes' as const },
    { drill: benchmarksDrill, collection: 'benchmarks' as const },
    { drill: changesDrill, collection: 'changes' as const },
    { drill: alertsDrill, collection: 'alerts' as const },
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
    { id: 'runbooks', label: 'Runbooks', icon: ClipboardList, render: Runbooks },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, render: Knowledge },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon, render: Incidents },
    { id: 'processus', label: 'Processus', icon: Workflow, render: Processus },
    { id: 'benchmarks', label: 'Benchmarks', icon: Gauge, render: Benchmarks },
    { id: 'changements', label: 'Changements', icon: GitBranch, render: Changements },
    { id: 'alertes', label: 'Alertes', icon: Siren, render: Alertes },
    {
      id: 'context-layer',
      label: 'Context Layer',
      icon: Network,
      render: () => (
        <OntologySection
          accent={ACCENT}
          only={['SOP', 'Runbook', 'Incident', 'Routine', 'Skill']}
          showRelationCount
          title="La couche de contexte operationnel"
          subtitle="Les entites que l operation manipule, et leurs relations. Meme registre que it-rd et Ontology."
        />
      ),
    },
  ];

  return (
    <>
      <AppFrame title="Operations" subtitle="Batman domain" icon={ClipboardList} accent={ACCENT} sections={sections} canvasNuance={1} />
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
      {openDrillCollection !== null && openDrillId !== null ? (
        <AppDetailOverlay
          appId="operations"
          accent="#4f46e5"
          onBack={closeOpenDrill}
          motion={{ kind: 'fade-up', durationMs: 200 }}
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