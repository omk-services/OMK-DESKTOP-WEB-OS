import { useEffect, useMemo, useState } from 'react';
import { Cpu, FlaskConical, Rocket, Server, Network, ScrollText, Repeat, TrendingDown, LineChart, GitBranch } from 'lucide-react';
import { OntologySection } from '../_ui/ontology/OntologySection';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { ThemedSectionHead } from './ThemedSectionHead';
import { Badge } from '../_ui/kit';
import { KanbanBoard, KanbanCard } from '../_ui/widgets';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { useCmsStore } from '../../lib/cms/cms.store';
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
  const servicesDrill = useCollectionDrill('services', 'Kernel');
  const experimentsDrill = useCollectionDrill('it_experiments', 'Experiments');
  const deploysDrill = useCollectionDrill('deploys', 'Deploys');
  const journalDrill = useCollectionDrill('it_journal', 'Journal');
  const loopsDrill = useCollectionDrill('it_loops', 'Boucles');
  const driftDrill = useCollectionDrill('it_drift', 'Drift');
  const evalsDrill = useCollectionDrill('it_evals', 'Evals');
  const [detail, setDetail] = useState<ItRdDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

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

  const openService = (id: string): void => {
    const item = services.find(c => c.id === id);
    if (!item) { servicesDrill.open(id); return; }
    const logsRaw = String(item.logs ?? '');
    const logs = logsRaw
      ? logsRaw.split('\n').filter(Boolean).slice(0, 20).map((line, i) => ({
          ts: `${String(i + 1).padStart(2, '0')}:00`,
          level: (line.toLowerCase().includes('error') ? 'error' : line.toLowerCase().includes('warn') ? 'warn' : 'info') as 'info' | 'warn' | 'error',
          line,
        }))
      : [];
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status: String(item.status ?? 'ok'),
      logs,
      deploys: [],
      fields: [],
    });
    servicesDrill.open(id);
  };

  const openExperiment = (id: string): void => {
    const item = experiments.find(c => c.id === id);
    if (!item) { experimentsDrill.open(id); return; }
    const logs = item.stage
      ? [{ ts: '00:00', level: 'info' as const, line: `Stage: ${String(item.stage)}` }]
      : [];
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.meta ?? ''),
      status: String(item.stage ?? 'idea'),
      logs,
      deploys: [],
      fields: [],
    });
    experimentsDrill.open(id);
  };

  const openDeploy = (id: string): void => {
    const item = deploys.find(c => c.id === id);
    if (!item) { deploysDrill.open(id); return; }
    setDetail({
      id: String(item.id),
      title: String(item.title ?? 'Untitled'),
      subtitle: String(item.subtitle ?? ''),
      status: String(item.status ?? 'live'),
      logs: [{ ts: '00:00', level: 'info', line: String(item.subtitle ?? 'Deploy') }],
      deploys: [{ sha: String(item.sha ?? id), at: String(item.at ?? ''), status: (String(item.status ?? 'live') === 'rolled-back' ? 'rolled-back' : String(item.status ?? 'live') === 'building' ? 'building' : 'live') as 'live' | 'rolled-back' | 'building' }],
      fields: [],
    });
    deploysDrill.open(id);
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
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} onClick={() => openExperiment(e.id)} />
            )) },
            { title: 'Building', accent: ACCENT, items: byStage('building').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent={ACCENT} onClick={() => openExperiment(e.id)} />
            )) },
            { title: 'Shipped', accent: '#16a34a', items: byStage('shipped').map(e => (
              <KanbanCard key={e.id} title={String(e.title)} meta={String(e.meta)} accent="#16a34a" onClick={() => openExperiment(e.id)} />
            )) },
          ]} />
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
          action={<Badge tone="accent">{journal.length} entries</Badge>}
        />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loops.map(loop => {
            const state = String(loop.state ?? 'stable');
            const tone = STATE_TONE[state] ?? 'neutral';
            const toneBg: Record<string, string> = { ok: '#dcfce7', warn: '#fef3c7', danger: '#fee2e2', neutral: '#f5f5f4' };
            const toneFg: Record<string, string> = { ok: '#15803d', warn: '#b45309', danger: '#b91c1c', neutral: '#57534e' };
            const stateDot: Record<string, string> = { ok: '#16a34a', warn: '#d97706', danger: '#dc2626', neutral: '#a8a29e' };
            return (
              <button
                key={String(loop.id)}
                type="button"
                onClick={() => loopsDrill.open(String(loop.id))}
                className="text-left rounded-2xl border bg-[var(--theme-surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)]"
                style={{ borderColor: 'var(--panel-border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stateDot[tone] ?? stateDot.neutral }} />
                    <span className="text-[14px] font-bold text-[var(--theme-text)] truncate">
                      {String(loop.name ?? '—')}
                    </span>
                  </div>
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: toneBg[tone], color: toneFg[tone] }}
                  >
                    {state}
                  </span>
                </div>
                <div className="mt-1.5 text-[11.5px] text-[var(--theme-muted)]">
                  regulates <span className="font-mono">{String(loop.metric ?? '—')}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Capteur', value: String(loop.capteur ?? '') },
                    { label: 'Consigne', value: String(loop.consigne ?? '') },
                    { label: 'Contrôleur', value: String(loop.controleur ?? '') },
                    { label: 'Actionneur', value: String(loop.actionneur ?? '') },
                  ].map((organ) => (
                    <div
                      key={organ.label}
                      className="rounded-md px-1.5 py-1.5"
                      style={{ background: 'var(--theme-surface)' }}
                    >
                      <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                        {organ.label}
                      </div>
                      <div className="mt-0.5 text-[10.5px] leading-snug line-clamp-3" style={{ color: 'var(--theme-text)' }}>
                        {organ.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[var(--panel-border-subtle)] flex items-center justify-between text-[10.5px] font-mono text-[var(--theme-text-dim)]">
                  <span>setpoint {String(loop.target ?? '—')}</span>
                  <span>last action {String(loop.lastActionAt ?? '—')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const Drift = () => {
    const driftCount = drift.filter(d => d.severity === 'drift' || d.severity === 'alert').length;
    return (
      <div className="p-7">
        <ThemedSectionHead
          title="Drift"
          subtitle="Gap between the model spec and the actual behavior. Cross the threshold, get alerted."
          action={<Badge tone={driftCount > 0 ? 'warn' : 'ok'}>{driftCount} above threshold</Badge>}
        />
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
              <button
                key={String(entry.id)}
                type="button"
                onClick={() => driftDrill.open(String(entry.id))}
                className="text-left rounded-2xl border bg-[var(--theme-surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)]"
                style={{ borderColor: 'var(--panel-border)' }}
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
                <div className="mt-2 pt-2 border-t border-[var(--panel-border-subtle)] flex items-center justify-between text-[10.5px] font-mono text-[var(--theme-text-dim)]">
                  <span>{String(entry.metric ?? '—')}</span>
                  <span>alert at {String(entry.threshold ?? '—')}</span>
                </div>
              </button>
            );
          })}
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {evals.map(evalEntry => {
            const evalType = String(evalEntry.evalType ?? 'auto');
            const tone = EVAL_TYPE_TONE[evalType] ?? 'neutral';
            const toneBg: Record<string, string> = { ok: '#dcfce7', warn: '#fef3c7', accent: '#ede9fe', neutral: '#f5f5f4' };
            const toneFg: Record<string, string> = { ok: '#15803d', warn: '#b45309', accent: '#6d28d9', neutral: '#57534e' };
            const trials = Number(evalEntry.trials ?? 0);
            const dist = String(evalEntry.distribution ?? '— / — / —');
            const parts = dist.split('/').map(p => Number(p.trim()));
            const pass = parts[0] ?? 0;
            const pct = trials > 0 ? (pass / trials) * 100 : 0;
            const barPct = Math.max(8, Math.min(100, pct));
            return (
              <button
                key={String(evalEntry.id)}
                type="button"
                onClick={() => evalsDrill.open(String(evalEntry.id))}
                className="text-left rounded-2xl border bg-[var(--theme-surface)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--theme-accent)]"
                style={{ borderColor: 'var(--panel-border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-bold text-[var(--theme-text)] leading-snug min-w-0 flex-1">
                    {String(evalEntry.name ?? '—')}
                  </span>
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: toneBg[tone], color: toneFg[tone] }}
                  >
                    {evalType}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[22px] font-extrabold tabular-nums leading-none" style={{ color: 'var(--theme-text)' }}>
                    {String(evalEntry.rate ?? '—')}
                  </span>
                  <span className="text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    pass rate
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--theme-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, background: evalType === 'review' ? '#f59e0b' : '#7c3aed' }}
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-[var(--panel-border-subtle)] flex items-center justify-between text-[10.5px] font-mono text-[var(--theme-text-dim)]">
                  <span>distribution {dist}</span>
                  <span>{trials} trials</span>
                </div>
              </button>
            );
          })}
        </div>
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
          title="Les 12 entites du registre"
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
