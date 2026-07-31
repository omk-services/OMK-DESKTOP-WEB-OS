/**
 * AppDetailOverlay.tsx — Canon shell for in-place app detail pages.
 *
 * Sister pattern extracted from src/apps/sales/SalesApp.tsx:519-526.
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §3.1
 *
 * Contract:
 *  - Renders position:absolute overlay, left: var(--sidebar-w, 240px).
 *  - Dispatches one of 8 entry motions (per overlayMotions).
 *  - Focuses the first <h1> in children on mount.
 *  - Exposes role="main" + aria-label="<appName> detail".
 *  - Stops scroll propagation to the AppFrame content.
 *  - Respects prefers-reduced-motion: reduce (delegated to overlayMotions).
 */
import { useEffect, useRef, type ReactNode } from 'react';
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

export function AppDetailOverlay({
  appId,
  motion: motionSpec,
  children,
}: AppDetailOverlayProps) {
  const reduced = useReducedMotion();
  const variants = getOverlayVariants(motionSpec, reduced);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = APP_LABELS[appId] ?? appId;

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

  return (
    <AnimatePresence>
      <motion.div
        key="app-detail-overlay"
        ref={containerRef}
        role="main"
        aria-label={`${label} detail`}
        data-testid="app-detail-overlay"
        data-app={appId}
        className="absolute top-0 right-0 bottom-0 z-50 overflow-y-auto custom-scrollbar bg-white"
        style={{ left: 'var(--sidebar-w, 240px)' }}
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
