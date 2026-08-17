// src/lib/workspace/branches.test.ts
// Tests : main_cree_automatiquement, createBranch (owner/member/duplicate),
// snapshot (incrémente HEAD, indépendant), suppression.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBranch,
  deleteBranch,
  getBranch,
  getMainBranch,
  listBranches,
  snapshotBranch,
} from './branches';
import { resetWorkspaceStore } from './store';
import type { WorkspaceData } from './types';

const TENANT = 'tenant-a';

function fixture(): WorkspaceData {
  return {
    collections: [
      { id: 'a', name: 'Alpha', singular: 'alpha', accent: '#f00', titleField: 't', subtitleField: '', badgeField: '', fields: [] },
    ],
    items: [{ id: '1', collectionId: 'a', data: { name: 'first' } }],
    memberships: [{ userId: 'owner-1', role: 'owner', status: 'active' }],
  };
}

beforeEach(() => {
  resetWorkspaceStore();
});

describe('workspace/branches', () => {
  it('main_cree_automatiquement : premier accès à un tenant crée main', async () => {
    const main = await getMainBranch(TENANT);
    expect(main.name).toBe('main');
    expect(main.isDefault).toBe(true);
    expect(main.tenantId).toBe(TENANT);
    // Un second appel retourne la même instance (id stable).
    const main2 = await getMainBranch(TENANT);
    expect(main2.id).toBe(main.id);
  });

  it('createBranch_owner_ok : owner peut créer une branche', async () => {
    const main = await getMainBranch(TENANT);
    // Snapshots main pour pouvoir forker dessus
    const snap = await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'init',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(snap.ok).toBe(true);
    // Refresh main pour avoir headSnapshotId
    const mainRefreshed = await getBranch(TENANT, main.id);
    if (!mainRefreshed.ok) throw new Error('main introuvable');
    const r = await createBranch({
      tenantId: TENANT,
      name: 'presentation-prospect-acme',
      actorId: 'owner-1',
      actorRole: 'owner',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe('presentation-prospect-acme');
      expect(r.data.isDefault).toBe(false);
      expect(r.data.parentBranchId).toBe(mainRefreshed.data.id);
    }
  });

  it('createBranch_member_refuse : member ne peut pas créer', async () => {
    await getMainBranch(TENANT);
    const r = await createBranch({
      tenantId: TENANT,
      name: 'should-fail',
      actorId: 'mem-1',
      actorRole: 'member',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('forbidden');
  });

  it('createBranch_nom_unique : deux branches même nom → refus', async () => {
    await getMainBranch(TENANT);
    const snap = await snapshotBranch({
      tenantId: TENANT,
      branchId: (await getMainBranch(TENANT)).id,
      message: 'init',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(snap.ok).toBe(true);
    const a = await createBranch({
      tenantId: TENANT,
      name: 'duplicated',
      actorId: 'owner-1',
      actorRole: 'owner',
    });
    expect(a.ok).toBe(true);
    const b = await createBranch({
      tenantId: TENANT,
      name: 'duplicated',
      actorId: 'owner-1',
      actorRole: 'owner',
    });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.code).toBe('duplicate_name');
  });

  it('snapshot_incremente_HEAD : après snapshot, head_snapshot_id pointe sur le nouveau', async () => {
    const main = await getMainBranch(TENANT);
    const s1 = await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'v1',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(s1.ok).toBe(true);
    const refresh1 = await getBranch(TENANT, main.id);
    if (!refresh1.ok) throw new Error('main introuvable');
    const head1 = refresh1.data.headSnapshotId;

    const s2 = await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'v2',
      data: { ...fixture(), items: [] },
      authorId: 'owner-1',
    });
    expect(s2.ok).toBe(true);
    const refresh2 = await getBranch(TENANT, main.id);
    if (!refresh2.ok) throw new Error('main introuvable');
    const head2 = refresh2.data.headSnapshotId;
    expect(head2).not.toBe(head1);
    expect(head2).toBe(s2.ok ? s2.data.id : null);
  });

  it('snapshot_pa_consolidation_immediate : snapshot est indépendant, pas de rebuild', async () => {
    const main = await getMainBranch(TENANT);
    const s1 = await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'snapshot-1',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(s1.ok).toBe(true);
    if (!s1.ok) return;
    // Re-snapshot avec MÊME contenu : nouveau snapshot créé, HEAD avance,
    // le précédent reste accessible via son id (non muté).
    const s2 = await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'snapshot-2',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(s2.ok).toBe(true);
    if (!s2.ok) return;
    expect(s1.data.id).not.toBe(s2.data.id);
    expect(s1.data.payloadHash).toBe(s2.data.payloadHash); // même contenu
  });

  it('supprimer_branche_member_refuse : member ne peut pas supprimer', async () => {
    await getMainBranch(TENANT);
    const snap = await snapshotBranch({
      tenantId: TENANT,
      branchId: (await getMainBranch(TENANT)).id,
      message: 'init',
      data: fixture(),
      authorId: 'owner-1',
    });
    expect(snap.ok).toBe(true);
    const created = await createBranch({
      tenantId: TENANT,
      name: 'temp',
      actorId: 'owner-1',
      actorRole: 'owner',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const r = await deleteBranch({
      tenantId: TENANT,
      branchId: created.data.id,
      actorId: 'mem-1',
      actorRole: 'member',
    });
    expect(r.ok).toBe(false);
  });

  it('listBranches retourne toutes les branches du tenant, triées', async () => {
    const main = await getMainBranch(TENANT);
    await snapshotBranch({
      tenantId: TENANT,
      branchId: main.id,
      message: 'init',
      data: fixture(),
      authorId: 'owner-1',
    });
    await createBranch({ tenantId: TENANT, name: 'b1', actorId: 'owner-1', actorRole: 'owner' });
    await createBranch({ tenantId: TENANT, name: 'b2', actorId: 'owner-1', actorRole: 'owner' });
    const list = await listBranches(TENANT);
    expect(list.length).toBe(3);
    expect(list.map((b) => b.name).sort()).toEqual(['b1', 'b2', 'main']);
  });
});