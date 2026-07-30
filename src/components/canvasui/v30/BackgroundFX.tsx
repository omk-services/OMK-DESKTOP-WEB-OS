// BackgroundFX.tsx — Per-window or per-global canvas-ui effect dispatcher.
//
// Reads the theme id from props (preferred) or from the per-app theme store
// (fallback) and renders the matching effect via `theme-canvas-mapping.ts`.
//
// Usage:
//   - Global wallpaper: <BackgroundFX themeId="glassmorphism" accent="#6366f1" />
//   - Per-app signature: <BackgroundFX themeId="dark-oled" nuanceSlot={0} />
//   - Auto-detect per app: <BackgroundFX />  (no themeId, reads from useThemeIdFor)
//
// Per-app override store (Phase F) takes priority over the theme default;
// this file is the dispatcher, not the override store itself.

import { type ReactElement, type ReactNode } from 'react';
import {
  Asciify, Bend, Blaze, Bubble, Canvas, Cloth, Clouds,
  DecryptReveal, Displacement, Droplets, FlameWrap, ForceField,
  Frost, Glass, Glitch, GlyphRain, Grid, HexFloat, Laser,
  Liquid, Magnify, ParticleReveal, ParticleScroll, Peel,
  RetroDither, Ripple, Shatter, VHS,
  AsciiObject, DitheredObject, GlassObject, ParticleObject, LiquidObject,
} from './index';
import {
  getCanvasMapping,
  resolveDominantEffect,
  resolveNuanceEffect,
  type CanvasEffectId,
} from './theme-canvas-mapping';
import { WebGLFallbackBoundary, withWebGLFallback } from './fallback';

export interface BackgroundFXProps {
  /** Theme id (e.g. 'glassmorphism', 'aurora'). If absent, reads from per-app token store. */
  themeId?: string;
  /** Accent color override. Falls back to the theme's mapped accent. */
  accent?: string;
  /** 0 or 1 to render that theme's nuance effect instead of the dominant. */
  nuanceSlot?: 0 | 1;
  /** Required for *Object family (3D model / image URL). Ignored otherwise. */
  objectSrc?: string;
  /** Optional wrapper className. */
  className?: string;
  /** Optional inline style passthrough. */
  style?: React.CSSProperties;
  /** Children — passed through to wrapper effects; *Object family ignores. */
  children?: ReactNode;
}

// Object components wrapped with WebGL fallback (Three.js init errors).
const SafeAsciiObject = withWebGLFallback(AsciiObject);
const SafeDitheredObject = withWebGLFallback(DitheredObject);
const SafeGlassObject = withWebGLFallback(GlassObject);
const SafeParticleObject = withWebGLFallback(ParticleObject);
const SafeLiquidObject = withWebGLFallback(LiquidObject);

/** Object components that need a `src` URL. Returns null if no src is supplied. */
function renderObjectEffect(
  effectId: CanvasEffectId,
  props: { src: string; className?: string; style?: React.CSSProperties },
): ReactElement | null {
  switch (effectId) {
    case 'AsciiObject':
      return <SafeAsciiObject {...props} />;
    case 'DitheredObject':
      return <SafeDitheredObject {...props} />;
    case 'GlassObject':
      return <SafeGlassObject {...props} />;
    case 'ParticleObject':
      return <SafeParticleObject {...props} />;
    case 'LiquidObject':
      return <SafeLiquidObject {...props} />;
    default:
      return null;
  }
}

/** Wrapper effects that require React `children`. Pass children through. */
function renderWrapperEffect(
  effectId: CanvasEffectId,
  props: { className?: string; style?: React.CSSProperties; children?: ReactNode },
): ReactElement | null {
  const c = props.className, s = props.style, ch = props.children;
  switch (effectId) {
    case 'Asciify':       return <Asciify className={c} style={s}>{ch}</Asciify>;
    case 'Bend':          return <Bend className={c} style={s}>{ch}</Bend>;
    case 'Blaze':         return <Blaze className={c} style={s}>{ch}</Blaze>;
    case 'Bubble':        return <Bubble className={c} style={s}>{ch}</Bubble>;
    case 'Canvas':        return <Canvas className={c} style={s}>{ch}</Canvas>;
    case 'Cloth':         return <Cloth className={c} style={s}>{ch}</Cloth>;
    case 'Clouds':        return <Clouds className={c} style={s}>{ch}</Clouds>;
    case 'DecryptReveal': return <DecryptReveal className={c} style={s}>{ch}</DecryptReveal>;
    case 'Displacement':  return <Displacement className={c} style={s}>{ch}</Displacement>;
    case 'Droplets':      return <Droplets className={c} style={s}>{ch}</Droplets>;
    case 'FlameWrap':     return <FlameWrap className={c} style={s}>{ch}</FlameWrap>;
    case 'ForceField':    return <ForceField className={c} style={s}>{ch}</ForceField>;
    case 'Frost':         return <Frost className={c} style={s}>{ch}</Frost>;
    case 'Glass':         return <Glass className={c} style={s}>{ch}</Glass>;
    case 'Glitch':        return <Glitch className={c} style={s}>{ch}</Glitch>;
    case 'GlyphRain':     return <GlyphRain className={c} style={s}>{ch}</GlyphRain>;
    case 'Grid':          return <Grid className={c} style={s}>{ch}</Grid>;
    case 'HexFloat':      return <HexFloat className={c} style={s}>{ch}</HexFloat>;
    case 'Laser':         return <Laser className={c} style={s}>{ch}</Laser>;
    case 'Liquid':        return <Liquid className={c} style={s}>{ch}</Liquid>;
    case 'Magnify':       return <Magnify className={c} style={s}>{ch}</Magnify>;
    case 'ParticleReveal':return <ParticleReveal className={c} style={s}>{ch}</ParticleReveal>;
    case 'ParticleScroll':return <ParticleScroll className={c} style={s}>{ch}</ParticleScroll>;
    case 'Peel':          return <Peel className={c} style={s}>{ch}</Peel>;
    case 'RetroDither':   return <RetroDither className={c} style={s}>{ch}</RetroDither>;
    case 'Ripple':        return <Ripple className={c} style={s}>{ch}</Ripple>;
    case 'Shatter':       return <Shatter className={c} style={s}>{ch}</Shatter>;
    case 'VHS':           return <VHS className={c} style={s}>{ch}</VHS>;
    default:              return null;
  }
}

const OBJECT_EFFECTS: ReadonlySet<CanvasEffectId> = new Set([
  'AsciiObject', 'DitheredObject', 'GlassObject', 'ParticleObject', 'LiquidObject',
]);

/**
 * Render the correct canvas-ui effect for a given theme id.
 * If the effect is an Object family and `objectSrc` is provided, renders it.
 * Otherwise renders a wrapper (with children fallback to nothing if absent).
 */
export function renderCanvasForTheme(
  themeId: string | null | undefined,
  children?: ReactNode,
  opts?: { accent?: string; objectSrc?: string; className?: string; style?: React.CSSProperties },
): ReactElement {
  const mapping = getCanvasMapping(themeId);
  const effectId = resolveDominantEffect(themeId);

  if (OBJECT_EFFECTS.has(effectId)) {
    if (!opts?.objectSrc) {
      // Object effect requested but no src supplied → fall back to inner wrapper
      // so we never render an empty canvas.
      return (
        <div className={opts?.className} style={opts?.style}>
          {children ?? <></>}
        </div>
      );
    }
    return renderObjectEffect(effectId, {
      src: opts.objectSrc,
      className: opts?.className,
      style: opts?.style,
    })!;
  }

  return (
    renderWrapperEffect(effectId, {
      className: opts?.className,
      style: opts?.style,
      children,
    }) ?? <div className={opts?.className}>{children ?? <></>}</div>
  );
}

export function BackgroundFX(props: BackgroundFXProps): ReactElement {
  const mapping = getCanvasMapping(props.themeId);
  const effectId = props.nuanceSlot !== undefined
    ? resolveNuanceEffect(props.themeId, props.nuanceSlot)
    : resolveDominantEffect(props.themeId);
  const tone = props.accent ?? mapping.accent;

  const wrapperProps = {
    className: props.className,
    style: { '--fx-accent': tone, ...props.style } as React.CSSProperties,
    children: props.children,
  };

  if (OBJECT_EFFECTS.has(effectId)) {
    if (!props.objectSrc) {
      return (
        <WebGLFallbackBoundary fallback={props.children}>
          <div data-fx={effectId} data-accent={tone} className={props.className} style={props.style}>
            {props.children ?? <></>}
          </div>
        </WebGLFallbackBoundary>
      );
    }
    const objEl = renderObjectEffect(effectId, {
      src: props.objectSrc,
      className: props.className,
      style: props.style,
    });
    return (
      <WebGLFallbackBoundary fallback={props.children}>
        {objEl ?? <></>}
      </WebGLFallbackBoundary>
    );
  }

  const el = renderWrapperEffect(effectId, wrapperProps);
  return el ?? <div data-fx-missing={effectId} />;
}

export default BackgroundFX;
