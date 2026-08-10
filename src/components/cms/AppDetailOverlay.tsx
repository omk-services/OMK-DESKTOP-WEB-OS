/**
 * AppDetailOverlay.tsx — Canon shell for in-place app detail pages.
 *
 * Sister pattern extracted from src/apps/sales/SalesApp.tsx:519-526.
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §3.1
 *
 * Contract:
 *  - Renders position:absolute overlay filling its parent (left:0; the parent
 *    is the AppFrame content area which already accounts for sidebar width).
 *  - Dispatches one of 8 entry motions (per overlayMotions).
 *  - Focuses the first <h1> in children on mount.
 *  - Exposes role="main" + aria-label="<appName> detail".
 *  - Stops scroll propagation to the AppFrame content.
 *  - Respects prefers-reduced-motion: reduce (delegated to overlayMotions).
 *
 *  S_SOCLE chantier 4 (2026-08-10) — `--sidebar-w` is published by AppFrame
 *  on its own parent and on its root. In the typical pattern (AppFrame +
 *  overlay as siblings in the same fragment) the cascade reaches the
 *  overlay. When an app mounts the overlay elsewhere in the tree — or
 *  when an ancestor sits outside the AppFrame's subtree — the variable
 *  does not resolve, the fallback `0px` kicks in, and the overlay covers
 *  the rail so the user can no longer switch sections.
 *
 *  The robust fix lives here, not in each app: the overlay resolves its
 *  own `left` from a runtime walk of the DOM. We look up the closest
 *  ancestor carrying `--sidebar-w` (AppFrame publishes it on its own
 *  root), and we listen for changes so collapsing/expanding the sidebar
 *  transitions smoothly. If nothing carries the variable we still apply
 *  a sensible default — the expanded sidebar width (240px), NOT 0 — so
 *  the rail is never accidentally covered by a detail. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getOverlayVariants, useReducedMotion } from './overlayMotions';

export type OverlayMotionKind =
  | 'fade-up'
  | 'slide-left'
  | 'slide-right'
  | 'slide-bottom'
  | 'pop-scale'
  | 'fade-blur'
  | 'type-in'
  | 'unfold';

export interface OverlayMotionSpec {
  kind: OverlayMotionKind;
  durationMs: number;
}

export interface AppDetailOverlayProps {
  appId: string;
  /** Hex color for the title-block icon and action button tint. */
  accent: string;
  /** Called when the user clicks the back affordance in the child. */
  onBack: () => void;
  /** Motion signature dispatched on entry. */
  motion: OverlayMotionSpec;
  /** The *DetailPage content. */
  children: ReactNode;
}

const APP_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  people: 'People',
  operations: 'Operations',
  'it-rd': 'IT / R&D',
  clients: 'Clients',
  tasks: 'Tasks',
  marketplace: 'Marketplace',
  product: 'Product',
  growth: 'Growth',
  sales: 'Sales',
  finance: 'Finance',
  legal: 'Legal',
  settings: 'Settings',
};

/** Safe default: assume the sidebar is EXPANDED. Better to leave a
 *  240px gap than to cover the rail. */
const SIDEBAR_FALLBACK_PX = 240;

/** Walk up from `el` looking for the first ancestor whose computed style
 *  carries a non-empty `--sidebar-w`. Returns the parsed pixel value or
 *  `null` when nothing carries it. The walk stops at `document.body`. */
function readSidebarW(el: HTMLElement | null): number | null {
  if (!el) return null;
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const raw = getComputedStyle(node).getPropertyValue('--sidebar-w').trim();
    if (raw) {
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    node = node.parentElement;
  }
  return null;
}

export function AppDetailOverlay({
  appId,
  motion: motionSpec,
  children,
}: AppDetailOverlayProps) {
  const reduced = useReducedMotion();
  const variants = getOverlayVariants(motionSpec, reduced);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = APP_LABELS[appId] ?? appId;
  // null = no measurement yet (initial render before ref attaches); the
  // CSS string we hand to `left` resolves to the safe fallback in that case.
  const [sidebarW, setSidebarW] = useState<number | null>(null);

  // Focus the first <h1> on mount (a11y — section 6.2 of the spec).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const h1 = root.querySelector<HTMLElement>('h1');
    if (h1) {
      h1.focus({ preventScroll: false });
    }
  }, []);

  // Stop scroll propagation so AppFrame content doesn't scroll in parallel
  // (the overlay is its own scrollable region).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const stop = (e: WheelEvent): void => {
      // WheelEvent.target is EventTarget; narrow safely via instanceof.
      if (!(e.target instanceof Node)) return;
      // If the wheel happens inside the overlay, let it scroll the overlay.
      if (root.contains(e.target)) {
        e.stopPropagation();
      }
    };
    root.addEventListener('wheel', stop, { passive: true });
    return () => root.removeEventListener('wheel', stop);
  }, []);

  // Resolve `--sidebar-w` at mount, then re-resolve on every animation
  // frame while the overlay is open so the value tracks AppFrame when
  // the user collapses/expands the sidebar mid-detail.
  useEffect(() => {
    let raf = 0;
    let stopped = false;
    const tick = (): void => {
      if (stopped) return;
      const next = readSidebarW(containerRef.current);
      setSidebarW((prev) => (prev === next ? prev : next));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // Compute the inline `left` value:
  //  - measured value from the DOM walk, when one is found
  //  - explicit `SIDEBAR_FALLBACK_PX` (240) when nothing carries the variable
  //  - `240px` as the inline fallback (in case the inline style is stripped)
  const measuredPx = sidebarW ?? SIDEBAR_FALLBACK_PX;
  const leftValue = `${measuredPx}px`;

  return (
    <AnimatePresence>
      <motion.div
        key="app-detail-overlay"
        ref={containerRef}
        role="main"
        aria-label={`${label} detail`}
        data-testid="app-detail-overlay"
        data-app={appId}
        className="absolute top-0 right-0 bottom-0 z-50 overflow-y-auto custom-scrollbar"
        style={{
          // Commence APRES la sidebar au lieu de la recouvrir. La valeur
          // vient d'une mesure reelle du DOM (cf. readSidebarW) ; le
          // repli `SIDEBAR_FALLBACK_PX` evite le 0 qui recouvrait le rail.
          // La transition de 200ms suit la duree cote sidebar.
          left: leftValue,
          transition: 'left 200ms',
          background: 'var(--theme-bg)',
          color: 'var(--theme-text)',
        }}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
