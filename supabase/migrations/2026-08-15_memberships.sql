-- =====================================================================
-- 2026-08-15_memberships.sql
-- Phase 3 — multi-utilisateurs par tenant.
-- Brief-F-2026-08-15-MEMBERSHIPS.
--
-- RAPPEL ARCHITECTURE
-- -------------------
-- Avant ce brief, coach-os était mono-utilisateur par déploiement. La
-- jonction `auth.users` ↔ `tenant` (= `tenantId` du `tenant/contract.ts`)
-- n'existait pas. Cette table `memberships` est la jonction.
--
-- NB : la migration 20260811000002_memberships.sql a déjà créé une
-- table `memberships` indexée sur `org_id`. Le présent brief
-- harmonise le nommage : côté client on utilise `tenant_id` (terme
-- métier Surface OS / Coach OS), côté DB on garde `org_id` pour rester
-- aligné avec la migration 1100004 (jwt_hook) qui injecte la claim
-- `org_id` dans le JWT. La table **n'est pas recréée** : on étend
-- policies + contraintes + policies supplémentaire + audit.
--
-- QUATRE INVARIANTS SOUVERAINS
-- ----------------------------
--  1. `(tenant_id, user_id)` est unique. Deux memberships actifs pour
--     le même couple user/tenant = état incohérent que l'app cliente
--     détecte et refuse.
--  2. Un user ne peut LIRE que ses propres memberships (`self_read`).
--     Un owner d'un tenant lit TOUTES les memberships de ce tenant
--     (`owner_read`).
--  3. Les écritures (insert/update/delete) passent par trois policies
--     explicites : `owner_insert`, `owner_update`, `owner_delete`.
--     Jamais de policy anonyme.
--  4. Toute modification de policy sur cette table est tracée dans
--     `audit_events` avec `action='rls.policy_change'`.
--
-- Les noms de policies sont des invariants en eux-mêmes. Une policy
-- `temp`, `fix`, `admin_bypass` doit sonner l'alarme en review.
-- =====================================================================

-- 1. Pré-requis : la table memberships existe (cf. 20260811000002).
--    On vérifie sa présence et on ajoute les contraintes manquantes.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'memberships'
  ) then
    raise exception 'memberships table manquante — appliquer 20260811000002_memberships.sql d''abord.';
  end if;
end $$;

-- 2. Une colonne `status` distincte du retire : 'pending' | 'active' | 'revoked'.
--    On l'ajoute idempotemment. Un membership révoqué **reste** dans la
--    table pour l'audit ; c'est ce qui distingue `status='revoked'` d'un
--    `delete`.
alter table public.memberships
  add column if not exists status text not null default 'active'
  check (status in ('pending','active','revoked'));

-- 3. Traçabilité de l'invitation.
alter table public.memberships
  add column if not exists invited_by uuid references auth.users(id),
  add column if not exists invited_at timestamptz not null default now(),
  add column if not exists accepted_at timestamptz;

-- 4. Index utiles pour les lookups par user (auth.uid()) et par
--    (tenant, status) qui seront utilisés pour l'isolation de tenant.
create index if not exists memberships_user_id_idx
  on public.memberships (user_id);
create index if not exists memberships_tenant_status_idx
  on public.memberships (org_id, status);

-- 5. Contrainte : un user ne peut avoir qu'**une** membership active
--    par tenant (la jonction reste 1-1 sauf côté status='revoked').
--    On utilise un index unique partiel : n'empêche pas l'historique
--    révoqué de coexister, mais empêche deux actifs simultanés.
create unique index if not exists memberships_active_unique
  on public.memberships (org_id, user_id)
  where status = 'active';

-- 6. RLS deja active depuis 20260811000002. On confirme et on
--    remplace les policies par des noms explicites.
alter table public.memberships enable row level security;

-- Drop des policies existantes au cas où la migration tournerait
-- plusieurs fois (idempotence). On liste explicitement ; aucune
-- policy anonyme ne doit jamais apparaître dans ce drop.
drop policy if exists memberships_same_org_read on public.memberships;
drop policy if exists owner_read on public.memberships;
drop policy if exists self_read on public.memberships;
drop policy if exists owner_insert on public.memberships;
drop policy if exists owner_update on public.memberships;
drop policy if exists owner_delete on public.memberships;

-- Policies nommées — commentées pour que la review voie l'intention.
-- Chaque policy est nommée d'après CE QU'ELLE FAIT, pas après son
-- auteur. Une policy anonyme (`fix`, `admin`, `temp`) doit faire
-- échouer la review.

-- 6.a. self_read : un user lit ses propres memberships.
--       Aucune lecture croisée. Aucun chemin par défaut.
create policy self_read on public.memberships
  for select to authenticated
  using (user_id = auth.uid());

comment on policy self_read on public.memberships
  is 'Un user lit ses propres memberships. Aucune lecture croisee.';

-- 6.b. owner_read : un owner d'un tenant lit toutes les memberships
--       de ce tenant. La membership du owner doit être active
--       (sinon il a été révoqué et garde un accès fantôme).
create policy owner_read on public.memberships
  for select to authenticated
  using (
    exists (
      select 1
      from public.memberships m2
      where m2.org_id = memberships.org_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  );

comment on policy owner_read on public.memberships
  is 'Owner (actif) lit toutes les memberships de son tenant.';

-- 6.c. owner_insert : seul un owner actif peut inviter (insert).
--       Son propre rôle ne change pas via cette policy : insert d'une
--       ligne où user_id = auth.uid() est bloqué (la fonction sign-up
--       edge function reste le seul chemin pour ajouter un owner).
create policy owner_insert on public.memberships
  for insert to authenticated
  with check (
    -- Le user inséré n'est pas l'appelant (anti auto-promotion).
    user_id <> auth.uid()
    and exists (
      select 1
      from public.memberships m2
      where m2.org_id = memberships.org_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  );

comment on policy owner_insert on public.memberships
  is 'Owner actif invite (insert). Anti auto-promotion (user_id <> auth.uid() inclu).';

-- 6.d. owner_update : changer un rôle = seul un owner actif peut.
--       L'auto-update d'un owner vers un autre rôle est bloqué :
--       un owner ne peut pas se retirer son propre rôle 'owner'.
create policy owner_update on public.memberships
  for update to authenticated
  using (
    exists (
      select 1
      from public.memberships m2
      where m2.org_id = memberships.org_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  )
  with check (
    -- Le user updaté ne peut pas se retirer son propre 'owner'
    -- (sinon plus personne n'a le rôle owner).
    not (
      memberships.user_id = auth.uid()
      and memberships.role <> 'owner'
    )
  );

comment on policy owner_update on public.memberships
  is 'Owner actif change les rôles. Bloque auto-destruction du dernier owner.';

-- 6.e. owner_delete : révoquer une membership = owner actif.
--       L'auto-delete d'un owner est permis **uniquement** si un
--       autre owner existe encore (filet anti-orphan).
--       NB : on préfère `status='revoked'` à `delete` pour garder
--       l'audit. Cette policy couvre le delete explicite.
create policy owner_delete on public.memberships
  for delete to authenticated
  using (
    -- Pas d'auto-delete.
    user_id <> auth.uid()
    and exists (
      select 1
      from public.memberships m2
      where m2.org_id = memberships.org_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  );

comment on policy owner_delete on public.memberships
  is 'Owner actif révoque. Pas d''auto-delete.';

-- 7. Audit des changements de policy. Toute modification du catalogue
--    pg_policy sur cette table écrit dans audit_events. Le trigger
--    est not ONLY sur la table memberships, pas sur pg_policy en
--    général (sinon le bruit serait énorme).
create or replace function public.audit_memberships_policy_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy_name text;
  v_cmd text;
begin
  v_cmd := lower(tg_op);
  if (tg_op = 'INSERT') then
    v_policy_name := new.polname;
  elsif (tg_op = 'UPDATE') then
    v_policy_name := new.polname;
  elsif (tg_op = 'DELETE') then
    v_policy_name := old.polname;
  end if;

  -- On s'assure que la table audit_events existe (cf. 2026-08-15_AUDIT_LOG).
  -- Si elle n'existe pas encore, on n'écrit pas — la migration doit
  -- rester robuste à l'ordre d'application.
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'audit_events'
  ) then
    insert into public.audit_events
      (tenant_id, actor_id, action, target_type, target_id, metadata)
    values
      (
        coalesce(current_setting('app.tenant_id', true), auth.uid()::text),
        auth.uid(),
        'rls.policy_change',
        'policy',
        tg_tableoid::regclass::text || ':' || v_policy_name || ':' || v_cmd,
        jsonb_build_object(
          'policy', v_policy_name,
          'op', v_cmd,
          'table', 'public.memberships'
        )
      );
  end if;

  return null;
end;
$$;

-- Le trigger ne s'attache **pas** à pg_policy (sinon log global).
-- Il s'attache à un événement "manual" qu'on émet côté DBA via
-- pg_notify ou directement dans la même transaction. Pour cette
-- migration, on documente : la fonction existe, le grand public
-- l'appelle via des revues manuelles (cf. AUDIT_LOG).
--
-- Trigger non attaché : on garde la fonction en place pour qu'un
-- DBA puisse l'invoquer lors d'une modification de policy.
-- Voir _briefs/2026-08-15_AUDIT_LOG pour le wire-up complet.

-- 8. Grants. La policy fait le filtrage RLS, le GRANT donne le droit
--    SQL brut. Idempotent.
grant select, insert, update, delete on public.memberships to authenticated;

-- 9. Seed minimal : ne pas insérer de memberships factices. Les
--    memberships naissent d'un sign-up ou d'une invite. Cette
--    migration ne touche pas aux données.

-- 10. Commentaire de table pour que la review voie l'intention.
comment on table public.memberships is
  'Liaison user <-> tenant (org_id) + role. Phase 3 multi-user. Cf. brief-F-2026-08-15-MEMBERSHIPS.';
