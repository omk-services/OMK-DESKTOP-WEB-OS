/**
 * CanvasUI Blaze — neon intensity glow for Cyberpunk (and any neon palette).
 * Pure CSS layered radial-gradients + opacity pulse. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface BlazeProps {
  /** Neon accent (sharp contrast per LANDING-AESTHETIC-001 §3.4). */
  color?: string;
  /** Pulse cycle duration in seconds (default 3). */
  duration?: number;
  children?: ReactNode;
  className?: string;
}

export function Blaze({
  color = '#00ff9d',
  duration = 3,
  children,
  className = '',
}: BlazeProps): ReactElement {
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
        background: `radial-gradient(circle at 20% 30%, ${color}35 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${color}28 0%, transparent 55%)`,
      }}
    >
      {animate ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 30%, ${color}18 70%, transparent 100%)`,
              animation: `canvasui-blaze-pulse ${duration}s ease-in-out infinite`,
              willChange: 'opacity',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-screen"
            style={{
              boxShadow: `inset 0 0 120px ${color}40`,
              animation: `canvasui-blaze-scan ${duration * 2}s linear infinite`,
              willChange: 'transform',
            }}
          />
        </>
      ) : null}
      <style>{`
        @keyframes canvasui-blaze-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes canvasui-blaze-scan {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100%); }
        }
      `}</style>
      {children}
    </div>
  );
}
