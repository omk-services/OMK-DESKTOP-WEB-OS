---
name: collection.create
description: PROPOSE la création d'un item dans une collection. Ne touche PAS les données réelles : la proposition atterrit dans la file d'approbation. Le champ titre (titleField) est obligatoire.
category: ecriture
---

# collection.create

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
  fields: record,  // Champs de l'item. Doit inclure le titleField.
  rationale: optional,  // Pourquoi cette création (affichée dans la file).
  actorId: optional,  // Identifiant de l'agent qui propose (par défaut "agent:cli").
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
coach-os collection.create --json '{"collectionId":"tasks","fields":{"label":"Nouvelle tâche","status":"open"}}'
```
