# SPEC — Les thèmes par app doivent réellement s'appliquer

## Le contrat

Choisir un thème pour une app dans **Settings › Themes › Per-app override** doit
changer l'apparence de cette app, et d'elle seule. Aujourd'hui le choix est
enregistré, persisté, relu — et sans effet visible.

## Ce qui marche déjà — NE PAS Y TOUCHER

La chaîne de câblage est correcte depuis le commit `7ad97de`. Elle a été
re-vérifiée avant d'écrire ce spec :

1. `SettingsApp.tsx:546` écrit `setAppTheme(app.id, t.id)`, où `app.id` vient de
   `APP_REGISTRY`.
2. `AppFrame.tsx:108` lit `appId = windowId`, et `windowId` **est** l'id du
   registre — la même clé.
3. `AppFrame.tsx:120-123` résout `tokensFor(appId)` et appelle
   `applyThemeTokens(rootRef.current, tokens)`, qui pose les variables CSS sur la
   racine de **cette fenêtre-là**.

Ce mécanisme est bon. Le défaut est en aval : **les composants ne consomment pas
ces variables.**

## Le défaut, mesuré

`applyThemeTokens` (`src/lib/themes/store.ts`) écrit 22 variables, toutes
préfixées `--theme-`. Le code, lui, utilise 385 fois des variables que **personne
n'écrit jamais**. Elles se résolvent alors contre le bloc `:root` statique de
`src/index.css`, gelé sur les valeurs de *warm-paper* — quel que soit le thème.

| Variable orpheline | Usages | Valeur `ThemeTokens` correspondante |
|---|---:|---|
| `--theme-muted` | 141 | `textMuted` (le store écrit `--theme-text-muted`) |
| `--panel-border` | 108 | `border` |
| `--panel-solid` | 37 | `surface` |
| `--panel-border-subtle` | 33 | `borderSubtle` |
| `--canvas` | 25 | `canvas` (le store écrit `--theme-canvas`) |
| `--shadow-panel` | 23 | `shadow` |
| `--hairline` | 15 | `borderSubtle` |
| `--shadow-window` | 2 | `shadowLg` |
| `--panel` | 1 | `surface` |
| **Total** | **385** | |

Contre 746 usages correctement câblés : **34 % de la surface thémée est gelée.**

Le cas `--theme-muted` est le plus frappant — 141 usages perdus pour un simple
écart de nommage avec `--theme-text-muted`.

**Aucune valeur nouvelle n'est nécessaire.** L'interface `ThemeTokens`
(`src/lib/themes/tokens.ts:5-36`) porte déjà `canvas`, `surface`, `border`,
`borderSubtle`, `textMuted`, `shadow`, `shadowLg`, et les 12 thèmes les
renseignent tous. Il ne manque que les alias à l'écriture.

## Le second défaut : la palette Tailwind en dur

Même une fois les variables réparées, une app qui écrit `bg-white text-stone-800`
ignore le thème. Occurrences de classes de palette Tailwind par app :

| App | `var(--theme-…)` | palette en dur |
|---|---:|---:|
| design | 0 | 387 |
| welcome | 9 | 223 |
| people | 82 | 144 |
| onboarding | 2 | 113 |
| settings | 25 | 78 |
| sales | 14 | 77 |
| _ui | 13 | 65 |
| audit | 5 | 36 |
| cognition | 3 | 15 |

`settings` est traitée dans cet épic parce que c'est l'app transversale où le
choix se fait : voir son propre sélecteur rester en `bg-white` pendant qu'on
change son thème est le symptôme le plus visible du bug.

Les autres apps sont hors périmètre ici — une story par app, dans un épic
suivant.

## Périmètre de cet épic

Trois stories, dans l'ordre. La 1 débloque 385 usages d'un coup sans toucher à
une seule app ; la 2 empêche la régression de revenir ; la 3 traite l'app
transversale.

## Hors périmètre — ne pas déborder

- Les 8 autres apps à palette en dur (épic suivant).
- `--ok` / `--warn` / `--danger` : couleurs sémantiques absentes de
  `ThemeTokens`. Leur lisibilité sur thème sombre est un vrai sujet, mais c'est
  une décision de design, pas un câblage. À porter au registre de travail différé.
- `--nm-shade`, `--nm-glow`, `--nm-accent` : variables locales au thème
  neumorphism, posées par leur propre composant.
- Canvas UI / `BackgroundFX` : sujet clos, aucun rapport.
- Les 88 erreurs TypeScript préexistantes.

## Critère d'acceptation de l'épic

Ouvrir deux apps côte à côte, leur donner deux thèmes opposés (`warm-paper` et
`dark-oled`) depuis Settings. Les deux fenêtres doivent différer sur le fond, le
texte secondaire, les bordures et les ombres — pas seulement sur l'accent.
Et l'app Settings elle-même doit suivre son propre thème.
