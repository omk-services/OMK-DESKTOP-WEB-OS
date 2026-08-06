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
import {
  Compass, Sparkles, Users, ClipboardList, Play, ArrowUp, ArrowRight,
  Atom, Rocket, BrainCircuit, Banknote, ServerCog, ShieldCheck,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { LANDING_PAGES } from './landing/landingPages';
import type { LandingPage } from './landing/pageSchema';
import {
  LandingHero, LogoRow, FeatureRow, StatsStrip,
  TestimonialBlock, PricingGrid, FaqAccordion, ClosingCta,
} from './landing/Blocks';

const ACCENT = '#4f46e5';

const PAGE_ICON: Record<string, typeof Compass> = {
  'domaine-1-rh-meta-gouvernance': Atom,
  'domaine-2-operations': ClipboardList,
  'domaine-3-growth': Rocket,
  'domaine-4-cognition-savoir': BrainCircuit,
  'domaine-5-people-scalabilite': Users,
  'domaine-6-finance': Banknote,
  'domaine-7-it-rd': ServerCog,
  'domaine-8-legal-conformite': ShieldCheck,
  'onboarding-demo': Play,
};

/** B2 leader per Domain (displayed on the OverviewPanel card). The Demo
 *  page has no leader, so we map it to a friendly chip label. */
const PAGE_LEADER: Record<string, string> = {
  'domaine-1-rh-meta-gouvernance': 'Green Lanterns',
  'domaine-2-operations': 'Batman',
  'domaine-3-growth': 'Flash',
  'domaine-4-cognition-savoir': "J'onn J'onzz",
  'domaine-5-people-scalabilite': 'Superman',
  'domaine-6-finance': 'Wonder Woman',
  'domaine-7-it-rd': 'Light + Cyborg',
  'domaine-8-legal-conformite': 'Aquaman',
  'onboarding-demo': 'Free · 4 minutes',
};

/** Three-stage trajectory chips shown in the OverviewPanel hero. */
const TRAJECTORY: { label: string; caption: string }[] = [
  { label: 'PoC', caption: '48h deploy · $1k/mo founder offer' },
  { label: 'SaaS', caption: 'Scale to 100s · Monday standup email' },
  { label: 'White Label', caption: 'Your Agent Factory · Maintained by us' },
];

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
                  ? 'bg-[var(--theme-accent)] text-white shadow-md'
                  : 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {p.brand}
            </button>
          );
        })}
      </div>

      {/* Sticky Header Menu — Circle.so one-page nav */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[var(--theme-surface)] border-b border-[var(--panel-border)] shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-[11px] font-extrabold shadow-md">
              {page.brand.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </span>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] font-extrabold tracking-tight text-[var(--theme-text)]">{page.brand}</span>
              <span className="text-[10px] text-[var(--theme-text-muted)]">{page.domain}</span>
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
                      ? 'bg-[var(--theme-accent)] text-white shadow-md'
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
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-accent)] text-white px-4 py-1.5 text-xs font-bold shadow-md hover:bg-[var(--theme-accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
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
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
                What coaches say
              </h2>
              <span className="text-xs text-[var(--theme-text-muted)]">{page.testimonials.length} highlighted</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.testimonials.map((t, i) => (
                <TestimonialBlock key={i} testimonial={t} />
              ))}
            </div>
          </section>

          <section data-anchor="pricing" className="flex flex-col gap-5">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--theme-text)] mt-2" style={{ fontFamily: 'var(--theme-font-display)' }}>
                Simple, sovereign, USD-only.
              </h2>
              <p className="text-sm text-[var(--theme-text-muted)] mt-2">US-hosted. CCPA + Colorado AI Act compliant. No hidden seat fees.</p>
            </div>
            <PricingGrid tiers={page.pricing} />
          </section>

          <section data-anchor="faq" className="flex flex-col gap-5">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">FAQ</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--theme-text)] mt-2" style={{ fontFamily: 'var(--theme-font-display)' }}>
                Common questions
              </h2>
            </div>
            <FaqAccordion items={page.faq} />
          </section>

          <div data-anchor="cta">
            <ClosingCta headline={page.closing.headline} sub={page.closing.sub} ctaLabel={page.closing.cta.label} />
          </div>

          <footer className="text-center text-xs text-[var(--theme-text-dim)] pt-4 pb-8 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => scrollTo('top')}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-surface)] border border-[var(--panel-border)] px-3 py-1 text-xs font-semibold text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors"
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
  const domainPages = useMemo(
    () => LANDING_PAGES.filter(p => p.id !== 'onboarding-demo'),
    [],
  );
  const demoPage = useMemo(
    () => LANDING_PAGES.find(p => p.id === 'onboarding-demo'),
    [],
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--theme-bg)]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 flex flex-col gap-10">
        {/* Hero — paradigm + 3-stage trajectory + fit check CTA */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-50 via-[var(--theme-surface)] to-rose-50 border border-[var(--panel-border)] px-8 py-12 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--theme-accent)]">
            <Sparkles className="w-4 h-4" />
            Self-Operating Business OS
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-[var(--theme-text)]" style={{ fontFamily: 'var(--theme-font-display)' }}>
            8 Domaines. 1 Coach Practice.
          </h1>
          <p className="mt-3 text-[var(--theme-text-muted)] max-w-2xl">
            PoC → SaaS → White Label. Built for premium US coaches ($500–$2,000/hr). US-hosted. CCPA + Colorado AI Act compliant.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {TRAJECTORY.map(t => (
              <span
                key={t.label}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-surface)] backdrop-blur border border-[var(--panel-border)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)]"
              >
                <span className="font-extrabold text-[var(--theme-accent)]">{t.label}</span>
                <span className="text-[var(--theme-text-muted)]">{t.caption}</span>
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {demoPage && (
              <button
                onClick={() => onSelect(demoPage.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)] text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-[var(--theme-accent-hover)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Take the 4-question fit check
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="#domaines"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-surface)] border border-[var(--panel-border)] text-[var(--theme-text)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--theme-surface-hover)] transition-all"
            >
              Browse the 8 Domaines
            </a>
            <span className="inline-flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
              <Compass className="w-3.5 h-3.5" />
              9 pages · 8 Domaines + Demo
            </span>
          </div>
        </section>

        {/* The 8 Domaines grid */}
        <section id="domaines" className="flex flex-col gap-4 scroll-mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">The 8 Domaines</h2>
            <span className="text-xs text-[var(--theme-text-dim)]">SOB Convergence · B2 leader per card</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {domainPages.map(p => {
              const Icon = PAGE_ICON[p.id] ?? Compass;
              const num = p.id.match(/domaine-(\d)/)?.[1] ?? '?';
              const leader = PAGE_LEADER[p.id] ?? '';
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="text-left rounded-2xl bg-[var(--theme-surface)] border border-[var(--panel-border)] shadow-sm p-5 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white shrink-0" style={{ background: ACCENT }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Domaine {num}</div>
                      <div className="text-sm font-bold text-[var(--theme-text)] truncate">{p.brand}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed line-clamp-2">{p.tagline}</p>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-dim)]">{leader}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--theme-text-dim)] group-hover:text-[var(--theme-accent)] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Demo CTA strip — kept as 9th entry, separate visual treatment */}
        {demoPage && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Not sure yet?</h2>
              <span className="text-xs text-[var(--theme-text-dim)]">Free · 4 minutes</span>
            </div>
            <button
              onClick={() => onSelect(demoPage.id)}
              className="text-left rounded-2xl bg-stone-900 text-white border border-stone-900 shadow-md p-6 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-5"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 text-amber-300 shrink-0">
                <Play className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Demo · Free</div>
                <div className="text-base font-bold mt-0.5">See the Coach OS in 4 questions.</div>
                <div className="text-xs text-white/60 mt-1">Zero-PII. Citadel preview. Audit log live.</div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70 shrink-0" />
            </button>
          </section>
        )}
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
      subtitle="Landing pages · 8 Domaines SOB Convergence"
      icon={Compass}
      accent={ACCENT}
      sections={sections}
    />
  );
}
