/**
 * CanvasUI Glitch — subtle RGB-shift scanline overlay for Dark OLED.
 * Pure CSS layered translateX + hue-rotate animation. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface GlitchProps {
  /** Accent color for the RGB shift (typically cyan). */
  color?: string;
  /** Glitch cycle duration in seconds (default 6). */
  duration?: number;
  children?: ReactNode;
  className?: string;
}

export function Glitch({
  color = '#06b6d4',
  duration = 6,
  children,
  className = '',
}: GlitchProps): ReactElement {
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
      style={{ background: '#000000' }}
    >
      {animate ? (
        <>
          {/* RGB-shift: red channel */}
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: `${color}30`,
              animation: `canvasui-glitch-shift-r ${duration}s steps(8) infinite`,
              willChange: 'transform, opacity',
            }}
          />
          {/* Scanlines */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)',
              animation: `canvasui-glitch-scan ${duration * 0.5}s linear infinite`,
              willChange: 'transform',
            }}
          />
        </>
      ) : null}
      <style>{`
        @keyframes canvasui-glitch-shift-r {
          0%, 100% { transform: translateX(0);  opacity: 0.3; }
          25%      { transform: translateX(2px); opacity: 0.5; }
          50%      { transform: translateX(-1px); opacity: 0.4; }
          75%      { transform: translateX(1px); opacity: 0.5; }
        }
        @keyframes canvasui-glitch-scan {
          from { transform: translateY(0); }
          to   { transform: translateY(3px); }
        }
      `}</style>
      {children}
    </div>
  );
}
