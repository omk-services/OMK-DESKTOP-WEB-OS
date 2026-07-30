// Coach OS canvas-ui v30 barrel — re-exports all 33 real upstream components.
//
// Each component lives at `v30/<Name>/<Name>.tsx` with a sibling `<Name>Vanilla.ts`
// that contains the framework-agnostic WebGL engine. The React .tsx wrappers import
// their engine from `./<Name>Vanilla` and re-export it.
//
// Consumers should import either:
//   - `import { Asciify } from '@/components/canvasui/v30'` for direct use, OR
//   - `import { BackgroundFX } from '@/components/canvasui/v30'` for the auto-dispatch
//     wrapper that resolves the right effect per-theme via `theme-canvas-mapping.ts`.

export { Asciify } from './Asciify/Asciify';
export type { AsciifyProps } from './Asciify/Asciify';

export { Bend } from './Bend/Bend';
export { Blaze } from './Blaze/Blaze';
export { Bubble } from './Bubble/Bubble';
export { Canvas } from './Canvas/Canvas';
export { Cloth } from './Cloth/Cloth';
export { Clouds } from './Clouds/Clouds';
export { DecryptReveal } from './DecryptReveal/DecryptReveal';
export { Displacement } from './Displacement/Displacement';
export { Droplets } from './Droplets/Droplets';
export { FlameWrap } from './FlameWrap/FlameWrap';
export { ForceField } from './ForceField/ForceField';
export { Frost } from './Frost/Frost';
export { Glass } from './Glass/Glass';
export { Glitch } from './Glitch/Glitch';
export { GlyphRain } from './GlyphRain/GlyphRain';
export { Grid } from './Grid/Grid';
export { HexFloat } from './HexFloat/HexFloat';
export { Laser } from './Laser/Laser';
export { Liquid } from './Liquid/Liquid';
export { Magnify } from './Magnify/Magnify';
export { Peel } from './Peel/Peel';
export { RetroDither } from './RetroDither/RetroDither';
export { Ripple } from './Ripple/Ripple';
export { Shatter } from './Shatter/Shatter';
export { VHS } from './VHS/VHS';

// Particle family
export { ParticleReveal } from './ParticleReveal/ParticleReveal';
export { ParticleScroll } from './ParticleScroll/ParticleScroll';

// Object family (need `src` URL prop, no React-children) — re-exported here
// for one-line import but typically rendered via BackgroundFX with objectSrc prop.
export { AsciiObject } from './AsciiObject/AsciiObject';
export { DitheredObject } from './DitheredObject/DitheredObject';
export { GlassObject } from './GlassObject/GlassObject';
export { ParticleObject } from './ParticleObject/ParticleObject';
export { LiquidObject } from './LiquidObject/LiquidObject';

// Re-export the auto-dispatch wrapper + helpers.
export { BackgroundFX, renderCanvasForTheme } from './BackgroundFX';
export {
  THEME_TO_CANVAS_UI,
  NEUTRAL_POOL,
  getCanvasMapping,
  resolveDominantEffect,
  resolveNuanceEffect,
  type CanvasEffectId,
  type ThemeCanvasMapping,
} from './theme-canvas-mapping';
