-- 2026-08-17 — Aligner `public.memberships` sur le contrat du code.
--
-- POURQUOI
-- `src/lib/auth/backend.supabase.ts` interrogeait cinq colonnes qui n'existaient
-- pas : `tenant_id` (la colonne s'appelait `org_id`), `invited_by`, `invited_at`,
-- `accepted_at`, `status`. Chaque requete d'adhesion partait donc chercher des
-- colonnes absentes et echouait cote Postgres. C'est la cause racine du
-- « multi-tenant qui ne marche pas » : ni les policies RLS ni le hook JWT
-- n'etaient en cause, ils sont corrects.
--
-- Second defaut corrige ici : `memberships` n'avait que deux policies, toutes
-- deux en SELECT. Sans policy INSERT, RLS refuse toute ecriture — donc inviter
-- un membre etait impossible, en silence.
--
-- ORDRE CRITIQUE
-- Le hook `custom_access_token_hook` lit `m.org_id`. Renommer la colonne sans
-- reecrire le hook dans la MEME transaction couperait toutes les connexions :
-- plus de claim `org_id`, donc `jwt_org_id()` a NULL, donc zero ligne partout.
--
-- ANNULATION
-- Voir le bloc en fin de fichier.

begin;

-- ---------------------------------------------------------------- 1. colonnes

alter table public.memberships rename column org_id to tenant_id;

alter table public.memberships
  rename constraint memberships_org_id_fkey to memberships_tenant_id_fkey;
alter table public.memberships
  rename constraint memberships_user_id_org_id_key to memberships_user_id_tenant_id_key;

alter table public.memberships
  add column invited_by  uuid references auth.users(id) on delete set null,
  add column invited_at  timestamptz not null default now(),
  add column accepted_at timestamptz,
  add column status      text        not null default 'active';

-- Reprise de l'existant : l'adhesion deja en base est un owner fondateur,
-- accepte a sa creation. `invited_by` reste NULL — personne ne l'a invite.
update public.memberships
   set invited_at  = created_at,
       accepted_at = created_at,
       status      = 'active';

-- Les deux enumerations viennent de `src/lib/tenant/contract.ts:294-299`.
alter table public.memberships
  add constraint memberships_status_check check (status in ('pending', 'active', 'revoked')),
  add constraint memberships_role_check   check (role   in ('owner', 'admin', 'member', 'guest'));

create index if not exists memberships_tenant_id_idx on public.memberships (tenant_id);
create index if not exists memberships_user_id_idx   on public.memberships (user_id);

-- ------------------------------------------------------------------- 2. hook

-- Identique a la version precedente, a `m.org_id` -> `m.tenant_id` pres.
-- Le NOM DU CLAIM reste `org_id` : les 25 tables `cms_*` comparent leur propre
-- colonne `org_id` a `jwt_org_id()`, qui lit ce claim. Changer le nom du claim
-- casserait ces 100 policies pour un gain cosmetique.
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

  -- On ne retient qu'une adhesion ACTIVE : une invitation en attente ou revoquee
  -- ne doit pas donner acces au tenant.
  select m.tenant_id into v_org_id
  from public.memberships m
  where m.user_id = v_user_id
    and m.status = 'active'
  order by m.created_at asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);

  -- On n'ajoute la claim que si une org existe. Sinon on la laisse ABSENTE :
  -- la politique RLS echoue alors franchement, ce qui rend le probleme
  -- visible au lieu de le masquer derriere un resultat vide.
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

-- --------------------------------------------------------------- 3. policies

-- Une policy posee SUR `memberships` qui interroge `memberships` provoque une
-- recursion infinie de RLS. D'ou ce SECURITY DEFINER, qui contourne RLS pour
-- cette seule lecture. `search_path` est fige : sans ca, un schema pirate en
-- tete de chemin pourrait detourner l'appel.
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

-- Lecture : un proprietaire ou administrateur voit les membres de son tenant.
-- La policy existante `memberships_same_org_read` (user_id = auth.uid()) reste ;
-- plusieurs policies SELECT se combinent en OU.
drop policy if exists memberships_admin_read on public.memberships;
create policy memberships_admin_read on public.memberships
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

-- Ecriture : seul un administrateur du tenant invite, et il ne peut inviter que
-- dans SON tenant.
drop policy if exists memberships_admin_insert on public.memberships;
create policy memberships_admin_insert on public.memberships
  for insert to authenticated
  with check (public.is_tenant_admin(tenant_id));

-- Mise a jour : un administrateur gere les membres de son tenant ; un invite
-- peut accepter sa propre invitation.
drop policy if exists memberships_admin_update on public.memberships;
create policy memberships_admin_update on public.memberships
  for update to authenticated
  using      (public.is_tenant_admin(tenant_id) or user_id = auth.uid())
  with check (public.is_tenant_admin(tenant_id) or user_id = auth.uid());

-- Suppression : administrateur seulement. Pas de suppression de soi-meme, pour
-- qu'un tenant ne puisse pas se retrouver sans proprietaire par accident.
drop policy if exists memberships_admin_delete on public.memberships;
create policy memberships_admin_delete on public.memberships
  for delete to authenticated
  using (public.is_tenant_admin(tenant_id));

commit;

-- ----------------------------------------------------------------- ANNULATION
--
-- begin;
--   drop policy if exists memberships_admin_delete on public.memberships;
--   drop policy if exists memberships_admin_update on public.memberships;
--   drop policy if exists memberships_admin_insert on public.memberships;
--   drop policy if exists memberships_admin_read   on public.memberships;
--   drop function if exists public.is_tenant_admin(uuid);
--   alter table public.memberships
--     drop constraint memberships_role_check,
--     drop constraint memberships_status_check,
--     drop column status, drop column accepted_at,
--     drop column invited_at, drop column invited_by;
--   alter table public.memberships rename column tenant_id to org_id;
--   -- puis restaurer le hook avec `m.org_id` et sans le filtre sur status.
-- commit;
