# CIBLE CANONIQUE : coach-os

> **À graver en dur. La source de vérité du coach-os est ici.**

## Le projet Supabase canonique

| champ | valeur |
|---|---|
| Nom dans la console Supabase | `OMK SERVICES CUSTOMERS` |
| Project ref | `ndvqwcapwcnpdvknxcjw` |
| URL Supabase | `https://ndvqwcapwcnpdvknxcjw.supabase.co` |
| Organisation Supabase | OMK Services Org (compte bureau) |
| Plan | Free |
| Tables présentes (mesure 2026-08-16) | 8 tables : `user_roles`, `role_permissions` (pré-existantes) + `workspace_branches`, `workspace_snapshots`, `workspace_prs`, `workspace_pr_reviews`, `audit_events`, `memberships` (6 coach-os migrées) |
| Trigger | `audit_memberships_changes_trg` sur `public.memberships` |

## Pourquoi ce projet-ci, pas un autre

L'utilisateur m'a **repris 4 fois** sur la cible. Voici la version
finale, **non négociable** :

1. `biyecksylqonuovqmbtz` (Agent OS Backend, **compte perso**) :
   projet test/draft de l'agent, **vide** depuis le DROP du 2026-08-16.
   Pas coach-os.
2. `qjrwcdzaebyqponqkiqs` (compte OMK bureau, paused) : projet
   distinct, sans rapport avec coach-os.
3. `sgzbkhqqkqdwhakkyzzm.supabase.co` (compte OMK bureau) : **autre
   produit OMK** (probablement Life OS / dashboard). Il a27 tables
   peuplées, organisations, contenu CMS. **Pas coach-os**, malgré
   l'env var Vercel `VITE_SUPABASE_URL` qui le pointe — c'est
   probablement une URL historique / dev, **pas la prod coach-os**.
4. `ndvqwcapwcnpdvknxcjw.supabase.co` (compte OMK bureau, **OMK
   SERVICES CUSTOMERS**) : **le seul vrai coach-os**. C'est ce que
   l'utilisateur a confirmé explicitement le 2026-08-16.

## Ce qui a été vérifié directement

- `list_tables` sur `ndvqwcapwcnpdvknxcjw` (via `mcp__supabase-omk`)
  retourne les 8 tables attendues, dont les 6 coach-os.
- `list_tables` sur `sgzbkhqqkqdwhakkyzzm` retourne 27 tables
  différentes (CMS, organizations, etc.) — **autre produit**.
- Capture console Supabase le 2026-08-16 : `ndvqwcapwcnpdvknxcjw`
  = « OMK SERVICES CUSTOMERS », Healthy, dans l'org OMK bureau.

## Ce qui a été corrigé pendant la conversation

- 1ère erreur : tables posées sur `biyecksylqonuovqmbtz`
  (Agent OS Backend, **compte perso**). DROP CASCADE + recréation
  sur `ndvqwcapwcnpdvknxcjw`.
- 2ème erreur (potentielle) : doute sur `sgzbkhqqkqdwhakkyzzm`
  parce que le projet Vercel `omk-desktop-web-os` avait
  `VITE_SUPABASE_URL` pointant dessus. **Faux** : `sgzbkhqqkqdwhakkyzzm`
  est un autre produit OMK. Le `VITE_SUPABASE_URL` du Vercel est
  un artefact historique ou dev, **pas la prod coach-os**.

## Pourquoi je n'agis plus jamais sur une cible sans la vérifier

Trois leçons, dans l'ordre d'importance :

1. **Le nom du projet dans la console Supabase** est cosmétique.
   Un projet peut s'appeler « coach-os » et servir autre chose.
2. **`VITE_SUPABASE_URL` baked in Vercel** ne reflète pas toujours
   la cible réelle. C'est un build-time var ; il faut comparer avec
   la cible canonique, pas avec l'env Vercel.
3. **`list_projects` répond à la question « quels projets je vois ? »**
   — pas « quel est coach-os ? ». Les2 ont été confondus plusieurs fois.

## Règle à graver (anti-dette par obscurcité)

> **Avant toute migration Supabase, vérifier 3 choses dans cet ordre** :
>
> 1. Le `name` du projet dans la console = ce que l'utilisateur
>    a déclaré comme cible ?
> 2. La présence des tables attendues (au moins 1 table métier
>    caractéristique) ?
> 3. L'utilisateur **confirme explicitement** la cible ?
>
> Sans les 3, ne pas migrer.

## Anti-piège pour la prochaine session

Si un agent (futur) lit ce fichier et doute de la cible, c'est
qu'il n'a pas compris. La cible est **non négociable** :
`ndvqwcapwcnpdvknxcjw.supabase.co`. **Pas** `sgzbkhqqkqdwhakkyzzm`,
**pas** `biyecksylqonuovqmbtz`, **pas** `qjrwcdzaebyqponqkiqs`.

Date de la dernière confirmation : 2026-08-16.
Source de vérité : capture console Supabase + confirmation explicite utilisateur.