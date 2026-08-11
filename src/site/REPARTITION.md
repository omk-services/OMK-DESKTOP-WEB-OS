# REPARTITION — styles `styles.csv` × composants Canvas UI

> Carte qui évite que la prochaine passe reparte de zéro.
> Périmètre agent J — campagne 2026-08-11.
> Source : `C:\Users\amado\ui-ux-pro-max\src\ui-ux-pro-max\data\styles.csv` (84 styles).

Le site `/site/` est le déploiement public. Le produit Coach OS est le déploiement
dans l'app. Les deux reçoivent la même matrice de styles — un app ne doit pas
paraître sortie du même atelier qu'une page d'accueil.

---

## A. Le site `/site/` (5 pages)

| Page | Section | Style `styles.csv` (n°) | Effet Canvas UI | Pourquoi |
|------|---------|--------------------------|------------------|----------|
| `/site/index.html` | Hero | **Exaggerated Minimalism** (47) | DecryptReveal | Promesse isolée, pas de cartes ; le décodage révèle ce qui est invisible dans le bruit ambiant |
| `/site/index.html` | Pain | **Brutalism** (4) | Liquid | Diagnostic sans fard ; le liquide rappelle que les fuites coulent sans qu'on les voie |
| `/site/index.html` | CTA | **Bento Box Grid** (39) | ParticleReveal | Deux entrées asymétriques ; les particules signalent l'entrée vers la démo |
| `/site/methode.html` | Intro | **Editorial Grid / Magazine** (66) | (aucun) | Long-format, drop cap, colonnes asymétriques — un article, pas une fiche |
| `/site/methode.html` | Six grilles | **Swiss Modernism 2.0** (50) | Grid | Formulaire administratif consciencieux ; le quadrillage Swiss rejoue la grille des grilles |
| `/site/methode.html` | Coda | **Exaggerated Minimalism** (47) | (aucun) | Citation verbatim, manifeste, blanc immense |
| `/site/paliers.html` | Quatre paliers | **Glassmorphism** (3) | Glass | Souveraineté = transparence maîtrisée ; le verre dit « vous voyez à travers, mais c'est protégé » |
| `/site/engagements.html` | Quatre refus | **Brutalism** (4) | Shatter | Le refus s'assume ; le bris en arrière-plan rejoue la rupture |
| `/site/demo.html` | Comment entrer | **Interactive Product Demo** (25) | ParticleReveal | Trois étapes numérotées ; particules qui apparaissent à mesure qu'on progresse |
| `/site/demo.html` | Identifiants | **Terminal CLI** (73) | GlyphRain | Identifiants en clair = artefact technique ; monospace, ASCII, blink cursor |
| `/site/demo.html` | Pourquoi pas de données | **Editorial** (style par défaut — pas d'effet) | (aucun) | Argumentaire court, lecture seule, fond neutre |

**Total** : 8 styles retenus sur 84, 5 effets Canvas UI retenus sur 33.

---

## B. Les 19 apps Coach OS (répartition recommandée pour une passe future)

L'utilisateur a demandé une répartition par app. Cette table n'engage pas la
passe actuelle (l'audit des 19 apps est hors périmètre de l'agent J). Elle sert
de **carte de diversification** : la prochaine passe de relooking des apps peut
piocher dans cette matrice sans repartir du même atelier.

| App Coach OS | Style `styles.csv` recommandé | Effet Canvas UI | Pourquoi |
|--------------|-------------------------------|------------------|----------|
| `dashboard`     | **Bento Box Grid** (39) | Glass | Vue d'ensemble en tuiles asymétriques ; le verre laisse voir ce qui tourne en dessous |
| `people`        | **Soft UI Evolution** (19) | HexFloat | Humain d'abord, profondeur douce ; les hexagones flottants restent discrets |
| `operations`    | **Data-Dense Dashboard** (28) | Grid | Runbooks + incidents = grille dense ; la grille Swiss fait sens |
| `it-rd`         | **Dark Mode (OLED)** (7) | VHS | Kernel, logs, déployables ; les scanlines CRT signalent l'observabilité |
| `clients`       | **Conversion-Optimized** (21) | Magnify | Comptes + onboarding + churn risk ; le grossissement attire l'attention sur les comptes à risque |
| `tasks`         | **Minimal & Direct** (23) | (aucun) | « Ce qui a besoin de vous aujourd'hui » — pas de bruit |
| `marketplace`   | **Vibrant & Block-based** (6) | RetroDither | Intégrations sandboxées ; la trame rétro-pop assume l'aspect expérimental |
| `product`       | **Editorial Grid / Magazine** (66) | (aucun) | Roadmap, backlog, releases — un magazine de bord |
| `growth`        | **Storytelling-Driven** (27) | ParticleReveal | Funnel, canaux, expériences — la narration révèle les étapes |
| `sales`         | **Sales Intelligence Dashboard** (37) | Liquid | Pipeline, deals, forecast ; le liquide sur le forecast signale la fluidité des prédictions |
| `finance`       | **Financial Dashboard** (36) | (aucun) | P&L, marge, runway ; pas d'effet — les chiffres doivent rester arides |
| `audit`         | **Brutalism** (4) | DecryptReveal | Manuel de diagnostic IA — le brutalisme assume le ton du manuel ; le décodage rejoue la révélation des grilles |
| `legal`         | **Accessible & Ethical** (8) | (aucun) | Conformité, AI Act — l'accessibilité n'est pas un choix, c'est un cadre |
| `design`        | **Aurora UI** (10) | Liquid | Showcase six-front-end ; l'aurora et le liquide varient déjà — pas de double effet |
| `welcome`       | **Hero-Centric Design** (20) | (aucun) | Landing pages Circle.so-style — un hero par page |
| `ontology`      | **Editorial Grid / Magazine** (66) | Asciify | Registre des 12 entités, relations, contrats — un traité de grammaire |
| `onboarding`    | **Conversion-Optimized** (21) | ParticleReveal | Le quiz 4 questions + citadel démo ; particules sur la révélation de la citadel |
| `settings`      | **Minimal & Direct** (23) | (aucun) | Réglages — pas de bruit |
| `cognition`     | **AI-Native UI** (43) | Liquid | Agentique, ambient — le liquide signale l'incertitude assumée |

**Règle de diversification** : aucun style ne doit servir deux apps contiguës
dans la barre latérale. Si deux apps voisines piochent le même style, on
permute jusqu'à rétablissement.

---

## C. Garde-fous transversaux

1. **Pas de double effet.** Une app peut avoir un effet dominant (en wallpaper)
   + un effet nuance (sur un élément signature), pas deux dominants. Idem pour
   les sections du site.
2. **Pas d'effet sur les apps sérieuses.** Finance, Legal, Audit, Settings —
   un effet décoratif serait de la surcharge. Le choix « (aucun) » est une
   décision, pas un oubli.
3. **`prefers-reduced-motion` partout.** Toute animation CSS ou Canvas UI
   doit figer quand l'utilisateur l'a demandé. La matrice ci-dessus respecte
   ce principe par construction (les « aucun » sont des refus explicites).
4. **Cohérence avec le mapping canonique.** Les apps existantes ont déjà un
   mapping `theme-canvas-mapping.ts` (12 thèmes × 33 effets). Les choix de
   cette table **ne se substituent pas** à ce mapping — ils le complètent pour
   les apps qui n'ont pas encore de thème attitré.

---

## D. Justification par le critère « Best For » de `styles.csv`

Chaque choix ci-dessus cite le `Best For` de `styles.csv` comme première
justification. La cohérence entre l'usage déclaré du style et le sujet de la
section est ce qui distingue la diversité du patchwork. Voir
`_briefs/2026-08-11_production/rapports/RAPPORT_J_SITE.md` §1 pour les
citations verbatim.
