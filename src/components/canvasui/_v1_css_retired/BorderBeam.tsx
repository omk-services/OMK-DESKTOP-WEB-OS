/**
 * CanvasUI BorderBeam — animated light beam traveling along element borders.
 * Sister pattern to LANDING-AESTHETIC-001 §3.6 "decorative borders" + §3.4 sharp accent.
 * Source: https://canvasui.dev · MIT + Commons Clause (free personal/commercial, no resale).
 * GPU-accelerated (transform + opacity only, per ECC web/performance rules).
 * Pause off-screen + respects prefers-reduced-motion (LANDING-AESTHETIC-001 §3.6 §3.7).
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

interface BorderBeamProps {
  /** Beam color (sharp accent per LANDING-AESTHETIC-001 §3.4). */
  color?: string;
  /** Beam thickness in pixels (default 2). */
  size?: number;
  /** Animation duration in seconds (default 4). */
  duration?: number;
  /** Beam travel delay in seconds (default 0). */
  delay?: number;
  /** Border radius in pixels (must match the wrapped element). */
  borderRadius?: number;
  /** Children to wrap with the beam border overlay. */
  children: ReactNode;
  /** Optional className passthrough. */
  className?: string;
}

export function BorderBeam({
  color = '#7C1F23',
  size = 2,
  duration = 4,
  delay = 0,
  borderRadius = 8,
  children,
  className = '',
}: BorderBeamProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Respect prefers-reduced-motion (sister LANDING-AESTHETIC-001 §3.6)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisible(false);
      return;
    }

    // Pause off-screen via IntersectionObserver (per CanvasUI docs)
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
      className={`relative inline-block ${className}`}
      style={{ borderRadius }}
    >
      {children}
      {visible && duration > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius,
            padding: size,
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
            backgroundSize: '300% 100%',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: `canvasui-border-beam-slide ${duration}s linear ${delay}s infinite`,
            willChange: 'background-position',
          }}
        />
      ) : null}
      <style>{`
        @keyframes canvasui-border-beam-slide {
          from { background-position: 100% 0%; }
          to { background-position: -100% 0%; }
        }
      `}</style>
    </div>
  );
}
