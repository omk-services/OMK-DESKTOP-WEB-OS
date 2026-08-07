/**
 * assist-shot.mjs — capture the desktop assistant with a chosen character.
 *
 * The DEV-only `window.__coachos.assistant` handle lets us drive the store
 * from a Playwright script without going through the UI. We:
 *   1. open the base page
 *   2. set the character id + open the bubble
 *   3. wait a tick so the sprite engine can fetch agent.json
 *   4. screenshot
 *
 * Usage:
 *   node tools/assist-shot.mjs --character merlin --out ./merlin.png
 *   node tools/assist-shot.mjs --character rover --bubble --out ./rover-bubble.png
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
  console.error('playwright introuvable. Installer :');
  console.error('  mkdir -p ~/gauntlet-eyes && cd ~/gauntlet-eyes && npm i playwright');
  console.error('  npx playwright install chromium');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5174');
const out = arg('out', '/tmp/assist.png');
const character = arg('character', 'clippy');
const wantBubble = flag('bubble');
const x = Number(arg('x', 1180));
const y = Number(arg('y', 700));
const wait = Number(arg('wait', 1500));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: Number(arg('w', 1440)), height: Number(arg('h', 900)) },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });

// Drive the assistant store from the page side.
const ok = await page.evaluate(({ character, bubble, x, y }) => {
  const w = window.__coachos;
  if (!w?.assistant) return 'absent';
  const s = w.assistant.getState();
  s.setCharacter(character);
  s.setPosition(x, y);
  if (bubble) s.setBubbleOpen(true);
  return 'ok';
}, { character, bubble: wantBubble, x, y });
if (ok === 'absent') {
  console.error("window.__coachos.assistant absent : le serveur tourne-t-il en DEV,");
  console.error('la page a-t-elle recharge depuis la modification de assistant.store.ts ?');
  await navigateur.close();
  process.exit(3);
}

// Wait for the sprite to materialize (manifast fetch + first frame).
await page.waitForTimeout(wait);
await page.screenshot({ path: out });
await navigateur.close();

console.log('capture : ' + out);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) — une page qui hurle n'est pas une page qui marche :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
