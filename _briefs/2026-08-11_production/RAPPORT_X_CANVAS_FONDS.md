---
id: RAPPORT_X_CANVAS_FONDS
campagne: 2026-08-11 — production
brief: BRIEF_X_CANVAS_FONDS
auteur: agent X — MiniMax-M3
date: 2026-08-13
status: COMPLET — cinq composants lus, cinq registres mesures, fiche par composant. Aucune ecriture dans le produit.
---

# Rapport X — Cinq Canvas de fond, un par page du site

> **Statut final** : cinq pages de doc ouvertes, cinq fichiers `-vanilla.json`
> telecharges et mesures au octet via curl. Une fiche par composant ecriture
> dans `canvas_fonds.json`. Aucune ecriture de composant ou d'effet (regle §0
> du brief). Une observation hors perimetre est signalee en fin de rapport.

## 0. M ethode

- Lecture des **cinq pages** `https://canvasui.dev/docs/components/<nom>`.
  Sections effectivement lues sur chaque page : *Demo*, *Install*, *Code*,
  *API reference*. Les pages ne portent pas d'en-tete *Dependencies* visible —
  l'absence est notee dans la fiche.
- Lecture de la page d'introduction `https://canvasui.dev/docs` pour les
  questions transverses (drapeau, jeton, repli). Verbatim cite au §1.
- Telechargement direct avec `curl` des cinq `-vanilla.json` dans
  `_briefs/2026-08-11_production/registre_canvas/`. La taille est mesuree a
  l'octet pres par `%{size_download}`. `WebFetch` aurait compresse le
  contenu et detruit la mesure de poids.
- **Verification de chaque allégation par extraction directe du code**
  (`supportsHtmlInCanvas`, `patchHoverRules`, deplacement `gl.deleteXxx`),
  pas par paraphrase du commentaire de la page.
- Aucune ecriture sous `src/`, `public/`, `tools/`, `supabase/`. Le seul
  fait nouveau pose sur le disque : deux fichiers de brief, un sous-dossier
  de cinq JSON, ce rapport.

## 1. La question du drapeau — reponse identique pour les cinq

Aucun des cinq composants ne mentionne explicitement
`chrome://flags/#canvas-draw-element` sur sa page. Mais la page d'introduction
`https://canvasui.dev/docs` tranche :

> « **[an] experimental Chrome feature, currently in origin trial.** »

Le code des cinq composants partage la meme sonde
`supportsHtmlInCanvas()`, qui verifie la presence des methodes
`ctx.drawElementImage` et `canvas.requestPaint` sur un canvas de probe. Ces
deux methodes sont l'API html-in-canvas telle qu'exposee par Chrome via le
drapeau ou via un essai d'origine (origin trial). Conclusion : pour un
**visiteur public**, la composante ne fonctionne que si le domaine est
**inscrit a l'essai d'origine Chrome** (le drapeau seul ne suffit pas en
production).

`flag_requis: true` pour les cinq. Aucun composant n'est utilisable tel quel
par un visiteur anonyme sans l'une de ces deux conditions rempliess.

## 2. Le repli — reponse identique pour les cinq

La page d'introduction porte la seule formulation non ambigue :

> « **Components detect support at runtime and degrade gracefully: without
> it, your content renders as normal HTML and the parts of the effect that
> can still run, still do.** »

Aucune des cinq pages composant ne documente son propre repli. La fiche ci-
dessous indique, pour chaque composant, la branche de repli concrete telle
que vue dans le source `.ts` du registre — pas la formulation marketing.

A retenir : **le repli degrace l'effet, mais ne l'elimine pas toujours**.
Glyph Rain a `dim: 0.5` par defaut : meme desactive, sa branche sans
`uHasContent` continue d'afficher des glyphes colores en haut d'une page
qui devient presque noire. Force Field, en mode degrade, n'affiche que le
treillis sur fond noir, pas de contenu. Particle Scroll, en mode degrade,
applique `uCover: 0` et tombe sur le bg-color sans couche texture.

## 3. Dependances — reponse identique pour les cinq

Chacun des cinq `*-vanilla.json` declare textuellement :

```
"dependencies": [],
"devDependencies": []
```

Et le source n'importe que React et des API navigateur (`WebGL2`,
`Canvas 2D`, `ResizeObserver`, `IntersectionObserver`, `matchMedia`,
`prefers-reduced-motion`). Donc : **zero paquet a installer** en plus de
ce qui est deja sur le bureau. C'est l'argument en faveur de la
bibliotheque ; ce n'est pas l'argument qui tranchera son usage ici.

## 4. Tableau — les cinq, drapeau en premier

| Composant | Flag requis | Repli | Page initiale | Enveloppe | Poids ko | Conflit §4.1 |
|---|---|---|---|---|---|---|
| **Bend** | oui | `<div>` scrollable standard sans pipeline canvas (`supportsHtmlInCanvas() === false`) | Accueil | oui | 30.1 | oui — texte plie sur les bords |
| **Droplets** | oui | gouttes colorees sur fond transparent (branche `uHasContent < 0.5` du shader), sans refraction | Methode | oui | 23.4 | oui — refraction par defaut |
| **Force Field** | oui | treillis energetique seul, `content = vec4(0.0)`, page en HTML normal visible dessous | Paliers | oui | 41.5 | oui — refraction sous le treillis |
| **Glyph Rain** | oui | glyphes colores sans pool de lumiere, dim=0.5 assombrit la page a 50% | Engagements | oui | 27.2 | oui — dim=0.5 par defaut |
| **Particle Scroll** | oui | bg-color sans couche texture, dissolution desactivee (uCover=0) | Demo | oui | 22.3 | oui — dissolution du texte |

**Aucun des cinq ne peut se poser en couche d'arriere-plan « derriere » du
texte.** Les cinq capturent le HTML dans un `<canvas layoutsubtree>`
(source) et superposent un canvas de sortie (output). Le DOM sous-jacent
reste interactif, mais le rendu visible passe par le shader : sur le pixel,
le texte est une texture.

Autrement dit : **ils violent tous BARRE.md §4.1** sur les pages de texte.
Le brief disait « Si le composant enveloppe, le texte devient une texture
— incompatible avec l'interdit §4.1. **Tranche pour chacun.** » Tranche :
incompatible pour les cinq.

## 5. Lecture — quel composant pour quelle page

L'hypothese du brief etait une bijection 1-1 composant -> page. Cette
bijection est defendable techniquement, mais elle cree un probleme
inelegant : trois des cinq pages ciblees (Accueil, Methode, Paliers) sont
des pages ou le texte doit etre lu. Les deux dernieres (Engagements, Demo)
contiennent aussi du texte, mais peuvent tolerer du decor — la balise BARRE
le permet sous reserve que le decor ne couvre aucun rectangle de texte.

Sous reserve de reorganiser ces pages, voici ou chaque composant s'integre
le mieux, **a la condition qu'aucun rectangle de texte ne soit couvert** :

- **Demo** uniquement peut recevoir **Force Field** ou **Glyph Rain** si
  l'image centrale est photographique et le texte tient dans un encadre
  hors canvas. Force Field avec `pageReact: 0`, `tint: 0`, `dim: 0` laisse
  voir la photo, treillis autour. Glyph Rain avec `dim: 0` desactive
  l'assombrissement mais garde les glyphes et le pool de lumiere.
- **Bend** n'a de sens que sur une page scrollable tres longue OU dont le
  scroll narratif est l'argument. Aucune page du site actuel ne le justifie.
- **Droplets** a un gout de goutiere — l'effet « vitre embuée » est utile si
  la page est deja meditative. La methode pourrait, mais sa grille de
  registre « brutaliste » (cf. brief R) ne le supporterait pas.
- **Particle Scroll** exige que `content` ait une `scrollHeight`
  superieure a sa `clientHeight`. La demo peut le tolerer si elle est
  dimensionnee pour scroller.

**Recommandation minimale** : differer le choix d'un composant de fond par
page. Aucun des cinq ne peut etre pose sans toucher au zoning texte. La
regle §4.1 est plus dure que le appetit d'effet.

## 6. La question qui vaut plus que les cinq fiches

**Deux composants Canvas UI peuvent-ils cohabiter sur une meme page ?**

La doc ne le dit pas. J'ai verifie sur les cinq pages composant + la page
d'introduction : zero exemple de cohabitation, zero exemple de
chevauchement, zero avertissement.

Ce que le code dit en silence :

1. **Bend a une particularite qui lui est propre.** Sa fonction
   `patchHoverRules()` modifie *au niveau du document* toutes les
   `CSSStyleRule` dont le selecteur contient `:hover`, en y injectant
   l'attribut `data-canvasui-hover`. Si un second composant html-in-canvas
   est monte sur la meme page, ses ecouteurs de pointeur et son hover
   forwarding peuvent detourner les siens. Ce n'est pas une garantie de
   conflit, mais c'est un couplage global qu'aucune doc ne mentionne.

2. **Tous les cinq prennent un `output: HTMLCanvasElement` en
   `position: absolute`** par-dessus le `source`. Deux sur la meme page
   signifient deux `requestAnimationFrame`, deux `ResizeObserver`, deux
   `IntersectionObserver`, deux `paintable.requestPaint()`. Aucune
   coordination.

3. **Si on imbrique `<Bend><ParticleScroll>...</ParticleScroll></Bend>`**,
   le `content` du ParticleScroll est lui-meme capture comme texture par le
   source de Bend — la dissolution se voit a travers le pliage. Conceptuel,
   c'est faisable. Mais la doc ne fournit pas d'exemple, et chaque
   composant suppose que son `content` est *son* DOM.

Conclusion : **la doc ne le dit pas**, et le code n'a pas ete concu pour.
Une cohabitation demanderait probablement un wrapper unique partage
(« canvasui-stack ») que personne n'a ecrit dans `canvasui.dev`.

**Fusions possibles** : aucune parmi les cinq sans reimplementation. Ce qui
les rendrait possibles : un composant « Stack » qui deplace la logique de
`supportsHtmlInCanvas()` vers le plus proche ancetre commun et accepte une
liste ordonnee d'effets. Pas dans le registre.

## 7. Les trois questions que la doc ne tranche pas

1. **Coexistence sur une meme page** — voir §6. La doc n'a pas d'exemple,
   pas d'avertissement, pas de mot.
2. **Cout operationnel d'un effet sur GPU lent** — la doc parle de shaders,
   de bloom a 4 niveaux MIPS, de textures mipmap, mais aucun budget de fps,
   aucun seuil bas. Sur un Macbook 2018 ou un smartphone d'entree de
   gamme, deux `requestAnimationFrame` a 60fps avec des passes Kawase
   4-mips + WebGL2 pourraient tomber a 20fps sans qu'aucun
   avertissement ne le dise.
3. **Comportement sous `prefers-reduced-motion: reduce`** ET html-in-canvas
   non disponible en meme temps. Chaque composant a sa branche
   `reducedMotion` qui gele l'animation, mais aucun ne documente le cas
   compose : pas d'animation + pas de contenu a texturer. Particulierement
   pertinent pour Glyph Rain et Droplets, dont le seul interet visuel tient
   au mouvement.

## 8. Verification — chaque allégation tient a une section de la doc

| Allégation | Source |
|---|---|
| Cinq pages de doc ouvrables en 200 | curl ci-dessus |
| Drapeau non mentionne sur les pages composant ; mentionne sur `/docs` | WebFetch `/docs` |
| Repli : verbatim « Components detect support at runtime and degrade gracefully ... » | WebFetch `/docs` |
| Pas de jeton licence | WebFetch `/docs` |
| `dependencies: []` pour les cinq | cinq `-vanilla.json` |
| Bend a `patchHoverRules()` global | source `BendVanilla.ts`, registre |
| Tous ont un `output: HTMLCanvasElement` superpose | `BendElements` / `DropletsElements` / `ForceFieldElements` / `GlyphRainElements` / `ParticleScrollElements` |
| Glyph Rain defaut `dim: 0.5` | `DEFAULTS` du registre `glyph-rain-vanilla.json` |
| Particle Scroll `uCover = htmlInCanvas ? 1 : 0` | source `ParticleScrollVanilla.ts` |
| Force Field degrade = `content = vec4(0.0)` | source `ForceFieldVanilla.ts` (branche `if uHasContent < 0.5` ; noter : la branche uHasContent < 0.5 trace quand meme le treillis — reprise de cette nuance dans §2) |

## 9. Observation hors perimetre

`_briefs/2026-08-11_production/effects.js` n'existe pas. En revanche
`public/site/effects.js` est **toujours present** sur le disque au moment
de cette mesure (536 lignes). Le brief dit « 533 lignes de Canvas 2D ecrites
a la main » — chiffre oppose, mais meme ordre de grandeur. La phrase du
brief « tout a fallu tout arracher » est vraie pour la bibliotheque Canvas
UI (jamais installee : aucun `node_modules/canvasui`, aucun import dans
`src/**`). Elle ne l'est pas pour `public/site/effects.js`. Aucun
correctif n'a ete fait dans ce brief, conformement a la regle « Interdit :
`public/**` ».

## 10. Cote livraison

- `canvas_fonds.json` — ecrit, cinq composants + introduction + observation.
- `RAPPORT_X_CANVAS_FONDS.md` — ce fichier.
- `registre_canvas/*.json` — cinq fichiers depreuve, octets confirmes par
  `curl -w '%{size_download}'`.

**Recommandation finale** : ne choisir aucun composant de fond tant que
les pages texte n'ont pas ete rezonees en zones « decor admissible /
texte protege ». Sans ce rezonage, choisir un composant ici, c'est choisir
de violer BARRE §4.1 sur la page ou il atterrit.
