import { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, AlertOctagon, BookText, GraduationCap, FileWarning, ShieldCheck, Network, Workflow, Gauge, GitBranch, Siren, Plus, CheckCircle2, ShieldAlert, GitMerge } from 'lucide-react';
import { OntologySection } from '../_ui/ontology/OntologySection';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
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
  const processesDrill = useCollectionDrill('processes', 'Processus');
  const benchmarksDrill = useCollectionDrill('benchmarks', 'Benchmarks');
  const changesDrill = useCollectionDrill('changes', 'Changements');
  const alertsDrill = useCollectionDrill('alerts', 'Alertes');
  const runbooks = useCmsStore(s => s.items['runbooks']) ?? [];
  const articles = useCmsStore(s => s.items['articles']) ?? [];
  const incidents = useCmsStore(s => s.items['incidents']) ?? [];
  const changes = useCmsStore(s => s.items['changes']) ?? [];
  const alerts = useCmsStore(s => s.items['alerts']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const addItem = useCmsStore(s => s.addItem);
  const addToast = useShellStore(s => s.addToast);
  const [detail, setDetail] = useState<OperationsDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  /* Brief-F — couche d'écriture. Une mutation par surface :
   *   - alerts   : ack (raw → triaged)              — mutation au plus utile
   *   - changes  : approve / reject (proposed → …)  — file d'attente humaine
   *   - alerts   : composeur d'alerte               — addItem
   * Les toasts globaux rendent le résultat visible. Les mutations CMS sont
   * optimistes : `updateItem` fait l'écriture locale d'abord puis persiste.
   * En cas d'échec, le rollback est une nouvelle mutation inverse — le toast
   * d'erreur porte le message. */
  const acknowledgeAlert = (id: string): void => {
    const current = (alerts as Array<Record<string, unknown>>).find((a) => a.id === id);
    if (!current) return;
    if (current.enrichment === 'enriched') {
      addToast({ source: 'Operations', type: 'info', message: 'Alerte déjà enrichie — triage déjà fait.' });
      return;
    }
    updateItem('alerts', id, { enrichment: 'enriched', status: 'triage en cours' });
    addToast({ source: 'Operations', type: 'success', message: 'Alerte acquittée — triage marqué.' });
  };

  const decideChange = (id: string, decision: 'approved' | 'rejected'): void => {
    const current = (changes as Array<Record<string, unknown>>).find((c) => c.id === id);
    if (!current) return;
    if (current.status === decision) {
      addToast({ source: 'Operations', type: 'info', message: `Déjà ${decision}.` });
      return;
    }
    updateItem('changes', id, { status: decision });
    addToast({
      source: 'Operations',
      type: decision === 'approved' ? 'success' : 'warning',
      message: `Changement ${decision === 'approved' ? 'approuvé' : 'rejeté'}.`,
    });
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerSeverity, setComposerSeverity] = useState<'ok' | 'warn' | 'danger'>('warn');
  const [composerSource, setComposerSource] = useState('');

  const [changeComposerOpen, setChangeComposerOpen] = useState(false);
  const [changeTitle, setChangeTitle] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [changeWhy, setChangeWhy] = useState('');
  const [changeRisk, setChangeRisk] = useState<'low' | 'med' | 'high'>('low');
  const [changePolicy, setChangePolicy] = useState('');
  const [changeProposedBy, setChangeProposedBy] = useState('human:ops');

  const submitNewChange = (): void => {
    const title = changeTitle.trim();
    if (title.length === 0) {
      addToast({ source: 'Operations', type: 'warning', message: 'Le titre est obligatoire.' });
      return;
    }
    const result = addItem('changes', {
      title,
      summary: changeSummary.trim() || title,
      why: changeWhy.trim() || '—',
      risk: changeRisk,
      policy: changePolicy.trim() || '—',
      status: 'proposed',
      proposedBy: changeProposedBy.trim() || 'human:ops',
    });
    if (result.ok) {
      addToast({ source: 'Operations', type: 'success', message: `Changement proposé : ${title}` });
      setChangeTitle('');
      setChangeSummary('');
      setChangeWhy('');
      setChangeRisk('low');
      setChangePolicy('');
      setChangeComposerOpen(false);
    } else {
      addToast({ source: 'Operations', type: 'warning', message: result.error ?? 'Création impossible.' });
    }
  };

  const cancelChangeComposer = (): void => {
    setChangeTitle('');
    setChangeSummary('');
    setChangeWhy('');
    setChangeRisk('low');
    setChangePolicy('');
    setChangeComposerOpen(false);
  };

  const submitNewAlert = (): void => {
    const title = composerTitle.trim();
    if (title.length === 0) {
      addToast({ source: 'Operations', type: 'warning', message: 'Le titre est obligatoire.' });
      return;
    }
    const result = addItem('alerts', {
      title,
      when: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      severity: composerSeverity,
      enrichment: 'enriched',
      source: composerSource.trim() || 'manual · ops',
      riskScore: '—',
      hypothesis: title,
      trace: '—',
    });
    if (result.ok) {
      addToast({ source: 'Operations', type: 'success', message: `Alerte ajoutée : ${title}` });
      setComposerTitle('');
      setComposerSource('');
      setComposerOpen(false);
    } else {
      addToast({ source: 'Operations', type: 'warning', message: result.error ?? 'Création impossible.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerTitle('');
    setComposerSource('');
    setComposerOpen(false);
  };

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  /* Ouverture d'une fiche.
   *
   * Le crumb de detail est publie par le seul effet sur `detail` ci-dessus,
   * via useWindowPage().setDetail. C'est ce que AppFrame.navigateToSection
   * lit pour fermer la fiche quand on change de section.
   *
   * Piege deja paye ailleurs (Marketplace) : appeler en plus
   * useCollectionDrill sur la MEME collection republie ce crumb partage
   * avec un `onBack` qui ne ferme que l'etat interne du drill, pas
   * l'overlay. Les trois drills concernes etaient morts par ailleurs
   * (absents du drillRegistry, donc leur overlay n'etait jamais rendu) :
   * ils sont retires. */
  const openRunbook = (id: string): void => {
    const item = runbooks.find(c => c.id === id);
    if (!item) return;
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Runbook sans titre'),
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
  };

  const openArticle = (id: string): void => {
    const item = articles.find(c => c.id === id);
    if (!item) return;
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Article sans titre'),
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
  };

  const openIncident = (id: string): void => {
    const item = incidents.find(c => c.id === id);
    if (!item) return;
    const sev = String(item.severity ?? 'ok');
    const sevLevel: 'low' | 'medium' | 'high' = sev === 'danger' ? 'high' : sev === 'warn' ? 'medium' : 'low';
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Incident sans titre'),
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
  };

  const Runbooks = () => {
    return (
      <div className="p-7">
        <SectionHead title="Runbooks" subtitle="The operating procedures your agents follow" />
        <CollectionRepeater collectionId="runbooks" onOpen={openRunbook} />
      </div>
    );
  };

  const Knowledge = () => {
    return (
      <div className="p-7">
        <SectionHead title="Knowledge base" subtitle="Answers your agents cite — one shared page template (CMS-driven)" />
        <CollectionRepeater collectionId="articles" onOpen={openArticle} />
      </div>
    );
  };

  const Incidents = () => {
    return (
      <div className="p-7">
        <SectionHead title="Incidents" subtitle="What the ops watchdog caught" />
        <CollectionRepeater collectionId="incidents" onOpen={openIncident} />
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
        <CollectionRepeater collectionId="processes" onOpen={processesDrill.open} />
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
        <CollectionRepeater collectionId="benchmarks" onOpen={benchmarksDrill.open} />
      </div>
    );
  };

  const Changements = () => {
    const proposedCount = changes.filter((c) => c.status === 'proposed').length;
    return (
      <div className="p-7">
        <SectionHead
          title="Changements"
          subtitle="File des modifications proposees par les agents, en attente de decision humaine"
          action={
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.16em]"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)', color: 'var(--theme-text-dim)' }}
              >
                <GitMerge className="w-3 h-3" /> {proposedCount} en attente
              </span>
              {!changeComposerOpen ? (
                <button
                  type="button"
                  onClick={() => setChangeComposerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: ACCENT, color: '#ffffff' }}
                  aria-label="Proposer un changement"
                  data-propose-change
                >
                  <Plus className="w-3.5 h-3.5" />
                  Proposer
                </button>
              ) : null}
            </div>
          }
        />
        {changeComposerOpen ? (
          <div
            className="mb-5 rounded-xl border p-4"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
          >
            <label
              className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="ops-change-title"
            >
              Titre du changement
            </label>
            <input
              id="ops-change-title"
              autoFocus
              value={changeTitle}
              onChange={(e) => setChangeTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewChange();
                if (e.key === 'Escape') cancelChangeComposer();
              }}
              placeholder="ex. Add tag-based search to the vault"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <label
              className="mt-3 block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="ops-change-summary"
            >
              Résumé (court)
            </label>
            <input
              id="ops-change-summary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewChange();
                if (e.key === 'Escape') cancelChangeComposer();
              }}
              placeholder="Une phrase qui dit le quoi"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <label
              className="mt-3 block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="ops-change-why"
            >
              Pourquoi (1-3 phrases)
            </label>
            <textarea
              id="ops-change-why"
              value={changeWhy}
              onChange={(e) => setChangeWhy(e.target.value)}
              rows={3}
              placeholder="Contexte, signal déclencheur, gain attendu"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 resize-y"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="ops-change-risk"
                >
                  Risque
                </label>
                <select
                  id="ops-change-risk"
                  value={changeRisk}
                  onChange={(e) => setChangeRisk(e.target.value as 'low' | 'med' | 'high')}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
                >
                  <option value="low">low</option>
                  <option value="med">med</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="ops-change-policy"
                >
                  Policy ADR
                </label>
                <input
                  id="ops-change-policy"
                  value={changePolicy}
                  onChange={(e) => setChangePolicy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewChange();
                    if (e.key === 'Escape') cancelChangeComposer();
                  }}
                  placeholder="ex. ADR-OPS-013"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </div>
              <div>
                <label
                  className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="ops-change-proposedby"
                >
                  Proposed by
                </label>
                <input
                  id="ops-change-proposedby"
                  value={changeProposedBy}
                  onChange={(e) => setChangeProposedBy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewChange();
                    if (e.key === 'Escape') cancelChangeComposer();
                  }}
                  placeholder="ex. human:ops"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelChangeComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'transparent', color: 'var(--theme-text-dim)', border: '1px solid var(--panel-border)' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitNewChange}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
              >
                Soumettre le changement
              </button>
            </div>
          </div>
        ) : null}
        {changes.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 px-5 text-center"
            style={{ borderColor: 'var(--panel-border)', color: 'var(--theme-text-muted)' }}
          >
            <div className="text-[13px]">Aucun changement proposé pour l'instant.</div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-dim)' }}>
              Quand un agent propose un changement, il atterrit ici pour décision humaine.
            </div>
            {!changeComposerOpen ? (
              <button
                type="button"
                onClick={() => setChangeComposerOpen(true)}
                className="mt-1 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
                data-propose-change-empty
              >
                <Plus className="w-3 h-3" />
                Proposer le premier changement
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(changes as ChangeItem[]).map((c) => {
              const tone = CHANGE_TONE[c.status];
              const toneBg: Record<string, string> = { accent: '#dbeafe', ok: '#dcfce7', warn: '#fef3c7', danger: '#fee2e2', neutral: '#f5f5f4' };
              const toneFg: Record<string, string> = { accent: '#1d4ed8', ok: '#15803d', warn: '#b45309', danger: '#b91c1c', neutral: '#57534e' };
              return (
                <div
                  key={String(c.id)}
                  className="rounded-2xl border shadow-sm p-4 flex flex-col gap-2"
                  style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: ACCENT }}>
                      <GitBranch className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-[14px] font-bold flex-1 min-w-[9rem]" style={{ color: 'var(--theme-text)' }}>{c.title}</span>
                        <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: toneFg[tone], background: toneBg[tone] }}>{c.status}</span>
                      </div>
                      <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{c.summary}</div>
                    </div>
                  </div>
                  <p className="text-[12px] leading-snug line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                    {c.why.split('.')[0] ?? c.why}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                    <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                      risk <span className="font-semibold tabular-nums" style={{ color: 'var(--theme-text)' }}>{c.risk}</span>
                      <span className="mx-2">·</span>
                      {c.policy} · {c.proposedBy}
                    </span>
                    {c.status === 'proposed' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => decideChange(String(c.id), 'approved')}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90"
                          style={{ background: 'rgba(22,163,74,0.14)', color: '#15803d', border: '1px solid #86efac' }}
                          aria-label={`Approuver ${c.title}`}
                        >
                          <CheckCircle2 className="w-3 h-3" /> approuver
                        </button>
                        <button
                          type="button"
                          onClick={() => decideChange(String(c.id), 'rejected')}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90"
                          style={{ background: 'rgba(220,38,38,0.14)', color: '#b91c1c', border: '1px solid #fca5a5' }}
                          aria-label={`Rejeter ${c.title}`}
                        >
                          <ShieldAlert className="w-3 h-3" /> rejeter
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const Alertes = () => {
    const rawCount = alerts.filter((a) => a.enrichment === 'raw').length;
    return (
      <div className="p-7">
        <SectionHead
          title="Alertes"
          subtitle="Incidents pre-enrichis a froid — traces, extrait de log, hypothese et risque deja poses"
          action={
            <button
              type="button"
              onClick={() => setComposerOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: ACCENT,
                color: '#ffffff',
              }}
              aria-label="Ajouter une alerte"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          }
        />
        {composerOpen ? (
          <div
            className="mb-5 rounded-xl border p-4"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
          >
            <label
              className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="ops-alert-title"
            >
              Titre de l'alerte
            </label>
            <input
              id="ops-alert-title"
              autoFocus
              value={composerTitle}
              onChange={(e) => setComposerTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewAlert();
                if (e.key === 'Escape') cancelComposer();
              }}
              placeholder="Décrire l'incident…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="ops-alert-severity"
                >
                  Sévérité
                </label>
                <select
                  id="ops-alert-severity"
                  value={composerSeverity}
                  onChange={(e) => setComposerSeverity(e.target.value as 'ok' | 'warn' | 'danger')}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
                >
                  <option value="ok">ok</option>
                  <option value="warn">warn</option>
                  <option value="danger">danger</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
                  style={{ color: 'var(--theme-text-dim)' }}
                  htmlFor="ops-alert-source"
                >
                  Source
                </label>
                <input
                  id="ops-alert-source"
                  value={composerSource}
                  onChange={(e) => setComposerSource(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNewAlert();
                    if (e.key === 'Escape') cancelComposer();
                  }}
                  placeholder="ex. manual · ops"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'transparent', color: 'var(--theme-text-dim)', border: '1px solid var(--panel-border)' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitNewAlert}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
              >
                Ajouter l'alerte
              </button>
            </div>
          </div>
        ) : null}
        {rawCount > 0 ? (
          <div
            className="mb-4 rounded-xl border p-3 text-[12px]"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: '#fcd34d', color: '#92400e' }}
          >
            <span className="font-extrabold uppercase tracking-wider">{rawCount}</span> alerte{rawCount > 1 ? 's' : ''} non acquittée{rawCount > 1 ? 's' : ''} — cliquer "Trier" sur la fiche pour acquitter.
          </div>
        ) : null}
        {alerts.length === 0 ? (
          <div className="text-center text-[12px] py-8" style={{ color: 'var(--theme-text-dim)' }}>No items yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(alerts as AlertItem[]).map((a) => {
              const sevTone = a.severity === 'danger' ? 'danger' : a.severity === 'warn' ? 'warn' : 'ok';
              const sevAccent = a.severity === 'danger' ? '#dc2626' : a.severity === 'warn' ? '#f59e0b' : '#16a34a';
              const sevLabel = a.severity === 'danger' ? 'high' : a.severity === 'warn' ? 'medium' : 'low';
              const envTone = ENRICHMENT_TONE[a.enrichment];
              const envBg: Record<string, string> = { ok: '#dcfce7', warn: '#fef3c7', danger: '#fee2e2', accent: '#dbeafe', neutral: '#f5f5f4' };
              const envFg: Record<string, string> = { ok: '#15803d', warn: '#b45309', danger: '#b91c1c', accent: '#1d4ed8', neutral: '#57534e' };
              return (
                <div
                  key={String(a.id)}
                  className="rounded-2xl border shadow-sm p-4 flex flex-col gap-2"
                  style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: sevAccent }}>
                      <Siren className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-[14px] font-bold flex-1 min-w-[9rem]" style={{ color: 'var(--theme-text)' }}>{a.title}</span>
                        <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: envFg[envTone], background: envBg[envTone] }}>{a.enrichment}</span>
                      </div>
                      <div className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{a.when} · {a.source}</div>
                    </div>
                  </div>
                  <p className="text-[12px] leading-snug line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
                    {a.hypothesis.split('.')[0] ?? a.hypothesis}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                    <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
                      severity <span className="font-semibold tabular-nums" style={{ color: 'var(--theme-text)' }}>{sevLabel}</span>
                      <span className="mx-2">·</span>
                      risk {a.riskScore} · {sevTone === 'danger' ? 'page on-call' : sevTone === 'warn' ? 'monitored' : 'clear'}
                    </span>
                    {a.enrichment === 'raw' ? (
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(String(a.id))}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90 shrink-0"
                        style={{ background: 'rgba(245,158,11,0.18)', color: '#b45309', border: '1px solid #fcd34d' }}
                        aria-label={`Acquitter ${a.title}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> trier
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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