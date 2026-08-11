/**
 * auth-validation-shot.mjs — capture une erreur de validation.
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
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5174');
const out = arg('out', '/tmp/auth-validation.png');

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="auth-page"]', { timeout: 10000 });
await page.waitForTimeout(800);

// Remplir un courriel invalide + un mot de passe trop court, puis soumettre
await page.fill('#auth-email', 'pas-une-adresse');
await page.fill('#auth-pwd', 'court');
await page.click('button[type="submit"]');
await page.waitForTimeout(600);

await page.screenshot({ path: out, fullPage: false });
console.log('capture : ' + out);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
await navigateur.close();