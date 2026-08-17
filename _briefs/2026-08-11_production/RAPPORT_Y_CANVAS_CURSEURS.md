# RAPPORT Y — Canvas UI curseurs

**Brief** : `BRIEF_Y_CANVAS_CURSEURS.md`
**Fichier JSON** : `canvas_curseurs.json`
**Date** : 2026-08-13
**Périmètre exclusif respecté** : seuls `_briefs/2026-08-11_production/RAPPORT_Y_CANVAS_CURSEURS.md` et `_briefs/2026-08-11_production/canvas_curseurs.json` ont été écrits. Aucun fichier dans `src/`, `public/`, `tools/`, `supabase/`. `canvas_fonds.json` n'a pas été touché.

---

## 1. Statut par section

| Livrable | Statut | Preuve |
|---|---|---|
| 5 fiches composant (Json) | **FAIT** | `_briefs/2026-08-11_production/canvas_curseurs.json` — 5 entrées, 9 champs minimum + props + repli + dépendances + zone + texte |
| 5 pages doc lues | **FAIT** | `https://canvasui.dev/docs/components/{bubble,grid,liquid,magnify,shatter}` — sections Demo, Install, Code, API reference couvertes |
| 5 registres `-vanilla.json` consultés | **FAIT** | 5× HTTP 200, poids mesurés localement via `curl + wc -c` |
| Question des fusions tranchée | **FAIT** | §3 ci-dessous — réponse sourced à partir de la doc, et teste proposé si la doc est muette |
| 3 questions que la doc ne résout pas | **FAIT** | §5 |
| Écriture du json au fil de l'eau | **FAIT** | `canvas_curseurs.json` écrit avant ce rapport |
| Écriture du rapport au fil de l'eau | **PARTIEL** | Ce fichier est la dernière étape ; le journal `journal_Y.log` reste vide (volontaire : aucun incident de cours) |

---

## 2. Le tableau des cinq

> **Drapeau unique** : aucun des cinq composants ne cite littéralement l'URL `chrome://flags/#canvas-draw-element`. Tous dépendent de l'API html-in-canvas via `layoutsubtree`, `drawElementImage`, `requestPaint`. Aucun composant n'a de dépendances npm.

| Composant | Flag html-in-canvas | URL flag citée ? | Repli | Zone d'effet | Texte lisible (BARRE §4.1) | Poids |
|---|---|---|---|---|---|---|
| **Bubble** | oui (badge + code) | non | gouttelette savon translucide (`fallbackOpacity`) | rayon autour du curseur (scissor) | OK — réfraction sans altération | 19.6 ko |
| **Grid** | oui (badge + code) | non | enfants rendus sans effet | **page entière** | **DISQUALIFIÉ** pour hérö avec paragraphe | 24.5 ko |
| **Liquid** | oui (badge + code) | non | enfants rendus sans effet | rayon autour du curseur (splat) | OK sous défauts | 26.3 ko |
| **Magnify** | oui (badge + code) | non | `<div overflow:auto>` non stylé | disque autour du curseur (lens) | OK hors lentille | 25.0 ko |
| **Shatter** | oui (badge + code) | non | enfants rendus sans effet | rayon autour du curseur (lens) | OK si `baseStrength=0` | 22.7 ko |

**Précision sur le flag** : le brief annonçait « la page de chaque composant l'indique explicitement ». Vérification faite, **ce n'est pas le cas dans la version actuelle des pages**. Aucune des cinq pages ne cite l'URL `chrome://flags/#canvas-draw-element`. Toutes indiquent la dépendance par le badge « html-in-canvas » et par l'utilisation de l'API dans le code (commentée `// @ts-expect-error experimental html-in-canvas attribute`).

**Précision sur la règle BARRE §4.1** : « Aucun `.fx-canvas` n'a le droit de recouvrir un rectangle de texte. » L'interdit vise les effets qui passent devant le texte en permanence. Bubble, Liquid, Magnify opèrent dans un rayon près du curseur ; Grid opère sur la page entière (sa zone d'effet est l'onde, donc variable mais capable de traverser un rectangle de texte fixe). Shatter est un cas-frontière — `baseStrength=0` (défaut) confine l'effet à la lentille, mais la prop existe pour le répandre.

---

## 3. La question des fusions — la réponse

**La doc est muette.** Aucune des cinq pages composant, ni la page d'accueil (`https://canvasui.dev`), ni la racine de la doc (`https://canvasui.dev/docs`), ne contient :

- une *recommandation* de combiner deux Canvas UI sur la même page ;
- une *contre-indication* de le faire ;
- un *exemple officiel* de composition ;
- une mention de `z-index`, de coût de rendu additionnel, ou de conflit de `layoutsubtree`.

La seule phrase qui s'en approche est générique :

> « Components detect support at runtime and degrade gracefully: without it, your content renders as normal HTML and the parts of the effect that can still run, still do. »
> — page d'accueil, sur la détection du support html-in-canvas.

Cette phrase parle du fallback, **pas de la composition**.

**Donc la réponse honnête est : « la doc ne le dit pas ».** C'est l'une des trois réponses que le brief autorise. Deviner serait disqualifiant.

---

## 4. Le test qui trancherait

Si la doc est muette, le test proposé est le suivant. Il n'a pas été exécuté — ce brief est documentaire, pas implémentation.

**Scénario A — fond + curseur (le cas du brief)**

```
+------------------------------------------------------+
| <div data-fx="fond" class="glyph-rain">              |
|   <div data-fx="curseur" class="liquid">             |
|     <h1>Titre de la promesse</h1>                    |
|     <p>Paragraphe qui doit rester lisible.</p>       |
|   </div>                                             |
| </div>                                               |
+------------------------------------------------------+
```

**Mesures proposées** :

1. **Effet visible** : est-ce que Liquid s'affiche correctement *à travers* le canvas de sortie de Glyph Rain ? Hypothèse forte à valider : puisque Glyph Rain capture le DOM via `drawElementImage` (pipeline html-in-canvas), il risque de capturer le canvas `source` de Liquid *avant* que celui-ci n'ait appliqué sa déformation. Le visiteur verrait donc Liquid « à nu » (sa métaballe), pas la version réfractée par Glyph Rain. **Mesure** : capture d'écran + inspection DOM pour voir combien de `<canvas>` sont imbriqués.
2. **Coût** : 2× appel `drawElementImage` par frame + 2 pass shaders. Mesure `performance.now()` sur la boucle `requestAnimationFrame` avant / après empilement.
3. **Stabilité** : réduction de la zone active d'un des deux tests (par exemple `radius` Liquid = 0.05 × écran) pour voir si l'un neutralise l'autre.
4. **Fallback** : couper le flag html-in-canvas (Chrome → `chrome://flags/#canvas-draw-element` → Disabled). Lequel des deux tombe en premier ? La doc dit qu'ils sont tous indépendants ; empiriquement, le test trancherait.

**Scénario B — curseur + curseur**

```
+------------------------------------------------------+
| <div class="bubble">                                |
|   <div class="liquid">                              |
|     [contenu]                                       |
|   </div>                                            |
| </div>                                               |
+------------------------------------------------------+
```

**Mesures proposées** :

1. Les deux abonnés à `pointermove` reçoivent l'événement. Les deux produisent un splat. **Visuel** : capture au repos et à `pointermove` intense — les deux effets suivent-ils en parallèle, ou l'un mange-t-il l'autre ?
2. **Coût** : Liquid à lui seul fait tourner `pressureIterations=4` par frame. Bubble a ses propres metaballs. Conjugué : vraisemblablement > 60 fps devient dur.

**À mesurer en premier** : si les deux composants ont leur propre `<canvas layoutsubtree>` couvrant le même DOM, leur `drawElementImage` capture probablement le DOM *avant* l'autre composant n'ait posé son canvas. C'est larainte html-in-canvas : le navigateur peinto le subtree dans un canvas, et un canvas extérieur ne peut pas « voir » les WebGL output des canvas intérieurs sans re-rasterisation. Donc :

> **Hypothèse technique (non documentée, à valider)** : un composant de **fond** ne verrait pas le rendu WebGL d'un composant de **curseur** s'il le contient. Il verrait la version DOM pré-WebGL. Pour que la fusion rende les deux effets visibles, le composant de fond devrait englober le composant de curseur et le contenu *doit* vivre dans le curseur (pas en parallèle).

---

## 5. Les trois questions que la doc ne résout pas

1. **Quel est le coût mesuré de l'empilement de deux Canvas UI ?** Aucune mesure, aucun benchmark, aucun chiffre de fps dans la doc ou sur la home. Cohue probable à `Liquid + Shatter` contemporains.

2. **La combinaison est-elle validée par l'éditeur pour la production ?** La doc est silencieuse. L'éditeur liste 13 composants sur la home (Blaze, Liquid, Glass, Shatter, Particle Reveal, VHS, Laser, Clouds, Bubble, Droplets, Glass, Magnify, Grid, Ripple), sans préciser comment — ou s'ils peuvent — coexister.

3. **Quel est le comportement de chaque composant sur mobile ou sur navigateur hors Chrome ?** Toutes les pages mentionnent `html-in-canvas` comme exigence, et le mode repli est documenté pour chaque composant. Mais :
   - Safari ? (pas de `html-in-canvas` pour l'instant).
   - Mobile Chrome sur Android ? (le flag est desktop-only par défaut, et même roll-out incertain).
   - Tablette ? (idem).
   La doc ne semble pas tenir de matrice de compatibilité navigateurs pour chaque composant. Réponse uniquement par le code du `supportsHtmlInCanvas()`.

---

## 6. Citation de la BARRE §4.1 appliquée

> « Un effet entre le lecteur et le texte. [...] Aucun `.fx-canvas` n'a le droit de recouvrir un rectangle de texte. »

Appliquée ici :

- **Bubble** : conforme — rayon curseur, réfraction non destructive.
- **Grid** : non conforme pour un hérö avec paragraphe — l'onde traverse la page entière et soulève les tuiles qui passent. À n'utiliser que sur des sections sans contenu textuel dense (grille d'image, hero plein écran sans paragraphe de promesse).
- **Liquid** : conforme sous défauts — splat curseur, déformation = warp UV proportionnel à la magnitude du flux.
- **Magnify** : conforme hors lentille — la zone amplifiée est petite (`size=140` px), le reste est rendu transparent.
- **Shatter** : conforme si `baseStrength=0` — la lentille est locale. Non conforme si `baseStrength > 0` — des éclats flottent sur la page.

---

## 7. Conclusion opérationnelle

Sur les cinq composants étudiés, **trois sont candidats curseur** (Bubble, Liquid, Magnify) et un (Shatter) est conditionnel. **Grid est disqualifié** pour un hérö avec paragraphe selon la BARRE §4.1.

La doc ne permet pas de conclure sur la fusion fond + curseur. Pour la trancher, exécuter le **scénario A** du §4. C'est un test de 30 minutes sur la page d'accueil : copier-coller le squelette, poser Glyph Rain autour de Liquid, mesurer trois choses (rendu visible, fps, taille mémoire canvas), tirer la conclusion.

**Si la réponse du test est « dégradé mais opérationnel »** : la stratégie site devient « un effet de curseur par page, pas d'effet de fond dans la même vue ». Lequel des trois (Bubble / Liquid / Magnify) est déjà un arbitrage séparé.

---

## 8. Liens et sources

- 5 pages composant : `https://canvasui.dev/docs/components/{bubble,grid,liquid,magnify,shatter}`
- 5 registres : `https://canvasui.dev/r/{bubble,grid,liquid,magnify,shatter}-vanilla.json`
- Page d'accueil : `https://canvasui.dev`
- Racine doc : `https://canvasui.dev/docs`
- Fiches curatées : `_briefs/2026-08-11_production/canvas_curseurs.json`
- Barre qualité : `public/site/BARRE.md` §4.1
- Brief jumeau : `_briefs/2026-08-11_production/BRIEF_X_CANVAS_FONDS.md` (autre agent, fonds)
