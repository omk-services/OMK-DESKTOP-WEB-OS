---
title: 'Brancher it-rd et operations sur le registre'
type: 'feature'
created: '2026-08-05'
status: ready-for-dev
baseline_revision: '28021593490eb671e7acf822901578562b8b38d5'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings:
  - 'oversized'
deferred:
  - summary: >-
      `npm run build` reste casse au niveau du depot (79 erreurs `tsc -b`
      preexistantes, heritees des passes anterieures et documentees en
      story 1 / 2 / 3). Cette story n'en ajoute aucune et laisse
      `npm test` + `npm run lint` comme garde-fous effectifs.
    evidence: >-
      `npx tsc -b --noEmit` sur le HEAD baseline (cf. 0cd5b41) rapporte 79
      erreurs, dont la majorite dans `src/apps/tasks/TasksDetailPage.tsx`,
      `src/apps/cognition/CognitionApp.tsx`,
      `src/components/canvasui/_v1_css_retired/BackgroundFX.tsx`,
      `src/apps/marketplace/MarketplaceDetailPage.tsx`. Aucun nouveau
      fichier de cette story n'ajoute d'erreur.
    location: 'repo-wide (hors fichiers de cette story)'
    severity: medium
---

<intent-contract>

## Intent

**Problem:** L'app `ontology` (creee stories 2+3) lit seule le registre
des 12 entites. Les deux apps voisines `it-rd` et `operations` continuent
de manipuler leurs propres types en parallele, sans branchement commun.
L'epic ne peut pas repondre a sa these (« un registre curé a la main
**porte deux apps sans friction** ») tant que les apps cibles n'ont pas
ete rebranchees sur la meme source.

**Approach:** Ajouter une section dediee dans chacune des deux apps
existantes (`Ontology` dans `it-rd`, `Context Layer` dans `operations`).
Chaque section lit **exclusivement** `src/lib/ontology/index.ts` — aucune
constante recopiee, aucun tableau en dur. La verification repose sur un
test qui prouve la propagation : le libellé rendu par chaque section
est strictement celui que l'API publique retourne a l'instant du render.

## Boundaries & Constraints

**Always:**
- Lecture du registre via `src/lib/ontology/index.ts` uniquement.
  Aucun import direct de `./entities`, `./relations`, `./contracts`,
  ni de `./scope-store` depuis les apps. Le test
  `src/lib/ontology/architecture.test.ts` le verrouille deja pour
  l'ensemble du `src/` : tout contrevenant casse ce test.
- Les accents de theme passent par `var(--theme-*)` et `var(--panel-*)`,
  pas de palette Tailwind en dur (cf. dette corrigee sur 385 usages
  documentee dans `OntologyApp.tsx` lignes 22-23).
- `AppFrame` + un `AppSection` supplementaire par app, dans le meme
  tableau `sections: AppSection[]` que les sections existantes. Aucun
  nouveau shell, aucun router alternatif.
- Les icones `lucide-react` choisies ne sont pas deja utilisees par les
  sections voisines de la meme app.
- Le rendu lit `listEntities()` / `getEntity(id)` / `listAttributesOf(id)`
  / `relationsOf(id)` / `contractOf(id)` a **chaque** render, jamais
  depuis une copie locale mise en cache en dehors du cycle React.

**Block If:**
- La story devrait toucher `src/lib/ontology/` (modules internes) —
  le registre est fige depuis la story 1, modifier quoi que ce soit ici
  casserait la fermeture et le critere d'acceptation de l'epic.
- Une icone choisie se revele deja utilisee par une section existante
  de la meme app — reprendre le motif de story 2 qui selectionne un
  accent distinct.
- L'ajout de la section oblige a refactorer une section existante
  (`Kernel` / `Experiments` / `Deploys` pour `it-rd`, `Runbooks` /
  `Knowledge Base` / `Incidents` pour `operations`).

**Never:**
- Refondre les sections existantes de `it-rd` ou `operations`.
- Retirer `Knowledge Base` de `operations`.
- Importer un module interne du registre, meme via `import type`.
- Ajouter une nouvelle dependance npm.
- Faire muter quoi que ce soit dans le registre (l'API est `Object.freeze`
  sur chaque rendu).
- Simuler un historique de versions ou un cache « faux » : si le rendu
  n'a pas la donnee, il dit qu'il ne l'a pas.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH_it-rd | Section `Ontology` ouverte dans `it-rd`, registre sain | 12 cartes d'entite affichees, chacune avec `entity.label`, `entity.description`, et un marqueur du nombre d'attributs visibles. Clic ouvre un detail listant les attributs typés (`name`, `type`, `required`, `ref`, `scope`) + le contrat (`triggers`, `allowedActions`). | Aucun |
| HAPPY_PATH_operations | Section `Context Layer` ouverte dans `operations`, registre sain | 5 cartes pour `SOP`, `Runbook`, `Incident`, `Routine`, `Skill`. Chacune affiche son `label` + `description`. En dessous, une liste des relations dont l'une des extremites est dans ce sous-ensemble (avec `source`, `verbe`, `target`, `cardinalite`). | Aucun |
| EDGE_empty_registry | `listEntities()` retourne `[]` (registre degrade, teste via mock) | La section affiche le message « Registre vide » au lieu d'une grille. Pas de crash de boucle, pas d'index `undefined`. | Render defensif : `entities.length === 0` -> encart explicite. |
| EDGE_unknown_entity | Un identifiant d'entite inconnu est passe en argument d'une vue detail | Le bouton Retour ramene a la grille. Pas d'ecran blanc, pas d'erreur console. | Pattern deja valide en `OntologyApp.tsx` lignes 710-714 (useEffect de reset defensif). |
| EDGE_no_relations_in_subset | Aucune relation ne touche `SOP`/`Runbook`/`Incident`/`Routine`/`Skill` | L'encart « Relations du sous-ensemble » affiche « Aucune relation ». | Memoire defensive sur `subsetRelations.length === 0`. |
| PROPAGATION_rename | Test qui injecte une entite au libelle « ClientFoo » via `listEntities()` mocke et verifie que les deux sections affichent « ClientFoo » dans leur DOM rendu | Les deux vues refletent la valeur de l'API au moment du render. Aucune copie locale. | Si le test echoue, c'est que le branchement recopie : on corrige le branchement, pas le test. |

</intent-contract>

## Code Map

- `src/lib/ontology/index.ts` — API publique (`getEntity`, `listEntities`,
  `listAttributesOf`, `relationsOf`, `contractOf`). Seule porte
  importable par les apps. Ferme sur les modules internes.
- `src/lib/ontology/architecture.test.ts` — garde-fou de fermeture.
  Couvre deja toute violation d'import des modules internes du registre.
  Cette story n'y touche pas : l'invariant est verifie a chaque `npm test`.
- `src/lib/ontology/entities.ts` (lecture via API) — 12 entites.
  `Organization`, `Membership`, `Profile`, `Client`, `Offering`, `SOP`,
  `Runbook`, `Skill`, `Agent`, `Routine`, `Incident`, `Persona`.
  La story 4 n'importe pas ce fichier.
- `src/apps/ontology/OntologyApp.tsx` — patron de reference pour les
  sections (Entite carte / detail / tableau d'attributs / contrat).
  Reutilisation directe du rendu : la nouvelle section `Ontology` de
  `it-rd` partage la meme grille, le meme tableau d'attributs et la
  meme fiche contrat que `OntologyApp.tsx` lignes 211-268, 322-413,
  513-584. Pas de duplication de logique : on extrait les composants
  `EntityCard`, `EntityDetail`, `ContractDetail` en modules partages
  sous `src/apps/_ui/` pour qu'aucun rendu ne soit ecrit deux fois.
- `src/apps/it-rd/ItRdApp.tsx` — fichier a etendre. Sections actuelles :
  `kernel`, `experiments`, `deploys`. Nouvelle section `ontology`
  ajoutee dans `sections: AppSection[]` lignes 135-139. Icone
  `Database` (deja reference dans `OntologyApp.tsx` ligne 29 — on
  choisit une icone distincte : `Network`).
- `src/apps/operations/OperationsApp.tsx` — fichier a etendre. Sections
  actuelles : `runbooks`, `knowledge`, `incidents`. Nouvelle section
  `context-layer` ajoutee dans `sections: AppSection[]` lignes
  215-219. Icone `Network` prise par `OntologyApp.tsx` ligne 27 ->
  choisir `Share2` (icone distincte pour le sous-ensemble
  relations).
- `src/components/AppFrame.tsx` lignes 35-39 — contrat `AppSection`
  (`id`, `label`, `icon: LucideIcon`, `render: () => React.ReactNode`).
  Pas de modification de `AppFrame`, seulement consommation de son
  API existante.
- `src/lib/app-discovery.ts` lignes 28-58 — registre des apps via
  `registerApp(...)`. Les sections ajoutees par cette story n'y
  apparaissent pas : `registerApp` ne reference que l'app, pas ses
  sections internes. Pas de modification.
- `src/apps/_ui/kit.tsx` lignes 40-78 — `Card`, `Badge` (tones
  `ok | warn | danger | accent | neutral`), `StatCard`. Reutilises
  pour les nouvelles sections, identiques au pattern d'`OntologyApp`.

## Tasks & Acceptance

**Execution:**

- `src/apps/_ui/ontology/EntityCard.tsx` -- creer (extrait de
  OntologyApp.tsx 211-268) -- la nouvelle section `Ontology` de
  `it-rd` partage ce composant avec `OntologyApp.tsx` au lieu de
  dupliquer le rendu. Aucun nouveau pattern visuel n'est invente.
- `src/apps/_ui/ontology/EntityDetail.tsx` -- creer (extrait de
  OntologyApp.tsx 322-413) -- fiche d'attributs typés, partagee entre
  `OntologyApp` et la nouvelle section `Ontology` de `it-rd`.
- `src/apps/_ui/ontology/ContractDetail.tsx` -- creer (extrait de
  OntologyApp.tsx 513-584) -- fiche de contrat semantique, partagee.
- `src/apps/ontology/OntologyApp.tsx` -- refactoriser pour importer
  les trois composants partages au lieu de les definir localement --
  pas de changement de comportement visible, le test
  `ontology-app.test.ts` continue de valider `validateRegistry` /
  `validate` apres refactor.
- `src/apps/it-rd/ItRdApp.tsx` -- ajouter une section `Ontology` dans
  `sections: AppSection[]` (apres `deploys`), avec un composant
  interne `Ontology = () => <div className="p-7"><SectionHead .../>
  <div className="grid ...">{entities.map((e) => <EntityCard ...
  />)}</div></div>` -- la grille lit `listEntities()` directement,
  clic ouvre le detail partage. Le composant interne utilise
  `useState<EntityId | null>` pour la selection locale (pattern
  OntologyApp.tsx lignes 692-694).
- `src/apps/operations/OperationsApp.tsx` -- ajouter une section
  `Context Layer` dans `sections: AppSection[]` (apres `incidents`),
  avec un composant interne `ContextLayer = () => <div
  className="p-7"><SectionHead .../><div className="grid ...">{OPS_IDS.map((id) =>
  {const e = getEntity(id); return e ? <Card .../> : null;})}</div><Card
  title="Relations du sous-ensemble"><ul>...</ul></Card></div>` --
  ou `OPS_IDS` est la constante locale `['SOP','Runbook','Incident',
  'Routine','Skill']` et les relations sont l'union de
  `relationsOf(id)` pour chaque id, dedoublonnees par `r.id`. Les
  relations sont lues a chaque render (memes regles que pour la
  section Ontology de `it-rd`).
- `src/apps/it-rd/it-rd-ontology-section.test.tsx` -- nouveau --
  verifie la propagation du libelle depuis `getEntity(id)` jusqu'au
  DOM rendu. Pour chaque entite du registre reel, assert que
  `getEntity(id).label` est dans le `screen` apres render. Utilise
  `@testing-library/react` (deja present dans le repo, cf. usages
  dans d'autres tests d'app). Voir Verification pour les commandes.
- `src/apps/operations/operations-context-layer-section.test.tsx` --
  nouveau -- meme test pour `operations`, plus une verification
  que les 5 ids attendus (`SOP`, `Runbook`, `Incident`, `Routine`,
  `Skill`) sont tous representes dans le DOM rendu avec leur
  `label` respectif.

**Acceptance Criteria:**

- Given un `npm test` lance apres implementation, when le test de
  propagation de `it-rd` rend la section `Ontology` puis assert la
  presence de chaque `getEntity(id).label` dans le DOM, then le test
  passe sans mock — c'est la preuve que la section lit l'API au
  render. Si la section stockait un tableau en dur, le test echouerait
  des qu'une entite du registre reel n'aurait pas ete listee a la
  main dans la section.
- Given un `npm test` lance apres implementation, when le test de
  propagation de `operations` rend la section `Context Layer` et assert
  la presence des 5 libelles `SOP`, `Runbook`, `Incident`, `Routine`,
  `Skill` plus l'union de leurs relations, then le test passe. Si une
  de ces 5 entites etait filtree en dur dans un tableau au lieu d'un
  mapping sur l'API, le test echouerait a la premiere entite renommee.
- Given l'architecture test `architecture.test.ts`, when on lance
  `npm test`, then il reste vert : aucune nouvelle violation d'import
  des modules internes du registre. C'est l'invariant de fermeture
  qui tient automatiquement tant que les nouveaux fichiers n'importent
  que depuis `src/lib/ontology/index.ts`.
- Given `npm run lint`, when il est lance apres implementation, then
  il reste vert : pas de regle ESLint neuve violee.
- Given un edit futur de `src/lib/ontology/entities.ts` qui renomme
  par exemple `Client.label` en `Customer`, when l'utilisateur ouvre
  la section `Ontology` de `it-rd` (sans recompilation du registre,
  juste apres redemarrage HMR), then le DOM affiche « Customer » au
  lieu de « Client ». La meme propriete tient pour la section
  `Context Layer` de `operations` pour les 5 entites du sous-ensemble.
  C'est la these de l'epic validee cote apps.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify
     or delete existing entries. Each entry records: what finding
     triggered the change, what was amended, what known-bad state the
     amendment avoids, and any KEEP instructions (what worked well and
     must survive re-derivation). Empty until the first bad_spec
     loopback. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on EVERY review pass, including
     loopbacks and blocked exits. Each entry records triage decision
     counts for intent_gap, bad_spec, patch, defer, and reject, with
     per-category severity breakdowns using low/medium/high, plus the
     findings addressed in that pass. Empty until the first review
     pass. -->

## Verification

**Commands:**
- `npm test` -- expected: GREEN, 100% des tests existants + 2 nouveaux
  fichiers `it-rd-ontology-section.test.tsx` et
  `operations-context-layer-section.test.tsx` passent. Si l'un des deux
  nouveaux tests echoue, c'est que le branchement recopie une valeur
  en dur dans l'app concernee : corriger l'app, pas le test.
- `npm run lint` -- expected: GREEN, aucune regle ESLint neuve violee.
  Les icones, accents et classes utilises par les nouvelles sections
  suivent le meme pattern qu'`OntologyApp.tsx` (verifie par inspection
  visuelle des imports `lucide-react` et de l'usage de
  `var(--theme-*)` / `var(--panel-*)`).
- `npm test src/lib/ontology/architecture.test.ts` -- expected: GREEN,
  invariant de fermeture non touche par les nouveaux fichiers de cette
  story (verifie par le scan automatique de `src/` du test).
- Inspection manuelle : ouvrir la section `Ontology` de `it-rd` et la
  section `Context Layer` de `operations`, verifier visuellement que
  les 12 entites (pour `it-rd`) et les 5 du sous-ensemble (pour
  `operations`) apparaissent avec leur `label` issu du registre.

**Manual checks (if no CLI):**
- Verifier que `src/apps/_ui/ontology/` ne contient pas de logique
  metier : uniquement le rendu partage (carte, detail, contrat).
  Aucune lecture directe de `entities.ts` / `relations.ts` /
  `contracts.ts` : uniquement `src/lib/ontology/index.ts`.
- Verifier que les icones choisies (`Network` / `Share2`) ne
  collisionnent pas avec celles deja utilisees dans chaque app
  (`it-rd` : `Cpu, FlaskConical, Rocket, Server` ; `operations` :
  `BookOpen, ClipboardList, AlertOctagon, BookText, GraduationCap,
  FileWarning, ShieldCheck`).

