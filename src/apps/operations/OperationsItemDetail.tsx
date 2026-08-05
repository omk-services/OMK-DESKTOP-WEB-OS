/** OperationsItemDetail — brutalism layout.
 *
 * Canon: spec §4 #3 Operations — "Hero + 2-col split (Runbook body /
 *         Sidebar meta) + bordered incident chips".
 * Theme: brutalism (sharp 0px, hairline borders, oversized numerals).
 * Motion: fade-up 200ms.
 *
 * Covers: runbooks, articles, incidents, processes, benchmarks, changes,
 * alerts. Branches on def.id so each collection renders its own surface:
 *   - runbook: numbered steps
 *   - article: prose
 *   - incident: timeline + chips
 *   - process: inputs/outputs columns + edge cases
 *   - benchmark: pass-rate bar + failure mode
 *   - change: why + risk/policy chips
 *   - alert: hypothesis + monospace trace + enrichment state
 */
import type { JSX } from 'react';
import {
  AlertOctagon,
  BookOpen,
  Flame,
  GitBranch,
  Layers,
  Workflow,
  Gauge,
  Siren,
  TriangleAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function longtext(item: Record<string, unknown>, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v : '';
}

const BENCHMARK_TONE: Record<string, { fg: string; bg: string; border: string; label: string }> = {
  passed: { fg: '#15803d', bg: '#dcfce7', border: '#86efac', label: 'PASSED' },
  failed: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', label: 'FAILED' },
  flaky:  { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'FLAKY'  },
};

const CHANGE_STATUS_TONE: Record<string, { fg: string; bg: string; border: string }> = {
  proposed: { fg: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  approved: { fg: '#15803d', bg: '#dcfce7', border: '#86efac' },
  rejected: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

const RISK_TONE: Record<string, { fg: string; bg: string; border: string }> = {
  low:  { fg: '#15803d', bg: '#dcfce7', border: '#86efac' },
  med:  { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  high: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

const SEVERITY_TONE: Record<string, { fg: string; bg: string; border: string }> = {
  ok:     { fg: '#15803d', bg: '#dcfce7', border: '#86efac' },
  warn:   { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  danger: { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
};

const ENRICHMENT_TONE: Record<string, { fg: string; bg: string; border: string; label: string }> = {
  enriched: { fg: '#15803d', bg: '#dcfce7', border: '#86efac', label: 'ENRICHED' },
  raw:      { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d', label: 'RAW · NEEDS TRIAGE' },
};

function readString(item: Record<string, unknown>, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v : '';
}

function readList(item: Record<string, unknown>, key: string): string[] {
  const raw = readString(item, key);
  if (!raw) return [];
  return raw.split(/[·•]/).map(s => s.trim()).filter(Boolean);
}

export function OperationsItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const badge = def.badgeField ? String(item[def.badgeField] ?? '') : '';

  // Collect non-longtext fields, deduped with title/subtitle/badge.
  const skip = new Set([def.titleField, def.subtitleField, def.badgeField]);
  const metaFields = def.fields.filter(f => !skip.has(f.key) && f.type !== 'longtext');
  const proseField = def.fields.find(f => f.type === 'longtext');

  return (
    <div className="min-h-full" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      {/* BRUTAL header — no rounding, oversized numerals, hairline border */}
      <header
        className="px-7 pt-6 pb-5"
        style={{
          background: 'var(--panel-solid)',
          borderBottom: '1px solid var(--theme-text)',
        }}
      >
        <BackAffordance label="Back to operations" onBack={onBack} accent={accent} />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
                OPERATIONS · {collection.toUpperCase()}
              </span>
              {badge && <PillBadge accent={accent}>{badge}</PillBadge>}
            </div>
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95]"
              style={{ color: 'var(--theme-text)', fontVariantCaps: 'all-small-caps' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
            )}
          </div>
        </div>
      </header>

      {/* 2-col split body */}
      <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--theme-text)' }}>
        <article className="md:col-span-2 md:pr-6 md:border-r" style={{ borderColor: 'var(--theme-text)' }}>
          {collection === 'runbooks' && (
            <RunbookSteps body={longtext(item, proseField?.key ?? 'body')} />
          )}
          {collection === 'articles' && (
            <ArticleProse body={longtext(item, proseField?.key ?? 'body')} />
          )}
          {collection === 'incidents' && (
            <IncidentTimeline body={longtext(item, proseField?.key ?? 'body')} accent={accent} />
          )}
          {collection === 'processes' && (
            <ProcessBody item={item} accent={accent} />
          )}
          {collection === 'benchmarks' && (
            <BenchmarkBody item={item} />
          )}
          {collection === 'changes' && (
            <ChangeBody item={item} accent={accent} />
          )}
          {collection === 'alerts' && (
            <AlertBody item={item} accent={accent} />
          )}
          {collection !== 'runbooks'
            && collection !== 'articles'
            && collection !== 'incidents'
            && collection !== 'processes'
            && collection !== 'benchmarks'
            && collection !== 'changes'
            && collection !== 'alerts'
            && proseField && (
            <ArticleProse body={longtext(item, proseField.key)} />
          )}
        </article>

        {/* Sidebar meta */}
        <aside className="md:pl-6 mt-6 md:mt-0 space-y-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--theme-muted)' }}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">Metadata</span>
          </div>
          <dl className="space-y-3">
            {metaFields.map(f => (
              <div key={f.key}>
                <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                  {f.label}
                </dt>
                <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                  {formatField(item[f.key], f.type)}
                </dd>
              </div>
            ))}
          </dl>

          {collection === 'incidents' && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--theme-muted)' }}>
                <AlertOctagon className="w-3.5 h-3.5" />
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">Linked incidents</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className="text-[10.5px] font-extrabold uppercase tracking-wider px-2 py-1"
                    style={{
                      background: 'transparent',
                      color: accent,
                      border: `1.5px solid ${accent}`,
                      borderRadius: 0,
                    }}
                  >
                    INC-20{i.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

function RunbookSteps({ body }: { body: string }): JSX.Element {
  // Render lines starting with "##" as numbered steps, else as body.
  const blocks = body.split(/\n\n+/).filter(Boolean);
  const steps = blocks.filter(b => /^##\s/.test(b));
  const intro = blocks.find(b => !/^##\s/.test(b));

  return (
    <div className="space-y-5">
      {intro && (
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{intro.replace(/^#.*\n/, '').trim()}</p>
      )}
      <ol className="space-y-4">
        {steps.map((s, i) => {
          const [, titleLine, ...rest] = s.split('\n');
          return (
            <li key={i} className="flex gap-4">
              <span
                aria-hidden
                className="shrink-0 w-9 h-9 flex items-center justify-center text-base font-black"
                style={{
                  background: 'var(--theme-text)',
                  color: 'var(--theme-bg)',
                  borderRadius: 0,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
                  Step {String(i + 1).padStart(2, '0')}
                </div>
                <h2 className="text-lg font-extrabold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                  {titleLine?.replace(/^#+\s*/, '')}
                </h2>
                <p className="text-[13.5px] mt-1 leading-relaxed whitespace-pre-line" style={{ color: 'var(--theme-text)' }}>
                  {rest.join('\n').trim()}
                </p>
              </div>
            </li>
          );
        })}
        {steps.length === 0 && (
          <li className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            No numbered steps in this runbook body.
          </li>
        )}
      </ol>
    </div>
  );
}

function ArticleProse({ body }: { body: string }): JSX.Element {
  if (!body) {
    return <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>No body yet.</p>;
  }
  return (
    <div className="space-y-4">
      {body.split(/\n\n+/).map((para, i) => {
        if (/^#\s/.test(para)) {
          return (
            <h2 key={i} className="text-xl font-extrabold mt-2" style={{ color: 'var(--theme-text)' }}>
              {para.replace(/^#\s*/, '')}
            </h2>
          );
        }
        return (
          <p key={i} className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {para}
          </p>
        );
      })}
    </div>
  );
}

function IncidentTimeline({ body, accent }: { body: string; accent: string }): JSX.Element {
  const lines = body.split(/\n+/).filter(Boolean).slice(0, 6);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" style={{ color: accent }} />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>Timeline</span>
      </div>
      <ol className="space-y-3">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] font-extrabold"
              style={{
                background: 'transparent',
                color: 'var(--theme-text)',
                border: `1.5px solid ${accent}`,
                borderRadius: 0,
              }}
            >
              T{i + 1}
            </span>
            <p className="text-[13.5px] leading-relaxed pt-0.5" style={{ color: 'var(--theme-text)' }}>{line}</p>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            <GitBranch className="w-4 h-4 inline mr-1.5" /> No timeline entries recorded yet.
          </li>
        )}
      </ol>
    </div>
  );
}

/* ═══ Processus — cartography surface ═══ */

function ProcessBody({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const inputs = readList(item, 'inputs');
  const outputs = readList(item, 'outputs');
  const deps = readList(item, 'dependsOn');
  const edges = longtext(item, 'edgeCases');

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Workflow className="w-4 h-4" style={{ color: accent }} />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
          Process anatomy
        </span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ border: '1.5px solid var(--theme-text)' }}>
        <ListColumn
          title="Inputs"
          tone="#3b82f6"
          items={inputs}
          fallback="No inputs recorded."
        />
        <ListColumn
          title="Outputs"
          tone="#16a34a"
          items={outputs}
          fallback="No outputs recorded."
          borderLeft
        />
      </div>

      {deps.length > 0 && (
        <section>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--theme-muted)' }}>
            Depends on
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {deps.map((d, i) => (
              <li
                key={i}
                className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-1"
                style={{
                  background: 'transparent',
                  color: 'var(--theme-text)',
                  border: `1.5px solid ${accent}`,
                  borderRadius: 0,
                }}
              >
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="p-4"
        style={{
          background: '#fef3c7',
          borderLeft: '6px solid #f59e0b',
          color: '#1f2937',
          borderRadius: 0,
        }}
      >
        <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2 flex items-center gap-2">
          <TriangleAlert className="w-3.5 h-3.5" />
          Cas limites connus — quand ca casse, on fait quoi
        </h3>
        {edges ? (
          edges.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13px] leading-relaxed mt-1.5 first:mt-0">
              {line}
            </p>
          ))
        ) : (
          <p className="text-[13px]" style={{ color: '#1f2937' }}>No edge cases recorded yet.</p>
        )}
      </section>
    </div>
  );
}

function ListColumn({
  title,
  tone,
  items,
  fallback,
  borderLeft,
}: {
  title: string;
  tone: string;
  items: string[];
  fallback: string;
  borderLeft?: boolean;
}): JSX.Element {
  return (
    <div
      className="p-4"
      style={{
        borderLeft: borderLeft ? '1.5px solid var(--theme-text)' : undefined,
      }}
    >
      <h4 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color: tone }}>
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="text-[13px] leading-snug flex gap-2" style={{ color: 'var(--theme-text)' }}>
              <span aria-hidden style={{ color: tone }}>›</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px]" style={{ color: 'var(--theme-muted)' }}>{fallback}</p>
      )}
    </div>
  );
}

/* ═══ Benchmarks — pass-rate surface ═══ */

function BenchmarkBody({ item }: { item: Record<string, unknown> }): JSX.Element {
  const status = readString(item, 'status').toLowerCase();
  const tone = BENCHMARK_TONE[status] ?? BENCHMARK_TONE.flaky;
  const passRateRaw = Number(item.passRate ?? 0);
  const passRate = Number.isFinite(passRateRaw) ? Math.max(0, Math.min(100, passRateRaw)) : 0;
  const failureMode = longtext(item, 'failureMode');

  return (
    <div className="space-y-5">
      <div
        className="p-4"
        style={{
          background: tone.bg,
          border: `1.5px solid ${tone.border}`,
          borderRadius: 0,
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Gauge className="w-5 h-5" style={{ color: tone.fg }} />
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: tone.fg }}
          >
            {tone.label}
          </span>
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
            Pass rate
          </span>
          <span
            className="text-[44px] font-black leading-none tracking-[-0.04em] tabular-nums"
            style={{ color: tone.fg }}
          >
            {passRate}%
          </span>
        </div>
        <div
          className="mt-3 h-2"
          style={{
            background: 'rgba(0,0,0,0.08)',
            borderRadius: 0,
          }}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${passRate}%`, background: tone.fg }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-extrabold uppercase tracking-wider" style={{ color: tone.fg }}>
          <span>0%</span>
          <span style={{ color: 'var(--theme-muted)' }}>target ≥ 95%</span>
          <span>100%</span>
        </div>
      </div>

      {failureMode && (
        <section>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2 flex items-center gap-2" style={{ color: 'var(--theme-muted)' }}>
            <TriangleAlert className="w-3.5 h-3.5" />
            Failure mode — quand ce benchmark echoue
          </h3>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {failureMode}
          </p>
        </section>
      )}

      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
        Un benchmark qui ne peut pas echouer n'est pas un benchmark. {tone.label === 'PASSED' ? 'On surveille le prochain passage.' : tone.label === 'FAILED' ? 'Le rollback est deja propose dans la file Changements.' : 'Le watchdog surveille la prochaine 24h.'}
      </p>
    </div>
  );
}

/* ═══ Changements — change proposal surface ═══ */

function ChangeBody({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const status = readString(item, 'status').toLowerCase();
  const risk = readString(item, 'risk').toLowerCase();
  const statusTone = CHANGE_STATUS_TONE[status] ?? CHANGE_STATUS_TONE.proposed;
  const riskTone = RISK_TONE[risk] ?? RISK_TONE.med;
  const why = longtext(item, 'why');
  const policy = readString(item, 'policy');
  const proposedBy = readString(item, 'proposedBy');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span
          className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
          style={{ background: statusTone.bg, color: statusTone.fg, border: `1.5px solid ${statusTone.border}`, borderRadius: 0 }}
        >
          {status || 'proposed'}
        </span>
        <span
          className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
          style={{ background: riskTone.bg, color: riskTone.fg, border: `1.5px solid ${riskTone.border}`, borderRadius: 0 }}
        >
          risk · {risk || 'med'}
        </span>
        {policy && (
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
            style={{ background: 'transparent', color: 'var(--theme-text)', border: `1.5px solid ${accent}`, borderRadius: 0 }}
          >
            {policy}
          </span>
        )}
        {proposedBy && (
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
            style={{ background: 'transparent', color: 'var(--theme-muted)', border: '1.5px solid var(--panel-border-subtle)', borderRadius: 0 }}
          >
            proposed by {proposedBy}
          </span>
        )}
      </div>

      <section>
        <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--theme-muted)' }}>
          Why
        </h3>
        {why ? (
          why.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed mt-1.5 first:mt-0" style={{ color: 'var(--theme-text)' }}>
              {line}
            </p>
          ))
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--theme-muted)' }}>No rationale recorded.</p>
        )}
      </section>

      <p
        className="text-[11px] font-extrabold uppercase tracking-[0.18em]"
        style={{ color: status === 'approved' ? '#15803d' : status === 'rejected' ? '#b91c1c' : 'var(--theme-muted)' }}
      >
        {status === 'proposed' && 'En attente de decision humaine.'}
        {status === 'approved' && 'Approuve — pret a deployer au prochain sprint.'}
        {status === 'rejected' && 'Rejete — l\'agent ne redoublera pas avec la meme proposition.'}
      </p>
    </div>
  );
}

/* ═══ Alertes — pre-enriched incident surface ═══ */

function AlertBody({ item, accent }: { item: Record<string, unknown>; accent: string }): JSX.Element {
  const severity = readString(item, 'severity').toLowerCase();
  const enrichment = readString(item, 'enrichment').toLowerCase();
  const severityTone = SEVERITY_TONE[severity] ?? SEVERITY_TONE.warn;
  const enrichmentTone = ENRICHMENT_TONE[enrichment] ?? ENRICHMENT_TONE.raw;
  const hypothesis = longtext(item, 'hypothesis');
  const trace = longtext(item, 'trace');
  const riskScore = readString(item, 'riskScore');
  const source = readString(item, 'source');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span
          className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
          style={{ background: enrichmentTone.bg, color: enrichmentTone.fg, border: `1.5px solid ${enrichmentTone.border}`, borderRadius: 0 }}
        >
          {enrichmentTone.label}
        </span>
        <span
          className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
          style={{ background: severityTone.bg, color: severityTone.fg, border: `1.5px solid ${severityTone.border}`, borderRadius: 0 }}
        >
          severity · {severity || 'warn'}
        </span>
        {riskScore && (
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
            style={{ background: 'transparent', color: 'var(--theme-text)', border: `1.5px solid ${accent}`, borderRadius: 0 }}
          >
            risk score · {riskScore}
          </span>
        )}
        {source && (
          <span
            className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1"
            style={{ background: 'transparent', color: 'var(--theme-muted)', border: '1.5px solid var(--panel-border-subtle)', borderRadius: 0 }}
          >
            {source}
          </span>
        )}
      </div>

      <section
        className="p-4"
        style={{
          background: enrichment === 'raw' ? '#fef3c7' : '#f5f3ff',
          borderLeft: `6px solid ${enrichment === 'raw' ? '#f59e0b' : accent}`,
          color: '#1f2937',
          borderRadius: 0,
        }}
      >
        <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2 flex items-center gap-2">
          {enrichment === 'raw' ? <Siren className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {enrichment === 'raw' ? 'Hypothese manquante — triage manuel requis' : 'Hypothese de l\'agent'}
        </h3>
        {hypothesis ? (
          hypothesis.split(/(?<=\.)\s+/).map((line, i) => (
            <p key={i} className="text-[13px] leading-relaxed mt-1.5 first:mt-0">
              {line}
            </p>
          ))
        ) : (
          <p className="text-[13px]">Aucune hypothese. {enrichment === 'raw' ? 'Cet incident est parti en ticket vide — il faut ouvrir la trace avant tout.' : 'Cet incident est parti sans analyse prealable.'}</p>
        )}
      </section>

      {trace && (
        <section>
          <h3 className="text-[10.5px] font-extrabold uppercase tracking-[0.18em] mb-2 flex items-center gap-2" style={{ color: 'var(--theme-muted)' }}>
            {enrichment === 'raw' ? <XCircle className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
            Trace — extrait de log
          </h3>
          <pre
            className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono p-3"
            style={{
              background: '#0a0a14',
              color: '#e5e7eb',
              border: '1.5px solid var(--theme-text)',
              borderRadius: 0,
              overflowX: 'auto',
            }}
          >
            {trace}
          </pre>
        </section>
      )}

      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'var(--theme-muted)' }}>
        La personne d'astreinte n'ouvre plus un ticket vide. {enrichment === 'raw' ? 'Cet incident reste a enrichir avant action.' : 'Tout est pose — decider.'}
      </p>
    </div>
  );
}