/**
 * CanvasUI ThinkingOrbs — three pulsing orbs indicating AI agent activity.
 * Sister pattern to LANDING-AESTHETIC-001 §3.6 "atmosphere" + Jakub Antalik orbs.jakubantalik.com.
 * GPU-accelerated (transform + opacity only).
 * Pause off-screen + respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';

interface ThinkingOrbsProps {
  /** Orb color (sharp accent per LANDING-AESTHETIC-001 §3.4). */
  color?: string;
  /** Orb diameter in pixels (default 10). */
  size?: number;
  /** Stagger delay between orbs in ms (default 180). */
  stagger?: number;
  /** Animation cycle in ms (default 1400). */
  duration?: number;
  /** Label for accessibility (default "AI thinking"). */
  label?: string;
  /** Optional className passthrough. */
  className?: string;
}

export function ThinkingOrbs({
  color = '#2DD4BF',
  size = 10,
  stagger = 180,
  duration = 1400,
  label = 'AI thinking',
  className = '',
}: ThinkingOrbsProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisible(false);
      return;
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
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="status"
      aria-label={label}
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{ height: size * 1.6 }}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: color,
            opacity: visible ? 0.4 : 0,
            animation: visible
              ? `canvasui-orbs-pulse ${duration}ms ease-in-out ${index * stagger}ms infinite`
              : 'none',
            willChange: 'transform, opacity',
          }}
        />
      ))}
      <style>{`
        @keyframes canvasui-orbs-pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          40% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
