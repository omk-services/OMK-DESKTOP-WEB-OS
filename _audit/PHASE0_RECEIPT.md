# Phase 0 Receipt — Coach OS Supabase Provisioning

> Exécuté par Sonnet 5 (CC), 2026-07-22, directement (M3 n'a pas eu le temps de démarrer,
> quota rechargé avant transfert — A+ a dit de continuer). Faits observés, pas de "devrait marcher".

## Projet

- **Nom** : `coach-os`
- **Project ID** : `qjrwcdzaebyqponqkiqs`
- **Organisation** : "Agency as a Service" (`xuefwzzxsbdzlooitpwu`) — regroupe avec les autres produits AaaS (Solaris), séparé du Life OS personnel
- **Région** : `us-east-2`
- **Statut** : `ACTIVE_HEALTHY` (confirmé via `get_project`/`list_projects`)
- **Coût** : `$0/mois` — confirmé via `get_cost` AVANT création (tier gratuit)
- **URL** : `https://qjrwcdzaebyqponqkiqs.supabase.co`

## Tables (5/5, confirmées via `list_tables`)

| Table | RLS activé | Rows |
|---|---|---|
| `organizations` | ✅ | 0 |
| `profiles` | ✅ | 0 |
| `memberships` | ✅ | 0 |
| `cms_collections` | ✅ | 0 |
| `cms_items` | ✅ | 0 |

## Sécurité

`get_advisors(type=security)` → **`{"lints":[]}`** — zéro alerte, RLS actif sur les 5 tables dès la création (pas de fenêtre non protégée).

## Edge Function

- `sign-up-organization` déployée, **status ACTIVE**, `verify_jwt: true`
- Idempotent : si l'utilisateur a déjà une `membership`, la retourne ; sinon crée `organizations` + `memberships(role='owner')`
- Utilise le service-role côté serveur uniquement (bypass RLS délibéré, jamais exposé au client)

## Auth

Email/magic-link Supabase Auth = activé par défaut sur tout nouveau projet Supabase. **Aucun outil MCP disponible actuellement pour modifier la config auth du projet** — donc je n'ai rien changé, je documente l'état par défaut plutôt que d'affirmer une config que je n'ai pas vérifiée par lecture directe du panneau Auth (D1 — pas de fausse certitude ici).

## Fichiers écrits localement

- `coach-os/.env.local` — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon/legacy key, publishable). **Non commité** — `.gitignore` créé (n'existait pas avant) couvrant `.env.local`.
- `coach-os/.gitignore` — nouveau fichier

## Ce qui N'A PAS été fait (hors-scope Phase 0, volontairement)

- Aucun câblage frontend (`src/`) — `CmsRepository`, hydrate/upsert restent à faire en Phase 1
- `seed.ts` inchangé — reste le fallback démo
- Aucune table dédiée (`shell_layouts`, `settings_flags`, `ai_act_checklist`, `tasks`) — prévues Phase 2 par le plan, pas Phase 0
- Aucun commit git, aucun push

## Prochaine étape

Phase 1 : câbler `CmsRepository` (lecture/écriture réelle vers `cms_items`) dans `src/lib/cms/cms.store.ts`, avec fallback vers `seed.ts` si aucun org authentifié.
