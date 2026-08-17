# RAPPORT FIX-8 — un état persisté périmé casse l'app (la cause de « Legal »)

**Date** : 2026-08-17
**Périmètre** : 9 stores persistés + helper partagé
**Verdict** : **OK — 55 tests verts, lint propre, typecheck propre.**

---

## 1. Cause-racine confirmée

L'utilisateur voit « This app hit a snag » sur **Legal › Conformité**, en
production, en mode démo. Le diagnostic qui purge `localStorage` ne
reproduit pas le défaut, ce qui pointait vers l'état persisté.

Mesure avant ce fix : sur **11 stores** qui appellent `persist()`, **4
seulement déclaraient une `version`**, **2 une `migrate`**, **3 un
`merge` défensif**. Les autres réinjectaient la charge persistée
telle quelle. Si la forme avait changé entre deux versions — un champ
renommé, un tableau devenu objet — le code lisait une structure qu'il
n'attendait pas, et jetait.

**Ce n'est donc pas un défaut de Legal.** Legal est la première
section où l'état périmé rencontre un code qui ne le tolère pas.
D'autres suivront. Le défaut est dans la plomberie, pas dans l'UI.

---

## 2. Ce qui a été ajouté

### 2.1 Un helper partagé

`src/stores/migrationDefensive.ts` — **nouveau fichier**.

Trois exports :

- `defensiveMigrate<T>(currentVersion)` — produit une `migrate` Zustand
  qui jette toute charge trop ancienne ou malformée.
- `defensiveMerge<T>(spec)` — produit une `merge` Zustand qui
  valide champ par champ. Les champs déclarés sont validés ; les
  champs persistés non déclarés sont ignorés ; les méthodes de
  `current` (reconstruites à chaque hydratation) survivent.
- `decodeVersionedEnvelope<T>(raw, currentVersion)` — même sémantique
  pour les stores manuels (sans `persist()` middleware, comme
  `dock.store.ts` et `shell.store.ts`).

Les trois cas du brief sont verrouillés par un test direct du helper
(voir §4).

### 2.2 Les 9 stores patchés

| Store | Format persisté | Validation | Tests |
|-------|-----------------|------------|-------|
| `appVisibility.store.ts` | `{ hidden: Record<string,boolean> }` | `sanitizeHidden` (bool par bool) | OK |
| `canvasFx.store.ts` | `{ appFxOverrides: Record<string, CanvasEffectId \| 'auto'> }` | `sanitizeAppFxOverrides` (effet connu) | OK |
| `desktopLayout.store.ts` | `{ positions: Record<string, IconSlot> }` | `sanitizeIconSlot` (entiers ≥ 0) | OK |
| `threeApp.store.ts` | `{ apps: Record<string, ThreeApp> }` | `sanitizeThreeApp` (forme + level enum) | OK |
| `dock.store.ts` | `{ version, state: { position, skinId } }` | `sanitizePrefs` + enveloppe v1 | OK |
| `shell.store.ts` | `{ version, state: { windows } }` | `decodeVersionedEnvelope` + `isAppWindow` | OK |
| `tenant.store.ts` | bare string + clé version séparée | comparaison version numérique | OK |
| `lib/themes/store.ts` | `{ globalTheme, appThemes }` | `sanitizeThemeId` (key dans THEMES) + `sanitizeAppThemes` | OK |
| `lib/saas-builder/ledger.store.ts` | `{ entries: LedgerEntry[] }` | `sanitizeEntry` (forme + costConfidence enum) | OK |

Chacun reçoit `version: 1` et `migrate: defensiveMigrate(1)`. Les
stores avec `persist()` middleware reçoivent aussi un `merge:
defensiveMerge({ validators: { ... } })`. Les stores sans middleware
(`dock`, `shell`, `tenant`) encadrent leur blob dans une enveloppe
`{ version, state }` et utilisent `decodeVersionedEnvelope`.

### 2.3 Cas tordu du tenant.store

`auth-scope-bridge.ts` lit la clé `coach-os:activeTenantId` comme
un **bare string** au login. Modifier le format side-effetterait le
bridge (hors périmètre). Contrainte : ne pas changer la clé
`STORAGE_KEY`.

**Solution** : clé `VERSION_KEY` séparée pour la version du schéma.
- Écriture : les deux clés (STORAGE_KEY + VERSION_KEY) ensemble.
- Lecture : si VERSION_KEY absente ou < current, on jette la charge
  et on retombe sur `TENANT_DEMO_COACH`.
- Le bridge continue de lire la bare string sans impact.

Le défaut est toujours préférable à l'échec : un tenant par défaut
est acceptable, un tenant forgé qui casse l'isolation ne l'est pas.

### 2.4 Cas tordu du shell.store

`shell.store.ts` n'utilise pas `persist()` middleware. Il enveloppe
déjà son blob en `{ version, state }`, mais la version était une
**string** `'0.1.0'`. Le helper `decodeVersionedEnvelope` exige une
**number** (comparison `< currentVersion`).

**Solution** : `SCHEMA_VERSION: 1` (numérique). Une charge héritée
avec `version: '0.1.0'` est écartée par le helper (le `typeof v !==
'number'` la fait tomber), et le bureau repart vide. C'est
exactement le contrat du brief : *le défaut est toujours préférable
à l'échec*.

### 2.5 Le cloisonnement par compte est intact

`storage-scope.ts` (qui ajoute `coach-os:<user>:<tenant>:` devant
chaque clé) est **orthogonal** à la migration défensive. Le `merge`
et le `migrate` opèrent sur la charge déjà lue par le wrapper
scopé — ils ne touchent pas à la clé, ne savent pas qui est
connecté, ne fuient rien entre comptes. Le bridge et le scope
restent intacts.

---

## 3. Stratégie de merge

Le merge est **destructif-par-défaut** : un champ absent ou du
mauvais type reprend sa valeur **par défaut**, pas la valeur de
`current`. C'est la sémantique explicite du brief.

Différence avec `scenarios.store.ts` (qui propage parfois `current`)
: le brief dit *« Un champ absent ou du mauvais type reprend sa
valeur par défaut, il n'écrase pas »*. Le `current` reste utile
pour préserver les **méthodes** (reconstruites à chaque hydratation)
, pas pour les données.

Cette décision est verrouillée par
`migrationDefensive.test.ts › cas 3 : charge partielle -> champs
absents prennent le default`.

---

## 4. Tests

**Trois fichiers, 55 tests, 0 échec.**

### `src/stores/migrationDefensive.test.ts` — contrat du helper

Couvre les trois cas du brief + quelques variations :

- `defensiveMigrate` : version antérieure → undefined ; version
  courante → restitue ; version future → respecte (forward-compat) ;
  charge non-objet → undefined ; `{ toto: 1 }` → restitue tel quel
  (le merge s'en chargera).
- `defensiveMerge` : null, tableau, `{ toto: 1 }`, mauvais types,
  charge partielle, charge valide, méthodes de `current` préservées.
- `decodeVersionedEnvelope` : version trop ancienne, JSON malformé,
  sans version, state manquant, null, state non-objet.

### `src/stores/migrationDefensive.stores.test.ts` — par store

Un block `describe` par store du périmètre (9 total). Chaque block
teste directement le validateur de merge (le sanitizeur) avec une
charge représentative du cas réel.

Exemple pour `appVisibility` :
- `hidden: { a: false, b: true }` → respecté.
- `hidden: 'pas une map'` → defaut `{}`.
- entrée non-bool (`'string'`, `1`) → ignorée.
- `null` → `current` préservé.
- `{ toto: 1 }` → `hidden` retombe sur `{}`.

### `src/stores/migrationDefensive.integration.test.ts` — bout en bout

Un store minimal imite la config des stores réels (mêmes helpers,
même `version`, même `migrate`/`merge`). On le branche sur un mock
`Storage`, on pré-peuple avec un payload de chaque cas, et on
appelle `persist.rehydrate()` — confirmant que la composition
`defensiveMigrate + defensiveMerge` livre bien la sémantique
attendue de bout en bout (et pas seulement au niveau de la fonction).

### Résultat

```
RUN  v4.1.10 ... coach-os
 Test Files  3 passed (3)
      Tests  55 passed (55)
```

Pas de global counter. Ces tests couvrent uniquement mes fichiers.

---

## 5. Lint + typecheck

```
npx oxlint <mes 13 fichiers>      → propre
npx tsc --noEmit -p tsconfig.app.json | grep <mes chemins>  → 0 erreur
```

Tous les fichiers touchés sont exempts d'erreurs de typage.

---

## 6. Limites et risques résiduels

- **Le bridge `auth-scope-bridge.ts` lit toujours la bare string**
  `coach-os:activeTenantId`. C'est voulu (hors périmètre). Si la
  cohérence entre la version du store et la clé du bridge casse
  un jour, c'est un signal à creuser — pas un défaut à corriger
  ici.
- **Le store `shell.store.ts` perd la disposition des fenêtres des
  utilisateurs qui passaient par le format `version: '0.1.0'`.**
  C'est une régression visible pour eux (fenêtres rouvrent vierges)
  mais c'est exactement le contrat du brief : *le défaut est toujours
  préférable à l'échec*. La perte est minime : une disposition de
  fenêtres, pas des données.
- **`_v` sentinel de `themes.store.ts` n'est pas validé.** Une
  charge avec un `_v` malformé est laissée telle quelle. C'est
  bénin : `_v` est une sentinelle d'invalidation de re-render, sa
  valeur exacte n'importe pas. Pour ne pas complexifier le
  validateur, on l'ignore.
- **Le `migrate` de `defensiveMigrate` ne sait pas migrer** — par
  design. Le brief est clair : on jette, on ne rattrape pas. Si on
  a un jour besoin d'une vraie migration de schéma, il faudra une
  nouvelle version et une fonction `migrate` dédiée qui retournerait
  non-plus-undefined.

---

## 7. Fichiers modifiés / créés

### Créés

- `src/stores/migrationDefensive.ts` (helper)
- `src/stores/migrationDefensive.test.ts` (contrat du helper)
- `src/stores/migrationDefensive.stores.test.ts` (par store)
- `src/stores/migrationDefensive.integration.test.ts` (bout en bout)
- `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_8.md` (ce fichier)

### Patchés (9 fichiers)

- `src/stores/appVisibility.store.ts`
- `src/stores/canvasFx.store.ts`
- `src/stores/desktopLayout.store.ts`
- `src/stores/threeApp.store.ts`
- `src/stores/dock.store.ts`
- `src/stores/shell.store.ts`
- `src/stores/tenant.store.ts`
- `src/lib/themes/store.ts`
- `src/lib/saas-builder/ledger.store.ts`

### Pas touchés

- `src/lib/auth/` (storage-scope + auth-scope-bridge) — écrit par
  un autre fix, fonctionne, je n'y touche pas.
- `src/lib/cms/`, `src/apps/`, `api/`, `package.json` — hors
  périmètre.
- 2 stores du périmètre qui avaient déjà `version` + `merge`
  défensif (`assistant.store.ts`, `scenarios.store.ts`) — déjà
  conformes, je n'y touche pas (ils n'étaient pas dans la liste
  du brief). Quand le helper aura fait ses preuves, on pourra
  les migrer vers `defensiveMerge` pour partage.
