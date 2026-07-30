/**
 * CanvasUI Asciify — ASCII / halftone print texture for Editorial (magazine).
 * Pure CSS background pattern + slow drift. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface AsciifyProps {
  /** Text tint color (typically ink/sepia). */
  color?: string;
  /** Drift cycle duration in seconds (default 20). */
  duration?: number;
  children?: ReactNode;
  className?: string;
}

export function Asciify({
  color = '#1c1917',
  duration = 20,
  children,
  className = '',
}: AsciifyProps): ReactElement {
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
        background: `radial-gradient(circle at 1px 1px, ${color}25 1px, transparent 1.5px)`,
        backgroundSize: '8px 8px',
      }}
    >
      {animate ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${color}10 50%, transparent 100%)`,
            animation: `canvasui-asciify-drift ${duration}s linear infinite`,
            willChange: 'transform',
          }}
        />
      ) : null}
      <style>{`
        @keyframes canvasui-asciify-drift {
          from { transform: translateY(0); }
          to   { transform: translateY(8px); }
        }
      `}</style>
      {children}
    </div>
  );
}
