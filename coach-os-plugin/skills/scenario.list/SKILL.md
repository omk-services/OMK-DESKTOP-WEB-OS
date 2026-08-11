---
name: scenario.list
description: Liste les propositions en attente, triées par date (récent d'abord). Lecture seule.
category: lecture
---

# scenario.list

## Quand

- Pour découvrir l'état courant : liste des apps, des collections,
  d'une collection précise, recherche textuelle.
- En début de conversation : `app.list` donne les apps,
  `collection.list` donne les collections.
- Toute lecture est idempotente et sans effet de bord.

## Comment

Appeler l'outil avec les arguments ci-dessous. Pour les outils
`ecriture`, l'appel **ne touche jamais les données réelles** : il
dépose une proposition dans la file d'approbation. La fusion est
l'acte qui engage, pas l'appel d'outil.

### Arguments

```ts
{
  limit: optional,  // Plafond (défaut 50).
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
coach-os scenario.list
```
