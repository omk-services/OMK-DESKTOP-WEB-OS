# VERIFICATION_RLS.md — Procédure de vérification RLS + JWT claim

> **Lire en PREMIER** : sans hook JWT provisionné, toutes les requêtes
> authentifiées renvoient **zéro ligne en silence**, sans erreur.
> C'est le bug déjà payé sur ce projet (cf. SOCLE.md). Cette procédure
> existe pour qu'il ne se reproduise plus.

---

## 1. Pré-requis : hook JWT activé dans le Dashboard

La migration `20260811000004_jwt_hook.sql` **définit** la fonction SQL.
Elle ne l'**active pas** dans Supabase. L'activation est une étape manuelle
du Dashboard, parce que Supabase ne permet pas de configurer les hooks
depuis SQL.

Procédure (5 minutes UI) :

1. **Dashboard Supabase** → ton projet (`omk-saas-os`, `omk-internal`,
   ou le local) → **Authentication** → **Hooks**
2. Section **Custom Access Token** → **Enable**
3. **Function** : `public.custom_access_token_hook`
4. **Save**

Alternative self-host : même écran, même procédure, après avoir activé
la fonction dans `pg_dump`/`psql` via la migration.

---

## 2. Vérifier que le claim `org_id` arrive dans le JWT

### 2.1 Test rapide : `get_my_claims()`

Crée cette fonction de debug dans le SQL editor du Dashboard (à retirer
en prod, mais indispensable pour le test) :

```sql
create or replace function public.get_my_claims() returns jsonb
language sql stable as $$
  select auth.jwt()
$$;

grant execute on function public.get_my_claims to authenticated;
```

Côté client, depuis la console JS :

```javascript
const { data, error } = await supabase.rpc('get_my_claims');
console.log('JWT claims:', data);
// ATTENDU : { sub: '<user_id>', org_id: '<uuid>', ... }
// REJETÉ  : pas de org_id → policies RLS renverront 0 ligne en silence
```

**Si `org_id` est absent** :

- Le hook n'est pas activé → retour §1.
- Le hook est activé mais `memberships` est vide → créer une membership
  via la procédure de sign-up.
- L'user a plusieurs orgs et le `order by created_at asc` ne ramène pas
  celle attendue → vérifier côté DB.

### 2.2 Test de la présence effective d'une ligne

```sql
-- En SQL editor, avec le user authentifié (cookie de session actif) :
select count(*) from public.cms_clients;
-- ATTENDU : nombre > 0 (la seed du compte démo en a 6)
-- REJETÉ  : 0 → soit la policy refuse, soit le claim manque
```

Si 0 lignes, **ne jamais conclure "il n'y a pas de données"**. Conclure
"le claim `org_id` n'arrive pas" et traiter §1.

---

## 3. Test d'isolation adverse — DEUX orgs, UN user A ne lit pas l'org B

C'est le test bloquant. Il doit être **rédigé** (pas juste décrit),
**rejouable**, et **échouer quand il doit échouer**.

### 3.1 Setup (à faire une fois)

```sql
-- Crée deux orgs.
insert into public.organizations (id, slug, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'org-a-test', 'Org A test'),
  ('22222222-2222-2222-2222-222222222222', 'org-b-test', 'Org B test');

-- Crée deux users (via supabase.auth.admin.create_user ou le Dashboard).
-- Note les UUIDs retournés.

-- Lie chaque user à son org.
insert into public.memberships (user_id, org_id, role) values
  ('<user_a_uuid>', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('<user_b_uuid>', '22222222-2222-2222-2222-222222222222', 'owner');

-- Crée une ligne dans chaque org.
insert into public.cms_clients (org_id, slug, name) values
  ('11111111-1111-1111-1111-111111111111', 'a-only', 'Visible only by Org A'),
  ('22222222-2222-2222-2222-222222222222', 'b-only', 'Visible only by Org B');
```

### 3.2 Test 1 : SELECT croisé

```sql
-- Côté user A (cookie session de A actif dans le SQL editor) :
select count(*) from public.cms_clients where org_id = '11111111-1111-1111-1111-111111111111';
-- ATTENDU : 1 (la ligne de A)

select count(*) from public.cms_clients where org_id = '22222222-2222-2222-2222-222222222222';
-- ATTENDU : 0 (la ligne de B ne doit PAS être visible)
```

Si la deuxième renvoie 1, **la policy est cassée** : le claim n'est pas
injecté, ou la policy n'est pas active. Stopper le déploiement, ne pas
masquer le résultat.

### 3.3 Test 2 : écriture croisée

```sql
-- Toujours côté user A :
insert into public.cms_clients (org_id, slug, name)
  values ('22222222-2222-2222-2222-222222222222', 'hacked', 'Tentative');
-- ATTENDU : PostgresError new row violates row-level security policy
-- REJETÉ  : insert réussi = RLS inactive, exposer la faille
```

### 3.4 Test 3 : UPDATE croisé

```sql
-- user A essaie de modifier une ligne de B :
update public.cms_clients
  set name = 'pirated'
  where org_id = '22222222-2222-2222-2222-222222222222';
-- ATTENDU : 0 rows affected (la policy USING filtre l'accès)
-- REJETÉ  : 1 row updated = la policy USING ne fonctionne pas
```

### 3.5 Nettoyage

```sql
delete from public.cms_clients where slug in ('a-only', 'b-only', 'hacked');
delete from public.memberships where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
delete from public.organizations where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
```

---

## 4. Sanity check : `supabase db lint`

```bash
supabase db lint
```

Si l'avertissement `unused_index` ou `multiple_permissive_policies`
apparaît, c'est cosmétique. Si `auth_leaked_password_protection` ou
`rls_disabled_in_public` apparaît sur **une** des 23 tables CMS, **STOP** —
le build ne doit pas partir.

```bash
supabase test db   # si tu as écrit des tests pgTAP (optionnel)
```

---

## 5. Diagnostic en cas d'urgence

Si l'app tombe à 0 ligne sans qu'on sache pourquoi :

| Symptôme | Cause probable | Action |
|---|---|---|
| `org_id` absent du JWT | hook non activé | §1 |
| `org_id` dans le JWT mais `memberships` vide | sign-up n'a pas créé la ligne | vérifier `sign-up-organization` edge function |
| `org_id` dans le JWT, `memberships` OK, mais 0 ligne | RLS désactivée | vérifier `pg_policies` |
| `org_id` dans le JWT, RLS OK, mais 0 ligne | l'user a plusieurs orgs, le hook prend la mauvaise | ajouter `current_org_id()` côté client |
| Console : `permission denied for table cms_clients` | l'user n'est pas `authenticated` | vérifier `auth.uid()` côté SQL |

Ne jamais désactiver la policy "pour tester". Ne jamais modifier le
hook "pour voir". Toujours passer par ce diagnostic, dans l'ordre.

---

## 6. Ce qui se passe en mode dégradé (repli local)

Si `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` manque, le client
n'est pas créé (`supabaseConfigured === false`). L'app tombe sur le
seed TypeScript. C'est le mode **PoC vidéo**.

Si Supabase est configuré mais injoignable (DNS down, panne réseau),
les requêtes timeout et `repository.ts` logue un `console.warn`
explicite avant de retomber sur le seed. **C'est volontaire** : voir
`src/lib/cms/repository.ts` §`supabaseMode()`.

---

## 7. Récursion RLS — le piège spécifique aux policies d'auth boundary

**Apparu en prod le 2026-08-11**, corrigé par la migration
`20260811000006_rls_recursion.sql`. **Toute régression ici doit
être traitée en priorité** — la couche RLS entière tombe sur
HTTP 500 + code `42P17` à la première requête.

### 7.1 Le défaut observé

```
GET https://sgzbkhqqkqdwhakkyzzm.supabase.co/rest/v1/organizations?select=id&limit=3
→ HTTP 500
{"code":"42P17","message":"infinite recursion detected in policy for relation \"memberships\""}
```

PostgreSQL détecte la boucle et refuse **toute** requête vers
n'importe quelle table, pas seulement `memberships`. L'app entière
tombe.

### 7.2 Pourquoi la migration passe sans rien signaler

Les cinq migrations s'appliquent avec un succès vert. **PL/pgSQL ne
valide le corps d'une fonction qu'à l'exécution, pas à la création.**
Le défaut n'apparait qu'à la première vraie requête REST. C'est
pourquoi le filet de sécurité (étape 4 de la migration 000006) vérifie
toute policy auto-référente au moment de la migration elle-même.

### 7.3 Le test qui tranche

```bash
curl -s "https://<project-ref>.supabase.co/rest/v1/organizations?select=id&limit=3" \
  -H "apikey: <anon-key>"
```

| Réponse | Verdict |
|---|---|
| HTTP 500, code `42P17` | Récursion. STOP — appliquer 000006, re-tester. |
| HTTP 200, `[]` | Récursion absente. La policy refuse l'accès anon (correct), pas de récursion. |
| HTTP 200, `[{"id": "..."}]` | Fuite : anon lit une organisation. Ne devrait pas arriver avec les policies en place. STOP — vérifier la policy. |
| HTTP 401, "Invalid API key" | Mauvaise clé anon. Vérifier `SUPABASE_<ORG>_ANON_KEY`. |

### 7.4 Règle d'or pour les futures policies

> **Une policy sur la table X ne doit JAMAIS lire X.**

Que ce soit directement (`SELECT ... FROM X`) ou indirectement
(`FROM Y` où Y a une policy qui lit X). Toute policy qui enfreint
cette règle déclenche `42P17`. Le filet de la migration 000006
couvre les récursions **directes** — les récursions indirectes
demeurent un piège humain.

Checklist avant de merger une nouvelle policy :

1. La policy interroge-t-elle une autre table ? Si oui, cette autre
   table a-t-elle une policy qui s'auto-référence ? (recherche par
   `pg_policies` + `qual::text ilike '%from <table>%'`)
2. La fonction appelée est-elle `SECURITY DEFINER` ? Si oui, c'est
   un chemin privilégié : documenter la raison dans un commentaire.
3. Le test curl §7.3 passe-t-il ?

### 7.5 Ce qui a été corrigé par la migration 000006

| Table | Policy | Avant (récursif) | Après |
|---|---|---|---|
| `memberships` | `memberships_same_org_read` | `org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid())` | `user_id = auth.uid()` |
| `organizations` | `organizations_member_read` | `id = (SELECT org_id FROM memberships WHERE user_id = auth.uid())` | `id = jwt_org_id()` |

Conséquence : un utilisateur authentifié voit **ses propres**
appartenances (`memberships`), pas celles des autres membres de
son organisation. C'est la posture la plus sûre. Le claim `org_id`
du JWT porte l'isolation sur les 23 tables CMS ; pour lister les
membres d'une org, il faudra une fonction `SECURITY DEFINER` dédiée
ou une route serveur (hors scope de la campagne 2026-08-11).

---

## 8. Visiteur anonyme et démonstration vidéo

**Décidé 2026-08-11** : le chemin démonstration ne parle jamais
à Supabase. L'option « Découvrir sans compte » dans la page d'auth
pose `boot.mode === 'demo'` en localStorage et `App.tsx` rend
directement `<Desktop />` sans toucher Supabase. Le bureau est
peuplé par le seed TypeScript (`src/lib/cms/seed.ts`), identique
ligne pour ligne au seed SQL côté base.

**Pourquoi pas d'organisation de démo ouverte à `anon`** :

- 100 policies sur 105 visent le rôle `authenticated`, aucune ne
  vise `anon` — c'est la posture de sécurité correcte.
- Ouvrir une organisation fictive à `anon` exposerait ces mêmes
  données en lecture publique. Même fictives, elles servent de
  matrice pour des tests adversariaux.
- Le seed local suffit à la démo vidéo. Si Supabase tombe, la
  démo continue de tourner.
- Aucune donnée de production n'est exposée : le seed TypeScript
  est une vue de l'esprit, pas une copie de la base.

**Trace** : voir `src/apps/auth/AuthPage.tsx` (tuile « Decouvrir
sans compte ») et `src/App.tsx` (`boot.mode === 'demo'`).

---

## 9. Page de retour OAuth `/auth/callback`

**Crée 2026-08-11** par `src/apps/auth/OAuthCallback.tsx`,
branchée dans `src/App.tsx` via la détection
`window.location.pathname.startsWith('/auth/callback')`.

Comportement :

| État | Rendu |
|---|---|
| Attente (`waiting`) | Spinner + titre "Connexion en cours…" |
| Succès (`success`) | Spinner vert + titre "Connecté. Ouverture du bureau…" + redirect vers `/` en 600 ms |
| Échec (`error`) | Carte d'erreur explicite + bouton "Revenir à l'écran de connexion" |

Trois sources d'erreur couvertes :

1. **Pas de hash dans l'URL** — l'utilisateur a tapé `/auth/callback`
   à la main ou a été redirigé sans token.
2. **`supabaseConfigured === false`** — les variables d'env
   manquent, l'OAuth n'a aucune chance de marcher.
3. **Timeout 5 s** — la session n'est pas matérialisée à temps.
   Évite un spinner éternel.

Le `getSession()` est appelé explicitement : `@supabase/supabase-js`
avec `detectSessionInUrl: true` (par défaut) traite le hash
`#access_token=...` au premier accès à la session.
