/**
 * SalesApp — section Pipeline : snapshot tiles, deals by stage, trends,
 * rep scorecard, et le seul temoin de Cognition (carte + lien vers l'app
 * dediee). Extrait de SalesApp.tsx.
 */
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Calendar, ChevronRight, WalletCards } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsItem } from '../../../lib/cms/types';
import type { DetailItem } from '../SalesDetailPage';
import {
  ACCENT, Eyebrow, Frame, FONT_BODY, FONT_DISPLAY, FONT_MONO, LOSE, PageHeader, RELANCE, WIN,
  type DealStage, type SnapshotStat, type TrendSeries,
} from './Primitives';

const STAGES: DealStage[] = [];
void STAGES;

const TRENDS: TrendSeries[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void TRENDS;

/** Une carte du Snapshot. Le chiffre doit rester grand — c'est la signature de la
 *  reference — mais 40px fixes debordaient : « $486k » etait coupe net par le
 *  bord droit des que la fenetre retrecissait.
 *
 *  Deux fausses pistes, notees pour qu'on ne les reprenne pas : `vw` mesure la
 *  FENETRE, pas la carte, donc un `clamp()` en vw ne se declenchait jamais dans
 *  une fenetre large ; et `overflow-wrap: anywhere` coupait « $486k » en
 *  « $48 / 6k », ce qui est pire qu'un debordement. La bonne unite est `cqw`,
 *  relative au conteneur declare juste au-dessus. Le nombre ne se coupe jamais.
 *
 *  Le bloc etait aussi duplique pour la sixieme carte ; il ne l'est plus. */
function SnapshotCard({ stat }: { stat: SnapshotStat }) {
  return (
    <Frame accent={stat.accent}>
      <div className="p-5" style={{ containerType: 'inline-size' }}>
        <Eyebrow>{stat.label}</Eyebrow>
        <div
          className="mt-3 font-extrabold leading-none tracking-tight"
          style={{
            fontFamily: FONT_DISPLAY,
            color: 'var(--theme-text)',
            fontSize: 'clamp(20px, 26cqw, 40px)',
            whiteSpace: 'nowrap',
          }}
        >
          {stat.value}
        </div>
        <div className="mt-3 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          {stat.sub}
        </div>
      </div>
    </Frame>
  );
}

// ─── Pipeline: derive snapshot + stage tiles from the live `deals` collection.
//     The legacy `sales_snapshot` and `sales_stages` CMS collections were
//     retired by the 2026-08-10 debt pass: their values were editorial
//     numbers disconnected from the deal data. Numbers below now come from
//     the same `deals` collection the kanban reads from, so a new deal
//     added through the kanban updates the pipeline value immediately. ───

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const abs = Math.abs(n);
  if (abs < 1000) return `$${Math.round(n).toLocaleString('en-US')}`;
  if (abs < 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n / 1000).toLocaleString('en-US')}k`;
}

interface PipelineSummary {
  pipelineSum: number;
  pipelineCount: number;
  wonSum: number;
  wonCount: number;
  lostCount: number;
  avg: number;
  min: number;
  max: number;
  closed: number;
  winRate: number | null;
}

function summarizeDeals(deals: CmsItem[]): PipelineSummary {
  const valueOf = (d: CmsItem): number => (typeof d['value'] === 'number' ? d['value'] : 0);
  const stageOf = (d: CmsItem): string => String(d['stage'] ?? '');
  const open = deals.filter((d) => stageOf(d) !== 'Won' && stageOf(d) !== 'Lost');
  const won = deals.filter((d) => stageOf(d) === 'Won');
  const lost = deals.filter((d) => stageOf(d) === 'Lost');
  const pipelineSum = open.reduce((acc, d) => acc + valueOf(d), 0);
  const wonSum = won.reduce((acc, d) => acc + valueOf(d), 0);
  const allValues = deals.map(valueOf);
  const avg = allValues.length === 0 ? 0 : allValues.reduce((acc, n) => acc + n, 0) / allValues.length;
  const min = allValues.length === 0 ? 0 : Math.min(...allValues);
  const max = allValues.length === 0 ? 0 : Math.max(...allValues);
  const closed = won.length + lost.length;
  const winRate = closed === 0 ? null : won.length / closed;
  return { pipelineSum, pipelineCount: open.length, wonSum, wonCount: won.length, lostCount: lost.length, avg, min, max, closed, winRate };
}

const STAGE_DEFS: { id: string; label: string; tone: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }[] = [
  { id: 'Qualified', label: 'Qualified', tone: 'accent' },
  { id: 'Proposal', label: 'Proposal', tone: 'warn' },
  { id: 'Won', label: 'Won, this quarter', tone: 'ok' },
  { id: 'Lost', label: 'Lost or cold', tone: 'danger' },
];


export function PipelinePanel({ onSelect, navigateToSection, onOpenCognition }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void; onOpenCognition: () => void }) {
  void onSelect; // PipelinePanel currently exposes data only — no per-item detail
  // Read the live `deals` collection (registered in src/lib/cms/seed.ts).
  // Falls back to an empty array if the collection isn't registered yet
  // (HMR can mount before the global seed runs).
  const deals = useCmsStore((s) => s.items['deals']) ?? [];
  const scoreItems = useCmsStore(s => s.items['sales_scores']) ?? [];
  const trendItems = useCmsStore(s => s.items['sales_trends']) ?? [];

  const summary = useMemo(() => summarizeDeals(deals), [deals]);

  // Snapshot tiles — 5 cards. The 6th tile (Meetings/week) was retired
  // because no source exists in the CMS; literal values cannot stand.
  // Rep score stays as a literal (its source is `sales_scores`, a separate
  // collection; deriving it from sales_scores would change semantics).
  const snapshotItems: SnapshotStat[] = useMemo(() => {
    const pipelineAccent: SnapshotStat['accent'] = summary.pipelineSum > 0 ? 'ok' : 'neutral';
    const wonAccent: SnapshotStat['accent'] = summary.wonSum > 0 ? 'ok' : 'neutral';
    const winRateAccent: SnapshotStat['accent'] =
      summary.winRate === null
        ? 'neutral'
        : summary.winRate >= 0.5
          ? 'ok'
          : summary.winRate >= 0.25
            ? 'warn'
            : 'danger';
    return [
      { id: 'snap-pipeline', label: 'Pipeline value', value: formatMoney(summary.pipelineSum), sub: `${summary.pipelineCount} open deals`, accent: pipelineAccent },
      { id: 'snap-won', label: 'Won this quarter', value: formatMoney(summary.wonSum), sub: `${summary.wonCount} deals closed`, accent: wonAccent },
      { id: 'snap-winrate', label: 'Win rate', value: summary.winRate === null ? '—' : `${Math.round(summary.winRate * 100)}%`, sub: summary.closed > 0 ? `of ${summary.closed} closed deals` : 'no closed deals yet', accent: winRateAccent },
      { id: 'snap-avg', label: 'Avg deal size', value: formatMoney(summary.avg), sub: deals.length === 0 ? 'no deals yet' : `min ${formatMoney(summary.min)} · max ${formatMoney(summary.max)}`, accent: 'neutral' },
      { id: 'snap-rep', label: 'Rep score', value: '7.5', sub: 'demo strong, close the gap', accent: 'danger' },
    ];
  }, [summary, deals.length]);

  // Stage tiles — derived from the live `deals` collection. Each stage's
  // count and value are recomputed when deals change. A trailing "Other"
  // bucket captures any deals with an unrecognised stage (forward-safe).
  const stageItems: DealStage[] = useMemo(() => {
    const valueOf = (d: CmsItem): number => (typeof d['value'] === 'number' ? d['value'] : 0);
    const stageOf = (d: CmsItem): string => String(d['stage'] ?? '');
    const knownStageIds = new Set(STAGE_DEFS.map((sd) => sd.id));
    const items: DealStage[] = STAGE_DEFS.map((sd) => {
      const inStage = deals.filter((d) => stageOf(d) === sd.id);
      const sum = inStage.reduce((acc, d) => acc + valueOf(d), 0);
      const weighted =
        sd.id === 'Won'
          ? `${formatMoney(sum)} closed`
          : sd.id === 'Lost'
            ? 're-engagement targets'
            : `${formatMoney(sum)} in stage`;
      return { id: sd.id, label: sd.label, count: inStage.length, weighted, tone: sd.tone };
    });
    const other = deals.filter((d) => !knownStageIds.has(stageOf(d)));
    if (other.length > 0) {
      const sum = other.reduce((acc, d) => acc + valueOf(d), 0);
      items.push({ id: 'stage-other', label: 'Other stages', count: other.length, weighted: `${formatMoney(sum)} in stage`, tone: 'neutral' });
    }
    return items;
  }, [deals]);
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  const num = (item: CmsItem | undefined, key: string): number => {
    if (!item) return 0;
    const v = item[key];
    return typeof v === 'number' ? v : 0;
  };
  // TRENDS points are JSON-stringified in the CMS longtext field.
  const pointsOf = (item: CmsItem | undefined): { label: string; value: number }[] => {
    if (!item) return [];
    const raw = item['points'];
    if (typeof raw !== 'string' || raw.length === 0) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((p): p is { label: string; value: number } =>
          p && typeof p === 'object' && typeof p.label === 'string' && typeof p.value === 'number'
        );
    } catch {
      return [];
    }
  };
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Pipeline"
        title="Sales OS"
        subtitle="The stateful operating layer behind the coaching offer — knows the deals, keeps itself current, and acts across the stack."
        meta={{ label: 'Updated', value: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), sub: 'Regenerated daily after the morning routines' }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Pipeline' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Pipeline' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      {/* 01 Snapshot */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Snapshot
            </h2>
          </div>
          <Eyebrow>CRM reconciled {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Eyebrow>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {snapshotItems.map((it) => (
            <SnapshotCard
              key={it.id}
              stat={{
                id: String(it.id),
                label: it.label || '—',
                value: it.value || '—',
                sub: it.sub,
                accent: (it.accent || 'ok') as SnapshotStat['accent'],
              }}
            />
          ))}
        </div>
      </section>

      {/* 02 CRM snapshot, deals by stage */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >02</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              CRM snapshot, deals by stage
            </h2>
          </div>
        </div>
        <p className="mb-4 text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          Live from the Attio <span className="font-bold" style={{ color: 'var(--theme-text)' }}>"AI Business OS"</span> list. Augmented daily, never replaced.
        </p>
        <article
          className="rounded-2xl"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul>
            {stageItems.map((it, i) => {
              const stageTone = it.tone;
              return (
              <li
                key={it.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-md px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background:
                        stageTone === 'ok'
                          ? 'rgba(21,128,61,0.10)'
                          : stageTone === 'warn'
                            ? 'rgba(180,83,9,0.10)'
                            : stageTone === 'danger'
                              ? 'rgba(185,28,28,0.10)'
                              : stageTone === 'neutral'
                                ? 'rgba(100,116,139,0.10)'
                                : 'rgba(234,88,12,0.10)',
                      color:
                        stageTone === 'ok' ? WIN : stageTone === 'warn' ? RELANCE : stageTone === 'danger' ? LOSE : stageTone === 'neutral' ? 'var(--theme-text-muted)' : ACCENT,
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    {it.label || '—'}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 text-right">
                  <span
                    className="text-[18px] font-extrabold tabular-nums"
                    style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                  >
                    {it.count}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}>
                    deals
                  </span>
                  <span
                    className="ml-4 w-40 text-right text-[12.5px]"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {it.weighted || '—'}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        </article>
      </section>

      {/* 03 Pipeline trends */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >03</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Pipeline trends
            </h2>
          </div>
          <Eyebrow>Regenerate daily</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trendItems.map((t) => {
            const accent = (txt(t, 'accent') || 'accent') as TrendSeries['accent'];
            return (
              <TrendCard
                key={t.id}
                series={{
                  id: String(t.id),
                  title: txt(t, 'title') || '—',
                  caption: txt(t, 'caption') || '',
                  unit: txt(t, 'unit') || '',
                  points: pointsOf(t),
                  accent,
                }}
              />
            );
          })}
        </div>
      </section>

      {/* 04 Rep scorecard */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >04</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Rep scorecard
            </h2>
          </div>
          <Eyebrow>7.5 average</Eyebrow>
        </div>
        <article
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul className="space-y-4">
            {scoreItems.map((s) => {
              const pct = Math.round((num(s, 'value') / num(s, 'outOf')) * 100);
              const color = txt(s, 'tone') === 'ok' ? WIN : txt(s, 'tone') === 'warn' ? RELANCE : LOSE;
              return (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-[12.5px] font-bold"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {txt(s, 'label') || '—'}
                    </span>
                    <span
                      className="text-[18px] font-extrabold tabular-nums"
                      style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                    >
                      {num(s, 'value').toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--theme-surface-hover)' }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {txt(s, 'note') || '—'}
                  </p>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      {/* 05 Cognition indicator — Brief N (2026-08-11).
         *  Sales garde UN SEUL temoin de Cognition : une carte avec un lien
         *  qui ouvre l'app dediee via openApp. Pas d'etats, pas de chargement,
         *  pas de gestion d'erreur — tout cela vit dans l'app Cognition. */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >05</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Cognition
            </h2>
          </div>
          <Eyebrow>bureau dedie</Eyebrow>
        </div>
        <button
          type="button"
          onClick={onOpenCognition}
          className="flex w-full items-center justify-between gap-3 rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--panel-border)',
            boxShadow: '0 1px 0 var(--panel-border-subtle)',
          }}
          aria-label="Ouvrir l'app Cognition"
        >
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-dim)' }}
            >
              Routines · journal · manifeste
            </div>
            <div
              className="mt-1 text-[15px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Cognition a son bureau
            </div>
            <p
              className="mt-1 text-[12.5px] leading-relaxed"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              La couche Cognition a quitte Sales. Routines, journal des evenements,
              manifeste du graphe et souverainete du savoir vivent dans l'app dediee.
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0"
            style={{ color: 'var(--theme-text-dim)' }}
          />
        </button>
      </section>
    </div>
  );
}

function TrendCard({ series }: { series: TrendSeries }): ReactElement {
  const max = Math.max(...series.points.map((p) => p.value));
  const color = series.accent === 'ok' ? WIN : series.accent === 'warn' ? RELANCE : series.accent === 'danger' ? LOSE : ACCENT;
  const fillColor = series.accent === 'ok' ? 'rgba(21,128,61,0.10)' : series.accent === 'warn' ? 'rgba(180,83,9,0.10)' : series.accent === 'danger' ? 'rgba(185,28,28,0.10)' : 'rgba(234,88,12,0.10)';
  const w = 560;
  const h = 180;
  const padX = 32;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = innerW / (series.points.length - 1);
  const points = series.points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (p.value / max) * innerH;
    return { x, y, ...p };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

  return (
    <article
      className="rounded-2xl p-6"
      style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
    >
      <div className="mb-1 flex items-center gap-2">
        {series.id === 'tr-meetings' ? <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--theme-text)' }} /> : <WalletCards className="h-3.5 w-3.5" style={{ color: 'var(--theme-text)' }} />}
        <h3
          className="text-[15px] font-extrabold tracking-tight"
          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
        >
          {series.title}
        </h3>
      </div>
      <p className="mb-4 text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
        {series.caption}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" aria-hidden>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padX}
            x2={padX + innerW}
            y1={padY + innerH * tick}
            y2={padY + innerH * tick}
            stroke="var(--panel-border-subtle)"
            strokeWidth={1}
          />
        ))}
        <path d={areaD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="var(--theme-surface)" strokeWidth={1.5} />
        ))}
        {points.map((p) => (
          <text
            key={`l-${p.label}`}
            x={p.x}
            y={h - 4}
            textAnchor="middle"
            fontSize="9"
            fontFamily={FONT_MONO}
            fill="var(--theme-text-dim)"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </article>
  );
}
