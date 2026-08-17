// src/lib/tooling/serverStore.test.ts
// Tests de la cloison par tenant (campagne 2026-08-14, étape 1).
//
// Trois exigences du brief :
//  1. un item écrit sous le tenant A est invisible depuis le tenant B ;
//  2. `listItems` sans tenant lève ;
//  3. deux tenants peuvent porter le même `collectionId` sans se voir.

import { afterEach, describe, it, expect, beforeEach } from 'vitest';
import {
  __resetServerStoreForTest,
  __seedItemsForTest,
  __upsertItemForTest,
  assertTenantId,
  deposeProposal,
  getCollection,
  getProposal,
  listCollections,
  listItems,
  listProposals,
  searchItems,
  TenantIdRequiredError,
} from './serverStore';
import { QuotaExceededError, __resetQuotaRegistryForTest, getQuotaRegistry } from './quota';
import { QUOTA_DEFAULTS } from '../../../_config/cms/quota';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpProposalDir = '';

beforeEach(() => {
  __resetServerStoreForTest();
  tmpProposalDir = mkdtempSync(path.join(tmpdir(), 'coach-os-prop-'));
  process.env.COACH_OS_PROPOSAL_DIR = tmpProposalDir;
});

afterEach(() => {
  if (tmpProposalDir) {
    try { rmSync(tmpProposalDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  delete process.env.COACH_OS_PROPOSAL_DIR;
  __resetServerStoreForTest();
});

describe('cloison par tenant — serverStore', () => {
  describe('assertTenantId (contrat d\'entrée)', () => {
    it('rejette null', () => {
      expect(() => assertTenantId(null as unknown as string)).toThrow(TenantIdRequiredError);
    });
    it('rejette undefined', () => {
      expect(() => assertTenantId(undefined as unknown as string)).toThrow(TenantIdRequiredError);
    });
    it('rejette la chaîne vide', () => {
      expect(() => assertTenantId('')).toThrow(TenantIdRequiredError);
    });
    it('rejette une chaîne uniquement d\'espaces', () => {
      expect(() => assertTenantId('   ')).toThrow(TenantIdRequiredError);
    });
    it('rejette un tenantId avec caractères hors whitelist', () => {
      expect(() => assertTenantId('A.B')).toThrow(TenantIdRequiredError);
      expect(() => assertTenantId('foo bar')).toThrow(TenantIdRequiredError);
      expect(() => assertTenantId('../etc/passwd')).toThrow(TenantIdRequiredError);
      expect(() => assertTenantId('__proto__')).toThrow(TenantIdRequiredError);
    });
    it('accepte kebab-case et snake_case', () => {
      expect(() => assertTenantId('demo')).not.toThrow();
      expect(() => assertTenantId('coach-amadou')).not.toThrow();
      expect(() => assertTenantId('coach_2026')).not.toThrow();
    });
  });

  describe('listItems — exigence : sans tenant, ça lève', () => {
    it('lève TenantIdRequiredError sans argument', () => {
      // @ts-expect-error — on teste le contrat : passer rien doit lever.
      expect(() => listItems()).toThrow(TenantIdRequiredError);
    });
    it('lève TenantIdRequiredError avec null', () => {
      expect(() => listItems(null as unknown as string, 'tasks')).toThrow(TenantIdRequiredError);
    });
    it('lève TenantIdRequiredError avec chaîne vide', () => {
      expect(() => listItems('', 'tasks')).toThrow(TenantIdRequiredError);
    });
    it('lève TenantIdRequiredError sur collection inconnue aussi (mais d\'abords le tenant)', () => {
      // Un tenantId malformé lève avant la résolution de collection — c'est
      // le bon ordre : on n'expose pas d'info sur les collections à un
      // appelant qui n'a pas prouvé son identité.
      expect(() => listItems('A.B', 'tasks')).toThrow(TenantIdRequiredError);
    });
  });

  describe('cloison des items — exigence : un tenant ne voit pas les items de l\'autre', () => {
    it('un item écrit sous tenant A est invisible depuis tenant B', () => {
      __seedItemsForTest('tenant-a', 'tasks', [
        { id: 'a-task-1', label: 'Privé A', due: '2026-09-01', status: 'open' },
      ]);
      __seedItemsForTest('tenant-b', 'tasks', [
        { id: 'b-task-1', label: 'Privé B', due: '2026-09-01', status: 'open' },
      ]);

      const fromA = listItems('tenant-a', 'tasks');
      const fromB = listItems('tenant-b', 'tasks');

      expect(fromA.map((i) => i.id)).toEqual(['a-task-1']);
      expect(fromB.map((i) => i.id)).toEqual(['b-task-1']);
    });

    it('searchItems ne retourne que les items du tenant demandé', () => {
      __seedItemsForTest('tenant-a', 'tasks', [
        { id: 'a-1', label: 'Onboarding secret A', due: '2026-09-01', status: 'open' },
      ]);
      __seedItemsForTest('tenant-b', 'tasks', [
        { id: 'b-1', label: 'Onboarding secret B', due: '2026-09-01', status: 'open' },
      ]);

      const hitsA = searchItems('tenant-a', 'onboarding');
      const hitsB = searchItems('tenant-b', 'onboarding');

      expect(hitsA.map((h) => h.itemId)).toEqual(['a-1']);
      expect(hitsB.map((h) => h.itemId)).toEqual(['b-1']);
    });

    it('un tenant jamais vu a une ardoise vierge, pas une fuite du seed', () => {
      // Aucun seed pour tenant-inconnu. Si on récupérait les items de
      // demo par défaut, ce serait la faille Melbourne.
      const items = listItems('tenant-inconnu', 'tasks');
      expect(items).toEqual([]);
    });

    it('upsert puis read par le même tenant', () => {
      __upsertItemForTest('tenant-a', 'tasks', { id: 'a-1', label: 'A1', status: 'open' });
      __upsertItemForTest('tenant-a', 'tasks', { id: 'a-2', label: 'A2', status: 'open' });

      const items = listItems('tenant-a', 'tasks');
      expect(items.map((i) => i.id).sort()).toEqual(['a-1', 'a-2']);
    });
  });

  describe('cloison des propositions — exigence : même collectionId, deux tenants, aucune fuite', () => {
    it('deux tenants peuvent porter des propositions avec le même scenarioId-prefix sans se voir', async () => {
      // Le scenarioId historique contient `scn_<tenantId>_<ts>`. Si deux
      // tenants utilisent simultanément le même préfixe (le cas où le
      // tenantId se termine par `_demo` n'est pas possible vu la regex),
      // on vérifie au moins que les propositions ne se croisent pas dans
      // la liste. Le format exact du scenarioId est porté par le
      // catalogue, mais la cloison du store doit être neutre.
      const recA = await deposeProposal('tenant-a', {
        scenarioId: 'scn_tenant-a_01',
        toolName: 'collection.create',
        args: { collectionId: 'tasks', fields: { label: 'A' } },
        displayName: 'A',
        actorId: 'agent:a',
      });
      const recB = await deposeProposal('tenant-b', {
        scenarioId: 'scn_tenant-b_01',
        toolName: 'collection.create',
        args: { collectionId: 'tasks', fields: { label: 'B' } },
        displayName: 'B',
        actorId: 'agent:b',
      });

      const listA = await listProposals('tenant-a');
      const listB = await listProposals('tenant-b');

      expect(listA.map((p) => p.id)).toEqual([recA.id]);
      expect(listB.map((p) => p.id)).toEqual([recB.id]);
    });

    it('getProposal cross-tenant renvoie null, pas la proposition', async () => {
      const rec = await deposeProposal('tenant-a', {
        scenarioId: 'scn_tenant-a_99',
        toolName: 'collection.delete',
        args: { collectionId: 'tasks', id: 'task-1' },
        displayName: 'Suppression',
        actorId: 'agent:a',
      });

      // Le tenant A lit sa proposition : OK.
      const fromA = await getProposal('tenant-a', rec.id);
      expect(fromA).not.toBeNull();
      expect(fromA?.id).toBe(rec.id);

      // Le tenant B demande le même id : null. Pas la proposition.
      const fromB = await getProposal('tenant-b', rec.id);
      expect(fromB).toBeNull();
    });

    it('listProposals sans tenant lève', async () => {
      // @ts-expect-error — contrat : sans tenant, on lève.
      await expect(listProposals()).rejects.toThrow(TenantIdRequiredError);
    });
  });

  describe('liste des collections — pas une fuite par omission du filtre', () => {
    it('listCollections exige un tenant', () => {
      // @ts-expect-error — idem, contrat strict.
      expect(() => listCollections()).toThrow(TenantIdRequiredError);
    });
    it('listCollections rend les mêmes defs pour tous les tenants (les formes sont partagées)', () => {
      // Les DÉFINITIONS de collection sont partagées. Ce qui est cloisonné,
      // ce sont les items. C'est explicite : si demain la V2 supporte des
      // schémas par tenant, cette fonction changera de signature.
      const fromA = listCollections('tenant-a').map((c) => c.id).sort();
      const fromB = listCollections('tenant-b').map((c) => c.id).sort();
      const fromDemo = listCollections('demo').map((c) => c.id).sort();
      expect(fromA).toEqual(fromDemo);
      expect(fromB).toEqual(fromDemo);
      expect(fromA.length).toBeGreaterThan(0);
    });
    it('getCollection exige un tenant', () => {
      expect(() => getCollection('demo', '')).not.toThrow(); // tenant OK
      expect(() => getCollection('', 'tasks')).toThrow(TenantIdRequiredError);
    });
  });

  // ── quota W13 — intégration serverStore ───────────────────────────
  //
  // Test #6 du brief : `deposeProposal_refuse_si_quota_atteint`.
  // On ajoute aussi un test analogue sur `__upsertItemForTest` parce
  // que la wire-up du brief couvre aussi le compteur `write`, pas
  // seulement `proposal`. Les deux write paths partagent la gare ;
  // un seul des deux wired = oubli de l'autre.
  describe('quota W13 — intégration serverStore', () => {
    it('deposeProposal_refuse_si_quota_atteint (test #6)', async () => {
      // On sature le quota de propositions du tenant.
      const reg = getQuotaRegistry();
      // Le singleton est partagé et reset au beforeEach via
      // __resetServerStoreForTest → __resetQuotaRegistry. On vide
      // encore par sécurité pour ce test isolé.
      reg.reset();

      for (let i = 0; i < QUOTA_DEFAULTS.proposals_per_minute; i++) {
        await deposeProposal('tenant-quota', {
          scenarioId: `scn_quota_${i}`,
          toolName: 'collection.create',
          args: { collectionId: 'tasks', fields: { label: 'L' } },
          displayName: `prop-${i}`,
          actorId: 'agent:quota',
        });
      }

      // La 13ᵉ proposition (au-delà de `proposals_per_minute=12`)
      // doit être refusée par la gare quota.
      await expect(
        deposeProposal('tenant-quota', {
          scenarioId: 'scn_quota_overflow',
          toolName: 'collection.create',
          args: { collectionId: 'tasks', fields: { label: 'X' } },
          displayName: 'overflow',
          actorId: 'agent:quota',
        }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('__upsertItemForTest consomme le quota write au-delà de 60', () => {
      const reg = getQuotaRegistry();
      reg.reset();

      // 60 upserts OK.
      for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
        expect(() =>
          __upsertItemForTest('tenant-quota-w', 'tasks', { id: `w-${i}`, label: 'L' }),
        ).not.toThrow();
      }
      // Le 61ᵉ doit lever QuotaExceededError.
      expect(() =>
        __upsertItemForTest('tenant-quota-w', 'tasks', { id: 'w-61', label: 'L' }),
      ).toThrow(QuotaExceededError);
    });
  });
});
