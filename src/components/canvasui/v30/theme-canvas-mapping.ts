// theme-canvas-mapping.ts — Canon distribution of 33 upstream canvas-ui effects
// across the 12 Coach OS themes. Each theme gets exactly 1 dominant effect
// (rendered as Wallpaper / per-app background) + 2 nuance effects (used
// inline as per-app signature elements). The 6 leftover effects live in
// NEUTRAL_POOL and are surfaced via the Settings app canvas FX picker.
//
// Allocation rule (per Phase C plan):
//   1 dominant + 2 nuance per theme × 12 themes = 36 slots, 30 effects used
//   in dominants/nuances, 3 effects in NEUTRAL_POOL (below).
//
// Personality rationale for each dominant assignment:
//   warm-paper   · subtle ink-drop glyphs match editor-desk mood (no competition with paper grain)
//   glassmorphism · Frost IS the glassmorphism aesthetic literally
//   neumorphism  · soft tactile fabric surface mirrors monohue softness
//   brutalism    · sharp distortion = hard 45deg stripes personality
//   dark-oled    · terminal scanlines + chromatic aberration, subtle on metrics
//   aurora       · heavy liquid distortion mirrors the conique gradient + orb vibe
//   cyberpunk    · sharp neon intensity pulses, IT-R&D signature
//   editorial    · ASCII/halftone print texture = magazine pre-press
//   liquid-glass · heavy blur + light refraction, Apple-Vision-Pro hero
//   claymorphism · soft 3D floating bubbles mirror squishy-warm personality
//   trust        · minimal ambient restraint with subtle pixel motion
//   vibrant-block · loud pixel dither = growth-hacker aesthetic

export type CanvasEffectId =
  | 'Asciify' | 'Bend' | 'Blaze' | 'Bubble' | 'Canvas' | 'Cloth' | 'Clouds'
  | 'DecryptReveal' | 'Displacement' | 'Droplets' | 'FlameWrap' | 'ForceField'
  | 'Frost' | 'Glass' | 'Glitch' | 'GlyphRain' | 'Grid' | 'HexFloat' | 'Laser'
  | 'Liquid' | 'Magnify' | 'ParticleReveal' | 'ParticleScroll' | 'Peel'
  | 'RetroDither' | 'Ripple' | 'Shatter' | 'VHS'
  // Object family — takes `src` URL prop instead of React children
  | 'AsciiObject' | 'DitheredObject' | 'GlassObject' | 'ParticleObject' | 'LiquidObject';

export interface ThemeCanvasMapping {
  /** Dominant effect — rendered as Wallpaper / per-app background. */
  dominant: CanvasEffectId;
  /** Two nuance effects — inline per-app signature elements. */
  nuance: readonly [CanvasEffectId, CanvasEffectId];
  /** Accent color resolved from theme tokens. */
  accent: string;
  /** Default animation duration in seconds. */
  duration: number;
  /** Original-lock rationale. */
  rationale: string;
}

export const THEME_TO_CANVAS_UI: Record<string, ThemeCanvasMapping> = {
  'warm-paper': {
    dominant: 'GlyphRain',
    nuance: ['DecryptReveal', 'Asciify'],
    accent: '#f08143',
    duration: 8,
    rationale: 'subtle ink-drop glyphs over editor-desk warm paper',
  },
  glassmorphism: {
    dominant: 'Frost',
    nuance: ['Magnify', 'Liquid'],
    accent: '#6366f1',
    duration: 12,
    rationale: 'frosted glass overlay with slow drift',
  },
  neumorphism: {
    dominant: 'Cloth',
    nuance: ['Droplets', 'HexFloat'],
    accent: '#0891b2',
    duration: 6,
    rationale: 'soft tactile fabric surface',
  },
  brutalism: {
    dominant: 'Bend',
    nuance: ['Shatter', 'Grid'],
    accent: '#000000',
    duration: 4,
    rationale: 'sharp distortion on hard 45deg stripes',
  },
  'dark-oled': {
    dominant: 'VHS',
    nuance: ['Glitch', 'Displacement'],
    accent: '#06b6d4',
    duration: 6,
    rationale: 'terminal scanlines + chroma split',
  },
  aurora: {
    dominant: 'Liquid',
    nuance: ['ParticleReveal', 'ForceField'],
    accent: '#ec4899',
    duration: 14,
    rationale: 'heavy liquid distortion over conique orb gradient',
  },
  cyberpunk: {
    dominant: 'Blaze',
    nuance: ['Laser', 'GlyphRain'],
    accent: '#00ff9d',
    duration: 3,
    rationale: 'sharp neon intensity pulses, IT-R&D signature',
  },
  editorial: {
    dominant: 'Asciify',
    nuance: ['DecryptReveal', 'Grid'],
    accent: '#1c1917',
    duration: 20,
    rationale: 'ASCII halftone print texture, magazine pre-press',
  },
  'liquid-glass': {
    dominant: 'Glass',
    nuance: ['Ripple', 'ParticleScroll'],
    accent: '#0ea5e9',
    duration: 8,
    rationale: 'heavy blur + light refraction, Apple Vision Pro hero',
  },
  claymorphism: {
    dominant: 'Bubble',
    nuance: ['Droplets', 'Magnify'],
    accent: '#f97316',
    duration: 8,
    rationale: 'soft 3D floating bubbles, squishy warmth',
  },
  trust: {
    dominant: 'Displacement',
    nuance: ['HexFloat', 'Grid'],
    accent: '#0f172a',
    duration: 12,
    rationale: 'minimal ambient restraint with subtle pixel motion',
  },
  'vibrant-block': {
    dominant: 'RetroDither',
    nuance: ['Shatter', 'VHS'],
    accent: '#e11d48',
    duration: 4,
    rationale: 'loud pixel dither over vibrant blocks',
  },
};

// Neutral pool — 6 effects unassigned by the per-theme rule. Surfaces through
// the Settings app canvas FX picker as user-overridable slots.
export const NEUTRAL_POOL: readonly CanvasEffectId[] = [
  'Canvas',
  'Clouds',
  'FlameWrap',
  'Peel',
  'ParticleScroll',
  'ParticleReveal',
] as const;

export function getCanvasMapping(themeId: string | null | undefined): ThemeCanvasMapping {
  return THEME_TO_CANVAS_UI[themeId ?? ''] ?? THEME_TO_CANVAS_UI['warm-paper'];
}

export function resolveDominantEffect(themeId: string | null | undefined): CanvasEffectId {
  return getCanvasMapping(themeId).dominant;
}

export function resolveNuanceEffect(
  themeId: string | null | undefined,
  slot: 0 | 1,
): CanvasEffectId {
  return getCanvasMapping(themeId).nuance[slot];
}
