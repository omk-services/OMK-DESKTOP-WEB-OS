/**
 * CanvasUI Particle — floating particles for Aurora UI (gradient orbs ambience).
 * Pure CSS radial-gradients with float + opacity pulse. GPU-accelerated.
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface ParticleProps {
  /** Particle color (typically magenta/pink for Aurora). */
  color?: string;
  /** Float cycle duration in seconds (default 14). */
  duration?: number;
  /** Number of particles rendered (default 5). */
  count?: number;
  children?: ReactNode;
  className?: string;
}

export function Particle({
  color = '#ec4899',
  duration = 14,
  count = 5,
  children,
  className = '',
}: ParticleProps): ReactElement {
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

  const particles = Array.from({ length: count }, (_, i) => ({
    left: (i * 17 + 11) % 95,
    top: (i * 31 + 13) % 85,
    size: 200 + (i * 47) % 180,
    delay: (i * 2.1) % duration,
    duration: duration + (i % 3) * 2,
    key: i,
  }));

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}
    >
      {animate
        ? particles.map((p) => (
            <div
              key={p.key}
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, ${color}60 0%, ${color}20 40%, transparent 70%)`,
                filter: 'blur(40px)',
                animation: `canvasui-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
                willChange: 'transform, opacity',
              }}
            />
          ))
        : null}
      <style>{`
        @keyframes canvasui-particle-float {
          0%, 100% { transform: translate(0, 0)       scale(1);   opacity: 0.55; }
          33%      { transform: translate(30px, -20px) scale(1.1); opacity: 0.75; }
          66%      { transform: translate(-20px, 30px) scale(0.9); opacity: 0.45; }
        }
      `}</style>
      {children}
    </div>
  );
}
