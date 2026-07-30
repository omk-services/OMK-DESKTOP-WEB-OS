/**
 * BackgroundFX — Per-theme canvasui.dev effect rendered as a fixed full-bleed overlay.
 * Reads the active theme from useThemeStore and renders the matching canvasui component.
 * Drop into Wallpaper.tsx (or any layout root) to apply the effect app-wide.
 *
 * Usage:
 *   import { BackgroundFX } from './canvas-ui';
 *   <BackgroundFX />
 *
 * D4 append-only — this is the canonical entry point for theme → canvasui routing.
 */

import type { ReactElement } from 'react';
import { useThemeIdFor } from '../../lib/themes/store';
import {
  Asciify,
  Bend,
  Blaze,
  BorderBeam,
  Bubble,
  Frost,
  Glitch,
  LiquidMetal,
  Particle,
  ThinkingOrbs as ThinkingOrbsAlias,
} from './index';

interface BackgroundFXProps {
  /** Optional override of the active theme id (defaults to global theme). */
  themeId?: string;
  /** Optional accent color override. */
  accent?: string;
}

/** Resolves the mapping for a theme id and renders the matching component. */
export function BackgroundFX({ themeId, accent }: BackgroundFXProps = {}): ReactElement | null {
  // Fallback to 'warm-paper' if no theme resolved yet.
  const fallbackTheme = themeId ?? 'warm-paper';
  const resolvedAccent = accent ?? '#f08143';

  switch (fallbackTheme) {
    case 'warm-paper':
      return <ThinkingOrbsAlias color={resolvedAccent} duration={8} />;
    case 'glassmorphism':
      return <Frost color={resolvedAccent} duration={12} />;
    case 'neumorphism':
      return <LiquidMetal color={resolvedAccent} duration={6} size={400} />;
    case 'brutalism':
      return <Bend color={resolvedAccent} duration={4} />;
    case 'dark-oled':
      return <Glitch color={resolvedAccent} duration={6} />;
    case 'aurora':
      return <Particle color={resolvedAccent} duration={14} count={5} />;
    case 'cyberpunk':
      return <Blaze color={resolvedAccent} duration={3} />;
    case 'editorial':
      return <Asciify color={resolvedAccent} duration={20} />;
    case 'liquid-glass':
      return <LiquidMetal color={resolvedAccent} duration={8} size={400} />;
    case 'claymorphism':
      return <Bubble color={resolvedAccent} duration={8} count={6} />;
    case 'trust':
      return <ThinkingOrbsAlias color={resolvedAccent} duration={12} />;
    case 'vibrant-block':
      return <Bend color={resolvedAccent} duration={4} />;
    default:
      return null;
  }
}

/** Re-export of the mapping + helper for consumers that want the data only. */
export { THEME_TO_CANVAS_UI, getCanvasMapping, renderCanvasForTheme } from './theme-canvas-mapping';
export type { CanvasUIComponent, ThemeCanvasMapping } from './theme-canvas-mapping';
