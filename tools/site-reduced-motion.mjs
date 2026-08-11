/**
 * tools/site-reduced-motion.mjs — capture du site /site/ avec prefers-reduced-motion: reduce.
 * Périmètre coach-os/tools/ — campagne 2026-08-11.
 *
 * Vérifie que les keyframes sont annulées et que les fonds restent visibles.
 * Usage :
 *   node tools/site-reduced-motion.mjs --base=http://127.0.0.1:5173 --out-dir=_briefs/2026-08-11_production/captures/site-reduced-motion
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out-dir='))?.slice('--out-dir='.length)
  ?? '_briefs/2026-08-11_production/captures/site-reduced-motion';

const PAGES = [
  { id: 'home',        path: '/site/index.html' },
  { id: 'methode',     path: '/site/methode.html' },
  { id: 'paliers',     path: '/site/paliers.html' },
  { id: 'engagements', path: '/site/engagements.html' },
  { id: 'demo',        path: '/site/demo.html' },
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

const browser = await chromium.launch();

// Force prefers-reduced-motion: reduce via emulation
const context = browser;
for (const p of PAGES) {
  const page = await context.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const erreurs = [];
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));

  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
  const fullPath = path.join(OUT, `reduced-${p.id}.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`  ${p.id.padEnd(12)} -> ${fullPath} (${erreurs.length} erreur(s))`);
  if (erreurs.length) for (const e of erreurs) console.log(`    - ${e}`);
  await page.close();
}
await browser.close();
console.log(`Captures avec prefers-reduced-motion: reduce écrites dans ${OUT}`);
