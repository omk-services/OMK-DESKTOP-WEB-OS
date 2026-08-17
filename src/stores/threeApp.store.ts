// src/stores/threeApp.store.ts
// Mini-programmes 3D — installes dynamiquement par l'utilisateur.
//
// POURQUOI UN STORE DISTINCT DU REGISTRE :
//   `app-registry.ts` est statique : apps ajoutees au boot via side-effect.
//   Un mini-programme est INSTALLE a un moment arbitraire, persiste
//   entre les sessions, et peut etre DESINSTALLE. Le registre global n'a
//   ni l'API remove ni la persistance. Plutot que de l'etirer, on garde
//   sa forme initiale et on lit les mini-programmes comme une couche
//   supplementaire dans DesktopIcons.
//
// NIVEAU "EASY" D'ABORD :
//   On implemente d'abord le niveau "easy" (URL externe dans un iframe).
//   Les niveaux "hard" (three.js compile + execute) et "expert"
//   (bundle signe) viendront par-dessus, dans le meme store, sous des
//   cles distinctes : `iframeUrl`, `codeSource`, `bundleUrl`.
//
// PERSISTANCE :
//   localStorage, cle `coach-os-three-apps-v1`. Le `partialize` n'expose
//   que les donnees — les fonctions sont reconstruites a l'hydratation.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThreeAppLevel = 'easy' | 'hard' | 'expert';

/** Un mini-programme 3D, tel que stocke dans localStorage. */
export interface ThreeApp {
  /** Identifiant unique, sert de cle d'appId virtuelle ('three:<slug>'). */
  slug: string;
  /** Nom affiche sur le bureau et dans la fenetre. */
  name: string;
  /** Categorie pour le tri et l'App Store : '3D', 'Games', 'Demo', etc. */
  category: string;
  /** Niveau de difficulte / mode d'execution. */
  level: ThreeAppLevel;
  /** URL externe pour le mode easy (iframe). Les autres niveaux ajoutent
   *  leurs propres champs (codeSource, bundleUrl) sans casser ce contrat. */
  iframeUrl?: string;
  /** Quand l'utilisateur a installe ce mini-programme. ISO 8601. */
  installedAt: string;
}

interface ThreeAppState {
  apps: Record<string, ThreeApp>;
  install: (app: ThreeApp) => void;
  uninstall: (slug: string) => void;
  reset: () => void;
}

export const useThreeAppStore = create<ThreeAppState>()(
  persist(
    (set) => ({
      apps: {},
      install: (app) =>
        set((state) => ({
          apps: { ...state.apps, [app.slug]: app },
        })),
      uninstall: (slug) =>
        set((state) => {
          if (!(slug in state.apps)) return state;
          const next = { ...state.apps };
          delete next[slug];
          return { apps: next };
        }),
      reset: () => set({ apps: {} }),
    }),
    {
      name: 'coach-os-three-apps-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ apps: s.apps }),
      // Au premier chargement (storage vide), on pose un mini-programme
      // de demonstration. C'est un seed, pas un forçage : si l'utilisateur
      // le desinstalle, le storage reste vide et on ne le reinstalle pas.
      // On utilise `onRehydrateStorage` pour ne PAS ecraser un storage
      // deja peuple ; et `migrate` n'est pas necessaire ici.
      onRehydrateStorage: () => (state) => {
        if (state && Object.keys(state.apps).length === 0) {
          state.apps = Object.fromEntries(SEEDS.map((s) => [s.slug, s]));
        }
      },
    },
  ),
);

/** Seed initial : un exemple 3D (threejs.org) et un workspace (Macro).
 *  Retireable par clic-droit sur l'icone du bureau. */
const SEEDS: ThreeApp[] = [
  {
    slug: 'tearable-ui',
    name: 'Tearable UI',
    category: 'Demo',
    level: 'easy',
    // threejs.org/examples/?q=tearable — page complete, pas iframe vers
    // un sous-cadre. L'exemple embarque ses assets en relatif.
    iframeUrl: 'https://threejs.org/examples/?q=tearable#webgl_physics_cloth',
    installedAt: new Date('2026-08-15T10:00:00Z').toISOString(),
  },
  {
    slug: 'macro',
    name: 'Macro',
    category: 'Workspace',
    level: 'easy',
    // macro.com/app/component/calls — page complete, login via Google SSO.
    iframeUrl: 'https://macro.com/app/component/calls',
    installedAt: new Date('2026-08-15T10:05:00Z').toISOString(),
  },
];

/** Compose l'appId virtuel que `shell.store.openApp(id, name)` accepte.
 *  On prefixe par `three:` pour distinguer ces apps-ci des apps du
 *  registre statique (`dashboard`, `tasks`, etc.). */
export function appIdPour(slug: string): string {
  return `three:${slug}`;
}
