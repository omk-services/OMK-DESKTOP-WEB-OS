// src/lib/workspace/pr.ts
// Pull Requests : open, review, peutMerger.
//
// Règle du reviewer (cf. BRIEF_WORKSPACE_BRANCHES §pr.ts) :
//   - Un PR ne peut pas être review par son auteur (sauf owner).
//   - Owner et admin peuvent review n'importe quelle PR du tenant.
//   - 2 reviews `approve` requises pour passer la PR en `approved`.
//   - 1 seule `reject` la passe en `rejected`.

import type {
  MembershipRole,
  Pr,
  PrReview,
  WorkspaceResult,
} from './types';
import { peut } from './permissions';
import { getWorkspaceStore } from './store';

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface OpenPrInput {
  tenantId: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  description?: string;
  actorId: string;
  actorRole: MembershipRole;
}

export async function openPr(input: OpenPrInput): Promise<WorkspaceResult<Pr>> {
  const guard = peut('ouvrirPr', { role: input.actorRole });
  if (!guard.ok) return guard;
  if (input.sourceBranchId === input.targetBranchId) {
    return { ok: false, code: 'invalid_state', error: 'Source et target sont identiques.' };
  }
  const store = getWorkspaceStore();
  const src = await store.getBranch(input.tenantId, input.sourceBranchId);
  const tgt = await store.getBranch(input.tenantId, input.targetBranchId);
  if (!src || !tgt) {
    return { ok: false, code: 'not_found', error: 'Branche source ou target introuvable.' };
  }
  if (!src.headSnapshotId) {
    return {
      ok: false,
      code: 'invalid_state',
      error: 'La branche source n\'a aucun snapshot.',
    };
  }

  // Vérifier qu'il n'existe pas déjà une PR ouverte sur la même paire.
  const existing = await store.listPrsForBranch(src.id, 'open');
  const dup = existing.find(
    (p) =>
      p.sourceBranchId === src.id &&
      p.targetBranchId === tgt.id &&
      p.sourceSnapshotId === src.headSnapshotId,
  );
  if (dup) {
    return {
      ok: false,
      code: 'duplicate_name',
      error: 'Une PR identique est déjà ouverte.',
    };
  }

  const pr: Pr = {
    id: genId('pr'),
    tenantId: input.tenantId,
    sourceBranchId: src.id,
    targetBranchId: tgt.id,
    sourceSnapshotId: src.headSnapshotId!,
    title: input.title,
    description: input.description ?? null,
    status: 'open',
    createdBy: input.actorId,
    createdAt: nowIso(),
    closedAt: null,
  };
  await store.insertPr(pr);
  return { ok: true, data: pr };
}

export interface ReviewPrInput {
  prId: string;
  reviewerId: string;
  reviewerRole: MembershipRole;
  verdict: 'approve' | 'reject' | 'comment';
  comment?: string;
}

/** Enregistre un verdict de review. Met à jour le statut de la PR si
 *  les seuils sont franchis (2 approve, 1 reject). */
export async function reviewPr(input: ReviewPrInput): Promise<WorkspaceResult<PrReview>> {
  const store = getWorkspaceStore();
  const pr = await store.getPr(input.prId);
  if (!pr) return { ok: false, code: 'not_found', error: 'PR introuvable.' };
  if (pr.status !== 'open') {
    return { ok: false, code: 'invalid_state', error: 'PR fermée — aucun verdict accepté.' };
  }
  const guard = peut('reviewerPr', {
    role: input.reviewerRole,
    actorId: input.reviewerId,
    authorId: pr.createdBy,
  });
  if (!guard.ok) return guard;

  const review: PrReview = {
    id: genId('rev'),
    prId: pr.id,
    reviewerId: input.reviewerId,
    verdict: input.verdict,
    comment: input.comment ?? null,
    createdAt: nowIso(),
  };
  await store.insertReview(review);

  // Rejette → PR passe en `rejected` immédiatement.
  if (input.verdict === 'reject') {
    await store.updatePrStatus(pr.id, 'rejected');
  } else if (input.verdict === 'approve') {
    const all = await store.listReviewsForPr(pr.id);
    const approves = all.filter((r) => r.verdict === 'approve');
    if (approves.length >= 2) {
      await store.updatePrStatus(pr.id, 'approved');
    }
  }
  return { ok: true, data: review };
}

/** Une PR est-elle mergeable (status approved uniquement). */
export async function peutMerger(prId: string, actorRole: MembershipRole): Promise<boolean> {
  const store = getWorkspaceStore();
  const pr = await store.getPr(prId);
  if (!pr) return false;
  // La règle des 2 approve force status='approved' avant qu'on puisse merger.
  if (pr.status !== 'approved') return false;
  const guard = peut('mergerPr', { role: actorRole });
  return guard.ok;
}

/** Helper : liste les PR d'une branche (source OU target). */
export async function listPrs(branchId: string): Promise<Pr[]> {
  const store = getWorkspaceStore();
  return store.listPrsForBranch(branchId);
}