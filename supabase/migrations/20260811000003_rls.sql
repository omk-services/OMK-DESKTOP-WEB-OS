-- =====================================================================
-- 20260811000003_rls.sql
-- RLS sur les 23 tables CMS + cms_items + cms_collections (rétro-compat).
--
-- Brief-F-2026-08-11. La règle d'or : org_id = (auth.jwt() ->> 'org_id')::uuid
-- Sans hook JWT provisionné, le claim est null, la policy refuse tout,
-- les requêtes renvoient zéro ligne en silence. C'est exactement le
-- bug déjà payé (cf. SOCLE.md §Le piege deja paye). Le test adverse
-- est dans VERIFICATION_RLS.md.
-- =====================================================================

-- Helper : extrait org_id du JWT en toute sécurité.
-- Renvoie NULL si la claim est absente, ce qui fait échouer la policy.
create or replace function public.jwt_org_id() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'org_id', '')::uuid
$$;

grant execute on function public.jwt_org_id to authenticated;

-- =====================================================================
-- Liste des tables CMS à protéger. Une boucle DO génère enable + policies.
-- =====================================================================
do $$
declare
  t text;
  cms_tables text[] := array[
    'cms_clients','cms_articles','cms_team','cms_people_agents',
    'cms_runbooks','cms_incidents','cms_services','cms_it_experiments',
    'cms_deploys','cms_tasks','cms_marketplace_listings','cms_product_items',
    'cms_product_releases','cms_growth_channels','cms_growth_experiments',
    'cms_deals','cms_invoices','cms_contracts','cms_policies',
    'cms_session_notes','cms_demo_coach_apps','cms_demo_coach_notes',
    'cms_demo_coach_metrics'
  ];
begin
  foreach t in array cms_tables loop
    -- ENABLE
    execute format('alter table public.%I enable row level security;', t);

    -- SELECT policy : un user voit les lignes de son org
    execute format(
      'create policy %I_select on public.%I '
      'for select to authenticated using ('
      '  org_id = public.jwt_org_id()'
      ');',
      t, t
    );

    -- INSERT policy : un user ne peut créer que dans son org
    execute format(
      'create policy %I_insert on public.%I '
      'for insert to authenticated with check ('
      '  org_id = public.jwt_org_id()'
      ');',
      t, t
    );

    -- UPDATE policy : un user ne peut modifier que les lignes de son org
    execute format(
      'create policy %I_update on public.%I '
      'for update to authenticated using ('
      '  org_id = public.jwt_org_id()'
      ') with check ('
      '  org_id = public.jwt_org_id()'
      ');',
      t, t
    );

    -- DELETE policy : idem
    execute format(
      'create policy %I_delete on public.%I '
      'for delete to authenticated using ('
      '  org_id = public.jwt_org_id()'
      ');',
      t, t
    );
  end loop;
end $$;

-- =====================================================================
-- Rétro-compat : cms_items (events append-only) et cms_collections
-- (définitions). Le repository existant les utilise ; on garde la
-- même policy org_id, alignée.
-- =====================================================================

alter table public.cms_items       enable row level security;
alter table public.cms_collections enable row level security;

create policy cms_items_select on public.cms_items
  for select to authenticated using (org_id = public.jwt_org_id());
create policy cms_items_insert on public.cms_items
  for insert to authenticated with check (org_id = public.jwt_org_id());
create policy cms_items_update on public.cms_items
  for update to authenticated using (org_id = public.jwt_org_id())
                       with check (org_id = public.jwt_org_id());
create policy cms_items_delete on public.cms_items
  for delete to authenticated using (org_id = public.jwt_org_id());

create policy cms_collections_select on public.cms_collections
  for select to authenticated using (org_id = public.jwt_org_id());
create policy cms_collections_insert on public.cms_collections
  for insert to authenticated with check (org_id = public.jwt_org_id());
create policy cms_collections_update on public.cms_collections
  for update to authenticated using (org_id = public.jwt_org_id())
                              with check (org_id = public.jwt_org_id());
create policy cms_collections_delete on public.cms_collections
  for delete to authenticated using (org_id = public.jwt_org_id());

-- =====================================================================
-- Grants de base : laisser authenticated SELECT/INSERT/UPDATE/DELETE
-- (les policies ci-dessus font le filtrage), anon n'a rien.
-- =====================================================================
do $$
declare
  t text;
  all_tables text[] := array[
    'cms_clients','cms_articles','cms_team','cms_people_agents',
    'cms_runbooks','cms_incidents','cms_services','cms_it_experiments',
    'cms_deploys','cms_tasks','cms_marketplace_listings','cms_product_items',
    'cms_product_releases','cms_growth_channels','cms_growth_experiments',
    'cms_deals','cms_invoices','cms_contracts','cms_policies',
    'cms_session_notes','cms_demo_coach_apps','cms_demo_coach_notes',
    'cms_demo_coach_metrics',
    'cms_items','cms_collections'
  ];
begin
  foreach t in array all_tables loop
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end $$;
