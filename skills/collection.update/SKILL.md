---
name: collection.update
description: PROPOSE la modification d'un item existant. Patch partiel, clés inconnues ignorées. La proposition n'écrit rien directement.
category: ecriture
---

# collection.update

## Quand

- Quand l'utilisateur demande de modifier le bureau
  (collection, item, thème) ET qu'un humain doit arbitrer.
- **Jamais** pour court-circuiter l'approbation. L'outil
  dépose une proposition, l'humain tranche dans la file
  (People > Approvals, ou `scenario.approve` / `scenario.reject`).

## Comment

Appeler l'outil avec les arguments ci-dessous. Pour les outils
`ecriture`, l'appel **ne touche jamais les données réelles** : il
dépose une proposition dans la file d'approbation. La fusion est
l'acte qui engage, pas l'appel d'outil.

### Arguments

```ts
{
  collectionId: string,  // Identifiant canonique de la collection (kebab-case).
  id: string,  // Identifiant de l'item à modifier.
  patch: record,  // Patch à appliquer.
  rationale: optional,
  actorId: optional,
}
```

## Erreurs courantes

Cette section liste les réponses `ok:false` que l'outil peut rendre.

Pour un outil `ecriture`, les seuls effets de bord visibles sont :
- création d'un fichier dans `_briefs/.../proposals/` ;
- affichage d'une entrée dans la file d'approbation côté client ;
- aucun fichier de seed ni de source modifié.

Erreurs fréquemment observées :
- `Collection inconnue` / `App inconnue` / `Item introuvable` : appeler
  d'abord `collection.list` ou `app.list` pour vérifier l'id exact.
- `Section "${sectionId}" introuvable` : lister les sections
  valides via `app.list` (le champ `sections` par app).
- `Invalid arguments` : le format des args ne valide pas le schema.
  Reprendre `coach-os ${tool.name} --help` ou la skill liste ci-dessus.

## Exemples

```bash
coach-os collection.update --json '{"collectionId":"tasks","id":"task-1","patch":{"status":"done"}}'
```
