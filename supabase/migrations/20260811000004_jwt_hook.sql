-- =====================================================================
-- 20260811000004_jwt_hook.sql
-- custom_access_token_hook — injecte org_id dans le JWT.
--
-- Brief-F-2026-08-11, §"Le piege a desamorcer d'abord" : sans hook
-- provisionné, le claim est null, les policies RLS refusent tout,
-- les requêtes renvoient zéro ligne en silence.
--
-- Cette migration DÉFINIT la fonction SQL ; elle ne l'ACTIVE PAS
-- dans Supabase. L'activation se fait dans le Dashboard :
--   Authentication → Hooks → Custom Access Token → Enable
--   → Function: public.custom_access_token_hook
-- La procédure exacte est dans VERIFICATION_RLS.md.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Trois defauts corriges apres test reel sur le projet INTERN
-- (PostgreSQL 17.6). Aucun n'apparait a la CREATION : PL/pgSQL ne valide
-- son corps qu'a l'EXECUTION. « Success » en vert ne prouvait donc rien,
-- et le hook aurait echoue a chaque connexion.
--
--  1. Les variables locales s'appelaient `user_id` et `org_id`, comme les
--     colonnes de `memberships`. Mesure : ERROR 42702 « column reference
--     "user_id" is ambiguous ». Prefixe `v_` desormais.
--  2. `to_jsonb('coach-os-jwt-hook')` sur un litteral non type. Mesure :
--     ERROR 42804 « could not determine polymorphic type because input has
--     type unknown ». Cast `::text` ajoute.
--  3. `jsonb_set` ne cree pas un parent absent : si `app_metadata` manque
--     des claims, le tampon d'origine etait perdu en silence. Le parent est
--     maintenant garanti avant l'ecriture.
-- ---------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims     jsonb;
  v_user_id  uuid;
  v_org_id   uuid;
begin
  -- event shape (Supabase): { "user_id": "<uuid>", "claims": {...} }
  v_user_id := (event->>'user_id')::uuid;

  -- Recupere la premiere org de l'utilisateur. L'app cliente gere le
  -- changement de tenant ; cote base on prend la plus ancienne par defaut.
  select m.org_id into v_org_id
  from public.memberships m
  where m.user_id = v_user_id
  order by m.created_at asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);

  -- On n'ajoute la claim que si une org existe. Sinon on la laisse ABSENTE :
  -- la politique RLS echoue alors franchement, ce qui rend le probleme
  -- visible au lieu de le masquer derriere un resultat vide.
  if v_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(v_org_id::text));
  end if;

  -- Tampon d'origine, utile a l'audit. Le parent doit exister avant que
  -- `jsonb_set` puisse ecrire dedans.
  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;
  claims := jsonb_set(claims, '{app_metadata,provider}', to_jsonb('coach-os-jwt-hook'::text));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Seul supabase_auth_admin a le droit d'appeler cette fonction.
-- (C'est l'utilisateur système utilisé par GoTrue.)
revoke all on function public.custom_access_token_hook from public;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;

-- Commentaire : la fonction est idempotente, replace la met à jour
-- si elle existe déjà. À chaque changement, vérifier que la signature
-- reste (event jsonb) → jsonb : Supabase ne supporte que cette forme.
comment on function public.custom_access_token_hook is
  'JWT custom_access_token_hook for Coach OS. Injecte org_id depuis '
  'public.memberships. Sans activation Dashboard, les policies RLS '
  'renvoient zéro ligne — voir VERIFICATION_RLS.md.';
