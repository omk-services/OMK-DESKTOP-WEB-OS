/** Preuve du tremblement du dock — vrai curseur, echantillonnage.
 *
 *  Le bug : survoler la DERNIERE pastille revelait son bouton de fermeture pose
 *  en `-right-1`, ce qui debordait de 4 px. Comme le defileur avait
 *  `overflow-x:auto` (et un `overflow-y:visible` force a `auto` par le CSS), une
 *  barre de defilement apparaissait et volait 15 px de hauteur. Le dock etant
 *  ancre en bas, il grandissait vers le haut, la pastille fuyait sous le
 *  curseur, le survol se perdait, tout revenait — plusieurs fois par seconde.
 *
 *  Une mesure ponctuelle ne prouve rien ici : il faut ECHANTILLONNER pendant que
 *  le curseur est pose. Une seule hauteur sur 60 releves = plus de tremblement.
 */
import { chromium } from '/Users/amado/gauntlet-eyes/node_modules/playwright/index.mjs';

const URL = process.env.URL ?? 'http://localhost:5173';
const SORTIE = process.argv[2] ?? 'C:/Users/amado/AppData/Local/Temp/dock-apres.png';

// `--disable-features=OverlayScrollbar` est INDISPENSABLE : le Chromium headless
// dessine par defaut des barres de defilement en surimpression, qui ne prennent
// aucune place dans la mise en page. Sans ce drapeau, le test rendait « STABLE »
// sur la version de production qui tremblait pourtant — un faux negatif parfait.
// Le bug etudie EST une barre de defilement qui vole 15 px : il faut donc des
// barres classiques pour pouvoir l'observer.
const nav = await chromium.launch({ args: ['--disable-features=OverlayScrollbar'] });
const page = await nav.newPage({ viewport: { width: 1280, height: 800 } });
const erreurs = [];
page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// Toutes les apps : le bug ne se manifeste que sur la DERNIERE pastille.
await page.evaluate(() => {
  document.querySelectorAll('button[title*="click to open"]').forEach((b) => b.click());
});
await page.waitForTimeout(1500);

const mesureBarre = () =>
  page.evaluate(() =>
    +document.querySelector('[data-dock]').firstElementChild.getBoundingClientRect().height.toFixed(1),
  );

/** Le debordement au survol — l'invariant qui ne ment pas.
 *
 *  La hauteur de la barre est un mauvais critere : elle ne bouge que si le
 *  navigateur dessine des barres de defilement CLASSIQUES. En headless, elles
 *  sont en surimpression et prennent 0 px, si bien que la version buguee passait
 *  le test. Mesure verifiee sur la production : survol detecte, bouton de
 *  fermeture en `flex`, scrollWidth 576 > clientWidth 572 — et pourtant hauteur
 *  inchangee, faute de barre classique.
 *
 *  On teste donc la CAUSE et non le symptome : au survol, le contenu ne doit
 *  jamais deborder du defileur. Sans debordement, aucune barre ne peut
 *  apparaitre, et le tremblement devient impossible quel que soit le
 *  navigateur. */
const debordeAuSurvol = () =>
  page.evaluate(() => {
    const s = document.querySelector('[data-dock]').firstElementChild.firstElementChild;
    return { scrollW: s.scrollWidth, clientW: s.clientWidth, deborde: s.scrollWidth > s.clientWidth };
  });

const repos = await mesureBarre();

// Le vrai curseur, au centre de la derniere pastille.
const cible = await page.evaluate(() => {
  const s = document.querySelector('[data-dock]').firstElementChild.firstElementChild;
  const tuiles = [...s.querySelectorAll(':scope > div > button:first-child')];
  const r = tuiles[tuiles.length - 1].getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});
await page.mouse.move(cible.x, cible.y);
await page.waitForTimeout(300);

const survol = await debordeAuSurvol();
const survolActif = await page.evaluate(() => {
  const s = document.querySelector('[data-dock]').firstElementChild.firstElementChild;
  const g = [...s.querySelectorAll(':scope > div')];
  return g[g.length - 1].matches(':hover');
});

// 60 releves sur ~1 s : un tremblement a plusieurs hertz ne peut pas y echapper.
// Complementaire, pas decisif — voir la note sur les barres en surimpression.
const releves = [];
for (let i = 0; i < 60; i++) {
  releves.push(await mesureBarre());
  await page.waitForTimeout(16);
}
const distinctes = [...new Set(releves)];

await page.screenshot({ path: SORTIE });
await nav.close();

// Le harnais doit d'abord prouver qu'il REGARDE au bon endroit : sans survol
// actif, tout verdict est un faux negatif. Echec bruyant, jamais de repli muet.
if (!survolActif) {
  console.error('ECHEC DU HARNAIS : le curseur n\'a pas atteint la derniere pastille — verdict sans valeur.');
  process.exit(2);
}

const sain = !survol.deborde;
console.log(JSON.stringify({
  survol_actif: survolActif,
  CRITERE_debordement_au_survol: survol,
  VERDICT: sain
    ? 'SAIN — aucun debordement au survol, aucune barre ne peut apparaitre'
    : `CASSE — deborde de ${survol.scrollW - survol.clientW} px : une barre de defilement peut voler 15 px de hauteur`,
  hauteur_au_repos: repos,
  hauteurs_pendant_survol: distinctes,
  amplitude_px: Math.max(...releves) - Math.min(...releves),
  note: 'L\'amplitude vaut 0 meme sur une version buguee si le navigateur dessine des barres en surimpression. Le critere qui tranche est le debordement.',
  erreurs_console: erreurs,
  capture: SORTIE,
}, null, 2));
process.exit(sain ? 0 : 1);
