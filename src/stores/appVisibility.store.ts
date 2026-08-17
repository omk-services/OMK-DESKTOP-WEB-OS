/**
 * appVisibility.store — per-app visibility toggles for the desktop dock.
 * User-controlled via the TopBar "Apps" menu. Persists to localStorage.
 * Apps not explicitly set default to `visible = true`.
 *
 * FIX-2 (2026-08-17) — la persistance passe par `createScopedStorage()`
 * pour que les clés soient propres à (user, tenant). Sans ça, deux
 * comptes sur le même navigateur partagent leurs choix d'affichage.
 * Le store s'enregistre aussi auprès du bridge d'auth pour qu'il
 * rehydrate aux transitions SIGNED_IN / SIGNED_OUT.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createScopedStorage,
} from '../lib/auth/storage-scope';
import {
  registerPersistedStore,
} from '../lib/auth/auth-scope-bridge';
import { defensiveMerge, defensiveMigrate } from './migrationDefensive';

interface AppVisibilityState {
  hidden: Record<string, boolean>;
  toggle: (appId: string) => void;
  setHidden: (appId: string, hidden: boolean) => void;
  reset: () => void;
}

/** Valide la map `hidden` : `Record<string, boolean>`. Écarte les
 *  entrées non-booléennes (un `null` ou un `string` forged ne devient
 *  pas une option cachée). */
function sanitizeHidden(value: unknown): Record<string, boolean> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'boolean') out[k] = v;
  }
  return out;
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
    {
      name: 'app-visibility-v1',
      storage: createJSONStorage(() => createScopedStorage()),
      // FIX-8 (2026-08-17) — version + migrate. Une charge d'une version
      // antérieure ou sans la forme attendue est écartée. Les méthodes
      // de `current` (toggle, setHidden, reset) sont préservées par
      // le merge, qui ne touche que les champs déclarés.
      version: 1,
      migrate: defensiveMigrate<AppVisibilityState>(1),
      merge: defensiveMerge<AppVisibilityState>({
        validators: { hidden: sanitizeHidden },
      }),
    },
  ),
);

registerPersistedStore({
  name: 'useAppVisibility',
  persist: useAppVisibility.persist,
});

/** Helper: returns true if the app should be hidden (default false). */
export function isAppHidden(hidden: Record<string, boolean>, appId: string): boolean {
  return hidden[appId] === true;
}
