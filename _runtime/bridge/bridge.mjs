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
//   node bridge.mjs --sonde                    teste REELLEMENT chaque cible sur ce poste
//   node bridge.mjs --autotest
//
// --route et --sonde acceptent --ignorer-sonde pour retomber sur le
// comportement de simulation (le routeur ignore alors l'invocabilite reelle).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, delimiter, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import https from 'node:https';
import http from 'node:http';

const ICI = dirname(fileURLToPath(import.meta.url));
const CHEMIN_HARNAIS = join(ICI, 'harnesses.json');
const H = JSON.parse(readFileSync(CHEMIN_HARNAIS, 'utf8'));
const S = JSON.parse(readFileSync(join(ICI, 'surfaces.json'), 'utf8'));

const HARNAIS = H.harnesses;
const SURFACES = S.surfaces;
const CAPACITES = H.$capacites_canoniques;

// Un harnais mesure est prefere a un declare, lui-meme prefere a un suppose.
// C'est la meme echelle de confiance que le champ `verified` du format OKF :
// une affirmation mesuree et une affirmation supposee ne se ressemblent jamais.
const POIDS_STATUT = { mesure: 3, declare: 2, suppose: 1 };

// Faille de score fermee : une capacite DECLAREE n'est pas une capacite
// PROUVEE. Sans plafond, un `declare` qui coche les 11 capacites du
// vocabulaire canonique egalisait exactement un `mesure` a une seule capacite
// (30+1 == 20+11 avec l'ancien bareme). Le bonus des capacites non verifiees
// est desormais plafonne bien en dessous de l'ecart entre deux paliers de
// statut (10 points) : aucune accumulation de capacites non prouvees ne peut
// plus faire franchir un palier.
const PLAFOND_BONUS_NON_VERIFIE = 3;
const POIDS_CAPACITE_VERIFIEE = 2;

/**
 * Un harnais `mesure` a prouve qu'il existe et repond ; on lui credite ses
 * capacites declarees comme verifiees par defaut (c'est deja ce que
 * mesure_le atteste). Un `declare` ou un `suppose` ne peut jamais s'attribuer
 * une verification qu'il n'a pas : meme s'il porte un champ
 * `capacites_verifiees` errone, il est ignore pour tout statut != mesure.
 */
function capacitesVerifiees(h) {
  if (h.statut !== 'mesure') return [];
  if (Array.isArray(h.capacites_verifiees)) {
    return h.capacites_verifiees.filter(c => h.capacites.includes(c));
  }
  return h.capacites;
}

function score(h) {
  const verifiees = capacitesVerifiees(h);
  const nonVerifiees = h.capacites.filter(c => !verifiees.includes(c));
  const bonus = Math.min(nonVerifiees.length, PLAFOND_BONUS_NON_VERIFIE) + verifiees.length * POIDS_CAPACITE_VERIFIEE;
  return POIDS_STATUT[h.statut] * 10 + bonus;
}

// --- Sondage reel ------------------------------------------------------------
// Ce que l'audit a repproche au registre : des statuts qui ne correspondent
// a rien sur le disque, et l'inverse. Cette section teste la cible REELLE
// d'un harnais plutot que de faire confiance au JSON.

const EXT_WINDOWS = ['', '.cmd', '.exe', '.ps1', '.bat'];

function repertoiresConnus() {
  const home = homedir();
  const path = (process.env.PATH || process.env.Path || '').split(delimiter).filter(Boolean);
  const extra = [
    join(home, '.local', 'bin'),
    join(home, 'bin'),
    process.env.APPDATA ? join(process.env.APPDATA, 'npm') : null,
  ].filter(Boolean);
  return [...new Set([...path, ...extra])];
}

/** Verification synchrone, sans reseau : PATH + repertoires connus + extensions Windows. */
function sondeCibleFS(invocation) {
  const cible = invocation && invocation.cible;
  if (!cible) {
    return { joignable: false, chemin: null, motif: 'aucune cible declaree' };
  }
  const estCheminAbsolu = /^[A-Za-z]:[\\/]/.test(cible) || cible.startsWith('/');
  if (estCheminAbsolu) {
    if (existsSync(cible)) return { joignable: true, chemin: cible, motif: 'chemin absolu present' };
    for (const ext of EXT_WINDOWS) {
      if (ext && existsSync(cible + ext)) return { joignable: true, chemin: cible + ext, motif: 'chemin absolu + extension' };
    }
    return { joignable: false, chemin: null, motif: `chemin absolu introuvable : ${cible}` };
  }

  for (const dir of repertoiresConnus()) {
    for (const ext of EXT_WINDOWS) {
      const p = join(dir, cible + ext);
      if (existsSync(p)) return { joignable: true, chemin: p, motif: `trouve dans ${dir}` };
    }
  }

  // Une "cible" comme "Hermes Desktop Native" ou ".buzz" n'est meme pas un
  // identifiant de binaire plausible : le signaler distinctement d'une simple
  // absence de PATH evite de confondre un libelle mal pose avec un vrai
  // paquet non installe.
  const ressembleAUnIdentifiant = /^[a-z0-9][a-z0-9._-]*$/i.test(cible);
  return {
    joignable: false,
    chemin: null,
    motif: ressembleAUnIdentifiant
      ? `absent du PATH et des repertoires connus (${repertoiresConnus().length} repertoires sondes)`
      : `cible non invocable : "${cible}" n est pas un identifiant de binaire (libelle ou chemin de dossier)`,
  };
}

// --- Sonde WSL -------------------------------------------------------------
// Une sonde ne mesure que le systeme d'ou elle part. Le sondage du 2026-08-24
// tournait uniquement cote Windows et declarait `dsh`, `prime-agent`,
// `opencode` et `grok` introuvables : ils sont installes en Linux, dans WSL,
// et repondent. Conclure "non installe" depuis un seul cote d'une frontiere
// WSL est une erreur de methode, pas une donnee.
//
// Piege : `wsl -- <chemin>` demarre un shell NON-login (ni .bashrc ni
// .profile), donc ~/.local/bin manque au PATH -- c'est precisement ce qui
// rendait ces harnais invisibles a Ori. On prefixe donc le PATH nous-memes.

const WSL_DISTRO = process.env.COACH_OS_WSL_DISTRO || 'Ubuntu-24.04';

function wslDisponible() {
  if (process.platform !== 'win32') return false;
  try {
    execFileSync('wsl.exe', ['-d', WSL_DISTRO, '--', 'true'], {
      timeout: 20000, windowsHide: true, stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function sortieWsl(args, timeout = 20000) {
  // wsl.exe emet ses propres messages en UTF-16 ; la sortie du programme
  // Linux est en UTF-8. Retirer les octets nuls rend les deux lisibles.
  return execFileSync('wsl.exe', args, {
    timeout, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'],
  }).toString('utf8').replace(/\0/g, '').trim();
}

function sondeCibleWSL(cible) {
  if (!cible || !/^[a-z0-9][a-z0-9._-]*$/i.test(cible)) {
    return { joignable: false, chemin: null, motif: 'cible non sondable cote WSL (pas un identifiant)' };
  }
  try {
    const chemin = sortieWsl([
      '-d', WSL_DISTRO, '--', 'sh', '-c',
      // `|| true` est indispensable : `command -v` sort en code 1 quand il ne
      // trouve rien, ce qui ferait lever execFileSync et transformerait une
      // absence banale en "sonde en echec". Un instrument qui confond
      // "absent" et "je n ai pas pu regarder" accuse le mauvais coupable.
      `export PATH="$HOME/.local/bin:$PATH"; command -v ${cible} 2>/dev/null || true`,
    ]).split(/\r?\n/)[0].trim();
    if (chemin) return { joignable: true, chemin, motif: `trouve dans WSL ${WSL_DISTRO}` };
    return { joignable: false, chemin: null, motif: `absent du PATH de WSL ${WSL_DISTRO}` };
  } catch (e) {
    return { joignable: false, chemin: null, motif: `sonde WSL en echec (${e.code || 'erreur'})` };
  }
}

function obtenirVersionWSL(chemin) {
  try {
    const out = sortieWsl(['-d', WSL_DISTRO, '--', chemin, '--version'], 15000)
      .split(/\r?\n/)[0].trim();
    return out.slice(0, 100) || null;
  } catch {
    return null;
  }
}

function sondeHttp(url) {
  return new Promise((res) => {
    let u;
    try { u = new URL(url); } catch { res({ joignable: false, chemin: null, motif: `URL invalide : ${url}` }); return; }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request(u, { method: 'HEAD', timeout: 4000 }, (r) => {
      res({ joignable: true, chemin: url, motif: `hote repond, code ${r.statusCode}` });
      r.resume();
    });
    req.on('timeout', () => { req.destroy(); res({ joignable: false, chemin: null, motif: 'delai depasse (4s)' }); });
    req.on('error', (e) => res({ joignable: false, chemin: null, motif: `${e.code || e.message}` }));
    req.end();
  });
}

function obtenirVersion(chemin) {
  try {
    // Sous Windows, un .cmd/.bat n'est pas directement executable par
    // CreateProcess (EINVAL sans shell) : execFileSync doit passer par un
    // shell pour ces extensions, exactement comme le ferait un utilisateur
    // qui tape la commande dans un terminal.
    const besoinShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(chemin);
    const out = execFileSync(chemin, ['--version'], {
      timeout: 10000, windowsHide: true, shell: besoinShell, stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8').split(/\r?\n/)[0].trim();
    return out.slice(0, 100) || null;
  } catch {
    return null;
  }
}

/** Sonde tous les harnais. Async a cause des harnais http. */
async function sonderTout() {
  const resultats = [];
  // Un seul test d'existence de WSL pour tout le run : le faire par harnais
  // couterait une vingtaine de demarrages de VM pour la meme reponse.
  const wslOk = wslDisponible();
  for (const h of HARNAIS) {
    const type = h.invocation.type;
    let r;
    if (type === 'sdk') {
      // Un point d'entree sdk n'est pas une ligne de commande cote Windows,
      // mais il peut tres bien exister comme binaire dans WSL (cas mesure de
      // prime-agent) : on tente donc quand meme ce cote-la.
      const w = wslOk ? sondeCibleWSL(h.invocation.cible) : { joignable: false, chemin: null, motif: 'WSL indisponible' };
      r = w.joignable
        ? { ...w, windows: { joignable: false, chemin: null, motif: 'type sdk, non sondable cote Windows' }, wsl: w, cote: 'wsl' }
        : { joignable: null, chemin: null, motif: 'type sdk, non sondable en ligne de commande',
            windows: { joignable: null, chemin: null, motif: 'type sdk' }, wsl: w, cote: 'aucun' };
    } else if (type === 'http') {
      const w = await sondeHttp(h.invocation.cible);
      r = { ...w, windows: w, wsl: { joignable: null, chemin: null, motif: 'type http, hors frontiere WSL' },
            cote: w.joignable ? 'reseau' : 'aucun' };
    } else {
      const win = sondeCibleFS(h.invocation);
      const wsl = wslOk ? sondeCibleWSL(h.invocation.cible) : { joignable: false, chemin: null, motif: 'WSL indisponible' };
      const cote = win.joignable && wsl.joignable ? 'les-deux'
                 : win.joignable ? 'windows'
                 : wsl.joignable ? 'wsl'
                 : 'aucun';
      // Windows d'abord quand les deux repondent : le bridge s'execute sous
      // Windows, un chemin natif y est invocable sans traverser la frontiere.
      const gagnant = win.joignable ? win : (wsl.joignable ? wsl : win);
      r = {
        joignable: win.joignable || wsl.joignable,
        chemin: gagnant.chemin,
        motif: cote === 'les-deux'
          ? `present des deux cotes (Windows: ${win.chemin} | WSL: ${wsl.chemin})`
          : cote === 'aucun'
            ? `introuvable des deux cotes (Windows: ${win.motif} | WSL: ${wsl.motif})`
            : gagnant.motif,
        windows: win, wsl, cote,
      };
    }
    let version = null;
    if (r.joignable === true && (type === 'cli' || type === 'desktop' || type === 'sdk')) {
      version = r.cote === 'wsl' && r.chemin
        ? obtenirVersionWSL(r.chemin)
        : obtenirVersion(r.chemin || h.invocation.cible);
    }
    resultats.push({ id: h.id, ...r, version });
  }
  return resultats;
}

/**
 * Rapide, synchrone, sans reseau : utilise pour la garde d'invocabilite du
 * routeur. Priorite au dernier sondage persiste (`h.sonde`) s'il existe ;
 * sinon, pour cli/desktop, une verification disque a chaud. Un harnais
 * http/sdk jamais sonde n'est PAS bloque par defaut : le bloquer sans donnee
 * fraiche produirait de faux negatifs pires que l'absence de garde.
 */
function invocableRapide(h) {
  if (h.sonde && typeof h.sonde.joignable === 'boolean') return h.sonde.joignable;
  if (h.invocation.type === 'cli' || h.invocation.type === 'desktop') {
    return sondeCibleFS(h.invocation).joignable === true;
  }
  return true;
}

const AUJOURDHUI = new Date().toISOString().slice(0, 10);

/**
 * Reconcilie harnesses.json avec le sondage reel. Regle : joignable -> mesure
 * (avec la date et, si la cible a ete resolue par PATH sous un autre nom que
 * celle declaree, corrige la cible vers ce nom invocable). Non joignable ->
 * suppose, en remplacant une cible qui n'etait pas un identifiant plausible
 * par null plutot que d'inventer un chemin. Type sdk (non sondable) : statut
 * inchange, note posee. AUCUN harnais n'est supprime.
 */
// Retire tout segment "sonde <date> : ..." pose par un run precedent, avec ou
// sans le separateur " | " (le tout premier run n ecrit pas le separateur).
// Sans ce nettoyage, deux runs consecutifs empilent des notes en double.
function sansAncienneSonde(note) {
  return (note || '').replace(/\s*\|?\s*sonde \d{4}-\d{2}-\d{2}\s*:.*/s, '').trim();
}

function reconcilier(resultats) {
  const parId = new Map(resultats.map(r => [r.id, r]));
  for (const h of HARNAIS) {
    const r = parId.get(h.id);
    if (!r) continue;
    const noteBase = sansAncienneSonde(h.note);
    if (r.joignable === true) {
      h.statut = 'mesure';
      h.mesure_le = AUJOURDHUI;
      // La cible declaree n'etait pas forcement celle qui a repondu (ex.
      // "Hermes Desktop Native" est un libelle, pas un identifiant) : si le
      // sondage a resolu un identifiant invocable par PATH, on le pose ici.
      // Reserve a cli/desktop : une URL http ou un point d'entree sdk ne se
      // "renomme" jamais par basename, sous peine de tronquer l'adresse
      // reelle (bug vu en test : "https://api.multica.ai" -> "api.multica").
      const typeRenommable = h.invocation.type === 'cli' || h.invocation.type === 'desktop';
      if (typeRenommable && r.chemin) {
        const cibleEstDejaUnChemin = /^[A-Za-z]:[\\/]/.test(h.invocation.cible || '') || (h.invocation.cible || '').startsWith('/');
        const nomResolu = basename(r.chemin, extname(r.chemin));
        if (nomResolu && nomResolu !== h.invocation.cible && !cibleEstDejaUnChemin) {
          h.invocation.type = h.invocation.type === 'desktop' ? 'cli' : h.invocation.type;
          h.invocation.cible = nomResolu;
        }
      }
      h.note = `${noteBase} | sonde ${AUJOURDHUI} : joignable${r.version ? `, ${r.version}` : ''} (${r.motif})`.replace(/^\| /, '');
    } else if (r.joignable === false) {
      const cibleEstIdentifiant = /^[a-z0-9][a-z0-9._-]*$/i.test(h.invocation.cible || '') || /^[A-Za-z]:[\\/]/.test(h.invocation.cible || '') || (h.invocation.cible || '').startsWith('/');
      if (!cibleEstIdentifiant) {
        h.invocation.cible = null;
      }
      if (h.statut !== 'suppose') h.statut = 'suppose';
      h.mesure_le = null;
      h.note = `${noteBase} | sonde ${AUJOURDHUI} : introuvable (${r.motif})`.replace(/^\| /, '');
    } else {
      h.note = `${noteBase} | sonde ${AUJOURDHUI} : ${r.motif}`.replace(/^\| /, '');
    }
    // Les cinq premieres cles sont celles de l'ancien format : les consommateurs
    // existants (dont invocableRapide) continuent de fonctionner sans changement.
    // `cote`, `windows` et `wsl` s'y ajoutent pour qu'on ne puisse plus relire
    // "introuvable" sans savoir de quel cote de la frontiere on a regarde.
    h.sonde = {
      joignable: r.joignable,
      chemin: r.chemin,
      motif: r.motif,
      version: r.version,
      sonde_le: AUJOURDHUI,
      cote: r.cote || null,
      windows: r.windows || null,
      wsl: r.wsl || null,
    };
  }
}

function ecrireRegistre() {
  writeFileSync(CHEMIN_HARNAIS, JSON.stringify(H, null, 2) + '\n', 'utf8');
}

// --- Routage ---------------------------------------------------------------

/**
 * Un travail declare ce dont il A BESOIN, jamais QUI doit l'executer.
 * C'est ce qui rend la substitution possible sans reecrire le travail.
 *
 *   { id, besoins: [capacites], surface?: id, interdits?: [ids], ignorerSonde?: bool }
 *
 * `ignorerSonde` retombe sur le comportement purement declaratif — utile pour
 * simuler un routage avant qu'un harnais de niche ne soit reellement installe.
 */
function router(travail) {
  const besoins = travail.besoins || [];
  const inconnues = besoins.filter(b => !CAPACITES.includes(b));
  if (inconnues.length) {
    return { ok: false, motif: `capacite hors vocabulaire canonique : ${inconnues.join(', ')}` };
  }

  const interdits = new Set(travail.interdits || []);
  const ignorerSonde = !!travail.ignorerSonde;

  const couvrentBesoins = HARNAIS
    .filter(h => !interdits.has(h.id))
    .filter(h => besoins.every(b => h.capacites.includes(b)))
    .filter(h => !travail.surface || h.surfaces.includes(travail.surface));

  const candidats = couvrentBesoins
    .filter(h => ignorerSonde || invocableRapide(h))
    .map(h => ({ harnais: h, score: score(h) }))
    .sort((a, b) => b.score - a.score);

  if (!candidats.length) {
    // Echec explicite et diagnostique. Un routage qui retombe silencieusement
    // sur un defaut est pire qu'une absence de routage : il ment sur ce qui a
    // execute le travail.
    const parCapacite = besoins.map(b => `${b}: ${HARNAIS.filter(h => h.capacites.includes(b)).length} harnais`);
    const injoignables = couvrentBesoins.filter(h => !ignorerSonde && !invocableRapide(h));
    if (!ignorerSonde && injoignables.length && injoignables.length === couvrentBesoins.length) {
      // Le vocabulaire couvre le besoin, mais chaque candidat est mort sur ce
      // poste : c'est exactement le cas `voice -> buzz` que l'audit a
      // demontre. Le distinguer d'une absence totale de couverture.
      return {
        ok: false,
        motif: 'les harnais qui couvrent ces besoins sont tous injoignables sur ce poste (sondage)',
        diagnostic: injoignables.map(h => `${h.id}: ${(h.sonde && h.sonde.motif) || 'jamais sonde, cible introuvable'}`),
        rattrapage: 'relancer avec ignorerSonde:true (ou --ignorer-sonde) pour simuler quand meme',
        surface_demandee: travail.surface || null,
      };
    }
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
    raison: `statut=${candidats[0].harnais.statut}, ${candidats[0].harnais.capacites.length} capacites, score=${candidats[0].score}`,
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

  // ignorerSonde:true ici, documente : aucun harnais reel ne parle encore ACP
  // sur ce poste (cursor et open-code sont tous deux non installes) — ce test
  // verifie le FILTRAGE PAR SURFACE, pas l'invocabilite, donc il simule.
  const r5 = router({ id: 'par-surface', besoins: ['tool_call'], surface: 'acp', ignorerSonde: true });
  t('le filtrage par surface fonctionne (simulation : aucun harnais ACP reel installe)',
    r5.ok && r5.elu.surfaces.includes('acp'));

  console.log('agnosticite');
  t('aucun identifiant de harnais code en dur dans le routeur',
    !router.toString().match(/claude-code|codex|cursor|multica/));

  console.log('veto');
  const a2p = SURFACES.find(s => s.id === 'a2p');
  t('la surface de paiement porte un veto ecrit', /VETO/i.test(a2p.note));

  console.log('invocabilite (le routeur n elit plus un mort)');
  const mort = HARNAIS.find(h => h.sonde && h.sonde.joignable === false);
  if (mort) {
    const autres = HARNAIS.filter(h => h.id !== mort.id).map(h => h.id);
    const r6 = router({ id: 'cible-morte', besoins: mort.capacites, interdits: autres });
    t(`un harnais sonde injoignable (${mort.id}) est ecarte du routage par defaut`, !r6.ok);
    const r7 = router({ id: 'cible-morte-simulee', besoins: mort.capacites, interdits: autres, ignorerSonde: true });
    t(`--ignorer-sonde / ignorerSonde retablit ${mort.id} pour la simulation`, r7.ok && r7.elu.id === mort.id);
  } else {
    t('aucun harnais injoignable dans le registre courant : garde non exercee par ce run', true);
  }

  console.log('faille de score fermee');
  const mesureMince = { id: 'mesure-mince', statut: 'mesure', mesure_le: AUJOURDHUI, capacites: ['file_edit'], surfaces: ['mcp'], invocation: { type: 'cli', cible: 'x' } };
  const declareCharge = { id: 'declare-charge', statut: 'declare', mesure_le: null, capacites: [...CAPACITES], surfaces: ['mcp'], invocation: { type: 'cli', cible: 'y' } };
  t('un declare a 11 capacites ne peut plus egaler un mesure a 1 capacite',
    score(declareCharge) < score(mesureMince));
  const supposeCharge = { ...declareCharge, id: 'suppose-charge', statut: 'suppose' };
  t('le pire mesure bat le meilleur declare, qui bat le meilleur suppose (ordre par palier preserve)',
    score(mesureMince) > score(declareCharge) && score(declareCharge) > score(supposeCharge));

  console.log(`\n${ok} reussites, ${ko} echecs`);
  process.exit(ko === 0 ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------
// Le bloc ne s'execute QUE si ce fichier est le point d'entree. Sans cette
// garde, un `import` depuis adapters.mjs declenchait le CLI, qui interceptait
// les arguments de l'appelant et sortait a sa place — un module qui agit quand
// on le lit est un piege.

const estPointDEntree = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

const a = estPointDEntree ? process.argv.slice(2) : [];
if (a.includes('--autotest')) autotest();
else if (a.includes('--harnesses')) listerHarnais();
else if (a.includes('--surfaces')) listerSurfaces();
else if (a.includes('--matrice')) matrice();
else if (a.includes('--sonde')) {
  const dryRun = a.includes('--sans-ecrire');
  sonderTout().then((resultats) => {
    console.log('id'.padEnd(14) + 'joignable'.padEnd(11) + 'chemin/motif');
    let joignables = 0;
    for (const r of resultats) {
      const j = r.joignable === true ? 'oui' : r.joignable === false ? 'non' : 'n.d.';
      if (r.joignable === true) joignables++;
      const detail = r.joignable === true ? `${r.chemin}${r.version ? ` (${r.version})` : ''}` : r.motif;
      console.log(r.id.padEnd(14) + j.padEnd(11) + detail);
    }
    console.log(`\n${joignables} joignables sur ${resultats.length}`);
    if (!dryRun) {
      reconcilier(resultats);
      ecrireRegistre();
      console.log(`\nharnesses.json reconcilie et ecrit (${CHEMIN_HARNAIS}).`);
    } else {
      console.log('\n--sans-ecrire : harnesses.json non modifie.');
    }
  });
} else if (a.includes('--route')) {
  const j = a[a.indexOf('--route') + 1];
  if (!j) { console.error('usage : --route \'{"besoins":["file_edit"]}\''); process.exit(2); }
  const travail = JSON.parse(j);
  if (a.includes('--ignorer-sonde')) travail.ignorerSonde = true;
  const r = router(travail);
  if (r.ok) {
    console.log(`elu    : ${r.elu.id} (${r.raison})`);
    console.log(`via    : ${r.elu.invocation.type} -> ${r.elu.invocation.cible}`);
    console.log(`replis : ${r.replis.join(', ') || 'aucun'}`);
  } else {
    console.log(`refus  : ${r.motif}`);
    if (r.diagnostic) console.log(`         ${r.diagnostic.join(' | ')}`);
    if (r.rattrapage) console.log(`         ${r.rattrapage}`);
    process.exit(1);
  }
} else if (estPointDEntree) {
  console.log('usage : --harnesses | --surfaces | --matrice | --sonde [--sans-ecrire] | --route <json> [--ignorer-sonde] | --autotest');
}

export { router, HARNAIS, SURFACES, CAPACITES, score, sonderTout, reconcilier, invocableRapide };
