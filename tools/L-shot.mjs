/**
 * L-shot.mjs — captures pour le brief L (conformité & accueil).
 *
 * Étapes capturées (en 5 PNG) :
 *   1. welcome-card.png : la carte d'invitation au premier lancement,
 *      sur le VRAI bureau (post-authentification démo).
 *   2. tour-step-1.png : après clic sur « Faire le tour », la bulle
 *      pointe sur la barre du haut (étape 1 du tour g-first-open).
 *   3. tour-step-2-with-bubble.png : après avoir avancé d'une étape,
 *      la bulle pointe sur les icônes du bureau.
 *   4. tour-with-dragged-window.png : la fenêtre cible a été déplacée
 *      via window.__coachos.shell, et la bulle a suivi (preuve que le
 *      moteur tourne au niveau du shell).
 *   5. reload-no-invitation.png : après reload de la page, l'invitation
 *      ne revient pas (la persistance fonctionne).
 *
 * Le script logge aussi les erreurs console pour chaque capture — un
 * cadre qui hurle n'est pas un cadre qui marche.
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
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

async function shot(name) {
  await page.waitForTimeout(attente);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file });
  console.log('capture : ' + file);
}

// ─── Etape 0 : vider localStorage et charger la page d'auth ───
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch { /* best-effort */ }
});
await page.reload({ waitUntil: 'networkidle' });

// Attendre la page d'auth
await page.waitForSelector('[data-testid="auth-page"]', { timeout: 10000 });

// ─── Etape 1 : choisir la branche demo ───
await page.locator('[data-level="demo"]').click();
await page.waitForTimeout(400);
// La branche demo affiche DemoEntryCard avec un bouton "Ouvrir le bureau".
// On cible un bouton a l'interieur du sanctuaire d'auth qui dit exactement ca.
const demoBtn = page.locator('[data-testid="auth-sanctuary"] button:has-text("Ouvrir le bureau")').first();
await demoBtn.click();
await page.waitForTimeout(800);

// Attendre le bureau
await page.waitForSelector('[data-testid="first-run-invitation"]', { timeout: 10000 });
await shot('01-welcome-card.png');

// ─── Etape 2 : cliquer "Faire le tour" — étape 1 (topbar) ───
await page.locator('[data-testid="first-run-start"]').click();
await page.waitForTimeout(900);
await page.waitForSelector('[data-testid="tour-overlay"]', { timeout: 5000 });
await shot('02-tour-step-1-topbar.png');

// ─── Etape 3 : avancer d'une etape (Suivant) ───
const next = page.locator('[data-testid="tour-overlay"] button:has-text("Suivant"), [data-testid="tour-overlay"] button:has-text("Next")').first();
await next.click();
await page.waitForTimeout(800);
await shot('03-tour-step-2-desktop-icons.png');

// ─── Etape 4 : deplacer la fenetre ciblee, verifier que la bulle suit ───
// On ouvre l'app Clients, on deplace sa fenetre, et on regarde la bulle
// (a l'etape 4 du tour, "first-app" / "window-controls").
await page.evaluate(() => {
  const w = window.__coachos;
  if (!w?.shell) {
    if (typeof console !== 'undefined') console.warn('window.__coachos absent');
    return;
  }
  // Ouvrir Clients
  w.shell.getState().openApp('clients', 'Clients');
  // Avancer le tour jusqu'a l'etape qui pointe sur la fenetre Clients.
  // L'etape 4 (window-controls) utilise windowId='clients' + anchor='right'.
  const t = w.tour?.getState?.();
  if (t && typeof t.next === 'function') {
    // 2 next() depuis l'etape desktop-icons pour atteindre "first-app" puis "window-controls"
    // On en fait 2 pour atterir sur "window-controls"
  }
});
await page.waitForTimeout(300);
// Avancer le tour via les boutons jusqu'a l'etape "first-app" / "window-controls"
const nextBtn = page.locator('[data-testid="tour-overlay"] button:has-text("Suivant")').first();
await nextBtn.click(); // open-drawer -> first-app
await page.waitForTimeout(400);
// A l'etape first-app, il faut cliquer "Ouvrir Clients" — l'action du step
const actionBtn = page.locator('[data-testid="tour-overlay"] button:has-text("Ouvrir Clients")').first();
if (await actionBtn.count()) {
  await actionBtn.click();
}
await page.waitForTimeout(600);
await nextBtn.click(); // first-app -> window-controls
await page.waitForTimeout(600);

// Maintenant la fenetre Clients existe dans le shell store. On la deplace.
await page.evaluate(() => {
  const w = window.__coachos;
  if (!w?.shell) return;
  const s = w.shell.getState();
  const win = s.windows.find((x) => x.id === 'clients');
  if (!win) return;
  s.updateWindowState('clients', { x: 700, y: 240 }, { width: 460, height: 380 });
});
await page.waitForTimeout(400);
await shot('04-tour-bubble-follows-dragged-window.png');

// ─── Etape 5 : Echap interrompt ───
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const overlayAfterEscape = await page.locator('[data-testid="tour-overlay"]').count();
console.log(`apres Echap : tour-overlay present = ${overlayAfterEscape > 0}`);

// ─── Etape 6 : reload — l'invitation ne revient pas ───
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const invitationAfterReload = await page.locator('[data-testid="first-run-invitation"]').count();
const overlayAfterReload = await page.locator('[data-testid="tour-overlay"]').count();
const tourStatus = await page.evaluate(() => {
  // zustand stores don't expose on window by default, but FirstRunInvitation
  // checks localStorage which is the canonical persistence. We can read it.
  return {
    welcomeDismissed: window.localStorage.getItem('coach-os:welcome-card:dismissed:v1'),
    tourFired: window.localStorage.getItem('coach-os:tour-v2-fired:g-first-open'),
  };
});
console.log(`apres reload : first-run-invitation present = ${invitationAfterReload > 0}`);
console.log(`apres reload : tour-overlay present = ${overlayAfterReload > 0}`);
console.log(`apres reload : localStorage = ${JSON.stringify(tourStatus)}`);
await shot('05-reload-no-invitation.png');

await navigateur.close();

if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 20)) console.log('  ' + e);
} else {
  console.log('\nzero erreur console.');
}