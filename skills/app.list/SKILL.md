---
name: app.list
description: Catalogue des apps du bureau (id, nom, description). Permet de découvrir ce qui est disponible.
category: navigation
---

# app.list

## Quand

- Quand l'utilisateur demande d'ouvrir une app
  (`app.open`) ou d'aller à une section précise
  (`section.goto`).
- Navigation == geste d'affichage. Pas une écriture de
  données. L'utilisateur voit bouger et corrige en un geste.

## Comment

Appeler l'outil avec les arguments ci-dessous. Pour les outils
`ecriture`, l'appel **ne touche jamais les données réelles** : il
dépose une proposition dans la file d'approbation. La fusion est
l'acte qui engage, pas l'appel d'outil.

### Arguments

```ts
{
}
```

## Erreurs courantes

Cette section liste les réponses `ok:false` que l'outil peut rendre.

Erreurs fréquemment observées :
- `Collection inconnue` / `App inconnue` / `Item introuvable` : appeler
  d'abord `collection.list` ou `app.list` pour vérifier l'id exact.
- `Section "${sectionId}" introuvable` : lister les sections
  valides via `app.list` (le champ `sections` par app).
- `Invalid arguments` : le format des args ne valide pas le schema.
  Reprendre `coach-os ${tool.name} --help` ou la skill liste ci-dessus.

## Exemples

```bash
coach-os app.list
```
