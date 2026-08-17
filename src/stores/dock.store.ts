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
 *
 *  FIX-2 (2026-08-17) — la persistance passe par le wrapper scopé
 *  (`src/lib/auth/storage-scope.ts`) pour que la clé soit propre à
 *  (user, tenant). Sans ça, deux comptes sur le même navigateur partagent
 *  leur disposition du dock. La clé logique reste `dock:v1` ; le wrapper
 *  ajoute `coach-os:<user>:<tenant>:`.
 *
 *  FIX-8 (2026-08-17) — versionnage défensif. Le blob est désormais
 *  enveloppé `{ version, state }`. Une charge sans version, ou avec une
 *  version antérieure, est écartée ; le dock tombe sur ses défauts.
 *  Format un peu plus bavard mais aligné sur les autres stores du
 *  périmètre, ce qui permet de partager le helper de décodage.
 */
import { create } from 'zustand';
import { DOCK_SKIN_DEFAULT } from '../lib/dockSkins';
import { createScopedStorage } from '../lib/auth/storage-scope';
import { decodeVersionedEnvelope } from './migrationDefensive';

export type DockPosition = 'bottom' | 'right';

const STORAGE_KEY = 'dock:v1';
const VERSION = 1;

interface DockPrefs {
  position: DockPosition;
  skinId: string;
}

const DEFAUTS: DockPrefs = { position: 'bottom', skinId: DOCK_SKIN_DEFAULT };

function storage() {
  return createScopedStorage();
}

/** Valide un objet DockPrefs. Les champs hors-types (un skinId en
 *  number, une position en string bizarre) sont ramenés au défaut. */
function sanitizePrefs(value: unknown): DockPrefs {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return DEFAUTS;
  }
  const v = value as Partial<DockPrefs>;
  return {
    position: v.position === 'right' ? 'right' : 'bottom',
    skinId: typeof v.skinId === 'string' ? v.skinId : DEFAUTS.skinId,
  };
}

/** Décode le blob enveloppé. Renvoie `undefined` si absent, corrompu,
 *  ou trop ancien — le caller retombe alors sur DEFAUTS. */
function decode(raw: string | null): DockPrefs | undefined {
  return decodeVersionedEnvelope<DockPrefs>(raw, VERSION);
}

/** Lit depuis le storage. `decode` peut jeter si le JSON est mal
 *  formé (geste double : parse puis enveloppe) — on reste dans le
 *  try/catch pour préserver le contrat « un dock qui plante ne fait
 *  pas tomber le bureau ». */
function lire(): DockPrefs {
  if (typeof window === 'undefined') return DEFAUTS;
  try {
    const brut = storage().getItem(STORAGE_KEY);
    const decoded = decode(brut);
    if (!decoded) return DEFAUTS;
    return sanitizePrefs(decoded);
  } catch {
    return DEFAUTS;
  }
}

function ecrire(prefs: DockPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope = { version: VERSION, state: prefs };
    storage().setItem(STORAGE_KEY, JSON.stringify(envelope));
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