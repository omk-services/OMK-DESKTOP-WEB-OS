/** Shell store — global OS state (windows, dock, notifications, layout).
 *  Forked verbatim from A'Space Life OS canon (proven window engine).
 *
 *  Notifications (S_SOCLE chantier 2, 2026-08-10) — toasts used to vanish
 *  after ~5s leaving no trace. Every `addToast` now also appends to a
 *  capped `notifications` history (newest first, max 50). The bell counter
 *  tracks unread entries only — opening the panel does NOT mark as read,
 *  the user has to click "Tout marquer comme lu" (which now backs
 *  `clearNotifications`). The history persists across the session so a
 *  notification fired 20 minutes ago is still readable in the panel. */
import { create } from 'zustand';
import { createScopedStorage } from '../lib/auth/storage-scope';
import { decodeVersionedEnvelope } from './migrationDefensive';

/* ═══ Types ═══ */

export interface AppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Toast {
  id: string;
  message: string;
  source: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

/** Persistent notification entry. Same shape as a Toast plus `read` so the
 *  bell counter can stay accurate even if the toast itself has already
 *  auto-dismissed from the screen. */
export interface Notification {
  id: string;
  message: string;
  source: string;
  type: Toast['type'];
  timestamp: number;
  read: boolean;
}

function isAppWindow(value: unknown): value is AppWindow {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AppWindow>;
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.isOpen === 'boolean'
    && typeof candidate.isMinimized === 'boolean'
    && typeof candidate.isMaximized === 'boolean'
    && typeof candidate.zIndex === 'number'
    && typeof candidate.position?.x === 'number'
    && typeof candidate.position?.y === 'number'
    && typeof candidate.size?.width === 'number'
    && typeof candidate.size?.height === 'number';
}

interface ShellState {
  windows: AppWindow[];
  activeWindowId: string | null;
  /** Unread notification count driving the bell badge. */
  notificationCount: number;
  toasts: Toast[];
  /** Persistent history (newest first). Capped at NOTIFICATIONS_MAX. */
  notifications: Notification[];

  /* windows */
  openApp: (id: string, title: string) => void;
  closeApp: (id: string) => void;
  minimizeApp: (id: string) => void;
  maximizeApp: (id: string) => void;
  focusApp: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateWindowState: (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;

  /* global */
  bootClean: () => void;
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
  /** Mark every notification as read (does not erase the history).
   *  Backs the "Tout marquer comme lu" action in the bell dropdown. */
  clearNotifications: () => void;
  /** Erase the entire notification history (in case the user wants a
   *  clean slate). Counter goes to 0 along with the list. */
  dismissAllNotifications: () => void;
  /** Remove a single notification from the history. */
  dismissNotification: (id: string) => void;

  /* persistence */
  saveLayout: () => void;
  restoreLayout: () => void;
}

/* ═══ Constants & Helpers ═══ */

const TOPBAR_HEIGHT = 40;
const DOCK_SAFE_AREA = 100;
const NOTIFICATIONS_MAX = 50;

function clampPosition(x: number, y: number) {
  const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: Math.max(20, Math.min(x, vWidth - 200)),
    y: Math.max(TOPBAR_HEIGHT + 10, Math.min(y, vHeight - DOCK_SAFE_AREA - 100)),
  };
}

function nextZ(windows: AppWindow[]): number {
  const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
  return Math.min(1000, maxZ + 1);
}

function toastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const LAYOUT_KEY = 'shell-layout-v1';
// FIX-8 (2026-08-17) — la version est désormais numérique pour
// s'aligner sur le helper `decodeVersionedEnvelope` (qui rejette
// toute charge avec une version < currentVersion). Une charge
// héritée avec `version: '0.1.0'` (string) est écartée par le
// helper (le `typeof v !== 'number'` la fait tomber), et le
// bureau repart vide — c'est le défaut préférable à l'échec.
const SCHEMA_VERSION = 1;

/* ═══ Store ═══ */

export const useShellStore = create<ShellState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  notificationCount: 0,
  toasts: [],
  notifications: [],

  openApp: (id, title) => set((s) => {
    const existing = s.windows.find(w => w.id === id);
    if (existing) {
      return {
        windows: s.windows.map(w =>
          w.id === id
            ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ(s.windows) }
            : w
        ),
        activeWindowId: id,
      };
    }
    const offset = (s.windows.filter(w => w.isOpen).length % 5) * 36;
    const initialPos = clampPosition(90 + offset, 72 + offset);
    return {
      windows: [...s.windows, {
        id, title, isOpen: true, isMinimized: false, isMaximized: false,
        zIndex: nextZ(s.windows),
        position: initialPos,
        size: { width: 920, height: 600 },
      }],
      activeWindowId: id,
    };
  }),

  closeApp: (id) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, isOpen: false } : w),
    activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
  })),

  minimizeApp: (id) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
    activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
  })),

  maximizeApp: (id) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w),
  })),

  focusApp: (id) => set((s) => ({
    windows: s.windows.map(w =>
      w.id === id ? { ...w, zIndex: nextZ(s.windows), isMinimized: false } : w
    ),
    activeWindowId: id,
  })),

  updatePosition: (id, x, y) => set((s) => ({
    windows: s.windows.map(w => {
      if (w.id !== id) return w;
      return { ...w, position: clampPosition(x, y) };
    }),
  })),

  updateWindowState: (id, position, size) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, position, size } : w),
  })),

  bootClean: () => {
    try {
      // On utilise la version locale de le wrapper pour la purge — ça donne
      // la clé scopée correcte pour le contexte courant.
      createScopedStorage().removeItem(LAYOUT_KEY);
    } catch {
      // The in-memory reset must still work when storage is unavailable.
    }
    set({ windows: [], activeWindowId: null, notificationCount: 0, toasts: [], notifications: [] });
    window.location.reload();
  },

  addToast: (toast) => set((s) => {
    const id = toastId();
    const ts = Date.now();
    const nextNotifications = [
      { id, ...toast, timestamp: ts, read: false },
      ...s.notifications,
    ].slice(0, NOTIFICATIONS_MAX);
    return {
      toasts: [...s.toasts, { ...toast, id, timestamp: ts }],
      notificationCount: s.notificationCount + 1,
      notifications: nextNotifications,
    };
  }),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  /** Mark every notification as read. Counter goes to 0, history stays. */
  clearNotifications: () => set((s) => ({
    notificationCount: 0,
    notifications: s.notifications.map((n) => (n.read ? n : { ...n, read: true })),
  })),

  dismissAllNotifications: () => set({ notificationCount: 0, notifications: [] }),

  dismissNotification: (id) => set((s) => {
    const target = s.notifications.find((n) => n.id === id);
    const wasUnread = target && !target.read;
    return {
      notifications: s.notifications.filter((n) => n.id !== id),
      notificationCount: wasUnread ? Math.max(0, s.notificationCount - 1) : s.notificationCount,
    };
  }),

  saveLayout: () => {
    const { windows } = get();
    // Brief M (2026-08-11) — the citadel/onboarding auto-launch no longer
    // exists. The previous special-case (`citadelOnly`) is dead code now; if
    // the only window open is `audit` (the renamed onboarding), we still
    // persist it — closing/reopening the browser should restore the same
    // window instead of re-seeding the desktop empty. The check is kept only
    // for the historical one-window case, where persisting a transient
    // single-window layout is the right thing to do.
    try {
      createScopedStorage().setItem(LAYOUT_KEY, JSON.stringify({ version: SCHEMA_VERSION, state: { windows } }));
    } catch {
      // The live layout remains usable when persistence is unavailable.
    }
  },

  restoreLayout: () => {
    try {
      const raw = createScopedStorage().getItem(LAYOUT_KEY);
      if (!raw) return;
      // FIX-8 (2026-08-17) — on lit par le helper de décodage
      // enveloppé. Une charge trop ancienne ou malformée est écartée
      // silencieusement (helper rend `undefined`) ; on supprime alors
      // la clé pour ne pas la relire à chaque tentative.
      const data = decodeVersionedEnvelope<{ windows: unknown }>(raw, SCHEMA_VERSION);
      if (!data) {
        createScopedStorage().removeItem(LAYOUT_KEY);
        return;
      }
      if (!Array.isArray(data.windows) || !data.windows.every(isAppWindow)) {
        createScopedStorage().removeItem(LAYOUT_KEY);
        return;
      }
      // Brief M (2026-08-11) — silent migration: any window carrying the
      // old `onboarding` id (persisted before the rename) is rewritten to
      // `audit` on read. The window is otherwise untouched (position,
      // size, open state). Without this, a saved layout would restore a
      // window pointing at an unregistered app and render the "not
      // registered" dead-end.
      const migrated = (data.windows as Array<{ id?: string }>).map((w) =>
        w && typeof w === 'object' && w.id === 'onboarding' ? { ...w, id: 'audit' } : w
      );
      set({ windows: migrated as AppWindow[] });
    } catch {
      // Corrupted or unavailable storage is ignored.
    }
  },
}));

/* ═══ Ouverture pilotable pour les captures automatisees ═══
 *
 * En DEV uniquement, le magasin est publie sur `window`. C'est le seul moyen
 * qu'un agent de capture (Playwright, critique du gauntlet loop) ouvre une app
 * de facon deterministe : le bureau ouvre ses fenetres sur un double-clic React,
 * et un double-clic synthetique ne reproduit pas la sequence d'evenements que
 * React attend — plusieurs tentatives d'automatisation s'y sont cassees.
 *
 * Rien n'est expose en production : `import.meta.env.DEV` est evalue au build et
 * Vite elimine le bloc entier du bundle.
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Preserve any pre-existing handles (themes, scenarios, tools, assistant…)
  // — un reset ici écraserait les handles posés par d'autres stores au boot.
  window.__coachos = { ...window.__coachos, shell: useShellStore };
}
