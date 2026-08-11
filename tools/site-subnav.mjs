/**
 * tools/site-subnav.mjs — vérifie le marquage de la sous-nav au défilement.
 * Périmètre coach-os/tools/ — campagne 2026-08-11.
 *
 * Fait défiler /paliers.html progressivement et s'attend à ce que la sous-nav
 * marque successivement chaque palier comme actif.
 */

import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const BASE = process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length)
  ?? 'http://127.0.0.1:5173';
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length)
  ?? '_verify_proofs/site-subnav.json';

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

// Test sur /methode qui a 3 sections distinctes (intro, grids, coda)
await page.goto(`${BASE}/site/methode.html`, { waitUntil: 'networkidle' });

// Récupère les positions Y des 3 sections réelles
const positions = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.site-subnav a')).map((a) => {
    const id = a.getAttribute('href').replace(/^#/, '');
    const target = document.getElementById(id);
    return { id, top: target ? target.getBoundingClientRect().top + window.scrollY : 0 };
  });
});

// Pour chaque section, scrolle jusqu'à sa position et lit la sous-nav active
const observations = [];
for (const p of positions) {
  await page.evaluate((y) => window.scrollTo(0, y - 100), p.top);
  await page.waitForTimeout(400);
  const active = await page.evaluate(() => {
    const cur = document.querySelector('.site-subnav a[aria-current="true"]');
    return cur?.textContent?.trim() ?? null;
  });
  observations.push({ scrolledTo: p.id, activeSubnav: active });
}

await browser.close();

const rapport = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  palierPositions: positions,
  observations,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rapport, null, 2), 'utf8');

console.log('Marquage sous-nav au défilement (/paliers) :');
for (const o of observations) {
  console.log(`  scroll vers ${o.scrolledTo.padEnd(12)} -> sous-nav active : ${o.activeSubnav}`);
}
console.log(`Rapport : ${OUT}`);
