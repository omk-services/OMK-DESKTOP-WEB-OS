/** Tour engine — in-house, window-position aware.
 *
 *  Why this exists (RAPPORT_G §0):
 *    Hosted tour SDKs (Usertour / Shepherd / Joyride) anchor their bubble to a
 *    DOM element via `element.getBoundingClientRect()`. In a floating-window
 *    desktop OS like Coach OS, the user can drag a window mid-tour. The
 *    element's rect moves with the window — but only if the SDK re-computes
 *    every frame. None of the three candidates do. Worse: when the user
 *    closes or minimizes the targeted window, the element disappears from the
 *    DOM and the bubble dangles. The tour breaks silently.
 *
 *    This engine instead subscribes to the shell store (zustand) and tracks
 *    the target window's `position`, `size`, `isOpen`, `isMinimized`. The
 *    bubble is repositioned every animation frame. If the window closes or
 *    minimizes, the step is treated as "target lost" — the tour advances or
 *    aborts cleanly, never leaving a bubble pointing at empty space.
 *
 *  Storage:
 *    Per-tour localStorage guard `coach-os:tour-v2-fired:<tourId>` survives
 *    reloads within the same browser profile. No consent gate (this is
 *    instructional, not analytical). Replay lives in Settings → Help.
 */
import { create } from 'zustand';
import { useShellStore } from '../stores/shell.store';

export type Anchor = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** Optional viewport-zone anchor — used when a step needs to point at a
 *  desktop-level element (TopBar, AppDrawer, DesktopIcons) that does not
 *  carry a stable `data-*` marker. Coordinates are viewport-relative. */
export interface ViewportZone {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourStep {
  /** Stable id — used for analytics and to resume from the same step on reload. */
  id: string;
  /** Optional title (rendered bold above the body). */
  title?: string;
  /** Body copy. Plain text — keeps it predictable in captures. */
  body: string;
  /** What to point at. Pick ONE: */
  /** (a) CSS selector — element in the DOM. */
  selector?: string;
  /** (b) Window id + optional inner selector. */
  windowId?: string;
  insideWindowSelector?: string;
  /** (c) Viewport-relative zone for desktop chrome without markers. */
  zone?: ViewportZone;
  /** Where the bubble sits relative to the anchor box. 'auto' = flip side
   *  if it would clip the viewport edge. */
  anchor?: Anchor;
  /** Optional side offset (px). */
  offset?: number;
  /** Optional action button label (e.g. "Open Onboarding"). Click is a no-op
   *  unless `onAction` is provided. */
  actionLabel?: string;
  onAction?: () => void;
}

export interface TourDef {
  id: string;
  title: string;
  /** Short subtitle for the panel listing. */
  hint: string;
  steps: TourStep[];
}

export type TourStatus = 'idle' | 'running' | 'paused' | 'finished';

interface TourState {
  status: TourStatus;
  tourId: string | null;
  stepIndex: number;
  /** Last computed bubble box (top/left/width/height in viewport coords) or null. */
  bubble: { top: number; left: number; placement: Anchor; width: number } | null;
  /** Reason the most recent step was lost, surfaced to the UI when we auto-advance. */
  lastLostReason: 'window-closed' | 'window-minimized' | 'selector-missing' | null;

  start: (tourId: string) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  stop: () => void;
  /** Test/debug entry — re-fire a tour even if already seen. */
  replay: (tourId: string) => void;
}

const GUARD_PREFIX = 'coach-os:tour-v2-fired:';

function readGuard(tourId: string): boolean {
  try { return localStorage.getItem(GUARD_PREFIX + tourId) === 'true'; } catch { return false; }
}
function writeGuard(tourId: string): void {
  try { localStorage.setItem(GUARD_PREFIX + tourId, 'true'); } catch { /* best-effort */ }
}
function clearGuard(tourId: string): void {
  try { localStorage.removeItem(GUARD_PREFIX + tourId); } catch { /* best-effort */ }
}

/** Reset every per-tour guard — used by Settings → Help "Reset onboarding". */
export function resetAllTourV2Guards(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(GUARD_PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch { /* best-effort */ }
}

export function hasTourV2Fired(tourId: string): boolean {
  return readGuard(tourId);
}

export const useTourStore = create<TourState>((set, get) => ({
  status: 'idle',
  tourId: null,
  stepIndex: 0,
  bubble: null,
  lastLostReason: null,

  start: (tourId) => set({ status: 'running', tourId, stepIndex: 0, bubble: null, lastLostReason: null }),
  next: () => {
    const { tourId, stepIndex } = get();
    if (!tourId) return;
    set({ stepIndex: stepIndex + 1, lastLostReason: null });
  },
  back: () => {
    const { stepIndex } = get();
    if (stepIndex === 0) return;
    set({ stepIndex: stepIndex - 1, lastLostReason: null });
  },
  skip: () => set({ status: 'paused', lastLostReason: null }),
  stop: () => {
    const { tourId } = get();
    if (tourId && get().status !== 'idle') writeGuard(tourId);
    set({ status: 'finished', tourId: null, stepIndex: 0, bubble: null });
  },
  replay: (tourId) => {
    clearGuard(tourId);
    set({ status: 'running', tourId, stepIndex: 0, bubble: null, lastLostReason: null });
  },
}));

/* ─── Geometry helpers ─── */

const BUBBLE_WIDTH = 320;
const BUBBLE_GAP = 12;

interface ResolvedTarget {
  box: { top: number; left: number; right: number; bottom: number; width: number; height: number };
  placement: Anchor;
}

/** Resolve a step's target — returns null when the target is missing. */
export function resolveStepTarget(step: TourStep): ResolvedTarget | null {
  if (step.windowId) {
    const win = useShellStore.getState().windows.find((w) => w.id === step.windowId);
    if (!win || !win.isOpen || win.isMinimized) return null;
    // The shell renders window content via React — no iframe. The window
    // box is the app's frame, so the title bar lives at y=0..40 inside the
    // window box (frame header). When `insideWindowSelector` is set we try
    // to narrow the box to that element; on miss we fall back to the whole
    // window so the bubble still points somewhere sensible.
    const offsetTop = (typeof window !== 'undefined' ? window.scrollY : 0);
    const offsetLeft = (typeof window !== 'undefined' ? window.scrollX : 0);
    const baseBox = {
      top: win.position.y + offsetTop,
      left: win.position.x + offsetLeft,
      right: win.position.x + offsetLeft + win.size.width,
      bottom: win.position.y + offsetTop + win.size.height,
      width: win.size.width,
      height: win.size.height,
    };
    let box = baseBox;
    if (step.insideWindowSelector) {
      const inner = document.querySelector(step.insideWindowSelector);
      if (inner) {
        const rect = inner.getBoundingClientRect();
        box = {
          top: rect.top + offsetTop,
          left: rect.left + offsetLeft,
          right: rect.right + offsetLeft,
          bottom: rect.bottom + offsetTop,
          width: rect.width,
          height: rect.height,
        };
      }
    }
    return { box, placement: step.anchor ?? 'auto' };
  }

  if (step.selector) {
    const el = document.querySelector(step.selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const offsetTop = (typeof window !== 'undefined' ? window.scrollY : 0);
    const offsetLeft = (typeof window !== 'undefined' ? window.scrollX : 0);
    return {
      box: {
        top: rect.top + offsetTop,
        left: rect.left + offsetLeft,
        right: rect.right + offsetLeft,
        bottom: rect.bottom + offsetTop,
        width: rect.width,
        height: rect.height,
      },
      placement: step.anchor ?? 'auto',
    };
  }

  if (step.zone) {
    const z = step.zone;
    return {
      box: {
        top: z.top,
        left: z.left,
        right: z.left + z.width,
        bottom: z.top + z.height,
        width: z.width,
        height: z.height,
      },
      placement: step.anchor ?? 'auto',
    };
  }

  return null;
}

/** Compute bubble position from a resolved target. Picks the placement that
 *  keeps the bubble on-screen; honours explicit `anchor` when set. */
export function computeBubble(target: ResolvedTarget, anchor: Anchor = 'auto'): {
  top: number; left: number; placement: Anchor; width: number;
} {
  const vw = (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const vh = (typeof window !== 'undefined' ? window.innerHeight : 800);
  const { box } = target;
  const explicit = anchor !== 'auto' ? anchor : null;

  const placeTop = (): { top: number; left: number; placement: Anchor; width: number } | null => {
    const top = box.top - BUBBLE_GAP - 200;
    const left = Math.max(8, Math.min(box.left + box.width / 2 - BUBBLE_WIDTH / 2, vw - BUBBLE_WIDTH - 8));
    return { top: Math.max(8, top), left, placement: 'top', width: BUBBLE_WIDTH };
  };
  const placeBottom = (): { top: number; left: number; placement: Anchor; width: number } | null => {
    const top = box.bottom + BUBBLE_GAP;
    const left = Math.max(8, Math.min(box.left + box.width / 2 - BUBBLE_WIDTH / 2, vw - BUBBLE_WIDTH - 8));
    if (top + 200 > vh) return null;
    return { top, left, placement: 'bottom', width: BUBBLE_WIDTH };
  };
  const placeLeft = (): { top: number; left: number; placement: Anchor; width: number } | null => {
    const top = Math.max(8, Math.min(box.top + box.height / 2 - 100, vh - 220));
    const left = box.left - BUBBLE_GAP - BUBBLE_WIDTH;
    if (left < 8) return null;
    return { top, left, placement: 'left', width: BUBBLE_WIDTH };
  };
  const placeRight = (): { top: number; left: number; placement: Anchor; width: number } | null => {
    const top = Math.max(8, Math.min(box.top + box.height / 2 - 100, vh - 220));
    const left = box.right + BUBBLE_GAP;
    if (left + BUBBLE_WIDTH > vw - 8) return null;
    return { top, left, placement: 'right', width: BUBBLE_WIDTH };
  };

  if (explicit === 'top') return placeTop() ?? placeBottom() ?? placeRight() ?? placeLeft() ?? { top: 24, left: 24, placement: 'top', width: BUBBLE_WIDTH };
  if (explicit === 'bottom') return placeBottom() ?? placeTop() ?? placeRight() ?? placeLeft() ?? { top: 24, left: 24, placement: 'bottom', width: BUBBLE_WIDTH };
  if (explicit === 'left') return placeLeft() ?? placeRight() ?? placeBottom() ?? placeTop() ?? { top: 24, left: 24, placement: 'left', width: BUBBLE_WIDTH };
  if (explicit === 'right') return placeRight() ?? placeLeft() ?? placeBottom() ?? placeTop() ?? { top: 24, left: 24, placement: 'right', width: BUBBLE_WIDTH };

  // Auto: prefer bottom (most natural reading order), then top, then sides.
  return placeBottom() ?? placeTop() ?? placeRight() ?? placeLeft() ?? { top: 24, left: 24, placement: 'bottom', width: BUBBLE_WIDTH };
}
