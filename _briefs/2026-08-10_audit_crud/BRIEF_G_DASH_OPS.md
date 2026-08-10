---
id: G_DASH_OPS
campagne: 2026-08-10 — audit CRUD systématique
---

# BRIEF G — dashboard, people, operations, tasks, product, it-rd, ontology

## Ton périmètre exclusif

```
src/apps/dashboard/**
src/apps/people/**
src/apps/operations/**
src/apps/tasks/**
src/apps/product/**
src/apps/it-rd/**
src/apps/ontology/**
```

**Interdit** : le socle et toute autre app. Lis `SOCLE_ACQUIS.md` **et** `MESURE.md` avant de
commencer — la mesure te dit déjà où chercher, ne la refais pas.

## Ce que la mesure dit de tes sept apps

```
dashboard    3/23 sections ont un bouton de création
people       7/11
operations   6/8
it-rd        6/8
tasks        4/6   (+ « Done » rendue vide, sans issue)
product      6/9
ontology     0/4   (aucune collection CMS — cas particulier, voir plus bas)
```

Zéro erreur console sur l'ensemble des 149 sections.

## Priorité 1 — Cadence, la page que l'utilisateur juge la plus importante

`people / Cadence` porte le calendrier de standup (heatmap 7 jours × 24 heures, avec
sélection de case et filtre par agent). L'utilisateur a été explicite :

> « la page la plus importante de cadence avec son calendrier ne doit surtout pas être
> supprimée mais améliorée »

**Interdiction absolue de la simplifier ou de la remplacer par une liste.** Ce que tu ajoutes :

- la possibilité de **créer une tâche planifiée** sur un créneau — depuis la case cliquée, avec
  le jour et l'heure pré-remplis, un intitulé, et l'agent concerné ;
- la **suppression** d'une tâche planifiée depuis le panneau de la case ;
- un état vide utile quand une case n'a aucune tâche : « aucune tâche sur ce créneau » **et**
  le bouton qui en crée une ;
- les compteurs d'en-tête (`PEAK HOUR`, `QUIETEST`, `WEEKDAY AVG`) doivent suivre les tâches
  réelles après création, pas rester figés sur le seed.

La heatmap, ses couleurs, son échelle et sa lecture restent **intactes**.

## Priorité 2 — dashboard, 3 boutons sur 23 sections

Beaucoup de ces sections sont des **journaux** produits par le système (`Sessions`, `Usage`,
`Cost`, `Audit Log`, `DLP & Exfil`) : on n'y crée rien, et c'est normal. Ne leur ajoute pas de
bouton.

En revanche, ces sections-là décrivent des objets que l'opérateur devrait pouvoir créer :
`Kill Switches`, `Rate Limits`, `Alerting`, `Compliance`, `Knowledge`, `Memories`, `Members`,
`Integrations`. Passe-les au critère de tri de `MESURE.md` et tranche chacune, avec sa
justification au rapport.

Deux d'entre elles ont déjà été laissées volontairement en toast par une campagne précédente
(`Members` → invitation, `Integrations` → connecteur) puis câblées localement. Vérifie qu'elles
le sont réellement et que le compteur bouge.

## Priorité 3 — tasks / Done

Rendue vide parce qu'aucune tâche n'est terminée. Ce n'est pas un bug de données : il lui
manque un **état vide avec une issue** (« aucune tâche terminée — les tâches cochées
apparaissent ici », plus un lien vers `Today`).

## Priorité 4 — ontology, le cas particulier

`ontology` affiche `Entities`, `Relations`, `Contracts`, `Versions` et **ne lit aucune
collection CMS** : c'est un registre statique décrit dans le code. Son zéro n'est donc pas le
même défaut que les autres.

Tranche : si le registre des douze entités métier est un **référentiel de conception** (une
documentation vivante du modèle), il reste en lecture et tu le notes au rapport. S'il doit
devenir éditable par l'utilisateur, il faut d'abord le porter en collection CMS — et ça, c'est
un chantier que tu **signales sans l'engager** si tu juges qu'il dépasse le cadre.

`src/apps/ontology/ontology-app.test.ts` existe : garde-le vert.

## Vérification — la seule qui compte

Pour **chaque** section où tu ajoutes la création, pilote le navigateur (Playwright dans
`~/gauntlet-eyes`, voir `tools/shot.mjs`) et prouve la chaîne complète :

```
compteur avant → ouvrir le formulaire → remplir → soumettre
   → l'item APPARAÎT dans la liste → le compteur a bougé
```

Pour Cadence, prouve en plus que la tâche créée **apparaît sur la bonne case** de la heatmap.

Un toast de succès ne prouve rien : il a déjà menti deux fois sur ce dépôt.

## Ta boucle

```
passe 1 : Cadence (priorité de l'utilisateur), puis parcours les 6 autres apps
passe 2 : corrige, section par section, avec un verdict par section
passe 3 : npx tsc --noEmit, ne lis que TES fichiers
passe 4 : prouve chaque création PAR LE RENDU
passe 5 : reparcours à neuf
si passe 5 remonte du neuf → retour en passe 2, sinon rapport
```

**Sept apps = sept apps dans ton rapport**, avec pour chaque section un verdict :
créable / lecture légitime / corrigée.

Écris `_briefs/2026-08-10_audit_crud/RAPPORT_G_DASH_OPS.md` — partiel si tu t'arrêtes.
