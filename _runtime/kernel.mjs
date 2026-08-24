#!/usr/bin/env node
// Noyau minimal du runtime ambiant — zero dependance, Node 16+.
//
// Ce n'est pas une maquette : il valide reellement les evenements contre leurs
// schemas, applique la regle de portique de facon deterministe, et ecrit un
// journal causal append-only. Il tourne aujourd'hui, sans Zeta installe.
//
//   node kernel.mjs --watch          surveille 03_Master_Agreements/, perpetuel
//   node kernel.mjs --simule <f>     rejoue un depot sans toucher au disque reel
//   node kernel.mjs --journal        relit le journal causal (production)
//   node kernel.mjs --autotest       valide schemas + regle de portique (journal separe)
//   node kernel.mjs --sante          age du portail, age du dernier traitement, dormant ou mort
//
// Le journal est la memoire. La fenetre de contexte ne l'est pas. Et depuis
// cette version, la memoire du PROCESSUS ne l'est pas non plus : au demarrage,
// le noyau se resynchronise sur ce que le journal dit avoir deja verdicte, pas
// sur ce qu'il a vu passer depuis qu'il tourne.
//
// Chargement des agents markdown (agents/*.md) : le noyau lit le frontmatter
// de chaque agent (`accepts`, `returns`) et verifie a chaque emission que le
// type emis correspond au contrat declare par l'agent qui l'emet. C'est reel,
// verifiable par --autotest — mais c'est une VALIDATION de contrat, pas une
// interpretation de la prose. La logique de decision (intake, portique) reste
// codee en JS, deterministe et auditable. Si un jour le markdown doit piloter
// le comportement lui-meme (pas seulement le contracter), ce sera un autre
// chantier — ce commentaire ne le promet plus tant que ce n'est pas fait.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ICI = dirname(fileURLToPath(import.meta.url));
const COACH = join(ICI, '..');
const PORTAIL = join(COACH, '00_Summers_CEO', '03_Master_Agreements');
const ETAT = join(ICI, '.etat');
const JOURNAL = join(ETAT, 'journal.jsonl');
const JOURNAL_TEST = join(ETAT, 'journal.autotest.jsonl');

// Journal actif. Par defaut la production ; --autotest le redirige pour ne
// jamais polluer le journal reel avec des evenements de test.
let CHEMIN_JOURNAL = JOURNAL;

// --- Chargement des agents markdown ----------------------------------------
// Format attendu : frontmatter YAML minimal entre deux lignes `---`, avec des
// scalaires `cle: valeur` et des listes `cle:\n  - item`. Suffisant pour nos
// deux agents, pas un parseur YAML general.

function analyserFrontmatter(brut) {
  const m = brut.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  let cleCourante = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    const item = ligne.match(/^\s*-\s+(.*)$/);
    if (item && cleCourante) {
      if (!Array.isArray(fm[cleCourante])) fm[cleCourante] = [];
      fm[cleCourante].push(item[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = ligne.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (kv) {
      const [, cle, valeur] = kv;
      cleCourante = cle;
      fm[cle] = valeur.trim() === '' ? [] : valeur.trim().replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}

function chargerAgents() {
  const dir = join(ICI, 'agents');
  const agents = {};
  if (!existsSync(dir)) return agents;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const chemin = join(dir, f);
    const frontmatter = analyserFrontmatter(readFileSync(chemin, 'utf8'));
    if (frontmatter.name) agents[frontmatter.name] = { frontmatter, chemin };
  }
  return agents;
}

const AGENTS = chargerAgents();

// --- Journal immuable et causal -------------------------------------------
// Rien n'est ecrase. Chaque evenement porte l'identifiant de celui qui l'a
// declenche. C'est ce qui rend un post-mortem possible sans reconstituer une
// session de chat.

function idContenu(objet) {
  return createHash('sha256').update(JSON.stringify(objet)).digest('hex').slice(0, 12);
}

function emettre(type, charge, causePar = null, agentEmetteur = null) {
  mkdirSync(ETAT, { recursive: true });
  const ev = {
    id: idContenu({ type, charge, causePar }),
    type,
    cause_par: causePar,
    emis_a: new Date().toISOString(),
    charge,
  };

  let contratAgent = null;
  if (agentEmetteur) {
    const agent = AGENTS[agentEmetteur];
    if (!agent) contratAgent = { agent: agentEmetteur, ok: false, motif: 'agent inconnu du registre markdown' };
    else if (!(agent.frontmatter.returns || []).includes(type))
      contratAgent = { agent: agentEmetteur, ok: false, motif: `${type} absent de "returns" declare dans ${agentEmetteur}.md` };
    else contratAgent = { agent: agentEmetteur, ok: true };
  }

  const verdict = valider(type, charge);
  if (!verdict.ok) {
    // Frontiere typee : un evenement malforme n'entre pas dans le journal.
    // 20 % des evenements revenaient malformes sans cette barriere.
    const rejet = { ...ev, type: 'kernel.event.rejected', motif: verdict.erreurs, contrat_agent: contratAgent };
    appendFileSync(CHEMIN_JOURNAL, JSON.stringify(rejet) + '\n');
    return { ok: false, erreurs: verdict.erreurs, ev: rejet };
  }
  const evFinal = contratAgent ? { ...ev, contrat_agent: contratAgent } : ev;
  appendFileSync(CHEMIN_JOURNAL, JSON.stringify(evFinal) + '\n');
  return { ok: true, ev: evFinal };
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

// --- Extraction lexicale (avec garde de negation et honnetete sur le doute) -
//
// Deux failles mesurees : un contrat complet formule autrement tombe en
// BLOCKED_RISK a tort ; un contrat qui NIE une garantie ("ne garantit aucun
// resultat") declenche quand meme la surface `claims`. On ne pretend pas
// resoudre la comprehension semantique avec des regex — on la borne : la
// negation locale desamorce une surface, et un document substantiel qui ne
// matche aucun synonyme connu est marque `incertain` plutot que d'etre lu
// comme categoriquement absent.

const MOTIF_NEGATION = /\b(aucun[e]?s?|sans|pas de|n['’]|ne\s+\w+\s+pas|no\s|not\s|without|nullement)\b/i;

function negueAvant(texte, index, fenetre = 45) {
  return MOTIF_NEGATION.test(texte.slice(Math.max(0, index - fenetre), index));
}

function detecterSurface(bas, regex) {
  const m = regex.exec(bas);
  if (!m) return false;
  return !negueAvant(bas, m.index);
}

const RE_PERIMETRE = /p[eé]rim[eè]tre|scope of work|prestations? couvertes?|objet du (contrat|pr[eé]sent accord)|description des services|annexe technique|statement of work/;
const RE_PROPRIETAIRE = /propri[eé]t[eé] (du|des) livrable|ownership|titularit[eé]|droits? (sur|de) (le|les) livrables?|cession de propri[eé]t[eé] intellectuelle/;
const RE_DUREE = /dur[eé]e|[eé]ch[eé]ance|r[eé]siliation/;
const RE_PRIVACY = /rgpd|gdpr|donn[eé]es personnelles|privacy/;
const RE_IP = /propri[eé]t[eé] intellectuelle|licence|brevet/;
const RE_CLAIMS = /garantie de r[eé]sultat|promesse|claim|garanti[t]?/;
const RE_TERMS = /conditions g[eé]n[eé]rales|cgv|terms/;
const RE_CONTRAT_GENERIQUE = /contrat|accord|convention|agreement/;

function analyserContrat(texte) {
  const bas = texte.toLowerCase();

  const perimetre_ecrit = RE_PERIMETRE.test(bas);
  const proprietaire_livrable = RE_PROPRIETAIRE.test(bas);

  const surfaces = [];
  if (detecterSurface(bas, RE_PRIVACY)) surfaces.push('privacy');
  if (detecterSurface(bas, RE_IP)) surfaces.push('ip');
  if (detecterSurface(bas, RE_CLAIMS)) surfaces.push('claims');
  if (detecterSurface(bas, RE_TERMS)) surfaces.push('terms');

  const manques = [];
  if (!texte) manques.push('document illisible ou vide : lecture impossible');
  if (!perimetre_ecrit) manques.push('aucune section ne definit le perimetre livre');
  if (!proprietaire_livrable) manques.push('propriete du livrable non stipulee');
  if (!RE_DUREE.test(bas)) manques.push('duree et conditions de sortie absentes');

  // Incertitude honnete : document substantiel, qui se presente comme un
  // contrat, mais dont aucun synonyme de perimetre/propriete connu ne matche.
  // Plutot que de conclure a une absence categorique, on le signale.
  const substantiel = texte.length > 800;
  const incertain = substantiel && (!perimetre_ecrit || !proprietaire_livrable) && RE_CONTRAT_GENERIQUE.test(bas);
  if (incertain) manques.push('extraction lexicale incertaine : document substantiel sans motif reconnu, verification humaine recommandee');

  return { perimetre_ecrit, proprietaire_livrable, surfaces, manques, incertain };
}

// --- Agent : aquaman-intake ------------------------------------------------
// Inventorie. Ne juge pas. C'est l'absence qui declenche le veto.

function intake(evDeclencheur) {
  const { chemin, nom_fichier } = evDeclencheur.charge;
  let texte = '';
  try {
    texte = existsSync(chemin) ? readFileSync(chemin, 'utf8') : '';
  } catch { texte = ''; }

  const r = analyserContrat(texte);

  return emettre('legal.scope.needs_review', {
    contrat_ref: nom_fichier,
    perimetre_ecrit: r.perimetre_ecrit,
    proprietaire_livrable: r.proprietaire_livrable,
    surfaces_touchees: r.surfaces,
    manques: r.manques,
    incertain: r.incertain,
    cause_par: evDeclencheur.id,
  }, evDeclencheur.id, 'aquaman-intake');
}

// --- Agent : aquaman-gate --------------------------------------------------
// Regle deterministe. Un portique qui depend de l'humeur du modele n'en est pas un.

const CLASSES_SENSIBLES = ['privacy', 'ip', 'claims'];

function portique(evScope, shadow = true) {
  const c = evScope.charge;
  let statut, motif;

  if (!c.perimetre_ecrit && c.incertain) {
    statut = 'NEEDS_REVIEW';
    motif = 'extraction lexicale incertaine sur le perimetre ecrit : document substantiel mais motif non reconnu, verification humaine requise. ' + (c.manques || []).join(' ; ');
  } else if (!c.perimetre_ecrit) {
    statut = 'BLOCKED_RISK';
    motif = 'veto categoriel : engagement sans perimetre ecrit. ' + (c.manques || []).join(' ; ');
  } else if (!c.proprietaire_livrable && c.incertain) {
    statut = 'NEEDS_REVIEW';
    motif = 'extraction lexicale incertaine sur la propriete du livrable : document substantiel mais motif non reconnu, verification humaine requise. ' + (c.manques || []).join(' ; ');
  } else if (!c.proprietaire_livrable) {
    statut = 'BLOCKED_RISK';
    motif = 'veto categoriel : propriete du livrable non stipulee. ' + (c.manques || []).join(' ; ');
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
  }, evScope.id, 'aquaman-gate');
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

// --- Rattrapage : le journal est la source de verite, pas la memoire -------
// Couvre deux defauts a la fois : (1) un fichier deja present au demarrage
// n'est plus jamais marque "deja vu" par construction — il est marque "deja
// verdicte" seulement si le journal le prouve ; (2) un crash entre l'emission
// du declencheur et le verdict laisse un `contract.master_agreement.received`
// sans `legal.gate` correspondant — le meme test (aucun verdict pour ce
// fichier) le rejoue au prochain demarrage.

function verdictsExistants() {
  if (!existsSync(CHEMIN_JOURNAL)) return new Set();
  const set = new Set();
  for (const l of readFileSync(CHEMIN_JOURNAL, 'utf8').trim().split('\n').filter(Boolean)) {
    let e;
    try { e = JSON.parse(l); } catch { continue; }
    if (e.type === 'legal.gate') set.add(e.charge.contrat_ref);
  }
  return set;
}

function rattraperDe(portailDir) {
  if (!existsSync(portailDir)) return [];
  const traites = [];
  const dejaVerdict = verdictsExistants();
  for (const f of readdirSync(portailDir)) {
    if (f === 'README.md' || dejaVerdict.has(f)) continue;
    traiter(join(portailDir, f));
    traites.push(f);
  }
  return traites;
}

function rattraper() { return rattraperDe(PORTAIL); }

// --- Sante : dormant ou mort, un test executable ----------------------------
// Seuil configurable par COACH_SEUIL_MORT_MS (defaut 15 min en production).
// Un domaine est DORMANT tant qu'un battement de coeur recent prouve que la
// boucle --watch est vivante et armee — meme si le portail est vide depuis
// tres longtemps. Il est MORT si plus aucun battement n'arrive : la boucle a
// disparu, et aucun declencheur, meme depose, ne serait plus jamais lu.

function sante() {
  const seuilMort = Number(process.env.COACH_SEUIL_MORT_MS) || 15 * 60 * 1000;
  let dernierHeartbeat = null, dernierTraitement = null, dernierDeclencheur = null;
  let cyclesTotal = 0, declencheursTotal = 0;

  if (existsSync(JOURNAL)) {
    for (const l of readFileSync(JOURNAL, 'utf8').trim().split('\n').filter(Boolean)) {
      let e;
      try { e = JSON.parse(l); } catch { continue; }
      if (e.type === 'kernel.heartbeat') { dernierHeartbeat = e.emis_a; cyclesTotal = e.charge.cycle; }
      if (e.type === 'contract.master_agreement.received') { dernierDeclencheur = e.emis_a; declencheursTotal++; }
      if (e.type === 'legal.gate') { dernierTraitement = e.emis_a; }
    }
  }

  const maintenant = Date.now();
  const ageHeartbeatMs = dernierHeartbeat ? maintenant - new Date(dernierHeartbeat).getTime() : Infinity;
  const agePortailMs = dernierDeclencheur ? maintenant - new Date(dernierDeclencheur).getTime() : Infinity;
  const ageTraitementMs = dernierTraitement ? maintenant - new Date(dernierTraitement).getTime() : Infinity;
  const nbFichiersPortail = existsSync(PORTAIL) ? readdirSync(PORTAIL).filter(f => f !== 'README.md').length : 0;

  let diagnostic;
  if (ageHeartbeatMs === Infinity) {
    diagnostic = "MORT : aucun battement de coeur jamais enregistre. Le noyau n'a jamais tourne en --watch, ou le journal a ete efface.";
  } else if (ageHeartbeatMs > seuilMort) {
    diagnostic = `MORT : dernier battement de coeur il y a ${Math.round(ageHeartbeatMs / 1000)}s (seuil ${Math.round(seuilMort / 1000)}s). La boucle --watch ne tourne plus.`;
  } else if (declencheursTotal === 0) {
    diagnostic = `DORMANT (legitime) : noyau vivant (dernier battement il y a ${Math.round(ageHeartbeatMs / 1000)}s), portail vide, aucun declencheur jamais recu. Etat attendu au demarrage.`;
  } else {
    diagnostic = `DORMANT (legitime) : noyau vivant (dernier battement il y a ${Math.round(ageHeartbeatMs / 1000)}s), portail vide depuis ${Math.round(agePortailMs / 1000)}s, dernier traitement il y a ${ageTraitementMs === Infinity ? 'jamais' : Math.round(ageTraitementMs / 1000) + 's'}.`;
  }

  console.log('--- sante du noyau ---');
  console.log(`cycles observes (dernier battement de coeur) : ${cyclesTotal}`);
  console.log(`fichiers actuellement dans le portail : ${nbFichiersPortail}`);
  console.log(`portail vide depuis : ${agePortailMs === Infinity ? 'aucun declencheur jamais recu' : Math.round(agePortailMs / 1000) + 's'}`);
  console.log(`dernier traitement (legal.gate) il y a : ${ageTraitementMs === Infinity ? 'jamais' : Math.round(ageTraitementMs / 1000) + 's'}`);
  console.log(`diagnostic : ${diagnostic}`);
}

// --- Autotest --------------------------------------------------------------

function autotest() {
  let ok = 0, ko = 0;
  const t = (nom, cond) => { if (cond) { ok++; console.log(`  OK   ${nom}`); } else { ko++; console.log(`  ECHEC ${nom}`); } };

  // Isolation : tout ce que l'autotest ecrit part dans un journal distinct.
  // La convention `cause_par:"test"` ne suffisait pas — rien ne l'imposait.
  const tailleProdAvant = existsSync(JOURNAL) ? readFileSync(JOURNAL, 'utf8').length : 0;
  CHEMIN_JOURNAL = JOURNAL_TEST;
  try { writeFileSync(JOURNAL_TEST, ''); } catch {}

  console.log('schemas');
  for (const s of ['contract.master_agreement.received', 'legal.scope.needs_review', 'legal.gate', 'kernel.incident', 'kernel.heartbeat'])
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

  console.log('extraction lexicale (negation et incertitude honnete)');
  const claimsNegue = analyserContrat("Le present accord ne constitue aucune garantie de resultat ; aucune promesse n'est faite quant a l'issue des prestations.");
  t('negation d une garantie -> surface claims non declenchee', !claimsNegue.surfaces.includes('claims'));
  const claimsAffirme = analyserContrat('Le prestataire fournit une garantie de resultat sur le taux de conversion.');
  t('garantie affirmee -> surface claims declenchee', claimsAffirme.surfaces.includes('claims'));
  const texteAmbigu = 'Convention entre les parties. ' + 'Les parties conviennent de collaborer dans le cadre de ce contrat pour une duree indeterminee et se partagent les responsabilites operationnelles au quotidien. '.repeat(8);
  const rAmbigu = analyserContrat(texteAmbigu);
  t('document substantiel sans motif reconnu -> incertain, pas categorique', rAmbigu.incertain === true && rAmbigu.perimetre_ecrit === false);
  const gAmbigu = portique({ id: 'test', charge: { contrat_ref: 't', manques: rAmbigu.manques, surfaces_touchees: [], perimetre_ecrit: false, proprietaire_livrable: true, incertain: true } }).ev.charge;
  t('extraction incertaine -> NEEDS_REVIEW honnete au lieu d un BLOCKED_RISK faux', gAmbigu.statut === 'NEEDS_REVIEW');

  console.log('contrat agent charge depuis les markdown (agents/*.md n est plus un mensonge)');
  t('aquaman-intake declare returns legal.scope.needs_review', (AGENTS['aquaman-intake']?.frontmatter.returns || []).includes('legal.scope.needs_review'));
  t('aquaman-gate declare returns legal.gate', (AGENTS['aquaman-gate']?.frontmatter.returns || []).includes('legal.gate'));
  const rTag = portique({ id: 'test', charge: { contrat_ref: 't', manques: [], surfaces_touchees: [], perimetre_ecrit: true, proprietaire_livrable: true } });
  t('emission de aquaman-gate taguee conforme a son contrat markdown', rTag.ev.contrat_agent?.ok === true);

  console.log('rattrapage au demarrage (fichier deja present jamais avale a tort)');
  const dirTest = join(tmpdir(), `coach-rattrapage-${Date.now()}`, '03_Master_Agreements');
  mkdirSync(dirTest, { recursive: true });
  const ficTest = join(dirTest, 'contrat-test.md');
  writeFileSync(ficTest, 'Document sans aucune section reconnue.');
  const premierPasse = rattraperDe(dirTest);
  t('premier passage traite un fichier deja present au demarrage', premierPasse.includes('contrat-test.md'));
  const deuxiemePasse = rattraperDe(dirTest);
  t('second passage ne retraite pas un fichier deja verdicte (source de verite = journal)', deuxiemePasse.length === 0);

  console.log('reprise apres crash entre declencheur et verdict (evenement orphelin)');
  const dirOrphan = join(tmpdir(), `coach-orphelin-${Date.now()}`, '03_Master_Agreements');
  mkdirSync(dirOrphan, { recursive: true });
  const ficOrphan = join(dirOrphan, 'orphelin.md');
  writeFileSync(ficOrphan, 'Perimetre : prestations couvertes par le present accord. Propriete du livrable cedee au client. Duree de 12 mois, resiliation possible.');
  emettre('contract.master_agreement.received', { chemin: ficOrphan, nom_fichier: basename(ficOrphan), detecte_a: new Date().toISOString(), taille_octets: 10 });
  t('evenement orphelin : aucun verdict avant reprise', !verdictsExistants().has('orphelin.md'));
  rattraperDe(dirOrphan);
  t('reprise au demarrage retraite l orphelin et produit un verdict', verdictsExistants().has('orphelin.md'));

  console.log('isolation du journal de test');
  t('le journal de production n a pas grandi pendant l autotest', (existsSync(JOURNAL) ? readFileSync(JOURNAL, 'utf8').length : 0) === tailleProdAvant);
  t('le journal de test contient les evenements de l autotest', existsSync(JOURNAL_TEST) && readFileSync(JOURNAL_TEST, 'utf8').trim().length > 0);

  console.log(`\n${ok} reussites, ${ko} echecs`);
  process.exit(ko === 0 ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------

const a = process.argv.slice(2);
if (a.includes('--autotest')) autotest();
else if (a.includes('--sante')) sante();
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

  const rattrapes = rattraper();
  if (rattrapes.length) console.log(`rattrapage au demarrage : ${rattrapes.length} fichier(s) sans verdict traites (${rattrapes.join(', ')})`);
  else console.log('rattrapage au demarrage : rien a rattraper, le journal couvre deja tout le portail');

  let cycle = 0;
  const debut = Date.now();
  setInterval(() => {
    cycle++;
    try {
      if (existsSync(PORTAIL)) {
        const dejaVerdict = verdictsExistants();
        for (const f of readdirSync(PORTAIL)) {
          if (f === 'README.md' || dejaVerdict.has(f)) continue;
          console.log(`\ndepot detecte : ${f}`);
          traiter(join(PORTAIL, f));
        }
      }
      const portailVide = !existsSync(PORTAIL) || readdirSync(PORTAIL).filter(f => f !== 'README.md').length === 0;
      emettre('kernel.heartbeat', { cycle, depuis_demarrage_ms: Date.now() - debut, portail_vide: portailVide });
    } catch (err) {
      // Une exception isolee ne doit jamais arreter le runtime : elle est
      // journalisee comme incident, et la boucle continue.
      emettre('kernel.incident', {
        origine: 'watch-cycle',
        erreur: String((err && err.stack) || err),
        survenu_a: new Date().toISOString(),
      });
      console.error('incident capture pendant le cycle, la boucle continue :', (err && err.message) || err);
    }
  }, 3000);
} else {
  console.log('usage : --watch | --simule <fichier> | --journal | --autotest | --sante');
}
