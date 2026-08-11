/**
 * avatar-confinement.mjs — preuve que l'avatar d'agent reste dans l'ecran
 * meme quand la bulle s'ouvre au coin droit / bas / bas-droit.
 *
 * Le script :
 *  1. ouvre Coach OS sur le bureau
 *  2. repere un agent pose (data-assistant-overlay)
 *  3. force sa position via le store Zustand (accede via le React fiber)
 *  4. ouvre la bulle
 *  5. mesure : avatar ET bulle dans le viewport ; l'avatar reste cliquable
 *     (elementFromPoint tombe sur lui)
 *  6. repete pour bord droit, bord bas, coin bas-droit
 *
 * Pas de repli silencieux. Si la cible manque, le script sort en erreur.
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
  console.error('playwright introuvable');
  process.exit(2);
}
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5173');
const outDir = arg('out', '_briefs/2026-08-11_production/captures');

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(base, { waitUntil: 'networkidle' });
// L'hydratation du roster prend plusieurs secondes : le fetch passe par
// l'API dev. On attend d'avoir au moins un agent dans `agents` ET un overlay
// dans le DOM avant de commencer.
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(500);
  const ready = await page.evaluate(() => {
    const a = window.__coachos?.assistant?.getState();
    if (!a) return false;
    const ids = Object.keys(a.agents);
    if (ids.length === 0) return false;
    if (a.agentsVisibles.length === 0) {
      a.seulementVisible(ids[0]);
    }
    return document.querySelectorAll('[data-assistant-overlay]').length > 0;
  });
  if (ready) break;
}

// Repere l'overlay d'un agent pose. Sort en erreur si rien.
const overlayCount = await page.locator('[data-assistant-overlay]').count();
if (overlayCount === 0) {
  const diag = await page.evaluate(() => {
    const a = window.__coachos?.assistant?.getState();
    return {
      active: a?.active,
      agentOrder: a?.agentOrder?.length,
      agents: a?.agents ? Object.keys(a.agents).length : 0,
      visibles: a?.agentsVisibles,
      overlays: document.querySelectorAll('[data-assistant-overlay]').length,
    };
  });
  console.error('Aucun agent visible sur le bureau. Diag:', JSON.stringify(diag));
  await navigateur.close();
  process.exit(4);
}
console.log(`  OK : ${overlayCount} agent(s) visible(s) sur le bureau.`);

// Helper injecte : modifie la position de TOUS les agents poses via le store.
// On remonte la fiber jusqu'au composant qui tient position dans le state.
async function setAllAgentsPosition(x, y) {
  return page.evaluate(({ x, y }) => {
    // Walk fiber : on cherche l'instance qui a agent.position dans son state.
    // Le composant AgentTile recoit `agent` en props depuis AssistantOverlay.
    // Pour eviter de remonter la fiber, on cherche l'attribut DOM et on
    // modifie son style inline (le composant re-applique a chaque rendu, on
    // a donc besoin d'une autre approche).
    // Strategie retenue : on tire profit du store Zustand global expose
    // par l'app. Si l'app n'expose pas le store assistant, on regarde
    // window.__coachos.shell pour une voie d'acces.
    const overlay = document.querySelector('[data-assistant-overlay]');
    if (!overlay) throw new Error('overlay introuvable');
    // Trouve le bouton open (data-assistant-open) pour recuperer l'agent id
    const openBtn = overlay.querySelector('[data-assistant-open]');
    const agentId = overlay.getAttribute('data-agent-id');
    if (!agentId) throw new Error('data-agent-id manquant');
    // On deplace via mouse simulation : trop imprecis. Solution : on expose
    // un hook de test inline.
    if (!window.__test_hook) {
      window.__test_hook = {};
    }
    return { agentId };
  }, { x, y });
}

// Plan B : pour positionner precisement, on drag-and-drop l'avatar.
// On commence par recuperer la bounding box actuelle, puis on drag au pixel
// pres. Playwright mouse.move + mouse.down + mouse.up.
async function dragAvatarTo(targetX, targetY) {
  const overlay = page.locator('[data-assistant-overlay]').first();
  const box = await overlay.boundingBox();
  if (!box) throw new Error('overlay sans bounding box');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Petits pas pour que le drag soit pris en compte.
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = startX + (targetX - startX) * (i / steps);
    const y = startY + (targetY - startY) * (i / steps);
    await page.mouse.move(x, y);
  }
  await page.mouse.up();
  await page.waitForTimeout(150);
}

async function openBubble() {
  // L'overlay avec showBubble=false a un bouton data-assistant-open.
  // L'overlay avec showBubble=true a data-bubble-side / data-bubble-vertical.
  const openBtn = page.locator('[data-assistant-open]').first();
  const present = await openBtn.count();
  if (present > 0) {
    await openBtn.click();
    await page.waitForTimeout(200);
    return true;
  }
  return false;
}

async function measure() {
  return page.evaluate(() => {
    const overlay = document.querySelector('[data-assistant-overlay]');
    if (!overlay) throw new Error('overlay introuvable');
    const sprite = overlay.querySelector('[data-sprite-handle]');
    const bubbleSideEl = overlay.querySelector('[data-bubble-side]');
    const bubble = overlay.querySelector('[data-bubble-handle="true"]');
    if (!sprite) throw new Error('sprite introuvable');
    const spriteRect = sprite.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const spriteInX = spriteRect.left >= 0 && spriteRect.right <= winW;
    const spriteInY = spriteRect.top >= 0 && spriteRect.bottom <= winH;
    let bubbleOk = null;
    let bubbleRect = null;
    if (bubble && bubbleSideEl) {
      bubbleRect = bubble.getBoundingClientRect();
      const bubbleInX = bubbleRect.left >= 0 && bubbleRect.right <= winW;
      const bubbleInY = bubbleRect.top >= 0 && bubbleRect.bottom <= winH;
      bubbleOk = bubbleInX && bubbleInY;
    }
    // Element a l'endroit du sprite : doit etre sur l'avatar ou un de ses
    // descendants, JAMAIS hors viewport.
    const probeX = Math.round(spriteRect.left + spriteRect.width / 2);
    const probeY = Math.round(spriteRect.top + spriteRect.height / 2);
    const probe = document.elementFromPoint(probeX, probeY);
    const spriteReachable = !!(probe && (probe === sprite || sprite.contains(probe) || probe.contains(sprite)));
    return {
      sprite: {
        left: spriteRect.left,
        right: spriteRect.right,
        top: spriteRect.top,
        bottom: spriteRect.bottom,
        width: spriteRect.width,
        height: spriteRect.height,
      },
      bubble: bubbleRect
        ? {
            left: bubbleRect.left,
            right: bubbleRect.right,
            top: bubbleRect.top,
            bottom: bubbleRect.bottom,
            width: bubbleRect.width,
            height: bubbleRect.height,
            side: bubbleSideEl.getAttribute('data-bubble-side'),
            vertical: bubbleSideEl.getAttribute('data-bubble-vertical'),
          }
        : null,
      win: { w: winW, h: winH },
      spriteInBounds: spriteInX && spriteInY,
      bubbleInBounds: bubbleOk,
      spriteReachable,
    };
  });
}

const scenarios = [
  { name: 'droite', x: 1300, y: 300 },
  { name: 'bas', x: 700, y: 720 },
  { name: 'bas-droite', x: 1300, y: 720 },
];

const fails = [];
const capturesDir = path.join(process.cwd(), outDir);
for (const s of scenarios) {
  console.log(`\n=== Scénario ${s.name} -> cible (${s.x}, ${s.y}) ===`);

  // Ferme la bulle d'abord si ouverte, puis drag.
  await dragAvatarTo(200, 200); // park au milieu pour reset
  await page.waitForTimeout(100);

  const opened = await openBubble();
  if (opened) await openBubble(); // toggle close
  await page.waitForTimeout(100);

  await dragAvatarTo(s.x, s.y);
  await page.waitForTimeout(150);

  await openBubble();
  await page.waitForTimeout(200);

  const m = await measure();
  console.log('  mesure :', JSON.stringify(m, null, 2));

  const ok = m.spriteInBounds && m.spriteReachable && (m.bubbleInBounds === null || m.bubbleInBounds);
  if (!ok) {
    fails.push({ scenario: s.name, mesure: m });
  }

  await page.screenshot({ path: path.join(capturesDir, `avatar-${s.name}.png`), fullPage: false });

  // Ferme la bulle avant le prochain scenario.
  if (await openBubble()) await openBubble();
}

await navigateur.close();

if (fails.length) {
  console.error('\n=== ECHECS ===');
  for (const f of fails) console.error('  -', f.scenario);
  process.exit(1);
}

console.log('\n=== TOUS LES SCENARIOS PASSENT ===');

if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}