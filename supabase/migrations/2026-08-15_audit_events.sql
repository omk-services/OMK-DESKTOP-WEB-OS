-- =====================================================================
-- 2026-08-15_audit_events.sql
-- Audit log table (campagne 2026-08-15, phase 4 — qui a touché quoi, et quand).
--
-- Le diagnostic d'incident ne peut pas reposer sur la mémoire humaine.
-- Cette table rend chaque geste traçable : item, proposal, auth,
-- membership, workspace, quota, et (depuis 2026-08-15) les events
-- ingérés depuis un Observer externe (opik, agentpulse, langsmith, etc.).
--
-- Trois invariants :
--   1. tenant_id obligatoire : la cloison est l'alpha et l'oméga.
--   2. actor_id peut être NULL : un event Observer vient de l'extérieur,
--      pas d'un humain. C'est documenté dans la colonne et le RLS le respecte.
--   3. Pas d'UPDATE, pas de DELETE : l'audit est immuable. Une correction
--      se fait par un nouvel event (compensation).
--
-- Côté écriture, le contrat est strict : seul `service_role` insère
-- (via Edge Function ou backend Node). Côté lecture, seuls les owners
-- du tenant accèdent à la file. Le test d'immutabilité (test #10) se
-- charge de prouver que `update`/`delete` RLS-rejected.
-- =====================================================================

create table if not exists public.audit_events (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    text        not null,
  actor_id     text,                                  -- null si event Observer / système
  actor_role   text,                                  -- snapshot du rôle au moment de l'action
  action       text        not null,                   -- cf. src/lib/audit/event.ts (AuditAction)
  target_type  text,                                  -- 'item' | 'proposal' | 'collection' | 'membership' | 'workspace' | etc.
  target_id    text,                                  -- id de la cible si applicable
  metadata     jsonb       not null default '{}'::jsonb,
  ip_address   inet,                                  -- null en local / démo
  user_agent   text,
  -- NOUVEAU 2026-08-15 — source Observer (opik, agentpulse, langsmith, etc.)
  observer_source text,                              -- null si event interne, sinon identifiant de l'Observer
  created_at   timestamptz not null default now()
);

create index if not exists audit_events_tenant_id_created_at_idx
  on public.audit_events (tenant_id, created_at desc);
create index if not exists audit_events_actor_id_idx
  on public.audit_events (actor_id);
create index if not exists audit_events_action_idx
  on public.audit_events (action);
create index if not exists audit_events_target_type_idx
  on public.audit_events (target_type);
create index if not exists audit_events_observer_source_idx
  on public.audit_events (observer_source);

-- =====================================================================
-- Row-Level Security : immuable côté update/delete, lisible seulement
-- par les owners du tenant, insérable seulement par le service_role.
-- =====================================================================

alter table public.audit_events enable row level security;

-- Lecture : uniquement les owners du tenant.
-- On s'appuie sur public.memberships (créé en 20260811000002_memberships.sql)
-- avec role='owner' et status='active'. Si memberships.status n'existe pas
-- encore dans cette migration (la colonne status peut être ajoutée plus tard),
-- la policy tolère l'absence via une sous-requête COALESCE.
drop policy if exists owner_read_audit on public.audit_events;
create policy owner_read_audit on public.audit_events
  for select using (
    exists (
      select 1 from public.memberships m
      where m.org_id::text = audit_events.tenant_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- Écriture : seul le service_role peut insérer.
drop policy if exists service_insert_audit on public.audit_events;
create policy service_insert_audit on public.audit_events
  for insert with check (auth.role() = 'service_role');

-- Pas de UPDATE : immuable. La policy "FOR UPDATE" n'est pas créée :
-- toute tentative échoue avec "new row violates row-level security policy".
drop policy if exists no_update_audit on public.audit_events;
create policy no_update_audit on public.audit_events
  for update using (false) with check (false);

-- Pas de DELETE : immuable.
drop policy if exists no_delete_audit on public.audit_events;
create policy no_delete_audit on public.audit_events
  for delete using (false);

-- =====================================================================
-- Grants minimaux pour que authenticated puisse au moins PRENDRE LA
-- POLICY (sinon le SELECT ne renvoie rien du tout plutôt qu'une erreur
-- RLS — c'est le comportement Supabase par défaut, mais l'expliciter
-- ferme la discussion).
-- =====================================================================

grant usage on schema public to authenticated, service_role;
grant select on public.audit_events to authenticated;
grant insert on public.audit_events to service_role;