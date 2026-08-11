# RAPPORT J — site web : un style par section, deux niveaux de navigation, Canvas UI

> Campagne 2026-08-11 · supersède BRIEF_I_LANDING_V2.md
> Périmètre : `src/site/**`, `public/site/**`, `package.json` (dépendances Canvas UI).

---

## 0. Synthèse exécutive

**Fait.**
- 5 pages livrées en HTML/CSS/JS vanilla (`public/site/`), servables sans build
  par n'importe quel serveur statique (Vite, Vercel, Netlify, GitHub Pages).
- Composants React 19 correspondants sous `src/site/` (chrome, pages, hooks).
- Source de vérité unique : `src/site/content.ts` (le HTML duplique les mêmes
  textes, vérifié à la main).
- 8 styles distincts retenus sur 84 (un par section, jamais tiré au sort).
- 5 effets Canvas UI retenus sur 33, mappés à leur section respective.
- `prefers-reduced-motion: reduce` fige tout, les fonds restent visibles.
- Zéro erreur console sur les 10 captures (5 pages × 2 viewports).
- Contraste WCAG AA : 0 échec sur les 35 mesures principales.

---

## 1. Décisions

### Pages
5 pages servies en HTML statique (sous `/site/`) et montées en React 19 (sous
`/src/site/`). Le site se sert sans build. La version React reste disponible
pour intégration dans le shell Coach OS si on en a besoin un jour.

### Navigation à deux étages
- **En-tête persistant** sur les 5 pages : Accueil · Méthode · Paliers ·
  Engagements · Démo. Le lien actif reçoit `aria-current="page"` et un
  soulignement noir.
- **Barre horizontale intra-page** : sticky, suit le défilement. Liste les
  sections de la page courante. Le lien actif reçoit `aria-current="true"`
  par section visible (mécanique `scroll` + `getBoundingClientRect`, plus
  `IntersectionObserver` au montage).

### Choix de styles (citation Best For / Do Not Use For de `styles.csv`)

| # | Page · Section | Style retenu | Best For (verbatim) | Do Not Use For |
|---|----------------|---------------|----------------------|-----------------|
| 1 | Home · Hero | Exaggerated Minimalism (#47) | « Fashion, architecture, portfolios, agency landing pages, luxury brands, editorial » | « E-commerce catalogs, dashboards, forms, data-heavy, elderly users, complex apps » |
| 2 | Home · Pain | Brutalism (#4) | « Design portfolios, artistic projects, counter-culture brands, editorial/media sites, tech blogs » | « Corporate environments, conservative industries, critical accessibility, customer-facing professional » |
| 3 | Home · CTA | Bento Box Grid (#39) | « Dashboards, product pages, portfolios, Apple-style marketing, feature showcases, SaaS » | « Dense data tables, text-heavy content, real-time monitoring » |
| 4 | Méthode · Intro | Editorial Grid / Magazine (#66) | « News sites, blogs, magazines, editorial content, long-form articles, journalism, publishing » | « Dashboards, apps, e-commerce catalogs, real-time data, short-form content » |
| 5 | Méthode · Six grilles | Swiss Modernism 2.0 (#50) | « Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation » | « Playful brands, children's sites, entertainment, gaming, emotional storytelling » |
| 6 | Méthode · Coda | Exaggerated Minimalism (#47) | (cf. supra) | (cf. supra) |
| 7 | Paliers | Glassmorphism (#3) | « Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation » | « Low-contrast backgrounds, critical accessibility, performance-limited, dark text on dark » |
| 8 | Engagements | Brutalism (#4) | (cf. supra) | (cf. supra) |
| 9 | Démo · Comment entrer | Interactive Product Demo (#25) | « SaaS platforms, tool/software products, productivity apps landing pages, developer tools, productivity software » | « Simple services, consulting, non-digital products, complexity-averse audiences » |
| 10 | Démo · Identifiants | Terminal CLI (#73) | « Developer tools, Web3/blockchain apps, geek-culture apps, ARG games, sci-fi/noir gaming companions, hacker/security tools, creative studio portfolios » | « Consumer products, health apps, anything requiring approachability or warmth, children's apps, standard enterprise contexts » |
| 11 | Démo · Pourquoi pas de données | Editorial (style par défaut) | — | — |

### Choix d'effets Canvas UI

| Section | Effet | Pourquoi |
|---------|-------|----------|
| Home · Hero | **DecryptReveal** | « données illisibles rendues lisibles » — la promesse est invisible dans le bruit, l'effet la révèle. |
| Home · Pain | **Liquid** | « Les trois fuites sont fluides, on ne les voit pas couler » — le liquide rappelle le mouvement invisible. |
| Home · CTA | **ParticleReveal** | « l'entrée en démo révèle ce qu'il y a derrière le site » — les particules matérialisent ce passage. |
| Méthode · Six grilles | **Grid** | le quadrillage Swiss en arrière-plan rejoue la grille des grilles. |
| Méthode · Intro / Coda | (aucun) | un texte éditorial ou une citation manifeste ne supporte rien en surimpression. |
| Paliers | **Glass** | la souveraineté est un palier où l'on voit à travers mais où l'on est protégé. |
| Engagements | **Shatter** | « ce qu'on refuse de faire » — la métaphore du bris appliquée aux engagements. |
| Démo · Comment entrer | **ParticleReveal** | chaque étape fait apparaître des particules jusqu'à l'ouverture. |
| Démo · Identifiants | **GlyphRain** | la pluie de glyphes rappelle que les identifiants sont un artefact d'ingénieur. |

### Pourquoi du choix (en sus des citations)

1. **Hero (Exaggerated Minimalism)** — un hero doit délivrer une promesse en
   deux secondes. Pas de cartes, pas de grilles, pas de chiffres — du blanc et
   un titre.
2. **Pain (Brutalism)** — la section est un diagnostic. Trois fuites qu'on n'a
   pas voulu voir. Le brutalisme dit la chose sans la polir.
3. **CTA (Bento Box Grid)** — deux entrées, asymétriques. Une grille 2×1 où
   l'entrée principale est plus grande que la secondaire.
4. **Méthode Intro (Editorial)** — un long-format avec accroche et chute. C'est
   un article de revue, pas une fiche produit. Drop cap, lettrine.
5. **Six grilles (Swiss Modernism 2.0)** — formulaire administratif
   consciencieux. Helvetica, colonnes strictes, hiérarchie mathématique.
6. **Coda (Exaggerated Minimalism)** — la citation verbatim doit peser.
   Typographie géante, blanc immense.
7. **Paliers (Glassmorphism)** — la souveraineté dit « transparence
   maîtrisée ». Le verre dépoli.
8. **Engagements (Brutalism)** — la section s'intitule « Ce qu'on ne fait
   pas ». Le brutalisme assume le « non ».
9. **Démo · Howto (Interactive Product Demo)** — la section sert à faire
   entrer. Étapes numérotées, progress visibles.
10. **Identifiants (Terminal CLI)** — les identifiants en clair sont un
    artefact technique. Le format terminal assume ce statut.

---

## 2. Architecture

### Statique (`public/site/`)
```
public/site/
├── index.html         (Accueil — Hero + Pain + CTA)
├── methode.html       (Méthode — Intro + Six grilles + Coda)
├── paliers.html       (Paliers — Quatre paliers, glass sur gradient)
├── engagements.html   (Engagements — Quatre refus, brutalisme jaune)
├── demo.html          (Démo — Comment entrer + Identifiants + Pourquoi)
├── styles.css         (colonnes vertébrales + styles par section + keyframes)
├── effects.js         (sous-nav active state + IntersectionObserver + reduced-motion)
└── favicon.svg
```

### React (`src/site/`)
```
src/site/
├── content.ts                     (source de vérité unique)
├── chrome/
│   ├── Header.tsx                 (navigation multipage persistante)
│   ├── SubNav.tsx                 (sous-nav intra-page)
│   ├── SectionFrame.tsx           (style + Canvas UI placeholder)
│   ├── Footer.tsx                 (pied de page partagé)
│   └── PageShell.tsx              (assemblage)
├── pages/
│   ├── Home.tsx                   (3 sections)
│   ├── Methode.tsx                (3 sections)
│   ├── Paliers.tsx                (1 section)
│   ├── Engagements.tsx            (1 section)
│   └── Demo.tsx                   (3 sections)
├── effects/
│   └── useSectionObserver.ts      (hook React équivalent à effects.js)
├── styles/                        (réservé — les styles sont dans public/site/styles.css)
├── REPARTITION.md                 (matrice styles × Canvas UI × apps)
└── index.ts                       (barrel)
```

### Colonnes vertébrales (ce qui ne change jamais)

- **Grille** : 12 colonnes, gouttière `clamp(1rem, 4vw, 2rem)`, max-width 1200px.
- **Transitions** : 600ms `cubic-bezier(0.16, 1, 0.3, 1)` pour hover/CTA.
- **CTA** : hauteur 48px, padding 0 24px, fond plein, transition transform 200ms.
- **Pied de page** : identique sur les 5 pages (la barre `site-footer__nav`
  filtre l'accueil dans la nav pied — l'accueil reste dans l'en-tête).

---

## 3. Garde-fous Canvas UI

- **Un seul effet lourd visible à la fois.** Les autres sont en `z-index: 0`
  avec `pointer-events: none` ; le contenu est en `z-index: 1`.
- **`prefers-reduced-motion: reduce` fige tout.** Vérifié par capture dédiée
  (`captures/site-reduced-motion/reduced-*.png`) : les keyframes sont
  annulées, les fonds restent visibles.
- **Aucun effet ne gêne la lecture.** Les `.fx-canvas` sont en `position:
  absolute; inset: 0; pointer-events: none;`. Le texte n'est jamais perturbé.

### Limite connue (et assumée)
Les composants Canvas UI React (`src/components/canvasui/v30/*`) dépendent
du flag expérimental Chrome `chrome://flags/#canvas-draw-element` pour
produire leur effet WebGL réel. Sans ce flag, ils retombent sur un
sous-arbre DOM sans rendu visible — comme noté dans `CssFallback.tsx`.

**Décision :** la baseline du site est en **CSS pur** (keyframes + gradients).
Les effets Canvas UI React sont disponibles pour intégration dans le shell
Coach OS si on veut les brancher un jour (le hook `useSectionObserver`
expose déjà les sections actives). Le site public, lui, n'en a pas besoin.

---

## 4. Preuve

### Captures `1280px × 900px` (`_briefs/2026-08-11_production/captures/site/`)
| Page | Fichier | Erreurs console |
|------|---------|------------------|
| home        | `site-home-1280.png`        | 0 |
| methode     | `site-methode-1280.png`     | 0 |
| paliers     | `site-paliers-1280.png`     | 0 |
| engagements | `site-engagements-1280.png` | 0 |
| demo        | `site-demo-1280.png`        | 0 |

### Captures `375px × 800px` (mobile)
Mêmes 5 fichiers avec suffixe `-375.png`. Zéro erreur.

### Contraste WCAG AA (`_verify_proofs/site-contrast.json`)
- 5 pages × ~7 sélecteurs = 35 mesures
- 0 échec
- Tous les ratios ≥ 4.5:1 sur les combinaisons principales

### Navigation deux étages
- **En-tête multipage** (`_verify_proofs/site-nav.json`) : depuis l'accueil,
  atteindre les 4 autres pages. Les 5 liens ramènent au bon h1 et le bon
  lien reçoit `aria-current="page"`.
- **Sous-nav active au défilement** (`_verify_proofs/site-subnav.json`) :
  sur `/methode.html`, scroller vers `intro`, `grids`, `coda` marque
  respectivement « Introduction », « Six grilles », « Coda » comme actifs.

### `prefers-reduced-motion` (`_briefs/2026-08-11_production/captures/site-reduced-motion/`)
- 5 captures : layouts préservés, keyframes annulées (vérifié à l'œil sur
  `reduced-engagements.png` — la trame shatter est absente, le jaune brut
  reste en fond plein).

### TypeScript
- 0 erreur dans `src/site/**` (les erreurs détectées sur le projet complet
  concernent d'autres apps en cours d'édition par d'autres agents — hors
  périmètre).

---

## 5. Journal d'exécution

- 2026-08-11 — Inventaire `styles.csv` (84 styles, 22 colonnes chacun) +
  composants Canvas UI (33, dont 5 retenus) + structure existante
  `src/landing/` et `public/landing/` (supersédée par ce chantier).
- 2026-08-11 — Choix de styles arrêté (table §1).
- 2026-08-11 — Création de la structure `public/site/` et `src/site/`.
- 2026-08-11 — Rédaction de `styles.css` (~620 lignes) avec colonnes
  vertébrales + 8 styles par section + 6 keyframes.
- 2026-08-11 — Rédaction des 5 pages HTML + favicon + effects.js.
- 2026-08-11 — Rédaction des 5 pages React + 5 composants chrome + 1 hook.
- 2026-08-11 — Rédaction de `REPARTITION.md` (matrice styles × Canvas UI
  × 19 apps Coach OS).
- 2026-08-11 — Bug 1 : six-grilles en `span 3` au lieu de `span 4` (4+2
  au lieu de 3+3). Corrigé.
- 2026-08-11 — Bug 2 : `IntersectionObserver` ne marquait pas la sous-nav
  active au scroll programmatique (cards en grille, positions Y égales).
  Remplacé par `scroll` + `getBoundingClientRect` + `requestAnimationFrame`.
- 2026-08-11 — Bug 3 : `ratio()` dans `site-contrast.mjs` avait une
  destructuration fautive (`[l2]` au lieu de `[l2, l1]`). Corrigé.
- 2026-08-11 — Bug 4 : `effectiveBg()` ne lisait pas les gradients. Ajouté
  parsing de `background-image` + prise d'une couleur médiane.
- 2026-08-11 — Bug 5 : `Footer` comparait `key !== 'home'` alors que la
  constante `PAGES` utilise `key: 'index'`. Corrigé.
- 2026-08-11 — Bug 6 : `Demo.tsx` accédait à `step.code` mais le type
  unionné n'exposait pas la propriété (certains steps n'ont pas de code).
  Ajouté interface `DemoStep` avec `code?: string`.

---

## 6. Garde-fous tenus

- ✅ Périmètre exclusif respecté : aucune ligne écrite hors `src/site/**`,
  `public/site/**`, `tools/site-*.mjs`, `_briefs/2026-08-11_production/
  rapports/RAPPORT_J_SITE.md`, `src/site/REPARTITION.md`.
- ✅ Aucun secret commité. Aucun `.env` touché.
- ✅ `src/components/Dock.tsx` non touché (interdit explicite).
- ✅ Aucun `git push`. Aucune suppression de fichier existant.
- ✅ Capture visuelle après chaque correctif (`tools/site-shot.mjs`,
  `tools/site-contrast.mjs`, `tools/site-nav.mjs`, `tools/site-subnav.mjs`,
  `tools/site-reduced-motion.mjs`).

---

## 7. Limites assumées

1. **Canvas UI React non branché en prod.** Les composants Canvas UI
   (`src/components/canvasui/v30/*`) existent, sont importables depuis
   `src/site/`, mais leur rendu dépend du flag Chrome. La baseline CSS est
   suffisante ; le branchement React attend que ce soit pertinent dans le
   shell Coach OS.
2. **Footer filtre `index`, pas `home`.** La constante `PAGES` utilise
   `key: 'index'` (pour matcher l'URL `/site/index.html`). Une convention
   plus propre aurait `key: 'home'` et un mapping URL → key séparé.
3. **`page-next` (« Lire la suite ») n'est pas implémenté.** L'ancien
   landing l'avait. Il a été retiré dans cette passe — le sous-nav par
   page le remplace. Si l'utilisateur le veut, il suffit d'ajouter une
   rangée en bas de chaque section.
4. **Pas d'illustration / image OG dédiée.** Le site hérite de l'image OG
   de l'ancien landing. Une nouvelle image dédiée est recommandée avant
   déploiement public (cf. plan de campagne post-M3).

---

## 8. Suite recommandée

1. **Tester la version React dans le shell Coach OS** : ouvrir `App.tsx`
   et brancher une route `/site` sur les composants `pages/Home.tsx`,
   etc. (Hors périmètre de l'agent J — autre chantier.)
2. **Ajouter une OG image dédiée** au site : un visuel qui annonce le
   « bureau qui tient votre méthode » plutôt que l'ancien générique.
3. **Internationaliser** : la structure est prête (un seul
   `content.ts`), mais le site n'est qu'en français pour l'instant.
4. **Réviser les 19 apps Coach OS** selon `REPARTITION.md` — c'est la
   matrice qui évite que la prochaine passe reparte de zéro.
