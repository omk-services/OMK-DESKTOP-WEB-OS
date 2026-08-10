---
id: D_OPS
campagne: 2026-08-09 production-ready
ordre: 3 — après B et C
---

# BRIEF D — les apps d'exécution

## Ton périmètre exclusif

```
src/apps/operations/**
src/apps/tasks/**
src/apps/product/**
src/apps/people/**
src/apps/it-rd/**
src/apps/legal/**
```

Six apps. **Interdit** : `src/components/`, `src/lib/`, `src/stores/`, `src/hooks/`,
`src/apps/_ui/`, et toute app hors de cette liste. Un défaut vu ailleurs se **note au rapport**,
il ne se corrige pas.

## Ce qui est déjà fait — ne le refais pas

- **People** : trois collections ajoutées (`team` 6 items, `squads` 3, `content` 3).
  La vue `ApprovalsView` gère les propositions d'outils d'écriture avec accept/refus.
- **Operations** : composeur d'incident (`Décrire l'incident…`), sections `Knowledge Base`
  et `Incidents`. L'`id` de section `incidents` est **la cible du drill** venant du CEO Cockpit
  du Dashboard — ne le renomme pas.
- **Tasks** : composeur de tâche, sections `Today` / `Upcoming` / `Done`.
- **Product** : 9 sections dont `Backlog`, composeur de MVP.
- **Legal** : 3 sections, dont la grille de souveraineté à 6 niveaux (`LegalDetailPage` et
  `LegalItemDetail` portent chacun leur copie de cette grille).
- **IT / R&D** : composeur d'événement.
- Le `TODO:` en clair dans `src/apps/people/fleet.ts` a été retiré.

## Spécificités de ton périmètre

### La duplication Legal

`LegalDetailPage.tsx` et `LegalItemDetail.tsx` portent **la même** grille de six niveaux de
souveraineté, dupliquée ligne à ligne (~100 lignes chacune). Une correction sur l'une sans
l'autre crée une incohérence invisible. Soit tu factorises dans un module partagé **à
l'intérieur de `src/apps/legal/`**, soit tu corriges les deux à l'identique. Ne sors pas du
périmètre pour factoriser dans `src/components/`.

### Les composeurs

Cinq de tes six apps ont un formulaire de création (incident, tâche, MVP, événement, membre).
Passe-les tous au même crible : champ vide accepté ? doublon possible ? toast de confirmation ?
la liste se rafraîchit-elle ? le champ se vide-t-il après succès ? que se passe-t-il si la
mutation CMS échoue ?

### Les vues à onglets internes

`ApprovalsView` (People) et les vues de détail (`*DetailPage`, `*ItemDetail`) ont leur propre
état d'onglet, séparé du rail de l'`AppFrame`. Vérifie que changer d'onglet ne perd pas l'état
saisi, et que revenir en arrière depuis un détail ne laisse pas le fil d'Ariane incohérent.

### Le vocabulaire

Ces apps contiennent beaucoup de prose de seed (notes, incidents, décisions produit). Vérifie le
vocabulaire canon : **Coach OS**, **Citadelle**, **demo-coach**. Les mentions internes du
« Enterprise OS blueprint » et de son auteur sont des commentaires de code documentant l'origine
d'une structure — elles sont légitimes tant qu'elles ne s'affichent pas à l'écran.

## Rappel de la boucle

**Six apps dans ton périmètre = six apps dans ton rapport.** Tu ne t'arrêtes pas après la
première. Deux passes consécutives sans rien de neuf, et seulement là, tu rends la main.
