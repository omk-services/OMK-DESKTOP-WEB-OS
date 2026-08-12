# RAPPORT_O_SIDEBAR — le site passe en rail latéral, le héros redevient lisible

> Agent O · campagne 2026-08-11 · producteur : coach-os site statique
> Périmètre : `public/site/{index,methode,paliers,engagements,demo}.html`,
> `public/site/styles.css`, `tools/site-rail.mjs` (nouveau).
> Hors périmètre (signalé, jamais touché) : `src/site/**`, `src/**`, `supabase/**`,
> `deploy/**`, `tools/**` (sauf le nouveau `site-rail.mjs`).

## TL;DR

- **Rail latéral à 240 px** sur les écrans ≥ 1024 px ; barre horizontale
  rétablie en dessous, sans hamburger.
- **Sous-nav intra-page transformée en en-tête de page** (titre à gauche,
  ancres à droite) ; sticky à l'intérieur de la colonne de contenu, plus
  en haut de la fenêtre.
- **Hero `fx-decrypt`** : le bruit est désormais confiné aux marges haute
  et basse (masque linear vertical 14 % → 86 %). Mesure : le rectangle
  du titre #hero-title et celui du `.site-lead` tombent entièrement dans
  la bande transparente. Contraste calculé = 18.93 (titre) et 16.64
  (lead), bien au-dessus du seuil WCAG AA 4.5.
- **Trois autres `.fx-canvas`** étaient susceptibles de concurrencer le
  texte (`.sec-cta .fx-particle`, `.sec-engagements .fx-shatter`,
  `.sec-demo-howto .fx-particle`) — tous portent désormais un mask-image
  qui évide la colonne de texte.
- **`tools/site-rail.mjs`** existe, sort en code non-nul au moindre
  échec, et passe **tous les seuils** sur les 5 pages × 2 largeurs
  (1440 + 900). 15 captures dans `C:\Users\amado\AppData\Local\Temp\rail\`.
- **Constat `src/site/**`** : 10 fichiers React ré-implémentent le site
  en double. **Aucun import dehors du dossier** confirmé par grep. Le
  code est mort ; la décision de suppression ou de rapatriement est
  renvoyée à l'utilisateur.

---

## §1 — Largeur de rail retenue

**240 px** sur écran ≥ 1024 px.

### Pourquoi

| Largeur | Verdict |
|---|---|
| 200 px | « Engagements » passe en deux lignes dans le rail. Le lien perd son repère visuel. |
| 220 px | « Engagements » passe encore en deux lignes. Inconfortable. |
| **240 px** | Les cinq étiquettes tiennent sur une ligne. Le CTA « Entrer en démo » reste 48 px de haut centré. Le contenu garde un max-width 1200 px, donc la colonne de texte garde ~960 px — au-dessus du seuil psychologique de 12–14 mots par ligne. |
| 260 px | On commence à grignoter la colonne de texte. |

### Vérification

`tools/site-rail.mjs` mesure la largeur du `.site-top` sur les 5 pages à
1440 px — toutes à 240 px, à ±0 px de la cible.

```
home         240 px  ✓ (cible 240)
methode      240 px  ✓ (cible 240)
paliers      240 px  ✓ (cible 240)
engagements  240 px  ✓ (cible 240)
demo         240 px  ✓ (cible 240)
```

---

## §2 — Chantier 1 : multi-pages → rail latéral

`public/site/styles.css` § 3 et nouveau § 4bis.

**Sur ≥ 1024 px** (media query `@media (min-width: 1024px)`) :

- `.site-top` : `position: fixed; top: 0; left: 0; bottom: 0; width: 240px;`
  Contient, de haut en bas :
  1. la marque (`Coach OS` + carré « C »),
  2. la nav (`.site-top__nav`) en flexbox colonne, liens en `display: block`,
  3. le CTA « Entrer en démo » collé en bas via `margin-top: auto` sur
     `.site-top__cta { display: block; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--line); }`.
- L'état `aria-current="page"` est mis en page de manière **nette** :
  fond `var(--ink)`, couleur `var(--paper)`, poids 600, plus un marqueur
  latéral 3 px à gauche en `::before` (utilise `--accent` si défini, sinon
  `--ink`). L'utilisateur sait immédiatement où il est sans effort.
- `<main>` et `<footer>` reçoivent `margin-left: 240px;`. La colonne de
  contenu démarre **exactement** contre le bord droit du rail — la
  mesure `main.left - rail.right = 0` sur les 5 pages.

**Sur < 1024 px** (media query `@media (max-width: 1023.98px)`) :

- `.site-top` redevient `position: sticky; top: 0;` (le comportement
  existant). Marque à gauche, nav à droite (`margin-left: auto`), le CTA
  `display: none`.
- La barre horizontale est plus haute qu'avant (61.25 px) à cause du
  `wrap` — c'est acceptable, c'est le seul changement visible par
  rapport à la baseline.

### Vérification

```
Sections hors rail (1440) :
  home         ✓
  methode      ✓
  paliers      ✓
  engagements  ✓
  demo         ✓
```

Pour chaque page, `main.left = 240` (= `rail.right`).

### Captures rail-1440

- `rail-home-1440.png` — rail 240 px, `Accueil` rempli, CTA en bas
- `rail-methode-1440.png` — rail 240 px, `Méthode` rempli
- `rail-paliers-1440.png` — rail 240 px, `Paliers` rempli, fond gradient
  contenu
- `rail-engagements-1440.png` — rail 240 px, `Engagements` rempli, fond
  jaune brutaliste contenu
- `rail-demo-1440.png` — rail 240 px, `Démo` rempli

---

## §3 — Chantier 2 : la sous-nav devient en-tête de page

`public/site/styles.css` § 4 et nouveau § 4bis.

**Sur ≥ 1024 px** :

- `.site-subnav` quitte le sommet de la fenêtre ; il est désormais
  `position: sticky; top: 0;` à l'intérieur de la **colonne de contenu**
  (`margin-left: 240px`). On lit la nav intra-page quand on a déjà
  commencé à lire la page — c'est exactement la distinction demandée.
- Le titre de la page est porté à gauche par un `<span class="site-subnav__title">`
  ajouté dans le HTML de chaque page. Il utilise `margin-right: auto`
  pour pousser les ancres à droite. Le `flex-wrap` gère le passage à
  la ligne en mode horizontal.
- Cinq pages × une ligne de diff HTML — vérifié dans le diff.

**Sur < 1024 px** :

- `.site-subnav` reprend `position: sticky; top: 3.125rem` (juste sous
  la barre du haut). La barre `Accueil` + liens reste lisible et
  fonctionnelle.

### Vérification

Les effets `aria-current="true"` sur la sous-nav (calculé par
`effects.js` via IntersectionObserver) sont conservés tels quels. Le
sélecteur `.site-subnav a` est inchangé, donc la logique de marquage
au défilement marche sans réécriture.

---

## §4 — Chantier 3 : le héro redevient lisible

### Le défaut mesuré

Capture `rail-home-1440.png` avant correction :
- Titre hero `font-size: clamp(3rem, 10vw, 9rem)` → 144 px à 1440 px viewport
- `max-width: 14ch` → boîte 1136 px de large (presque toute la largeur)
- Le `fx-decrypt` posait un voile `mix-blend-mode: multiply` à 0.7
  opacité sur la totalité du `.sec-hero` — le titre et le paragraphe
  étaient **derrière** le bruit.

### La correction

`public/site/styles.css` (section sec-hero) :

```css
.sec-hero .fx-canvas.fx-decrypt {
  mask-image: linear-gradient(
    to bottom,
    #000 0%, #000 14%,
    transparent 14%, transparent 86%,
    #000 86%, #000 100%
  );
  opacity: 0.55;   /* était 0.7 — bruit plus discret */
}
```

**Pourquoi une bande horizontale et pas un radial**. Le titre hero prend
~95 % de la largeur du canvas — un masque radial centré laisse le trou
transparent bien plus petit que le titre. Une bande verticale qui couvre
y=14 % → y=86 % du `.sec-hero` est géométriquement la bonne forme : le
titre (centré verticalement par `align-items: center` sur la grille)
tombe dans la fenêtre transparente.

### Vérification

`tools/site-rail.mjs` lit la position du `#hero-title` et du `.site-lead`
relativement au `.fx-canvas`, parse la mask-image (`linear-gradient`
avec `rgba(0,0,0,0)`), extrait la bande transparente, et vérifie que
les rectangles du titre et du lead en font partie.

```
Hero (index.html) :
  fx intersect titre : oui
  fx intersect lead  : oui
  mask radial        : non
  mask linear        : oui
  titre dans bande   : true
  contraste titre    : 18.93 ✓    (seuil WCAG AA = 4.5)
  contraste lead     : 16.64 ✓
  verdict hero       : ✓
```

### Les autres `.fx-canvas`

- `.sec-cta .fx-canvas.fx-particle` : grille de points. Nouveau
  mask-image radial ellipse 75 % × 60 % au centre, transparent jusqu'à
  50 % du rayon. Opacité baissée 0.35 → 0.25. Les cartes `.cta-card`
  (qui ont leur propre fond `#f5f5f7`) ne sont pas affectées.
- `.sec-engagements .fx-canvas.fx-shatter` : diagonales.
  mask-image radial ellipse 80 % × 70 % au centre, transparent jusqu'à
  45 % du rayon. Opacité de pulse 0.5 → 0.4.
- `.sec-demo-howto .fx-canvas.fx-particle` : particules JS. mask-image
  radial ellipse 70 % × 60 % au centre, transparent jusqu'à 40 % du
  rayon. Opacité 0.35.
- `.sec-pain .fx-canvas.fx-liquid` : déjà positionné 60 vmin right/top,
  aucune intersection avec la colonne de texte. **Inchangé.**
- `.sec-grids .fx-canvas.fx-grid` : quadrillage à 0.04. **Inchangé.**
- `.sec-paliers .fx-canvas.fx-glass-overlay` : reflets sur cartes
  blanches semi-transparentes. **Inchangé.**
- `.sec-demo-creds .fx-canvas.fx-glyph-rain` : déjà masqué en vertical
  par `linear-gradient`. **Inchangé.**

---

## §5 — Ce que je n'ai pas changé

- **Le contenu (texte)** : pas un mot de copie réécrit. Brief
  structurel, pas rédactionnel.
- **Les registres de design par section** : Brutalism sur `pain`,
  Glassmorphism sur `paliers`, Brutalism jaune sur `engagements`,
  Terminal sur `creds`. Tous conservés.
- **Les `<head>`** : titres, descriptions, OpenGraph, JSON-LD,
  canoniques. **Inchangés.**
- **Le footer** : aucune modification structurelle. Le décalage
  `margin-left: 240px` est appliqué uniformément sur ≥ 1024 px.

---

## §6 — `src/site/**` : code mort confirmé

`grep -r "from ['\"]\\.\\./site/" src/` et
`grep -r "/site/(index|methode|paliers|engagements|demo)" src/` :

- Aucun import hors de `src/site/` qui pointe vers ce dossier.
- Aucun routeur, aucun composant, aucun test ne dépend de `src/site/`.

Fichiers dans `src/site/` :

```
chrome/Header.tsx
content.ts
effects/    (décrypt + particle + liquid + grid + glass)
index.ts
pages/      (Home, Methode, Paliers, Engagements, Demo)
styles/     (tailwind + globals)
REPARTITION.md
```

**Décision renvoyée à l'utilisateur** : supprimer (et garder `public/site/`
comme canonique) ou rapatrier (et alors la source devient React). Je
n'ai touché à rien.

---

## §7 — `tools/site-rail.mjs`

Nouveau fichier à `tools/site-rail.mjs`. Trame inspirée de
`site-diversite.mjs` et `site-subnav.mjs`.

**Mesures** (par page, par largeur) :

1. **1440 × 900** :
   - Largeur rail ∈ [200, 260] px, cible 240.
   - `main.left >= rail.right` (à ±1 px).
   - Pour chaque section enfant direct de `<main>`, `rect.left >= rail.right`.
   - Hero (home uniquement) : intersection géométrique titre↔fx et
     lead↔fx, parsing de la mask-image (`rgba(0,0,0,0)` = transparent),
     vérification que le rectangle du texte est dans la bande
     transparente. Contraste WCAG ≥ 4.5 sur titre et lead.
2. **900 × 900** :
   - `.site-top` redevenu horizontal : `rect.height < 120` ET
     `rect.width >= viewport × 0.95`.
   - `<main>` n'a plus de margin-left significatif (< 4 px).
3. **390 × 844** : capture pleine hauteur pour le brief (mesure
   non-bloquante, simple capture).
4. **Console** : zéro erreur console, zéro requête échouée.

**Sortie** : `_verify_proofs/site-rail.json` (rapport détaillé) +
**15 captures** dans `C:\Users\amado\AppData\Local\Temp\rail\`.

**Code retour** : 0 si tous les seuils passent, 1 sinon, 2 si Playwright
introuvable. **Pas de repli silencieux** : un seuil raté produit
immédiatement un exit non-nul avec verdict explicite.

### Sortie console (extrait)

```
Rail-side · site /site/ · base http://127.0.0.1:5173
  Largeur rail à 1440px  :  5/5 à 240 px ✓
  Rail horizontal à 900px :  5/5 horizontal (900 × 61.25) ✓
  Sections hors rail (1440) :  5/5 ✓
  Hero (index.html) :
    fx intersect titre : oui
    fx intersect lead  : oui
    mask linear        : oui
    titre dans bande   : true
    contraste titre    : 18.93 ✓
    contraste lead     : 16.64 ✓
    verdict hero       : ✓
  Erreurs console (total) : 0 ✓

Verdict par seuil :
  ✓ rail
  ✓ mainOffset
  ✓ sectionsClear
  ✓ mobile
  ✓ hero
  ✓ console
```

---

## §8 — Captures

Toutes dans `C:\Users\amado\AppData\Local\Temp\rail\` (15 fichiers) :

```
rail-home-1440.png          405 ko   rail-pleine hauteur, rail 240 px
rail-home-900.png           290 ko   rail horizontal
rail-home-390.png           201 ko   mobile

rail-methode-1440.png       280 ko
rail-methode-900.png        247 ko
rail-methode-390.png        238 ko

rail-paliers-1440.png       699 ko   fond gradient
rail-paliers-900.png        745 ko
rail-paliers-390.png        411 ko

rail-engagements-1440.png   251 ko   fond jaune brutaliste
rail-engagements-900.png    204 ko
rail-engagements-390.png    164 ko

rail-demo-1440.png          251 ko
rail-demo-900.png           219 ko
rail-demo-390.png           185 ko
```

Inspectées à l'œil : la nav latérale est lisible, la page courante est
mise en exergue, le CTA est en bas, le hero est net.

---

## §9 — Ce que je n'ai pas réussi à faire

**Rien de bloquant.** Tous les seuils du brief sont atteints.

Points que j'aurais pu pousser plus loin, mais qui dépassent le brief :

- La couleur d'accent du marqueur latéral `aria-current="page"` est
  lue depuis `--accent` de la page courante. Aujourd'hui seules
  `sec-hero` (orange `#ff5b1f`), `sec-paliers` (blanc), etc. la
  définissent. Sur les pages sans `--accent` (ex. `methode`, `demo`),
  c'est `--ink` (noir) qui sert. C'est cohérent, pas un bug.
- Le CTA dans le rail ouvre `demo.html` même quand on est déjà sur
  `demo.html`. Acceptable — la convention Material/Apple pour les
  CTA « primary » est qu'ils réitèrent la même action.
- La transition rail ↔ barre horizontale à 1024 px est nette
  (display : none / display : block sur le CTA), pas animée. Un
  `transition: opacity 200ms` adoucirait, mais ça reste un détail
  hors brief.

---

## §10 — Annexes

- Diff fichiers modifiés :
  - `public/site/styles.css` : § 3 et § 4 entièrement réécrits ;
    nouveaux § 4bis (≥ 1024 px) et § 4ter (< 1024 px) ; sections
    sec-hero, sec-cta, sec-engagements, sec-demo-howto ajustées
    (masque + opacité).
  - `public/site/index.html` : ajout `<span class="site-subnav__title">`
    et `<div class="site-top__cta">`. Pas d'autre changement.
  - `public/site/methode.html` : idem.
  - `public/site/paliers.html` : idem.
  - `public/site/engagements.html` : idem.
  - `public/site/demo.html` : idem.
  - `tools/site-rail.mjs` : nouveau.
  - `_briefs/2026-08-11_production/RAPPORT_O_SIDEBAR.md` : ce fichier.
- `effects.js` : **non modifié**. La logique de marquage
  `aria-current` du rail (`markActiveTopLink`) et de la sous-nav
  (`wireSubnav`) reposent sur les mêmes sélecteurs CSS
  (`.site-top__nav a`, `.site-subnav a`) — le passage en rail n'a
  touché qu'au style, pas au DOM.

---

## §11 — Reproduction

```bash
# Avec le serveur de dev déjà sur :5173 (Vite)
node tools/site-rail.mjs \
  --base=http://127.0.0.1:5173 \
  --out=_verify_proofs/site-rail.json \
  --capture-dir=C:/Users/amado/AppData/Local/Temp/rail

# Exit 0 = tout passe. Exit 1 = au moins un seuil raté,
# sortie explicite. Exit 2 = playwright introuvable.
```
