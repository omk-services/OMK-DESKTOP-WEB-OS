// src/lib/workspace/pr.test.ts
// Tests : openPr (refuse si pas open), reviewPr (auteur exclu), peut_merger
// (2 approve), peut_merger_owner_seulement.

import { describe, it, expect, beforeEach } from 'vitest';
import { resetWorkspaceStore } from './store';
import { getMainBranch, createBranch, snapshotBranch } from './branches';
import { openPr, peutMerger, reviewPr } from './pr';
import type { WorkspaceData } from './types';

const TENANT = 'tenant-a';

function fixture(): WorkspaceData {
  return {
    collections: [
      { id: 'a', name: 'A', singular: 'a', accent: '', titleField: 't', subtitleField: '', badgeField: '', fields: [] },
    ],
    items: [{ id: '1', collectionId: 'a', data: { name: 'first' } }],
    memberships: [{ userId: 'owner-1', role: 'owner', status: 'active' }],
  };
}

beforeEach(() => {
  resetWorkspaceStore();
});

async function setupBranches(): Promise<{ src: string; tgt: string }> {
  const main = await getMainBranch(TENANT);
  const snap = await snapshotBranch({
    tenantId: TENANT,
    branchId: main.id,
    message: 'init',
    data: fixture(),
    authorId: 'owner-1',
  });
  expect(snap.ok).toBe(true);
  const r = await createBranch({
    tenantId: TENANT,
    name: 'src-branch',
    actorId: 'owner-1',
    actorRole: 'owner',
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error('createBranch src');
  return { src: r.data.id, tgt: main.id };
}

describe('workspace/pr', () => {
  it('openPr_refuse_si_pas_open : PR déjà fermée ne peut pas être rouverte', async () => {
    const { src, tgt } = await setupBranches();
    const pr = await openPr({
      tenantId: TENANT,
      sourceBranchId: src,
      targetBranchId: tgt,
      title: 'first',
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    expect(pr.ok).toBe(true);
    if (!pr.ok) return;

    // Reviewer avec 2 approves pour passer en approved, puis 1 reject
    // … mais approve ne passe pas en approved tant que pas 2, et reject
    // passe en rejected immédiatement. Donc on reject.
    await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-1',
      reviewerRole: 'admin',
      verdict: 'reject',
    });

    // Tenter une review sur PR fermée → refus
    const review = await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-2',
      reviewerRole: 'admin',
      verdict: 'comment',
    });
    expect(review.ok).toBe(false);
    if (!review.ok) expect(review.code).toBe('invalid_state');
  });

  it('reviewPr_auteur_ne_peut_pas_reviewer : auteur exclu', async () => {
    const { src, tgt } = await setupBranches();
    const pr = await openPr({
      tenantId: TENANT,
      sourceBranchId: src,
      targetBranchId: tgt,
      title: 'self-review',
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    expect(pr.ok).toBe(true);
    if (!pr.ok) return;
    const r = await reviewPr({
      prId: pr.data.id,
      reviewerId: 'admin-1', // = auteur
      reviewerRole: 'admin',
      verdict: 'approve',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('self_approval');
  });

  it('peut_merger_apres_2_approve : règle des deux revues', async () => {
    const { src, tgt } = await setupBranches();
    const pr = await openPr({
      tenantId: TENANT,
      sourceBranchId: src,
      targetBranchId: tgt,
      title: 'two-approves',
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    expect(pr.ok).toBe(true);
    if (!pr.ok) return;

    // 1 approve : pas encore mergeable
    await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-1',
      reviewerRole: 'admin',
      verdict: 'approve',
    });
    let canMerge = await peutMerger(pr.data.id, 'owner');
    expect(canMerge).toBe(false);

    // 2 approve : mergeable
    await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-2',
      reviewerRole: 'admin',
      verdict: 'approve',
    });
    canMerge = await peutMerger(pr.data.id, 'owner');
    expect(canMerge).toBe(true);
  });

  it('peut_merger_owner_seulement : admin refuse', async () => {
    const { src, tgt } = await setupBranches();
    const pr = await openPr({
      tenantId: TENANT,
      sourceBranchId: src,
      targetBranchId: tgt,
      title: 'role-check',
      actorId: 'admin-1',
      actorRole: 'admin',
    });
    expect(pr.ok).toBe(true);
    if (!pr.ok) return;
    await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-1',
      reviewerRole: 'admin',
      verdict: 'approve',
    });
    await reviewPr({
      prId: pr.data.id,
      reviewerId: 'reviewer-2',
      reviewerRole: 'admin',
      verdict: 'approve',
    });
    // Même si la PR est mergeable, seul un owner peut merger.
    expect(await peutMerger(pr.data.id, 'admin')).toBe(false);
    expect(await peutMerger(pr.data.id, 'owner')).toBe(true);
  });
});