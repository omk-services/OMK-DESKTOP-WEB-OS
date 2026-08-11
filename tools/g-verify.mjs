/** g-verify.mjs — proof-of-completion captures for brief G (onboarding + embedded services).
 *
 *  Captures:
 *    01-launchers.png         — onboarding + embedded-services floating buttons visible
 *    02-tours-panel.png       — tours panel open, 3 tours listed
 *    03-tour-1-step-1.png     — premiere ouverture, step 1 (topbar)
 *    04-tour-1-step-4.png     — premiere ouverture, step 4 (open clients)
 *    05-cas-elimine.png       — DRAG clients window mid-tour; bubble must follow OR close cleanly
 *    06-tour-1-step-5.png     — premiere ouverture, step 5 (window controls)
 *    07-tour-2-step-1.png     — premier agent, step 1 (open people)
 *    08-tour-2-step-4.png     — premier agent, step 4 (approvals)
 *    09-tour-3-step-1.png     — premiere donnee, step 1 (open clients)
 *    10-tour-3-step-3.png     — premiere donnee, step 3 (form)
 *    11-services-overlay.png  — embedded services overlay open
 *    12-service-agentgateway.png — agentgateway frame (loaded OK)
 *    13-service-observatoire.png — observatoire frame (DOWN error)
 *    14-service-langsmith.png    — langsmith frame (external hint)
 *    15-console-errors.txt    — list of console errors during the whole run (must be empty)
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

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

const BASE = 'http://localhost:5173';
const OUTDIR = '_briefs/2026-08-11_production/captures/G_onboarding';
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${String(e)}`));

const captures = [];

async function shot(name, opts = {}) {
  const file = path.join(OUTDIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.full ?? false });
  captures.push(file);
  console.log(`captured: ${file}`);
}

async function clickByText(re, opts = {}) {
  const text = re.source.replace(/^\^|\$$/g, '');
  const loc = page.locator('button').filter({ hasText: re }).first();
  await loc.click(opts);
  await page.waitForTimeout(opts.delay ?? 200);
}

async function clickTestId(id, opts = {}) {
  const loc = page.locator(`[data-testid="${id}"]`).first();
  await loc.click(opts);
  await page.waitForTimeout(opts.delay ?? 200);
}

async function nextTour() {
  // Resilient: if the bubble already auto-advanced (target lost), the
  // button is gone. Just return.
  const loc = page.locator('button').filter({ hasText: /Suivant/i }).first();
  try {
    if (await loc.count() === 0) return;
    await loc.click({ timeout: 2000 });
    await page.waitForTimeout(200);
  } catch {
    // bubble already advanced or finished
  }
}
async function finishTour() {
  // Resilient: the tour may have already auto-finished if the last step's
  // target disappeared. Just attempt the click; if the button is gone,
  // the tour is already done.
  const loc = page.locator('button').filter({ hasText: /Terminer/i }).first();
  try {
    if (await loc.count() > 0) {
      await loc.click({ timeout: 2000 });
    }
  } catch {
    // already finished
  }
  await page.waitForTimeout(200);
}

// ─── 0. Pass through the auth gate ─────────────────────────────────────────
console.log('\n[00] Pass through auth — pick Decouvrir / Ouvrir le bureau');
await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Pick the "Decouvrir" level option. The level selector renders buttons;
// one of them corresponds to "Decouvrir". Find by text content.
const decouvrirBtn = page.locator('button').filter({ hasText: /Découvrir|Decouvrir/i }).first();
if (await decouvrirBtn.count() > 0) {
  await decouvrirBtn.click();
  await page.waitForTimeout(400);
}
// Click "Ouvrir le bureau" to enter the demo
const enterBtn = page.locator('button').filter({ hasText: /^Ouvrir le bureau$/i }).first();
if (await enterBtn.count() > 0) {
  await enterBtn.click();
  await page.waitForTimeout(1500);
}
await shot('00-auth-done');

// ─── 1. Floating launchers visible ─────────────────────────────────────────
console.log('\n[01] Floating launchers visible');
await page.waitForTimeout(800);
await shot('01-launchers');

// ─── 2. Open the tours panel ──────────────────────────────────────────────
console.log('\n[02] Open tours panel');
await clickTestId('onboarding-tours-launcher');
await page.waitForTimeout(500);
await shot('02-tours-panel');

// ─── 3. Tour 1 — premiere ouverture — step 1 ─────────────────────────────
console.log('\n[03] Tour 1, step 1');
await clickTestId('onboarding-tour-g-first-open');
// peelCitadelForTour closes onboarding-app window — wait for shell to update
await page.waitForTimeout(1500);
await shot('03-tour-1-step-1');

// Advance to step 2
await nextTour();
await page.waitForTimeout(600);
await shot('03b-tour-1-step-2');

// Advance to step 3
await nextTour();
await page.waitForTimeout(600);
await shot('03c-tour-1-step-3');

// Advance to step 4 (open clients via action button)
await nextTour();
await page.waitForTimeout(800);
await shot('debug-before-action');
// Dump the bubble's button labels so we can see what's actually on screen.
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter((t) => t.length > 0 && t.length < 50);
});
console.log('  buttons on screen:', JSON.stringify(buttons));
await clickByText(/^Ouvrir Clients$/i, { delay: 1200 });
await page.waitForTimeout(1200);
await shot('04-tour-1-step-4');

// ─── 5. CAS ÉLIMINE — drag the clients window mid-tour ────────────────────
console.log('\n[05] Drag clients window mid-tour (cas elimine)');
const winFrame = page.locator('[data-window-id="clients"]').first();
if (await winFrame.count() > 0) {
  const box = await winFrame.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + 20;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 350, startY + 200, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }
}
await shot('05-cas-elimine');

// ─── 6. Continue tour 1 — step 5 (window controls) ────────────────────────
console.log('\n[06] Tour 1, step 5');
await nextTour();
await page.waitForTimeout(600);
await shot('06-tour-1-step-5');
await finishTour();
await page.waitForTimeout(400);

// ─── 7. Tour 2 — premier agent ─────────────────────────────────────────────
console.log('\n[07] Tour 2, step 1');
const launcher2 = page.locator('[data-testid="onboarding-tours-launcher"]');
if (await launcher2.count() > 0) await clickTestId('onboarding-tours-launcher');
await page.waitForTimeout(300);
await clickTestId('onboarding-tour-g-first-agent');
await page.waitForTimeout(1500);
await shot('07-tour-2-step-1');

// Click the action button to open People (tour step 1 = open-people)
await clickByText(/^Ouvrir People$/i, { delay: 1500 });
await page.waitForTimeout(1500);
// Advance to step 2 (people-overview)
await nextTour(); await page.waitForTimeout(800);
// Advance to step 3 (open-agent)
await nextTour(); await page.waitForTimeout(800);
// Advance to step 4 (approvals)
await nextTour(); await page.waitForTimeout(800);
await shot('08-tour-2-step-4');
await finishTour();
await page.waitForTimeout(400);

// ─── 9. Tour 3 — premiere donnee ─────────────────────────────────────────
console.log('\n[09] Tour 3, step 1');
const launcher3 = page.locator('[data-testid="onboarding-tours-launcher"]');
if (await launcher3.count() > 0) await clickTestId('onboarding-tours-launcher');
await page.waitForTimeout(300);
await clickTestId('onboarding-tour-g-first-data');
await page.waitForTimeout(1500);
await shot('09-tour-3-step-1');

// Click the action button to open Clients (tour step 1 = open-clients)
await clickByText(/^Ouvrir Clients$/i, { delay: 1500 });
await page.waitForTimeout(1500);
// Advance to step 2 (new-button)
await nextTour(); await page.waitForTimeout(800);
// Advance to step 3 (fill-form)
await nextTour(); await page.waitForTimeout(800);
await shot('10-tour-3-step-3');
await finishTour();
await page.waitForTimeout(400);

// ─── 11. Embedded services overlay ────────────────────────────────────────
console.log('\n[11] Open embedded services overlay');
// Re-pass through auth if needed
const authAgain = page.locator('[data-testid="auth-page"]');
if (await authAgain.count() > 0) {
  console.log('  re-passing through auth');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const decouvrirBtn2 = page.locator('button').filter({ hasText: /Découvrir|Decouvrir/i }).first();
  if (await decouvrirBtn2.count() > 0) await decouvrirBtn2.click();
  await page.waitForTimeout(400);
  const enterBtn2 = page.locator('button').filter({ hasText: /^Ouvrir le bureau$/i }).first();
  if (await enterBtn2.count() > 0) await enterBtn2.click();
  await page.waitForTimeout(1500);
}

const esLauncher = page.locator('[data-testid="embedded-services-launcher"]');
if (await esLauncher.count() > 0) {
  await esLauncher.click();
} else {
  await page.evaluate(() => window.openEmbeddedServices?.());
}
await page.waitForTimeout(3500); // wait for all probes
await shot('11-services-overlay');

// ─── 12-14. Per-service frames ────────────────────────────────────────────
console.log('\n[12-14] Per-service frames');
const ids = ['agentgateway', 'foundry', 'observatoire', 'langsmith'];
for (const id of ids) {
  const el = page.locator(`[data-testid="embedded-service-${id}"]`);
  if (await el.count() === 0) {
    console.log(`  ${id}: NOT FOUND`);
    continue;
  }
  const box = await el.boundingBox();
  if (!box) {
    console.log(`  ${id}: NO BOX`);
    continue;
  }
  await page.screenshot({
    path: path.join(OUTDIR, `12-service-${id}.png`),
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  });
  console.log(`  captured: 12-service-${id}.png`);
}

// ─── 15. Console errors ───────────────────────────────────────────────────
const fs = await import('node:fs/promises');
const errFile = path.join(OUTDIR, '15-console-errors.txt');
await fs.writeFile(
  errFile,
  consoleErrors.length === 0
    ? 'No console errors during the run.\n'
    : consoleErrors.join('\n') + '\n'
);
console.log(`\nconsole errors: ${consoleErrors.length} (file: ${errFile})`);

await browser.close();
console.log(`\nDONE. Captures in ${OUTDIR}/`);
