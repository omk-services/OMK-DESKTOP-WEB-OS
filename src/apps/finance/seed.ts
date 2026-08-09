/** FinanceApp — local seed for the four sections added on top of the existing
 *  overview / runway / invoices surfaces.
 *
 *  Each collection follows the same `def` + `items` + `registerCollection`
 *  contract as `src/lib/cms/seed.ts`, but lives here so the finance app
 *  stays self-contained. `seedFinanceCms()` is called once at module load
 *  from FinanceApp.tsx — idempotent thanks to `registerCollection`'s
 *  early-return guard.
 *
 *  The four collections cover the pricing quartet:
 *    - plancher_marges : the floor below which an offer cannot be sold
 *    - courbe_demande  : price-scenarios x estimated volume per offer
 *    - budget_tokens   : model spend vs FTE cost it replaces
 *    - formes_prix     : the billing shapes an offer can take
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Plancher de marge — floor below which an offer stops being sold ═══ */

const plancherDef = def({
  id: 'plancher_marges', name: 'Planchers de marge', singular: 'Plancher', accent: '#0d9488',
  titleField: 'offer', subtitleField: 'category', badgeField: 'status',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'realCost', label: 'Real cost / unit', type: 'currency' },
    { key: 'floor', label: 'Floor / unit', type: 'currency' },
    { key: 'price', label: 'Listed price / unit', type: 'currency' },
    { key: 'gap', label: 'Gap (price − floor)', type: 'currency' },
    { key: 'marginPct', label: 'Margin over floor', type: 'number' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const plancherItems: CmsItem[] = [
  {
    id: 'plancher-citadelle-mensuel',
    offer: 'Citadelle · coaching mensuel',
    category: 'Coaching récurrent',
    unit: 'client / mois',
    realCost: 380,
    floor: 540,
    price: 1200,
    gap: 660,
    marginPct: 55,
    status: 'ok',
    note: 'Plancher calé sur 4 sessions + 1 synthèse + 1 hotline. Tout rabais sous 540€ rend la prestation déficitaire — la céder en dessous, c\'est payer pour travailler.',
  },
  {
    id: 'plancher-session-unitaire',
    offer: 'Session de diagnostic unitaire',
    category: 'Coaching ponctuel',
    unit: 'session 90 min',
    realCost: 165,
    floor: 220,
    price: 380,
    gap: 160,
    marginPct: 42,
    status: 'ok',
    note: 'Plancher à 220€ couvre la prep (45 min) + la session + la note écrite. Sous ce seuil, on vend notre temps, pas notre expertise.',
  },
  {
    id: 'plancher-atelier-groupe',
    offer: 'Atelier collectif · Cohorte 8',
    category: 'Group program',
    unit: 'place / cohorte',
    realCost: 290,
    floor: 380,
    price: 590,
    gap: 210,
    marginPct: 36,
    status: 'warn',
    note: 'Le plancher tient pour 8 inscrits. À 6 inscrits il faut remonter le prix à 690€ OU pousser une 7ᵉ place via la liste d\'attente — jamais brader le plancher.',
  },
  {
    id: 'plancher-diagnostic-6-signaux',
    offer: 'Diagnostic 6-signaux · Citadelle',
    category: 'Produit digital',
    unit: 'licence annuelle',
    realCost: 28,
    floor: 48,
    price: 89,
    gap: 41,
    marginPct: 46,
    status: 'ok',
    note: 'Coût marginal OpenAI + hébergement + Stripe. Plancher à 48€ = 6 appels LLM moyens + 1h d\'audit mensuel. Sous le plancher, on finance les clients qui ne renouvellent pas.',
  },
  {
    id: 'plancher-accompagnement-3-mois',
    offer: 'Accompagnement 3 mois · premium',
    category: 'Coaching récurrent',
    unit: 'package 3 mois',
    realCost: 1450,
    floor: 2100,
    price: 3600,
    gap: 1500,
    marginPct: 42,
    status: 'ok',
    note: 'Plancher calibré sur 12 sessions + 3 synthèses + 6 hotlines + 1 bilan. Tout rabais au-dessus de 15% doit passer en revue — la dernière fois c\'était un ex-client qu\'on n\'a pas récupéré.',
  },
  {
    id: 'plancher-keynote-entreprise',
    offer: 'Keynote entreprise',
    category: 'Événement',
    unit: 'prestation',
    realCost: 880,
    floor: 1400,
    price: 2400,
    gap: 1000,
    marginPct: 42,
    status: 'ok',
    note: 'Prep 6h + prestation 90 min + 1 débrief. Plancher à 1400€ couvre le coût d\'opportunité (1 journée coach facturable 3× plus en coaching individuel).',
  },
  {
    id: 'plancher-onboarding-setup',
    offer: 'Onboarding client · setup initial',
    category: 'Setup',
    unit: 'client',
    realCost: 220,
    floor: 280,
    price: 450,
    gap: 170,
    marginPct: 38,
    status: 'danger',
    note: 'Sous le plancher aujourd\'hui — le setup Zero-PII + provisioning Calendly + brief auto nous coûte plus qu\'on ne le facture. À remonter à 540€ au prochain Quarterly renewal, ou à bundler dans le mensuel.',
  },
];

/* ═══ Courbe de demande — price scenarios and estimated volume ═══ */

const courbeDef = def({
  id: 'courbe_demande', name: 'Courbes de demande', singular: 'Courbe', accent: '#0d9488',
  titleField: 'offer', subtitleField: 'elasticity', badgeField: 'sensitivity',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'scenarios', label: 'Scenarios (price · volume)', type: 'longtext' },
    { key: 'elasticity', label: 'Elasticity', type: 'badge' },
    { key: 'sweetSpot', label: 'Sweet spot (€)', type: 'currency' },
    { key: 'sensitivity', label: 'Sensitivity', type: 'badge' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const courbeItems: CmsItem[] = [
  {
    id: 'courbe-citadelle-mensuel',
    offer: 'Citadelle · coaching mensuel',
    category: 'Coaching récurrent',
    scenarios: '690€ → 4 clients / mois · 980€ → 6 clients / mois · 1200€ → 8 clients / mois · 1490€ → 6 clients / mois · 1790€ → 3 clients / mois',
    elasticity: 'low',
    sweetSpot: 1200,
    sensitivity: 'ok',
    notes: 'Pente douce — passer de 1200€ à 1490€ ne perd qu\'un client. Au-dessus de 1500€, le marché se ferme (3 clients max, profil CTO/dirigeant uniquement). Le sweet spot à 1200€ maximise le revenu sans plafond.',
  },
  {
    id: 'courbe-session-unitaire',
    offer: 'Session de diagnostic unitaire',
    category: 'Coaching ponctuel',
    scenarios: '280€ → 18 sessions / mois · 380€ → 12 sessions / mois · 480€ → 7 sessions / mois · 580€ → 4 sessions / mois · 680€ → 2 sessions / mois',
    elasticity: 'med',
    sweetSpot: 380,
    sensitivity: 'ok',
    notes: 'Pente classique des services B2B. Au-dessus de 480€ on perd plus que la moyenne — c\'est le segment des PME qui sort. Sweet spot à 380€ garde la cohorte des profils confirmés.',
  },
  {
    id: 'courbe-atelier-groupe',
    offer: 'Atelier collectif · Cohorte 8',
    category: 'Group program',
    scenarios: '390€ → 12 inscrits (file d\'attente) · 490€ → 9 inscrits · 590€ → 7 inscrits · 690€ → 5 inscrits · 890€ → 3 inscrits',
    elasticity: 'high',
    sweetSpot: 590,
    sensitivity: 'warn',
    notes: 'Élastique — la cohorte plafonne à 8 places, donc l\'offre disparait vite. À 390€ on a une file d\'attente mais on brade. Le sweet spot à 590€ garde 1 place pour l\'upsell au coaching individuel post-atelier.',
  },
  {
    id: 'courbe-diagnostic-6-signaux',
    offer: 'Diagnostic 6-signaux · Citadelle',
    category: 'Produit digital',
    scenarios: '29€ → 180 licences / mois · 59€ → 95 licences / mois · 89€ → 62 licences / mois · 129€ → 28 licences / mois · 199€ → 9 licences / mois',
    elasticity: 'med',
    sweetSpot: 89,
    sensitivity: 'ok',
    notes: 'Légèrement inélastique à 89€ car le diagnostic 6-signaux est perçu comme un outil, pas comme un service. Au-dessus de 129€, on perd la cible indie/PME qui est 80% du marché.',
  },
  {
    id: 'courbe-accompagnement-3-mois',
    offer: 'Accompagnement 3 mois · premium',
    category: 'Coaching récurrent',
    scenarios: '2400€ → 4 packages / trimestre · 3000€ → 5 packages / trimestre · 3600€ → 5 packages / trimestre · 4500€ → 3 packages / trimestre · 5400€ → 1 package / trimestre',
    elasticity: 'low',
    sweetSpot: 3600,
    sensitivity: 'ok',
    notes: 'Quasi-inélastique entre 3000€ et 3600€ — le profil visé (dirigeant, CTO à +100k€) ne regarde pas à 600€. Au-dessus de 4500€, on tombe sur des comités d\'achat qui allongent le cycle à 6+ semaines.',
  },
  {
    id: 'courbe-keynote-entreprise',
    offer: 'Keynote entreprise',
    category: 'Événement',
    scenarios: '1800€ → 6 mandates / trimestre · 2400€ → 4 mandates / trimestre · 3200€ → 2 mandates / trimestre · 4000€ → 1 mandate / trimestre',
    elasticity: 'med',
    sweetSpot: 2400,
    sensitivity: 'warn',
    notes: 'Demande instable car le calendrier des événements se concentre en mai-juin et septembre-octobre. Le sweet spot à 2400€ accepte une marge de négociation jusqu\'à 2100€ sans casser le plancher.',
  },
];

/* ═══ Budget de tokens — model spend vs FTEs it avoids ═══ */

const budgetTokensDef = def({
  id: 'budget_tokens', name: 'Budgets tokens', singular: 'Budget', accent: '#0d9488',
  titleField: 'use', subtitleField: 'category', badgeField: 'status',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'monthlyTokens', label: 'Monthly tokens', type: 'number' },
    { key: 'modelCost', label: 'Model cost / month', type: 'currency' },
    { key: 'fteRole', label: 'FTE role replaced', type: 'text' },
    { key: 'fteSalary', label: 'FTE annual cost', type: 'currency' },
    { key: 'coverage', label: 'Coverage of role', type: 'text' },
    { key: 'ratio', label: 'Tokens cost vs FTE', type: 'text' },
    { key: 'monthlySaving', label: 'Net monthly saving', type: 'currency' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const budgetTokensItems: CmsItem[] = [
  {
    id: 'budget-reception',
    use: 'Réception & qualification des leads',
    category: 'Sales ops',
    monthlyTokens: 4_200_000,
    modelCost: 186,
    fteRole: 'SDR / commercial sédentaire',
    fteSalary: 52000,
    coverage: '65% du triage (heures ouvrées, FR/EN)',
    ratio: '1 mois de tokens = 0,043% d\'un ETP',
    monthlySaving: 4147,
    status: 'ok',
    notes: 'Couvre 24/6 FR/EN. Le 35% restant (négos complexes, comptes >50k€ ARR) reste humain. L\'économie nette finance déjà 2 mois de l\'audit de sécurité annuel.',
  },
  {
    id: 'budget-synthese-session',
    use: 'Synthèse de session · client-facing',
    category: 'Coaching',
    monthlyTokens: 18_500_000,
    modelCost: 612,
    fteRole: 'Assistant·e rédaction · 0,4 ETP',
    fteSalary: 22000,
    coverage: '100% des sessions bookées',
    ratio: '8% du coût d\'un mi-temps rédaction',
    monthlySaving: 1221,
    status: 'ok',
    notes: 'Synthèse livrée en <10 min après la session, citée dans 89% des cas par les clients. Le mi-temps humain a été redéployé sur l\'onboarding client — gain net d\'un ETP équivalent sur 6 mois.',
  },
  {
    id: 'budget-brief-quotidien',
    use: 'Brief quotidien des coachs',
    category: 'Coaching',
    monthlyTokens: 9_800_000,
    modelCost: 388,
    fteRole: 'Coordinateur·rice planning',
    fteSalary: 36000,
    coverage: 'Brief auto avant chaque session + récap fin de journée',
    ratio: '13% du coût d\'un ETP planning',
    monthlySaving: 2612,
    status: 'ok',
    notes: 'Le brief consomme 9 à 14k tokens par session. On l\'a scope-down à 6k en passant à un modèle plus petit pour le contexte récurrent. Le ratio reste imbattable même à 4× le coût.',
  },
  {
    id: 'budget-knowledge-search',
    use: 'Recherche sémantique IP Vault',
    category: 'Knowledge',
    monthlyTokens: 6_400_000,
    modelCost: 244,
    fteRole: 'Knowledge manager · 0,2 ETP',
    fteSalary: 14000,
    coverage: 'Recherche tag + résumé des 12 derniers mois de vault',
    ratio: '21% du coût d\'un ETP knowledge',
    monthlySaving: 922,
    status: 'ok',
    notes: 'Substitué à un grep + reline manuelle. Les 3 coaches qui ont migré dessus consacrent 22 minutes de moins par semaine à chercher leurs notes — gain qui ne se voit pas en € mais qui se sent.',
  },
  {
    id: 'budget-veille',
    use: 'Veille sectorielle hebdomadaire',
    category: 'R&D',
    monthlyTokens: 22_000_000,
    modelCost: 920,
    fteRole: 'Analyste veille · 0,3 ETP',
    fteSalary: 21000,
    coverage: 'Sur 38 sources (concurrence, recherche, brevets)',
    ratio: '53% du coût d\'un mi-temps veille',
    monthlySaving: 830,
    status: 'warn',
    notes: 'Le coût a doublé en 3 mois parce qu\'on agrège maintenant les brevets EPO. Le ratio reste en notre faveur mais c\'est le poste à surveiller — un passage à un modèle embeddings-only le ramènerait à 320€/mois.',
  },
  {
    id: 'budget-quiz-scoring',
    use: 'Scoring du diagnostic 6-signaux',
    category: 'Produit',
    monthlyTokens: 14_200_000,
    modelCost: 478,
    fteRole: 'Scorer psychométrique · 0,15 ETP',
    fteSalary: 12000,
    coverage: '100% des complétions du quiz',
    ratio: '48% du coût d\'un ETP scoring',
    monthlySaving: 522,
    status: 'ok',
    notes: 'Le scoring tourne 3 fois (re-scoring après feedback) — c\'est ce qui justifie le coût. Sans le 3ᵉ passage, on perd 4 points de fidélité au diagnostic. Ratio toujours favorable à 2× le coût.',
  },
];

/* ═══ Formes de prix — billing shapes for the same offering ═══ */

const formesDef = def({
  id: 'formes_prix', name: 'Formes de prix', singular: 'Forme', accent: '#0d9488',
  titleField: 'shape', subtitleField: 'offer', badgeField: 'cashflow',
  fields: [
    { key: 'offer', label: 'Offer', type: 'text' },
    { key: 'pricing', label: 'Pricing', type: 'longtext' },
    { key: 'cashflow', label: 'Cash flow', type: 'badge' },
    { key: 'commitment', label: 'Client commitment', type: 'text' },
    { key: 'risk', label: 'Risk for coach', type: 'text' },
    { key: 'bestFor', label: 'Best for', type: 'longtext' },
  ],
});

const formesItems: CmsItem[] = [
  {
    id: 'forme-setup-one-shot',
    shape: 'Frais d\'installation (one-shot)',
    offer: 'Citadelle · onboarding',
    pricing: '450€ setup + 1200€/mois récurrent. Le setup est facturé à la signature, non remboursable.',
    cashflow: 'immediate',
    commitment: 'Engagement 6 mois sur le récurrent, sinon payback du setup.',
    risk: 'Charge perçue comme élevée en entrée — peut bloquer 1 client sur 6 à la signature.',
    bestFor: 'Clients B2B avec budget validé en amont. Filtre les curieux. Le setup finance la semaine de pré-configuration Zero-PII.',
  },
  {
    id: 'forme-abonnement-mensuel',
    shape: 'Abonnement mensuel',
    offer: 'Citadelle · coaching mensuel',
    pricing: '1200€/mois, prélevé le 1ᵉʳ, sans engagement au-delà de 30 jours.',
    cashflow: 'recurring',
    commitment: 'Faible — le client part quand il veut. La rétention repose sur la valeur perçue, pas le contrat.',
    risk: 'Churn plus haut qu\'un package. Compensation par l\'upsell vers les formes 3-mois ou premium.',
    bestFor: 'PME en test de la relation. Premier contact stable. C\'est la forme par défaut — 60% des clients y restent en moyenne 4,2 mois.',
  },
  {
    id: 'forme-package-3-mois',
    shape: 'Package 3 mois',
    offer: 'Accompagnement premium',
    pricing: '3600€ payés en 1× (ou 3× 1200€). Économie de ~15% vs mensuel.',
    cashflow: 'upfront',
    commitment: '12 sessions planifiées sur 12 semaines, 3 synthèses, 1 bilan.',
    risk: 'Si le client part avant 6 semaines, on doit rembourser au prorata — la marge réelle tombe à 18% au lieu de 42%.',
    bestFor: 'Profils avec un objectif daté (lancement, prise de poste, négociation). C\'est la forme la plus rentable par client — 32% du CA, 21% des clients.',
  },
  {
    id: 'forme-per-event',
    shape: 'À l\'événement',
    offer: 'Keynote entreprise',
    pricing: '2400€ par keynote, +800€ par atelier additionnel le même jour, déplacement inclus France.',
    cashflow: 'event',
    commitment: 'Aucun récurrent. Le client décide d\'une nouvelle keynote quand il a un nouvel événement.',
    risk: 'Demande cyclique (mai-juin + septembre-octobre). Trous de 3 mois possibles — à coupler avec la prospection active.',
    bestFor: 'Grandes entreprises avec calendrier événementiel. Le meilleur canal de notoriété vers des cibles qu\'on n\'atteint pas en inbound.',
  },
  {
    id: 'forme-gratuit-accroche',
    shape: 'Gratuit en accroche',
    offer: 'Diagnostic 6-signaux · 1ʳᵉ utilisation',
    pricing: 'Diagnostic complet offert. Upsell vers le coaching ou la licence annuelle à l\'issue du résultat.',
    cashflow: 'deferred',
    commitment: 'Aucun — le client est libre de partir après le diagnostic.',
    risk: 'Coût marginal par diagnostic ≈ 0,40€. Si le taux de conversion reste sous 8%, l\'accroche coûte plus qu\'elle ne rapporte.',
    bestFor: 'Prospects froids qui n\'ont jamais coaché. Le funnel d\'acquisition principal — 71% des nouveaux clients y passent.',
  },
  {
    id: 'forme-retainer',
    shape: 'Retainer (forfait mensuel)',
    offer: 'Coaching dirigeants · retainer',
    pricing: '2800€/mois, 4 sessions + hotline + 1 synthèse écrite par mois, facturé trimestre à terme échu.',
    cashflow: 'recurring',
    commitment: 'Engagement 6 mois renouvelable. Résiliation à 90 jours.',
    risk: 'Le client peut "consommer" 1 session puis arrêter. Marge réelle ≈ 28% si le client sous-utilise.',
    bestFor: 'Dirigeants qui veulent une présence continue sans la charge d\'un calendrier session-par-session. 4 clients retainer financent l\'équivalent de 11 clients en mensuel.',
  },
];

/* ═══ Overview KPIs + Runway projection — unit economics at a glance ═══ */

const overviewDef = def({
  id: 'finance_overview', name: 'Finance overview', singular: 'Overview metric', accent: '#0d9488',
  titleField: 'label', subtitleField: 'hint', badgeField: 'tone',
  fields: [
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'tone', label: 'Tone', type: 'badge' },
    { key: 'hint', label: 'Hint', type: 'text' },
    { key: 'projection', label: '12-month projection (k$)', type: 'longtext' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const overviewItems: CmsItem[] = [
  {
    id: 'overview-mrr',
    label: 'MRR',
    value: '$3,600',
    unit: 'USD',
    tone: 'ok',
    hint: '2 Citadelle clients',
    note: 'Monthly Recurring Revenue — base installée en abonnement mensuel.',
  },
  {
    id: 'overview-burn',
    label: 'Monthly burn',
    value: '$1,450',
    unit: 'USD',
    tone: 'warn',
    hint: 'tokens + infra + 1 ETP mi-temps',
    note: 'Sortie mensuelle moyenne — modèle + hébergement + ops. Hors investissement R&D.',
  },
  {
    id: 'overview-runway',
    label: 'Runway',
    value: '17 mo',
    unit: 'months',
    tone: 'accent',
    hint: 'at current burn',
    note: 'Mois de coussin au burn actuel avant d\'atteindre zéro. Cible : > 12 mois.',
  },
  {
    id: 'overview-ltv-cac',
    label: 'LTV : CAC',
    value: '9.4 : 1',
    unit: 'ratio',
    tone: 'ok',
    hint: 'marketplace + in-voice channels',
    note: 'Lifetime Value / Customer Acquisition Cost. Seuil sain : > 3:1. Au-dessus de 5:1, on sous-investit dans la croissance.',
  },
  {
    id: 'overview-projection',
    label: 'Cash projection',
    value: '42 → 25',
    unit: 'k$',
    tone: 'warn',
    hint: '12 months forward',
    projection: '[42, 40, 39, 37, 36, 34, 33, 31, 30, 28, 27, 25]',
    note: 'Projection linéaire sur 12 mois au burn actuel. Sans nouvelle levée ni accélération du MRR, le coussin fond de 17k$ sur l\'année.',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedFinanceCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(plancherDef, plancherItems);
  store.registerCollection(courbeDef, courbeItems);
  store.registerCollection(budgetTokensDef, budgetTokensItems);
  store.registerCollection(formesDef, formesItems);
  store.registerCollection(overviewDef, overviewItems);
}
