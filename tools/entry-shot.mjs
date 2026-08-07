/**
 * entry-shot.mjs — capture the entry animation at three timed checkpoints.
 *
 * The entry animation lives in the AssistantOverlay's local state and only
 * fires on the first mount. To re-trigger it cleanly we:
 *   1. open the page fresh
 *   2. clear the persisted assistant store so the overlay mounts with its
 *      default character and the entry latch is unset
 *   3. reload, then snap at t=0, t=1s, t=3s
 *
 * The first capture lands while Clippy's Greeting animation is still on
 * its empty frames (the character materialises from nothing), the second
 * during the appear phase, and the third after the character has settled
 * into idle.
 */
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

const base = arg('base', 'http://localhost:5174');
const outPrefix = arg('out', 'C:\\Users\\amado\\ASpace_OS_V3\\30_Business_OS\\09_Blueprints\\coach-os-refonte\\agent\\preuves\\agent-b\\entry');

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

// First load — wipe the persisted assistant state so the reload mounts the
// overlay with a fresh entry animation.
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  // Remove the assistant store entry, leave the rest alone.
  localStorage.removeItem('coach-os-assistant-v1');
});
await page.reload({ waitUntil: 'networkidle' });

// Snap at t=0 (character still materialising), t=1s (mid-greet), t=3s (settled).
await page.screenshot({ path: `${outPrefix}-t0.png` });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${outPrefix}-t1.png` });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outPrefix}-t3.png` });

await navigateur.close();
console.log(`captures : ${outPrefix}-t{0,1,3}.png`);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
