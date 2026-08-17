-- Le hook JWT ne pouvait pas lire memberships : toute authentification
-- echouait en 500.
--
-- Symptome, identique pour Google et pour le courriel :
--   500: Error running hook URI: pg-functions://postgres/public/custom_access_token_hook
--   ERROR: permission denied for table memberships (SQLSTATE 42501)
--
-- Cause. Le hook s'execute sous le role supabase_auth_admin. Une policy
-- `memberships_auth_admin_read` (SELECT, USING true) l'autorisait deja --
-- mais le GRANT sur la table manquait. Postgres verifie le privilege
-- AVANT la policy : sans GRANT, la policy n'est jamais evaluee. Une
-- policy presente sans son GRANT donne donc toutes les apparences d'une
-- configuration correcte.
--
-- Consequence en cascade, plus vicieuse que l'echec lui-meme : l'erreur
-- du hook fait echouer la transaction de GoTrue. La creation
-- d'utilisateur et la confirmation d'adresse etaient donc annulees apres
-- coup. Le journal montrait plusieurs `user_signedup` reussis alors que
-- auth.users ne contenait qu'un seul compte, jamais confirme -- et le
-- lien recu par courriel semblait sans effet alors qu'il fonctionnait.
--
-- Verification : cliquer le lien de confirmation, ou se connecter par
-- Google. Le journal auth ne doit plus porter aucune ligne
-- « Hook errored out ».

grant usage on schema public to supabase_auth_admin;
grant select on table public.memberships to supabase_auth_admin;

-- Le hook n'a rien a faire dans les mains d'un role client.
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
