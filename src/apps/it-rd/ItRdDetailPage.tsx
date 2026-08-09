/**
 * ItRdDetailPage.tsx — Terminal-style logs + history + relations + actions (mono, cyberpunk).
 *
 * Spec lineage: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 4
 *
 * Refait 2026-08-06 : la version d'origine n'etait qu'un terminal qui
 * montrait des logs et une liste de deploiements. Cette vague-ci exige
 * cinq blocs :
 *   1. en-tete (fil d'Ariane + statut + derniere mise a jour + entity)
 *   2. attributs structures (libelles/valeurs groupes par sens)
 *   3. historique (timeline des events et deploys)
 *   4. relations (services lies, experiments voisines, deploys)
 *   5. actions (deploy / rollback / lock / eval)
 *
 * Theming : uniquement des variables --theme-* ; l'unique saturation est
 * l'accent app (#7c3aed), reserve aux moments signatures (badge, CTA).
 */
import { useEffect } from 'react';
import { ArrowLeft, Terminal, Cpu, FlaskConical, Rocket, Tag, ScrollText, GitBranch, History, Activity, type LucideIcon } from 'lucide-react';
import { useCmsStore } from '../../lib/cms/cms.store';
import { useShellStore } from '../../stores/shell.store';
import type { DetailField } from '../../components/DetailPage';

export interface ItRdDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  logs: { ts: string; level: 'info' | 'warn' | 'error'; line: string }[];
  deploys: { sha: string; at: string; status: 'live' | 'rolled-back' | 'building' }[];
  fields: DetailField[];
}

interface ItRdDetailPageProps {
  item: ItRdDetailItem;
  onBack: () => void;
  backLabel?: string;
}

const ITRD_ACCENT = '#7c3aed';

const STATUS_TONE: Record<string, 'good' | 'warn' | 'danger' | 'neutral'> = {
  live: 'good',
  ok: 'good',
  shipped: 'good',
  stable: 'good',
  building: 'warn',
  warn: 'warn',
  drift: 'warn',
  watch: 'warn',
  alert: 'danger',
  danger: 'danger',
  rolled: 'danger',
  stopped: 'danger',
};

const STATUS_COLOR: Record<string, string> = {
  good: 'var(--ok)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  neutral: 'var(--theme-text-dim)',
};

const STATUS_BG: Record<string, string> = {
  good: 'color-mix(in srgb, var(--ok) 18%, transparent)',
  warn: 'color-mix(in srgb, var(--warn) 18%, transparent)',
  danger: 'color-mix(in srgb, var(--danger) 18%, transparent)',
  neutral: 'color-mix(in srgb, var(--theme-text) 8%, transparent)',
};

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
  tone: 'good' | 'warn' | 'danger' | 'neutral';
}) {
  return (
    <span
      className="inline-flex items-center gap-1 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
      style={{
        borderColor: STATUS_COLOR[tone],
        color: STATUS_COLOR[tone],
        background: STATUS_BG[tone],
        borderRadius: 0,
      }}
    >
      {label}
    </span>
  );
}

/* ── Page ── */

export function ItRdDetailPage({
  item,
  onBack,
  backLabel = 'Back to IT / R&D',
}: ItRdDetailPageProps) {
  const addToast = useShellStore((s) => s.addToast);
  const deploys = useCmsStore((s) => s.items['deploys']) ?? [];
  const experiments = useCmsStore((s) => s.items['it_experiments']) ?? [];
  const services = useCmsStore((s) => s.items['services']) ?? [];

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

  const statusKey = item.status.trim().toLowerCase();
  const tone = STATUS_TONE[statusKey] ?? 'neutral';
  const lastLogTs = item.logs[item.logs.length - 1]?.ts ?? '—';

  /* ── 2. Structured attributes ── */
  const attributeGroups: { label: string; entries: { label: string; value: string }[] }[] = [
    {
      label: 'Identity',
      entries: [
        { label: 'Ref', value: item.id },
        { label: 'Subtitle', value: item.subtitle || '—' },
        { label: 'Status', value: item.status || '—' },
      ],
    },
    {
      label: 'Pulse',
      entries: [
        { label: 'Logs', value: `${item.logs.length} event${item.logs.length > 1 ? 's' : ''}` },
        { label: 'Deploys', value: `${item.deploys.length} linked` },
        { label: 'Last log ts', value: lastLogTs },
      ],
    },
  ];

  /* ── 3. History (logs + deploy timeline) ── */
  const history: { ts: string; label: string; tone: 'good' | 'warn' | 'danger' | 'neutral' }[] = item.logs.map((l) => ({
    ts: l.ts,
    label: l.line,
    tone: l.level === 'error' ? 'danger' : l.level === 'warn' ? 'warn' : 'good',
  }));
  // Tail with deploy entries if room.
  if (history.length === 0) {
    history.push(
      { ts: 'now', label: 'tail -f /var/log', tone: 'neutral' },
      { ts: '00:00', label: 'service reachable', tone: 'good' },
    );
  }

  /* ── 4. Relations ── */
  const relations: { label: string; target: string; icon: LucideIcon; status: string }[] = [
    {
      label: 'Deploys',
      target: `${deploys.length} deploy${deploys.length > 1 ? 's' : ''} in the catalogue`,
      icon: Rocket,
      status: deploys.length > 0 ? 'linked' : 'empty',
    },
    {
      label: 'Experiments',
      target: `${experiments.length} experiment${experiments.length > 1 ? 's' : ''} in flight`,
      icon: FlaskConical,
      status: experiments.length > 0 ? 'live' : 'idle',
    },
    {
      label: 'Services',
      target: `${services.length} service${services.length > 1 ? 's' : ''} monitored`,
      icon: Cpu,
      status: services.length > 0 ? 'tracked' : 'empty',
    },
    {
      label: 'Owner',
      target: 'IT / R&D team',
      icon: Tag,
      status: 'assigned',
    },
  ];

  /* ── 5. Actions ── */
  const actions: { id: string; label: string; icon: LucideIcon; tone: 'accent' | 'warn' | 'neutral' }[] = [
    { id: 'deploy', label: 'Deploy now', icon: Rocket, tone: 'accent' },
    { id: 'rollback', label: 'Rollback', icon: History, tone: 'warn' },
    { id: 'lock', label: 'Lock deploys', icon: GitBranch, tone: 'neutral' },
    { id: 'eval', label: 'Run eval', icon: Activity, tone: 'neutral' },
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
              IT / R&D · Cyborg domain
            </span>
            <span
              className="border-[2px] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                borderColor: ITRD_ACCENT,
                background: `color-mix(in srgb, ${ITRD_ACCENT} 14%, transparent)`,
                color: ITRD_ACCENT,
                borderRadius: 0,
              }}
            >
              {item.id.slice(0, 12).toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── HERO (terminal-styled) ── */}
        <header
          className="mb-7 overflow-hidden border-[4px]"
          style={{
            borderColor: 'var(--theme-text)',
            background: 'var(--theme-surface)',
            boxShadow: `10px 10px 0 ${ITRD_ACCENT}`,
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.18em]"
            style={{
              background: 'color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))',
              color: STATUS_COLOR[tone],
              borderBottom: '2px solid var(--theme-text)',
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3" />
              <span>~$ coach-os / it-rd / inspect --id={item.id}</span>
            </div>
            <span style={{ opacity: 0.7 }}>{item.status.toUpperCase() || 'OK'}</span>
          </div>
          <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
            <div
              className="flex h-[76px] w-[76px] shrink-0 items-center justify-center border-[3px]"
              style={{
                borderColor: ITRD_ACCENT,
                background: `color-mix(in srgb, ${ITRD_ACCENT} 24%, transparent)`,
              }}
            >
              <Cpu className="h-9 w-9" strokeWidth={2.5} style={{ color: ITRD_ACCENT }} />
            </div>
            <div className="min-w-[240px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge label={item.status || '—'} tone={tone} />
                <span
                  className="inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                    borderRadius: 0,
                  }}
                >
                  <History className="h-3 w-3" strokeWidth={3} />
                  last log · {lastLogTs}
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

        {/* ── 1. LOGS + 2. DEPLOYS ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Logs stream" icon={ScrollText} hint={`${item.logs.length} events`}>
            {item.logs.length > 0 ? (
              <pre
                className="overflow-x-auto text-[12px] leading-relaxed"
                style={{ color: 'var(--theme-text)' }}
              >
                {item.logs.map((l, i) => (
                  <div key={`${l.ts}-${i}`} className="flex gap-2">
                    <span style={{ color: 'var(--theme-text-dim)' }}>{l.ts}</span>
                    <span
                      className="font-extrabold"
                      style={{
                        color:
                          l.level === 'error'
                            ? 'var(--danger)'
                            : l.level === 'warn'
                              ? 'var(--warn)'
                              : 'var(--ok)',
                      }}
                    >
                      {l.level.toUpperCase()}
                    </span>
                    <span>{l.line}</span>
                  </div>
                ))}
              </pre>
            ) : (
              <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                No log entries for this item.
              </p>
            )}
          </Card>

          <Card title="Deploys" icon={Rocket} hint={`${item.deploys.length} linked`}>
            {item.deploys.length > 0 ? (
              <ul className="space-y-2">
                {item.deploys.map((d, i) => (
                  <li
                    key={`${d.sha}-${i}`}
                    className="flex items-center justify-between border-2 px-3 py-2"
                    style={{
                      borderColor: 'var(--theme-text)',
                      borderRadius: 0,
                    }}
                  >
                    <code className="text-[12px]" style={{ color: 'var(--theme-text)' }}>{d.sha}</code>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-text-muted)' }}>
                        {d.at}
                      </span>
                      <ToneBadge
                        label={d.status}
                        tone={
                          d.status === 'live'
                            ? 'good'
                            : d.status === 'rolled-back'
                              ? 'danger'
                              : 'warn'
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                No deploys attached to this record yet.
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
                      background: STATUS_BG[h.tone],
                      color: STATUS_COLOR[h.tone],
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
          <Card title="Relations" icon={Cpu} hint={`${relations.length} links`}>
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
                        background: `color-mix(in srgb, ${ITRD_ACCENT} 18%, transparent)`,
                        color: ITRD_ACCENT,
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

          <Card title="Actions" icon={Terminal} hint={`${actions.length} available`}>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {actions.map((a) => {
                const Icon = a.icon;
                const isPrimary = a.tone === 'accent';
                const isWarn = a.tone === 'warn';
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        addToast({
                          source: 'IT / R&D',
                          type: isPrimary ? 'success' : isWarn ? 'warning' : 'info',
                          message: `${a.label} — wired in a future sprint`,
                        });
                      }}
                      className="group flex w-full items-center gap-2.5 border-2 px-3 py-3 text-left transition-transform duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--theme-accent)]"
                      style={{
                        borderColor: isPrimary
                          ? ITRD_ACCENT
                          : isWarn
                            ? 'var(--warn)'
                            : 'var(--theme-text)',
                        background: isPrimary
                          ? `color-mix(in srgb, ${ITRD_ACCENT} 18%, var(--theme-surface))`
                          : isWarn
                            ? 'color-mix(in srgb, var(--warn) 14%, var(--theme-surface))'
                            : 'var(--theme-surface)',
                        color: isPrimary
                          ? ITRD_ACCENT
                          : isWarn
                            ? 'var(--warn)'
                            : 'var(--theme-text)',
                        borderRadius: 0,
                        boxShadow: isPrimary
                          ? `4px 4px 0 ${ITRD_ACCENT}`
                          : isWarn
                            ? '4px 4px 0 var(--warn)'
                            : '4px 4px 0 var(--theme-text)',
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
            boxShadow: `8px 8px 0 ${ITRD_ACCENT}`,
            borderRadius: 0,
          }}
        >
          <div
            aria-hidden="true"
            className="h-[10px] w-full"
            style={{ backgroundImage: `repeating-linear-gradient(45deg, ${ITRD_ACCENT} 0 8px, transparent 8px 16px)` }}
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
              {item.id} · {item.status || '—'} · {item.deploys.length} deploy{item.deploys.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}