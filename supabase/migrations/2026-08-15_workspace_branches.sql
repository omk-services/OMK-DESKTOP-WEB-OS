-- supabase/migrations/2026-08-15_workspace_branches.sql
-- WorkSpaces versionnés : branche, snapshot, PR, review, merge.
--
-- Modèle conceptuel (cf. BRIEF_WORKSPACE_BRANCHES §Architecture) :
--   Tenant  ≈ Repository
--   Branche ≈ Workspace
--   Snapshot = Commit (sérialisation déterministe d'un workspace)
--   PR      = Pull Request (diff entre deux snapshots, 2 reviews)
--   Merge   = Merge (intégration d'une branche dans main)
--
-- Préconditions : les autres briefs (AUTH_FIX, MEMBERSHIPS, AUDIT_LOG,
-- W13_QUOTAS) sont indépendants — cette migration crée ses propres tables
-- et respecte les RLS par tenant via `tenant_id` text.

-- ──────────────────────────────────────────────────────────────────────
-- 1. Branches
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.workspace_branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  name text not null,                                    -- 'main' (immutable, default), 'presentation-prospect-x', etc.
  parent_branch_id uuid references public.workspace_branches(id),
  parent_snapshot_id uuid references public.workspace_snapshots(id),
  head_snapshot_id uuid references public.workspace_snapshots(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  is_default boolean not null default false,
  -- Un seul nom par tenant
  unique (tenant_id, name),
  -- Un seul `main` par tenant (deferred pour permettre l'insertion en cascade)
  unique (tenant_id, is_default) deferrable initially deferred
);

comment on table public.workspace_branches is
  'WorkSpaces versionnés. Une branche = une variante du main, snapshots en chaîne. main est créé à la première lecture.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. Snapshots
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.workspace_branches(id) on delete cascade,
  parent_snapshot_id uuid references public.workspace_snapshots(id),
  -- Contenu complet du workspace sérialisé : collections + items + memberships
  payload jsonb not null,
  -- Hash SHA-256 du payload pour intégrité
  payload_hash text not null,
  -- Message de commit court
  message text,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- Un seul snapshot par contenu (pour dédupliquer côté forks)
  unique (payload_hash)
);

comment on table public.workspace_snapshots is
  'Snapshots immuables d''un workspace. Hash SHA-256 du payload canonique. parent_snapshot_id chaîne.';

-- ──────────────────────────────────────────────────────────────────────
-- 3. Pull Requests
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.workspace_prs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  source_branch_id uuid not null references public.workspace_branches(id),
  target_branch_id uuid not null references public.workspace_branches(id),
  source_snapshot_id uuid not null references public.workspace_snapshots(id),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','approved','rejected','merged','closed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  -- Pas deux PR identiques ouvertes sur la même paire (source, target, snapshot)
  -- Le partial unique index ci-dessous gère le cas "fermée vs ouverte" :
  -- on autorise plusieurs PR historiques, une seule ouverte par triplet.
  constraint workspace_prs_pair_snapshot_uniq
    exclude (source_branch_id with =, target_branch_id with =, source_snapshot_id with =)
    where (status = 'open')
);

comment on table public.workspace_prs is
  'Pull Requests = diff entre deux snapshots d''un même tenant. 2 approves requis pour passer en approved.';

-- ──────────────────────────────────────────────────────────────────────
-- 4. Reviews
-- ──────────────────────────────────────────────────────────────────────

create table if not exists public.workspace_pr_reviews (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid not null references public.workspace_prs(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  verdict text not null check (verdict in ('approve','reject','comment')),
  comment text,
  created_at timestamptz not null default now(),
  -- Un seul verdict par reviewer par PR
  unique (pr_id, reviewer_id)
);

comment on table public.workspace_pr_reviews is
  'Verdicts par reviewer. 2 approves requis pour passer la PR en approved.';

-- ──────────────────────────────────────────────────────────────────────
-- 5. RLS
-- ──────────────────────────────────────────────────────────────────────

alter table public.workspace_branches enable row level security;
alter table public.workspace_snapshots enable row level security;
alter table public.workspace_prs enable row level security;
alter table public.workspace_pr_reviews enable row level security;

-- Politique : un member du tenant peut lire les branches de son tenant.
-- Écriture : owner + admin (gérée côté application via la matrice permissions.ts).
-- Détail des policies affiné par les briefs AUTH_FIX et MEMBERSHIPS.

drop policy if exists "workspace_branches_tenant_read" on public.workspace_branches;
create policy "workspace_branches_tenant_read"
  on public.workspace_branches
  for select
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = workspace_branches.tenant_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "workspace_snapshots_tenant_read" on public.workspace_snapshots;
create policy "workspace_snapshots_tenant_read"
  on public.workspace_snapshots
  for select
  using (
    exists (
      select 1 from public.workspace_branches b
      join public.memberships m on m.tenant_id = b.tenant_id
      where b.id = workspace_snapshots.branch_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "workspace_prs_tenant_read" on public.workspace_prs;
create policy "workspace_prs_tenant_read"
  on public.workspace_prs
  for select
  using (
    exists (
      select 1 from public.memberships m
      where m.tenant_id = workspace_prs.tenant_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "workspace_pr_reviews_tenant_read" on public.workspace_pr_reviews;
create policy "workspace_pr_reviews_tenant_read"
  on public.workspace_pr_reviews
  for select
  using (
    exists (
      select 1 from public.workspace_prs p
      join public.memberships m on m.tenant_id = p.tenant_id
      where p.id = workspace_pr_reviews.pr_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- ──────────────────────────────────────────────────────────────────────
-- 6. Index
-- ──────────────────────────────────────────────────────────────────────

create index if not exists workspace_branches_tenant_idx on public.workspace_branches (tenant_id);
create index if not exists workspace_branches_parent_idx on public.workspace_branches (parent_branch_id);
create index if not exists workspace_snapshots_branch_idx on public.workspace_snapshots (branch_id);
create index if not exists workspace_snapshots_parent_idx on public.workspace_snapshots (parent_snapshot_id);
create index if not exists workspace_snapshots_hash_idx on public.workspace_snapshots (payload_hash);
create index if not exists workspace_prs_tenant_idx on public.workspace_prs (tenant_id);
create index if not exists workspace_prs_source_idx on public.workspace_prs (source_branch_id);
create index if not exists workspace_prs_target_idx on public.workspace_prs (target_branch_id);
create index if not exists workspace_prs_status_idx on public.workspace_prs (status);
create index if not exists workspace_pr_reviews_pr_idx on public.workspace_pr_reviews (pr_id);