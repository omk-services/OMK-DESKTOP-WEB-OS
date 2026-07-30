/**
 * appVisibility.store — per-app visibility toggles for the desktop dock.
 * User-controlled via the TopBar "Apps" menu. Persists to localStorage.
 * Apps not explicitly set default to `visible = true`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppVisibilityState {
  hidden: Record<string, boolean>;
  toggle: (appId: string) => void;
  setHidden: (appId: string, hidden: boolean) => void;
  reset: () => void;
}

export const useAppVisibility = create<AppVisibilityState>()(
  persist(
    (set) => ({
      hidden: {},
      toggle: (appId) =>
        set((state) => ({
          hidden: { ...state.hidden, [appId]: !state.hidden[appId] },
        })),
      setHidden: (appId, hidden) =>
        set((state) => ({ hidden: { ...state.hidden, [appId]: hidden } })),
      reset: () => set({ hidden: {} }),
    }),
    { name: 'coach-os-app-visibility-v1' },
  ),
);

/** Helper: returns true if the app should be hidden (default false). */
export function isAppHidden(hidden: Record<string, boolean>, appId: string): boolean {
  return hidden[appId] === true;
}
