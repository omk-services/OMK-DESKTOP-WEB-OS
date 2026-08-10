// verify-b-fleet-click.mjs — vérifie que le clic sur une carte de la Fleet
// ouvre bien la fiche riche PeopleDetailPage dans l'overlay.
// Usage : node tools/verify-b-fleet-click.mjs [--out <path>] [--theme <id>]
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i === -1 ? d : (args[i + 1] ?? true);
};

const CANDIDATS = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = CANDIDATS.find(existsSync);
if (!trouve) {
  console.error('playwright introuvable.');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5173');
const out = arg('out', '/tmp/b-fleet-detail.png');
const theme = arg('theme', 'glassmorphism');

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });

// Theme first
if (theme) {
  await page.evaluate((t) => {
    const brut = localStorage.getItem('coach-os-themes-v1');
    let d;
    try {
      d = brut ? JSON.parse(brut) : { state: {}, version: 0 };
    } catch {
      d = { state: {}, version: 0 };
    }
    d.state = { ...d.state, globalTheme: t };
    localStorage.setItem('coach-os-themes-v1', JSON.stringify(d));
  }, theme);
  await page.reload({ waitUntil: 'networkidle' });
}

// Open People app
await page.evaluate((id) => {
  const w = window.__coachos;
  w.shell.getState().openApp(id, id);
}, 'people');

await page.waitForTimeout(600);

// Go to Squads section
const cible = page.locator('[data-section="Squads"]');
const cnt = await cible.count();
if (cnt !== 1) {
  console.error(`Section "Squads" : count=${cnt} (attendu 1). Abandon.`);
  await navigateur.close();
  process.exit(4);
}
await cible.click();
await page.waitForTimeout(400);

// Click first Fleet card (the data-fleet-card attribute was added in this fix)
const card = page.locator('[data-fleet-card]').first();
const cardCount = await page.locator('[data-fleet-card]').count();
console.log(`cartes Fleet visibles : ${cardCount}`);
if (cardCount === 0) {
  console.error('Aucune carte Fleet avec data-fleet-card. Abandon.');
  await navigateur.close();
  process.exit(4);
}
const cardCode = await card.getAttribute('data-fleet-card');
console.log(`clic carte : ${cardCode}`);
await card.click();
await page.waitForTimeout(900);

// Detect overlay presence + PeopleDetailPage surface
const overlayCheck = await page.evaluate(() => {
  const w = window.__coachos;
  const state = w.shell.getState();
  // Look for the PeopleDetailPage-specific signature: a button with "Ping" or
  // a Dossier / Capabilities / Handoffs block in the overlay.
  const overlay = document.querySelector('[data-section="Squads"]')?.closest('div')?.parentElement;
  const body = document.body.innerText;
  const hasOverlay = body.includes('People · Agent Factory') || body.includes('Roster profile');
  const hasVitals = body.includes('Tasks today') && body.includes('Tokens burned');
  const hasLadder = body.includes('Lifecycle') && body.includes('IDLE');
  const hasDossier = body.includes('Dossier');
  const hasHandoffs = body.includes('Handoffs');
  const hasCapabilities = body.includes('Capabilities');
  const crumb = document.querySelector('[data-crumb-label], .text-xs')?.textContent;
  return {
    hasOverlay, hasVitals, hasLadder, hasDossier, hasHandoffs, hasCapabilities,
    breadcrumb: state.detail?.label ?? null,
  };
});

await page.screenshot({ path: out, fullPage: false });
await navigateur.close();

console.log(`capture : ${out}`);
console.log('overlay check:', JSON.stringify(overlayCheck, null, 2));
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
  process.exit(1);
}
process.exit(0);