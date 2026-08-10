/**
 * ThemeDetailPage — premium per-theme detail view (5 design variants ultra-premium).
 * Different from the generic SettingsThemeCard grid: this is a full-screen, deeply-crafted artifact
 * showing the theme's "soul" — color tokens, motion grammar, layout preview, usage examples.
 * Sister pattern: app-detail pages (SalesDetailPage, FleetDetail in PeopleApp).
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Layers, Sparkles, Zap, Eye, Code2, type LucideIcon } from 'lucide-react';
import { AppleStyle, BentoStyle, EditorialStyle, BrutalistStyle, CyberpunkStyle } from './theme-details';

interface ThemeDetailPageProps {
  themeId: string;
  onBack: () => void;
}

const DESIGN_VARIANTS: Array<{ id: string; label: string; icon: LucideIcon; description: string }> = [
  { id: 'apple',     label: 'Apple Vision',  icon: Sparkles,   description: 'Frosted glass, generous spacing, motion-language-driven hierarchy.' },
  { id: 'bento',     label: 'Bento Grid',    icon: Layers,     description: 'Modular cards, asymmetric grid, dense information architecture.' },
  { id: 'editorial', label: 'Editorial',     icon: Eye,        description: 'Long-form serif, narrow gutter, print-derived typography.' },
  { id: 'brutalist', label: 'Brutalist',     icon: Zap,        description: 'Hard borders, mono accents, drop-shadow blocks, no bullshit.' },
  { id: 'cyber',     label: 'Cyberpunk',     icon: Code2,      description: 'Neon pulse, monospace, scan-lines, terminal-grade instrumentation.' },
];

const DEFAULT_VARIANT = 'apple';

export function ThemeDetailPage({ themeId, onBack }: ThemeDetailPageProps) {
  const [variant, setVariant] = useState<string>(DEFAULT_VARIANT);

  // Persist selection per-theme per-session (localStorage light-touch).
  useEffect(() => {
    const key = `theme-detail-variant::${themeId}`;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (stored && DESIGN_VARIANTS.find(v => v.id === stored)) setVariant(stored);
  }, [themeId]);
  useEffect(() => {
    const key = `theme-detail-variant::${themeId}`;
    if (typeof window !== 'undefined') window.localStorage.setItem(key, variant);
  }, [themeId, variant]);

  const variantMeta = useMemo(
    () => DESIGN_VARIANTS.find(v => v.id === variant) ?? DESIGN_VARIANTS[0],
    [variant],
  );

  // Index 1-based du variant courant. Auparavant on concaténait `variant + 1`
  // — mais `variant` est une chaîne ('apple'), donc le rendu montrait
  // "apple1/5" au lieu de "1/5". On calcule l'index dans DESIGN_VARIANTS.
  const variantIndex = useMemo(
    () => Math.max(1, DESIGN_VARIANTS.findIndex((v) => v.id === variant) + 1),
    [variant],
  );

  const Preview = useMemo(() => {
    switch (variant) {
      case 'apple':     return <AppleStyle themeId={themeId} />;
      case 'bento':     return <BentoStyle themeId={themeId} />;
      case 'editorial': return <EditorialStyle themeId={themeId} />;
      case 'brutalist': return <BrutalistStyle themeId={themeId} />;
      case 'cyber':     return <CyberpunkStyle themeId={themeId} />;
      default:          return <AppleStyle themeId={themeId} />;
    }
  }, [variant, themeId]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Themes
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--theme-muted)]">
            Theme Preview
          </span>
        </div>

        {/* Title block */}
        <header className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-muted)]">
            {themeId}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--theme-text)]">
            {variantMeta.label}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--theme-muted)]">{variantMeta.description}</p>
        </header>

        {/* Variant selector — 5 chips */}
        <div className="flex flex-wrap items-center gap-2">
          {DESIGN_VARIANTS.map((v) => {
            const Icon = v.icon;
            const selected = v.id === variant;
            return (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  selected
                    ? 'bg-[var(--theme-text)] text-[var(--theme-surface)] shadow-sm'
                    : 'bg-[var(--theme-surface)] text-[var(--theme-muted)] hover:bg-[var(--theme-surface-hover)]'
                }`}
              >
                <Icon className="h-3 w-3" />
                {v.label}
              </button>
            );
          })}
          <div className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--theme-muted)]">
            <span>{variantIndex}/{DESIGN_VARIANTS.length}</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* The actual preview surface — different per variant */}
        <div className="rounded-2xl border border-[var(--panel-border)] overflow-hidden bg-[var(--theme-bg)]">
          {Preview}
        </div>
      </div>
    </div>
  );
}
