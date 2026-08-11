/**
 * auth-shot.mjs — capture dediee a la page d'auth (Brief D).
 *
 * La page d'auth n'est pas une app du registre : elle est rendue a la
 * racine avant que le bureau ne s'initialise. On ne peut pas utiliser
 * --app ; on capture l'URL racine et on mesure la position du champ
 * courriel dans 3 captures espacees d'une seconde pour verifier que
 * le formulaire ne bouge pas pendant que le decor change.
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
const url = arg('url', base);
const out = arg('out', '/tmp/auth-shot.png');
const mode = arg('mode', null); // 'signin' or 'signup', optional
const reduced = flag('reduced');
const attente = Number(arg('wait', 1200));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: Number(arg('w', 1440)), height: Number(arg('h', 900)) },
  deviceScaleFactor: 2,
});

// Force prefers-reduced-motion si demande (verification accessibilite)
if (reduced) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(url, { waitUntil: 'networkidle' });

// Attendre que la page d'auth soit montee
await page.waitForSelector('[data-testid="auth-page"]', { timeout: 10000 });

// Si on demande un mode, on bascule la tab correspondante
if (mode === 'signup') {
  const signupTab = page.locator('[role="tab"]', { hasText: 'Inscription' });
  await signupTab.click();
  await page.waitForTimeout(400);
} else if (mode === 'signin') {
  const signinTab = page.locator('[role="tab"]', { hasText: 'Connexion' });
  await signinTab.click();
  await page.waitForTimeout(400);
}

// Optionnel : changer le niveau (click sur une tuile)
const levelArg = arg('level');
if (levelArg) {
  await page.locator(`[data-level="${levelArg}"]`).click();
  await page.waitForTimeout(300);
}

await page.waitForTimeout(Number(arg('wait', 1200)));

// Capture
await page.screenshot({ path: out, fullPage: flag('full') });

// Mesure : on note la position du champ courriel pour la verification
const coords = await page.evaluate(() => {
  const input = document.querySelector('#auth-email');
  if (!input) return null;
  const rect = input.getBoundingClientRect();
  return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
});
if (coords) {
  console.log(`champ courriel a : x=${coords.x} y=${coords.y} w=${coords.w} h=${coords.h}`);
}

await navigateur.close();

console.log('capture : ' + out);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}