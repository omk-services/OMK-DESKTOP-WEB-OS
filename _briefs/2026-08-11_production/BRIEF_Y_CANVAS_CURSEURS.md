---
id: Y_CANVAS_CURSEURS
campagne: 2026-08-11 — production
---

# BRIEF Y — Les cinq Canvas de CURSEUR, et la question des fusions

## Ce qu'on te demande, en une phrase

Lire la documentation officielle de cinq composants Canvas UI pilotes au curseur, rendre
**une fiche par composant**, et repondre a la question qui commande tout : **peut-on
superposer un composant de curseur et un composant de fond sur une meme page ?**

**Tu n'ecris aucun composant. Tu n'ecris aucun effet. Tu ne recopies aucun code de rendu.**

Cette regle vient d'une dette payee : le depot contenait `public/site/effects.js`, 533
lignes de Canvas 2D ecrites a la main, portant les noms exacts de composants Canvas UI —
Decrypt, Liquid, Shatter, Glyph Rain. **Personne n'avait installe la bibliotheque ;
quelqu'un avait recopie le catalogue.** Le resultat etait plat, et il a fallu tout arracher.

Si tu te surprends a ecrire du `getContext('2d')`, tu refais la faute.

## Ton perimetre exclusif

```
_briefs/2026-08-11_production/RAPPORT_Y_CANVAS_CURSEURS.md   (ton rendu)
_briefs/2026-08-11_production/canvas_curseurs.json           (les fiches, structurees)
```

**Interdit** : `src/**`, `public/**`, `tools/**`, `supabase/**`, et le fichier
`canvas_fonds.json` — **un autre agent travaille dessus en parallele**. Lecture seule
partout ailleurs.

Lis `GARDE_FOU.md`. Tu executes ce brief toi-meme — aucun workflow, aucune skill, aucun
agent delegue.

---

## Les cinq composants

| Composant | Doc |
|---|---|
| **Bubble** | `https://canvasui.dev/docs/components/bubble` |
| **Grid** | `https://canvasui.dev/docs/components/grid` |
| **Liquid** | `https://canvasui.dev/docs/components/liquid` |
| **Magnify** | `https://canvasui.dev/docs/components/magnify` |
| **Shatter** | `https://canvasui.dev/docs/components/shatter` |

Chaque page porte les sections **Demo · Install · Dependencies · Code · API reference**.
Elles repondent a cinq questions differentes ; lis-les toutes.

Registre lisible sans navigateur : `https://canvasui.dev/r/<nom>-vanilla.json` —
verifie, les cinq repondent 200, de 20 a 27 ko.

---

## La fiche a produire, par composant

1. **Ce qu'il fait**, en une phrase, avec les mots de la doc.
2. **Le flag.** Exige-t-il `chrome://flags/#canvas-draw-element` (API html-in-canvas) ?
   **La page de chaque composant l'indique explicitement.** C'est la question qui decide :
   un composant qui l'exige ne fonctionnera chez un visiteur que si le domaine est inscrit
   a l'essai d'origine Chrome.
3. **Le repli** sans flag ni jeton — verifie sur la page, ne le suppose pas.
4. **Les dependances**, exactement comme listees en *Dependencies*.
5. **L'API** : props, types, defauts. Recopie fidelement.
6. **Le poids** du `-vanilla.json`, en ko.
7. **La zone d'effet.** Un composant de curseur agit-il sur **toute** la page enveloppee,
   ou seulement dans un rayon autour du pointeur ? Cite la prop qui le controle si elle
   existe (`radius`, `size`, `strength`…).
8. **Le rapport au texte.** Le texte reste-t-il selectionnable et lisible **sous** l'effet ?
   L'interdit §4.1 de `public/site/BARRE.md` est sans appel : aucun effet ne se met entre
   le lecteur et le texte. Un composant qui deforme un paragraphe en permanence est
   disqualifie ; un composant qui ne deforme qu'au survol, dans un rayon, ne l'est pas
   forcement. **Tranche pour chacun, et dis sur quoi tu te fondes.**

---

## LA QUESTION CENTRALE — les fusions

C'est le vrai livrable de ce brief. Les fiches ne sont que le materiau.

**Peut-on poser deux composants Canvas UI sur une meme page — un de fond, un de curseur ?**

Chaque composant enveloppe du contenu et le redessine. Deux composants = deux canvas, deux
boucles de rendu, deux lectures du DOM. Cherche dans la doc :

- un exemple officiel de **deux composants imbriques** ;
- une mention de composition, de superposition, de `z-index`, de cout de rendu ;
- une contre-indication explicite.

**Trois reponses possibles, et une seule est interdite :**

- « la doc dit que oui, voici ou » — avec la citation ;
- « la doc dit que non, voici ou » — avec la citation ;
- « **la doc ne le dit pas** » — reponse parfaitement acceptable et souvent la vraie.

**Ce qui est interdit, c'est de deviner.** Un « probablement compatible » non source coute
plus cher qu'un « je ne sais pas » : il sera lu comme un feu vert.

Si la doc est muette, **propose le test** qui trancherait — quelle page, quels deux
composants, quelle mesure — sans l'executer.

---

## Preuve

- **Chaque affirmation cite sa section** : *Demo*, *Install*, *Dependencies*, *Code* ou
  *API reference*. Une affirmation sans section est inventee.
- `canvas_curseurs.json` : les cinq fiches structurees, au minimum `nom`, `flag_requis`,
  `repli`, `dependances`, `props`, `poids_ko`, `zone_effet`, `texte_lisible_dessous`,
  `source_url`.
- Les cinq URLs de doc et de registre citees et ouvertes.

## Rapport

`RAPPORT_Y_CANVAS_CURSEURS.md`, **ecrit au fil de l'eau**. Termine par :

- **le tableau des cinq**, colonne « flag requis » en premier ;
- **la reponse a la question des fusions**, sourcee ou declaree absente de la doc ;
- **le test qui trancherait**, si la doc est muette ;
- **les trois questions** que la doc ne resout pas.

Si une partie de ce brief te parait fausse, argumente-le dedans — mais jamais en silence.
