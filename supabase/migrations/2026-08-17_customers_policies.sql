-- =====================================================================
-- 2026-08-17_customers_policies.sql
-- Remettre le projet CUSTOMERS au meme niveau que INTERN.
--
-- POURQUOI CE FICHIER EXISTE
-- ---------------------------
-- L'organisation Supabase `xsaahnkguocczvunivfx` heberge deux projets :
--
--   *  OMK SERVICES INTERN   (`sgzbkhqqkqdwhakkyzzm`) — l'app deployee
--      interroge celui-ci. C'est la copie sur laquelle 2026-08-15 et
--      2026-08-17 ont aligne `memberships`, cree `audit_events`,
--      `workspace_*` et toutes leurs policies.
--
--   *  OMK SERVICES CUSTOMERS (`ndvqwcapwcnpdvknxcjw`) — copie jumelle
--      cote clients finaux (PME qui signent un coach via l'IHM
--      publique). Le brief FIX_6 a releve l'etat suivant :
--        - `audit_events`, `memberships`, `workspace_branches`,
--          `workspace_prs`, `workspace_pr_reviews`, `workspace_snapshots`
--          ont toutes RLS active et ZERO policy. RLS active sans
--          policy = refus total. Ces tables ne sont pas ouvertes,
--          elles sont mortes. Aucun utilisateur — owner, admin,
--          member, guest, ni service_role contourne RLS par defaut —
--          ne peut y lire ni y ecrire.
--        - `role_permissions` et `user_roles` ont chacune 2 policies.
--          Fonctionnelles. Hors perimetre.
--
-- La migration `2026-08-17_memberships_alignement_contrat.sql`
-- (appliquee a INTERN le 2026-08-17) sert de modele. On reprend la
-- meme sequence, dans le meme transaction, sur CUSTOMERS. Meme
-- raisons, memes pieges (recursion RLS sur `memberships`, hook JWT
-- qui lit `m.tenant_id` et pas `m.org_id`, `search_path` fige sur
-- les fonctions SECURITY DEFINER).
--
-- LA QUESTION OUVERTE — A QUOI SERT CUSTOMERS ?
-- ---------------------------------------------
-- L'ecran de connexion propose deux entrees (« Architecte
-- (interne) » / « Coach client (CUSTOMERS) »). La documentation
-- n'a pas tranche ce que CUSTOMERS est cense devenir. Deux issues
-- possibles :
--
--   Issue A — Bascule d'URL selon l'entree choisie a la connexion.
--             L'app deployee detecte le clic « Coach client »,
--             bascule ses variables d'environnement vers le projet
--             CUSTOMERS, et lit `omk_customers.*` au lieu de
--             `omk_internal.*`. Dans ce cas, CUSTOMERS doit avoir
--             les memes tables, les memes contrats, les memes
--             policies que INTERN : c'est ce que cette migration
--             pose les bases.
--
--   Issue B — CUSTOMERS abandonne. L'entree « Coach client » est
--             retirees de l'ecran de connexion, les invites
--             externes arrivent par un autre canal. Dans ce cas,
--             cette migration est gaspillee, mais elle ne casse
--             rien : poser des policies SUR des tables deja
--             sans policy les ouvre, et RLS n'a aucun effet sur
--             une table vide.
--
-- Cette migration prepare le terrain pour Issue A et ne fait aucun
-- mal en cas d'Issue B. Le rapport (RAPPORT_FIX_6.md) detaille
-- les consequences de chaque issue et ce qui reste a faire
-- ensuite.
--
-- ORDRE CRITIQUE
-- --------------
-- Le hook `custom_access_token_hook` lit `m.tenant_id` et filtre
-- sur `m.status = 'active'`. Si on renommait `org_id` -> `tenant_id`
-- SANS reecrire le hook dans la MEME transaction, le hook lirait
-- `event->'org_id'` (qui n'existe pas encore dans CUSTOMERS — le
-- hook n'est pas deploye ici), mais sur un projet ou le hook
-- existerait deja, plus aucune connexion n'obtiendrait la claim
-- `org_id`. D'ou le `begin; ... commit;` unique, et le hook
-- ecrit AVANT tout `commit` qui pourrait le separer du rename.
--
-- IDEMPOTENCE
-- -----------
-- La migration peut etre jouee deux fois (rollback puis re-apply,
-- ou repetition accidentelle). Toutes les operations destructives
-- sont precede de `drop ... if exists` ou d'un test
-- `information_schema`. Les fonctions utilisent `create or replace
-- function` (idempotent).
--
-- ANNULATION
-- Voir le bloc en fin de fichier.
-- =====================================================================

begin;

-- ============================================================== 1. memberships
-- Etape 1.1 : renommer `org_id` -> `tenant_id` (si pas deja fait).
-- Le nom `tenant_id` est impose par le contrat `MembershipRow` cote
-- TypeScript (cf. src/lib/tenant/contract.ts) et par le code applicatif
-- qui interroge `memberships.tenant_id`. Sans ce rename, le code
-- `backend.supabase.ts` lit une colonne absente et fait planter
-- Postgres a la premiere requete d'adhesion.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memberships'
      and column_name = 'org_id'
  ) then
    alter table public.memberships rename column org_id to tenant_id;
  end if;
end $$;

-- Etape 1.2 : renommer les contraintes qui referencent l'ancien nom.
-- Wrap dans un DO pour rester idempotent : si la contrainte est deja
-- renommee, on ne fait rien.

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'memberships_org_id_fkey'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      rename constraint memberships_org_id_fkey to memberships_tenant_id_fkey;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'memberships_user_id_org_id_key'
      and conrelid = 'public.memberships'::regclass
  ) then
    alter table public.memberships
      rename constraint memberships_user_id_org_id_key to memberships_user_id_tenant_id_key;
  end if;
end $$;

-- Etape 1.3 : ajouter les colonnes manquantes du contrat.
-- `add column if not exists` rend l'operation idempotente.
-- Le `default 'active'` assure que les memberships deja presents
-- en base (un owner fondateur, par exemple) survivent au rename
-- sans deverrouiller d'etat incoherent.

alter table public.memberships
  add column if not exists invited_by  uuid references auth.users(id) on delete set null,
  add column if not exists invited_at  timestamptz not null default now(),
  add column if not exists accepted_at timestamptz,
  add column if not exists status      text        not null default 'active';

-- Etape 1.4 : reprendre l'existant. Le membership deja en base est un
-- owner fondateur, accepte a sa creation. `invited_by` reste NULL
-- (personne ne l'a invite — c'est lui-meme qui s'a cree).

update public.memberships
   set accepted_at = coalesce(accepted_at, created_at),
       invited_at = coalesce(invited_at, created_at)
 where invited_at is null
    or accepted_at is null;

-- Etape 1.5 : poser les enumerations. On drop puis on recreate pour
-- rester idempotent (PG ne supporte pas `add constraint if not exists`).
-- Les valeurs viennent de `src/lib/tenant/contract.ts:294-299`.

alter table public.memberships
  drop constraint if exists memberships_status_check,
  drop constraint if exists memberships_role_check,
  add  constraint memberships_status_check check (status in ('pending', 'active', 'revoked')),
  add  constraint memberships_role_check   check (role   in ('owner', 'admin', 'member', 'guest'));

-- Etape 1.6 : index utiles pour les lookups `auth.uid()` et `(tenant, status)`.

create index if not exists memberships_tenant_id_idx on public.memberships (tenant_id);
create index if not exists memberships_user_id_idx   on public.memberships (user_id);
create index if not exists memberships_tenant_status_idx on public.memberships (tenant_id, status);

-- ============================================================ 2. JWT hook
-- Le hook injecte la claim `org_id` (nom canon garde pour les 100
-- policies `cms_*` cote application) en lisant `memberships.tenant_id`.
-- Sur CUSTOMERS, ce hook peut etre absent ou present avec un ancien
-- corps. `create or replace function` gere les deux cas.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $function$
declare
  claims     jsonb;
  v_user_id  uuid;
  v_org_id   uuid;
begin
  v_user_id := (event->>'user_id')::uuid;

  -- On ne retient qu'une adhesion ACTIVE : une invitation en attente
  -- ou revoquee ne doit pas donner acces au tenant.
  select m.tenant_id into v_org_id
  from public.memberships m
  where m.user_id = v_user_id
    and m.status = 'active'
  order by m.created_at asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);

  -- On n'ajoute la claim que si une org existe. Sinon on la laisse
  -- ABSENTE : la politique RLS echoue alors franchement, ce qui rend
  -- le probleme visible au lieu de le masquer derriere un resultat vide.
  if v_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(v_org_id::text));
  end if;

  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;
  claims := jsonb_set(claims, '{app_metadata,provider}', to_jsonb('coach-os-jwt-hook'::text));

  return jsonb_set(event, '{claims}', claims);
end;
$function$;

-- Seul `supabase_auth_admin` (l'utilisateur systeme de GoTrue) peut
-- appeler le hook. Sans ce grant, le hook ne se declenche pas et toutes
-- les connexions arrivent sans claim `org_id` -> zero ligne partout.
revoke all on function public.custom_access_token_hook from public;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- ======================================================== 3. is_tenant_admin
-- Une policy posee SUR `memberships` qui interroge `memberships`
-- declenche une recursion infinie de RLS (la policy de memberships
-- re-interroge memberships, etc.). Solution : passer par une fonction
-- SECURITY DEFINER qui contourne RLS pour cette seule lecture. Le
-- `search_path` est fige sur `public, pg_temp` pour qu'un schema
-- pirate en tete de chemin ne puisse pas detourner l'appel.
--
-- NB : on ne declare pas la fonction `current_org_id()` (qui existe
-- sur INTERN) parce qu'elle est superieure par sa recursion
-- potentielle. Le helper `is_tenant_admin()` suffit aux policies
-- ci-dessous et reste local a la table `memberships`.

create or replace function public.is_tenant_admin(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.memberships
    where user_id  = auth.uid()
      and tenant_id = p_tenant
      and role     in ('owner', 'admin')
      and status    = 'active'
  );
$$;

revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.is_tenant_admin(uuid) to authenticated;

-- =========================================================== 4. GRANT TABLE
-- La policy fait le filtrage RLS ; le GRANT donne le droit SQL brut.
-- `authenticated` peut SELECT/INSERT/UPDATE/DELETE, les policies
-- decidens qui voit quoi.

grant select, insert, update, delete on public.memberships to authenticated;

-- ============================================================ 5. memberships policies
-- Lecture : un proprietaire ou administrateur voit les membres de
-- son tenant. La policy existante `memberships_same_org_read`
-- (user_id = auth.uid()) reste ; plusieurs policies SELECT se
-- combinent en OU.

drop policy if exists memberships_admin_read on public.memberships;
create policy memberships_admin_read on public.memberships
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

-- Ecriture : seul un administrateur du tenant invite, et il ne peut
-- inviter que dans SON tenant.

drop policy if exists memberships_admin_insert on public.memberships;
create policy memberships_admin_insert on public.memberships
  for insert to authenticated
  with check (public.is_tenant_admin(tenant_id));

-- Mise a jour : un administrateur gere les membres de son tenant ;
-- un invite peut accepter sa propre invitation.

drop policy if exists memberships_admin_update on public.memberships;
create policy memberships_admin_update on public.memberships
  for update to authenticated
  using      (public.is_tenant_admin(tenant_id) or user_id = auth.uid())
  with check (public.is_tenant_admin(tenant_id) or user_id = auth.uid());

-- Suppression : administrateur seulement. Pas de suppression de
-- soi-meme, pour qu'un tenant ne puisse pas se retrouver sans
-- proprietaire par accident.

drop policy if exists memberships_admin_delete on public.memberships;
create policy memberships_admin_delete on public.memberships
  for delete to authenticated
  using (public.is_tenant_admin(tenant_id));

-- ============================================================= 6. audit_events
-- Cloison stricte : lecture reservee aux administrateurs du tenant,
-- ecriture reservee au service_role, aucune modification ni
-- suppression possible. Un journal qu'on peut reecrire ne vaut rien.
--
-- `audit_events.tenant_id` est `text` ; `memberships.tenant_id`
-- est `uuid` apres le rename. On caste au passage, ce qui rejettera
-- les lignes `audit_events` dont le `tenant_id` n'est pas un UUID
-- valide (acceptable : un tenant_id non-UUID est de toute facon un
-- bug a corriger en base).

drop policy if exists admin_read_audit on public.audit_events;
create policy admin_read_audit on public.audit_events
  for select to authenticated
  using (public.is_tenant_admin(tenant_id::uuid));

drop policy if exists service_insert_audit on public.audit_events;
create policy service_insert_audit on public.audit_events
  for insert to authenticated
  with check (auth.role() = 'service_role');

-- Pas de UPDATE. La policy `using (false)` rejette toute tentative.

drop policy if exists no_update_audit on public.audit_events;
create policy no_update_audit on public.audit_events
  for update using (false) with check (false);

-- Pas de DELETE. Idem.

drop policy if exists no_delete_audit on public.audit_events;
create policy no_delete_audit on public.audit_events
  for delete using (false);

-- Grant minimal. Le SELECT necessite `grant select` pour que la policy
-- puisse etre evaluee ; `service_role` obtient INSERT pour ecrire.

grant select on public.audit_events to authenticated;
grant insert on public.audit_events to service_role;

-- ========================================================== 7. workspace_branches
-- Lecture par member actif du tenant. Pas d'INSERT/UPDATE/DELETE
-- policy : ces ecritures passent par le service_role (cote backend)
-- ou par la matrice `permissions.ts` cote application. Meme modele
-- que sur INTERN (`2026-08-15_workspace_branches.sql`).

drop policy if exists workspace_branches_tenant_read on public.workspace_branches;
create policy workspace_branches_tenant_read on public.workspace_branches
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id::text = workspace_branches.tenant_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select on public.workspace_branches to authenticated;

-- ======================================================= 8. workspace_snapshots
-- Lecture indirecte : on passe par `workspace_branches` pour resoudre
-- le tenant. Les snapshots eux-memes n'ont pas de `tenant_id`
-- (un snapshot est identifie par son `branch_id`).

drop policy if exists workspace_snapshots_tenant_read on public.workspace_snapshots;
create policy workspace_snapshots_tenant_read on public.workspace_snapshots
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_branches b
      join public.memberships m on m.tenant_id::text = b.tenant_id
      where b.id = workspace_snapshots.branch_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select on public.workspace_snapshots to authenticated;

-- ============================================================= 9. workspace_prs
-- Lecture par member actif du tenant. Les PRs portent un `tenant_id`
-- direct (cf. 2026-08-15_workspace_branches.sql §3).

drop policy if exists workspace_prs_tenant_read on public.workspace_prs;
create policy workspace_prs_tenant_read on public.workspace_prs
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id::text = workspace_prs.tenant_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select on public.workspace_prs to authenticated;

-- ====================================================== 10. workspace_pr_reviews
-- Lecture indirecte : on resout le tenant via `workspace_prs`.

drop policy if exists workspace_pr_reviews_tenant_read on public.workspace_pr_reviews;
create policy workspace_pr_reviews_tenant_read on public.workspace_pr_reviews
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_prs p
      join public.memberships m on m.tenant_id::text = p.tenant_id
      where p.id = workspace_pr_reviews.pr_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

grant select on public.workspace_pr_reviews to authenticated;

commit;

-- =====================================================================
-- BLOC D'ANNULATION (NE PAS EXECUTER — pour reference en cas de retour
-- en arriere complet).
--
-- begin;
--   -- 10. workspace_pr_reviews
--   drop policy if exists workspace_pr_reviews_tenant_read on public.workspace_pr_reviews;
--   revoke select on public.workspace_pr_reviews from authenticated;
--
--   -- 9. workspace_prs
--   drop policy if exists workspace_prs_tenant_read on public.workspace_prs;
--   revoke select on public.workspace_prs from authenticated;
--
--   -- 8. workspace_snapshots
--   drop policy if exists workspace_snapshots_tenant_read on public.workspace_snapshots;
--   revoke select on public.workspace_snapshots from authenticated;
--
--   -- 7. workspace_branches
--   drop policy if exists workspace_branches_tenant_read on public.workspace_branches;
--   revoke select on public.workspace_branches from authenticated;
--
--   -- 6. audit_events
--   drop policy if exists admin_read_audit      on public.audit_events;
--   drop policy if exists service_insert_audit  on public.audit_events;
--   drop policy if exists no_update_audit      on public.audit_events;
--   drop policy if exists no_delete_audit      on public.audit_events;
--   revoke select on public.audit_events from authenticated;
--   revoke insert on public.audit_events from service_role;
--
--   -- 5. memberships policies
--   drop policy if exists memberships_admin_delete on public.memberships;
--   drop policy if exists memberships_admin_update on public.memberships;
--   drop policy if exists memberships_admin_insert on public.memberships;
--   drop policy if exists memberships_admin_read   on public.memberships;
--   revoke select, insert, update, delete on public.memberships from authenticated;
--
--   -- 4. GRANT memberships deja fait ci-dessus.
--
--   -- 3. is_tenant_admin
--   drop function if exists public.is_tenant_admin(uuid);
--
--   -- 2. JWT hook
--   revoke execute on function public.custom_access_token_hook from supabase_auth_admin;
--   drop function if exists public.custom_access_token_hook(jsonb);
--
--   -- 1. memberships colonnes
--   alter table public.memberships
--     drop constraint memberships_role_check,
--     drop constraint memberships_status_check,
--     drop column status, drop column accepted_at,
--     drop column invited_at, drop column invited_by;
--   alter table public.memberships rename column tenant_id to org_id;
--   alter table public.memberships
--     rename constraint memberships_tenant_id_fkey to memberships_org_id_fkey;
--   alter table public.memberships
--     rename constraint memberships_user_id_tenant_id_key to memberships_user_id_org_id_key;
--   drop index if exists memberships_tenant_status_idx;
--   drop index if exists memberships_user_id_idx;
--   drop index if exists memberships_tenant_id_idx;
-- commit;
-- =====================================================================