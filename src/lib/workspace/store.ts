// src/lib/workspace/store.ts
// Adaptateur de persistance — interface abstraite.
//
// En attendant que les autres briefs (AUTH_FIX, MEMBERSHIPS, AUDIT_LOG,
// W13_QUOTAS) soient terminés, les modules workspace utilisent un store
// IN-MEMORY pour les tests et la démo. Une fois ces branches prêtes,
// ce fichier sera remplacé par un adaptateur Supabase branché sur les
// tables `workspace_branches`, `workspace_snapshots`, `workspace_prs`,
// `workspace_pr_reviews`. Le contrat est conservé.

import type { Branch, Pr, PrReview, Snapshot } from './types';

/** Adaptateur de stockage des entités workspace. */
export interface WorkspaceStore {
  /* Branches */
  listBranches(tenantId: string): Promise<Branch[]>;
  getBranch(tenantId: string, branchId: string): Promise<Branch | null>;
  getBranchByName(tenantId: string, name: string): Promise<Branch | null>;
  insertBranch(b: Branch): Promise<Branch>;
  updateBranchHead(branchId: string, headSnapshotId: string): Promise<void>;
  deleteBranch(branchId: string): Promise<void>;

  /* Snapshots */
  insertSnapshot(s: Snapshot): Promise<Snapshot>;
  getSnapshot(snapshotId: string): Promise<Snapshot | null>;

  /* PRs */
  insertPr(p: Pr): Promise<Pr>;
  getPr(prId: string): Promise<Pr | null>;
  updatePrStatus(prId: string, status: Pr['status']): Promise<void>;
  listPrsForBranch(branchId: string, status?: Pr['status']): Promise<Pr[]>;

  /* Reviews */
  insertReview(r: PrReview): Promise<PrReview>;
  listReviewsForPr(prId: string): Promise<PrReview[]>;
}

/* ────────────────────────────────────────────────────────────────────────
 * Store in-memory — utilise pendant la phase de transition.
 * Singleton, exposé via `getWorkspaceStore()`. Les tests utilisent
 * `resetWorkspaceStore()` pour partir d'un état propre.
 * ──────────────────────────────────────────────────────────────────── */

class InMemoryWorkspaceStore implements WorkspaceStore {
  private branches = new Map<string, Branch>();
  private snapshots = new Map<string, Snapshot>();
  private prs = new Map<string, Pr>();
  private reviews = new Map<string, PrReview>();

  async listBranches(tenantId: string): Promise<Branch[]> {
    return [...this.branches.values()].filter((b) => b.tenantId === tenantId);
  }

  async getBranch(tenantId: string, branchId: string): Promise<Branch | null> {
    const b = this.branches.get(branchId);
    if (!b || b.tenantId !== tenantId) return null;
    return b;
  }

  async getBranchByName(tenantId: string, name: string): Promise<Branch | null> {
    for (const b of this.branches.values()) {
      if (b.tenantId === tenantId && b.name === name) return b;
    }
    return null;
  }

  async insertBranch(b: Branch): Promise<Branch> {
    if (this.branches.has(b.id)) {
      throw new Error(`workspace/store : branche ${b.id} existe déjà.`);
    }
    this.branches.set(b.id, b);
    return b;
  }

  async updateBranchHead(branchId: string, headSnapshotId: string): Promise<void> {
    const b = this.branches.get(branchId);
    if (!b) throw new Error(`workspace/store : branche ${branchId} introuvable.`);
    this.branches.set(branchId, { ...b, headSnapshotId });
  }

  async deleteBranch(branchId: string): Promise<void> {
    this.branches.delete(branchId);
  }

  async insertSnapshot(s: Snapshot): Promise<Snapshot> {
    if (this.snapshots.has(s.id)) {
      throw new Error(`workspace/store : snapshot ${s.id} existe déjà.`);
    }
    this.snapshots.set(s.id, s);
    return s;
  }

  async getSnapshot(snapshotId: string): Promise<Snapshot | null> {
    return this.snapshots.get(snapshotId) ?? null;
  }

  async insertPr(p: Pr): Promise<Pr> {
    if (this.prs.has(p.id)) {
      throw new Error(`workspace/store : PR ${p.id} existe déjà.`);
    }
    this.prs.set(p.id, p);
    return p;
  }

  async getPr(prId: string): Promise<Pr | null> {
    return this.prs.get(prId) ?? null;
  }

  async updatePrStatus(prId: string, status: Pr['status']): Promise<void> {
    const p = this.prs.get(prId);
    if (!p) throw new Error(`workspace/store : PR ${prId} introuvable.`);
    this.prs.set(prId, {
      ...p,
      status,
      closedAt: status === 'merged' || status === 'closed' || status === 'rejected' ? new Date().toISOString() : p.closedAt,
    });
  }

  async listPrsForBranch(branchId: string, status?: Pr['status']): Promise<Pr[]> {
    return [...this.prs.values()].filter(
      (p) =>
        (p.sourceBranchId === branchId || p.targetBranchId === branchId) &&
        (status === undefined || p.status === status),
    );
  }

  async insertReview(r: PrReview): Promise<PrReview> {
    if (this.reviews.has(r.id)) {
      throw new Error(`workspace/store : review ${r.id} existe déjà.`);
    }
    this.reviews.set(r.id, r);
    return r;
  }

  async listReviewsForPr(prId: string): Promise<PrReview[]> {
    return [...this.reviews.values()].filter((r) => r.prId === prId);
  }
}

let _store: WorkspaceStore | null = null;

export function getWorkspaceStore(): WorkspaceStore {
  if (!_store) _store = new InMemoryWorkspaceStore();
  return _store;
}

/** Injecte un adaptateur custom (utile pour les tests Supabase simulés). */
export function setWorkspaceStore(store: WorkspaceStore | null): void {
  _store = store;
}

/** Réinitialise le store in-memory. Réservé aux tests. */
export function resetWorkspaceStore(): void {
  _store = new InMemoryWorkspaceStore();
}