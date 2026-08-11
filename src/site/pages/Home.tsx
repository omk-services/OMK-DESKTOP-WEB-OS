/* ────────────────────────────────────────────────────────────────────────────
   Home — trois sections · Exaggerated Minimalism / Brutalism / Bento Box
   ──────────────────────────────────────────────────────────────────────────── */

import { PageShell } from '../chrome/PageShell';
import { SectionFrame } from '../chrome/SectionFrame';
import { HOME } from '../content';

export default function Home() {
  return (
    <PageShell active="index" sections={HOME.hero.sections}>
      <SectionFrame id="hero" className="sec-hero" effectId="DecryptReveal" effectClass="fx-decrypt" ariaLabelledby="hero-title">
        <p className="site-eyebrow site-eyebrow--accent">{HOME.hero.eyebrow}</p>
        <h1 className="site-h1" id="hero-title">
          Le bureau qui tient votre méthode — pas <em>l'inverse</em>.
        </h1>
        <p className="site-lead">{HOME.hero.subtitle}</p>
        <p className="hero__trust">{HOME.hero.trust}</p>
      </SectionFrame>

      <SectionFrame id="pain" className="sec-pain" effectId="Liquid" effectClass="fx-liquid" ariaLabelledby="pain-title">
        <p className="site-eyebrow">{HOME.pain.eyebrow}</p>
        <h2 className="site-h2" id="pain-title">{HOME.pain.title}</h2>
        <p className="site-prose">{HOME.pain.intro}</p>

        <div className="pain-grid" role="list">
          {HOME.pain.items.map((item) => (
            <article className="pain-card" role="listitem" key={item.number}>
              <span className="pain-card__number" aria-hidden="true">{item.number}</span>
              <h3 className="pain-card__title">{item.title}</h3>
              <p className="pain-card__body">{item.body}</p>
              <p className="pain-card__source">Source — {item.source}</p>
            </article>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame id="cta" className="sec-cta" effectId="ParticleReveal" effectClass="fx-particle" ariaLabelledby="cta-title">
        <p className="site-eyebrow">{HOME.cta.eyebrow}</p>
        <h2 className="site-h2" id="cta-title">{HOME.cta.title}</h2>
        <p className="site-prose">{HOME.cta.intro}</p>

        <div className="cta-grid">
          <article className="cta-card cta-card--primary">
            <p className="cta-card__eyebrow">{HOME.cta.primary.eyebrow}</p>
            <h3 className="cta-card__title">{HOME.cta.primary.title}</h3>
            <p className="cta-card__body">{HOME.cta.primary.body}</p>
            <a className="site-btn" style={{ background: '#fff', color: '#0a0a0a' }} href={HOME.cta.primary.href}>
              {HOME.cta.primary.label}
              <span className="site-btn__arrow" aria-hidden="true">→</span>
            </a>
          </article>

          <article className="cta-card">
            <p className="cta-card__eyebrow">{HOME.cta.secondary.eyebrow}</p>
            <h3 className="cta-card__title">{HOME.cta.secondary.title}</h3>
            <p className="cta-card__body">{HOME.cta.secondary.body}</p>
            <a className="site-btn" style={{ background: '#0a0a0a', color: '#fff' }} href={HOME.cta.secondary.href}>
              {HOME.cta.secondary.label}
              <span className="site-btn__arrow" aria-hidden="true">→</span>
            </a>
            <p className="cta-card__note">{HOME.cta.secondary.note}</p>
          </article>
        </div>
      </SectionFrame>
    </PageShell>
  );
}
