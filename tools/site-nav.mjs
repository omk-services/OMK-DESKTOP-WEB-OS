/**
 * tools/site-nav.mjs — vérifie la navigation deux étages du site /site/.
 * Périmètre coach-os/tools/ — campagne 2026-08-11.
 *
 *  1. depuis l'accueil, atteindre les 4 autres pages via l'en-tête ;
 *  2. sur /paliers, cliquer la sous-nav pour passer d'un palier à un autre ;
 *  3. marquer la section active au défilement (sous-nav).
 *
 * Usage :
 *   node tools/site-nav.mjs --base=http://127.0.0.1:5173 --out=_verify_proofs/site-nav.json
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/site-nav.json';

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

// ── Test 1 : en-tête multipage depuis l'accueil ──────────────────────────

const context = browser;
const page = await context.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${BASE}/site/index.html`, { waitUntil: 'networkidle' });

const headerLinks = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.site-top__nav a')).map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute('href'),
  }));
});

const visited = [];
for (const link of headerLinks) {
  if (!link.href || link.href.startsWith('mailto:')) continue;
  await page.goto(`${BASE}${link.href}`, { waitUntil: 'networkidle' });
  const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? null);
  const active = await page.evaluate(() => {
    const cur = document.querySelector('.site-top__nav a[aria-current="page"]');
    return cur?.textContent?.trim() ?? null;
  });
  visited.push({ from: link.text, href: link.href, h1, active });
}

await page.close();

// ── Test 2 : sous-nav /paliers ────────────────────────────────────────────

const page2 = await context.newPage({ viewport: { width: 1280, height: 900 } });
await page2.goto(`${BASE}/site/paliers.html`, { waitUntil: 'networkidle' });

const subnavLinks = await page2.evaluate(() => {
  return Array.from(document.querySelectorAll('.site-subnav a')).map((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute('href'),
  }));
});

const subnavVisits = [];
for (const link of subnavLinks) {
  if (!link.href?.startsWith('#')) continue;
  await page2.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, link.href);
  await page2.waitForTimeout(300);
  const active = await page2.evaluate(() => {
    const cur = document.querySelector('.site-subnav a[aria-current="true"]');
    return cur?.textContent?.trim() ?? null;
  });
  const visibleHash = await page2.evaluate(() => window.location.hash);
  subnavVisits.push({ link: link.text, hash: link.href, scrolled: visibleHash, activeSubnav: active });
}

await page2.close();
await browser.close();

const rapport = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  headerNavigation: { links: headerLinks, visited },
  subnavNavigation: { links: subnavLinks, subnavVisits },
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rapport, null, 2), 'utf8');

console.log('Navigation multipage (en-tête) :');
for (const v of visited) console.log(`  ${v.from.padEnd(12)} -> ${v.href.padEnd(28)} (h1: ${v.h1?.slice(0, 40)}…)  active: ${v.active}`);
console.log('\nSous-nav /paliers :');
for (const v of subnavVisits) console.log(`  ${v.link.padEnd(18)} hash=${v.hash.padEnd(12)} subnav-actif=${v.activeSubnav}`);
console.log(`\nRapport : ${OUT}`);
