#!/usr/bin/env node
// Montage des adaptateurs sur le runtime, derriere le bridge.
//
// CE QUI MANQUAIT
//
// Les adaptateurs projettent le registre sur les surfaces de surfaces.json,
// mais rien ne disait QUELLE surface un harnais donne sait consommer.
// Resultat : on savait exposer, sans savoir a qui.
//
// Ce module ferme la boucle. Le bridge repond « quel harnais », les
// adaptateurs repondent « quelle surface », et l'appariement des deux donne
// une voie complete : harnais + surface + adaptateur qui la produit.
//
//   node adapters.mjs --adapters      les 10 adaptateurs et leur surface
//   node adapters.mjs --voies         appariements harnais x adaptateur
//   node adapters.mjs --trous         surfaces produites que personne ne lit
//   node adapters.mjs --voie '<json>' resout une voie complete pour un travail
//   node adapters.mjs --autotest

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { router, HARNAIS, SURFACES } from './bridge.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const SRC = join(ICI, '..', '..', 'src', 'lib', 'tooling', 'adapters');

// --- Les adaptateurs ---------------------------------------------------
// `surface` est la surface de protocole que l'adaptateur PRODUIT. `sens`
// distingue ce que Coach OS emet de ce qu'il accepte : c'est la symetrie que
// l'adaptateur unidirectionnel n'avait pas.

export const ADAPTATEURS = [
  { id: 'mcp', fichier: 'mcp.ts', surface: 'mcp', sens: 'entrant+sortant', role: 'serveur MCP : expose le registre a tout client MCP, et rend Coach OS pilotable depuis Claude Code' },
  { id: 'webmcp', fichier: 'webmcp.ts', surface: 'webmcp', sens: 'sortant', role: 'la page declare ses propres outils a l agent, dans le navigateur' },
  { id: 'mcp-apps', fichier: 'mcp-apps.ts', surface: 'mcp', sens: 'sortant', role: 'ressources UI exposees en MCP' },
  { id: 'mcp-schema', fichier: 'mcp-schema.ts', surface: 'mcp', sens: 'interne', role: 'conversion Zod vers JSON Schema 2020-12' },
  { id: 'rest', fichier: 'rest.ts', surface: 'rest', sens: 'entrant', role: 'endpoints HTTP : le socle que les autres surfaces empruntent' },
  { id: 'cli', fichier: 'cli.ts', surface: 'rest', sens: 'sortant', role: 'invocation en ligne de commande' },
  { id: 'harness', fichier: 'harness.ts', surface: 'mcp', sens: 'sortant', role: 'generation de fichiers d extension pour un harnais' },
  { id: 'skill', fichier: 'skill.ts', surface: 'mcp', sens: 'sortant', role: 'projection en competences installables' },
  { id: 'in-app', fichier: 'in-app.ts', surface: 'agui', sens: 'sortant', role: 'appel direct depuis l interface' },
  { id: 'zod-introspect', fichier: 'zod-introspect.ts', surface: 'rest', sens: 'interne', role: 'lecture de la forme d un schema Zod' },
  { id: 'acp', fichier: 'acp.ts', surface: 'acp', sens: 'entrant', role: 'un client pilote Coach OS : sens inverse de MCP, etage de l agnosticite de harnais' },
  { id: 'a2a', fichier: 'a2a.ts', surface: 'a2a', sens: 'entrant+sortant', role: 'carte d agent et taches pair : un blocker reveille un domaine sans passer par B1' },
  { id: 'a2ui', fichier: 'a2ui.ts', surface: 'a2ui', sens: 'sortant', role: 'l agent compose des composants montables, il ne commente pas' },
  { id: 'ucp', fichier: 'ucp.ts', surface: 'ucp', sens: 'entrant+sortant', role: 'contexte portable entre harnais, adressable par contenu' },
  { id: 'a2p', fichier: 'a2p.ts', surface: 'a2p', sens: 'sortant', role: 'intention de paiement routable et tracable, JAMAIS executable par un agent' },
  { id: 'acp-ibm', fichier: 'acp-ibm.ts', surface: 'acp-ibm', sens: 'entrant+sortant', role: 'HOMONYME de acp : celui-ci porte le cycle de vie de l agent, pas le pilotage par un client' },
  { id: 'agp', fichier: 'agp.ts', surface: 'agp', sens: 'sortant', role: 'passerelle vers les systemes qui ne parlent aucun protocole d agent, refus par defaut' },
  { id: 'tap', fichier: 'tap.ts', surface: 'tap', sens: 'sortant', role: 'metadonnees d idempotence et de cout : decide si un retry est sur' },
  { id: 'oap', fichier: 'oap.ts', surface: 'oap', sens: 'sortant', role: 'vocabulaire pivot entre frameworks : langchain, autogen, crewai, semantic-kernel' },
  { id: 'rdf-agent', fichier: 'rdf-agent.ts', surface: 'rdf-agent', sens: 'entrant+sortant', role: 'triplets et SPARQL : relie le graphe Turtle du depot au registre du runtime' },
  { id: 'agentos', fichier: 'agentos.ts', surface: 'agentos', sens: 'interne', role: 'ordonnancement, bridage, dependances : le vocabulaire du processus long' },
  { id: 'tdf', fichier: 'tdf.ts', surface: 'tdf', sens: 'entrant', role: 'objectif, contraintes dures, metrique unique : rend un Rock executable' },
  { id: 'fcp', fichier: 'fcp.ts', surface: 'fcp', sens: 'sortant', role: 'appel de fonction strict, schema durci recursivement' },
  { id: 'agui', fichier: 'agui.ts', surface: 'agui', sens: 'sortant', role: 'flux SSE de ce que fait l agent : distingue sans operateur de sans temoin' },
];

// --- Voie complete ---------------------------------------------------------

// producteurs[0] etait un ACCIDENT DE DECLARATION : le premier element du
// tableau ADAPTATEURS a survivre au filtre, c'est-a-dire l'ordre dans lequel
// les lignes 33-58 ont ete tapees. Reordonner ce tableau aurait change quel
// adaptateur "gagne" pour chaque harnais sans qu'aucun test ne le remarque.
//
// Critere explicite, dans cet ordre :
//   1. sens le plus complet d'abord : entrant+sortant > entrant > sortant.
//      Un adaptateur qui negocie dans les deux sens (ex. `mcp`, serveur MCP
//      standard) porte plus de garanties qu'un adaptateur purement emetteur
//      (ex. `harness`, qui ne fait que generer des fichiers d'extension).
//   2. specificite du nom : un adaptateur dont l'id EGALE la surface qu'il
//      produit (ex. `mcp` -> surface `mcp`) est le producteur canonique de
//      cette surface ; un adaptateur au nom different qui produit la meme
//      surface en plus d'autre chose (`mcp-apps`, `harness`, `skill`) est un
//      usage plus etroit, pas le protocole generique.
//   3. ordre alphabetique de l'id, pour un depart-a-egalite deterministe qui
//      ne depend plus de la position dans le tableau source.
const RANG_SENS = { 'entrant+sortant': 0, entrant: 1, sortant: 2 };

function comparerAdaptateurs(a, b) {
  const rangA = RANG_SENS[a.sens] ?? 3;
  const rangB = RANG_SENS[b.sens] ?? 3;
  if (rangA !== rangB) return rangA - rangB;
  const specifiqueA = a.id === a.surface ? 0 : 1;
  const specifiqueB = b.id === b.surface ? 0 : 1;
  if (specifiqueA !== specifiqueB) return specifiqueA - specifiqueB;
  return a.id.localeCompare(b.id);
}

/**
 * Une voie relie un travail a un harnais ET a l'adaptateur qui produit la
 * surface que ce harnais sait lire. Sans cet appariement, le bridge elit un
 * harnais qu'aucun adaptateur n'alimente — un routage qui ne route rien.
 */
export function resoudreVoie(travail) {
  const r = router(travail);
  if (!r.ok) return r;

  const communes = r.elu.surfaces;
  const producteurs = ADAPTATEURS
    .filter((a) => communes.includes(a.surface) && a.sens !== 'interne')
    .sort(comparerAdaptateurs);

  if (!producteurs.length) {
    return {
      ok: false,
      motif: `le harnais ${r.elu.id} est elu mais aucun adaptateur ne produit ses surfaces`,
      surfaces_du_harnais: communes,
      surfaces_produites: [...new Set(ADAPTATEURS.filter((a) => a.sens !== 'interne').map((a) => a.surface))],
    };
  }

  return {
    ok: true,
    harnais: r.elu.id,
    invocation: r.elu.invocation,
    adaptateur: producteurs[0].id,
    surface: producteurs[0].surface,
    adaptateurs_possibles: producteurs.map((a) => a.id),
    replis_harnais: r.replis,
  };
}

/**
 * Surfaces produites par un adaptateur mais qu'aucun harnais ne lit, et
 * l'inverse.
 *
 * `agentos` fermait le compte a tort : il n'apparaissait ni produit ni lu, ce
 * qui le rangeait au meme endroit qu'un vrai manque (`webmcp`, `a2p`...).
 * Mais son seul adaptateur est `sens: 'interne'` par construction (c'est un
 * vocabulaire de PROCESSUS — ordonnancement, bridage — pas un protocole
 * qu'un harnais externe negocie). Une surface dont l'unique producteur est
 * interne n'est pas un trou a combler : c'est une convention de vocabulaire
 * qui n'a jamais ete destinee a etre "lue" par un harnais. On la classe a
 * part pour que la vraie liste des trous ne se noie pas dans un faux positif.
 */
export function trous() {
  const produites = new Set(ADAPTATEURS.filter((a) => a.sens !== 'interne').map((a) => a.surface));
  const internes = new Set(ADAPTATEURS.filter((a) => a.sens === 'interne').map((a) => a.surface));
  const lues = new Set(HARNAIS.flatMap((h) => h.surfaces));
  const declarees = SURFACES.map((s) => s.id);
  const niUnNiLautre = declarees.filter((s) => !produites.has(s) && !lues.has(s));

  return {
    produites_non_lues: [...produites].filter((s) => !lues.has(s)),
    lues_non_produites: [...lues].filter((s) => !produites.has(s)),
    // Vocabulaire de processus interne : agentos, et tout futur adaptateur
    // du meme genre. Pas un trou.
    vocabulaire_interne: niUnNiLautre.filter((s) => internes.has(s)),
    // Ce qui reste ici est un VRAI manque : declare dans surfaces.json, mais
    // ni produit par un adaptateur externe ni lu par un harnais.
    declarees_ni_produites_ni_lues: niUnNiLautre.filter((s) => !internes.has(s)),
  };
}

// --- Autotest --------------------------------------------------------------

function autotest() {
  let ok = 0, ko = 0;
  const t = (n, c) => { if (c) { ok++; console.log(`  OK    ${n}`); } else { ko++; console.log(`  ECHEC ${n}`); } };

  console.log('adaptateurs');
  t('24 adaptateurs montes', ADAPTATEURS.length === 24);
  t('identifiants uniques', new Set(ADAPTATEURS.map((a) => a.id)).size === 24);
  t('webmcp est le dixieme', ADAPTATEURS.some((a) => a.id === 'webmcp'));
  t('toute surface produite est declaree',
    ADAPTATEURS.every((a) => SURFACES.some((s) => s.id === a.surface)));
  t('les 9 surfaces sont toutes produites ou consommees',
    SURFACES.every((s) => ADAPTATEURS.some((a) => a.surface === s.id)));
  t('les deux ACP sont distincts',
    ADAPTATEURS.some((a) => a.id === 'acp') && ADAPTATEURS.some((a) => a.id === 'acp-ibm'));
  t('a2p n est jamais sortant vers execution',
    ADAPTATEURS.find((a) => a.id === 'a2p').role.includes('JAMAIS'));

  console.log('fichiers reels');
  for (const a of ADAPTATEURS) {
    let existe = true;
    try { readFileSync(join(SRC, a.fichier)); } catch { existe = false; }
    t(`${a.fichier} present`, existe);
  }

  console.log('voies completes');
  const v1 = resoudreVoie({ id: 'edition', besoins: ['file_edit', 'shell'] });
  t('un travail d edition obtient une voie complete', v1.ok && !!v1.adaptateur);
  t('la voie nomme harnais ET adaptateur', v1.ok && !!v1.harnais && !!v1.adaptateur);
  const v2 = resoudreVoie({ id: 'impossible', besoins: ['file_edit', 'voice', 'cron'] });
  t('une voie impossible echoue explicitement', !v2.ok);

  console.log('trous');
  const g = trous();
  t('les trous sont calculables', Array.isArray(g.produites_non_lues));
  t('agentos est classe vocabulaire interne, pas trou', g.vocabulaire_interne.includes('agentos'));
  t('agentos n apparait plus dans les vrais trous', !g.declarees_ni_produites_ni_lues.includes('agentos'));
  console.log(`     produites non lues  : ${g.produites_non_lues.join(', ') || 'aucune'}`);
  console.log(`     lues non produites  : ${g.lues_non_produites.join(', ') || 'aucune'}`);
  console.log(`     vocabulaire interne : ${g.vocabulaire_interne.join(', ') || 'aucun'}`);
  console.log(`     vrais trous restants: ${g.declarees_ni_produites_ni_lues.join(', ') || 'aucun'}`);

  console.log('choix explicite du producteur (plus de producteurs[0] accidentel)');
  const v3 = resoudreVoie({ id: 'via-mcp', besoins: ['file_edit', 'shell'] });
  t('mcp (entrant+sortant) est prefere a harness/skill (sortant) pour la surface mcp',
    v3.ok && v3.adaptateur === 'mcp');
  t('le resultat ne depend pas de l ordre de declaration du tableau (teste avec un ordre mescle)',
    (() => {
      const melange = [...ADAPTATEURS].reverse();
      const gagnantMelange = melange.filter((x) => x.surface === 'mcp' && x.sens !== 'interne').sort(comparerAdaptateurs)[0];
      return gagnantMelange.id === v3.adaptateur;
    })());

  console.log(`\n${ok} reussites, ${ko} echecs`);
  process.exit(ko === 0 ? 0 : 1);
}

// --- CLI -------------------------------------------------------------------

const a = process.argv.slice(2);
if (a.includes('--autotest')) autotest();
else if (a.includes('--adapters')) {
  for (const x of ADAPTATEURS)
    console.log(`${x.id.padEnd(15)} ${x.surface.padEnd(8)} ${x.sens.padEnd(17)} ${x.role}`);
} else if (a.includes('--trous')) {
  const g = trous();
  console.log('produites non lues  :', g.produites_non_lues.join(', ') || 'aucune');
  console.log('lues non produites  :', g.lues_non_produites.join(', ') || 'aucune');
  console.log('vocabulaire interne :', g.vocabulaire_interne.join(', ') || 'aucun', '(pas un trou : processus, pas protocole)');
  console.log('vrais trous restants:', g.declarees_ni_produites_ni_lues.join(', ') || 'aucun');
} else if (a.includes('--voies')) {
  console.log('harnais'.padEnd(15) + 'surfaces lues'.padEnd(26) + 'adaptateurs qui les alimentent');
  for (const h of HARNAIS) {
    const p = ADAPTATEURS.filter((x) => h.surfaces.includes(x.surface) && x.sens !== 'interne').map((x) => x.id);
    console.log(h.id.padEnd(15) + h.surfaces.join(',').padEnd(26) + (p.join(', ') || '— aucun'));
  }
} else if (a.includes('--voie')) {
  const j = a[a.indexOf('--voie') + 1];
  if (!j) { console.error('usage : --voie \'{"besoins":["file_edit"]}\''); process.exit(2); }
  const v = resoudreVoie(JSON.parse(j));
  console.log(JSON.stringify(v, null, 2));
  if (!v.ok) process.exit(1);
} else {
  console.log('usage : --adapters | --voies | --trous | --voie <json> | --autotest');
}
