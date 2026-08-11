-- =====================================================================
-- 20260811000009_cognition_schema.sql
-- Reparation du schema des tables Cognition.
--
-- La migration 20260811000007_cognition.sql a cree les tables dans
-- `public` (routines, events, yggdrasil_manifest), mais le code
-- TypeScript dans src/lib/cognition/queries.ts les interroge via
-- `client.schema('cognition').from('routines')`. Resultat : 406
-- Not Acceptable sur chaque `maybeSingle()` de la version en ligne,
-- parce que `cognition.routines` n'existe pas.
--
-- Cette migration deplace les tables dans le schema `cognition` et
-- reattache RLS, grants et index. A executer apres 20260811000007 et
-- avant 20260811000008_cognition_seed.sql pour que le seed remplisse
-- les bonnes tables.
-- =====================================================================

-- Schema dedie — la couche Cognition merite son propre namespace, comme
-- `cognition` apparait comme une application a part entiere (Brief N).
create schema if not exists cognition;

-- Etape 1 : reattacher les tables existantes au nouveau schema.
-- `alter table ... set schema` est la voie la plus sure : elle preserve
-- les donnees, les contraintes, les index et les policies RLS.
alter table if exists public.routines            set schema cognition;
alter table if exists public.events              set schema cognition;
alter table if exists public.yggdrasil_manifest  set schema cognition;

-- Etape 2 : reaffirmer les grants (le `set schema` les preserve
-- theoriquement, mais on redonne explicitement pour les nouveaux
-- deploys).
do $$
declare t text;
begin
  foreach t in array array['routines','events','yggdrasil_manifest'] loop
    execute format('grant select, insert, update, delete on cognition.%I to authenticated;', t);
    execute format('grant select, insert, update, delete on cognition.%I to anon;', t);
  end loop;
end $$;

-- Etape 3 : informer PostgREST. Sans cette ligne, le cache garde
-- l'ancien schema et renvoie 404 `relation does not exist` au prochain
-- appel sur cognition.routines.
notify pgrst, 'reload schema';
