// src/lib/auth/memberships.test.ts
// Tests adversariaux de l'API memberships (campagne 2026-08-15, MEMBERSHIPS).
//
// 15 tests, dont les 10 obligatoires du brief. Chaque test installe
// un état initial via `__seed` puis exerce la fonction. Pas de
// Supabase, pas de réseau — un backend in-memory isole les tests.

import { beforeEach, describe, expect, it } from 'vitest';
import {
  __inMemoryBackendForTest,
  __resetMembershipBackendForTest,
  accepterInvitation,
  changerRole,
  inviterMembre,
  isValidEmail,
  isValidRole,
  isValidStatus,
  isValidTenantId,
  isValidUuid,
  listerMemberships,
  listerTenantsPourUser,
  quitter,
  revoquer,
  toTenantId,
} from './memberships';
import type { ToolContext } from '../tooling/types';
import type { MembershipRecord, TenantId } from '../tenant/contract';

const TENANT_A = 'tenant-a' as TenantId;
const TENANT_B = 'tenant-b' as TenantId;
const USER_OWNER = '11111111-1111-4111-8111-111111111111';
const USER_ADMIN = '22222222-2222-4222-8222-222222222222';
const USER_MEMBER = '33333333-3333-4333-8333-333333333333';
const USER_GUEST = '44444444-4444-4444-8444-444444444444';
const USER_OUTSIDER = '99999999-9999-4999-8999-999999999999';

function ctx(
  role: 'owner' | 'admin' | 'member' | 'guest',
  actorId: string,
  tenantId: string = TENANT_A,
): ToolContext {
  return { role, actorId, tenantId };
}

function seedOwnerInTenantA(): void {
  __inMemoryBackendForTest().__seed([
    {
      id: 'm_owner_a',
      tenantId: TENANT_A,
      userId: USER_OWNER,
      role: 'owner',
      status: 'active',
      invitedBy: null,
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    },
  ]);
}

beforeEach(() => {
  __resetMembershipBackendForTest();
});

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers de validation (5 tests isovolés)
 * ────────────────────────────────────────────────────────────────────────── */

describe('validations — pure', () => {
  it('isValidRole whitelist', () => {
    expect(isValidRole('owner')).toBe(true);
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('member')).toBe(true);
    expect(isValidRole('guest')).toBe(true);
    expect(isValidRole('root')).toBe(false);
    expect(isValidRole('Owner')).toBe(false);
  });

  it('isValidStatus whitelist', () => {
    expect(isValidStatus('pending')).toBe(true);
    expect(isValidStatus('active')).toBe(true);
    expect(isValidStatus('revoked')).toBe(true);
    expect(isValidStatus('deleted')).toBe(false);
  });

  it('isValidEmail rejette les cas adversariaux', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('amadou.kone@example.com')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false); // pas de TLD
    expect(isValidEmail('a@b@c')).toBe(false); // deux @
    expect(isValidEmail('plainstring')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('a@b.c\n')).toBe(false); // newline
  });

  it('isValidUuid format', () => {
    expect(isValidUuid(USER_OWNER)).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });

  it('isValidTenantId format', () => {
    expect(isValidTenantId('demo')).toBe(true);
    expect(isValidTenantId('coach-amadou_2026')).toBe(true);
    expect(isValidTenantId('../etc/passwd')).toBe(false);
    expect(isValidTenantId('A.B')).toBe(false);
    expect(isValidTenantId('')).toBe(false);
  });

  it('toTenantId renvoie un TenantId', () => {
    const t = toTenantId('demo');
    expect(t).toBe('demo');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * ctx manquant
 * ────────────────────────────────────────────────────────────────────────── */

describe('listerMemberships — ctx manquant', () => {
  it('refuse avec ctx=null', async () => {
    const r = await listerMemberships(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('ctx_manquant');
  });

  it('refuse avec ctx=undefined', async () => {
    const r = await listerMemberships(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('ctx_manquant');
  });

  it('refuse avec tenantId.ctx vide', async () => {
    const r = await listerMemberships({ role: 'owner', actorId: 'agent:x', tenantId: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('ctx_manquant');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #1, #2, #3 — listerMemberships par rôle
 * ────────────────────────────────────────────────────────────────────────── */

describe('listerMemberships — visibilité par rôle', () => {
  it('#1 owner_voit_tout : owner voit tous les membres actifs', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_a', tenantId: TENANT_A, userId: USER_ADMIN, role: 'admin', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await listerMemberships(ctx('owner', USER_OWNER));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.map((m) => m.userId).sort()).toEqual(
        [USER_OWNER, USER_ADMIN, USER_MEMBER].sort(),
      );
    }
  });

  it('#2 member_voit_que_lui : member ne voit que sa propre ligne', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await listerMemberships(ctx('member', USER_MEMBER));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(1);
      expect(r.data[0]!.userId).toBe(USER_MEMBER);
    }
  });

  it('#3 guest_a_acces_minimal : guest n\'a pas accès au listing d\'autres', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_g', tenantId: TENANT_A, userId: USER_GUEST, role: 'guest', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await listerMemberships(ctx('guest', USER_GUEST));
    expect(r.ok).toBe(true);
    if (r.ok) {
      // guest : sa propre ligne, pas les autres.
      expect(r.data.map((m) => m.userId)).toEqual([USER_GUEST]);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #4, #5 — inviter
 * ────────────────────────────────────────────────────────────────────────── */

describe('inviterMembre — owner-only', () => {
  it('#4 owner invite crée un pending', async () => {
    seedOwnerInTenantA();
    const r = await inviterMembre(
      ctx('owner', USER_OWNER),
      TENANT_A,
      'invitee@example.com',
      'member',
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.invitationId).toMatch(/^[0-9a-f-]+$/);
      const all = await listerMemberships(ctx('owner', USER_OWNER));
      if (all.ok) {
        const inv = all.data.find((m) => m.id === r.data.invitationId);
        expect(inv).toBeDefined();
        expect(inv?.status).toBe('pending');
        expect(inv?.role).toBe('member');
        expect(inv?.invitedBy).toBe(USER_OWNER);
      }
    }
  });

  it('#5 member_qui_invite : refus permission_refusee', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await inviterMembre(
      ctx('member', USER_MEMBER),
      TENANT_A,
      'invitee@example.com',
      'admin',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('email invalide → refus', async () => {
    seedOwnerInTenantA();
    const r = await inviterMembre(ctx('owner', USER_OWNER), TENANT_A, 'not-an-email', 'member');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('email_invalide');
  });

  it('role invalide → refus', async () => {
    seedOwnerInTenantA();
    const r = await inviterMembre(ctx('owner', USER_OWNER), TENANT_A, 'a@b.co', 'root' as 'owner');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('role_invalide');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #6 — accepter
 * ────────────────────────────────────────────────────────────────────────── */

describe('accepterInvitation', () => {
  it('#6 passe status active', async () => {
    seedOwnerInTenantA();
    const inv = await inviterMembre(ctx('owner', USER_OWNER), TENANT_A, 'a@b.co', 'member');
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;

    // L'invité a maintenant un userId. On résout son ctx : il a
    // toujours le rôle 'guest' (rien ne l'a élevé). On court-circuite
    // la couche identité en lui donnant directement le userId.
    const all = await listerMemberships(ctx('owner', USER_OWNER));
    if (!all.ok) return;
    const row = all.data.find((m) => m.id === inv.data.invitationId);
    expect(row).toBeDefined();

    const invCtx = ctx('guest', row!.userId); // rôle par défaut
    const r = await accepterInvitation(invCtx, inv.data.invitationId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe('active');
      expect(r.data.acceptedAt).not.toBeNull();
    }
  });

  it('accepter une invitation d\'un autre tenant → refus', async () => {
    seedOwnerInTenantA();
    // Owner de tenant-a crée une invitation.
    const inv = await inviterMembre(ctx('owner', USER_OWNER), TENANT_A, 'a@b.co', 'member');
    if (!inv.ok) throw new Error('invitation should exist');

    // Un user de tenant-b essaie d'accepter.
    const all = await listerMemberships(ctx('owner', USER_OWNER));
    if (!all.ok) throw new Error('list should work');
    const row = all.data.find((m) => m.id === inv.data.invitationId);
    const invCtx: ToolContext = { role: 'member', actorId: row!.userId, tenantId: TENANT_B };
    const r = await accepterInvitation(invCtx, inv.data.invitationId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('accepter une invitation pas pour moi → refus', async () => {
    seedOwnerInTenantA();
    const inv = await inviterMembre(ctx('owner', USER_OWNER), TENANT_A, 'a@b.co', 'member');
    if (!inv.ok) throw new Error('invitation should exist');
    // Un user tiers essaie d'accepter.
    const r = await accepterInvitation(ctx('member', USER_OUTSIDER), inv.data.invitationId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #7 — changerRole
 * ────────────────────────────────────────────────────────────────────────── */

describe('changerRole', () => {
  it('#7 owner_only : member ne peut pas changer un rôle', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
      { id: 'm_g', tenantId: TENANT_A, userId: USER_GUEST, role: 'guest', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await changerRole(
      ctx('member', USER_MEMBER),
      TENANT_A,
      USER_GUEST,
      'admin',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('owner peut promouvoir un guest en member', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_g', tenantId: TENANT_A, userId: USER_GUEST, role: 'guest', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await changerRole(
      ctx('owner', USER_OWNER),
      TENANT_A,
      USER_GUEST,
      'member',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.role).toBe('member');
  });

  it('owner ne peut pas se retirer son propre owner-role', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
    ]);
    const r = await changerRole(
      ctx('owner', USER_OWNER),
      TENANT_A,
      USER_OWNER,
      'member',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('auto_owner_revoque');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #8 — revoquer
 * ────────────────────────────────────────────────────────────────────────── */

describe('revoquer', () => {
  it('#8 owner_uniquement : member ne peut pas révoquer', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
      { id: 'm_g', tenantId: TENANT_A, userId: USER_GUEST, role: 'guest', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await revoquer(ctx('member', USER_MEMBER), TENANT_A, USER_GUEST);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('owner peut révoquer un member', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await revoquer(ctx('owner', USER_OWNER), TENANT_A, USER_MEMBER);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const all = await listerMemberships(ctx('owner', USER_OWNER));
      if (all.ok) {
        const row = all.data.find((m) => m.userId === USER_MEMBER);
        expect(row?.status).toBe('revoked');
      }
    }
  });

  it('owner ne peut pas se révoquer lui-même', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
    ]);
    const r = await revoquer(ctx('owner', USER_OWNER), TENANT_A, USER_OWNER);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('auto_owner_revoque');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #9 — quitter
 * ────────────────────────────────────────────────────────────────────────── */

describe('quitter', () => {
  it('#9 universel : member peut quitter', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_m', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await quitter(ctx('member', USER_MEMBER), TENANT_A);
    expect(r.ok).toBe(true);
  });

  it('guest peut quitter', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_g', tenantId: TENANT_A, userId: USER_GUEST, role: 'guest', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await quitter(ctx('guest', USER_GUEST), TENANT_A);
    expect(r.ok).toBe(true);
  });

  it('dernier owner ne peut pas quitter', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
    ]);
    const r = await quitter(ctx('owner', USER_OWNER), TENANT_A);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('auto_owner_revoque');
  });

  it('owner parmi d\'autres owners peut quitter', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_o1', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_o2', tenantId: TENANT_A, userId: USER_ADMIN, role: 'owner', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const r = await quitter(ctx('owner', USER_OWNER), TENANT_A);
    expect(r.ok).toBe(true);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * #10 — invariant "au plus un actif par (tenant, user)"
 * ────────────────────────────────────────────────────────────────────────── */

describe('invariant une seule active par (tenant, user)', () => {
  it('#10 deux_actifs_refuses : l\'acceptation refuse si une active existe déjà', async () => {
    seedOwnerInTenantA();
    // On crée une membership active directement (cas seed).
    const userIdDup = '55555555-5555-4555-8555-555555555555';
    __inMemoryBackendForTest().__seed([
      { id: 'm_o', tenantId: TENANT_A, userId: USER_OWNER, role: 'owner', status: 'active', invitedBy: null, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-01T00:00:00Z' },
      { id: 'm_dup', tenantId: TENANT_A, userId: userIdDup, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
      { id: 'm_pend', tenantId: TENANT_A, userId: userIdDup, role: 'guest', status: 'pending', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: null },
    ]);
    const r = await accepterInvitation(ctx('guest', userIdDup), 'm_pend');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('plusieurs_actifs');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Tests additionnels (cloison stricte)
 * ────────────────────────────────────────────────────────────────────────── */

describe('cloison stricte — ctx.tenantId ≠ target', () => {
  it('listerMemberships refuse si on vise un autre tenant', async () => {
    seedOwnerInTenantA();
    const r = await listerMemberships(ctx('owner', USER_OWNER), TENANT_B);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('tenant_invalide');
  });

  it('inviterMembre refuse si tenantId ≠ ctx.tenantId', async () => {
    seedOwnerInTenantA();
    // ctx dans tenant-a, on tente d'inviter dans tenant-b.
    const r = await inviterMembre(
      ctx('owner', USER_OWNER, TENANT_A),
      TENANT_B,
      'a@b.co',
      'member',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('changerRole refuse si tenantId ≠ ctx.tenantId', async () => {
    seedOwnerInTenantA();
    const r = await changerRole(
      ctx('owner', USER_OWNER, TENANT_A),
      TENANT_B,
      USER_MEMBER,
      'guest',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });

  it('revoquer refuse si tenantId ≠ ctx.tenantId', async () => {
    seedOwnerInTenantA();
    const r = await revoquer(
      ctx('owner', USER_OWNER, TENANT_A),
      TENANT_B,
      USER_MEMBER,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('permission_refusee');
  });
});

describe('listerTenantsPourUser — isolation par user', () => {
  it('user membre de T1 et T2 → [T1, T2]', async () => {
    __inMemoryBackendForTest().__seed([
      { id: 'm_ta', tenantId: TENANT_A, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
      { id: 'm_tb', tenantId: TENANT_B, userId: USER_MEMBER, role: 'member', status: 'active', invitedBy: USER_OWNER, invitedAt: '2026-08-01T00:00:00Z', acceptedAt: '2026-08-02T00:00:00Z' },
    ]);
    const { __registerTenantForTest } = await import('./memberships');
    __registerTenantForTest(TENANT_A);
    __registerTenantForTest(TENANT_B);
    const r = await listerTenantsPourUser(USER_MEMBER);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tenants.sort()).toEqual([TENANT_A, TENANT_B].sort());
  });

  it('user non-membre → []', async () => {
    const { __registerTenantForTest } = await import('./memberships');
    __registerTenantForTest(TENANT_A);
    const r = await listerTenantsPourUser(USER_OUTSIDER);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tenants).toEqual([]);
  });

  it('userId invalide → refus', async () => {
    const r = await listerTenantsPourUser('not-a-uuid');
    expect(r.ok).toBe(false);
  });
});

describe('shape MembershipRecord — propriété du contrat', () => {
  it('une ligne seed porte les 8 champs', () => {
    const rec: MembershipRecord = {
      id: 'm_x',
      tenantId: TENANT_A,
      userId: USER_MEMBER,
      role: 'member',
      status: 'active',
      invitedBy: USER_OWNER,
      invitedAt: '2026-08-01T00:00:00Z',
      acceptedAt: '2026-08-02T00:00:00Z',
    };
    expect(Object.keys(rec).sort()).toEqual(
      ['acceptedAt', 'id', 'invitedAt', 'invitedBy', 'role', 'status', 'tenantId', 'userId'].sort(),
    );
  });
});
