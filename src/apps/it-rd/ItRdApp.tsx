import { useEffect, useMemo, useState } from 'react';
import { Cpu, FlaskConical, Rocket, Server, Network, ScrollText, Repeat, TrendingDown, LineChart, GitBranch, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import { OntologySection } from '../_ui/ontology/OntologySection';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { ThemedSectionHead } from './ThemedSectionHead';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { ItRdDetailPage, type ItRdDetailItem } from './ItRdDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { ItRdItemDetail } from './ItRdItemDetail';
import { registerItRdSeed } from './seed';

registerItemDetail('it-rd', ItRdItemDetail);
registerItRdSeed();

const ACCENT = '#7c3aed';

const STATE_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  stable: 'ok',
  ok: 'ok',
  drift: 'warn',
  stopped: 'danger',
  watch: 'warn',
};

const DRIFT_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  ok: 'ok',
  watch: 'warn',
  drift: 'warn',
  alert: 'danger',
};

const ACTION_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'> = {
  deploy: 'ok',
  drift: 'warn',
  lock: 'danger',
  eval: 'accent',
  correction: 'accent',
  rollback: 'danger',
  wake: 'neutral',
};

const EVAL_TYPE_TONE: Record<string, 'ok' | 'warn' | 'accent' | 'neutral'> = {
  auto: 'accent',
  review: 'warn',
};

export function ItRdApp() {
  const journalDrill = useCollectionDrill('it_journal', 'Journal');
  const loopsDrill = useCollectionDrill('it_loops', 'Boucles');
  const driftDrill = useCollectionDrill('it_drift', 'Drift');
  const evalsDrill = useCollectionDrill('it_evals', 'Evals');
  const [detail, setDetail] = useState<ItRdDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  /* Brief-F — couche d'écriture. Un humain doit pouvoir :
   *   1. acquitter une entrée de drift (severity = alert)
   *   2. poster une nouvelle entrée de journal (manuel + agent)
   * Les deux passent par `addItem` / `updateItem` du store CMS. Toast
   * global au résultat (succès, warning, info). */
  const addToast = useShellStore(s => s.addToast);
  const addItem = useCmsStore(s => s.addItem);
  const updateItem = useCmsStore(s => s.updateItem);

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);
  const experiments = useCmsStore(s => s.items['it_experiments']) ?? [];
  const services = useCmsStore(s => s.items['services']) ?? [];
  const deploys = useCmsStore(s => s.items['deploys']) ?? [];
  const journal = useCmsStore(s => s.items['it_journal']) ?? [];
  const loops = useCmsStore(s => s.items['it_loops']) ?? [];
  const drift = useCmsStore(s => s.items['it_drift']) ?? [];
  const evals = useCmsStore(s => s.items['it_evals']) ?? [];
  const okCount = useCmsStore(s => (s.items['services'] ?? []).filter(x => x.status === 'ok').length);
  const totalServices = useCmsStore(s => s.items['services']?.length ?? 0);

  const acknowledgeDrift = (id: string): void => {
    const current = (drift as Array<Record<string, unknown>>).find((d) => d.id === id);
    if (!current) return;
    if (current.severity === 'ok') {
      addToast({ source: 'IT/R&D', type: 'info', message: 'Déjà nominal.' });
      return;
    }
    updateItem('it_drift', id, { severity: 'ok' });
    addToast({ source: 'IT/R&D', type: 'success', message: 'Drift acquitté — marqué ok.' });
  };

  /* Experiments kanban — order declared once so the loop terminates cleanly. */
  const EXP_STAGE_NEXT: Record<string, string | null> = {
    idea: 'building',
    building: 'shipped',
    shipped: null,
  };
  const EXP_STAGE_ACCENT: Record<string, string> = {
    idea: '#a78bfa',
    building: '#7c3aed',
    shipped: '#16a34a',
  };
  const moveExpStage = (id: string, fromStage: string): void => {
    const next = EXP_STAGE_NEXT[fromStage];
    if (!next) {
      addToast({ source: 'IT/R&D', type: 'info', message: 'Déjà shipped — fin de la chaîne.' });
      return;
    }
    updateItem('it_experiments', id, { stage: next });
    addToast({ source: 'IT/R&D', type: 'success', message: `Expérience déplacée vers "${next}"` });
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerAction, setComposerAction] = useState<'note' | 'deploy' | 'drift' | 'lock' | 'eval' | 'correction' | 'rollback' | 'wake'>('note');

  const submitJournalEntry = (): void => {
    const title = composerTitle.trim();
    if (title.length === 0) {
      addToast({ source: 'IT/R&D', type: 'warning', message: 'Le titre est obligatoire.' });
      return;
    }
    const result = addItem('it_journal', {
      title,
      actor: 'human:ops',
      action: composerAction,
      entity: composerAction === 'deploy' ? 'manual deploy' : 'manual note',
      ts: new Date().toISOString().slice(0, 16).replace('T', ' '),
      outcome: 'recorded',
      projects: title,
      note: title,
    });
    if (result.ok) {
      addToast({ source: 'IT/R&D', type: 'success', message: `Journal mis à jour : ${title}` });
      setComposerTitle('');
      setComposerOpen(false);
    } else {
      addToast({ source: 'IT/R&D', type: 'warning', message: result.error ?? 'Création impossible.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerTitle('');
    setComposerOpen(false);
  };

  /* Ouverture d'une fiche.
   *
   * Deux pieges deja payes, tous deux corriges ici :
   *
   * 1. Le titre. Ces trois collections ne portent PAS de champ `title` :
   *    `services` titre sur `name`, `deploys` sur `commit` (cf. le
   *    `titleField` de leur definition dans lib/cms/seed.ts). Lire
   *    `item.title` renvoyait donc `undefined` et la fiche s'ouvrait sur
   *    « Untitled » — sur les 4 services et les 3 deploys, sans exception.
   *    Meme cause pour les champs annexes : `subtitle`, `sha`, `at`
   *    n'existent sur aucun des deux, d'ou une fiche vide sous un titre
   *    faux. On lit desormais les vraies cles.
   *
   * 2. Le crumb partage. L'app publie deja son crumb de detail via l'effet
   *    sur `detail` (useWindowPage().setDetail), et c'est ce que
   *    AppFrame.navigateToSection lit pour fermer la fiche quand on change
   *    de section. Appeler en plus useCollectionDrill sur la meme
   *    collection republie ce meme crumb avec un `onBack` qui ne ferme que
   *    l'etat interne du drill. Ces trois drills etaient morts par ailleurs
   *    (absents du drillRegistry, donc leur overlay n'etait jamais rendu) :
   *    ils sont retires. */
  const openService = (id: string): void => {
    const item = services.find(c => c.id === id);
    if (!item) return;
    const logsRaw = String(item.logs ?? '');
    const logs = logsRaw
      ? logsRaw.split('\n').filter(Boolean).slice(0, 20).map((line, i) => ({
          ts: `${String(i + 1).padStart(2, '0')}:00`,
          level: (line.toLowerCase().includes('error') ? 'error' : line.toLowerCase().includes('warn') ? 'warn' : 'info') as 'info' | 'warn' | 'error',
          line,
        }))
      : [{ ts: '00:00', level: 'info' as const, line: String(item.detail ?? item.note ?? 'Aucun log enregistre pour ce service.') }];
    setDetail({
      id: String(item.id),
      title: String(item.name ?? 'Service sans nom'),
      subtitle: String(item.note ?? ''),
      status: String(item.status ?? 'ok'),
      logs,
      deploys: [],
      fields: [],
    });
  };

  const openExperiment = (id: string): void => {
    const item = experiments.find(c => c.id === id);
    if (!item) return;
    const logs = item.stage
      ? [{ ts: '00:00', level: 'info' as const, line: `Stage: ${String(item.stage)}` }]
      : [];
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Experiment sans titre'),
      subtitle: String(item.meta ?? ''),
      status: String(item.stage ?? 'idea'),
      logs: item.notes
        ? [...logs, { ts: '00:01', level: 'info' as const, line: String(item.notes) }]
        : logs,
      deploys: [],
      fields: [],
    });
  };

  const openDeploy = (id: string): void => {
    const item = deploys.find(c => c.id === id);
    if (!item) return;
    const status = String(item.status ?? 'live');
    const normalised: 'live' | 'rolled-back' | 'building' =
      status === 'rolled-back' ? 'rolled-back'
      : status === 'rolling' || status === 'building' ? 'building'
      : 'live';
    const commit = String(item.commit ?? id);
    const target = String(item.target ?? '');
    const when = String(item.when ?? '');
    setDetail({
      id: String(item.id),
      title: commit,
      subtitle: target,
      status,
      logs: [{ ts: '00:00', level: 'info', line: `${commit} → ${target || 'cible inconnue'}${when ? ` (${when})` : ''}` }],
      deploys: [{ sha: commit, at: when, status: normalised }],
      fields: [],
    });
  };

  const Kernel = () => {
    return (
      <div className="p-7">
        <ThemedSectionHead title="IT Software Kernel" subtitle="Live service health" action={<Badge tone="ok">{okCount} / {totalServices} nominal</Badge>} />
        <CollectionRepeater collectionId="services" onOpen={openService} />
      </div>
    );
  };

  const Experiments = () => {
    const byStage = (stage: string) => experiments.filter(e => e.stage === stage);
    return (
      <div className="p-7 h-full flex flex-col">
        <ThemedSectionHead title="Experiments" subtitle="R&D board" />
        <div className="flex-1 min-h-0">
          <KanbanBoard columns={[
            { title: 'Idea', accent: '#a78bfa', items: byStage('idea').map(e => (
              <ExperimentCard key={String(e.id)} item={e} borderAccent="#a78bfa" />
            )) },
            { title: 'Building', accent: ACCENT, items: byStage('building').map(e => (
              <ExperimentCard key={String(e.id)} item={e} borderAccent={ACCENT} />
            )) },
            { title: 'Shipped', accent: '#16a34a', items: byStage('shipped').map(e => (
              <ExperimentCard key={String(e.id)} item={e} borderAccent="#16a34a" />
            )) },
          ]} />
        </div>
      </div>
    );
  };

  const ExperimentCard = ({ item, borderAccent }: { item: Record<string, unknown>; borderAccent: string }) => {
    const stage = String(item.stage ?? 'idea');
    const nextStage = EXP_STAGE_NEXT[stage];
    const nextAccent = nextStage ? EXP_STAGE_ACCENT[nextStage] : borderAccent;
    return (
      <div
        className="rounded-lg border p-3 shadow-sm transition-all"
        style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
      >
        <button
          type="button"
          onClick={() => openExperiment(String(item.id))}
          className="w-full text-left"
        >
          <span className="block w-8 h-1 rounded-full mb-2" style={{ background: borderAccent }} />
          <div className="text-sm font-semibold leading-snug" style={{ color: 'var(--theme-text)' }}>{String(item.title ?? '')}</div>
          <div className="text-xs text-[var(--theme-text-dim)] mt-1">{String(item.meta ?? '')}</div>
        </button>
        <div className="mt-2 flex items-center justify-between gap-1 pt-2 border-t" style={{ borderColor: 'var(--panel-border-subtle)' }}>
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">{stage}</span>
          {nextStage ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); moveExpStage(String(item.id), stage); }}
              data-move-exp-stage={String(item.id)}
              className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-white px-1.5 py-0.5 rounded transition-all hover:opacity-90"
              style={{ background: nextAccent }}
              title={`Passer de "${stage}" à "${nextStage}"`}
            >
              <ChevronRight className="w-2.5 h-2.5" /> {nextStage}
            </button>
          ) : (
            <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--theme-text-dim)]">shipped</span>
          )}
        </div>
      </div>
    );
  };

  const Deploys = () => {
    return (
      <div className="p-7">
        <ThemedSectionHead title="Deploys" subtitle="Recent shipments" />
        <CollectionRepeater collectionId="deploys" onOpen={openDeploy} />
      </div>
    );
  };

  const Journal = () => {
    const sortedEntries = useMemo(
      () => [...journal].sort((a, b) => String(b.ts ?? '').localeCompare(String(a.ts ?? ''))),
      [journal]
    );
    const latest = sortedEntries[0];

    return (
      <div className="p-7 h-full flex flex-col gap-5">
        <ThemedSectionHead
          title="Journal"
          subtitle="Append-only log of every act by humans and agents. The latest snapshot is the projected state."
          action={
            <div className="flex items-center gap-2">
              <Badge tone="accent">{journal.length} entries</Badge>
              <button
                type="button"
                onClick={() => setComposerOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.16em] transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
                aria-label="Ajouter une entrée de journal"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </button>
            </div>
          }
        />

        {composerOpen ? (
          <div
            className="rounded-xl border p-4"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
          >
            <label
              className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="it-journal-title"
            >
              Titre de l'entrée
            </label>
            <input
              id="it-journal-title"
              autoFocus
              value={composerTitle}
              onChange={(e) => setComposerTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitJournalEntry();
                if (e.key === 'Escape') cancelComposer();
              }}
              placeholder="Décrire l'événement…"
              className="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <label
              className="mt-3 block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="it-journal-action"
            >
              Action
            </label>
            <select
              id="it-journal-action"
              value={composerAction}
              onChange={(e) => setComposerAction(e.target.value as typeof composerAction)}
              className="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            >
              <option value="note">note</option>
              <option value="deploy">deploy</option>
              <option value="drift">drift</option>
              <option value="lock">lock</option>
              <option value="eval">eval</option>
              <option value="correction">correction</option>
              <option value="rollback">rollback</option>
              <option value="wake">wake</option>
            </select>
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
                onClick={submitJournalEntry}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
              >
                Pousser l'entrée
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
          <section
            className="lg:col-span-3 rounded-2xl border overflow-hidden flex flex-col"
            style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)' }}
          >
            <header
              className="px-4 py-2.5 flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider"
              style={{ background: 'var(--canvas)', color: 'var(--theme-muted)', borderBottom: '1px solid var(--panel-border)' }}
            >
              <span className="flex items-center gap-2">
                <ScrollText className="w-3.5 h-3.5" />
                log.stream — append-only
              </span>
              <span>{sortedEntries.length} events</span>
            </header>
            <ul className="flex-1 overflow-y-auto custom-scrollbar divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
              {sortedEntries.map((entry) => {
                const action = String(entry.action ?? 'note');
                const actionTone = ACTION_TONE[action] ?? 'neutral';
                const actionBg: Record<string, string> = {
                  ok: '#dcfce7', warn: '#fef3c7', danger: '#fee2e2', accent: '#ede9fe', neutral: '#f5f5f4',
                };
                const actionFg: Record<string, string> = {
                  ok: '#15803d', warn: '#b45309', danger: '#b91c1c', accent: '#6d28d9', neutral: '#57534e',
                };
                return (
                  <li key={String(entry.id)} style={{ borderColor: 'var(--panel-border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => journalDrill.open(String(entry.id))}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[var(--theme-surface-hover)]"
                    >
                      <span
                        className="mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: actionBg[actionTone], color: actionFg[actionTone] }}
                      >
                        {action}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--theme-text)' }}>
                            {String(entry.title ?? '—')}
                          </span>
                          <span className="text-[10.5px] font-mono" style={{ color: 'var(--theme-muted)' }}>
                            {String(entry.ts ?? '')}
                          </span>
                        </div>
                        <div className="mt-1 text-[11.5px]" style={{ color: 'var(--theme-muted)' }}>
                          <span className="font-mono">{String(entry.actor ?? 'unknown')}</span>
                          <span className="mx-1.5">·</span>
                          <span>touched {String(entry.entity ?? '—')}</span>
                          <span className="mx-1.5">·</span>
                          <span>outcome: {String(entry.outcome ?? '—')}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            className="lg:col-span-2 rounded-2xl border overflow-hidden flex flex-col"
            style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)' }}
          >
            <header
              className="px-4 py-2.5 flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider"
              style={{ background: 'var(--canvas)', color: 'var(--theme-muted)', borderBottom: '1px solid var(--panel-border)' }}
            >
              <span className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                projected.state
              </span>
              <span>replay this log to recover</span>
            </header>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              {latest ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                      Latest event
                    </div>
                    <div className="mt-1 text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {String(latest.title ?? '—')}
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--theme-muted)' }}>
                      {String(latest.ts ?? '')} · {String(latest.actor ?? 'unknown')}
                    </div>
                  </div>
                  <div
                    className="rounded-lg px-3 py-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-line"
                    style={{ background: 'var(--canvas)', color: 'var(--theme-text)' }}
                  >
                    {String(latest.projects ?? '— no projection recorded')}
                  </div>
                  <div className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-muted)' }}>
                    Replay the stream from the top to recover this state. The log is the source of truth — the projection is what you get if you apply every event in order.
                  </div>
                </div>
              ) : (
                <div className="text-[12px]" style={{ color: 'var(--theme-muted)' }}>
                  No events recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const Boucles = () => {
    const stableCount = loops.filter(l => l.state === 'stable').length;
    const driftCount = loops.filter(l => l.state === 'drift').length;
    return (
      <div className="p-7">
        <ThemedSectionHead
          title="Boucles"
          subtitle="Feedback loops with their 4 organs. No loop, no metric to act on."
          action={
            <div className="flex items-center gap-2">
              <Badge tone="ok">{stableCount} stable</Badge>
              <Badge tone="warn">{driftCount} drift</Badge>
            </div>
          }
        />
        <CollectionRepeater collectionId="it_loops" onOpen={loopsDrill.open} />
      </div>
    );
  };

  const [driftComposerOpen, setDriftComposerOpen] = useState(false);
  const [driftName, setDriftName] = useState('');
  const [driftMetric, setDriftMetric] = useState('');
  const [driftReference, setDriftReference] = useState('');
  const [driftCurrent, setDriftCurrent] = useState('');
  const [driftThreshold, setDriftThreshold] = useState('');
  const [driftSeverity, setDriftSeverity] = useState<'ok' | 'watch' | 'drift' | 'alert'>('drift');

  const submitNewDrift = (): void => {
    const name = driftName.trim();
    if (name.length === 0) {
      addToast({ source: 'IT/R&D', type: 'warning', message: 'Le nom est obligatoire.' });
      return;
    }
    const result = addItem('it_drift', {
      name,
      metric: driftMetric.trim() || '—',
      reference: driftReference.trim() || '0',
      current: driftCurrent.trim() || '0',
      threshold: driftThreshold.trim() || '—',
      severity: driftSeverity,
      unit: '',
      method: 'manual',
      note: '',
      detected: new Date().toISOString().slice(0, 10),
    });
    if (result.ok) {
      addToast({ source: 'IT/R&D', type: 'success', message: `Drift ajouté : ${name}` });
      setDriftName('');
      setDriftMetric('');
      setDriftReference('');
      setDriftCurrent('');
      setDriftThreshold('');
      setDriftSeverity('drift');
      setDriftComposerOpen(false);
    } else {
      addToast({ source: 'IT/R&D', type: 'warning', message: result.error ?? 'Création impossible.' });
    }
  };

  const cancelDriftComposer = (): void => {
    setDriftName('');
    setDriftMetric('');
    setDriftReference('');
    setDriftCurrent('');
    setDriftThreshold('');
    setDriftSeverity('drift');
    setDriftComposerOpen(false);
  };

  const Drift = () => {
    const driftCount = drift.filter(d => d.severity === 'drift' || d.severity === 'alert').length;
    return (
      <div className="p-7">
        <ThemedSectionHead
          title="Drift"
          subtitle="Gap between the model spec and the actual behavior. Cross the threshold, get alerted."
          action={
            <div className="flex items-center gap-2">
              <Badge tone={driftCount > 0 ? 'warn' : 'ok'}>{driftCount} above threshold</Badge>
              {!driftComposerOpen ? (
                <button
                  type="button"
                  onClick={() => setDriftComposerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.16em] transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: ACCENT, color: '#ffffff' }}
                  aria-label="Ajouter un drift"
                  data-add-drift
                >
                  <Plus className="w-3 h-3" />
                  Ajouter
                </button>
              ) : null}
            </div>
          }
        />
        {driftComposerOpen ? (
          <div
            className="mb-5 rounded-xl border p-4"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
          >
            <label
              className="block text-[10.5px] font-extrabold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="it-drift-name"
            >
              Nom du drift
            </label>
            <input
              id="it-drift-name"
              autoFocus
              value={driftName}
              onChange={(e) => setDriftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewDrift();
                if (e.key === 'Escape') cancelDriftComposer();
              }}
              placeholder="ex. quiz latency"
              className="w-full rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2"
              style={{ background: 'var(--theme-bg)', border: '1px solid var(--panel-border)', color: 'var(--theme-text)' }}
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>Métrique</span>
                <input
                  value={driftMetric}
                  onChange={(e) => setDriftMetric(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewDrift(); if (e.key === 'Escape') cancelDriftComposer(); }}
                  placeholder="ex. p95 latency (ms)"
                  className="text-[12px] font-mono rounded-lg border px-2.5 py-1.5 outline-none"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>Severité</span>
                <select
                  value={driftSeverity}
                  onChange={(e) => setDriftSeverity(e.target.value as 'ok' | 'watch' | 'drift' | 'alert')}
                  className="text-[12px] font-mono rounded-lg border px-2.5 py-1.5 outline-none"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }}
                >
                  <option value="ok">ok</option>
                  <option value="watch">watch</option>
                  <option value="drift">drift</option>
                  <option value="alert">alert</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>Reference</span>
                <input
                  value={driftReference}
                  onChange={(e) => setDriftReference(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewDrift(); if (e.key === 'Escape') cancelDriftComposer(); }}
                  placeholder="ex. 800"
                  className="text-[12px] font-mono rounded-lg border px-2.5 py-1.5 outline-none"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>Current</span>
                <input
                  value={driftCurrent}
                  onChange={(e) => setDriftCurrent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewDrift(); if (e.key === 'Escape') cancelDriftComposer(); }}
                  placeholder="ex. 1200"
                  className="text-[12px] font-mono rounded-lg border px-2.5 py-1.5 outline-none"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-text-dim)' }}>Threshold</span>
                <input
                  value={driftThreshold}
                  onChange={(e) => setDriftThreshold(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewDrift(); if (e.key === 'Escape') cancelDriftComposer(); }}
                  placeholder="ex. 1000"
                  className="text-[12px] font-mono rounded-lg border px-2.5 py-1.5 outline-none"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--panel-border)', color: 'var(--theme-text)' }}
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelDriftComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'transparent', color: 'var(--theme-text-dim)', border: '1px solid var(--panel-border)' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitNewDrift}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
              >
                Ajouter le drift
              </button>
            </div>
          </div>
        ) : null}
        {drift.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 px-5 text-center"
            style={{ borderColor: 'var(--panel-border)', color: 'var(--theme-text-muted)' }}
          >
            <div className="text-[13px]">Aucun drift enregistré.</div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-dim)' }}>
              Quand une métrique dépasse la spec, elle apparaît ici pour acquittement.
            </div>
            {!driftComposerOpen ? (
              <button
                type="button"
                onClick={() => setDriftComposerOpen(true)}
                className="mt-1 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: ACCENT, color: '#ffffff' }}
                data-add-drift-empty
              >
                <Plus className="w-3 h-3" />
                Ajouter le premier drift
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drift.map(entry => {
              const severity = String(entry.severity ?? 'ok');
            const tone = DRIFT_TONE[severity] ?? 'neutral';
            const toneBg: Record<string, string> = { ok: '#dcfce7', warn: '#fef3c7', danger: '#fee2e2', neutral: '#f5f5f4' };
            const toneFg: Record<string, string> = { ok: '#15803d', warn: '#b45309', danger: '#b91c1c', neutral: '#57534e' };
            const ref = Number(entry.reference);
            const cur = Number(entry.current);
            const ratio = !Number.isNaN(ref) && ref !== 0 && !Number.isNaN(cur) ? ((cur - ref) / Math.abs(ref)) * 100 : 0;
            const barPct = Math.max(8, Math.min(100, Math.abs(ratio) * 4));
            return (
              <div
                key={String(entry.id)}
                className="text-left rounded-2xl border bg-[var(--theme-surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)] cursor-pointer"
                style={{ borderColor: 'var(--panel-border)' }}
                onClick={() => driftDrill.open(String(entry.id))}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-bold text-[var(--theme-text)] leading-snug min-w-0 flex-1">
                    {String(entry.name ?? '—')}
                  </span>
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: toneBg[tone], color: toneFg[tone] }}
                  >
                    {severity}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-mono">
                  <span style={{ color: 'var(--theme-muted)' }}>ref</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--theme-text)' }}>
                    {String(entry.reference ?? '—')}
                  </span>
                  <span style={{ color: 'var(--theme-muted)' }}>→</span>
                  <span style={{ color: 'var(--theme-muted)' }}>now</span>
                  <span className="font-semibold tabular-nums" style={{ color: toneFg[tone] }}>
                    {String(entry.current ?? '—')}
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--theme-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barPct}%`,
                      background: tone === 'ok' ? '#16a34a' : tone === 'warn' ? '#f59e0b' : tone === 'danger' ? '#dc2626' : '#a8a29e',
                    }}
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--panel-border-subtle)] flex items-center justify-between gap-2 text-[10.5px] font-mono text-[var(--theme-text-dim)]">
                  <span className="truncate">{String(entry.metric ?? '—')}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span>alert at {String(entry.threshold ?? '—')}</span>
                    {severity !== 'ok' ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); acknowledgeDrift(String(entry.id)); }}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider transition-all hover:opacity-90"
                        style={{ background: 'rgba(22,163,74,0.18)', color: '#15803d', border: '1px solid #86efac' }}
                        aria-label={`Acquitter ${entry.name}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> acquitter
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  };

  const Evals = () => {
    const autoCount = evals.filter(e => e.evalType === 'auto').length;
    const reviewCount = evals.filter(e => e.evalType === 'review').length;
    return (
      <div className="p-7">
        <ThemedSectionHead
          title="Evals"
          subtitle="System evaluations. Auto = measured by the runner. Review = waiting for a human."
          action={
            <div className="flex items-center gap-2">
              <Badge tone="accent">{autoCount} auto</Badge>
              <Badge tone="warn">{reviewCount} awaiting review</Badge>
            </div>
          }
        />
        <CollectionRepeater collectionId="it_evals" onOpen={evalsDrill.open} />
      </div>
    );
  };

  /* ── Drill registry — every CMS drill for this app, in one place. Used
       both to render the dynamic detail at the top level (sibling of
       AppFrame, so the theme follows the top bar, not the sidebar) and to
       skip the section's inline view when another drill is open. */
  const drillRegistry = [
    { drill: journalDrill, collection: 'it_journal' as const },
    { drill: loopsDrill, collection: 'it_loops' as const },
    { drill: driftDrill, collection: 'it_drift' as const },
    { drill: evalsDrill, collection: 'it_evals' as const },
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
    { id: 'kernel', label: 'Kernel', icon: Server, render: Kernel },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, render: Experiments },
    { id: 'deploys', label: 'Deploys', icon: Rocket, render: Deploys },
    {
      id: 'journal',
      label: 'Journal',
      icon: ScrollText,
      render: Journal,
    },
    {
      id: 'boucles',
      label: 'Boucles',
      icon: Repeat,
      render: Boucles,
    },
    {
      id: 'drift',
      label: 'Drift',
      icon: TrendingDown,
      render: Drift,
    },
    {
      id: 'evals',
      label: 'Evals',
      icon: LineChart,
      render: Evals,
    },
    {
      id: 'ontology',
      label: 'Ontology',
      icon: Network,
      render: () => (
        <OntologySection
          accent={ACCENT}
          title="Les 13 entites du registre"
          subtitle="Vue technique : attributs types, portee, references. Source unique — lib/ontology."
        />
      ),
    },
  ];

  return (
    <>
      <AppFrame title="IT / R&D" subtitle="Cyborg domain" icon={Cpu} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="it-rd"
          accent="#7c3aed"
          onBack={() => setDetail(null)}
          motion={{ kind: 'type-in', durationMs: 280 }}
        >
          <ItRdDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
      {openDrillCollection !== null && openDrillId !== null ? (
        <AppDetailOverlay
          appId="it-rd"
          accent="#7c3aed"
          onBack={closeOpenDrill}
          motion={{ kind: 'type-in', durationMs: 280 }}
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
