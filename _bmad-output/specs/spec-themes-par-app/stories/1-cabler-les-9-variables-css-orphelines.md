---
title: 'Câbler les 9 variables CSS orphelines'
type: 'feature'
created: '2026-08-05'
status: 'blocked'
baseline_revision: 'f33f613380d35dfaf0de3506c986eb75850e3497'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
deferred: []
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

Status: blocked
Blocking condition: matrix test audit failed

### Ce qui a été fait

Le code de l'histoire est **implémenté et vérifié**. Un seul fichier modifié,
`src/lib/themes/store.ts` (+12 lignes en queue de `applyThemeTokens`) : un commentaire
de deux lignes puis les 9 `target.style.setProperty`, dans l'ordre exact et avec le
mapping exact de la story (`--theme-muted`→`t.textMuted`, `--canvas`→`t.canvas`,
`--panel`/`--panel-solid`→`t.surface`, `--panel-border`→`t.border`,
`--panel-border-subtle`/`--hairline`→`t.borderSubtle`, `--shadow-panel`→`t.shadow`,
`--shadow-window`→`t.shadowLg`).

Baseline : `f33f613380d35dfaf0de3506c986eb75850e3497` (branche `main`).

Vérifications passées (relancées par le workflow, pas seulement rapportées par le
sous-agent) :

- `bash scripts/verify-no-regression.sh` → `OK : 88 erreurs TS (<= 88), bundle construit.`
- `grep -c "target.style.setProperty" src/lib/themes/store.ts` → `31` (22 + 9).
- Signature intacte : `applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = '')` (ligne 62).
- `git diff src/lib/themes/tokens.ts` → vide.
- `git diff src/index.css` → vide.
- `git status` → seul `src/lib/themes/store.ts` est modifié.

Le sanity visuel (Settings › Themes › override par app) n'a pas été fait : il exige un
navigateur et un humain, hors d'un run non assisté.

### Pourquoi le run s'arrête quand même

L'étape 3 du workflow impose un **Matrix Test Audit** : chaque ligne de la matrice
I/O & Edge-Case doit être couverte par au moins un test automatisé qui a **tourné et
réussi** dans la sortie de vérification. Un test qui existe mais ne tourne pas compte
comme manquant ; ici il n'en existe aucun.

Constaté dans le dépôt :

- `package.json` → aucun script `test`; devDependencies sans runner (vite, typescript,
  oxlint, tailwind, types — c'est tout).
- `node_modules/.bin` → ni `vitest`, ni `jest`, ni `mocha`, ni `playwright`.
- `find src -name "*.test.*" -o -name "*.spec.*"` → aucun résultat.

Les 3 lignes de la matrice (HAPPY_PATH, FALLBACK, REPLAY_AFTER_THEME_SWITCH) sont donc
à 0 test couvrant. La section `## Verification` de cette story le documente déjà : le
point de contrôle avait retiré `npx vitest run src/lib/themes` du plan précisément
parce que vitest n'est pas installé.

L'audit ne peut pas être satisfait sans installer un framework de test — ce qui
dépasse largement le périmètre d'une histoire dont toute la frontière est « ajouter 9
`setProperty`, ne toucher à rien d'autre ». Cette décision revient à un humain, pas à
un run automatique.

### État laissé sur le disque

La modification de `src/lib/themes/store.ts` est **conservée, non commitée**. Le HALT
porte sur une barrière de process (absence de tests), pas sur un défaut du code. Rien
n'a été annulé.

### Décision attendue de l'humain

Une des trois, au choix :

1. Installer un runner de test (vitest + jsdom) et écrire 3 tests couvrant la matrice,
   dans une histoire séparée — puis relancer celle-ci.
2. Assumer que ce dépôt se vérifie par `verify-no-regression.sh` + inspection manuelle,
   et relâcher l'exigence de matrice pour cet épic.
3. Accepter le diff tel quel après revue humaine et commiter à la main.

