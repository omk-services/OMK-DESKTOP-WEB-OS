---
id: VERDICT_CANVAS_UI
campagne: 2026-08-11 — production
sources: RAPPORT_X_CANVAS_FONDS.md · RAPPORT_Y_CANVAS_CURSEURS.md
verificateur: session Opus — chaque affirmation des agents recontrolee sur le registre telecharge
date: 2026-08-13
---

# Verdict — les dix composants Canvas UI, et la question des fusions

## La reponse courte

**Il n'y a rien a fusionner.** La question « peut-on marier un fond et un curseur »
suppose qu'un fond soit utilisable. Aucun des cinq ne l'est. La question tombe avant
d'etre posee — pas par manque de reponse, mais par disparition de son sujet.

Ce qui reste : **trois composants de curseur**, sous une condition externe qui les
domine tous.

---

## 1. Ce que les agents ont rendu, et ce qui a resiste au controle

Les deux rapports ont ete recontroles ligne a ligne contre les dix fichiers
`-vanilla.json` telecharges dans `registre_canvas/`. **Aucune affirmation fausse.**

| Affirmation | Verdict |
|---|---|
| Les dix poids en ko | exacts a la decimale (30874 o = 30,15 ko annonces 30,1) |
| `dependencies: []` pour les dix | vrai — zero paquet a installer |
| `patchHoverRules()` n'existe que dans Bend | vrai — 1 occurrence dans Bend, 0 dans les neuf autres |
| Glyph Rain `dim: 0.5` par defaut | vrai, verbatim |
| Particle Scroll `uCover, htmlInCanvas ? 1 : 0` | vrai, verbatim |
| Shatter `baseStrength: 0`, Magnify `size: 140`, Liquid `pressureIterations: 4` | vrais |
| Grid agit sur la page entiere | vrai, et plus durement que Y ne le disait (voir §3) |

**Une imprecision, sans effet sur le verdict** : Y ecrit que les cinq curseurs passent
par `layoutsubtree`. Bubble ne l'utilise pas — il appelle `drawElementImage` et
`requestPaint` directement. Meme API, meme sonde, meme dependance. La conclusion tient.

**Les deux agents ont corrige mon brief sur le meme point**, chacun de son cote : j'y
affirmais que « la page de chaque composant indique explicitement » l'exigence du
drapeau. C'est faux. Aucune des dix pages ne cite `chrome://flags/#canvas-draw-element`.
L'exigence se lit dans le code — la sonde `supportsHtmlInCanvas()`, identique dans les
dix — et sur la page d'introduction. Deux lectures independantes, meme correction :
c'est le brief qui avait tort.

---

## 2. Le fait exterieur qui commande tout — et qu'aucun agent ne pouvait trouver

Il n'est pas sur `canvasui.dev`. Il est chez Chrome, et il date.

> « The HTML-in-Canvas API is in **origin trial in Chrome 148 through 150**. »
> — [blog Chrome, mis a jour le 2026-05-19](https://developer.chrome.com/blog/html-in-canvas-origin-trial)

Le fil blink-dev est un peu plus large : *« LGTM to experiment from M148 to M151
inclusive. »*

**Chrome stable est aujourd'hui en 152.0.7977.42** (mesure du 2026-08-13 sur
l'API `versionhistory.googleapis.com`).

La fenetre documentee est derriere nous, dans les deux lectures. Je n'ai pas pu
confirmer une prolongation : la console des essais d'origine demande une
authentification. **A verifier avant toute decision d'achat de temps sur ce sujet** —
mais l'hypothese de travail raisonnable est que l'inscription du domaine n'est plus
ouverte sur la fenetre annoncee.

Et meme si elle l'etait :

> « Firefox: no implementation announced. Safari / WebKit: no implementation announced. »
> — [html-in-canvas.dev/docs/browser-support](https://html-in-canvas.dev/docs/browser-support/)

Un visiteur hors Chromium ne voit **jamais** l'effet. Jamais, pas « moins bien ».

---

## 3. Pourquoi les cinq fonds tombent — et la vraie raison n'est pas celle du brief

Mon brief X disait : *si le composant enveloppe le contenu, le texte devient une
texture, et §4.1 de BARRE l'interdit.* X a tranche : incompatible pour les cinq.

C'est juste. Mais Chrome donne une raison **plus dure**, que ni X ni Y n'ont vue
parce qu'elle n'est pas sur `canvasui.dev` :

> « **Main thread scrolling** : HTML-in-canvas is drawn with JavaScript, which means
> that scrolling and animations cannot update independently of JavaScript [...]
> Developers should carefully consider the performance characteristics of putting
> scrolling content inside canvas versus having the entire canvas scroll. »
> — Chrome, section *Limitations*

Les cinq fonds enveloppent la page. La page **est** du contenu qui defile. Chrome
avertit textuellement que mettre du contenu defilant dans un canvas retire le
defilement du compositeur pour le rendre au JavaScript. Ce n'est pas un risque de
gout : c'est le defilement de tout le site qui devient tributaire d'une boucle JS.

Et deux des cinq — **Bend** et **Particle Scroll** — n'ont d'interet **que** sur du
contenu qui defile. Ils demandent precisement ce que la plateforme deconseille.

**Grid** merite sa propre ligne. Y le disqualifie ; les props le condamnent plus
nettement : `waveSpeed` se mesure « en hauteurs d'ecran par seconde », `waveWidth` en
« fraction de la hauteur d'ecran », et surtout **`idleRipples` declenche des ondes
quand le curseur ne bouge pas**. Un effet qui traverse la page sans que le lecteur
n'ait rien fait, c'est §4.1 dans sa forme la plus pure.

---

## 4. La question des fusions, repondue trois fois

**La doc ne le dit pas.** Les deux agents concluent pareil, chacun ayant lu les cinq
pages de son cote plus la racine : zero exemple de composition, zero contre-indication,
zero mention de `z-index` ou de cout d'empilement. C'est la reponse honnete, et le
brief l'autorisait explicitement — deviner etait la seule chose interdite.

Ce que le **code** dit, en revanche, et qui a resiste au controle :

1. **Bend est un cas a part.** Sa fonction `patchHoverRules()` modifie les
   `CSSStyleRule` **au niveau du document** — toutes celles dont le selecteur contient
   `:hover`. Verifie : 1 occurrence dans Bend, 0 dans les neuf autres. C'est un
   couplage global qu'aucune doc ne mentionne, et le seul du lot.

2. **L'hypothese de Y, non validee mais bien posee** : un composant de fond qui
   contient un composant de curseur capturerait le DOM **avant** que le curseur n'ait
   pose son rendu WebGL. Le fond verrait la version pre-effet. La fusion rendrait
   l'effet interieur invisible. Y a propose le test au lieu de l'affirmer — c'est la
   bonne conduite.

**Mais tout cela est devenu sans objet.** On ne fusionne pas un composant utilisable
avec quatre qui ne le sont pas. La question n'a plus de premier terme.

---

## 5. Ce qui reste debout

| Composant | Zone | Verdict | Reserve |
|---|---|---|---|
| **Bubble** | rayon curseur | candidat | 19,6 ko · n'utilise pas `layoutsubtree` |
| **Liquid** | rayon curseur | candidat | 26,3 ko · `pressureIterations: 4` par frame |
| **Magnify** | disque de 140 px | candidat | 25,0 ko · le plus contenu des trois |
| Shatter | lentille si `baseStrength: 0` | conditionnel | la prop existe pour l'etaler |
| Grid | page entiere + ondes a l'arret | **refuse** | §4.1 |
| Les cinq fonds | page entiere | **refuses** | §4.1 + defilement main-thread |

Les trois candidats partagent la meme condition externe : **Chrome uniquement, essai
d'origine dont la fenetre documentee est passee.** Sans elle, ils tombent en repli —
c'est-a-dire qu'ils ne font rien.

---

## 6. Ce que je recommande

**Un seul composant, sur une seule page, en decor assume.** Magnify sur une section
sans paragraphe. Pas de fond. Pas de fusion. Et la question posee franchement :
*est-ce qu'un effet que 100 % des visiteurs Safari et Firefox ne verront jamais
merite une ligne de code sur un site qui vend de la methode ?*

La reponse honnete est probablement non — et elle est la meme que celle qui a fait
naitre `effects.js`. La difference, cette fois, c'est qu'on la prend en connaissance
de cause au lieu de recopier un catalogue.

**Le vrai acquis de ces deux briefs n'est pas un composant. C'est la fin d'une
hypothese** — celle qui disait qu'il existait, quelque part dans ce catalogue, un fond
qui reglerait le probleme de gout. Il n'y en a pas.

---

## 7. Purge executee le 2026-08-13 — la dette d'origine

X a signale, hors perimetre et donc sans y toucher, que `public/site/effects.js`
etait **toujours present et toujours charge par les cinq pages**. Verifie : vrai.

Le balisage `[data-fx]` avait ete retire des cinq pages le 2026-08-11 — la machinerie
ne montait donc plus rien depuis deux jours, **mais elle partait toujours chez chaque
visiteur**. J'avais annonce ce retrait comme fait. Il etait a moitie fait : le
symptome avait disparu de l'ecran, la cause voyageait encore.

Coupe le 2026-08-13 : **536 → 117 lignes, 18 552 → 4 937 octets.** Les 419 lignes
retirees montaient sept effets Canvas 2D ecrits a la main. Les deux fonctions vivantes
— lien actif d'en-tete, lien actif de sous-nav — sont conservees intactes.

**Preuve** : `node --check` vert · fichier servi par Vite a 4 937 octets decodes
(mesure `performance.getEntriesByType('resource')`) · `document.querySelectorAll('canvas.fx-canvas, [data-fx]').length === 0`
· zero erreur console · `aria-current="true"` pose sur la sous-nav au chargement.

**Non verifie, et je le dis** : le comportement de la sous-nav au defilement.
L'onglet du pane etait `visibilityState: "hidden"` et n'a produit **zero frame en
600 ms** — `requestAnimationFrame` ne tourne pas, donc la boucle de la sous-nav ne
peut pas etre mesuree la. Le premier releve annoncait un blocage sur « Hero » : c'etait
l'instrument, pas le site. Cinquieme faux rouge de la campagne, meme famille que les
quatre precedents.

**Reste a faire** : 21 lignes de regles `.fx-*` dans `styles.css`, reparties sur dix
blocs, plus les keyframes `kf-liquid-wave`, `kf-shatter-pulse`, `kf-glyph-fall`. Elles
ne selectionnent plus rien. Laissees en place volontairement : `styles.css` est ouvert
par la passe de correction des 56 defauts du gauntlet, et deux chirurgies simultanees
sur le meme fichier, c'est la faute que ce depot a deja payee.
