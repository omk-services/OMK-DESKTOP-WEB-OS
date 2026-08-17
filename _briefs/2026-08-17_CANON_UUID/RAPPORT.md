# Rapport — aligner le code sur le canon `org_id uuid`

**Brief** : `_briefs/2026-08-17_CANON_UUID/BRIEF_ALIGNEMENT_CODE.md`
**Périmètre** : `auth/backend.supabase.ts`, `auth/backend.supabase.test.ts`,
`audit/ingest.ts`, `audit/logger.ts`, `audit/logger.test.ts`,
`audit/queries.ts`, `tenant/contract.ts`.
**Date** : 2026-08-17
**Statut** : ✅ TERMINE. `npx tsc --noEmit` = 0, `npx tsc -p api/tsconfig.json --noEmit` = 0,
tous les tests du périmètre + ceux de `audit/` et `auth/` (memberships,
storage-scope) restent verts.

---

## 1. La décision la plus importante : où vient l'`org_id` ?

Le brief demande de choisir entre deux sources pour l'`uuid` côté client :

- **A. le claim `org_id` du JWT** (posé par `custom_access_token_hook`) ;
- **B. une requête sur `organizations`** (filtrée par la policy
  `organizations_member_read`).

**J'ai retenu A — le claim JWT**, pour trois raisons :

1. **Source d'autorité.** Le hook `custom_access_token_hook` pose le claim
   côté serveur au moment de la signature du token. Toute autre source
   redécouvre ce que le serveur a déjà décidé — elle est forcement
   dérivée et risque d'introduire un délai d'incohérence.
2. **Aucun round-trip.** Une requête `organizations` ajoute une requête
   par appel `list()` (et `insert()`). Avec le claim, la résolution est
   purement client (décodage du JWT) et gratuite.
3. **Le cas d'absence est rendu visible.** Le hook omet volontairement le
   claim quand l'utilisateur n'a aucune adhésion active, pour que la RLS
   échoue franchement (cf. migration `2026-08-17_canon_rls_uuid.sql` §5).
   C'est exactement le cas qu'on veut détecter côté front — l'utilisateur
   a oublié d'accepter son invitation ou n'a pas rejoint d'org.

**Conséquence** : `extractOrgIdFromJwt()` (dans `backend.supabase.ts`)
lève `NoActiveMembershipError` quand le claim est absent. C'est
l'erreur explicite que demande le brief §3 — pas un `undefined` qui
voyage. Le message pointe vers la cause probable (« aucune adhésion
active ») et indique la marche à suivre (« accepter une invitation ou
rejoindre une organisation »).

**Note technique** : le décodage JWT utilise `atob` côté navigateur et
`Buffer.from(..., 'base64').toString('utf-8')` côté Node (pour les tests
sous Vitest). Pas de dépendance ajoutée. Le padding base64url est géré
explicitement — c'est le piège classique.

---

## 2. La distinction posée dans `contract.ts`

Deux marques de type disjointes, déclarées côte à côte :

| Type | Forme | Rôle |
|---|---|---|
| `TenantId` | slug kebab (cf. `TENANT_KEY_RE`) | clé de partition **locale** — `localStorage`, `storage-scope.ts`, partitions du store CMS |
| `OrgId` | uuid v4 (cf. `UUID_RE`) | identité **en base** — RLS, claim JWT, clés étrangères |

Les marques sont closes : passer l'un pour l'autre est une erreur de
compilation. Le test `#2` dans `backend.supabase.test.ts` le verrouille
avec `@ts-expect-error` sur les deux directions.

**Helpers ajoutés** (tous exportés) :
- `isValidOrgId(s: string): s is OrgId` — test de forme uuid v4.
- `toOrgId(raw: string): OrgId` — cast, sans validation (acte de
  confiance, à utiliser après une lecture DB typée ou un claim JWT).

**`MembershipRecord` enrichi** : le champ `orgId?: OrgId` est ajouté
(optionnel). Le `tenantId: TenantId` reste pour le backend in-memory
et pour le cloisonnement cache. Le caractère `?` est volontaire :
les tests in-memory de `memberships.test.ts` seedent des records
uniquement en slug ; les rendre obligatoires casserait le périmètre
adjacent (que je ne touche pas).

---

## 3. `backend.supabase.ts` — 10 occurrences de `tenant_id` réparées

Avant : `.select('id,tenant_id,user_id,...')` × 3 + `.eq('tenant_id', tenantId)`
× 4 + `.insert({ tenant_id: input.tenantId, ... })` + update équivalent.
Tous ciblent une colonne qui n'existe plus.

Après :
- Toutes les colonnes s'appellent `org_id` dans le `.select(...)`.
- Toutes les requêtes filtrent par `eq('org_id', orgId)` où `orgId` est
  extrait du JWT à chaque appel (lazy resolution).
- L'insert écrit `org_id` ; l'update n'autorise **plus** la mise à jour
  de `tenantId` (slug) — c'était un piège silencieux : un caller qui
  passe `{tenantId: 'demo' as TenantId}` en `patch` ne déclenchait
  aucune erreur, mais écrivait une valeur qui n'a plus de sens. Le
  champ est désormais ignoré côté Supabase.
- Les rows lues populent `orgId: OrgId` (uuid) sur `MembershipRecord`,
  et `tenantId: '__remote__' as TenantId` (sentinelle). La sentinelle
  est volontairement non-vide pour respecter le type ; aucun code ne
  doit l'utiliser pour une requête Supabase (cf. `extractOrgIdFromJwt`).

**Le slug `tenantId` reçu du caller est IGNORÉ côté Supabase.** Il est
toujours dans la signature `list(tenantId: TenantId)` pour rester
compatible avec `memberships.ts` (hors périmètre), mais le backend
lit l'org via le JWT. La RLS fait foi. Si quelqu'un essaie de
demander une autre org, le filtre s'applique au JWT, pas au slug :
c'est plus simple et plus sûr.

**Exports ajoutés pour les tests** : `NoActiveMembershipError` (classe
d'erreur) et `SupabaseMembershipBackend` (la classe elle-même). Le
runtime public reste `maybeUseSupabaseMembershipBackend()` (signature
inchangée — `main.tsx` n'est pas dans le périmètre et son
`if (supabaseMembershipsActive)` continue de fonctionner).

---

## 4. `audit/{logger,queries}.ts` — INSERT et SELECT basculés

`audit_events` suit le même canon : `org_id` (uuid), pas `tenant_id`.
La policy `audit_events_member_insert` exige `est_membre_org(org_id)`,
et `audit_events_admin_read` exige `est_admin_org(org_id)`.

**Vérification faite** : `grep` sur le périmètre — seul `INSERT` et
`SELECT` apparaissent. **Aucune UPDATE ni DELETE** (volontaire, le
journal est immutable — la policy `no_update_audit` / `no_delete_audit`
du brief AUDIT_LOG §Tests obligatoires #10 reste l'invariant). Les
`logger.ts` et `queries.ts` ne tentent jamais de UPDATE/DELETE.

**`logger.ts insertSupabase()`** : lit le claim JWT, écrit
`org_id: orgId` dans le row. Si le claim est absent → retourne
`{ok: false, reason: 'org_id claim absent (no active membership)'}`.
Best-effort respecté : `appendEvent()` ne lève toujours pas. Le
buffer in-memory continue à stocker `rec.tenantId` comme clé de
partition locale.

**`queries.ts listAuditEvents()`** : la branche Supabase lit le claim,
filtre par `eq('org_id', orgId)`. Si le claim est absent → retourne
`[]` (la RLS aurait fait pareil, mais on évite le round-trip et le
bruit console). Les filtres `actorId`/`action`/`targetType` côté
client restent après le SELECT pour les callers qui en ont besoin.

**`queries.ts rowFromEvent()`** : inchangé. Cette fonction construit
un `AuditEventRow` à partir d'un `EventRecord` (avant INSERT) ; elle
ne touche pas la base. Pas de modification nécessaire.

**`ingest.ts`** : **pas de modification**. Le code construit un
`EventRecord` avec `tenantId: extractTenantId(raw)` (slug ou uuid
selon le payload Observer) et délègue à `appendEvent()`. Pour
Supabase, c'est `logger.ts` qui pilote la colonne `org_id` via le
claim JWT — la valeur passée par l'Observer reste purement locale.
C'est la séparation voulue par le brief : l'Observer ne décide pas
de la valeur DB, le serveur (via le hook) décide.

---

## 5. Tests qui verrouillent le canon

Quatre tests dans `src/lib/auth/backend.supabase.test.ts` :

| # | Intention | Mécanisme |
|---|---|---|
| 1 | Aucun fichier du périmètre n'envoie `tenant_id` à Supabase | Lecture source + 4 regex de régression ; lève si une occurrence est trouvée dans `backend.supabase.ts`, `ingest.ts`, `logger.ts`, `queries.ts` |
| 2 | `TenantId` et `OrgId` ne sont pas interchangeables | Deux `@ts-expect-error` (un par direction) + `isValidOrgId` testé sur slug et uuid |
| 3a/b | Claim JWT absent → `NoActiveMembershipError` explicite | 3 sous-cas (pas de session, claim omis, claim malformé) + sanity check que le chemin nominal ne lève pas |

**Tous les tests de `audit/` (logger.test.ts, queries.test.ts) restent
verts** sans modification : ils utilisent le spy et le buffer
in-memory, qui n'ont pas changé. Les valeurs `tenantId: 'demo'`,
`'tenant-a'`, etc. qu'ils portent restent des clés de partition
locales valides.

**Tests adjacents lancés (hors périmètre, mais pour vérifier)** :
- `src/lib/auth/memberships.test.ts` : 38/38 verts (le `OrgId?`
  optionnel ne casse pas les seeds).
- `src/lib/auth/storage-scope.test.ts` + `storage-scope.node.test.ts` :
  25/25 verts (aucun changement requis).

---

## 6. Side effects hors périmètre — aucun

**`storage-scope.ts`** : pas touché. Le `tenantId` slug reste
canon pour le préfixe `coach-os:<userId>:<tenantId>:`. Mon changement
n'impacte pas ce cloisonnement : `auth-scope-bridge.ts` continue
d'appeler `setScope(userId, tenantId)` où `tenantId` vient du store
Zustand (`activeTenantId`). Le slug reste légitime pour le cache.

**`cms/cms.store.ts`, `apps/legal/sovereignty.ts`, `stores/`** : pas
touchés (hors périmètre). Les autres agents qui les travaillent en
parallèle voient le même état DB (uuid).

**`supabase/migrations/`** : pas touché. La migration
`2026-08-17_canon_rls_uuid.sql` est appliquée. Mes 0 modifications.

**`api/`** : pas touché. Mais `tsc -p api/tsconfig.json --noEmit`
passe — la chaîne serveur, qui importe `src/lib/audit/*` via
`api/v1/audit.ts` (non touché), valide les types mis à jour.

---

## 7. Vérifications globales

```bash
$ npx tsc --noEmit
$ npx tsc -p api/tsconfig.json --noEmit
exit=0   # les deux
```

```bash
$ npx vitest run src/lib/auth/backend.supabase.test.ts --maxWorkers=1
Test Files  1 passed (1)
Tests       4 passed (4)

$ npx vitest run src/lib/audit/ --maxWorkers=1
Test Files  2 passed (2)
Tests       18 passed (18)

$ npx vitest run src/lib/auth/memberships.test.ts --maxWorkers=1
Test Files  1 passed (1)
Tests       38 passed (38)

$ npx vitest run src/lib/auth/storage-scope --maxWorkers=1
Test Files  2 passed (2)
Tests       25 passed (25)
```

Aucune mesure globale de type « N erreurs de typage sur tout le
dépôt » : trois autres agents écrivent en parallèle, leurs éditions
en vol polluerait le chiffre. Mes mesures ne couvrent que mon
périmètre + les fichiers adjacents que mon changement pouvait casser
(`memberships.ts`, `storage-scope.ts`).

---

## 8. Anti-pièges payés

- **Le décodage JWT base64url → base64.** Le padding `===` doit être
  ajouté selon `payloadSeg.length % 4`. C'est le piège classique qui
  fait planter `atob` côté navigateur avec un `InvalidCharacterError`.
  Le calcul `'.==='.slice((payloadSeg.length + 3) % 4)` est correct
  pour les trois cas (0, 2, 3 caractères manquants).

- **L'extracteur est dupliqué entre `logger.ts` et `queries.ts`.** C'est
  volontaire : les deux modules sont best-effort et peuvent être
  importés indépendamment. Mutualiser via un helper partagé créerait
  une dépendance là où il n'y en a pas besoin (les deux convergent
  vers le même format uuid de toute façon).

- **`SupabaseMembershipBackend` exporté pour les tests.** C'est un
  petit écart au principe « exporter seulement ce qui est public », mais
  l'alternative (passer par `setMembershipBackend()` puis par
  `MembershipBackend`) aurait obligé à mocker `getMembershipBackend()`
  ET la session, ce qui complique le test #3 sans gain.

- **`MembershipRecord.orgId?: OrgId` optionnel.** Aurait pu être
  obligatoire, mais les tests in-memory de `memberships.test.ts`
  seedent des rows purement locales ; les rendre obligatoires casse
  le périmètre adjacent. L'option est honnête : c'est une valeur DB,
  absente en mode local.

---

## 9. Ce qui reste à faire (hors périmètre)

- **Coté UI** : les composants qui affichent `MembershipRecord.tenantId`
  verront désormais `'__remote__'` pour les rows venues de Supabase.
  C'est un changement de rendu, pas de contrat. Si l'UI doit afficher
  l'org réelle, lire `MembershipRecord.orgId` (uuid) ou afficher le
  nom de l'org via une requête `organizations` séparée.

- **Coté auth-scope-bridge.ts** : la fonction `resolveActiveTenantId()`
  lit `coach-os:activeTenantId` du localStorage. Cette clé porte
  actuellement un slug. Quand un user se connecte via Supabase, son
  org réelle (uuid) n'est PAS écrite ici — c'est cohérent avec le
  canon (slug = clé de partition locale). Mais si l'UI veut afficher
  « vous êtes dans l'organisation X », il faut une deuxième source.
  Pas dans mon périmètre ; à arbitrer dans une passe séparée.

- **Helpers de lecture JWT** : `extractOrgIdFromJwt` (auth) et
  `readOrgIdClaim` (audit) font le même travail. Si un troisième
  consommateur apparaît (ex. un test d'intégration qui simule une
  session), il sera temps de mutualiser.

---

## 10. Statut

✅ Le canon est aligné. Les 10 occurrences de `tenant_id` côté Supabase
sont remplacées. Les deux marques sont closes. Le claim JWT est la
source d'autorité pour l'org active. Le buffer in-memory reste en slug
pour le cloisonnement local. Aucun fichier hors périmètre n'est
modifié. Les typechecks passent, les tests du périmètre et des
adjacents passent.

**L'état du dépôt est compilable. Pas d'INACHEVÉ.**