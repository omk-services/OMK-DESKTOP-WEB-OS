/**
 * tools/site-shot.mjs — capture du site /site/ multi-pages (campagne 2026-08-11).
 *
 * Périmètre coach-os/tools/ — cohabite avec landing-check.mjs, landing-v2-check.mjs.
 * Usage :
 *   node tools/site-shot.mjs --base=http://127.0.0.1:5173 --out-dir=_briefs/2026-08-11_production/captures/site
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out-dir='))?.slice('--out-dir='.length)
  ?? '_briefs/2026-08-11_production/captures/site';

const PAGES = [
  { id: 'home',        path: '/site/index.html' },
  { id: 'methode',     path: '/site/methode.html' },
  { id: 'paliers',     path: '/site/paliers.html' },
  { id: 'engagements', path: '/site/engagements.html' },
  { id: 'demo',        path: '/site/demo.html' },
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

mkdirSync(OUT, { recursive: true });

const summary = [];

for (const vp of VIEWPORTS) {
  const browser = await chromium.launch();
  for (const p of PAGES) {
    const page = await browser.newPage({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    const erreurs = [];
    page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    page.on('pageerror', (e) => erreurs.push(String(e)));
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('favicon.ico')) return;
      erreurs.push(`requestfailed ${url} : ${req.failure()?.errorText}`);
    });

    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    const fullPath = path.join(OUT, `site-${p.id}-${vp.suffix}.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    summary.push({ page: p.id, viewport: vp.suffix, file: fullPath, consoleErrors: erreurs.length, errors: erreurs.slice(0, 5) });
    await page.close();
  }
  await browser.close();
}

console.log('Captures écrites :');
for (const s of summary) {
  console.log(`  ${s.page.padEnd(12)} ${s.viewport.padEnd(5)} ${s.file}  (${s.consoleErrors} erreur(s) console)`);
}
const totalErrors = summary.reduce((acc, s) => acc + s.consoleErrors, 0);
if (totalErrors > 0) {
  console.log(`\nDétail des erreurs console :`);
  for (const s of summary) {
    if (s.errors.length) {
      console.log(`  ${s.page}/${s.viewport}:`);
      for (const e of s.errors) console.log(`    - ${e}`);
    }
  }
  process.exit(1);
}
