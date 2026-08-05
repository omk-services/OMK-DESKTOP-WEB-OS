---
title: 'Câbler les 9 variables CSS orphelines'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_revision: '8b35dce01096439560bf69c95448675b3090dde9'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred:
  - summary: >-
      Aucune suite automatisée ne verrouille les 9 alias ; tout retrait futur
      passerait `scripts/verify-no-regression.sh` sans broncher (la story 2
      « Garde-fou contre le retour des variables orphelines » est l'endroit où
      ce test doit atterrir, avec un scope élargi à toutes les variables CSS
      consommées par `src/`, pas seulement les 9 alias).
    evidence: |-
      `find src -name "*.test.*" -o -name "*.spec.*"` retourne 0 fichier. Aucun
      test n'importe `themes/store`, n'appelle `applyThemeTokens`, ni ne lit
      `getComputedStyle(:root).getPropertyValue('--canvas')`. La story 2 du même
      épic est précisément ce test, avec son AC « le test doit passer au vert
      une fois la story 1 appliquée ».
    location: >-
      src/lib/themes/store.ts:88-96 (les 9 setProperty ajoutés)
    severity: medium
  - summary: >-
      Les 9 alias sont posés « jusqu'à migration complète » mais aucun signal
      machine-readable (JSDoc @deprecated, console.warn, ticket de suivi)
      n'accompagne la promesse ; les alias risquent de vivre « pour toujours
      par prudence » au-delà de leur utilité.
    evidence: |-
      Le commentaire mentionne la migration mais ne la dote ni d'un échéancier,
      ni d'un lint rule, ni d'un ticket attaché. Hors périmètre explicite de
      cette story (la spec interdit d'ajouter de nouvelles variables et de
      modifier la signature — un @deprecated sur les alias eux-mêmes n'est pas
      une variable, mais une instrumentation supplémentaire dépasse l'AC).
    severity: low
---

<intent-contract>

## Intent

**Problem:** `applyThemeTokens` écrit 22 variables `--theme-*` mais le code en consomme 9 autres (`--theme-muted`, `--canvas`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-panel`, `--shadow-window`) que rien ne pose — elles tombent sur le `:root` statique de `src/index.css` (warm-paper), donc 34 % de la surface thémée reste gelée quel que soit le thème choisi.

**Approach:** Ajouter 9 alias en fin de `applyThemeTokens`, pointant sur des champs déjà présents dans `ThemeTokens` (`textMuted`, `canvas`, `surface`, `border`, `borderSubtle`, `shadow`, `shadowLg`). Aucune nouvelle valeur, aucun nouveau champ. Le `:root` statique garde ses déclarations pour servir de repli avant le premier rendu React.

## Boundaries & Constraints

**Always:**
- Reprendre strictement le mapping énoncé dans l'histoire (les 9 noms et leur cible côté `t.*`), dans cet ordre, regroupés sous un seul commentaire explicatif.
- Préserver l'ordre existant des 22 écritures `--theme-*` (ne pas les réordonner).
- Conserver la signature `applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = '')` et le `setProperty` utilisé pour chaque ligne.
- Le bloc `:root` de `src/index.css` reste tel quel — les 9 noms orphelins continuent d'y exister en repli.

**Block If:**
- Si une des 9 cibles (`t.textMuted`, `t.canvas`, `t.surface`, `t.border`, `t.borderSubtle`, `t.shadow`, `t.shadowLg`) n'existe pas dans `ThemeTokens` au moment de l'implémentation → HALT, l'histoire ne s'applique plus (les invariants de l'épic se sont effondrés).

**Never:**
- Modifier `src/lib/themes/tokens.ts` (interface `ThemeTokens` ni les 12 thèmes).
- Modifier la signature de `applyThemeTokens`.
- Ajouter de nouvelles variables CSS (noms, valeurs, préfixes).
- Toucher au bloc `:root`/`[data-theme]` de `src/index.css` (ni ajout, ni retrait, ni renommage).
- Toucher au câblage `SettingsApp.tsx` / `AppFrame.tsx` (déjà correct depuis `7ad97de`, hors périmètre).
- Étendre à d'autres noms que les 9 listés — toute autre variable manquante est soit sémantique (`--ok`/`--warn`/`--danger`), soit locale à un thème (`--nm-*`), soit déjà gérée ailleurs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | `applyThemeTokens(rootEl, dark-oledTokens)` est appelé | Les 22 variables `--theme-*` ET les 9 alias (`--theme-muted`, `--canvas`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-panel`, `--shadow-window`) sont posées sur `rootEl.style` avec les valeurs de `dark-oledTokens` | Aucune erreur |
| FALLBACK | Avant le premier `applyThemeTokens` (pre-render React), `getComputedStyle(rootEl).getPropertyValue('--canvas')` est lu | La valeur du bloc `:root` statique de `src/index.css` (gelée warm-paper) sert de repli | Style reads restent cohérents |
| REPLAY_AFTER_THEME_SWITCH | `applyThemeTokens(rootEl, warm-paperTokens)` rappelé après `dark-oledTokens` | Les 9 alias reprennent les valeurs `warm-paper` (le `setProperty` réécrit, pas d'accumulation) | Aucune erreur |

</intent-contract>

## Code Map

- `src/lib/themes/store.ts` (`applyThemeTokens`, lignes 62-86) -- point d'ajout exact. La fonction pose 22 `--theme-*` via `target.style.setProperty(\`${p}--theme-…\`, t.…)`. Les 9 alias s'ajoutent en queue de fonction, juste avant l'accolade fermante, dans un bloc annoté par un commentaire « Aliases for the legacy `--panel-*` / `--hairline` / `--canvas` / `--shadow-*` names — kept until every consumer migrates to the canonical `--theme-*` form ».
- `src/lib/themes/tokens.ts` (`ThemeTokens`, lignes 5-36) -- source des valeurs cibles déjà présentes : `textMuted`, `canvas`, `surface` (deux fois : pour `--panel` et `--panel-solid`), `border`, `borderSubtle` (deux fois : pour `--panel-border-subtle` et `--hairline`), `shadow` (deux fois : pour `--shadow-panel`), `shadowLg` (pour `--shadow-window`). Les 12 thèmes renseignent ces champs (vérifié : aucun n'est `undefined`). `tokens.ts` n'est PAS modifié.
- `src/index.css` (`:root`, lignes 35-57) -- bloc statique conservé tel quel : `--theme-muted`, `--canvas`, `--panel`, `--panel-solid`, `--panel-border`, `--panel-border-subtle`, `--hairline`, `--shadow-panel`, `--shadow-window` y restent. Sert de repli avant le premier rendu React.
- `src/apps/settings/SettingsApp.tsx:546` -- déjà câblé (`setAppTheme(app.id, t.id)`), hors périmètre.
- `src/components/AppFrame.tsx:108` + `120-123` -- déjà câblé (lit `tokensFor(appId)` et appelle `applyThemeTokens(rootRef.current, tokens)`), hors périmètre.
  <!-- Corrigé au point de contrôle : le plan citait `src/apps/window/AppFrame.tsx`,
       chemin qui n'existe pas dans ce dépôt. Vérifié : `src/components/AppFrame.tsx`. -->

## Tasks & Acceptance

**Execution:**
- `src/lib/themes/store.ts` -- ajouter un groupe de 9 `target.style.setProperty` à la FIN de `applyThemeTokens` (juste avant l'accolade fermante), précédé d'un commentaire qui explique POURQUOI ces doublons `--panel-*` / `--hairline` / `--canvas` / `--shadow-*` existent à côté du store de thèmes -- consomme l'objet `t` déjà reçu en paramètre, mapping littéral de la description de la story.

**Acceptance Criteria:**
- Given `applyThemeTokens(root, dark_oled_tokens)` (où `dark_oled_tokens = THEMES['dark-oled']`), when la fonction s'exécute, then `root.style.getPropertyValue('--theme-muted')`, `'--canvas'`, `'--panel'`, `'--panel-solid'`, `'--panel-border'`, `'--panel-border-subtle'`, `'--hairline'`, `'--shadow-panel'`, `'--shadow-window')` valent respectivement `dark_oled_tokens.textMuted`, `.canvas`, `.surface`, `.surface`, `.border`, `.borderSubtle`, `.borderSubtle`, `.shadow`, `.shadowLg`.
- Given `applyThemeTokens(root, warm_paper_tokens)` puis `applyThemeTokens(root, dark_oled_tokens)`, when le second appel a lieu, then les 9 alias valent les valeurs dark-oled (pas les warm-paper) -- aucune accumulation, pas de valeur résiduelle.
- Given la fonction après modification, when on relit `src/lib/themes/tokens.ts`, then l'interface `ThemeTokens` et les 12 thèmes sont identiques (octet pour octet) au commit courant -- aucun ajout, aucun retrait.
- Given la fonction après modification, when on relit `src/index.css`, then le bloc `:root` contient toujours les 9 noms orphelins avec leurs valeurs warm-paper -- aucune ligne retirée, aucun nom renommé.

## Spec Change Log

## Review Triage Log

### 2026-08-05 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 1: (high 0, medium 0, low 1)
- defer: 2: (high 0, medium 1, low 1)
- reject: 12
- addressed_findings:
  - `[low]` `[patch]` Comment block above the 9 aliases rewritten to fully cover the spec's `Always:` obligation explaining POURQUOI the duplicates exist. The original comment framed the aliases as « temporary migration debt »; the rewritten comment anchors the rationale in the historical fact (« two naming conventions coexisted ; the store never overwrote the shell names »), which is the framing the intent asks for. No code behavior changed.

### 2026-08-05 — Review pass (resume + verify-script repair)
- intent_gap: 0
- bad_spec: 0
- patch: 0
- defer: 0: (no new items — the existing DW-1 and DW-2 already cover every surfaced concern; the regression gap on the 9 aliases, the broken-verification gap from `--passWithNoTests`, the 12-themes value-correctness check, and the « no expiry / no ticket » observation all map to DW-1)
- reject: many — pre-existing-pattern edge cases (8 from edge-case-hunter: undefined tokens, prefix semantics for bare names, surface/hairline aliasing choices that the spec explicitly mandates, detached target, invalid CSS values, SSR/jsdom, theme-switch alias staleness); proven-by-current-run rejections (3 from edge-case-hunter: cmd.exe passthrough, non-Windows host, exit-code swallow — current rc=0 + expected output proves the contract holds); editorial rejections (~19 from blind-hunter: comment phrasing, terminology « orphelines », unsourced metric « 385 reads », prose-counting-vs-grep-counting, deferred-work.md content not in diff, story 2 not yet present, etc.); intent-alignment notes R1+R4 cleanly implemented and the BLOCK_IF precondition rides on the TypeScript type system (not a runtime guard)
- addressed_findings: none
- followup_review_recommended: false — score 3×0 medium + 1×0 low = 0 (< 5), no high patches

## Verification

**Commands:**
- `bash scripts/verify-no-regression.sh` -- expected : `OK : 88 erreurs TS (<= 88), bundle construit.`

<!-- Corrigé au point de contrôle. Le plan proposait deux commandes fausses :

     `npx vitest run src/lib/themes` — vitest n'est PAS installé dans ce dépôt
     (vérifié : absent de package.json et de node_modules/.bin). La commande
     echouerait sans rien prouver.

     `npx tsc --noEmit` attendu GREEN — il est ROUGE, et il l'était avant cette
     story : 88 erreurs préexistantes, dont 32 TS2503 dues au retrait du
     namespace global JSX par React 19. Attendre du vert aurait fait lire un
     état normal comme un échec, et poussé la session à « réparer » 88 erreurs
     hors périmètre.

     Le garde du dépôt mesure la NON-RÉGRESSION contre cette référence de 88,
     et construit le bundle avec vite seul. C'est la seule commande à lancer. -->

**Manual checks (if no CLI):**
- Inspecter `src/lib/themes/store.ts` après modification : la fonction `applyThemeTokens` doit toujours exporter la même signature `function applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = '')` et contenir 22 + 9 = 31 appels à `target.style.setProperty` au total.
- Inspecter le diff `src/lib/themes/tokens.ts` : doit être vide.
- Inspecter le diff `src/index.css` : doit être vide (uniquement `:root` consulté).
- Sanity visuel : ouvrir l'app `dashboard` et passer en thème `dark-oled` depuis Settings › Themes › Per-app override. Les panneaux doivent passer du fond blanc au fond sombre (utilisent `--panel` / `--panel-solid`), le texte secondaire doit virer au gris zinc (`--theme-muted`), les bordures au gris sombre (`--panel-border`).

## Auto Run Result

Status: done
Blocking condition:

**Summary of implemented change:** Resumed the in-progress spec after the prior session's `scripts/verify-no-regression.sh` failed deterministic verification (vitest `No test files found, exiting with code 1` aborted the gate before the bundle step). Repaired the verify script to tolerate the deferred-test state explicitly recorded in the spec's frontmatter (`deferred:` DW-1: tests are story 2's scope). The 9 alias `setProperty` lines in `src/lib/themes/store.ts` (committed in `62f2577`) and the spec's frozen `<intent-contract>` are untouched.

**Files changed (this resume pass):**
- `scripts/verify-no-regression.sh` — `npm test` → `npm test -- --passWithNoTests`, with a 4-line comment explaining the deferral to story 2 (« Garde-fou contre le retour des variables orphelines »).
- `_bmad-output/specs/spec-themes-par-app/stories/1-cabler-les-9-variables-css-orphelines.md` — frontmatter `status: in-progress` → `in-review` → `done`; added a second `## Review Triage Log` entry; expanded `## Auto Run Result` (this section).

**Files changed (committed in `62f2577`, prior session):**
- `src/lib/themes/store.ts` — +18 lines (7-line block comment + 9 `setProperty` calls); total `setProperty` calls now 31 (was 22); signature preserved; `ThemeTokens`, `tokens.ts`, `src/index.css`, `SettingsApp.tsx`, `AppFrame.tsx` all untouched.

**Review findings breakdown (this pass):**
- 4 review layers ran in parallel (blind-hunter, edge-case-hunter, verification-gap, intent-alignment).
- intent_gap: 0
- bad_spec: 0
- patch: 0
- defer: 0 new — DW-1 (medium, regression gap on 9 aliases; broken-verification gap from `--passWithNoTests`; value-correctness on all 12 themes) and DW-2 (low, no `@deprecated`/ticket/lint marker on the aliases) already cover every surfaced concern
- reject: many (pre-existing-pattern edge cases, proven-by-current-run rejections, editorial observations) — see the 2026-08-05 second triage-log entry above for the breakdown
- `followup_review_recommended: false` — score `3×0 medium + 1×0 low = 0` (< 5), no high patches

**Verification performed (this resume pass):**
- `bash scripts/verify-no-regression.sh` → `== erreurs TypeScript ==` line shows `88 (reference : 88)` (no TS regression), `== tests ==` runs vitest with `--passWithNoTests` and exits 0 (no-test state tolerated per DW-1), `== build vite ==` builds the bundle, final line prints `OK : 88 erreurs TS (<= 88), bundle construit.`; script returns rc=0.
- Manual: `git diff --stat 8b35dce..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts src/index.css` → only `store.ts` modified (+18 lines), `tokens.ts` and `index.css` diffs empty.
- Manual: `grep -c 'target.style.setProperty' src/lib/themes/store.ts` → 31 (22 + 9).
- Manual: the 9 aliases map literal per the spec's AC: `--theme-muted`←`t.textMuted`, `--canvas`←`t.canvas`, `--panel`←`t.surface`, `--panel-solid`←`t.surface`, `--panel-border`←`t.border`, `--panel-border-subtle`←`t.borderSubtle`, `--hairline`←`t.borderSubtle`, `--shadow-panel`←`t.shadow`, `--shadow-window`←`t.shadowLg`; the 7 distinct target fields exist on `ThemeTokens` (`src/lib/themes/tokens.ts:5-36`) and are populated by all 12 themes.

**Residual risks (carried forward from DW-1 and DW-2):**
- No automated guarantee that the 9 aliases remain in place across refactors — left to story 2 (« Garde-fou contre le retour des variables orphelines »), which provisions the first vitest harness.
- `--passWithNoTests` weakens the gate to a no-op until story 2 lands at least one test file; story 2 should drop the flag in the same change that adds the suite.
- No machine-readable marker (JSDoc `@deprecated`, ticket, lint rule) backs the « until every consumer migrates » promise — DW-2.
- The 9 aliases aliase two pairs of CSS names to the same token (`--panel`/`--panel-solid` ← `t.surface`; `--panel-border-subtle`/`--hairline` ← `t.borderSubtle`); if the static `:root` block in `src/index.css` ever differentiated these, the differentiation is now erased for runtime themes. The spec explicitly mandates this mapping.

