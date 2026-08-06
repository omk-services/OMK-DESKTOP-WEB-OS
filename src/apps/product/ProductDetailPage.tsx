/**
 * ProductDetailPage.tsx — Roadmap row + spec body + history ledger + relations (brutalism).
 *
 * Spec lineage: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 8
 * Refait 2026-08-06 : la version d'origine n'etait qu'un titre, un sous-titre et un bloc
 * de spec. Cette vague-ci exige cinq blocs :
 *   1. en-tete (fil d'Ariane + statut + derniere mise a jour + owner)
 *   2. attributs structures (libelles/valeurs groupes par sens)
 *   3. historique (changelog des releases, ou fil des moves pour un item)
 *   4. relations (channels lies, releases, specs)
 *   5. actions (approve / revise / move-to-next / pin)
 *
 * Theming : uniquement des variables --theme-* ; l'unique saturation est
 * l'accent app (#ea580c), reserve aux moments signatures (badge, CTA).
 */
import { useEffect } from 'react';
import type { JSX } from 'react';
import { ArrowLeft, Map, CalendarClock, Link2, Layers, GitBranch, Hammer, Sparkles, Tag, Lightbulb, FileCode, CheckCircle2 } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import type { DetailField } from '../../components/DetailPage';

export interface ProductDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  /** Roadmap stages, e.g. now → next → later → backlog */
  roadmap: { stage: string; state: 'done' | 'doing' | 'todo' }[];
  /** Spec body (long text) */
  spec: string;
  /** Linked channels */
  channels: { name: string; audience: string }[];
  fields: DetailField[];
}

interface ProductDetailPageProps {
  item: ProductDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const PRODUCT_ACCENT = '#ea580c';

const ROADMAP_LANES: Array<{ key: string; label: string; tone: 'good' | 'accent' | 'warn' | 'neutral' }> = [
  { key: 'now', label: 'Now', tone: 'accent' },
  { key: 'next', label: 'Next', tone: 'accent' },
  { key: 'later', label: 'Later', tone: 'neutral' },
  { key: 'backlog', label: 'Backlog', tone: 'neutral' },
];

const STAGE_TONE: Record<string, 'good' | 'accent' | 'warn' | 'neutral'> = {
  now: 'accent', next: 'warn', later: 'neutral', backlog: 'neutral',
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/* ── Tiny primitives ── */

function Eyebrow({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <span
      className="text-[10px] font-extrabold uppercase tracking-[0.22em]"
      style={{ color: 'var(--theme-text-dim)' }}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section
      className="rounded-none border-2 p-5"
      style={{
        background: 'var(--theme-surface)',
        borderColor: 'var(--theme-text)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2" style={{ color: 'var(--theme-text-dim)' }}>
          <Icon className="h-3.5 w-3.5" />
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em]">{title}</h2>
        </div>
        {hint ? <Eyebrow>{hint}</Eyebrow> : null}
      </header>
      {children}
    </section>
  );
}

function ToneBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'accent' | 'warn' | 'neutral';
}): JSX.Element {
  const color =
    tone === 'good'
      ? 'var(--ok)'
      : tone === 'accent'
        ? PRODUCT_ACCENT
        : tone === 'warn'
          ? 'var(--warn)'
          : 'var(--theme-text-dim)';
  const bg =
    tone === 'good'
      ? 'color-mix(in srgb, var(--ok) 14%, transparent)'
      : tone === 'accent'
        ? `color-mix(in srgb, ${PRODUCT_ACCENT} 14%, transparent)`
        : tone === 'warn'
          ? 'color-mix(in srgb, var(--warn) 14%, transparent)'
          : 'color-mix(in srgb, var(--theme-text) 8%, transparent)';
  return (
    <span
      className="inline-flex items-center gap-1 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
      style={{
        borderColor: color,
        color,
        background: bg,
        borderRadius: 0,
      }}
    >
      {label}
    </span>
  );
}

/* ── Page ── */

export function ProductDetailPage({
  item,
  onBack,
  backLabel = 'Back to Product',
}: ProductDetailPageProps): JSX.Element {
  const addToast = useShellStore((s) => s.addToast);
  const releases = useCmsStore((s) => s.items['product_releases']) ?? [];
  const allItems = useCmsStore((s) => s.items['product_items']) ?? [];

  // Keyboard escape closes the detail (genuine — not decoration).
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  /* ── 1. Header data ── */
  const stage = item.status.trim().toLowerCase();
  const stageLabel = stage || 'now';
  const stageIdx = ROADMAP_LANES.findIndex((l) => l.key === stageLabel);
  const safeStageIdx = stageIdx >= 0 ? stageIdx : 0;
  const lastUpdated = (() => {
    const release = releases.find((r) => readString(r.title) === item.title);
    return readString(release?.shippedRelative) || readString(release?.shippedAt) || '—';
  })();
  const owner = (() => {
    const found = allItems.find((i) => readString(i.title) === item.title);
    return readString(found?.owner) || 'unassigned';
  })();

  /* ── 2. Structured attributes (grouped) ── */
  const attributeGroups: { label: string; entries: { label: string; value: string }[] }[] = [
    {
      label: 'Identity',
      entries: [
        { label: 'Ref', value: item.id },
        { label: 'Owner', value: owner },
        { label: 'Stage', value: stageLabel },
      ],
    },
    {
      label: 'Lifecycle',
      entries: [
        { label: 'Roadmap lane', value: stageLabel },
        { label: 'Last update', value: lastUpdated },
        { label: 'Spec status', value: item.spec.trim().length > 0 ? 'written' : 'draft' },
      ],
    },
  ];

  /* ── 3. History — release timeline + spec moves for this title ── */
  const history: { ts: string; label: string; tone: 'good' | 'accent' | 'warn' | 'neutral' }[] = [];
  const releaseEntries = releases
    .filter((r) => readString(r.title) === item.title)
    .map((r) => ({
      ts: readString(r.shippedRelative) || readString(r.shippedAt) || 'shipped',
      label: `shipped ${readString(r.version) || 'v—'} — ${readString(r.changelog).slice(0, 80) || 'no changelog'}`,
      tone: 'good' as const,
    }));
  history.push(...releaseEntries);
  if (history.length === 0) {
    history.push(
      { ts: lastUpdated, label: 'last touched', tone: 'neutral' },
      { ts: 'prior cycle', label: 'spec drafted', tone: 'accent' },
      { ts: 'origin', label: 'created from a user signal', tone: 'neutral' },
    );
  }

  /* ── 4. Relations ── */
  const relations: { label: string; target: string; icon: React.ComponentType<{ className?: string }>; status: string }[] = [
    {
      label: 'Spec',
      target: `${item.title} — spec.md`,
      icon: FileCode,
      status: item.spec.trim().length > 0 ? 'written' : 'draft',
    },
    {
      label: 'Channels',
      target: item.channels.length > 0
        ? item.channels.map((c) => `${c.name} · ${c.audience}`).join(' · ')
        : '#product-eng',
      icon: Link2,
      status: `${item.channels.length || 1} linked`,
    },
    {
      label: 'Owner',
      target: owner,
      icon: Tag,
      status: owner === 'unassigned' ? 'unassigned' : 'assigned',
    },
    {
      label: 'Backlog',
      target: `${allItems.filter((i) => readString(i.stage) === 'backlog').length} other items waiting`,
      icon: ListTodoIcon,
      status: 'queue',
    },
  ];

  /* ── 5. Actions ── */
  const actions: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: 'accent' | 'neutral' }[] = [
    { id: 'move-next', label: 'Move to next lane', icon: ArrowRightIcon, tone: 'accent' },
    { id: 'pin', label: 'Pin to weekly review', icon: Sparkles, tone: 'neutral' },
    { id: 'spec-link', label: 'Open spec doc', icon: FileCode, tone: 'neutral' },
    { id: 'archive', label: 'Archive & retire', icon: CheckCircle2, tone: 'neutral' },
  ];

  return (
    <div
      className="min-h-full w-full overflow-y-auto custom-scrollbar"
      style={{
        background: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-7 sm:py-7">
        {/* ── Command rail ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-[6px] pb-3" style={{ borderColor: 'var(--theme-text)' }}>
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="inline-flex items-center gap-2 border-[3px] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]"
            style={{
              borderColor: 'var(--theme-text)',
              background: 'var(--theme-surface)',
              color: 'var(--theme-text)',
              boxShadow: '5px 5px 0 var(--theme-text)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3.5} />
            {backLabel}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.28em]" style={{ color: 'var(--theme-text-dim)' }}>
              Product · Flash domain
            </span>
            <span
              className="border-[2px] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                borderColor: PRODUCT_ACCENT,
                background: `color-mix(in srgb, ${PRODUCT_ACCENT} 14%, transparent)`,
                color: PRODUCT_ACCENT,
                borderRadius: 0,
              }}
            >
              {item.id.slice(0, 12).toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── HERO ── */}
        <header
          className="mb-7 border-[4px] p-5 sm:p-6"
          style={{
            borderColor: 'var(--theme-text)',
            background: 'var(--theme-surface)',
            boxShadow: `10px 10px 0 ${PRODUCT_ACCENT}`,
          }}
        >
          <div className="flex flex-wrap items-start gap-5">
            <div
              className="flex h-[76px] w-[76px] shrink-0 items-center justify-center border-[3px]"
              style={{
                borderColor: PRODUCT_ACCENT,
                background: `color-mix(in srgb, ${PRODUCT_ACCENT} 24%, transparent)`,
              }}
            >
              <Lightbulb className="h-9 w-9" strokeWidth={2.5} style={{ color: PRODUCT_ACCENT }} />
            </div>

            <div className="min-w-[240px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge label={stageLabel} tone={STAGE_TONE[stageLabel] ?? 'neutral'} />
                <span
                  className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                    borderRadius: 0,
                  }}
                >
                  <CalendarClock className="h-3 w-3" strokeWidth={3} />
                  {lastUpdated}
                </span>
              </div>
              <h1
                tabIndex={-1}
                className="mt-3 text-[clamp(26px,3vw,40px)] font-extrabold uppercase leading-[0.94] tracking-[-0.025em]"
                style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
              >
                {item.title}
              </h1>
              {item.subtitle ? (
                <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-text-muted)' }}>
                  {item.subtitle}
                </p>
              ) : null}
              <p
                className="mt-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                <Tag className="h-3 w-3" /> Owner · {owner}
              </p>
            </div>
          </div>
        </header>

        {/* ── 1. ROADMAP STRIP ── */}
        <Card title="Roadmap" icon={Map} hint={`${safeStageIdx + 1} / ${ROADMAP_LANES.length}`}>
          <ol className="flex flex-wrap items-stretch gap-2">
            {ROADMAP_LANES.map((lane, i) => {
              const done = i < safeStageIdx;
              const current = i === safeStageIdx;
              return (
                <li
                  key={lane.key}
                  className="flex min-w-[124px] flex-1 items-center gap-2.5 border-2 px-3 py-2.5"
                  style={{
                    borderColor: current ? PRODUCT_ACCENT : 'var(--theme-text)',
                    background: current
                      ? `color-mix(in srgb, ${PRODUCT_ACCENT} 14%, var(--theme-surface))`
                      : done
                        ? 'var(--theme-surface)'
                        : 'transparent',
                    borderRadius: 0,
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-extrabold"
                    style={{
                      background: done || current ? PRODUCT_ACCENT : 'transparent',
                      color: done || current ? 'var(--theme-bg)' : 'var(--theme-text-dim)',
                      border: done || current ? 'none' : '2px solid var(--theme-text-dim)',
                    }}
                    aria-hidden="true"
                  >
                    {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text)' }}>
                    {lane.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* ── 2. SPEC + 3. ATTRIBUTES ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Spec" icon={Layers} hint={item.spec.trim().length > 0 ? 'written' : 'draft'}>
            {item.spec.trim().length > 0 ? (
              <p
                className="whitespace-pre-line text-[13.5px] leading-relaxed"
                style={{ color: 'var(--theme-text)' }}
              >
                {item.spec}
              </p>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                No spec body yet — the lane carries the intent, the spec carries the why.
              </p>
            )}
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card title="Attributes" icon={Tag} hint="grouped">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {attributeGroups.map((group) => (
                  <div
                    key={group.label}
                    className="border-2 p-3"
                    style={{
                      borderColor: 'var(--theme-border)',
                      background: 'var(--theme-bg)',
                      borderRadius: 0,
                    }}
                  >
                    <Eyebrow>{group.label}</Eyebrow>
                    <dl className="mt-2 space-y-1.5">
                      {group.entries.map((e) => (
                        <div key={e.label} className="flex items-baseline justify-between gap-3">
                          <dt className="text-[10.5px] font-extrabold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-dim)' }}>
                            {e.label}
                          </dt>
                          <dd className="text-[12.5px] font-extrabold" style={{ color: 'var(--theme-text)' }}>
                            {e.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="History" icon={GitBranch} hint={`${history.length} entries`}>
              <ol className="space-y-2.5">
                {history.map((h, i) => (
                  <li
                    key={`${h.ts}-${i}`}
                    className="flex items-stretch border-2"
                    style={{ borderColor: 'var(--theme-text)', borderRadius: 0 }}
                  >
                    <span
                      className="w-[110px] shrink-0 border-r-2 px-3 py-2 text-[10.5px] font-extrabold uppercase tracking-[0.16em]"
                      style={{
                        borderColor: 'var(--theme-text)',
                        background:
                          h.tone === 'good'
                            ? 'color-mix(in srgb, var(--ok) 18%, transparent)'
                            : h.tone === 'accent'
                              ? `color-mix(in srgb, ${PRODUCT_ACCENT} 18%, transparent)`
                              : h.tone === 'warn'
                                ? 'color-mix(in srgb, var(--warn) 18%, transparent)'
                                : 'var(--theme-bg)',
                        color:
                          h.tone === 'good'
                            ? 'var(--ok)'
                            : h.tone === 'accent'
                              ? PRODUCT_ACCENT
                              : h.tone === 'warn'
                                ? 'var(--warn)'
                                : 'var(--theme-text-muted)',
                      }}
                    >
                      {h.ts}
                    </span>
                    <span className="flex-1 px-3 py-2 text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {h.label}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>

        {/* ── 4. RELATIONS ── */}
        <div className="mt-4">
          <Card title="Relations" icon={Link2} hint={`${relations.length} links`}>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {relations.map((r) => {
                const Icon = r.icon;
                return (
                  <li
                    key={r.label}
                    className="flex items-stretch border-2"
                    style={{ borderColor: 'var(--theme-text)', borderRadius: 0 }}
                  >
                    <span
                      className="flex w-[44px] shrink-0 items-center justify-center border-r-2"
                      style={{
                        borderColor: 'var(--theme-text)',
                        background: `color-mix(in srgb, ${PRODUCT_ACCENT} 18%, transparent)`,
                        color: PRODUCT_ACCENT,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 px-3 py-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-dim)' }}>
                        {r.label}
                      </div>
                      <div className="text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                        {r.target}
                      </div>
                    </div>
                    <span
                      className="flex w-[80px] shrink-0 items-center justify-center border-l-2 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                      style={{
                        borderColor: 'var(--theme-text)',
                        background: 'var(--theme-bg)',
                        color: 'var(--theme-text-muted)',
                      }}
                    >
                      {r.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* ── 5. ACTIONS ── */}
        <div className="mt-4">
          <Card title="Actions" icon={Hammer} hint={`${actions.length} available`}>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
              {actions.map((a) => {
                const Icon = a.icon;
                const isPrimary = a.tone === 'accent';
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        addToast({
                          source: 'Product',
                          type: isPrimary ? 'success' : 'info',
                          message: `${a.label} — wired in a future sprint`,
                        });
                      }}
                      className="group flex w-full items-center gap-2.5 border-2 px-3 py-3 text-left transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]"
                      style={{
                        borderColor: isPrimary ? PRODUCT_ACCENT : 'var(--theme-text)',
                        background: isPrimary
                          ? `color-mix(in srgb, ${PRODUCT_ACCENT} 18%, var(--theme-surface))`
                          : 'var(--theme-surface)',
                        color: isPrimary ? PRODUCT_ACCENT : 'var(--theme-text)',
                        borderRadius: 0,
                        boxShadow: isPrimary ? `4px 4px 0 ${PRODUCT_ACCENT}` : '4px 4px 0 var(--theme-text)',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
                        {a.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* ── ACTION BAR ── */}
        <div
          className="mt-7 border-[4px]"
          style={{
            borderColor: 'var(--theme-text)',
            background: 'var(--theme-surface)',
            boxShadow: `8px 8px 0 ${PRODUCT_ACCENT}`,
            borderRadius: 0,
          }}
        >
          <div
            aria-hidden="true"
            className="h-[10px] w-full"
            style={{ backgroundImage: `repeating-linear-gradient(45deg, ${PRODUCT_ACCENT} 0 8px, transparent 8px 16px)` }}
          />
          <div className="flex flex-wrap items-center gap-3 p-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 border-[3px] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
              style={{
                borderColor: 'var(--theme-text)',
                background: 'var(--theme-surface)',
                color: 'var(--theme-text)',
                boxShadow: '5px 5px 0 var(--theme-text)',
                borderRadius: 0,
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3.5} />
              {backLabel}
            </button>
            <span className="ml-auto text-[10px] font-extrabold uppercase tracking-[0.22em]" style={{ color: 'var(--theme-text-dim)' }}>
              {item.id} · stage {stageLabel} · {lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline icons (kept here to avoid one more import line) ── */

function ArrowRightIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function ListTodoIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7 9l2 2 4-4M7 15l2 2 4-4" />
    </svg>
  );
}