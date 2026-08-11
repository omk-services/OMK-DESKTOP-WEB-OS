-- =====================================================================
-- 20260811000007_cognition.sql
-- Les trois tables de l'app Cognition, oubliees par la campagne du 11 aout.
--
-- Decouvertes en auditant la PRODUCTION, pas le local : en local Supabase
-- n'est pas configure, l'app retombe sur son seed et ne demande rien. En
-- ligne elle interroge vraiment, et PostgREST rend 406 sur une table
-- inexistante. Quatre erreurs console qui n'apparaissaient nulle part
-- ailleurs.
--
-- `routines` etait deja dans les douze requetes en echec du debut de nuit.
-- On avait corrige le projet cible sans voir que la table, elle, n'existait
-- dans aucun des deux.
--
-- Schema deduit des requetes reelles de `src/lib/cognition/queries.ts` —
-- chaque colonne ci-dessous est nommee dans un `.select()` ou un `.eq()`.
-- =====================================================================

create table if not exists public.routines (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  cadence         text,
  time_of_day     time,
  prompt_template text,
  skills_invoked  jsonb default '[]'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  event_type  text not null,
  member      text,
  payload     jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.yggdrasil_manifest (
  id                            uuid primary key default gen_random_uuid(),
  org_id                        uuid not null references public.organizations(id) on delete cascade,
  graph_version                 integer not null default 1,
  source_scope                  text,
  knowledge_sovereignty_score   numeric(5,2),
  next_review_at                timestamptz,
  created_at                    timestamptz not null default now()
);

-- Toutes les lectures filtrent sur org_id : l'index n'est pas un ornement.
create index if not exists routines_org_idx           on public.routines(org_id);
create index if not exists events_org_idx             on public.events(org_id);
create index if not exists events_org_type_idx        on public.events(org_id, event_type);
create index if not exists yggdrasil_org_idx          on public.yggdrasil_manifest(org_id);

-- ---------------------------------------------------------------------
-- RLS — meme regle que les 28 autres tables : isolation par le claim JWT.
-- `jwt_org_id()` rend NULL quand le claim est absent, ce qui fait echouer
-- la politique. Ferme par defaut, jamais ouvert par accident.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['routines','events','yggdrasil_manifest'] loop
    execute format('alter table public.%I enable row level security;', t);

    execute format($f$
      create policy %1$I_select on public.%1$I
        for select to authenticated using (org_id = public.jwt_org_id());
    $f$, t);

    execute format($f$
      create policy %1$I_insert on public.%1$I
        for insert to authenticated with check (org_id = public.jwt_org_id());
    $f$, t);

    execute format($f$
      create policy %1$I_update on public.%1$I
        for update to authenticated using (org_id = public.jwt_org_id())
        with check (org_id = public.jwt_org_id());
    $f$, t);

    execute format($f$
      create policy %1$I_delete on public.%1$I
        for delete to authenticated using (org_id = public.jwt_org_id());
    $f$, t);

    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end $$;
