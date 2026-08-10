/**
 * shot.mjs — capture d'ecran d'une app de Coach OS, pilotable en ligne de commande.
 *
 * Raison d'etre : un critique qui ne voit pas le rendu juge le JSX et approuve
 * tout. C'est l'echec le plus courant d'une boucle builder/critique, et c'est
 * celui qu'on a paye trois fois ici. Ce script donne des yeux au critique.
 *
 * Usage :
 *   node tools/shot.mjs --app dashboard --out /tmp/dashboard.png
 *   node tools/shot.mjs --app people --section personas --theme cyberpunk
 *   node tools/shot.mjs --url https://linear.app --out /tmp/bar.png --full
 *
 * Options :
 *   --app <id>        identifiant d'app (cf. src/lib/app-discovery.ts)
 *   --section <label> libellé EXACT de la section a activer. Sélecteur strict
 *                      [data-section="<label>"] : seuls les boutons de la barre
 *                      latérale portent cet attribut (cf. AppFrame.tsx). Aucun
 *                      repli textuel — un match dans le fil d'Ariane ou le
 *                      rail du bureau serait sélectionné à tort. Si la section
 *                      est introuvable, le script échoue avec exit code 4.
 *   --theme <id>      theme global a poser avant la capture (barre du haut)
 *   --url <url>       capture une page externe — sert a photographier la BARRE
 *   --out <chemin>    fichier PNG de sortie (defaut : /tmp/shot.png)
 *   --base <url>      serveur de dev (defaut : http://localhost:5173)
 *   --w --h           taille de la fenetre (defaut 1440x900)
 *   --full            page entiere au lieu de la seule zone visible
 *   --wait <ms>       attente supplementaire avant declenchement (defaut 1200)
 *
 * Playwright n'est pas une dependance du depot : il vit dans ~/gauntlet-eyes
 * pour ne pas alourdir l'installation de tout le monde. Le script le cherche la,
 * puis dans node_modules local.
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
// Playwright est publie en CommonJS : importe depuis un module ES, ses exports
// atterrissent sous `.default`. Le destructurer directement donne `undefined`.
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;

const base = arg('base', 'http://localhost:5173');
const out = arg('out', '/tmp/shot.png');
const appId = arg('app');
const section = arg('section');
const theme = arg('theme');
const url = arg('url');
const attente = Number(arg('wait', 1200));

const navigateur = await chromium.launch();
const page = await navigateur.newPage({
  viewport: { width: Number(arg('w', 1440)), height: Number(arg('h', 900)) },
  deviceScaleFactor: 2,
});

const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(String(e)));

await page.goto(url ?? base, { waitUntil: 'networkidle' });

if (!url && appId) {
  // Le theme se pose AVANT l'ouverture pour que la fenetre naisse deja habillee.
  if (theme) {
    await page.evaluate((t) => {
      const brut = localStorage.getItem('coach-os-themes-v1');
      let d;
      try {
        d = brut ? JSON.parse(brut) : { state: {}, version: 0 };
      } catch {
        d = { state: {}, version: 0 };
      }
      d.state = { ...d.state, globalTheme: t };
      localStorage.setItem('coach-os-themes-v1', JSON.stringify(d));
    }, theme);
    await page.reload({ waitUntil: 'networkidle' });
  }
  const ouvert = await page.evaluate((id) => {
    const w = window.__coachos;
    if (!w?.shell) return 'absent';
    w.shell.getState().openApp(id, id);
    return 'ok';
  }, appId);
  if (ouvert === 'absent') {
    console.error("window.__coachos absent : le serveur de dev tourne-t-il en mode DEV,");
    console.error('et la page a-t-elle ete rechargee depuis la modification de shell.store.ts ?');
    await navigateur.close();
    process.exit(3);
  }
  await page.waitForTimeout(600);
  if (section) {
    // Sélecteur strict : seuls les boutons de section de la barre latérale
    // portent `data-section`. Aucun repli textuel — un bouton homonyme dans
    // le fil d'Ariane ou le rail du bureau serait sélectionné à tort, et
    // une capture qui montre autre chose que ce qu'elle prétend montrer
    // invalide silencieusement la campagne QA. Si rien ne matche, on
    // échoue bruyamment avec un code non-zero pour arrêter le pipeline.
    const cible = page.locator(`[data-section="${section}"]`);
    const count = await cible.count();
    if (count === 0) {
      console.error(`section "${section}" introuvable : aucun bouton avec [data-section="${section}"] dans la barre latérale.`);
      console.error('Le sélecteur ne se replie PAS sur le texte — un match dans le fil d\'Ariane ou le rail du bureau serait invalide.');
      await navigateur.close();
      process.exit(4);
    }
    if (count > 1) {
      console.error(`section "${section}" : ${count} boutons portent [data-section="${section}"] — ambigu, abandon.`);
      await navigateur.close();
      process.exit(5);
    }
    await cible.click();
    await page.waitForTimeout(400);
  }
}

await page.waitForTimeout(attente);
await page.screenshot({ path: out, fullPage: flag('full') });
await navigateur.close();

console.log('capture : ' + out);
if (erreurs.length) {
  console.log(`\nERREURS CONSOLE (${erreurs.length}) — une page qui hurle n'est pas une page qui marche :`);
  for (const e of erreurs.slice(0, 10)) console.log('  ' + e);
}
