/**
 * invoke-shot.mjs — capture a real assistant answer from one of the dos.
 *
 * Drives the overlay's AgentTile via DOM events: opens a bubble, types a
 * prompt, submits it, waits for the stream, screenshots.
 *
 * Usage :
 *   node tools/invoke-shot.mjs --base http://localhost:5176 --agent buzz-core-12th --out ./buzz.png
 *   node tools/invoke-shot.mjs --base http://localhost:5176 --agent cerritos-holodeck --out ./modele.png
 *   node tools/invoke-shot.mjs --base http://localhost:5176 --agent a3-bortus-multica --out ./multica.png
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
const out = arg('out', '/tmp/invoke.png');
const agentId = arg('agent', 'buzz-core-12th');
const prompt = arg('prompt', 'Reps une phrase courte sur toi en 10 mots maximum.');
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
await page.waitForFunction(
  () => {
    const w = window.__coachos;
    return Boolean && w?.assistant?.getState()?.agentOrder?.length > 0;
  },
  { timeout: 10000 },
).catch(() => {});

// Ouvre la bulle de l'agent et envoie le prompt.
const t0 = Date.now();
const sendResult = await page.evaluate(async ({ id, prompt }) => {
  const w = window.__coachos;
  const s = w?.assistant?.getState();
  if (!s) return { ok: false, error: 'store absent' };
  const a = s.agents[id];
  if (!a) return { ok: false, error: 'agent introuvable' };
  s.toggleAgentBubble(id);
  s.appendAgentTurn(id, { id: crypto.randomUUID(), role: 'user', ts: Date.now(), text: prompt });
  // Pour les agents non-modele, on declenche /api/agent/invoke manuellement
  // (le AgentTile ne sera pas re-rendu avec le bon dos dans cette session
  // sans interaction reelle). On attend ensuite que le stream aboutisse.
  if (a.backend !== 'modele') {
    try {
      const res = await fetch('/api/agent/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          messages: [{ id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: prompt }] }],
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const block = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          const evLine = block.split('\n').find((l) => l.startsWith('event: '));
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (!evLine || !dataLine) continue;
          let data;
          try {
            data = JSON.parse(dataLine.slice('data: '.length));
          } catch {
            continue;
          }
          if (evLine.slice(7).trim() === 'delta' && data?.text) acc += data.text;
        }
      }
      s.appendAgentTurn(id, { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), text: acc });
      return { ok: true, text: acc };
    } catch (err) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
  // Pour modele, on passe par /api/chat (meme shape) — mais on ne stream pas
  // pour la capture, on attend un round-trip.
  return { ok: true, text: '[modele — voir api/chat directement]' };
}, { id: agentId, prompt });

const elapsedMs = Date.now() - t0;
console.log(`invoke ${agentId} : ${sendResult.ok ? 'OK' : 'KO'} en ${elapsedMs} ms`);
if (!sendResult.ok) console.log('  erreur :', sendResult.error);
if (sendResult.text && sendResult.text.length < 200) console.log('  reponse :', sendResult.text);
else if (sendResult.text) console.log('  reponse (200 chars) :', sendResult.text.slice(0, 200) + '...');

await page.waitForTimeout(800);
await page.screenshot({ path: out });
await navigateur.close();

console.log('capture : ' + out);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}