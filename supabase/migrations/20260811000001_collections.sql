-- =====================================================================
-- 20260811000001_collections.sql
-- 23 CMS collections → 23 typed tables + rétro-compat cms_items/cms_collections.
--
-- Brief-F-2026-08-11 (multi-tenant). Modèle dérivé mécaniquement de
-- src/lib/cms/seed.ts : un `def()` = une table. Le `titleField` est
-- toujours présent en colonne, même quand `fields[]` ne le déclare pas —
-- c'est le cas pour les 23 collections. Le client (formFieldsFor) le
-- sait déjà, le schéma SQL doit le savoir aussi.
--
-- Chaque table porte :
--   id            uuid PK, généré
--   org_id        uuid NOT NULL  ← cible RLS
--   tenant_id     text NOT NULL  ← partition applicative (DEMO_COACH/DEFAULT)
--   slug          text NOT NULL  ← identifiant humain du seed.ts (ex. 'ava-chen')
--   <titleField>                ← colonne titre, TOUJOURS présente
--   <autres fields>             ← une colonne typée par def.fields[]
--   created_at, updated_at      timestamptz
--
-- Pourquoi slug + uuid : le seed.ts utilise des slugs stables ('ava-chen')
-- que l'app et les URLs connaissent. On les garde en colonne text (UNIQUE
-- dans l'org), tandis que le PK uuid permet la génération côté client et
-- évite toute fuite d'info dans les logs.
--
-- Rétro-compat : cms_items (events append-only) et cms_collections
-- (définitions) restent — l'ancien repository les utilise. Les 23
-- tables typées sont le nouveau chemin (tableFor()).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ─── Rétro-compat : cms_collections + cms_items ───────────────────────
-- Forme utilisée par src/lib/cms/repository.ts (Phase 1, avant Phase 4).
create table if not exists public.cms_collections (
  id              text primary key,
  org_id          uuid not null,
  name            text not null,
  singular        text,
  accent          text,
  title_field     text,
  subtitle_field  text,
  badge_field     text,
  fields          jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists cms_collections_org_idx on public.cms_collections (org_id);

create table if not exists public.cms_items (
  id              text primary key,
  collection_id   text not null,
  org_id          uuid not null,
  tenant_id       text not null default '__default__',
  data            jsonb not null,
  updated_at      timestamptz not null default now()
);
create index if not exists cms_items_org_idx          on public.cms_items (org_id);
create index if not exists cms_items_collection_idx   on public.cms_items (collection_id);
create index if not exists cms_items_tenant_idx       on public.cms_items (org_id, collection_id, tenant_id);

-- ─── 1. clients ────────────────────────────────────────────────────────
create table if not exists public.cms_clients (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null,
  tenant_id       text not null default '__default__',
  slug            text not null,
  name            text not null,
  segment         text,
  ticket          numeric(12,2),
  open_threads    integer,
  next_session    text,
  health          integer,
  onboarding_step text,
  status          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_clients_org_idx      on public.cms_clients (org_id);
create index if not exists cms_clients_tenant_idx   on public.cms_clients (org_id, tenant_id);

-- ─── 2. articles ───────────────────────────────────────────────────────
create table if not exists public.cms_articles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  category    text,
  reads       integer,
  updated     text,
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_articles_org_idx    on public.cms_articles (org_id);
create index if not exists cms_articles_tenant_idx on public.cms_articles (org_id, tenant_id);

-- ─── 3. team ───────────────────────────────────────────────────────────
create table if not exists public.cms_team (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  role        text,
  focus       text,
  status      text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_team_org_idx    on public.cms_team (org_id);
create index if not exists cms_team_tenant_idx on public.cms_team (org_id, tenant_id);

-- ─── 4. people_agents ──────────────────────────────────────────────────
create table if not exists public.cms_people_agents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  task        text,
  status      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_people_agents_org_idx    on public.cms_people_agents (org_id);
create index if not exists cms_people_agents_tenant_idx on public.cms_people_agents (org_id, tenant_id);

-- ─── 5. runbooks ───────────────────────────────────────────────────────
create table if not exists public.cms_runbooks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  category    text,
  updated     text,
  steps       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_runbooks_org_idx    on public.cms_runbooks (org_id);
create index if not exists cms_runbooks_tenant_idx on public.cms_runbooks (org_id, tenant_id);

-- ─── 6. incidents ──────────────────────────────────────────────────────
create table if not exists public.cms_incidents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  when_text   text,
  severity    text,
  resolution  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_incidents_org_idx    on public.cms_incidents (org_id);
create index if not exists cms_incidents_tenant_idx on public.cms_incidents (org_id, tenant_id);

-- ─── 7. services ───────────────────────────────────────────────────────
create table if not exists public.cms_services (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  note        text,
  status      text,
  detail      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_services_org_idx    on public.cms_services (org_id);
create index if not exists cms_services_tenant_idx on public.cms_services (org_id, tenant_id);

-- ─── 8. it_experiments ──────────────────────────────────────────────────
create table if not exists public.cms_it_experiments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  stage       text,
  meta        text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_it_experiments_org_idx    on public.cms_it_experiments (org_id);
create index if not exists cms_it_experiments_tenant_idx on public.cms_it_experiments (org_id, tenant_id);

-- ─── 9. deploys ────────────────────────────────────────────────────────
create table if not exists public.cms_deploys (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  commit      text not null,
  target      text,
  when_text   text,
  status      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_deploys_org_idx    on public.cms_deploys (org_id);
create index if not exists cms_deploys_tenant_idx on public.cms_deploys (org_id, tenant_id);

-- ─── 10. tasks ─────────────────────────────────────────────────────────
create table if not exists public.cms_tasks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  label       text not null,
  when_text   text,
  "group"     text,
  done        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_tasks_org_idx    on public.cms_tasks (org_id);
create index if not exists cms_tasks_tenant_idx on public.cms_tasks (org_id, tenant_id);

-- ─── 11. marketplace_listings ───────────────────────────────────────────
create table if not exists public.cms_marketplace_listings (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  tag         text,
  blurb       text,
  installed   text,
  featured    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_marketplace_listings_org_idx    on public.cms_marketplace_listings (org_id);
create index if not exists cms_marketplace_listings_tenant_idx on public.cms_marketplace_listings (org_id, tenant_id);

-- ─── 12. product_items ─────────────────────────────────────────────────
create table if not exists public.cms_product_items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  stage       text,
  meta        text,
  priority    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_product_items_org_idx    on public.cms_product_items (org_id);
create index if not exists cms_product_items_tenant_idx on public.cms_product_items (org_id, tenant_id);

-- ─── 13. product_releases ──────────────────────────────────────────────
create table if not exists public.cms_product_releases (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  version     text,
  when_text   text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_product_releases_org_idx    on public.cms_product_releases (org_id);
create index if not exists cms_product_releases_tenant_idx on public.cms_product_releases (org_id, tenant_id);

-- ─── 14. growth_channels ────────────────────────────────────────────────
create table if not exists public.cms_growth_channels (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  tenant_id    text not null default '__default__',
  slug         text not null,
  name         text not null,
  leads_label  text,
  leads        integer,
  cac          numeric(12,2),
  trend        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_growth_channels_org_idx    on public.cms_growth_channels (org_id);
create index if not exists cms_growth_channels_tenant_idx on public.cms_growth_channels (org_id, tenant_id);

-- ─── 15. growth_experiments ────────────────────────────────────────────
create table if not exists public.cms_growth_experiments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  title       text not null,
  lift        text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_growth_experiments_org_idx    on public.cms_growth_experiments (org_id);
create index if not exists cms_growth_experiments_tenant_idx on public.cms_growth_experiments (org_id, tenant_id);

-- ─── 16. deals ─────────────────────────────────────────────────────────
create table if not exists public.cms_deals (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  client      text not null,
  offer       text,
  value       numeric(12,2),
  stage       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_deals_org_idx    on public.cms_deals (org_id);
create index if not exists cms_deals_tenant_idx on public.cms_deals (org_id, tenant_id);

-- ─── 17. invoices ──────────────────────────────────────────────────────
create table if not exists public.cms_invoices (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  client      text not null,
  amount      numeric(12,2),
  due         text,
  status      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_invoices_org_idx    on public.cms_invoices (org_id);
create index if not exists cms_invoices_tenant_idx on public.cms_invoices (org_id, tenant_id);

-- ─── 18. contracts ─────────────────────────────────────────────────────
create table if not exists public.cms_contracts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  document    text not null,
  client      text,
  signed      text,
  status      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_contracts_org_idx    on public.cms_contracts (org_id);
create index if not exists cms_contracts_tenant_idx on public.cms_contracts (org_id, tenant_id);

-- ─── 19. policies ──────────────────────────────────────────────────────
create table if not exists public.cms_policies (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  updated     text,
  body        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_policies_org_idx    on public.cms_policies (org_id);
create index if not exists cms_policies_tenant_idx on public.cms_policies (org_id, tenant_id);

-- ─── 20. session_notes ─────────────────────────────────────────────────
create table if not exists public.cms_session_notes (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  tenant_id    text not null default '__default__',
  slug         text not null,
  topic        text not null,
  client_name  text,
  date_text    text,
  duration     text,
  sentiment    text,
  body         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_session_notes_org_idx    on public.cms_session_notes (org_id);
create index if not exists cms_session_notes_tenant_idx on public.cms_session_notes (org_id, tenant_id);

-- ─── 21. demo_coach_apps ───────────────────────────────────────────────
create table if not exists public.cms_demo_coach_apps (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  name        text not null,
  category    text,
  tagline     text,
  metric      text,
  story       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_demo_coach_apps_org_idx    on public.cms_demo_coach_apps (org_id);
create index if not exists cms_demo_coach_apps_tenant_idx on public.cms_demo_coach_apps (org_id, tenant_id);

-- ─── 22. demo_coach_notes ──────────────────────────────────────────────
create table if not exists public.cms_demo_coach_notes (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  tenant_id    text not null default '__default__',
  slug         text not null,
  topic        text not null,
  client_name  text,
  date_text    text,
  duration     text,
  sentiment    text,
  body         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_demo_coach_notes_org_idx    on public.cms_demo_coach_notes (org_id);
create index if not exists cms_demo_coach_notes_tenant_idx on public.cms_demo_coach_notes (org_id, tenant_id);

-- ─── 23. demo_coach_metrics ────────────────────────────────────────────
create table if not exists public.cms_demo_coach_metrics (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  tenant_id   text not null default '__default__',
  slug        text not null,
  label       text not null,
  value       numeric,
  unit        text,
  story       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists cms_demo_coach_metrics_org_idx    on public.cms_demo_coach_metrics (org_id);
create index if not exists cms_demo_coach_metrics_tenant_idx on public.cms_demo_coach_metrics (org_id, tenant_id);

-- =====================================================================
-- Touch updated_at on every UPDATE.
-- =====================================================================
create or replace function public.cms_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 25 triggers (un par table : 23 CMS + cms_items + cms_collections)
do $$
declare
  t text;
  tables text[] := array[
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
  foreach t in array tables loop
    execute format(
      'drop trigger if exists %I_touch on public.%I; '
      'create trigger %I_touch before update on public.%I '
      'for each row execute function public.cms_touch_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;

-- =====================================================================
-- Commentaire final : cette migration ne touche pas RLS, c'est la
-- migration 20260811000003_rls.sql qui le fait. Tant que cette
-- migration est appliquée seule, les tables sont en accès libre —
-- c'est volontaire (développement local sans auth), mais ATTENTION :
-- ne jamais pousser cette migration sans sa sœur 000003.
-- =====================================================================
