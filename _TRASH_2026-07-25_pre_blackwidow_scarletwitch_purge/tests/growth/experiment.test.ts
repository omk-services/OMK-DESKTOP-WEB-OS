/**
 * Scarlet Witch — Domain 03 Growth
 * Deterministic tests for the A/B assignment engine.
 *
 * Runs against the pure module `src/apps/growth/experiment.ts` via Node's
 * built-in test runner (`node --test`). No new dependencies.
 *
 * Coverage matrix (per brief directive 2026-07-25):
 *   1. Stable bucketing — same key+experiment → same variant on every call.
 *   2. Analytics denied — capture suppressed, no false conversion event.
 *   3. CMS empty — malformed/empty experiment → fallback, no crash.
 *   4. Slow render — over-budget render → fallback, no advance.
 *   5. No blank state — fallback always returns a control variant.
 *   6. No false conversion event — capture suppressed under every failure.
 *   7. No PII — every PII-shaped field is stripped before emit.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  assignVariant,
  buildConversionPayload,
  isPiiKey,
  renderWithBudget,
  sanitizePayload,
  validateExperiment,
  type Experiment,
  type FailureState,
} from '../../src/apps/growth/experiment.ts';

const happy: Experiment = {
  id: 'growth.headline.cta',
  variants: [
    { id: 'control', weight: 1 },
    { id: 'A', weight: 1 },
    { id: 'B', weight: 1 },
  ],
};

const okFailure = (overrides: Partial<FailureState> = {}): FailureState => ({
  analyticsDenied: false,
  cmsEmpty: false,
  slowRender: false,
  consent: true,
  ...overrides,
});

describe('Scarlet Witch — deterministic A/B assignment', () => {
  describe('stable bucketing', () => {
    it('returns the same variant for the same key across 1000 calls', () => {
      const first = assignVariant(happy, 'user-42', okFailure()).variantId;
      for (let i = 0; i < 1000; i++) {
        const a = assignVariant(happy, 'user-42', okFailure());
        assert.equal(a.variantId, first, `drift at iteration ${i}`);
        assert.equal(a.source, 'normal');
      }
    });

    it('distributes keys across all variants within ~3% of a uniform split', () => {
      const counts = new Map<string, number>();
      for (const v of happy.variants) counts.set(v.id, 0);
      for (let i = 0; i < 10000; i++) {
        const key = `user-${i}`;
        const a = assignVariant(happy, key, okFailure());
        counts.set(a.variantId, (counts.get(a.variantId) ?? 0) + 1);
      }
      for (const [variant, count] of counts) {
        const pct = count / 10000;
        assert.ok(Math.abs(pct - 1 / 3) < 0.03, `variant ${variant} skewed: ${(pct * 100).toFixed(2)}%`);
      }
    });

    it('different experiments with the same key never collide', () => {
      const exp2: Experiment = { id: 'growth.footer.cta', variants: happy.variants };
      const ab = assignVariant(happy, 'k', okFailure()).bucket;
      const bb = assignVariant(exp2, 'k', okFailure()).bucket;
      assert.notEqual(ab, bb);
    });

    it('bucket stays in [0, 1) for any key', () => {
      for (const key of ['a', 'unicode-ÿ', 'long-' + 'x'.repeat(1024)]) {
        const a = assignVariant(happy, key, okFailure());
        assert.ok(a.bucket >= 0 && a.bucket < 1, `bucket out of range for "${key.slice(0, 16)}…"`);
      }
    });
  });

  describe('rejects malformed inputs without throwing', () => {
    it('returns fallback-malformed for empty key', () => {
      const a = assignVariant(happy, '', okFailure());
      assert.equal(a.source, 'fallback-malformed');
      assert.equal(a.variantId, 'control');
    });

    it('returns fallback-empty for empty variants list', () => {
      const bad: Experiment = { id: 'x', variants: [] };
      const a = assignVariant(bad, 'k', okFailure());
      assert.equal(a.source, 'fallback-empty');
      assert.equal(a.variantId, 'control');
    });

    it('returns fallback-empty for negative weight', () => {
      const bad: Experiment = {
        id: 'x',
        variants: [
          { id: 'control', weight: 1 },
          { id: 'A', weight: -1 },
        ],
      };
      const a = assignVariant(bad, 'k', okFailure());
      assert.equal(a.source, 'fallback-empty');
    });

    it('returns fallback-empty for duplicate variant ids', () => {
      const bad: Experiment = {
        id: 'x',
        variants: [
          { id: 'A', weight: 1 },
          { id: 'A', weight: 1 },
        ],
      };
      assert.equal(validateExperiment(bad), 'variant A is duplicated');
      const a = assignVariant(bad, 'k', okFailure());
      assert.equal(a.source, 'fallback-empty');
    });

    it('validateExperiment returns null for a valid experiment', () => {
      assert.equal(validateExperiment(happy), null);
    });
  });

  describe('consent gate', () => {
    it('returns fallback-no-consent when consent is false', () => {
      const a = assignVariant(happy, 'user-1', okFailure({ consent: false }));
      assert.equal(a.source, 'fallback-no-consent');
      assert.equal(a.variantId, 'control');
    });

    it('assignment still works when consent is true even if analytics is denied', () => {
      const a = assignVariant(happy, 'user-1', okFailure({ analyticsDenied: true }));
      assert.equal(a.source, 'normal');
    });
  });

  describe('failure-state fallback (no blank state)', () => {
    it('returns a control variant on CMS empty', () => {
      const a = assignVariant({ id: 'x', variants: [] }, 'k', okFailure({ cmsEmpty: true }));
      assert.equal(a.variantId, 'control');
      assert.ok(a.variantId.length > 0);
    });

    it('returns a control variant on slow render + normal consent', () => {
      const a = assignVariant(happy, 'k', okFailure({ slowRender: true }));
      assert.equal(a.variantId, 'control');
    });

    it('renderWithBudget returns a fallback verdict when CMS is empty', () => {
      const v = renderWithBudget(
        { id: 'x', variants: [] },
        okFailure({ cmsEmpty: true }),
        100,
        50,
      );
      assert.equal(v.shouldRender, false);
      assert.equal(v.reason, 'cms-empty');
      assert.equal(v.fallbackVariantId, 'control');
    });

    it('renderWithBudget returns a fallback verdict when over budget', () => {
      const v = renderWithBudget(happy, okFailure(), 100, 250);
      assert.equal(v.shouldRender, false);
      assert.equal(v.reason, 'slow-render');
      assert.equal(v.fallbackVariantId, 'control');
    });

    it('renderWithBudget allows render when within budget and consent', () => {
      const v = renderWithBudget(happy, okFailure(), 100, 50);
      assert.equal(v.shouldRender, true);
      assert.equal(v.reason, 'ok');
    });

    it('never throws on any failure permutation', () => {
      const flags: ReadonlyArray<Partial<FailureState>> = [
        { analyticsDenied: true, cmsEmpty: true, slowRender: true, consent: false },
        { analyticsDenied: false, cmsEmpty: false, slowRender: false, consent: true },
        { analyticsDenied: true },
        { cmsEmpty: true },
        { slowRender: true },
        { consent: false },
      ];
      for (const f of flags) {
        const a = assignVariant(happy, 'k', okFailure(f));
        assert.ok(typeof a.variantId === 'string' && a.variantId.length > 0);
      }
    });
  });

  describe('no false conversion event', () => {
    it('suppresses capture when consent is false', () => {
      const p = buildConversionPayload({ experimentId: 'x', variant: 'A' }, {
        consent: false,
        analyticsDenied: false,
        failure: okFailure(),
      });
      assert.equal(p, null);
    });

    it('suppresses capture when analytics is denied', () => {
      const p = buildConversionPayload({ experimentId: 'x', variant: 'A' }, {
        consent: true,
        analyticsDenied: true,
        failure: okFailure(),
      });
      assert.equal(p, null);
    });

    it('suppresses capture when CMS is empty', () => {
      const p = buildConversionPayload({ experimentId: 'x', variant: 'A' }, {
        consent: true,
        analyticsDenied: false,
        failure: okFailure({ cmsEmpty: true }),
      });
      assert.equal(p, null);
    });

    it('suppresses capture when slow render', () => {
      const p = buildConversionPayload({ experimentId: 'x', variant: 'A' }, {
        consent: true,
        analyticsDenied: false,
        failure: okFailure({ slowRender: true }),
      });
      assert.equal(p, null);
    });

    it('still suppresses capture when both consent and analytics are denied', () => {
      const p = buildConversionPayload({ experimentId: 'x' }, {
        consent: false,
        analyticsDenied: true,
        failure: okFailure(),
      });
      assert.equal(p, null);
    });

    it('captures a sanitized payload when all gates pass', () => {
      const p = buildConversionPayload({
        experimentId: 'x',
        variant: 'A',
        bucket: 0.42,
      }, {
        consent: true,
        analyticsDenied: false,
        failure: okFailure(),
      });
      assert.ok(p);
      assert.equal(p.experimentId, 'x');
      assert.equal(p.variant, 'A');
      assert.equal(p.bucket, 0.42);
    });
  });

  describe('no PII leak', () => {
    it('isPiiKey recognizes email, phone, name, ip, etc.', () => {
      for (const k of ['email', 'Email', 'EMAIL', 'phone', 'phoneNumber', 'firstName', 'lastName', 'fullName', 'address', 'ip', 'ipAddress', 'userId', 'deviceId', 'sessionId']) {
        assert.equal(isPiiKey(k), true, `expected ${k} to be PII`);
      }
    });

    it('isPiiKey does not flag non-PII keys', () => {
      for (const k of ['experimentId', 'variant', 'bucket', 'source', 'count', 'timeMs', 'plan']) {
        assert.equal(isPiiKey(k), false, `expected ${k} to be non-PII`);
      }
    });

    it('sanitizePayload strips every PII key', () => {
      const out = sanitizePayload({
        email: 'a@b.com',
        phone: '+1-555-0100',
        experimentId: 'x',
        variant: 'A',
      });
      assert.equal('email' in out, false);
      assert.equal('phone' in out, false);
      assert.equal(out.experimentId, 'x');
      assert.equal(out.variant, 'A');
    });

    it('capture pipeline strips PII end-to-end', () => {
      const p = buildConversionPayload({
        experimentId: 'x',
        email: 'leak@example.com',
        ip: '127.0.0.1',
        sessionId: 'abc',
        variant: 'A',
      }, {
        consent: true,
        analyticsDenied: false,
        failure: okFailure(),
      });
      assert.ok(p);
      assert.equal('email' in (p as Record<string, unknown>), false);
      assert.equal('ip' in (p as Record<string, unknown>), false);
      assert.equal('sessionId' in (p as Record<string, unknown>), false);
      assert.equal((p as Record<string, unknown>).variant, 'A');
    });
  });

  describe('reversibility / purity', () => {
    it('does not mutate the experiment object', () => {
      const exp: Experiment = {
        id: 'x',
        variants: [
          { id: 'control', weight: 1 },
          { id: 'A', weight: 1 },
        ],
      };
      const snapshot = JSON.stringify(exp);
      for (let i = 0; i < 50; i++) assignVariant(exp, `k-${i}`, okFailure());
      assert.equal(JSON.stringify(exp), snapshot);
    });

    it('does not call Date.now() or Math.random() by default', () => {
      const realDateNow = Date.now;
      const realRandom = Math.random;
      let dateNowCalls = 0;
      let randomCalls = 0;
      Date.now = () => { dateNowCalls++; return 0; };
      Math.random = () => { randomCalls++; return 0; };
      try {
        for (let i = 0; i < 100; i++) assignVariant(happy, `k-${i}`, okFailure());
      } finally {
        Date.now = realDateNow;
        Math.random = realRandom;
      }
      assert.equal(dateNowCalls, 0, 'assignVariant must not call Date.now()');
      assert.equal(randomCalls, 0, 'assignVariant must not call Math.random()');
    });
  });
});
