/**
 * Scarlet Witch — Domain 03 Growth
 * Deterministic consent-aware A/B assignment + failure-state fallback.
 *
 * SCOPE (D6 self-bounded, per brief directive 2026-07-25):
 *   - Bucket assignment (deterministic, stable across re-renders)
 *   - Consent gate (RGPD opt-in check)
 *   - Failure-state fallback (analytics denied, CMS empty, slow render)
 *   - No-op conversion event capture hook (no false conversion)
 *   - PII sanitization on payload (no PII leak)
 *
 * HARD VETO (per brief):
 *   - NO offer semantics (price, value-stack, guarantee) — those belong to Thor
 *   - NO UI design ownership — render lives in GrowthApp.tsx
 *   - NO load stress — that belongs to Hulk
 *   - NO intel — that belongs to Black Widow
 *   - NO traceability matrix — that belongs to Hawkeye
 *
 * Reversibility: no globals, no Date.now() in bucketing, no network, no I/O.
 * The hash is (key + experimentId + variantSpace) → bucket ∈ [0,1).
 * Given the same inputs, bucketing returns the same variant forever.
 */

export type ExperimentId = string; // opaque slug, e.g. "growth.headline.cta"
export type VariantId = string; // opaque slug, e.g. "control" | "A" | "B"

/** A single variant in an experiment. */
export interface Variant {
  readonly id: VariantId;
  readonly weight: number; // relative weight, must be > 0
}

/** A complete experiment definition. */
export interface Experiment {
  readonly id: ExperimentId;
  readonly variants: ReadonlyArray<Variant>;
  /** Optional zero-based salt so two experiments with same key+variants never collide. */
  readonly salt?: string;
}

/** Result returned by the assignment engine. */
export interface Assignment {
  readonly experimentId: ExperimentId;
  readonly variantId: VariantId;
  readonly bucket: number; // [0, 1) — deterministic, used for QA verification
  readonly source: 'normal' | 'fallback-empty' | 'fallback-malformed' | 'fallback-no-consent';
}

/** Failure flags the runner may surface. Each one triggers a defined fallback. */
export interface FailureState {
  readonly analyticsDenied: boolean; // observability opt-in = false OR SDK unavailable
  readonly cmsEmpty: boolean; // no variants / no control variant
  readonly slowRender: boolean; // render budget exceeded → freeze to safe fallback
  readonly consent: boolean; // explicit user consent signal (false = denied)
}

// ---------- PII sanitization (D6: no PII leak) ----------

/**
 * Heuristic PII exact-match keys. Conservative — anything in this list is REDACTED.
 * Substring rules (PII_TOKENS) catch camelCase variants like `phoneNumber` /
 * `userId` / `ipAddress` without false-flagging innocuous fields.
 */
const PII_KEYS: ReadonlySet<string> = new Set([
  'email',
  'phone',
  'phonenumber',
  'firstname',
  'lastname',
  'fullname',
  'address',
  'street',
  'city',
  'zip',
  'postalcode',
  'ssn',
  'dob',
  'birthdate',
  'useragent',
  'cookie',
  'sessionid',
  'userid',
  'deviceid',
  'ipaddress',
  'name',
  'ip',
]);

/** Substring tokens — if the normalised key contains any of these, it is PII. */
const PII_TOKENS: ReadonlyArray<string> = [
  'email',
  'phone',
  'name',
  'address',
  'street',
  'city',
  'postal',
  'zip',
  'ssn',
  'dob',
  'birth',
  'useragent',
  'cookie',
  'session',
  'userid',
  'deviceid',
  'ipaddress',
];

/** Returns true if the key resembles PII. Case-insensitive, exact + substring match. */
export function isPiiKey(key: string): boolean {
  if (typeof key !== 'string' || key.length === 0) return false;
  const lower = key.toLowerCase();
  if (PII_KEYS.has(lower)) return true;
  for (const token of PII_TOKENS) {
    if (lower.includes(token)) return true;
  }
  return false;
}

/** Strip PII fields from an arbitrary event payload. Returns a new object. */
export function sanitizePayload(payload: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (isPiiKey(k)) continue;
    out[k] = v;
  }
  return out;
}

// ---------- Deterministic bucketing (FNV-1a 32-bit) ----------

/**
 * FNV-1a 32-bit hash. Small, fast, deterministic across JS engines.
 * NOT cryptographic — bucketing only, not security.
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
}

/** Normalize a key into a stable bucket value in [0, 1). */
function bucketOf(key: string, experimentId: ExperimentId, salt?: string): number {
  const stable = `${experimentId}|${salt ?? ''}|${key}`;
  return fnv1a32(stable) / 0x1_0000_0000;
}

// ---------- Variant selection ----------

/**
 * Validate an experiment definition. Returns null when valid, or a reason
 * describing why it must be rejected (caller decides fallback).
 */
export function validateExperiment(exp: Experiment): string | null {
  if (!exp || typeof exp.id !== 'string' || exp.id.length === 0) {
    return 'experiment.id is missing';
  }
  if (!Array.isArray(exp.variants) || exp.variants.length === 0) {
    return 'experiment.variants is empty';
  }
  const seen = new Set<VariantId>();
  let totalWeight = 0;
  for (const v of exp.variants) {
    if (!v || typeof v.id !== 'string' || v.id.length === 0) {
      return 'variant.id is missing';
    }
    if (!Number.isFinite(v.weight) || v.weight <= 0) {
      return `variant ${v.id} has non-positive weight`;
    }
    if (seen.has(v.id)) {
      return `variant ${v.id} is duplicated`;
    }
    seen.add(v.id);
    totalWeight += v.weight;
  }
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return 'total weight is non-positive';
  }
  return null;
}

/** Pick a variant from a weighted distribution given a bucket ∈ [0, 1). */
function pickVariant(variants: ReadonlyArray<Variant>, bucket: number): VariantId {
  const total = variants.reduce((s, v) => s + v.weight, 0);
  let cursor = bucket * total;
  for (const v of variants) {
    cursor -= v.weight;
    if (cursor <= 0) return v.id;
  }
  return variants[variants.length - 1].id;
}

// ---------- Assignment engine ----------

/**
 * Deterministically assign a key to a variant. Pure function.
 * Returns a fallback assignment when the experiment is invalid (CMS empty),
 * when consent is denied, or when the key is malformed.
 *
 * Order of precedence (first mismatch wins):
 *   1. malformed key → fallback-malformed
 *   2. CMS empty / malformed experiment → fallback-empty
 *   3. no consent → fallback-no-consent
 *   4. analytics denied → assignment still works; capture is gated separately
 *   5. slow render → caller decides via renderWithBudget
 */
export function assignVariant(
  experiment: Experiment,
  key: string,
  failure: FailureState,
  options: { now?: number; rng?: () => number } = {},
): Assignment {
  const ctrlFallback = (source: Assignment['source']): Assignment => ({
    experimentId: experiment?.id ?? 'unknown',
    variantId: 'control',
    bucket: 0,
    source,
  });

  // 1. Malformed key.
  if (typeof key !== 'string' || key.length === 0) {
    return ctrlFallback('fallback-malformed');
  }

  // 2. CMS empty / malformed experiment.
  const reason = validateExperiment(experiment);
  if (reason !== null) {
    return ctrlFallback('fallback-empty');
  }

  // 3. No consent.
  if (failure.consent === false) {
    return ctrlFallback('fallback-no-consent');
  }

  // 4. Analytics denied — assignment still works; capture is gated separately.
  void failure.analyticsDenied;

  // 5. Slow render — caller decides via renderWithBudget.
  void failure.slowRender;

  // Deterministic bucket.
  const bucket = options.rng ? options.rng() : bucketOf(key, experiment.id, experiment.salt);
  const variantId = pickVariant(experiment.variants, bucket);
  void options.now; // accepted for API symmetry but unused: bucketing is rng-free.

  return {
    experimentId: experiment.id,
    variantId,
    bucket,
    source: 'normal',
  };
}

// ---------- Failure-state fallback surface ----------

/**
 * Decide whether the renderer should advance or freeze to a safe fallback.
 * Returns the verdict plus a human-readable code (for telemetry that the
 * caller is allowed to emit — consent-gated).
 */
export interface RenderVerdict {
  readonly shouldRender: boolean;
  readonly reason: 'ok' | 'slow-render' | 'cms-empty' | 'no-consent';
  readonly fallbackVariantId: VariantId;
}

export function renderWithBudget(
  experiment: Experiment,
  failure: FailureState,
  budgetMs: number,
  elapsedMs: number,
): RenderVerdict {
  if (failure.cmsEmpty || validateExperiment(experiment) !== null) {
    return { shouldRender: false, reason: 'cms-empty', fallbackVariantId: 'control' };
  }
  if (failure.consent === false) {
    return { shouldRender: false, reason: 'no-consent', fallbackVariantId: 'control' };
  }
  if (failure.slowRender || elapsedMs > budgetMs) {
    return { shouldRender: false, reason: 'slow-render', fallbackVariantId: 'control' };
  }
  return { shouldRender: true, reason: 'ok', fallbackVariantId: 'control' };
}

// ---------- Conversion event capture (no false conversion on failure) ----------

export interface CaptureContext {
  readonly consent: boolean;
  readonly analyticsDenied: boolean;
  readonly failure: FailureState;
}

/**
 * Returns the sanitized payload to capture, or null when the capture must be
 * suppressed (no false conversion event under any failure state).
 *
 * Rules:
 *   - consent = false → null
 *   - analyticsDenied = true → null
 *   - failure.cmsEmpty = true → null  (a render that didn't ship is not a conversion)
 *   - failure.slowRender = true → null
 *   - any PII key in payload → redacted (never null; the event is still valid
 *     and worth capturing, just with PII stripped)
 */
export function buildConversionPayload(
  raw: Readonly<Record<string, unknown>>,
  ctx: CaptureContext,
): Record<string, unknown> | null {
  if (!ctx.consent) return null;
  if (ctx.analyticsDenied) return null;
  if (ctx.failure.cmsEmpty) return null;
  if (ctx.failure.slowRender) return null;
  return sanitizePayload(raw);
}

// ---------- Exports (single source of truth) ----------

export const __scarletWitchInternals = {
  fnv1a32,
  bucketOf,
  pickVariant,
  PII_KEYS,
};
