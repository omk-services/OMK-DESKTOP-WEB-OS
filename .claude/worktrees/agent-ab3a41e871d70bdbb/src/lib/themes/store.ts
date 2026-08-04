/** ThemeStore — Zustand store with persist middleware.
 *  - `appThemes`: per-app theme override (Record<appId, themeId>)
 *  - `globalTheme`: fallback when no per-app override (default: 'warm-paper')
 *  Applies the active theme's tokens as CSS variables on `:root` whenever
 *  the active theme for the current app changes (via useThemeFor(appId)). */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { THEMES, THEME_LIST, CANONICAL_APP_THEMES, type ThemeTokens } from './tokens';

interface ThemeStore {
  globalTheme: string;
  appThemes: Record<string, string>;
  setGlobalTheme: (id: string) => void;
  setAppTheme: (appId: string, themeId: string) => void;
  resetAppTheme: (appId: string) => void;
  resetAll: () => void;
  /** Returns the effective theme id for an app (per-app override or canonical default or global) */
  resolveTheme: (appId: string) => string;
  /** Returns the token object for an app */
  tokensFor: (appId: string) => ThemeTokens;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      globalTheme: 'warm-paper',
      appThemes: {},
      setGlobalTheme: (id) => set({ globalTheme: id }),
      setAppTheme: (appId, themeId) => set((s) => ({
        appThemes: { ...s.appThemes, [appId]: themeId },
      })),
      resetAppTheme: (appId) => set((s) => {
        const next = { ...s.appThemes };
        delete next[appId];
        return { appThemes: next };
      }),
      resetAll: () => set({ globalTheme: 'warm-paper', appThemes: {} }),
      resolveTheme: (appId) => {
        const s = get();
        return s.appThemes[appId] ?? CANONICAL_APP_THEMES[appId] ?? s.globalTheme;
      },
      tokensFor: (appId) => {
        const id = get().resolveTheme(appId);
        return THEMES[id] ?? THEMES['warm-paper'];
      },
    }),
    {
      name: 'coach-os-themes-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ globalTheme: s.globalTheme, appThemes: s.appThemes }),
    }
  )
);

/** Apply theme tokens as CSS variables on a target element (default `:root`).
 *  Called by the useThemeFor hook + the macro-level CSS applier. */
export function applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = '') {
  const p = prefix;
  target.style.setProperty(`${p}--theme-accent`, t.accent);
  target.style.setProperty(`${p}--theme-accent-rgb`, t.accentRgb);
  target.style.setProperty(`${p}--theme-accent-hover`, t.accentHover);
  target.style.setProperty(`${p}--theme-accent-soft`, t.accentSoft);
  target.style.setProperty(`${p}--theme-bg`, t.bg);
  target.style.setProperty(`${p}--theme-canvas`, t.canvas);
  target.style.setProperty(`${p}--theme-surface`, t.surface);
  target.style.setProperty(`${p}--theme-surface-hover`, t.surfaceHover);
  target.style.setProperty(`${p}--theme-text`, t.text);
  target.style.setProperty(`${p}--theme-text-muted`, t.textMuted);
  target.style.setProperty(`${p}--theme-text-dim`, t.textDim);
  target.style.setProperty(`${p}--theme-border`, t.border);
  target.style.setProperty(`${p}--theme-border-subtle`, t.borderSubtle);
  target.style.setProperty(`${p}--theme-radius`, t.radius);
  target.style.setProperty(`${p}--theme-radius-sm`, t.radiusSm);
  target.style.setProperty(`${p}--theme-radius-lg`, t.radiusLg);
  target.style.setProperty(`${p}--theme-shadow`, t.shadow);
  target.style.setProperty(`${p}--theme-shadow-lg`, t.shadowLg);
  target.style.setProperty(`${p}--theme-blur`, t.blur);
  target.style.setProperty(`${p}--theme-font-display`, t.fontDisplay);
  target.style.setProperty(`${p}--theme-font-body`, t.fontBody);
  target.style.setProperty(`${p}--theme-is-dark`, t.isDark ? '1' : '0');
}

/** Convenience: returns the active theme tokens for an app (subscribed). */
export function useThemeFor(appId: string): ThemeTokens {
  const id = useThemeStore((s) => s.resolveTheme(appId));
  return THEMES[id] ?? THEMES['warm-paper'];
}

/** Returns the effective theme id only (no tokens) — useful for label rendering. */
export function useThemeIdFor(appId: string): string {
  return useThemeStore((s) => s.resolveTheme(appId));
}

export { THEMES, THEME_LIST, CANONICAL_APP_THEMES };
