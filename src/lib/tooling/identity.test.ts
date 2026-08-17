// src/lib/tooling/identity.test.ts
// Tests de la résolution d'identité unifiée (étape 2, campagne 2026-08-14).
// + Étape 4 (campagne 2026-08-15) : `resolveIdentityWithMembership`.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ACTOR_KEY_RE,
  IdentityResolutionError,
  ROLES,
  TENANT_KEY_RE,
  resolveIdentity,
  resolveIdentityOrThrow,
  resolveIdentityWithMembership,
  setMembershipLookup,
  type MembershipLookup,
} from './identity';
import type { TenantId } from '../tenant/contract';

const ORIGINAL_DEMO = process.env.COACH_OS_DEMO_MODE;

beforeEach(() => {
  delete process.env.COACH_OS_DEMO_MODE;
});
afterEach(() => {
  if (ORIGINAL_DEMO === undefined) delete process.env.COACH_OS_DEMO_MODE;
  else process.env.COACH_OS_DEMO_MODE = ORIGINAL_DEMO;
});

describe('resolveIdentity — contrat strict par défaut', () => {
  it('refuse silencieusement → refuse explicitement : sans tenant', () => {
    const r = resolveIdentity({ actorId: 'agent:x', role: 'member' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toEqual(['tenantId']);
      expect(r.error).toMatch(/tenantId/);
    }
  });

  it('refuse sans actorId', () => {
    const r = resolveIdentity({ tenantId: 'demo', role: 'member' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['actorId']);
  });

  it('refuse sans role', () => {
    const r = resolveIdentity({ tenantId: 'demo', actorId: 'agent:x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['role']);
  });

  it('refuse si tous les champs manquent, et liste tout', () => {
    const r = resolveIdentity({});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toEqual(['tenantId', 'actorId', 'role']);
    }
  });

  it('accepte quand les trois champs sont présents', () => {
    const r = resolveIdentity({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ctx).toEqual({ tenantId: 'demo', actorId: 'agent:x', role: 'member' });
      expect(r.source).toBe('full');
    }
  });

  it('refuse un tenantId hors whitelist (path traversal)', () => {
    const r = resolveIdentity({
      tenantId: '../etc/passwd',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(['tenantId']);
  });

  it('refuse un role hors whitelist', () => {
    const r = resolveIdentity({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'root',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toEqual(['role']);
      expect(r.error).toMatch(/owner|admin|member|guest/);
    }
  });

  it('refuse un actorId qui ressemble à du prototype pollution', () => {
    const r = resolveIdentity({
      tenantId: 'demo',
      actorId: '__proto__',
      role: 'member',
    });
    expect(r.ok).toBe(false);
  });
});

describe('resolveIdentity — mode démo (COACH_OS_DEMO_MODE=1)', () => {
  beforeEach(() => {
    process.env.COACH_OS_DEMO_MODE = '1';
  });

  it('complète avec défauts explicites et marque source = "demo"', () => {
    const r = resolveIdentity({});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('demo');
      expect(r.ctx).toEqual({
        tenantId: 'demo',
        actorId: 'agent:anon',
        role: 'guest',
      });
    }
  });

  it('conserve les valeurs fournies et complète seulement le reste', () => {
    const r = resolveIdentity({ tenantId: 'coach-amadou', actorId: 'me' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ctx.tenantId).toBe('coach-amadou');
      expect(r.ctx.actorId).toBe('me');
      expect(r.ctx.role).toBe('guest');
    }
  });

  it('refuse quand même un tenantId invalide en mode démo (la validation est stricte)', () => {
    const r = resolveIdentity({ tenantId: 'A.B' });
    expect(r.ok).toBe(false);
  });
});

describe('resolveIdentityOrThrow — variante jetant', () => {
  it('jette IdentityResolutionError si l\'identité manque', () => {
    expect(() => resolveIdentityOrThrow({})).toThrow(IdentityResolutionError);
  });
  it('rend { ctx, source } si l\'identité est complète', () => {
    const out = resolveIdentityOrThrow({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(out.ctx.role).toBe('member');
    expect(out.source).toBe('full');
  });
});

describe('whitelists publiées (référence)', () => {
  it('tenant : kebab/snake, 1-64 caractères, [a-z0-9_-]', () => {
    expect(TENANT_KEY_RE.test('demo')).toBe(true);
    expect(TENANT_KEY_RE.test('coach-amadou')).toBe(true);
    expect(TENANT_KEY_RE.test('a_b-1')).toBe(true);
    expect(TENANT_KEY_RE.test('A.B')).toBe(false);
    expect(TENANT_KEY_RE.test('-foo')).toBe(false);
    expect(TENANT_KEY_RE.test('foo bar')).toBe(false);
  });
  it('actor : lettres, chiffres, deux-points, point, tiret, soulignement', () => {
    expect(ACTOR_KEY_RE.test('agent:mcp')).toBe(true);
    expect(ACTOR_KEY_RE.test('human:coach-1')).toBe(true);
    expect(ACTOR_KEY_RE.test('a.b_c-d:e')).toBe(true);
    expect(ACTOR_KEY_RE.test('foo bar')).toBe(false);
    expect(ACTOR_KEY_RE.test('foo/bar')).toBe(false);
  });
  it('roles : exactement owner, admin, member, guest', () => {
    expect(ROLES).toEqual(['owner', 'admin', 'member', 'guest']);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Étape 4 — resolveIdentityWithMembership
 * ────────────────────────────────────────────────────────────────────────── */

describe('resolveIdentityWithMembership — cloison par membership', () => {
  afterEach(() => {
    setMembershipLookup(null);
  });

  it('sans lookup, retombe sur resolveIdentity whitelist', async () => {
    const r = await resolveIdentityWithMembership({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('full');
      expect(r.roleSource).toBe('input');
      expect(r.ctx.role).toBe('member');
    }
  });

  it('avec lookup, prime le rôle membership sur l\'input', async () => {
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        return 'owner';
      },
    };
    const r = await resolveIdentityWithMembership(
      {
        tenantId: 'demo',
        actorId: 'agent:x',
        role: 'guest', // input "guest"
      },
      lookup,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('membership');
      expect(r.roleSource).toBe('membership');
      expect(r.ctx.role).toBe('owner'); // primé par la membership
    }
  });

  it('aucune membership active → refus explicite', async () => {
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        return null;
      },
    };
    const r = await resolveIdentityWithMembership(
      {
        tenantId: 'demo',
        actorId: 'agent:x',
        role: 'member',
      },
      lookup,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toEqual(['membership']);
      expect(r.error).toMatch(/Aucun membership actif/);
    }
  });

  it('un role non whitelist côté membership → confiance à la membership', async () => {
    // Si le backend retourne un rôle hors whitelist (bug côté DB),
    // la résolution whitelist (synchrone) l'aurait refusé. À ce
    // stade, on fait confiance à la membership, qui est la source
    // de vérité. On documente ce choix.
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        return 'member';
      },
    };
    const r = await resolveIdentityWithMembership(
      { tenantId: 'demo', actorId: 'agent:x', role: 'owner' },
      lookup,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ctx.role).toBe('member');
  });

  it('mode démo court-circuite le lookup', async () => {
    process.env.COACH_OS_DEMO_MODE = '1';
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        throw new Error('lookup ne doit pas être appelé en mode démo');
      },
    };
    const r = await resolveIdentityWithMembership({}, lookup);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('demo');
      expect(r.roleSource).toBe('input');
    }
  });

  it('setMembershipLookup permet de remplacer le singleton', async () => {
    setMembershipLookup({
      async activeRoleFor() {
        return 'admin';
      },
    });
    const r = await resolveIdentityWithMembership({
      tenantId: 'demo',
      actorId: 'agent:y',
      role: 'guest',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ctx.role).toBe('admin');
  });

  it('appelle le lookup avec les bons (actorId, tenantId)', async () => {
    let calls: Array<[string, TenantId]> = [];
    const lookup: MembershipLookup = {
      async activeRoleFor(userId, tenantId) {
        calls.push([userId, tenantId]);
        return 'member';
      },
    };
    await resolveIdentityWithMembership(
      { tenantId: 'demo', actorId: 'agent:z', role: 'guest' },
      lookup,
    );
    expect(calls).toEqual([['agent:z', 'demo' as TenantId]]);
  });
});
