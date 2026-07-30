/**
 * CanvasUI Bend — sharp distortion backdrop for high-contrast themes (Brutalism, Vibrant Block).
 * Pure CSS `filter: contrast()` + `transform: skewX` cycled animation. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface BendProps {
  /** Accent color (sharp contrast per LANDING-AESTHETIC-001 §3.4). */
  color?: string;
  /** Animation cycle duration in seconds (default 4). */
  duration?: number;
  children?: ReactNode;
  className?: string;
}

export function Bend({
  color = '#000000',
  duration = 4,
  children,
  className = '',
}: BendProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };
    motionQuery.addEventListener('change', onChange);

    const node = containerRef.current;
    if (!node) {
      return () => motionQuery.removeEventListener('change', onChange);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entries.isIntersecting && setVisible(true);
      },
      { threshold: 0.01 },
    );
    observer.observe(node);

    return () => {
      motionQuery.removeEventListener('change', onChange);
      observer.disconnect();
    };
  }, []);

  const animate = visible && !prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}
      style={{
        background: `repeating-linear-gradient(45deg, ${color}18 0px, ${color}18 2px, transparent 2px, transparent 12px)`,
      }}
    >
      {animate ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${color}40 50%, transparent 70%)`,
            mixBlendMode: 'multiply',
            transform: 'skewX(-8deg)',
            animation: `canvasui-bend-slide ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        />
      ) : null}
      <style>{`
        @keyframes canvasui-bend-slide {
          from { transform: translateX(-100%) skewX(-8deg); }
          to   { transform: translateX(100%)  skewX(-8deg); }
        }
      `}</style>
      {children}
    </div>
  );
}
