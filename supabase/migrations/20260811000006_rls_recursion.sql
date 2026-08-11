-- =====================================================================
-- 20260811000006_rls_recursion.sql
-- Casser la recursion RLS sur memberships et organizations.
--
-- Brief-H-2026-08-11 §Tache 1. Le defaut : deux policies interrogent
-- `public.memberships` depuis leur propre clause USING, ce qui declenche
-- la policy de `memberships`, qui re-interroge `memberships`, etc.
-- PostgreSQL rend HTTP 500 + code 42P17 sur la premiere requete
-- REST et la couche entiere tombe (cf. SOCLE.md §Le defaut bloquant).
--
-- Les cinq migrations precedentes passent toutes sans erreur — le
-- defaut n'apparait qu'a l'execution. Ne pas se fier au « Success »
-- vert en sortie de migration.
--
-- Solution : Voie A du brief. Deux principes :
--   1. Une policy sur `memberships` ne lit JAMAIS `memberships`. Elle
--      utilise `user_id = auth.uid()` directement — un user ne voit
--      que ses propres appartenances. C'est suffisant : le claim
--      `org_id` du JWT porte deja l'isolation pour les 25 autres
--      tables via `jwt_org_id()`.
--   2. Une policy sur `organizations` lit le claim JWT, pas la base.
--      `id = jwt_org_id()` ne declenche aucune RLS.
--
-- Pourquoi pas Voie B (fonction SECURITY DEFINER) : la fonction
-- `current_org_id()` existe deja et elle contourne RLS. Mais elle
-- le fait sur 100% des evaluations, ce qui transforme chaque hit
-- policy en chemin privilegie. La Voie A reserve le chemin
-- privilegie au seul hook JWT (deja deploye, deja verifie) et laisse
-- les policies publiques travailler sur des claims auto-verifies.
--
-- Verification : apres application, la requete
--   GET /rest/v1/organizations?select=id&limit=3
-- doit passer de HTTP 500 / code 42P17 a une reponse JSON valide
-- (tableau vide acceptable, liste non vide acceptable).
-- =====================================================================

-- =====================================================================
-- Etape 1 : memberships. DROP puis recriture avec `user_id = auth.uid()`.
-- Avantage : pas de recursion, pas de chemin privilegie, comportement
-- explicite ("un user voit ses propres lignes, point").
--
-- Pourquoi ne pas utiliser `current_org_id()` ici : cette fonction
-- SELECT sur memberships avec SECURITY DEFINER. Si on l'appelait depuis
-- une policy sur memberships, on aurait : policy -> fonction SD ->
-- memberships sans RLS -> retour org_id -> policy USING. C'est
-- circulaire en lecture logique et pourrait masquer des bugs futurs
-- si quelqu'un ajoute un trigger BEFORE SELECT ou change la SD.
-- `user_id = auth.uid()` n'a aucune de ces fragilites.
-- =====================================================================

drop policy if exists memberships_same_org_read on public.memberships;

create policy memberships_same_org_read on public.memberships
  for select to authenticated using (user_id = auth.uid());

-- =====================================================================
-- Etape 2 : organizations. DROP puis recriture via claim JWT.
-- Avantage : alignement exact sur le modele "JWT porte l'isolation".
-- Si le hook JWT est desactive ou si l'user n'a pas de membership,
-- le claim est null et la policy refuse : c'est le regime explicite
-- documente dans VERIFICATION_RLS.md §"Diagnostic en cas d'urgence".
-- =====================================================================

drop policy if exists organizations_member_read on public.organizations;

create policy organizations_member_read on public.organizations
  for select to authenticated using (id = public.jwt_org_id());

-- =====================================================================
-- Etape 3 : profiles ne change pas. Les deux policies deja en place
-- (`profiles_self_read` SELECT, `profiles_self_update` UPDATE) utilisent
-- `id = auth.uid()` et ne lisent aucune table → deja sans recursion.
-- On les reaffirme par commentaire pour qu'un futur editeur ne les
-- touche pas sans comprendre pourquoi elles sont ainsi.
-- =====================================================================

comment on policy profiles_self_read on public.profiles is
  'Lit profiles uniquement par id = auth.uid(). Ne reference aucune table : pas de recursion possible.';
comment on policy profiles_self_update on public.profiles is
  'Mise a jour par id = auth.uid() uniquement. Ne reference aucune table : pas de recursion possible.';

-- =====================================================================
-- Etape 4 : inventaire final par garde-fou. Cette requete SELECT
-- systmatique liste toute policy qui reference sa propre table.
-- Elle est executee par la migration elle-meme, et DOIT rendre
-- zero ligne (sinon la migration leve une exception et tout
-- revient en arriere). C'est le filet de securite : si un futur
-- editeur reintroduit le pattern fautif sur n'importe quelle table,
-- la migration echoue bruyamment au lieu de casser la prod en silence.
-- =====================================================================

do $$
declare
  bad_policies record;
  bad_count int := 0;
begin
  for bad_policies in
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and (
        qual::text ilike '%from ' || tablename || ' %'
        or qual::text ilike '%from public.' || tablename || ' %'
        or with_check::text ilike '%from ' || tablename || ' %'
        or with_check::text ilike '%from public.' || tablename || ' %'
      )
  loop
    raise warning 'POLICY AUTO-REFERENCING DETECTED: %.% (%)',
      bad_policies.tablename, bad_policies.policyname, bad_policies.cmd;
    bad_count := bad_count + 1;
  end loop;
  if bad_count > 0 then
    raise exception 'Migration 000006 FAILED : % policy(ies) referencing own table. Fix upstream.',
      bad_count;
  end if;
end $$;