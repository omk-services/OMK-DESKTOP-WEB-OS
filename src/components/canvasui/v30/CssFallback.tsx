// CssFallback.tsx — always-visible animated gradient overlay.
//
// Purpose: canvas-ui v30 components depend on Chrome's experimental
// `chrome://flags/#canvas-draw-element` HTML-in-Canvas API to render their
// WebGL output canvas. Without that flag, the upstream components silently
// fall back to a children-only DOM subtree that produces NO visible effect.
//
// This component renders a pure-CSS gradient/keyframes overlay that is
// always visible regardless of the flag. It is mounted as a sibling layer
// underneath the canvas-ui component, so users see real motion even on a
// vanilla Chrome instance.
//
// D7 honesty: this is NOT a substitute for the real canvas-ui effect.
// On browsers without the flag, the upstream effect is a no-op. This
// layer provides motion + atmosphere so users see the integration working.

import type { CSSProperties } from 'react';
import { type CanvasEffectId, getCanvasMapping } from './theme-canvas-mapping';

interface CssFallbackProps {
  effectId: CanvasEffectId;
  themeId: string | null | undefined;
  className?: string;
  style?: CSSProperties;
}

const EFFECT_KEYFRAMES: Record<CanvasEffectId, string> = {
  Asciify: 'ascii-hash',
  Bend: 'bend-fold',
  Blaze: 'blaze-flicker',
  Bubble: 'bubble-float',
  Canvas: 'canvas-grain',
  Cloth: 'cloth-drape',
  Clouds: 'clouds-drift',
  DecryptReveal: 'decrypt-flicker',
  Displacement: 'displacement-ripple',
  Droplets: 'droplets-run',
  FlameWrap: 'flame-burn',
  ForceField: 'force-shimmer',
  Frost: 'frost-veil',
  Glass: 'glass-refract',
  Glitch: 'glitch-shift',
  GlyphRain: 'glyph-fall',
  Grid: 'grid-tile',
  HexFloat: 'hex-tilt',
  Laser: 'laser-sweep',
  Liquid: 'liquid-wave',
  Magnify: 'magnify-radial',
  ParticleReveal: 'particle-dissolve',
  ParticleScroll: 'particle-fall',
  Peel: 'peel-corner',
  RetroDither: 'dither-grid',
  Ripple: 'ripple-out',
  Shatter: 'shatter-pulse',
  VHS: 'vhs-scanline',
  AsciiObject: 'object-pulse',
  DitheredObject: 'object-pulse',
  GlassObject: 'object-pulse',
  ParticleObject: 'object-pulse',
  LiquidObject: 'object-pulse',
};

const STYLE_BY_EFFECT: Record<CanvasEffectId, CSSProperties> = {
  Asciify: { backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 4px)', opacity: 0.5 },
  Bend: { perspective: '600px', transform: 'rotateX(8deg)' },
  Blaze: { background: 'radial-gradient(circle at 50% 100%, currentColor 0%, transparent 70%)', animation: 'blaze-flicker 1.8s ease-in-out infinite alternate' },
  Bubble: { background: 'radial-gradient(circle at 20% 30%, currentColor 0%, transparent 35%), radial-gradient(circle at 70% 60%, currentColor 0%, transparent 40%), radial-gradient(circle at 50% 90%, currentColor 0%, transparent 35%)', animation: 'bubble-float 6s ease-in-out infinite' },
  Canvas: { backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 6px)' },
  Cloth: { backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 8px), repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 12px)', animation: 'cloth-drape 8s ease-in-out infinite' },
  Clouds: { background: 'radial-gradient(ellipse at 30% 40%, currentColor 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, currentColor 0%, transparent 60%)', animation: 'clouds-drift 16s linear infinite' },
  DecryptReveal: { background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0 2px, transparent 2px 4px), repeating-linear-gradient(0deg, transparent 0 1px, currentColor 1px 3px)' },
  Displacement: { transform: 'translate3d(0, 0, 0)', animation: 'displacement-ripple 4s ease-in-out infinite' },
  Droplets: { backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 24px, currentColor 24px 25px)', opacity: 0.6, animation: 'droplets-run 2.5s linear infinite' },
  FlameWrap: { boxShadow: '0 0 24px currentColor inset' },
  ForceField: { boxShadow: '0 0 0 2px currentColor inset', animation: 'force-shimmer 2s ease-in-out infinite' },
  Frost: { backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)', background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))' },
  Glass: { backdropFilter: 'blur(20px) saturate(200%)', WebkitBackdropFilter: 'blur(20px) saturate(200%)', background: 'linear-gradient(135deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08))' },
  Glitch: { background: 'linear-gradient(90deg, transparent 47%, currentColor 47% 50%, transparent 50% 53%, currentColor 53% 56%, transparent 56%)', animation: 'glitch-shift 0.6s steps(3) infinite' },
  GlyphRain: { background: 'linear-gradient(180deg, transparent, currentColor 60%, currentColor 80%, transparent)', maskImage: 'repeating-linear-gradient(180deg, transparent 0 12px, #000 12px 14px)', WebkitMaskImage: 'repeating-linear-gradient(180deg, transparent 0 12px, #000 12px 14px)' },
  Grid: { backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.25 },
  HexFloat: { transformOrigin: 'center', animation: 'hex-tilt 6s ease-in-out infinite' },
  Laser: { background: 'linear-gradient(180deg, transparent 80%, currentColor 80% 81%, transparent 81%)', boxShadow: '0 0 12px currentColor', animation: 'laser-sweep 1s linear infinite' },
  Liquid: { borderRadius: '46% 54% 38% 62% / 52% 38% 62% 48%', animation: 'liquid-wave 9s ease-in-out infinite' },
  Magnify: { background: 'radial-gradient(circle at 70% 30%, currentColor 0%, transparent 40%)', animation: 'magnify-radial 3s ease-in-out infinite alternate' },
  ParticleReveal: { background: 'radial-gradient(circle, currentColor 1px, transparent 2px) 0 0/12px 12px', opacity: 0.4 },
  ParticleScroll: { background: 'linear-gradient(180deg, transparent, currentColor 90%, transparent)', maskImage: 'linear-gradient(180deg, transparent, black)', WebkitMaskImage: 'linear-gradient(180deg, transparent, black)', animation: 'particle-fall 2s linear infinite' },
  Peel: { background: 'conic-gradient(from 220deg at 100% 100%, transparent 280deg, currentColor 280deg 360deg)' },
  RetroDither: { backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 2px) 0 0/4px 4px', opacity: 0.6 },
  Ripple: { boxShadow: 'inset 0 0 0 2px currentColor', animation: 'ripple-out 1.4s ease-out infinite' },
  Shatter: { clipPath: 'polygon(20% 0%, 80% 5%, 95% 25%, 100% 60%, 88% 92%, 60% 100%, 15% 96%, 5% 70%, 0% 30%)', animation: 'shatter-pulse 2.4s ease-in-out infinite' },
  VHS: { background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.20) 2px 4px, transparent 4px 6px)' },
  AsciiObject: { borderRadius: '50%', boxShadow: '0 0 32px currentColor' },
  DitheredObject: { borderRadius: '8%', boxShadow: '0 0 24px currentColor' },
  GlassObject: { borderRadius: '24%', backdropFilter: 'blur(8px)' },
  ParticleObject: { borderRadius: '50%', boxShadow: '0 0 40px currentColor' },
  LiquidObject: { borderRadius: '46% 54% 38% 62% / 52% 38% 62% 48%', animation: 'liquid-wave 9s ease-in-out infinite' },
};

/**
 * CssFallback — pure-CSS animated gradient overlay.
 *
 * Always visible. Color comes from the theme accent so it matches the rest
 * of the surface. The keyframes id is unique per effect (defined in
 * `index.css`) so multiple effects can be layered without animation bleed.
 */
export function CssFallback({ effectId, themeId, className, style }: CssFallbackProps) {
  const mapping = getCanvasMapping(themeId);
  const accent = mapping.accent;
  const _keyName = EFFECT_KEYFRAMES[effectId];

  return (
    <div
      data-cssfx={effectId}
      data-cssfx-theme={themeId ?? 'unknown'}
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        color: accent,
        pointerEvents: 'none',
        animationName: _keyName,
        animationDuration: `${mapping.duration}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        opacity: 0.7,
        zIndex: 1,
        filter: 'contrast(1.05) saturate(1.2)',
        ...STYLE_BY_EFFECT[effectId],
        backgroundColor: `${accent}cc !important`,
        ...style,
      }}
    />
  );
}

export default CssFallback;
