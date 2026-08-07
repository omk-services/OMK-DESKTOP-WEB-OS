/**
 * chat-shot.mjs — capture the bubble with a real response from /api/chat.
 *
 * Opens the page, opens the bubble, types a message, submits, and waits for
 * the streamed response to settle. Then snap.
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
const flag = (n) => args.includes('--' + n);

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
const out = arg('out', '/tmp/chat.png');
const message = arg('message', 'Combien ai-je de clients ?');
const mode = arg('mode', 'working'); // 'working' or 'error'
const character = arg('character', 'clippy');

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

// In "error" mode, intercept the chat endpoint so the fetch fails.
if (mode === 'error') {
  await page.route('**/api/chat', (route) => {
    route.abort('failed');
  });
}

// Set the character and open the bubble.
await page.evaluate(({ character }) => {
  const w = /** @type {any} */ (window).__coachos;
  if (!w?.assistant) return;
  w.assistant.getState().setCharacter(character);
  w.assistant.getState().setPosition(900, 480);
  w.assistant.getState().setBubbleOpen(true);
}, { character });

await page.waitForTimeout(800);

if (mode === 'working') {
  // Type the message and submit.
  await page.locator('[data-assistant-input]').fill(message);
  await page.locator('[data-assistant-input]').press('Enter');
  // Wait for the response — the model may take a tool call first, then
  // produce text. Generous timeout is intentional: the second round-trip
  // can take 4-6s with a small open-source model.
  await page.waitForTimeout(8000);
} else {
  // Error mode: the player needs to attempt to send so the fetch fails.
  await page.locator('[data-assistant-input]').fill(message);
  await page.locator('[data-assistant-input]').press('Enter');
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: out });
await navigateur.close();

console.log(`capture : ${out}`);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
