---
name: app.open
description: Ouvre l'app indiquée. C'est une instruction de navigation : sur le client, l'app courante change ; sur le serveur, rend l'instruction à exécuter côté bureau.
category: navigation
---

# app.open

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
  appId: string,  // Identifiant canonique de l'app (kebab-case).
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
coach-os app.open clients
```
