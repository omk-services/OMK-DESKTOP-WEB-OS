-- 2026-08-17 — CUSTOMERS devient le backend reel de Coach OS.
--
-- CONTEXTE
-- Decision du 2026-08-17 : les deux projets Supabase changent de role.
--   INTERN    (sgzbkhqqkqdwhakkyzzm) -> backend du FORK DEMO. Intact, garde
--                                       ses 98 lignes de fixtures et ses
--                                       3 comptes. On n'y touche pas.
--   CUSTOMERS (ndvqwcapwcnpdvknxcjw) -> backend de COACH OS REEL. Schema
--                                       complet, AUCUNE donnee de demo.
--
-- POURQUOI CETTE MIGRATION EXISTE PLUTOT QUE `20260811000002_memberships.sql`
-- Ce fichier d'origine cree `organizations`, `profiles` ET `memberships`,
-- puis pose `create index memberships_org_idx on memberships (org_id)`.
--
-- Or `memberships` existe deja sur CUSTOMERS, et il porte `tenant_id` — pas
-- `org_id`. Le `create table if not exists` aurait ete ignore (tant mieux),
-- mais l'index aurait echoue sur une colonne inexistante, laissant la
-- migration a moitie jouee. On extrait donc uniquement ce qui manque, en
-- respectant la convention `tenant_id` de ce projet.
--
-- IDEMPOTENTE : rejouable sans dommage.

begin;

-- ------------------------------------------------------- 1. les deux tables

create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
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

alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;

-- --------------------------------------------------------- 2. les policies

-- DEUX SYSTEMES D'IDENTIFIANT COEXISTENT, ET IL FAUT LE SAVOIR
--
--   memberships.tenant_id  est de type TEXT  — le code raisonne en slugs
--                          (`TenantId` dans src/lib/tenant/contract.ts vaut
--                          '__default__', 'demo-coach', …)
--   cms_*.org_id           est de type UUID  — c'est ce que compare
--                          `jwt_org_id()` dans les policies des 25 tables
--
-- Les relier par `id = tenant_id` echoue : `operator does not exist:
-- uuid = text`. Caster a l'aveugle masquerait le probleme au lieu de le
-- resoudre.
--
-- On passe donc par `organizations.slug`, qui est TEXT et qui existe
-- justement pour ca. C'est le pont semantiquement juste : un membre voit
-- l'organisation dont le SLUG correspond au tenant de son adhesion.
--
-- La divergence de fond — deux vocabulaires pour la meme notion — reste a
-- trancher. Elle est consignee dans
-- `_briefs/2026-08-17_APPS_IFRAME/` : tant que le code parle slug et que la
-- RLS parle uuid, chaque nouvelle table devra choisir un camp.
drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read on public.organizations
  for select to authenticated
  using (
    slug in (
      select m.tenant_id from public.memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Un utilisateur doit pouvoir creer sa propre fiche a la premiere connexion,
-- sinon `profiles` reste vide et l'app ne sait jamais afficher un nom.
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

commit;

-- ----------------------------------------------------------- ANNULATION
--
-- begin;
--   drop policy if exists profiles_self_insert       on public.profiles;
--   drop policy if exists profiles_self_update       on public.profiles;
--   drop policy if exists profiles_self_read         on public.profiles;
--   drop policy if exists organizations_member_read  on public.organizations;
--   drop table if exists public.profiles;
--   drop table if exists public.organizations;
-- commit;
