/** WelcomeApp — Circle.so-style landing-page CMS for the Coach OS Desktop.
 *
 *  Layout:
 *   - Sidebar (left, AppFrame-style): Overview + one entry per landing page.
 *     Each entry opens the LandingCanvas focused on that page.
 *   - Header Menu (sticky top of the canvas): one anchor per SECTION of the
 *     active landing page (Top / Features / Stats / Testimonials / Pricing /
 *     FAQ / CTA). Circle.so-style one-page in-page nav.
 *   - Canvas (right): the active landing page rendered as one long scroll,
 *     with smooth-scroll-to-anchor and scroll-spy highlighting the active
 *     section in the Header Menu. A compact page-tabs strip at the top of
 *     the canvas lets A+ flip between landing pages without losing the
 *     sidebar context.
 *
 *  Each landing page is pure presentational data from ./landing/landingPages
 *  and built up from the reusable blocks in ./landing/Blocks. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Sparkles, Users, Handshake, ClipboardList, Play, ArrowUp, ArrowRight } from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { LANDING_PAGES } from './landing/landingPages';
import type { LandingPage } from './landing/pageSchema';
import {
  LandingHero, LogoRow, FeatureRow, StatsStrip,
  TestimonialBlock, PricingGrid, FaqAccordion, ClosingCta,
} from './landing/Blocks';

const ACCENT = '#4f46e5';

const PAGE_ICON: Record<string, typeof Compass> = {
  'people-agents': Users,
  'sales-sanctum': Handshake,
  'operations': ClipboardList,
  'onboarding-demo': Play,
};

interface SectionMeta { id: string; label: string }

function pageSections(page: LandingPage): SectionMeta[] {
  return [
    { id: 'top', label: 'Top' },
    ...(page.trust ? [{ id: 'trust', label: 'Trusted by' }] : []),
    { id: 'features', label: 'Features' },
    { id: 'stats', label: 'By the numbers' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
    { id: 'cta', label: 'Get started' },
  ];
}

function LandingCanvas({ page, onSelectPage, activePageId }: { page: LandingPage; onSelectPage: (id: string) => void; activePageId: string }) {
  const sections = useMemo(() => pageSections(page), [page]);
  const [activeSection, setActiveSection] = useState<string>('top');
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Reset scroll + active section when the page changes
  useEffect(() => {
    setActiveSection('top');
    const el = canvasRef.current;
    if (el) el.scrollTop = 0;
  }, [page.id]);

  // Scroll-spy: highlight the section currently visible at the top of the
  // canvas viewport. Uses IntersectionObserver against section anchors.
  useEffect(() => {
    const root = canvasRef.current;
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
  }, [page.id, sections]);

  const scrollTo = (id: string) => {
    const root = canvasRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-anchor="${id}"]`) as HTMLElement | null;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Page-tabs strip — flip between landing pages without leaving the canvas */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-white/60 backdrop-blur border-b border-stone-200/70 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mr-2 shrink-0">Pages</span>
        {LANDING_PAGES.map(p => {
          const Icon = PAGE_ICON[p.id] ?? Compass;
          const active = p.id === activePageId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              {p.brand}
            </button>
          );
        })}
      </div>

      {/* Sticky Header Menu — Circle.so one-page nav */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-stone-200/70 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-[11px] font-extrabold shadow-md">
              {page.brand.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </span>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-tight text-stone-900">{page.brand}</span>
              <span className="text-[10px] text-stone-500">{page.domain}</span>
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
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={() => scrollTo('cta')}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-indigo-600 text-white px-4 py-1.5 text-xs font-bold shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            Start free
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Canvas — scrollable one-page landing */}
      <div ref={canvasRef} className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-12">
          <div data-anchor="top">
            <LandingHero
              brand={page.brand}
              domain={page.domain}
              tagline={page.tagline}
              eyebrow={page.hero.eyebrow}
              headline={page.hero.headline}
              sub={page.hero.sub}
              primaryCta={page.hero.primaryCta}
              secondaryCta={page.hero.secondaryCta}
              rating={page.hero.rating}
            />
          </div>

          {page.trust && (
            <div data-anchor="trust">
              <LogoRow title={page.trust.title} logos={page.trust.logos} />
            </div>
          )}

          <section data-anchor="features" className="flex flex-col gap-16">
            {page.features.map((f, i) => (
              <FeatureRow key={f.id} feature={f} flip={i % 2 === 1} />
            ))}
          </section>

          <div data-anchor="stats">
            <StatsStrip stats={page.stats} />
          </div>

          <section data-anchor="testimonials" className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
                What coaches say
              </h2>
              <span className="text-xs text-stone-500">{page.testimonials.length} highlighted</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.testimonials.map((t, i) => (
                <TestimonialBlock key={i} testimonial={t} />
              ))}
            </div>
          </section>

          <section data-anchor="pricing" className="flex flex-col gap-5">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 mt-2" style={{ fontFamily: 'var(--theme-font-display)' }}>
                Simple, sovereign, USD-only.
              </h2>
              <p className="text-sm text-stone-500 mt-2">US-hosted. CCPA + Colorado AI Act compliant. No hidden seat fees.</p>
            </div>
            <PricingGrid tiers={page.pricing} />
          </section>

          <section data-anchor="faq" className="flex flex-col gap-5">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">FAQ</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 mt-2" style={{ fontFamily: 'var(--theme-font-display)' }}>
                Common questions
              </h2>
            </div>
            <FaqAccordion items={page.faq} />
          </section>

          <div data-anchor="cta">
            <ClosingCta headline={page.closing.headline} sub={page.closing.sub} ctaLabel={page.closing.cta.label} />
          </div>

          <footer className="text-center text-xs text-stone-400 pt-4 pb-8 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => scrollTo('top')}
                className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <ArrowUp className="w-3 h-3" />
                Back to top
              </button>
            </div>
            <span>{page.brand} · {page.domain} · Coach OS · OMK AaaS canon</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-10">
        <section className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-rose-50 border border-stone-200/70 px-8 py-12 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Sparkles className="w-4 h-4" />
            Welcome
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-stone-900" style={{ fontFamily: 'var(--theme-font-display)' }}>
            Circle.so-style landing pages for every Coach OS domain.
          </h1>
          <p className="mt-3 text-stone-600 max-w-2xl">
            Pick a page from the sidebar (or below) to enter its full one-page canvas — hero, features, social proof, pricing, FAQ, and a closing CTA,
            with a sticky header menu for in-page navigation.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs text-stone-500">
              <Compass className="w-3.5 h-3.5" />
              {LANDING_PAGES.length} pages available
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">Pick a page</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LANDING_PAGES.map(p => {
              const Icon = PAGE_ICON[p.id] ?? Compass;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="text-left rounded-2xl bg-white border border-stone-200 shadow-sm p-5 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white" style={{ background: ACCENT }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-stone-900">{p.brand}</div>
                      <div className="text-[11px] text-stone-500">{p.domain}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="mt-3 text-xs text-stone-600 leading-relaxed line-clamp-3">{p.tagline}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export function WelcomeApp() {
  const initialId = LANDING_PAGES[0]?.id ?? '';
  const [activePageId, setActivePageId] = useState<string>(initialId);

  const sections: AppSection[] = useMemo(() => {
    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: Compass,
        render: () => <OverviewPanel onSelect={(id) => setActivePageId(id)} />,
      },
      ...LANDING_PAGES.map(p => {
        const Icon = PAGE_ICON[p.id] ?? Compass;
        return {
          id: p.id,
          label: p.brand,
          icon: Icon,
          render: () => (
            <LandingCanvas page={p} activePageId={activePageId} onSelectPage={(id) => setActivePageId(id)} />
          ),
        } satisfies AppSection;
      }),
    ];
  }, [activePageId]);

  return (
    <AppFrame
      title="Welcome"
      subtitle="Landing pages · Circle.so style"
      icon={Compass}
      accent={ACCENT}
      sections={sections}
    />
  );
}
