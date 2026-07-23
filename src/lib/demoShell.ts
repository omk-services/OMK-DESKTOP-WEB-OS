/** Demo-coach Mini Desktop OS — in-memory shell store scoped to the onboarding
 *  citadel. NO Zustand persist middleware (the hydration race on the partial
 *  hasBooted field was wiping the in-memory windows on first paint). Instead
 *  the single boolean `hasBooted` is persisted via a small standalone localStorage
 *  helper, keeping the in-memory windows store and the persisted flag fully
 *  orthogonal. */
import { create } from 'zustand';

export interface DemoAppWindow {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface DemoShellState {
  windows: DemoAppWindow[];
  activeWindowId: string | null;
  openApp: (id: string, title: string) => void;
  closeApp: (id: string) => void;
  closeAll: () => void;
  minimizeApp: (id: string) => void;
  maximizeApp: (id: string) => void;
  focusApp: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateWindowState: (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;
}

function nextZ(windows: DemoAppWindow[]): number {
  const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
  return Math.min(1000, maxZ + 1);
}

const DEFAULT_W = 320;
const DEFAULT_H = 260;

const FLAG_KEY = 'demo-coach-boot-flag-v1';

export function hasSeenCitadel(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markCitadelSeen(): void {
  try {
    localStorage.setItem(FLAG_KEY, 'true');
  } catch {
    // best-effort — localStorage may be unavailable in private browsing
  }
}

export const useDemoShellStore = create<DemoShellState>()((set) => ({
  windows: [],
  activeWindowId: null,

  openApp: (id, title) => set((s) => {
    if (id === '__citadel__') {
      // Citadel is the Onboarding playground — sized to a generous portion of
      // viewport so the citadel panel + 4 mini-apps all breathe inside it.
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const citadelW = Math.min(820, vw - 80);
      const citadelH = Math.min(640, vh - 80);
      const existing = s.windows.find(w => w.id === id);
      if (existing) {
        return {
          windows: s.windows.map(w =>
            w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ(s.windows) } : w
          ),
          activeWindowId: id,
        };
      }
      return {
        windows: [...s.windows, {
          id, title, isOpen: true, isMinimized: false, isMaximized: false,
          zIndex: nextZ(s.windows),
          position: { x: Math.max(20, Math.floor((vw - citadelW) / 2)), y: Math.max(40, Math.floor((vh - citadelH) / 2)) },
          size: { width: citadelW, height: citadelH },
        }],
        activeWindowId: id,
      };
    }
    const existing = s.windows.find(w => w.id === id);
    if (existing) {
      return {
        windows: s.windows.map(w =>
          w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZ(s.windows) } : w
        ),
        activeWindowId: id,
      };
    }
    const openCount = s.windows.filter(w => w.isOpen && !w.isMinimized).length;
    const cols = 2;
    const GAP_X = 12;
    const GAP_Y = 12;
    const xOff = 18;
    const yOff = 16;
    const idx = openCount;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const xPos = xOff + col * (DEFAULT_W + GAP_X);
    const yPos = yOff + row * (DEFAULT_H + GAP_Y);
    return {
      windows: [...s.windows, {
        id, title, isOpen: true, isMinimized: false, isMaximized: false,
        zIndex: nextZ(s.windows),
        position: { x: xPos, y: yPos },
        size: { width: DEFAULT_W, height: DEFAULT_H },
      }],
      activeWindowId: id,
    };
  }),

  closeApp: (id) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, isOpen: false } : w),
    activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
  })),

  closeAll: () => set(() => ({ windows: [], activeWindowId: null })),

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
    windows: s.windows.map(w => w.id === id ? { ...w, position: { x, y } } : w),
  })),

  updateWindowState: (id, position, size) => set((s) => ({
    windows: s.windows.map(w => w.id === id ? { ...w, position, size } : w),
  })),
}));
