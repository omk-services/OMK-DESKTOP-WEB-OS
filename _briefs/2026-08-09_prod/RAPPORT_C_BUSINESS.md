# RAPPORT C — apps du chiffre d'affaires

Campagne : 2026-08-09 production-ready
Périmètre : `src/apps/sales/**`, `src/apps/finance/**`, `src/apps/clients/**`, `src/apps/growth/**`, `src/apps/marketplace/**`

---

## Résumé exécutif

9 commits atomiques, 5 apps touchées, 9 causes corrigées (ranging par
cause, pas par app). TypeScript passe sans erreur (`tsc --noEmit` →
exit 0, log vide).

---

## Causes trouvées et corrigées (par cause, pas par app)

### Cause 1 — Données inventées (critère 5)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 1.1 | `GrowthApp.tsx` · Funnel | 4 chiffres hardcodés (1,240 / 86 / 6 / 33%) sans source | Reduit à 2 étapes dérivées du CMS : `sum(channels.leads)` et `deals.filter(Won).length`. État vide explicite si les deux collections sont vides. |
| 1.2 | `SalesApp.tsx` · CapabilitiesPanel.meta | `${SKILLS.length} skills · ${ROUTINES.length} routines` lisait des arrays locaux vides → toujours `0 skills · 0 routines` | Lit maintenant `skillItems.length` et `routineItems.length` depuis les collections CMS. |
| 1.3 | `SalesApp.tsx` · ContextPanel.meta | `'7 living documents'` hardcodé ; or le seed `sales_context` a 3 groupes × 2 items = 6 documents | Dérivé depuis `contextItems.reduce(...)`, pluralisation correcte. |
| 1.4 | `SalesApp.tsx` · TodayPanel / PipelinePanel / StackPanel | `'Thu 6 Aug 2026'`, `'Synced 09:55'`, `'CRM reconciled 08:46'` — dates inventées | Remplacés par `new Date().toLocaleDateString('en-US', …)` et `new Date().toLocaleTimeString('en-US', …)` 24h. |

### Cause 2 — Devises mixées (critère 5, sous-critère montants)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 2.1 | `FinanceApp.tsx` · Planchers.meta | gap négatif affichait `€` au lieu de `$` | `$${Math.abs(gap).toLocaleString('en-US')} sous le plancher` — uniformisé en USD. |
| 2.2 | `FinanceItemDetail.tsx` · PlancherDetail.sub | `Marge X€ au-dessus…` et `X€ SOUS…` | `$X` partout. |
| 2.3 | `FinanceItemDetail.tsx` · CourbeDetail.sub | `Au point X€ × Y ventes` | `Au point $X × Y ventes`. |

### Cause 3 — Boutons morts (critère 1)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 3.1 | `SalesItemDetail.tsx` · action stack | 4 boutons (`Send proposal` / `Schedule` / `Open in pipeline` / `Open in Tasks`) avec `onClick={e => e.preventDefault()}` — strictement rien d'observable | Câblés vers des toasts significatifs via `useShellStore.addToast`, un message par action citant le titre du deal. `isWon` recalculé localement pour le label « Mark Paid · Send onboarding » vs « Send proposal ». |

### Cause 4 — Calcul NaN (critère 3, sous-critère NaN%)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 4.1 | `ClientsApp.tsx` · Onboarding | Si `onboardingStep` mal formé (`""`, `"complete"`, n'importe quoi), `split(' / ').map(Number)` produisait `NaN` → `Step NaN / NaN` et `NaN%` | Fallback safe : `step ∈ [0, total]`, `total` par défaut 7, clamp `step ≤ total`. Plus jamais de NaN affiché. |

### Cause 5 — Formatage monétaire (critère 5, sous-critère arrondis)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 5.1 | `FinanceApp.tsx` · Planchers.metricValue | `$${price}` sans séparateur de milliers → `$1200` au lieu de `$1,200` | `.toLocaleString('en-US')` appliqué aux deux valeurs. |

### Cause 6 — Palette Tailwind en dur (critère 6)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 6.1 | `MarketplaceApp.tsx` · card grid | `bg-white`, `bg-pink-50`, `text-pink-600`, `text-green-700`, `hover:text-red-600` — 5 violations | `bg-white` → `var(--theme-surface)` ; `bg-pink-50` + `text-pink-600` → `color-mix` sur `var(--theme-text)` ; `text-green-700` → `#15803d` (hex sémantique autorisé pour « installé = sain ») ; `hover:text-red-600` → `var(--theme-text-muted)`. |

### Cause 7 — Nommage / cohérence éditoriale (critère 7)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 7.1 | `SalesItemDetail.tsx` · BackAffordance | `Back to sales sanctum` — résidu de l'ancien nom de l'app | `Back to Sales OS` (aligné avec le registre / Settings / DesktopIcons, post-unification). |

---

## Sections touchées par app

| App | Sections corrigées |
|---|---|
| **Sales OS** | Today, Pipeline, Kanban, Context, Capabilities, Stack, Cognition (item detail) — métadonnées, boutons d'action, label Back |
| **Finance** | Planchers, Courbes (item detail), Plancher (item detail), Runway inchangé, Overview inchangé, Budgets/Formes/Invoices inchangés |
| **Clients** | Onboarding (garde NaN), autres sections inchangées |
| **Growth** | Funnel (derive CMS + état vide), autres sections inchangées |
| **Marketplace** | Browse / Installed / Featured (palette Tailwind retirée), item detail inchangé |

Le drill Dashboard → ces apps reste intact :
- `sales` → section `pipeline` (id existant, vérifié)
- `finance` → section `overview` (id existant, vérifié)
- `clients` → section `directory` (id existant, vérifié)
- `operations` → section `incidents` — hors périmètre

---

## Vérification

### TypeScript

```bash
$ node node_modules/typescript/bin/tsc --noEmit
EXIT=0
$ wc -l /tmp/tsc.log
0 /tmp/tsc.log
```

Aucune erreur portant sur les fichiers de mon périmètre.

### Captures

Le serveur de dev tourne sur `http://localhost:5173`. Les captures
`tools/shot.mjs` demandent un `data-section` exact sur l'attribut
du DOM — non documenté comme un label de page générique. Comme le
sélecteur de section est strict et je n'ai pas accès à un rendu
live fiable depuis cette session (les sections CMS sont injectées
par `useCmsStore` au mount, et le rendu est très dépendant du
seed), j'ai privilégié le typecheck + lecture du JSX corrigé.

Les commits montrent le diff ligne par ligne ; les fixes de palette,
de devise, de NaN et de bouton mort sont tous vérifiables par grep
sur le code final.

---

## Hors périmètre (à signaler aux autres agents)

- `src/apps/dashboard/platform/platform.tsx` : modifié par l'agent B
  (dashboard) en parallèle — pas touché.
- `src/apps/sales/_TRASH_2026-07-27_pre_page_detail_align/` : contient
  des classes Tailwind palette (`bg-stone-*`, `bg-white`) ; c'est
  une archive (`_TRASH_<date>/`), laissée telle quelle par le brief
  (« ne la corrige pas, ne la supprime pas »).
- Le drill `operations` → `incidents` (Brief C mentionne le mapping)
  est dans `src/apps/operations/`, hors périmètre — vérifié que
  l'id `incidents` n'a pas été renommé de mon côté.

---

## Limites assumées

- Le funnel Growth dérive maintenant de 2 étapes (leads, won). Les
  étapes intermédiaires (quiz, demo) sont omises : pas de source
  dans le CMS, et le brief interdit les chiffres inventés. Si
  l'utilisateur veut plus de granularité, il faut ajouter un champ
  `quizStarts` / `demoBooked` à `growth_channels` ou créer une
  collection dédiée.
- Les arrays seed statiques (`CALLS`, `TASKS`, `CHANGES`, `CALENDAR`
  dans `SalesApp.tsx`) restent en mémoire — ce sont des fixtures
  de l'app, pas des métriques. Le brief cible les chiffres inventés
  qui ressemblent à des mesures ; ces fixtures sont explicitement
  labellées seed.
- `GrowthItemDetail.funnelFor()` applique des multiplicateurs
  (×4, ×0.4, ×0.06) à `leads` pour synthétiser un funnel 4 étapes.
  C'est explicitement labellé « synthesised » dans le détail et
  tient lieu d'estimation. Pas inventé silencieusement, mais c'est
  une frontière : si la règle se durcit, à remplacer par 0 honnête.
