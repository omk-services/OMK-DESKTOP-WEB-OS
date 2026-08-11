/* ────────────────────────────────────────────────────────────────────────────
   Engagements · Brutalism · Shatter
   ──────────────────────────────────────────────────────────────────────────── */

import { PageShell } from '../chrome/PageShell';
import { SectionFrame } from '../chrome/SectionFrame';
import { ENGAGEMENTS } from '../content';

export default function Engagements() {
  return (
    <PageShell active="engagements" sections={ENGAGEMENTS.sections}>
      <SectionFrame id="engagements" className="sec-engagements" effectId="Shatter" effectClass="fx-shatter" ariaLabelledby="engage-title">
        <p className="site-eyebrow" style={{ color: '#000' }}>{ENGAGEMENTS.eyebrow}</p>
        <h1 className="site-h2" id="engage-title">{ENGAGEMENTS.title}</h1>
        <p className="site-prose" style={{ maxWidth: '55ch', fontSize: '1.0625rem' }}>
          {ENGAGEMENTS.intro}
        </p>

        <div className="engage-grid" role="list">
          {ENGAGEMENTS.items.map((item) => (
            <article key={item.idx} id={`refus-${item.idx}`} className="engage-card" role="listitem">
              <span className="engage-card__mark">Refus n°{item.idx}</span>
              <h2 className="engage-card__title">{item.title}</h2>
              <p className="engage-card__body">{item.body}</p>
              <p className="engage-card__source">{item.test}</p>
            </article>
          ))}
        </div>
      </SectionFrame>
    </PageShell>
  );
}
