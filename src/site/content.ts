/* ────────────────────────────────────────────────────────────────────────────
   Coach OS — contenu canonique du site /site/
   Périmètre agent J — campagne 2026-08-11.

   Source de vérité partagée entre :
     · public/site/*.html (vanilla HTML/CSS, servable sans build)
     · src/site/pages/*.tsx (React 19, intégration Canvas UI)

   Toute modification doit être reportée dans les deux formats.

   Choix de styles (cf. styles.csv) par section — voir RAPPORT_J_SITE.md §1.
   ──────────────────────────────────────────────────────────────────────────── */

export const SITE = {
  url: 'https://coach-os.app',
  locale: 'fr_FR',
  name: 'Coach OS',
  tagline: 'Le bureau qui tient votre méthode — pas l\'inverse.',
  audience: 'Pour coach qui facture 500 à 2000 $/h',
  description:
    'Coach OS est le bureau web pour coach expert : ' +
    'diagnostic avant l\'outil, données isolées, et sortie prévue dès le ' +
    'premier jour. Pas de SaaS qui vous enferme.',
} as const;

export const PAGES = [
  { id: 'home',         label: 'Accueil',     href: '/site/index.html',     key: 'index'    },
  { id: 'methode',      label: 'Méthode',     href: '/site/methode.html',   key: 'methode'  },
  { id: 'paliers',      label: 'Paliers',     href: '/site/paliers.html',   key: 'paliers'  },
  { id: 'engagements',  label: 'Engagements', href: '/site/engagements.html', key: 'engagements' },
  { id: 'demo',         label: 'Démo',        href: '/site/demo.html',      key: 'demo'     },
] as const;

export type PageKey = typeof PAGES[number]['key'];

export const HOME = {
  hero: {
    eyebrow: 'Coach OS — pour coach qui facture 500 à 2000 $/h',
    title: 'Le bureau qui tient votre méthode — pas l\'inverse.',
    subtitle:
      'Un bureau web pour coach expert : vos notes, vos clients, votre méthode, ' +
      'vos automatisations. Avec une porte de sortie prévue dès le premier jour.',
    trust: 'Diagnostic avant l\'outil. Données isolées par client. Sortie prévue dès le premier jour.',
    sections: [
      { id: 'hero',  label: 'Hero' },
      { id: 'pain',  label: 'Pain' },
      { id: 'cta',   label: 'Entrer' },
    ],
    style: 'Exaggerated Minimalism (#47) · DecryptReveal',
  },
  pain: {
    eyebrow: 'Le problème',
    title: 'Trois fuites qui vident une pratique sans qu\'on les voie',
    intro:
      'Vous facturez à l\'heure, vous tenez une méthode, vous avez des clients. ' +
      'Trois choses fuient en silence — et chacune a un coût mesurable.',
    items: [
      {
        number: '01',
        title: 'La méthode qui tient dans un cerveau',
        body:
          'Vos 18 ans de pratique tiennent dans une tête, sur papier, ou dans un Dropbox personnel. ' +
          'Si vous prenez six mois — burn-out, congé, maladie — ce qui vous restait disparaît avec vous. ' +
          'Ce n\'est pas un risque, c\'est une certitude statistique.',
        source: 'APOLLO_ONBOARDING §2 · « Founder\'s IP at risk »',
      },
      {
        number: '02',
        title: 'La note qui part avec un partage d\'écran',
        body:
          'Vos notes de session contiennent des noms, des montants, parfois des numéros de sécurité ' +
          'sociale ou des éléments médicaux. Un partage d\'écran distrait, un transfert à un assistant, ' +
          'une copie dans ChatGPT public — et ce sont vos clients qui paient l\'erreur. RGPD, secret ' +
          'professionnel, devoir de conseil : trois cadres qui tombent en même temps.',
        source: 'APOLLO_ONBOARDING §3 · P2 compliance + P3 PII leak',
      },
      {
        number: '03',
        title: 'L\'abonnement qui vous loue votre espace',
        body:
          'Les outils SaaS vous donnent un accès — pas une propriété. Vos données partent si vous ' +
          'partez, ou restent inextractibles si vous restez. Le tarif augmente, la politique change, ' +
          'l\'éditeur ferme : vous n\'y pouvez rien. Vous êtes un locataire, pas un propriétaire.',
        source: 'APOLLO_ONBOARDING §3 · P5 « No graduation of ownership »',
      },
    ],
    style: 'Brutalism (#4) · Liquid',
  },
  cta: {
    eyebrow: 'L\'appel à l\'action',
    title: 'Deux entrées',
    intro:
      'Le chemin le plus court vers la conviction n\'est pas l\'inscription. ' +
      'C\'est de voir l\'intérieur. Choisissez votre entrée.',
    primary: {
      eyebrow: 'Entrée n°01 · Audit',
      title: 'Réserver un audit de 30 min',
      body:
        'Un appel sans script. Vous ouvrez votre propre stack de notes, on vous montre le diagnostic, ' +
        'on chiffre le palier. Aucun follow-up automatique.',
      href: 'mailto:audit@coach-os.app?subject=Audit%2030%20min',
      label: 'Réserver',
    },
    secondary: {
      eyebrow: 'Entrée n°02 · Démo',
      title: 'Entrer en démo sans compte',
      body:
        'Le bureau s\'ouvre sur le seed local. Aucune donnée n\'est envoyée, aucun compte n\'est créé. ' +
        'Vous voyez l\'interface et les collections telles qu\'elles sont — pas une vitrine.',
      href: '/site/demo.html',
      label: 'Ouvrir la démo',
      note: 'Le seed local survit au branchement Supabase : la démo marche même si la base est en panne.',
    },
    style: 'Bento Box Grid (#39) · ParticleReveal',
  },
} as const;

export const METHODE = {
  sections: [
    { id: 'intro', label: 'Introduction' },
    { id: 'grids', label: 'Six grilles' },
    { id: 'coda',  label: 'Coda' },
  ],
  intro: {
    eyebrow: 'Le mécanisme',
    title: 'Le diagnostic avant l\'outil',
    lead:
      'Le réflexe qui tue un projet IA, ce n\'est pas la technique — c\'est le cadrage. ' +
      'Six grilles à passer avant d\'allumer quoi que ce soit.',
    paragraphs: [
      'La première chose à perdre dans un projet d\'IA, ce n\'est pas l\'argent : c\'est le cadrage. ' +
      'Une entreprise qui demande « on peut faire quoi avec l\'IA ? » est déjà en train de chercher ' +
      'un problème pour une solution. L\'inversion coûte cher parce qu\'elle se voit rarement — les ' +
      'livrables sont propres, le ROI est en suspens, et l\'illusion tient jusqu\'au premier audit.',
      'Le manuel de diagnostic IA pose six grilles successives : maturité, données, nature de tâche, ' +
      'automatisabilité, contexte, arbitrage. Elles ne sont pas là pour filtrer les candidats — elles ' +
      'sont là pour rendre le projet discutable. Une décision discutable peut être défaite ; une ' +
      'décision indiscutable ne peut être qu\'arbitraire.',
      'La méthode adaptée au coach solo tient en peu de mots : ne sautez aucun niveau, n\'oubliez ' +
      'aucun coût, ne confiez jamais à l\'IA ce qui n\'a pas été d\'abord tracé sur papier. Le reste — ' +
      'l\'outillage, le fournisseur, le prix — vient après.',
    ],
    aside: {
      sourceTitle: 'Source canonique',
      source: '« Manuel de diagnostic IA » — huit pages, six grilles, cinq tests, sept pièges.',
      adaptationTitle: 'Adaptation',
      adaptation: 'Reprise intégrale des six grilles ; reformulation pour la pratique solo, sans le jargon comité de direction.',
    },
    style: 'Editorial Grid / Magazine (#66)',
  },
  grids: {
    eyebrow: 'Les six grilles',
    title: 'Six questions avant d\'allumer',
    cells: [
      { idx: '01', label: 'Maturité',          hint: 'Discuter · Connecter · Déléguer',
        body: 'On ne saute pas un niveau. Le niveau 1 se paie en abonnements ; le niveau 2 se paie en processus ; ' +
              'le niveau 3 — la délégation réelle — se paie en critères écrits et en instrumentations. ' +
              'Un niveau sauté coûte plus cher que le niveau qu\'il court-circuitait.' },
      { idx: '02', label: 'Données',           hint: 'Ce qui peut entrer dans l\'IA, et ce qui ne doit pas',
        body: 'Une note nominative n\'est pas un cas de figure, c\'est une exclusion par défaut. Le bon réflexe : ' +
              '« est-ce RGPD-compatible, puis-je tracer ce qui est traité automatiquement, puis-je l\'effacer ? » ' +
              'Trois oui ? Ça passe. Un non, ça bloque.' },
      { idx: '03', label: 'Nature de tâche',   hint: 'Recherche, production, orchestration, raisonnement long',
        body: '« L\'IA oublie tout » n\'est pas un défaut de l\'IA, c\'est le mauvais outil. Chaque nature de ' +
              'tâche appelle une famille d\'outils et une puissance de modèle. Résumer trois heures de réunion ' +
              'dans un chat généraliste, c\'est diagnostiquer le mauvais problème.' },
      { idx: '04', label: 'Automatisabilité',  hint: 'Cinq tests avant de promettre',
        body: 'T1 la tâche se répète, T2 la décision s\'explique, T3 l\'entrée est exploitable, T4 l\'erreur ' +
              'reste interne, T5 un propriétaire identifié la tient. Un seul rouge, on repousse. Quelle que ' +
              'soit la douleur. Un automatisme sans propriétaire est un accident en sursis.' },
      { idx: '05', label: 'Contexte',          hint: 'Ce qui rend votre pratique irremplaçable',
        body: 'Tous les concurrents ont accès aux mêmes modèles. La seule chose non copiable, c\'est ce que ' +
              'vous leur donnez à lire. Vos exemples labellisés, vos exceptions, vos « ça dépend ». C\'est là ' +
              'que vous êtes seul. C\'est là qu\'il faut capitaliser.' },
      { idx: '06', label: 'Arbitrage & ROI',   hint: 'Chiffrer avant de promettre',
        body: 'gain = (h/mois × coût horaire chargé) − (coût d\'exécution + maintenance). Deux règles d\'hygiène : ' +
              'ne comptez que le temps réellement libéré, et provisionnez la maintenance, parce qu\'une ' +
              'automatisation se dérègle dès que l\'outil source change.' },
    ],
    style: 'Swiss Modernism 2.0 (#50) · Grid',
  },
  coda: {
    eyebrow: 'Principe directeur',
    quote:
      'Une entreprise n\'a pas un problème d\'IA. Elle a des tâches qui coûtent cher et dont personne ne parle. ' +
      'L\'IA n\'est que la réponse éventuelle.',
    source: '— Manuel de diagnostic IA, p. 1',
    style: 'Exaggerated Minimalism (#47)',
  },
} as const;

export const PALIERS = {
  sections: [
    { id: 'palier-1', label: 'Preuve de concept' },
    { id: 'palier-2', label: 'SaaS' },
    { id: 'palier-3', label: 'Marque blanche' },
    { id: 'palier-4', label: 'Souveraineté' },
  ],
  eyebrow: 'L\'offre',
  title: 'Quatre paliers. Pas de piège.',
  lead:
    'Le but n\'est pas de vous garder. La sortie est prévue dès le premier jour. ' +
    'Chaque palier dit ce qui existe aujourd\'hui et ce qui est prévu.',
  stages: [
    { idx: '01', name: 'Preuve de concept', state: 'today',   stateLabel: 'Existe aujourd\'hui',
      what: 'Accès immédiat. Espace partagé isolé entre coachs. Vous vérifiez que la méthode tient avant d\'investir.',
      where: 'Infrastructure OMK · Supabase CUSTOMERS' },
    { idx: '02', name: 'SaaS',              state: 'today',   stateLabel: 'Existe aujourd\'hui',
      what: 'Votre espace, vos utilisateurs, votre paramétrage. Vous passez de l\'évaluation à la pratique quotidienne.',
      where: 'Infrastructure OMK · isolation par politique de sécurité' },
    { idx: '03', name: 'Marque blanche',    state: 'planned', stateLabel: 'Prévu',
      what: 'Le produit à vos couleurs et votre domaine. Vos clients voient votre marque, pas la nôtre.',
      where: 'Votre propre base · dédiée' },
    { idx: '04', name: 'Souveraineté',      state: 'planned', stateLabel: 'Prévu',
      what: 'Le produit tourne chez vous. Vos données, vos sauvegardes, vos règles d\'audit, votre juridiction.',
      where: 'Votre infrastructure · vos clés · votre juridiction' },
  ],
  footnote: '« On ne s\'enferme pas ici. » La promesse n\'est pas la gratuité — c\'est le chemin de sortie.',
  style: 'Glassmorphism (#3) · Glass',
} as const;

export const ENGAGEMENTS = {
  sections: [
    { id: 'refus-1', label: 'Refus n°01' },
    { id: 'refus-2', label: 'Refus n°02' },
    { id: 'refus-3', label: 'Refus n°03' },
    { id: 'refus-4', label: 'Refus n°04' },
  ],
  eyebrow: 'Les objections',
  title: 'Ce qu\'on ne fait pas',
  intro:
    'Quatre lignes que toute la page pourrait résumer. Si l\'une d\'elles est fausse un jour, ' +
    'c\'est le moment de fermer ce site.',
  items: [
    { idx: '01', title: 'Pas de SaaS qui vous enferme',
      body: 'Aucun export verrouillé, aucun format propriétaire. Vos données sortent en standard, à n\'importe quel ' +
            'palier, sans préavis. Le verrouillage n\'est pas un modèle économique — c\'est un piège qu\'on refuse de poser.',
      test: 'Test — exporter l\'intégralité de votre espace en CSV + JSON, à tout moment' },
    { idx: '02', title: 'Pas d\'IA qui apprend de vos données',
      body: 'Vos notes de session ne servent pas à entraîner un modèle public. Le traitement est tracé, l\'audit ' +
            'log est exportable, le zéro-PII est une mécanique, pas une promesse. Le RGPD n\'est pas un cadre qu\'on ' +
            'respecte par accident — c\'est un code qu\'on applique.',
      test: 'Test — l\'audit log montre chaque appel IA, son entrée, sa sortie, son refus éventuel' },
    { idx: '03', title: 'Pas de « book a demo » sans montrer vos données',
      body: 'L\'audit de 30 min ouvre votre propre stack — pas une démo préparée. Vous voyez ce qui se passe sur vos ' +
            'vraies notes, pas sur des notes d\'exemple. Si nous ne savons pas montrer le produit sur vos données, ' +
            'nous ne savons pas le montrer.',
      test: 'Test — venir à l\'audit avec un dossier de notes, repartir avec un diagnostic chiffré' },
    { idx: '04', title: 'Pas de prix inventé',
      body: 'On ne vous annoncera pas un tarif qu\'on n\'a pas vérifié. Si le chiffre n\'est pas publié, c\'est qu\'il ' +
            'est à calculer sur l\'audit — parce qu\'il dépend du volume, du palier et du niveau de souveraineté. ' +
            'Un prix en vitrine ment par construction.',
      test: 'Test — le prix sort de l\'audit, pas du site' },
  ],
  style: 'Brutalism (#4) · Shatter',
} as const;

interface DemoStep {
  title: string;
  body: string;
  code?: string;
}

interface DemoSection {
  eyebrow: string;
  title: string;
  lead: string;
  steps: readonly DemoStep[];
  ctaLabel: string;
  style: string;
}

export const DEMO: {
  sections: readonly { readonly id: string; readonly label: string }[];
  howto: DemoSection;
  creds: {
    eyebrow: string;
    title: string;
    lead: string;
    rows: readonly { readonly key: string; readonly val: string }[];
    warn: string;
    style: string;
  };
  nodata: {
    eyebrow: string;
    title: string;
    intro: string;
    items: readonly { readonly lead: string; readonly body: string }[];
    style: string;
  };
} = {
  sections: [
    { id: 'howto',  label: 'Comment entrer' },
    { id: 'creds',  label: 'Identifiants' },
    { id: 'nodata', label: 'Pourquoi pas de données' },
  ],
  howto: {
    eyebrow: 'L\'entrée directe',
    title: 'Trois étapes. Pas de compte.',
    lead:
      'Vous voyez l\'interface et les collections telles qu\'elles sont — pas une vitrine ' +
      'préparée. La démo charge un seed local : vos clics ne quittent pas le navigateur.',
    steps: [
      { title: 'Ouvrez l\'application',
        body: 'Allez à l\'URL racine de Coach OS. La page d\'authentification s\'affiche — c\'est l\'entrée, pas un mur.',
        code: 'https://omk-desktop-web-os.vercel.app' as string | undefined },
      { title: 'Cliquez sur « Démo »',
        body: 'En bas du formulaire d\'authentification, le lien Entrer en démo ouvre le bureau sans créer de compte. ' +
              'Le seed local se charge en mémoire.' },
      { title: 'Explorez les collections',
        body: '23 collections sont pré-remplies : clients, sessions, SOP, méthode, agents. Cliquez, filtrez, créez ' +
              'un item — il vit dans votre session, pas dans notre base.' },
      { title: 'Quittez quand vous voulez',
        body: 'Fermez l\'onglet. Le seed disparaît avec la session — c\'est le but. Aucun cookie de tracking, aucune ' +
              'trace, aucun follow-up.' },
    ],
    ctaLabel: 'Ouvrir la démo',
    style: 'Interactive Product Demo (#25) · ParticleReveal',
  },
  creds: {
    eyebrow: 'Artefact technique',
    title: 'Identifiants — si vous passez par l\'authentification',
    lead:
      'La démo sans compte ne demande rien. Mais si vous tenez à voir le formulaire d\'authentification avec un ' +
      'compte Supabase de pré-prod, voici les identifiants. Ce ne sont pas des secrets — c\'est un environnement ' +
      'jetable.',
    rows: [
      { key: 'URL',            val: 'https://omk-desktop-web-os.vercel.app' },
      { key: 'Email',          val: 'demo@coach-os.app' },
      { key: 'Mot de passe',   val: 'coach-os-demo-2026' },
      { key: 'Tenant',         val: 'Architecte · niveau démo' },
    ],
    warn:
      '⚠ Cet environnement est partagé. N\'y écrivez rien de sensible. Le seed local est plus représentatif : ' +
      'il ne dépend d\'aucune base, d\'aucun secret, d\'aucun réseau.',
    style: 'Terminal CLI (#73) · GlyphRain',
  },
  nodata: {
    eyebrow: 'Le pourquoi du comment',
    title: 'Pourquoi la démo n\'envoie aucune donnée',
    intro:
      'Le bureau de démonstration se sert d\'un seed local. Vos clics vivent dans la mémoire du navigateur et ' +
      's\'effacent à la fermeture de l\'onglet. Voici pourquoi c\'est le bon défaut.',
    items: [
      { lead: 'Pas de piège à données.',
        body: 'Vous quittez, vos notes quittent. C\'est la définition d\'une démo honnête — pas d\'inscription forcée, ' +
              'pas d\'opt-in discret.' },
      { lead: 'Le seed survit à Supabase.',
        body: 'Si la base de production est en panne, le seed local prend le relais. La démo reste démontrable. ' +
              'Un coach qui voit une page d\'erreur ne s\'inscrit pas.' },
      { lead: 'Le seed est représentatif.',
        body: '23 collections pré-remplies, des dizaines d\'items lisibles — vous voyez les données que vous tiendrez, ' +
              'pas une version édulcorée.' },
      { lead: 'Le branchement est explicite.',
        body: 'Quand vous créez un vrai compte, vous passez du seed local à votre propre base. La bascule est ' +
              'affichée, pas silencieuse.' },
    ],
    style: 'Editorial (style par défaut — pas d\'effet)',
  },
} as const;
