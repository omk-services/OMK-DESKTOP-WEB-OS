// src/lib/workspace/types.ts
// Types partagés pour le système de WorkSpaces versionnés.
//
// Modèle conceptuel (voir BRIEF_WORKSPACE_BRANCHES §"Modèle conceptuel") :
//   Tenant  ≈ Repository
//   Branche ≈ Workspace (= une variante du main, versionnée)
//   Snapshot = Commit (sérialisation déterministe d'un workspace)
//   PR      = Pull Request (diff entre deux snapshots, 2 reviews)
//   Merge   = Merge (intégration d'une branche dans main)

/** Rôle — réutilise la taxonomie MEMBERSHIPS sans la dupliquer. */
export type MembershipRole = 'owner' | 'admin' | 'member' | 'guest';

/** Un tenant. Identifiant opaque, kebab/snake, 1-64 caractères, [a-z0-9_-]. */
export type TenantId = string & { readonly __brand: 'TenantId' };

/** Forme canonique d'un workspace sérialisable.
 *  - `collections` : defs de collections (CmsCollectionDef-shaped).
 *  - `items`       : items indexés par collectionId.
 *  - `memberships` : membres actifs du workspace (sub-set du tenant). */
export interface WorkspaceData {
  collections: ReadonlyArray<CollectionLite>;
  items: ReadonlyArray<ItemLite>;
  memberships: ReadonlyArray<MembershipLite>;
}

export interface CollectionLite {
  id: string;
  name: string;
  singular: string;
  accent?: string;
  titleField?: string;
  subtitleField?: string;
  badgeField?: string;
  fields?: ReadonlyArray<{ key: string; label: string; type: string }>;
}

export interface ItemLite {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
}

export interface MembershipLite {
  userId: string;
  role: MembershipRole;
  status: 'pending' | 'active' | 'revoked';
}

/** Une branche — un pointeur vers une chaîne de snapshots. */
export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  parentBranchId: string | null;
  parentSnapshotId: string | null;
  headSnapshotId: string | null;
  createdBy: string;
  createdAt: string;
  isDefault: boolean;
}

/** Un snapshot — commit sérialisable et immuable. */
export interface Snapshot {
  id: string;
  branchId: string;
  parentSnapshotId: string | null;
  payload: string;        // JSON canonique
  payloadHash: string;    // SHA-256 hex du payload
  message: string;
  authorId: string;
  createdAt: string;
}

/** Une Pull Request — diff entre deux snapshots. */
export interface Pr {
  id: string;
  tenantId: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceSnapshotId: string;
  title: string;
  description: string | null;
  status: 'open' | 'approved' | 'rejected' | 'merged' | 'closed';
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
}

/** Une review sur une PR — un verdict par reviewer. */
export interface PrReview {
  id: string;
  prId: string;
  reviewerId: string;
  verdict: 'approve' | 'reject' | 'comment';
  comment: string | null;
  createdAt: string;
}

/** Diff entre deux workspaces. */
export interface Diff {
  collectionsAdded: CollectionLite[];
  collectionsRemoved: string[];
  itemsAdded: ItemLite[];
  itemsModified: Array<{ before: ItemLite; after: ItemLite }>;
  itemsRemoved: string[];
  membersAdded: MembershipLite[];
  membersRevoked: string[];
}

/** Conflit pendant un merge. */
export interface Conflict {
  itemId: string;
  reason: 'diverged_from_common_parent';
  baseHash: string | null;
  sourceHash: string;
  targetHash: string;
}

/** Codes d'échec standardisés pour les modules workspace. */
export type WorkspaceErrorCode =
  | 'forbidden'
  | 'self_approval'
  | 'not_found'
  | 'duplicate_name'
  | 'protected_branch'
  | 'invalid_state'
  | 'conflict';

export interface WorkspaceFailure {
  ok: false;
  code: WorkspaceErrorCode;
  error: string;
}

export type WorkspaceResult<T> = { ok: true; data: T } | WorkspaceFailure;