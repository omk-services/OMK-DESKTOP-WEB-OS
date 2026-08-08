/**
 * voice-shot.mjs — captures des preuves E (ecoute et parole).
 *
 * Six preuves attendues par BRIEF_E :
 *   1. bouton micro + indicateur pendant l'ecoute
 *   2. transcription progressive (deux captures a deux instants)
 *   3. personnage en animation de parole pendant la synthese, au repos apres
 *   4. refus de permission micro, message lisible dans la bulle
 *   5. pas de SpeechRecognition : bouton absent, rien ne casse
 *   6. reglages dans Settings
 *
 * Strategie : chaque preuve est sa propre page (ou son propre contexte)
 * avec un etat initial differe. Playwright n'a pas besoin de cliquer
 * sur le micro reel : on injecte l'etat desire (localStorage, init
 * script) et on mesure l'etat du DOM apres.
 *
 * Usage :
 *   node tools/voice-shot.mjs --base http://localhost:5174 --out-dir <dir>
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
  console.error('playwright introuvable. Installer :');
  console.error('  mkdir -p ~/gauntlet-eyes && cd ~/gauntlet-eyes && npm i playwright');
  console.error('  npx playwright install chromium');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5174');
const outDir = arg('out-dir', '.');

// Une instance pour chaque preuve : chaque contexte a son propre state
// (localStorage, permissions, mocks). On lance un seul browser.
const navigateur = await chromium.launch();

// Helper : pose l'etat vocal dans le store via localStorage avant la
// navigation, puis ouvre la page et attends que le DOM soit pret.
async function setupVoix(page, { voiceEnabled = true, characterId = 'clippy' } = {}) {
  // Injecte l'etat directement dans le localStorage pour eviter de
  // naviguer dans Settings avant de capturer.
  await page.addInitScript(({ voiceEnabled, characterId }) => {
    const raw = localStorage.getItem('coach-os-assistant-v1');
    const cur = raw ? JSON.parse(raw) : { state: {}, version: 1 };
    cur.state = {
      ...cur.state,
      voiceEnabled,
      characterId,
      // Une seule selection visible pour ne pas avoir 12 personnages sur le bureau.
      agentsVisibles: ['cerritos-holodeck'],
      active: true,
    };
    cur.version = 1;
    localStorage.setItem('coach-os-assistant-v1', JSON.stringify(cur));
  }, { voiceEnabled, characterId });
}

async function openAssistantBubble(page) {
  // Attendre que l'overlay agent soit monte, puis cliquer dessus pour
  // ouvrir la bulle.
  await page.waitForSelector('[data-assistant-overlay]', { timeout: 8000 });
  // Le click ouvre la bulle (cf. AgentTile onPointerUp).
  const overlay = page.locator('[data-assistant-overlay]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error('overlay sans boundingBox');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForSelector('[data-bubble-handle="true"]', { timeout: 5000 });
}

// ────────────────────────────────────────────────────────────────────────────
// Mock SpeechRecognition : joue des transcripts au fur et a mesure, comme
// si on parlait. Emet plusieurs "interim" successifs pour montrer la
// transcription progressive, puis un final.
// ────────────────────────────────────────────────────────────────────────────
async function mockReconnaissance(page, { interims = ['salut', 'salut ca', 'salut ca va ?'], final = 'salut ca va ?' } = {}) {
  await page.addInitScript(({ interims, final }) => {
    class FakeRecognition {
      constructor() {
        this.lang = 'fr-FR';
        this.continuous = false;
        this.interimResults = true;
        this.maxAlternatives = 1;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this._started = false;
      }
      start() {
        this._started = true;
        // Emet chaque interim avec un delai, comme une personne qui parle.
        let i = 0;
        const emitInterim = () => {
          if (i >= interims.length) {
            // Final.
            const evf = {
              resultIndex: 0,
              results: {
                length: 1,
                0: { isFinal: true, length: 1, 0: { transcript: final, confidence: 0.9 } },
                item: () => undefined,
              },
            };
            if (this.onresult) this.onresult(evf);
            setTimeout(() => { if (this.onend) this.onend(new Event('end')); }, 100);
            return;
          }
          const txt = interims[i++];
          const ev = {
            resultIndex: 0,
            results: {
              length: 1,
              0: { isFinal: false, length: 1, 0: { transcript: txt, confidence: 0.5 } },
              item: () => undefined,
            },
          };
          if (this.onresult) this.onresult(ev);
          setTimeout(emitInterim, 250);
        };
        emitInterim();
      }
      stop() {
        if (this._started && this.onend) this.onend(new Event('end'));
      }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
  }, { interims, final });
}

// Mock SpeechSynthesis : joue une utterance pendant `ms` ms, puis
// appelle onend. Utile pour observer les etats 'speaking' et 'idle'
// sans avoir besoin d'un moteur TTS reel.
//
// IMPORTANT : on n'ecrase PAS window.SpeechSynthesisUtterance. Le
// navigateur fournit sa propre classe, et useVoiceSynthesis instancie
// `new SpeechSynthesisUtterance(...)`. Si on ecrase, l'instance passee
// a speechSynthesis.speak() ne satisfait pas le type-check interne de
// Chromium. On laisse la classe native, on ne remplace que l'API haut
// niveau `speechSynthesis`.
async function mockSynthese(page, { dureeMs = 1500 } = {}) {
  await page.addInitScript(({ dureeMs }) => {
    const fakeVoices = [
      { name: 'Amelie', lang: 'fr-FR', localService: true, voiceURI: 'Amelie', default: false },
      { name: 'Alex', lang: 'en-US', localService: true, voiceURI: 'Alex', default: false },
    ];
    class FakeSynthesis {
      constructor() {
        this.speaking = false;
        this._utt = null;
        this._timer = null;
      }
      getVoices() {
        return fakeVoices;
      }
      speak(utt) {
        this._utt = utt;
        this.speaking = true;
        this._timer = setTimeout(() => {
          this.speaking = false;
          this._utt = null;
          if (utt.onend) utt.onend(new Event('end'));
        }, dureeMs);
      }
      cancel() {
        if (this._timer) {
          clearTimeout(this._timer);
          this._timer = null;
        }
        const u = this._utt;
        this._utt = null;
        this.speaking = false;
        if (u && u.onerror) u.onerror(new Event('error'));
      }
    }
    window.speechSynthesis = new FakeSynthesis();
  }, { dureeMs });
}

const erreurs = [];

// ────────────────────────────────────────────────────────────────────────────
// PREUVE 1 + 2 : bouton micro + indicateur + transcription progressive
// ────────────────────────────────────────────────────────────────────────────
async function preuve1et2() {
  const ctx = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    permissions: ['microphone'],
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await mockReconnaissance(page, { interim: 'salut', final: 'salut, presente moi tes clients' });
  await setupVoix(page, { voiceEnabled: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  await openAssistantBubble(page);

  // Capture 1 : le bouton micro est visible.
  const bubble = page.locator('[data-bubble-handle="true"]').first();
  await bubble.waitFor();
  await page.screenshot({ path: path.join(outDir, '01-bouton-micro.png'), clip: await bubble.boundingBox() });
  console.log('capture : 01-bouton-micro.png');

  // Cliquer le bouton micro.
  await page.locator('[data-voice-mic]').click();
  // Attendre que l'indicateur listening apparaisse.
  await page.waitForSelector('[data-voice-indicator="listening"]', { timeout: 3000 });
  // Capture 2 : indicateur visible pendant l'ecoute.
  await page.screenshot({ path: path.join(outDir, '02-micro-ouvert-indicateur.png'), clip: await bubble.boundingBox() });
  console.log('capture : 02-micro-ouvert-indicateur.png');

  // Capture 3 : transcription intermediaire au premier instant.
  // Le mock emit des interims successifs ('salut', 'salut ca', 'salut
  // ca va ?') a 250 ms d'intervalle — il y a donc une fenetre ou
  // l'input reflete exactement 'salut ca'.
  await page.waitForFunction(() => {
    const inp = document.querySelector('[data-assistant-input]');
    return inp && inp.value.includes('ca');
  }, { timeout: 4000 });
  // Capture le plus tot possible, des qu'on voit l'evolution.
  await page.screenshot({ path: path.join(outDir, '03-transcription-interim.png'), clip: await bubble.boundingBox() });
  console.log('capture : 03-transcription-interim.png');

  // Capture 4 : transcription progressive, dernier instant.
  await page.waitForFunction(() => {
    const inp = document.querySelector('[data-assistant-input]');
    return inp && inp.value === 'salut ca va ?';
  }, { timeout: 6000 });
  await page.screenshot({ path: path.join(outDir, '04-transcription-progressive.png'), clip: await bubble.boundingBox() });
  console.log('capture : 04-transcription-progressive.png');

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PREUVE 3 : synthese vocale declenchee par une vraie reponse assistant
// ────────────────────────────────────────────────────────────────────────────
async function preuve3() {
  const ctx = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));

  // Mock SpeechSynthesis : duree 1500 ms pour observer l'etat speaking.
  await mockSynthese(page, { dureeMs: 1500 });

  // Mock /api/agent/invoke : on renvoie un SSE simple qui dit
  // "Bonjour, je suis Clippy" pour declencher useVoiceSynthesis.speak().
  // Le backend 'multica' (le seul mockable sans binaire reel) est
  // choisi en posant agentsPrefs[...].backend avant la navigation.
  await page.route('**/api/agent/invoke', async (route) => {
    const sse = [
      'event: delta\ndata: {"type":"text","text":"Bonjour, je suis Clippy."}\n\n',
      'event: done\ndata: {"stopReason":"end"}\n\n',
    ].join('');
    // Petit delai pour simuler la latence, puis envoi.
    await new Promise((r) => setTimeout(r, 100));
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: sse,
    });
  });

  // Forcer le backend 'multica' (utilise useTexteFlux) sur l'agent
  // cerritos-holodeck, et s'assurer qu'il est visible.
  await setupVoix(page, { voiceEnabled: true });
  await page.addInitScript(() => {
    const raw = localStorage.getItem('coach-os-assistant-v1');
    const cur = raw ? JSON.parse(raw) : { state: {}, version: 1 };
    cur.state.agentsPrefs = {
      ...(cur.state.agentsPrefs ?? {}),
      'cerritos-holodeck': { backend: 'multica' },
    };
    cur.state.agentsVisibles = ['cerritos-holodeck'];
    localStorage.setItem('coach-os-assistant-v1', JSON.stringify(cur));
  });

  await page.goto(base, { waitUntil: 'networkidle' });
  await openAssistantBubble(page);

  // Poser un texte dans l'input, puis envoyer (Entrer).
  const input = page.locator('[data-assistant-input]').first();
  await input.fill('salut');
  await input.press('Enter');

  // Attendre que la reponse arrive et que la synthese commence.
  await page.waitForFunction(() => {
    const ind = document.querySelector('[data-voice-indicator="speaking"]');
    return ind !== null;
  }, { timeout: 8000 });

  // Capture 5 : synthese en cours (indicateur vocal + sprite en 'speaking').
  const bubble = page.locator('[data-bubble-handle="true"]').first();
  await page.screenshot({ path: path.join(outDir, '05-synthese-en-cours.png'), clip: await bubble.boundingBox() });
  console.log('capture : 05-synthese-en-cours.png');

  // Capture 6 : synthese terminee (indicateur disparu, sprite au repos).
  await page.waitForFunction(() => {
    return document.querySelector('[data-voice-indicator="speaking"]') === null;
  }, { timeout: 8000 });
  await page.screenshot({ path: path.join(outDir, '06-synthese-terminee.png'), clip: await bubble.boundingBox() });
  console.log('capture : 06-synthese-terminee.png');

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PREUVE 4 : refus de permission micro
// ────────────────────────────────────────────────────────────────────────────
async function preuve4() {
  const ctx = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    // Pas de grant micro : le navigateur refusera.
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  // Mock SpeechRecognition qui throw 'not-allowed' sur start.
  await page.addInitScript(() => {
    class Denied {
      constructor() {
        this.lang = 'fr-FR';
        this.interimResults = true;
        this.continuous = false;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }
      start() {
        setTimeout(() => {
          if (this.onerror) this.onerror({ error: 'not-allowed' });
          if (this.onend) this.onend(new Event('end'));
        }, 50);
      }
      stop() { if (this.onend) this.onend(new Event('end')); }
      abort() { if (this.onend) this.onend(new Event('end')); }
    }
    window.SpeechRecognition = Denied;
    window.webkitSpeechRecognition = Denied;
  });
  await setupVoix(page, { voiceEnabled: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  await openAssistantBubble(page);

  // Cliquer le bouton micro : declenche not-allowed, le bubbleText devient
  // le message de refus.
  await page.locator('[data-voice-mic]').click();
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-bubble-text]');
    return t && t.textContent && t.textContent.includes('micro est refuse');
  }, { timeout: 3000 });
  const bubble = page.locator('[data-bubble-handle="true"]').first();
  await page.screenshot({ path: path.join(outDir, '07-refus-permission.png'), clip: await bubble.boundingBox() });
  console.log('capture : 07-refus-permission.png');

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PREUVE 5 : pas de SpeechRecognition -> bouton absent
// ────────────────────────────────────────────────────────────────────────────
async function preuve5() {
  const ctx = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  // Chromium peut exposer webkitSpeechRecognition ; on simule un
  // navigateur qui ne l'a pas, comme Firefox par defaut.
  await page.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });
  await setupVoix(page, { voiceEnabled: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  await openAssistantBubble(page);

  // Pas de bouton micro visible.
  const micCount = await page.locator('[data-voice-mic]').count();
  if (micCount !== 0) throw new Error(`attendu 0 bouton micro, vu ${micCount}`);
  const bubble = page.locator('[data-bubble-handle="true"]').first();
  await page.screenshot({ path: path.join(outDir, '08-sans-reconnaissance.png'), clip: await bubble.boundingBox() });
  console.log('capture : 08-sans-reconnaissance.png');

  await ctx.close();
}

// ────────────────────────────────────────────────────────────────────────────
// PREUVE 6 : reglages Settings > Assistant (voix, vitesse, confidentialite)
// ────────────────────────────────────────────────────────────────────────────
async function preuve6() {
  const ctx = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await mockSynthese(page, { dureeMs: 100 });
  await setupVoix(page, { voiceEnabled: true });
  await page.goto(base, { waitUntil: 'networkidle' });

  // Ouvrir Settings > Assistant via le shell handle.
  const ok = await page.evaluate(() => {
    const w = /** @type {any} */ (window).__coachos;
    if (!w?.shell) return false;
    w.shell.getState().openApp('settings', 'Settings');
    return true;
  });
  if (!ok) throw new Error('shell absent');
  await page.waitForTimeout(500);
  // Cliquer la section "Assistant" dans la barre laterale.
  const sec = page.locator('[data-section="Assistant"]');
  if ((await sec.count()) === 0) throw new Error('section Assistant introuvable');
  await sec.click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(outDir, '09-settings-assistant.png'), fullPage: false });
  console.log('capture : 09-settings-assistant.png');

  await ctx.close();
}

try {
  await preuve1et2();
  await preuve3();
  await preuve4();
  await preuve5();
  await preuve6();
} finally {
  await navigateur.close();
}

if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 20)) console.log('  ' + e);
  process.exit(1);
}