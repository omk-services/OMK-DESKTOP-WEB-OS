// BackgroundFX.tsx — Per-window or per-global canvas-ui effect dispatcher.
//
// Renders THREE layers stacked vertically (z-index layered):
//   1. <CssFallback> — pure-CSS animated gradient, always-visible. Provides
//      motion even on browsers without Chrome's `chrome://flags/#canvas-draw-element`.
//   2. <WebGLFallbackBoundary><Wrapper/></> — upstream canvas-ui WebGL effect.
//      Silent no-op without the Chrome flag (the upstream components return
//      a children-only subtree in that case), BUT renders real WebGL where
//      the flag is enabled.
//   3. children pass-through for capture-style effects.
//
// Usage:
//   - Global wallpaper: <BackgroundFX themeId="glassmorphism" />
//   - Per-app signature: <BackgroundFX themeId="dark-oled" nuanceSlot={0} />
//
// D7 honest: this layer is mounted BENEATH the CssFallback so the CssFallback
// is always visible. On a flag-enabled Chrome the CssFallback sits under the
// real WebGL canvas, which floats on top via z-index.

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
import { CssFallback } from './CssFallback';

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
  /** Set true to suppress the always-visible CssFallback layer (e.g. when stacking
   *  multiple effects that shouldn't overlap). */
  disableCssFallback?: boolean;
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
 * Resolve the requested effect id from props.
 */
function resolveEffectId(props: BackgroundFXProps): CanvasEffectId {
  return props.nuanceSlot !== undefined
    ? resolveNuanceEffect(props.themeId, props.nuanceSlot)
    : resolveDominantEffect(props.themeId);
}

/**
 * Imperative render for callers that need the rendered tree (e.g. Wallpaper).
 * Same effect-resolution rules as <BackgroundFX> but returns the element directly.
 */
export function renderCanvasForTheme(
  themeId: string | null | undefined,
  children?: ReactNode,
  opts?: { accent?: string; objectSrc?: string; className?: string; style?: React.CSSProperties; disableCssFallback?: boolean },
): ReactElement {
  const effectId = resolveEffectId({
    themeId,
    objectSrc: opts?.objectSrc,
    accent: opts?.accent,
    className: opts?.className,
    style: opts?.style,
    disableCssFallback: opts?.disableCssFallback,
  });
  const cssLayer = opts?.disableCssFallback ? null : (
    <CssFallback effectId={effectId} themeId={themeId ?? 'warm-paper'} className={opts?.className} style={opts?.style} />
  );

  if (OBJECT_EFFECTS.has(effectId)) {
    if (!opts?.objectSrc) {
      return (
        <>
          {cssLayer}
          <WebGLFallbackBoundary fallback={children}>
            <div data-fx={effectId} className={opts?.className} style={opts?.style}>
              {children ?? <></>}
            </div>
          </WebGLFallbackBoundary>
        </>
      );
    }
    const objEl = renderObjectEffect(effectId, {
      src: opts.objectSrc,
      className: opts?.className,
      style: opts?.style,
    });
    return (
      <>
        {cssLayer}
        <WebGLFallbackBoundary fallback={children}>
          {objEl ?? <></>}
        </WebGLFallbackBoundary>
      </>
    );
  }

  const el = renderWrapperEffect(effectId, {
    className: opts?.className,
    style: { '--fx-accent': opts?.accent ?? getCanvasMapping(themeId).accent, ...opts?.style } as React.CSSProperties,
    children,
  });
  return (
    <>
      {cssLayer}
      {el ?? <div data-fx-missing={effectId} className={opts?.className} style={opts?.style} />}
    </>
  );
}

export function BackgroundFX(props: BackgroundFXProps): ReactElement {
  const effectId = resolveEffectId(props);
  const tone = props.accent ?? getCanvasMapping(props.themeId).accent;
  const wrapperProps = {
    className: props.className,
    style: { '--fx-accent': tone, zIndex: 1, ...props.style } as React.CSSProperties,
    children: props.children,
  };
  const cssLayer = props.disableCssFallback ? null : (
    <CssFallback
      effectId={effectId}
      themeId={props.themeId ?? 'warm-paper'}
      className={props.className}
      style={{ zIndex: 0, ...props.style }}
    />
  );

  if (OBJECT_EFFECTS.has(effectId)) {
    if (!props.objectSrc) {
      return (
        <>
          {cssLayer}
          <WebGLFallbackBoundary fallback={props.children}>
            <div data-fx={effectId} data-accent={tone} className={props.className} style={props.style}>
              {props.children ?? <></>}
            </div>
          </WebGLFallbackBoundary>
        </>
      );
    }
    const objEl = renderObjectEffect(effectId, {
      src: props.objectSrc,
      className: props.className,
      style: props.style,
    });
    return (
      <>
        {cssLayer}
        <WebGLFallbackBoundary fallback={props.children}>
          {objEl ?? <></>}
        </WebGLFallbackBoundary>
      </>
    );
  }

  const el = renderWrapperEffect(effectId, wrapperProps);
  return (
    <>
      {cssLayer}
      {el ?? <div data-fx-missing={effectId} />}
    </>
  );
}

export default BackgroundFX;
