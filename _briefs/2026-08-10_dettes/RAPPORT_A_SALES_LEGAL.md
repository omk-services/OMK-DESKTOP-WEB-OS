---
id: A_SALES_LEGAL
campagne: 2026-08-10 — dettes assumées
status: terminé
---

# RAPPORT A — Sales & Legal

Périmètre : `src/apps/sales/**`, `src/apps/legal/**`. Socle intouché.
2 dettes traitées, 2 commits atomiques.

---

## DETTE 1 — Snapshot Sales dérivé depuis `deals` ✅

**Commit** : `72f7b26` — `fix(sales): dérive le snapshot pipeline depuis la collection deals`

### Constat

Les collections `sales_snapshot` et `sales_stages` (CMS) portaient des
chiffres éditoriaux sans rapport avec les deals réels. La collection
`deals` contient 5 items pour un total de $9 600 ; le snapshot affichait
"$486k pipeline / 54 open deals". La section Pipeline mentait donc sur
les ordres de grandeur — c'était la première page qu'un prospect
regardait.

### Correction

Dans `PipelinePanel` (SalesApp.tsx), chaque tuile et chaque étape est
calculée depuis `useCmsStore((s) => s.items['deals'])`. Format
`formatMoney(n)` : `$960` < 1k, `$9.6k` < 10k, `$486k` au-delà (entier
arrondi), `$0` sur vide ou NaN.

| Tuile | Source | Exemple avec les 5 deals seedés |
|---|---|---|
| Pipeline value | somme des `value` hors Won/Lost | $6.0k · 3 open deals |
| Won this quarter | somme des `value` Won | $3.6k · 2 deals closed |
| Win rate | `won / (won + lost)` ; `—` si zéro deal fermé | 100% · 2 of 2 closed deals |
| Avg deal size | moyenne + min/max réels | $1.9k · min $1k · max $2.5k |
| Rep score | conservée littérale (`sales_scores` est la source canonique de la section 04 Rep scorecard — pas en scope) | 7.5 · demo strong, close the gap |
| ~~Meetings / week~~ | aucune source dans le CMS — retirée comme demandé dans le brief | — |

Stages dérivés (4 connus + 1 bucket "Other" forward-safe) :
- Qualified : 2 deals · $3.5k in stage
- Proposal : 1 deal · $2.5k in stage
- Won : 2 deals · $3.6k closed
- Lost : 0 deals · re-engagement targets

Les collections `sales_snapshot` et `sales_stages` ont été retirées du
seed. La forme des items `deals` n'a pas changé — Dashboard CEO Cockpit
et Growth continuent de lire la même collection.

### Vérification

- `npx tsc --noEmit` : propre
- Capture `/tmp/a-debt/sales-pipeline.png` + `/tmp/a-debt/sales-stages.png`
  : les 5 tuiles affichent les valeurs dérivées, les 4 étapes affichent
  leur compte/somme corrects.
- Test navigateur (Playwright) : les valeurs DOM correspondent aux
  sommes calculées sur les items de la collection deals.

### Limites assumées

- Les deals seedés (`Marcus 2500, Amara 1000, Dara 2500, Ava 1800,
  Priya 1800`) sont très petits par rapport à ce que le produit prétend
  afficher en production. La correction préserve l'apparence éditoriale
  ; c'est au seed de deals d'évoluer pour des volumes réalistes.
- "Meeting booked" du snapshot original a disparu avec la collection
  — cette étape n'existait pas dans `DEAL_STAGES`. Si elle doit
  revenir, c'est une étape à ajouter au CMS, pas à la grille de
  rendu.

---

## DETTE 2 — Grille sovereignty extraite ✅

**Commit** : `a18f723` — `refactor(legal): extraire la grille sovereignty dans un module partagé`

### Constat

`LegalDetailPage.tsx` (1237 → ~1150 lignes) et `LegalItemDetail.tsx`
(866 → ~840 lignes) portaient chacun leur copie du tableau
`SOVEREIGNTY_LEVELS` (six niveaux, même « you are here » au Level 3)
mais avec une divergence de structure : la version page avait un champ
`examples` que la version item n'avait pas. Une correction sur l'une
sans l'autre créait une incohérence invisible jusqu'à ce qu'un client
la lise.

### Correction

Création de `src/apps/legal/sovereignty.ts` avec :
- `export interface SovereigntyLevel` — type explicite, `examples?` optionnel
- `export const SOVEREIGNTY_LEVELS` — les 6 niveaux (version "page" avec examples)
- `export function getCurrentSovereigntyLevel()` — helper

`LegalDetailPage.tsx` et `LegalItemDetail.tsx` importent désormais
depuis ce module. Aucune donnée n'est dupliquée.

### Vérification

- `npx tsc --noEmit` : propre
- Capture `/tmp/a-debt/legal-detail-top.png` + `legal-detail-3.png` :
  6 articles rendus, Level 3 "Owned control plane" porte le badge
  "YOU ARE HERE", les valeurs name/one/gain/keep/cost/orgSize/flagship
  sont intactes (visuellement identiques aux captures d'avant).

---

## Passe 5 — re-relecture fraîche des deux apps

- Sales Today / Pipeline / Kanban / Context : naviguent sans erreur
  console. Les tuiles du Pipeline affichent les valeurs dérivées.
- Legal Compliance / Contracts / Policies : naviguent. Click sur un
  contrat ouvre le détail avec la grille sovereignty 6 niveaux.
- `npx tsc --noEmit` sur l'ensemble du repo : pas d'erreur.

---

## Note orchestrateur

Le commit `a18f723` (Legal sovereignty) embarque **3 fichiers hors
périmètre** (`src/apps/people/PeopleApp.tsx`,
`src/apps/people/_TRASH_2026-08-10/FleetDetail_REMOVED.tsx`,
`tools/verify-b-fleet-click.mjs`). Ces fichiers étaient déjà
*staged* par un agent parallèle au moment de mon `git add
src/apps/legal/` ; mon commit les a embarqués. Le brief interdit
d'amender, donc je n'ai pas modifié l'historique. À signaler à
l'orchestrateur : le commit B_PEOPLE est en réalité inclus dans le
commit A. À splitter ou renommer selon la convention de la campagne.

Mon commit `72f7b26` (Sales) est propre : 2 fichiers, périmètre respecté.

---

## Commits

```
72f7b26 fix(sales): dérive le snapshot pipeline depuis la collection deals
       src/apps/sales/SalesApp.tsx
       src/apps/sales/seed.ts
a18f723 refactor(legal): extraire la grille sovereignty dans un module partagé
       src/apps/legal/LegalDetailPage.tsx
       src/apps/legal/LegalItemDetail.tsx
       src/apps/legal/sovereignty.ts
       [3 fichiers hors périmètre — voir note ci-dessus]
```

---

## Captures de référence

- `/tmp/a-debt/sales-pipeline.png` — Snapshot Sales après correction
- `/tmp/a-debt/sales-stages.png` — Stages Sales après correction
- `/tmp/a-debt/legal-detail-top.png` — Legal sovereignty grid, Levels 0-1
- `/tmp/a-debt/legal-detail-3.png` — Legal sovereignty grid, Levels 2-5

Aucune erreur console sur l'un quelconque des parcours testés.
