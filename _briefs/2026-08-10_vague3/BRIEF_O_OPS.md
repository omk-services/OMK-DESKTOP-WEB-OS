---
id: O_OPS
campagne: 2026-08-10 vague 3 — fonctionnalités oubliées, apps restantes
---

# BRIEF O — Operations, Tasks, Product, IT/R&D

## Ton périmètre exclusif

```
src/apps/operations/**
src/apps/tasks/**
src/apps/product/**
src/apps/it-rd/**
```

**Interdit** : le socle et toute autre app. Lis `SOCLE_ACQUIS.md` avant de commencer.

## Ce qui a déjà été fait — ne le refais pas

- **Operations** : composeur d'incident, sections Knowledge Base et Incidents. L'`id` de
  section `incidents` est la cible du drill venant du CEO Cockpit — **ne le renomme pas**.
- **Tasks** : composeur de tâche, bascule « fait », sections Today / Upcoming / Done.
- **Product** : composeur de MVP, `eta` calculé depuis `weeksToShip` (fini le `TBD`).
- **IT/R&D** : composeur d'entrée de journal, `acknowledgeDrift`. La section `Deploys` a
  servi de banc d'essai au CRUD générique : elle fonctionne de bout en bout, sers-t'en comme
  référence.

## Ce que tu cherches

### 1. Le CRUD sur les collections restantes

`runbooks`, `articles`, `services`, `it_experiments`, `product_items`, `product_releases`,
`tasks`, `nightcrawler` — vérifie chacune. Là où l'utilisateur devrait pouvoir créer et ne
peut pas, branche `CollectionRepeater` (voir `SOCLE_ACQUIS.md`).

Là où un composeur maison existe déjà (incident, tâche, MVP, journal), ne le remplace pas
mécaniquement : compare-le au CRUD générique et **garde le plus riche**, en t'assurant qu'il
valide, refuse les doublons, vide ses champs après succès et affiche ses erreurs.

### 2. Les kanbans et les tableaux de bord

`Product › Roadmap` et `Operations › Processus` affichent des colonnes d'étapes. Vérifie que
**déplacer un item d'une étape à l'autre est possible** — `moveStage` existe dans Product,
assure-toi qu'il est atteignable depuis l'interface et pas seulement depuis le code. Un
kanban qu'on ne peut pas réorganiser n'est pas un kanban, c'est une image.

### 3. Les fiches de détail

Référence : `src/apps/clients/ClientsDetailPage.tsx` — en-tête + statut, métriques, sections
thématiques, actions, navigation précédent/suivant. Vérifie surtout `runbooks`, `services`
et `product_releases`, les plus susceptibles d'être squelettiques.

### 4. Le piège du crumb dupliqué

Chacune de ces apps a des fiches de détail. Teste sur les quatre : ouvrir une fiche, cliquer
une autre section, vérifier que la fiche se ferme et que la section change. Le mécanisme
exact du défaut est décrit dans `SOCLE_ACQUIS.md`.

### 5. Les états vides

Ces quatre apps sont celles où l'utilisateur arrivera avec **zéro donnée** le premier jour :
aucun incident, aucune tâche, aucun déploiement. Passe chaque section à vide (mentalement ou
en vidant la collection) et demande-toi ce qu'il voit. Un écran blanc le premier jour, c'est
un produit qu'on referme.

Chaque état vide doit dire ce qui manque **et** porter le bouton qui le crée.

## Vérification

```bash
node tools/shot.mjs --app operations --section "Incidents" --theme glassmorphism --w 920 --h 600 --out /tmp/o.png
```

Pour toute création ou tout déplacement d'étape, pilote le navigateur (Playwright dans
`~/gauntlet-eyes`) et **prouve l'effet** : l'item apparaît, la colonne change, le compteur
suit.

## Ta boucle

```
passe 1 : parcours les 4 apps section par section, range PAR CAUSE
passe 2 : corrige, cause par cause
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : vérifie PAR LE RENDU
passe 5 : reparcours à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

**Quatre apps = quatre apps dans ton rapport.**
Écris `_briefs/2026-08-10_vague3/RAPPORT_O_OPS.md` — partiel si tu dois t'arrêter.
