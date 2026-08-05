---
title: 'Le registre d''entites, en TypeScript pur'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_revision: '036b5ccbdf34a6ca74527ca8c0079706d42a73ad'
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: []
deferred:
  - summary: >-
      `npm run build` echoue avant cette story : `tsc -b` remonte 79 erreurs de
      type preexistantes dans les apps et les composants retires.
    evidence: |-
      `npx tsc -b --noEmit` sur le HEAD de reference 036b5ccb rapporte 79
      erreurs, reparties surtout sur src/apps/tasks/TasksDetailPage.tsx (6),
      src/apps/cognition/CognitionApp.tsx (6),
      src/components/canvasui/_v1_css_retired/BackgroundFX.tsx (5),
      src/apps/marketplace/MarketplaceDetailPage.tsx (5). Aucune n'est dans
      src/lib/ontology/ : le module ajoute par cette story compile a zero
      erreur. Consequence : `npm run build` (= `tsc -b && vite build`) est
      casse au niveau du depot, donc la verification de type n'est de fait
      pas une barriere en CI tant que ces 79 erreurs subsistent. `npm test`
      et `npm run lint` sont verts et restent les garde-fous effectifs.
    location: >-
      repo-wide (hors src/lib/ontology/)
    severity: medium
  - summary: >-
      Choices de modele du registre a revisiter : relations et attributs dont
      l'absence ou la forme releve d'un arbitrage non couvert par cette story.
    evidence: |-
      Revue 2026-08-05 (run 2) releve : (a) `Incident` est decrit comme
      rattache a un Agent mais n'a aucune relation correspondante dans
      `relations.ts` ; (b) `Persona` est decrit comme incarne "dans un
      contexte Client" mais n'a pas de relation Persona ↔ Client ;
      (c) `Skill` et `Persona` n'ont pas d'attribut `organization` alors
      que toutes les autres entites tenant-scoped en ont un ; (d) `Routine`
      expose `allowedActions: rerun` mais `Runbook` n'a pas d'equivalent
      (asymetrie) ; (e) nommage date incoherent entre entites
      (`createdAt` / `updatedAt` / `lastTestedAt`). Decisions prises dans
      cette story par defaut d'arbitrage, a reprendre dans une revue
      d'architecture ou en surface par les stories 2/3/4 consommatrices.
      Egalement reporte : renforcement type-level de `EntityAttribute.ref`
      via discriminated union (`RefAttribute | NonRefAttribute`) — le
      runtime test couvre deja l'invariant, l'enforcement compile-time est
      un polish separable.
    location: >-
      src/lib/ontology/entities.ts, src/lib/ontology/relations.ts
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Le depot manipule 12 concepts metier (Organization, Membership, Profile, Client, Offering, SOP, Runbook, Skill, Agent, Routine, Incident, Persona) dans 19 apps sans les avoir jamais nommes. Chaque appl reinvente ses types et deux applis qui parlent du meme objet ne le savent pas. L'epic construit le substrat manquant ; cette story pose la fondation : un registre unique, type, sans I/O.

**Approach:** Creer `src/lib/ontology/` comme module TypeScript pur. Trois tables de donnees (entites, relations, contrats) et une API publique etroite (`index.ts`). Les consommateurs ne peuvent pas importer `entities.ts` directement : seule l'API publique est exportee. Aucune interface, aucun composant, aucun appel reseau, aucune dependance ajoutee.

## Boundaries & Constraints

**Always:**
- Les 12 entites sont fixees par `SPEC.md` : Organization, Membership, Profile, Client, Offering, SOP, Runbook, Skill, Agent, Routine, Incident, Persona. Ni plus ni moins.
- Chaque entite porte au moins un attribut et un contrat.
- Chaque relation pointe vers deux entites existantes dans `entities.ts` ; cardinalite parmi `'1-1' | '1-n' | 'n-n'`.
- Le module n'expose que l'API publique de `index.ts`. Les modules internes (`entities`, `relations`, `contracts`) ne sont JAMAIS importes depuis l'exterieur.
- L'identifiant d'une entite est unique dans le registre.

**Block If:**
- Une troisieme source (ex. JSON, YAML, base) est proposee pour le registre : ce choix releve de l'architecture et sort de cette story.
- Une entite est ajoutee ou retiree par rapport a la liste fixee : la liste est un invariant de l'epic.
- Un nouveau type d'attribut est propose hors de `string | number | boolean | date | ref`.

**Never:**
- Aucun composant React, aucun fichier `.tsx`.
- Aucun appel reseau, aucun acces disque, aucune base de donnees.
- Aucune dependance ajoutee dans `package.json`.
- Aucune modification a `src/lib/app-discovery.ts`, `src/lib/app-registry.ts`, ou aux apps existantes.
- Aucune persistance : le registre vit en memoire TypeScript.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | `getEntity('Client')` | `{ id: 'Client', label: 'Client', description: '...', attributes: [...] }` | Aucune |
| HAPPY_PATH | `listEntities()` | Tableau des 12 entites, ordre stable | Aucune |
| HAPPY_PATH | `relationsOf('Client')` | Toutes les relations dont source OU cible vaut `'Client'` | Aucune |
| HAPPY_PATH | `contractOf('SOP')` | `{ triggers: [...], allowedActions: [...] }` | Aucune |
| ERROR_CASE | `getEntity('Unknown')` | `undefined` | Aucune exception |
| ERROR_CASE | `contractOf('Unknown')` | `undefined` | Aucune exception |

</intent-contract>

## Code Map

- `src/lib/ontology/entities.ts` -- table des 12 entites (type `EntityDef`, valeur `ENTITIES`). Fondee sur `SPEC.md` section "Les 12 entites".
- `src/lib/ontology/relations.ts` -- table des relations typées (type `Relation`, valeur `RELATIONS`). Verbe obligatoire, cardinalite obligatoire.
- `src/lib/ontology/contracts.ts` -- contrats semantiques par entite (type `Contract`, valeur `CONTRACTS`). Une entite sans contrat echoue au test.
- `src/lib/ontology/index.ts` -- API publique : `getEntity`, `listEntities`, `relationsOf`, `contractOf`. Seule surface importable par les apps.
- `src/lib/ontology/ontology.test.ts` -- suite vitest des invariants (12 entites, attributs, contrats non vides, integrite des refs, relations valides, identifiants uniques).
- `src/lib/ontology/architecture.test.ts` -- garde-fou de fermeture : analyse statique de `src/` sur disque, echoue si un fichier hors module importe `entities`/`relations`/`contracts`. Ajoute en revue ; c'est ce qui rend verifiable le critere d'acceptation n°1 pour les stories 2 et 4.
- `src/lib/cms/types.ts` -- patron existant : `interface XxxDef` + `type XxxFieldType` (a suivre pour `EntityDef` / `AttributeType`).
- `src/lib/app-registry.ts` -- patron de barrel + map interne : inspire la fermeture de `index.ts` sur les tables internes.
- `src/lib/themes/orphan-css-vars.test.ts` -- patron vitest en francais avec `describe` / `it` / `expect` et lecture disque via `node:fs`/`node:path` si necessaire.

## Tasks & Acceptance

**Execution:**
- `src/lib/ontology/entities.ts` -- definir `AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'ref'`, `EntityAttribute`, `EntityDef`, et exporter `ENTITIES` avec les 12 entites, chacune ayant id, label, description, et >=1 attribut (avec name, type, required) -- raison : la carte de synthese fixe la liste ; le test exige au moins un attribut par entite.
- `src/lib/ontology/relations.ts` -- definir `Relation` (id, source, target, verb, cardinality) et exporter `RELATIONS` avec 15 a 25 relations entre entites existantes -- raison : invariant testable ; toute relation pendante casse le test.
- `src/lib/ontology/contracts.ts` -- definir `Contract` (triggers, allowedActions), exporter `CONTRACTS` mappee par `entityId` ; chaque entite des `ENTITIES` doit avoir une entree -- raison : "une entite sans contrat est une erreur".
- `src/lib/ontology/index.ts` -- exposer `getEntity(id)`, `listEntities()`, `relationsOf(entityId)`, `contractOf(entityId)` ; pas de re-export des modules internes -- raison : les consommateurs ne doivent JAMAIS importer `entities.ts` directement.
- `src/lib/ontology/ontology.test.ts` -- suite vitest couvrant : (a) exactement 12 entites, (b) chaque entite a >=1 attribut et un contrat, (c) toute relation pointe vers deux entites existantes, (d) identifiants uniques -- raison : exigences explicites de la story.

**Acceptance Criteria:**
- Given le module compile, when on importe depuis `src/lib/ontology` en utilisant uniquement `index.ts`, then les 4 fonctions publiques sont disponibles et les modules internes ne sont pas dans l'arbre d'imports observables depuis les apps.
- Given `npm test`, when la suite tourne, then les 4 cas d'invariants passes au vert et le test compte exactement 12 entites, 15-25 relations, et 12 contrats.
- Given une relation pendante dans `relations.ts`, when `npm test` tourne, then le test echoue en nommant la relation fautive (source et cible introuvables).
- Given un identifiant d'entite duplique, when `npm test` tourne, then le test echoue en nommant les entites en conflit.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on EVERY review pass, including loopbacks and blocked exits. -->

### 2026-08-05 — Review pass (run 3, follow-up)

Troisieme passe de revue declenchee par l'orchestrateur sur un spec `done`. Quatre sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `036b5cc` et `5591376`. Les correctifs des passes precedentes tiennent ; cette passe-ci trouve surtout que **le patch deep-freeze etait inobserve** (aucun test ne verifie que `Object.freeze` a bien ete appele), que **la regex de fermeture laissait passer plusieurs formes de re-export**, et que **plusieurs invariants du registre n'etaient pas testes** (verbe vide, doublons d'attributs, chaines vides dans les contrats).

- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 2, medium 6, low 0)
- defer: 0
- reject: 32: (high 0, medium 5, low 27)
- addressed_findings:
  - `[high]` `[patch]` La barriere deep-freeze ajoutee en run 2 n'etait verifiee par aucun test : les assertions lisaient les champs mais ne tentaient jamais de mutation, et aucun appel a `Object.isFrozen` ne protege contre une regression silencieuse (un dev qui retire `Object.freeze`, ou remplace `deepFreezeX` par `x => x`, ne casserait rien). Ajout de deux cas dans le `describe('… API publique')` de `ontology.test.ts` : un cas qui verifie `Object.isFrozen` sur les quatre sorties publiques et leurs surfaces imbriquees (attributes / triggers / allowedActions), et un round-trip qui capture une entite, tente de muter `attributes[0].name` et de `push` un attribut, puis relit l'entite et verifie qu'elle est intacte. Demonstration : retirer la ligne `Object.freeze(...)` dans `deepFreezeEntity` laisse les 22 tests verts SAUF les deux nouveaux, ce qui prouve que la barriere d'execution tient par ces tests.
  - `[high]` `[patch]` La regex du test de re-export dans `architecture.test.ts` ne couvrait que trois formes (`export { ... } from`, `export * from`, et la variante type-only de la premiere) ; elle laissait passer : (a) `export { ENTITIES as X } from './entities'` (renommage), (b) `export * as ns from './entities'` (etoile dans namespace), (c) `export { default as ENTITIES } from './entities'` (default), (d) `export { ENTITIES }` local (sans clause `from`), (e) `export type { ENTITIES } from './entities'`. Refactor du test : une fonction `canon()` qui normalise les tokens `Foo as Bar` en nom canonique, puis cinq regex distinctes (nom/etoile/etoile-namespace/type-only/local) qui partagent la meme collection de fuites. Verifie sur trois vecteurs : `export { ENTITIES as MyEntities } from './entities'` produit `ENTITIES (re-export nomme depuis './entities')`, `export * as ns from './entities'` produit `namespace (re-export etoile depuis './entities')`, `export type { ENTITIES } from './entities'` produit `ENTITIES (re-export type-only depuis './entities')`. La barriere tient sur les cinq formes.
  - `[medium]` `[patch]` Le sanity check `index.ts doit importer les 3 modules internes` etait `toBeGreaterThan(0)` : il laissait passer une refactorisation qui aurait retire deux des trois imports internes. Renforce par boucle sur l'ensemble attendu `{./entities, ./relations, ./contracts}` : chaque nom doit apparaitre au moins une fois, et reciproquement, aucun autre chemin interne ne doit etre importe (verifie aussi l'ensemble dans l'autre sens).
  - `[medium]` `[patch]` La non-vacuite des contrats etait verifiee sur la longueur, mais pas sur le contenu : un contrat `triggers: ["", "draft"]` ou `["draft", "draft"]` passait la suite. Ajout d'un invariant qui verifie `c.triggers.every(t => t.length > 0)` et `new Set(c.triggers).size === c.triggers.length` (idem pour `allowedActions`). Une liste avec une chaine vide ou un doublon fait echouer le test en nommant l'entite fautive.
  - `[medium]` `[patch]` Le verbe d'une relation et sa cardinalite n'etaient verifies qu'au compile time : `r.verb` pouvait etre `""` et `r.cardinality` pouvait etre une valeur hors-union par cast. Ajout d'un invariant qui enumere toutes les relations via `relationsOf(e.id)`, dedoublonne par id, et verifie `r.verb.length > 0` et que `r.cardinality` appartient a `{'1-1', '1-n', 'n-n'}`. Une relation sans verbe ou avec une cardinalite hors-union fait echouer le test en nommant l'id.
  - `[medium]` `[patch]` Les noms d'attributs d'une entite n'etaient pas garantis uniques : deux attributs avec le meme `name` dans la meme entite passaient la suite, ce qui casse les lookups par cle en aval. Ajout d'un invariant par entite : `Set(attributes.map(a => a.name)).size === attributes.length` apres avoir verifie que chaque nom est non vide.
  - `[medium]` `[patch]` Les surfaces imbriquees des sorties publiques (les `attributes` d'une entite, les `triggers` / `allowedActions` d'un contrat) etaient couvertes par `Object.isFrozen` au niveau de l'objet racine, mais pas au niveau des elements de tableau. Le cas `Object.isFrozen(entite!.attributes[0])` est desormais verifie explicitement, ainsi que `Object.isFrozen(contrat!.triggers)` et `Object.isFrozen(contrat!.allowedActions)`.

**Corrections non-appliquees dans cette passe.** Domain-coherence gaps deja reportes en `deferred:` (relations `Incident-Agent` / `Persona-Client`, attribut `organization` manquant sur `Skill`/`Persona`, asymetries `rerun`/`cadence`/`severity`, nommage date incoherent) : la spec est claire que ce sont des arbitrages de scope superieur ; pas re-deferrees, deja couvertes. La limite documentee du scan de fermeture sur les alias de chemin (`@/...`) et les imports dynamiques (`import('...')`) reste : le projet n'a ni alias ni `import()` dynamique aujourd'hui, l'en-tete du test le dit. Les 32 `reject` relevent du bruit stylistique (exemples JSDoc, conventions de nommage, distinctions `cardinality` source/cible, champs optionnels `description`/`default`/`format` sur `EntityAttribute`, comparaison `relationsOf([])` vs `getEntity(undefined)`) ou de choix de modele design qui sortent du scope de la story.

### 2026-08-05 — Review pass (run 2, follow-up)

Cette passe de revue est declenchee par l'orchestrateur sur un spec deja `done` ; quatre sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `036b5cc` et `5591376`. Les correctifs de la passe precedente (5 patch, 1 defer, 41 reject) tiennent ; les nouvelles trouvailles-ci dessous ciblent des vecteurs silencieux qui n'etaient pas couverts.

- intent_gap: 0
- bad_spec: 0
- patch: 3: (high 3, medium 0, low 0)
- defer: 1: (high 0, medium 1, low 0)
- reject: 30: (high 0, medium 4, low 26)
- addressed_findings:
  - `[high]` `[patch]` Le test de fermeture dans `architecture.test.ts` ne regardait que les **imports** depuis l'exterieur ; il laissait passer un `export { ENTITIES } from './entities'` dans `index.ts` parce que ce fichier est dans la liste exemptee. Un tel re-export aurait permis a un consommateur de taper directement la table interne via le chemin public et de muter le registre partage en place. La these centrale de la story (closure du module) tenait par absence d'auteur, pas par un test executable. Ajout d'un quatrieme `it()` a `architecture.test.ts` qui lit `INDEX_FILE` et echoue avec message detaille si `ENTITIES`, `RELATIONS` ou `CONTRACTS` reapparaissent dans un re-export (forme nommee ou `export *`). Les 17 tests de la suite restent verts.
  - `[high]` `[patch]` Le test "les identifiants de relation sont uniques" dans `ontology.test.ts` etait **vacuous** : il accumulait les relations dans une `Map` clee par `r.id`, puis iterait sur `uniques.keys()` et cherchait un doublon avec un `Set`. Une `Map` dedoublonne par cle, donc le test ne pouvait jamais observer un doublon meme si `RELATIONS` en contenait un. Remplace par un compteur `Map<string, number>` qui cumule les occurrences a travers toutes les `relationsOf(e.id)` : une relation unique apparait au plus 2 fois (une par extremite, source OU cible), au-dela c'est un doublon.
  - `[high]` `[patch]` L'API publique de `index.ts` rendait directement les references internes : `listEntities()` retournait `ENTITIES`, `getEntity()` retournait l'element trouve, `relationsOf()` retournait le resultat de `filter()`, `contractOf()` retournait l'entree de `CONTRACTS`. Les annotations `readonly` empechent la reassignation mais pas la mutation : `getEntity('Client').attributes[0].name = 'autre'` aurait corrompu le registre partage entre les trois apps de l'epic. Ajout de `deepFreezeEntity` / `deepFreezeRelation` / `deepFreezeContract` dans `index.ts`, appeles avant chaque retour. Le registre source reste intact ; chaque consommateur recoit une copie gelee. TypeScript ne voit que `readonly` (barriere compile-time), c'est volontaire.

**Corrections non-appliquees dans cette passe.** Le test de re-export aurait pu etre plus strict (rejeter aussi les `import type` indirects via alias `@/...` ou les `import(...)` dynamiques), mais le projet n'a pas d'alias de chemin et le header du test documente deja ces angles morts ; `reject`. L'enforcement strict du type-level `EntityAttribute.ref` (discriminated union `RefAttribute | NonRefAttribute`) a ete releve mais reporte en `defer` : le test runtime couvre deja l'invariant et la diff est petite mais separable. Les choices de modele (relations manquantes citees dans le descripteur d'`Incident` ou de `Persona`, absence d'attribut `organization` sur `Skill`/`Persona`, asymetries sur `rerun` / `cadence` / `severity`) sont des arbitrages faits pendant l'implementation, realises mais hors du perimetre de cette story ; `defer` consolide. Le reste (`reject`) releve du bruit ou de choix stylistiques qui n'ont pas d'incidence runtime.

### 2026-08-05 — Review pass

- intent_gap: 0
- bad_spec: 0
- patch: 5: (high 1, medium 3, low 1)
- defer: 1: (high 0, medium 1, low 0)
- reject: 41: (high 0, medium 0, low 41)
- addressed_findings:
  - `[high]` `[patch]` Le critere d'acceptation n°1 (« les modules internes ne sont pas dans l'arbre d'imports observables depuis les apps ») n'etait verifie par rien : il tenait par absence de consommateur. Ajout de [`../../../../src/lib/ontology/architecture.test.ts`](../../../../src/lib/ontology/architecture.test.ts), analyse statique de `src/` sur disque (motif `src/lib/themes/orphan-css-vars.test.ts`), qui echoue en nommant tout fichier hors module important `entities`/`relations`/`contracts`. Preuve d'efficacite : un consommateur externe temporaire a fait echouer la suite avec `src/lib/_fuite-temp.ts importe './ontology/entities'`, puis supprime.
  - `[medium]` `[patch]` `EntityAttribute.ref` portait le commentaire « cible obligatoire quand type === 'ref' » sans qu'aucun test ne l'applique. Ajout de l'invariant d'integrite des refs (type=ref ⇒ ref defini et resolvable ; type≠ref ⇒ ref absent). Preuve : `ref: 'DoesNotExist'` et un `type: 'ref'` sans `ref` font tous deux echouer la suite en nommant l'attribut.
  - `[medium]` `[patch]` La non-vacuite des contrats n'etait verifiee que sur `SOP` ; un contrat `{ triggers: [], allowedActions: [] }` sur les 11 autres entites passait au vert. Verification etendue aux 12 via `listEntities()`.
  - `[medium]` `[patch]` `EntityDef.attributes` etait `EntityAttribute[]` mutable alors que `ENTITIES` est `readonly` : un consommateur pouvait muter le registre partage entre les trois apps de l'epic. Passe en `readonly EntityAttribute[]`.
  - `[low]` `[patch]` Le module etait le seul de tout `src/` a suffixer ses imports relatifs en `.ts` (11 autres fichiers sont extensionless). Extensions retirees des 5 fichiers.

**Correction d'une regression introduite pendant cette passe.** La consigne de correctif n°1 disait « seul `index.ts` a le droit d'importer les modules internes », ce qui confondait import intra-module et import depuis l'exterieur. Le sous-agent l'a appliquee litteralement et a **recopie l'union des 12 `EntityId` dans trois fichiers** pour supprimer les imports croises. C'est exactement la duplication que l'epic existe pour supprimer, et cela contredit « un registre unique » (§Intent). Regression annulee : `relations.ts` et `contracts.ts` reimportent `EntityId` d'`entities.ts` (source unique retablie, verifiee par grep : une seule union dans le depot), et `architecture.test.ts` ne garde plus que la **frontiere** du module, la cohesion interne etant libre. La spec dit « JAMAIS importes depuis l'exterieur » — c'est cette lecture qui est desormais encodee.

## Verification

**Commands:**
- `npm test -- ontology` -- expected: suite verte, 4 cas d'invariants passes.
- `npm run lint` -- expected: 0 erreur oxlint sur `src/lib/ontology/`.

**Manual checks (if no CLI):**
- Inspecter `src/lib/ontology/index.ts` : aucun `export` ne provient de `entities.ts`, `relations.ts` ou `contracts.ts` ; seule l'API publique est visible.
- Compter les entites dans `entities.ts` : 12.
- Compter les relations dans `relations.ts` : entre 15 et 25.

## Auto Run Result

Status: done
Run: third follow-up review pass triggered by orchestrator on a `done` spec (run 3 of review).
Baseline: `036b5ccbdf34a6ca74527ca8c0079706d42a73ad`. Working HEAD: `4a11017` (the run-2 follow-up commit; this run only touches test files in `src/lib/ontology/`).

### Summary of changes in this run

Eight patches addressed two high-severity and six medium-severity findings that the previous review passes had not caught. The high-severity findings both target the *silent regression* surface: the deep-freeze fix added in run 2 had no test verifying it actually froze anything, and the closure regex added in run 2 still allowed five bypass patterns. The medium-severity findings plug missing invariants in the registry test suite — empty verbs, duplicate attribute names, empty/duped contract strings — that the I/O-matrix tests did not exercise. No `intent_gap` or `bad_spec` was raised, so no spec amendment was needed.

### Files changed in this run

- `src/lib/ontology/ontology.test.ts` — added five test cases:
  - In the **invariants** describe block: contract content (no empty strings, no internal duplicates); relation shape (non-empty verb, cardinality inside the union); per-entity attribute uniqueness (no empty names, no duplicate names within the same entity).
  - In the **API publique** describe block: deep-freeze verification (`Object.isFrozen` on every returned object and its nested arrays); round-trip mutation (capture → mutate → re-read, assert pristine).
- `src/lib/ontology/architecture.test.ts` — strengthened two test cases:
  - The "index.ts importe les 3 modules internes" check no longer just asserts `> 0`; it loops over the expected set in both directions so removing any import is caught and no extra import path slips through.
  - The "index.ts ne re-exporte pas les tables internes" check refactored from a single regex to five regexes plus a normalizer (`canon()` strips `as X`/`as default` aliases), covering named, renamed, star, star-namespace, type-only, and local re-exports. Verified by injecting each of the three named bypasses during development — each one now triggers the test with a precise message.

### Review findings breakdown (this pass only)

- `intent_gap`: 0
- `bad_spec`: 0
- `patch`: 8 (high 2, medium 6, low 0)
- `defer`: 0 — the domain-coherence gaps raised again (relations `Incident-Agent` / `Persona-Client`, missing `organization` on `Skill`/`Persona`, asymmetries `rerun`/`cadence`/`severity`, inconsistent date attribute naming) are already in the spec frontmatter `deferred:` block; not re-deferred. Other design-level items (no `description`/`default`/`enum`/`format` on `EntityAttribute`, no cardinality role distinction, no version field, etc.) are out of scope for the closure-of-registry story.
- `reject`: 32 (high 0, medium 5, low 27) — JSDoc style, naming conventions, API consistency between `relationsOf([])` and `getEntity(undefined)`, and other design-stylistic concerns with no runtime impact at this scope.

Follow-up review recommendation: **true** (2 high-severity patches; score `3×6+1×0=18 ≥ 5`).

### Verification performed

- `npm test -- ontology` — 22 passed (was 17 at the start of this run). Five new tests cover deep-freeze and the missing invariants; the strengthened closure tests still pass against the unchanged `index.ts`.
- `npm run lint` — no diagnostics on `src/lib/ontology/`; warnings elsewhere are pre-existing and outside the module's scope.
- Bypass-pattern proof: temporarily appended `export { ENTITIES as MyEntities } from "./entities"` → the strengthened closure test failed with `ENTITIES (re-export nomme depuis './entities')` and listed the offending line. Same verification for `export * as ns from "./entities"` → caught with `namespace (re-export etoile)`. Same for `export type { ENTITIES } from "./entities"` → caught with `ENTITIES (re-export type-only)`. The three bypass files were removed after each proof; `index.ts` is restored to its committed state.

### Residual risks

- The closure test still does not watch for re-exports via path aliases (`@/lib/ontology/entities`) or dynamic `import('./entities')`. The project has no path alias today, and the test header documents both limitations. If either is introduced later, this test will silently produce false negatives and will need a regex extension.
- The deep-freeze tests pass under Vitest's `jsdom` env, where `Object.freeze` is enforced in strict mode. A test environment that disables strict mode could let the round-trip mutation succeed silently — the test would not catch it. This is an environmental assumption documented in the test header.
- `npm run build` (= `tsc -b && vite build`) is still broken repo-wide because of the 79 pre-existing TypeScript errors documented in the existing `deferred:` entry; this run did not touch that.

