/**
 * CanvasUI — barrel export (Coach OS integration).
 * Sister to LANDING-AESTHETIC-001 §3.5 "signature element" + §3.6 "atmosphere".
 * Source: https://canvasui.dev · MIT + Commons Clause (free personal/commercial, no resale).
 * Re-exports 10 canvasui.dev sister patterns as lightweight CSS implementations.
 *
 * 12-themes canon mapping: see ./theme-canvas-mapping.ts (THEME_TO_CANVAS_UI).
 *  - warm-paper → ThinkingOrbs (subtle)
 *  - glassmorphism → Frost
 *  - neumorphism → LiquidMetal
 *  - brutalism → Bend (sharp distortion)
 *  - dark-oled → Glitch (subtle)
 *  - aurora → Particle
 *  - cyberpunk → Blaze (neon intensity)
 *  - editorial → Asciify (print texture)
 *  - liquid-glass → LiquidMetal
 *  - claymorphism → Bubble
 *  - trust → ThinkingOrbs (minimal)
 *  - vibrant-block → Bend
 */

export { Asciify } from './Asciify';
export { BackgroundFX } from './BackgroundFX';
export { Bend } from './Bend';
export { Blaze } from './Blaze';
export { BorderBeam } from './BorderBeam';
export { Bubble } from './Bubble';
export { Frost } from './Frost';
export { Glitch } from './Glitch';
export { LiquidMetal } from './LiquidMetal';
export { Particle } from './Particle';
export { ThinkingOrbs } from './ThinkingOrbs';

export type { CanvasUIComponent, ThemeCanvasMapping } from './theme-canvas-mapping';
