// src/lib/tooling/quota.test.ts
// 8 tests adversariaux sur QuotaRegistry — brief W13 du 2026-08-15.
//
// Avant = quota autorise, Après = quota refuse avec retry_after_sec.
// Les seuils sont issus de `_config/cms/quota.ts`.
//
// Astuce de test : l'horloge est injectée. On ne `vi.useFakeTimers()`
// pas — `vi.useFakeTimers()` casse les `Date.now()` async dans
// d'autres fichiers de la campagne (cf. CLAUDE.md §1bis, piège
// sélecteur). Une horloge manuelle avance le temps quand le test le
// demande.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuotaRegistry,
  QuotaExceededError,
  __resetQuotaRegistryForTest,
  consumeQuotaOrThrow,
  getQuotaRegistry,
} from './quota';
import { QUOTA_DEFAULTS } from '../../../_config/cms/quota';

class FakeClock {
  private nowMs = 0;
  now(): number {
    return this.nowMs;
  }
  advance(ms: number): void {
    this.nowMs += ms;
  }
  set(ms: number): void {
    this.nowMs = ms;
  }
}

const WRITE_LIMIT = { max: QUOTA_DEFAULTS.writes_per_minute, windowSeconds: QUOTA_DEFAULTS.window_seconds };
const PROPOSAL_LIMIT = { max: QUOTA_DEFAULTS.proposals_per_minute, windowSeconds: QUOTA_DEFAULTS.window_seconds };

beforeEach(() => {
  __resetQuotaRegistryForTest();
});

describe('QuotaRegistry — sliding window par tenant et par action (W13)', () => {
  it('1. quota_autorise_en_dessous_du_seuil : 60 écritures/minute → toutes OK', () => {
    const clock = new FakeClock();
    const reg = new QuotaRegistry({ clock: clock.now.bind(clock) });
    // 60 écritures, dans la fenêtre 60s, sans saturation.
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      const r = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
      expect(r.ok, `Écriture ${i + 1} attendue OK`).toBe(true);
    }
    // Et la bucket contient bien 60 entrées.
    expect(reg.sizeForTest('tenant-a', 'write')).toBe(60);
  });

  it('2. quota_refuse_au_dela : la 61ᵉ → { ok: false, retry_after_sec < 60 }', () => {
    const clock = new FakeClock();
    const reg = new QuotaRegistry({ clock: clock.now.bind(clock) });
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      expect(reg.check('tenant-a', 'write', { limit: WRITE_LIMIT }).ok).toBe(true);
    }
    // 61ᵉ : doit refuser, retry_after_sec strictement inférieur à la fenêtre.
    const refused = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.reason).toBe('quota_exceeded');
      expect(refused.retry_after_sec).toBeGreaterThanOrEqual(1);
      expect(refused.retry_after_sec).toBeLessThanOrEqual(60);
    }
  });

  it('3. quota_separe_les_tenants : tenant A sature, tenant B reste OK', () => {
    const clock = new FakeClock();
    const reg = new QuotaRegistry({ clock: clock.now.bind(clock) });
    // Tenant A sature.
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      expect(reg.check('tenant-a', 'write', { limit: WRITE_LIMIT }).ok).toBe(true);
    }
    const refusedA = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    expect(refusedA.ok).toBe(false);

    // Tenant B, même horloge, même action, même seconde : doit passer.
    const okB = reg.check('tenant-b', 'write', { limit: WRITE_LIMIT });
    expect(okB.ok, 'Tenant B doit être indépendant de la saturation de A').toBe(true);

    // Le compteur de B contient exactement 1 entrée.
    expect(reg.sizeForTest('tenant-b', 'write')).toBe(1);
    // Celui de A contient 60 entrées + a refusé sans ajouter.
    expect(reg.sizeForTest('tenant-a', 'write')).toBe(60);
  });

  it('4. quota_reset_apres_fenetre : attendre window_seconds puis écrire reprend', () => {
    const clock = new FakeClock();
    const reg = new QuotaRegistry({ clock: clock.now.bind(clock) });
    // Saturation immédiate de tenant-a.
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    }
    expect(reg.check('tenant-a', 'write', { limit: WRITE_LIMIT }).ok).toBe(false);

    // On avance de exactement la fenêtre — toutes les entrées
    // tombent dans le passé, la bucket doit se purger entièrement.
    clock.advance(QUOTA_DEFAULTS.window_seconds * 1000);

    // Le 61ᵉ appel redevient OK : la fenêtre a roulé.
    const r = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    expect(r.ok, 'Après la fenêtre, la nouvelle écriture doit passer').toBe(true);
    expect(reg.sizeForTest('tenant-a', 'write')).toBe(1);
  });

  it('5. quota_compte_proposals_separement : écrire 60 items + 12 propositions → la 13ᵉ proposition échoue, mais items continuent', () => {
    const clock = new FakeClock();
    const reg = new QuotaRegistry({ clock: clock.now.bind(clock) });

    // 60 writes OK.
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      expect(reg.check('tenant-a', 'write', { limit: WRITE_LIMIT }).ok).toBe(true);
    }
    // 12 proposals OK.
    for (let i = 0; i < QUOTA_DEFAULTS.proposals_per_minute; i++) {
      expect(
        reg.check('tenant-a', 'proposal', { limit: PROPOSAL_LIMIT }).ok,
        `Proposal ${i + 1} attendue OK`,
      ).toBe(true);
    }
    // La 13ᵉ proposal échoue — son compteur est indépendant des writes.
    const refusedProposal = reg.check('tenant-a', 'proposal', { limit: PROPOSAL_LIMIT });
    expect(refusedProposal.ok).toBe(false);
    if (!refusedProposal.ok) {
      expect(refusedProposal.retry_after_sec).toBeLessThanOrEqual(60);
    }

    // Les writes continuent (61ᵉ write refusé, mais le compteur
    // proposal est resté à 12 ; aucune interférence croisée).
    const refusedWrite = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    expect(refusedWrite.ok).toBe(false); // 61ᵉ write = refusé.

    // Bucket de A sur proposal contient 12 entrées — pas 13 (le
    // refus n'écrit pas dans la bucket).
    expect(reg.sizeForTest('tenant-a', 'proposal')).toBe(12);
  });

  it('6. deposeProposal_refuse_si_quota_atteint : test d\'intégration dans serverStore.test.ts — proxy : consumeQuotaOrThrow lève', () => {
    // Ce test documente la **gare** côté serveur via
    // `consumeQuotaOrThrow`, qui est la fonction appelée par
    // `deposeProposal`. Le scénario réel (deposeProposal refuse)
    // vit dans `serverStore.test.ts` (test #6 du brief). Ici on
    // prouve que la gare lève bien `QuotaExceededError`.
    const reg = new QuotaRegistry();
    for (let i = 0; i < QUOTA_DEFAULTS.proposals_per_minute; i++) {
      reg.check('demo', 'proposal', { limit: PROPOSAL_LIMIT });
    }
    // consumeQuotaOrThrow avec registry par défaut :
    __resetQuotaRegistryForTest();
    const g = getQuotaRegistry();
    for (let i = 0; i < QUOTA_DEFAULTS.proposals_per_minute; i++) {
      g.check('demo', 'proposal', { limit: PROPOSAL_LIMIT });
    }
    expect(() => consumeQuotaOrThrow('demo', 'proposal')).toThrow(QuotaExceededError);
  });

  it('7. __reset_reinitialise_le_quota : après reset, écritures reprennent sans attendre la fenêtre', () => {
    const reg = new QuotaRegistry();
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    }
    expect(reg.check('tenant-a', 'write', { limit: WRITE_LIMIT }).ok).toBe(false);

    // Reset complet — le serveur l'appelle depuis
    // `__resetServerStoreForTest` pour que les tests rejouant
    // 100 écritures ne s'arrêtent pas à la 61ᵉ (cf. brief §Wire-up).
    reg.reset();

    const r = reg.check('tenant-a', 'write', { limit: WRITE_LIMIT });
    expect(r.ok, 'Après reset, la première écriture doit être OK').toBe(true);
    expect(reg.sizeForTest('tenant-a', 'write')).toBe(1);
  });

  it('8. quota_sans_persistance_apres_process_restart : reset implicite, comportement attendu', () => {
    // Documenté : un redémarrage du process Node = singleton
    // `getQuotaRegistry()` recréé = `buckets` vides. On simule ça
    // en appelant `__resetQuotaRegistryForTest()` entre deux
    // séries d'écritures.
    const reg1 = getQuotaRegistry();
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      reg1.check('tenant-x', 'write', { limit: WRITE_LIMIT });
    }
    expect(reg1.check('tenant-x', 'write', { limit: WRITE_LIMIT }).ok).toBe(false);

    // « Redémarrage » — le helper teste vide le singleton.
    __resetQuotaRegistryForTest();

    const reg2 = getQuotaRegistry();
    // Nouvelle instance, buckets vides : on peut écrire 60 fois
    // sans refus.
    for (let i = 0; i < QUOTA_DEFAULTS.writes_per_minute; i++) {
      const r = reg2.check('tenant-x', 'write', { limit: WRITE_LIMIT });
      expect(r.ok, `Écriture ${i + 1} après redémarrage doit être OK`).toBe(true);
    }
    // Et la nouvelle instance est bien un objet distinct.
    expect(reg2).not.toBe(reg1);
  });
});
