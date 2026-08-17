---
id: MEMBERSHIPS
campagne: 2026-08-15
phase: 3 — multi-utilisateurs par tenant
préconditions: |
  AUTH_FIX doit être vert (useSession() fonctionnel) avant ce brief.
  Sinon les memberships sont inertes — pas de session = pas d'acteur.
perimetre_exclusif: |
  src/lib/auth/memberships.ts             (nouveau — table + API)
  src/lib/auth/memberships.test.ts        (nouveau)
  src/lib/permissions.ts                  (étendu — role par membership)
  src/lib/tooling/identity.ts             (étendu — accepte memberships)
  src/lib/tooling/serverStore.ts          (étendu — toutes les lectures utilisent memberships)
  src/lib/tenant/contract.ts              (étendu — MembershipRecord exporté)
  src/components/ProfileWorkspaceSection.tsx (étendu — UI d'invitation)
  src/components/InviteMember.tsx         (nouveau — modal d'invitation)
  src/stores/memberships.store.ts         (nouveau — Zustand)
  _config/cms/memberships.ts              (nouveau — seuils)
  supabase/migrations/2026-08-15_memberships.sql   (nouveau — schema SQL)
interdit: |
  src/lib/cms/**
  src/apps/**
  src/components/auth/**
  api/**
artifact_obligatoire: |
  _briefs/2026-08-15_MEMBERSHIPS/RAPPORT_MEMBERSHIPS.md
  supabase/migrations/2026-08-15_memberships.sql
---

# BRIEF_MEMBERSHIPS — multi-utilisateurs par tenant

## La phrase qui commande ce brief

> **Tant que la jonction `auth.users` ↔ `tenant` n'existe pas, coach-os
> est mono-utilisateur par déploiement. C'est la table `memberships` qui
> fait la jonction, et c'est elle qui rend la vente multi-clients possible.**

## Architecture

### Table Supabase `memberships`

```sql
-- supabase/migrations/2026-08-15_memberships.sql
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,                    -- correspond à TenantId de lib/tenant/contract.ts
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','guest')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  unique (tenant_id, user_id)
);

alter table public.memberships enable row level security;

-- Un user ne voit que ses propres memberships.
create policy "self_read" on public.memberships
  for select using (auth.uid() = user_id);

-- Un owner voit toutes les memberships de ses tenants.
create policy "owner_read" on public.memberships
  for select using (
    exists (
      select 1 from public.memberships m2
      where m2.tenant_id = memberships.tenant_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  );

-- Un owner invite (insert) — son propre rôle ne change pas via cette policy.
create policy "owner_insert" on public.memberships
  for insert with check (
    exists (
      select 1 from public.memberships m2
      where m2.tenant_id = memberships.tenant_id
        and m2.user_id = auth.uid()
        and m2.role = 'owner'
        and m2.status = 'active'
    )
  );

-- Index pour les lookups par user (auth.uid()).
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_tenant_id_status_idx on public.memberships (tenant_id, status);
```

**Pourquoi `status` plutôt qu'un booléen `active`** : un membership
révoqué reste dans la table pour l'audit. Le statut `pending` est pour
les invitations email pas encore acceptées.

### Type `MembershipRecord`

`src/lib/tenant/contract.ts` :

```ts
export type MembershipRole = 'owner' | 'admin' | 'member' | 'guest';

export interface MembershipRecord {
  id: string;
  tenantId: TenantId;
  userId: string;
  role: MembershipRole;
  status: 'pending' | 'active' | 'revoked';
  invitedBy: string | null;
  invitedAt: string;
  acceptedAt: string | null;
}
```

### API `src/lib/auth/memberships.ts`

```ts
// Pseudo-code. Toutes les fonctions prennent un ctx vérifié.
export async function listerMemberships(ctx: ToolContext): Promise<MembershipRecord[]>;
export async function inviterMembre(
  ctx: ToolContext, tenantId: TenantId, email: string, role: MembershipRole
): Promise<{ ok: true; invitationId: string } | { ok: false; raison: string }>;
export async function accepterInvitation(ctx: ToolContext, invitationId: string): Promise<...>;
export async function changerRole(
  ctx: ToolContext, tenantId: TenantId, userId: string, nouveauRole: MembershipRole
): Promise<...>;
export async function revoquer(
  ctx: ToolContext, tenantId: TenantId, userId: string
): Promise<...>;
export async function quitter(ctx: ToolContext, tenantId: TenantId): Promise<...>;
```

**Règle** : toutes ces fonctions passent par `ctx.role === 'owner'`
pour les opérations d'écriture (sauf `quitter` qui est universel).
Les checks de rôle utilisent **la membership du tenant actif**, pas
`ctx.role` global (un owner dans tenant A n'est rien dans tenant B).

### Branchement avec `identity.ts`

`identity.ts:73-129` (`resolveIdentity`) ne sait aujourd'hui que valider
des entrées whitelist. Il ne sait pas **lire les memberships**.

**Ce que tu ajoutes** : après la validation whiteliste, si Supabase est
configuré, requêter `memberships WHERE user_id = $1 AND tenant_id = $2`
pour récupérer le rôle réel. Si plusieurs memberships actives existent
pour ce `(user, tenant)`, **refus** (état incohérent, à signaler).

```ts
// Pseudo-code.
const memberships = await chargerMemberships(userId, tenantId);
if (memberships.length === 0) {
  return { ok: false, error: 'Aucun membership actif pour ce tenant.', missing: ['membership'] };
}
if (memberships.length > 1) {
  return { ok: false, error: 'Plusieurs memberships actifs détectés.', missing: ['membership_uniqueness'] };
}
const m = memberships[0];
return { ok: true, ctx: { tenantId, actorId: userId, role: m.role }, source: 'full' };
```

**Mode démo reste valide** : `COACH_OS_DEMO_MODE=1` court-circuite la
lecture memberships. Sinon plus personne ne peut se logger en local.

### UI `InviteMember.tsx`

Un modal accessible depuis `ProfileWorkspaceSection.tsx`. Champs :
email, rôle (select : owner / admin / member / guest), bouton
« Envoyer ». Bouton visible seulement pour les `owner` du tenant.

**Pas de magic link dans ce brief** : l'invitation envoie un email
via Supabase Auth (`supabase.auth.admin.inviteUserByEmail`), pas un
client custom. Le user reçoit un mail standard de Supabase, accepte,
arrive dans le tenant avec le rôle prévu.

## Tests obligatoires (10)

| # | nom | vérifie |
|---|---|---|
| 1 | `listerMemberships_owner_voit_tout` | owner voit tous les membres actifs |
| 2 | `listerMemberships_member_voit_que_lui` | member ne voit que sa propre ligne |
| 3 | `listerMemberships_guest_refuse` | guest n'a pas accès |
| 4 | `inviter_avec_owner_cree_pending` | invite → status `pending` |
| 5 | `inviter_avec_member_refuse` | member ne peut pas inviter |
| 6 | `accepter_invitation_passe_status_active` | après acceptation, status `active` |
| 7 | `changer_role_owner_only` | member ne peut pas changer un rôle |
| 8 | `revoquer_owner_uniquement` | member ne peut pas révoquer |
| 9 | `quitter_universel` | n'importe quel rôle peut quitter |
| 10 | `deux_memberships_actifs_meme_user_refus` | état incohérent détecté |

## Garde-fous de fin

- `npx tsc --noEmit` → exit 0
- `npx vitest run` → baseline 209/211 + 10 tests verts
- La migration SQL est testable via `supabase db reset` localement
- Le rapport `_briefs/2026-08-15_MEMBERSHIPS/RAPPORT_MEMBERSHIPS.md`
  contient le tableau des 10 tests avec `avant`/`après`/`fichier:ligne`.

## Lien avec les autres briefs

- **AUTH_FIX** : prérequis (`useSession()`).
- **AUDIT_LOG** : chaque `invite`/`accepte`/`revoque` est un événement.
- **WORKSPACE_BRANCHES** : un non-owner peut créer une branche sur un
  espace de travail qu'il voit — la membership lui donne l'accès en
  lecture sur le tenant.
- **Quotas W13** : un membership supplémentaire **n'augmente pas le
  quota** du tenant. Le quota est par tenant, pas par utilisateur.

## Défense contre la dette par obscurité (NOUVEAU 2026-08-15)

**Le risque** : la sécurité RLS ci-dessus est correcte **tant que
personne ne la modifie**. Un humain qui édite la migration SQL pour
« juste enlever ce check » ouvre une dette qu'aucune review ne
rattrapera si la policy passe en revue superficielle.

**La défense** : rendre la politique **difficile à modifier
discrètement** par des invariants observables.

### Trois garde-fous en place

1. **Policies nommées, jamais anonymes.** Le nom de chaque policy
   dit ce qu'elle fait (`owner_read`, `owner_insert`, `self_read`).
   Une policy `fix` ou `temp` ou `admin_bypass` doit sonner l'alarme
   en review.

   ```sql
   -- AJOUTER dans la migration 2026-08-15_memberships.sql
   comment on policy "self_read" on public.memberships
     is 'Un user lit ses propres memberships. Aucune lecture croisee.';
   comment on policy "owner_read" on public.memberships
     is 'Owner lit toutes les memberships du tenant.';
   ```

2. **Tests RLS obligatoires dans la migration.** Pour chaque policy,
   un test qui vérifie l'effet attendu. Si quelqu'un retire la
   policy, le test casse **et** la CI le voit.

   ```sql
   -- Dans une migration de test separée, pas en prod
   -- (sinon pgTAP embarque dans la prod)
   create or replace function tests.test_rls_self_read() returns boolean as $$
   begin
     -- Simuler un user A, un user B, un membership A→tenant.
     -- Verifier que user B ne voit pas le membership de A.
     return true;
   end;
   $$ language plpgsql;
   ```

3. **Audit des changements de policy via le kernel.** Toute
   modification de `pg_policies` (création, altération, drop) doit
   écrire dans `audit_events` avec `action = 'rls.policy_change'`.
   Le propriétaire du tenant est notifié. Tu ne changes pas une policy
   en silence — tu changes une policy **avec trace**.

   ```sql
   create or replace function public.audit_policy_change() returns trigger
   language plpgsql as $$
   begin
     insert into public.audit_events
       (tenant_id, actor_id, action, target_type, target_id, metadata)
     values
       (current_setting('app.tenant_id', true),
        auth.uid(),
        'rls.policy_change',
        'policy',
        tg_objectid::text || ':' || tg_op,
        jsonb_build_object('policy', tg_ar:name, 'op', tg_op));
     return null;
   end;
   $$;

   create trigger audit_memberships_policies
     after insert or update or delete on pg_policy
     for each row when (tg_tableoid::regclass::text = 'public.memberships')
     execute function public.audit_policy_change();
   ```

### Pourquoi c'est important

Aujourd'hui, si tu modifies `self_read` pour « débugger », tu perds
l'isolation par accident. Avec la trace `rls.policy_change`, le
prochain audit log te dira exactement quand, et la review le verra.
La dette n'est pas éliminée — elle est **vue**.

## Workspaces de réception et cloison stricte (NOUVEAU 2026-08-15)

**Le risque** : un membre invité dans un tenant T1 voit les
données de T1. S'il est aussi membre de T2, il voit T2. Mais s'il
existe un chemin (par exemple, un `tenant_id` non validé dans une
URL ou une prop React) où un membre de T1 voit les données de T2,
la cloison est rompue.

**La défense** : le membership **est** la cloison. Pas de query qui
puisse traverser un `tenant_id` sans passer par la policy.

### Trois invariants

1. **Toute lecture de données métier passe par `ctx.tenantId`**,
   déjà imposé par `serverStore.ts:assertTenantId` (campagne du
   2026-08-14). Ce brief ajoute : **toute lecture de membership
   aussi**. Si tu appelles `listerMemberships(ctx)` sans ctx valide,
   tu reçois `{ ok: false, raison: 'ctx_manquant' }`.

   ```ts
   // Pseudo-code.
   export async function listerMemberships(ctx: ToolContext): Promise<...> {
     if (!ctx?.tenantId) {
       return { ok: false, raison: 'ctx_manquant', memberships: [] };
     }
     // Suite inchangée
   }
   ```

2. **Le profil utilisateur n'a accès qu'à ses tenants.** Le store
   `useSession()` (cf. AUTH_FIX) expose `user` mais pas `tenants`.
   Quand un composant veut lister les workspaces de l'utilisateur,
   il appelle `listerMemberships(ctx)` pour chaque tenantId qu'il
   connaît, **ou** un nouveau endpoint `listerTenantsPourUser(userId)`
   qui retourne **uniquement** les tenants où le user a une membership
   active. Pas de fuite d'un tenant à l'autre.

3. **Pas de "default tenant".** Le `tenantId` par défaut (`__default__`)
   existe pour la rétrocompatibilité, mais **toute UI** qui propose un
   tenant à l'utilisateur doit appeler `listerTenantsPourUser()` et
   afficher la liste réelle. Si l'utilisateur n'a aucun membership,
   l'UI affiche « Vous n'avez accès à aucun espace de travail » et
   un bouton « Demander un accès » (qui crée une invitation pending).

### Tests supplémentaires (5)

| # | nom | vérifie |
|---|---|---|
| 11 | `listerMemberships_ctx_manquant_refuse` | sans ctx, refus explicite |
| 12 | `listerTenantsPourUser_isole_les_tenants` | user A membre de T1 et T2 ; appel retourne `[T1, T2]` ; user B non-membre retourne `[]` |
| 13 | `rls_self_read_user_B_ne_voit_pas_membership_de_A` | test SQL de la policy |
| 14 | `rls_owner_read_owner_voit_mais_member_pas` | idem |
| 15 | `rls_owner_insert_member_ne_peut_pas_inviter` | idem |

## Anti-patterns à surveiller (NOUVEAU)

Trois choses qui **doivent rester absentes** du code, sinon dette
par obscurité :

- ❌ Un `if (process.env.NODE_ENV !== 'production') return memberships_de_tous_les_tenants;`
- ❌ Un `console.warn('TODO: filtrer par tenant')` qui survit à un commit
- � Un endpoint `GET /api/v1/admin/users` qui liste tous les users de tous les tenants sans policy RLS

Si tu en trouves, **efface-les** avant d'envoyer. Ne les commente
pas « pour plus tard ». La dette par commentaire est la même
dette par code.
