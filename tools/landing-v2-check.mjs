/**
 * tools/landing-v2-check.mjs — vérifie le site /landing/ multi-pages :
 *   1. cinq pages rendent sans erreur console (1280 + 375 px) ;
 *   2. la navigation haute permet d'atteindre chaque page et de revenir ;
 *   3. le contraste WCAG AA (>= 4.5:1) sur les combinaisons principales ;
 *   4. la page /demo : identifiants révélés au clic, "Ouvrir la démo" présent.
 *
 * Écrit pour la campagne 2026-08-11 (agent I — landing v2). Périmètre
 * coach-os/tools/ (n'est pas dans le périmètre exclusif de l'agent I
 * mais le brief autorise les outils de preuve ; cohabite avec
 * tools/landing-check.mjs de l'agent E).
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://localhost:5173';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/landing-v2-check.json';
const CAP = process.argv.find((a) => a.startsWith('--capture-dir='))?.slice('--capture-dir='.length)
  ?? '_briefs/2026-08-11_production/captures';

const PAGES = [
  { id: 'home',        path: '/landing/index.html',                theme: 'theme-glass'     },
  { id: 'diagnostic',  path: '/landing/diagnostic/index.html',     theme: 'theme-editorial' },
  { id: 'paliers',     path: '/landing/paliers/index.html',        theme: 'theme-bento'     },
  { id: 'engagements', path: '/landing/engagements/index.html',    theme: 'theme-neobrutal' },
  { id: 'demo',        path: '/landing/demo/index.html',           theme: 'theme-softui'    },
];

const VIEWPORTS = [
  { w: 1280, h: 900, suffix: '1280' },
  { w: 375,  h: 800, suffix: '375' },
];

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

mkdirSync(CAP, { recursive: true });

// ── 1. Captures + erreurs console par page/par viewport ──────────────────
const captures = [];
const consoleErrorsByPage = {};

for (const vp of VIEWPORTS) {
  const navigateur = await chromium.launch();
  for (const pageDef of PAGES) {
    const browser = await navigateur.newPage({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    const erreurs = [];
    browser.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    browser.on('pageerror', (e) => erreurs.push(String(e)));
    browser.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('favicon.ico')) return;
      erreurs.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
    });
    await browser.goto(`${BASE}${pageDef.path}`, { waitUntil: 'networkidle' });
    // Capture BOTH states for /demo : hidden (état initial) + revealed (après clic)
    if (pageDef.id === 'demo') {
      // Capture hidden state first
      const hiddenPath = path.join(CAP, `landing-v2-demo-${vp.suffix}-hidden.png`);
      await browser.screenshot({ path: hiddenPath, fullPage: true });
      captures.push({ page: 'demo', viewport: vp.suffix, file: hiddenPath, state: 'hidden' });
      // Then click and capture revealed state
      await browser.click('#creds-toggle');
    }
    const fullPath = path.join(CAP, `landing-v2-${pageDef.id}-${vp.suffix}.png`);
    await browser.screenshot({ path: fullPath, fullPage: true });
    captures.push({ page: pageDef.id, viewport: vp.suffix, file: fullPath });
    if (!consoleErrorsByPage[pageDef.id]) consoleErrorsByPage[pageDef.id] = [];
    consoleErrorsByPage[pageDef.id].push({ viewport: vp.suffix, count: erreurs.length, errors: erreurs });
    await browser.close();
  }
  await navigateur.close();
}

// ── 2. Contraste sur les combinaisons principales, par thème ──────────────
const navigateur = await chromium.launch();

const contrasteByPage = {};
for (const pageDef of PAGES) {
  const browser = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  await browser.goto(`${BASE}${pageDef.path}`, { waitUntil: 'networkidle' });

  const contraste = await browser.evaluate(() => {
    function parseColor(s) {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x.trim()));
      return { r, g, b, a };
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
    function alphaOver(base, fg) {
      const a = fg.a;
      return {
        r: Math.round(fg.r * a + base.r * (1 - a)),
        g: Math.round(fg.g * a + base.g * (1 - a)),
        b: Math.round(fg.b * a + base.b * (1 - a)),
      };
    }
    function effectiveBg(el) {
      let cur = el;
      while (cur) {
        const bg = parseColor(getComputedStyle(cur).backgroundColor);
        if (bg && bg.a >= 0.99) return { rgb: { r: bg.r, g: bg.g, b: bg.b }, label: cur.className || cur.tagName };
        cur = cur.parentElement;
      }
      return { rgb: { r: 244, g: 241, b: 234 }, label: 'fallback-canvas' };
    }
    const targets = [
      { sel: 'h1.hero__title', name: 'H1 hero' },
      { sel: 'h1.section__title', name: 'H1 section' },
      { sel: '.hero__subtitle', name: 'Hero subtitle' },
      { sel: '.section__intro', name: 'Section intro' },
      { sel: '.pain-card__body', name: 'Pain card body' },
      { sel: '.diag-cell__body', name: 'Diag cell body' },
      { sel: '.diag-coda__quote', name: 'Diag coda quote' },
      { sel: '.ladder-table td', name: 'Ladder cell body' },
      { sel: '.ladder-state--green', name: 'Ladder pill green' },
      { sel: '.ladder-state--amber', name: 'Ladder pill amber' },
      { sel: '.engage-card__body', name: 'Engage card body' },
      { sel: '.engage-card__title', name: 'Engage card title' },
      { sel: '.engage-card__mark', name: 'Engage card mark' },
      { sel: '.cta-card__body', name: 'CTA card body' },
      { sel: '.btn--primary', name: 'Primary button' },
      { sel: '.btn--secondary', name: 'Secondary button' },
      { sel: '.landing-footer', name: 'Footer' },
      { sel: '.demo-creds__list dt', name: 'Creds dt' },
      { sel: '.demo-creds__list dd', name: 'Creds dd' },
      { sel: '.demo-creds__warn', name: 'Creds warn' },
      { sel: '.demo-card__lead', name: 'Demo card lead' },
      { sel: '.demo-creds__reveal', name: 'Creds reveal btn' },
    ];
    return targets.map(({ sel, name }) => {
      const el = document.querySelector(sel);
      if (!el) return { name, sel, present: false };
      const fg = parseColor(getComputedStyle(el).color);
      const { rgb: bg, label: bgLabel } = effectiveBg(el);
      const r = ratio(fg, bg);
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
  });
  contrasteByPage[pageDef.id] = contraste;
  await browser.close();
}
await navigateur.close();

// ── 3. Navigation : depuis l'accueil, atteindre les 4 autres pages ──────
const navigateur2 = await chromium.launch();
const browser = await navigateur2.newPage({ viewport: { width: 1280, height: 900 } });
await browser.goto(`${BASE}/landing/index.html`, { waitUntil: 'networkidle' });

const nav = await browser.evaluate(() => {
  const links = Array.from(document.querySelectorAll('header.landing-top__nav a, .landing-footer a'));
  return links.map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute('href'),
    target: a.target || '',
  }));
});

const navTest = [];
for (const link of nav) {
  if (!link.href || link.href.startsWith('mailto:')) continue;
  const url = new URL(link.href, `${BASE}/landing/index.html`).toString();
  const b2 = await navigateur2.newPage();
  await b2.goto(url, { waitUntil: 'networkidle' });
  const back = await b2.evaluate(() => {
    const home = Array.from(document.querySelectorAll('a[href*="/landing/"]'))
      .find((a) => {
        const h = a.getAttribute('href') || '';
        return h === '/landing/' || h === '/landing' || h === '/landing/index.html';
      });
    return !!home;
  });
  navTest.push({ link: link.text, href: link.href, backToHome: back });
  await b2.close();
}

await browser.close();
await navigateur2.close();

// ── 4. Démo : identifiants révélés au clic ──────────────────────────────
const navigateur3 = await chromium.launch();
const browser3 = await navigateur3.newPage({ viewport: { width: 1280, height: 900 } });
await browser3.goto(`${BASE}/landing/demo/index.html`, { waitUntil: 'networkidle' });

const demoStateHidden = await browser3.evaluate(() => {
  const box = document.getElementById('creds');
  return {
    classes: box?.className ?? null,
    blurApplied: getComputedStyle(box ?? document.body).filter?.includes('blur') ?? false,
    btnLabel: document.getElementById('creds-toggle-label')?.textContent ?? null,
    btnExpanded: document.getElementById('creds-toggle')?.getAttribute('aria-expanded') ?? null,
  };
});

await browser3.click('#creds-toggle');

const demoStateRevealed = await browser3.evaluate(() => {
  const box = document.getElementById('creds');
  return {
    classes: box?.className ?? null,
    blurApplied: getComputedStyle(box ?? document.body).filter?.includes('blur') ?? false,
    btnLabel: document.getElementById('creds-toggle-label')?.textContent ?? null,
    btnExpanded: document.getElementById('creds-toggle')?.getAttribute('aria-expanded') ?? null,
  };
});

// ── Synthèse ─────────────────────────────────────────────────────────────
const failedContraste = {};
for (const [pageId, items] of Object.entries(contrasteByPage)) {
  failedContraste[pageId] = items.filter((c) => c.present && !c.aa);
}

const rapport = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  captures,
  consoleErrorsByPage,
  contrasteByPage,
  failedContraste,
  failedContrasteCount: Object.fromEntries(
    Object.entries(failedContraste).map(([k, v]) => [k, v.length])
  ),
  navigation: { links: nav, navTest },
  demoState: { hidden: demoStateHidden, revealed: demoStateRevealed },
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rapport, null, 2), 'utf8');

console.log(`Captures : ${captures.length}`);
for (const c of captures) console.log(`  ${c.page} (${c.viewport}) -> ${c.file}`);
const totalErrors = Object.values(consoleErrorsByPage).reduce(
  (acc, list) => acc + list.reduce((a, x) => a + x.count, 0), 0
);
console.log(`Erreurs console totales : ${totalErrors}`);
const totalContrast = Object.values(failedContraste).reduce((a, v) => a + v.length, 0);
console.log(`Contraste AA échoué : ${totalContrast}`);
console.log(`Navigation testée : ${navTest.length} liens, retour accueil OK = ${navTest.filter((n) => n.backToHome).length}`);
console.log(`Démo : hidden->revealed = ${demoStateHidden.btnLabel} (${demoStateHidden.btnExpanded}) -> ${demoStateRevealed.btnLabel} (${demoStateRevealed.btnExpanded})`);
console.log(`Rapport : ${OUT}`);

if (totalErrors || totalContrast) process.exit(1);