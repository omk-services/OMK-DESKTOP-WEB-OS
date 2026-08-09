/**
 * GrowthDetailPage.tsx — Funnel viz + experiment table + history + relations (vibrant-block).
 *
 * Spec lineage: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 9
 *
 * Refait 2026-08-06 : la version d'origine n'etait qu'un titre, un funnel et
 * un tableau d'experiences. Cette vague-ci exige cinq blocs :
 *   1. en-tete (fil d'Ariane + statut + derniere mise a jour)
 *   2. attributs structures (libelles/valeurs groupes par sens)
 *   3. historique (changelog + dernier mouvement)
 *   4. relations (autres channels lies, experiments voisines)
 *   5. actions (invest more / hold / cut / launch cohort)
 *
 * Theming : uniquement des variables --theme-* ; l'unique saturation est
 * l'accent app (#16a34a), reserve aux moments signatures (badge, CTA).
 */
import { useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, GitBranch, Radio, FlaskConical, Tag, History, Sparkles, type LucideIcon, Plus, Minus, X } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import type { DetailField } from '../../components/DetailPage';

export interface GrowthDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  funnel: { stage: string; pct: number; absolute: number }[];
  experiments: { name: string; variant: string; lift: string; status: 'live' | 'done' | 'draft' }[];
  fields: DetailField[];
}

interface GrowthDetailPageProps {
  item: GrowthDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const GROWTH_ACCENT = '#16a34a';

const STATUS_TONE: Record<string, 'good' | 'warn' | 'accent' | 'neutral'> = {
  live: 'good',
  done: 'accent',
  draft: 'warn',
  hold: 'warn',
  up: 'good',
  down: 'warn',
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/* ── Tiny primitives ── */

function Eyebrow({ children }: { children: React.ReactNode }) {
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
  icon: LucideIcon;
  hint?: string;
  children: React.ReactNode;
}) {
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
  tone: 'good' | 'warn' | 'accent' | 'neutral';
}) {
  const color =
    tone === 'good'
      ? 'var(--ok)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'accent'
          ? GROWTH_ACCENT
          : 'var(--theme-text-dim)';
  const bg =
    tone === 'good'
      ? 'color-mix(in srgb, var(--ok) 18%, transparent)'
      : tone === 'warn'
        ? 'color-mix(in srgb, var(--warn) 18%, transparent)'
        : tone === 'accent'
          ? `color-mix(in srgb, ${GROWTH_ACCENT} 18%, transparent)`
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

export function GrowthDetailPage({
  item,
  onBack,
  backLabel = 'Back to Growth',
}: GrowthDetailPageProps) {
  const addToast = useShellStore((s) => s.addToast);
  const channels = useCmsStore((s) => s.items['growth_channels']) ?? [];
  const experiments = useCmsStore((s) => s.items['growth_experiments']) ?? [];

  // Keyboard escape closes the detail.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const trend = item.status.trim();
  const trendTone = STATUS_TONE[trend] ?? 'neutral';
  const trendIcon = trend.startsWith('↑') ? <Plus className="h-3 w-3" /> : trend.startsWith('↓') ? <Minus className="h-3 w-3" /> : <X className="h-3 w-3" />;
  const lastUpdated = experiments.find((e) => readString(e.name) === item.title)?.shippedAt
    || (item.experiments[0]?.lift ?? '—');

  /* ── 2. Structured attributes (grouped) ── */
  const attributeGroups: { label: string; entries: { label: string; value: string }[] }[] = [
    {
      label: 'Identity',
      entries: [
        { label: 'Ref', value: item.id },
        { label: 'Title', value: item.title },
        { label: 'Subtitle', value: item.subtitle || '—' },
      ],
    },
    {
      label: 'Pulse',
      entries: [
        { label: 'Trend', value: trend || '—' },
        { label: 'Last update', value: typeof lastUpdated === 'string' ? lastUpdated : '—' },
        { label: 'Top of funnel', value: `${item.funnel[0]?.absolute ?? '—'} ${item.funnel[0]?.stage ?? ''}`.trim() || '—' },
      ],
    },
  ];

  /* ── 3. History ── */
  const history = useMemo(() => {
    const expEntries = item.experiments.map((e) => ({
      ts: `${e.status} ${e.variant}`.trim(),
      label: `${e.name} — lift ${e.lift}`,
      tone: STATUS_TONE[e.status] ?? 'neutral',
    }));
    if (expEntries.length > 0) return expEntries;
    return [
      { ts: '7d ago', label: 'baseline recorded', tone: 'neutral' as const },
      { ts: '3d ago', label: 'A/B variant split', tone: 'accent' as const },
      { ts: 'now', label: 'tracking', tone: 'good' as const },
    ];
  }, [item.experiments]);

  /* ── 4. Relations ── */
  const relations: { label: string; target: string; icon: LucideIcon; status: string }[] = [
    {
      label: 'Channels',
      target: channels.length > 0
        ? `${channels.length} channel${channels.length > 1 ? 's' : ''} feeding this scorecard`
        : 'no channel yet',
      icon: Radio,
      status: channels.length > 0 ? 'linked' : 'empty',
    },
    {
      label: 'Experiments',
      target: experiments.length > 0
        ? `${experiments.length} experiment${experiments.length > 1 ? 's' : ''} in flight`
        : 'no experiment in flight',
      icon: FlaskConical,
      status: experiments.length > 0 ? 'live' : 'idle',
    },
    {
      label: 'Owner',
      target: 'growth team',
      icon: Tag,
      status: 'assigned',
    },
    {
      label: 'Funnel',
      target: `${item.funnel.length} stage${item.funnel.length > 1 ? 's' : ''}`,
      icon: TrendingUp,
      status: 'tracked',
    },
  ];

  /* ── 5. Actions ── */
  const actions: { id: string; label: string; icon: LucideIcon; tone: 'accent' | 'neutral' }[] = [
    { id: 'invest', label: 'Invest more', icon: Plus, tone: 'accent' },
    { id: 'hold', label: 'Hold steady', icon: History, tone: 'neutral' },
    { id: 'cut', label: 'Cut or rework', icon: X, tone: 'neutral' },
    { id: 'launch-cohort', label: 'Launch cohort', icon: Sparkles, tone: 'neutral' },
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
              Growth · Superman domain
            </span>
            <span
              className="border-[2px] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                borderColor: GROWTH_ACCENT,
                background: `color-mix(in srgb, ${GROWTH_ACCENT} 14%, transparent)`,
                color: GROWTH_ACCENT,
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
            boxShadow: `10px 10px 0 ${GROWTH_ACCENT}`,
          }}
        >
          <div className="flex flex-wrap items-start gap-5">
            <div
              className="flex h-[76px] w-[76px] shrink-0 items-center justify-center border-[3px]"
              style={{
                borderColor: GROWTH_ACCENT,
                background: `color-mix(in srgb, ${GROWTH_ACCENT} 24%, transparent)`,
              }}
            >
              <TrendingUp className="h-9 w-9" strokeWidth={2.5} style={{ color: GROWTH_ACCENT }} />
            </div>

            <div className="min-w-[240px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge label={trend || '—'} tone={trendTone} />
                <span
                  className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                    borderRadius: 0,
                  }}
                >
                  {trendIcon}
                  trend · {trend || '—'}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                    borderRadius: 0,
                  }}
                >
                  <History className="h-3 w-3" strokeWidth={3} />
                  {typeof lastUpdated === 'string' ? lastUpdated : '—'}
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
            </div>
          </div>
        </header>

        {/* ── 1. FUNNEL + 2. EXPERIMENTS ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Funnel" icon={TrendingUp} hint={`${item.funnel.length} stages`}>
            {item.funnel.length > 0 ? (
              <ol className="space-y-2">
                {item.funnel.map((f, i) => (
                  <li key={`${f.stage}-${i}`}>
                    <div className="flex justify-between text-[12px] font-extrabold uppercase tracking-[0.16em]">
                      <span style={{ color: 'var(--theme-text)' }}>{f.stage}</span>
                      <span style={{ color: 'var(--theme-text-muted)' }}>
                        {f.absolute} · {f.pct}%
                      </span>
                    </div>
                    <div
                      className="mt-1 h-3 border-2"
                      style={{
                        background: 'var(--theme-bg)',
                        borderColor: 'var(--theme-text)',
                        borderRadius: 0,
                      }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(2, f.pct)}%`,
                          background: GROWTH_ACCENT,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                No funnel stages recorded yet.
              </p>
            )}
          </Card>

          <Card title="Experiments" icon={FlaskConical} hint={`${item.experiments.length} in flight`}>
            {item.experiments.length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2 text-left text-[10px] uppercase tracking-[0.18em]" style={{ borderColor: 'var(--theme-text)' }}>
                    <th className="py-1 font-extrabold" style={{ color: 'var(--theme-text-dim)' }}>Name</th>
                    <th className="font-extrabold" style={{ color: 'var(--theme-text-dim)' }}>Variant</th>
                    <th className="font-extrabold" style={{ color: 'var(--theme-text-dim)' }}>Lift</th>
                    <th className="font-extrabold" style={{ color: 'var(--theme-text-dim)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {item.experiments.map((e, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'var(--panel-border-subtle)' }}>
                      <td className="py-2 font-semibold" style={{ color: 'var(--theme-text)' }}>{e.name}</td>
                      <td style={{ color: 'var(--theme-text-muted)' }}>{e.variant}</td>
                      <td className="font-mono font-extrabold" style={{ color: 'var(--theme-text)' }}>{e.lift}</td>
                      <td>
                        <ToneBadge label={e.status} tone={STATUS_TONE[e.status] ?? 'neutral'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                No experiments recorded for this item yet.
              </p>
            )}
          </Card>
        </div>

        {/* ── 3. ATTRIBUTES + 4. HISTORY ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            ? `color-mix(in srgb, ${GROWTH_ACCENT} 18%, transparent)`
                            : h.tone === 'warn'
                              ? 'color-mix(in srgb, var(--warn) 18%, transparent)'
                              : 'var(--theme-bg)',
                      color:
                        h.tone === 'good'
                          ? 'var(--ok)'
                          : h.tone === 'accent'
                            ? GROWTH_ACCENT
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

        {/* ── 5. RELATIONS + 6. ACTIONS ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Relations" icon={Radio} hint={`${relations.length} links`}>
            <ul className="space-y-2.5">
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
                        background: `color-mix(in srgb, ${GROWTH_ACCENT} 18%, transparent)`,
                        color: GROWTH_ACCENT,
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

          <Card title="Actions" icon={Sparkles} hint={`${actions.length} available`}>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {actions.map((a) => {
                const Icon = a.icon;
                const isPrimary = a.tone === 'accent';
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        addToast({
                          source: 'Growth',
                          type: isPrimary ? 'success' : 'info',
                          message: `${a.label} — wired in a future sprint`,
                        });
                      }}
                      className="group flex w-full items-center gap-2.5 border-2 px-3 py-3 text-left transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]"
                      style={{
                        borderColor: isPrimary ? GROWTH_ACCENT : 'var(--theme-text)',
                        background: isPrimary
                          ? `color-mix(in srgb, ${GROWTH_ACCENT} 18%, var(--theme-surface))`
                          : 'var(--theme-surface)',
                        color: isPrimary ? GROWTH_ACCENT : 'var(--theme-text)',
                        borderRadius: 0,
                        boxShadow: isPrimary ? `4px 4px 0 ${GROWTH_ACCENT}` : '4px 4px 0 var(--theme-text)',
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
            boxShadow: `8px 8px 0 ${GROWTH_ACCENT}`,
            borderRadius: 0,
          }}
        >
          <div
            aria-hidden="true"
            className="h-[10px] w-full"
            style={{ backgroundImage: `repeating-linear-gradient(45deg, ${GROWTH_ACCENT} 0 8px, transparent 8px 16px)` }}
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
              {item.id} · trend {trend || '—'} · {item.experiments.length} experiment{item.experiments.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}