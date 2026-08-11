-- =====================================================================
-- 20260811000002_memberships.sql
-- Auth boundary tables. Brief-F-2026-08-11.
--
-- Trois tables, séparation stricte :
--   - organizations : l'entité cliente (un coach = une org, plus tard un
--     cabinet = une org, plus tard un SaaS tenant = une org)
--   - profiles : ligne 1-1 avec auth.users, porte l'affichage
--   - memberships : la liaison user ↔ org + role
--
-- La frontière de sécurité RLS est org_id. Pas user_id, pas
-- tenant_id applicatif. C'est ce que le custom_access_token_hook
-- (migration 000004) injecte dans le JWT.
-- =====================================================================

create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,                    -- ex. 'demo-coach', 'omk-internal'
  display_name  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  org_id        uuid not null references public.organizations(id) on delete cascade,
  role          text not null default 'member',  -- 'owner' | 'admin' | 'member'
  created_at    timestamptz not null default now(),
  unique (user_id, org_id)
);
create index if not exists memberships_user_idx on public.memberships (user_id);
create index if not exists memberships_org_idx  on public.memberships (org_id);

-- Trigger updated_at pour les trois
create trigger organizations_touch before update on public.organizations
  for each row execute function public.cms_touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.cms_touch_updated_at();
-- memberships a un created_at only, pas d'updated_at nécessaire

-- =====================================================================
-- RLS minimale sur ces trois tables :
--   - organizations : SELECT pour les membres de l'org, INSERT/UPDATE
--     réservé au rôle SQL (sign-up edge function).
--   - profiles : SELECT pour soi-même, UPDATE pour soi-même.
--   - memberships : SELECT pour les membres de la même org, INSERT
--     réservé au rôle SQL.
-- L'isolation adverse (un user org A ne lit pas un user org B) est
-- portée par la policy memberships + JWT claim. Le test est dans
-- VERIFICATION_RLS.md.
-- =====================================================================

alter table public.organizations enable row level security;
alter table public.profiles    enable row level security;
alter table public.memberships enable row level security;

create policy organizations_member_read on public.organizations
  for select using (
    id = (select org_id from public.memberships m
          where m.user_id = auth.uid() limit 1)
  );

create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy memberships_same_org_read on public.memberships
  for select using (
    org_id = (select org_id from public.memberships m
              where m.user_id = auth.uid() limit 1)
  );

-- Aucun INSERT/UPDATE/DELETE policy : ces opérations passent par le
-- service role (sign-up-organization edge function). Côté client, un
-- utilisateur ne peut pas s'ajouter à une org. Côté DB, le hook JWT
-- reste le seul chemin d'écriture.

-- Helper lu par le hook JWT (voir 20260811000004_jwt_hook.sql).
-- Résout l'org d'un user. Si plusieurs orgs, on prend la première
-- (l'app cliente gère le switch tenant via useTenantStore).
create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.memberships
  where user_id = auth.uid()
  order by created_at asc
  limit 1
$$;

grant execute on function public.current_org_id to authenticated;
