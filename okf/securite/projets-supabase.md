---
type: Backend
title: Les deux projets Supabase de Coach OS
description: L'app déployée interroge INTERN ; CUSTOMERS porte des tables sans policy et n'est jamais interrogé.
resource: https://supabase.com/dashboard/org/xsaahnkguocczvunivfx
tags: [supabase, multi-tenant, dette]
generated: { by: claude-opus-5, at: 2026-08-17T00:55:00Z }
verified:
  - { by: process:supabase-management-api, at: 2026-08-17T00:55:00Z }
sources:
  - id: bundle-deploye
    resource: https://omk-desktop-web-os.vercel.app/assets/index-dZnkSame.js
    title: Bundle JS de production, déploiement dpl_4TNkSRLL
    last_modified: 2026-08-17
  - id: mgmt-api-projets
    resource: https://api.supabase.com/v1/projects
    title: Liste des projets, PAT OMK
    author: process:supabase-management-api
    last_modified: 2026-08-17
  - id: mgmt-api-tables
    resource: "requête pg_class/pg_policy sur les deux projets via /database/query"
    author: process:supabase-management-api
    last_modified: 2026-08-17
okf_version: "0.2"
---

# Constat

L'organisation Supabase `xsaahnkguocczvunivfx` contient **deux** projets, et ils
correspondent aux deux entrées de l'écran de connexion de Coach OS.

| Projet | Référence | Rôle affiché à l'écran |
|---|---|---|
| OMK SERVICES **INTERN** | `sgzbkhqqkqdwhakkyzzm` | « Architecte (interne) » |
| OMK SERVICES **CUSTOMERS** | `ndvqwcapwcnpdvknxcjw` | « Coach client » |

Le bundle de production ne contient **qu'une seule** URL Supabase :
`https://sgzbkhqqkqdwhakkyzzm.supabase.co`.[^bundle-deploye]

L'app déployée ne parle donc **jamais** au projet CUSTOMERS.

# Schema

## INTERN — 28 tables, toutes avec RLS et des policies

25 tables `cms_*` (4 policies chacune), plus `memberships` (2),
`organizations` (1), `profiles` (2).[^mgmt-api-tables]

## CUSTOMERS — cinq tables mortes

| Table | RLS | Policies |
|---|---|---|
| `audit_events` | activé | **0** |
| `memberships` | activé | **0** |
| `workspace_branches` | activé | **0** |
| `workspace_prs` | activé | **0** |
| `workspace_pr_reviews` | activé | **0** |
| `workspace_snapshots` | activé | **0** |
| `role_permissions` | activé | 2 |
| `user_roles` | activé | 2 |

RLS activé sans aucune policy signifie **refus total**. Ces tables ne sont pas
ouvertes : elles sont inaccessibles à tout client non `service_role`.

# Conséquence

Les fonctionnalités multi-tenant construites le 2026-08-15 (memberships, journal
d'audit, branches d'espace de travail) ont été appliquées sur CUSTOMERS. Elles
sont donc **doublement inertes** : la base n'est pas celle que l'app interroge,
et même si elle l'était, l'absence de policy bloquerait tout.

C'est la cause racine du constat « le multi-tenant ne marche pas ».

# Correctif

Trois voies, à trancher :

1. **Porter** les tables et leurs policies de CUSTOMERS vers INTERN, et
   abandonner CUSTOMERS. Le plus simple si un seul backend suffit.
2. **Basculer** `VITE_SUPABASE_URL` selon l'entrée choisie à la connexion
   (Architecte → INTERN, Coach client → CUSTOMERS), et doter CUSTOMERS des
   policies manquantes. C'est ce que l'écran de connexion promet aujourd'hui.
3. **Retirer de l'UI** le choix « Coach client » tant que CUSTOMERS n'est pas
   servi, pour que l'écran cesse de promettre ce que le code ne fait pas.

Quelle que soit la voie : **ne jamais appliquer une migration sans avoir vérifié
que le `database.host` du projet visé correspond au host du
`VITE_SUPABASE_URL` de l'app déployée.** C'est le contrôle qui manquait.

[^bundle-deploye]: Bundle JS de production, déploiement dpl_4TNkSRLL.
[^mgmt-api-tables]: Requête `pg_class` / `pg_policy` via l'API de gestion Supabase.
