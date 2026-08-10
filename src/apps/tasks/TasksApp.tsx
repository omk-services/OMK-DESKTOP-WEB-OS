import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckSquare, Sun, CalendarClock, CheckCheck, Check, ShieldCheck, GitCompareArrows, Megaphone, Plus, Trash2 } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useCollectionDrill } from '../../hooks/useCollectionDrill';
import { CollectionRepeater } from '../../components/cms/CollectionRepeater';
import { useWindowPage } from '../../contexts/WindowContext';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { DynamicPageView } from '../../components/cms/DynamicPageView';
import { TasksDetailPage, type TasksDetailItem } from './TasksDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { TasksItemDetail } from './TasksItemDetail';
import { seedTasksCms } from './seed';

seedTasksCms();
registerItemDetail('tasks', TasksItemDetail);

/** The Tasks app accent. Updated 2026-08-06 to the brief's stated emerald. */
const ACCENT = '#059669';

/* ──────────────────────────────────────────────────────────────────────────── */
/* Small inline sparkline — used by Actions exposees to render the weekly      */
/* count as a time series. No external dep, no Tailwind palette classes.        */
/* ──────────────────────────────────────────────────────────────────────────── */

interface Bucket {
  label: string;
  value: number;
}

function bucketByWeek(dates: string[]): Bucket[] {
  if (dates.length === 0) return [];
  const ts = dates
    .map((d) => new Date(d).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (ts.length === 0) return [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const oldest = ts[0];
  // Span the oldest week through the current week, so the most recent bucket
  // is always present (a zero-bucket at the end is a feature, not a bug — it
  // shows the rhythm dropping this week).
  const thisWeek = Math.floor((Date.now() - oldest) / weekMs);
  const width = Math.max(thisWeek, ts.length - 1) + 1;
  const values = new Array(width).fill(0) as number[];
  for (const t of ts) {
    const idx = Math.max(0, Math.floor((t - oldest) / weekMs));
    values[Math.min(idx, width - 1)] += 1;
  }
  return values.map((v, i) => {
    const d = new Date(oldest + i * weekMs);
    const wk = `W${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { label: wk, value: v };
  });
}

function Sparkline({ buckets, accent }: { buckets: Bucket[]; accent: string }) {
  if (buckets.length === 0) return null;
  const w = 320;
  const h = 64;
  const padX = 6;
  const padY = 8;
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const stepX = (w - padX * 2) / Math.max(1, buckets.length - 1);
  const points = buckets.map((b, i) => {
    const x = padX + i * stepX;
    const y = h - padY - (b.value / max) * (h - padY * 2);
    return { x, y, value: b.value, label: b.label };
  });
  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `L${p.x.toFixed(1)},${p.y.toFixed(1)}`))
    .join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(h - padY).toFixed(1)} L${points[0].x.toFixed(1)},${(h - padY).toFixed(1)} Z`;
  const total = points.reduce((acc, p) => acc + p.value, 0);
  const peak = points.reduce((best, p) => (p.value > best.value ? p : best), points[0]);
  const last = points[points.length - 1];

  return (
    <div
      className="rounded-xl border p-4 sm:p-5"
      style={{
        background: 'var(--theme-surface)',
        borderColor: 'var(--panel-border)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            Weekly exposed actions
          </span>
          <span
            className="text-[9.5px] font-mono tabular-nums"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            {total} shipped · {buckets.length} weeks
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--theme-text-dim)' }}>
          <span>peak {peak.value} on {peak.label}</span>
          <span>this week {last.value}</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        role="img"
        aria-label={`Weekly exposed actions over ${buckets.length} weeks, ${total} total`}
      >
        {/* baseline */}
        <line
          x1={padX}
          x2={w - padX}
          y1={h - padY}
          y2={h - padY}
          stroke="var(--panel-border)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* area under line */}
        <path d={areaPath} fill={accent} opacity="0.12" />
        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* points + value labels */}
        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 3} fill={accent} />
            {p.value > 0 ? (
              <text
                x={p.x}
                y={Math.max(10, p.y - 7)}
                textAnchor="middle"
                fontFamily="var(--theme-font-mono, ui-monospace, SFMono-Regular, monospace)"
                fontSize="9"
                fill="var(--theme-text-muted)"
              >
                {p.value}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div
        className="mt-1 flex justify-between text-[9px] font-mono"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {points.map((p, i) => (
          <span key={`l-${i}`}>{i % 2 === 0 ? p.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* App                                                                          */
/* ──────────────────────────────────────────────────────────────────────────── */

export function TasksApp() {
  const tasks = useCmsStore(s => s.items['tasks']) ?? [];
  const dods = useCmsStore(s => s.items['dods']) ?? [];
  const comparators = useCmsStore(s => s.items['comparators']) ?? [];
  const exposedActions = useCmsStore(s => s.items['exposed_actions']) ?? [];

  const [detail, setDetail] = useState<TasksDetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  const dodsDrill = useCollectionDrill('dods', 'Definition of Done');
  const comparatorsDrill = useCollectionDrill('comparators', 'Comparateur');
  const exposedActionsDrill = useCollectionDrill('exposed_actions', 'Actions exposees');

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);
  const updateItem = useCmsStore(s => s.updateItem);
  const addItem = useCmsStore(s => s.addItem);
  const removeItem = useCmsStore(s => s.removeItem);
  const addToast = useShellStore(s => s.addToast);

  /* Brief-F — la couche d'écriture : un humain doit pouvoir créer une tâche.
   * L'état est local à l'app : pas besoin de persister un brouillon. La
   * soumission passe par `addItem` du magasin CMS — pas un raccourci à côté. */
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLabel, setComposerLabel] = useState('');
  const [composerWhen, setComposerWhen] = useState('');

  const submitNewTask = (): void => {
    const label = composerLabel.trim();
    if (label.length === 0) {
      addToast({ source: 'Tasks', type: 'warning', message: 'Le titre est obligatoire.' });
      return;
    }
    const result = addItem('tasks', {
      label,
      when: composerWhen.trim() || 'today',
      group: 'today',
      done: false,
    });
    if (result.ok) {
      addToast({ source: 'Tasks', type: 'success', message: `Ajouté : ${label}` });
      setComposerLabel('');
      setComposerWhen('');
      setComposerOpen(false);
    } else {
      addToast({ source: 'Tasks', type: 'warning', message: result.error ?? 'Création impossible.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerLabel('');
    setComposerWhen('');
    setComposerOpen(false);
  };

  const removeTask = (id: string): void => {
    const current = tasks.find((t) => t.id === id);
    const result = removeItem('tasks', id);
    if (result.ok) {
      addToast({ source: 'Tasks', type: 'success', message: `Supprimé : ${String(current?.label ?? id)}` });
    } else {
      addToast({ source: 'Tasks', type: 'warning', message: result.error ?? 'Suppression impossible.' });
    }
  };

  const toggle = (id: string) => {
    const current = tasks.find(t => t.id === id);
    if (current && !current.done) {
      addToast({ source: 'Tasks', type: 'success', message: `Done: ${current.label}` });
    }
    updateItem('tasks', id, { done: !current?.done });
  };

  /* Ouverture d'une fiche.
   *
   * Le crumb de detail est publie par le seul effet sur `detail` ci-dessus.
   * Piege deja paye ailleurs (Marketplace) : appeler en plus
   * useCollectionDrill sur la meme collection republie ce crumb partage
   * avec un `onBack` qui ne ferme que l'etat interne du drill. Le drill
   * `tasks` etait mort par ailleurs (absent du drillRegistry) : retire. */
  const openTask = (id: string): void => {
    const item = tasks.find(c => c.id === id);
    if (!item) return;
    setDetail({
      id: String(item.id),
      title: String(item.label ?? 'Tache sans titre'),
      subtitle: String(item.when ?? ''),
      status: item.done ? 'done' : String(item.group ?? 'today'),
      dueAt: String(item.when ?? ''),
      body: String(item.notes ?? item.body ?? ''),
      fields: [],
    });
  };

  const list = (filter: (t: typeof tasks[number]) => boolean, title: string, empty: string, withComposer = false, emptyAction?: ReactNode) => {
    const items = tasks.filter(filter);
    return (
      <div className="p-7">
        <SectionHead
          title={title}
          subtitle={`${items.length} item${items.length === 1 ? '' : 's'}`}
          action={
            withComposer && !composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
                aria-label="Ajouter une tâche"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            ) : null
          }
        />
        {withComposer && composerOpen ? (
          <div
            className="mb-4 rounded-xl border p-4"
            style={{
              background: 'var(--theme-surface)',
              borderColor: 'var(--panel-border)',
            }}
          >
            <label
              className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="tasks-composer-label"
            >
              Titre
            </label>
            <input
              id="tasks-composer-label"
              autoFocus
              value={composerLabel}
              onChange={(e) => setComposerLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewTask();
                if (e.key === 'Escape') cancelComposer();
              }}
              placeholder="Décrire la tâche…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: 'var(--theme-bg)',
                border: '1px solid var(--panel-border)',
                color: 'var(--theme-text)',
              }}
            />
            <label
              className="mt-3 block text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5"
              style={{ color: 'var(--theme-text-dim)' }}
              htmlFor="tasks-composer-when"
            >
              Échéance (libre)
            </label>
            <input
              id="tasks-composer-when"
              value={composerWhen}
              onChange={(e) => setComposerWhen(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewTask();
                if (e.key === 'Escape') cancelComposer();
              }}
              placeholder="ex. Thu 14:00 · tomorrow · next week"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: 'var(--theme-bg)',
                border: '1px solid var(--panel-border)',
                color: 'var(--theme-text)',
              }}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={cancelComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  color: 'var(--theme-text-dim)',
                  border: '1px solid var(--panel-border)',
                }}
              >
                Annuler
              </button>
              <button
                onClick={submitNewTask}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ACCENT,
                  color: '#ffffff',
                }}
              >
                Ajouter la tâche
              </button>
            </div>
          </div>
        ) : null}
        {items.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 py-10 text-center"
            style={{ color: 'var(--theme-text-dim)' }}
          >
            <div className="text-sm">{empty}</div>
            {emptyAction}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{
                  background: 'var(--theme-surface)',
                  borderColor: 'var(--panel-border)',
                  boxShadow: 'var(--theme-shadow, 0 1px 2px rgba(0,0,0,0.04))',
                }}
              >
                <button
                  onClick={() => toggle(String(t.id))}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors`}
                  style={Boolean(t.done) ? { background: ACCENT, borderColor: 'transparent' as const, color: '#ffffff' } : undefined}
                  aria-checked={Boolean(t.done)}
                  role="checkbox"
                >
                  {t.done ? <Check className="w-3.5 h-3.5" /> : null}
                </button>
                <button
                  onClick={() => openTask(String(t.id))}
                  className="flex-1 text-left text-sm transition-colors"
                  style={{
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? 'var(--theme-text-dim)' : 'var(--theme-text)',
                    fontWeight: t.done ? 400 : 500,
                  }}
                >
                  {String(t.label)}
                </button>
                <span
                  className="text-xs"
                  style={{ color: 'var(--theme-text-dim)' }}
                >
                  {String(t.when)}
                </span>
                <button
                  onClick={() => removeTask(String(t.id))}
                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-text-dim)' }}
                  aria-label={`Supprimer ${String(t.label)}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const isToday = (t: typeof tasks[number]) => t.group === 'today' && !t.done;
  const isUpcoming = (t: typeof tasks[number]) => t.group === 'upcoming' && !t.done;

  const Today = () => list(isToday, 'Today', 'Nothing left today — nicely done.', true);
  const Upcoming = () => list(isUpcoming, 'Upcoming', 'Nothing on the horizon.');
  const Done = () => list(
    t => !!t.done,
    'Done',
    'Aucune tâche terminée — les tâches cochées apparaissent ici.',
    false,
    (
      <button
        type="button"
        onClick={() => {
          if (typeof window === 'undefined') return;
          window.dispatchEvent(new CustomEvent('coach-os:open-app-section', {
            detail: { appId: 'tasks', sectionId: 'today' },
          }));
        }}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: ACCENT,
          color: '#ffffff',
        }}
        data-tasks-done-go-today
      >
        Aller à Today →
      </button>
    ),
  );

  /* ── Definition of Done ──────────────────────────────────────────────── */
  const DefinitionOfDone = () => {
    const missing = dods.filter((d) => d.status === 'missing').length;
    const implicit = dods.filter((d) => d.status === 'implicit').length;
    const explicit = dods.filter((d) => d.status === 'explicit').length;
    return (
      <div className="p-7">
        <SectionHead
          title="Definition of Done"
          subtitle="The contract per task — a written DoD is the difference between shipped and slipped"
        />
        {/* Mini summary strip — three counts the eye reads at a glance */}
        <div
          className="mb-5 grid grid-cols-3 gap-2 rounded-xl border p-3"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
          }}
        >
          <SummaryCell label="missing" value={missing} tone="#dc2626" />
          <SummaryCell label="implicit" value={implicit} tone="#d97706" />
          <SummaryCell label="explicit" value={explicit} tone="#16a34a" />
        </div>
        <CollectionRepeater collectionId="dods" onOpen={dodsDrill.open} />
      </div>
    );
  };

  /* ── Comparateur ─────────────────────────────────────────────────────── */
  const Comparateur = () => {
    const match = comparators.filter((c) => c.verdict === 'match').length;
    const drift = comparators.filter((c) => c.verdict === 'drift').length;
    const fail = comparators.filter((c) => c.verdict === 'fail').length;
    return (
      <div className="p-7">
        <SectionHead
          title="Comparateur"
          subtitle="Verify a deliverable against a reference — what was compared, against what, and the verdict"
        />
        <div
          className="mb-5 grid grid-cols-3 gap-2 rounded-xl border p-3"
          style={{
            background: 'var(--theme-surface)',
            borderColor: 'var(--panel-border)',
          }}
        >
          <SummaryCell label="match" value={match} tone="#16a34a" />
          <SummaryCell label="drift" value={drift} tone="#d97706" />
          <SummaryCell label="fail" value={fail} tone="#dc2626" />
        </div>
        <CollectionRepeater collectionId="comparators" onOpen={comparatorsDrill.open} />
      </div>
    );
  };

  /* ── Actions exposees ────────────────────────────────────────────────── */
  const ActionsExposees = () => {
    const buckets = useMemo(
      () => bucketByWeek(exposedActions.map((a) => String(a.shippedAt ?? ''))),
      [exposedActions],
    );
    return (
      <div className="p-7">
        <SectionHead
          title="Actions exposees"
          subtitle="A measure of rhythm, not volume — the weekly count of publicly delivered actions"
        />
        <div className="mb-5">
          <Sparkline buckets={buckets} accent={ACCENT} />
        </div>
        <CollectionRepeater collectionId="exposed_actions" onOpen={exposedActionsDrill.open} />
      </div>
    );
  };

  /* ── Drill registry — every CMS drill for this app, in one place. Used
       both to render the dynamic detail at the top level (sibling of
       AppFrame, so the theme follows the top bar, not the sidebar) and to
       skip the section's inline view when another drill is open. */
  const drillRegistry = [
    { drill: dodsDrill, collection: 'dods' as const },
    { drill: comparatorsDrill, collection: 'comparators' as const },
    { drill: exposedActionsDrill, collection: 'exposed_actions' as const },
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
    { id: 'today', label: 'Today', icon: Sun, render: Today },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, render: Upcoming },
    { id: 'done', label: 'Done', icon: CheckCheck, render: Done },
    { id: 'dod', label: 'Definition of Done', icon: ShieldCheck, render: DefinitionOfDone },
    { id: 'comparator', label: 'Comparateur', icon: GitCompareArrows, render: Comparateur },
    { id: 'exposed', label: 'Actions exposees', icon: Megaphone, render: ActionsExposees },
  ];

  return (
    <>
      <AppFrame title="Tasks" subtitle="What needs you" icon={CheckSquare} accent={ACCENT} sections={sections} />
      {detail ? (
        <AppDetailOverlay
          appId="tasks"
          accent={ACCENT}
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-bottom', durationMs: 220 }}
        >
          <TasksDetailPage item={detail} onBack={() => setDetail(null)} />
        </AppDetailOverlay>
      ) : null}
      {openDrillCollection !== null && openDrillId !== null ? (
        <AppDetailOverlay
          appId="tasks"
          accent={ACCENT}
          onBack={closeOpenDrill}
          motion={{ kind: 'slide-bottom', durationMs: 220 }}
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

/* ──────────────────────────────────────────────────────────────────────────── */
/* SummaryCell — small three-up cell used in the section headers.              */
/* Uses semantic hues (green/amber/red) — palette colours that carry meaning.   */
/* ──────────────────────────────────────────────────────────────────────────── */

function SummaryCell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-baseline gap-2 px-2">
      <span
        className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--theme-text-dim)' }}
      >
        {label}
      </span>
      <span
        className="text-lg font-extrabold tabular-nums leading-none"
        style={{ color: tone }}
      >
        {value}
      </span>
    </div>
  );
}
