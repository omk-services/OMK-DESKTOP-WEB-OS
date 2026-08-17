/**
 * diag-legal.mjs — diagnostic cible de Legal > Conformite.
 *
 * L'utilisateur confirme que c'est la SEULE section qui casse. Ce script va
 * la chercher et rapporte l'erreur exacte, avec sa pile.
 *
 * Deux lecons du balayage precedent sont appliquees ici :
 *  - le bureau PERSISTE ses fenetres ouvertes dans localStorage : recharger
 *    les restaure, et elles couvrent les icones. On purge donc le stockage
 *    avant de commencer ;
 *  - `Escape` ne ferme pas une fenetre.
 *
 * Usage : node tools/diag-legal.mjs [--base <url>] [--app Legal] [--section Conformite]
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i === -1 ? d : args[i + 1]; };

const BASE = arg('base', 'https://omk-desktop-web-os.vercel.app');
const APP = arg('app', 'Legal');

const cand = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = cand.find((p) => existsSync(p));
if (!trouve) { console.error('playwright introuvable'); process.exit(3); }
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const nav = await chromium.launch({ headless: true });
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const erreurs = [];
page.on('pageerror', (e) => erreurs.push({ type: 'pageerror', msg: e.message, stack: (e.stack || '').slice(0, 1200) }));
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push({ type: 'console', msg: m.text().slice(0, 1200) });
});

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

// Purge : sinon une fenetre laissee ouverte par une session precedente
// couvre les icones et rend l'app inatteignable.
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* rien */ } });
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);

const clic = async (t, ms = 6000) => {
  const c = page.getByText(t, { exact: true }).first();
  await c.waitFor({ state: 'visible', timeout: ms });
  await c.click();
};

try { await clic('Decouvrir sans compte'); await page.waitForTimeout(500); await clic('Ouvrir le bureau'); } catch { /* deja dedans */ }
await page.waitForTimeout(2000);
try { await page.getByRole('button', { name: 'Plus tard' }).click({ timeout: 2500 }); } catch { /* pas de visite */ }
await page.waitForTimeout(500);

const motif = new RegExp(`^${APP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
await page.locator('[role="button"]', { hasText: motif }).first().dblclick({ timeout: 10000 });
await page.waitForTimeout(2000);

const sections = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-section]')).map((e) => e.getAttribute('data-section')),
);
console.error(`[diag] app "${APP}" ouverte — ${sections.length} sections : ${sections.join(' · ')}`);

const casses = [];
for (const s of sections) {
  erreurs.length = 0;
  try {
    await page.locator(`[data-section="${s}"]`).first().click({ timeout: 5000 });
    await page.waitForTimeout(900);
    const snag = await page.evaluate(() => document.body.innerText.includes('hit a snag'));
    if (snag) {
      casses.push({ section: s, erreurs: [...erreurs] });
      console.error(`\n[diag] ✗ SECTION CASSEE : "${s}"`);
      for (const e of erreurs) {
        console.error(`   ${e.type} : ${e.msg}`);
        if (e.stack) console.error(`   pile :\n${e.stack.split('\n').slice(0, 8).map((l) => '     ' + l).join('\n')}`);
      }
      // La frontiere d'erreur a remplace le contenu : on rouvre l'app propre
      // pour continuer le balayage des sections suivantes.
      await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      try { await page.getByRole('button', { name: 'Plus tard' }).click({ timeout: 1500 }); } catch { /* rien */ }
      await page.locator('[role="button"]', { hasText: motif }).first().dblclick({ timeout: 10000 });
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.error(`[diag] clic impossible sur "${s}" : ${String(e).slice(0, 120)}`);
  }
}

console.error('');
console.error(`[diag] ${casses.length} section(s) cassee(s) sur ${sections.length} dans "${APP}"`);
if (casses.length) console.error(`[diag] ${casses.map((c) => c.section).join(', ')}`);

await nav.close();
process.exit(casses.length ? 1 : 0);
