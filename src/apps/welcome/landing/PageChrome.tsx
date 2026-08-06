/** PageChrome — shared top chrome (page-tabs strip + sticky header menu) for
 *  landing-page previews in the Welcome app. Each canvas below owns its own
 *  scroll body, but the rail at the top stays identical so the user can flip
 *  between pages without losing their place.
 *
 *  Structural differentiation lives in the *body* (the sections each canvas
 *  renders) — never in the chrome. The chrome is navigation, not content. */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUp, Compass } from 'lucide-react';
import { LANDING_PAGES } from './landingPages';

const PAGE_ICON: Record<string, typeof Compass> = {
  'domaine-1-rh-meta-gouvernance': Compass,
  'domaine-2-operations': Compass,
  'domaine-3-growth': Compass,
  'domaine-4-cognition-savoir': Compass,
  'domaine-5-people-scalabilite': Compass,
  'domaine-6-finance': Compass,
  'domaine-7-it-rd': Compass,
  'domaine-8-legal-conformite': Compass,
  'onboarding-demo': Compass,
};

interface SectionMeta { id: string; label: string }

export interface PageChromeProps {
  brand: string;
  domain: string;
  accent: string;
  /** Page-tab identifier that is currently highlighted. */
  activePageId: string;
  /** Section anchor list — passed in so each canvas declares its own nav. */
  sections: SectionMeta[];
  /** Switch the active landing-page preview. */
  onSelectPage: (id: string) => void;
  /** When true, render only the body (skip the page-tabs strip + header).
   *  Used by canvases that want a different top layout. */
  bare?: boolean;
  children: ReactNode;
  /** Outer ref — owned by the canvas so it can run a scroll-spy. */
  bodyRef?: React.RefObject<HTMLDivElement | null>;
}

export function PageChrome({
  brand, domain, accent, activePageId, sections,
  onSelectPage, bare, children, bodyRef,
}: PageChromeProps) {
  const [activeSection, setActiveSection] = useState<string>('top');
  const scrollSpyRef = useRef<HTMLDivElement | null>(null);

  // Scroll-spy: keep the nav chip in sync with the section visible at the top
  // of the canvas viewport. IntersectionObserver against section anchors.
  useEffect(() => {
    const root = (bodyRef?.current ?? scrollSpyRef.current);
    if (!root) return;
    const sectionEls = sections
      .map(s => root.querySelector(`[data-anchor="${s.id}"]`))
      .filter((el): el is Element => Boolean(el));
    if (sectionEls.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.anchor;
          if (id) setActiveSection(id);
        }
      },
      { root, rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    sectionEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, bodyRef]);

  const scrollTo = (id: string) => {
    const root = (bodyRef?.current ?? scrollSpyRef.current);
    if (!root) return;
    const target = root.querySelector(`[data-anchor="${id}"]`) as HTMLElement | null;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (bare) return <>{children}</>;

  return (
    <div className="flex flex-col h-full bg-[var(--theme-bg)]">
      {/* Page-tabs strip — flip between landing pages without leaving the canvas */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-[var(--theme-surface)] backdrop-blur border-b border-[var(--panel-border)] px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text-dim)] mr-2 shrink-0">Pages</span>
        {LANDING_PAGES.map(p => {
          const Icon = PAGE_ICON[p.id] ?? Compass;
          const active = p.id === activePageId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-[var(--theme-accent)] text-[color:#fff] shadow-md'
                  : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {p.brand}
            </button>
          );
        })}
      </div>

      {/* Sticky Header Menu */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[var(--theme-surface)] border-b border-[var(--panel-border)] shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[color:#fff] text-[11px] font-extrabold shadow-md"
              style={{ background: `linear-gradient(135deg, ${accent}, var(--theme-accent-hover))` }}
            >
              {brand.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </span>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-tight text-[var(--theme-text)]">{brand}</span>
              <span className="text-[10px] text-[var(--theme-text-muted)]">{domain}</span>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto custom-scrollbar flex-1">
            {sections.map(s => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[var(--theme-accent)] text-[color:#fff] shadow-md'
                      : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={() => scrollTo('cta')}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-accent)] text-[color:#fff] px-4 py-1.5 text-xs font-bold shadow-md hover:bg-[var(--theme-accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            Start free
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        ref={bodyRef ?? scrollSpyRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {children}
      </div>
    </div>
  );
}

/** BackToTop — sticky footer chip shared by canvases. */
export function BackToTop({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center justify-center pt-4 pb-8">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-surface)] border border-[var(--panel-border)] px-3 py-1 text-xs font-semibold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors"
      >
        <ArrowUp className="w-3 h-3" />
        Back to top
      </button>
    </div>
  );
}
