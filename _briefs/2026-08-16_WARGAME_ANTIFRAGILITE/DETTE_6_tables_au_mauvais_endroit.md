# DETTE : 6 tables coach-os appliquées sur le mauvais projet Supabase

**Date de la dette** : 2026-08-16 (entre 22:30 et 23:50)
**Date de la correction** : 2026-08-16 (après-midi)
**Statut** : ✅ RÉSOLU par déplacement DROP/CASCADE + CREATE

## Cause racine

À la suite du Wargame antifragilité, l'agent a appliqué 3 migrations
sur `biyecksylqonuovqmbtz` (compte Supabase **perso**, projet
nommé « Agent OS Backend ») en le **prenant à tort pour coach-os**.
Le raisonnement faux :

- `biyecksylqonuovqmbtz` était listé en premier quand le MCP répondait
- `qjrwcdzaebyqponqkiqs` (un autre projet Supabase qui s'appelle
  littéralement « coach-os ») était paused, et `biyecksylqonuovqmbtz`
  était la première cible active disponible
- L'agent n'a **pas vérifié** l'URL canonique de l'app (`omk-desktop-web-os.vercel.app`)
  qui pointe vers `ndvqwcapwcnpdvknxcjw.supabase.co`

## Pourquoi c'est une vraie dette (et pas cosmétique)

Le seul et unique projet coach-os canonique est `ndvqwcapwcnpdvknxcjw`
(appelé « OMK SERVICES CUSTOMERS » dans la console), sur le **compte
bureau OMK** (Free plan). C'est ce que pointe `omk-desktop-web-os.vercel.app`,
et c'est **sur ce projet** que les 6 tables doivent vivre. Les tables
sur `biyecksylqonuovqmbtz` étaient **mortes pour l'app** — la prod
les ignorait complètement.

## Diagnostic et correction

L'utilisateur a corrigé l'agent à plusieurs reprises, d'abord en
rappelant que `biyecksylqonuovqmbtz` n'est pas sur le bon compte, puis
en montrant une capture de la console Supabase où `ndvqwcapwcnpdvknxcjw`
est en `Healthy` avec 7 requêtes sur 60 min.

Une fois `mcp__supabase-omk__*` chargé (token `sbp_f2af0f71...`
ajouté à `.mcp.json`), la procédure appliquée :

1. **Confirmation utilisateur explicite** : « a » (option A = DROP +
   recreate).
2. **DDL récupéré** sur `biyecksylqonuovqmbtz` via
   `pg_attribute` + `information_schema.table_constraints`.
3. **DROP TABLE IF EXISTS ... CASCADE** sur `biyecksylqonuonuovqmbtz`
   (ordre : tables filles d'abord).
4. **CREATE TABLE** sur `ndvqwcapwcnpdvknxcjw` via
   `mcp__supabase-omk__apply_migration` (5 migrations tracées) :
   - `2026-08-16_coach_os_workspace_branches`
   - `2026-08-16_coach_os_workspace_snapshots`
   - `2026-08-16_coach_os_workspace_prs`
   - `2026-08-16_coach_os_workspace_pr_reviews`
   - `2026-08-16_coach_os_audit_events`
   - `2026-08-16_coach_os_memberships`
   - `2026-08-16_coach_os_audit_memberships_trigger`
5. **Vérification finale** : `list_tables` sur `ndvqwcapwcnpdvknxcjw`
   retourne 8 tables (2 pré-existantes + 6 nouvelles), toutes RLS
   activé, 0 row.

## Pourquoi je n'agis plus jamais sur une cible sans la vérifier

- **`list_projects` répond à une question : « quels projets Supabase
  vois-je avec ce token ? »** — pas « quel est le projet coach-os ? »
- Un projet peut s'appeler « coach-os » dans son `name` et ne servir
  **aucune app**. Le `name` du projet est cosmétique.
- L'URL canonique de l'app → host Supabase → `database.host` du
  projet : c'est la seule vérification qui prouve qu'un projet est
  bien la cible d'une app.

**Règle à graver dans le canon** (proposition, à valider) :

> Avant d'appliquer une migration sur un projet Supabase, vérifier
> que `database.host` du projet = host du `NEXT_PUBLIC_SUPABASE_URL`
> de l'app déployée. Sans cette vérification, écrire la migration
> dans un fichier `.sql` non appliqué et demander confirmation.

## État final

- `biyecksylqonuovqmbtz` (Agent OS Backend, perso) : **vide**.
- `ndvqwcapwcnpdvknxcjw` (OMK SERVICES CUSTOMERS, bureau OMK) :
  **6 tables coach-os + trigger audit_members_changes**.
- `.mcp.json` : `supabase-omk` ajouté avec son token dédié.
- Brouillons précédents (`DETTE_6_tables_orphelines.md`,
  `HITL_W03_W13_BRANCHES.md`) : supprimés. **Ce document-ci est
  la version vraie** de la dette.
