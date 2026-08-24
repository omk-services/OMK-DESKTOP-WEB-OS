// src/lib/tooling/identity.test.ts
// Tests de la résolution d'identité unifiée (étape 2, campagne 2026-08-14).
// + Étape 4 (campagne 2026-08-15) : `resolveIdentityWithMembership`.
// + FIX_1_identite (campagne 2026-08-17) : tests verrous pour l'adaptateur
//   REST (`ctxFromHeaders`). Le REST est exposé sur Internet — c'est
//   l'adaptateur où l'identité forgeable faisait le plus de dégâts.

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
import { ctxFromHeaders } from './adapters/rest';
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
  // Liste de référence, volontairement figée : ce test existe pour qu'un ajout
  // de rôle soit un GESTE, jamais un effet de bord. Il a fait son travail le
  // 2026-08-23 en échouant sur l'arrivée de `client`.
  //
  // `client` a été ajouté délibérément (campagne FIX_RBAC) : il portait déjà
  // une matrice de permissions dans `rbac.ts` — workspace en lecture seule,
  // écriture dans son propre sandbox — mais restait absent de `ROLES`, donc
  // inatteignable par `resolveIdentity()`. La protection était fictive.
  //
  // Son rang s'intercale entre `member` et `guest` : un client a un périmètre
  // propre, aucune vue sur l'interne.
  it('roles : exactement owner, admin, member, client, guest', () => {
    expect(ROLES).toEqual(['owner', 'admin', 'member', 'client', 'guest']);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Étape 4 — resolveIdentityWithMembership
 *
 *  Campagne 2026-08-17 (FIX_1_identite) : la fonction refuse désormais
 *  en production quand aucun lookup n'est configuré (la résolution
 *  whitelist seule acceptait n'importe quel rôle déclaré par l'appelant).
 *  Le mode démo (`COACH_OS_DEMO_MODE=1`) reste permissif mais n'est
 *  déclenchable que par variable d'environnement.
 * ────────────────────────────────────────────────────────────────────────── */

describe('resolveIdentityWithMembership — cloison par membership', () => {
  afterEach(() => {
    setMembershipLookup(null);
  });

  it('sans lookup en production → REFUS explicite (anti-W03)', async () => {
    // Aucun lookup configuré : sans cette garde, l'identité était
    // forgeable — l'appelant pouvait proclamer n'importe quel rôle et
    // la résolution whitelist seule le validait contre sa propre
    // déclaration. Cf. RAPPORT_C §4.1.
    const r = await resolveIdentityWithMembership({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toEqual(['membership']);
      expect(r.error).toMatch(/Lookup membership non configur/);
    }
  });

  it('avec lookup, prime le rôle membership sur l\'input', async () => {
    // L'input déclare `owner` mais la table dit `member`. L'adaptateur
    // doit recevoir `member`, pas `owner` — c'est la cloison qui
    // parle, pas l'appelant.
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        return 'member';
      },
    };
    const r = await resolveIdentityWithMembership(
      {
        tenantId: 'demo',
        actorId: 'agent:x',
        role: 'owner',
      },
      lookup,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('membership');
      expect(r.roleSource).toBe('membership');
      expect(r.ctx.role).toBe('member');
    }
  });

  it('avec lookup, downgrade owner → guest : rôle effectif est guest', async () => {
    // Même scénario : input `owner`, membership `guest`. Le rôle effectif
    // est `guest`, pas `owner`. Si `assertPermission` lit `guest`, il
    // refusera toutes les catégories 'ecriture'.
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        return 'guest';
      },
    };
    const r = await resolveIdentityWithMembership(
      {
        tenantId: 'demo',
        actorId: 'agent:x',
        role: 'owner',
      },
      lookup,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ctx.role).toBe('guest');
      expect(r.roleSource).toBe('membership');
    }
  });

  it('aucune membership active → refus explicite', async () => {
    // La table `memberships` ne rend rien pour ce couple
    // (actorId, tenantId) : REFUS, pas rétrogradation silencieuse
    // en `guest`. Le rôle `null` du lookup signifie « aucun membership
    // actif » (status != 'active' ou ligne absente).
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

  it('lookup qui jette (réseau/base absente) → refus explicite, pas de crash', async () => {
    // Le lookup est branché mais échoue (réseau coupé, RLS trop
    // strict, table manquante). On REFUSE explicitement plutôt que
    // de laisser remonter une exception non capturée.
    const lookup: MembershipLookup = {
      async activeRoleFor() {
        throw new Error('connection refused');
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
      expect(r.error).toMatch(/Lookup membership a échoué.*connection refused/);
    }
  });

  it('mode démo court-circuite le lookup, sans exiger de DB', async () => {
    // Le mode démo reste permissif pour permettre aux tests et aux
    // agents en local de tourner sans DB. Le seul moyen de l'activer
    // est `COACH_OS_DEMO_MODE=1`, lu dans `process.env` — pas un
    // input réseau.
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

  it('mode démo sans aucun lookup configuré → accepte', async () => {
    // Variante : mode démo + lookup absent. Doit fonctionner quand
    // même — c'est ce qui permet aux outils de tourner hors-ligne.
    process.env.COACH_OS_DEMO_MODE = '1';
    const r = await resolveIdentityWithMembership({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.source).toBe('demo');
      expect(r.roleSource).toBe('input');
      expect(r.ctx.role).toBe('member');
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

  it('resolveIdentity seul reste utilisable pour les contextes in-app', () => {
    // resolveIdentity whitelist-only garde son rôle : c'est la
    // fonction synchrone qu'on appelle quand le membership lookup
    // a déjà été appliqué en amont (in-app, où l'identité vient
    // de la session Supabase). On ne casse pas ce chemin.
    const r = resolveIdentity({
      tenantId: 'demo',
      actorId: 'agent:x',
      role: 'member',
    });
    expect(r.ok).toBe(true);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * FIX_1_identite — adaptateur REST
 *
 *  Trois tests verrous (campagne 2026-08-17) :
 *   1. REST déclare `owner`, lookup rend `member` → rôle effectif `member`.
 *   2. REST, lookup muet → refus.
 *   3. REST, lookup non configuré → refus en production.
 *
 *  Avant cette passe, ces trois scénarios ACCEPTAIENT la déclaration de
 *  l'en-tête `x-coach-os-role`. Cf. RAPPORT_C §4.1 et `rest.ts:32-47`.
 * ────────────────────────────────────────────────────────────────────────── */

describe('adapters/rest (FIX_1_identite) — identité vérifiée côté serveur', () => {
  afterEach(() => {
    setMembershipLookup(null);
  });

  function makeRestRequest(role: string): Request {
    return new Request('https://example.test/api/v1/app.list', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-coach-os-tenant': 'demo',
        'x-coach-os-actor': 'agent:rest',
        'x-coach-os-role': role,
      },
      body: JSON.stringify({}),
    });
  }

  it('REST déclare owner mais lookup rend member → rôle effectif = member', async () => {
    // L'attaquant pose un en-tête `x-coach-os-role: owner`. La couche
    // `permissions.ts` lit `member` (la cloison a parlé) → refus pour
    // toute catégorie 'ecriture'. C'est précisément la faille mesurée
    // en W03, fermée par ce correctif.
    setMembershipLookup({
      async activeRoleFor() {
        return 'member';
      },
    });
    const r = await ctxFromHeaders(makeRestRequest('owner'));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ctx.role).toBe('member');
      expect(r.source).toBe('membership');
    }
  });

  it('REST, lookup muet (aucune membership active) → refus 401', async () => {
    // La table `memberships` ne rend rien pour ce couple
    // (actorId, tenantId) : on REFUSE, sans rétrograder en `guest`.
    // C'est le cas "l'attaquant existe mais n'est pas membre du tenant".
    setMembershipLookup({
      async activeRoleFor() {
        return null;
      },
    });
    const r = await ctxFromHeaders(makeRestRequest('member'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      const body = r.body as { ok: false; error: string; missing: ReadonlyArray<string> };
      expect(body.ok).toBe(false);
      expect(body.missing).toEqual(['membership']);
      expect(body.error).toMatch(/Aucun membership actif/);
    }
  });

  it('REST, lookup non configuré → refus 401 en production', async () => {
    // Le serveur REST est exposé sur Internet. Si on n'a pas branché
    // `setMembershipLookup()` au démarrage, l'identité whitelist seule
    // est FORGEABLE — c'est précisément le défaut mesuré en W03. On
    // REFUSE donc 401, avec un message qui pointe vers le module à
    // configurer. Ce test reste rouge tant que personne n'a branché
    // le lookup : c'est le verrou.
    const r = await ctxFromHeaders(makeRestRequest('owner'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      const body = r.body as { ok: false; error: string; missing: ReadonlyArray<string> };
      expect(body.ok).toBe(false);
      expect(body.missing).toEqual(['membership']);
      expect(body.error).toMatch(/Lookup membership non configur/);
    }
  });
});
