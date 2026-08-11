/* ────────────────────────────────────────────────────────────────────────────
   Demo · Interactive Product Demo / Terminal CLI / Editorial (pas d'effet)
   ──────────────────────────────────────────────────────────────────────────── */

import { Fragment } from 'react';
import { PageShell } from '../chrome/PageShell';
import { SectionFrame } from '../chrome/SectionFrame';
import { DEMO } from '../content';

export default function Demo() {
  return (
    <PageShell active="demo" sections={DEMO.sections}>
      <SectionFrame id="howto" className="sec-demo-howto" effectId="ParticleReveal" effectClass="fx-particle" ariaLabelledby="howto-title">
        <p className="site-eyebrow site-eyebrow--accent">{DEMO.howto.eyebrow}</p>
        <h1 className="site-h1" id="howto-title">{DEMO.howto.title}</h1>
        <p className="site-lead">{DEMO.howto.lead}</p>

        <div className="demo-steps" role="list">
          {DEMO.howto.steps.map((step, i) => (
            <article key={i} className="demo-step" role="listitem">
              <h2 className="demo-step__title">{step.title}</h2>
              <p className="demo-step__body">{step.body}</p>
              {step.code && <p className="demo-step__code"><code>{step.code}</code></p>}
            </article>
          ))}
        </div>

        <p style={{ marginTop: '3rem' }}>
          <a className="site-btn" style={{ background: '#0a0a0a', color: '#fff' }} href="https://omk-desktop-web-os.vercel.app">
            {DEMO.howto.ctaLabel}
            <span className="site-btn__arrow" aria-hidden="true">→</span>
          </a>
        </p>
      </SectionFrame>

      <SectionFrame id="creds" className="sec-demo-creds" effectId="GlyphRain" effectClass="fx-glyph-rain" ariaLabelledby="creds-title">
        <p className="site-eyebrow">{DEMO.creds.eyebrow}</p>
        <h2 className="site-h2" id="creds-title">{DEMO.creds.title}</h2>
        <p className="site-lead">{DEMO.creds.lead}</p>

        <div className="creds-block">
          <dl>
            {DEMO.creds.rows.map((r) => (
              <Fragment key={r.key}>
                <dt>{r.key}</dt>
                <dd><code>{r.val}</code></dd>
              </Fragment>
            ))}
          </dl>
          <p className="creds-warn">
            {DEMO.creds.warn}
            <span className="creds-cursor" aria-hidden="true"></span>
          </p>
        </div>

        <div className="creds-statusbar" aria-hidden="true">
          <span>[ BATTERY: 88% ]</span>
          <span>[ NET: CONNECTED ]</span>
          <span>[ TENANT: demo ]</span>
        </div>
      </SectionFrame>

      <SectionFrame id="nodata" className="sec-demo-nodata" effectId="none" effectClass="" ariaLabelledby="nodata-title">
        <p className="site-eyebrow site-eyebrow--accent">{DEMO.nodata.eyebrow}</p>
        <h2 className="site-h2" id="nodata-title">{DEMO.nodata.title}</h2>
        <p className="site-prose">{DEMO.nodata.intro}</p>

        <ul className="nodata-list">
          {DEMO.nodata.items.map((item, i) => (
            <li key={i}>
              <strong>{item.lead}</strong> {item.body}
            </li>
          ))}
        </ul>
      </SectionFrame>
    </PageShell>
  );
}
