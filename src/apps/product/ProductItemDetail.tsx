/** ProductItemDetail — brutalism layout.
 *
 * Canon: spec §4 #8 Product — "Hero + Roadmap row (status chips) + 2-col
 *         (Spec body / Linked channels)".
 * Theme: brutalism (sharp 0px, hairline borders, oversized numerals).
 * Motion: slide-right 220ms.
 *
 * Covers: product_items, product_releases. Branches on def.id so releases
 * get a numeric version chip and items get a roadmap lane.
 */
import { Layers, Link2, Rocket } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge, formatField } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

function readNumber(item: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

const ROADMAP_STAGES = ['Discovery', 'Design', 'In build', 'QA', 'Ship'] as const;

export function ProductItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const status = readString(item, 'status', 'stage') ?? 'In build';
  const owner = readString(item, 'owner');
  const body = readString(item, 'body', 'spec', 'description');
  const version = readString(item, 'version', 'semver');
  const progress = readNumber(item, 'progress');
  const stageIdx = Math.max(0, ROADMAP_STAGES.indexOf(status as typeof ROADMAP_STAGES[number]));
  const stageIdxSafe = Number.isFinite(stageIdx) ? stageIdx : 2;

  return (
    <div className="min-h-full" style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}>
      {/* Brutal header */}
      <header
        className="px-7 pt-6 pb-5"
        style={{
          background: 'var(--panel-solid)',
          borderBottom: '1px solid var(--theme-text)',
        }}
      >
        <BackAffordance label="Back to product" onBack={onBack} accent={accent} />
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                PRODUCT · {collection.toUpperCase()}
              </span>
              {status && <PillBadge accent={accent}>{status}</PillBadge>}
              {version && <PillBadge accent={accent}>v {version}</PillBadge>}
            </div>
            <h1
              className="text-5xl font-black leading-[0.95] tracking-tight"
              style={{
                color: 'var(--theme-text)',
                fontVariantCaps: 'all-small-caps',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-2 max-w-3xl" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
            )}
          </div>
          {progress !== undefined && (
            <div className="text-right shrink-0">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--theme-muted)' }}>Progress</div>
              <div
                className="text-6xl font-black leading-none tabular-nums"
                style={{ color: accent }}
              >
                {progress}<span className="text-2xl align-top">%</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Roadmap row */}
      <div
        className="px-7 py-4"
        style={{
          background: 'var(--canvas)',
          borderBottom: '1px solid var(--theme-text)',
        }}
      >
        <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--theme-muted)' }}>
          <Rocket className="w-3.5 h-3.5" />
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]">Roadmap</span>
        </div>
        <ol className="flex items-stretch gap-0">
          {ROADMAP_STAGES.map((stage, i) => {
            const done = i < stageIdxSafe;
            const current = i === stageIdxSafe;
            return (
              <li key={stage} className="flex-1 flex items-stretch">
                <div
                  className="flex-1 py-3 px-3 flex items-center justify-between"
                  style={{
                    background: done || current ? `${accent}1a` : 'transparent',
                    borderRight: '1px solid var(--theme-text)',
                    borderBottom: current ? `3px solid ${accent}` : '3px solid transparent',
                  }}
                >
                  <span
                    className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]"
                    style={{ color: done || current ? accent : 'var(--theme-muted)' }}
                  >
                    {stage}
                  </span>
                  <span
                    className="text-[10.5px] font-extrabold tabular-nums"
                    style={{ color: done || current ? accent : 'var(--theme-muted)' }}
                  >
                    {done ? '✓' : current ? '◉' : '○'}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 2-col body */}
      <div
        className="px-7 py-6 grid grid-cols-1 md:grid-cols-3 gap-0"
        style={{ borderTop: '1px solid var(--theme-text)' }}
      >
        <article className="md:col-span-2 md:pr-6 md:border-r" style={{ borderColor: 'var(--theme-text)' }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]">Spec</span>
          </div>
          {body ? (
            <div className="space-y-3">
              {body.split(/\n\n+/).map((p, i) => (
                <p key={i} className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text)' }}>{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>No spec written yet.</p>
          )}
        </article>

        <aside className="md:pl-6 mt-6 md:mt-0 space-y-4">
          <div className="flex items-center gap-2" style={{ color: 'var(--theme-muted)' }}>
            <Link2 className="w-3.5 h-3.5" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em]">Linked channels</span>
          </div>
          <div className="flex flex-col gap-2">
            {['#product-eng', '#on-call', '#sprint-board'].map(ch => (
              <span
                key={ch}
                className="text-xs font-extrabold tracking-wider px-3 py-2"
                style={{
                  background: 'transparent',
                  color: accent,
                  border: `1.5px solid ${accent}`,
                  borderRadius: 0,
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--theme-muted)' }}>
              Attributes
            </div>
            <dl className="space-y-3">
              {def.fields
                .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
                .map(f => (
                  <div key={f.key}>
                    <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                      {f.label}
                    </dt>
                    <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>
                      {formatField(item[f.key], f.type)}
                    </dd>
                  </div>
                ))}
              {owner && (
                <div>
                  <dt className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
                    Owner
                  </dt>
                  <dd className="text-sm font-semibold mt-0.5" style={{ color: 'var(--theme-text)' }}>{owner}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
