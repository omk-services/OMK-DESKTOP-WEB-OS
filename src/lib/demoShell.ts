/** Demo-coach Mini Desktop OS — second instance of the shell store, scoped to the
 *  onboarding citadel demo. Lives in its own localStorage key (no cross-talk with
 *  the Macro OS) so the demo stays visually pristine every reload. State interface
 *  mirrors useShellStore but only the methods the citadel needs (open/close/closeAll
 *  + focus/zIndex). */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  hasBooted: boolean; // tracks whether the onboarding Citadel has been presented
  openApp: (id: string, title: string) => void;
  closeApp: (id: string) => void;
  closeAll: () => void;
  minimizeApp: (id: string) => void;
  maximizeApp: (id: string) => void;
  focusApp: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateWindowState: (id: string, position: { x: number; y: number }, size: { width: number; height: number }) => void;
  bootCitadel: () => void;
  dismissCitadel: () => void;
}

function nextZ(windows: DemoAppWindow[]): number {
  const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
  return Math.min(1000, maxZ + 1);
}

const DEFAULT_W = 480;
const DEFAULT_H = 360;

const LAYOUT_KEY = 'demo-coach-shell-layout-v1';

export const useDemoShellStore = create<DemoShellState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeWindowId: null,
      hasBooted: false,

      openApp: (id, title) => set((s) => {
        if (id === '__citadel__') {
          // citadel window opens the dashboard-sized onboarding view, not a small app
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
              position: { x: 40, y: 50 },
              size: { width: 760, height: 520 },
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
        const cols = 3;
        const idx = openCount;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const xPos = 40 + col * (DEFAULT_W + 24);
        const yPos = 50 + row * 80;
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

      bootCitadel: () => set({ hasBooted: true }),
      dismissCitadel: () => set({ hasBooted: true }),
    }),
    {
      name: LAYOUT_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ hasBooted: s.hasBooted }),
      version: 1,
    },
  ),
);
