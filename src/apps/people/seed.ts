/** PeopleApp — 3 new collections on top of the existing 7 sections.
 *
 *  - personas    : synthetic first-class profiles drawn from real interviews.
 *                  Each persona carries an explicit *anchor* (interview, call,
 *                  ticket — the source it was distilled from). A persona without
 *                  an anchor is an invention; the absence is rendered visible.
 *  - memory      : the curated organisational memory. Each entry has the fact,
 *                  its provenance, the date it was retained, and a verification
 *                  status (confirmed / contradicted / to verify). Raw memory
 *                  is a dump; what matters here is what has been checked.
 *  - codex       : patterns that have proven themselves. Each entry carries the
 *                  situation, the recipe, the reason it works, and how many
 *                  times it has been applied. A success repeated once is an
 *                  anecdote; a pattern is a success repeated enough to be a
 *                  method.
 *
 *  Tone: each collection uses the People app's app-accent (#0891b2, cyan) so the
 *  three new sections read as siblings of the existing squads surface. Severity
 *  and verification tiers carry semantic colour (amber = to verify, green =
 *  confirmed, red = contradicted) — those are domain data, not theme decoration.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

const APP_ACCENT = '#0891b2';

/* ═══════════════════════════════════════════════════════════════════════════
 *  PERSONAS — synthetic first-class profiles
 *  Each persona is anchored to a real source. Absence of anchor is rendered.
 * ═══════════════════════════════════════════════════════════════════════════ */

const personasDef: CmsCollectionDef = {
  id: 'personas',
  name: 'Personas',
  singular: 'Persona',
  accent: APP_ACCENT,
  titleField: 'name',
  subtitleField: 'role',
  badgeField: 'anchorKind',
  fields: [
    { key: 'pronouns', label: 'Pronouns', type: 'text' },
    { key: 'wants', label: 'What they want', type: 'longtext' },
    { key: 'blockers', label: 'What blocks them', type: 'longtext' },
    { key: 'vocabulary', label: 'Vocabulary', type: 'text' },
    { key: 'anchor', label: 'Anchor (source)', type: 'longtext' },
    { key: 'anchorKind', label: 'Anchor kind', type: 'badge' },
    { key: 'anchorDate', label: 'Anchor date', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
  ],
};

const personasItems: CmsItem[] = [
  {
    id: 'persona-cac40-cfo',
    name: 'Camille S.',
    role: 'CFO adjointe, groupe CAC 40',
    pronouns: 'elle / elle',
    wants: 'Un cadre de decision trimestriel qui laisse la place a la speculation productivite — pas un controle qui l\'etouffe. Elle veut voir 3 options par sujet, pas un fait accompli.',
    blockers: 'Le comex lit la matrice sous le stress : 14 decisions, deux sorties attendues a 18h. Les personnes qui derangent le cadre sont canalisees vers la RH. Camille n\'a plus le temps de pousser un dossier en comex.',
    vocabulary: 'matrice de decision · kpi vs kri · comex · deltamor · buf · spof',
    anchor: 'Entretien 1h, visio Paris, 2026-04-12. Notes verbatim sur Notion, dossier "CFO entretien 04-12".',
    anchorKind: 'entretien',
    anchorDate: '2026-04-12',
    domain: 'Direction financiere',
  },
  {
    id: 'persona-solo-accountant',
    name: 'Marc D.',
    role: 'Expert-comptable solo, 41 clients',
    pronouns: 'il / lui',
    wants: 'Sortir du mode pompier. Il gere 41 bilans par an, n\'a plus la bande passante pour developper le cabinet. Le samedi matin il fait des devis jamais envoyes.',
    blockers: 'Les clients appellent pour des details comptables au lieu d\'aller vers les juniors qu\'il a embauches. Le cabinet est devenu un centre de relation, pas un cabinet comptable.',
    vocabulary: 'bilan · liasse · AGA · controle URSSAF · lettrage · OD · situation',
    anchor: 'Appel telephonique 42 min, 2026-02-28. Enregistre avec consentement, transcript dans /clara/legs/2026-02-28-marc-d.md.',
    anchorKind: 'appel',
    anchorDate: '2026-02-28',
    domain: 'Comptabilite',
  },
  {
    id: 'persona-coach-trans',
    name: 'Léa B.',
    role: 'Coach de transition, ex-DRH',
    pronouns: 'elle / elle',
    wants: 'De 12 clients par mois a 30 — sans plus de plateformes, sans plus de marketing. Elle prefere un systeme qui mute a un systeme qui spam.',
    blockers: 'Elle a deja tente 4 CRM, 3 methodes de pricing, 2 coachs de coach. Chaque tentative s\'arrete a la troisieme semaine. Elle appelle cela "mon syndrome du 21eme jour".',
    vocabulary: 'offre · pack · session · engagement · allele · somatic marker · 360',
    anchor: 'Atelier coach OS, 2026-03-21, Madrid. Cahier de notes rasterise, 8 pages.',
    anchorKind: 'atelier',
    anchorDate: '2026-03-21',
    domain: 'Coaching',
  },
  {
    id: 'persona-corp-cto',
    name: 'Hicham E.',
    role: 'CTO scale-up SaaS B2B, 180 salaries',
    pronouns: 'il / lui',
    wants: 'Un proxy fiable entre son comite tech et son comite finance. Il passe plus de temps a traduire des schemas que a decider.',
    blockers: 'Les VP produit et les VP engineering utilisent les memes mots ("roadmap", "delivery") mais leur mean par des choses differentes. La defaut d\'alignement coutait 1M€ par an en re-work.',
    vocabulary: 'squad · train · trunk-based · ADR · blameless post-mortem · SLO',
    anchor: 'Bug tracker 2026-Q1, top 17 tickets tagges "alignment". Synthese dans /clara/legs/2026-05-04-hicham-alignment.md.',
    anchorKind: 'ticket',
    anchorDate: '2026-05-04',
    domain: 'Tech',
  },
  {
    id: 'persona-therapist',
    name: 'Nora V.',
    role: 'Therapeute de couple, libérale',
    pronouns: 'elle / ils',
    wants: 'Garder la confidentialite clinique tout en gagnant 8h par semaine sur la partie administrative. Elle ne veut pas que ses notes soient aspirées par un modele.',
    blockers: 'Les solutions SaaS generales traitements texte sont interdites par l\'ordre des psychologues. Les solutions specialisees sont trop chères ou trop rigides. Elle tape encore ses CR a 23h le dimanche.',
    vocabulary: 'seance aller · seance retour · clinical record · superviseur · zero-pii · RGPD',
    anchor: 'Anonyme — ordre impose la discretion. Rencontre informelle, pause cafe, 2026-06-09.',
    anchorKind: 'informel',
    anchorDate: '2026-06-09',
    domain: 'Sante',
  },
  {
    id: 'persona-no-anchor',
    name: 'Persona 07',
    role: 'A definir',
    pronouns: '—',
    wants: '—',
    blockers: '—',
    vocabulary: '—',
    anchor: '',
    anchorKind: 'no-anchor',
    anchorDate: '—',
    domain: '—',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  MEMORY — curated organisational memory
 *  Each fact has provenance, date, and verification status.
 *  Semantic colour: ok = confirmed, warn = to verify, danger = contradicted.
 * ═══════════════════════════════════════════════════════════════════════════ */

const memoryDef: CmsCollectionDef = {
  id: 'memory',
  name: 'Mémoire',
  singular: 'Mémoire',
  accent: APP_ACCENT,
  titleField: 'fact',
  subtitleField: 'provenance',
  badgeField: 'verification',
  fields: [
    { key: 'fact', label: 'Fact', type: 'longtext' },
    { key: 'provenance', label: 'Provenance', type: 'text' },
    { key: 'retainedOn', label: 'Retained on', type: 'text' },
    { key: 'verification', label: 'Verification', type: 'badge' },
    { key: 'verifiedBy', label: 'Verified by', type: 'text' },
    { key: 'recheckOn', label: 'Re-check on', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
};

const memoryItems: CmsItem[] = [
  {
    id: 'mem-voice-fidelity-v2',
    fact: 'La fidelite vocale v2 atteint 4.21 MOS contre 3.91 MOS v3 sur le corpus de validation — la regression v3 tient depuis 14 jours malgre le retraining.',
    provenance: 'Benchmark voice-fidelity, run 2026-04-18',
    retainedOn: '2026-04-18',
    verification: 'confirmed',
    verifiedBy: 'Quality Agent',
    recheckOn: '2026-05-02',
    domain: 'Engineering',
    notes: 'Croise avec la decision Operations "change-rollback-voice-v3". Le rollback propose s\'aligne avec ce constat.',
  },
  {
    id: 'mem-rls-isolation',
    fact: 'Aucune fuite cross-tenant detectee sur les 90 derniers jours, sur 17M de requetes SAAS via les routes RLS-scopees.',
    provenance: 'Adversarial RLS test (org A vs org B), run 2026-05-05',
    retainedOn: '2026-05-05',
    verification: 'confirmed',
    verifiedBy: 'Security Lead',
    recheckOn: '2026-08-05',
    domain: 'Security',
    notes: 'Premier passage a 90 jours sans fuite. Pas assez pour baisser la vigilance — la memoire dit "0 fuite", pas "0 fuite possible".',
  },
  {
    id: 'mem-coach-360',
    fact: 'Les coachs qui passent en pricing a l\'engagement 3 mois apres 6 mois en package voient leur revenu mensuel doubler au mois 4.',
    provenance: 'Sondage 14 coachs, juin 2026, panel A',
    retainedOn: '2026-06-12',
    verification: 'to-verify',
    verifiedBy: 'A0',
    recheckOn: '2026-09-12',
    domain: 'Coaching',
    notes: '14 repondants, panel A uniquement. Le doublement tient pour 10/14. Ne pas generaliser avant une seconde vague — panel B en attente.',
  },
  {
    id: 'mem-onboarding-stall',
    fact: 'A 24h, les nouveaux clients non-encore-actives ont 47% de chance de churn dans le mois — contre 4% pour ceux qui ont deja passe la premiere session.',
    provenance: 'Cohor analysis 2026-Q1, 124 clients',
    retainedOn: '2026-04-08',
    verification: 'confirmed',
    verifiedBy: 'Growth Agent',
    recheckOn: '2026-07-08',
    domain: 'Onboarding',
    notes: 'La fenetre 24h est la plus predictive. C\'est l\'endroit ou la memoire doit etre operee — par SMS, pas par mail.',
  },
  {
    id: 'mem-energy-v3',
    fact: 'Le modele v3 dupliquait le cout sans ameliorer la qualite perçue (export +18%, score utilisateur -0.4 sur 1.4M de tokens).',
    provenance: 'Production telemetry 2026-03-01 → 2026-03-31',
    retainedOn: '2026-04-02',
    verification: 'contradicted',
    verifiedBy: 'Finance Ops',
    recheckOn: '2026-07-02',
    domain: 'Engineering',
    notes: 'La decision technique initiale etait "toujours plus de capacite". La realite produit dit le contraire. A utiliser comme exemple dans toute decision de montee en gamme.',
  },
  {
    id: 'mem-rgpd-cnil',
    fact: 'Les envois de session notes par mail standard violent la recommandation CNIL 2018-002 — il faut un canal chiffre de bout en bout ou un retraitement zero-pii.',
    provenance: 'Recommandation CNIL + audit interne 2026-02-14',
    retainedOn: '2026-02-14',
    verification: 'confirmed',
    verifiedBy: 'Compliance',
    recheckOn: '2026-08-14',
    domain: 'Compliance',
    notes: 'Verifier que la feature vault partage respecte bien la recommandation avant le prochain sprint.',
  },
  {
    id: 'mem-paid-vs-organic',
    fact: 'Sur le dernier trimestre, les clients gagnes par outreach (42%) sont plus stables que les clients gagnes par contenu (58%) — mais avec un panier moyen 1.4x inferieur.',
    provenance: 'CRM extraction 2026-Q1',
    retainedOn: '2026-04-22',
    verification: 'to-verify',
    verifiedBy: 'A0',
    recheckOn: '2026-07-22',
    domain: 'Growth',
    notes: 'Deux lectures possibles. Le contenu attire des clients plus gros mais plus volatiles, ou l\'outreach n\'a pas encore eu le temps de maturer. Memo a tenir avec precaution — un trimestre ne suffit pas.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  CODEX — patterns that have proven themselves
 *  Each entry: situation, recipe, why, count of applications.
 *  Count is the difference between anecdote and method.
 * ═══════════════════════════════════════════════════════════════════════════ */

const codexDef: CmsCollectionDef = {
  id: 'codex',
  name: 'Codex',
  singular: 'Codex',
  accent: APP_ACCENT,
  titleField: 'situation',
  subtitleField: 'recipe',
  badgeField: 'domain',
  fields: [
    { key: 'situation', label: 'Situation', type: 'longtext' },
    { key: 'recipe', label: 'What we do', type: 'longtext' },
    { key: 'why', label: 'Why it works', type: 'longtext' },
    { key: 'appliedCount', label: 'Times applied', type: 'number' },
    { key: 'lastApplied', label: 'Last applied', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'owners', label: 'Owners', type: 'text' },
    { key: 'caveats', label: 'Caveats', type: 'longtext' },
  ],
};

const codexItems: CmsItem[] = [
  {
    id: 'codex-standup-9am',
    situation: 'A 9h, l\'agent peut faire defiler les decisions du matin sans intervention humaine, mais un seul evenement non-arrete bloque l\'agent en EXECUTING jusqu\'a 14h.',
    recipe: '9h pile chaque jour, ouvrir le dashboard, lire les 3 notifications rouges, valider ou rejeter en moins de 10 min, jamais de reponse differee sans laisser un ping dans la file.',
    why: 'Le ping differe cree un graphe de blocage non-vide. L\'agent traite tout en parallele au lieu d\'attendre — la charge baisse de 40% sur la journee. La clarte de la reponse humaine (oui/non) est ce qui gele l\'etat des agents.',
    appliedCount: 142,
    lastApplied: '2026-05-04',
    domain: 'Cadence',
    owners: 'B1 · Gatekeeper',
    caveats: 'Le rythme tient tant que le volume tient. Au-dela de 30 agents, ca ne scale pas sans un second B1 ou un delegue.',
  },
  {
    id: 'codex-24h-ping',
    situation: 'Un client signe mais ne reserve rien dans les 24h. Sans intervention, 47% de churn dans le mois.',
    recipe: 'SMS a H+2, puis SMS a H+18, puis appel a H+24, puis silence jusqu\'a 7 jours. Pas de mail, pas de relance automatique.',
    why: 'Le mail est invisible. Le SMS a 90% d\'ouverture a h+2. L\'appel a h+24 est percu comme un service, pas un spam. Le silence a 7 jours cree un espace ou le client revient de lui-meme — c\'est la ou la decision se prend reellement.',
    appliedCount: 38,
    lastApplied: '2026-04-29',
    domain: 'Onboarding',
    owners: 'Growth Agent',
    caveats: 'Ca depend du canal telephonique etranger. Pour les clients americains, SMS est a remplacer par un ib.',
  },
  {
    id: 'codex-decision-3opts',
    situation: 'Le comex prend de mauvaises decisions parce qu\'il recoit une seule option, toujours presentee comme la seule.',
    recipe: 'Toute note de decision au comex presente 3 options structurees (defaut, alternative, abandon) plus 1 paragraphe sur la consequence humaine. Pas d\'option cachee dans le texte.',
    why: 'La structure force l\'auteur a avoir pense aux alternatives. Le paragraphe humain rappelle que la decision a une consequence qui ne tient pas dans un tableur. Apres 12 comex, les notes qui suivent ce format ont 0 retour en arriere.',
    appliedCount: 12,
    lastApplied: '2026-04-30',
    domain: 'Direction',
    owners: 'Camille S. · CFO',
    caveats: 'Le format ne marche que si l\'auteur est convaincu. Sinon il remplit les 3 options formellement et laisse la decision implicite.',
  },
  {
    id: 'codex-zero-pii',
    situation: 'Les notes de seance contiennent des noms, des situations, des diagnostics. Aspirees par un LLM, elles violent la confidentialite clinique.',
    recipe: 'Pipeline en 3 etapes : (1) transcription brute, (2) extraction zero-pii au moment de l\'ingestion, (3) stockage des notes structurees en vault separe du transcript. Le transcript original est detruit apres 30 jours.',
    why: 'Le zero-pii a l\'ingestion est le seul moment ou la separation est realement possible. Apres, les notes sont deja dans le bon vault. Detruire le transcript apres 30 jours respecte la memoire du client et la memoire du systeme.',
    appliedCount: 248,
    lastApplied: '2026-05-05',
    domain: 'Compliance',
    owners: 'Compliance · Dev',
    caveats: 'Le zero-pii nest pas parfait sur les surnoms et les alias. Auditer mensuellement.',
  },
  {
    id: 'codex-rolling-90',
    situation: 'Les decisions datant de plus de 90 jours ne sont plus expliquees que par leur trace. Les nouveaux ne savent pas pourquoi.',
    recipe: 'Tous les 90 jours, une revue rapide des decisions encore en vigueur. Les anciennes decisions perdent 50% de leur poid par defaut — il faut re-justifier pour les garder.',
    why: 'Un ledger qui ne seffrite pas devient un frein. La revue a 90 jours est un cout de 2h, mais elle economise des erreurs de 6 mois. Apres 3 cycles, les decisions sont plus courtes et mieux argumentees.',
    appliedCount: 4,
    lastApplied: '2026-04-10',
    domain: 'Cadence',
    owners: 'B1 · Gatekeeper',
    caveats: 'Tenir le rythme. Au-dela de 120 jours entre les revues, le cout de re-explication devient superieur au gain.',
  },
  {
    id: 'codex-3am-raw',
    situation: 'Une alerte arrive a 3h du matin, brute, sans hypothese. L\'on-call doit decider en 5 min.',
    recipe: 'Ne pas traiter a la main. Push l\'alerte au watchdog enrichi. Si l\'alerte sort sans enrichissement en 2 minutes, la considerer comme "danger · raw" et escalader au lead sans toucher.',
    why: 'A 3h, le cerveau prend la premiere hypothese qui marche. C\'est presque toujours la mauvaise. Le watchdog enrichi a plus de signaux que l\'on-call a 3h. Si lui ne peut pas conclure, personne ne peut le faire en 5 min — donc on escalade, on ne decide pas.',
    appliedCount: 7,
    lastApplied: '2026-03-12',
    domain: 'Operations',
    owners: 'Watchdog Agent',
    caveats: 'Ce pattern suppose que le watchdog a un SLA de 2 min. Sinon, le pattern devient un ticket vide et non plus une decision.',
  },
  {
    id: 'codex-laugh-fail',
    situation: 'Un agent commet une erreur visible. Le coach hesite entre correction discrete et explication ouverte.',
    recipe: 'Regle du rire d\'abord. Raconter l\'erreur comme une histoire dans le standup. Decrire ce que l\'on en a appris. Puis seulement la correction.',
    why: 'L\'erreur a deja eu lieu. La discretion ne sert qu\'a proteger l\'ego. Le recit ouvert en standup transforme l\'erreur en memoire partagee. Les agents qui apprennent a en rire n\'hesitent pas a signaler le suivant. Apres 9 mois, le taux de re-erreur baisse de 60%.',
    appliedCount: 23,
    lastApplied: '2026-05-01',
    domain: 'Coaching',
    owners: 'B1 · Gatekeeper',
    caveats: 'Ca depend du caractere du coach. Les personnalites tres fermees ne peuvent pas commencer par l\'humour — commencer par la transparence litt.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 *  Registration — idempotent, called once at module load.
 * ═══════════════════════════════════════════════════════════════════════════ */

let seeded = false;

export function seedPeopleCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(personasDef, personasItems);
  store.registerCollection(memoryDef, memoryItems);
  store.registerCollection(codexDef, codexItems);
}
