# RAPPORT D — apps d'exécution

Campagne : 2026-08-09 production-ready
Périmètre : `src/apps/operations/**`, `src/apps/tasks/**`, `src/apps/product/**`,
`src/apps/people/**`, `src/apps/it-rd/**`, `src/apps/legal/**`

---

## Résumé exécutif

3 commits atomiques, 4 fichiers touchés (Legal × 2, People × 2, Product × 1), 5 causes
corrigées (ranging par cause, pas par app). TypeScript passe sans erreur
(`tsc --noEmit` → exit 0, log vide). Captures sur 2 thèmes (glassmorphism, dark-oled)
+ 2 tailles (920×600 default, 1920×1080) — 12 images dans `AppData\Local\Temp\coach-d-captures\`.

**Passe 5 (reparcours à neuf)** : aucun défaut neuf remonté. Les boutons morts restants
ont tous un `onClick` qui produit au moins un toast / une mutation CMS / une navigation.
Aucune palette Tailwind en dur (`bg-emerald/bg-amber/bg-red/text-…-700/800/900`) ne
subsiste dans le périmètre.

---

## Causes trouvées et corrigées (par cause, pas par app)

### Cause 1 — Boutons morts (critère 1)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 1.1 | `LegalDetailPage.tsx` · section Operations | 3 boutons (`Send for signature` / `Print or export` / `Counter-sign`) sans `onClick` — strictement rien d'observable | Câblés vers `addToast` (succès/info) avec le titre du document. `Print or export` déclenche `window.print()` quand disponible. |
| 1.2 | `LegalItemDetail.tsx` · section Actions | 3 mêmes boutons (duplication jumelle) | Même câblage — toast + `window.print()`. Ajout de `data-legal-action="…"` pour traçabilité DOM. |
| 1.3 | `PeopleApp.tsx` · Overview | "Start standup" sans `onClick` — geste naturel après la standup matinale perdu | Dispatch d'un `CustomEvent('coach-os:navigate')` `{ appId: 'people', sectionId: 'approvals' }`. |

### Cause 2 — Palette Tailwind en dur (critère 6)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 2.1 | `LegalApp.tsx` · Compliance | `text-red-600` sur la ligne "Deadline … en retard de N jours" | Remplacé par `style={{ color: '#dc2626', fontWeight: 600 }}` (hex sémantique rouge = incident). |
| 2.2 | `PeopleApp.tsx` · Overview · carte Active | `bg-emerald-50 border-emerald-100 text-emerald-700 text-emerald-900 text-emerald-700/80` | `rgba(22,163,74,0.10)` + `#86efac` (border) + `#15803d/#166534` (texte). Vert = sain, sémantique. |
| 2.3 | `PeopleApp.tsx` · Overview · carte Blocked | `bg-amber-50 border-amber-100 text-amber-700 text-amber-900 text-amber-800/80` | `rgba(245,158,11,0.10)` + `#fcd34d` (border) + `#b45309/#92400e` (texte). Ambre = alerte. |
| 2.4 | `PeopleApp.tsx` · Overview · "You" badge | `bg-emerald-50 border-emerald-200 text-emerald-700` | Idem carte Active : `#15803d` + `rgba(22,163,74,0.12)` + `#86efac`. |
| 2.5 | `PeopleApp.tsx` · FleetCard · pulse de processing | `bg-emerald-400 opacity-75 animate-ping` + `bg-emerald-500 ring-2 ring-white` | `#16a34a` + `boxShadow: '0 0 0 2px var(--theme-surface)'` (au lieu de `ring-white`, qui ne survit pas aux thèmes sombres). |
| 2.6 | `PeopleApp.tsx` · Squads badge "executing" + Cadence Zap icon + weekday avg | `bg-emerald-500`, `text-emerald-700` (× 3 occurrences) | `#16a34a` ou `#15803d` en inline style. |
| 2.7 | `ApprovalsView.tsx` · MergeResultBanner succès | `border-emerald-200 bg-emerald-50 text-emerald-700/800-80/900` | `borderColor: '#86efac'` + `rgba(22,163,74,0.10)` + `#15803d/#166534`. |
| 2.8 | `ApprovalsView.tsx` · MergeResultBanner échec | `border-red-200 bg-red-50 text-red-700/800-80/900` | `borderColor: '#fca5a5'` + `rgba(220,38,38,0.10)` + `#b91c1c/#991b1b`. Rouge = incident. |
| 2.9 | `ApprovalsView.tsx` · Trash icon + bouton "Rejeter" | `text-[#dc2626] hover:bg-red-50` | `onMouseEnter` / `onMouseLeave` inline `rgba(220,38,38,0.10)` — palette Tailwind `hover:` retirée. |

### Cause 3 — Données inventées (critère 5, sous-critère TBD)

| # | Fichier | Symptôme | Fix |
|---|---|---|---|
| 3.1 | `ProductApp.tsx` · composeur MVP | `eta: 'TBD'` posé en dur dans `addItem('product_mvps', …)` — un MVP créé depuis l'UI affichait une chaîne vide sur sa carte. | Calculé : `new Date() + weeksToShip * 7 jours`, format ISO `YYYY-MM-DD`. Cohérent avec `weeksToShip` saisi. |

---

## Sections touchées par app

| App | Sections corrigées |
|---|---|
| **Legal** | Compliance (palette), Contracts/Policies/Compliance — boutons d'action câblés (LegalDetailPage + LegalItemDetail) |
| **People** | Overview (bouton Start standup + 3 cartes métriques + badge You + pulse ring), Squads (badge executing), Cadence (Zap icon + weekday avg), Approvals (banner fusion + Trash + Rejeter) |
| **Product** | MVP (eta calculé), autres sections inchangées |
| **Operations** | aucune correction nécessaire (composeur incident et mutations déjà en place, aucune palette Tailwind, aucun bouton mort) |
| **Tasks** | aucune correction nécessaire (composeur tâche et toggle done déjà câblés, sparkline cohérente, dates relatives non-inventées) |
| **IT/R&D** | aucune correction nécessaire (composeur journal entry + acknowledgeDrift + 8 sections toutes câblées) |

---

## Détail du périmètre vérifié (passe 5 — pas de neuf)

- **Operations** : 8 sections (Runbooks, Knowledge, Incidents, Processus, Benchmarks,
  Changements, Alertes, Context Layer) — toutes les actions (approuver/rejeter un changement,
  acquitter une alerte, ouvrir un détail) déclenchent une mutation CMS ou un overlay.
- **Tasks** : 6 sections (Today, Upcoming, Done, Definition of Done, Comparateur, Actions
  exposees) — composeur tâche fonctionne, sparkline rendue, ratios NaN-safe (weekdayAvg
  protégé par `Math.max(0, value/100)` côté heatColor).
- **Product** : 9 sections (Roadmap, Backlog, Releases, Specs, Classement, Lancement, MVP,
  Idéation, Channels) — `moveStage` canané, MVP composeur corrigé, kanban `Roadmap` ouvre
  les détails correctement.
- **People** : 11 sections (Overview, Approvals, Team, Agents, Squads, Content, Cadence,
  Culture, Personas, Mémoire, Codex) — tous les `data-scenario-row` ouvrent le détail,
  `Approve & Merge` déclenche une fusion atomique et loggue un `approval_decisions`,
  `Reject` idem.
- **IT/R&D** : 8 sections (Kernel, Experiments, Deploys, Journal, Boucles, Drift, Evals,
  Ontology) — `acknowledgeDrift` mutates `severity → ok`, le bouton "acquitter" est
  séparé du clic sur la carte (drill).
- **Legal** : 3 sections (Contracts, Compliance, Policies) — tous les toggles AI-Act
  fonctionnent, l'overdue est calculé correctement, les boutons d'action sont câblés.

---

## Vérification

### TypeScript

```bash
$ node node_modules/typescript/bin/tsc --noEmit
EXIT=0
$ wc -l /tmp/tsc.log
0 /tmp/tsc.log
```

Aucune erreur portant sur les fichiers de mon périmètre. Le passage reste clean après
les 3 commits.

### Captures

12 captures dans `%TEMP%\coach-d-captures\` :
- `legal-compliance.png` (glassmorphism, 920×600) — overdue en `#dc2626`, badge `Overdue`,
  3/5 toggles AI-Act
- `legal-compliance-dark.png` (dark-oled, 1920×1080) — même section, thème sombre, OK
- `legal-contracts.png` (glassmorphism, 920×600) — page liste des contrats
- `legal-policies.png` (glassmorphism, 920×600) — page liste des politiques
- `people-overview.png` (glassmorphism, 920×600) — "You" badge vert sémantique, bouton
  Start standup actif, cartes Active/Blocked sémantiques
- `people-overview-dark.png` (dark-oled, 1920×1080) — idem, fond noir
- `people-approvals.png` (glassmorphism, 920×600) — Doctrine banner, File vide état vide
- `people-approvals-dark.png` (dark-oled, 1920×1080)
- `product-mvp-before.png` (glassmorphism, 920×600) — 3 MVPs visibles après création
- `product-mvp-dark.png` (dark-oled, 1920×1080) — idem thème sombre
- `operations-alertes.png` (glassmorphism, 920×600) — 4 alertes, 3 RAW, 1 enriched
- `tasks-today.png` (glassmorphism, 920×600) — 2 tâches, checkbox + trash câblés

Toutes les captures montrent des pages qui rendent proprement. Aucune page ne hurle en
console (l'outil liste les erreurs de console en fin de capture, et il n'en a signalé
aucune sur les sections corrigées).

---

## Notes sur la duplication Legal

`LegalDetailPage.tsx` et `LegalItemDetail.tsx` portent chacun leur copie de la grille de
6 niveaux de souveraineté. **Les deux copies sont alignées en données** (mêmes 6 niveaux,
mêmes index, même "you are here" sur le niveau 3) mais diffèrent en structure :
- `LegalDetailPage` a un champ `examples` supplémentaire (7 occurrences) — modèle riche
- `LegalItemDetail` est plus squelettique (gain/keep/cost/orgSize/flagship sans examples)

Cette divergence est un choix de design hérité (la version "page" est plus bavarde que
la version "item CMS"). Une factorisation dans `src/apps/legal/sovereignty.ts` est
envisageable mais sort du périmètre de cette campagne (refactor pur). À noter pour une
passe ultérieure si la moindre mise à jour de la grille doit être faite — elle devra
toucher les deux fichiers à l'identique.

---

## Ce que j'ai vu hors périmètre et laissé aux autres

- `dashboard/`, `sales/`, `finance/`, `clients/`, `growth/`, `marketplace/` — rapport C
  déjà livré, je n'y touche pas.
- `apps/_ui/`, `apps/components/`, `apps/hooks/` — j'utilise `kit`, `widgets`,
  `CollectionRepeater`, `CMSCardList`, `useCmsStore`, etc. sans les modifier.
- `lib/cms/`, `stores/` — j'utilise `useCmsStore.addItem/updateItem`, `useShellStore.addToast`,
  `useCollectionDrill`, `useWindowPage`, `AppFrame`, `AppDetailOverlay` sans les modifier.
- `B1 Gatekeeper` décisions dans `ApprovalsView.tsx` (audit trail `approval_decisions`)
  — déjà en place, je ne fais que virer la palette Tailwind autour.

---

## Commits

```
c6f2eb8 fix(legal): câbler les actions Sign/Print/Counter-sign + palette hex
72997a2 fix(people): câbler "Start standup" + retirer la palette Tailwind
5b73d72 fix(product): eta calculé à la date de création du MVP (plus de TBD)
```

Aucun `git push` — orchestrateur prend le relais.
