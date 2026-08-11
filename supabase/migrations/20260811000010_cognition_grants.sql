-- =====================================================================
-- 20260811000010_cognition_grants.sql
-- Ce qu'il manquait pour qu'un schema dedie soit REELLEMENT utilisable.
--
-- La migration 009 a bien deplace les tables dans le schema `cognition`,
-- comme le code les interroge (`client.schema('cognition')`). Mais un
-- schema cree n'est pas un schema servi : deux etapes de plus, invisibles
-- tant qu'on ne fait pas la requete par l'API.
--
-- Diagnostic mene en trois temps sur la production, chaque code disant
-- une chose differente :
--
--   406 Not Acceptable        -> PostgREST n'expose que les schemas de sa
--                                configuration. `cognition` n'y etait pas.
--                                Corrige hors SQL, par l'API de gestion :
--                                PATCH /v1/projects/<ref>/postgrest
--                                { "db_schema": "public, graphql_public, cognition" }
--
--   401 Unauthorized          -> le schema repond, RLS refuse un visiteur
--                                anonyme. Comportement voulu.
--
--   42501 permission denied   -> le role `authenticated` n'avait pas
--        for schema cognition    l'USAGE du schema. Les droits sur les
--                                tables ne suffisent pas : il faut aussi
--                                le droit d'entrer dans le schema.
--
-- C'est cette derniere marche que corrige ce fichier. Sans elle, un jeton
-- valide se heurte a un refus qui ressemble a un probleme de RLS et fait
-- chercher au mauvais endroit.
--
-- Verifie apres application : le compte de demonstration lit 7 routines,
-- 11 evenements et 4 manifestes.
-- =====================================================================

grant usage on schema cognition to authenticated, anon, service_role;

grant select, insert, update, delete on all tables in schema cognition to authenticated;
grant select                        on all tables in schema cognition to anon;

-- Les tables creees plus tard heriteront des memes droits, sinon chaque
-- ajout rejouerait le meme diagnostic a trois codes d'erreur.
alter default privileges in schema cognition
  grant select, insert, update, delete on tables to authenticated;

-- PostgREST garde un cache de schema : sans cette notification, il continue
-- de rendre 406 sur une table pourtant presente et servie. Piege paye deux
-- fois dans la meme matinee.
notify pgrst, 'reload schema';
