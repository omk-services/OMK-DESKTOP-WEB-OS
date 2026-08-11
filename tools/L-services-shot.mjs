/**
 * L-services-shot.mjs — capture de l'overlay des services embarqués.
 *
 * Brief L §3 : l'Observatoire (port 8787) est mort. On marque le service
 * "hors service" sans tirer de fetch, donc :
 *   - la console reste propre (pas d'ERR_CONNECTION_REFUSED récurrent),
 *   - l'utilisateur voit un état explicite au lieu d'un timeout
 *     d'apparence aléatoire.
 *
 * Capture :
 *   services-overlay.png — l'overlay complet, 4 services, l'Observatoire
 *                          marqué "hors service" en rouge, sans fetch.
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

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
  console.error('playwright introuvable — installer dans ~/gauntlet-eyes');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5173');
const outDir = arg('out-dir', '_briefs/2026-08-11_production/captures/L_conformite_accueil');
const attente = Number(arg('wait', 1200));

mkdirSync(outDir, { recursive: true });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: Number(arg('w', 1440)), height: Number(arg('h', 900)) },
  deviceScaleFactor: 2,
});

const erreurs = [];
const requetes = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('request', (req) => {
  const url = req.url();
  // On filtre : on veut voir si :8787 est requête ou pas.
  if (url.includes('8787') || url.includes('observatoire')) {
    requetes.push(`${req.method()} ${url}`);
  }
});

await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => { try { localStorage.clear(); } catch { /* noop */ } });
await page.reload({ waitUntil: 'networkidle' });

await page.waitForSelector('[data-testid="auth-page"]', { timeout: 10000 });
await page.locator('[data-level="demo"]').click();
await page.waitForTimeout(400);
await page.locator('[data-testid="auth-sanctuary"] button:has-text("Ouvrir le bureau")').first().click();
await page.waitForTimeout(1200);

// Ouvrir l'app Onboarding (le launcher des services embarques y vit)
await page.evaluate(() => {
  const w = window.__coachos;
  if (!w?.shell) return;
  w.shell.getState().openApp('onboarding', 'Onboarding');
});
await page.waitForTimeout(800);

// Cliquer sur le bouton "Services embarques" — c'est le chip floating
const launcher = page.locator('[data-testid="embedded-services-launcher"]');
if (await launcher.count() > 0) {
  await launcher.click();
} else {
  await page.evaluate(() => {
    if (typeof window.openEmbeddedServices === 'function') {
      window.openEmbeddedServices();
    } else {
      window.dispatchEvent(new CustomEvent('coach-os:open-embedded-services'));
    }
  });
}
await page.waitForSelector('[data-testid="embedded-services-overlay"]', { timeout: 10000 });
await page.waitForTimeout(2500); // laisser le temps aux probes de finir

// Capture
const out = path.join(outDir, '06-embedded-services-observatoire-off.png');
await page.screenshot({ path: out });
console.log('capture : ' + out);

// Verifier que le service observatoire est marque hors service
const observatoireBadge = await page.locator('[data-testid="embedded-service-observatoire"]').textContent();
const observatoireHasHorsService = observatoireBadge && observatoireBadge.includes('hors service');
console.log(`observatoire badge = ${JSON.stringify(observatoireBadge?.slice(0, 60))}`);
console.log(`observatoire badge contient "hors service" = ${observatoireHasHorsService}`);

// Verifier que la sonde vers :8787 n'a PAS ete lancee
console.log(`requetes vers :8787 = ${requetes.length}`);
if (requetes.length > 0) {
  for (const r of requetes) console.log(`  ${r}`);
}

await navigateur.close();

if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 20)) console.log('  ' + e);
} else {
  console.log('\nzero erreur console.');
}