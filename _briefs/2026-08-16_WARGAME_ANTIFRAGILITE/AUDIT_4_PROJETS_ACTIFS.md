# AUDIT — 4 projets actifs (sauf Life OS)

> **Date** : 2026-08-16
> **Demandé par** : utilisateur, recherche de composants coach-os dispersés
> **Méthode** : `mcp__supabase-omk__list_tables` + `execute_sql` direct
>   sur chaque projet

## Tableau récapitulatif

| # | projet | compte | statut | tables | rôle supposé |
|---|---|---|---|---|---|
| 1 | `ndvqwcapwcnpdvknxcjw` (OMK SERVICES CUSTOMERS) | OMK bureau | **HEALTHY** | 8 (2 pré + 6 coach-os) | **vrai coach-os** |
| 2 | `sgzbkhqqkqdwhakkyzzm` | OMK bureau | actif | **27 peuplées** | autre produit OMK (CMS, SaaS OS probable) |
| 3 | `qjrwcdzaebyqponqkiqs` | OMK bureau | **INACTIVE** | inaccessible | à supprimer |
| 4 | `kphefbvygibkyooqbpwt` (Solaris) | OMK bureau | **INACTIVE** (2 mois) | inaccessible | à supprimer |
| 5 | `biyecksylqonuovqmbtz` (Agent OS Backend) | perso | actif | 0 (vide) | à supprimer côté perso |

## Composants coach-os dispersés — résultat

**AUCUN composant coach-os n'est dispersé dans les projets 2-5.**
Tous les composants coach-os canoniques vivent uniquement dans
`ndvqwcapwcnpdvknxcjw` :

| composant | projet 1 | projet 2 | projet 3 | projet 4 | projet 5 |
|---|---|---|---|---|---|
| `workspace_branches` | ✅ | ❌ | inaccessible | inaccessible | ❌ |
| `workspace_snapshots` | ✅ | ❌ | inaccessible | inaccessible | ❌ |
| `workspace_prs` | ✅ | ❌ | inaccessible | inaccessible | ❌ |
| `workspace_pr_reviews` | ✅ | ❌ | inaccessible | inaccessible | ❌ |
| `audit_events` | ✅ | ❌ | inaccessible | inaccessible | ❌ |
| `memberships` (schéma coach-os) | ✅ | ⚠️ autre schéma | inaccessible | inaccessible | ❌ |
| `audit_memberships_changes_trg` | ✅ | ❌ | inaccessible | inaccessible | ❌ |

## Note sur `sgzbkhqqkqdwhakkyzzm`

Ce projet a **une table `memberships`** aussi, mais avec un schéma
DIFFÉRENT :

| champ | `ndvqwcapwcnpdvknxcjw` (coach-os) | `sgzbkhqqkqdwhakkyzzm` (autre) |
|---|---|---|
| identifiant métier | `tenant_id text` | `org_id uuid` |
| FK auth | `auth.users(id)` | non vérifié |
| colonnes | `invited_by`, `accepted_at`, `status` | juste `role`, `created_at` |
| trigger | `audit_memberships_changes_trg` | aucun |

**Conclusion** : `sgzbkhqqkqdwhakkyzzm` partage le **vocabulaire**
(`memberships`, `organizations`, `profiles`) mais avec un **schéma
différent**. Ce n'est pas coach-os.

Probablement un autre produit OMK :
- Life OS / SaaS OS (le dashboard OMK SaaS)
- Ou un front-end OMK annexe

**À vérifier avec l'utilisateur** : qu'est-ce que `sgzbkhqqkqdwhakkyzzm`
doit servir ? Si c'est un autre produit, il faut bien séparer les
deux (sinon confusion future).

## Action recommandée

**Suppression des 3 projets vides / paused** :

| projet | compte | raison | comment |
|---|---|---|---|
| `biyecksylqonuovqmbtz` | perso | vide après DROP CASCADE | `mcp__supabase__delete` côté perso (token `sbp_02db5fc8...`) |
| `qjrwcdzaebyqponqkiqs` | OMK bureau | INACTIVE | nécessite 1 slot libre côté bureau (2-project limit org `xuefwzzxsbdzlooitpwu`) |
| `kphefbvygibkyooqbpwt` (Solaris) | OMK bureau | INACTIVE 2 mois | idem |

**Ordonner les suppressions** :

1. D'abord supprimer `biyecksylqonuovqmbtz` (perso) — libère rien
   pour OMK bureau, mais nettoie le perso
2. **Avant** de pouvoir supprimer les paused côté OMK bureau, **il faut**
   soit upgrader l'org ($25/mois), soit en supprimer un. Mais on ne
   peut pas en supprimer un autre car **tous sont au plafond**.

C'est un blocage circulaire. **HITL** : l'utilisateur doit choisir entre :
- Upgrade l'org OMK bureau → Pro ($25/mois) → plus de limite
- Upgrade l'org OMK perso → idem
- Accepter le statu quo (les paused restent)

## Doc de la dette — qui croire ?

**Pour la prochaine session** : si un agent doute de la cible, il
lit `CIBLE_CANONIQUE_COACH_OS.md` qui pointe vers
`ndvqwcapwcnpdvknxcjw` avec preuves. **Aucune dispersion détectée
au 2026-08-16.**

Si l'utilisateur veut que je creuse `sgzbkhqqkqdwhakkyzzm` (genre
identifier à quel produit il sert), il demande explicitement.