/* ────────────────────────────────────────────────────────────────────────────
   Coach OS — landing content

   Source de vérité unique du texte de la page. La version statique HTML
   (public/landing/*) duplique ce contenu — voir le commentaire en tête
   de public/landing/index.html. Toute modification doit être reportée
   dans les deux.

   v2 — campagne 2026-08-11. Le site est désormais multi-pages :
     /landing/                       (home : hero + pain + CTA)
     /landing/diagnostic/            (6 grilles + coda)
     /landing/paliers/               (4 paliers)
     /landing/engagements/           (4 « on ne fait pas »)
     /landing/demo/                  (entrée en démo, identifiants publics)

   Sources canon :
   1. C:\Users\amado\Downloads\audit.pdf — « Manuel de diagnostic IA ».
   2. APOLLO_CSV_ANALYSIS.md — analyse de niche (coach senior US, sub-type #4).
   3. APOLLO_ONBOARDING_ANSWERS_OMK_NEXUS.md — profil client verbatim.
   ──────────────────────────────────────────────────────────────────────────── */

export const SITE = {
  url: 'https://coach-os.app',
  locale: 'fr_FR',
  name: 'Coach OS',
  tagline: 'Le bureau qui tient votre méthode — pas l\'inverse.',
  audience: 'Pour coach qui facture 500 à 2000 $/h',
  description:
    'Coach OS est le bureau web qui tient la méthode d\'un coach expert : ' +
    'diagnostic avant l\'outil, données isolées, et sortie prévue dès le ' +
    'premier jour. Pas de SaaS qui vous enferme.',
} as const;

// Identifiants publics de la démo (projet OMK Services INTERN, organisation
// demo-coach). Voir public/landing/demo/index.html pour la version statique.
export const DEMO_CREDS = {
  email: 'demo@coach-os.app',
  password: 'demo-coach-os',
  org: 'demo-coach',
} as const;

export const HERO = {
  eyebrow: 'Coach OS — pour coach qui facture 500 à 2000 $/h',
  title: 'Le bureau qui tient votre méthode — pas l\'inverse.',
  subtitle:
    'Un bureau web pour coach expert : vos notes, vos clients, votre méthode, ' +
    'vos automatisations. Avec une porte de sortie prévue dès le premier jour.',
  ctaPrimary: { label: 'Réserver un audit de 30 min', href: 'mailto:audit@coach-os.app?subject=Audit%2030%20min' },
  ctaSecondary: { label: 'Entrer en démo sans compte', href: '/landing/demo/index.html' },
  trustLine:
    'Diagnostic avant l\'outil. Données isolées par client. Sortie prévue dès le premier jour.',
} as const;

export const PAIN = {
  title: 'Trois fuites qui vident une pratique sans qu\'on les voie',
  intro:
    'Vous facturez à l\'heure, vous tenez une méthode, vous avez des clients. ' +
    'Trois choses fuient en silence — et chacune a un coût mesurable.',
  items: [
    {
      number: '01',
      title: 'La méthode qui tient dans un cerveau',
      body:
        'Vos 18 ans de pratique tiennent dans une tête, sur papier, ou dans ' +
        'un Dropbox personnel. Si vous prenez six mois — burn-out, congé, ' +
        'maladie — ce qui vous restait disparaît avec vous. Ce n\'est pas ' +
        'un risque, c\'est une certitude statistique.',
      source: 'APOLLO_ONBOARDING_ANSWERS §2 — « Founder\'s IP at risk » (P1)',
    },
    {
      number: '02',
      title: 'La note qui part avec un partage d\'écran',
      body:
        'Vos notes de session contiennent des noms, des montants, parfois ' +
        'des numéros de sécurité sociale ou des éléments médicaux. Un ' +
        'partage d\'écran distrait, un transfert à un assistant, une copie ' +
        'dans ChatGPT public — et ce sont vos clients qui paient l\'erreur. ' +
        'RGPD, secret professionnel, devoir de conseil : trois cadres qui ' +
        'tombent en même temps.',
      source: 'APOLLO_ONBOARDING_ANSWERS §3 — P2 (compliance) + P3 (PII leak)',
    },
    {
      number: '03',
      title: 'L\'abonnement qui vous loue votre espace',
      body:
        'Les outils SaaS vous donnent un accès — pas une propriété. Vos ' +
        'données partent si vous partez, ou restent inextractibles si vous ' +
        'restez. Le tarif augmente, la politique change, l\'éditeur ferme : ' +
        'vous n\'y pouvez rien. Vous êtes un locataire, pas un propriétaire.',
      source: 'APOLLO_ONBOARDING_ANSWERS §3 — P5 « No graduation of ownership »',
    },
  ],
} as const;

export const DIAGNOSTIC = {
  title: 'Le diagnostic avant l\'outil',
  intro:
    'Le réflexe qui tue un projet IA, ce n\'est pas la technique — c\'est le ' +
    'cadrage. Six grilles à passer avant d\'allumer quoi que ce soit. ' +
    'Reprises du manuel de diagnostic IA, adaptées au métier de coach solo.',
  coda:
    '« Une entreprise n\'a pas un problème d\'IA. Elle a des tâches qui coûtent ' +
    'cher et dont personne ne parle. L\'IA n\'est que la réponse éventuelle. »',
  codaSource: 'audit.pdf p.1 — principe directeur',
  grids: [
    {
      label: 'Maturité',
      hint: 'Discuter / Connecter / Déléguer',
      body:
        'On ne saute pas un niveau. Le niveau 1 se paie en abonnements ; le ' +
        'niveau 2 se paie en processus ; le niveau 3 — la délégation réelle — ' +
        'se paie en critères écrits et en instrumentations.',
    },
    {
      label: 'Données',
      hint: 'Ce qui peut entrer dans l\'IA, et ce qui ne doit pas',
      body:
        'Une note nominative n\'est pas un cas de figure, c\'est une ' +
        'exclusion par défaut. Le bon réflexe : « est-ce RGPD-compatible, ' +
        'puis-je tracer ce qui est traité automatiquement, puis-je l\'effacer ? » ' +
        'Trois oui ? Ça passe.',
    },
    {
      label: 'Nature de tâche',
      hint: 'Recherche, production, orchestration, raisonnement long',
      body:
        '« L\'IA oublie tout » n\'est pas un défaut de l\'IA, c\'est le ' +
        'mauvais outil. Chaque nature de tâche appelle une famille d\'outils ' +
        'et une puissance de modèle. Résumer trois heures de réunion dans un ' +
        'chat généraliste, c\'est diagnostiquer le mauvais problème.',
    },
    {
      label: 'Automatisabilité',
      hint: 'Cinq tests avant de promettre',
      body:
        'T1 la tâche se répète, T2 la décision s\'explique, T3 l\'entrée est ' +
        'exploitable, T4 l\'erreur reste interne, T5 un propriétaire identifié ' +
        'la tient. Un seul rouge, on repousse. Quelle que soit la douleur.',
    },
    {
      label: 'Contexte',
      hint: 'Ce qui rend votre pratique irremplaçable',
      body:
        'Tous les concurrents ont accès aux mêmes modèles. La seule chose ' +
        'non copiable, c\'est ce que vous leur donnez à lire. Vos exemples ' +
        'labellisés, vos exceptions, vos « ça dépend ». C\'est là que vous ' +
        'êtes seul. C\'est là qu\'il faut capitaliser.',
    },
    {
      label: 'Arbitrage & ROI',
      hint: 'Chiffrer avant de promettre',
      body:
        'gain = (h/mois × coût horaire chargé) − (coût d\'exécution + ' +
        'maintenance). Deux règles d\'hygiène : ne comptez que le temps ' +
        'réellement libéré, et provisionnez la maintenance, parce qu\'une ' +
        'automatisation se dérègle dès que l\'outil source change.',
    },
  ],
} as const;

export const LADDER = {
  title: 'Quatre paliers. Pas de piège.',
  intro:
    'Le but n\'est pas de vous garder. La sortie est prévue dès le premier ' +
    'jour. Chaque palier dit ce qui existe aujourd\'hui et ce qui est prévu.',
  stages: [
    {
      name: 'Preuve de concept',
      state: 'Existe aujourd\'hui',
      what: 'Accès immédiat, espace partagé isolé entre coachs',
      where: 'Infrastructure OMK (Supabase CUSTOMERS)',
      color: 'green',
    },
    {
      name: 'SaaS',
      state: 'Existe aujourd\'hui',
      what: 'Votre espace, vos utilisateurs, votre paramétrage',
      where: 'Infrastructure OMK, isolation par politique de sécurité',
      color: 'green',
    },
    {
      name: 'Marque blanche',
      state: 'Prévu',
      what: 'Le produit à vos couleurs et votre domaine',
      where: 'Votre propre base, dédiée',
      color: 'amber',
    },
    {
      name: 'Souveraineté',
      state: 'Prévu',
      what: 'Le produit tourne chez vous',
      where: 'Votre infrastructure, vos clés, votre juridiction',
      color: 'amber',
    },
  ],
  footnote:
    '« On ne s\'enferme pas ici. » La promesse n\'est pas la gratuité — ' +
    'c\'est le chemin de sortie.',
} as const;

export const ENGAGEMENT = {
  title: 'Ce qu\'on ne fait pas',
  intro:
    'Quatre lignes que toute la page pourrait résumer. Si l\'une d\'elles ' +
    'est fausse un jour, c\'est le moment de fermer ce site.',
  items: [
    {
      title: 'Pas de SaaS qui vous enferme',
      body:
        'Aucun export verrouillé, aucun format propriétaire. Vos données ' +
        'sortent en standard, à n\'importe quel palier, sans préavis.',
    },
    {
      title: 'Pas d\'IA qui apprend de vos données',
      body:
        'Vos notes de session ne servent pas à entraîner un modèle public. ' +
        'Le traitement est tracé, l\'audit log est exportable, le zéro-PII ' +
        'est une mécanique, pas une promesse.',
    },
    {
      title: 'Pas de « book a demo » sans montrer vos données',
      body:
        'L\'audit de 30 min ouvre votre propre stack — pas une démo ' +
        'préparée. Vous voyez ce qui se passe sur vos vraies notes.',
    },
    {
      title: 'Pas de prix inventé',
      body:
        'On ne vous annoncera pas un tarif qu\'on n\'a pas vérifié. Si le ' +
        'chiffre n\'est pas publié, c\'est qu\'il est à calculer sur l\'audit.',
    },
  ],
} as const;

export const CTA = {
  title: 'Deux entrées',
  intro:
    'Le chemin le plus court vers la conviction n\'est pas l\'inscription. ' +
    'C\'est de voir l\'intérieur. Choisissez votre entrée.',
  primary: {
    label: 'Réserver un audit de 30 min',
    body:
      'Un appel sans script. Vous ouvrez votre propre stack de notes, on ' +
      'vous montre le diagnostic, on chiffre le palier. Aucun ' +
      'follow-up automatique.',
    href: 'mailto:audit@coach-os.app?subject=Audit%2030%20min',
  },
  secondary: {
    label: 'Entrer en démo sans compte',
    body:
      'Le bureau s\'ouvre sur le seed local. Aucune donnée n\'est envoyée, ' +
      'aucun compte n\'est créé. Vous voyez l\'interface et les ' +
      'collections telles qu\'elles sont — pas une vitrine.',
    href: '/landing/demo/index.html',
    note: 'Le seed local survit au branchement Supabase : la démo marche même si la base est en panne.',
  },
} as const;

export const STRUCTURED_DATA = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Coach OS',
    url: SITE.url,
    description: SITE.description,
    sameAs: [] as string[],
  },
  product: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Coach OS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Bureau web pour coach expert : notes de session, méthode, ' +
      'clients, automatisations. Données isolées, sortie prévue dès le ' +
      'premier jour.',
    offers: {
      '@type': 'Offer',
      category: 'Subscription',
      availability: 'https://schema.org/InStock',
    },
  },
} as const;

// Enchaînement des pages : pour le composant PageNext (uniforme).
export const NAV_ORDER = [
  { id: 'home',        href: '/landing/index.html',                label: 'Accueil'    },
  { id: 'diagnostic',  href: '/landing/diagnostic/index.html',     label: 'Diagnostic' },
  { id: 'paliers',     href: '/landing/paliers/index.html',        label: 'Paliers'    },
  { id: 'engagements', href: '/landing/engagements/index.html',    label: 'Engagements'},
  { id: 'demo',        href: '/landing/demo/index.html',           label: 'Démo'       },
] as const;