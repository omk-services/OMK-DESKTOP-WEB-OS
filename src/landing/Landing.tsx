/* ────────────────────────────────────────────────────────────────────────────
   Coach OS — landing React component (v2, multi-page)

   Le composant est resté inutilisé : la version statique de
   public/landing/* est ce qui sert en production (campagne 2026-08-11,
   agent I). Ce fichier continue d'exporter les sections en pièces
   détachées (TopBar, Hero, Pain, Diagnostic, Ladder, Engagement, CTA,
   Footer) pour rester un miroir de la version statique — voir
   GARDE_FOU.md pour le périmètre exclusif.

   Le composant <Landing /> ci-dessous rend la page d'accueil (hero +
   pain + CTA) et fournit les liens vers les autres pages. Si
   l'application sert un jour /landing/ depuis le shell, il suffira de
   monter <Landing /> et de gérer le reste par fichier.
   ──────────────────────────────────────────────────────────────────────────── */

import { useEffect } from 'react';
import {
  SITE,
  HERO,
  PAIN,
  DIAGNOSTIC,
  LADDER,
  ENGAGEMENT,
  CTA as CTA_DATA,
  STRUCTURED_DATA,
  NAV_ORDER,
} from './content';

export default function Landing() {
  // Pose les <meta> SEO et les données structurées quand la page est montée
  // depuis le shell d'application. La version statique (public/landing/
  // index.html) les pose nativement dans le <head>.
  useEffect(() => {
    document.title = `${SITE.name} — ${HERO.title}`;
    const set = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    set('description', SITE.description);
    set('og:title', `${SITE.name} — ${HERO.title}`);
    set('og:description', SITE.description);
    set('og:type', 'website');
    set('og:url', SITE.url);
    set('og:locale', SITE.locale);
    set('og:image', `${SITE.url}/landing/og-image.svg`);
    set('twitter:card', 'summary_large_image');

    const json = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [STRUCTURED_DATA.organization, STRUCTURED_DATA.product],
    });
    let ld = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-landing]');
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.setAttribute('data-landing', '');
      document.head.appendChild(ld);
    }
    ld.textContent = json;
  }, []);

  // Le shell peut poser une classe sur <body> pour activer un thème.
  // Le composant Landing par défaut ne pose pas de thème (registre
  // Glassmorphism) ; pour les autres pages, le shell posera
  // body.theme-editorial / theme-bento / theme-neobrutal / theme-softui.
  useEffect(() => {
    document.body.classList.add('theme-glass');
    return () => { document.body.classList.remove('theme-glass'); };
  }, []);

  return (
    <main className="landing-shell" lang="fr">
      <TopBar active="home" />
      <Hero />
      <Pain />
      <PageNext prev={null} next={{ href: '/landing/diagnostic/index.html', label: 'Comment on diagnostique avant l\'outil' }} />
      <CTA />
      <Footer />
    </main>
  );
}

// ── Composants partagés (réutilisables par page) ──────────────────────────

export function TopBar({ active }: { active?: string }) {
  const items = NAV_ORDER.filter((n) => n.id !== 'home');
  return (
    <header className="landing-top" role="banner">
      <a className="landing-top__brand" href="/landing/index.html" aria-label={SITE.name}>
        <span className="landing-top__brand-mark" aria-hidden="true">C</span>
        <span>Coach <em>OS</em></span>
      </a>
      <nav className="landing-top__nav" aria-label="Pages du site">
        {items.map((n) => (
          <a
            key={n.id}
            href={n.href}
            aria-current={n.id === active ? 'page' : undefined}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export function Breadcrumb({ here }: { here: string }) {
  return (
    <nav className="landing-crumbs" aria-label="Fil d'Ariane">
      <a href="/landing/index.html">Accueil</a>
      <span className="landing-crumbs__sep" aria-hidden="true">›</span>
      <span className="landing-crumbs__here">{here}</span>
    </nav>
  );
}

export function PageNext({ prev, next }: { prev: { href: string; label: string } | null; next: { href: string; label: string } | null }) {
  return (
    <nav className="page-next" aria-label="Suite">
      {prev ? (
        <a href={prev.href} style={{ fontSize: 14, color: 'var(--landing-text-muted)', fontFamily: 'var(--landing-sans)', fontWeight: 600 }}>
          ← {prev.label}
        </a>
      ) : (
        <span className="page-next__all">Sections : Diagnostic · Paliers · Engagements</span>
      )}
      {next && (
        <a href={next.href}>
          {next.label}
          <span className="page-next__arrow" aria-hidden="true">→</span>
        </a>
      )}
    </nav>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <p className="hero__eyebrow">{HERO.eyebrow}</p>
      <h1 className="hero__title" id="hero-title">
        Le bureau qui tient votre méthode — pas <em>l'inverse</em>.
      </h1>
      <p className="hero__subtitle">{HERO.subtitle}</p>
      <div className="hero__cta">
        <a className="btn btn--primary" href={HERO.ctaPrimary.href}>
          {HERO.ctaPrimary.label}
          <span className="btn__arrow" aria-hidden="true">→</span>
        </a>
        <a className="btn btn--secondary" href={HERO.ctaSecondary.href}>
          {HERO.ctaSecondary.label}
        </a>
      </div>
      <p className="hero__trust">{HERO.trustLine}</p>
      <hr className="hero__rule" />
    </section>
  );
}

export function Pain() {
  return (
    <section className="section" aria-labelledby="pain-title">
      <p className="section__eyebrow">Le problème</p>
      <h2 className="section__title" id="pain-title">{PAIN.title}</h2>
      <p className="section__intro">{PAIN.intro}</p>
      <div className="pain-grid">
        {PAIN.items.map((item) => (
          <article className="pain-card" key={item.number}>
            <span className="pain-card__number" aria-hidden="true">{item.number}</span>
            <h3 className="pain-card__title">{item.title}</h3>
            <p className="pain-card__body">{item.body}</p>
            <p className="pain-card__source">Source : {item.source}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Diagnostic() {
  return (
    <section className="section" id="diagnostic" aria-labelledby="diag-title">
      <p className="section__eyebrow">Le mécanisme</p>
      <h2 className="section__title" id="diag-title">{DIAGNOSTIC.title}</h2>
      <p className="section__intro">{DIAGNOSTIC.intro}</p>

      <div className="diag-coda">
        <p className="diag-coda__label">Principe directeur</p>
        <blockquote className="diag-coda__quote">
          Une entreprise n'a pas un problème d'IA. Elle a des tâches qui coûtent
          cher et dont personne ne parle. L'IA n'est que la <em>réponse éventuelle</em>.
        </blockquote>
        <p className="diag-coda__source">Source : {DIAGNOSTIC.codaSource}</p>
      </div>

      <div className="diag-grid">
        {DIAGNOSTIC.grids.map((g) => (
          <article className="diag-cell" key={g.label}>
            <h3 className="diag-cell__label">{g.label}</h3>
            <span className="diag-cell__hint">{g.hint}</span>
            <p className="diag-cell__body">{g.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Ladder() {
  return (
    <section className="section" id="paliers" aria-labelledby="ladder-title">
      <p className="section__eyebrow">L'offre</p>
      <h2 className="section__title" id="ladder-title">{LADDER.title}</h2>
      <p className="section__intro">{LADDER.intro}</p>

      <table className="ladder-table">
        <thead>
          <tr>
            <th scope="col">Palier</th>
            <th scope="col">État</th>
            <th scope="col">Ce que vous obtenez</th>
            <th scope="col">Où vivent vos données</th>
          </tr>
        </thead>
        <tbody>
          {LADDER.stages.map((s) => (
            <tr key={s.name}>
              <td data-label="Palier">{s.name}</td>
              <td data-label="État">
                <span className={`ladder-state ladder-state--${s.color}`}>
                  <span className="ladder-state__dot" aria-hidden="true" />
                  {s.state}
                </span>
              </td>
              <td data-label="Ce que vous obtenez">{s.what}</td>
              <td data-label="Où vivent vos données">{s.where}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="ladder-footnote">{LADDER.footnote}</p>
    </section>
  );
}

export function Engagement() {
  return (
    <section className="section" id="engagement" aria-labelledby="engage-title">
      <p className="section__eyebrow">Les objections</p>
      <h2 className="section__title" id="engage-title">{ENGAGEMENT.title}</h2>
      <p className="section__intro">{ENGAGEMENT.intro}</p>
      <div className="engage-grid">
        {ENGAGEMENT.items.map((item, i) => (
          <article className="engage-card" key={item.title}>
            <span className="engage-card__mark">Engagement n°{String(i + 1).padStart(2, '0')}</span>
            <h3 className="engage-card__title">{item.title}</h3>
            <p className="engage-card__body">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="section" id="cta" aria-labelledby="cta-title">
      <p className="section__eyebrow">L'appel à l'action</p>
      <h2 className="section__title" id="cta-title">{CTA_DATA.title}</h2>
      <p className="section__intro">{CTA_DATA.intro}</p>

      <div className="cta-grid">
        <article className="cta-card cta-card--primary">
          <h3 className="cta-card__title">{CTA_DATA.primary.label}</h3>
          <p className="cta-card__body">{CTA_DATA.primary.body}</p>
          <a className="btn btn--primary" href={CTA_DATA.primary.href}>
            Réserver
            <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
        </article>

        <article className="cta-card">
          <h3 className="cta-card__title">{CTA_DATA.secondary.label}</h3>
          <p className="cta-card__body">{CTA_DATA.secondary.body}</p>
          <a className="btn btn--secondary" href={CTA_DATA.secondary.href}>
            Ouvrir la démo
            <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
          <p className="cta-card__note">{CTA_DATA.secondary.note}</p>
        </article>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="landing-footer">
      <span>Coach OS — pour coach qui facture 500 à 2000 $/h</span>
      <span>
        <a href="/landing/diagnostic/index.html">Diagnostic</a>
        {' · '}
        <a href="/landing/paliers/index.html">Paliers</a>
        {' · '}
        <a href="/landing/engagements/index.html">Engagements</a>
        {' · '}
        <a href="/landing/demo/index.html">Démo</a>
        {' · '}
        <a href="/">Application</a>
      </span>
    </footer>
  );
}