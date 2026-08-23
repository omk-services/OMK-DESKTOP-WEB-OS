#!/usr/bin/env node
// Noyau minimal du runtime ambiant — zero dependance, Node 16+.
//
// Ce n'est pas une maquette : il valide reellement les evenements contre leurs
// schemas, applique la regle de portique de facon deterministe, et ecrit un
// journal causal append-only. Il tourne aujourd'hui, sans Zeta installe.
//
//   node kernel.mjs --watch          surveille 03_Master_Agreements/
//   node kernel.mjs --simule <f>     rejoue un depot sans toucher au disque reel
//   node kernel.mjs --journal        relit le journal causal
//   node kernel.mjs --autotest       valide schemas + regle de portique
//
// Le journal est la memoire. La fenetre de contexte ne l'est pas.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const COACH = join(ICI, '..');
const PORTAIL = join(COACH, '00_Summers_CEO', '03_Master_Agreements');
const ETAT = join(ICI, '.etat');
const JOURNAL = join(ETAT, 'journal.jsonl');

// --- Journal immuable et causal -------------------------------------------
// Rien n'est ecrase. Chaque evenement porte l'identifiant de celui qui l'a
// declenche. C'est ce qui rend un post-mortem possible sans reconstituer une
// session de chat.

function idContenu(objet) {
  return createHash('sha256').update(JSON.stringify(objet)).digest('hex').slice(0, 12);
}

function emettre(type, charge, causePar = null) {
  mkdirSync(ETAT, { recursive: true });
  const ev = {
    id: idContenu({ type, charge, causePar }),
    type,
    cause_par: causePar,
    emis_a: new Date().toISOString(),
    charge,
  };
  const verdict = valider(type, charge);
  if (!verdict.ok) {
    // Frontiere typee : un evenement malforme n'entre pas dans le journal.
    // 20 % des evenements revenaient malformes sans cette barriere.
    const rejet = { ...ev, type: 'kernel.event.rejected', motif: verdict.erreurs };
    appendFileSync(JOURNAL, JSON.stringify(rejet) + '\n');
    return { ok: false, erreurs: verdict.erreurs, ev: rejet };
  }
  appendFileSync(JOURNAL, JSON.stringify(ev) + '\n');
  return { ok: true, ev };
}

// --- Validation de schema (sous-ensemble suffisant, sans dependance) -------

function chargerSchema(type) {
  const p = join(ICI, 'agents', 'events', `${type}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function valider(type, charge) {
  const s = chargerSchema(type);
  if (!s) return { ok: false, erreurs: [`schema introuvable : ${type}`] };
  const erreurs = [];

  for (const champ of s.required || []) {
    if (charge[champ] === undefined) erreurs.push(`champ requis absent : ${champ}`);
  }
  if (s.additionalProperties === false) {
    for (const k of Object.keys(charge)) {
      if (!s.properties?.[k]) erreurs.push(`champ inconnu : ${k}`);
    }
  }
  for (const [k, v] of Object.entries(charge)) {
    const d = s.properties?.[k];
    if (!d) continue;
    if (d.type === 'string' && typeof v !== 'string') erreurs.push(`${k} doit etre une chaine`);
    if (d.type === 'boolean' && typeof v !== 'boolean') erreurs.push(`${k} doit etre un booleen`);
    if (d.type === 'integer' && !Number.isInteger(v)) erreurs.push(`${k} doit etre un entier`);
    if (d.type === 'array' && !Array.isArray(v)) erreurs.push(`${k} doit etre un tableau`);
    if (d.minLength !== undefined && typeof v === 'string' && v.length < d.minLength)
      erreurs.push(`${k} : ${v.length} caracteres, minimum ${d.minLength}`);
    if (d.minimum !== undefined && typeof v === 'number' && v < d.minimum)
      erreurs.push(`${k} sous le minimum ${d.minimum}`);
    if (d.pattern && typeof v === 'string' && !new RegExp(d.pattern).test(v))
      erreurs.push(`${k} ne respecte pas le motif ${d.pattern}`);
    if (d.enum && !d.enum.includes(v)) erreurs.push(`${k} hors enum : ${v}`);
    if (d.items?.enum && Array.isArray(v)) {
      for (const el of v) if (!d.items.enum.includes(el)) erreurs.push(`${k} contient une valeur hors enum : ${el}`);
    }
  }
  return { ok: erreurs.length === 0, erreurs };
}

// --- Agent : aquaman-intake ------------------------------------------------
// Inventorie. Ne juge pas. C'est l'absence qui declenche le veto.

const CLASSES_SENSIBLES = ['privacy', 'ip', 'claims'];

function intake(evDeclencheur) {
  const { chemin, nom_fichier } = evDeclencheur.charge;
  let texte = '';
  try {
    texte = existsSync(chemin) ? readFileSync(chemin, 'utf8') : '';
  } catch { texte = ''; }
  const bas = texte.toLowerCase();

  const perimetre_ecrit = /p[eé]rim[eè]tre|scope of work|prestations? couvertes?/.test(bas);
  const proprietaire_livrable = /propri[eé]t[eé] (du|des) livrable|ownership|titularit[eé]/.test(bas);

  const surfaces = [];
  if (/rgpd|gdpr|donn[eé]es personnelles|privacy/.test(bas)) surfaces.push('privacy');
  if (/propri[eé]t[eé] intellectuelle|licence|brevet/.test(bas)) surfaces.push('ip');
  if (/garantie de r[eé]sultat|promesse|claim/.test(bas)) surfaces.push('claims');
  if (/conditions g[eé]n[eé]rales|cgv|terms/.test(bas)) surfaces.push('terms');

  const manques = [];
  if (!texte) manques.push('document illisible ou vide : lecture impossible');
  if (!perimetre_ecrit) manques.push('aucune section ne definit le perimetre livre');
  if (!proprietaire_livrable) manques.push('propriete du livrable non stipulee');
  if (!/dur[eé]e|[eé]ch[eé]ance|r[eé]siliation/.test(bas)) manques.push('duree et conditions de sortie absentes');

  return emettre('legal.scope.needs_review', {
    contrat_ref: nom_fichier,
    perimetre_ecrit,
    proprietaire_livrable,
    surfaces_touchees: surfaces,
    manques,
    cause_par: evDeclencheur.id,
  }, evDeclencheur.id);
}

// --- Agent : aquaman-gate --------------------------------------------------
// Regle deterministe. Un portique qui depend de l'humeur du modele n'en est pas un.

function portique(evScope, shadow = true) {
  const c = evScope.charge;
  let statut, motif;

  if (!c.perimetre_ecrit) {
    statut = 'BLOCKED_RISK';
    motif = 'veto categoriel : engagement sans perimetre ecrit. ' + c.manques.join(' ; ');
  } else if (!c.proprietaire_livrable) {
    statut = 'BLOCKED_RISK';
    motif = 'veto categoriel : propriete du livrable non stipulee. ' + c.manques.join(' ; ');
  } else if ((c.manques || []).length > 0 || (c.surfaces_touchees || []).some(s => CLASSES_SENSIBLES.includes(s))) {
    statut = 'NEEDS_REVIEW';
    motif = 'surface a examiner : ' + (c.manques.length ? c.manques.join(' ; ') : c.surfaces_touchees.join(', '));
  } else {
    statut = 'LEGAL_READY';
    motif = 'perimetre tenu, propriete stipulee, aucune surface sensible non couverte';
  }

  return emettre('legal.gate', {
    contrat_ref: c.contrat_ref,
    statut,
    motif,
    shadow,
    surfaces_verifiees: c.surfaces_touchees || [],
    cause_par: evScope.id,
    decide_a: new Date().toISOString(),
  }, evScope.id);
}

// --- Flux complet ----------------------------------------------------------

function traiter(chemin) {
  const r1 = emettre('contract.master_agreement.received', {
    chemin,
    nom_fichier: basename(chemin),
    detecte_a: new Date().toISOString(),
    taille_octets: existsSync(chemin) ? Math.max(1, readFileSync(chemin).length) : 1,
  });
  if (!r1.ok) return console.error('REJET declencheur :', r1.erreurs);

  const r2 = intake(r1.ev);
  if (!r2.ok) return console.error('REJET scope :', r2.erreurs);

  const r3 = portique(r2.ev);
  if (!r3.ok) return console.error('REJET portique :', r3.erreurs);

  console.log(`${r3.ev.charge.statut}${r3.ev.charge.shadow ? ' (shadow)' : ''} — ${r3.ev.charge.motif}`);
  console.log(`chaine causale : ${r1.ev.id} -> ${r2.ev.id} -> ${r3.ev.id}`);
  return r3.ev;
}

// --- Autotest --------------------------------------------------------------

function autotest() {
  let ok = 0, ko = 0;
  const t = (nom, cond) => { if (cond) { ok++; console.log(`  OK   ${nom}`); } else { ko++; console.log(`  ECHEC ${nom}`); } };

  console.log('schemas');
  for (const s of ['contract.master_agreement.received', 'legal.scope.needs_review', 'legal.gate'])
    t(s, chargerSchema(s) !== null);

  console.log('frontiere typee');
  t('rejette un champ inconnu', !valider('legal.gate', { bidon: true }).ok);
  t('rejette un statut hors enum', !valider('legal.gate', {
    contrat_ref: 'x', statut: 'INVENTE', motif: 'assez long ici', shadow: true,
    cause_par: 'a', decide_a: new Date().toISOString() }).ok);
  t('rejette un motif trop court', !valider('legal.gate', {
    contrat_ref: 'x', statut: 'BLOCKED_RISK', motif: 'court', shadow: true,
    cause_par: 'a', decide_a: new Date().toISOString() }).ok);
  t('accepte un evenement conforme', valider('legal.gate', {
    contrat_ref: 'x', statut: 'LEGAL_READY', motif: 'perimetre tenu et propriete stipulee',
    shadow: true, cause_par: 'a', decide_a: new Date().toISOString() }).ok);

  console.log('regle de portique');
  const g = (c) => portique({ id: 'test', charge: { contrat_ref: 't', manques: [], surfaces_touchees: [], ...c } }).ev.charge.statut;
  t('sans perimetre -> BLOCKED_RISK', g({ perimetre_ecrit: false, proprietaire_livrable: true }) === 'BLOCKED_RISK');
  t('sans proprietaire -> BLOCKED_RISK', g({ perimetre_ecrit: true, proprietaire_livrable: false }) === 'BLOCKED_RISK');
  t('surface privacy -> NEEDS_REVIEW', g({ perimetre_ecrit: true, proprietaire_livrable: true, surfaces_touchees: ['privacy'] }) === 'NEEDS_REVIEW');
  t('complet -> LEGAL_READY', g({ perimetre_ecrit: true, proprietaire_livrable: true }) === 'LEGAL_READY');

  console.log('dormance');
  const n = existsSync(PORTAIL) ? readdirSync(PORTAIL).filter(f => f !== 'README.md').length : 0;
  t(`portail vide -> aucune activation (${n} contrat)`, n === 0);

  console.log(`\n${ok} reussites, ${ko} echecs`);
  process.exit(ko === 0 ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------

const a = process.argv.slice(2);
if (a.includes('--autotest')) autotest();
else if (a.includes('--journal')) {
  if (!existsSync(JOURNAL)) { console.log('journal vide'); process.exit(0); }
  for (const l of readFileSync(JOURNAL, 'utf8').trim().split('\n').filter(Boolean)) {
    const e = JSON.parse(l);
    console.log(`${e.emis_a} ${e.id} ${e.type}${e.cause_par ? ` <- ${e.cause_par}` : ''}`);
  }
} else if (a.includes('--simule')) {
  const f = a[a.indexOf('--simule') + 1];
  if (!f) { console.error('usage : --simule <chemin>'); process.exit(2); }
  traiter(f);
} else if (a.includes('--watch')) {
  console.log(`surveillance de ${PORTAIL}`);
  const vus = new Set(existsSync(PORTAIL) ? readdirSync(PORTAIL) : []);
  setInterval(() => {
    if (!existsSync(PORTAIL)) return;
    for (const f of readdirSync(PORTAIL)) {
      if (vus.has(f) || f === 'README.md') continue;
      vus.add(f);
      console.log(`\ndepot detecte : ${f}`);
      traiter(join(PORTAIL, f));
    }
  }, 3000);
} else {
  console.log('usage : --watch | --simule <fichier> | --journal | --autotest');
}
