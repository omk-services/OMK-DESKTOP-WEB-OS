/** Réglages du dock — position et habillage, persistés.
 *
 *  Le dock des apps ouvertes se pose en bas à l'horizontale par défaut, ou à
 *  droite à la verticale, comme les barres d'outils flottantes qu'on trouve
 *  sur un bureau Windows. Le choix suit l'utilisateur d'une session à l'autre :
 *  changer la position du dock à chaque ouverture serait une corvée, pas un
 *  réglage.
 *
 *  La lecture est défensive (`try/catch`) : en navigation privée ou avec un
 *  quota plein, `localStorage` lève, et un dock qui fait tomber tout le bureau
 *  pour un réglage cosmétique serait absurde.
 */
import { create } from 'zustand';
import { DOCK_SKIN_DEFAULT } from '../lib/dockSkins';

export type DockPosition = 'bottom' | 'right';

const STORAGE_KEY = 'coach-os:dock:v1';

interface DockPrefs {
  position: DockPosition;
  skinId: string;
}

const DEFAUTS: DockPrefs = { position: 'bottom', skinId: DOCK_SKIN_DEFAULT };

function lire(): DockPrefs {
  if (typeof window === 'undefined') return DEFAUTS;
  try {
    const brut = window.localStorage.getItem(STORAGE_KEY);
    if (!brut) return DEFAUTS;
    const parsed = JSON.parse(brut) as Partial<DockPrefs>;
    return {
      position: parsed.position === 'right' ? 'right' : 'bottom',
      skinId: typeof parsed.skinId === 'string' ? parsed.skinId : DEFAUTS.skinId,
    };
  } catch {
    return DEFAUTS;
  }
}

function ecrire(prefs: DockPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Quota plein ou mode privé — le réglage vit alors le temps de la session.
  }
}

interface DockState extends DockPrefs {
  setPosition: (position: DockPosition) => void;
  setSkin: (skinId: string) => void;
  togglePosition: () => void;
}

export const useDockStore = create<DockState>((set, get) => ({
  ...lire(),

  setPosition: (position) => {
    set({ position });
    ecrire({ position, skinId: get().skinId });
  },

  setSkin: (skinId) => {
    set({ skinId });
    ecrire({ position: get().position, skinId });
  },

  togglePosition: () => {
    const position: DockPosition = get().position === 'bottom' ? 'right' : 'bottom';
    set({ position });
    ecrire({ position, skinId: get().skinId });
  },
}));
