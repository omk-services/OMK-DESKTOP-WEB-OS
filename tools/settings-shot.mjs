/**
 * settings-shot.mjs — capture the Settings → Assistant panel.
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
const out = arg('out', '/tmp/settings.png');
const character = arg('character', 'peedy');

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });

// Pick the character so the active preview is something interesting.
await page.evaluate(({ character }) => {
  const w = /** @type {any} */ (window).__coachos;
  if (!w?.assistant) return;
  w.assistant.getState().setCharacter(character);
}, { character });

// Open Settings via the shell handle, then click the Assistant section.
const ok = await page.evaluate(() => {
  const w = /** @type {any} */ (window).__coachos;
  if (!w?.shell) return 'absent';
  w.shell.getState().openApp('settings', 'Settings');
  return 'ok';
});
if (ok === 'absent') {
  console.error('window.__coachos.shell absent');
  await navigateur.close();
  process.exit(3);
}

await page.waitForTimeout(600);
const assistantSection = page.locator('[data-section="Assistant"]');
const count = await assistantSection.count();
if (count === 0) {
  console.error('section "Assistant" not found in sidebar');
  await navigateur.close();
  process.exit(4);
}
await assistantSection.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await navigateur.close();

console.log(`capture : ${out}`);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
