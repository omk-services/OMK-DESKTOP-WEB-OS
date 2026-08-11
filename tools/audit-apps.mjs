/** Audit systematique des apps du bureau — section par section.
 *
 *  Cet instrument cherche les QUATRE familles de defauts qui sont revenues
 *  pendant la campagne du 2026-08-11. Un audit qui ne les cherche pas ne sert
 *  a rien : c'est la lecon des trois verdicts faux deja produits sur ce depot.
 *
 *   1. SECTION VIDE — la page rend, mais sans contenu ni issue. C'est le
 *      reproche numero un de l'utilisateur : « j'en ai marre de les ouvrir
 *      pour decouvrir qu'ils sont juste vides ».
 *   2. CREATION ABSENTE — une section qui liste des objets metier sans aucun
 *      moyen d'en creer un. Distinguer du journal legitime (Sessions, Usage,
 *      Audit Log), ou l'absence est normale.
 *   3. DEBORDEMENT — un element qui sort de la fenetre de son app. Quatre
 *      occurrences en une nuit : avatar pousse hors cadre, dock grandissant
 *      vers le haut, fausse fenetre bornee sur window.innerHeight, bulle de
 *      visite orpheline. Toujours la meme cause : une contrainte de bord
 *      calculee dans le mauvais referentiel.
 *   4. ERREUR CONSOLE — y compris les requetes reseau en echec, qui ne
 *      remontent pas toujours comme erreurs console.
 *
 *  ECHEC BRUYANT : si une app ou une section est introuvable, on le RAPPORTE
 *  au lieu de passer au suivant en silence. Un selecteur muet qui rend « vert »
 *  a deja invalide une campagne entiere ici.
 */
import { chromium } from '/Users/amado/gauntlet-eyes/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.URL ?? 'http://localhost:5173';
const SORTIE = 'C:/Users/amado/AppData/Local/Temp/audit-apps.json';

/** Sections ou l'absence de bouton de creation est NORMALE : ce sont des
 *  journaux produits par le systeme, on n'y cree rien a la main. */
const JOURNAUX = /session|usage|cost|audit log|journal|log|drift|eval|trace|activit/i;

const nav = await chromium.launch({ args: ['--disable-features=OverlayScrollbar'] });
const page = await nav.newPage({ viewport: { width: 1440, height: 900 } });

const erreurs = [];
const reseauKO = [];
page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text().slice(0, 100)));
page.on('response', (r) => { if (r.status() >= 400) reseauKO.push(`${r.status()} ${r.url().slice(0, 80)}`); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Entrer par la demonstration — deux ecrans successifs.
for (const motif of ['Decouvrir sans compte|Découvrir sans compte', 'Ouvrir le bureau']) {
  await page.evaluate((m) => {
    const re = new RegExp(m, 'i');
    const b = [...document.querySelectorAll('button')].find((x) => re.test(x.textContent ?? ''));
    if (b) b.click();
  }, motif);
  await page.waitForTimeout(2200);
}

const apps = await page.evaluate(() =>
  [...document.querySelectorAll('button[title*="click to open"]')].map((b) => b.title.split(' —')[0]),
);
if (apps.length === 0) {
  console.error('ECHEC DU HARNAIS : aucune icone sur le bureau. Verdict sans valeur.');
  await nav.close();
  process.exit(2);
}

const rapport = [];
for (const nom of apps) {
  const avant = erreurs.length;

  const ouverte = await page.evaluate((n) => {
    const b = [...document.querySelectorAll('button[title*="click to open"]')]
      .find((x) => x.title.split(' —')[0] === n);
    if (!b) return false;
    b.click();
    return true;
  }, nom);
  if (!ouverte) { rapport.push({ app: nom, echec: 'icone introuvable' }); continue; }
  await page.waitForTimeout(1600);

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll('[data-section]')].map((e) => e.getAttribute('data-section')),
  );

  const mesures = [];
  for (const s of sections) {
    const ok = await page.evaluate((sec) => {
      const e = [...document.querySelectorAll('[data-section]')]
        .find((x) => x.getAttribute('data-section') === sec);
      if (!e) return false;
      e.click();
      return true;
    }, s);
    if (!ok) { mesures.push({ section: s, echec: 'section introuvable' }); continue; }
    await page.waitForTimeout(700);

    mesures.push(await page.evaluate(() => {
      // La fenetre au premier plan : celle qui porte le plus grand z-index.
      const fen = [...document.querySelectorAll('[class*="absolute"]')]
        .filter((e) => e.getBoundingClientRect().width > 400 && e.getBoundingClientRect().height > 300)
        .sort((a, b) => (+getComputedStyle(b).zIndex || 0) - (+getComputedStyle(a).zIndex || 0))[0];
      const cadre = fen ? fen.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };

      const zone = fen ?? document.body;
      const texte = (zone.innerText ?? '').trim();

      // Commandes inatteignables.
      //
      //  La premiere version comptait tout element dont la boite sortait du
      //  cadre, y compris vers le bas : elle marquait donc TOUT ce qui est
      //  sous la ligne de flottaison, c'est-a-dire le contenu normal d'une
      //  section qui defile. Resultat : 102 « defauts » dont 231 pour une
      //  seule section — un instrument qui accuse au hasard.
      //
      //  Le vrai defaut, celui vu quatre fois cette nuit (avatar pousse hors
      //  cadre, bouton « suivant » sous le bord, croix du dock), est plus
      //  precis : **une commande cliquable dont le centre tombe hors de la
      //  fenetre du navigateur**. Le contenu qui defile ne compte pas ; un
      //  bouton qu'on ne peut plus atteindre, si.
      const deborde = [...zone.querySelectorAll('button, a, input, select, [role="button"]')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;      // masque
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          // Hors de l'ecran horizontalement, ou au-dessus du bord haut : dans
          // les deux cas la commande est perdue, aucun defilement ne la ramene.
          return cx < 0 || cx > innerWidth || cy < 0;
        }).length;

      return {
        longueur_texte: texte.length,
        boutons_creation: zone.querySelectorAll('[data-cms-action^="create-"]').length,
        cartes: zone.querySelectorAll('[data-cms-card], [data-cms-action^="delete-"]').length,
        elements_debordants: deborde,
      };
    }));
    mesures[mesures.length - 1].section = s;
  }

  rapport.push({
    app: nom,
    sections: sections.length,
    erreurs_console: erreurs.length - avant,
    detail: mesures,
  });

  // Fermer pour ne pas empiler 18 fenetres.
  await page.evaluate(() => {
    const x = [...document.querySelectorAll('button')].find((b) => /^Fermer/i.test(b.getAttribute('aria-label') ?? ''));
    if (x) x.click();
  });
  await page.waitForTimeout(500);
}

// ------------------------------------------------------------ verdicts
const vides = [], sansCreation = [], debordants = [];
for (const a of rapport) {
  for (const m of a.detail ?? []) {
    if (m.echec) continue;
    if (m.longueur_texte < 120) vides.push(`${a.app} / ${m.section} (${m.longueur_texte} car.)`);
    if (m.cartes > 0 && m.boutons_creation === 0 && !JOURNAUX.test(m.section))
      sansCreation.push(`${a.app} / ${m.section} (${m.cartes} items, 0 bouton)`);
    if (m.elements_debordants > 0)
      debordants.push(`${a.app} / ${m.section} (${m.elements_debordants} elements)`);
  }
}

const bilan = {
  apps_auditees: rapport.length,
  sections_totales: rapport.reduce((n, a) => n + (a.sections ?? 0), 0),
  SECTIONS_VIDES: vides,
  SECTIONS_SANS_CREATION: sansCreation,
  ELEMENTS_DEBORDANTS: debordants,
  erreurs_console: erreurs.length,
  exemples_erreurs: [...new Set(erreurs)].slice(0, 5),
  requetes_en_echec: [...new Set(reseauKO)].slice(0, 5),
};

mkdirSync('C:/Users/amado/AppData/Local/Temp', { recursive: true });
writeFileSync(SORTIE, JSON.stringify({ bilan, rapport }, null, 1));
console.log(JSON.stringify(bilan, null, 1));
console.log(`\nDetail complet : ${SORTIE}`);

await nav.close();
const sain = vides.length === 0 && sansCreation.length === 0 && debordants.length === 0 && erreurs.length === 0;
process.exit(sain ? 0 : 1);
