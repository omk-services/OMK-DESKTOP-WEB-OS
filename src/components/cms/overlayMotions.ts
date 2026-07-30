/**
 * overlayMotions.ts — 8 entry-motion variants for <AppDetailOverlay>.
 *
 * Each variant maps to a Framer Motion `Variants` object. Reduced-motion
 * short-circuits to duration: 0 at render time (per accessibility
 * contract in spec section 6.2).
 */
import { useEffect, useState } from 'react';
import type { Variants } from 'motion/react';

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

const BASE_EASE = [0.16, 1, 0.3, 1] as const; // ease-out-expo

function withDuration(spec: OverlayMotionSpec, reduced: boolean): Variants {
  const d = reduced ? 0 : spec.durationMs / 1000;
  const ease = BASE_EASE;

  switch (spec.kind) {
    case 'fade-up':
      return {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: d, ease } },
      };
    case 'slide-left':
      return {
        hidden: { opacity: 0, x: -24 },
        visible: { opacity: 1, x: 0, transition: { duration: d, ease } },
      };
    case 'slide-right':
      return {
        hidden: { opacity: 0, x: 24 },
        visible: { opacity: 1, x: 0, transition: { duration: d, ease } },
      };
    case 'slide-bottom':
      return {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: d, ease } },
      };
    case 'pop-scale':
      return {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1, transition: { duration: d, ease } },
      };
    case 'fade-blur':
      return {
        hidden: { opacity: 0, filter: 'blur(8px)' },
        visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: d, ease } },
      };
    case 'type-in':
      return {
        hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        visible: { opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: d, ease } },
      };
    case 'unfold':
      return {
        hidden: { opacity: 0, scaleY: 0.6, transformOrigin: 'top center' },
        visible: { opacity: 1, scaleY: 1, transition: { duration: d, ease } },
      };
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

export function getOverlayVariants(spec: OverlayMotionSpec, reduced: boolean): Variants {
  return withDuration(spec, reduced);
}
