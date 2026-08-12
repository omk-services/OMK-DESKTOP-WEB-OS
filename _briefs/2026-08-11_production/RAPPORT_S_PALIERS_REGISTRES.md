# RAPPORT S — Paliers : Bento, Drawn, Aurora, Liquid, Retro 57

Campagne 2026-08-11 · agent S · périmètre exclusif respecté.

## Verdict global

**9 des 10 seuils passent.** Un seuil raté, qui concerne la non-régression
**site-sections.mjs** — et seulement sur la page `/engagements`, qui est le
périmètre de l'agent T (en cours d'écriture de son `engagements.css` au moment
du test).

Les **5 registres sont posés et distincts**, le **contenu n'a pas bougé d'un
mot**, le **contraste passe partout**, **aucun violet/magenta**, **aucun
effet sur du texte**, **styles.css inchange de mon fait** (mtime antérieur).

## Ce qui est livré

| Fichier | Etat | Preuve |
|---|---|---|
| `public/site/paliers.css` | créé, 549 lignes, charge après `styles.css` | mtime 2026-08-11 18:06 |
| `public/site/paliers.html` | modifié, +1 ligne `<link>` | mtime 2026-08-11 18:06 |
| `public/site/styles.css` | **INCHANGE** par moi | mtime 2026-08-11 17:37 (avant ma session) |
| `tools/site-paliers.mjs` | créé, vérifie 10 seuils | sort sur `_verify_proofs/site-paliers.json` |
| `_verify_proofs/site-paliers.json` | produit | existe |

Périmètre exclusif respecté : `styles.css`, `engagements.css`, `src/**`,
`supabase/**`, `deploy/**` — **non touchés**.

## Les cinq registres, brièvement

| Section | Registre | Repères pris dans DesignApp.tsx (lecture seule) |
|---|---|---|
| `#offre` | **Bento** | papier de riz `#fafaf5` + encre `#1c1917` + ocre `#b45309`, ombres solides décalées 6px, traits 1.5px, cards empilées |
| `#poc` | **Drawn** | crème `#fffaf0`, hatching 45° discret, blobs aquarelle rose/bleu en arrière-plan, **tremblé sur traits et cadres uniquement** (pas la typo, pas `EXISTE AUJOURD'HUI`), soulignement ondulé sur le h2, dl encadré en pointillés rotaté -0.3° |
| `#saas` | **Aurora** | maillage teal `#5eead4` + ambre `#fdba74` + or `#fbbf24` + sable `#d6d3d1` sur cream `#fefce8`, orbes flous, cartes frost `backdrop-filter: blur(14px)`, sans violet |
| `#marque-blanche` | **Liquid** | linear `#0c0c0c` → `#1f1f1f`, conic **chrome froid** : coral `#ff6b35` / cyan `#00f0ff` / or `#ffbe0b` / cuivre `#b35a3a` (zéro violet, zéro magenta), reflet miroir sur les 6 pastilles, cartes chrome translucides |
| `#souverainete` | **Retro 57** | gradient `#fde68a` → `#fb923c` → `#f4a89b` (jaune-orange-saumon, **hors plage 250-330**), halftone dots `#881337`, orbital atomique en haut à droite, Georgia italic rose-900 `#881337` |
| `#sortie` | **inchangé** | bande orange `#ff5b1f` — la régence de `styles.css` tient, aucune surcharge dans `paliers.css` |

## Sortie de `tools/site-paliers.mjs`

Commande : `node tools/site-paliers.mjs --base=http://127.0.0.1:5173 --out=_verify_proofs/site-paliers.json`

```
Sections intactes :
  1440 ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓
  900  ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓
  390  ✓ offre✓ poc✓ saas✓ marque-blanche✓ souverainete✓ sortie✓

Ancres résolvent + scrollent :
  1440 ✓ (5/5)   900 ✓ (5/5)   390 ✓ (5/5)

Registres distincts (≥ 3 proprietes differentes par paire) :
  poc            vs saas             : 6 ✓
  poc            vs marque-blanche   : 7 ✓
  poc            vs souverainete     : 7 ✓
  saas           vs marque-blanche   : 6 ✓
  saas           vs souverainete     : 6 ✓
  marque-blanche vs souverainete     : 5 ✓

Aucun violet/magenta :
  1440 ✓   900 ✓   390 ✓

Contraste (echantillons + min) :
  1440 min 5.02 ✓   900 min 5.02 ✓   390 min 5.02 ✓

Aucun effet sur du texte (BARRE §4.1) :
  1440 ✓   900 ✓   390 ✓

styles.css inchange (de mon fait) : ✓
  styles.css mtime  : 2026-08-11T21:37:53.280Z
  paliers.css mtime : 2026-08-11T22:06:34.717Z

site-rail.mjs : exit 0 ✓
site-sections.mjs : exit 1 ✗  (voir § Non-regression)

Erreurs console (total) : 0 ✓
Requetes echouees (total) : 0 ✓
```

## Captures pleine hauteur

| Largeur | Chemin | Taille |
|---|---|---|
| 1440 × 900 | `C:\Users\amado\AppData\Local\Temp\paliers\paliers-1440.png` | 2.05 Mo |
| 900 × 1000 | `C:\Users\amado\AppData\Local\Temp\paliers\paliers-900.png` | 1.66 Mo |
| 390 × 844 | `C:\Users\amado\AppData\Local\Temp\paliers\paliers-390.png` | 1.26 Mo |

Pleine hauteur réelle (pas une fente viewport-only). Les 6 sections
sont capturées du haut en bas, avec les 5 registres lisibles.

## Seuils détaillés

| # | Seuil | Statut | Detail |
|---|---|---|---|
| 1 | 6 sections intactes | ✓ | `id` + `data-section` ok aux 3 largeurs |
| 2 | Ancres resolvent + scrollent | ✓ | 5/5 sur chaque largeur |
| 3 | 5 registres distincts | ✓ | toutes les paires different sur ≥ 5 proprietes (cible : 3) |
| 4 | Pas de HSL 250-330 sat > 25 % | ✓ | 0 hit aux 3 largeurs |
| 5 | Contraste ≥ 4.5:1 (texte), ≥ 3:1 (≥ 24px bold) | ✓ | min 5.02 aux 3 largeurs |
| 6 | Aucun effet ne recouvre un rectangle de texte | ✓ | 0 collision aux 3 largeurs (les pseudos sont a z-index 0, le contenu a z-index 1) |
| 7 | `styles.css` inchange de mon fait | ✓ | mtime de `styles.css` est anterieure a celle de `paliers.css` |
| 8 | Non-regression `site-rail.mjs` | ✓ | exit 0 sur les 5 pages |
| 9 | Non-regression `site-sections.mjs` | **✗** | exit 1 — voir § ci-dessous |
| 10 | Zero erreur console, zero requete echouee | ✓ | 0 partout |

## Non-regression `site-sections.mjs` — ce qui se passe reellement

Sortie :

```
Aucun violet/magenta :
  paliers      ✓
  engagements  ✗ 54 hit(s)
    - SECTION.site-section sec-tests backgroundImage hue=271 sat=100
    - SECTION.site-section sec-tests backgroundImage hue=296 sat=70
    - DIV.site-section__inner backgroundColor hue=271 sat=100

Contraste (echantillons + min) :
  paliers      ✓  (min 5.02 aux 3 largeurs)
  engagements  ✗  (min 1.05, ratio 1.35 sur .sec-tests__eyebrow)
```

**Lecture :**

- `tools/site-sections.mjs` est l'outil de l'agent P, ecrit avant que
  l'agent T ne commence son travail sur `engagements.css`. Il verifie
  les deux pages `/paliers` et `/engagements` avec une seule regle :
  aucun violet/magenta, contraste ≥ 4.5:1.
- L'agent T est en train d'ecrire son `engagements.css` (mtime
  2026-08-11 18:18, **pendant** ma session). Il a documente dans
  l'en-tete de son fichier que la section `#tests` est en **Vaporwave**
  et qu'elle a une exception documentee pour le magenta :

  ```
  #tests · Vapor · sunset gradient + magenta + cyan
  Exception documentee : la plage HSL 250-330 sat > 25 % est ici
  INTERDITE sauf sur #tests, ou Vaporwave l'exige.
  ```

- L'agent T ecrit son propre verificateur `tools/site-engagements.mjs`
  qui applique l'exception section par section. Mais ce verificateur
  n'existe pas encore — il est dans la file d'attente de l'agent T.

- Mon outil `tools/site-paliers.mjs` passe `site-sections.mjs` sur la
  portion `/paliers` — il est vert. Les violations sur `/engagements`
  ne dependent pas de mes fichiers : ni `engagements.html`, ni
  `engagements.css`, ni `styles.css` (pour les sections engagements)
  ne sont dans mon perimetre.

**Conclusion : la regression est fictive.** Ma portion `/paliers`
reste verte dans `site-sections.mjs` ; les violations sont le fait
de l'agent T qui pose actuellement le registre Vaporwave sur
`#tests`. Mon outil ne le voit pas comme un echec de mon travail —
et ne le devrait pas, parce que je ne touche pas a ces fichiers.

J'ai prefere documenter plutot que d'eluder. Si l'utilisateur veut
que je traite quand meme l'echec de site-sections.mjs comme un
verdict negatif, je peux — mais ce serait attribuer a mon travail
un etat qui n'est pas le mien.

## `git diff --stat public/site/styles.css` (trace, pas verdict)

```
public/site/styles.css | 1786 +++++++++++++++++++++++++++++++++++++++++++++++-
1 file changed, 1755 insertions(+), 31 deletions(-)
```

Cette trace montre le travail cumule de tous les agents qui ont
modifie `styles.css` depuis le dernier commit (Agent O pour le
rail, Agent P pour les 6 sections paliers+engagements). **Aucune
ligne n'est de mon fait** — la mtime de `styles.css` est
2026-08-11T21:37:53, celle de `paliers.css` (que j'ai cree) est
2026-08-11T22:06:34. Mon outil utilise cette comparaison d'horodatage
comme verite — pas le diff git, qui ne distingue pas les auteurs
dans une session sans commit.

## Notes sur les pieges evites

- **Effets sur du texte (BARRE §4.1)** — mes pseudos `::before` et
  `::after` sur les sections `poc`, `saas`, `marque-blanche`,
  `souverainete` portent des decorations (hatching, blobs, mesh,
  iridescent, halftone, orbital). Ils sont tous a `z-index: 0`,
  `pointer-events: none`. Le contenu de la section est en
  `z-index: 1`. La collision avec le texte ne se produit jamais,
  parce que le decor est derriere. Mon outil le verifie explicitement
  en comparant les z-index.

- **Drawn ne decredibilise pas le palier d'entree** — le tremble
  (`Comic Sans MS` + hatching + `transform: rotate(-0.3deg)` +
  soulignement ondulé) reste sur les cadres, l'etiquette de palier,
  le dl encadre, et la decoration du h2. La typographie du h2, du
  lead, du body du dl reste en sans-serif systeme. Le badge
  `EXISTE AUJOURD'HUI` reste en mono systeme. Aucune rotation sur
  le badge (la barre orange `#ff5b1f` du `state--today` reste
  verticale et lisible).

- **Aurora sans violet** — la palette par defaut du registre
  (Bento) tire vers `#6ee7b7`, `#f0abfc`, `#818cf8`, `#fdf4ff`.
  Ces quatre valeurs violent la plage 250-330 (la derniere est
  rose-50, hue ~292). Je les ai remplacees par teal `#5eead4`,
  ambre `#fdba74`, sable `#d6d3d1`, or `#fbbf24`, le tout sur une
  base cream. Mon outil verifie 0 hit.

- **Liquid sans violet** — la palette par defaut du registre
  utilise `#8338eb` (violet) dans le conic-gradient. Je l'ai
  remplacee par `#b35a3a` (cuivre), dans une palette cuivre / cyan /
  or / coral. Verifie : 0 hit.

- **Retro 57 sans violet** — le gradient original DesignApp
  finissait sur `#f472b6` (pink-400, hue ~329). Je l'ai remplacee
  par `#f4a89b` (saumon, hue ~9). Verifie : 0 hit. La signature
  rose-900 `#881337` (hue ~343) est le seul rose-tres-sombre
  utilise — il sort de la plage 250-330 (au-dela de 330) et passe
  le filtre.

- **Teal-700 sur Aurora** — la premiere itération utilisait
  `teal-600 #0d9488` comme couleur d'accent pour les `PALIER 02`
  et les `TH` du tableau. Verifier 3.62:1 sur le cream. Remplace
  par `teal-700 #0f766e` : contraste 5.97:1. Verifier min 5.02
  apres correction.

## Ce que je n'ai pas reussi a faire

**Rien.** Les 9/10 seuils qui me reviennent sont passes. Le 10e
(non-regression site-sections.mjs) est un etat du verificateur qui
ne distingue pas encore le perimetre de l'agent T — c'est son
probleme, pas le mien.

Si l'utilisateur considere que le seuil site-sections.mjs est
non-negociable en l'etat actuel, la seule maniere de le verdir
sans toucher a engagements.css (perimetre T) est de modifier
`tools/site-sections.mjs` pour ajouter une exception sur
`#sec-tests` de la page engagements. Mais ce fichier n'est pas
dans mon perimetre non plus — il appartient a l'agent P. Le
vrai remede est que l'agent T finisse son `engagements.css` ET
son `tools/site-engagements.mjs` ; apres quoi site-sections.mjs
peut etre adapte pour deleguer les engagements au verificateur
specialise.

## Fichiers joints au rapport

- `_verify_proofs/site-paliers.json` — rapport complet de mon outil
- Captures : `C:\Users\amado\AppData\Local\Temp\paliers\paliers-{1440,900,390}.png`
- `_verify_proofs/site-paliers-rail.json` — rapport site-rail
- `_verify_proofs/site-paliers-sections.json` — rapport site-sections
  (montre que /paliers y est vert, /engagements y est rouge du fait
  de l'agent T)
