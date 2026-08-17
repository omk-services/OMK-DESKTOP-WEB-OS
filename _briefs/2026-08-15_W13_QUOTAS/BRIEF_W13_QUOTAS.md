---
id: W13_QUOTAS
campagne: 2026-08-15
phase: 2 — quotas par tenant, dans serverStore
perimetre_exclusif: |
  src/lib/tooling/serverStore.ts
  src/lib/tooling/quota.ts                       (nouveau)
  src/lib/tooling/quota.test.ts                 (nouveau — 8 tests)
  src/lib/tooling/serverStore.test.ts           (étendu — tests d'intégration)
  _config/cms/quota.ts                          (nouveau — seuils par défaut)
interdit: |
  src/lib/tooling/identity.ts
  src/lib/tooling/permissions.ts
  src/lib/tooling/adapters/**
  src/lib/cms/**
  src/apps/**
  api/**
artifact_obligatoire: |
  _briefs/2026-08-15_W13_QUOTAS/RAPPORT_W13_QUOTAS.md
---

# BRIEF_W13_QUOTAS — rate-limit par tenant

## La phrase qui commande ce brief

> **W13 n'est pas une garde par outil. C'est une politique transverse : un
> compteur par tenantId qui plafonne les effets de bord avant qu'ils
> n'aient le temps de devenir un DoS.**

## Le contexte

`serverStore.ts:138-160` (assertTenantId) garantit que chaque appel
opère dans son tenant. **Mais rien n'empêche un appelant authentifié dans
le bon tenant de saturer le store** : 10 000 dépôts/minute, 10 000
propositions/minute, 10 000 écritures sur n'importe quelle collection.

Les trois vecteurs concrets :
1. **Agent en boucle** — il appelle `scenario.deposeProposal` 60 fois
   par seconde.
2. **Humain qui spamme** — il clique 200 fois sur « Créer ».
3. **Attaquant authentifié** — pas une faille de sécurité (les gardes
   identité + cloison + permissions sont en place), mais une absence de
   fair-use.

## Architecture du compteur

Crée `src/lib/tooling/quota.ts`. Pas un compteur global, **un compteur
par tenantId** :

```ts
// Pseudo-code. In-memory, pas de persistance (la persistance est le
// chantier AUDIT_LOG). Re-démarrage du process = reset.
class QuotaRegistry {
  // returns { ok: true } | { ok: false, retry_after_sec: number }
  check(tenantId: string, action: 'write' | 'proposal', limit: Limit): QuotaResult;
  // appelé par tous les write paths de serverStore
}
```

**Limites par défaut** (`_config/cms/quota.ts`) :

```ts
export const QUOTA_DEFAULTS = {
  // écritures sur le store (items, collections) par tenant
  writes_per_minute: 60,
  // propositions déposées par tenant par minute
  proposals_per_minute: 12,
  // fenêtre coulissante (sliding window) — pas un token bucket simple
  window_seconds: 60,
} as const;
```

Ces seuils sont volontairement **bas** : un humain ne dépose pas 12
propositions par minute. Un agent, si. Tu ajustes au besoin après la
première mise en prod, mais démarre strict.

## Wire-up

`serverStore.ts` importe `QuotaRegistry` et l'appelle **avant chaque
write** :

```ts
// Pseudo-code pour deposeProposal.
export async function deposeProposal(tenantId: string, input: ...): Promise<...> {
  const q = quota.check(tenantId, 'proposal', QUOTA_DEFAULTS);
  if (!q.ok) {
    return { ok: false, error: `Quota dépassé. Réessaye dans ${q.retry_after_sec}s.` };
  }
  // ... reste de la fonction inchangé
}
```

**Même wire-up pour** :
- `__upsertItemForTest` (helper préfixé `__`) → quota sur `write`
- Toutes les nouvelles écritures futures

**Pas touché** : `__resetServerStoreForTest` doit aussi réinitialiser
le `QuotaRegistry`. Sinon les tests qui rejouent 100 écritures
échouent toutes à partir de la 61ᵉ — c'est un faux rouge dans la
baseline.

## Algorithme du compteur

Sliding window **simple**, sans dépendance externe. Pour chaque
`(tenantId, action)` :
- une deque (en pratique : un tableau tronqué) des timestamps des
  dernières écritures.
- à `check()` : purge les timestamps > fenêtre, puis compte. Si le
  compte est au seuil, `ok: false, retry_after_sec = oldest + window - now`.

**Pourquoi pas un token bucket** : le token bucket ne fait pas
apparaître le bon message d'erreur (`retry_after_sec`) sans logique
supplémentaire. La deque donne la valeur gratuitement.

**Pourquoi pas Redis** : le store est in-memory aujourd'hui. Ajouter
Redis pour W13 est prématuré — c'est un autre chantier, et W13 peut
fonctionner en local sans Redis. Le compteur in-memory tient pour la
V1.

## Tests obligatoires (8)

| # | nom | vérifie |
|---|---|---|
| 1 | `quota_autorise_en_dessous_du_seuil` | 60 écritures/minute → toutes OK |
| 2 | `quota_refuse_au_dela` | 61� → `{ ok: false, retry_after_sec: < 60 }` |
| 3 | `quota_separe_les_tenants` | tenant A sature ; tenant B reste OK |
| 4 | `quota_reset_apres_fenetre` | attend 60s, écritures reprennent |
| 5 | `quota_compte_proposals_separement` | écrire 60 items + 12 propositions → la 13ᵉ proposition échoue, mais items continuent |
| 6 | `deposeProposal_refuse_si_quota_atteint` | test d'intégration `serverStore.test.ts` |
| 7 | `__reset_reinitialise_le_quota` | après reset, écritures reprennent sans attendre la fenêtre |
| 8 | `quota_sans_persistance_apres_process_restart` | documenté : reset implicite, comportement attendu |

## Garde-fous de fin

- `npx tsc --noEmit` → exit 0
- `npx vitest run` → baseline 209/211 + 8 tests W13 verts
- Le rapport `_briefs/2026-08-15_W13_QUOTAS/RAPPORT_W13_QUOTAS.md` contient
  le tableau des 8 tests avec `avant`/`après`/`fichier:ligne`.

## Lien avec les autres briefs

- **AUTH_FIX** : ce brief utilise `ctx.actorId` mais pas l'identité au-delà.
  L'identité valide est supposée déjà appliquée par `serverStore.ts`
  (déjà en place).
- **AUDIT_LOG** : chaque refus de quota devrait être loggué. Ce brief
  pose le compteur ; AUDIT_LOG pose l'événement.
- **WORKSPACE_BRANCHES** : les branches sont des écritures par-dessus le
  store. Elles comptent aussi dans le quota — sinon une PR infinie
  sature sans signal.
