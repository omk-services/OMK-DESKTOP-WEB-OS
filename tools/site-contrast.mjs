/**
 * tools/site-contrast.mjs — vérifie le contraste WCAG AA du site /site/.
 * Périmètre coach-os/tools/ — campagne 2026-08-11.
 *
 * Usage :
 *   node tools/site-contrast.mjs --base=http://127.0.0.1:5173 --out=_verify_proofs/site-contrast.json
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/site-contrast.json';

const PAGES = [
  { id: 'home',        path: '/site/index.html',     theme: 'warm-paper' },
  { id: 'methode',     path: '/site/methode.html',   theme: 'editorial' },
  { id: 'paliers',     path: '/site/paliers.html',   theme: 'glassmorphism' },
  { id: 'engagements', path: '/site/engagements.html', theme: 'kinetic-brutalism' },
  { id: 'demo',        path: '/site/demo.html',      theme: 'interactive-demo' },
];

const SELECTORS_BY_PAGE = {
  home: [
    { sel: 'h1.site-h1',         name: 'Hero H1' },
    { sel: '.site-lead',         name: 'Hero subtitle' },
    { sel: '.hero__trust',       name: 'Hero trust' },
    { sel: '.pain-card__title',  name: 'Pain card title' },
    { sel: '.pain-card__body',   name: 'Pain card body' },
    { sel: '.pain-card__source', name: 'Pain card source' },
    { sel: '.cta-card__title',   name: 'CTA card title' },
    { sel: '.cta-card__body',    name: 'CTA card body' },
    { sel: '.site-footer',       name: 'Footer' },
  ],
  methode: [
    { sel: 'h1.site-h1',           name: 'Intro H1' },
    { sel: '.editorial-prose p',   name: 'Editorial prose' },
    { sel: '.editorial-grid__aside', name: 'Editorial aside' },
    { sel: '.grid-cell__label',    name: 'Grid label' },
    { sel: '.grid-cell__body',     name: 'Grid body' },
    { sel: 'blockquote',           name: 'Coda quote' },
    { sel: 'cite',                 name: 'Coda cite' },
  ],
  paliers: [
    { sel: 'h1.site-h1',         name: 'Paliers H1' },
    { sel: '.site-lead',         name: 'Paliers lead' },
    { sel: '.palier-card__title', name: 'Palier title' },
    { sel: '.palier-card__what', name: 'Palier what' },
    { sel: '.palier-card__where', name: 'Palier where' },
    { sel: '.paliers-footnote',  name: 'Footnote' },
  ],
  engagements: [
    { sel: 'h1.site-h2',         name: 'Engage H2' },
    { sel: '.engage-card__title', name: 'Engage title' },
    { sel: '.engage-card__body', name: 'Engage body' },
    { sel: '.engage-card:nth-child(2n) .engage-card__title', name: 'Engage title (inverted)' },
    { sel: '.engage-card:nth-child(2n) .engage-card__body',  name: 'Engage body (inverted)' },
  ],
  demo: [
    { sel: 'h1.site-h1',         name: 'Demo howto H1' },
    { sel: '.demo-step__title',  name: 'Step title' },
    { sel: '.demo-step__body',   name: 'Step body' },
    { sel: '.creds-block dt',    name: 'Creds dt' },
    { sel: '.creds-block dd',    name: 'Creds dd' },
    { sel: '.nodata-list li',    name: 'Nodata li' },
  ],
};

const CANDIDATS = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = CANDIDATS.find(existsSync);
if (!trouve) {
  console.error('playwright introuvable');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const browser = await chromium.launch();

const contrasteByPage = {};
const failedByPage = {};

for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });

  const result = await page.evaluate((sels) => {
    function parseColor(s) {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x.trim()));
      return { r, g, b, a };
    }
    function alphaOver(base, fg) {
      return {
        r: Math.round(fg.r * fg.a + base.r * (1 - fg.a)),
        g: Math.round(fg.g * fg.a + base.g * (1 - fg.a)),
        b: Math.round(fg.b * fg.a + base.b * (1 - fg.a)),
      };
    }
    function luminance({ r, g, b }) {
      const lin = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }
    function ratio(fg, bg) {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (hi + 0.05) / (lo + 0.05);
    }
    function effectiveBg(el) {
      let cur = el;
      while (cur) {
        const cs = getComputedStyle(cur);
        const bg = parseColor(cs.backgroundColor);
        // Cas 1 : fond uni opaque
        if (bg && bg.a >= 0.99) {
          return { rgb: { r: bg.r, g: bg.g, b: bg.b }, label: cur.className || cur.tagName };
        }
        // Cas 2 : gradient — on prend une couleur médiane de la liste de stops
        if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
          const colors = cs.backgroundImage.match(/rgb\([^)]+\)|#[0-9a-f]{3,6}/gi) || [];
          if (colors.length) {
            const mid = colors[Math.floor(colors.length / 2)];
            const parsed = mid.startsWith('#') ? hexToRgb(mid) : parseColor(mid);
            if (parsed) return { rgb: { r: parsed.r, g: parsed.g, b: parsed.b }, label: `gradient of ${cur.className || cur.tagName}` };
          }
        }
        cur = cur.parentElement;
      }
      return { rgb: { r: 250, g: 250, b: 247 }, label: 'fallback' };
    }

    function hexToRgb(h) {
      let s = h.replace('#', '');
      if (s.length === 3) s = s.split('').map((c) => c + c).join('');
      return {
        r: parseInt(s.slice(0, 2), 16),
        g: parseInt(s.slice(2, 4), 16),
        b: parseInt(s.slice(4, 6), 16),
        a: 1,
      };
    }

    return sels.map(({ sel, name }) => {
      const el = document.querySelector(sel);
      if (!el) return { name, sel, present: false };
      const fg = parseColor(getComputedStyle(el).color);
      const { rgb: bg, label: bgLabel } = effectiveBg(el);
      const composed = fg.a < 1 ? alphaOver(bg, fg) : fg;
      const r = ratio(composed, bg);
      return {
        name, sel,
        present: true,
        fg: `rgb(${fg.r},${fg.g},${fg.b})`,
        bg: `rgb(${bg.r},${bg.g},${bg.b}) (${bgLabel})`,
        ratio: Math.round(r * 100) / 100,
        aa: r >= 4.5,
        aaa: r >= 7,
      };
    });
  }, SELECTORS_BY_PAGE[p.id]);

  contrasteByPage[p.id] = result;
  failedByPage[p.id] = result.filter((c) => c.present && !c.aa).length;
  await page.close();
}

await browser.close();

const total = Object.values(failedByPage).reduce((a, v) => a + v, 0);
const rapport = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  contrasteByPage,
  failedByPage,
  totalFailed: total,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rapport, null, 2), 'utf8');

console.log('Contraste WCAG AA par page :');
for (const [k, v] of Object.entries(failedByPage)) {
  console.log(`  ${k.padEnd(12)} ${v === 0 ? 'OK' : v + ' échec(s)'}`);
}
console.log(`Total : ${total} échec(s)`);
console.log(`Rapport : ${OUT}`);

if (total > 0) {
  console.log('\nDétail des échecs :');
  for (const [pageId, items] of Object.entries(contrasteByPage)) {
    const failed = items.filter((c) => c.present && !c.aa);
    for (const c of failed) {
      console.log(`  ${pageId} · ${c.name} (${c.sel}) : ratio ${c.ratio} — fg ${c.fg} / bg ${c.bg}`);
    }
  }
  process.exit(1);
}
