/* ────────────────────────────────────────────────────────────────────────────
   SectionFrame — pose le style d'une section + son effet Canvas UI
   ──────────────────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../effects/useSectionObserver';

export type CanvasEffectId =
  | 'DecryptReveal' | 'Liquid' | 'ParticleReveal' | 'Grid'
  | 'Glass' | 'Shatter' | 'GlyphRain' | 'none';

export interface SectionFrameProps {
  id: string;
  className: string;
  effectId: CanvasEffectId;
  effectClass: string;
  ariaLabelledby?: string;
  children: ReactNode;
}

/** SectionFrame pose la section, sa classe de style et un effet Canvas UI.
 *  L'effet est posé en CSS pur (fx-canvas + fx-<name>) — Canvas UI React est
 *  importable en option mais la baseline doit rester fonctionnelle sans WebGL.
 *  prefers-reduced-motion désactive la classe d'animation. */
export function SectionFrame({
  id,
  className,
  effectId,
  effectClass,
  ariaLabelledby,
  children,
}: SectionFrameProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <section
      id={id}
      className={`site-section ${className}`}
      aria-labelledby={ariaLabelledby}
      data-effect={effectId}
      data-reduced={reduced ? 'true' : 'false'}
    >
      {effectId !== 'none' && (
        <div
          className={`fx-canvas ${effectClass}`}
          aria-hidden="true"
          data-effect-id={effectId}
        />
      )}
      <div className="site-section__inner">
        {children}
      </div>
    </section>
  );
}
