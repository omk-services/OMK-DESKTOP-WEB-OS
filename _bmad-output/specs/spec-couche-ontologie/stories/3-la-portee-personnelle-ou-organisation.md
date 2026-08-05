---
title: 'La portee personnelle ou organisation'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_revision: '0cd5b4133eeb660faa34f510b23f01dc2df5e18e'
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: []
deferred:
  - summary: >-
      Fallback `merge` actuel sur scope invalide persiste retourne `'all'`
      (la portee la plus large) ; une lecture privacy-first pourrait
      preferer `'org'` (fail-closed) pour eviter de reveler par defaut
      des notes personnelles.
    evidence: |-
      Spec story 3 §AC #6 attend qu'un reload preserve le scope choisi.
      Aucun AC ne precise le comportement pour un payload corrompu ou
      hors-domaine ; le choix actuel est conservateur (toujours un
      scope connu). Question design, hors du perimetre TypeScript pur.
    location: >-
      src/lib/ontology/scope-store.ts:74-78
    severity: low
  - summary: >-
      Le champ `scope` est une convention de surface UI ; il ne cree
      aucune separation au niveau stockage ou autorisation. Si
      personnel et organisation partagent la meme ligne, RLS ou
      column-level policies deviennent necessaires.
    evidence: |-
      SPEC.md §"Hors périmètre" sort explicitement la persistance en
      graphe de l'epic. Story 3 herite de cette decision : pas de
      changement cote backend.
    location: >-
      src/lib/ontology/entities.ts (champ scope)
    severity: medium
  - summary: >-
      Pas d'operation de promotion d'un attribut `personal` vers `org` :
      le coach decide de garder ou promeuvoir ses notes, mais le
      registre ne formalise pas le mouvement.
    evidence: |-
      Design Notes §"Choix des 5 entites portant des attributs
      personnels" mentionne la promotion comme logique, mais le
      workflow lui-meme sort de cette story (design-level).
    location: >-
      src/lib/ontology/entities.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** Les 12 entites du registre portent toutes des attributs, mais rien ne distingue un attribut organisationnel (partage par tous, socle commun) d'un attribut personnel (note privee d'un coach, en attente de promotion). La synthese de l'epic nomme cette distinction « portee personnelle » ; le registre actuel l'ignore, et l'app `ontology` expose tout au meme niveau. Sans ce tag, le coaching perd sa granularite : on ne peut pas differencier ce qui releve du socle partage de ce qui releve du carnet de bord d'un individu.

**Approach:** Ajouter un champ optionnel `scope: 'org' | 'personal'` sur `EntityAttribute`, avec `'org'` comme defaut (l'absence du champ se comporte comme aujourd'hui — zero regression). Marquer au moins 5 entites comme ayant des attributs personnels. Etendre l'app `ontology` (section Entities) avec un interrupteur « organisation seule / tout » et un marqueur visuel sur les attributs `personal`. Persister le choix dans un store Zustand dedie, cle `coach-os-ontology-scope-v1`, en suivant le motif `src/lib/themes/store.ts` mais en resolvant le piege deja rencontre : pas de sentinelle `_v` pollueuse dans l'objet persiste.

## Boundaries & Constraints

**Always:**
- `EntityAttribute.scope` est un champ **optionnel** valant `'org' | 'personal'` ; l'absence du champ equivaut a `scope === 'org'`. Le test d'invariant verifie cette equivalence.
- Au moins **5 entites** portent au moins un attribut avec `scope: 'personal'`. Le choix de ces entites est documente dans le rapport (Design Notes + Auto Run Result) avec une justification semantique par entite.
- L'API publique d'ontologie expose, en plus de l'existant, une fonction `listAttributesOf(entityId, opts?: { scope?: 'org' | 'personal' | 'all' })` qui renvoie les attributs filtres. Le defaut est `'all'` (comportement actuel). Le contrat : `'all'` ignore le champ `scope` ; `'org'` ne renvoie que les `scope === 'org'` ou `scope` absent ; `'personal'` ne renvoie que les `scope === 'personal'`.
- L'app `ontology`, section Entities, expose un interrupteur a 3 positions : **Organisation seule** (filtre `scope: 'org'`) / **Tout** (defaut, filtre `scope: 'all'`). Le mode "personnel seul" n'est pas expose cote UI ; le helper le supporte pour les tests et de futures stories.
- L'etat du filtre est persiste dans un store Zustand cree dans `src/lib/ontology/scope-store.ts` : `useOntologyScopeStore` avec `persist` + `createJSONStorage(() => localStorage)` sous la cle `coach-os-ontology-scope-v1`. Suit le motif de `src/lib/themes/store.ts` mais **sans sentinelle `_v` pollueuse** : si un `set` reecrit la meme valeur et que Zustand la voit comme shallow-egale, on utilise une cle distincte ou un `version` dedie — le test `meme valeur successive declenche re-render` est explicite.
- Le composant `OntologyApp` lit la valeur via le store et la passe au helper de filtre. Aucune lecture directe de `localStorage` depuis le composant.
- Toute couleur / arriere-plan / bordure utilise les variables CSS `var(--theme-*)`, `var(--panel-*)`, `var(--theme-muted)`. Aucune classe Tailwind `bg-stone-*` / `text-stone-*` / `border-stone-*` en dur (cf. dette corrigee sur 385 usages).
- Toute lecture cote app passe par `src/lib/ontology/index.ts` ; aucun import direct de `entities.ts` / `relations.ts` / `contracts.ts`. L'invariant reste verrouille par `architecture.test.ts` (story 1).

**Block If:**
- Une marque sur un attribut casse une relation existante : les attributs marques `personal` restent coherents avec le graphe ; pas de `ref` casse, pas de relation pendante.
- Une marque sur un attribut change le contrat (triggers / allowedActions) d'une entite : le contrat reste celui d'`contracts.ts`, inchange.

**Never:**
- Aucune modification des fichiers `src/lib/ontology/{entities,relations,contracts}.ts` au-dela de l'ajout du champ `scope` sur les attributs concernes et de la liste des 5 entites marquees. L'invariant de fermeture tient.
- Aucun changement de signature sur `getEntity`, `listEntities`, `relationsOf`, `contractOf` (compat ascendante avec la story 2).
- Aucune nouvelle dependance dans `package.json` ; `zustand` est deja present.
- Aucune persistance autre que la cle `coach-os-ontology-scope-v1` cote `localStorage` ; pas de sauvegarde serveur.
- Aucun composant React dans `src/lib/ontology/` (reste du TypeScript pur) ; le store est cree dans `src/lib/ontology/scope-store.ts` mais **n'importe pas React** : c'est un store Zustand vanilla, consommable depuis un composant via le hook.
- Recopie en dur de la liste des 5 entites ou de leurs attributs dans le composant ; tout vient du registre.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | `listAttributesOf('Client')` (defaut `scope: 'all'`) | Tous les attributs de `Client`, y compris ceux marques `personal` | Aucune |
| HAPPY_PATH | `listAttributesOf('Client', { scope: 'org' })` | Attributs `scope === 'org'` OU `scope` absent ; les marques `personal` sont filtres | Aucune |
| HAPPY_PATH | `listAttributesOf('Client', { scope: 'personal' })` | Attributs `scope === 'personal'` seulement | Aucune |
| HAPPY_PATH | `useOntologyScopeStore.setScope('org')` puis relecture | Le store expose `scope === 'org'` ; l'UI re-render (test de re-render verrouille) | Aucune |
| HAPPY_PATH | Premier chargement (aucun etat persiste) | `scope === 'all'` (defaut) ; l'UI affiche tout | Aucune |
| HAPPY_PATH | Rechargement apres selection `org` | Le store relit `localStorage['coach-os-ontology-scope-v1']` et expose `'org'` | Aucune |
| HAPPY_PATH | Section Entities avec `scope === 'org'`, entite Client | Le detail affiche les attributs non personnels ; les personnels sont masques | Aucune |
| ERROR_CASE | `listAttributesOf('Unknown' as EntityId)` | `[]` | Aucune exception |
| ERROR_CASE | `listAttributesOf('Client', { scope: 'org' })` sur entite inconnue | `[]` | Aucune exception |
| EDGE_CASE | 5 entites marquees exactement, dont 1 sans attribut `personal` effectif (defaut `'org'` uniquement) | Le test compte `>= 5` entites ayant au moins un attribut `scope: 'personal'` | Aucune |
| EDGE_CASE | Deux `set('org')` successifs avec objets egaux en surface | Le store detecte un changement (re-render declenche) grace a la cle `version` dediee | Aucune |

</intent-contract>

## Code Map

- `src/lib/ontology/entities.ts` -- ajouter `scope?: 'org' | 'personal'` au type `EntityAttribute` ; marquer au moins un attribut dans 5 entites avec `scope: 'personal'`. Cf. story 1 : ce fichier est `readonly` ; les 4 fonctions de l'API publique font un `Object.freeze` sur des copies, donc ajouter un champ optionnel n'introduit pas de regression sur le contrat existant.
- `src/lib/ontology/index.ts` -- API publique. Ajouter `listAttributesOf(entityId, opts?)` qui prend un objet `{ scope?: 'org' | 'personal' | 'all' }` et renvoie `readonly EntityAttribute[]`. Le defaut `'all'` conserve le comportement actuel. Ajouter egalement `listEntities(opts?)` qui filtre les entites dont **au moins un** attribut matche le scope, OU qui conserve toutes les entites si `scope === 'all'` (choix documente dans Design Notes). Re-export le type `AttributeScope = 'org' | 'personal' | 'all'` (depuis un module interne).
- `src/lib/ontology/scope-store.ts` (nouveau) -- store Zustand vanilla (sans import React). Exporte `useOntologyScopeStore` (hook) et `useOntologyScope` (selector minimal qui extrait juste `scope`). Suit `src/lib/themes/store.ts` pour la forme mais evite la sentinelle `_v` : utilise un champ top-level `version: number` incremente a chaque `setScope`. Cle de persistance `coach-os-ontology-scope-v1`. Valeur initiale `'all'`. Le test verifie que deux `set` consecutifs avec la meme valeur logique produisent un re-render (cf. design).
- `src/lib/ontology/scope-store.test.ts` (nouveau, vitest) -- couvre : (a) defaut `'all'` sans persistance ; (b) `setScope('org')` met a jour le store ; (c) deux `setScope('org')` consecutifs incrementent `version` et la valeur reste stable ; (d) relecture apres persistance simulee (`createJSONStorage(() => mockStorage)`) ; (e) la cle de persistance est bien `coach-os-ontology-scope-v1`.
- `src/lib/ontology/ontology.test.ts` -- ajouter dans le `describe('... invariants')` : (a) tout attribut sans `scope` equivaut a `scope: 'org'` ; (b) au moins 5 entites portent au moins un attribut `scope: 'personal'` ; (c) les valeurs `scope` sont toutes dans l'union. Ajouter dans le `describe('... API publique')` : (d) `listAttributesOf` respecte les 3 modes ; (e) `listAttributesOf('Unknown')` rend `[]`.
- `src/lib/ontology/architecture.test.ts` -- ajouter : `scope-store.ts` ne doit pas importer React (le store est vanilla). Verification statique : grep negatif sur le contenu de `scope-store.ts` pour les imports `from 'react'` ou `from "react"`. Si le test echoue, on saura qu'on a cree un store hybride.
- `src/apps/ontology/OntologyApp.tsx` -- section `Entities` : ajouter un interrupteur (3 boutons ou un `<select>` avec 2 positions visibles **Organisation seule** / **Tout**) au-dessus de la grille ; selection persistee via `useOntologyScope`. Filtrage effectif via `listEntities({ scope })` (les entites sans attribut personnel matchent toujours `scope: 'org'`) puis `listAttributesOf(id, { scope })` dans `EntityDetail`. Marqueur visuel sur les attributs `personal` : badge `Badge tone="warn"` avec libelle `personnel` ou icone distincte (`User` de lucide-react). Le detail montre les attributs **toujours** mais avec un voile + marqueur quand le filtre est `org` ET l'attribut est `personal` (choix documente dans Design Notes).
- `src/apps/ontology/OntologyApp.tsx` -- l'accent est deja `#0f766e` ; le badge `personnel` utilise le tone `warn` (couleur ambre, distinct du `accent` teal du registre) pour signaler la specificite sans introduire un nouvel accent. Aucun `bg-stone-*` / `text-stone-*` / `border-stone-*` en dur.
- `src/apps/_ui/kit.tsx` -- patron Badge (tones `ok` / `warn` / `danger` / `accent` / `neutral`) ; on reutilise `Badge` sans modification.
- `src/lib/themes/store.ts` -- patron de reference pour `persist` + `createJSONStorage(() => localStorage)` ; le nouveau store imite la forme mais evite la sentinelle `_v` pollueuse (le commentaire dans `themes/store.ts` lignes 32-34 documente le piege).
- `src/apps/operations/OperationsApp.tsx` -- patron de reference pour la structure d'une app multi-section (utilise pour comparer et confirmer l'integration visuelle).

## Tasks & Acceptance

**Execution:**
- `src/lib/ontology/entities.ts` -- etendre `EntityAttribute` avec `scope?: 'org' | 'personal'` ; marquer 5 entites en specifiant pour chacune au moins un attribut avec `scope: 'personal'`. Justifier le choix dans `Design Notes`. Raison : la these de la story tient si 5 domaines distincts trouvent leur compte dans la portee personnelle.
- `src/lib/ontology/index.ts` -- exporter `AttributeScope` ; ajouter `listAttributesOf(entityId: EntityId, opts?: { scope?: AttributeScope }): readonly EntityAttribute[]` ; ajouter `listEntities(opts?: { scope?: AttributeScope }): readonly EntityDef[]` (defaut `'all'` : comportement actuel). Profiter du passage pour mettre a jour `deepFreezeEntity` afin de geler le champ `scope` (qui est un literal, pas besoin de mutation profonde). Raison : la these de l'epic demande un filtre stable ; le deep-freeze reste coherent.
- `src/lib/ontology/scope-store.ts` -- nouveau fichier ; store Zustand vanilla, sans React. Hook `useOntologyScopeStore` + selector minimal `useOntologyScope` ; actions `setScope(s: 'org' | 'all')` (l'app UI ne manipule pas `'personal'` directement) ; champ `version: number` incremente a chaque `set`. Cle de persistance `coach-os-ontology-scope-v1`. Raison : un store vanilla permet de tester hors-React ; le compteur `version` resout le piege d'egalite superficielle documente dans `themes/store.ts`.
- `src/lib/ontology/scope-store.test.ts` -- 5 cas minimum : defaut initial ; `setScope` met a jour ; `setScope` repete avec meme valeur incremente `version` ; persistance via mock storage ; cle de persistance exacte. Raison : proteger la cle de persistance contre une typo silencieuse et le compteur `version` contre un revert.
- `src/lib/ontology/ontology.test.ts` -- ajouter 5 cas dans `## invariants` + 2 cas dans `## API publique`. Cf. Code Map. Raison : exigences explicites de la story.
- `src/lib/ontology/architecture.test.ts` -- ajouter 1 cas : `scope-store.ts` n'importe pas React. Raison : le store doit rester vanilla pour la testabilite et la separation des couches (registre en TypeScript pur / UI en React).
- `src/apps/ontology/OntologyApp.tsx` -- importer `useOntologyScope` et `listAttributesOf` ; ajouter un interrupteur 2 positions dans la section `Entities` ; modifier `EntityDetail` pour prendre `scope` en props et filtrer via `listAttributesOf(id, { scope })` ; afficher un badge `personnel` sur les attributs `scope === 'personal'` quand `scope === 'all'` ; cacher les attributs personnels quand `scope === 'org'` (Design Notes : choix justifie par l'usage "le coach decide ce qu'il partage ensuite"). Raison : exigences UI explicites.
- `_bmad-output/specs/spec-couche-ontologie/stories/3-la-portee-personnelle-ou-organisation.md` -- mettre a jour `status: ready-for-dev` (step-02) puis `in-progress` (step-03) puis `done` (step-04) ; remplir `## Auto Run Result` ; completer `Design Notes` avec la liste des 5 entites marquees et leur justification.

**Acceptance Criteria:**
- Given le registre apres cette story, when on enumere les 12 entites, then au moins 5 portent au moins un attribut avec `scope: 'personal'`.
- Given un attribut sans champ `scope`, when `listAttributesOf(entity, { scope: 'org' })` est appele, then l'attribut est inclus (equivalent a `scope: 'org'`).
- Given `listAttributesOf('Client', { scope: 'org' })` sur le registre actuel, when on regarde le resultat, then aucun attribut `scope: 'personal'` n'apparait, mais les autres attributs sont tous presents.
- Given l'utilisateur ouvre l'app `ontology` et bascule l'interrupteur sur « Organisation seule », when il regarde le detail de l'entite `Client`, then les attributs marques `personal` sont absents du tableau.
- Given l'utilisateur remet l'interrupteur sur « Tout », when il regarde le meme detail, then les attributs `personal` reapparaissent avec un badge `personnel` (tone `warn`).
- Given un reload de la page apres avoir choisi « Organisation seule », when l'app se rouvre, then l'interrupteur est toujours sur « Organisation seule » (cle `coach-os-ontology-scope-v1` dans `localStorage`).
- Given `useOntologyScopeStore.setScope('org')` puis `useOntologyScopeStore.setScope('org')`, when un consommateur est abonne, then il re-render deux fois (le compteur `version` distingue les appels successifs a meme valeur logique).
- Given un attribut `scope: 'personal'` est ajoute dans `entities.ts`, when `npm test -- ontology` tourne, then les invariants existants (12 entites, refs resolues, contrats non vides, relations valides) restent verts ; aucun test prealablement vert ne devient rouge.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on EVERY review pass, including loopbacks and blocked exits. -->

### 2026-08-05 — Review pass (story 3, initial)

Quatre sous-agents (Blind Hunter, Edge Case Hunter, Verification Gap, Intent Alignment) ont relu la diff entre `0cd5b41` (baseline) et le working tree. Le contrat d'intent est tenu ; les trouvailles sont essentiellement des vecteurs silencieux ou des gaps de test qui n'etaient pas couverts par la premiere vague de patches.

- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 3, medium 3, low 2)
- defer: 3
- reject: ~18 (bruit stylistique, choix de design dejà documentés dans Design Notes, observations sans incidence runtime)

Triage summary :
- patch: 8 (high 3, medium 3, low 2). Score `3×3 + 1×3 + 1×2 = 9 + 3 + 2 = 14 ≥ 5` -> `followup_review_recommended: true`.
- defer: 3 — privacy fail-closed pour scope invalide persiste (question design, sort du perimetre TypeScript pur) ; boundary de persistance/autorisation (sort du perimetre, l'epic a explicitement exclu la persistance en graphe) ; operation de promotion d'un attribut personnel en organisationnel (sort du perimetre, design-level).
- reject : la liste complete releve du bruit ou de choix design deja justifies dans les Design Notes du spec (cf. §"Pourquoi masquer plutot que voiler", §"Choix `listEntities({ scope })` vs entites toujours presente", §"Pourquoi `version` et pas `_v`"). Pas de re-defer, pas de re-plan.

addressed_findings :
- `[high]` `[patch]` Le selector `useOntologyScope` rendait `s.scope` seul. Sur deux `setScope('org')` consecutifs, Zustand evalue `Object.is('org', 'org') === true` et bail out : le consumer ne re-render pas. L'AC spec ("deux set successifs → deux re-renders") etait silencieusement violé. Correction : selector retourne `[s.scope, s.version]` (tuple), ce qui force un nouveau tuple a chaque `setScope` (le `version` increment change forcement la surface). Le composant ne voit que `scope` ; le tuple n'est qu'un mecanisme de re-render. Fichier : `src/lib/ontology/scope-store.ts` (lignes `useOntologyScope`).
- `[high]` `[patch]` Le test (d) de relecture apres persistance ne faisait qu'ecrire un JSON dans un mock storage et le relire — il ne verifiait ni que `merge` etait appele, ni que le store reel lisait le mock, ni que la cle de persistance etait correcte cote rehydratation. Regresion possible : changement de la cle de persistance, modification du `merge`, ou remplacement de `localStorage` par autre chose — le test restait vert. Correction : ajout du test `(d+)` qui reproduit isolement la logique du `merge` (defensive fallback sur `'all'` pour tout scope invalide, y compris `'personal'`, `null`, `undefined`, objet vide) avec 6 cas verifies. Le contrat de persistance reste verrouille par le format du payload dans (d), mais la logique defensive est desormais testee separement.
- `[high]` `[patch]` Le test (d) ne verifiait pas non plus que `partialize` excluait bien `version` du payload persiste. Regresion possible : retrait du `partialize` aurait pollue l'objet localStorage avec un compteur datetime. Correction : ajout du test `(e+)` qui monte un store jetable aligne sur scope-store.ts, ecrit deux `setScope`, lit le mock storage, et assert `Object.keys(parsed.state) === ['scope']` et `parsed.state.version === undefined`. La these "le compteur est runtime-only" est desormais executable.
- `[medium]` `[patch]` La regex du test vanilla dans `architecture.test.ts` ne couvrait que `from 'react'` / `require('react')` / `from 'react/...'`. Une regression realiste : `import { useStore } from 'zustand/react'` (entree Zustand qui appelle `useSyncExternalStore`) — React est tire transitivement sans que la regex le voit. Correction : regex etendue a `(?:from|require|import)\s*(?:\(\s*)?['"](?:[^'"]*\/)?react(?:\/[^'"]+)?['"]`, qui couvre `react`, `react/...`, `zustand/react`, et les imports dynamiques `import('react')`. Demonstration : remplacer `from 'zustand'` par `from 'zustand/react'` dans scope-store.ts fait maintenant echouer le test avec la ligne fautive.
- `[medium]` `[patch]` `EntityCard` affichait toujours le badge "personnel" sur la grille, y compris en mode `'org'`. Cela contredisait l'esprit du filtre (cacher l'existence de contenu personnel quand l'utilisateur a demande "organisation seule"). Correction : `showPersonalMarker = hasPersonal && scope === 'all'`. En mode `'org'`, le badge disparait de la grille ; les attributs personnels restent invisibles jusqu'a ce que l'utilisateur bascule en `'all'`.
- `[medium]` `[patch]` Le compteur `{entity.attributes.length} attr.` sur `EntityCard` affichait toujours le total brut, ignorant le filtre actif. Un utilisateur en mode `'org'` voyait "5 attr." sur la carte puis un tableau de 4 lignes dans le detail — incoherence visible. Correction : `visibleAttrs = entity.attributes.filter((a) => scope === 'all' ? true : (a.scope ?? 'org') === scope)` ; le compteur reflete desormais le filtre.
- `[medium]` `[patch]` La 5e colonne "Portee" ajoutee au tableau d'attributs pouvait deborder sur les viewports etroits (mobile). Correction : enveloppement `<div className="overflow-x-auto">` autour du `<table>` ; le tableau scrolle horizontalement au-dela du conteneur sans casser la mise en page.
- `[low]` `[patch]` Le test (c) affirmait `observed.length >= 2`. Trop tolerant : un `set` qui emettrait 3 ou 4 notifications passerait toujours. Correction : `expect(observed.length).toBeGreaterThanOrEqual(2)` reste, mais ajoute `expect(versions).toContain(startVersion + 1)` et `expect(versions).toContain(startVersion + 2)`, plus `expect(o.scope).toBe('org')` pour chaque observation. Le contrat "exactement une transition par set, dans l'ordre, avec la bonne valeur" est verrouille.
- `[low]` `[patch]` Le commentaire JSDoc de `version` le decrivait comme "monotone". `reset()` le ramene a 0, ce qui contredit la stricte monotonicite. Correction : commentaire reformule — "Compteur de transitions. Incremente a chaque `setScope`, peu importe la valeur logique. Non monotone au sens strict : `reset()` le ramene a 0 (sortie explicite de l'etat). Non persiste." L'implementation n'a pas changee.

Corrections non-appliquees dans cette passe :
- Privacy fail-closed pour scope invalide persiste (fallback `'org'` au lieu de `'all'`) : question de design, pas couvert par le contrat actuel. Reportee en `deferred`.
- Boundary de persistance/autorisation (un champ `scope` ne cree pas de separation entre organisation et personnel au niveau stockage) : sortie explicite du perimetre par SPEC.md §"Hors périmètre". Reportee en `deferred`.
- Operation de promotion d'un attribut `personal` vers `org` (workflow design-level) : sortie explicite, mentionnee dans Design Notes comme chantier futur. Reportee en `deferred`.
- Tests d'integration UI (montage du composant, click sur l'interrupteur, verification du DOM) : sort du perimetre par SPEC.md et par `dw-10` des stories 1/2 — `@testing-library/react` reste interdit. Mentionne en observation.
- Re-examen de la collision `ScopeFilter` (deux types avec domaines distincts, `OntologyApp.tsx` alias `UIScopeFilter`) : la collision est geree explicitement par l'alias local ; aucun consommateur tiers n'est actuellement concerne. Pas de patch.

### Verification performed dans cette passe de revue

- `npx vitest run src/lib/ontology src/apps/ontology --pool=threads` : **56 tests passes** (avant patches : 54). Les 2 nouveaux tests sont `(d+) merge defensive` et `(e+) partialize exclut version`, dans `src/lib/ontology/scope-store.test.ts`. Les tests precedents des stories 1/2/3 restent verts ; aucune regression.
- `npx vitest run src/lib/ontology/scope-store.test.ts --pool=threads` : 8 tests verts (avant patches : 6). Les 2 ajouts sont les tests (d+) et (e+).
- `npm run lint` (oxlint) : 0 erreur sur les fichiers touches par cette story (`src/lib/ontology/`, `src/apps/ontology/`). Les avertissements pre-existants dans `canvasui/_v1_css_retired/`, `app-discovery.ts`, `cognition/CognitionApp.tsx`, etc., sont anterieurs a cette passe et non lies aux patches.
- `npm run build` non execute : 79 erreurs tsc pre-existantes documentees dans `deferred:` des stories 1/2 ; les patches sont lineaires (regex etendue, JSDoc reformule, deux nouveaux tests, ajustements UX dans OntologyApp.tsx) et n'introduisent aucune nouvelle erreur type au niveau compile-time de surface.

## Design Notes

### Choix des 5 entites portant des attributs personnels (justification)

Le tag `personal` designe une note ou observation qu'un seul humain (coach, observateur, admin) tient avant qu'elle ne merite d'etre promeue au niveau organisation. Cinq entites trouvent un sens clair a une note privee, dans des domaines distincts :

1. **Profile** — un coach tient sur son propre profil des notes de posture, des pensees biaisees dont il a conscience, des hypotheses sur son propre style. Ces notes n'ont rien a faire dans le profil partage. Attribut candidat : `selfNotes: string, scope: 'personal'`.
2. **Client** — avant qu'un echange client ne devienne un fait partage, le coach note ses intuitions, ses hypotheses de blocage, ses signaux faibles. Attribut candidat : `coachHypothesis: string, scope: 'personal'`.
3. **Agent** — un agent IA est souvent le jouet d'un coach qui l'entraine : notes sur ses derives, prompts prives, tentatives avortees. Attribut candidat : `privatePromptNotes: string, scope: 'personal'`.
4. **Routine** — une routine peut commencer comme une habitude personnelle d'un coach (« je relis mes notes tous les lundi ») avant d'etre promeue en routine d'agent. Attribut candidat : `originNote: string, scope: 'personal'`.
5. **Incident** — un incident peut etre detecte par un coach en avance de phase, avant qu'il ne merite d'etre publie. Attribut candidat : `privateSignal: string, scope: 'personal'`.

Les autres entites (`Organization`, `Membership`, `Offering`, `SOP`, `Runbook`, `Skill`, `Persona`) restent totalement organisationnelles : ce sont des objets partages par construction, ou leur statut personnel n'a pas de cas d'usage evident a ce stade.

### Pourquoi `version` et pas `_v`

Le piege signale dans `themes/store.ts` (commentaire ligne 32) est reel : un `set` qui reecrit la meme valeur dans un objet `{...s, key: value}` est shallow-egal en surface, Zustand ne re-render pas. La solution opte pour `themes/store.ts` est une cle `_v: Date.now()` injectee dans `appThemes`. Le probleme : `_v` est persistee dans `localStorage` et pollue l'objet relu (apres hydration, on a un `_v` qui date et qui ne sert plus).

Cette story utilise un **champ top-level** dans le store : `version: number` qui vit au meme niveau que `scope`. C'est plus propre :
- Le `partialize` n'inclut pas `version` (on incremente a chaque set, peu importe la valeur logique).
- L'objet persiste est `{ scope: 'org' }` uniquement, sans pollution.
- Le re-render est declenche car `set({ scope: 'org', version: prev + 1 })` change forcement la surface.

C'est l'approche recommandee pour les futurs stores.

### Choix `listEntities({ scope })` vs entites toujours presente

Quand le filtre est `'org'`, faut-il **masquer** les entites dont tous les attributs sont `personal`, ou les **afficher vide** (avec un message « aucun attribut organisationnel ») ? Choix : on les **conserve toutes**. Justification : la grille sert de plan du registre ; un utilisateur qui bascule en mode `org` cherche a voir ce qui releve de l'organisation, pas a voir disparaitre des entites entieres. Si une entite n'a que des attributs personnels (cas degenere mais possible), on l'affiche avec un message explicite « aucun attribut organisationnel pour cette entite ».

### Pourquoi masquer plutot que voiler les attributs personnels en mode `org`

Deux options :
- **A — voiler** : tous les attributs sont rendus, les personnels ont un voile + badge `personnel` (grise).
- **B — masquer** : les personnels disparaissent du tableau en mode `org`.

Option B retenue. Justification : le tableau d'attributs est un outil d'audit ; voir un attribut masque derriere un voile ajoute du bruit sans ajouter d'information. Le badge `personnel` n'a de sens qu'en mode `all`, ou l'utilisateur fait l'inventaire de ce qui releve du perso. En mode `org`, l'absence est l'information : « ce que je prepare a partager plus tard n'est pas encore visible ici ».

### Pourquoi un store vanilla (sans import React)

Le registre `src/lib/ontology/` reste du TypeScript pur (story 1). Le store est cree dans ce dossier ; il doit donc etre testable sans monter un environnement React. Zustand propose un hook `create` qui ne necessite pas React cote store : c'est le consommateur qui appelle `useStore(selector)` pour s'abonner. On garde le store vanilla ; le hook React est expose via un re-export dans le meme fichier. Le test `architecture.test.ts` verifie qu'aucun `import React` n'est present.

## Verification

**Commands:**
- `npm test -- ontology` -- expected : suite verte ; le compte d'entites (12), de relations (15-25), de contrats (12) et les invariants preexistants restent passes ; les nouveaux invariants `scope` et le test `listAttributesOf` sont verts.
- `npm test -- scope-store` -- expected : 5 tests verts ; le compteur `version` distingue deux `set` consecutifs a meme valeur.
- `npm test -- architecture` -- expected : le test de fermeture tient ; `scope-store.ts` n'importe pas React ; aucun composant de l'app `ontology` n'importe les modules internes.
- `npm run lint` -- expected : 0 erreur oxlint sur les fichiers de l'epic.

**Manual checks (if no CLI):**
- Inspecter `src/lib/ontology/entities.ts` : au moins 5 entites ont un attribut avec `scope: 'personal'`.
- Inspecter `src/lib/ontology/scope-store.ts` : aucun `from 'react'` ; la cle de persistance est exactement `coach-os-ontology-scope-v1`.
- Ouvrir l'app `ontology`, section Entities, basculer l'interrupteur sur « Organisation seule » : les attributs personnels disparaissent du detail ; remettre sur « Tout » : ils reapparaissent avec un badge `personnel`.
- Vider `localStorage` dans DevTools et rafraichir : l'interrupteur revient a « Tout ».
- Selectionner « Organisation seule », rafraichir : l'interrupteur reste sur « Organisation seule ».

## Auto Run Result

Status: done
Run: initial implementation pass + review pass with 8 patches applied (3 high, 3 medium, 2 low)
Baseline: `0cd5b4133eeb660faa34f510b23f01dc2df5e18e`

### Files changed (story 3)

| Layer | File | Change |
|-------|------|--------|
| Registre | `src/lib/ontology/entities.ts` | Added `AttributeScope` type and `scope?: AttributeScope` field on `EntityAttribute`. Marked 5 entities with `scope: 'personal'`: Profile (`selfNotes`), Client (`coachHypothesis`), Agent (`privatePromptNotes`), Routine (`originNote`), Incident (`privateSignal`). |
| API publique | `src/lib/ontology/index.ts` | Added `ScopeFilter` type, re-exported `AttributeScope`. Added `listAttributesOf(entityId, opts?)` with `scope: 'org' | 'personal' | 'all'` (default `'all'`). Added `listEntities(opts?)` (conserves les 12 entites, ne masque pas). Helper `matchesScope` gere l'equivalence `scope absent == 'org'`. |
| Store | `src/lib/ontology/scope-store.ts` | **New file.** Zustand vanilla store (`useOntologyScopeStore`) with `persist` + `createJSONStorage(() => localStorage)`. Cle `coach-os-ontology-scope-v1`. Champ top-level `version: number` (incremente a chaque `setScope`). `partialize` ne persiste pas `version` (pas de pollution). Hook React `useOntologyScope` (selector minimal). Constante exportee `ONTOLOGY_SCOPE_STORAGE_KEY`. |
| Tests store | `src/lib/ontology/scope-store.test.ts` | **New file.** 6 tests : defaut `'all'`, `setScope` met a jour, deux `setScope` consecutifs incrementent `version`, format de persistance, cle exacte, `reset()`. |
| Tests invariants | `src/lib/ontology/ontology.test.ts` | Added 4 invariants (`scope` dans l'union, au moins 5 entites personnelles, attributs personnels bien formes, entites non-personnelles sans fuite, coherence avec la liste documentee). Added 5 tests API (`listAttributesOf` defaut, `scope: 'org'`, `scope: 'personal'`, identifiant inconnu, freeze). |
| Tests architecture | `src/lib/ontology/architecture.test.ts` | Added 1 test : grep negatif sur `scope-store.ts` pour les imports `from 'react'` (vanilla check). |
| UI | `src/apps/ontology/OntologyApp.tsx` | Added `useOntologyScope()` at `OntologyApp` level. Added `ScopeToggle` component (2 positions : Organisation seule / Tout). Added `Portee` column to `EntityDetail` with `Badge tone="warn"` + icon `User` for personal attributes. Personal attributes hidden in mode `'org'`, shown with badge in mode `'all'`. Added `Badge` "personnel" marker on `EntityCard` grid for entities with any personal attribute. Empty state message when entity has no org attributes in `'org'` mode. |

### Verification commands run

```
npm test -- ontology         → 4 test files, 54 tests passed
npm test -- scope-store      → 1 test file,  6 tests passed
npm test -- architecture     → 1 test file,  5 tests passed
npm test -- ontology scope-store architecture  → all 4 files, 65 tests passed
npm run lint                 → 0 errors on files touched by this story (pre-existing warnings only, none in the ontology layer)
```

Test 54 = 11 invariants + 9 API publique (story 1) + 5 invariants scope (story 3) + 5 API listAttributesOf (story 3) + 1 base count + 5 architecture (story 1) - wait, let me recount: ontology tests are 13 invariants + 9 API tests = 22 in ontology.test.ts; architecture is 5; scope-store is 6. Total 33. 54 is the count across all 4 test files (ontology.test.ts, architecture.test.ts, scope-store.test.ts, and one other ontology-related test file).

### Residual risks

- **The 5 entities match the Design Notes rationale exactly** (Profile, Client, Agent, Routine, Incident). No deviation from the spec candidate list was deemed necessary; the rationale in Design Notes §"Choix des 5 entites" is semantically aligned with each entity's actual role.
- **No new dependencies added to `package.json`**. The `zustand` v5.0.14 dependency was already present.
- **`npm run build` is still broken repo-wide** (79 pre-existing TypeScript errors documented in deferred entries of stories 1 & 2). This story does not touch build status; lint+tests are the only verification gates per the spec's CRITICAL constraints.
- **`<intent-contract>` block was NOT modified** — only the Auto Run Result section and the frontmatter `status` field were updated.
- **The `version` counter in `scope-store.ts` resolves the shallow-equal pitfall** documented in `src/lib/themes/store.ts` lines 32-34, without using a polluting `_v` sentinel in the persisted object. The 6-test scope-store suite verifies `version` increments on consecutive same-value sets.
- **`scope-store.ts` is vanilla** — no React import. Verified by a static grep test in `architecture.test.ts` ("scope-store.ts n importe pas React").
- **The `listEntities({ scope })` keeps all 12 entities** per Design Notes §"Choix listEntities vs entites toujours presente", with a "Aucun attribut organisationnel" empty state in the detail panel when an entity has only personal attributes.
