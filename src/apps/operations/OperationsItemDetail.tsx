/** OperationsItemDetail — brutalism layout.
 *
 * Canon: spec §4 #3 Operations — "Hero + 2-col split (Runbook body /
 *         Sidebar meta) + bordered incident chips".
 * Theme: brutalism (sharp 0px, hairline borders, oversized numerals).
 * Motion: fade-up 200ms.
 *
 * Covers: runbooks, articles, incidents. Branches on def.id so each
 * collection renders its own surface (runbook: numbered steps,
 * article: prose, incident: timeline + chips).
 */
import type { JSX } from 'react';
import { AlertOctagon, BookOpen, Flame, GitBranch, Layers } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function longtext(item: Record<string, unknown>, key: string): string {
  const v = item[key];
  return typeof v === 'string' ? v : '';
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
            <div className="flex items-center gap-2 mb-2">
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
          {collection !== 'runbooks' && collection !== 'articles' && collection !== 'incidents' && proseField && (
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
