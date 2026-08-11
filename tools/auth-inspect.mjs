/**
 * auth-inspect.mjs — affiche le DOM rendu pour debug.
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
const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const html = await page.content();
console.log('body length:', html.length);
console.log('first 1500 chars of body:');
console.log(html.slice(0, 1500));
console.log('\n----- TREE summary -----');
const summary = await page.evaluate(() => {
  const r = [];
  document.querySelectorAll('[data-testid]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    r.push({ testid: el.getAttribute('data-testid'), x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) });
  });
  // Inspect every direct child of #root
  const root = document.getElementById('root');
  if (root) {
    Array.from(root.children).forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      r.push({
        i,
        tag: el.tagName,
        class: el.className?.toString().slice(0, 100),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    });
  }
  return r;
});
console.log(JSON.stringify(summary, null, 2));
await navigateur.close();