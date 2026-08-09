/** MarketplaceItemDetail — glassmorphism layout.
 *
 * Canon: spec §4 #7 Marketplace — "Hero + bento grid 2x2 (screenshots /
 *         stats / install state)".
 * Theme: glassmorphism (refractive layers, editorial serif headings).
 * Motion: fade-blur 240ms.
 */
import { Download, Layers, Sparkles, Star } from 'lucide-react';
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

export function MarketplaceItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const status = readString(item, 'status', 'state') ?? 'Available';
  const rating = readNumber(item, 'rating');
  const installs = readNumber(item, 'installs');
  const category = readString(item, 'category');

  return (
    <div
      className="min-h-full p-7"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)' }}
    >
      {/* Editorial hero */}
      <BackAffordance label="Back to marketplace" onBack={onBack} accent={accent} />
      <header className="mt-5 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.25em]"
              style={{ color: accent }}
            >
              The marketplace · {category ?? def.singular}
            </span>
            {status && <PillBadge accent={accent}>{status}</PillBadge>}
          </div>
          <h1
            className="text-4xl md:text-5xl tracking-tight leading-[1.02]"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'ui-serif, Georgia, "Iowan Old Style", serif',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-base mt-2 max-w-prose" style={{ color: 'var(--theme-muted)' }}>{subtitle}</p>
          )}
        </div>
        {/* Visual block — soft glass over a tone gradient */}
        <div
          className="rounded-3xl h-44 md:h-56"
          style={{
            background: `linear-gradient(140deg, ${accent}55 0%, transparent 70%), var(--panel-solid)`,
            border: '1px solid var(--panel-border)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            boxShadow: `0 24px 60px -28px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
        />
      </header>

      {/* Bento grid 2×2 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tile 1: Stats */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            backdropFilter: 'blur(18px) saturate(1.3)',
            boxShadow: '0 12px 32px -22px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Highlights</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rating !== undefined && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Rating</div>
                <div className="text-2xl font-bold tabular-nums flex items-center gap-1" style={{ color: accent }}>
                  <Star className="w-4 h-4 fill-current" /> {rating.toFixed(1)}
                </div>
              </div>
            )}
            {installs !== undefined && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Installs</div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
                  {installs.toLocaleString('en-US')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tile 2: Install state */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            backdropFilter: 'blur(18px) saturate(1.3)',
            boxShadow: '0 12px 32px -22px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Install state</span>
          </div>
          <div className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>{status}</div>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-muted)' }}>
            {status.toLowerCase().includes('install') ? 'Already on your machine.' : 'One-click install from the marketplace.'}
          </p>
        </div>

        {/* Tile 3 (full-width): Attribute grid */}
        <div
          className="md:col-span-2 rounded-2xl p-5"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            backdropFilter: 'blur(18px) saturate(1.3)',
            boxShadow: '0 12px 32px -22px rgba(0,0,0,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--theme-muted)' }}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Specs</span>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {def.fields
              .filter(f => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
              .map(f => (
                <div key={f.key}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>{f.label}</dt>
                  <dd className="text-sm font-medium mt-0.5" style={{ color: 'var(--theme-text)' }}>{formatField(item[f.key], f.type)}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}
