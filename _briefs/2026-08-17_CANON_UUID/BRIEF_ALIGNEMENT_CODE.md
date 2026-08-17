# BRIEF — aligner le code sur le canon `org_id uuid`

## Périmètre EXCLUSIF en écriture

```
src/lib/auth/backend.supabase.ts
src/lib/auth/backend.supabase.test.ts     (à créer si absent)
src/lib/audit/ingest.ts
src/lib/audit/logger.ts
src/lib/audit/logger.test.ts
src/lib/audit/queries.ts
src/lib/tenant/contract.ts
```

Plus ton rapport : `_briefs/2026-08-17_CANON_UUID/RAPPORT.md`.

**Ne touche pas** à `src/lib/cms/cms.store.ts`, `src/apps/legal/sovereignty.ts`,
`src/stores/`, `api/`, `supabase/migrations/`. Tu peux tout **lire**.

## Ce qui a changé en base, et qui casse le code

La base **CUSTOMERS** (`ndvqwcapwcnpdvknxcjw`) est désormais le backend réel de
Coach OS. Le 2026-08-17, elle a été unifiée sur un seul vocabulaire de tenant.

**Avant** — deux systèmes pour la même notion :

| Colonne | Type |
|---|---|
| `memberships.tenant_id` | `text` (slug) |
| `audit_events.tenant_id` | `text` |
| `workspace_branches.tenant_id`, `workspace_prs.tenant_id` | `text` |
| `cms_*.tenant_id` | `text` — **en plus** de `cms_*.org_id` |
| `cms_*.org_id` | `uuid` — celui que la RLS compare |

**Après** — un seul :

- toutes ces colonnes s'appellent **`org_id`** et sont de type **`uuid`** ;
- le doublon `tenant_id text` des 25 tables `cms_*` est **supprimé** ;
- clés étrangères vers `organizations(id)` sur `memberships`,
  `workspace_branches`, `workspace_prs` ;
- helpers RLS : `est_membre_org(uuid)` et `est_admin_org(uuid)` remplacent
  `est_membre_du_tenant(text)` / `est_admin_du_tenant(text)` ;
- le hook JWT lit `m.org_id` et trie par `m.invited_at` (il n'y a pas de
  `created_at` sur `memberships`).

Mesures de contrôle après migration : **0 colonne `text`**, 30 colonnes
`org_id uuid`, 128 policies, 0 table sans policy, 4 fonctions clés présentes.

**Conséquence immédiate** : `backend.supabase.ts` sélectionne `tenant_id`
(10 occurrences). Cette colonne **n'existe plus**. Toute requête d'adhésion
échoue aujourd'hui.

## La distinction à poser — c'est le cœur du brief

Deux notions se ressemblaient et se confondaient. Elles doivent se séparer.

| Notion | Type | Rôle | Où elle vit |
|---|---|---|---|
| `TenantId` (`'__default__'`, `'demo-coach'`) | slug `string` | **clé de partition locale** | `localStorage`, partitions du store CMS, `storage-scope.ts` |
| `org_id` | `uuid` | **identité en base** | RLS, claim JWT, clés étrangères |

Le slug reste **parfaitement légitime** côté navigateur : il partitionne le
cache par espace de travail, et `src/lib/auth/storage-scope.ts` s'en sert pour
cloisonner `localStorage` entre comptes. **Ne le supprime pas.**

Ce qu'il ne doit plus faire : **partir vers Supabase**. Toute requête qui
compare un identifiant d'organisation doit envoyer l'`uuid`.

## Ce qu'on attend

### 1. `contract.ts` — nommer les deux notions

`TenantId` est aujourd'hui utilisé pour les deux usages. Sépare-les
explicitement : garde `TenantId` pour la partition locale, et introduis un
type distinct pour l'identité en base (par exemple `OrgId`).

Un `type OrgId = string` nu ne suffit pas — les deux resteraient
interchangeables pour le vérificateur, et c'est exactement l'erreur qu'on
répare. Utilise une marque de type (*branded type*) pour que le compilateur
refuse de passer l'un pour l'autre.

### 2. `backend.supabase.ts` — passer à `org_id`

Les 10 occurrences de `tenant_id` visent une colonne disparue. Le champ à
lire et écrire est `org_id`.

Question à trancher, et à **justifier dans le rapport** : d'où vient l'`uuid`
de l'organisation côté client ?

Deux sources possibles, regarde le code avant de choisir :

- le **claim `org_id` du JWT** — le hook l'y met déjà, et c'est la source qui
  fait autorité côté serveur ;
- une **requête sur `organizations`** — la policy `organizations_member_read`
  autorise un membre à lire son organisation.

Le claim est plus direct, mais il est absent quand l'utilisateur n'a aucune
adhésion active (le hook l'omet volontairement, pour que la RLS échoue
franchement au lieu de rendre zéro ligne en silence). Ton code doit gérer ce
cas **explicitement**, pas le laisser produire un `undefined` qui voyage.

### 3. `src/lib/audit/*` — même traitement

`ingest.ts`, `logger.ts`, `queries.ts` écrivent et lisent `audit_events`.
Cette table a aussi basculé sur `org_id uuid`.

Sache que `audit_events` n'a **ni policy UPDATE ni policy DELETE** — c'est
volontaire, un journal réinscriptible ne vaut rien. Si le code tente une mise
à jour, elle échouera silencieusement (RLS refuse). Vérifie qu'il n'en tente
aucune, et si c'est le cas, dis-le au lieu de contourner.

### 4. Ne casse pas le cloisonnement du cache

`src/lib/auth/storage-scope.ts` préfixe les clés `localStorage` par
`coach-os:<userId>:<tenantId>:`. Ce `tenantId` est le **slug local** — il
reste. Tu n'as pas le droit d'écrire dans ce fichier ; si ton changement
l'impacte, décris-le dans le rapport au lieu de le modifier.

## Les tests qui verrouillent

1. Aucun fichier de ton périmètre n'envoie `tenant_id` à Supabase — un test
   qui lit les sources et échoue en listant les occurrences.
2. Le type de partition locale et le type d'identité en base ne sont **pas**
   interchangeables : un test de typage qui échouerait à compiler si on passe
   l'un pour l'autre (`@ts-expect-error`).
3. Un utilisateur sans adhésion active (claim `org_id` absent) produit une
   erreur **explicite**, pas un `undefined` silencieux.

Lance **uniquement** tes propres tests, avec `--maxWorkers=1`.

## Vérifications globales autorisées

Ton changement touche des types partagés, donc les deux typechecks sont
légitimes et attendus :

```
npx tsc --noEmit
npx tsc -p api/tsconfig.json --noEmit
```

Les deux doivent rendre **0**. `tsc -p api/tsconfig.json` couvre le chemin
serveur, que `tsc` seul ignore — c'est ce trou qui a laissé passer trois
régressions de production le 2026-08-17.

## Interdits

- Aucune écriture hors périmètre.
- Aucune migration, aucun appel à l'API Supabase, aucun `npm install`.
- Aucun `git`.
- N'invente aucun nom de colonne : la liste ci-dessus est mesurée.
- N'invoque aucun workflow, aucune skill, aucun agent délégué.

## Rapport partiel obligatoire

Si tu t'arrêtes, écris ce que tu as, et termine par `## INACHEVÉ`. Si tu
laisses le dépôt non compilable, **dis-le en tête de rapport**.
