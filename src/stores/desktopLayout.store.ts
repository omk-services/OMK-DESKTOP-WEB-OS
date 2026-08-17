// src/stores/desktopLayout.store.ts
// Position de chaque icône du bureau, en coordonnées grille (colonne, ligne).
//
// Pourquoi la grille et pas des pixels : l'arrangement par drag se fait en
// pixels, mais on persiste en cases (col, row). Au prochain rendu on
// multiplie par (LARGEUR_CASE, HAUTEUR_CASE). Ça donne deux choses :
//   1. un snap naturel — tout reste aligné même après un resize ;
//   2. une persistance minuscule (deux entiers par app), pas des floats
//      qui se dégradent à chaque drag.
//
// Clé localStorage : `desktop-layout-v1` — passée à un wrapper scopé
// (cf. `src/lib/auth/storage-scope.ts`) qui la préfixe par
// `coach-os:<user>:<tenant>:` pour fermer la fuite inter-comptes.
//
// FIX-2 (2026-08-17) — bascule du storage scopé. Le nom logique reste
// court ; le wrapper ajoute le scope. Le store s'enregistre aussi
// auprès du bridge d'auth pour rehydrate aux transitions.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createScopedStorage } from '../lib/auth/storage-scope';
import { registerPersistedStore } from '../lib/auth/auth-scope-bridge';
import { defensiveMerge, defensiveMigrate } from './migrationDefensive';

export interface IconSlot {
  /** Colonne dans la grille du bureau, 0 = la plus à gauche. */
  col: number;
  /** Ligne dans la grille du bureau, 0 = la plus en haut. */
  row: number;
}

interface DesktopLayoutState {
  /** Map appId → position. Une icône absente de la map utilise la pose
   *  automatique de la grille (ordre d'enregistrement dans app-registry). */
  positions: Record<string, IconSlot>;
  /** Pose ou remplace la position d'une icône. */
  setPosition: (appId: string, slot: IconSlot) => void;
  /** Supprime la pose d'une icône — elle retombe sur la grille auto. */
  clearPosition: (appId: string) => void;
  /** Réinitialise tout le bureau — les icônes reviennent à la pose auto. */
  reset: () => void;
}

/** Valide une IconSlot : entiers positifs. Une entrée qui n'a pas la
 *  bonne forme est écartée, jamais corrigée silencieusement (la pose
 *  auto reprend la main). */
function sanitizeIconSlot(value: unknown): IconSlot | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const v = value as { col?: unknown; row?: unknown };
  if (typeof v.col !== 'number' || !Number.isInteger(v.col) || v.col < 0) return undefined;
  if (typeof v.row !== 'number' || !Number.isInteger(v.row) || v.row < 0) return undefined;
  return { col: v.col, row: v.row };
}

/** Valide la map de positions : on itère les entrées et on écarte
 *  celles qui ne sont pas des IconSlot valides. */
function sanitizePositions(value: unknown): Record<string, IconSlot> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, IconSlot> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const slot = sanitizeIconSlot(v);
    if (slot) out[k] = slot;
  }
  return out;
}

export const useDesktopLayout = create<DesktopLayoutState>()(
  persist(
    (set) => ({
      positions: {},
      setPosition: (appId, slot) =>
        set((state) => ({
          positions: { ...state.positions, [appId]: slot },
        })),
      clearPosition: (appId) =>
        set((state) => {
          // Copie sans la clé : ne pas muter l'objet du store, Zustand
          // comparerait à shallow-equal sinon et le re-render ne partirait
          // pas. `delete` mute ; on préfère reconstruire.
          if (!(appId in state.positions)) return state;
          const next = { ...state.positions };
          delete next[appId];
          return { positions: next };
        }),
      reset: () => set({ positions: {} }),
    }),
    {
      name: 'desktop-layout-v1',
      storage: createJSONStorage(() => createScopedStorage()),
      // On ne persiste QUE la map. Les fonctions sont reconstruites à
      // chaque hydratation — pas la peine de les sauver.
      partialize: (state) => ({ positions: state.positions }),
      // FIX-8 (2026-08-17) — version + migrate. Cf. migrationDefensive.ts.
      version: 1,
      migrate: defensiveMigrate<DesktopLayoutState>(1),
      merge: defensiveMerge<DesktopLayoutState>({
        validators: { positions: sanitizePositions },
      }),
    },
  ),
);

registerPersistedStore({
  name: 'useDesktopLayout',
  persist: useDesktopLayout.persist,
});

/** Dimensions d'une case de la grille du bureau. Exportées pour que
 *  `DesktopIcons.tsx` (rendu) et `desktopLayout.test.ts` (vérif du snap)
 *  utilisent exactement les mêmes nombres. Tout changement ici casse la
 *  migration, et c'est voulu. */
export const LARGEUR_CASE = 96; // 86 (icône) + 8 (gap-x) + 2 (respiration)
export const HAUTEUR_CASE = 104; // voir DesktopIcons.tsx : icon + pastille + gouttières
