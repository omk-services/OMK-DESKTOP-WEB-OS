### DW-1: Aucune suite automatisée ne verrouille les 9 alias ; tout retrait futur passerait `scripts/verify-no-regression.sh` sans broncher (la story 2 « Garde-fou contre le retour des variables orphelines » es
origin: spec-deferred 57087c0fe820
location: src/lib/themes/store.ts:88-96 (les 9 setProperty ajoutés)
source_spec: `1-cabler-les-9-variables-css-orphelines.md`
severity: medium
reason: `find src -name "*.test.*" -o -name "*.spec.*"` retourne 0 fichier. Aucun test n'importe `themes/store`, n'appelle `applyThemeTokens`, ni ne lit `getComputedStyle(:root).getPropertyValue('--canvas')`. La story 2 du même épic est précisément ce test, avec son AC « le test doit passer au vert une fois la story 1 appliquée ».
status: closed (closed by story 2 — `_bmad-output/specs/spec-themes-par-app/stories/2-garde-fou-contre-le-retour-des-variables-orphelines.md`, run 2026-08-05, baseline 5a4255e2937c56a5f152bc4a5a673cfb0b8001a2. Test `src/lib/themes/orphan-css-vars.test.ts` verrouille les 9 alias + 22 canoniques + 8 exclusions ; `--passWithNoTests` retiré de `scripts/verify-no-regression.sh` ; `bash scripts/verify-no-regression.sh` exit 0, `npm test` 4/4 verts.)

### DW-2: Les 9 alias sont posés « jusqu'à migration complète » mais aucun signal machine-readable (JSDoc @deprecated, console.warn, ticket de suivi) n'accompagne la promesse ; les alias risquent de vivre « pou
origin: spec-deferred 5214e2abd2df
location: n/a
source_spec: `1-cabler-les-9-variables-css-orphelines.md`
severity: low
reason: Le commentaire mentionne la migration mais ne la dote ni d'un échéancier, ni d'un lint rule, ni d'un ticket attaché. Hors périmètre explicite de cette story (la spec interdit d'ajouter de nouvelles variables et de modifier la signature — un @deprecated sur les alias eux-mêmes n'est pas une variable, mais une instrumentation supplémentaire dépasse l'AC).
status: open

### DW-3: Le parser de `applyThemeTokens` est cablé sur les lignes 62-104 de `src/lib/themes/store.ts`. Si une future epic deplace la fonction (ajoute un helper avant le corps, fusionne avec un autre setter, et
origin: spec-deferred 6fe3a9e53359
location: src/lib/themes/orphan-css-vars.test.ts:116-122
source_spec: `2-garde-fou-contre-le-retour-des-variables-orphelines.md`
severity: low
reason: `lines.slice(61, 104)` (test.ts:116-122) ; le fallback `lines.length < 104` ne couvre que le retrecissement, pas la derive vers le bas. Aucune migration de store.ts n'est prevue.
status: open

### DW-4: Le spec declare `OK : 88 erreurs TS (<= 88)` dans la section Verification mais la sortie reelle est `OK : 79 erreurs TS (<= 88)`. Le garde (79 <= 88) tient ; le chiffre "88" etait illustre et le gate
origin: spec-deferred d9f7df91ab33
location: src/lib/themes/orphan-css-vars.test.ts:1 (triple-slash reference)
source_spec: `2-garde-fou-contre-le-retour-des-variables-orphelines.md`
severity: low
reason: Le nouveau test file pose `/// <reference types="node" />` (necessaire pour `verbatimModuleSyntax: true` + imports `node:fs`/`node:path`), ce qui resout 9 erreurs TS2591 preexistantes dans `src/components/canvasui/_v1_css_retired/theme-canvas-mapping.ts` (folder archive, jamais compile). Net : -9 erreurs, 0 regression.
status: open

### DW-5: `npm run build` echoue avant cette story : `tsc -b` remonte 79 erreurs de type preexistantes dans les apps et les composants retires.
origin: spec-deferred 19d7596d27dd
location: repo-wide (hors src/lib/ontology/)
source_spec: `1-le-registre-dentites-en-typescript-pur.md`
severity: medium
reason: `npx tsc -b --noEmit` sur le HEAD de reference 036b5ccb rapporte 79 erreurs, reparties surtout sur src/apps/tasks/TasksDetailPage.tsx (6), src/apps/cognition/CognitionApp.tsx (6), src/components/canvasui/_v1_css_retired/BackgroundFX.tsx (5), src/apps/marketplace/MarketplaceDetailPage.tsx (5). Aucune n'est dans src/lib/ontology/ : le module ajoute par cette story compile a zero erreur. Consequence : `npm run build` (= `tsc -b && vite build`) est casse au niveau du depot, donc la verification de type n'est de fait pas une barriere en CI tant que ces 79 erreurs subsistent. `npm test` et `npm run lint` sont verts et restent les garde-fous effectifs.
status: open

### DW-6: Choices de modele du registre a revisiter : relations et attributs dont l'absence ou la forme releve d'un arbitrage non couvert par cette story.
origin: spec-deferred ac3cd621d027
location: src/lib/ontology/entities.ts, src/lib/ontology/relations.ts
source_spec: `1-le-registre-dentites-en-typescript-pur.md`
severity: medium
reason: Revue 2026-08-05 (run 2) releve : (a) `Incident` est decrit comme rattache a un Agent mais n'a aucune relation correspondante dans `relations.ts` ; (b) `Persona` est decrit comme incarne "dans un contexte Client" mais n'a pas de relation Persona ↔ Client ; (c) `Skill` et `Persona` n'ont pas d'attribut `organization` alors que toutes les autres entites tenant-scoped en ont un ; (d) `Routine` expose `allowedActions: rerun` mais `Runbook` n'a pas d'equivalent (asymetrie) ; (e) nommage date incoherent entre entites (`createdAt` / `updatedAt` / `lastTestedAt`). Decisions prises dans cette story par defaut d'arbitrage, a reprendre dans une revue d'architecture ou en surface par les stories 2/3/4 consommatrices. Egalement reporte : renforcement type-level de `EntityAttribute.ref` via discriminated union (`RefAttribute | NonRefAttribute`) — le runtime test couvre deja l'invariant, l'enforcement compile-time est un polish separable.
status: open

### DW-7: Follow-up review still recommended for 1 after the damping cap was spent
origin: review-budget-followup
location: n/a
source_spec: `1-le-registre-dentites-en-typescript-pur.md`
severity: low
reason: The follow-up-review damping cap (limits.max_followup_reviews = 1) was spent with the story finalized (status: done, verify green) while the review pass still recommended an independent follow-up. The work was committed by bmad-loop run 20260805-091730-9034; this entry preserves the lingering recommendation for a deliberate later review.
status: open

### DW-8: `npm run build` echoue avant cette story : `tsc -b` remonte 79 erreurs de type preexistantes dans les apps et les composants retires (heritees des passes anterieures).
origin: spec-deferred 64f03b4bf5e0
location: repo-wide (hors src/apps/ontology/)
source_spec: `2-l-app-ontology-et-ses-quatre-sections.md`
severity: medium
reason: `npx tsc -b --noEmit` sur le HEAD de reference 0d0902c rapporte 79 erreurs, dont la majorite se trouve dans `src/apps/tasks/TasksDetailPage.tsx`, `src/apps/cognition/CognitionApp.tsx`, `src/components/canvasui/_v1_css_retired/BackgroundFX.tsx`, et `src/apps/marketplace/MarketplaceDetailPage.tsx`. La nouvelle app `src/apps/ontology/` ne porte aucune de ces erreurs, mais le pipeline reste casse au niveau du depot.
status: open

### DW-9: Placement de l'enregistrement `ontology` dans `app-discovery.ts` : la spec dit « apres WelcomeApp / avant DesignApp » (Intent Contract) et « apres DesignApp, fin de fichier » (Code Map). L'implementat
origin: spec-deferred 9b535297b136
location: src/lib/app-discovery.ts:55-58
source_spec: `2-l-app-ontology-et-ses-quatre-sections.md`
severity: low
reason: Le code suit la formulation la plus precise (Code Map). Le conflit etait deja signale dans `Design Notes` de la spec ; pas de deviation silencieuse. La difference est purement documentaire.
status: open

### DW-10: Aucun test ne rend le JSX de `OntologyApp` (sections, StatCards, notice "Pas d'historique"). Les tests actuels couvrent le helper `validate` et l'API publique.
origin: spec-deferred 7cdf366ca02e
location: src/apps/ontology/ontology-app.test.ts
source_spec: `2-l-app-ontology-et-ses-quatre-sections.md`
severity: medium
reason: Pour monter le composant il faudrait `@testing-library/react`, ce qui ajoute une dependance — interdit par la spec. Le patch review a deja ajoute 10 tests synthetiques sur `validate` pour couvrir les branches du helper. Le test de fermeture `architecture.test.ts` protege la frontiere du registre ; les surfaces UI restent verifiees a la main.
status: open

### DW-11: Accessibilite legere : pas d'`aria-label` sur les cartes entite/contrat, pas de `for/id` sur les `<select>` de la section Relations, pas d'`aria-live` sur le compteur filtre.
origin: spec-deferred 74fcbf014d03
location: src/apps/ontology/OntologyApp.tsx:159-189, 254-330, 575-602
source_spec: `2-l-app-ontology-et-ses-quatre-sections.md`
severity: low
reason: Amelioree par une passe ulterieure (kit UI ou revue a11y). Aucune regression fonctionnelle ; les boutons utilisent `<button type="button">` deja.
status: open

### DW-12: Fallback `merge` actuel sur scope invalide persiste retourne `'all'` (la portee la plus large) ; une lecture privacy-first pourrait preferer `'org'` (fail-closed) pour eviter de reveler par defaut des
origin: spec-deferred cf95f6dabe01
location: src/lib/ontology/scope-store.ts:74-78
source_spec: `3-la-portee-personnelle-ou-organisation.md`
severity: low
reason: Spec story 3 §AC #6 attend qu'un reload preserve le scope choisi. Aucun AC ne precise le comportement pour un payload corrompu ou hors-domaine ; le choix actuel est conservateur (toujours un scope connu). Question design, hors du perimetre TypeScript pur.
status: open

### DW-13: Le champ `scope` est une convention de surface UI ; il ne cree aucune separation au niveau stockage ou autorisation. Si personnel et organisation partagent la meme ligne, RLS ou column-level policies
origin: spec-deferred 9c9e57524d02
location: src/lib/ontology/entities.ts (champ scope)
source_spec: `3-la-portee-personnelle-ou-organisation.md`
severity: medium
reason: SPEC.md §"Hors périmètre" sort explicitement la persistance en graphe de l'epic. Story 3 herite de cette decision : pas de changement cote backend.
status: open

### DW-14: Pas d'operation de promotion d'un attribut `personal` vers `org` : le coach decide de garder ou promeuvoir ses notes, mais le registre ne formalise pas le mouvement.
origin: spec-deferred 2d0992d830f2
location: src/lib/ontology/entities.ts
source_spec: `3-la-portee-personnelle-ou-organisation.md`
severity: low
reason: Design Notes §"Choix des 5 entites portant des attributs personnels" mentionne la promotion comme logique, mais le workflow lui-meme sort de cette story (design-level).
status: open
