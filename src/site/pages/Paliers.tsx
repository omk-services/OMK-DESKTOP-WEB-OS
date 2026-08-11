/* ────────────────────────────────────────────────────────────────────────────
   Paliers · Glassmorphism · Glass
   ──────────────────────────────────────────────────────────────────────────── */

import { PageShell } from '../chrome/PageShell';
import { SectionFrame } from '../chrome/SectionFrame';
import { PALIERS } from '../content';

export default function Paliers() {
  return (
    <PageShell active="paliers" sections={PALIERS.sections}>
      <SectionFrame id="ladder" className="sec-paliers" effectId="Glass" effectClass="fx-glass-overlay" ariaLabelledby="ladder-title">
        <p className="site-eyebrow">{PALIERS.eyebrow}</p>
        <h1 className="site-h1" id="ladder-title">{PALIERS.title}</h1>
        <p className="site-lead" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {PALIERS.lead}
        </p>

        <div className="paliers-grid">
          {PALIERS.stages.map((s) => (
            <article key={s.idx} id={`palier-${s.idx}`} className="palier-card">
              <p className="palier-card__index">Palier n°{s.idx}</p>
              <h2 className="palier-card__title">{s.name}</h2>
              <p className={`palier-card__state palier-card__state--${s.state}`}>{s.stateLabel}</p>
              <p className="palier-card__what">{s.what}</p>
              <p className="palier-card__where">{s.where}</p>
            </article>
          ))}
        </div>

        <p className="paliers-footnote">{PALIERS.footnote}</p>
      </SectionFrame>
    </PageShell>
  );
}
