# CORRECTIF 6 — le projet CUSTOMERS et ses cinq tables mortes

## Périmètre EXCLUSIF en écriture

```
supabase/migrations/     (tu crées UN nouveau fichier .sql)
```

Plus ton rapport : `_briefs/2026-08-17_CORRECTIFS_M3/RAPPORT_FIX_6.md`.

Rien d'autre. Ni `src/`, ni `api/`, ni `package.json`.

## ⚠️ Tu n'appliques rien

Tu **écris** la migration. Tu ne l'exécutes pas. Tu n'as accès à aucune base,
et c'est voulu : une migration sur une production se relit avant de partir.

Interdits explicites : aucun appel à l'API Supabase, aucun `psql`, aucun MCP,
aucun `curl` vers `api.supabase.com`.

## Le contexte, mesuré

L'organisation Supabase `xsaahnkguocczvunivfx` porte **deux** projets :

| Projet | Référence | Rôle |
|---|---|---|
| OMK SERVICES **INTERN** | `sgzbkhqqkqdwhakkyzzm` | ce que l'app déployée interroge |
| OMK SERVICES **CUSTOMERS** | `ndvqwcapwcnpdvknxcjw` | jamais interrogé |

L'écran de connexion propose pourtant les deux : « Architecte (interne) — le
projet INTERN » et « Coach client — le projet CUSTOMERS ».

Sur **CUSTOMERS**, cinq tables ont **RLS activé et ZÉRO policy** :

```
audit_events · memberships · workspace_branches
workspace_prs · workspace_pr_reviews · workspace_snapshots
```

RLS activé sans policy = **refus total**. Ces tables ne sont pas ouvertes,
elles sont mortes. (`role_permissions` et `user_roles` ont 2 policies chacune.)

## Ce qui a déjà été fait sur INTERN — ton modèle

Le 2026-08-17, `supabase/migrations/2026-08-17_memberships_alignement_contrat.sql`
a aligné `memberships` sur INTERN. **Lis-le d'abord** : il contient les
décisions à reproduire, et deux pièges déjà payés.

Notamment :

- une policy posée **sur** `memberships` qui interroge `memberships` provoque
  une **récursion infinie de RLS**. D'où `is_tenant_admin()` en
  `SECURITY DEFINER`, avec `search_path` figé ;
- le hook `custom_access_token_hook` lit `memberships` : toute migration qui
  renomme une colonne doit réécrire le hook **dans la même transaction**,
  sinon plus aucune connexion n'obtient de claim.

## Ce qu'on attend

Écris `supabase/migrations/2026-08-17_customers_policies.sql` qui, **sur le
projet CUSTOMERS**, met les cinq tables au même niveau qu'INTERN :

1. **Aligne `memberships`** sur le contrat du code, exactement comme INTERN :
   colonnes `tenant_id`, `invited_by`, `invited_at`, `accepted_at`, `status`,
   contraintes sur `role` et `status`.
2. **Pose les policies manquantes** sur les cinq tables. Chacune doit être
   cloisonnée par tenant. Pour `audit_events` : la lecture est réservée aux
   administrateurs du tenant, et **personne ne doit pouvoir modifier ni
   supprimer** une ligne d'audit — un journal qu'on peut réécrire ne vaut rien.
3. **Crée `is_tenant_admin()`** et le hook, comme sur INTERN, si absents.
4. **Rends la migration ré-exécutable** : `if not exists`, `drop policy if
   exists`. Elle sera peut-être jouée deux fois.
5. **Bloc d'annulation** commenté en fin de fichier, comme le modèle.

## En tête de fichier, écris pourquoi

La migration doit expliquer, en commentaire, **à quoi sert CUSTOMERS**. C'est
la question ouverte : soit l'app doit basculer d'URL selon l'entrée choisie à
la connexion, soit CUSTOMERS est abandonné et l'écran de connexion ment.

Tu ne tranches pas cette question — tu prépares le terrain pour les deux
issues, et tu écris dans ton rapport ce que chacune impliquerait.

## Vérifie ta syntaxe sans base

Tu ne peux pas exécuter. Relis-toi comme un compilateur : chaque `alter table`
vise une colonne qui existe, chaque `create policy` nomme une table réelle,
chaque `$$` est refermé. Une migration qui échoue à la moitié laisse la base
dans un état bâtard.

## Rappel

Un seul fichier SQL, plus ton rapport. Aucune exécution. Rapport partiel
obligatoire.
