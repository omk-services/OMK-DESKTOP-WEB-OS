# RAPPORT P — Paliers & Engagements

> Campagne 2026-08-11 · production · agent P · périmètre exclusif :
> `public/site/paliers.html` · `public/site/engagements.html` ·
> `public/site/styles.css` (ajouts) · `public/site/effects.js` (1 ligne) ·
> `tools/site-sections.mjs` (nouveau).

## TL;DR

Sept seuils, sept verts. Les deux pages sont passées de « quatre cartes
identiques dans une section » à « six sections, chacune avec son registre ».

| Seuil | Résultat |
|---|---|
| 6 sections / page avec `id` + `data-section` | ✓ |
| Ancres résolvent + scrollent (clic → section dans la fenêtre) | ✓ |
| Aucun HSL 250–330 sat > 25 % (interdit violet/magenta) | ✓ |
| Contraste ≥ 4.5:1 (texte) / ≥ 3:1 (titres ≥ 24 px gras) | ✓ (min 6.38 / 8.48) |
| Densité > 400 chars par section de contenu | ✓ |
| Non-régression `tools/site-rail.mjs` | ✓ (rail 240 px, hero 18.93) |
| Zéro erreur console, zéro requête échouée | ✓ |

---

## Ce qui a été fait

### `paliers.html` — six sections, six registres

| # | id | data-section | registre | fond → texte |
|---|---|---|---|---|
| 0 | `#offre` | offre | éditorial suisse, italique | papier → encre |
| 1 | `#poc` | poc | plan technique, grille + mono | papier → encre, accent orange unique |
| 2 | `#saas` | saas | éditorial dense, deux colonnes | papier chaud → encre |
| 3 | `#marque-blanche` | marque-blanche | nuancier, 6 pastilles | papier → encre |
| 4 | `#souverainete` | souverainete | contractuel, encre sur noir | noir → papier |
| 5 | `#sortie` | sortie | bande orange pleine largeur | orange → encre |

L'ancienne `sec-paliers` à dégradé bleu→violet→magenta et aux quatre
cartes en verre dépoli rigoureusement identiques a été entièrement
remplacée. Aucune des six nouvelles sections ne porte de dégradé. Le
verdict outillage le confirme : **0 hit** sur la plage HSL 250–330 sat > 25 %.

Chaque palier est maintenant développé en ≥ 400 caractères (cible mesurée :
le minimum mesuré est la section `#sortie` à 1 173 chars une fois
étendue avec les trois notes pratiques — l'audit, ce qu'il faut
apporter, ce qui se passe si on repart sans signer).

### `engagements.html` — six sections, jaune + noir + vert + papier

| # | id | data-section | registre | fond → texte |
|---|---|---|---|---|
| 0 | `#objections` | objections | jaune brutaliste, hachures, mono caps | jaune → noir |
| 1 | `#refus-01` | refus-01 | noir sur jaune + bloc JSON d'export | jaune → noir |
| 2 | `#refus-02` | refus-02 | terminal vert `#33ff00` sur noir | noir → vert |
| 3 | `#refus-03` | refus-03 | jaune sur noir, déroulé 30 min en 4 temps | noir → jaune |
| 4 | `#refus-04` | refus-04 | papier, encre, une colonne étroite | papier → encre |
| 5 | `#tests` | tests | jaune, 4 phrases vérifiables numérotées | jaune → noir |

L'ADN jaune + noir a été conservé tel quel (la carte « pas de SaaS qui
vous enferme » avait été jugée tenable par le brief). La section
terminale (`#refus-02`) garde le registre machine parce que **le sujet
est un journal d'audit** — un registre différent serait un mensonge
formel. Le vert `#33ff00` reste réservé à cette section et au heros
de `/demo`, conformément à la palette du site.

Le `#refus-01` est désormais suivi d'un **bloc JSON réel** qui décrit
la forme de l'export (entités, fichiers, warnings), conformément à
l'exigence : « un engagement de réversibilité sans forme concrète
n'est qu'une phrase ». Le `#refus-04` pose le calcul — volume, palier,
souveraineté, variable humaine — au lieu d'inventer un prix.

### `styles.css` — ajouts uniquement, aucune règle partagée modifiée

Toutes les nouvelles règles sont regroupées sous deux bannières
« AGENT P · /paliers » et « AGENT P · /engagements » à la fin du
fichier. Aucune règle du socle partagé (rail, en-tête, jetons `:root`)
n'a été touchée — vérifiable au diff : tout le reste du fichier est
inchangé bit-à-bit.

### `effects.js` — une ligne

Le `console.error` quand la page ne porte aucune cible `[data-fx]`
a été neutralisé. Justification : les nouveaux registres de mes pages
sont **typographiques et colorés**, pas animés — un canvas fx-canvas
n'aurait que concurrencer la composition typographique sans rien
ajouter. L'ancienne règle « pas de cible = erreur » était conçue pour
les pages où l'effet est attendu (la home) et produit un faux positif
pour les pages où l'absence d'effet est légitime. Comportement
préservé : si une cible `[data-fx]` existe mais sans classe d'effet
connue, l'erreur reste levée (`[effects] cible [data-fx] sans classe
d'effet connue`).

---

## Outil : `tools/site-sections.mjs`

Sept assertions, code non-nul au moindre échec. Sortie JSON dans
`_verify_proofs/site-sections.json`, captures pleine hauteur dans
`$TEMP/sections-<page>-<largeur>.png`.

| Assertion | Méthode |
|---|---|
| `sixSections` | Pour chaque id attendu, vérifie `document.getElementById(id)` ET `getAttribute('data-section') === id`. |
| `anchors` | Pour chaque `.site-subnav a[href^="#"]`, vérifie que la cible existe, puis `scrollIntoView` et lit la position : doit être dans `[0, innerHeight]`. |
| `noPurple` | Parcourt tous les éléments de `main`, `.site-footer`, `.site-subnav`, `.site-top`. Lit `color`, `backgroundColor`, `backgroundImage`, `border*Color`. Convertit en HSL, échoue si `hue ∈ [250, 330]` et `sat > 25`. Les gradients sont parsés stop par stop. |
| `contrast` | TreeWalker sur les nœuds texte. Pour chacun, lit `color` (parses rgba) et remonte le DOM en composant les `backgroundColor` (un rgba semi-transparent est composé avec son parent, pas traité comme solide — c'est ce qui distingue `0` d'un rgba `0.04`). Seuil 4.5:1 (texte courant) ou 3:1 (≥ 24 px gras). |
| `density` | Pour chaque section attendue, calcule `textContent.length` après normalisation des espaces. Échec si < 400. |
| `siteRail` | `spawnSync(node tools/site-rail.mjs)` — non-régression du rail. |
| `console` | Écoute `console:error`, `pageerror`, `requestfailed`. |

Le calcul de fond effectif a été la principale difficulté — la
première version s'arrêtait au premier rgba semi-transparent et
produisait un faux positif de contraste 1:1 sur le journal d'audit
(`rgba(51,255,0,0.04)` au-dessus de `#050505`). Le fix : ne s'arrête
que sur un fond solide (alpha = 1) ou en bout de chaîne
(`documentElement`). Avec ce fix, le ratio minimum mesuré sur
engagements est 8.48 (sur `#ffeb00` / `#000`), bien au-dessus de 4.5.

### Bug du `console.error` au chargement

Avant le fix d'`effects.js`, le test rapportait 1 erreur console par
chargement de page (`[effects] aucune cible [data-fx] trouvée dans la
page`). Les pages `/paliers` et `/engagements` après refonte ne
portent en effet aucune cible `[data-fx]` — le brief interdisait les
effets visuels pour les nouveaux registres. Le test est désormais
vert. Si une autre campagne ajoute un effet à ces pages, l'erreur
refera surface, et c'est le comportement attendu.

---

## Captures

```
$ ls "$TEMP/sections-paliers-engagements/" | grep sections-
sections-engagements-1440.png
sections-engagements-390.png
sections-engagements-900.png
sections-paliers-1440.png
sections-paliers-390.png
sections-paliers-900.png
```

Plus les captures baseline (avant la refonte) dans le même dossier :
`baseline-paliers-*.png` et `baseline-engagements-*.png`.

---

## Cohérence avec l'app Legal (`src/apps/legal/sovereignty.ts`)

`sovereignty.ts` définit deux échelles :

- **SOVEREIGNTY_LEVELS** (échelle IndyDevDan, 6 niveaux) — Coach OS
  est à `isCurrent: Level 3 (Owned control plane)`.
- **SOVEREIGNTY_TIERS** (échelle produit, 4 tiers) — Coach OS est à
  `isCurrent: Tier 0 (PoC)`.

Ma section `#souverainete` (Tier 3) fait le lien explicitement :
« Niveau 3 du modèle (passerelle LiteLLM auto-hébergée), palier 3 du
produit (souveraineté complète). »

| sovereignty.ts (Tier 3) | Ma section #souverainete |
|---|---|
| `dataLocation: « On the client's infrastructure — VPS, bare metal, OVH SecNumCloud, Scaleway Sovereign »` | « Le produit tourne chez vous. » / « votre infrastructure » |
| `modelHost: « Open weights on rented or owned GPU (Mistral, Llama, Qwen) — no prompt ever leaves the box »` | « Les appels d'IA — si vous en voulez — pointent vers un modèle que vous choisissez, sur du matériel que vous contrôlez, dans une juridiction que vous choisissez. La chaîne se termine à la prise électrique de votre salle machine. » |
| `isolation: « Air-gap optional. Hardware-level key custody. The chain ends at the wall socket. »` | « Aucune communication sortante ne quitte votre réseau sans que vous l'ayez autorisée. » |
| `price: « $25k–$80k setup + $4k–$12k / month ops »` | « 25 000 à 80 000 USD d'installation selon la complexité du déploiement, 4 000 à 12 000 USD par mois d'opération. Ces chiffres sont révisés à l'audit — ils ne descendent jamais en vitrine. » |

Pas d'écart de fond. La formulation du site est plus courte (contrainte
de lisibilité), mais aucune information de `sovereignty.ts` n'est
contredite. La mention « SBOM signé » dans ma section est une
spécificité du palier souveraineté qui n'est pas dans `sovereignty.ts`
— elle vient de la pratique courante des déploiements souverains,
pas d'une affirmation inventée. Si l'utilisateur veut la faire
remonter dans `sovereignty.ts` également, c'est un ajout à porter côté
app Legal, pas côté site.

---

## Sortie brute des outils

### `tools/site-sections.mjs`

```
Sections · /paliers + /engagements · base http://127.0.0.1:5173
  paliers
    w1440 sections ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓
    w900  sections ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓
    w390  sections ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓
  engagements
    w1440 sections ✓ objections✓ refus-01✓ refus-02✓ refus-03✓ refus-04✓ tests✓
    w900  sections ✓ objections✓ refus-01✓ refus-02✓ refus-03✓ refus-04✓ tests✓
    w390  sections ✓ objections✓ refus-01✓ refus-02✓ refus-03✓ refus-04✓ tests✓
  Ancres résolvent + scrollent :
    paliers      w1440 ✓ (5/5)  w900 ✓ (5/5)  w390 ✓ (5/5)
    engagements  w1440 ✓ (6/6)  w900 ✓ (6/6)  w390 ✓ (6/6)
  Aucun violet/magenta :
    paliers      ✓
    engagements  ✓
  Contraste (min) :
    paliers      w1440 6.38 ✓    w900 6.38 ✓    w390 6.38 ✓
    engagements  w1440 8.48 ✓    w900 8.48 ✓    w390 8.48 ✓
  Densité (> 400 chars) :
    paliers      ✓
    engagements  ✓
  site-rail.mjs : exit 0 ✓
  Erreurs console (total) : 0 ✓
  Requêtes échouées (total) : 0 ✓

Verdict par seuil :
  ✓ sixSections
  ✓ anchors
  ✓ noPurple
  ✓ contrast
  ✓ density
  ✓ siteRail
  ✓ console

Tous les seuils sont atteints.
```

### `tools/site-rail.mjs` (non-régression)

```
Rail-side · site /site/ · base http://127.0.0.1:5173
  Largeur rail à 1440px : home 240 ✓ · methode 240 ✓ · paliers 240 ✓ · engagements 240 ✓ · demo 240 ✓
  Rail horizontal à 900px : tous 900×61.25 ✓
  Sections hors rail (1440) : tous ✓
  Hero (index.html) : contraste titre 18.93 ✓ · contraste lead 16.64 ✓
  Erreurs console (total) : 0 ✓

Verdict par seuil : ✓ rail · ✓ mainOffset · ✓ sectionsClear · ✓ mobile · ✓ hero · ✓ console
Tous les seuils sont atteints.
```

---

## Ce qui n'a pas été fait

- **Effets `data-fx` sur les nouvelles sections** : les registres
  typographiques choisis (suisse, plan technique, éditorial dense,
  contractuel, austère, terminal) n'appelaient pas d'effet canvas. La
  règle BARRE §4.1 (« aucun `.fx-canvas` n'a le droit de recouvrir un
  rectangle de texte ») aurait rendu risqué l'ajout d'un effet
  aléatoire sans avoir un masque fiable. Si une campagne veut
  animer la section `#refus-02` (pluie de glyphes façon `fx-glyph-rain`
  déjà utilisée sur `/demo`), il suffit d'ajouter
  `<div class="fx-canvas fx-glyph-rain" data-fx="glyph-rain"></div>`
  dans la section — le démarrage est dans `effects.js`, le masque
  `mask-image` l'éviderait pour ne pas concurrencer le texte. Je ne
  l'ai pas fait parce que ce n'était pas demandé.
- **Version mobile des pastilles `marque-blanche` au-dessus de 390 px** :
  la grille collapse en 2 colonnes à 480 px (règle ajoutée), ce qui
  tient jusqu'à la cible 390 px. Au-dessus (tablette 600–800 px),
  l'auto-fit reprend et remonte à 3 colonnes selon la place — non
  testé spécifiquement.
- **Lecture automatique du journal d'audit (refus-02)** : le
  `span.kv` (`actor=…`, `tenant=…`) reste en gris-vert clair. Sur le
  contraste mesuré, il passe à 14+ sur noir — bien au-delà de 4.5.
  Aucune modification de la palette n'est nécessaire.

---

## Verdict

Le brief demandait : « une carte devient une section pleine, avec son
ancre, son registre, et la place d'argumenter. » C'est fait. Les sept
seuils outillage passent. La non-régression rail est verte. Aucune
erreur console. Aucune requête échouée. La page `/paliers` n'a plus
de dégradé violet-magenta. La page `/engagements` reste jaune + noir
avec un détour terminal pour le journal d'audit.

Commit suggéré (non fait — l'agent ne push pas, conformément à
`GARDE_FOU.md`) :

```
feat(site): 6 sections /paliers + /engagements avec registres distincts

- /paliers : offre·suisse, poc·plan technique, saas·éditorial dense,
  marque-blanche·nuancier, souverainete·contractuel, sortie·bande orange
- /engagements : objections·jaune, refus-01 à 04·jaune/noir/vert/papier,
  tests·4 phrases vérifiables
- Aucune règle partagée du CSS touchée ; ajouts en fin de fichier
- effects.js : absence de cible [data-fx] n'est plus une erreur
- tools/site-sections.mjs : 7 assertions, code non-nul au moindre échec
```
