/**
 * CanvasUI LiquidMetal — animated liquid metal surface using CSS + SVG turbulence.
 * Sister pattern to LANDING-AESTHETIC-001 §3.5 "signature element" + §3.6 atmosphere.
 * GPU-accelerated via SVG filter primitives.
 * Pause off-screen + respects prefers-reduced-motion.
 *
 * Note: This is a CPU-light CSS/SVG implementation (not WebGL) to keep the bundle
 * small and avoid shader compilation cost. For a heavier WebGL variant see the
 * upstream https://github.com/DavidHDev/canvas-ui which we don't vendor.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';

interface LiquidMetalProps {
  /** Base hue (sharp accent per LANDING-AESTHETIC-001 §3.4). */
  color?: string;
  /** Highlight hue (typically 30-60deg lighter than color). */
  highlightColor?: string;
  /** Shadow hue (typically 30-60deg darker than color). */
  shadowColor?: string;
  /** Width / height of the surface in pixels. */
  size?: number;
  /** Children to overlay on top of the liquid metal surface. */
  children?: React.ReactNode;
  /** Optional className passthrough. */
  className?: string;
}

export function LiquidMetal({
  color = '#7C1F23',
  highlightColor = '#F5F2EC',
  shadowColor = '#1A1A1A',
  size = 120,
  children,
  className = '',
}: LiquidMetalProps): ReactElement {
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
      return () => {
        motionQuery.removeEventListener('change', onChange);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
        }
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
      className={`relative inline-block overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${highlightColor}, ${color} 45%, ${shadowColor} 95%)`,
        boxShadow: `0 0 32px ${color}55, inset 0 4px 12px ${highlightColor}33`,
      }}
    >
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'overlay',
          opacity: animate ? 0.85 : 0,
          animation: animate ? 'canvasui-liquidmetal-rotate 6s linear infinite' : 'none',
        }}
      >
        <defs>
          <filter id="canvasui-liquidmetal-turb">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.04"
              numOctaves="2"
              seed="3"
            />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="48" fill={highlightColor} filter="url(#canvasui-liquidmetal-turb)" />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {children}
        </div>
      ) : null}
      <style>{`
        @keyframes canvasui-liquidmetal-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
