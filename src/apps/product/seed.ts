/** Product seed — 4 new collections registered on top of the existing
 *  product_items / product_releases:
 *
 *    - product_rankings : S / A / B / F tiers of product ideas. Each entry
 *                         carries the explicit criterion that justifies the
 *                         placement — a ranking without justification is
 *                         decoration.
 *    - product_launches : the five canonical stages of a launch
 *                         (validate · pre-sell · launch · audience · productize)
 *                         with the state of the entry and the proof of
 *                         completion for the stages that are done.
 *    - product_mvps     : smallest-deliverable discipline. Each entry names
 *                         one feature, one client, one problem. When one of
 *                         the three overflows (the feature grows, the client
 *                         becomes many, the problem becomes a platform) the
 *                         entry signals it explicitly.
 *    - product_ideas    : raw ideas at the front of the pipeline. Each is
 *                         rated on the four axes — trend, opportunity,
 *                         observed demand, economic size — so a triage
 *                         pass can read the table instead of re-debating
 *                         each idea.
 *
 *  Tone follows the app accent (#ea580c, orange) so the four new surfaces
 *  read as siblings of the existing Roadmap / Backlog / Releases / Specs /
 *  Channels family. Tier / stage / overflow / trend carry domain colour:
 *  semantic meaning only, not decoration.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

const APP_ACCENT = '#ea580c';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Classement — S / A / B / F tiers with justification ═══ */

const rankingsDef = def({
  id: 'product_rankings', name: 'Classement', singular: 'Idée classée', accent: APP_ACCENT,
  titleField: 'name', subtitleField: 'area', badgeField: 'tier',
  fields: [
    { key: 'tier', label: 'Tier', type: 'badge' },
    { key: 'body', label: 'Critère de placement', type: 'longtext' },
    { key: 'score', label: 'Score /100', type: 'number' },
    { key: 'area', label: 'Domaine', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'source', label: 'Source / signal', type: 'text' },
    { key: 'reviewedOn', label: 'Revu le', type: 'text' },
    { key: 'nextStep', label: 'Prochain pas', type: 'text' },
  ],
});

const rankingsItems: CmsItem[] = [
  {
    id: 'rank-session-content-dam',
    name: 'Session → Content Dam',
    tier: 'S',
    body: 'Le coach garde 80% de sa valeur intellectualle dans la transcription, qui disparait avec la session. Une fois transformee en assets re-utilisables (posts, articles, exercices), chaque session alimente 12 contenus et la valeur cumulee depasse le cout de la session elle-meme. Les 8 coachs pilotes confirment qu\'ils veulent payer pour cette conversion, pas pour le transcript brut.',
    score: 92,
    area: 'Knowledge',
    owner: 'Priya Nandan',
    source: '8 entretiens pilotes · sondage 2026-Q1 (12 coachs, 9 oui)',
    reviewedOn: '2026-07-30',
    nextStep: 'spec v0.4 · ouvrir le canal "presell" pour la cohorte Q3',
  },
  {
    id: 'rank-vault-share',
    name: 'Vault partage entre coachs',
    tier: 'S',
    body: 'Un coach isole construit sa memoire en double : il reinvente l\'exercice que son pair a deja valide. Le partage entre 3 a 6 coachs de confiance triple le rythme de validation des nouveaux protocoles, sans exposer les notes client (zero-pii au routage). Demande confirmee par 14 des 17 coachs interviewes — la friction partagee reste le silence, pas l\'outil.',
    score: 88,
    area: 'Knowledge',
    owner: 'Léa Bertrand',
    source: '17 entretiens · cohortes CAC 40 et solo (panel A)',
    reviewedOn: '2026-07-26',
    nextStep: 'spec zero-pii routing · ouvrir le canal "validate" avec 3 coachs pilotes',
  },
  {
    id: 'rank-auto-brief-2',
    name: 'Auto-brief v2 — contexte vivant',
    tier: 'A',
    body: 'L\'auto-brief v1 est utile mais se degrade apres 4 sessions : la synthese oublie des fils ouverts par le client. v2 injecte le contexte des 3 dernieres sessions plutot qu\'un resume statique. Mesurable : taux d\'acceptation 68% → 82%, score coach 3.4 → 4.1. Pas S parce que la valeur reste bornee au coach deja actif — pas de marche au-dela du Segment 1.',
    score: 76,
    area: 'Coaching',
    owner: 'Sasha Mendes',
    source: 'eval auto-brief, 50 trials · sondage 14 coachs actifs',
    reviewedOn: '2026-07-23',
    nextStep: 'rollback ouvert sur la 6e correction · finir avant 2026-08-15',
  },
  {
    id: 'rank-compliance-pack',
    name: 'Compliance Audit Pack',
    tier: 'A',
    body: 'L\'audit pack est obligatoire pour tout client regule (sante, juridique, CAC 40 finance). Aujourd\'hui on le genere a la main en 6h. Un pack automatise tombe a 12 min et est reproductible byte-for-byte. Le marche est etroit (8% des clients) mais le prix unitaire est 3.5x un pack standard. A parce que le payeur n\'est pas le coach — il faut un circuit de vente distinct.',
    score: 71,
    area: 'Compliance',
    owner: 'Jules Royer',
    source: 'benchmark compliance-export · sondage regulateur 2026-Q2',
    reviewedOn: '2026-07-19',
    nextStep: 'deferred Q4 — pre-vente aupres de 2 cabinets d\'avocat pilotes',
  },
  {
    id: 'rank-coach-mobile-pwa',
    name: 'Coach Mobile PWA',
    tier: 'B',
    body: '70% des coachs ouvrent Coach OS depuis le mobile, mais l\'experience est degradee (touch targets < 32px, pas de mode offline, latence 1.8s). Une PWA corrigerait 60% des irritants pour 3 semaines de build. B parce que la valeur est defensive (on garde les coachs qu\'on a) plutot qu\'offensive (on en attire de nouveaux) — ROI indirect.',
    score: 58,
    area: 'Plateforme',
    owner: 'Marc Lefèvre',
    source: 'analytics mobile 2026-Q2 · sondage satisfaction mobile 38% NPS',
    reviewedOn: '2026-07-15',
    nextStep: 'parking lot Q1 2027 — a reclasser si churn mobile devient dominant',
  },
  {
    id: 'rank-token-rewards',
    name: 'Programme de token rewards',
    tier: 'F',
    body: 'L\'idee initiale etait de recompenser l\'usage par des tokens echangables. Trois problemes : (1) la valeur percue du token est nulle tant qu\'il n\'y a pas de marche, (2) la complexite comptable depasse la valeur ajoutee, (3) aucun signal de demande — 2/17 coachs interviewes ont mentionne ce besoin, et seulement apres qu\'on leur ait pose la question. Range en F : on garde l\'idee dans le wiki mais on ne la developpe pas.',
    score: 18,
    area: 'Growth',
    owner: '—',
    source: '17 entretiens, signal faible · benchmark programs tokenization',
    reviewedOn: '2026-07-12',
    nextStep: 'archive — wiki seul, a revisiter si le marche des tokens evolue',
  },
];

/* ═══ Lancement — 5 etapes canoniques avec preuve d'achevement ═══ */

const launchesDef = def({
  id: 'product_launches', name: 'Lancements', singular: 'Lancement', accent: APP_ACCENT,
  titleField: 'name', subtitleField: 'cohort', badgeField: 'stage',
  fields: [
    { key: 'stage', label: 'Étape', type: 'badge' },
    { key: 'state', label: 'État', type: 'badge' },
    { key: 'cohort', label: 'Cohorte', type: 'text' },
    { key: 'body', label: 'Preuve d\'achèvement', type: 'longtext' },
    { key: 'startedAt', label: 'Démarré le', type: 'text' },
    { key: 'eta', label: 'ETA', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'metric', label: 'Métrique de succès', type: 'text' },
  ],
});

const launchesItems: CmsItem[] = [
  {
    id: 'launch-session-content-dam',
    name: 'Session → Content Dam',
    stage: 'presell',
    state: 'doing',
    cohort: '8 coachs pilotes Q3',
    body: 'validate : 8 entretiens signes, 12 NPS, 9 disent "je payerais". presell : 6 des 8 ont verse 50% upfront sur un deliverable v0.3 — 4 lettres d\'intention signees. lancemente, audience, produitisation pas demarres.',
    startedAt: '2026-07-08',
    eta: '2026-09-12',
    owner: 'Priya Nandan',
    metric: '8/8 signatures avant 2026-08-30 · 4 lettres d\'intention livrees',
  },
  {
    id: 'launch-vault-share',
    name: 'Vault partage',
    stage: 'validate',
    state: 'doing',
    cohort: '3 coachs pilotes',
    body: 'validate : 17 entretiens, 14 demandes explicites, 3 coachs acceptent de tester sans remuneration. presell pas demarre (zero-pii routing spec en cours). lancemente, audience, produitisation pas demarres.',
    startedAt: '2026-07-22',
    eta: '2026-10-04',
    owner: 'Léa Bertrand',
    metric: '3/3 coachs confirment le protocole zero-pii avant 2026-09-01',
  },
  {
    id: 'launch-auto-brief-v2',
    name: 'Auto-brief v2',
    stage: 'launch',
    state: 'doing',
    cohort: '14 coachs actifs',
    body: 'validate : eval 50 trials, taux acceptation 82% apres 4 corrections. presell : 14 coachs en early-access depuis 2026-07-10. lancemente : deploiement progressif, 9/14 ont active, 5/14 attendent leur prochaine session. audience : pas demarre. produitisation : pas demarre.',
    startedAt: '2026-06-18',
    eta: '2026-08-22',
    owner: 'Sasha Mendes',
    metric: '9/14 activations · taux acceptation 75% en prod (cible 80%)',
  },
  {
    id: 'launch-compliance-pack',
    name: 'Compliance Audit Pack',
    stage: 'productize',
    state: 'doing',
    cohort: '2 cabinets d\'avocat pilotes',
    body: 'validate : 6 entretiens, 4 confirmations de besoin. presell : 2 devis signes 12k€ (vs 18k€ manuel). lancemente : 1er pack livre, 2eme en QA. audience : 4 cabinets en file. produitisation : pricing tier visible sur la landing, facturation automatisee, support dedie — presque complete.',
    startedAt: '2026-04-04',
    eta: '2026-09-01',
    owner: 'Jules Royer',
    metric: '2/2 cabinets pilotes signe · 4 cabinets en file · 0 incident P0',
  },
  {
    id: 'launch-quiz-diagnostic',
    name: 'Quiz diagnostic 6 signaux',
    stage: 'audience',
    state: 'doing',
    cohort: '1200 visiteurs uniques / mois',
    body: 'validate : 100 trials eval, scoring 92% (cible 90%). presell : 12% completion → 1.4% conversion, en haut du benchmark. lancemente : live depuis 2026-05-20. audience : 4k partages sociaux, 320 leads ajoutes a la file, NPS 47. produitisation : pas demarre (cohort pricing pas encore definit).',
    startedAt: '2026-03-12',
    eta: '2026-10-30',
    owner: 'Marc Lefèvre',
    metric: '1200 visiteurs/mois · 320 leads ajoutes · NPS 47',
  },
  {
    id: 'launch-voice-fidelity-v2',
    name: 'Voice fidelity v2',
    stage: 'launch',
    state: 'done',
    cohort: 'tous les clients prod',
    body: 'validate : MOS 4.21 sur corpus 50 essais vs 3.91 v3. presell : pas applicable (feature invisible). lancemente : rollback v3 applique 2026-07-08, v2 promue en prod le meme jour. audience : 100% des clients actifs. produitisation : fait partie du SLA standard, pas de pricing dedie.',
    startedAt: '2026-06-25',
    eta: '2026-07-08 (termine)',
    owner: 'Quality Agent',
    metric: '100% clients sur v2 · 0 incident MOS depuis 2026-07-08',
  },
];

/* ═══ MVP — plus petit livrable : feature / client / probleme ═══ */

const mvpsDef = def({
  id: 'product_mvps', name: 'MVP', singular: 'MVP', accent: APP_ACCENT,
  titleField: 'name', subtitleField: 'client', badgeField: 'overflow',
  fields: [
    { key: 'feature', label: 'Feature', type: 'text' },
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'body', label: 'Problème', type: 'longtext' },
    { key: 'overflow', label: 'Débordement', type: 'badge' },
    { key: 'weeksToShip', label: 'Semaines pour shipper', type: 'number' },
    { key: 'eta', label: 'Date cible', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'successMetric', label: 'Métrique de succès', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const mvpsItems: CmsItem[] = [
  {
    id: 'mvp-content-dam-export',
    name: 'Export de 3 posts LinkedIn depuis une session',
    feature: 'Un bouton "Exporter 3 posts" sur le transcript structure',
    client: 'Priya Nandan (coach transition, 28 sessions/mois)',
    body: 'Priya passe 90 minutes par session a deriver 3 posts LinkedIn qu\'elle finit par ne pas poster. La derive est repetitive : intro, 3 takeaways, CTA. Elle veut que Coach OS les sorte en 30 secondes pour les editer vite.',
    overflow: 'ok',
    weeksToShip: 2,
    eta: '2026-08-12',
    owner: 'Sprint Planner',
    successMetric: 'Priya poste 3 posts/semaine · 90 → 8 min de travail',
    notes: 'Aucune derive visible. Le feature tient sur un seul transcript, un seul client, un seul probleme. La productisation attendra le retour de Priya sur 4 semaines.',
  },
  {
    id: 'mvp-onboarding-sms',
    name: 'SMS H+2 / H+18 / appel H+24',
    feature: 'Sequence SMS automatique + un appel calibre',
    client: 'tout nouveau client qui signe (cohorte 8/mois)',
    body: 'A 24h post-signature, 47% des nouveaux clients n\'ont rien reserve et churn dans le mois. Le mail est invisible. Un SMS a 90% d\'ouverture a H+2, l\'appel a H+24 est percu comme un service. Sans ce triptyque, le funnel onboarding perd la moitie des signatures.',
    overflow: 'client',
    weeksToShip: 1,
    eta: '2026-08-08',
    owner: 'Growth Agent',
    successMetric: 'taux de booking H+24 passe de 53% a 78%',
    notes: 'Debordement "client" : on ne sert plus UN client, on sert toute la cohorte. C\'est la frontiere entre le MVP et le programme — assumee, pas accidentelle. Le pilote de 4 semaines sur 8 clients decide si on garde la sequence ou si on la retaille en une seule variante.',
  },
  {
    id: 'mvp-vault-tag-search',
    name: 'Recherche par tag dans le vault',
    feature: 'Filtrer les entrees du vault par 1 tag, plus vite que le scan substring actuel',
    client: 'Sasha Mendes (coach exec, 412 entrees vault, 14 jours d\'usage cumule)',
    body: 'Le scan substring actuel prend 4 secondes au-dela de 1k entrees. Sasha perd 25 minutes par jour a chercher. Le tag indexing reduit le p95 a 200ms. Une seule feature, un seul client, un seul probleme — c\'est l\'exemple-type du MVP.',
    overflow: 'ok',
    weeksToShip: 1,
    eta: '2026-08-18',
    owner: 'Knowledge Agent',
    successMetric: 'p95 search 4s → 200ms · Sasha confirme gain de temps',
    notes: 'Aucun overflow detecte. Le tag indexing est local au vault, ne touche pas le routage, n\'expose pas les notes. La proposition "change-vault-tag-search" est deja dans la file operations, scope aligne.',
  },
  {
    id: 'mvp-quiz-cta-mobile',
    name: 'CTA "voir mon diagnostic" sur mobile',
    feature: 'Un bouton unique, pleine largeur, en bas de l\'ecran mobile',
    client: 'visiteur mobile du quiz (320 leads/mois, taux conversion 1.4%)',
    body: 'Le CTA actuel est un lien inline que les mobiles ratent (44% de scrolls l\'ignorent). Le placer en barre fixe bottom augmente la conversion de 28% sur les tests A/B menes en juin.',
    overflow: 'ok',
    weeksToShip: 0.5,
    eta: '2026-08-10',
    owner: 'Growth Agent',
    successMetric: 'conversion mobile 1.4% → 1.8%',
    notes: 'Aucun overflow. C\'est la plus petite feature livrable du backlog — un composant CSS + un test A/B. A surveiller : si on commence a dupliquer pour chaque nouveau CTA, on doit sortir du MVP.',
  },
  {
    id: 'mvp-billing-portal',
    name: 'Lien portail Stripe dans l\'espace client',
    feature: 'Un lien "gerer ma facturation" qui ouvre le Stripe Customer Portal',
    client: 'Marc D. (expert-comptable solo, 1 seule signature, 1 probleme recurrent)',
    body: 'Marc a deja change 2 fois de carte bancaire sans nous prevenir — l\'update s\'est fait via un mail au support au lieu d\'un portail self-service. Coacher chaque client sur Stripe-hosted est du cout de support pur. Le portail Stripe resout 100% du probleme en 1 ligne de code.',
    overflow: 'ok',
    weeksToShip: 0.5,
    eta: '2026-08-06',
    owner: 'Sasha Mendes',
    successMetric: '0 ticket "changer ma carte" sur les 30 jours post-livraison',
    notes: 'Aucun overflow. C\'est la feature la plus petite possible pour le probleme. La productisation (relancer Marc avant l\'echeance) viendra apres.',
  },
  {
    id: 'mvp-bench-quiz-v3',
    name: 'Recalibrage scoring 6 signaux v3',
    feature: 'Re-ponderation du signal "booked-out ratio" dans le scoring diagnostic',
    client: 'tous les coachs actifs (62 leads evalues / mois)',
    body: 'Le benchmark quiz-scoring montre 8% de derives sur les cas ou le lead est a la frontiere (score 50-70). Le signal "booked-out ratio" est sous-ponderé. La recalibration corrige 6% des derives identifiees, sans toucher au reste du pipeline.',
    overflow: 'feature',
    weeksToShip: 1,
    eta: '2026-08-15',
    owner: 'Quality Agent',
    successMetric: 'pass rate benchmark 92% → 96%',
    notes: 'Debordement "feature" : on commence a toucher au scoring, qui est partage par les 6 signaux. Pour rester dans le MVP, on isole la recalibration sur un sous-ensemble de 100 trials — pas sur tous les leads. Si la recalibration tient en isolation, on elargit.',
  },
];

/* ═══ Ideation — idees brutes notees sur 4 angles ═══ */

const ideasDef = def({
  id: 'product_ideas', name: 'Idéation', singular: 'Idée', accent: APP_ACCENT,
  titleField: 'name', subtitleField: 'summary', badgeField: 'trend',
  fields: [
    { key: 'trend', label: 'Tendance porteuse', type: 'badge' },
    { key: 'opportunity', label: 'Opportunité', type: 'badge' },
    { key: 'demand', label: 'Demande observée', type: 'badge' },
    { key: 'economicSize', label: 'Taille économique', type: 'badge' },
    { key: 'summary', label: 'Résumé', type: 'longtext' },
    { key: 'body', label: 'Argumentaire détaillé', type: 'longtext' },
    { key: 'source', label: 'Source / signal', type: 'text' },
    { key: 'raisedBy', label: 'Soulevé par', type: 'text' },
    { key: 'raisedOn', label: 'Soulevé le', type: 'text' },
    { key: 'ask', label: 'Prochaine question', type: 'text' },
  ],
});

const ideasItems: CmsItem[] = [
  {
    id: 'idea-cohort-pricing',
    name: 'Pricing par cohorte (3 coachs = -25%)',
    trend: 'high',
    opportunity: 'high',
    demand: 'observed',
    economicSize: 'mid',
    summary: '3 coachs qui se connaissent et signent ensemble obtiennent -25% sur leur annee 1. La demande est explicite : 6 des 17 entretiens Q1 mentionnent "je connais 2 collegues qui veulent bien essayer". La tendance "small-group SaaS" porte depuis 2024 (voir Notion, Linear). Risque : erosion du panier moyen si la cohorte tient.',
    body: 'Le pricing par cohorte n\'est pas qu\'une remise — c\'est un changement de comportement d\'achat. Les coachs isolent leur decision ; en cohorte, ils la partagent, et partagent aussi l\'echec si le service deçoit. Les 6 entretiens qui mentionnent cette demande sont tous des coachs qui ont deja essaye un outil avec un pair. La tendance small-group SaaS (Notion, Linear, Figma en 2019) confirme que le marche accepte la grappe. Risque : si la cohorte tient, l\'erosion panier peut atteindre -18% sur l\'annee 1 — c\'est la ou la reduction vaut son cout.',
    source: '17 entretiens · benchmark Linear/Notion cohort pricing 2024-2026',
    raisedBy: 'Camille S. (CFO)',
    raisedOn: '2026-07-21',
    ask: 'Cadrer l\'impact MRR et churn avant de promettre la remise.',
  },
  {
    id: 'idea-vault-export-notion',
    name: 'Auto-export vault vers Notion',
    trend: 'med',
    opportunity: 'med',
    demand: 'observed',
    economicSize: 'small',
    summary: '6 coachs utilisent deja Notion comme second cerveau. Le vault pourrait pousser chaque entree structuree vers une database Notion qu\'ils config eux-memes. Demande confirmee, mais la valeur economique reste limitee — c\'est du confort, pas une nouvelle proposition. A deja ete propose par Knowledge Agent (change-notion-export-bundle, statut "proposed").',
    body: 'L\'integration Notion a un cout cache : chaque nouvelle integration tierce ajoute une dependance de routage que le coach doit configurer. Pour 6 coachs interesses, c\'est jouable. La valeur economique est petite (~3h/mois gagnees par coach) mais reelle. Le vrai risque est que Notion change d\'API ou de pricing — ce qui est arrive 3 fois entre 2023 et 2026. A surveiller comme dependance externe.',
    source: 'sondage Notion-vs-vault · 6 declarations spontanees',
    raisedBy: 'Knowledge Agent',
    raisedOn: '2026-07-14',
    ask: 'Valider que Notion reste le bon canal dans 12 mois (vs Obsidian, vs Capacities).',
  },
  {
    id: 'idea-client-portal-readonly',
    name: 'Portail client en lecture seule',
    trend: 'high',
    opportunity: 'high',
    demand: 'latent',
    economicSize: 'large',
    summary: 'Les clients des coachs n\'ont aujourd\'hui aucune visibilite sur leur plan, leurs sessions a venir, leurs notes partagees. Un portail read-only resout 3 demandes distinctes : (1) le client veut voir son plan sans appeler le coach, (2) le client veut preparer la prochaine session, (3) le client veut transmettre un document a son coach. Tendance "client portal" est universelle (banque, sante, legal). Demande latente : personne ne le demande avant de l\'avoir vu.',
    body: 'La latence de la demande est typique des biens invisibles : les clients ne savent pas qu\'ils peuvent avoir un portail, donc ne le reclament pas. Le bon signal est dans les 4 entretiens qui disent "j\'aimerais voir mon plan" — c\'est la demande sans le mot. La taille economique est large parce que le portail devient le point de contact entre le client et le coach : onboarding, suivi, facturation, partage de documents. Une seule vue (sessions a venir) suffirait comme MVP pour valider.',
    source: '17 entretiens · 4/17 mentionnent "voir mon plan" · benchmark banque/sante',
    raisedBy: 'Marc D. (expert-comptable)',
    raisedOn: '2026-07-09',
    ask: 'Identifier le MVP — une seule vue (sessions a venir) suffit-elle pour valider ?',
  },
  {
    id: 'idea-pricing-engagement-3m',
    name: 'Pricing a l\'engagement 3 mois (vs package 6 mois)',
    trend: 'med',
    opportunity: 'med',
    demand: 'observed',
    economicSize: 'mid',
    summary: '14 coachs sondes en juin 2026. Ceux qui passent en engagement 3 mois apres 6 mois en package voient leur revenu mensuel doubler au mois 4 (10/14 confirment, 4 mitiges). La memoire "mem-coach-360" confirme mais reste "to-verify" — un seul panel. Tendance "engagement pricing" stable depuis 2 ans.',
    body: 'Le doublement de revenu tient probablement pour 2 raisons : (1) le coach vend 4 engagements par mois au lieu de 2 packages, donc volume x2 ; (2) la friction d\'achat baisse — un engagement 3 mois est plus facile a decider qu\'un package 6 mois. Les 4 coachs qui ne confirment pas le doublement sont ceux dont le client type ne peut pas payer en 3 mensualites. A tester avec un second panel avant de generaliser.',
    source: 'sondage 14 coachs panel A · mem-coach-360',
    raisedBy: 'Léa B. (coach de transition)',
    raisedOn: '2026-06-30',
    ask: 'Lancer panel B en septembre pour confirmer le doublement de revenu.',
  },
  {
    id: 'idea-multimodal-session',
    name: 'Session multimodale (video + tableau + voix)',
    trend: 'high',
    opportunity: 'low',
    demand: 'latent',
    economicSize: 'mid',
    summary: 'Aujourd\'hui les sessions sont video + transcript. Un tableau collaboratif + pointer la voix pendant que le coach dessine le parcours client ouvre une nouvelle couche. Tendance forte (Miro, Figjam, tldraw). Opportunite moyenne : on n\'est pas un outil de tableau, on est un coach. Demande latente : 2/17 entretiens le mentionnent apres que la question soit posee.',
    body: 'L\'opportunite est moyenne parce qu\'integrer un tableau collaboratif dans une session prend 6 a 8 semaines de build, alors que rediriger vers Miro est 1 ligne d\'integration. Le vrai arbitrage : est-ce que la valeur ajoutee (workflow integre) justifie le cout, ou est-ce que l\'integration (workflow compose) suffit. Demande latente confirmee par 2 entretiens, mais aucun n\'a dit qu\'il quitterait Coach OS pour cette raison.',
    source: '17 entretiens · benchmark Miro/Figjam pricing · 2 declarations faibles',
    raisedBy: 'Sasha Mendes',
    raisedOn: '2026-07-04',
    ask: 'Decider si on integre (cout build eleve) ou si on redirige vers Miro (cout integration).',
  },
  {
    id: 'idea-coach-dashboard-public',
    name: 'Dashboard public pour le coach (page perso)',
    trend: 'low',
    opportunity: 'low',
    demand: 'none',
    economicSize: 'small',
    summary: 'Une page web publique par coach (style linktree + 1 chiffre cle : "47 sessions dispensees, NPS 51") pour qu\'il puisse partager sa pratique. Tendance faible (les linktrees sont stables, pas en croissance). Opportunite basse : on n\'a pas de moteur de croissance qui profiterait de la page. Demande aucune : 0/17 entretiens en parle spontanement.',
    body: 'L\'idee reste en ideation tant qu\'aucun signal de demande n\'apparait. Les pages publiques type linktree sont consommees par les coachs qui veulent une presence minimale — pas par ceux qui veulent construire une audience. Pour Coach OS, ce segment n\'est pas la cible. A reouvrir si une nouvelle cohorte de coachs "personal brand" emerge et qu\'ils reclament cette feature.',
    source: '17 entretiens · signal nul · benchmark linktree/cal.com',
    raisedBy: 'Marc Lefèvre',
    raisedOn: '2026-07-02',
    ask: 'Aucune — l\'idee reste en ideation jusqu\'a ce qu\'un signal de demande apparaisse.',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedProductCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(rankingsDef, rankingsItems);
  store.registerCollection(launchesDef, launchesItems);
  store.registerCollection(mvpsDef, mvpsItems);
  store.registerCollection(ideasDef, ideasItems);
}