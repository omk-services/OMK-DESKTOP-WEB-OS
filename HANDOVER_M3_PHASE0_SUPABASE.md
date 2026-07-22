# Handover → M3 : Coach OS Phase 0 (Supabase provisioning)

> Écrit par Sonnet 5 (CC), 2026-07-22, sous contrainte de reset de session (~1h34).
> But : que M3 (ou tout harness qui l'exécute — Hermes/Codex/autre) puisse lancer
> Phase 0 SANS relire toute la conversation. Ce fichier est auto-suffisant.

## Contexte en 4 lignes

Coach OS = desktop-web OS (React 19 + Vite + Zustand + Tailwind) pour coachs solo premium,
forké du shell A'Space Life OS. Repo : `C:\Users\amado\coach-os\`. 13 apps (Dashboard,
People, Operations, IT/R&D, Clients, Tasks, Marketplace, Product, Growth, Sales, Finance,
Legal, Settings), toutes actuellement en état volatile (Zustand in-memory + localStorage
pour le layout des fenêtres seulement). Le plan complet de migration est dans
`C:\Users\amado\coach-os\MIGRATION_SUPABASE.md` — LIS-LE EN ENTIER avant d'agir (D2).

## Décision déjà RATIFIÉE par A+ (ne pas re-débattre)

Modèle 3-stages (voir MIGRATION_SUPABASE.md §5) :
1. **Stage 1 (= CETTE tâche)** : projet Supabase PARTAGÉ, RLS par `org_id`, coté OMK Services.
2. Stage 2 : projet Supabase dédié transféré au coach (plus tard, pas maintenant).
3. Stage 3 : self-host Supabase dans le Coolify du VPS du coach (plus tard, pas maintenant).

Ne construis QUE Stage 1. Le schéma doit rester du Postgres pur, sans extension
OMK-only, pour que la migration Stage 1→2→3 reste un simple `pg_dump`/repoint d'URL.

## Ce que Phase 0 doit livrer (checklist D1-vérifiable)

- [ ] 1 projet Supabase créé (via `mcp__supabase__create_project` si dispo dans ton harness,
      sinon dashboard Supabase manuel — mais MCP préféré, D1 receipt = project id retourné)
- [ ] Tables `organizations`, `memberships (org_id, user_id, role)`, `profiles` créées
- [ ] Tables `cms_collections`, `cms_items` créées (schéma exact = MIGRATION_SUPABASE.md §3.2)
- [ ] RLS activé sur TOUTES les tables business (`cms_items` au minimum, sketch policy
      donné dans §3.2 — adapte si besoin mais NE PUBLIE RIEN sans RLS actif)
- [ ] Auth : magic-link email activé côté Supabase Auth settings
- [ ] Edge Function `sign-up-organization` : réutiliser le PATTERN de la fonction OMK SaaS
      déjà en prod (chercher `sign-up-organization` dans les repos omk-services si tu as
      accès filesystem/MCP à ce moment — sinon écris une version minimale : à la première
      connexion, crée `organizations` + `memberships(role='owner')` pour le nouvel user)
- [ ] `.env.local` de `coach-os/` rempli avec `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
      (Test Key Pragma : clés en clair OK dans ce handoff-only file si nécessaire pour transfert,
      A+ les fera roter ensuite — NE JAMAIS commit `.env.local` dans git)

## Ce que Phase 0 NE doit PAS faire

- Ne touche pas au code frontend (`src/`) — Phase 1 (câblage `CmsRepository`) est une
  tâche SÉPARÉE, après validation de Phase 0.
- Ne migre pas `seed.ts` — il reste le fallback démo tant que Phase 1 n'est pas livrée.
- Ne crée pas de Stage 2/3 infra — hors scope.
- Ne push pas de commit — laisse ça à A+ (git push = geste humain uniquement, doctrine
  session established).

## Vérification avant de clore

1. `mcp__supabase__list_tables` (ou équivalent de ton harness) → confirme les 5 tables existent
2. `mcp__supabase__get_advisors` → 0 alerte RLS critique sur `cms_items`
3. Écris un receipt D1 (project id, tables créées, RLS status) dans un nouveau fichier
   `C:\Users\amado\coach-os\PHASE0_RECEIPT.md` — pas de "ça devrait marcher", des faits observés.

## Si bloqué

Ne pas escalader vers A+ pour une question de détail de schéma — improvise dans l'esprit
du plan (§3.2 est un sketch, pas une loi gravée). Escalade seulement si : (a) aucun accès
MCP Supabase disponible dans ton harness, ou (b) une vraie décision produit manque (pas
couverte par ce fichier ni par MIGRATION_SUPABASE.md).
