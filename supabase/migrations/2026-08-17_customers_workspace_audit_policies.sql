-- 2026-08-17 — policies des 5 tables restees sans protection sur CUSTOMERS.
--
-- POURQUOI CE FICHIER PLUTOT QUE `2026-08-17_customers_policies.sql`
-- Ce dernier (20 Ko, ecrit par un agent delegue) suppose une colonne
-- `memberships.created_at` qui n'existe pas sur CUSTOMERS — il avait ete
-- redige d'apres le schema d'INTERN. Il echoue ligne 150. Plutot que de le
-- deboguer, on ecrit le strict necessaire, verifie contre les colonnes
-- reelles.
--
-- ETAT AVANT : ces 5 tables ont RLS ACTIVE et ZERO policy — donc refus
-- total. Elles ne sont pas ouvertes, elles sont mortes. C'est le mode
-- d'echec le plus sur, mais la fonctionnalite ne marche pas.
--
-- CONVENTION DE CE PROJET : `tenant_id` est de type TEXT (un slug), pas uuid.
-- Le code (`src/lib/tenant/contract.ts`) raisonne en slugs. Toute policy
-- ecrite ici s'y conforme.

begin;

-- --------------------------------------------------------------- helpers
--
-- SECURITY DEFINER : ces fonctions interrogent `memberships`, sur laquelle
-- des policies existent. Sans SECURITY DEFINER, une policy qui appelle une
-- fonction qui lit une table protegee declenche une evaluation en cascade —
-- et si la table lue est celle qui porte la policy, c'est une recursion
-- infinie. `search_path` est fige : sans ca, un schema pirate en tete de
-- chemin pourrait detourner l'appel.

create or replace function public.est_membre_du_tenant(p_tenant text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and status = 'active'
  );
$$;

create or replace function public.est_admin_du_tenant(p_tenant text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and role in ('owner', 'admin')
      and status = 'active'
  );
$$;

revoke all on function public.est_membre_du_tenant(text) from public;
revoke all on function public.est_admin_du_tenant(text)  from public;
grant execute on function public.est_membre_du_tenant(text) to authenticated;
grant execute on function public.est_admin_du_tenant(text)  to authenticated;

-- ---------------------------------------------------------- audit_events
--
-- Un journal d'audit qu'on peut reecrire ne vaut rien. Lecture reservee aux
-- administrateurs du tenant ; AUCUNE policy UPDATE ni DELETE — donc RLS les
-- refuse par defaut, definitivement. L'INSERT reste ouvert aux membres :
-- c'est l'application qui trace, et un membre doit pouvoir laisser une trace
-- de sa propre action.

drop policy if exists audit_events_admin_read on public.audit_events;
create policy audit_events_admin_read on public.audit_events
  for select to authenticated
  using (public.est_admin_du_tenant(tenant_id));

drop policy if exists audit_events_member_insert on public.audit_events;
create policy audit_events_member_insert on public.audit_events
  for insert to authenticated
  with check (public.est_membre_du_tenant(tenant_id));

-- ----------------------------------------------------- workspace_branches

drop policy if exists workspace_branches_member_read on public.workspace_branches;
create policy workspace_branches_member_read on public.workspace_branches
  for select to authenticated
  using (public.est_membre_du_tenant(tenant_id));

drop policy if exists workspace_branches_member_insert on public.workspace_branches;
create policy workspace_branches_member_insert on public.workspace_branches
  for insert to authenticated
  with check (public.est_membre_du_tenant(tenant_id) and created_by = auth.uid());

drop policy if exists workspace_branches_admin_update on public.workspace_branches;
create policy workspace_branches_admin_update on public.workspace_branches
  for update to authenticated
  using      (public.est_admin_du_tenant(tenant_id) or created_by = auth.uid())
  with check (public.est_membre_du_tenant(tenant_id));

drop policy if exists workspace_branches_admin_delete on public.workspace_branches;
create policy workspace_branches_admin_delete on public.workspace_branches
  for delete to authenticated
  using (public.est_admin_du_tenant(tenant_id) and is_default = false);

-- ---------------------------------------------------------- workspace_prs

drop policy if exists workspace_prs_member_read on public.workspace_prs;
create policy workspace_prs_member_read on public.workspace_prs
  for select to authenticated
  using (public.est_membre_du_tenant(tenant_id));

drop policy if exists workspace_prs_member_insert on public.workspace_prs;
create policy workspace_prs_member_insert on public.workspace_prs
  for insert to authenticated
  with check (public.est_membre_du_tenant(tenant_id) and created_by = auth.uid());

drop policy if exists workspace_prs_update on public.workspace_prs;
create policy workspace_prs_update on public.workspace_prs
  for update to authenticated
  using      (public.est_admin_du_tenant(tenant_id) or created_by = auth.uid())
  with check (public.est_membre_du_tenant(tenant_id));

-- --------------------------------------------------- workspace_snapshots
--
-- Pas de `tenant_id` propre : le rattachement passe par la branche. Un
-- snapshot est immuable par nature — c'est un instantane. Aucune policy
-- UPDATE ni DELETE, volontairement.

drop policy if exists workspace_snapshots_member_read on public.workspace_snapshots;
create policy workspace_snapshots_member_read on public.workspace_snapshots
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_branches b
      where b.id = branch_id
        and public.est_membre_du_tenant(b.tenant_id)
    )
  );

drop policy if exists workspace_snapshots_member_insert on public.workspace_snapshots;
create policy workspace_snapshots_member_insert on public.workspace_snapshots
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.workspace_branches b
      where b.id = branch_id
        and public.est_membre_du_tenant(b.tenant_id)
    )
  );

-- -------------------------------------------------- workspace_pr_reviews
--
-- Pas de `tenant_id` propre non plus : rattachement par la PR.

drop policy if exists workspace_pr_reviews_member_read on public.workspace_pr_reviews;
create policy workspace_pr_reviews_member_read on public.workspace_pr_reviews
  for select to authenticated
  using (
    exists (
      select 1 from public.workspace_prs pr
      where pr.id = pr_id
        and public.est_membre_du_tenant(pr.tenant_id)
    )
  );

drop policy if exists workspace_pr_reviews_member_insert on public.workspace_pr_reviews;
create policy workspace_pr_reviews_member_insert on public.workspace_pr_reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.workspace_prs pr
      where pr.id = pr_id
        and public.est_membre_du_tenant(pr.tenant_id)
    )
  );

-- Un relecteur peut corriger SON avis, personne d'autre.
drop policy if exists workspace_pr_reviews_self_update on public.workspace_pr_reviews;
create policy workspace_pr_reviews_self_update on public.workspace_pr_reviews
  for update to authenticated
  using      (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

commit;

-- ------------------------------------------------------------- ANNULATION
--
-- begin;
--   drop policy if exists workspace_pr_reviews_self_update   on public.workspace_pr_reviews;
--   drop policy if exists workspace_pr_reviews_member_insert on public.workspace_pr_reviews;
--   drop policy if exists workspace_pr_reviews_member_read   on public.workspace_pr_reviews;
--   drop policy if exists workspace_snapshots_member_insert  on public.workspace_snapshots;
--   drop policy if exists workspace_snapshots_member_read    on public.workspace_snapshots;
--   drop policy if exists workspace_prs_update               on public.workspace_prs;
--   drop policy if exists workspace_prs_member_insert        on public.workspace_prs;
--   drop policy if exists workspace_prs_member_read          on public.workspace_prs;
--   drop policy if exists workspace_branches_admin_delete    on public.workspace_branches;
--   drop policy if exists workspace_branches_admin_update    on public.workspace_branches;
--   drop policy if exists workspace_branches_member_insert   on public.workspace_branches;
--   drop policy if exists workspace_branches_member_read     on public.workspace_branches;
--   drop policy if exists audit_events_member_insert         on public.audit_events;
--   drop policy if exists audit_events_admin_read            on public.audit_events;
--   drop function if exists public.est_admin_du_tenant(text);
--   drop function if exists public.est_membre_du_tenant(text);
-- commit;
