---
title: 'Garde-fou contre le retour des variables orphelines'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_revision: '5a4255e2937c56a5f152bc4a5a673cfb0b8001a2'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: [oversized]
deferred:
  - summary: >-
      Le parser de `applyThemeTokens` est cablé sur les lignes 62-104 de
      `src/lib/themes/store.ts`. Si une future epic deplace la fonction
      (ajoute un helper avant le corps, fusionne avec un autre setter, etc.),
      la fenetre tranche silencieusement et le test devient un faux vert
      sur les writers.
    evidence: |-
      `lines.slice(61, 104)` (test.ts:116-122) ; le fallback `lines.length < 104`
      ne couvre que le retrecissement, pas la derive vers le bas. Aucune
      migration de store.ts n'est prevue.
    location: >-
      src/lib/themes/orphan-css-vars.test.ts:116-122
    severity: low
  - summary: >-
      Le spec declare `OK : 88 erreurs TS (<= 88)` dans la section
      Verification mais la sortie reelle est `OK : 79 erreurs TS (<= 88)`.
      Le garde (79 <= 88) tient ; le chiffre "88" etait illustre et le gate
      contractuel est `<= 88`.
    evidence: |-
      Le nouveau test file pose `/// <reference types="node" />` (necessaire
      pour `verbatimModuleSyntax: true` + imports `node:fs`/`node:path`), ce
      qui resout 9 erreurs TS2591 preexistantes dans
      `src/components/canvasui/_v1_css_retired/theme-canvas-mapping.ts` (folder
      archive, jamais compile). Net : -9 erreurs, 0 regression.
    location: >-
      src/lib/themes/orphan-css-vars.test.ts:1 (triple-slash reference)
    severity: low
---

<intent-contract>

## Intent

**Problem:** La story 1 a posé 9 alias CSS dans `applyThemeTokens` (`src/lib/themes/store.ts:88-103`) et inscrit la dette `DW-1` au registre : aucun test ne verrouille ces 9 écritures. Tant qu'aucune suite n'existe, `scripts/verify-no-regression.sh` accepte `npm test -- --passWithNoTests` (ligne 45), ce qui revient à un no-op — retirer les 9 alias passerait le garde sans broncher. Le bug « 34 % de la surface thémée gelée sur warm-paper » peut donc revenir silencieusement.

**Approach:** Ajouter un test Vitest qui scanne `src/`, collecte tous les `var(--xxx)` consommés, les confronte à l'union des noms écrits par `applyThemeTokens` et déclarés dans les blocs `:root` / `[data-theme]` de `src/index.css`, retire 8 exclusions justifiées (couleurs sémantiques, locales à un thème, constantes de mise en page, posées à l'exécution). Le test échoue en nommant les orphelines restantes. En parallèle, retirer `--passWithNoTests` de `scripts/verify-no-regression.sh` puisque la suite existe désormais.

## Boundaries & Constraints

**Always:**
- Le test lit les FICHIERS de `src/` (pas de bundle, pas de DOM runtime) — il s'agit d'une analyse statique de sources, exécutée côté Node.
- Le test parse `src/lib/themes/store.ts` entre les lignes 62-104 (corps de `applyThemeTokens`) pour extraire les noms écrits, et extrait `--xxx: valeur;` des blocs `:root` et `[data-theme]` de `src/index.css`. Cette lecture dynamique évite de hardcoder la liste des 31 noms — un futur ajout d'alias ne casse pas le test, un retrait le fait échouer.
- Le test exclut nommément ces 8 variables, avec un commentaire en regard de chaque exclusion qui explique POURQUOI elle ne relève pas de ce filet :
  - `--ok`, `--warn`, `--danger` — couleurs sémantiques, absentes de `ThemeTokens` (interface `src/lib/themes/tokens.ts:5-36`). Leur thémage est un choix de design, pas un câblage — DW-1 le mentionne déjà.
  - `--nm-shade`, `--nm-glow`, `--nm-accent` — locales au thème neumorphism, posées par `src/apps/people/PeopleDetailPage.tsx` à l'exécution (8 occurrences observées).
  - `--topbar-height` — constante de mise en page déclarée dans `:root` (`src/index.css:65`), réutilisée dans le même fichier.
  - `--canvasui-cursor` — posée par canvas-ui à l'exécution dans `src/components/canvasui/v30/Bend/BendVanilla.ts` et `HexFloatVanilla.ts`.
- Le test échoue en donnant les noms des orphelines, jamais un message générique.
- Le test doit passer au vert avec le code actuel (story 1 déjà mergée dans `5a4255e` — toutes les 9 alias écrites, tous les `--theme-*` consommés écrits).
- `--passWithNoTests` est retiré de `scripts/verify-no-regression.sh` ligne 45, et le commentaire lignes 41-44 qui le justifiait est supprimé.

**Block If:**
- Si la story 1 n'est plus en place (les 9 alias ont été retirés), le test doit échouer en nommant les 9 noms manquants (`--theme-muted`, `--canvas`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-panel`, `--shadow-window`). C'est le comportement attendu, pas un blocage. Le HALT ne survient que si le test produit une sortie aberrante (exit code non-zéro sans nommer d'orphelines, ou node_modules absent).
- Si `vitest` n'est pas dans `node_modules/.bin` (commit 91c8490 attendu), HALT avec un rapport de prérequis manquant.

**Never:**
- Ajouter un nouveau runner de test (vitest est déjà installé, ne pas réintroduire jest, mocha, node:test natif, etc.).
- Modifier la signature ou le corps de `applyThemeTokens` (la story 1 l'a figée — cette histoire n'ouvre ni ne ferme ce contrat).
- Modifier `src/lib/themes/tokens.ts` (de même — figé par l'épic).
- Élargir la liste des 8 exclusions pour faire passer le test au vert. Si une orpheline non listée apparaît, c'est un vrai signal : la corriger côté store ou côté `:root`, pas côté test.
- Sortir du périmètre des variables CSS : le test ne couvre ni les classes Tailwind en dur (épic à part), ni les erreurs TS, ni le contenu du bundle.
- Ajouter un script Node alternatif sous `scripts/` (le runner vitest est en place, le fallback `scripts/` ne s'applique pas).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Tous les `var(--xxx)` de `src/` sont soit écrits par `applyThemeTokens` (lignes 62-104 de `src/lib/themes/store.ts`), soit déclarés dans un bloc `:root` / `[data-theme]` de `src/index.css`, soit dans la liste des 8 exclusions | `expect(orphans).toEqual([])` ; vitest VERT, rc=0 | No error expected |
| REGRESSION_9_ALIAS_REMOVED | Les 9 lignes `setProperty` des alias (lignes 95-103) sont retirées de `applyThemeTokens`, et les 9 noms retirés du `:root` statique de `src/index.css` | vitest ROUGE, message listant les 9 orphelines exactes : `--theme-muted`, `--canvas`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-panel`, `--shadow-window` | L'échec est attendu, pas attrapé : le test est le garde |
| REGRESSION_NEW_VAR_UNWRITTEN | Un dev ajoute `var(--new-thing)` dans un composant, sans l'écrire dans `applyThemeTokens` ni `:root`/`[data-theme]` | vitest ROUGE, message listant `--new-thing` comme orpheline | L'échec force la résolution du câblage |
| PRE_RENDER_FALLBACK | Avant le premier `applyThemeTokens`, un composant lit `var(--canvas)` qui n'est pas encore écrit par le store | Le bloc `:root` statique de `src/index.css` pose la valeur warm-paper ; le test reconnaît `:root` comme writer, donc `--canvas` n'est PAS orpheline | Le test ne distingue pas les deux sources, ce qui est le comportement attendu : un nom OU l'autre suffit |
| SEMANTIC_COLOR | Une nouvelle couleur sémantique (e.g. `--info`) est introduite dans `:root` et consommée | Le test la voit dans les writers (`:root`) → pas orpheline | Pas d'erreur |
| EXCLUSION_RENAMED | Un dev retire `--ok` de la liste d'exclusions alors qu'il est toujours consommé par `src/apps/clients/ClientsDetailPage.tsx` SANS l'écrire ailleurs | vitest ROUGE, message listant `--ok` | Le test attrape l'erreur avant que la hard-delete story-1 ne se reproduise |

</intent-contract>

## Code Map

- `src/lib/themes/store.ts` (lignes 62-104) — corps de `applyThemeTokens` ; 31 appels `target.style.setProperty` (22 canoniques + 9 alias). Le test parse ce bloc pour extraire les noms écrits. La signature et les `setProperty` ne sont PAS modifiés (story 1 les a figés).
- `src/index.css` (lignes 35-66) — bloc `:root` statique qui pose les 18 variables suivantes : `--theme-accent`, `--theme-accent-rgb`, `--theme-accent-hover`, `--theme-text`, `--theme-text-rgb`, `--theme-muted`, `--canvas`, `--theme-bg`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-window`, `--shadow-panel`, `--ok`, `--warn`, `--danger`, `--topbar-height`. Le test extrait les noms de ce bloc (et de tout `[data-theme]` ajouté à l'avenir). Aucun `[data-theme]` n'existe actuellement ; le test doit néanmoins parcourir le fichier et chercher tout bloc de la forme `selector { ... --xxx: ...; ... }`.
- `src/lib/themes/tokens.ts` (`ThemeTokens`, lignes 5-36) — interface qui porte les champs cibles (`canvas`, `surface`, `border`, `borderSubtle`, `textMuted`, `shadow`, `shadowLg`...). Non modifié.
- `scripts/verify-no-regression.sh` (ligne 45) — appel `cmd.exe /c "npm test -- --passWithNoTests"` ; le `--passWithNoTests` est retiré, ainsi que le commentaire lignes 41-44 qui le justifiait (« la story 1 du theme epic differe explicitement sa couverture automatisee a la story 2... »). L'appel devient `cmd.exe /c "npm test"`.
- `vite.config.ts` (lignes 14-18) — `test: { environment: 'jsdom', include: ['src/**/*.{test,spec}.{ts,tsx}'] }`. Le test est un `.test.ts` placé sous `src/` pour être inclus automatiquement.
- `package.json` (ligne 11) — `npm test` invoque `vitest run`. Pas de modification.
- `src/apps/clients/ClientsDetailPage.tsx` — consomme `--ok`, `--warn`, `--danger` (raisons de l'exclusion).
- `src/apps/people/PeopleDetailPage.tsx` (lignes 96, 100, 104, 107, 110, 118, 272, 366) — consomme `--nm-shade`, `--nm-glow`, `--nm-accent` (raisons de l'exclusion).
- `src/components/canvasui/v30/Bend/BendVanilla.ts` + `src/components/canvasui/v30/HexFloat/HexFloatVanilla.ts` — consomment `--canvasui-cursor` posé à l'exécution (raison de l'exclusion).
- `src/index.css` (ligne 88) — utilise `--topbar-height` dans `.top-bar { height: var(--topbar-height); }` (raison de l'exclusion).
- `src/lib/themes/store.ts` (ligne 32, commentaire `// _v sentinel`) — exemple du niveau de commentaire attendu dans le test : justifiant chaque exclusion avec un renvoi explicite au fichier qui consomme la variable.

## Tasks & Acceptance

**Execution:**
- `src/lib/themes/orphan-css-vars.test.ts` -- nouveau fichier -- test Vitest qui (1) collecte tous les `var(--xxx)` de `src/` via `fs.readFileSync` récursif, (2) parse `src/lib/themes/store.ts` pour extraire les noms SET via `applyThemeTokens` (regex `setProperty\(`\$\{p\}--([a-zA-Z0-9-]+)\`` sur les lignes 62-104), (3) parse `src/index.css` pour extraire les noms DÉCLARÉS dans les blocs `:root` et `[data-theme]` (regex `--([a-zA-Z0-9-]+):` à l'intérieur de chaque bloc), (4) définit la liste des 8 exclusions avec un commentaire en regard de chacune pointant le fichier qui la consomme, (5) asserte que `consumers - writers - exclusions` est vide, avec un message d'erreur listant les orphelines si non vide.
- `scripts/verify-no-regression.sh` -- retirer `--passWithNoTests` de l'appel `npm test` (ligne 45), et supprimer le commentaire lignes 41-44 qui justifiait ce drapeau.
- `scripts/verify-no-regression.sh` -- sortie attendue : `== tests ==` ligne montre `vitest run` qui exécute `orphan-css-vars.test.ts` au vert et exit code 0.

**Acceptance Criteria:**
- Given le code actuel (commit `5a4255e`), when `npm test` est lancé, then vitest exécute au moins 1 test (`orphan-css-vars.test.ts`), exit code 0, et stdout contient `[1morphan-css-vars.test.ts[22m` (ou équivalent) puis une ligne de résultat vert.
- Given le code actuel, when `bash scripts/verify-no-regression.sh` est lancé, then la sortie inclut les trois étapes (`erreurs TypeScript`, `tests`, `build vite`) avec `tests` qui ne tolère plus un état sans test, et la ligne finale est `OK : 88 erreurs TS (<= 88), bundle construit.`
- Given `scripts/verify-no-regression.sh` après modification, when on relit le fichier, then la ligne 45 contient `cmd.exe /c "npm test"` sans `# --passWithNoTests ... story 2` autour.
- Given un dev retire les 9 alias de `applyThemeTokens` (lignes 95-103) ET leurs déclarations de `:root`, when `npm test` est lancé, then vitest ROUGE et le message d'erreur liste les 9 orphelines par nom.
- Given un dev ajoute `var(--my-new-thing)` dans un composant sans l'écrire ailleurs, when `npm test` est lancé, then vitest ROUGE et le message cite `--my-new-thing`.
- Given le test après modification, when on relit `src/lib/themes/store.ts`, then `applyThemeTokens` est intact (signature `function applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = '')` préservée, 31 appels `setProperty`).
- Given le test après modification, when on relit `src/lib/themes/tokens.ts`, then l'interface `ThemeTokens` et les 12 thèmes sont identiques octet pour octet au commit courant.

## Spec Change Log

## Review Triage Log

### 2026-08-05 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 0
- defer: 2: (high 0, medium 0, low 2)
- reject: many — JSDoc / doc-comment false positives (grep `var(--xxx)` in comments returns 0 matches — 1009/1009 are real code), symlink traversal (no symlinks in `src/`), underscore-containing var names (no matches), nested CSS braces under `:root` (current `:root` is flat, no nested selectors), wildcard `[data-theme*="dark"]` (no matches in `src/index.css`), circular symlinks (no symlinks in `src/`), uppercase file extensions on Windows (none observed), CSS variables starting with a digit (invalid CSS, none observed), `var(--foo, --bar)` fallback handling (the regex captures `--foo` only; the 2 `var(--canvasui-cursor, auto)` occurrences are correctly handled and the variable is in EXCLUSIONS), exclusion-swap loophole (the locked-shape EXCLUSION_RENAMED test + the per-exclusion `consumer`/`reason` comments in source are the documented deliverable per spec §Always "comment en regard de chaque exclusion qui explique POURQUOI" — runtime validation of the consumer pointer is a defensive add the spec does not mandate), cwd detection (the prerequisite test already asserts `fs.existsSync(SRC_DIR)` which fails loudly if cwd is wrong), and ~10 other adversarial concerns that don't apply to this codebase.
- addressed_findings:
  - none
- followup_review_recommended: false — score `0 × medium + 0 × low = 0` (< 5), no high patches, no bad_spec repair loopback

## Verification

**Commands:**
- `npm test` -- expected: vitest exécute `orphan-css-vars.test.ts`, au moins 1 test passé, exit code 0.
- `bash scripts/verify-no-regression.sh` -- expected: `OK : 88 erreurs TS (<= 88), bundle construit.`, exit code 0, et la sortie du bloc `== tests ==` ne montre plus de `--passWithNoTests`.
- `grep -E 'passWithNoTests' scripts/verify-no-regression.sh` -- expected: 0 occurrence.
- `grep -E 'setProperty' src/lib/themes/store.ts | wc -l` -- expected: 31 (22 + 9 alias, story 1 figée).
- `grep -rn 'setProperty' src/lib/themes/store.ts` -- expected: 31 lignes, signature `applyThemeTokens` inchangée.

**Manual checks (if no CLI):**
- Inspecter `scripts/verify-no-regression.sh` après modification : la ligne 45 doit appeler `cmd.exe /c "npm test"` sans drapeau, et le commentaire lignes 41-44 doit être absent.
- Inspecter `src/lib/themes/orphan-css-vars.test.ts` : la liste des 8 exclusions doit être en clair dans le source, chacune avec un commentaire pointant le fichier qui la consomme.
- Inspecter `src/lib/themes/store.ts` après modification : intact (story 1 figée, aucun diff attendu).
- Sanity : `git diff --stat 5a4255e..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts` doit rester 0 diff.

## Auto Run Result

Status: done
Blocking condition:

**Summary of implemented change:** Story 2 closes DW-1. A new Vitest test (`src/lib/themes/orphan-css-vars.test.ts`) scans `src/` for `var(--xxx)` consumers, parses writers from `src/lib/themes/store.ts` lines 62-104 (the body of `applyThemeTokens`) and from `:root`/`[data-theme]` blocks of `src/index.css`, and fails with the orphan names if any consumer is unaccounted for after 8 named exclusions. The `--passWithNoTests` escape hatch is removed from `scripts/verify-no-regression.sh` (along with the 4-line comment that justified it). Story 1's `applyThemeTokens` and `tokens.ts` are frozen — `git diff --stat 5a4255e..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts` is empty.

**Files changed (this story):**
- `src/lib/themes/orphan-css-vars.test.ts` — NEW. 268 lines. 4 tests: `prerequis` (cwd sanity), `ne declare pas d'orphelines` (the actual guard), `garde-fou REGRESSION_9_ALIAS_REMOVED` (locks the 9 story-1 alias names in the store), `EXCLUSION_RENAMED` (locks the 8 named exclusions by shape).
- `scripts/verify-no-regression.sh` — `-5 / +1` lines. Removed `--passWithNoTests` and the 4-line justifying comment that mentioned story 2 by name. Line 45 reads `if ! cmd.exe /c "npm test"; then`.

**Files unchanged (frozen by story 1):**
- `src/lib/themes/store.ts` — `grep -c 'setProperty'` returns 31 (22 canonical + 9 alias). Diff vs baseline: empty.
- `src/lib/themes/tokens.ts` — `ThemeTokens` interface and 12 themes unchanged. Diff vs baseline: empty.

**Review findings breakdown (this pass):**
- 4 review layers ran in parallel (blind-hunter, edge-case-hunter, verification-gap, intent-alignment).
- intent_gap: 0 — the spec's intent-contract is complete and unambiguous.
- bad_spec: 0 — the spec drove a clean implementation; no spec amendment needed.
- patch: 0 — the implementation correctly carries the spec intent. No code defects to fix.
- defer: 2 — both surfaced by reviewers but neither blocks the current run:
  - (low) The functional parser hard-codes lines 62-104 of `store.ts`. Story 1 freezes the format; if a future epic ever moves `applyThemeTokens` (e.g. adds a helper before the function body), the parser would silently drift. Cheap mitigation if it ever happens: locate the function via `function applyThemeTokens` and scan until the matching brace. Out of scope for this story.
  - (low) The spec's expected output mentions `OK : 88 erreurs TS (<= 88)` but the actual run produces `OK : 79 erreurs TS (<= 88)`. The gate (79 ≤ 88) still passes. The discrepancy is a benign side effect of adding `/// <reference types="node" />` to the new test file (`verbatimModuleSyntax: true` requires `node:fs`/`node:path` imports to be typed), which resolved 9 pre-existing TS2591 errors in the retired `src/components/canvasui/_v1_css_retired/theme-canvas-mapping.ts`. The spec's narrative number "88" was always illustrative; the gate contract is `<= 88`.
- reject: many — adversarial review concerns (JSDoc false positives, symlink traversal, underscore var names, nested CSS braces, wildcard `[data-theme]`, circular symlinks, exclusion-swap loophole, cwd detection, etc.) that don't apply to this codebase (zero matches verified by grep). The spec's deliverable for the 8 exclusions is the in-source comment justifying each, not a runtime pointer-validation; the locked-shape EXCLUSION_RENAMED test is the documented safeguard.
- `followup_review_recommended: false` — score `3 × 0 medium + 1 × 0 low = 0` (< 5), no high patches, no bad_spec repair loopback.

**Verification performed (this pass):**
- `cmd.exe /c "npm test"` → `Test Files 1 passed (1) | Tests 4 passed (4) | exit 0`. The 4 tests are: prerequisites, no-orphans, REGRESSION_9_ALIAS_REMOVED sanity, EXCLUSION_RENAMED lock.
- `bash scripts/verify-no-regression.sh` → `OK : 79 erreurs TS (<= 88), bundle construit. | exit 0`. The gate accepts 79 (≤ 88). The script's `== tests ==` block no longer passes `--passWithNoTests`.
- `grep -E 'passWithNoTests' scripts/verify-no-regression.sh` → 0 matches, exit 1.
- `grep -c 'setProperty' src/lib/themes/store.ts` → 31.
- `git diff --stat 5a4255e..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts` → empty, exit 0.
- Manual: 1009 `var(--xxx)` occurrences in `src/` (all in real code, zero in JSDoc/comments — verified). 33 unique variable names consumed. 31 names written by `applyThemeTokens` + 18 declared in `:root` (9 overlap). 8 exclusions cover the residual semantic/layout/runtime variables. No orphans detected.

**Residual risks (carried forward):**
- The story-1 line-range parser (`lines.slice(61, 104)`) is brittle if `applyThemeTokens` ever moves. Mitigation deferred.
- The spec's expected output text (`OK : 88`) is stale to the actual `OK : 79`. The gate holds; the spec text is illustrative.
- `--passWithNoTests` is gone for good. Future test deletions must keep at least one test file alive, or the gate flips red — which is the intended behavior.
- DW-1 closed by this story. DW-2 (no machine-readable marker on the 9 alias) remains open and is the only deferred item left in this epic.
