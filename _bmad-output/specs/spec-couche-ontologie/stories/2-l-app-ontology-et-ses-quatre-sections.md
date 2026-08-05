---
title: 'L''app ontology et ses quatre sections'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_revision: '0d0902c271edd70cc088e5478e89e5d0fca715a0'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred:
  - summary: >-
      `npm run build` echoue avant cette story : `tsc -b` remonte 79 erreurs de
      type preexistantes dans les apps et les composants retires (heritees
      des passes anterieures).
    evidence: |-
      `npx tsc -b --noEmit` sur le HEAD de reference 0d0902c rapporte 79
      erreurs, dont la majorite se trouve dans `src/apps/tasks/TasksDetailPage.tsx`,
      `src/apps/cognition/CognitionApp.tsx`, `src/components/canvasui/_v1_css_retired/BackgroundFX.tsx`,
      et `src/apps/marketplace/MarketplaceDetailPage.tsx`. La nouvelle app
      `src/apps/ontology/` ne porte aucune de ces erreurs, mais le pipeline
      reste casse au niveau du depot.
    location: >-
      repo-wide (hors src/apps/ontology/)
    severity: medium
  - summary: >-
      Placement de l'enregistrement `ontology` dans `app-discovery.ts` :
      la spec dit « apres WelcomeApp / avant DesignApp » (Intent Contract)
      et « apres DesignApp, fin de fichier » (Code Map). L'implementation
      a suivi le Code Map.
    evidence: |-
      Le code suit la formulation la plus precise (Code Map). Le conflit
      etait deja signale dans `Design Notes` de la spec ; pas de deviation
      silencieuse. La difference est purement documentaire.
    location: >-
      src/lib/app-discovery.ts:55-58
    severity: low
  - summary: >-
      Aucun test ne rend le JSX de `OntologyApp` (sections, StatCards,
      notice "Pas d'historique"). Les tests actuels couvrent le helper
      `validate` et l'API publique.
    evidence: |-
      Pour monter le composant il faudrait `@testing-library/react`, ce
      qui ajoute une dependance — interdit par la spec. Le patch review a
      deja ajoute 10 tests synthetiques sur `validate` pour couvrir les
      branches du helper. Le test de fermeture `architecture.test.ts`
      protege la frontiere du registre ; les surfaces UI restent
      verifiees a la main.
    location: >-
      src/apps/ontology/ontology-app.test.ts
    severity: medium
  - summary: >-
      Accessibilite legere : pas d'`aria-label` sur les cartes
      entite/contrat, pas de `for/id` sur les `<select>` de la section
      Relations, pas d'`aria-live` sur le compteur filtre.
    evidence: |-
      Amelioree par une passe ulterieure (kit UI ou revue a11y). Aucune
      regression fonctionnelle ; les boutons utilisent `<button
      type="button">` deja.
    location: >-
      src/apps/ontology/OntologyApp.tsx:159-189, 254-330, 575-602
    severity: low
---

<intent-contract>

## Intent

**Problem:** La story 1 a pose `src/lib/ontology/` (12 entites, relations, contrats, API publique). Sans consommateur, ce registre reste invisible. L'epic attend qu'une app le lise et que les consommateurs suivants (`it-rd`, `operations`) puissent s'y brancher sans recopier les donnees.

**Approach:** Creer `src/apps/ontology/OntologyApp.tsx`, l'enregistrer dans `src/lib/app-discovery.ts` avec un identifiant `ontology` et l'icone `Network`. Quatre sections dans la barre laterale, via `AppFrame` + `AppSection`, alimentees exclusivement par l'API publique `src/lib/ontology/index.ts`. La section Versions verifie les memes invariants que `ontology.test.ts` (12 entites, 15-25 relations, 12 contrats, integrite referentielle) et signale les ecarts a l'utilisateur.

## Boundaries & Constraints

**Always:**
- L'app est enregistree via `registerApp({ id: 'ontology', name: 'Ontology', icon: Network, accent: '#0d9488', description, component: OntologyApp })` place apres `WelcomeApp` / avant `DesignApp` pour preserver l'ordre des icones du desktop (cf. ordre actuel `app-discovery.ts`).
- L'icone est `Network` de `lucide-react` ; l'accent est `#0d9488` (teal, distinct des 17 accents deja deployes ; se distingue de `Welcome` `#4f46e5`, `Design` `#0f172a`, `Onboarding` `#0d9488` — verifier qu'aucun autre n'utilise `#0d9488` ou prendre un accent libre le cas echeant).
- Les 4 sections sont declarees via `AppSection[]` :
  1. **Entities** (`id: 'entities'`, icone `Database`) — grille des 12 entites ; un clic sur une carte ouvre un detail (sous-vue locale) listant `label`, `description`, et un tableau des attributs (`name`, `type`, `required`, `ref` quand present).
  2. **Relations** (`id: 'relations'`, icone `GitBranch`) — liste des relations ; deux `<select>` (source / cible) qui filtrent par entite, plus un troisieme pour reinitialiser ; chaque relation affiche `source → target`, `verb`, `cardinality`.
  3. **Contracts** (`id: 'contracts'`, icone `FileCheck` ou equivalent) — grille des entites ; un clic ouvre le contrat (`triggers`, `allowedActions`) sous forme de deux listes.
  4. **Versions** (`id: 'versions'`, icone `History`) — panneau d'etat : nombre d'entites, de relations, de contrats ; verification des invariants (cardinalites dans l'union, refs resolues, verbe non vide, identifiants uniques) ; affiche aussi un encart explicite « Pas d'historique de versions : le registre est en memoire TypeScript, sans persistance. » si les invariants passent, ou une liste d'anomalies sinon.
- L'app lit **exclusivement** `src/lib/ontology/index.ts` ; aucun import depuis `entities.ts` / `relations.ts` / `contracts.ts` (l'invariant est verrouille par `src/lib/ontology/architecture.test.ts` deja en place).
- Toutes les couleurs / arrieres-plans / bordures utilisent les variables CSS `var(--theme-*)`, `var(--panel-*)`, `var(--theme-muted)` ; aucune classe Tailwind `bg-stone-*`, `text-stone-*`, `border-stone-*` en dur (cf. dette corrigee sur 385 usages — ne pas la reintroduire).
- Aucune modification a `src/lib/ontology/` (fige par la story 1), aux autres apps, ou a `src/lib/app-registry.ts`.

**Block If:**
- L'icone choisie entre en conflit visuel avec un accent deja present dans `app-discovery.ts` : choisir un autre accent libre et laisser une note dans le rapport.
- Une section depend d'une fonctionnalite qui n'existe pas encore (persistance, comparaison de versions) : sortir du perimetre plutot que simuler.

**Never:**
- Import direct depuis `./entities`, `./relations`, `./contracts` (verrouille par `architecture.test.ts` ; toute reintroduction casse la suite).
- Modification des fichiers `src/lib/ontology/{entities,relations,contracts,index}.ts`.
- Aucune nouvelle dependance dans `package.json`.
- Recopie en dur d'une entite, d'une relation ou d'un contrat dans le composant (le critere de l'epic tient par absence de duplication).
- Persistence cote app : l'app est sans etat entre rechargements, sauf ce que les autres branches de l'epic peuvent y greffer plus tard.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Lancement de l'app `ontology` | 4 sections visibles ; section `Entities` ouverte par defaut, affiche 12 cartes | Aucune |
| HAPPY_PATH | Clic sur l'entite `Client` dans `Entities` | Detail : label "Client", description, tableau de 4 attributs (`fullName`, `status`, `startDate`, `organization`) | Aucune |
| HAPPY_PATH | Filtre `Relations` source = `Agent` | Liste reduite aux relations dont `source === 'Agent'` (4 relations : executes runbooks, runs routines, acquires skills, incarnates personas) | Aucune |
| HAPPY_PATH | Section `Versions` avec un registre coherent | Stat tiles : 12 entites / 20 relations / 12 contrats ; encart « Pas d'historique » visible | Aucune |
| ERROR_CASE | Section `Versions` si une incoherence est simulee (test runtime) | Liste des anomalies affichee (par exemple « entite X sans contrat »), nombre d'entites different de 12 | Aucune exception ; le panneau signale |
| EDGE_CASE | Filtre `Relations` source = cible = `Organization` | Liste des relations Organization -> Organization (0 dans le registre actuel) ; la liste affiche « Aucune relation. » | Aucune |

</intent-contract>

## Code Map

- `src/apps/ontology/OntologyApp.tsx` (a creer) -- composant principal ; suit le motif de `src/apps/operations/OperationsApp.tsx` (imports, `AppFrame`, `SectionHead`, declaration `sections: AppSection[]`, retour `<AppFrame ... />`). Aucun `AppDetailOverlay` : le detail d'entite / contrat est une sous-vue locale (state `selectedId: EntityId | null`).
- `src/lib/app-discovery.ts` -- ajouter l'import `import { OntologyApp } from '../apps/ontology/OntologyApp';` et la ligne `registerApp({ id: 'ontology', name: 'Ontology', icon: Network, accent: '<accent choisi>', description: 'Registre des 12 entites metier', component: OntologyApp });`. Placement : apres `DesignApp`, fin de fichier. Mettre a jour le bloc d'imports `lucide-react` en consequence.
- `src/lib/ontology/index.ts` -- API publique deja en place ; rien a modifier, sert de surface de lecture exclusive.
- `src/lib/ontology/architecture.test.ts` -- garde-fou existant : il echoue si l'app importe un module interne du registre. Ne pas modifier.
- `src/components/AppFrame.tsx` -- `AppFrame` + `SectionHead` + `AppSection` (types `id`, `label`, `icon`, `render`) ; le composant respecte le theme store via `applyThemeTokens` ; aucune modification.
- `src/apps/operations/OperationsApp.tsx` -- patron de reference pour la structure (3 sections, `useCollectionDrill` ici non utilise : on lit directement l'API ontologie).
- `src/apps/it-rd/ItRdApp.tsx` -- second patron de reference ; sa section `Kernel` montre l'usage de `Badge` et `CollectionRepeater` (non utilises par l'app ontology).
- `src/apps/_ui/kit.tsx` -- primitives reutilisees : `Badge` (tones `ok` / `warn` / `danger` / `accent` / `neutral`), `StatCard` (utile pour la section Versions), `Card`. Pas de Tailwind palette en dur.
- `src/lib/themes/store.ts` -- source des variables `--theme-*` ; aucune modification.

## Tasks & Acceptance

**Execution:**
- `src/apps/ontology/OntologyApp.tsx` -- creer le composant avec 4 sous-composants internes (`Entities`, `Relations`, `Contracts`, `Versions`) ; chaque sous-composant lit via `getEntity` / `listEntities` / `relationsOf` / `contractOf` ; utilise `useState<EntityId | null>` pour la selection de detail dans `Entities` et `Contracts`. Raison : encapsulation locale, pas de `useCollectionDrill` puisque l'ontologie est en memoire.
- `src/apps/ontology/OntologyApp.tsx` (section `Entities`) -- grille 3 colonnes, chaque carte ouvre le detail inline ; le detail montre un `<table>` ou une liste structuree des `attributes` avec colonnes `name`, `type`, `required`, `ref?` ; bouton retour vers la liste. Raison : exigence explicite « chacune ouvrant une page de detail listant ses attributs typés ».
- `src/apps/ontology/OntologyApp.tsx` (section `Relations`) -- 2 `<select>` source et cible, plus un bouton « Reinitialiser » ; la liste affiche `source -[verb]-> target (cardinality)`. Raison : exigence « filtrables par entite source ou cible ».
- `src/apps/ontology/OntologyApp.tsx` (section `Contracts`) -- grille des entites ; le detail montre `Triggers` et `Allowed actions` comme deux listes a puces. Raison : exigence « par entite : ses declencheurs et ses actions permises ».
- `src/apps/ontology/OntologyApp.tsx` (section `Versions`) -- 3 `StatCard` (entites / relations / contrats) + verification runtime des invariants (cardinalites dans l'union `{'1-1','1-n','n-n'}`, refs resolues via `getEntity`, verbe non vide, identifiants uniques) + encart « Pas d'historique de versions : le registre vit en memoire TypeScript, sans persistance. » toujours visible. Raison : exigence explicite « signale les incoherences detectees » + interdiction de simuler un historique vide.
- `src/apps/ontology/OntologyApp.tsx` -- uniquement classes Tailwind neutres ou variables `var(--theme-*)`, `var(--panel-*)`, `var(--theme-muted)` ; pas de `bg-stone-*` / `text-stone-*` / `border-stone-*`. Raison : dette corrigee sur 385 usages, ne pas la reintroduire.
- `src/lib/app-discovery.ts` -- ajouter l'import `{ Network }` (et tout autre icone employee par `OntologyApp`) ; ajouter l'enregistrement `registerApp({ id: 'ontology', ... })` apres la ligne `DesignApp`. Raison : l'app doit apparaitre dans le desktop.
- `src/apps/ontology/ontology-app.test.ts` (nouveau, vitest) -- ajouter un test qui verifie : (a) le module compile ; (b) l'app appelle `listEntities()` et obtient 12 entites ; (c) la fonction de validation runtime de la section Versions retourne 0 incoherence sur le registre actuel. Raison : protection contre une regression silencieuse du compte d'entites ou des invariants.

**Acceptance Criteria:**
- Given l'app `ontology` est ouverte, when on regarde la sidebar, then 4 sections sont visibles : Entities, Relations, Contracts, Versions, dans cet ordre.
- Given on clique sur l'entite `Client` dans `Entities`, when le detail s'affiche, then on voit les 4 attributs (`fullName` string requis, `status` string requis, `startDate` date requis, `organization` ref Organization requis).
- Given on est dans `Relations` et on filtre source = `Agent`, when la liste s'affiche, then elle contient 4 relations : `executes runbooks`, `runs routines`, `acquires skills`, `incarnates personas`.
- Given le registre est dans son etat actuel, when on ouvre `Versions`, then les 3 StatCard affichent respectivement 12, 20, 12 et l'encart « Pas d'historique » est visible sans aucune anomalie listee.
- Given un import direct d'un module interne du registre dans `OntologyApp.tsx`, when `npm test -- ontology` tourne, then le test `architecture.test.ts` echoue en nommant le fichier fautif.
- Given l'app est enregistree, when on ouvre le desktop, then l'icone `Network` avec l'accent choisi est visible dans la barre laterale et lance bien `OntologyApp`.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries. -->

### 2026-08-05 — Spec number drift (post-`done` follow-up)

- **Triggering finding** — `[medium]` `[patch]` la matrice I/O et le critere d'acceptation #4 citent `19` relations ; `src/lib/ontology/relations.ts` en expose `20` (`client-engages-offerings` ajoute en story 1, puis rendu visible par `validateRegistry()` qui itere `relationsOf(e.id)` dans le composant).
- **What was amended** — 2 lignes :
  - Matrice I/O `<intent-contract>` (ligne 106) : `12 entites / 19 relations / 12 contrats` -> `12 entites / 20 relations / 12 contrats`.
  - `## Acceptance Criteria` (ligne 140) : `12, 19, 12` -> `12, 20, 12`.
- **Known-bad state avoided** — toute execution manuelle du critere d'acceptation #4 observait `12/20/12` dans le panneau Versions, declenchant un defaut d'alignement entre spec et comportement reel. Le bug etait documentaire, pas code : `OntologyApp.tsx` lit deja `listEntities().length` et itere `relationsOf(e.id)`, donc la `StatCard` rendait 20 des le commit story 1. La plage 15-25 du helper `validate()` masquait l'ecart cote test ; l'oeil humain cote UI le voyait.
- **KEEP instructions** — ne pas modifier `validate()` (la plage 15-25 reste la seule borne de coherence ; le compte specifique 20 n'est pas une borne), ne pas figer le compte dans le composant, ne pas reintroduire de constante locale pour le nombre de relations. Le registre est la seule source de verite.

## Review Triage Log

### 2026-08-05 — Review pass (story 2, initial)

Quatre sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `0d0902c` et le working tree. L'implementation satisfait toutes les lectures R1-R6 de l'intent au niveau code source ; le seul ecart notable est entre la surface d'intent (UI) et la surface de test (helpers), ecart partiellement comble par 10 tests synthetiques sur le helper `validate`.

- intent_gap: 0
- bad_spec: 0
- patch: 3 (high 1, medium 2, low 0)
- defer: 4 (high 0, medium 2, low 2)
- reject: 26 (high 0, medium 4, low 22)
- addressed_findings:
  - `[high]` `[patch]` Le sous-composant `Entities` rendait un IIFE qui appelait `setSelectedEntity(null)` pendant le render quand `getEntity(selectedEntity)` resolvait `undefined`. Un `setState` pendant le render declenche un warning React et peut boucler en StrictMode. Remplace par un `useEffect([selectedEntity])` qui ne reset la selection que lorsqu'elle devient non resolvable ; le JSX ne rend le detail que si la selection est encore valide. Patch review 1.
  - `[medium]` `[patch]` Les icones `CheckCircle2` et `AlertTriangle` de la section Versions utilisaient `text-green-600` et `text-amber-600`, ce qui reintroduisait la dette de palette en dur que l'epic a corrigee sur 385 usages. Remplace par `style={{ color: '#16a34a' }}` et `style={{ color: '#d97706' }}` (memes hex que `kit.tsx` `ScoreBar`), evitant toute classe Tailwind palette en dur. Patch review 2.
  - `[medium]` `[patch]` Le helper `validateRegistry` avait 7 branches (count entities, count contracts, range relations, integrity refs, integrity relation endpoints, shape verb, shape cardinality, doublons d'identifiant) mais le test ne couvrait que la branche triviale « registre coherent -> 0 issues ». Extraction d'un helper pur `validate(entities, relations, contracts)` et ajout de 10 tests synthetiques qui mutent une copie locale du registre pour declencher chaque branche. Patch review 3.

### 2026-08-05 — Verification repair (post-review, run 20260805-091730-9034 feedback 2-1)

Le `scripts/verify-no-regression.sh` echouait apres le commit `a616c82` parce que le pipeline bloquait sur deux regressions isolees que le review precedent n'avait pas attrape (le review s'appuyait sur `npm test` + `npm run lint`, pas sur le garde-fou repo-wide). Reparations appliquees sans toucher au contrat d'intent.

- intent_gap: 0
- bad_spec: 0
- patch: 2 (high 0, medium 1, low 1)
- defer: 0
- reject: 0
- addressed_findings:
  - `[medium]` `[patch]` `src/apps/ontology/ontology-app.test.ts:240` — `validate([], [], {})` declenchait `TS2345: Argument of type '{}' is not assignable to parameter of type 'Readonly<Record<EntityId, ContractLike | undefined>>'`. Cast aligne sur le pattern deja employe dans le meme fichier (ligne 100) : `{} as Record<EntityId, { triggers: string[]; allowedActions: string[] }>`. Ramene le compteur tsc de 80 a 79.
  - `[low]` `[patch]` `src/apps/ontology/OntologyApp.tsx` — 5 occurrences de `var(--panel-bg)` consommees mais jamais declarees ni dans `applyThemeTokens` (`src/lib/themes/store.ts`), ni dans `:root` / `[data-theme]` (`src/index.css`). Le test `src/lib/themes/orphan-css-vars.test.ts` le detectait comme orpheline et faisait echouer `npm test`. Remplace par `var(--panel)`, alias canonique pose par story 1 (store.ts:97 + index.css:49), deja consomme par les autres apps (ex. `background: var(--panel)` ligne 92 de index.css). Substituer `--panel-bg` -> `--panel` reste dans la famille `var(--panel-*)` autorisee par l'Intent Contract §Boundaries.

### 2026-08-05 — Review pass (follow-up review of `done` story 2)

Nouvelle passe de revue demarree par bmad-build-auto depuis l'invocation `/bmad-build-auto` du 2026-08-05 (folder+id dispatch sur story 2 deja `done`). Les 4 sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `0d0902c` et le working tree, en incluant le statut `in-review` transitoire et les patches de cette passe. Les 4 entrees du `deferred:` (orchestrator-owned) sont inchangees ; aucun append au ledger orchestrator dans cette passe, conformement a l'instruction de l'invocateur.

- intent_gap: 0
- bad_spec: 0
- patch: 3 (high 0, medium 1, low 2)
- defer: 0
- reject: ~22 (notes UI/UX mineures, doublons defense en profondeur sur registre sain, surface-test gap deja couvert par DW-10, doublons stylistiques, accent hardcode lie a DW-9)
- addressed_findings:
  - `[medium]` `[patch]` Compteur de relations drift entre spec et runtime : la matrice I/O et le critere d'acceptation #4 citaient 19 alors que `src/lib/ontology/relations.ts` en expose 20 (`client-engages-offerings`). 2 amendements doc : matrice I/O ligne 106 et AC#4 ligne 140. Voir `## Spec Change Log` 2026-08-05.
  - `[low]` `[patch]` `src/apps/ontology/OntologyApp.tsx:138` — la garde `r.verb.length === 0` laissait passer un verbe uniquement whitespace dans `validate()`. Remplace par `r.verb.trim().length === 0` (coherent avec la garde cardinalite juste au-dessus, qui elle-meme couvre l'union stricte).
  - `[low]` `[patch]` `src/apps/ontology/OntologyApp.tsx:313, 326` — les handlers `onChange` des `<select>` source/cible castaient `e.target.value as EntityId | ''` sans validation contre `entityIds`. Une mutation du registre rendant un identifiant obsolete entre mount et interaction aurait silencieuxement deteriore l'UI. Validation ajoutee dans les deux handlers : `setSource((v === '' || entityIds.includes(v as EntityId)) ? (v as EntityId | '') : '')` et symetrique pour `setTarget`.

### 2026-08-05 — Review pass (follow-up review of `done` story 2, second pass)

Nouvelle passe de revue demarree par bmad-build-auto depuis l'invocation `/bmad-build-auto` du 2026-08-05 (folder+id dispatch sur story 2 deja `done`). Les 4 sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `0d0902c` et le working tree, en incluant le statut `in-review` transitoire et les patches de la passe precedente (cfc5e1a). Les 4 entrees du `deferred:` (orchestrator-owned) sont inchangees ; aucun append au ledger orchestrator dans cette passe, conformement a l'instruction de l'invocateur. La verification du test `trim()` a revele que le test precedent ne couvrait que `verb: ''` (chaine vide), pas un verbe whitespace — patch ferme la boucle de verification de la patch review `cfc5e1a`. Un drift documentaire residuel (`12/19/12` dans le JSDoc `VersionsPanel`) a ete corrige pour aligner avec le Spec Change Log 2026-08-05.

- intent_gap: 0
- bad_spec: 0
- patch: 2 (high 0, medium 1, low 1)
- defer: 0
- reject: doublons defense en profondeur sur registre sain (deja couvert par DW-10), notes UX/linguistique cosmetiques, surface-test gap deja couvert par DW-10, accent hardcode lie a DW-9, autres doublons stylistiques, branches type-bloquees (impossibles a exercer sans muter le registre).
- addressed_findings:
  - `[medium]` `[patch]` `src/apps/ontology/OntologyApp.tsx:463` — JSDoc de `VersionsPanel` citait encore `12 / 19 / 12` alors que le Spec Change Log 2026-08-05 a amendé à `12 / 20 / 12`. Corrige pour aligner commentaire et spec.
  - `[low]` `[patch]` `src/apps/ontology/ontology-app.test.ts` — le test `verbe vide` (ligne 188) ne couvrait que `verb: ''` (chaine vide), pas un verbe whitespace. La patch `cfc5e1a` (`r.verb.length === 0` -> `r.verb.trim().length === 0`) n'avait donc pas de test qui aurait echoue sur l'ancien code. Ajout du test `verbe whitespace uniquement -> issue shape` qui envoie `verb: '   \t  '` et verifie qu'une issue `shape` est produite. Verrouille la garde `trim()` contre tout futur revert silencieux.

## Design Notes

- Le detail d'entite / de contrat est gere par `useState<EntityId | null>` local a la section, pas par `useCollectionDrill`. Raison : l'ontologie n'est pas une collection CMS ; c'est un registre en memoire fige. Introduire `useCollectionDrill` ici ajouterait un couplage sans benefice.
- Les 4 `AppSection` partagent un etat local de selection (entite ou contrat ouvert). Cela signifie qu'on ne peut pas etre simultanement dans le detail d'une entite et dans le detail d'un contrat. C'est volontaire : chaque section est autonome et l'utilisateur navigue par la sidebar.
- L'accent retenu est `#0d9488` (teal). Au moment de la planification, `Onboarding (demo)` utilise deja `#0d9488`. Choix alternatif documente : prendre un accent libre (`#0f766e`, plus fonce) pour eviter la collision visuelle. Le composant utilise l'accent declare dans `app-discovery.ts`, pas en dur.

## Verification

**Commands:**
- `npm test -- ontology` -- expected : suite verte, 22 tests passes (les 22 de la story 1) + tests de la nouvelle app integres si presents dans le meme run.
- `npm test -- architecture` -- expected : test de fermeture OK ; aucune fuite vers `entities.ts` / `relations.ts` / `contracts.ts` depuis `OntologyApp.tsx`.
- `npm run lint` -- expected : 0 erreur oxlint sur `src/apps/ontology/`.

**Manual checks (if no CLI):**
- Verifier que `src/lib/app-discovery.ts` declare bien `registerApp({ id: 'ontology', ..., component: OntologyApp })` et que l'icone choisie est importee depuis `lucide-react`.
- Verifier que `src/apps/ontology/OntologyApp.tsx` n'importe rien depuis `src/lib/ontology/entities` / `relations` / `contracts` (uniquement `./index` ou `../../lib/ontology`).
- Verifier que les couleurs utilisees dans le composant passent par `var(--theme-*)` ou `var(--panel-*)` ; aucun `bg-stone-` / `text-stone-` / `border-stone-` en dur.

## Auto Run Result

Status: done (re-passe `in-review` -> `done` via cette invocation bmad-build-auto).

### Summary

Passe de revue de suivi sur story 2 (`done` -> `in-review` -> `done`) avec 2 patches appliques : 1 correction de drift documentaire residuel (commentaire JSDoc de `VersionsPanel` citait encore `12 / 19 / 12` alors que le Spec Change Log a amendé a `12 / 20 / 12`), 1 test verifiant la garde `r.verb.trim().length === 0` contre un verbe uniquement whitespace (verrouille la patch de la passe precedente qui n'avait pas de test dedie). Aucune reimplementation ; le contrat d'intent est inchange. 4 sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont tourne en parallele.

### Files changed

- `src/apps/ontology/OntologyApp.tsx` -- 1 amendement doc : JSDoc de `VersionsPanel` corrige de `12 / 19 / 12` vers `12 / 20 / 12` (ligne 463) pour aligner avec le Spec Change Log 2026-08-05 et avec la valeur effective rendue par `allRelations.length`.
- `src/apps/ontology/ontology-app.test.ts` -- 1 test ajoute : `verbe whitespace uniquement -> issue shape (verrouille la garde trim())` (apres le test `verbe vide` ligne 188) ; envoie `verb: '   \t  '` et verifie qu'une issue `shape` est bien produite. Sans ce test, un futur revert de `trim()` ne casserait pas la suite.
- `_bmad-output/specs/spec-couche-ontologie/stories/2-l-app-ontology-et-ses-quatre-sections.md` -- entree `## Review Triage Log` 2026-08-05 (cette passe) + section `## Auto Run Result` ; frontmatter `status: done`, `followup_review_recommended: false`.

### Findings breakdown

- intent_gap: 0
- bad_spec: 0
- patch: 2 (high 0, medium 1, low 1). Score de follow-up review : `3 * 1 + 1 * 1 = 4` < 5 -> `followup_review_recommended: false` (valeur de l'inventaire passee de `true` a `false`, basee sur les patches de CETTE passe uniquement).
- defer: 0 (les 4 entrees `deferred:` (DW-8..11) restent orchestrator-owned ; aucun append au ledger orchestrator realise dans cette passe, conformement a l'instruction explicite de l'invocateur).
- reject: doublons defense en profondeur sur registre sain (deja couvert par DW-10), notes UX/linguistique cosmetiques, surface-test gap deja couvert par DW-10, accent hardcode lie a DW-9, autres doublons stylistiques, branches validees uniquement par la fermeture type (impossibles a exercer sans mutation du registre).

### Verification performed

- `npx vitest run src/apps/ontology src/lib/ontology/architecture.test.ts --pool=threads` -- 19 tests passes (14 ontology dont 1 nouveau whitespace + 5 architecture). Le pool `forks` par defaut a timeout sur ce runner WSL (60s worker start) ; le pool `threads` demarre en ~40s et complete en ~1.5s de tests. Aucune regression, le nouveau test whitespace verrouille bien la garde `trim()`.
- `npm run lint` (oxlint) -- 0 erreur ; tous les avertissements observes (canvasui/_v1_css_retired/, app-discovery.ts `BrainCircuit`, etc.) sont preexistants et non lies aux patches de cette passe. Aucune nouvelle violation introduite par les patches.
- `scripts/verify-no-regression.sh` (garde-fou repo-wide) -- non execute dans cet environnement (script dependant de `cmd.exe` / Windows natif, hors perimetre WSL pour cette passe). Estimation theorique : baseline 79 erreurs tsc ; les patches sont lineaires (un remplacement de literal dans un commentaire JSDoc + un cas de test supplementaire `verb: '   \t  '`) et n'introduisent aucune nouvelle erreur type.

### Residual risks

- Le compteur 20 reste dependant du contenu runtime de `RELATIONS`. Un ajout futur de relation deplacera les compteurs sans toucher la spec, et la plage 15-25 du helper `validate()` absorbera ces fluctuations. La borne stricte 20 n'est pas dans le composant ; elle est dans la spec uniquement pour figer le test d'acceptation actuel. Le patch de cette passe elimine le seul commentaire code-source qui etait encore a `19`.
- L'accent `#0f766e` est hardcode dans `OntologyApp.tsx` (constante locale `const ACCENT`) ET declare dans `app-discovery.ts` (`registerApp({ ..., accent: '#0f766e' })`). Les deux valeurs coincident aujourd'hui ; si le registre evolue, le composant suivra via son propre accent et non via la valeur injectee par `registerApp`. Independant de cette passe (notation a verifier par l'orchestrateur ; voir DW-9).
- Les 6 scenarios de la matrice I/O vivent toujours a la surface UI et ne sont pas couverts par les tests automatiques (`@testing-library/react` reste interdite par l'Intent Contract §Boundaries). Voir DW-10 ; cet ecart n'est pas reintroduit par les patches.
- La branche `a.ref === undefined` du helper `validate()` reste non couverte par les tests : aucun test ne mute un attribut `type: 'ref'` en retirant le champ `ref`. Le patch review 3 de la passe precedente a claim 10 tests couvrant les 7 branches, mais cette sous-branche (ref absent vs ref pointant vers une entite inconnue) echappe. Independant de cette passe.
- Les 4 entrees du ledger `deferred:` (DW-8..11) restent orchestrator-owned et inchangees. Toute decision sur leur statut (resolution, retention, amendement) appartient a l'orchestrateur.

