#!/usr/bin/env node
// Bridge d'agnosticite de harnais — zero dependance, Node 16+.
//
// L'adaptateur Coach OS expose UN registre d'outils sur plusieurs surfaces.
// Ce bridge ajoute l'axe manquant : le meme travail doit pouvoir etre execute
// par n'importe quel harnais, et atteint par n'importe quelle surface.
//
// PRINCIPE : l'agnosticite est une NEGOCIATION DE CAPACITES, pas un switch.
// Un `switch (harnais)` serait l'inverse d'un adaptateur — chaque nouveau
// harnais forcerait une edition de code. Ici, ajouter un harnais est une
// entree JSON, et le routage continue de fonctionner sans recompilation.
//
//   node bridge.mjs --harnesses                liste les harnais
//   node bridge.mjs --surfaces                 liste les surfaces par etage
//   node bridge.mjs --route '<json de travail>'  choisit un harnais
//   node bridge.mjs --matrice                  matrice harnais x surfaces
//   node bridge.mjs --autotest

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const H = JSON.parse(readFileSync(join(ICI, 'harnesses.json'), 'utf8'));
const S = JSON.parse(readFileSync(join(ICI, 'surfaces.json'), 'utf8'));

const HARNAIS = H.harnesses;
const SURFACES = S.surfaces;
const CAPACITES = H.$capacites_canoniques;

// Un harnais mesure est prefere a un declare, lui-meme prefere a un suppose.
// C'est la meme echelle de confiance que le champ `verified` du format OKF :
// une affirmation mesuree et une affirmation supposee ne se ressemblent jamais.
const POIDS_STATUT = { mesure: 3, declare: 2, suppose: 1 };

// --- Routage ---------------------------------------------------------------

/**
 * Un travail declare ce dont il A BESOIN, jamais QUI doit l'executer.
 * C'est ce qui rend la substitution possible sans reecrire le travail.
 *
 *   { id, besoins: [capacites], surface?: id, interdits?: [ids] }
 */
function router(travail) {
  const besoins = travail.besoins || [];
  const inconnues = besoins.filter(b => !CAPACITES.includes(b));
  if (inconnues.length) {
    return { ok: false, motif: `capacite hors vocabulaire canonique : ${inconnues.join(', ')}` };
  }

  const interdits = new Set(travail.interdits || []);
  const candidats = HARNAIS
    .filter(h => !interdits.has(h.id))
    .filter(h => besoins.every(b => h.capacites.includes(b)))
    .filter(h => !travail.surface || h.surfaces.includes(travail.surface))
    .map(h => ({
      harnais: h,
      score: POIDS_STATUT[h.statut] * 10 + h.capacites.length,
    }))
    .sort((a, b) => b.score - a.score);

  if (!candidats.length) {
    // Echec explicite et diagnostique. Un routage qui retombe silencieusement
    // sur un defaut est pire qu'une absence de routage : il ment sur ce qui a
    // execute le travail.
    const parCapacite = besoins.map(b => `${b}: ${HARNAIS.filter(h => h.capacites.includes(b)).length} harnais`);
    return {
      ok: false,
      motif: 'aucun harnais ne couvre l ensemble des besoins',
      diagnostic: parCapacite,
      surface_demandee: travail.surface || null,
    };
  }

  return {
    ok: true,
    elu: candidats[0].harnais,
    replis: candidats.slice(1).map(c => c.harnais.id),
    raison: `statut=${candidats[0].harnais.statut}, ${candidats[0].harnais.capacites.length} capacites`,
  };
}

// --- Vues ------------------------------------------------------------------

function listerHarnais() {
  const ordre = { mesure: 0, declare: 1, suppose: 2 };
  for (const h of [...HARNAIS].sort((a, b) => ordre[a.statut] - ordre[b.statut])) {
    const m = h.statut === 'mesure' ? `mesure ${h.mesure_le}` : h.statut;
    console.log(`${h.id.padEnd(14)} ${m.padEnd(18)} ${h.invocation.type.padEnd(8)} ${h.capacites.join(',')}`);
  }
  console.log(`\n${HARNAIS.length} harnais — ${HARNAIS.filter(h => h.statut === 'mesure').length} mesures`);
}

function listerSurfaces() {
  for (const [etage, desc] of Object.entries(S.$etages)) {
    console.log(`\n[${etage}] ${desc}`);
    for (const s of SURFACES.filter(x => x.etage === etage)) {
      console.log(`  ${s.id.padEnd(8)} ${s.direction.padEnd(22)} ${s.statut}`);
    }
  }
}

function matrice() {
  const ids = SURFACES.map(s => s.id);
  console.log('harnais'.padEnd(14) + ids.map(i => i.slice(0, 6).padEnd(7)).join(''));
  for (const h of HARNAIS) {
    console.log(h.id.padEnd(14) + ids.map(i => (h.surfaces.includes(i) ? 'X' : '.').padEnd(7)).join(''));
  }
  console.log('\nUne colonne vide est une surface que personne ne parle : soit elle');
  console.log('est prematuree, soit un harnais manque. Une ligne pauvre est un');
  console.log('harnais mal decrit, pas forcement un harnais faible.');
}

// --- Autotest --------------------------------------------------------------

function autotest() {
  let ok = 0, ko = 0;
  const t = (n, c) => { if (c) { ok++; console.log(`  OK    ${n}`); } else { ko++; console.log(`  ECHEC ${n}`); } };

  console.log('registre');
  t(`${HARNAIS.length} harnais charges`, HARNAIS.length >= 13);
  t(`${SURFACES.length} surfaces chargees`, SURFACES.length >= 8);
  t('identifiants uniques', new Set(HARNAIS.map(h => h.id)).size === HARNAIS.length);
  t('toute capacite declaree est canonique',
    HARNAIS.every(h => h.capacites.every(c => CAPACITES.includes(c))));
  t('toute surface referencee existe',
    HARNAIS.every(h => h.surfaces.every(s => SURFACES.some(x => x.id === s))));
  t('tout statut est valide',
    HARNAIS.every(h => ['mesure', 'declare', 'suppose'].includes(h.statut)));
  t('un harnais mesure porte une date',
    HARNAIS.filter(h => h.statut === 'mesure').every(h => !!h.mesure_le));

  console.log('routage');
  const r1 = router({ id: 'edition', besoins: ['file_edit', 'shell'] });
  t('un travail d edition trouve un harnais', r1.ok);
  t('le mesure est prefere au suppose', r1.ok && r1.elu.statut === 'mesure');
  t('des replis sont proposes', r1.ok && r1.replis.length > 0);

  const r2 = router({ id: 'impossible', besoins: ['file_edit', 'voice', 'cron'] });
  t('une combinaison introuvable echoue explicitement', !r2.ok && !!r2.diagnostic);

  const r3 = router({ id: 'inconnu', besoins: ['teleportation'] });
  t('une capacite hors vocabulaire est refusee', !r3.ok);

  const r4 = router({ id: 'exclu', besoins: ['file_edit', 'shell'], interdits: ['claude-code'] });
  t('un harnais interdit est ecarte', r4.ok && r4.elu.id !== 'claude-code');

  const r5 = router({ id: 'par-surface', besoins: ['tool_call'], surface: 'acp' });
  t('le filtrage par surface fonctionne', r5.ok && r5.elu.surfaces.includes('acp'));

  console.log('agnosticite');
  t('aucun identifiant de harnais code en dur dans le routeur',
    !router.toString().match(/claude-code|codex|cursor|multica/));

  console.log('veto');
  const a2p = SURFACES.find(s => s.id === 'a2p');
  t('la surface de paiement porte un veto ecrit', /VETO/i.test(a2p.note));

  console.log(`\n${ok} reussites, ${ko} echecs`);
  process.exit(ko === 0 ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------

const a = process.argv.slice(2);
if (a.includes('--autotest')) autotest();
else if (a.includes('--harnesses')) listerHarnais();
else if (a.includes('--surfaces')) listerSurfaces();
else if (a.includes('--matrice')) matrice();
else if (a.includes('--route')) {
  const j = a[a.indexOf('--route') + 1];
  if (!j) { console.error('usage : --route \'{"besoins":["file_edit"]}\''); process.exit(2); }
  const r = router(JSON.parse(j));
  if (r.ok) {
    console.log(`elu    : ${r.elu.id} (${r.raison})`);
    console.log(`via    : ${r.elu.invocation.type} -> ${r.elu.invocation.cible}`);
    console.log(`replis : ${r.replis.join(', ') || 'aucun'}`);
  } else {
    console.log(`refus  : ${r.motif}`);
    if (r.diagnostic) console.log(`         ${r.diagnostic.join(' | ')}`);
    process.exit(1);
  }
} else {
  console.log('usage : --harnesses | --surfaces | --matrice | --route <json> | --autotest');
}

export { router, HARNAIS, SURFACES, CAPACITES };
