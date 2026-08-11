/* ────────────────────────────────────────────────────────────────────────────
   Methode — trois sections · Editorial / Swiss Modernism / Exaggerated Minimalism
   ──────────────────────────────────────────────────────────────────────────── */

import { PageShell } from '../chrome/PageShell';
import { SectionFrame } from '../chrome/SectionFrame';
import { METHODE } from '../content';

export default function Methode() {
  return (
    <PageShell active="methode" sections={METHODE.sections}>
      <SectionFrame id="intro" className="sec-methode-intro" effectId="none" effectClass="" ariaLabelledby="intro-title">
        <p className="site-eyebrow">{METHODE.intro.eyebrow}</p>
        <h1 className="site-h1" id="intro-title">{METHODE.intro.title}</h1>
        <p className="site-lead">{METHODE.intro.lead}</p>

        <div className="editorial-grid">
          <div className="editorial-grid__main">
            <div className="editorial-prose">
              {METHODE.intro.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          <aside className="editorial-grid__aside" aria-label="Méta">
            <p style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#0a0a0a' }}>{METHODE.intro.aside.sourceTitle}</strong>
            </p>
            <p>{METHODE.intro.aside.source}</p>
            <p style={{ marginTop: '1rem' }}>
              <strong style={{ color: '#0a0a0a' }}>{METHODE.intro.aside.adaptationTitle}</strong>
            </p>
            <p>{METHODE.intro.aside.adaptation}</p>
          </aside>
        </div>
      </SectionFrame>

      <SectionFrame id="grids" className="sec-grids" effectId="Grid" effectClass="fx-grid" ariaLabelledby="grids-title">
        <p className="site-eyebrow">{METHODE.grids.eyebrow}</p>
        <h2 className="site-h2" id="grids-title">{METHODE.grids.title}</h2>

        <div className="grids-list" role="list">
          {METHODE.grids.cells.map((c) => (
            <article className="grid-cell" role="listitem" key={c.idx}>
              <p className="grid-cell__index">{c.idx} / 06</p>
              <h3 className="grid-cell__label">{c.label}</h3>
              <p className="grid-cell__hint">{c.hint}</p>
              <p className="grid-cell__body">{c.body}</p>
            </article>
          ))}
        </div>
      </SectionFrame>

      <SectionFrame id="coda" className="sec-coda" effectId="none" effectClass="" ariaLabelledby="coda-title">
        <p className="site-eyebrow">{METHODE.coda.eyebrow}</p>
        <blockquote id="coda-title">{METHODE.coda.quote}</blockquote>
        <cite>{METHODE.coda.source}</cite>
      </SectionFrame>
    </PageShell>
  );
}
