# 01_Inventaire_Etapes — Sprint 1, août 2026

> Domaine : Opérations en Loops (Batman). Technicien engagé : MrFantastic.
> Livrable exigé par `../SPRINTS.md` S1 : ≥ 5 étapes du parcours de
> livraison de l'offre, chacune avec nom, intrant, extrant.

## Quelle offre — et pourquoi ce n'est pas celle qu'on pensait

Le pipeline JaaS décrit ailleurs (ingestion de profil candidat,
multi-dispatch vers des recruteurs, moteur d'affiliation) **n'existe pas
dans le code** — vérifié par recherche directe dans `src/apps/people/` et
`src/lib/cms/` : aucune trace d'ingestion candidat ni de dispatch de
dossier. Ce que le mot « dispatch » désigne réellement dans ce dépôt,
ce sont des événements de fenêtre UI (`window.dispatchEvent`), sans
rapport avec un recruteur.

**L'offre réellement livrée aujourd'hui** est celle du Master Agreement
001 : *« Moteur de Business OS pour The OMK Office »*. Le parcours
inventorié ici est donc celui par lequel cette offre est **effectivement**
produite et livrée — mesuré sur des exécutions réelles d'aujourd'hui, pas
sur un pipeline produit qui n'a jamais tourné.

## Les cinq étapes, avec preuve d'exécution réelle

| # | Étape | Intrant | Extrant | Preuve (commit) |
|---|---|---|---|---|
| 1 | **Mesure** | Une hypothèse ou une question business non vérifiée (ex. « pourquoi 7 domaines sont inertes ? ») | Un diagnostic sourcé, avec chemins de fichiers et chiffres exacts, jamais une estimation orale | `9bcf1f8` — diagnostic des 8 domaines en absence, mesuré couche par couche |
| 2 | **Décision du capitaine** | Le diagnostic + les options nommées, sans qu'aucune ne soit tranchée par un agent | Une décision explicite de l'utilisateur, consignée avec sa date | `eb454d1` — seuil de viabilité 100 clients/mois, fixé par le capitaine |
| 3 | **Conception du livrable** | La décision actée | Un document ou un fichier de code réel, écrit selon un gabarit vérifiable (chemin, structure) | `319b13f` — `PRICING.md` publié au chemin exact exigé par `SPRINTS.md` |
| 4 | **Vérification** | Le livrable produit à l'étape 3 | Un résultat de test ou de CI, positif ou négatif, jamais supposé | `70a4aaa` — 27/27 autotests kernel après le premier run réel |
| 5 | **Publication** | Le livrable vérifié | Un commit poussé sur `main`, CI verte confirmée par `gh run list`, visible publiquement | `d7b5777` — signature du Master Agreement 001, CI verte confirmée |

## Ce qui rend ces 5 étapes vérifiables, pas juste plausibles

Chaque extrant ci-dessus a un commit réel associé, pas un exemple
hypothétique — `git log --oneline` du 2026-08-26 les liste dans l'ordre
où ils sont survenus. Le parcours n'a pas été inventé pour ce document :
il a été **exécuté cinq fois de suite aujourd'hui même**, sur le domaine
Finance (sprints 1 à 4) et sur `03_Master_Agreements/`.

## Ce que ce sprint ne fait pas

Il n'invente pas un pipeline produit JaaS qui n'existe pas encore. Le
jour où l'ingestion candidat et le multi-dispatch seront du code réel,
ils auront leur propre inventaire d'étapes — distinct de celui-ci, qui
documente comment Coach OS lui-même se construit et se livre.
