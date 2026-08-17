---
type: Security Model
title: Isolation multi-tenant par RLS
description: Les policies sont correctes ; toute la sécurité repose sur un claim JWT qui échoue en silence.
tags: [rls, supabase, multi-tenant, jwt]
generated: { by: claude-opus-5, at: 2026-08-17T00:58:00Z }
verified:
  - { by: process:supabase-management-api, at: 2026-08-17T00:58:00Z }
sources:
  - id: pg-policies
    resource: "select * from pg_policies where schemaname='public' — projet sgzbkhqqkqdwhakkyzzm"
    author: process:supabase-management-api
    last_modified: 2026-08-17
  - id: pg-proc
    resource: "pg_get_functiondef sur jwt_org_id et custom_access_token_hook"
    author: process:supabase-management-api
    last_modified: 2026-08-17
  - id: config-auth
    resource: https://api.supabase.com/v1/projects/sgzbkhqqkqdwhakkyzzm/config/auth
    author: process:supabase-management-api
    last_modified: 2026-08-17
okf_version: "0.2"
---

# Ce qui est correct

Les policies RLS du projet INTERN sont **bien conçues**. Ce n'est pas là qu'est
la faille, et il faut le dire clairement pour ne pas envoyer de correctif sur
une cible saine.[^pg-policies]

| Table | Commande | Expression |
|---|---|---|
| `cms_*` (25 tables) | SELECT / UPDATE / DELETE | `org_id = jwt_org_id()` |
| `cms_*` | INSERT | `WITH CHECK (org_id = jwt_org_id())` |
| `memberships` | SELECT (`authenticated`) | `user_id = auth.uid()` |
| `organizations` | SELECT | `id = jwt_org_id()` |
| `profiles` | SELECT / UPDATE | `id = auth.uid()` |

L'`INSERT` porte bien un `WITH CHECK`, donc un client ne peut pas écrire dans
l'org d'un autre en forgeant `org_id`. La clé exposée dans le bundle est
`role: anon`, pas `service_role`.

# Le point unique de défaillance

Tout repose sur une seule fonction :[^pg-proc]

```sql
CREATE FUNCTION public.jwt_org_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  select nullif(auth.jwt() ->> 'org_id', '')::uuid
$$;
```

Si le claim `org_id` est absent du JWT, `jwt_org_id()` rend `NULL`. Or
`org_id = NULL` vaut `NULL`, jamais `TRUE` : **toutes les requêtes rendent zéro
ligne, sans erreur.**

C'est un échec **fermé** — donc sûr, mais indiscernable d'une base vide. Une app
qui affiche « 0 paid · 0 open » ne peut pas dire si c'est vrai ou si le claim
manque.

Le hook est actif (`hook_custom_access_token_enabled = true`) et alimente le
claim ainsi :

```sql
select m.org_id from public.memberships m
where m.user_id = v_user_id
order by m.created_at asc
limit 1;
```

# Le défaut qui en découle

Le claim est figé sur la **première** org de l'utilisateur, par date de création.
Or l'interface propose de **basculer d'espace de travail**.

Deux issues possibles, et il faut mesurer laquelle est vraie :

1. La bascule ne rafraîchit pas le jeton → le claim reste sur l'org d'origine →
   l'utilisateur bascule et ne voit rien. Échec fermé, donc sûr mais cassé.
2. La bascule contourne le claim côté client → l'isolation ne tient plus.
   Ce serait **critique**.

Cette question est ouverte : elle fait l'objet du brief A du pentest.

# Réglages d'authentification à durcir

Mesurés sur INTERN :[^config-auth]

| Réglage | Valeur | Problème |
|---|---|---|
| `password_min_length` | **6** | Trop court. Porter à 12 au minimum. |
| `security_captcha_enabled` | **false** | Ni bourrage d'identifiants ni création de comptes en masse n'est freiné. |
| `disable_signup` | **false** | L'inscription est ouverte sur la production. |
| `uri_allow_list` | contient `https://*-omk-services.vercel.app/**` | Un joker sur **tous** les déploiements d'aperçu de l'équipe. Toute préversion peut recevoir la redirection d'authentification. |

Corrects en revanche : `jwt_exp = 3600`,
`refresh_token_rotation_enabled = true`, `mailer_autoconfirm = false`.

[^pg-policies]: Table `pg_policies` du projet INTERN.
[^pg-proc]: `pg_get_functiondef` sur les deux fonctions.
[^config-auth]: Endpoint `/config/auth` de l'API de gestion.
