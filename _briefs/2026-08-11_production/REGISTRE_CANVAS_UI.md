---
id: REGISTRE_CANVAS_UI
campagne: 2026-08-11 — production
sources: canvasui.dev/r/registry.json (198 entrees) · 33 registres -vanilla telecharges · deux captures video
donnees: registre_canvas_ui.json (33 fiches, 619 props)
date: 2026-08-13
---

# Registre d'utilisation — Canvas UI, les 33 composants

## Ce que la video a rendu, et qui valait le detour

Tu avais dit : *« ils sont tous differents... des especes completement differentes ».*
C'est exact, et c'est mesurable. **Il y a deux especes, pas plus.** La video les
montre ; le registre les prouve.

Ce que la capture a debloque, ce n'est pas une taxonomie visuelle. C'est
**`canvasui.dev/r/registry.json`** — 114 609 octets, **198 entrees** — repere en lisant
l'URL du playground a l'ecran. 198 = **33 composants x 6 saveurs** (React, Solid,
Preact, Vue, Svelte, vanilla). Le catalogue entier, lisible sans navigateur.

Et une phrase, capturee a 4 minutes de la video Introduction, sur la page d'accueil
de la doc :

> « Most of the library is built on the html-in-canvas API [...] **Some effects skip
> the API entirely and are pure 3D and shader work that runs everywhere today.** »

C'est la ligne de partage. Elle n'etait dans aucun des deux rapports d'agents.

---

## 1. Les deux especes

La difference n'est pas un style. **C'est l'entree du composant.**

| | Espece A | Espece B |
|---|---|---|
| **Entree** | ta page | un objet (GLB/glTF, SVG, image) |
| **Mecanisme** | html-in-canvas | three.js pur |
| **Nombre** | 28 | 5 |
| **Dependances** | aucune | `three` |
| **Drapeau Chrome** | **requis** | aucun |
| **Navigateurs** | Chromium seul | tous |
| **Rapport au texte** | il devient texture | il n'y touche pas |

Le classement est mecanique, pas d'appreciation : presence de `drawElementImage`,
`texElementImage2D` ou `copyElementImageToTexture` dans le source du registre. 28 oui,
5 non, zero cas douteux.

La doc le dit dans ses propres mots. L'espece A ecrit toujours *« your page »*,
*« your live HTML »*, *« the HTML stays interactive »*. L'espece B ecrit toujours
*« any GLB/glTF model, SVG, or image »*.

---

## 2. Espece B — les cinq qui marchent aujourd'hui

**C'est la decouverte de cette passe, et elle renverse le verdict precedent.**

Le [VERDICT_CANVAS_UI](VERDICT_CANVAS_UI.md) concluait qu'aucun composant n'etait
utilisable. C'etait vrai des **dix que j'avais choisis** — dix de l'espece A. Les cinq
utilisables n'avaient jamais ete regardes. **J'avais fait analyser la mauvaise famille.**

| Composant | ko | props | Ce qu'il fait |
|---|---:|---:|---|
| **AsciiObject** | 45,1 | 30 | l'objet en caracteres ASCII choisis par forme, les glyphes suivent les aretes |
| **DitheredObject** | 40,1 | 26 | l'objet en trame 1-bit — Bayer, halftone ou Floyd–Steinberg |
| **GlassObject** | 37,6 | 29 | l'objet en verre liquide : refraction reelle, dispersion chromatique, givre |
| **LiquidObject** | 62,4 | 38 | l'objet traine dans un fluide GPU invisible qui tourbillonne sous le curseur |
| **ParticleObject** | 33,6 | 27 | l'objet reconstruit en nuage de particules que le curseur pousse et fait revenir |

Dans la video, DitheredObject est **un canard en caoutchouc trame qu'on fait tourner
a la souris**, avec la consigne : *« Drag to orbit the object [...] swap in your own
GLB/glTF model, SVG, or image by URL or from disk. »*

Ce n'est pas un effet de page. C'est un **visualiseur d'objet**. D'ou l'impression
d'especes etrangeres : ils ne font pas la meme chose, ils ne prennent pas la meme
chose en entree, ils ne se posent pas au meme endroit.

**Ce qu'ils ne violent pas** : `BARRE.md` §4.1 interdit qu'un effet se mette entre le
lecteur et le texte. Les cinq n'approchent aucun texte. Ils occupent leur boite et
affichent ce qu'on leur donne. **L'interdit ne s'applique pas** — pour la premiere fois
depuis le debut de ce dossier.

**Ce qu'ils coutent** : `three` en dependance. C'est reel, c'est honnete, et c'est le
premier cout de ce dossier qui achete quelque chose qui fonctionne chez tout le monde.

---

## 3. Espece A — les 28 qui attendent un feu vert qui n'est pas venu

Tous a `dependencies: []`. Tous suspendus a la meme condition : l'essai d'origine
html-in-canvas, **fenetre documentee Chrome 148–150, alors que Chrome stable est en
152**. Voir [VERDICT_CANVAS_UI §2](VERDICT_CANVAS_UI.md).

Sur un site de texte, ils tombent deux fois : §4.1 (le texte devient texture) et la
limitation *main thread scrolling* de Chrome.

| Composant | ko | props | Ce qu'il fait |
|---|---:|---:|---|
| **Asciify** | 43,1 | 16 | la page en ASCII vivant dans un rayon autour du curseur |
| **Bend** | 30,2 | 11 | plie le haut et le bas de la page au defilement |
| **Blaze** | 20,6 | 12 | etincelles, fumee et distorsion de chaleur montant du bas |
| **Bubble** | 19,6 | 17 | gouttelette vitreuse en metaballs qui suit le curseur |
| **Canvas** | 29,7 | 16 | la page peinte sur toile tissee, grain et trame |
| **Cloth** | 28,4 | 14 | la page pendue a un tissu qui ondule au vent |
| **Clouds** | 23,3 | 16 | brume procedurale qui derive et floute ce qu'elle couvre |
| **DecryptReveal** | 33,2 | 22 | la page en texte chiffre qui se decode autour du curseur |
| **Displacement** | 17,9 | 12 | grille de deplacement qui ondule en s'eloignant du curseur |
| **Droplets** | 23,4 | 17 | gouttes de pluie qui coulent et refractent la page |
| **FlameWrap** | 23,4 | 20 | encadre un element d'une bordure de feu alignee |
| **ForceField** | 41,5 | **44** | treillis de bouclier energetique sur la page |
| **Frost** | 37,3 | 27 | vitre de givre ; le survol fond un trou qui regele |
| **Glass** | 19,9 | 15 | lentille de verre qui suit le curseur, zoom boule de cristal |
| **Glitch** | 13,2 | 8 | rafales de glitch broadcast, tranches decalees, split RVB |
| **GlyphRain** | 27,2 | 20 | pluie de glyphes, chaque goutte projette une flaque de lumiere |
| **Grid** | 24,5 | 17 | la page en grille de tuiles 3D qui ondulent |
| **HexFloat** | 49,3 | 17 | sol de tuiles hexagonales biseautees en perspective |
| **Laser** | 19,8 | 15 | masque tout sous un faisceau laser ; le defilement imprime |
| **Liquid** | 26,3 | 14 | simulation de fluide WebGL pilotee au pointeur |
| **Magnify** | 25,0 | 23 | lentille scanner sci-fi qui grossit la page vivante |
| **ParticleReveal** | 16,5 | 11 | la page en poussiere grise qui se recompose au curseur |
| **ParticleScroll** | 22,3 | 12 | dissout sous une ligne en sable qui se reassemble au defilement |
| **Peel** | 20,4 | 13 | decolle la page depuis un bord a l'approche du curseur |
| **RetroDither** | 23,9 | 17 | lentille de tramage retro qui pixelise autour du curseur |
| **Ripple** | 15,8 | 10 | ondes d'eau a chaque clic, refraction facon etang |
| **Shatter** | 22,7 | 18 | la page en eclats de verre 3D qui flottent |
| **VHS** | 16,9 | 15 | la page rejouee comme une VHS usee |

---

## 4. Un avertissement sur le tri par description

J'ai tente de sous-classer l'espece A par la localite de l'effet — curseur,
defilement, page entiere — en lisant les descriptions. **Le resultat est faux au moins
deux fois :**

- **Grid** se range en « curseur » parce que sa description dit *« around the cursor »*.
  Ses props disent l'inverse : `waveSpeed` se mesure en hauteurs d'ecran par seconde,
  `waveWidth` en fraction de hauteur d'ecran, et **`idleRipples` declenche des ondes
  quand le curseur ne bouge pas**.
- **Liquid** se range en « page entiere » alors que son splat est confine au pointeur.

**La description est du marketing. Les props sont la verite.** Le tri par mots-cles est
donc ecarte de ce registre — les 619 props sont dans `registre_canvas_ui.json`, et
c'est la qu'il faut trancher, composant par composant.

C'est le meme piege que les cinq faux rouges de la campagne, sous une autre forme :
un instrument qui repond vite et se trompe sans le signaler.

---

## 5. Etat du depot

**Les 33 composants du catalogue sont deja presents** dans
`src/components/canvasui/v30/`. Rien a telecharger. La correspondance est exacte, a une
difference de casse pres (`VHS` / `Vhs`).

Deux fichiers en plus, qui sont a nous et pas au catalogue : `BackgroundFX.tsx` et
`CssFallback.tsx`.

Ce que cela signifie : **le probleme n'a jamais ete l'installation.** Le depot avait la
bibliotheque complete pendant que `public/site/effects.js` reimplementait sept de ses
effets a la main en Canvas 2D. La dette ne venait pas d'un composant manquant, elle
venait de ne pas avoir lu ce qu'on avait deja.

`three@^0.185.1` et `@types/three` sont installes, `node_modules/three` present. **Rien
ne manque pour monter l'espece B aujourd'hui.**

### 5bis. L'usage reel — et la reponse a « pourquoi Canvas UI ne fonctionne pas »

Le cablage existe et il est propre : `BackgroundFX.tsx` importe **les 33** et dispatche
un effet par theme via `theme-canvas-mapping.ts`. Il est monte par `AppFrame.tsx`, donc
present dans tout le bureau web.

Le decompte de cette table :

| | |
|---|---|
| Themes avec un effet dominant | **12** |
| Mappes sur l'espece A (drapeau requis) | **12 — 100 %** |
| Mappes sur l'espece B (marche partout) | **0** |
| Composants jamais utilises en dominant | **21 sur 33** |

Dominants declares : GlyphRain, Frost, Cloth, Bend, VHS, Liquid, Blaze, Asciify, Glass,
Bubble, Displacement, RetroDither. **Les douze sont de l'espece A.**

**Voila la reponse complete a la question posee il y a deux jours.** Canvas UI ne
« fonctionne pas » parce que la totalite de la table theme -> effet repose sur la
famille qui exige un essai d'origine dont la fenetre documentee est passee. Ce n'est ni
un bug, ni une installation ratee, ni un composant casse : **c'est un choix de famille,
fait une fois, jamais reexamine, et applique douze fois.**

Les cinq composants qui auraient fonctionne partout — AsciiObject, DitheredObject,
GlassObject, LiquidObject, ParticleObject — sont importes par `BackgroundFX` et
**cites nulle part ailleurs que dans une table de couleurs** de `SettingsApp.tsx`
(`GlassObject: '#0ea5e9'`). Ils sont dans le depot, charges, et jamais montes.

Corollaire pour le correctif : il n'y a pas 33 decisions a prendre, ni meme 12. Il y en
a **une** — changer la famille cible — et elle se pose dans un seul fichier.

---

## 6. Ce que je propose

**Un seul composant, espece B, sur le hero.** GlassObject ou ParticleObject sur un
objet qui dit quelque chose du metier — pas un logo, pas un cerveau, pas une abstraction.
`ARTEFACTS.md` a deja fixe la position anti-slop : matieres, pas symboles.

Trois raisons, dans l'ordre :

1. **Ca marche chez tout le monde**, aujourd'hui, sans drapeau ni essai d'origine.
2. **Ca ne touche pas au texte** — §4.1 ne s'applique pas, pour la premiere fois.
3. **C'est un objet, donc c'est un choix editorial**, pas un filtre pose sur la page.
   L'espece A demandait « quel effet sur mon site ». L'espece B demande « quel objet
   je montre ». La seconde question a une reponse ; la premiere n'en avait pas.

Reste a trancher, et je ne l'ai pas fait : **quel objet**. C'est une decision de marque,
pas une decision technique.

---

## 7. Methode et limites — ce qui est prouve, ce qui ne l'est pas

**Prouve** : 198 entrees du registre, 33 composants, 6 saveurs chacun, poids au ko,
dependances par saveur, 619 props avec types et defauts, presence de html-in-canvas par
comptage de marqueurs dans le source. Tout est rejouable depuis
`registre_canvas_ui.json` et les 33 fichiers de `registre_canvas/`.

**Non prouve** : le rendu. Aucun des cinq composants de l'espece B n'a ete monte ni
capture. La promesse « runs everywhere today » vient de la doc, pas d'un ecran. **Le
prochain pas est un montage reel de GlassObject sur une page de test, avec capture** —
sans quoi ce registre reste une lecture, et une lecture n'a jamais fait un site.

**Incident de mesure** : `urllib.urlretrieve` sans en-tete `User-Agent` a rendu **403
sur 23 des 33 registres**, ce qui se lisait comme « ces composants n'existent pas ».
`curl` sur les memes URLs : 200. Sixieme faux verdict de la campagne, meme famille que
les cinq autres — **un outil qui echoue en repondant quelque chose de plausible**.
