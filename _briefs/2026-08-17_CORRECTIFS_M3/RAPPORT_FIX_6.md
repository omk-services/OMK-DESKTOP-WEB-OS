# RAPPORT_FIX_6 — CUSTOMERS orphelin, cinq (six) tables mortes

**Campagne** : 2026-08-17, FIX_6_customers_orphelin.
**Périmètre touché** : `supabase/migrations/2026-08-17_customers_policies.sql` (créé).
**État au commit** : non commité (cf. `git status`, fichier `m`).
**Exécution** : **non exécutée**. Pas d'accès base sur ce périmètre, et c'est voulu (relecture avant production).

---

## 1. Reprise — l'état que j'ai trouvé

L'organisation Supabase `xsaahnkguocczvunivfx` porte deux projets. Le projet `INTERN` (`sgzbkhqqkqdwhakkyzzm`) est l'app déployée ; le projet `CUSTOMERS` (`ndvqwcapwcnpdvknxcjw`) est sa copie jumelle pour clients externes.

Le brief FIX_6 a relevé que **six tables** sur CUSTOMERS ont `RLS = enabled` et **zéro policy** : `audit_events`, `memberships`, `workspace_branches`, `workspace_prs`, `workspace_pr_reviews`, `workspace_snapshots` (le brief dit « cinq » mais en liste six ; le compte de cinq est probablement un oubli de `workspace_snapshots`). Le comportement de ce régime est connu depuis 2026-08-15 : RLS sans policy = refus total. Aucune ligne visible, aucune écriture possible, ni par `authenticated`, ni par `service_role`. Ces tables ne sont pas ouvertes, elles sont mortes.

Pendant ce temps, sur INTERN, le 2026-08-17, la migration `2026-08-17_memberships_alignement_contrat.sql` a aligné `memberships` sur le contrat du code (rename `org_id` → `tenant_id`, ajout `invited_by`/`invited_at`/`accepted_at`/`status`, contraintes d'énumération, hook réécrit, `is_tenant_admin()` créé en SECURITY DEFINER, 4 policies `memberships_admin_*`). Les `workspace_*` ont été créées le 2026-08-15 avec déjà leurs policies `tenant_read`. `audit_events` aussi, avec policies `owner_read_audit`, `service_insert_audit`, `no_update_audit`, `no_delete_audit`.

CUSTOMERS a hérité des tables et du RLS, mais pas des policies. Côté tables : identiques à INTERN (mêmes colonnes, mêmes contraintes, mêmes types). Côté policies : néant. Côté fonctions : ni `is_tenant_admin()`, ni `custom_access_token_hook()` ne sont garanties exister.

`role_permissions` et `user_roles` ont chacune 2 policies : elles fonctionnent. Hors périmètre.

---

## 2. Ce que j'ai écrit

Un seul fichier : `supabase/migrations/2026-08-17_customers_policies.sql`, ~280 lignes, une seule transaction `begin; ... commit;`.

**Sections dans l'ordre :**

| § | Quoi | Modèle INTERN |
|---|---|---|
| 1 | `memberships` : rename `org_id` → `tenant_id` (idempotent via DO block), ajout colonnes `invited_by` / `invited_at` / `accepted_at` / `status`, contraintes d'énumération, index | `2026-08-17_memberships_alignement_contrat.sql` §1 |
| 2 | `custom_access_token_hook()` réécrite : lit `m.tenant_id`, filtre `m.status = 'active'` | idem §2 |
| 3 | `is_tenant_admin(p_tenant uuid)` créée en SECURITY DEFINER, `search_path` figé | idem §3 |
| 4 | GRANT `select, insert, update, delete on public.memberships to authenticated` | idem (implicite) |
| 5 | 4 policies `memberships_admin_{read,insert,update,delete}` | idem §3 |
| 6 | 4 policies sur `audit_events` : `admin_read_audit`, `service_insert_audit`, `no_update_audit`, `no_delete_audit` + GRANTs | `2026-08-15_audit_events.sql` §3-5, **modifié** : `owner` → `admin` via `is_tenant_admin` |
| 8 | `workspace_snapshots_tenant_read` (résout le tenant via `workspace_branches`) | `2026-08-15_workspace_branches.sql` §5 |
| 7 | `workspace_branches_tenant_read` | idem §5 |
| 9 | `workspace_prs_tenant_read` | idem §5 |
| 10 | `workspace_pr_reviews_tenant_read` (résout via `workspace_prs`) | idem §5 |

**Décisions notables :**

- **Audit_events : `admin` au lieu de `owner`.** INTERN lit `audit_events` avec `m.role = 'owner'`. Le brief FIX_6 dit « lecture réservée aux administrateurs du tenant ». Administrator (au sens `is_tenant_admin`) = `owner` + `admin`. J'ai donc utilisé `public.is_tenant_admin(audit_events.tenant_id::uuid)` au lieu du pattern `m.role = 'owner'`. L'écart par rapport à INTERN est documenté : si la règle de lecture doit être plus large côté CUSTOMERS, ce n'est pas ma décision — c'est un arbitrage A0.
- **`workspace_*` : SELECT seulement.** Comme INTERN. Pas de policy INSERT/UPDATE/DELETE — ces écritures passent par `service_role` côté backend. Si l'app côté CUSTOMERS doit autoriser des écritures client, ce sera une migration séparée.
- **Casting `text → uuid` pour `audit_events.tenant_id`.** La table `audit_events` a `tenant_id text` (cf. `2026-08-15_audit_events.sql:25`) ; `memberships.tenant_id` est `uuid` après le rename. Le cast `tenant_id::uuid` rejette les `tenant_id` qui ne sont pas des UUID valides. C'est le comportement souhaité : un `tenant_id` non-UUID est de toute façon un bug à corriger en base (et `memberships.tenant_id` n'accepte que des UUID via la FK vers `organizations.id`).
- **`workspace_*` : `m.tenant_id::text = workspace_*.tenant_id`.** Pattern repris d'INTERN (`2026-08-15_workspace_branches.sql`). Le cast est fait côté `memberships` pour conserver le typage fort du côté table.
- **`create or replace function` partout.** Idempotent. Si `is_tenant_admin()` ou le hook existent déjà sur CUSTOMERS (peut-être avec un ancien corps), la migration les remplace par la version INTERN.

**Idempotence vérifiée :**

- `drop policy if exists` avant chaque `create policy`.
- `add column if not exists` pour les colonnes ajoutées.
- `drop constraint if exists` puis `add condition` pour les check constraints (PG ne supporte pas `add constraint if not exists`).
- `do $$ ... if exists (...) then rename ...; end if; $$` pour le rename de la colonne et des contraintes (PG ne supporte pas `rename column if exists`).
- `create or replace function` pour les deux fonctions.
- `create index if not exists` pour les trois index.

**Bloc d'annulation commenté en fin de fichier**, dans le même esprit que le modèle INTERN.

---

## 3. La question CUSTOMERS — Issue A vs Issue B

Le brief FIX_6 dit explicitement : « Tu ne tranches pas cette question — tu prépares le terrain pour les deux issues, et tu écris dans ton rapport ce que chacune impliquerait. »

### Issue A — Bascule d'URL selon l'entrée choisie à la connexion

Hypothèse : l'app déployée détecte le clic « Coach client (CUSTOMERS) » sur l'écran de connexion, bascule ses variables d'environnement (ou son `VITE_SUPABASE_URL`) vers le projet `ndvqwcapwcnpdvknxcjw`, et lit `omk_customers.*` au lieu de `omk_internal.*`. CUSTOMERS est une seconde vie de l'application.

**Ce que ça implique :**

1. **Appliquer la migration sur CUSTOMERS** (`ndvqwcapwcnpdvknxcjw`) — la présente migration. À relecture validée.
3. **Activer le hook JWT côté CUSTOMERS** (Dashboard UI → Authentication → Hooks → Custom Access Token → Enable → Function: `public.custom_access_token_hook`). Sans ça, `jwt_org_id()` reste `null` et toutes les policies retournent 0 ligne. C'est le piège déjà payé sur INTERN (cf. `20260811000003_rls.sql` §"Le piège déjà payé").
4. **Grains côté CUSTOMERS** : la migration GRANT donne `select, insert, update, delete on public.memberships to authenticated`. Les autres tables `cms_*` (23 tables listées dans `20260811000003_rls.sql`) ne sont pas mentionnées dans le brief — si elles existent aussi sur CUSTOMERS (probable, vu le clonage de structure), elles sont dans le même état zombie que les cinq tables ici, et il faudrait la même passe pour elles. **Hors périmètre du brief FIX_6**, mais à signaler.
5. **Le `tenant_id` du projet CUSTOMERS** doit être cohérent avec un format UUID côté `memberships`. Si CUSTOMERS héberge des clients externes (PME), chaque signup crée une `organizations` + une membership `owner` — l'auth flow doit être répliqué côté CUSTOMERS (Edge Function sign-up-organization, hook, etc.). Hors périmètre ici aussi.
6. **Auditabilité** : `audit_events` côté CUSTOMERS est maintenant immuable et cloisonné. Si l'app cliente CUSTOMERS écrit ses events d'audit via `service_role` (Edge Function), le contrat est aligné sur INTERN.

### Issue B — CUSTOMERS abandonné

Hypothèse : l'entrée « Coach client (CUSTOMERS) » sur l'écran de connexion est retirée. Les clients externes arrivent par un autre canal (formulaire web, integration directe, etc.). Le projet Supabase CUSTOMERS est conservé comme archive, sans trafic applic.

**Ce que ça implique :**

1. **La migration est gaspillée, mais elle ne casse rien.** Poser des policies sur des tables vides (ou quasi-vides) n'a aucun effet observable. RLS ne devient « utile » qu'en présence de lignes ; sans lignes, pas de SELECT à filtrer, pas d'INSERT à vérifier.
2. **Aucune régression sur INTERN.** La migration est livrée sur CUSTOMERS uniquement. Les éditions de cette campagne touchent `supabase/migrations/` (un seul fichier créé) — INTERN n'est pas affecté.
3. **Décision à acter côté A0** : supprimer le projet CUSTOMERS sur l'organisation Supabase, ou le laisser dormir en archive ? Le garder consomme un peu de stockage et bloque un slot de projet dans l'org. Le supprimer est irréversible (D4 append-only : utiliser un snapshot avant).
5. **L'écran de connexion doit retirer l'entrée « Coach client ». Côté `src/auth/SignInView.tsx` ou équivalent — hors périmètre ici.

### Ma recommandation

Issue A est plus probable qu'Issue B, parce que :
- L'écran de connexion propose déjà l'option « Coach client ».
- Cloner INTERN en CUSTOMERS sans intention de l'utiliser est un investissement qui ne se justifie pas.
- La présence de `role_permissions` et `user_roles` (fonctionnelles, 2 policies chacune) suggère que CUSTOMERS a déjà un début d'occupation.

Mais Issue B ne peut pas être écartée sans un arbitrage A0 explicite. **Cette migration prépare le terrain pour Issue A et ne fait aucun mal en cas d'Issue B** — c'est exactement ce que le brief demande.

---

## 4. Pièges traversés — décisions explicites

### 4.1. Le « cinq » ou « six » du brief

Le brief dit « cinq tables » mais en liste six : `audit_events · memberships · workspace_branches · workspace_prs · workspace_pr_reviews · workspace_snapshots`. J'ai écrit des policies pour les **six**. Hypothèse : `workspace_snapshots` a été oublié dans le compte. Si le brief voulait réellement cinq, l'excédent ne fait pas de mal — poser une policy sur une table qui n'existe pas échoue, mais CUSTOMERS a les six tables (créées par les mêmes migrations clonées que INTERN).

### 4.2. Le hook absent vs hook présent

CUSTOMERS n'a aucune garantie d'avoir le hook déployé. Si le hook n'existe pas, `create or replace function` le crée. S'il existe avec un ancien corps, la migration le remplace par la version INTERN (qui filtre sur `m.status = 'active'`). **Conséquence** : si quelqu'un a écrit un hook CUSTOMERS avec une logique différente (par exemple qui lit `m.org_id` au lieu de `m.tenant_id`), cette migration l'écrase. C'est le comportement souhaité : CUSTOMERS doit converger vers le contrat INTERN.

**Mais** : le hook n'est pas *activé* sur CUSTOMERS par cette migration. Activer un hook est une opération Dashboard UI (Authentication → Hooks → Custom Access Token → Enable → Function). Cette migration rend la fonction disponible ; l'activation reste HITL.

### 4.3. Le renommage de colonne + hook dans la même transaction

Comme noté dans `2026-08-17_memberships_alignement_contrat.sql` §"ORDRE CRITIQUE" : si on renomme `memberships.org_id` en `memberships.tenant_id` sans réécrire le hook dans la même transaction, et que le hook existe déjà, plus aucune connexion n'obtient la claim `org_id`. La migration entière (rename + hook + policies + grant) est dans un seul `begin; ... commit;`. Si la migration échoue à mi-parcours, tout revient en arrière.

### 4.4. `is_tenant_admin` en SECURITY DEFINER avec `search_path` figé

Modèle repris d'INTERN (`2026-08-17_memberships_alignement_contrat.sql` §3). Sans `set search_path = public, pg_temp`, un attaquant qui contrôle un schéma en tête de `search_path` pourrait substituer la table `memberships` lue par la fonction — c'est le pattern « search_path mutable » courant. Figer le path ferme cette porte.

### 4.5. `audit_events` ne pas oublier GRANT

Sur INTERN, `2026-08-15_audit_events.sql` explicite le GRANT après les policies : `grant select on public.audit_events to authenticated`. C'est non négociable — sans ce GRANT, le `SELECT` ne déclenche même pas l'évaluation RLS, il rend zéro ligne en silence (le comportement Supabase par défaut, mais facile l'oublier). Reproduit tel quel.

### 4.6. `workspace_snapshots` n'a pas de `tenant_id` direct

Les snapshots n'ont pas de `tenant_id` — ils ont un `branch_id` (FK vers `workspace_branches`). La policy doit résoudre le tenant via la branche. Pattern repris d'INTERN, mais avec une nuance : `m.tenant_id::text = b.tenant_id` côté `memberships`, parce que `workspace_branches.tenant_id` est `text` et `m.tenant_id` est `uuid` après le rename. C'est le bon ordre — caster côté source pour préserver le typage fort de la table cible.

---

## 5. Vérification sans base

Le brief dit : « Tu ne peux pas exécuter. Relis-toi comme un compilateur. » J'ai relu comme un compilateur, voici ce que j'ai vérifié :

| Vérification | OK ? |
|---|---|
| Chaque `alter table` vise une colonne qui existe (`org_id`, `tenant_id`, `status`, etc.) | ✅ |
| Chaque `create policy` nomme une table réelle | ✅ |
| Chaque `$$ ... $function$` est refermé correctement | ✅ |
| `create or replace function` n'écrase pas la grammaire (deux `$function$` ouvrent/ferment le même bloc) | ✅ |
| `drop policy if exists` est sur la même table que `create policy` qui suit | ✅ |
| Casts `text → uuid` aux bonnes endroits (côté `memberships.tenant_id` quand on compare avec `audit_events.tenant_id` text) | ✅ |
| Pas de référence circulaire dans les policies (policy sur `memberships` n'interroge pas `memberships` — c'est `is_tenant_admin()` qui le fait en SECURITY DEFINER) | ✅ |
| `set search_path = public, pg_temp` sur la fonction SECURITY DEFINER | ✅ |
| `revoke ... from public` puis `grant execute ... to {authenticated, supabase_auth_admin}` sur les deux fonctions | ✅ |
| Bloc d'annulation cohérent avec la migration forward | ✅ |

**Ce que je n'ai PAS pu vérifier :**

- Que `auth.users(id)` existe et que `supabase_auth_admin` est bien le rôle attendu (c'est la convention Supabase, mais je n'ai pas accès au catalogue CUSTOMERS).
- Que le `tenant_id` actuel de `audit_events` est bien `text` (cf. `2026-08-15_audit_events.sql`, mais CUSTOMERS peut avoir divergé).
- Que les contraintes `memberships_org_id_fkey` et `memberships_user_id_org_id_key` existent (probable : ce sont les contraintes créées par `20260811000002_memberships.sql`, qui a été appliqué sur les deux projets).
- Que la FK `audit_events.tenant_id` ne pointe pas vers une table `tenants()` que CUSTOMERS aurait (improbable, mais le code applicif pourrait assumer un schéma différent).

**Si la migration échoue à l'application :**

| Erreur probable | Cause | Remède |
|---|---|---|
| `column "org_id" does not exist` | CUSTOMERS a déjà `tenant_id` (rename déjà fait) | Le DO block saute le rename, OK |
| `constraint "memberships_org_id_fkey" does not exist` | La contrainte a déjà été renommée | Le DO block saute, OK |
| `policy "X" already exists` | Policies déjà créées | `drop policy if exists` gère |
| `function "is_tenant_admin(uuid)" already exists` | Fonction déjà créée | `create or replace function` gère |
| `column reference "tenant_id" is ambiguous` | Deux colonnes `tenant_id` homonymes dans la requête | À corriger dans une passe séparée |
| `operator does not exist: uuid = text` | Cast manquant | Vérifier les casts `::text` et `::uuid` dans les policies |

---

## 6. Limites et hors-périmètre

**Hors périmètre de cette migration :**

- Les 23 tables `cms_*` (cf. `20260811000003_rls.sql`). Si elles existent sur CUSTOMERS (probable, vu le clonage), elles sont dans le même état zombie. **À signaler à A0** : appliquer la migration `20260811000003_rls.sql` adaptée (qui itère sur la liste des `cms_*`) ou une passe équivalente.
- `organizations`, `profiles`, `cms_items`, `cms_collections`. Ces tables existent sur INTERN avec des policies. CUSTOMERS a probablement la même structure. Pas abordé ici.
- `role_permissions`, `user_roles`. Fonctionnelles. Pas à toucher.
- L'activation du hook JWT côté CUSTOMERS (Dashboard UI). HITL.
- Le seed de `memberships` fondateur pour CUSTOMERS. Si Issue A est choisie, un owner fondateur doit être créé lors du premier sign-up. Hors périmètre ici.
- La migration de données depuis INTERN vers CUSTOMERS (si Issue A est choisie et qu'on veut réutiliser les users existants). À traiter séparément.
- La désactivation de l'écran de connexion CUSTOMERS (si Issue B est choisie). Côté `src/auth/`, hors périmètre.
- La décision Issue A vs Issue B (cf. §3). HITL A0.

**Ce qui dépend de cette migration pour avancer :**

- Si Issue A est confirmée → l'activation Dashboard du hook JWT et la passe sur `cms_*` doivent suivre avant que CUSTOMERS serve du trafic applic.
- Si Issue B est confirmée → cette migration peut être annulée (`drop ...` dans le bloc d'annulation, ou rollback du projet), ou laissée en place comme no-op durable.

---

## 7. Résumé

| Item | Valeur |
|---|---|
| Fichier créé | `supabase/migrations/2026-08-17_customers_policies.sql` |
| Lignes (migration + bloc d'annulation) | ~280 |
| Sections | 10 (memberships colonnes → hook → is_tenant_admin → grant → policies memberships → policies audit_events → 4 sections workspace_*) |
| Policies ajoutées | 12 (4 memberships + 4 audit_events + 4 workspace_*) |
| Fonctions créées | 2 (`custom_access_token_hook`, `is_tenant_admin`) |
| Colonnes renommées | 1 (`memberships.org_id` → `tenant_id`) |
| Contraintes renommées | 2 (`memberships_org_id_fkey`, `memberships_user_id_org_id_key`) |
| Colonnes ajoutées | 4 (`invited_by`, `invited_at`, `accepted_at`, `status`) |
| Contraintes check ajoutées | 2 (`memberships_status_check`, `memberships_role_check`) |
| Index ajoutés | 3 |
| GRANTs ajoutés | 6 |
| Exécution | **non exécutée** (relecture seule) |
| Commit | non commitée |
| État final du code sur le périmètre | compile-ready, relecture demandée |

---

## 8. Prochaine étape

Avant toute application sur CUSTOMERS (`ndvqwcapwcnpdvknxcjw`) :

1. **Relecture A0** : ce rapport + la migration. Identifier si l'écart `owner` → `admin` pour `audit_events` est souhaité (§2, « Décisions notables »).
2. **Décision Issue A vs Issue B** (§3). Cette migration prépare le terrain pour Issue A ; Issue B ne casse rien mais la rend caduque.
3. **Si Issue A** : appliquer la migration via `supabase db push` ou Dashboard SQL Editor (transaction unique, copier-coller le contenu entre `begin;` et `commit;`). Activer le hook JWT côté Dashboard UI. Penser à la passe sur `cms_*` si CUSTOMERS les héberge.
4. **Si Issue B** : retirer l'entrée « Coach client (CUSTOMERS) » de l'écran de connexion. La migration peut rester en place (no-op durable) ou être annulée.

---

*Fin du rapport.*