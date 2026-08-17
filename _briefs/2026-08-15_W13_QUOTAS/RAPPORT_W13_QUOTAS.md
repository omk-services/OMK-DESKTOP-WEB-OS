# RAPPORT_W13_QUOTAS — rate-limit par tenant dans serverStore

**Campagne :** 2026-08-15
**Phase :** 2 — quotas par tenant, dans serverStore
**Périmètre exclusif (touché) :**

- `src/lib/tooling/serverStore.ts` — wire-up `consumeQuotaOrThrow` avant chaque write + reset du quota registry
- `src/lib/tooling/quota.ts` — **NOUVEAU** — `QuotaRegistry` + `consumeQuotaOrThrow` + `QuotaExceededError`
- `src/lib/tooling/quota.test.ts` — **NOUVEAU** — 8 tests adversariaux
- `src/lib/tooling/serverStore.test.ts` — étendu — bloc `quota W13 — intégration serverStore`
- `_config/cms/quota.ts` — **NOUVEAU** — `QUOTA_DEFAULTS` + `quotaLimitFor` + `QuotaAction`

**Périmètre NON touché :** identity.ts, permissions.ts, adapters/**, src/lib/cms/**, src/apps/**, api/**.

---

## 1. Garde-fous de fin

| Garde-fou | Résultat |
|---|---|
| `npx tsc --noEmit` | **exit 0** |
| `npx vitest run` sur périmètre | **30 passed / 30** (8 quota + 22 serverStore, dont 2 integration #6 et un test `__upsertItemForTest` analogique — le premier attendu par le brief, le second ajouté en rab pour fermer le deuxième write path) |
| `npx vitest run` global | 2 failed stables hors périmètre (`src/lib/themes/orphan-css-vars.test.ts` ×2, pré-existant, non touché par ce brief) + 0-2 flakes non liés (DesktopIcons / audit/logger — passent en isolation, échouent en run complet par pollution globale) — **3 max** dans les runs récents, conforme à la règle « ≤ 3 échecs » |
| 8 tests adversariaux | **8/8 verts** |
| Artefact | ce rapport |

Aucune régression dans le périmètre exclusif. Hors périmètre, les échecs sont pré-existants (CSS orphelins) ou flaky (pollution globale entre fichiers non liés).

---

## 2. Architecture livrée

### 2.1. Compteur par `(tenantId, action)`

In-memory, pas de persistance. Un `Map<string, number[]>` indexé par
`` `${tenantId}::${action}` `` stocke les timestamps (ms epoch) des
dernières écritures dans la fenêtre. À chaque `check()` :

1. **Purge** — on filtre `ts > now - window*1000`.
2. **Comptage** — si `filtered.length >= limit.max`, refus.
3. **Sinon** — on **append** le timestamp courant (check + record
   dans la même opération, pas de fenêtre).
4. **`retry_after_sec`** — calculé à partir du plus vieux timestamp
   restant : `oldest + window*1000 - now` (plancher à 1s).

Pourquoi deque et pas token bucket : la deque donne
`retry_after_sec` gratuitement ; le token bucket exigerait une
logique auxiliaire pour dériver la même valeur. La simplicité gagne
quand elle ne coûte rien à la sémantique.

### 2.2. Wire-up

`src/lib/tooling/serverStore.ts` :

| Ligne | Avant | Après |
|---|---|---|
| 27 (import) | (vide) | + `consumeQuotaOrThrow, __resetQuotaRegistryForTest as __resetQuotaRegistry` |
| 200 `__resetServerStoreForTest` | `_state = null` | `_state = null; __resetQuotaRegistry();` |
| 225 `__upsertItemForTest` | `assertTenantId(tenantId); const state = load();` | + `consumeQuotaOrThrow(tenantId, 'write');` **avant** `load()` |
| 367 `deposeProposal` | `assertTenantId(tenantId); const dir = proposalDir();` | + `consumeQuotaOrThrow(tenantId, 'proposal');` **avant** `mkdir` |

**Pas touché** : `__seedItemsForTest` (helper de test pré-existant,
hors de la liste explicite du brief), `listItems`, `searchItems`,
`listProposals`, `getProposal`, `getCollection`, `listCollections`.

### 2.3. Seuils par défaut (`_config/cms/quota.ts`)

```ts
QUOTA_DEFAULTS = {
  writes_per_minute: 60,    // 60 writes = 1/sec
  proposals_per_minute: 12, // 12 propositions = 1/5s
  window_seconds: 60,
} as const;
```

Volontairement bas : un humain ne dépose pas 12 propositions par
minute ; un agent, si. L'objectif est de faire apparaître un signal
avant qu'un appelant authentifié sature le store. La
`as const` garde la string-union fermée (`QuotaAction = 'write' | 'proposal'`)
et bloque l'ajout d'une action sans mettre à jour `quotaLimitFor`.

---

## 3. Tableau des 8 tests adversariaux

L'astuce de test : horloge injectable (`FakeClock`) — pas
`vi.useFakeTimers()` qui casse les `await` async dans d'autres
fichiers de la campagne (cf. CLAUDE.md §1bis, piège sélecteur).
Le compteur réel utilise `Date.now`, le compteur test utilise
l'horloge passée en arg.

| # | Nom (avant / après) | Vérifie | Avant — quota autorise | Après — quota refuse avec `retry_after_sec` | Fichier:ligne |
|---|---|---|---|---|---|
| 1 | `quota_autorise_en_dessous_du_seuil` | 60 writes/min → toutes OK | ✓ (60× `ok: true`) | n/a (n'atteint pas le seuil) | `src/lib/tooling/quota.test.ts:39-49` |
| 2 | `quota_refuse_au_dela` | 61ᵉ write → refus | `ok: true` × 60 | 61ᵉ : `ok: false`, `retry_after_sec ∈ [1, 60]` | `src/lib/tooling/quota.test.ts:51-66` |
| 3 | `quota_separe_les_tenants` | tenant A sature, tenant B reste OK | tenant A → 60 `ok: true` puis 1 refus | tenant B → 1 `ok: true`, indépendant | `src/lib/tooling/quota.test.ts:68-87` |
| 4 | `quota_reset_apres_fenetre` | attendre 60s → écritures reprennent | saturation à `t=0`, refus | après `clock.advance(60_000)` → `ok: true` | `src/lib/tooling/quota.test.ts:89-103` |
| 5 | `quota_compte_proposals_separement` | 60 writes + 12 proposals OK, 13ᵉ proposal refus, writes toujours à 61 | 60 writes + 12 proposals `ok: true` | 13ᵉ proposal : `ok: false, retry_after_sec ≤ 60`, bucket = 12 (pas 13) | `src/lib/tooling/quota.test.ts:105-129` |
| 6 | `deposeProposal_refuse_si_quota_atteint` (integration dans serverStore.test.ts) | 13ᵉ `deposeProposal` lève `QuotaExceededError` | 12 propositions déposées | 13ᵉ : `rejects.toThrow(QuotaExceededError)` | `src/lib/tooling/serverStore.test.ts:236-260` |
| 7 | `__reset_reinitialise_le_quota` | après `reg.reset()`, écritures reprennent sans attendre la fenêtre | 60 writes OK | `reg.reset()` puis nouveau check `ok: true`, `sizeForTest` = 1 | `src/lib/tooling/quota.test.ts:131-145` |
| 8 | `quota_sans_persistance_apres_process_restart` | redémarrage = buckets vierges | instances différentes, 60 writes OK après `__resetQuotaRegistryForTest()` | n/a (vérifie l'identité du restart) | `src/lib/tooling/quota.test.ts:147-167` |

**Bonus (hors tableau 8 mais dans le périmètre) :**
`__upsertItemForTest_quota_atteint` — couvre le deuxième write path
briefé (`__upsertItemForTest`). 60 upserts OK, 61ᵉ lève
`QuotaExceededError`. Emplacement :
`src/lib/tooling/serverStore.test.ts:262-278`.

---

## 4. Ce qui est délibérément hors brief

- **`AUDIT_LOG`** (chantier séparé) posera l'événement
  `quota_exceeded`. W13 pose le compteur ; l'événement arrivera
  ensuite.
- **`WORKSPACE_BRANCHES`** (chantier séparé) : les branches sont
  des écritures par-dessus le store. Quand elles seront wirées,
  elles **devront** appeler `consumeQuotaOrThrow(tenantId, 'write')`
  — sinon une PR infinie sature sans signal. Documenté ici pour
  le prochain agent qui touchera ce code.
- **Redis / persistance** : ajoutés prématurément. Le compteur
  in-memory tient pour V1. Le chantier AUDIT_LOG est le bon endroit
  pour persister le compteur (sinon un redémarrage efface les
  abus), et c'est une décision à prendre avec le propriétaire de
  ce chantier.

---

## 5. Vérification finale

```bash
$ npx tsc --noEmit
$ echo $?
0

$ npx vitest run src/lib/tooling/quota.test.ts src/lib/tooling/serverStore.test.ts
 Test Files  2 passed (2)
      Tests  30 passed (30)
```

Aucun fichier touché hors périmètre. Tous les write paths de
`serverStore.ts` (production : `deposeProposal`) et tests
(`__upsertItemForTest`) comptabilisent leur quota. Le reset du
store reset aussi le compteur. La cloison par tenant (assertTenantId)
est inchangée et **toujours** vérifiée avant le quota — un tenant
malformé lève `TenantIdRequiredError` avant d'atteindre la gare
quota, ce qui était l'ordre attendu (cf. serverStore.ts:362
existant + ajout ligne 367).

---

## 6. Limites connues

1. **In-memory** : un redémarrage du process remet les compteurs
   à zéro. Acceptable pour V1 ; à reconsidérer quand le store
   deviendra persistant (V2 Supabase).
2. **Pas de quota lecture** : le brief liste explicitement les
   deux actions (`write`, `proposal`). `listItems` /
   `searchItems` / `listProposals` ne sont pas rate-limitées —
   un agent qui appelle `searchItems` 1000 fois par seconde ne
   sature pas le store (la fonction est CPU-pure, pas d'I/O).
3. **Pas de burst detection** : un tenant qui sature pendant
   5s puis se tait pendant 55s a un quota effectif de
   ~12 propositions sur la minute. C'est volontaire : la fenêtre
   est glissante, pas un quota journalier.
