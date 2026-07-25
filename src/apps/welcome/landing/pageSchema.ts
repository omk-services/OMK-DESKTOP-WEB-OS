/** Circle.so-style landing page schema.
 *  Each landing page is a self-contained one-page experience:
 *  - Hero
 *  - Feature blocks (alternating image-left/image-right)
 *  - Testimonial carousel
 *  - Stats strip
 *  - Logos row
 *  - Pricing tiers
 *  - FAQ accordion
 *  - CTA + footer
 *
 *  Sections are rendered as semantic blocks; the Welcome app's Sidebar
 *  lets A+ switch between different landing pages (one per business domain)
 *  while the Header Menu (sticky in-page nav) jumps between sections of the
 *  active page — Circle.so style. */

export type FeatureBlock = {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  cta?: { label: string; href: string };
  visual: 'community' | 'courses' | 'events' | 'chat' | 'revenue' | 'agents';
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  metric?: { value: string; label: string };
};

export type Stat = { value: string; label: string };
export type Logo = { name: string; monogram: string };
export type FaqItem = { q: string; a: string };

export type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  pitch: string;
  features: string[];
  ctaLabel: string;
  highlight?: boolean;
};

export interface LandingPage {
  id: string;
  brand: string;
  domain: string;
  tagline: string;
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    rating?: { stars: number; count: string; sources: string[] };
  };
  trust?: { title: string; logos: Logo[] };
  features: FeatureBlock[];
  stats: Stat[];
  testimonials: Testimonial[];
  pricing: PricingTier[];
  faq: FaqItem[];
  closing: { headline: string; sub: string; cta: { label: string; href: string } };
}
