// src/lib/tooling/permissions.test.ts
// Tests de la couche permissions (étape 3, campagne 2026-08-14).
// + Étape 4 (campagne 2026-08-15) : `canRoleStrict` et
//   `assertMembershipRolePresent`.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertMembershipRolePresent,
  assertPermission,
  assertPermissionOrThrow,
  canRole,
  canRoleStrict,
  PermissionDeniedError,
} from './permissions';
import {
  __resetServerStoreForTest,
  deposeProposal,
} from './serverStore';
import { defineTool } from './defineTool';
import { register, reset } from './registry';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ToolContext } from './types';

let tmpProposalDir = '';

beforeEach(() => {
  __resetServerStoreForTest();
  reset();
  tmpProposalDir = mkdtempSync(path.join(tmpdir(), 'coach-os-perm-'));
  process.env.COACH_OS_PROPOSAL_DIR = tmpProposalDir;
});
afterEach(() => {
  if (tmpProposalDir) {
    try { rmSync(tmpProposalDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  delete process.env.COACH_OS_PROPOSAL_DIR;
  __resetServerStoreForTest();
  reset();
});

// ── Outils de test ────────────────────────────────────────────────
const lectureTool = defineTool({
  name: 'test.lecture',
  description: 'Outil lecture pour tests permissions.',
  category: 'lecture',
  schema: z.object({}),
  displayName: () => 'Lecture test',
  execute: async () => ({ ok: true as const, data: { ok: 1 } }),
});

const ecritureTool = defineTool({
  name: 'test.ecriture',
  description: 'Outil écriture pour tests permissions.',
  category: 'ecriture',
  schema: z.object({}),
  displayName: () => 'Écriture test',
  execute: async () => ({ ok: true as const, data: { proposalId: 'stub' } }),
});

const navTool = defineTool({
  name: 'test.nav',
  description: 'Outil navigation pour tests permissions.',
  category: 'navigation',
  schema: z.object({}),
  displayName: () => 'Nav test',
  execute: async () => ({ ok: true as const, data: { ok: 1 } }),
});

// scenario.approve est l'outil réel dont l'auto-approbation est
// interdite. On l'enregistre avec un execute no-op pour tester la
// gate sans dépendre du catalogue.
const scenarioApproveTool = defineTool({
  name: 'scenario.approve',
  description: 'INSTRUCTION D\'APPROBATION. (stub pour tests permissions)',
  category: 'navigation',
  schema: z.object({ proposalId: z.string().min(1) }),
  displayName: (args) => `Approuver ${args.proposalId}`,
  execute: async (args) => ({
    ok: true as const,
    data: { proposalId: args.proposalId, instruction: 'approve_and_merge' },
  }),
});

const ctx = (role: ToolContext['role'], actorId = 'agent:x', tenantId = 'demo'): ToolContext => ({
  tenantId,
  actorId,
  role,
});

// ── canRole — matrice ──────────────────────────────────────────────
describe('canRole — matrice rôle × catégorie', () => {
  it('lecture : tous rôles', () => {
    expect(canRole('lecture', 'owner')).toBe(true);
    expect(canRole('lecture', 'admin')).toBe(true);
    expect(canRole('lecture', 'member')).toBe(true);
    expect(canRole('lecture', 'guest')).toBe(true);
  });
  it('navigation : tous rôles', () => {
    expect(canRole('navigation', 'owner')).toBe(true);
    expect(canRole('navigation', 'guest')).toBe(true);
  });
  it('ecriture : PAS guest', () => {
    expect(canRole('ecriture', 'owner')).toBe(true);
    expect(canRole('ecriture', 'admin')).toBe(true);
    expect(canRole('ecriture', 'member')).toBe(true);
    expect(canRole('ecriture', 'guest')).toBe(false);
  });
});

// ── assertPermission — gate 1 : rôle × catégorie ──────────────────
describe('assertPermission — gate rôle × catégorie', () => {
  it('autorise owner à écrire', async () => {
    register(ecritureTool);
    const r = await assertPermission(ctx('owner'), ecritureTool, {});
    expect(r.ok).toBe(true);
  });
  it('autorise member à écrire', async () => {
    register(ecritureTool);
    const r = await assertPermission(ctx('member'), ecritureTool, {});
    expect(r.ok).toBe(true);
  });
  it('refuse guest à écrire avec code FORBIDDEN', async () => {
    register(ecritureTool);
    const r = await assertPermission(ctx('guest'), ecritureTool, {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('FORBIDDEN');
      expect(r.error).toMatch(/guest/);
      expect(r.error).toMatch(/ecriture/);
    }
  });
  it('autorise guest à lire', async () => {
    register(lectureTool);
    const r = await assertPermission(ctx('guest'), lectureTool, {});
    expect(r.ok).toBe(true);
  });
  it('autorise guest à naviguer', async () => {
    register(navTool);
    const r = await assertPermission(ctx('guest'), navTool, {});
    expect(r.ok).toBe(true);
  });
});

// ── assertPermission — gate 2 : anti-auto-approbation ─────────────
describe('assertPermission — anti-auto-approbation (scenario.approve)', () => {
  it('refuse si actor == proposal.actor et rôle != owner', async () => {
    register(scenarioApproveTool);
    // L'acteur "agent:a" dépose une proposition sous tenant-a.
    const rec = await deposeProposal('tenant-a', {
      scenarioId: 'scn_a',
      toolName: 'collection.create',
      args: { collectionId: 'tasks', fields: { label: 'X' } },
      displayName: 'X',
      actorId: 'agent:a',
    });
    // Même acteur essaie d'approuver, en member.
    const r = await assertPermission(
      ctx('member', 'agent:a', 'tenant-a'),
      scenarioApproveTool,
      { proposalId: rec.id },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('SELF_APPROVAL');
      expect(r.error).toMatch(/Auto-approbation refusée/);
    }
  });

  it('autorise owner à s\'auto-approuver', async () => {
    register(scenarioApproveTool);
    const rec = await deposeProposal('tenant-a', {
      scenarioId: 'scn_a',
      toolName: 'collection.create',
      args: { collectionId: 'tasks', fields: { label: 'X' } },
      displayName: 'X',
      actorId: 'agent:owner',
    });
    const r = await assertPermission(
      ctx('owner', 'agent:owner', 'tenant-a'),
      scenarioApproveTool,
      { proposalId: rec.id },
    );
    expect(r.ok).toBe(true);
  });

  it('autorise member à approuver une proposition d\'un AUTRE acteur', async () => {
    register(scenarioApproveTool);
    const rec = await deposeProposal('tenant-a', {
      scenarioId: 'scn_a',
      toolName: 'collection.create',
      args: { collectionId: 'tasks', fields: { label: 'X' } },
      displayName: 'X',
      actorId: 'agent:a',
    });
    const r = await assertPermission(
      ctx('member', 'agent:b', 'tenant-a'),
      scenarioApproveTool,
      { proposalId: rec.id },
    );
    expect(r.ok).toBe(true);
  });

  it('autorise member à approuver une proposition d\'un autre tenant sans fuite', async () => {
    // Le tenant-a a une proposition. Le tenant-b essaie de l'approuver.
    // getProposal(tenant-b, id) renvoie null → pas d'info, pas de fuite.
    // La gate ne peut pas refuser (pas de match) → ok:true. C'est le
    // bon comportement : la cloison du store a déjà protégé, on
    // n'ajoute pas de message d'erreur qui révélerait l'existence.
    register(scenarioApproveTool);
    const rec = await deposeProposal('tenant-a', {
      scenarioId: 'scn_a',
      toolName: 'collection.create',
      args: { collectionId: 'tasks', fields: { label: 'X' } },
      displayName: 'X',
      actorId: 'agent:a',
    });
    const r = await assertPermission(
      ctx('member', 'agent:b', 'tenant-b'),
      scenarioApproveTool,
      { proposalId: rec.id },
    );
    expect(r.ok).toBe(true);
  });

  it('ne déclenche pas la gate si l\'outil n\'est pas scenario.approve', async () => {
    // Pour un outil d'écriture "normal", l'auto-dépose n'est pas un
    // problème : la proposition attend un humain. La gate s'applique
    // UNIQUEMENT à l'approbation.
    register(ecritureTool);
    const r = await assertPermission(
      ctx('member', 'agent:a', 'tenant-a'),
      ecritureTool,
      {},
    );
    expect(r.ok).toBe(true);
  });
});

// ── assertPermissionOrThrow — variante jetant ─────────────────────
describe('assertPermissionOrThrow', () => {
  it('jette PermissionDeniedError avec code FORBIDDEN', async () => {
    register(ecritureTool);
    await expect(assertPermissionOrThrow(ctx('guest'), ecritureTool, {}))
      .rejects.toThrow(PermissionDeniedError);
    await expect(assertPermissionOrThrow(ctx('guest'), ecritureTool, {}))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('jette PermissionDeniedError avec code SELF_APPROVAL', async () => {
    register(scenarioApproveTool);
    const rec = await deposeProposal('tenant-a', {
      scenarioId: 'scn_a',
      toolName: 'collection.create',
      args: { collectionId: 'tasks', fields: { label: 'X' } },
      displayName: 'X',
      actorId: 'agent:a',
    });
    await expect(
      assertPermissionOrThrow(ctx('member', 'agent:a', 'tenant-a'), scenarioApproveTool, { proposalId: rec.id }),
    ).rejects.toMatchObject({ code: 'SELF_APPROVAL' });
  });
});

// ── canRoleStrict — matrice MembershipRole × catégorie ────────────
describe('canRoleStrict — MembershipRole × catégorie', () => {
  it('lecture : tous rôles', () => {
    expect(canRoleStrict('lecture', 'owner')).toBe(true);
    expect(canRoleStrict('lecture', 'admin')).toBe(true);
    expect(canRoleStrict('lecture', 'member')).toBe(true);
    expect(canRoleStrict('lecture', 'guest')).toBe(true);
  });
  it('navigation : tous rôles', () => {
    expect(canRoleStrict('navigation', 'owner')).toBe(true);
    expect(canRoleStrict('navigation', 'guest')).toBe(true);
  });
  it('ecriture : PAS guest', () => {
    expect(canRoleStrict('ecriture', 'owner')).toBe(true);
    expect(canRoleStrict('ecriture', 'admin')).toBe(true);
    expect(canRoleStrict('ecriture', 'member')).toBe(true);
    expect(canRoleStrict('ecriture', 'guest')).toBe(false);
  });
});

// ── assertMembershipRolePresent — défense en profondeur ───────────
describe('assertMembershipRolePresent', () => {
  it('autorise une source membership', () => {
    const r = assertMembershipRolePresent({ role: 'owner' }, 'membership');
    expect(r.ok).toBe(true);
  });

  it('refuse une source input', () => {
    const r = assertMembershipRolePresent({ role: 'owner' }, 'input');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('NO_MEMBERSHIP_ROLE');
      expect(r.error).toMatch(/n'est pas issu d'une membership/);
    }
  });

  it('refuse une source unknown', () => {
    const r = assertMembershipRolePresent({ role: 'member' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('NO_MEMBERSHIP_ROLE');
  });

  it('refuse même un owner si la source n\'est pas membership', () => {
    const r = assertMembershipRolePresent({ role: 'owner' }, 'input');
    expect(r.ok).toBe(false);
  });
});
