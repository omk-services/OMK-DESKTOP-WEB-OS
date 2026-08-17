---
id: WORKSPACE_BRANCHES
campagne: 2026-08-15
phase: 5 — WorkSpaces versionnés, branche/PR/merge
préconditions: |
  AUTH_FIX vert (sinon on ne sait pas qui branche).
  MEMBERSHIPS vert (sinon le reviewer n'a pas de rôle assigné).
  AUDIT_LOG vert (les événements workspace.* sont consommés).
perimetre_exclusif: |
  src/lib/workspace/branches.ts             (nouveau — createBranch, listBranches, getBranch, deleteBranch)
  src/lib/workspace/branches.test.ts        (nouveau)
  src/lib/workspace/diff.ts                 (nouveau — diff snapshot A vs snapshot B)
  src/lib/workspace/diff.test.ts
  src/lib/workspace/merge.ts                (nouveau — merge branch → main, conflits)
  src/lib/workspace/merge.test.ts
  src/lib/workspace/pr.ts                   (nouveau — openPr, reviewPr, mergePr)
  src/lib/workspace/pr.test.ts
  src/lib/workspace/snapshot.ts             (nouveau — sérialisation déterministe d'un workspace)
  src/lib/workspace/snapshot.test.ts
  src/lib/workspace/permissions.ts          (nouveau — qui peut brancher, qui peut merger)
  src/components/workspace/BranchTree.tsx   (nouveau — visualisation)
  src/components/workspace/PrViewer.tsx     (nouveau — vue PR + diff inline)
  src/components/workspace/InviteReviewer.tsx (nouveau — modal d'invitation reviewer)
  src/components/ProfileWorkspaceSection.tsx (étendu — bouton « Brancher »)
  src/apps/workspace/index.tsx              (nouveau — app dédiée aux branches)
  src/stores/branches.store.ts              (nouveau — Zustand)
  _config/cms/workspace.ts                  (nouveau — defaults)
  supabase/migrations/2026-08-15_workspace_branches.sql
interdit: |
  src/lib/cms/**
  src/apps/_ui/**
  src/lib/tooling/identity.ts        (ne pas toucher — déjà AUTH_FIX)
  src/lib/tooling/permissions.ts    (garder l'existant)
  src/lib/auth/memberships.ts       (étendre, pas remplacer)
  src/lib/audit/**
artifact_obligatoire: |
  _briefs/2026-08-15_WORKSPACE_BRANCHES/RAPPORT_WORKSPACE_BRANCHES.md
  supabase/migrations/2026-08-15_workspace_branches.sql
---

# BRIEF_WORKSPACE_BRANCHES — WorkSpaces versionnés, branche/PR/merge

## La phrase qui commande ce brief

> **Un WorkSpace coach-os n'est plus un snapshot figé. C'est une
> branche. Une branche peut être partagée en lecture à un visiteur,
> éditée par un sous-ensemble, et mergée dans le main par un
> owner — comme Git. La cloison entre la branche de présentation et
> le main est ce qui permet de montrer un Coach OS à un prospect sans
> risquer de casser l'original.**

## Modèle conceptuel — Git appliqué aux WorkSpaces

| Git | Coach OS |
|---|---|
| Repository | Tenant (un `tenantId` = un dépôt Git) |
| Branch | WorkSpace (un `workspace_id` = une branche du tenant) |
| Commit | Snapshot (sérialisation déterministe du WorkSpace à un instant t) |
| Pull Request | PR (diff entre deux snapshots, deux reviews requises) |
| Merge | Merge (intégration d'une branche dans `main` après résolution de conflits) |
| Tag | Release (snapshot nommé, immuable) |
| HEAD | WorkSpace actif de l'utilisateur |

**Le `main` est le WorkSpace par défaut** d'un tenant. Toutes les
écritures vont dans `main` sauf si l'utilisateur a explicitement
basculé sur une branche.

## Architecture

### Table Supabase `workspace_branches`

```sql
-- supabase/migrations/2026-08-15_workspace_branches.sql
create table public.workspace_branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  name text not null,                         -- 'main' (immutable, default), 'presentation-prospect-x', etc.
  parent_branch_id uuid references public.workspace_branches(id),
  parent_snapshot_id uuid references public.workspace_snapshots(id),
  head_snapshot_id uuid references public.workspace_snapshots(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  is_default boolean not null default false,
  -- un seul `main` par tenant
  unique (tenant_id, name),
  unique (tenant_id, is_default) deferrable initially deferred
);

create table public.workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.workspace_branches(id) on delete cascade,
  parent_snapshot_id uuid references public.workspace_snapshots(id),
  -- contenu complet du workspace sérialisé : collections + items + memberships
  payload jsonb not null,
  -- hash SHA-256 du payload pour intégrité
  payload_hash text not null,
  -- message de commit court
  message text,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (payload_hash)
);

create table public.workspace_prs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  source_branch_id uuid not null references public.workspace_branches(id),
  target_branch_id uuid not null references public.workspace_branches(id),
  source_snapshot_id uuid not null references public.workspace_snapshots(id),
  -- snapshot virtuel du merge (recalculé à la demande)
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','approved','rejected','merged','closed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  -- pas deux PR ouvertes sur la même paire (source, target, source_snapshot)
  unique (source_branch_id, target_branch_id, source_snapshot_id, status)
);

create table public.workspace_pr_reviews (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid not null references public.workspace_prs(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  verdict text not null check (verdict in ('approve','reject','comment')),
  comment text,
  created_at timestamptz not null default now(),
  unique (pr_id, reviewer_id)
);

alter table public.workspace_branches enable row level security;
alter table public.workspace_snapshots enable row level security;
alter table public.workspace_prs enable row level security;
alter table public.workspace_pr_reviews enable row level security;

-- RLS simplifiée : un member du tenant peut lire les branches de son tenant.
-- Écriture : owner + admin.
-- Le détail des policies est dans le brief, pas dans le rapport.
```

### Sérialisation déterministe `snapshot.ts`

```ts
// Pseudo-code.
// L'ordre des clés et la sérialisation sont déterministes : même
// workspace → même hash SHA-256. C'est ce qui rend le diff et le
// merge possibles.
export async function serialiser(workspace: WorkspaceData): Promise<{
  payload: string;
  payloadHash: string;
}>;

// Restaurer à partir d'un payload
export async function restorer(payload: string): Promise<WorkspaceData>;

// Snapshot = (branch_id, payload, payload_hash, parent_snapshot_id, message, author_id)
export async function commit(
  branchId: string, message: string, ctx: ToolContext
): Promise<Snapshot>;
```

### Diff `diff.ts`

```ts
// Pseudo-code.
// Trois catégories : collections ajoutées/supprimées, items
// ajoutés/modifiés/supprimés, membres ajoutés/révoqués.
export interface Diff {
  collectionsAdded: CollectionDef[];
  collectionsRemoved: string[];
  itemsAdded: CmsItem[];
  itemsModified: { before: CmsItem; after: CmsItem }[];
  itemsRemoved: string[];
  membersAdded: MembershipRecord[];
  membersRevoked: string[];
}
export function diff(a: WorkspaceData, b: WorkspaceData): Diff;
```

### Branches `branches.ts`

```ts
// Pseudo-code.
export async function createBranch(
  ctx: ToolContext, tenantId: string, name: string, parentBranch: string
): Promise<Branch>;

export async function listBranches(
  ctx: ToolContext, tenantId: string
): Promise<Branch[]>;

// `main` est implicite et créé à la première lecture si absent.
export async function getMainBranch(tenantId: string): Promise<Branch>;

// Snapshot d'un workspace à un instant t (toujours non-mutable côté
// client — on fork pour modifier).
export async function snapshotBranch(
  ctx: ToolContext, branchId: string, message: string
): Promise<Snapshot>;
```

**Règle** : `main` est créé **automatiquement** lors de la première
lecture pour un nouveau tenant. Pas de bouton « créer main ». Un
owner peut renommer une branche mais pas supprimer `main`.

### Pull Request `pr.ts`

```ts
// Pseudo-code.
export async function openPr(
  ctx: ToolContext,
  sourceBranchId: string,
  targetBranchId: string,
  title: string, description: string
): Promise<Pr>;

export async function reviewPr(
  ctx: ToolContext, prId: string, verdict: 'approve' | 'reject', comment?: string
): Promise<void>;

// Deux revues `approve` requises pour passer la PR en `approved`.
// Une seule `reject` la passe en `rejected`.
export async function peut merger(prId: string): Promise<boolean>;
```

**Règle du reviewer** : un PR ne peut pas être review par son auteur.
Un owner du tenant peut review n'importe quelle PR. Un admin peut
review n'importe quelle PR du tenant.

### Merge `merge.ts`

```ts
// Pseudo-code.
export async function mergePr(
  ctx: ToolContext, prId: string
): Promise<{ ok: true; newSnapshot: Snapshot } | { ok: false, conflits: Conflict[] }>;

// Trois états après tentative de merge :
//   - ok: true → nouveau snapshot créé sur target_branch, source n'est pas supprimée
//   - ok: false + conflits → la PR reste `open`, l'auteur doit résoudre
//   - target branch protégée pendant le merge (lock optimiste par HEAD snapshot id)
```

**Conflit** : si la même `item_id` a été modifiée dans `source` et
`target` depuis le parent commun, conflit. Pas de fusion 3-way auto
ici — c'est une résolution manuelle par l'auteur de la PR.

### Permissions `workspace/permissions.ts`

```ts
// Pseudo-code.
export function peutCreerBranche(role: MembershipRole): boolean;       // owner, admin
export function peutOuvrirPr(role: MembershipRole): boolean;          // owner, admin, member
export function peutReviewPr(role: MembershipRole): boolean;           // owner, admin
export function peutMergerPr(role: MembershipRole): boolean;            // owner uniquement
export function peutSupprimerBranche(role: MembershipRole, isMain: boolean): boolean;
  // seul owner, et seulement si isMain === false
```

**Hérite de MEMBERSHIPS** : le rôle vient de la membership active
du tenant. Pas un rôle global.

## UI

### `BranchTree.tsx`

Vue arborescente :

```
main ──────────────────────────────────────● HEAD (snapshot_abc123)
 │
 ├── presentation-prospect-acme           ● HEAD (snapshot_def456)
 │   ├── presentation-prospect-acme-v2   ● HEAD (snapshot_ghi789)
 │   └── ...
 │
 ├── staging-experiment-cognitive          ● HEAD (snapshot_jkl012)
 │
 PRs ouvertes :
   PR #42: presentation-prospect-acme → main
     [Approuvé par amdkn777 ✓]
     [En attente de review par omk-services]
```

Clic sur une branche = switch du WorkSpace actif vers ce snapshot.
Clic sur une PR = ouvre `PrViewer`.

### `PrViewer.tsx`

Vue d'une PR :

- Titre, description, auteur, date
- Liste des reviewers et leurs verdicts
- **Diff inline** (sections « Items ajoutés », « Items modifiés »,
  « Items supprimés », « Membres ajoutés », « Membres révoqués »)
- Boutons « Approve » / « Reject » / « Commenter » (selon permissions)
- Bouton « Merge » (visible seulement si `peut merger`)

### `InviteReviewer.tsx`

Modal accessible depuis PrViewer. Liste des membres du tenant
(filtrée par `memberships`). Sélection multiple. Chaque reviewer
reçoit un email standard de Supabase avec un lien vers la PR.

## Tests obligatoires (16)

| # | nom | vérifie |
|---|---|---|
| 1 | `serialiser_deterministe` | même workspace → même hash |
| 2 | `restorer_inverse_serialiser` | aller-retour sans perte |
| 3 | `main_cree_automatiquement` | premier accès à un tenant crée `main` |
| 4 | `createBranch_owner_ok` | owner peut créer une branche |
| 5 | `createBranch_member_refuse` | member ne peut pas créer |
| 6 | `createBranch_nom_unique` | deux branches même nom → refus |
| 7 | `snapshot_incremente_HEAD` | après snapshot, `head_snapshot_id` pointe sur le nouveau |
| 8 | `snapshot_pa_consolidation_immediate` | snapshot est indépendant, pas de rebuild |
| 9 | `diff_detecte_3_categories` | collections / items / membres |
| 10 | `openPr_refuse_si_pas_open` | PR déjà fermée ne peut pas être rouverte |
| 11 | `reviewPr_auteur_ne_peut_pas_reviewer` | auteur exclu |
| 12 | `peut_merger_apres_2_approve` | règle des deux revues |
| 13 | `merge_sans_conflit_ok` | merge propre |
| 14 | `merge_avec_conflit_refuse` | conflit → PR reste `open` |
| 15 | `peut_merger_owner_seulement` | admin refuse |
| 16 | `supprimer_branche_member_refuse` | member ne peut pas supprimer une branche |

## Garde-fous de fin

- `npx tsc --noEmit` → exit 0
- `npx vitest run` → baseline 209/211 + tests précédents + 16 tests
  WORKSPACE_BRANCHES verts
- Migration SQL testable localement (`supabase db reset`)
- Rapport `_briefs/2026-08-15_WORKSPACE_BRANCHES/RAPPORT_WORKSPACE_BRANCHES.md`
  avec le tableau des 16 tests.

## Lien avec les autres briefs

- **AUTH_FIX** : prérequis (qui branche ?).
- **MEMBERSHIPS** : prérequis (rôle = membership).
- **AUDIT_LOG** : chaque action `workspace.*` est un événement.
- **W13_QUOTAS** : créer une branche et merger sont des écritures —
  elles passent par le quota.

## Le scénario d'usage que ça déverrouille

Tu prends `main`. Tu crées `presentation-prospect-acme`. Tu y mets
un sous-ensemble de collections, un sous-ensemble d'items, peut-être
un thème différent, peut-être des membres cachés. Tu partages
**l'URL de cette branche** (pas l'URL de `main`) avec le prospect.
Le prospect voit, ne peut pas modifier (pas de membership), ne peut
rien casser. Tu reprends la branche, tu en crées une autre pour un
autre prospect. `main` reste intact. Quand un prospect devient client,
tu merges sa branche dans `main`.

C'est la version Coach OS de **« fork the repo, send a PR, review,
merge »**. Adaptée à un public qui ne sait pas ce qu'est un terminal.
