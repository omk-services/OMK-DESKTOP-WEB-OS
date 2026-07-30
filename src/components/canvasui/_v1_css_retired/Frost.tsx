/**
 * CanvasUI Frost — frosted glass overlay for Glassmorphism.
 * Pure CSS backdrop-filter + light-refraction gradient. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface FrostProps {
  /** Frost tint color (typically indigo or pale blue). */
  color?: string;
  /** Drift cycle duration in seconds (default 12). */
  duration?: number;
  children?: ReactNode;
  className?: string;
}

export function Frost({
  color = '#6366f1',
  duration = 12,
  children,
  className = '',
}: FrostProps): ReactElement {
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
        background: `linear-gradient(135deg, ${color}15 0%, transparent 50%, ${color}10 100%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {animate ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 20% 80%, ${color}30 0%, transparent 40%)`,
              animation: `canvasui-frost-drift-a ${duration}s ease-in-out infinite`,
              willChange: 'transform',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 80% 20%, ${color}25 0%, transparent 35%)`,
              animation: `canvasui-frost-drift-b ${duration * 0.8}s ease-in-out infinite`,
              willChange: 'transform',
            }}
          />
        </>
      ) : null}
      <style>{`
        @keyframes canvasui-frost-drift-a {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(5%, -3%); }
        }
        @keyframes canvasui-frost-drift-b {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(-4%, 4%); }
        }
      `}</style>
      {children}
    </div>
  );
}
