---
id: X_CANVAS_FONDS
campagne: 2026-08-11 — production
---

# BRIEF X — Les cinq Canvas de FOND, un par page du site

## Ce qu'on te demande, en une phrase

Lire la documentation officielle de cinq composants Canvas UI et rendre **une fiche par
composant**, assez precise pour qu'on puisse decider — sans jamais reimplementer quoi que
ce soit.

**Tu n'ecris aucun composant. Tu n'ecris aucun effet. Tu ne recopies aucun code de rendu.**

C'est la regle centrale de ce brief, et elle vient d'une dette payee : le depot contenait
`public/site/effects.js`, 533 lignes de Canvas 2D ecrites a la main, portant les noms
exacts de composants Canvas UI — Decrypt, Liquid, Shatter, Glyph Rain. **Personne n'avait
installe la bibliotheque ; quelqu'un avait recopie le catalogue.** Le resultat etait plat,
et il a fallu tout arracher.

Si tu te surprends a ecrire du `getContext('2d')`, tu es en train de refaire la faute.

## Ton perimetre exclusif

```
_briefs/2026-08-11_production/RAPPORT_X_CANVAS_FONDS.md     (ton rendu)
_briefs/2026-08-11_production/canvas_fonds.json             (les fiches, structurees)
```

**Interdit** : `src/**`, `public/**`, `tools/**`, `supabase/**`. Tu ne modifies **aucun**
fichier du produit. Lecture seule partout ailleurs.

Lis `GARDE_FOU.md`. Tu executes ce brief toi-meme — aucun workflow, aucune skill, aucun
agent delegue.

---

## Les cinq composants, et la page qu'ils viseraient

| Composant | Doc | Page envisagee |
|---|---|---|
| **Bend** | `https://canvasui.dev/docs/components/bend` | Accueil |
| **Droplets** | `https://canvasui.dev/docs/components/droplets` | Methode |
| **Force Field** | `https://canvasui.dev/docs/components/force-field` | Paliers |
| **Glyph Rain** | `https://canvasui.dev/docs/components/glyph-rain` | Engagements |
| **Particle Scroll** | `https://canvasui.dev/docs/components/particle-scroll` | Demo |

Cette colonne « page envisagee » est une **hypothese de depart, pas une consigne**. Si ta
lecture montre qu'un composant convient mieux ailleurs, dis-le et argumente.

Chaque page de doc porte les sections **Demo · Install · Dependencies · Code · API
reference**. Elles repondent toutes les cinq a une question differente ; lis-les toutes.

Le registre correspondant est lisible directement, sans navigateur :
`https://canvasui.dev/r/<nom>-vanilla.json` — verifie : les cinq repondent 200,
de 22 a 42 ko.

---

## La fiche a produire, par composant

1. **Ce qu'il fait**, en une phrase, avec les mots de la doc — pas les tiens.
2. **Le flag.** A-t-il besoin de `chrome://flags/#canvas-draw-element` (API html-in-canvas),
   ou marche-t-il partout ? **La page de chaque composant l'indique explicitement.**
   C'est la question qui decide de tout le reste : un composant qui exige le flag ne
   fonctionnera chez un visiteur que si le domaine est inscrit a l'essai d'origine Chrome.
3. **Le repli.** Que voit un visiteur sans le flag et sans jeton ? La doc affirme que le
   contenu s'affiche en HTML classique sans erreur — **verifie que la page du composant le
   confirme**, ne le suppose pas.
4. **Les dependances**, exactement comme listees en section *Dependencies*. Zero, une, ou
   plusieurs. Cite-les.
5. **L'API** : les props, leur type, leur defaut. Recopie fidelement, sans interpreter.
6. **Le poids** du fichier `-vanilla.json` du registre, en ko.
7. **Le rapport au texte.** Le composant enveloppe-t-il du contenu (`<Bend><MaPage/></Bend>`)
   ou se pose-t-il en couche derriere ? **S'il enveloppe, le texte devient une texture** —
   et c'est incompatible avec l'interdit §4.1 de `public/site/BARRE.md` : aucun effet ne se
   met entre le lecteur et le texte. Tranche pour chacun.

---

## La question qui vaut plus que les cinq fiches

**Deux composants Canvas UI peuvent-ils cohabiter sur une meme page ?**

Un composant de fond et un composant de curseur, tous deux enveloppant du contenu, cela
fait deux canvas, deux boucles de rendu, deux lectures du DOM. La doc dit-elle quelque
chose de l'imbrication ? Y a-t-il un exemple officiel de deux composants sur une page ?

**Si la doc ne le dit pas, ecris « la doc ne le dit pas ».** N'invente pas de reponse : le
brief T de cette campagne t'apprendra qu'une affirmation sans source se paie plus tard.

---

## Preuve

- **Chaque affirmation de ta fiche cite sa section** : *Demo*, *Install*, *Dependencies*,
  *Code* ou *API reference*. Une affirmation sans section est une affirmation inventee.
- `canvas_fonds.json` contient les cinq fiches en structure, avec au minimum :
  `nom`, `flag_requis` (bool), `repli`, `dependances` (liste), `props` (liste),
  `poids_ko`, `enveloppe_le_contenu` (bool), `page_recommandee`, `source_url`.
- Les cinq URLs de doc et les cinq URLs de registre sont citees et ont ete ouvertes.

## Rapport

`RAPPORT_X_CANVAS_FONDS.md`, **ecrit au fil de l'eau**. Termine par :

- **le tableau des cinq**, une ligne par composant, colonne « flag requis » en premier ;
- **les fusions possibles**, s'il y en a, avec ce qui les rend possibles ;
- **les trois questions** que la doc ne tranche pas.

Si une partie de ce brief te parait fausse, argumente-le dedans — mais jamais en silence.
