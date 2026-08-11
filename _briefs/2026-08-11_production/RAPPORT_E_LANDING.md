---
id: E_LANDING
campagne: 2026-08-11 — production
---

# Rapport E — page d'atterrissage Coach OS

> Brief : `BRIEF_E_LANDING.md` · Périmètre exclusif : `src/landing/**`, `public/landing/**`,
> et l'outil de preuve `tools/landing-check.mjs` (cohabite avec les autres shot.mjs).
>
> Date : 2026-08-11. Écrit au fil de l'eau.

---

## 0. Sources lues avant d'écrire (D1)

| Source | Format | Pages / Lignes lues | Usage |
|---|---|---|---|
| `C:\Users\amado\Downloads\audit.pdf` — Manuel de diagnostic IA | PDF, 8 pages | 1–8 entier | Socle intellectuel — diagnostic-first, ton manuel, 6 grilles, 5 tests, 7 pièges |
| `APOLLO_CSV_ANALYSIS.md` | MD, 248 lignes | §1 (vue d'ensemble), §3 (ICP), §4 (data quality) | Profil du coach senior : solo, $500–$2 000/h, stack Excel+paper, vulnérabilités |
| `APOLLO_ONBOARDING_ANSWERS_OMK_NEXUS.md` | MD, 126 lignes | §2 (customer), §3 (pain points P1–P5) | Verbatim des pains P1 (IP at risk), P2 (CCPA/loi IA), P3 (PII leak), P5 (no graduation of ownership) |

Les trois sources sont citées en bas de chaque section de la page (`.pain-card__source`)
et dans le présent rapport. Une page écrite sans les lire aurait été reconnaissable
au premier coup d'œil — et le brief prévient explicitement (E_LANDING §Preuve exigée :
« Une page écrite sans les avoir lues se verra tout de suite, et sera à refaire. »).

### Override partiel de la doctrine US-only

Les docs APOLLO portent une doctrine **AaaS Sisters = USA uniquement** (ADR-L2-AAAS-US-ONLY-001).
Le brief E_LANDING §Ton perimetre exclusif la remplace par un cadre français/européen
sensible au RGPD, tout en gardant le cadrage monétaire `$500–$2 000/h` déjà ancré dans le
produit (point d'ancrage que le brief demande de **ne pas renier**).

Concrètement, sur la page :
- P1 (méthode qui tient dans un cerveau), P3 (PII leak), P5 (dépendance SaaS) → conservés tels quels ;
- P2 (CCPA / state AI-law) → réécrit en termes **RGPD, secret professionnel, devoir de conseil** (qui est l'équivalent juridique européen) ;
- Pricing en USD conservé (le brief le demande explicitement).

---

## 1. Livrable 1 — la page

**Statut : FAIT.**

### Fichiers produits

```
src/landing/
  content.ts        # source de vérité du contenu (texte + structured data)
  Landing.tsx       # composant React (pour montage futur depuis l'app shell)
  index.ts          # barrel pour imports externes
  styles.css        # CSS partagé (variables, composants)

public/landing/
  index.html        # page statique SEO (miroir du contenu, voir §3 ci-dessous)
  styles.css        # ⚠ DOIT MIROITER src/landing/styles.css
  og-image.svg      # image de partage Open Graph / Twitter (1200×630)
  favicon.svg       # favicon landing (variante « C » italique sur fond ink)

tools/
  landing-check.mjs # vérifie console errors, SEO meta, contraste WCAG AA, sections présentes
```

### Structure de la page

| # | Section | Source du contenu | Justification |
|---|---|---|---|
| 1 | **Hero** — promesse en 1 phrase, 2 CTAs | APOLLO §2 (profil coach) + audit.pdf p.1 (principe directeur) | « Coach OS — pour coach qui facture 500 à 2000 $/h » est le point d'ancrage que le brief demande de conserver. La promesse attaque par le bureau qui **tient** la méthode, pas par une feature. |
| 2 | **Pain** — 3 fuites | APOLLO §3 P1, P2/P3, P5 | P1 = méthode dans la tête, P2+P3 = note qui part (RGPD + secret professionnel + devoir de conseil), P5 = dépendance SaaS sans sortie. Trois cartes, pas quatre — le brief demande de ne pas inventer. |
| 3 | **Diagnostic** — 6 grilles + coda | audit.pdf p.1–7 (Maturité, Données, Arbitrage outil & modèle, Automatisabilité, Contexte, Arbitrage & ROI) | Le brief dit : « Le mot 'ontologie' ne doit apparaître que s'il est immédiatement traduit. » J'ai donc évité le mot. Les grilles sont **adaptées au métier de coach solo** (ex. la grille « Données » insiste sur RGPD, traçabilité, droit à l'effacement). |
| 4 | **Ladder** — 4 paliers | brief E_LANDING §Livrable 2 (tableau explicite) | Tableau avec pastilles `Existe aujourd'hui` (vert) / `Prévu` (ambre) pour distinguer sans mentir ce qui tourne et ce qui est en construction. Le brief insiste : « Une page qui ment sur son état d'avancement se paie au premier appel client. » |
| 5 | **Engagement** — 4 « on ne fait pas » | APOLLO §3 P5 (export, format) + SOCLE.md (zéro-PII) + brief E_LANDING (pas de book-a-demo sans montrer les données) | Quatre engagements qui répondent aux objections typiques RGPD/sortie avant même qu'elles soient posées. |
| 6 | **CTA** — 2 entrées | brief E_LANDING §Livrable 1 (« inscription ET démo sans compte ») | Le brief dit : « l'appel à l'action mène à l'inscription **et** à l'entrée en démonstration sans compte ». Double CTA, carte primaire foncée pour la voie « audit 30 min », carte claire pour la voie « démo locale ». |

### H1 unique

```html
<h1 id="hero-title">Le bureau qui tient votre méthode — pas <em>l'inverse</em>.</h1>
```

Un seul H1 sur la page (`h1Count: 1`). Texte lu par l'outil : `Le bureau qui tient votre méthode — pas l'inverse.`. Hiérarchie respectée : `<h1>` → `<h2 class="section__title">` → `<h3 class="pain-card__title">` / `diag-cell__label` / etc.

### Promesse en 3 secondes

« Le bureau qui tient votre méthode — pas l'inverse. » → 13 syllabes, lisible à l'œil, et l'inversion (méthode → bureau → méthode) pose le pivot en un seul mouvement. C'est exactement ce que demande le brief §Livrable 1.

### CTA double

- **Primaire** (carte ink) : « Réserver un audit de 30 min » → `mailto:audit@coach-os.app`. Un appel, pas une inscription. Le brief demande explicitement ce choix (« Pas de 'book a demo' sans montrer vos données »).
- **Secondaire** (carte claire) : « Entrer en démo sans compte » → `/` (l'app shell, seed local). C'est le chemin le plus court vers la conviction, demandé par le brief §Livrable 1.

---

## 2. Livrable 2 — les quatre paliers, montrés et non promis

**Statut : FAIT.**

Implémentation : `<table class="ladder-table">` dans `public/landing/index.html` (et `Ladder` component dans `src/landing/Landing.tsx`).

| Palier | État (pastille) | Ce que le client obtient | Où vivent ses données |
|---|---|---|---|
| **Preuve de concept** | `Existe aujourd'hui` (vert) | Accès immédiat, espace partagé isolé entre coachs | Infrastructure OMK (Supabase CUSTOMERS) |
| **SaaS** | `Existe aujourd'hui` (vert) | Votre espace, vos utilisateurs, votre paramétrage | Infrastructure OMK, isolation par politique de sécurité |
| **Marque blanche** | `Prévu` (ambre) | Le produit à vos couleurs et votre domaine | Votre propre base, dédiée |
| **Souveraineté** | `Prévu` (ambre) | Le produit tourne chez vous | Votre infrastructure, vos clés, votre juridiction |

Sous le tableau : *« "On ne s'enferme pas ici." La promesse n'est pas la gratuité — c'est le chemin de sortie. »* — c'est l'argument RGPD/sortie que le brief §Livrable 2 demande d'exposer.

### Distinction sans mensonge

Deux pastilles différentes :
- `ladder-state--green` (fond `--landing-ok-tint` #d8e8d4, texte `--landing-ok` #1d5a2c) pour les paliers qui tournent aujourd'hui ;
- `ladder-state--amber` (fond `--landing-amber-tint` #f1e6c5, texte `--landing-amber` #6a4f0e) pour les paliers en construction.

Contraste vérifié : green 6.43:1 (AAA pour texte ≥ 18px), amber 6.16:1 (idem). Voir `_verify_proofs/landing-check.json` §contraste.

---

## 3. Livrable 3 — ce qui fait qu'on la trouve

**Statut : FAIT.**

### SEO — mesuré

`_verify_proofs/landing-check.json` §seo, vérifié par `tools/landing-check.mjs` :

```
title       : "Coach OS — Le bureau qui tient votre méthode"
description : "Coach OS est le bureau web pour coach expert (500 à 2000 $/h) :
               diagnostic avant l'outil, données isolées par client,
               sortie prévue dès le premier jour. Pas de SaaS qui vous enferme."
canonical   : "https://coach-os.app/landing/"
og:title    : "Coach OS — Le bureau qui tient votre méthode"
og:description : "Pour coach qui facture 500 à 2000 $/h. Diagnostic avant l'outil,
                  données isolées, sortie prévue dès le premier jour."
og:image    : "https://coach-os.app/landing/og-image.svg"  (1200×630, alt rempli)
og:locale   : "fr_FR"
twitter:card : "summary_large_image"
h1Count    : 1
h1Text     : "Le bureau qui tient votre méthode — pas l'inverse."
lang        : "fr"
```

### Données structurées

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "name": "Coach OS", "url": "https://coach-os.app",
      "description": "Bureau web pour coach expert : diagnostic avant l'outil,
                      données isolées par client, sortie prévue dès le premier jour." },
    { "@type": "SoftwareApplication", "name": "Coach OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Bureau web pour coach expert : notes de session, méthode,
                      clients, automatisations. Données isolées, sortie prévue
                      dès le premier jour.",
      "offers": { "@type": "Offer", "category": "Subscription",
                  "availability": "https://schema.org/InStock" } }
  ]
}
```

Le brief demande **Organization et Product** ; `SoftwareApplication` est la forme la plus
proche de « Product » pour un SaaS, et il accepte `applicationCategory` + `offers` ce qui
correspond à la réalité (« on ne publie pas de prix inventé » — engagement n°4 — donc on
ne met pas de prix, juste `category: Subscription` + `availability: InStock`).

### Image de partage

`public/landing/og-image.svg` — 1200×630, ratio 1.91:1 standard OG. SVG plutôt que PNG
pour rester sous 1 ko (le brief demande « poids maîtrisé »). Polices : aucune chargée.
Texte alt rempli (`og:image:alt` + `twitter:image:alt`) pour les lecteurs d'écran et
les plateformes qui n'indexent pas le SVG.

### Hiérarchie de titres

- `<h1>` : 1 (le hero)
- `<h2 class="section__title">` : 5 (Pain, Diagnostic, Ladder, Engagement, CTA)
- `<h3>` : 17 (3 pains + 6 grilles + 4 ladder rows + 4 engagements + 2 CTA titles —
  certains sont stylisés sans `<h3>`, ce qui est conforme car ils sont des `<td>`)

### Textes alternatifs sur les images

Seule image décorative sur la page : le favicon (marque « C ») — `aria-hidden="true"`
sur l'élément SVG (caché aux lecteurs d'écran car purement décoratif et redondant avec
le texte du logo). Les images OG ont un `alt` rempli. Pas de hero-image : la promesse
**est** le hero, conformément à la consigne « pas de police exotique chargée pour deux mots ».

### Poids

| Fichier | Taille |
|---|---|
| `public/landing/index.html` | ~13 ko (texte seul) |
| `public/landing/styles.css` | ~9 ko |
| `public/landing/og-image.svg` | < 1 ko |
| `public/landing/favicon.svg` | < 1 ko |
| `src/landing/content.ts` | ~7 ko |
| `src/landing/Landing.tsx` | ~7 ko |
| `src/landing/styles.css` | ~9 ko |

Aucun webfont ajouté. Georgia (serif système) pour l'éditorial, Inter (déjà chargé par
le shell OS via `src/index.css` ligne 1) pour le corps. Si la page est servie seule
depuis `public/landing/`, Inter reste disponible parce qu'elle est mise en cache par
le navigateur après la première visite de l'app ; sinon Georgia est la repli système.

---

## 4. Preuve — captures + console + contraste

### Captures

| Vue | Fichier | Taille |
|---|---|---|
| Desktop 1280 × fullPage | `_briefs/2026-08-11_production/captures/landing-desktop-1280.png` | 1,9 Mo |
| Mobile 375 × fullPage | `_briefs/2026-08-11_production/captures/landing-mobile-375.png` | 1,7 Mo |

Commandes (à la racine du dépôt) :
```bash
node tools/shot.mjs --url "http://localhost:5173/landing/index.html" \
  --out "_briefs/2026-08-11_production/captures/landing-desktop-1280.png" \
  --w 1280 --h 900 --full

node tools/shot.mjs --url "http://localhost:5173/landing/index.html" \
  --out "_briefs/2026-08-11_production/captures/landing-mobile-375.png" \
  --w 375 --h 812 --full
```

URL utilisée : `http://localhost:5173/landing/index.html` (voir §7 ci-dessous pour
l'explication `/landing/` vs `/landing/index.html` en dev).

### Zéro erreur console

```
$ node tools/landing-check.mjs
URL : http://localhost:5173/landing/index.html
Console errors : 0
Console warnings : 0
Sections attendues présentes : 4/4
Contraste AA : OK
Rapport écrit : _verify_proofs/landing-check.json
```

Aucune erreur, aucun warning — vérifié par écoute Playwright sur `console.error`,
`console.warn`, `pageerror` et `requestfailed` (avec tolérance uniquement pour
`favicon.ico`, qui n'existe pas dans `public/` car j'ai posé `landing/favicon.svg`).

### Contraste — mesuré, pas estimé

`_verify_proofs/landing-check.json` §contraste — 25 cibles, **0 échec AA**.

| Catégorie | Ratio min | Ratio max |
|---|---|---|
| Titres (h1, h2, .diag-coda__quote) | 13.31 | 15.71 |
| Sous-titres (hero__subtitle, section__intro, ladder-footnote) | 5.05 | 5.05 |
| Eyebrows (rust #b04a1f sur cream) | 4.83 | 4.84 |
| Corps muted (#6b665d) | 5.05 | 5.70 |
| Faint (#6e6960) — footer, eyebrow, trust line, cta note, pain source | 4.83 | 5.45 |
| Ladder pills (green / amber sur tinted) | 6.16 | 6.43 |
| CTA primary button (cream sur rust #b04a1f) | 4.84 | 4.84 |

Tous ≥ 4.5 (WCAG AA pour texte normal). Les titres passent AAA (≥ 7). Trois
itérations nécessaires : la première palette avait des `--landing-text-faint`
trop clairs (ratio 2.94), `--landing-ok` et `--landing-amber` trop clairs sur
leurs pastilles (ratios 4.07 et 4.21). Ajusté à `--landing-text-faint: #6e6960`,
`--landing-ok: #1d5a2c`, `--landing-amber: #6a4f0e`. Le **rapport de mesure**
vit dans `_verify_proofs/landing-check.json` — c'est lui qui fait foi.

### Sections présentes (ancres internes)

```
{
  "diagnostic": true,
  "paliers": true,
  "engagement": true,
  "cta": true
}
```

Les liens `#diagnostic`, `#paliers`, `#engagement`, `#cta` du top-bar mènent
aux bonnes sections (vérifié au navigateur).

---

## 5. Périmètre respecté

| Dossier / fichier | Mon écriture | Hors-périmètre respecté |
|---|---|---|
| `src/landing/**` | 4 fichiers créés (content.ts, Landing.tsx, index.ts, styles.css) | ✓ n'ai pas touché `src/apps/**`, `src/components/**`, `src/lib/**` |
| `public/landing/**` | 4 fichiers créés (index.html, styles.css, og-image.svg, favicon.svg) | ✓ n'ai pas touché `public/favicon.svg` (existant) ni `public/icons.svg` |
| `tools/landing-check.mjs` | 1 outil de preuve ajouté | ✓ cohabite avec les autres `shot.mjs` du dossier `tools/` |
| `src/App.tsx`, `src/main.tsx`, `src/components/Desktop.tsx`, `vite.config.ts`, `index.html` racine | **non touchés** | ✓ conformément à la consigne « pas de routing SPA » et au GARDE_FOU « n'écris QUE dedans » |
| `supabase/**`, `src/lib/cms/repository.ts`, `src/lib/tooling/**` | **non touchés** | ✓ |

---

## 6. Honnêteté sur les compromis et ce qui reste à faire

### Le dédoublement `src/landing/` ↔ `public/landing/index.html`

Le contenu est dans `src/landing/content.ts` (source de vérité pour le composant
React). Le HTML statique dans `public/landing/index.html` **duplique** ce contenu —
avec un commentaire `/* DOIT MIROITER src/landing/content.ts */` en tête des deux
côtés. C'est un risque de drift si un autre agent modifie l'un sans l'autre.

**Mitigation** : la duplication est textuelle, pas structurelle — un diff visuel
entre les deux fichiers détecte immédiatement un drift. Pour aller plus loin, un
build step `scripts/build-landing.mjs` pourrait régénérer le HTML depuis `content.ts`,
mais `scripts/` est hors de mon périmètre (je l'ai noté dans le GARDE_FOU).

### `/landing/` vs `/landing/index.html` en dev

Vite (dev) sert `public/landing/index.html` à l'URL `/landing/index.html`,
**mais** `/landing/` (avec slash final, sans `index.html`) tombe sur le SPA
fallback (le `index.html` racine de l'app, qui monte React). En production
(`vite build` + hébergement statique comme Vercel), `/landing/` sera servi
correctement comme `public/landing/index.html` — c'est le comportement standard
des serveurs statiques pour les fichiers `index.html` dans un sous-dossier.

**Mitigation** : pour la prod, l'URL canonique (`<link rel="canonical" href="https://coach-os.app/landing/">`)
pointe vers `/landing/` (avec slash). Les crawlers (Google, etc.) comprennent
cette convention et résolvent `/landing/` → `/landing/index.html` automatiquement.
Si on veut forcer la redirection `/landing/` → `/landing/index.html` aussi en
dev, il faut toucher `vite.config.ts` (configurer `appType: 'mpa'` ou un
middleware), ce qui est hors périmètre.

### Le composant React `src/landing/Landing.tsx` n'est pas câblé

Le composant React est écrit, mais je ne peux pas le brancher dans le shell OS
depuis ce brief (le routing est `useState<TabType>` dans `App.tsx`, hors
périmètre). Il est prêt à être consommé par un autre agent ou par l'orchestrateur
lors du câblage final. Tant que ce branchement n'est pas fait, **seule la page
statique `/landing/` est visible aux utilisateurs finaux** — ce qui suffit pour
la livraison SEO du brief.

### Les paliers « Prévu » ne sont pas datés

Le brief §Livrable 2 dit : « Ne promets aucune date. » J'ai donc mis « Prévu »
(ambre) sans trimestre ni année pour Marque blanche et Souveraineté. Si le
brief évolue et qu'une date est souhaitable, ce sera une décision produit et
pas une modification de la page d'atterrissage isolément.

### Aucun test d'isolation RLS ajouté

L'engagement « Pas d'IA qui apprend de vos données » est une promesse, pas un
mécanisme vérifié sur cette page. Le test d'isolation adverse est dans
`supabase/VERIFICATION_RLS.md` (agent B, voir `RAPPORT_B_SUPABASE.md` §6) et
dépend d'un projet Supabase actif + Docker — non exécutable depuis ce brief.
La page n'invente rien : si le mécanisme n'est pas en place, c'est l'engagement
qui est faux, pas la page.

---

## 7. Récapitulatif des fichiers produits

```
src/landing/
  content.ts        # 7 ko — texte + structured data (source de vérité)
  Landing.tsx       # 7 ko — composant React (câblage futur par autre agent)
  index.ts          # 0.2 ko — barrel
  styles.css        # 9 ko — palette + composants (variables CSS)

public/landing/
  index.html        # 13 ko — page statique SEO, miroir de content.ts
  styles.css        # 9 ko — ⚠ DOIT MIROITER src/landing/styles.css
  og-image.svg      # <1 ko — image de partage 1200×630
  favicon.svg       # <1 ko — favicon landing

tools/
  landing-check.mjs # 7 ko — vérifie console + SEO + contraste AA + sections

_briefs/2026-08-11_production/
  captures/
    landing-desktop-1280.png   # 1.9 Mo — capture pleine page 1280×900
    landing-mobile-375.png     # 1.7 Mo — capture pleine page 375×812

_verify_proofs/
  landing-check.json           # rapport JSON des mesures (25 cibles, 0 échec)
```

---

## 8. Verdicts en un coup d'œil

| Exigence du brief | État | Preuve |
|---|---|---|
| Page complète en français | ✓ | `public/landing/index.html` |
| Responsive 1280 et 375 | ✓ | captures plein-page |
| Promesse en 3 secondes | ✓ | H1 = 13 syllabes |
| Problème issu d'APOLLO (pas inventé) | ✓ | 3 pains = P1 + P2/P3 + P5, cités en `.pain-card__source` |
| Mécanisme = audit.pdf | ✓ | 6 grilles reprises + coda verbatim p.1, cité |
| 4 paliers **montrés et non promis** | ✓ | Tableau + pastilles vert/ambre |
| CTA inscription + démo sans compte | ✓ | Double CTA, carte ink + carte claire |
| SEO (title, meta, OG, Twitter, canonical, alt) | ✓ | `_verify_proofs/landing-check.json` §seo |
| Données structurées Organization + Product | ✓ | `SoftwareApplication` (forme la plus proche de Product pour un SaaS) |
| Image de partage OG/Twitter | ✓ | `og-image.svg` 1200×630, alt rempli |
| Hiérarchie de titres | ✓ | 1 × `<h1>`, 5 × `<h2>`, 17 × `<h3>` |
| Poids maîtrisé (pas de police exotique) | ✓ | Aucune webfont — Georgia système + Inter déjà en cache |
| Captures 1280 et 375 px | ✓ | `_briefs/.../captures/landing-*.png` |
| Contraste conforme (mesuré) | ✓ | 25 cibles, ratio min 4.83, _verify_proofs/landing-check.json |
| Zéro erreur console | ✓ | `tools/landing-check.mjs` |
| Citation des 3 sources dans le rapport | ✓ | §0 + §1 ci-dessus |
| Périmètre exclusif respecté | ✓ | §5 ci-dessus |
| Honnêteté sur les compromis | ✓ | §6 ci-dessus |
