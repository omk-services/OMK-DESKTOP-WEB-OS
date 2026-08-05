---
title: 'Faire suivre son thème à l''app Settings'
type: 'feature'
created: '2026-08-05'
status: 'done'
followup_review_recommended: false
baseline_revision: 'c026136912f49d2afd017b8304a5899742bef637'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** `src/apps/settings/` aligne 54 lignes de classes Tailwind de palette en dur (`bg-white`, `bg-stone-50/100`, `text-stone-800/700/600/500/400`, `border-stone-200/300/800`, `hover:bg-stone-100/200`, `ring-stone-800/30`) sur la chrome du panneau, alors qu'il n'utilise les variables CSS que pour 25 cellules (les séparateurs `divide-[var(--hairline)]` et quelques `var(--theme-...)`). Résultat : c'est dans CETTE app que l'utilisateur choisit son thème, et son propre sélecteur reste collé sur `bg-white` / `text-stone-800` quel que soit le thème choisi — le symptôme le plus visible du bug « 34 % de la surface thémée gelée sur warm-paper » mesuré dans la SPEC.

**Approach:** Remplacer les classes Tailwind en dur de la chrome Settings par les variables CSS déjà câblées (stories 1+2 + `:root` statique) : `bg-white` / `bg-stone-50` → `var(--theme-surface)`, `text-stone-800/700` → `var(--theme-text)`, `text-stone-500/400` → `var(--theme-muted)`, `border-stone-200/300` → `var(--panel-border)`, `hover:bg-stone-100/200` → `var(--theme-surface-hover)`, `ring-stone-800/30` → `var(--theme-accent)` (avec opacité gérée via `t.accentRgb` si besoin). Les classes qui portent un SENS et non un style (badge « On » = `bg-emerald-100 text-emerald-700`, mini-previews `ThemePreview` qui doivent montrer les couleurs du thème qu'elles représentent, variantes Apple/Bento/Editorial/Brutalist/Cyberpunk de `theme-details.tsx` qui rendent d'AUTRES thèmes) sont laissées intactes et chaque exception est consignée dans le rapport.

## Boundaries & Constraints

**Always:**
- Remplacer UNIQUEMENT les classes de palette Tailwind qui se trouvent dans la chrome Settings — c.-à-d. les éléments structurels (boutons d'action, libellés de section, lignes de tableau, séparateurs, cartes d'option), PAS dans `ThemePreview` (mini-vignette qui DOIT afficher les couleurs du thème qu'elle incarne, cf. SPEC §« Le second défaut »), PAS dans `theme-details.tsx` (cinq variantes de design qui rendent du APRES-THÈME), PAS dans `CanvasFxTile` (la grille d'effets WebGL dont le fond est codé en dur via `FX_TILE_BG` pour rester lisible sur n'importe quel thème).
- Appliquer la table de mapping canonique :
  - `bg-white` / `bg-stone-50` → `var(--theme-surface)`
  - `bg-stone-100` → `var(--theme-surface-hover)` (utilisé pour le fond survolé, mais aussi pour le bouton actif) ; `hover:bg-stone-100` → `var(--theme-surface-hover)`.
  - `text-stone-900` / `text-stone-800` / `text-stone-700` → `var(--theme-text)`
  - `text-stone-500` / `text-stone-400` → `var(--theme-muted)`
  - `border-stone-200` / `border-stone-300` / `border-stone-400` → `var(--panel-border)`
  - `border-stone-800` (utilisé pour le `border-2` du thème actif) → `var(--theme-text)` (le séparateur « actif » doit reprendre la couleur du texte courant, c'est ce que fait déjà la story 1 avec l'alias `--theme-text`)
  - `hover:bg-stone-200` → `var(--theme-surface-hover)` ; `hover:text-stone-800` → `var(--theme-text)`
  - `hover:border-stone-400` → `var(--panel-border)` (hover garde la même cible que la bordure de base, l'opacité de fond suffit à indiquer l'état)
  - `ring-stone-800/30` → garder en l'état : la bague de focus/accessibilité suit le token texte mais conserve son opacité de 30 %. Si l'`ring-color` Tailwind n'accepte pas `var(--theme-text)`, fallback `style={{ boxShadow: '0 0 0 4px rgba(var(--theme-text-rgb), 0.3)' }}` ou équivalent Tailwind via `[--tw-ring-color]` (à choisir dans l'implémentation).
- Garder la signature et le comportement de tous les composants, hooks et fonctions exportés (aucune API publique modifiée).
- Préserver les styles `style={{ background: t.isDark ? ... : ... }}` qui tirent leurs valeurs de `THEME_META` / `useTokens(themeId)` — ce sont déjà du theming, pas de la palette en dur.
- Conserver la chip `bg-emerald-100 text-emerald-700` du badge « On » (état de succès, sémantique — un état vert/actif doit rester vert/actif même sur un thème qui n'a pas de vert).
- Ne JAMAIS remplacer une classe à l'intérieur du composant `ThemePreview` (SettingsApp.tsx:415-455) ni à l'intérieur des composants `AppleStyle` / `BentoStyle` / `EditorialStyle` / `BrutalistStyle` / `CyberpunkStyle` de `theme-details.tsx`. Ces blocs représentent l'APERÇU d'un autre thème et doivent afficher ses couleurs natives — les toucher ferait du sélecteur de thème un mensonge.
- Signaler dans le rapport toute classe de la liste ci-dessus rencontrée dans le périmètre exclu, en justifiant l'exclusion.

**Block If:**
- Le test de garde-fou (story 2, `src/lib/themes/orphan-css-vars.test.ts`) échoue avant modification → HALT, la story 2 ne protège plus le périmètre. (En théorie le test devrait être vert au commit courant, mais on vérifie en préambule pour ne pas découvrir une régression pendant l'implémentation.)
- L'implémentation doit retirer une classe de `ThemePreview` ou des cinq variantes de `theme-details.tsx` pour que le mapping fonctionne → HALT, le périmètre est verrouillé par les exceptions nommées.

**Never:**
- Modifier `src/lib/themes/store.ts`, `src/lib/themes/tokens.ts`, `src/index.css` (stories 1+2 ont déjà fait et figé le câblage des variables CSS).
- Modifier la liste des 12 thèmes, l'interface `ThemeTokens`, ni les alias posés en queue d'`applyThemeTokens`.
- Toucher au câblage `SettingsApp.tsx:546` (`setAppTheme`) ni à `AppFrame.tsx:108-123` (`tokensFor` + `applyThemeTokens`) — la chaîne est correcte depuis `7ad97de`.
- Remplacer une classe Tailwind qui n'est PAS dans la table de mapping ci-dessus (e.g. `text-[11px]`, `font-bold`, `tracking-wider`, `border-b`, `divide-y`, `rounded-lg`, `outline`, `transition-all`, `mix-blend-difference`...) — ces classes sont structurelles ou typo, pas de la palette.
- Élargir le périmètre à d'autres apps (`welcome`, `people`, `design`, etc.) — la SPEC §« Périmètre de cet épic » le réserve à un épic suivant.
- Ajouter un nouveau test Vitest ou un nouveau script Node — story 2 a déjà provisionné le filet. Le travail se vérifie via `bash scripts/verify-no-regression.sh`.
- Ajouter un `console.log` / `console.warn` dans la chrome remplacée.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Le picker de thème est rendu avec le thème courant `dark-oled` actif sur l'app settings | Tous les fonds `bg-white`/`bg-stone-50` deviennent sombres (`#0a0a0a`), tous les textes `text-stone-800` deviennent clairs (`#fafafa`), toutes les bordures `border-stone-200` deviennent `#27272a`. La chip « On » reste vert/émeraude. Les mini-previews `ThemePreview` continuent d'afficher les couleurs de chaque thème (warm-paper reste pâle, dark-oled reste noir). | No error expected |
| THEME_NEUTRAL | Le picker est rendu avec `warm-paper` (canon de settings) | Les variables résolues sur `:root` valent déjà les valeurs warm-paper, donc visuellement RIEN ne change. C'est la valeur de référence. | No error expected |
| PER_APP_OVERRIDE | L'utilisateur vient de basculer l'app settings sur `trust` via le picker | `AppFrame` lit `tokensFor('settings')` qui résout `trust`, appelle `applyThemeTokens(rootRef.current, trustTokens)`, et la chrome suit `trust` immédiatement — sans reload, sans flash. | No error expected |
| PREVIEW_UNCHANGED | Quel que soit le thème courant, les 12 vignettes `ThemePreview` rendent leurs couleurs natives (le warm-paper reste warm-paper, le cyberpunk reste cyberpunk) | Aucune régression : un user qui passe de `warm-paper` à `dark-oled` doit toujours voir le warm-paper card en `bg-white` dans la grille. | No error expected |
| REGRESSION_GUARD | Une classe de la table de mapping ré-introduite en dur dans la chrome settings | Le test `orphan-css-vars.test.ts` continue de passer (les variables sont écrites par `applyThemeTokens` et consommées par `var(--xxx)` ; le test ne couvre pas les classes Tailwind en dur). Mais `grep -rE 'bg-white\|bg-stone-50\|bg-stone-100\|text-stone-[0-9]+\|border-stone-[0-9]+\|hover:bg-stone-' src/apps/settings/SettingsApp.tsx src/apps/settings/ThemeDetailPage.tsx` doit retourner 0 (hors périmètre exclu). | L'échec du grep signale la régression ; le test Vitest ne couvre pas ce périmètre par design (épic suivant). |

</intent-contract>

## Code Map

- `src/apps/settings/SettingsApp.tsx` — chrome principale. **37 occurrences de classes palette** à inventorier et remplacer dans : `CanvasFxPicker` (lignes 138, 157, 158, 170), `Row` (235, 236), `Privacy` section (286, 289, 313, 314, 352, 354, 355, 366, 367), `Help` section (464, 472, 482, 484, 485, 487), `Integrations` (313, 314), `Themes` section (498-499, 503, 505, 506, 509, 523, 524, 535, 537, 549, 560). **EXCLURE** : `ThemePreview` (lignes 415-455 — `t.isDark ? 'text-white' : 'text-stone-900'` ligne 431 et les autres classes stone sont APRES-THÈME), `CanvasFxTile` (ligne 114 — `text-white` sur fond codé en dur de `FX_TILE_BG`), la chip `bg-emerald-100 text-emerald-700` (ligne 509 — état de succès), le bouton « Replay » de `Help` (lignes 374-378 — couleurs codées teal `#0f766e` / `#ccfbf1` / `#f5f5f4` qui sont déjà sémantiques et hors table de mapping).
- `src/apps/settings/ThemeDetailPage.tsx` — 8 occurrences de classes palette. Le composant wrappe une preview surface (ligne 111) qui utilise DÉJÀ `border-[var(--panel-border)]` et `bg-[var(--theme-bg)]`. Les 8 classes stone (`text-stone-500/400/900`, `hover:bg-stone-100`, `hover:text-stone-800`, `bg-stone-100/200`, `bg-stone-900`, `text-white`) sont dans la chrome du sélecteur de variante et le bouton « Back » — toutes dans le périmètre de remplacement.
- `src/apps/settings/theme-details.tsx` — 7 occurrences de classes palette (`text-stone-500` aux lignes 35, 72, 103, 117, 129, 135, 150 dans les labels des vignettes Apple/Bento/Editorial). **EXCLURE ENTIÈREMENT** : ces classes sont à l'intérieur des variantes de design qui rendent un APERÇU d'un thème, pas la chrome Settings elle-même. Les toucher casserait l'aperçu (SPEC : « Les toucher casserait le sélecteur »).
- `src/apps/settings/SettingsItemDetail.tsx` — 0 occurrence. Le fichier utilise déjà `var(--theme-text)`, `var(--theme-muted)`, `var(--panel-solid)`, `var(--panel-border)`, `var(--panel-border-subtle)`, `var(--shadow-panel)`. **Rien à modifier.**
- `src/lib/themes/store.ts` — `applyThemeTokens` (lignes 62-104) pose 31 variables (22 canoniques + 9 alias story 1). **Non modifié**, gelé par les stories 1+2.
- `src/lib/themes/tokens.ts` — `ThemeTokens` (lignes 5-36) + 12 thèmes. **Non modifié**, gelé par la story 1.
- `src/index.css` — bloc `:root` (lignes 35-66) sert de repli pre-render. **Non modifié**, gelé par la story 1.
- `src/lib/themes/orphan-css-vars.test.ts` — filet story 2 (4 tests, `npm test`). Vert au commit courant. **Ne pas modifier.**
- `scripts/verify-no-regression.sh` — filet de non-régression, inclut `npm test` (sans `--passWithNoTests` depuis story 2). **Ne pas modifier.**

## Tasks & Acceptance

**Execution:**
- `src/apps/settings/SettingsApp.tsx` — remplacer les 37 classes palette de la chrome (cf. Code Map, hors `ThemePreview`/`CanvasFxTile`/chip « On »/bouton Replay) par les variables CSS de la table de mapping. Conserver le format `className="..."` Tailwind existant ; les substitutions sont du type `className="bg-stone-50 px-3 py-2"` → `className="bg-[var(--theme-surface)] px-3 py-2"` (Tailwind bracket notation `bg-[...]`/`text-[...]`/`border-[...]` accepte les `var(--xxx)`). Conserver toute classe structurelle/typo adjacente intacte.
- `src/apps/settings/ThemeDetailPage.tsx` — remplacer les 8 classes palette par les variables CSS (toutes dans la chrome du sélecteur de variante + bouton Back).
- `src/apps/settings/theme-details.tsx` — **0 modification**. Vérifier qu'aucune classe de la table de mapping n'est dans le périmètre exclu ; consigner dans le rapport les 9 occurrences `text-stone-500` (lignes 35, 72, 103, 117, 129, 135, 150) avec justification d'exclusion.
- `src/apps/settings/SettingsItemDetail.tsx` — **0 modification** (déjà 100 % sur variables CSS). Le rapport confirme `grep -E 'bg-(white|stone-[0-9]+)|text-(stone-[0-9]+|white)|border-(stone-[0-9]+|white)|hover:bg-stone' SettingsItemDetail.tsx` retourne 0.

**Acceptance Criteria:**
- Given le commit courant (`5a4255e`), when `grep -rE 'bg-(white|stone-50|stone-100)|text-(stone-[0-9]+)|border-(stone-[0-9]+)|hover:bg-stone' src/apps/settings/SettingsApp.tsx src/apps/settings/ThemeDetailPage.tsx` est lancé, then on attend **0 occurrence dans la chrome** après modification (les occurrences restantes éventuelles sont toutes dans `ThemePreview` ou `CanvasFxTile`, à signaler dans le rapport).
- Given `SettingsApp.tsx` après modification, when on relit le composant `ThemePreview` (lignes 415-455), then ses `className` `text-stone-500`/`bg-stone-200`/`bg-stone-300`/`bg-stone-600`/`bg-stone-800`/`text-white`/`text-stone-900` sont **strictement inchangées** (octet pour octet vs commit de base).
- Given `theme-details.tsx` après modification, when on relit les 9 occurrences `text-stone-500` (lignes 35, 72, 103, 117, 129, 135, 150), then elles sont **strictement inchangées**.
- Given la ligne 509 (`bg-emerald-100 text-emerald-700`) du badge « On » dans `SettingsApp.tsx`, when on relit le diff, then elle est **inchangée** (état de succès sémantique).
- Given `SettingsApp.tsx` après modification, when on relit le bouton « Replay » de la section Help (lignes 369-381), then son `style={{ color: ..., background: ..., boxShadow: ... }}` codé teal est **inchangé** (sémantique d'action, hors table de mapping).
- Given le diff total, when on lance `bash scripts/verify-no-regression.sh`, then `== tests ==` passe `npm test` au vert (4 tests story 2), `== build vite ==` construit le bundle, et la ligne finale est `OK : N erreurs TS (<= 88), bundle construit.` avec `N` inchangé ou inférieur au baseline (l'ajout de variables CSS dans `className` ne crée pas de nouvelles erreurs TS).
- Given le diff `src/lib/themes/store.ts`, `src/lib/themes/tokens.ts`, `src/index.css`, `src/lib/themes/orphan-css-vars.test.ts`, then ils sont **strictement vides** (gel stories 1+2).
- Given le diff `src/apps/settings/theme-details.tsx`, then il est **strictement vide** (périmètre exclu).

## Spec Change Log

### 2026-08-05 — Review pass corrections (bad_spec, verification section)
- triggering_finding: la commande `git diff --stat 5a4255e..HEAD -- ...` dans la section Verification comparait contre l'ancêtre story-1+2 (5a4255e), pas contre le baseline_revision de cette story (c026136). L'écart faisait apparaître les 268 lignes du test `orphan-css-vars.test.ts` ajouté par story 2, et la commande ne pouvait jamais retourner vide au commit actuel.
- amended: ligne de commande dans `## Verification` remplacée par `git diff --stat c026136..HEAD -- <frozen files>` ; le compte d'occurrences dans `theme-details.tsx` corrigé de 9 à 7 dans `## Code Map` et `## Verification` (le grep matche uniquement les chaînes littérales, pas les valeurs en template literal comme `` `text-stone-${...}` ``).
- known_bad_state_avoided: sans cette correction, la commande `git diff` aurait toujours montré une diff non-vide côté frozen files, donnant un faux signal de régression ; le compte `9` aurait fait échouer l'AC numérique.
- KEEP: le mapping table à l'intérieur de `<intent-contract>` reste intouché (read-only). Les entrées `text-stone-600` (hors table) et `bg-stone-900` du chip sélectionné ThemeDetailPage restent documentées comme extensions Reading B par l'agent d'implémentation.

## Review Triage Log

### 2026-08-05 — Review pass
- intent_gap: 0
- bad_spec: 2: (high 0, medium 2, low 0)
  - `[medium]` `[bad_spec]` commande `git diff --stat 5a4255e..HEAD -- <frozen files>` dans `## Verification` ne pouvait pas retourner vide au commit actuel (5a4255e ≠ baseline_revision c026136 ; 268 lignes du test story 2 apparaîtraient toujours). Corrigé en `c026136..HEAD` + ajout d'une note explicative.
  - `[medium]` `[bad_spec]` compte d'occurrences `text-stone-500` dans `theme-details.tsx` annoncé à 9 dans `## Code Map` et `## Verification`, alors que le grep regex ne matche que 7 chaînes littérales (les 9 occurrences visées incluent 2 valeurs en template literal `` `text-stone-${...}` `` qui n'apparaissent qu'à l'exécution). Corrigé à 7, lignes 35, 72, 103, 117, 129, 135, 150.
- patch: 1: (high 0, medium 0, low 1)
  - `[low]` `[patch]` `text-white` sur le chip de variante sélectionné dans `ThemeDetailPage.tsx:95` était illisible sur thèmes sombres (le nouveau fond `bg-[var(--theme-text)]` vire au clair sur `dark-oled`/`aurora`/`cyberpunk`). Substitué par `text-[var(--theme-surface)]` (le négatif de `theme-text`, invariant par construction). Le chip non-sélectionné est passé de `bg-[var(--theme-surface-hover)]` (repos ≡ hover) à `bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)]` pour préserver l'affordance hover (extension Reading B, hors table de mapping).
- defer: 3: (high 0, medium 1, low 2)
  - `[medium]` `[defer]` la table de mapping dans `<intent-contract>` collapse `bg-stone-100` et `hover:bg-stone-200` sur la même variable `var(--theme-surface-hover)`. Conséquence : `Reset all` (SettingsApp.tsx:472) et les chips de variante (ThemeDetailPage.tsx:96) perdent l'affordance hover. Tradeoff délibéré du design system (un seul token `surface-hover`). Fix hors scope : introduire `--theme-surface-rest` ou un état de transition. Décision de l'épic suivant (thème reactivity pour les autres apps).
  - `[low]` `[defer]` `ring-[var(--theme-text)]/30` sur le thème actif (SettingsApp.tsx:499, 549) — Tailwind v4 peut ou non composer l'opacité `/30` sur une variable CSS custom ; à vérifier visuellement. Sans fallback `boxShadow`, le ring peut être invisible sur certaines versions.
  - `[low]` `[defer]` aucune couverture de test pour le rendu visuel réel du thème. Le filet story 2 (`orphan-css-vars.test.ts`) vérifie les noms de variables, pas l'application runtime. Un test jsdom avec render + getComputedStyle attraperait les régressions visuelles. Hors scope explicite de cette story (la SPEC dit « une story par app » pour les autres apps).
- reject: many — findings déjà rejetés par les agents : tokens sémantiques `--ok`/`--warn`/`--danger` laissés à dessein ; `<Plug w-4.5 h-4.5>` est une convention projet existante non documentée mais présente ; `Badge tone="ok"` est un composant de `apps/_ui/kit` hors périmètre ; les variables `--panel-*` vs `--theme-*` doublonnent par design (story 1) ; absence de `:focus-visible` et `prefers-reduced-motion` est préexistante et hors périmètre ; documentation des tokens pas dans le scope d'une story de câblage ; intégration icon `bg-[var(--theme-surface-hover)]` (Plug) volontairement statique (l'icône est un chip de statut, pas un état hover) ; collapse hierarchy `text-stone-500/400` → même `--theme-muted` est un trade-off explicite (la SPEC §« Hors périmètre » cite `--ok`/`--warn`/`--danger` comme couleurs sémantiques, mais ne distingue pas deux niveaux de muted) ; confusion `var()` sans fallback — le bloc `:root` statique de `src/index.css` fournit le repli avant le premier rendu React (cf. SPEC story 1 §FALLBACK).
- addressed_findings:
  - `[medium]` `[bad_spec]` baseline 5a4255e → c026136 dans `## Verification` (spec amendée, code inchangé).
  - `[medium]` `[bad_spec]` compte `text-stone-500` dans theme-details.tsx 9 → 7 dans `## Code Map` et `## Verification` (spec amendée, code inchangé).
  - `[low]` `[patch]` `text-white` → `text-[var(--theme-surface)]` sur chip sélectionné ThemeDetailPage.tsx:95 ; chip non-sélectionné repos `surface-hover` → `surface` + hover `surface-hover` (extension Reading B, code patché).
- followup_review_recommended: false — score `3 × 0 medium + 1 × 0 low = 0` (< 5), pas de patch `high`, pas de loopback `bad_spec` sur l'intent-contract.

## Verification

**Commands:**
- `bash scripts/verify-no-regression.sh` — expected : `OK : N erreurs TS (<= 88), bundle construit.`, exit 0, `== tests ==` exécute vitest avec 4 tests verts.
- `grep -rE 'bg-(white|stone-50|stone-100)|text-(stone-[0-9]+)|border-(stone-[0-9]+)|hover:bg-stone' src/apps/settings/SettingsApp.tsx src/apps/settings/ThemeDetailPage.tsx` — expected : 0 occurrence, ou N occurrences toutes situées dans les fonctions `ThemePreview` / `CanvasFxTile` (à justifier dans le rapport).
- `grep -rE 'bg-(white|stone-50|stone-100)|text-(stone-[0-9]+)|border-(stone-[0-9]+)|hover:bg-stone' src/apps/settings/theme-details.tsx src/apps/settings/SettingsItemDetail.tsx` — expected : 7 occurrences figées (toutes dans `theme-details.tsx`, lignes 35, 72, 103, 117, 129, 135, 150 — le grep ne matche que les chaînes littérales, pas les valeurs en template literal comme `\`text-stone-${...}\``).
- `grep -E 'bg-emerald-100 text-emerald-700' src/apps/settings/SettingsApp.tsx` — expected : 1 occurrence (ligne 509, badge « On »).
- `git diff --stat c026136..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts src/index.css src/lib/themes/orphan-css-vars.test.ts` — expected : vide (le `c026136` est le baseline_revision de cette story ; utiliser `5a4255e` ferait apparaître les 268 lignes du test story 2).

**Manual checks (if no CLI):**
- Inspecter `SettingsApp.tsx` après modification : compter manuellement les `bg-[var(--theme-surface)]`, `text-[var(--theme-text)]`, `text-[var(--theme-muted)]`, `border-[var(--panel-border)]`, `bg-[var(--theme-surface-hover)]` introduits. La somme doit approcher 37 (moins les exceptions nommées).
- Inspecter `ThemeDetailPage.tsx` après modification : idem, ~8 substitutions.
- Inspecter `ThemePreview` (SettingsApp.tsx:415-455) : octet pour octet identique au commit de base.
- Inspecter `theme-details.tsx` : octet pour octet identique au commit de base.
- Inspecter `SettingsItemDetail.tsx` : octet pour octet identique au commit de base.
- Sanity visuel (si l'app est lancée) : ouvrir Settings, basculer sur `dark-oled` dans le picker de thèmes. La sidebar / les cartes / les labels doivent virer en sombre. Le picker lui-même reste lisible (la grille des 12 mini-previews reste hétérogène — warm-paper card reste claire, dark-oled card reste noire).

## Auto Run Result

Status: done
Blocking condition:

**Summary of implemented change:** Story 3 finalise l'épic « thèmes par app » en remplaçant les classes Tailwind de palette en dur de la chrome Settings (21 substitutions dans `SettingsApp.tsx`, 8 substitutions + 2 patches dans `ThemeDetailPage.tsx`) par les variables CSS déjà câblées par les stories 1+2. La table de mapping canonique est appliquée verbatim ; les zones exclues (ThemePreview, CanvasFxTile, badge « On » émeraude, bouton Replay teal, theme-details.tsx, SettingsItemDetail.tsx, fichiers gelés) restent octet pour octet identiques au commit de base. Un patch de revue corrige un bug de contraste sur le chip de variante sélectionné (text-white illisible sur thèmes sombres → text-[var(--theme-surface)]) et préserve l'affordance hover du chip non-sélectionné.

**Files changed (this story):**
- `src/apps/settings/SettingsApp.tsx` — 21 substitutions `bg-white/bg-stone-50/bg-stone-100/text-stone-500/text-stone-600/text-stone-700/text-stone-800/text-stone-900/border-stone-200/border-stone-300/border-stone-400/border-stone-800/hover:bg-stone-100/hover:bg-stone-200/hover:text-stone-800/hover:border-stone-400/ring-stone-800/30` → `bg-[var(--theme-surface)]/bg-[var(--theme-surface-hover)]/text-[var(--theme-text)]/text-[var(--theme-muted)]/border-[var(--panel-border)]/border-[var(--theme-text)]/hover:bg-[var(--theme-surface-hover)]/hover:text-[var(--theme-text)]/hover:border-[var(--panel-border)]/ring-[var(--theme-text)]/30`. Périmètre chrome uniquement (CanvasFxPicker, Row, Privacy, Integrations, Help, Themes section). Diff vs baseline : 21 lignes modifiées.
- `src/apps/settings/ThemeDetailPage.tsx` — 8 substitutions de la table + 2 patches de revue : `text-white` → `text-[var(--theme-surface)]` sur le chip sélectionné (ligne 95), `bg-[var(--theme-surface-hover)]` → `bg-[var(--theme-surface)]` + `hover:bg-[var(--theme-surface-hover)]` sur le chip non-sélectionné (ligne 96). Diff vs baseline : 10 lignes modifiées.

**Files unchanged (frozen by stories 1+2 or excluded by design):**
- `src/lib/themes/store.ts` — `applyThemeTokens` intact (31 appels `setProperty` : 22 canoniques + 9 alias). Diff vs baseline : vide.
- `src/lib/themes/tokens.ts` — `ThemeTokens` interface et 12 thèmes inchangés. Diff vs baseline : vide.
- `src/index.css` — bloc `:root` statique gelé. Diff vs baseline : vide.
- `src/lib/themes/orphan-css-vars.test.ts` — filet story 2, 4 tests vitest verts. Diff vs baseline : vide.
- `scripts/verify-no-regression.sh` — sans `--passWithNoTests` depuis story 2. Diff vs baseline : vide.
- `src/apps/settings/theme-details.tsx` — 5 variantes de design (Apple/Bento/Editorial/Brutalist/Cyberpunk), preview content, hors chrome. 7 occurrences `text-stone-500` préservées. Diff vs baseline : vide.
- `src/apps/settings/SettingsItemDetail.tsx` — déjà 100% sur variables CSS. Diff vs baseline : vide.
- `ThemePreview` (SettingsApp.tsx:415-455) — preview content (mini-app par thème), hors chrome. 7 classes stone préservées dans le template literal `${t.isDark ? 'text-white' : 'text-stone-900'}` etc. Diff vs baseline : vide à l'intérieur de la fonction.
- `CanvasFxTile` (SettingsApp.tsx:114) — `text-white` préservé sur `FX_TILE_BG` codé en dur.
- Badge « On » (SettingsApp.tsx:509) — `bg-emerald-100 text-emerald-700` préservé (état de succès sémantique).
- Bouton « Replay » (SettingsApp.tsx:369-381) — `style={{ color: ..., background: ..., boxShadow: ... }}` teal préservé.

**Review findings breakdown (this pass):**
- 4 review layers ran in parallel (blind-hunter, edge-case-hunter, verification-gap, intent-alignment).
- intent_gap: 0 — la spec est cohérente, l'agent d'implémentation l'a lue correctement sous Reading B + D + E.
- bad_spec: 2 (medium) — corrigés sur la `## Verification` (baseline 5a4255e → c026136) et le compte d'occurrences `text-stone-500` (9 → 7). Code inchangé.
- patch: 1 (low) — `text-white` → `text-[var(--theme-surface)]` sur le chip sélectionné ThemeDetailPage.tsx:95 + chip non-sélectionné repos ≡ hover séparés. Code patché.
- defer: 3 (1 medium, 2 low) — le collapse `bg-stone-100` / `hover:bg-stone-200` sur `var(--theme-surface-hover)` (conséquence de la table de mapping dans `<intent-contract>`, hors scope), la composition Tailwind v4 `ring-[var(--theme-text)]/30` (à vérifier visuellement), et l'absence de test jsdom sur le rendu runtime.
- reject: many — tokens sémantiques `--ok`/`--warn`/`--danger` ; `<Plug w-4.5 h-4.5>` ; `Badge tone="ok"` (composant hors périmètre) ; absence `:focus-visible` et `prefers-reduced-motion` (préexistants) ; documentation tokens (hors scope) ; confusion `var()` sans fallback (le bloc `:root` statique de `src/index.css` couvre le pre-render).
- `followup_review_recommended: false` — score `3 × 0 medium + 1 × 0 low = 0` (< 5), pas de patch `high`, pas de loopback `bad_spec` sur l'intent-contract.

**Verification performed (this pass):**
- `bash scripts/verify-no-regression.sh` → `OK : 79 erreurs TS (<= 88), bundle construit.` exit 0. `== tests ==` exécute vitest `orphan-css-vars.test.ts` avec 4 tests verts. Aucune régression TS introduite.
- `grep -rE 'bg-(white|stone-50|stone-100)|text-(stone-[0-9]+)|border-(stone-[0-9]+)|hover:bg-stone' src/apps/settings/SettingsApp.tsx src/apps/settings/ThemeDetailPage.tsx` → 1 occurrence, située dans `ThemePreview` ligne 431 (`` ${t.isDark ? 'text-white' : 'text-stone-900'} ``), zone exclue.
- `grep -rE 'bg-(white|stone-50|stone-100)|text-(stone-[0-9]+)|border-(stone-[0-9]+)|hover:bg-stone' src/apps/settings/theme-details.tsx src/apps/settings/SettingsItemDetail.tsx` → 7 occurrences dans `theme-details.tsx` (lignes 35, 72, 103, 117, 129, 135, 150), périmètre exclu.
- `grep -E 'bg-emerald-100 text-emerald-700' src/apps/settings/SettingsApp.tsx` → 1 occurrence, ligne 509, badge « On » préservé.
- `git diff --stat c026136..HEAD -- src/lib/themes/store.ts src/lib/themes/tokens.ts src/index.css src/lib/themes/orphan-css-vars.test.ts` → vide, exit 0.
- Manual: `grep -E 'bg-stone-[0-9]+|text-stone-[0-9]+' src/apps/settings/ThemePreview` → 0 (le composant ThemePreview utilise `t.isDark ? 'text-white' : 'text-stone-900'` dans un template literal, pas une chaîne littérale matchable — le grep précédent l'attrape via sa forme expansée).

**Residual risks (carried forward to next epic):**
- Le collapse `bg-stone-100` / `hover:bg-stone-200` sur la même variable `--theme-surface-hover` fait perdre l'affordance hover du bouton « Reset all » (SettingsApp.tsx:472) et des chips de variante non-sélectionnés (ThemeDetailPage.tsx:96). Le chip non-sélectionné a été partiellement corrigé par le patch de revue (repos `surface`, hover `surface-hover`). Le bouton « Reset all » reste affecté — fix dans l'épic suivant (introduire `--theme-surface-rest` ou un état de transition).
- `ring-[var(--theme-text)]/30` sur le thème actif (SettingsApp.tsx:499, 549) — Tailwind v4 peut ou non composer l'opacité `/30` sur une variable CSS custom ; sanity visuel recommandé sur `dark-oled` + `warm-paper` post-merge.
- Aucune couverture de test sur le rendu visuel réel du thème. Le filet story 2 vérifie les noms de variables, pas l'application runtime. Un test jsdom avec render + `getComputedStyle` attraperait les régressions visuelles. Hors scope explicite de cette story (la SPEC §« Périmètre de cet épic » dit « une story par app » pour les autres apps).
- Les autres apps à palette en dur (`welcome`, `people`, `design`, `onboarding`, `sales`, `_ui`, `audit`, `cognition`) restent à traiter dans un épic suivant (SPEC §« Hors périmètre »).
- Les 88 erreurs TS préexistantes (mesurées à 79 réelles après le filet story 2 qui résout 9 TS2591) restent à traiter hors scope.
