/* ────────────────────────────────────────────────────────────────────────────
   useSectionObserver — sous-nav active state via IntersectionObserver

   Reprend la logique de public/site/effects.js mais en version hook.
   Respecte prefers-reduced-motion : annule l'observation, garde la 1re section.
   ──────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';

export function useSectionObserver(sectionIds: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sectionIds.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      setActiveId(sectionIds[0]);
      return;
    }

    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const topId = visible[0].target.id;
        setActiveId((current) => (current === topId ? current : topId));
      },
      { threshold: [0.1, 0.4, 0.6], rootMargin: '-15% 0px -55% 0px' },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
