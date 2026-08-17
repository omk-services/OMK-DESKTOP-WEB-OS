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
// Clé localStorage : `coach-os-desktop-layout-v1` — préfixe commun aux
// stores existants (dock.store.ts, appVisibility.store.ts). Une version
// dans la clé permet de migrer sans casser les sessions en cours.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      name: 'coach-os-desktop-layout-v1',
      storage: createJSONStorage(() => localStorage),
      // On ne persiste QUE la map. Les fonctions sont reconstruites à
      // chaque hydratation — pas la peine de les sauver.
      partialize: (state) => ({ positions: state.positions }),
    },
  ),
);

/** Dimensions d'une case de la grille du bureau. Exportées pour que
 *  `DesktopIcons.tsx` (rendu) et `desktopLayout.test.ts` (vérif du snap)
 *  utilisent exactement les mêmes nombres. Tout changement ici casse la
 *  migration, et c'est voulu. */
export const LARGEUR_CASE = 96; // 86 (icône) + 8 (gap-x) + 2 (respiration)
export const HAUTEUR_CASE = 104; // voir DesktopIcons.tsx : icon + pastille + gouttières
