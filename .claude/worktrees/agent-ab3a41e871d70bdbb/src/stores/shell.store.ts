/** Shell store — global OS state (windows, dock, notifications, layout).
 *  Forked verbatim from A'Space Life OS canon (proven window engine). */
import { create } from 'zustand';

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

interface ShellState {
  windows: AppWindow[];
  activeWindowId: string | null;
  notificationCount: number;
  toasts: Toast[];

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
  clearNotifications: () => void;

  /* persistence */
  saveLayout: () => void;
  restoreLayout: () => void;
}

/* ═══ Constants & Helpers ═══ */

const TOPBAR_HEIGHT = 40;
const DOCK_SAFE_AREA = 100;

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

const LAYOUT_KEY = 'coach-os-shell-layout-v1';
const SCHEMA_VERSION = '0.1.0';

/* ═══ Store ═══ */

export const useShellStore = create<ShellState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  notificationCount: 0,
  toasts: [],

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
    localStorage.removeItem(LAYOUT_KEY);
    set({ windows: [], activeWindowId: null, notificationCount: 0, toasts: [] });
    window.location.reload();
  },

  addToast: (toast) => set((s) => ({
    toasts: [...s.toasts, { ...toast, id: toastId(), timestamp: Date.now() }],
    notificationCount: s.notificationCount + 1,
  })),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  clearNotifications: () => set({ notificationCount: 0 }),

  saveLayout: () => {
    const { windows } = get();
    // Don't persist a state containing only the auto-launched citadel window —
    // we don't want subsequent reloads to rehydrate that state and skip the
    // demo seed. The citadel-only state is transient.
    const citadelOnly = windows.length === 1 && windows[0].id === 'onboarding' && windows[0].isOpen;
    if (citadelOnly) {
      localStorage.removeItem(LAYOUT_KEY);
      return;
    }
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ version: SCHEMA_VERSION, state: { windows } }));
  },

  restoreLayout: () => {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.version === SCHEMA_VERSION) {
        set({ windows: data.state.windows || [] });
      } else {
        localStorage.removeItem(LAYOUT_KEY);
      }
    } catch { /* corrupted layout, ignore */ }
  },
}));
