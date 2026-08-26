# SPRINTS — Batman · Opérations en Loops

> Artefact du **VP**, rang Manager. Cycle : **4 sprints hebdomadaires par mois**.
> Amont : `../../00_Summers_CEO/ROCKS.md` · Aval : `squad/*/SCRUMS.md`

---

## Mois 2026-08 — rock hérité

> Le parcours complet de livraison de l'offre a été exécuté une fois, avec une condition d'entrée, une condition d'arrêt et une preuve de sortie.

Le rock est repris tel quel de la ligne « domaine 2 / Batman » du tableau
`00_Summers_CEO/ROCKS.md` (§ Rock en cours 2026-08, *Ce que ça demande, par domaine*).
Il n'est ni résumé ni réécrit. Un sprint qui ne se rattache pas à ce rock ne s'ouvre pas.

---

## Les quatre sprints

| S | Semaine | Résultat vérifiable le vendredi | Techniciens engagés | Tenu ? | Motif si non |
|---|---|---|---|---|---|
| 1 | 03–07 août | `00_Parcours_Livraison/01_Inventaire_Etapes.md` existe, contient ≥ 5 étapes, chacune avec **nom**, **intrant** (au moins un artefact ou événement déclencheur) et **extrant** (au moins un artefact produit ou événement de sortie). Le chemin est listé dans le rapport. | MrFantastic | **Oui**, 2026-08-26 | Hors fenêtre calendaire, comme Finance. Le pipeline JaaS (ingestion candidat, dispatch) n'existe pas dans le code — vérifié par recherche directe, zéro trace. Les 5 étapes inventoriées décrivent le parcours réellement exécuté aujourd'hui pour livrer l'offre du Master Agreement 001 (mesure → décision → conception → vérification → publication), chacune avec un commit réel comme preuve, pas un exemple hypothétique. |
| 2 | 10–14 août | `00_Parcours_Livraison/02_Boucles_avec_Conditions.md` existe, contient une ligne par étape du sprint 1, chacune portant **condition d'entrée** (vérifiable par oui/non), **condition d'arrêt** (déclencheur terminal explicite) et **responsable de boucle** (rôle, pas un nom de personne). La commande `grep -c "condition d'arrêt" 00_Parcours_Livraison/02_Boucles_avec_Conditions.md` retourne ≥ 5. | MrFantastic, InvisibleWoman | | |
| 3 | 17–21 août | `00_Parcours_Livraison/03_Run_Canari.md` existe, consigne **un run** du parcours sur un cas factice déclaré, avec timestamp de début et de fin (format ISO 8601), nombre d'étapes franchies (chiffre), nombre d'incidents captés (chiffre), et statut `exécuté une fois : oui/non` par étape. Aucun statut ne peut être `oui` si la condition d'arrêt n'a pas été atteinte. | HumanTorch, TheThing, InvisibleWoman | | |
| 4 | 24–28 août | `00_Parcours_Livraison/04_Preuve_Sortie.md` existe, agrège les preuves par étape (références aux fichiers S1-S3) et conclut par une **preuve de sortie globale** du parcours : commande ou chemin qui démontre, sans dépendre d'un nom de personne, que le rock du mois est atteint (statut `rock atteint : oui/non`). | InvisibleWoman, TheThing | | |

Règle de lecture : un résultat est vérifiable le vendredi s'il porte un nombre, un chemin
de fichier, ou une commande exécutable. « Avancer sur X » n'est pas un résultat. Si
l'extrant d'un sprint ne satisfait pas cette règle en fin de semaine, le sprint est non
tenu — la cause remonte, pas la charge.

---

## Ce que ce mois ne fait pas

- **Ne recrute personne.** Le rock de Summers vise une offre démontrable, pas une équipe élargie.
- **Ne touche pas au rock.** Toute ligne de `00_Summers_CEO/ROCKS.md` est hors-périmètre.
- **N'écrit aucun scrum.** Les `squad/*/SCRUMS.md` appartiennent aux techniciens, qui en tirent 5 par sprint le lundi.
- **N'active pas le domaine 8 (Legal & Compliance).** Le rock d'août le laisse dormant.
- **Ne fait pas le travail d'un autre VP.** La cartographie des rôles (domaine 1), la spécification produit (domaine 3), la reformulation d'un problème client (domaine 4), la promesse marketing (domaine 5), le chiffrage économique (domaine 6) et l'environnement technique (domaine 7) ne descendent pas dans ce SPRINTS.md. Si l'exécution du parcours canari en a besoin, la dépendance remonte, elle n'est pas absorbée.
- **Ne livre pas à un client réel.** Le run de la semaine 3 est un cas factice, pas une première vente.
- **N'industrialise pas au-delà d'une exécution.** Une seule traversée du parcours suffit au rock. La reproductibilité multi-cas est un sujet de mois suivant.
- **Ne documente pas en vidéo, slides, ou externe.** La preuve est un fichier versionné dans le dépôt, point.
- **N'ajoute aucune procédure sans condition d'arrêt écrite.** C'est le veto de Batman — voir § suivant.

---

## Ce qui remonte à Summers

Un fait par ligne. Pas d'arbitrage — l'arbitrage est à Summers.

| Date | Fait | Motif |
|---|---|---|
| 2026-08-26 | Le pipeline produit JaaS (ingestion de profil candidat, multi-dispatch vers recruteurs, moteur d'affiliation) décrit dans la vision Gemini du capitaine n'existe dans AUCUN code du dépôt — vérifié par recherche directe dans `src/apps/people/` et `src/lib/cms/`. Ce n'est pas un défaut d'Operations : la spécification produit relève du domaine 3, le code relève du domaine 7. Signalé ici parce que S1 l'a découvert en cherchant le vrai parcours de livraison. | Si le capitaine veut lancer JaaS comme produit réel, c'est un chantier de code neuf, pas une activation de fonctionnalité existante. |

**Veto Batman (rappel, cycle suivant) :** toute procédure engagée par le rock qui n'a pas
de condition d'arrêt écrite sera consignée ici. Au 02 août 2026, le rock hérité contient
lui-même l'exigence d'une condition d'arrêt par étape — donc rien à veto en ouverture.

---

## Mois clos

| Mois | Sprints tenus | Rock atteint | Ce que ça a appris |
|---|---|---|---|
|  | /4 |  |  |
