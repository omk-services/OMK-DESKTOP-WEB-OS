-- 2026-08-17 — UN SEUL vocabulaire de tenant : `org_id uuid`.
--
-- DECISION (utilisateur, 2026-08-17) : « c'est le canon RLS qui gagne avec
-- les meilleures pratiques ». Donc uuid, et le nom `org_id` — celui que
-- `jwt_org_id()` et les 25 tables `cms_*` utilisent deja.
--
-- CE QU'ON REPARE
-- Deux systemes coexistaient pour designer la meme chose :
--
--   memberships.tenant_id       TEXT   (slug, ex. 'demo-coach')
--   audit_events.tenant_id      TEXT
--   workspace_branches.tenant_id TEXT
--   workspace_prs.tenant_id     TEXT
--   cms_*.tenant_id             TEXT   <- EN PLUS de cms_*.org_id UUID
--   cms_*.org_id                UUID   (celui que la RLS compare)
--
-- Les 25 tables `cms_*` portaient donc les DEUX colonnes. Le doublon `text`
-- n'etait lu par aucune policy : c'est du poids mort qui invite a l'erreur.
--
-- POURQUOI MAINTENANT
-- CUSTOMERS contient 0 ligne et 0 compte. Aucune donnee a convertir, aucun
-- utilisateur a deranger. Une conversion de type sur une base peuplee aurait
-- exige une correspondance slug -> uuid ligne a ligne ; ici, c'est gratuit.
-- Attendre aurait rendu la meme operation risquee.
--
-- CONSEQUENCE SUR LE CODE, A TRAITER ENSUITE
-- `src/lib/auth/backend.supabase.ts` selectionne `tenant_id`. Il devra lire
-- `org_id`. `TenantId` dans `src/lib/tenant/contract.ts` est un slug
-- ('__default__', 'demo-coach') : il reste legitime comme CLE DE PARTITION
-- LOCALE (localStorage, partitions CMS), mais ne doit plus etre envoye a
-- Supabase. Les deux notions se ressemblaient ; elles se separent ici.

begin;

-- ============================================================ 1. cms_*
-- On retire le doublon TEXT. `org_id UUID` reste, et reste le seul.

do $$
declare t record;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public'
      and column_name = 'tenant_id'
      and data_type = 'text'
      and table_name like 'cms_%'
  loop
    execute format('alter table public.%I drop column if exists tenant_id', t.table_name);
  end loop;
end $$;

-- ================================================= 2. policies dependantes
-- Elles comparent `tenant_id` TEXT. On les retire avant de changer le type,
-- sinon PostgreSQL refuse l'ALTER.

drop policy if exists audit_events_admin_read            on public.audit_events;
drop policy if exists audit_events_member_insert         on public.audit_events;
drop policy if exists workspace_branches_member_read     on public.workspace_branches;
drop policy if exists workspace_branches_member_insert   on public.workspace_branches;
drop policy if exists workspace_branches_admin_update    on public.workspace_branches;
drop policy if exists workspace_branches_admin_delete    on public.workspace_branches;
drop policy if exists workspace_prs_member_read          on public.workspace_prs;
drop policy if exists workspace_prs_member_insert        on public.workspace_prs;
drop policy if exists workspace_prs_update               on public.workspace_prs;
drop policy if exists workspace_snapshots_member_read    on public.workspace_snapshots;
drop policy if exists workspace_snapshots_member_insert  on public.workspace_snapshots;
drop policy if exists workspace_pr_reviews_member_read   on public.workspace_pr_reviews;
drop policy if exists workspace_pr_reviews_member_insert on public.workspace_pr_reviews;
drop policy if exists workspace_pr_reviews_self_update   on public.workspace_pr_reviews;
drop policy if exists memberships_admin_read             on public.memberships;
drop policy if exists memberships_admin_insert           on public.memberships;
drop policy if exists memberships_admin_update           on public.memberships;
drop policy if exists memberships_admin_delete           on public.memberships;
drop policy if exists memberships_same_org_read          on public.memberships;
drop policy if exists memberships_auth_admin_read        on public.memberships;
drop policy if exists organizations_member_read          on public.organizations;

drop function if exists public.est_membre_du_tenant(text);
drop function if exists public.est_admin_du_tenant(text);
drop function if exists public.is_tenant_admin(uuid);

-- ============================== 3. conversion TEXT -> UUID + renommage
-- `using null::uuid` est sans perte : ces tables sont vides (verifie avant
-- migration — 0 ligne sur les 35 tables du projet). Sur une base peuplee il
-- faudrait une correspondance slug -> organizations.id.

alter table public.memberships        alter column tenant_id type uuid using null::uuid;
alter table public.audit_events       alter column tenant_id type uuid using null::uuid;
alter table public.workspace_branches alter column tenant_id type uuid using null::uuid;
alter table public.workspace_prs      alter column tenant_id type uuid using null::uuid;

alter table public.memberships        rename column tenant_id to org_id;
alter table public.audit_events       rename column tenant_id to org_id;
alter table public.workspace_branches rename column tenant_id to org_id;
alter table public.workspace_prs      rename column tenant_id to org_id;

-- Integrite referentielle : un org_id qui ne designe aucune organisation est
-- une donnee orpheline. La contrainte le rend impossible.
alter table public.memberships
  add constraint memberships_org_fk
  foreign key (org_id) references public.organizations(id) on delete cascade;

alter table public.workspace_branches
  add constraint workspace_branches_org_fk
  foreign key (org_id) references public.organizations(id) on delete cascade;

alter table public.workspace_prs
  add constraint workspace_prs_org_fk
  foreign key (org_id) references public.organizations(id) on delete cascade;

-- `audit_events` n'a PAS de FK volontairement : un journal doit survivre a
-- la suppression de l'organisation qu'il documente. C'est le seul cas ou
-- l'orphelin est souhaitable.

create index if not exists memberships_org_idx        on public.memberships (org_id);
create index if not exists audit_events_org_idx       on public.audit_events (org_id);
create index if not exists workspace_branches_org_idx on public.workspace_branches (org_id);
create index if not exists workspace_prs_org_idx      on public.workspace_prs (org_id);

-- ==================================================== 4. helpers en UUID
-- SECURITY DEFINER : ces fonctions lisent `memberships`, qui porte des
-- policies. Sans ca, une policy sur memberships qui appelle une fonction
-- lisant memberships boucle a l'infini. `search_path` fige pour qu'un schema
-- pirate en tete de chemin ne detourne pas l'appel.

create or replace function public.est_membre_org(p_org uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and org_id = p_org and status = 'active'
  );
$$;

create or replace function public.est_admin_org(p_org uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and org_id = p_org
      and role in ('owner','admin') and status = 'active'
  );
$$;

revoke all on function public.est_membre_org(uuid) from public;
revoke all on function public.est_admin_org(uuid)  from public;
grant execute on function public.est_membre_org(uuid) to authenticated;
grant execute on function public.est_admin_org(uuid)  to authenticated;

-- ================================================= 5. hook JWT sur org_id

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $function$
declare
  claims    jsonb;
  v_user_id uuid;
  v_org_id  uuid;
begin
  v_user_id := (event->>'user_id')::uuid;

  select m.org_id into v_org_id
  from public.memberships m
  where m.user_id = v_user_id and m.status = 'active'
  order by m.invited_at asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);

  -- Claim ABSENTE si aucune org : la RLS echoue alors franchement, ce qui
  -- rend le probleme visible au lieu de le masquer derriere un resultat vide.
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

-- ===================================================== 6. policies en UUID

create policy organizations_member_read on public.organizations
  for select to authenticated
  using (public.est_membre_org(id));

create policy memberships_self_read on public.memberships
  for select to authenticated using (user_id = auth.uid());

create policy memberships_admin_read on public.memberships
  for select to authenticated using (public.est_admin_org(org_id));

create policy memberships_admin_insert on public.memberships
  for insert to authenticated with check (public.est_admin_org(org_id));

create policy memberships_admin_update on public.memberships
  for update to authenticated
  using      (public.est_admin_org(org_id) or user_id = auth.uid())
  with check (public.est_admin_org(org_id) or user_id = auth.uid());

create policy memberships_admin_delete on public.memberships
  for delete to authenticated using (public.est_admin_org(org_id));

-- Le hook s'execute en `supabase_auth_admin` et doit lire toute la table.
create policy memberships_auth_admin_read on public.memberships
  for select to supabase_auth_admin using (true);

-- Journal d'audit : lecture reservee aux admins, AUCUN update ni delete.
-- Un journal qu'on peut reecrire ne vaut rien.
create policy audit_events_admin_read on public.audit_events
  for select to authenticated using (public.est_admin_org(org_id));

create policy audit_events_member_insert on public.audit_events
  for insert to authenticated with check (public.est_membre_org(org_id));

create policy workspace_branches_member_read on public.workspace_branches
  for select to authenticated using (public.est_membre_org(org_id));

create policy workspace_branches_member_insert on public.workspace_branches
  for insert to authenticated
  with check (public.est_membre_org(org_id) and created_by = auth.uid());

create policy workspace_branches_admin_update on public.workspace_branches
  for update to authenticated
  using      (public.est_admin_org(org_id) or created_by = auth.uid())
  with check (public.est_membre_org(org_id));

create policy workspace_branches_admin_delete on public.workspace_branches
  for delete to authenticated
  using (public.est_admin_org(org_id) and is_default = false);

create policy workspace_prs_member_read on public.workspace_prs
  for select to authenticated using (public.est_membre_org(org_id));

create policy workspace_prs_member_insert on public.workspace_prs
  for insert to authenticated
  with check (public.est_membre_org(org_id) and created_by = auth.uid());

create policy workspace_prs_update on public.workspace_prs
  for update to authenticated
  using      (public.est_admin_org(org_id) or created_by = auth.uid())
  with check (public.est_membre_org(org_id));

-- Snapshots et reviews n'ont pas d'org_id propre : rattachement par le parent.
-- Un snapshot est immuable par nature — aucun update ni delete.
create policy workspace_snapshots_member_read on public.workspace_snapshots
  for select to authenticated
  using (exists (
    select 1 from public.workspace_branches b
    where b.id = branch_id and public.est_membre_org(b.org_id)
  ));

create policy workspace_snapshots_member_insert on public.workspace_snapshots
  for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.workspace_branches b
    where b.id = branch_id and public.est_membre_org(b.org_id)
  ));

create policy workspace_pr_reviews_member_read on public.workspace_pr_reviews
  for select to authenticated
  using (exists (
    select 1 from public.workspace_prs pr
    where pr.id = pr_id and public.est_membre_org(pr.org_id)
  ));

create policy workspace_pr_reviews_member_insert on public.workspace_pr_reviews
  for insert to authenticated
  with check (reviewer_id = auth.uid() and exists (
    select 1 from public.workspace_prs pr
    where pr.id = pr_id and public.est_membre_org(pr.org_id)
  ));

create policy workspace_pr_reviews_self_update on public.workspace_pr_reviews
  for update to authenticated
  using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());

commit;
