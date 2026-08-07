/**
 * roster-shot.mjs — capture the desktop with N agents (multi-personnage overlay).
 *
 * Strategy : on laisse AssistantOverlay faire son travail (charger /api/agent/roster
 * au montage, hydrater le store), puis on drive le store pour ouvrir 3 bulles,
 * et on capture. Mesure la position de chaque tuile a differentes tailles de
 * cadre (1440x900, 1880x790, 1280x620) comme exige par le brief.
 *
 * Usage :
 *   node tools/roster-shot.mjs --base http://localhost:5176 --out ./roster.png
 *   node tools/roster-shot.mjs --base http://localhost:5176 --open 3 --out ./three.png
 *   node tools/roster-shot.mjs --base http://localhost:5176 --w 1880 --h 790 --out ./wide.png
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

const base = arg('base', 'http://localhost:5176');
const out = arg('out', '/tmp/roster.png');
const open = Number(arg('open', 3));
const wait = Number(arg('wait', 2200));

const w = Number(arg('w', 1440));
const h = Number(arg('h', 900));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });

// Attendre que le roster ait ete hydrate. On regarde `agentOrder.length`.
await page.waitForFunction(
  () => {
    const w = window.__coachos;
    return Boolean && w?.assistant?.getState()?.agentOrder?.length > 0;
  },
  { timeout: 10000 },
).catch(() => {});

// Ouvrir N bulles
const openCount = await page.evaluate((n) => {
  const w = window.__coachos;
  const s = w?.assistant?.getState();
  if (!s) return 0;
  const ids = s.agentOrder.slice(0, n);
  for (const id of ids) {
    s.toggleAgentBubble(id);
  }
  return ids.length;
}, open);

if (openCount === 0) {
  console.error("Le store assistant n'a pas d'agents. Le roster n'a pas pu etre charge.");
  console.error("Verifiez que /api/agent/roster repond bien sur " + base);
  await navigateur.close();
  process.exit(3);
}

await page.waitForTimeout(wait);

// Mesure : on capture les positions et tailles des tuiles.
const positions = await page.evaluate(() => {
  const w = window.__coachos;
  const s = w?.assistant?.getState();
  if (!s) return null;
  const out = [];
  for (const id of s.agentOrder) {
    const a = s.agents[id];
    if (!a) continue;
    out.push({
      id,
      name: a.name,
      personnageId: a.personnageId,
      backend: a.backend,
      position: a.position,
      bubbleOpen: a.bubbleOpen,
      available: a.backendAvailable,
    });
  }
  return out;
});

await page.screenshot({ path: out });
await navigateur.close();

console.log('capture : ' + out);
console.log('positions des agents (vue = ' + w + 'x' + h + ') :');
for (const p of positions ?? []) {
  console.log(`  ${p.id} (${p.personnageId}, dos=${p.backend}${p.available ? '' : ' indisponible'}) @ x=${p.position.x} y=${p.position.y}, bubble=${p.bubbleOpen ? 'open' : 'closed'}`);
}
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) — une page qui hurle n'est pas une page qui marche :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}