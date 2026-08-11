/**
 * tools/site-diversite.mjs — vérifie la diversité du site /site/.
 * Périmètre coach-os/tools/ — campagne 2026-08-11 (agent K).
 *
 * Mesures (parcours l'ensemble des 5 pages après défilement complet) :
 *   · nombre de polices distinctes        (seuil >= 4)
 *   · nombre de fonds distincts           (seuil >= 6)
 *   · nombre de rayons d'angle distincts  (seuil >= 4)
 *   · nombre d'éléments <canvas> montés  (seuil >= 4)
 *   · erreurs console (par page, total)   (seuil == 0)
 *   · temps de rendu utile par page       (seuil < 2500 ms)
 *
 * Sortie : code 0 si tous les seuils sont atteints.
 *          code 1 si un seuil échoue (détail imprimé).
 *          code 2 si playwright introuvable (détail imprimé).
 *
 * Usage :
 *   node tools/site-diversite.mjs --base=http://127.0.0.1:5173 \
 *                                --out=_verify_proofs/site-diversite.json
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/site-diversite.json';

const PAGES = [
  { id: 'home',        path: '/site/index.html' },
  { id: 'methode',     path: '/site/methode.html' },
  { id: 'paliers',     path: '/site/paliers.html' },
  { id: 'engagements', path: '/site/engagements.html' },
  { id: 'demo',        path: '/site/demo.html' },
];

const SEUILS = {
  fonts:   { min: 4,  label: 'polices distinctes (>= 4)' },
  bgColors: { min: 6,  label: 'fonds distincts (>= 6)' },
  radii:   { min: 4,  label: 'rayons d\'angle distincts (>= 4)' },
  canvases:{ min: 4,  label: 'éléments <canvas> montés (>= 4)' },
  errors:  { max: 0,  label: 'erreurs console total (== 0)' },
  renderMs:{ max: 2500, label: 'temps de rendu utile par page (< 2500 ms)' },
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const fonts = new Set();
const bgColors = new Set();
const radii = new Set();
const shadows = new Set();
const borders = new Set();
let totalCanvas = 0;
const errorsByPage = {};
const renderMsByPage = {};
const pageReports = {};

for (const p of PAGES) {
  const consoleErrors = [];
  const requestErrors = [];
  const handler = (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); };
  const reqHandler = (req) => {
    const url = req.url();
    if (url.endsWith('/favicon.ico')) return;
    requestErrors.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
  };
  const errHandler = (e) => consoleErrors.push(`pageerror ${e}`);
  page.on('console', handler);
  page.on('requestfailed', reqHandler);
  page.on('pageerror', errHandler);

  const t0 = Date.now();
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(700);
  const renderMs = Date.now() - t0;

  const counts = await page.evaluate(() => {
    const seen = { fonts: new Set(), bgs: new Set(), radii: new Set(), shadows: new Set(), borders: new Set() };
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const cs = getComputedStyle(el);
      if (cs.fontFamily) seen.fonts.add(cs.fontFamily);
      if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') seen.bgs.add(cs.backgroundColor);
      if (cs.borderTopLeftRadius && cs.borderTopLeftRadius !== '0px') seen.radii.add(cs.borderTopLeftRadius);
      if (cs.boxShadow && cs.boxShadow !== 'none') seen.shadows.add(cs.boxShadow);
      if (cs.borderTopStyle !== 'none' && cs.borderTopWidth !== '0px') {
        seen.borders.add(`${cs.borderTopWidth}|${cs.borderTopStyle}|${cs.borderTopColor}`);
      }
    }
    return {
      fonts: Array.from(seen.fonts),
      bgs: Array.from(seen.bgs),
      radii: Array.from(seen.radii),
      shadows: Array.from(seen.shadows),
      borders: Array.from(seen.borders),
      canvas: document.querySelectorAll('canvas').length,
      dataFx: document.querySelectorAll('[data-fx]').length,
    };
  });

  for (const f of counts.fonts) fonts.add(f);
  for (const b of counts.bgs) bgColors.add(b);
  for (const r of counts.radii) radii.add(r);
  for (const s of counts.shadows) shadows.add(s);
  for (const bd of counts.borders) borders.add(bd);
  totalCanvas += counts.canvas;

  errorsByPage[p.id] = { console: consoleErrors, request: requestErrors, total: consoleErrors.length + requestErrors.length };
  renderMsByPage[p.id] = renderMs;
  pageReports[p.id] = {
    fonts: counts.fonts,
    bgs: counts.bgs,
    radii: counts.radii,
    canvasMounted: counts.canvas,
    dataFxTargets: counts.dataFx,
    renderMs,
    errors: errorsByPage[p.id],
  };

  page.off('console', handler);
  page.off('requestfailed', reqHandler);
  page.off('pageerror', errHandler);
}

await browser.close();

const totalErrors = Object.values(errorsByPage).reduce((acc, e) => acc + e.total, 0);

const result = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  seuils: SEUILS,
  totals: {
    distinctFonts: fonts.size,
    distinctBgColors: bgColors.size,
    distinctRadii: radii.size,
    distinctShadows: shadows.size,
    distinctBorders: borders.size,
    canvasesMounted: totalCanvas,
    totalErrors,
    renderMsByPage,
  },
  pages: pageReports,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');

console.log('\nDiversité mesurée — site /site/ — base ' + BASE);
console.log('  Polices distinctes          : ' + fonts.size + '   (>= ' + SEUILS.fonts.min + ')');
console.log('  Fonds distincts             : ' + bgColors.size + '  (>= ' + SEUILS.bgColors.min + ')');
console.log('  Rayons d\'angle distincts    : ' + radii.size + '   (>= ' + SEUILS.radii.min + ')');
console.log('  <canvas> montés (total)     : ' + totalCanvas + '   (>= ' + SEUILS.canvases.min + ')');
console.log('  Erreurs console (total)     : ' + totalErrors + '   (== ' + SEUILS.errors.max + ')');
console.log('\n  Rendement par page :');
for (const [k, v] of Object.entries(renderMsByPage)) {
  const ok = v < SEUILS.renderMs.max;
  console.log('    ' + k.padEnd(12) + v + ' ms' + (ok ? '' : '  ⚠'));
}

const verdicts = {
  fonts:    fonts.size >= SEUILS.fonts.min,
  bgColors: bgColors.size >= SEUILS.bgColors.min,
  radii:    radii.size >= SEUILS.radii.min,
  canvases: totalCanvas >= SEUILS.canvases.min,
  errors:   totalErrors === SEUILS.errors.max,
  render:   Object.values(renderMsByPage).every((v) => v < SEUILS.renderMs.max),
};

console.log('\nVerdict par seuil :');
for (const [k, ok] of Object.entries(verdicts)) {
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + k);
}

const failed = Object.entries(verdicts).filter(([, ok]) => !ok).map(([k]) => k);
if (failed.length) {
  console.log('\nSeuils ratés : ' + failed.join(', '));
  console.log('Rapport : ' + OUT);
  process.exit(1);
}
console.log('\nTous les seuils sont atteints.');
console.log('Rapport : ' + OUT);