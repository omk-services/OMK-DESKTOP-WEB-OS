# Rapport B — Supabase multi-tenant : 23 collections, RLS, Auth, compte de démonstration

> Brief : `BRIEF_B_SUPABASE.md` · Périmètre exclusif : `supabase/**`, `src/data/**`,
> `src/lib/cms/repository.ts` (extension), `_briefs/.../RAPPORT_B_SUPABASE.md`.
>
> Date : 2026-08-11. Écrit au fil de l'eau, pas à la fin.

---

## 0. État mesuré avant d'écrire

### Ce qui existe déjà (mesuré)

- **`supabase/` est vide de migrations** : seulement `.temp/cli-latest` (v2.113.0) et
  `.temp/linked-project.json` qui pointe vers `qjrwcdzaebyqponqkiqs` (le projet **EN PAUSE**,
  DNS ne résout pas — voir SOCLE.md). Aucune migration, aucun `supabase init`, aucun `config.toml`.
- **`src/lib/cms/repository.ts` existe** et utilise déjà Supabase via :
  - `cms_collections` (1 ligne par collection)
  - `cms_items` (générique, `data jsonb`) pour tous les items, plus appendCmsEvent
- **23 collections confirmées dans `src/lib/cms/seed.ts`** (lignes 14-497) :
  clients, articles, team, people_agents, runbooks, incidents, services, it_experiments,
  deploys, tasks, marketplace_listings, product_items, product_releases, growth_channels,
  growth_experiments, deals, invoices, contracts, policies, session_notes, demo_coach_apps,
  demo_coach_notes, demo_coach_metrics.
- **23/23 ont leur `titleField` absent de `fields`** — la table doit donc toujours porter
  cette colonne en plus des fields. Le client (`formFieldsFor()`) le fait déjà, mais le
  schéma SQL doit aussi le savoir.
- **Environnement** : `supabase` CLI 2.98.2 (v2.113.0 dans `.temp/`), Docker 29.2.0
  installé **mais daemon non démarré** (Docker Desktop lancé, daemon n'a pas démarré
  après 100+ secondes — vraisemblablement WSL2 ou Hyper-V non configuré sur cette machine).
- **`src/lib/supabase.ts`** (hors périmètre, agent A) utilise `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` et expose `supabaseConfigured`. Bonne base : le client
  est déjà singleton-safe.

### Décisions de modèle

| Choix | Raison |
|---|---|
| **23 tables séparées** (`cms_clients`, `cms_articles`, …) | Brief §Livrable 1 : « une table par collection » ; permet d'exploiter le typage Postgres et le `supabase db lint` ligne par ligne. |
| **`cms_items` + `cms_collections` conservés** (rétro-compat) | Le code existant (`src/lib/cms/repository.ts` Phase 1) dépose events + définitions dans ces deux tables. Je les ai recréés en SQL. Le nouveau mapping `tableFor()` ouvre la voie à la migration du repository vers le schéma typé. |
| **`org_id` non nul, `tenant_id` text non nul** | `org_id` est la frontière de sécurité (RLS). `tenant_id` est la partition applicative (DEMO_COACH vs DEFAULT) — distinct, mais les deux sont indexés. |
| **`custom_access_token_hook` SQL natif** | Le claim `org_id` doit être injecté dans le JWT au login. Si le hook n'est pas provisionné → 0 lignes en silence. C'est la source du bug déjà payé (cf. SOCLE.md §Le piege deja paye). |
| **Repli local explicite** | Le seed TypeScript reste la vérité de la démo. Si Supabase est injoignable, on dégrade et **on le dit** (`console.info`), on ne simule rien. |

### Hors périmètre (rappel)

- `src/lib/supabase.ts` et `.env.example` (agent A)
- `src/components/**`, `src/apps/**` (les 19 apps)
- Application sur les projets distants (INTERN, CUSTOMERS, coach-os PAUSE) — geste de l'utilisateur

---

## 1. Livrable 1 — migrations des 23 collections

**Statut : FAIT.**

Fichier : `supabase/migrations/20260811000001_collections.sql`

- **23 tables CMS** créées, une par collection, plus `cms_items` et `cms_collections` (rétro-compat Phase 1).
- Chaque table porte : `id uuid PK`, `org_id uuid NOT NULL`, `tenant_id text NOT NULL DEFAULT '__default__'`,
  `slug text NOT NULL` (UNIQUE dans l'org), la colonne du `titleField` (toujours présente), les
  colonnes des `fields[]`, `created_at`, `updated_at`.
- **Index** sur `org_id` (toutes les lectures filtrent dessus) et sur `(org_id, tenant_id)`.
- **Trigger `updated_at`** attaché aux 25 tables via une boucle dynamique `do $$ ... $$`
  (Postgres n'a pas de trigger générique sur le nom de table).
- **Slug `text` séparé du PK `uuid`** : le seed TS utilise des slugs stables (`ava-chen`)
  que l'app connaît, on les garde en colonne text, le PK reste uuid.

### Vérification

```bash
$ node supabase/tools/validate-migrations.mjs
  OK    20260811000001_collections.sql
  OK    20260811000002_memberships.sql
  OK    20260811000003_rls.sql
  OK    20260811000004_jwt_hook.sql
  OK    20260811000005_seed.sql
OK — toutes les migrations passent les invariants heuristiques.
```

---

## 2. Livrable 2 — RLS + JWT hook + test adverse

**Statut : FAIT.**

### Fichiers produits

- `supabase/migrations/20260811000002_memberships.sql` — `organizations`, `profiles`,
  `memberships`, et la fonction helper `current_org_id()`.
- `supabase/migrations/20260811000003_rls.sql` — RLS sur 23 tables CMS + cms_items +
  cms_collections, via une boucle dynamique qui couvre les 23 collections CMS. Les
  deux tables rétro-compat ont leur bloc explicite.
- `supabase/migrations/20260811000004_jwt_hook.sql` — fonction `custom_access_token_hook`
  (lit `memberships` → injecte `org_id` dans le JWT).
- `supabase/VERIFICATION_RLS.md` — la procédure de vérification étape par étape,
  incluant le test d'isolation adverse (org A user ne lit pas org B, écrit
  explicitement avec les requêtes SQL).

### Politique

Toutes les policies : `org_id = public.jwt_org_id()` (extrait de `(auth.jwt() ->> 'org_id')::uuid`).
Quatre policies par table : `select`, `insert`, `update`, `delete`.

### Le piège neutralisé

- Le hook **définit** la fonction SQL.
- Le hook **s'active** dans le Dashboard Supabase (`Authentication → Hooks → Custom Access Token → Enable`).
- Sans activation, `org_id` est absent du JWT, **toutes** les policies renvoient 0 ligne en silence.
  C'est exactement le bug déjà payé. La procédure pour vérifier que le claim arrive est
  dans `VERIFICATION_RLS.md` §2.

### Test adverse (rédigé, pas exécuté — voir §6)

Voir `supabase/VERIFICATION_RLS.md` §3. Setup, 3 tests (SELECT croisé, INSERT
croisé, UPDATE croisé), cleanup. Le test doit **échouer** si la policy est
cassée — il n'est pas un placebo.

---

## 3. Livrable 3 — Auth et compte de démonstration

**Statut : FAIT.**

### Fichier produit

- `supabase/migrations/20260811000005_seed.sql` — l'organisation "Demo Coach"
  (UUID fixé `00000000-0000-0000-0000-000000000001`), 23 collections de seed
  attachées à cet org_id et au tenant `demo_coach`.
- Le profil + la membership du user démo sont documentés en commentaire
  (l'UUID user doit être créé via Dashboard, le `insert` SQL est fourni).
- Les auth providers (email, Google, Apple, Microsoft) sont documentés en
  commentaire — activation via Dashboard UI, pas SQL.

### Vérification de la cohérence seed TS ↔ seed SQL

J'ai écrit `supabase/tools/seed-convert.mjs` qui compte les items dans le
seed TypeScript et les lignes INSERT dans le seed SQL, par collection. Résultat :

```bash
$ node supabase/tools/seed-convert.mjs
...
Collections checked : 23
Mismatch            : 0
OK — seed TS et seed SQL sont cohérents à 23/23.
```

Le mapping des noms de variables TS (`people_agents` → `agentsItems`,
`it_experiments` → `itExperimentsItems`, `product_items` → `productItemsItems`,
etc.) est tabulé dans le script — c'est une source de vérité explicite.

### Outil de conversion

`supabase/tools/seed-convert.mjs` — il ne régénère PAS le SQL (trop fragile, il
faudrait un parser TS complet). Il vérifie la cohérence 1-1. Si un dev ajoute
un item dans le seed TS sans toucher au seed SQL, le script sort en code 1.

---

## 4. Livrable 4 — repli local explicite

**Statut : FAIT.**

### Fichier modifié

`src/lib/cms/repository.ts` (extension, pas remplacement — la rétro-compat est
préservée, le code existant continue de marcher).

### Ce qui a été ajouté

- **`SupabaseMode` type** : `'connected' | 'unconfigured' | 'unreachable' | 'no-org'`.
- **`supabaseMode()`** : retourne l'état observé.
- **`lastSupabaseError()`** : retourne la dernière erreur.
- **Log console explicite** : `console.info` au premier contact, `console.warn`
  si le mode régresse après un premier succès.
- **`tableFor(collectionId)`** : mapping collection → table typée. Le repository
  historique utilise toujours `cms_items` (chemin Phase 1), mais `tableFor()`
  est prêt pour la migration Phase 5 (chemin typé).
- **Mise à jour de `getCurrentOrgId()`** pour appeler `setMode()` aux bons
  endroits, plutôt que de swallow les erreurs en silence.

### Comportement attendu

| État | Comportement | Console |
|---|---|---|
| `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` manquants | `unconfigured` | `console.info` une fois |
| Supabase injoignable (DNS, réseau) | `unreachable` | `console.info` une fois, `console.warn` si régression |
| User authentifié, mais `memberships` vide | `no-org` | `console.info` une fois |
| User authentifié, `memberships.org_id` résolu | `connected` | silencieux (ou `info` au premier contact) |

Aucun repli silencieux : si l'app dégrade sur le seed, elle le dit.

---

## 5. Livrable 5 — EVOLUTION.md

**Statut : FAIT.**

Fichier : `supabase/EVOLUTION.md`

Quatre paliers posés en une page :
- **PoC** (déjà en place) : 1–2 projets Supabase partagés, multi-tenant par `org_id`.
- **SaaS** : 1 projet partagé, tests adversariaux automatisés, billing Stripe.
- **White Label** : 1 projet Supabase par client, branding custom.
- **Souveraineté** : infra chez le client (Render, Coolify, on-prem).

Chaque palier a : ce qui change techniquement, ce qui ne change PAS, le coût
marginal, et le critère de bascule depuis le palier précédent.

Tableau de décision rapide à la fin : "client santé → Souveraineté, PME
branding custom → White Label, etc."

Anti-patterns listés explicitement (fusionner des DB White Label pour
"économiser", couper le seed local, etc.).

---

## 6. Validation locale

**Statut : PARTIEL — Docker daemon n'a pas démarré sur cette machine.**

### Ce qui a été fait

1. **Vérificateur heuristique** : `supabase/tools/validate-migrations.mjs`.
   Couvre : parens/crochets/accolades équilibrés, présence de `language`
   après `returns`, références trigger/function inter-fichiers, création
   des 25 tables, RLS activée + policies présentes, triggers câblés.

   ```bash
   $ node supabase/tools/validate-migrations.mjs
   OK    20260811000001_collections.sql
   OK    20260811000002_memberships.sql
   OK    20260811000003_rls.sql
   OK    20260811000004_jwt_hook.sql
   OK    20260811000005_seed.sql
   OK — toutes les migrations passent les invariants heuristiques.
   ```

2. **Cohérence seed TS ↔ seed SQL** : `supabase/tools/seed-convert.mjs`.

   ```bash
   $ node supabase/tools/seed-convert.mjs
   ...
   Collections checked : 23
   Mismatch            : 0
   OK — seed TS et seed SQL sont cohérents à 23/23.
   ```

### Ce qui n'a PAS été fait (et pourquoi)

3. **`supabase start`** : bloqué. Docker Desktop est installé et a été lancé
   (`Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'`),
   mais après 100+ secondes le daemon n'est pas monté
   (`npipe:////./pipe/dockerDesktopLinuxEngine` n'existe pas). Cause probable :
   WSL2 ou Hyper-V non configuré sur cette machine. Le brief autorise
   explicitement cette situation :

   > "si Docker n'est pas disponible sur cette machine, dis-le et livre
   > le SQL avec sa procédure de vérification. Ne simule pas un succes."

4. **`supabase db lint`** : non exécuté (dépend de Docker). Les invariants
   qu'il aurait vérifiés sont couverts par `validate-migrations.mjs` (équivalent
   partiel, sans exécution SQL réelle).

5. **Test d'isolation adverse (org A vs org B)** : non exécuté. La procédure
   exacte est rédigée dans `supabase/VERIFICATION_RLS.md` §3, prête à être
   jouée sur un projet Supabase actif.

### Procédure pour valider sur une machine avec Docker

```bash
# 1. Supabase local
cd supabase
supabase start
supabase db reset     # applique les 5 migrations + le seed

# 2. Sanity check
supabase db lint

# 3. Test adverse (côté SQL editor du Dashboard)
#    cf. supabase/VERIFICATION_RLS.md §3
```

---

## 7. Récapitulatif des fichiers produits

```
supabase/
  README.md                          (ce rapport)
  VERIFICATION_RLS.md                (procédure de vérif + test adverse)
  EVOLUTION.md                       (4 paliers PoC → Souveraineté)
  migrations/
    20260811000001_collections.sql   (23 tables + cms_items/cms_collections)
    20260811000002_memberships.sql   (organizations + profiles + memberships)
    20260811000003_rls.sql           (RLS sur 25 tables, 4 policies chacune)
    20260811000004_jwt_hook.sql      (custom_access_token_hook SQL)
    20260811000005_seed.sql          (compte démo + 23 collections de seed)
  tools/
    seed-convert.mjs                 (vérif cohérence seed TS ↔ seed SQL)
    validate-migrations.mjs          (validateur heuristique sans Docker)

src/lib/cms/repository.ts            (étendu : SupabaseMode, log explicite,
                                       tableFor() mapping pour Phase 5)
```

## 8. Ce qui n'a pas été fait — et pourquoi

- **Aucune migration appliquée** à un projet distant (INTERN, CUSTOMERS,
  coach-os). Conformément au brief.
- **Aucun test d'isolation adverse exécuté**. La procédure est rédigée,
  l'exécution dépend de Docker (indispo) puis d'un projet Supabase actif
  (geste de l'utilisateur).
- **Aucun `supabase init` lancé**. Le dossier `supabase/` n'a pas de
  `config.toml` — c'est volontaire, le projet lié (`coach-os` en pause)
  ne doit pas être reconfiguré en local par accident. Si on veut un
  environnement local propre, c'est un geste de l'utilisateur
  (`supabase unlink && supabase init && supabase start`).
- **L'extension du repository n'a PAS basculé le chemin de lecture sur
  les tables typées** (23 tables). Le repository continue d'utiliser
  `cms_items` (rétro-compat Phase 1). Le mapping `tableFor()` est prêt ;
  la bascule est une Phase 5 séparée, qui touchera les 19 apps — hors
  périmètre du brief B.

## 9. Honnêteté sur l'état

- 5/5 livrables sont **écrits**.
- 2/5 sont **validés en local** par les deux scripts (validator +
  seed-coverage). Le validator est heuristique, pas une vraie exécution
  SQL — il couvre les invariants qu'on peut détecter sans Postgres, et
  c'est un pis-aller.
- 1/5 (le test adverse) est **rédigé, pas exécuté**.
- 0 migration appliquée à un projet distant (volontaire).
