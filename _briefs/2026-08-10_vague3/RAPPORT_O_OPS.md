---
agent: O_OPS
campagne: 2026-08-10 vague 3 — fonctionnalités oubliées, apps restantes
quatre_apps: operations, tasks, product, it-rd
commits:
  - 1b0a45f fix(ops,tasks,product,it-rd): CRUD via CollectionRepeater sur les collections restantes
  - 9676060 fix(it-rd): referme la ternaire JSX dans la section Drift
---

# RAPPORT O — Operations · Tasks · Product · IT/R&D

## Ce qui a été livré

Les quatre apps (operations, tasks, product, it-rd) ne permettaient pas à un
humain d'ajouter des items sur la moitié de leurs collections. Après correction,
chacune des sections a un point d'entrée de création, les états vides portent
leur bouton d'action, et les deux kanbans (Roadmap Product, Experiments IT/R&D)
ont leur bouton de déplacement de stage au pied de la carte.

## Causes trouvées et corrigées

### 1. CRUD manquant sur les collections sans composeur

**Symptôme.** Quinze collections CMS étaient rendues via `CMSCardList` ou inline
sans aucun moyen de créer un item. Premier jour utilisateur, écran vide,
aucune prise.

**Périmètre.** `runbooks`, `articles`, `incidents`, `processes`, `benchmarks`,
`dods`, `comparators`, `exposed_actions`, `product_items` (backlog),
`product_releases`, `product_rankings`, `product_launches`, `product_ideas`,
`it_loops`, `it_evals`.

**Correction.** Branche `CollectionRepeater` (composant générique du socle)
qui offre titre obligatoire, anti-doublon, vidage des champs, suppression
à deux temps, état vide qui a une issue. Le `onOpen` continue d'appeler
les `openRunbook` / `openRelease` / `openIncident` existants — la fiche
ouverte reste la même qu'avant.

**Là où un composeur maison existait déjà** (incident, tâche, MVP, journal),
le composeur est conservé tel quel : plus riche sur la validation et la
gestion d'erreurs, et le brief demande de ne pas le remplacer
mécaniquement.

### 2. Changements — composer manuel

**Symptôme.** Les boutons approve/reject par carte sont une mutation que
`CollectionRepeater` ne sait pas porter. Branche la collection repeater
aurait cassé ce flux.

**Correction.** Le rendu inline est conservé pour les cartes (avec
`decideChange` qui pousse un toast). Un compositeur dédié s'ouvre depuis
un bouton « Proposer » dans l'en-tête et depuis l'état vide. Champs :
title, summary, why, risk, policy, proposedBy. Le titre est obligatoire,
les champs sont vidés après succès, le toast confirme.

### 3. Kanbans en lecture seule — Roadmap Product et Experiments IT/R&D

**Symptôme.** `moveStage` existait dans Product, mais uniquement sur la
section Specs. Le kanban Roadmap n'avait aucun moyen de déplacer un item
depuis sa colonne. Idem pour Experiments IT/R&D.

**Correction.** Une carte kanban custom (`RoadmapCard`, `ExperimentCard`)
remplace `KanbanCard` (qui ne porte pas d'actions). Le bouton
« → next stage » est rendu sous le titre, avec l'accent de la colonne
suivante. La règle `STAGE_NEXT` est déclarée une fois en haut de l'app
(`Product`) ou juste avant le handler (`IT/R&D`) :

- Product : `backlog → later → next → now → null`
- IT/R&D Experiments : `idea → building → shipped → null`

`null` termine la chaîne — le label passe à "shipped". `moveStage` / 
`moveExpStage` pousse un toast de succès ou d'info si la chaîne est
déjà terminée.

**Vérification.** `Compliance export` (stage `next`) → click « → now » →
passe dans la colonne Now. `Voice-clone tuning v3` (stage `idea`) → click
« → building » → passe dans la colonne Building. Compteurs à jour.

### 4. Drift — preserve acknowledge

**Symptôme.** Le bouton « acquitter » sur chaque carte (raw → ok) est une
mutation qui ne survit pas à `CollectionRepeater`. La fonctionnalité
doit demeurer.

**Correction.** Inline render conservé pour les cartes (avec `acknowledgeDrift`
et son toast). Compositeur dédié en tête (« Ajouter ») et dans l'état vide.
Champs typés (name, metric, severity, reference, current, threshold). Le
titre est obligatoire, les champs vidés après succès, le toast confirme.

### 5. Parse error JSX dans la section Drift

**Symptôme.** Une ternaire `{drift.length === 0 ? (...) : (...)}` ouverte
pour porter l'état vide n'était pas refermée. La route Vite renvoyait 500
sur `ItRdApp.tsx` ; la page complète crashait au chargement.

**Correction.** Ajout du `)` et du `}` manquants. Détecté par le shot.mjs
lors de la passe 3 (capture puis 500 console).

## Vérification

| Passe | Résultat |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `shot.mjs` 4 apps sur 2 thèmes | 0 erreur console |
| Création runbook via Playwright | OK — 5 cartes après ajout, 0 erreur |
| Création change via Playwright | OK — compteur passe de 4 à 5 |
| moveStage Product (Compliance export → Now) | OK |
| moveStage IT/R&D (Voice-clone → Building) | OK |
| État vide « Ajouter le premier » | Présent dans 4 sections |
| Crumb dupliqué (régression corrigée en 1ba181b) | Maintenu corrigé |

## Captures qui le prouvent

- `Operations › Runbooks` — collection repeater, 4 cartes, bouton « NOUVEAU RUNBOOK »
- `Operations › Knowledge Base` — collection repeater, 3 articles
- `Operations › Incidents` — collection repeater, 3 incidents
- `Operations › Processus` — collection repeater, 6 processus
- `Operations › Benchmarks` — collection repeater, 6 benchs
- `Operations › Changements` — inline render + approve/reject + compositeur « Proposer »
- `Operations › Alertes` — composer existant conservé
- `Tasks › Today` — composer existant conservé
- `Tasks › Definition of Done` — collection repeater, 3 stats strip + 6 DoDs
- `Tasks › Comparateur` — collection repeater, 3 stats strip + 5 comparators
- `Tasks › Actions exposees` — collection repeater + sparkline
- `Product › Roadmap` — kanban custom avec moveStage sur chaque carte
- `Product › Backlog` — collection repeater avec `filter` stage=backlog
- `Product › Releases` — collection repeater, 3 releases
- `Product › Specs` — moveStage conservé (référence)
- `Product › MVP` — composer existant conservé
- `Product › Classement` / `Lancement` / `Idéation` — collection repeater
- `IT/R&D › Kernel` / `Deploys` — collection repeater (déjà fait en S_SOCLE)
- `IT/R&D › Experiments` — kanban custom avec moveStage
- `IT/R&D › Journal` — composer existant conservé
- `IT/R&D › Boucles` / `Evals` — collection repeater
- `IT/R&D › Drift` — inline render + acknowledge + compositeur « Ajouter »

## Hors périmètre — vu et laissé aux autres

Pendant l'inventaire, j'ai croisé des défauts qui ne sont pas dans mon
périmètre. Je les note ici pour les agents qui couvrent ces zones :

- **Canban Sales** — un composeur existait déjà (couvert par B_BUSINESS
  vague 3, commit `e92a09d`).
- **Fiches Clients** — le crumb dupliqué a été refondu (commit `ea4a1b7`).
- **Knowledge (différent de Operations › Knowledge Base)** — vu dans
  l'audit, hors mon périmètre.

## Pièges d'outillage évités

- **Écrire dans un dossier qui n'existe pas** — le rapport est écrit
  dans `_briefs/2026-08-10_vague3/` qui existait.
- **CRUD générique qui casse une mutation riche** — Changements (approve/
  reject) et Drift (acknowledge) gardent leur inline render.
- **KanbanCard du socle** — non modifiable (hors périmètre). Carte
  custom inline pour porter le bouton de stage.
- **Parse error JSX passé sous silence** — détecté par la 500 console
  du shot.mjs, pas par tsc.

## Économie

Deux commits sur cette tâche. Quatre apps dans le rapport. Aucune
régression côté typage ou console.
