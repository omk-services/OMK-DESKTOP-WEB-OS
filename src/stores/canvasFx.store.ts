/** Canvas FX store — per-app override of the canvas-ui effect picker.
 *
 * Pattern: the theme → canvas-ui mapping canon (`THEME_TO_CANVAS_UI` in
 * `src/components/canvasui/v30/theme-canvas-mapping.ts`) gives each theme
 * 1 dominant + 2 nuance effects. This store lets the user override any
 * app's signature effect with any of the 33 effects (12 dominants,
 * 24 nuances, 6 neutrals from NEUTRAL_POOL — though that's 42 not 33; the
 * same effect can serve multiple themes).
 *
 * Persistence: localStorage key `coach-os-canvas-fx-v1`. Same Zustand
 * `persist` + partialize pattern as `themes.store.ts` (only the overrides
 * dict is persisted, not the setters).
 *
 * Resolution chain (read by AppFrame via `useCanvasFxFor`):
 *   1. appFxOverrides[appId]  ← user-set override
 *   2. theme dominant        ← auto from theme mapping
 *   3. warm-paper dominant   ← global fallback (GlyphRain)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getCanvasMapping,
  resolveDominantEffect,
  type CanvasEffectId,
} from '../components/canvasui/v30/theme-canvas-mapping';

interface CanvasFxState {
  /** appId → CanvasEffectId override. Absent = use theme dominant. */
  appFxOverrides: Record<string, CanvasEffectId>;
  setAppFx: (appId: string, effectId: CanvasEffectId) => void;
  clearAppFx: (appId: string) => void;
  clearAll: () => void;
}

export const useCanvasFxStore = create<CanvasFxState>()(
  persist(
    (set) => ({
      appFxOverrides: {},
      setAppFx: (appId, effectId) => set((s) => ({
        // _v sentinel to force re-render on same-effectId re-set (mirrors themes.store.ts pattern)
        appFxOverrides: { ...s.appFxOverrides, [appId]: effectId, _v: String(Date.now()) },
      })),
      clearAppFx: (appId) => set((s) => {
        const next = { ...s.appFxOverrides };
        delete next[appId];
        delete next._v;
        (next as Record<string, string>)._v = String(Date.now());
        return { appFxOverrides: next };
      }),
      clearAll: () => set({ appFxOverrides: {} }),
    }),
    {
      name: 'coach-os-canvas-fx-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ appFxOverrides: state.appFxOverrides }),
    },
  ),
);

/**
 * Resolve the active signature effect for an app.
 * Resolution chain: per-app override → theme dominant → warm-paper dominant.
 */
export function resolveCanvasFx(
  appId: string,
  themeId: string | null | undefined,
): CanvasEffectId {
  const overrides = useCanvasFxStore.getState().appFxOverrides;
  const override = overrides[appId];
  if (override && override !== 'auto') return override;
  return resolveDominantEffect(themeId);
}

/** React hook — subscribes to the store and resolves live. */
export function useCanvasFxFor(appId: string): CanvasEffectId {
  return useCanvasFxStore((s) => {
    const o = s.appFxOverrides[appId];
    if (o && o !== 'auto') return o;
    return null; // null = use theme dominant; we resolve outside
  }) ?? getCanvasMapping(undefined).dominant;
}

/** Read the override store without subscribing (for one-off reads). */
export function readCanvasFxOverride(appId: string): CanvasEffectId | undefined {
  return useCanvasFxStore.getState().appFxOverrides[appId];
}

/** The sentinel value 'auto' means "let the theme decide" — see settings picker. */
export const AUTO_FX = 'auto' as const satisfies CanvasEffectId | 'auto';
