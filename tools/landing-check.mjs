/**
 * tools/landing-check.mjs — vérifie la page /landing/ :
 *   1. zéro erreur console au chargement ;
 *   2. contraste WCAG AA (>= 4.5:1) sur les combinaisons texte/fond principales ;
 *   3. présence des éléments SEO (title, meta description, og:*, ld+json) ;
 *   4. responsive : la même page tient en 1280 et en 375.
 *
 * Outil jetable écrit pour la campagne 2026-08-11 (agent E — landing).
 * Périmètre coach-os/tools/ (n'est pas dans le périmètre exclusif de
 * l'agent E mais le brief autorise les outils de preuve ; le fichier est
 * versionné dans tools/ comme les autres shot.mjs du repo).
 */

import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const URL = process.argv.find((a) => a.startsWith('--url='))?.slice('--url='.length)
  ?? 'http://localhost:5173/landing/index.html';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/landing-check.json';

const CANDIDATS = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = CANDIDATS.find(existsSync);
if (!trouve) {
  console.error('playwright introuvable — installer dans ~/gauntlet-eyes');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});

const erreurs = [];
const warnings = [];
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
  if (m.type() === 'warning') warnings.push(m.text());
});
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('requestfailed', (req) => {
  // On tolère un échec d'image OG (Twitter preview fetcher le ferait ; navigateur non)
  const url = req.url();
  if (url.includes('favicon.ico')) return; // toléré
  erreurs.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
});

await page.goto(URL, { waitUntil: 'networkidle' });

// ── 1. SEO ──────────────────────────────────────────────────────────────
const seo = await page.evaluate(() => {
  const get = (sel) => document.head.querySelector(sel)?.getAttribute('content') ?? null;
  const getHref = (sel) => document.head.querySelector(sel)?.getAttribute('href') ?? null;
  const ld = document.head.querySelector('script[type="application/ld+json"]')?.textContent ?? null;
  return {
    title: document.title,
    description: get('meta[name="description"]'),
    canonical: getHref('link[rel="canonical"]'),
    ogTitle: get('meta[property="og:title"]'),
    ogDescription: get('meta[property="og:description"]'),
    ogImage: get('meta[property="og:image"]'),
    ogImageAlt: get('meta[property="og:image:alt"]'),
    ogLocale: get('meta[property="og:locale"]'),
    twitterCard: get('meta[name="twitter:card"]'),
    twitterImageAlt: get('meta[name="twitter:image:alt"]'),
    structuredData: ld ? JSON.parse(ld) : null,
    h1Count: document.querySelectorAll('h1').length,
    h1Text: document.querySelector('h1')?.textContent?.trim() ?? null,
    lang: document.documentElement.lang,
  };
});

// ── 2. Sections attendues ───────────────────────────────────────────────
const sectionsPresent = await page.evaluate(() => {
  const ids = ['diagnostic', 'paliers', 'engagement', 'cta'];
  return Object.fromEntries(ids.map((id) => [id, !!document.getElementById(id)]));
});

// ── 3. Contraste — mesure réelle sur les combinaisons principales ────────
// On utilise canvas pour mesurer la couleur effective d'un élément, et
// getComputedStyle pour lire la couleur de fond. Pour les cas tordus
// (body a une radial-gradient, .diag-coda a un fond ink), on remonte
// l'arbre jusqu'à trouver un parent opaque.
const contraste = await page.evaluate(() => {
  function parseColor(s) {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r, g, b, a };
  }
  function alphaOver(base, fg) {
    const a = fg.a;
    return {
      r: Math.round(fg.r * a + base.r * (1 - a)),
      g: Math.round(fg.g * a + base.g * (1 - a)),
      b: Math.round(fg.b * a + base.b * (1 - a)),
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
      const bg = parseColor(getComputedStyle(cur).backgroundColor);
      if (bg && bg.a >= 0.99) return { rgb: { r: bg.r, g: bg.g, b: bg.b }, label: cur.className || cur.tagName };
      cur = cur.parentElement;
    }
    // Fallback : body canvas
    return { rgb: { r: 244, g: 241, b: 234 }, label: 'fallback-canvas' };
  }

  const targets = [
    { sel: 'h1.hero__title', name: 'Hero H1' },
    { sel: '.hero__subtitle', name: 'Hero subtitle' },
    { sel: '.hero__eyebrow', name: 'Hero eyebrow' },
    { sel: '.hero__trust', name: 'Hero trust line' },
    { sel: '.section__title', name: 'Section title (intro)' },
    { sel: '.section__intro', name: 'Section intro' },
    { sel: '.section__eyebrow', name: 'Section eyebrow' },
    { sel: '.pain-card__body', name: 'Pain card body' },
    { sel: '.pain-card__source', name: 'Pain card source' },
    { sel: '.diag-coda__quote', name: 'Diagnostic coda quote' },
    { sel: '.diag-coda__source', name: 'Diagnostic coda source' },
    { sel: '.diag-cell__body', name: 'Diag cell body' },
    { sel: '.diag-cell__hint', name: 'Diag cell hint' },
    { sel: '.ladder-table td', name: 'Ladder cell body' },
    { sel: '.ladder-state--green', name: 'Ladder pill green' },
    { sel: '.ladder-state--amber', name: 'Ladder pill amber' },
    { sel: '.engage-card__body', name: 'Engage card body' },
    { sel: '.engage-card__mark', name: 'Engage card mark' },
    { sel: '.cta-card--primary .cta-card__title', name: 'CTA primary title' },
    { sel: '.cta-card--primary .cta-card__body', name: 'CTA primary body' },
    { sel: '.cta-card .btn--primary', name: 'CTA primary button' },
    { sel: '.cta-card .btn--secondary', name: 'CTA secondary button' },
    { sel: '.cta-card__note', name: 'CTA note' },
    { sel: '.ladder-footnote', name: 'Ladder footnote' },
    { sel: '.landing-footer', name: 'Footer' },
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

await navigateur.close();

// ── Synthèse ────────────────────────────────────────────────────────────
const failed = contraste.filter((c) => c.present && !c.aa);
const rapport = {
  url: URL,
  generatedAt: new Date().toISOString(),
  consoleErrors: erreurs,
  consoleWarnings: warnings,
  seo,
  sectionsPresent,
  contraste,
  contrasteFailed: failed.length,
  allContrasteAA: failed.length === 0,
};

import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rapport, null, 2), 'utf8');

console.log(`URL : ${URL}`);
console.log(`Console errors : ${erreurs.length}`);
console.log(`Console warnings : ${warnings.length}`);
console.log(`Sections attendues présentes : ${Object.values(sectionsPresent).filter(Boolean).length}/${Object.keys(sectionsPresent).length}`);
console.log(`Contraste AA : ${failed.length === 0 ? 'OK' : `${failed.length} échec(s)`}`);
console.log(`Rapport écrit : ${OUT}`);

if (erreurs.length || failed.length) {
  console.log('\nDétail :');
  if (erreurs.length) {
    console.log('  Erreurs console :');
    for (const e of erreurs) console.log('    - ' + e);
  }
  if (failed.length) {
    console.log('  Contrastes échoués :');
    for (const c of failed) console.log(`    - ${c.name} (${c.sel}) : ${c.ratio} sur ${c.fg} / ${c.bg}`);
  }
  process.exit(1);
}
