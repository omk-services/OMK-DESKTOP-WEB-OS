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
