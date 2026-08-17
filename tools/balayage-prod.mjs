/**
 * balayage-prod.mjs — ouvre CHAQUE app de Coach OS dans un vrai navigateur,
 * active CHAQUE section, et rend la liste de ce qui casse.
 *
 * RAISON D'ETRE
 * `shot.mjs` capture UNE app a la fois et s'appuie sur `window.__coachos`,
 * un global expose en mode DEV seulement. Il ne peut donc pas viser la
 * production. Or c'est en production que l'utilisateur voit
 * « This app hit a snag ».
 *
 * Le harnais jsdom (`src/apps/toutes-les-apps.test.tsx`) monte les 20 apps et
 * 161 sections sans qu'aucune ne jette. Le defaut n'est donc PAS au montage
 * React : il vient du vrai navigateur ou des vraies donnees. Ce script est
 * l'instrument qui manquait entre les deux.
 *
 * CE QU'IL FAIT
 *  1. ouvre l'URL, entre dans le bureau de demonstration ;
 *  2. pour chaque icone du bureau : double-clic, attente, releve ;
 *  3. detecte l'ecran d'erreur (« This app hit a snag ») ;
 *  4. active chaque `[data-section]` et refait le releve ;
 *  5. collecte TOUTES les erreurs de console et de requete, horodatees ;
 *  6. rend un rapport markdown + un JSON.
 *
 * Usage :
 *   node tools/balayage-prod.mjs
 *   node tools/balayage-prod.mjs --base http://localhost:5173
 *   node tools/balayage-prod.mjs --out _briefs/balayage.md --headed
 *
 * Playwright vit dans ~/gauntlet-eyes (cf. shot.mjs). Ce n'est pas une
 * dependance du depot.
 *
 * ANTI-PIEGE
 * Un selecteur qui ne trouve rien doit ECHOUER BRUYAMMENT, jamais retomber
 * sur un repli silencieux : c'est comme ca qu'une campagne entiere a ete
 * invalidee sans que personne ne le voie. Si le bureau ne rend aucune icone,
 * ce script sort en code 4 au lieu de rendre « 0 defaut ».
 */
import { pathToFileURL } from 'node:url';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = args.indexOf('--' + n);
  return i === -1 ? d : (args[i + 1] ?? true);
};
const flag = (n) => args.includes('--' + n);

const BASE = arg('base', 'https://omk-desktop-web-os.vercel.app');
const OUT = arg('out', '_briefs/2026-08-17_CORRECTIFS_M3/BALAYAGE.md');
const ATTENTE = Number(arg('wait', 1400));
const HEADED = flag('headed');

const candidats = [
  path.join(homedir(), 'gauntlet-eyes', 'node_modules', 'playwright', 'index.js'),
  path.join(process.cwd(), 'node_modules', 'playwright', 'index.js'),
];
const trouve = candidats.find((p) => existsSync(p));
if (!trouve) {
  console.error('playwright introuvable. Installer :');
  console.error('  mkdir -p ~/gauntlet-eyes && cd ~/gauntlet-eyes && npm i playwright');
  console.error('  npx playwright install chromium');
  process.exit(3);
}
// Playwright est publie en CommonJS : importe depuis un module ES, ses exports
// atterrissent sous `.default`. Le destructurer directement donne `undefined`.
// `shot.mjs` porte deja cette note — et je suis tombe dedans quand meme.
const mod = await import(pathToFileURL(trouve).href);
const chromium = mod.chromium ?? mod.default?.chromium;
if (!chromium) {
  console.error('playwright charge mais `chromium` absent — version incompatible ?');
  process.exit(3);
}

const navigateur = await chromium.launch({ headless: !HEADED });
const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
const page = await contexte.newPage();

/** Journal brut : tout ce que la console et le reseau crachent, horodate,
 *  pour pouvoir rattacher une erreur a l'app qui la provoque. */
const journal = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    journal.push({ t: Date.now(), type: m.type(), texte: m.text().slice(0, 400) });
  }
});
page.on('pageerror', (e) => {
  journal.push({ t: Date.now(), type: 'pageerror', texte: String(e.message).slice(0, 400) });
});
page.on('requestfailed', (r) => {
  journal.push({
    t: Date.now(),
    type: 'requestfailed',
    texte: `${r.method()} ${r.url().slice(0, 160)} — ${r.failure()?.errorText ?? '?'}`,
  });
});
page.on('response', (r) => {
  if (r.status() >= 400) {
    journal.push({ t: Date.now(), type: 'http', texte: `HTTP ${r.status()} ${r.url().slice(0, 160)}` });
  }
});

const depuis = (t0) => journal.filter((e) => e.t >= t0);

async function cliquerTexte(texte, timeout = 6000) {
  const cible = page.getByText(texte, { exact: true }).first();
  await cible.waitFor({ state: 'visible', timeout });
  await cible.click();
}

console.error(`[balayage] ${BASE}`);
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });

// --- entree dans le bureau de demonstration -------------------------------
try {
  await cliquerTexte('Decouvrir sans compte');
  await page.waitForTimeout(500);
  await cliquerTexte('Ouvrir le bureau');
} catch {
  console.error('[balayage] entree demo introuvable — deja connecte ? on continue.');
}
await page.waitForTimeout(2000);

// La visite guidee masque le bureau : on l'ecarte si elle est la.
try {
  await page.getByRole('button', { name: 'Plus tard' }).click({ timeout: 3000 });
} catch { /* pas de visite, tant mieux */ }
await page.waitForTimeout(400);

// --- inventaire des icones ------------------------------------------------
const icones = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[role="button"]'))
    .filter((e) => e.className && String(e.className).includes('absolute w-[86px]'))
    .map((e) => (e.textContent || '').trim())
    .filter(Boolean),
);

if (icones.length === 0) {
  console.error(
    '[balayage] ECHEC : aucune icone d app sur le bureau.\n' +
    'Le selecteur a peut-etre change. On sort en erreur plutot que de rendre ' +
    '« 0 defaut » — un instrument qui ne trouve rien ne doit jamais passer au vert.',
  );
  await navigateur.close();
  process.exit(4);
}
console.error(`[balayage] ${icones.length} apps sur le bureau`);

const resultats = [];

/** Remet le bureau a nu.
 *
 *  Premiere version : `Escape` entre deux apps. Elle ne fermait RIEN — la
 *  fenetre de la premiere app restait ouverte et couvrait les icones, donc
 *  15 apps sur 20 n'ont jamais pu etre ouvertes. Le script a pourtant rendu
 *  « 0 app cassee », un vert qui voulait dire « je n'ai pas teste ».
 *
 *  On recharge la page : c'est plus lent qu'un clic sur la croix, mais c'est
 *  la seule remise a zero qui ne depende d'aucun selecteur de chrome de
 *  fenetre. Le mode demo persiste en localStorage, donc le rechargement
 *  retombe directement sur le bureau. */
async function bureauPropre() {
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  try {
    await cliquerTexte('Decouvrir sans compte', 2500);
    await page.waitForTimeout(400);
    await cliquerTexte('Ouvrir le bureau', 2500);
    await page.waitForTimeout(1200);
  } catch { /* deja sur le bureau */ }
  try {
    await page.getByRole('button', { name: 'Plus tard' }).click({ timeout: 2000 });
  } catch { /* pas de visite guidee */ }
  await page.waitForTimeout(300);
}

for (const nom of icones) {
  const t0 = Date.now();
  const r = { app: nom, ouverte: false, ecranErreur: false, sections: [], erreurs: [] };

  await bureauPropre();

  try {
    // `nom` peut contenir des metacaracteres de regex (« IT / R&D »,
    // « People / Agents »). On echappe, sinon le locator vise a cote.
    const motif = new RegExp(`^${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const icone = page.locator('[role="button"]', { hasText: motif }).first();
    await icone.dblclick({ timeout: 8000 });
    await page.waitForTimeout(ATTENTE);
    r.ouverte = true;
  } catch (e) {
    r.erreurs.push(`ouverture impossible : ${String(e).slice(0, 160)}`);
    resultats.push(r);
    continue;
  }

  r.ecranErreur = await page.evaluate(() => document.body.innerText.includes('hit a snag'));

  const sections = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-section]')).map((e) =>
      e.getAttribute('data-section'),
    ),
  );

  for (const s of sections) {
    const t1 = Date.now();
    try {
      await page.locator(`[data-section="${s}"]`).first().click({ timeout: 5000 });
      await page.waitForTimeout(600);
      const casse = await page.evaluate(() => document.body.innerText.includes('hit a snag'));
      r.sections.push({
        nom: s,
        ecranErreur: casse,
        erreurs: depuis(t1).map((e) => `${e.type}: ${e.texte}`),
      });
    } catch (e) {
      r.sections.push({ nom: s, ecranErreur: null, erreurs: [`clic impossible : ${String(e).slice(0, 120)}`] });
    }
  }

  r.erreurs.push(...depuis(t0).map((e) => `${e.type}: ${e.texte}`));
  resultats.push(r);
  const nbSectionsCassees = r.sections.filter((s) => s.ecranErreur).length;
  console.error(
    `  ${r.ecranErreur ? 'CASSE' : 'ok   '} ${nom.padEnd(18)} ` +
    `${r.sections.length} sections, ${nbSectionsCassees} cassees, ${r.erreurs.length} erreurs`,
  );
}

// --- rapport --------------------------------------------------------------
const nonOuvertes = resultats.filter((r) => !r.ouverte);
const appsCassees = resultats.filter((r) => r.ecranErreur);
const sectionsCassees = resultats.flatMap((r) =>
  r.sections.filter((s) => s.ecranErreur).map((s) => ({ app: r.app, section: s.nom })),
);
const totalSections = resultats.reduce((n, r) => n + r.sections.length, 0);

const lignes = [];
lignes.push('# Balayage production — toutes les apps, toutes les sections');
lignes.push('');
lignes.push(`Cible : ${BASE}`);
lignes.push('');
lignes.push('| Mesure | Valeur |');
lignes.push('|---|---|');
lignes.push(`| Apps sur le bureau | ${resultats.length} |`);
lignes.push(`| Apps **reellement ouvertes** | ${resultats.length - nonOuvertes.length} |`);
lignes.push(`| Apps qui n ont pas pu s ouvrir | ${nonOuvertes.length} |`);
lignes.push(`| Apps montrant l ecran d erreur | ${appsCassees.length} |`);
lignes.push(`| Sections activees | ${totalSections} |`);
lignes.push(`| Sections montrant l ecran d erreur | ${sectionsCassees.length} |`);
lignes.push('');

if (nonOuvertes.length) {
  lignes.push('> ⚠️ **Couverture partielle — ce rapport ne conclut rien sur ces apps.**');
  lignes.push('>');
  lignes.push(`> ${nonOuvertes.length} apps ne se sont pas ouvertes : ` +
    nonOuvertes.map((r) => r.app).join(', ') + '.');
  lignes.push('>');
  lignes.push('> « 0 defaut » sur une app non ouverte veut dire « non teste », pas « sain ».');
  lignes.push('');
}

if (appsCassees.length || sectionsCassees.length) {
  lignes.push('## Ce qui casse');
  lignes.push('');
  for (const r of resultats) {
    const ss = r.sections.filter((s) => s.ecranErreur);
    if (!r.ecranErreur && ss.length === 0) continue;
    lignes.push(`### ${r.app}`);
    if (r.ecranErreur) lignes.push('- **l app entiere** montre « This app hit a snag »');
    for (const s of ss) {
      lignes.push(`- section **${s.nom}**`);
      for (const e of s.erreurs.slice(0, 4)) lignes.push(`  - \`${e}\``);
    }
    lignes.push('');
  }
} else {
  lignes.push('## Aucune app ne montre l ecran d erreur');
  lignes.push('');
  lignes.push('Le balayage n a declenche aucun « hit a snag ». Si l utilisateur en voit,');
  lignes.push('c est que le declencheur depend de donnees reelles (session connectee,');
  lignes.push('tenant particulier) ou d une vue de detail que ce balayage n atteint pas.');
  lignes.push('');
}

lignes.push('## Erreurs de console et de reseau, par app');
lignes.push('');
for (const r of resultats) {
  if (!r.erreurs.length) continue;
  lignes.push(`### ${r.app}`);
  for (const e of [...new Set(r.erreurs)].slice(0, 10)) lignes.push(`- \`${e}\``);
  lignes.push('');
}

const dossier = path.dirname(OUT);
if (dossier && dossier !== '.') mkdirSync(dossier, { recursive: true });
writeFileSync(OUT, lignes.join('\n'), 'utf8');
writeFileSync(OUT.replace(/\.md$/, '.json'), JSON.stringify(resultats, null, 2), 'utf8');

console.error('');
console.error(
  `[balayage] ${resultats.length - nonOuvertes.length}/${resultats.length} apps ouvertes · ` +
  `${totalSections} sections · ${appsCassees.length} apps cassees · ` +
  `${sectionsCassees.length} sections cassees`,
);
console.error(`[balayage] rapport : ${OUT}`);

await navigateur.close();

// Code de sortie : une couverture partielle N'EST PAS un succes. Sans ca, une
// chaine automatique lirait « exit 0 » et conclurait que tout va bien alors
// que les trois quarts des apps n'ont jamais ete ouvertes — c'est exactement
// ce qui s'est produit au premier passage.
if (nonOuvertes.length) {
  console.error(
    `[balayage] ECHEC DE COUVERTURE : ${nonOuvertes.length} apps non ouvertes ` +
    `(${nonOuvertes.map((r) => r.app).join(', ')}).`,
  );
  process.exit(5);
}
if (appsCassees.length || sectionsCassees.length) process.exit(1);
