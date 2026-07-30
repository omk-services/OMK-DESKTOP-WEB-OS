/**
 * CanvasUI Bubble — soft 3D bubbles for Claymorphism (squishy warmth).
 * Pure CSS radial-gradients with float animation. GPU-accelerated (transform + opacity).
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface BubbleProps {
  /** Soft pastel accent for Claymorphism. */
  color?: string;
  /** Float cycle duration in seconds (default 8). */
  duration?: number;
  /** Number of bubbles rendered (default 6). */
  count?: number;
  children?: ReactNode;
  className?: string;
}

export function Bubble({
  color = '#fdba74',
  duration = 8,
  count = 6,
  children,
  className = '',
}: BubbleProps): ReactElement {
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

  const bubbles = Array.from({ length: count }, (_, i) => {
    const left = (i / count) * 100 + (i % 2 === 0 ? -5 : 5);
    const size = 60 + (i * 23) % 80;
    const delay = (i * 1.3) % duration;
    return { left, size, delay, key: i };
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}
    >
      {animate
        ? bubbles.map((b) => (
            <div
              key={b.key}
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                left: `${b.left}%`,
                bottom: `-${b.size}px`,
                width: b.size,
                height: b.size,
                background: `radial-gradient(circle at 30% 30%, ${color}, ${color}80 60%, transparent 100%)`,
                opacity: 0.55,
                boxShadow: `inset -4px -4px 8px rgba(180,83,9,0.18), inset 4px 4px 8px rgba(255,255,255,0.5)`,
                animation: `canvasui-bubble-float ${duration}s ease-in-out ${b.delay}s infinite`,
                willChange: 'transform, opacity',
              }}
            />
          ))
        : null}
      <style>{`
        @keyframes canvasui-bubble-float {
          0%   { transform: translateY(0)    scale(1);   opacity: 0; }
          10%  { opacity: 0.55; }
          50%  { transform: translateY(-50vh) scale(1.1); }
          90%  { opacity: 0.55; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
      `}</style>
      {children}
    </div>
  );
}
