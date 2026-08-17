// src/lib/workspace/merge.test.ts
// Tests : merge sans conflit / avec conflit.

import { describe, it, expect, beforeEach } from 'vitest';
import { resetWorkspaceStore } from './store';
import { createBranch, getMainBranch, snapshotBranch } from './branches';
import { openPr, reviewPr } from './pr';
import { mergePr } from './merge';
import type { WorkspaceData } from './types';

const TENANT = 'tenant-a';

function fixture(): WorkspaceData {
  return {
    collections: [
      { id: 'a', name: 'A', singular: 'a', accent: '', titleField: 't', subtitleField: '', badgeField: '', fields: [] },
    ],
    items: [
      { id: '1', collectionId: 'a', data: { name: 'first' } },
      { id: '2', collectionId: 'a', data: { name: 'second' } },
    ],
    memberships: [{ userId: 'owner-1', role: 'owner', status: 'active' }],
  };
}

beforeEach(() => {
  resetWorkspaceStore();
});

async function setupMergable(): Promise<{ prId: string }> {
  const main = await getMainBranch(TENANT);
  const snap = await snapshotBranch({
    tenantId: TENANT,
    branchId: main.id,
    message: 'init',
    data: fixture(),
    authorId: 'owner-1',
  });
  expect(snap.ok).toBe(true);
  const created = await createBranch({
    tenantId: TENANT,
    name: 'src',
    actorId: 'owner-1',
    actorRole: 'owner',
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error('createBranch');
  // Snapshot la branche source avec un item supplémentaire
  const newSnap = await snapshotBranch({
    tenantId: TENANT,
    branchId: created.data.id,
    message: 'add item 3',
    data: {
      ...fixture(),
      items: [
        ...fixture().items,
        { id: '3', collectionId: 'a', data: { name: 'third' } },
      ],
    },
    authorId: 'owner-1',
  });
  expect(newSnap.ok).toBe(true);

  const pr = await openPr({
    tenantId: TENANT,
    sourceBranchId: created.data.id,
    targetBranchId: main.id,
    title: 'add item 3',
    actorId: 'admin-1',
    actorRole: 'admin',
  });
  expect(pr.ok).toBe(true);
  if (!pr.ok) throw new Error('openPr');

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
  return { prId: pr.data.id };
}

async function setupConflict(): Promise<{ prId: string }> {
  const main = await getMainBranch(TENANT);
  const initial = await snapshotBranch({
    tenantId: TENANT,
    branchId: main.id,
    message: 'init',
    data: fixture(),
    authorId: 'owner-1',
  });
  expect(initial.ok).toBe(true);

  const src = await createBranch({
    tenantId: TENANT,
    name: 'src-conflict',
    actorId: 'owner-1',
    actorRole: 'owner',
  });
  expect(src.ok).toBe(true);
  if (!src.ok) throw new Error('createBranch');

  // Source modifie item 1 → 'source-value'
  const sSnap = await snapshotBranch({
    tenantId: TENANT,
    branchId: src.data.id,
    message: 'modify item 1',
    data: {
      ...fixture(),
      items: [{ id: '1', collectionId: 'a', data: { name: 'source-value' } }, ...fixture().items.slice(1)],
    },
    authorId: 'owner-1',
  });
  expect(sSnap.ok).toBe(true);

  // Target (main) modifie item 1 → 'target-value' APRÈS fork
  const tSnap = await snapshotBranch({
    tenantId: TENANT,
    branchId: main.id,
    message: 'modify item 1 target',
    data: {
      ...fixture(),
      items: [{ id: '1', collectionId: 'a', data: { name: 'target-value' } }, ...fixture().items.slice(1)],
    },
    authorId: 'owner-1',
  });
  expect(tSnap.ok).toBe(true);

  const pr = await openPr({
    tenantId: TENANT,
    sourceBranchId: src.data.id,
    targetBranchId: main.id,
    title: 'conflict',
    actorId: 'admin-1',
    actorRole: 'admin',
  });
  expect(pr.ok).toBe(true);
  if (!pr.ok) throw new Error('openPr');
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
  return { prId: pr.data.id };
}

describe('workspace/merge', () => {
  it('merge_sans_conflit_ok : merge propre', async () => {
    const { prId } = await setupMergable();
    const r = await mergePr({ prId, actorId: 'owner-1', actorRole: 'owner' });
    expect(r.ok).toBe(true);
  });

  it('merge_avec_conflit_refuse : conflit → PR reste open', async () => {
    const { prId } = await setupConflict();
    const r = await mergePr({ prId, actorId: 'owner-1', actorRole: 'owner' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('conflict');
      // PR reste open
      const { getWorkspaceStore } = await import('./store');
      const pr = await getWorkspaceStore().getPr(prId);
      expect(pr?.status).toBe('open');
    }
  });
});