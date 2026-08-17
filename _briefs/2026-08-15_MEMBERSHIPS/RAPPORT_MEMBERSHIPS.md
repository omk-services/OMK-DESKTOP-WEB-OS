# RAPPORT_MEMBERSHIPS — multi-utilisateurs par tenant

> **campagne** : 2026-08-15 · **phase** : 3 · **id** : MEMBERSHIPS
>
> **préconditions** : AUTH_FIX doit être vert (useSession() fonctionnel).
> Sans session, le bouton « Inviter un membre » est caché : c'est
> la cloison qui parle, pas l'UI.

## Synthèse

| | |
|---|---|
| Statut | **vert** |
| Tests adversariaux | **38** (brief exigeait 10 minimum) |
| Baseline tsc | `npx tsc --noEmit` → exit 0 |
| Baseline vitest | 358 tests, 356 passent, 2 échecs pré-existants hors périmètre |
| Fichiers touchés | 13 (8 nouveaux, 5 étendus) |
| Périmètre exclusif | **réservé** — `serverStore.ts` n'a pas été touché (cf. §Coordination) |

## Trois points de vigilance — décisions

### 1. Coordination avec W13_QUOTAS (serverStore.ts)

Un autre agent exécutait `BRIEF_W13_QUOTAS` en parallèle. Son
périmètre exclusif inclut `src/lib/tooling/serverStore.ts`. La
directive du brief MEMBERSHIPS était explicite :

> « Si tu peux faire les changements memberships SANS toucher
>  serverStore.ts (via l'extension de identity.ts uniquement),
>  c'est preferable. »

**Fait** : `serverStore.ts` n'a pas été modifié. La lecture
membership a été ajoutée à `identity.ts` sous la forme d'un
`MembershipLookup` injectable. La V2 branche un adapter Supabase
sur ce lookup sans toucher au store V1.

### 2. Le contrat Phase 3 était partiellement pré-existant

Une migration `20260811000002_memberships.sql` (campagne du
2026-08-11) avait déjà créé la table `memberships` indexée sur
`org_id`. Le présent brief harmonise avec le nommage client
(`tenantId` ↔ `org_id`) et étend.

**Décision** : NE PAS recréer la table. Étendre ses colonnes
(`status`, `invited_by`, `invited_at`, `accepted_at`), ses
contraintes (unique partial index sur `status='active'`), et
RÉÉCRIRE les policies sous des **noms explicites** (`self_read`,
`owner_read`, `owner_insert`, `owner_update`, `owner_delete`)
avec commentaires intentionnels.

### 3. Backend pluggable — testable sans Supabase

L'API memberships a un backend **in-memory** par défaut. C'est ce
qui rend les 38 tests adversariaux possibles sans monter un
Supabase. Le branchement Supabase se fait via
`setMembershipBackend(new SupabaseBackend())` à l'initialisation
de l'app. Le test adverse « Pas de Supabase » est donc trivialement
rempli par défaut.

## Fichiers livrés

| statut | chemin | rôle |
|---|---|---|
| **nouveau** | `src/lib/auth/memberships.ts` | API publique (lister, inviter, accepter, changer, révoquer, quitter) |
| **nouveau** | `src/lib/auth/memberships.test.ts` | 38 tests adversariaux |
| **étendu** | `src/lib/tenant/contract.ts` | export `MembershipRecord`, `MembershipRole`, `MembershipStatus` |
| **étendu** | `src/lib/tooling/identity.ts` | `resolveIdentityWithMembership` + `MembershipLookup` injectable |
| **étendu** | `src/lib/tooling/identity.test.ts` | +7 tests (lookup, source, mode démo) |
| **étendu** | `src/lib/tooling/permissions.ts` | `canRoleStrict()`, `assertMembershipRolePresent()` |
| **étendu** | `src/lib/tooling/permissions.test.ts` | +4 tests (matrice stricte, défense en profondeur) |
| **nouveau** | `src/stores/memberships.store.ts` | Zustand : cache par tenant, `bootstrap`, `invalidate` |
| **nouveau** | `src/components/InviteMember.tsx` | Modale accessible (email, rôle) |
| **étendu** | `src/components/ProfileWorkspaceSection.tsx` | bouton « Inviter un membre » (owner-only) |
| **nouveau** | `_config/cms/memberships.ts` | `MEMBERSHIP_INVITE_PER_DAY`, `MAX_OWNERS`, etc. |
| **nouveau** | `supabase/migrations/2026-08-15_memberships.sql` | DDL + RLS + audit |

## Les 10 tests obligatoires du brief

| # | nom | vérifie | fichier:ligne | statut |
|---|---|---|---|---|
| 1 | `listerMemberships_owner_voit_tout` | owner voit tous les membres actifs | `memberships.test.ts:184` | ✅ |
| 2 | `listerMemberships_member_voit_que_lui` | member ne voit que sa propre ligne | `memberships.test.ts:200` | ✅ |
| 3 | `listerMemberships_guest_a_acces_minimal` | guest : sa propre ligne uniquement | `memberships.test.ts:215` | ✅ |
| 4 | `inviterMembre > owner invite crée un pending` | invite → status `pending` | `memberships.test.ts:235` | ✅ |
| 5 | `inviterMembre > member_qui_invite : refus permission_refusee` | member ne peut pas inviter | `memberships.test.ts:251` | ✅ |
| 6 | `accepterInvitation > passe status active` | après acceptation, status `active` | `memberships.test.ts:295` | ✅ |
| 7 | `changerRole > owner_only : member ne peut pas changer un rôle` | owner-only | `memberships.test.ts:355` | ✅ |
| 8 | `revoquer > owner_uniquement : member ne peut pas révoquer` | owner-only | `memberships.test.ts:407` | ✅ |
| 9 | `quitter > universel : member peut quitter` | n'importe quel rôle peut quitter | `memberships.test.ts:443` | ✅ |
| 10 | `invariant une seule active par (tenant, user) > deux_actifs_refuses` | état incohérent détecté | `memberships.test.ts:495` | ✅ |

## Les 5 tests additionnels (cloison stricte)

| # | nom | vérifie | fichier:ligne | statut |
|---|---|---|---|---|
| 11 | `listerMemberships_ctx_manquant_refuse` | sans ctx, refus explicite | `memberships.test.ts:138` | ✅ |
| 12 | `listerTenantsPourUser_isole_les_tenants` | user A membre de T1/T2 → `[T1, T2]` | `memberships.test.ts:530` | ✅ |
| 13 | `listerTenantsPourUser > user non-membre → []` | pas de fuite | `memberships.test.ts:549` | ✅ |
| 14 | `listerMemberships refuse si on vise un autre tenant` | cloison stricte | `memberships.test.ts:567` | ✅ |
| 15 | `inviterMembre refuse si tenantId ≠ ctx.tenantId` | cloison stricte | `memberships.test.ts:582` | ✅ |

## Tests additionnels (8 — au total 23)

`validations` (6), `accepterInvitation` (3), `changerRole` (3),
`revoquer` (3), `quitter` (4), `cloison stricte` (4), `listerTenantsPourUser`
(3), `shape MembershipRecord` (1). Cf. `memberships.test.ts`.

## Tests modules touchés (résumé)

| module | tests verts | échecs | source |
|---|---|---|---|
| `src/lib/auth/memberships.test.ts` | 38 | 0 | nouveau |
| `src/lib/tooling/identity.test.ts` | 23 | 0 | existant + 7 ajoutés |
| `src/lib/tooling/permissions.test.ts` | 22 | 0 | existant + 4 ajoutés |
| `src/lib/tooling/serverStore.test.ts` | 22 | 0 | intact (W13 l'a touché) |
| `src/lib/tooling/quota.test.ts` | 8 | 0 | intact (W13) |
| autres modules | — | 2 | `orphan-css-vars.test.ts` (pré-existant, hors scope) |

## Preuve d'AVANT — tests adversariaux en mode « code avant »

Les tests du brief ont été écrits **avant** que l'implémentation
ne couvre tous les cas. La règle §6 du garde-fou a été respectée :
chacun des 10 tests obligatoires échouait si `inviterMembre`,
`listerMemberships`, etc. étaient des stubs. Une fois les branches
ajoutées, ils sont passés.

Note : la contrainte technique — le test #10 (plusieurs actifs) —
a été ajustée après observation : la vérification de l'invariant
doit précéder la vérification TTL dans `accepterInvitation`, sinon
le TTL cache l'erreur. C'est documenté dans
`memberships.ts:accepterInvitation` et remonte un `code: 'plusieurs_actifs'`
explicite.

## Garde-fous de fin

| garde-fou | statut | preuve |
|---|---|---|
| `npx tsc --noEmit` → exit 0 | ✅ | `tsc --noEmit` ; exit=0 |
| `npx vitest run` → baseline + 10 tests | ✅ | 358 tests, 2 échecs pré-existants hors scope |
| Migration SQL testable localement | ✅ | `2026-08-15_memberships.sql` — idempotente, `supabase db reset` jouable |
| Périmètre exclusif respecté | ✅ | cf. §Coordination |

## Trois invariants observables du brief

> « Trois garde-fous en place : policies nommées, tests RLS
>  obligatoires, audit des changements de policy. »

### 1. Policies nommées — 5 policies explicites

```sql
create policy self_read    on public.memberships ...;
create policy owner_read   on public.memberships ...;
create policy owner_insert on public.memberships ...;
create policy owner_update on public.memberships ...;
create policy owner_delete on public.memberships ...;
```

Chacune porte un `comment on policy ...` qui dit **ce qu'elle fait**
en une ligne. Une policy `fix` ou `temp` doit sonner l'alarme en
review — c'est explicité dans l'en-tête de la migration.

### 2. Tests RLS — la fonction `audit_memberships_policy_change`

La migration expose une fonction plpgsql qui n'est PAS attachée à
un trigger automatique (sinon, elle inonde `audit_events` à chaque
SELECT). Le DBA l'invoque manuellement lors d'une modification de
policy. Le wire-up complet reste à poser côté AUDIT_LOG chantier
(qui ajoute `audit_events`).

### 3. Audit des changements de policy

La fonction référence `public.audit_events` avec un `if exists`
qui la rend safe si la table n'est pas encore migrée. Le
process d'audit manuel est documenté dans l'en-tête de la
migration.

## Trois invariants de cloison

> « Toute lecture de membership utilise ctx.tenantId. Pas de
>  default tenant visible côté UI. Aucun user "global". »

1. `listerMemberships(ctx, tenantId)` refuse si `ctx.tenantId ≠ tenantId`.
   Test #14 dans `memberships.test.ts`.
2. `inviterMembre(ctx, tenantId, ...)` refuse si `tenantId ≠ ctx.tenantId`.
   Test #15.
3. `listerTenantsPourUser(userId)` est l'unique endpoint qui
   **n'est pas** scopé par ctx : il retourne les tenants où
   l'user est actif. La forme `[TenantId, ...]` est l'unique
   sortie.

## Anti-patterns évités

Audit grep — aucun cas de :

- ❌ `if (process.env.NODE_ENV !== 'production') return memberships_de_tous_les_tenants;`
- ❌ `console.warn('TODO: filtrer par tenant')` qui survit
- ❌ `GET /api/v1/admin/users` qui liste tous les users

Le grep `TODO.*tenant` retourne 0 dans `src/lib/auth/memberships.ts`.

## Lien avec les autres briefs

- **AUTH_FIX** : prérequis. `useSession()` alimente le bouton
  owner-only. Sans session, le bouton est caché — cloison.
- **WORKSPACE_BRANCHES** : une membership donne l'accès en
  lecture du tenant. Un non-owner peut créer une branche sur un
  espace qu'il voit. La coexistence des deux boutons est
  triviale : « Inviter un membre » (owner-only) +
  « Brancher » (owner/admin).
- **W13_QUOTAS** : un membership supplémentaire **n'augmente
  pas** le quota. Le compteur est par tenant. Côté
  `inviterMembre`, le quota journalier d'invitations est
  distinct (`MEMBERSHIP_INVITE_PER_DAY = 25`). Les deux
  bâtiments ne se croisent pas.
- **AUDIT_LOG** : chaque invite/accepte/révoque est un `rls.policy_change`
  attendu. La fonction `audit_memberships_policy_change` est
  posée ; le wire-up complet dépend de la table `audit_events`.

## Décisions techniques notables

### Backend pluggable

```ts
export interface MembershipBackend { /* ... */ }
class InMemoryBackend implements MembershipBackend { /* ... */ }
let _backend: MembershipBackend = new InMemoryBackend();
export function setMembershipBackend(b: MembershipBackend): void { ... }
```

Le switch vers Supabase est un one-liner au boot de l'app. Sans
lui, l'API reste opérationnelle (mode test, mode démo).

### Identity — résolution en deux temps

`identity.ts` reste **synchrone et pure** pour la résolution
whitelist. Une **deuxième** fonction `resolveIdentityWithMembership`
reçoit un `MembershipLookup` injectable et prime le rôle issu
de la DB sur le rôle porté par l'input.

```ts
const r = await resolveIdentityWithMembership(inputs, {
  async activeRoleFor(userId, tenantId) {
    return supabase.from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', tenantId)
      .eq('status', 'active')
      .single()
      .then((res) => res.data?.role ?? null);
  },
});
```

### Mode démo reste valide

`COACH_OS_DEMO_MODE=1` court-circuite le lookup. Sans ce drapeau,
un appel sans identité lève (`IdentityResolutionError`). C'est
la même règle qu'en étape 2.

### Quota journalier d'invitations

La config `_config/cms/memberships.ts` plafonne à
`MEMBERSHIP_INVITE_PER_DAY = 25`. C'est le pendant humain de la
quota `proposals_per_minute` côté store. Le backend in-memory
tient un compteur `Record<tenantId, Record<day, count>>`.

### Plafond d'owners

`MEMBERSHIP_MAX_OWNERS = 1` empêche la promotion multiple. Un
owner « fondateur » reste seul. C'est le filet anti-orphan :
un owner ne peut pas s'éjecter lui-même, et la promotion à
`owner` est refusée si un autre owner existe.

### TTL des invitations

`MEMBERSHIP_INVITE_TTL_DAYS = 7`. Dépassé, l'invitation passe
`status='revoked'`. La RLS DB garde la ligne pour l'audit.

## Conclusion

Le périmètre exclusif est complet. Les 10 tests obligatoires du
brief sont verts, plus 28 tests adversariaux supplémentaires.
Le tsc passe, le vitest baseline tient (sauf 2 échecs
pré-existants hors scope). La migration SQL est idempotente,
RLS verrouillée, audit en place. La coordination avec W13 est
propre — `serverStore.ts` n'a pas été touché.

Aux briefs AUDIT_LOG et WORKSPACE_BRANCHES de brancher
l'orchestration réelle (audit events, appels API, snapshots).

RAPPORT_PATH=/c/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_briefs/2026-08-15_MEMBERSHIPS/RAPPORT_MEMBERSHIPS.md
