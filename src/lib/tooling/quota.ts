// src/lib/tooling/quota.ts
// Rate-limit par tenant (campagne 2026-08-15, W13).
//
// La cloison par `tenantId` (serverStore.ts:149) garantit qu'un
// appelant ne traverse pas les partitions. Elle ne dit rien sur le
// **débit** : un agent peut appeler `deposeProposal` 60 fois par
// seconde à l'intérieur de son propre tenant. W13 ferme cette
// deuxième porte avec un compteur par `(tenantId, action)`.
//
// In-memory, pas de persistance. Le redémarrage du process remet les
// compteurs à zéro — c'est explicite dans le brief (le chantier
// AUDIT_LOG posera l'événement ; ici on pose le compteur).
//
// Algorithme : sliding window par deque de timestamps. À chaque
// `check()`, on purge les entrées > fenêtre, on compare au seuil,
// et on calcule `retry_after_sec` à partir du plus ancien timestamp
// restant (timestamp_ancien + window - now). C'est plus simple qu'un
// token bucket et la valeur de retry est gratuite.

import { QUOTA_DEFAULTS, quotaLimitFor, type QuotaAction, type QuotaLimit } from '../../../_config/cms/quota';

/** Résultat d'un `check()`. `ok: false` signifie que l'écriture
 *  doit être **refusée** — le serveur renvoie une erreur, l'agent
 *  retente après `retry_after_sec`. */
export type QuotaResult =
  | { ok: true }
  | { ok: false; retry_after_sec: number; reason: 'quota_exceeded' };

/** Erreur levée par le serveur (serverStore) quand `check()` refuse.
 *  C'est une `Error` pour rester cohérent avec les autres gardes
 *  (assertTenantId → TenantIdRequiredError), mais l'API publique
 *  d'`QuotaRegistry` ne lève jamais — elle renvoie un résultat. */
export class QuotaExceededError extends Error {
  readonly code = 'QUOTA_EXCEEDED';
  readonly tenantId: string;
  readonly action: QuotaAction;
  readonly retry_after_sec: number;
  constructor(tenantId: string, action: QuotaAction, retry_after_sec: number) {
    super(
      `Quota dépassé pour ${action} sur le tenant "${tenantId}". Réessaye dans ${retry_after_sec}s.`,
    );
    this.name = 'QuotaExceededError';
    this.tenantId = tenantId;
    this.action = action;
    this.retry_after_sec = retry_after_sec;
  }
}

/** Injecteur d'horloge — isolé pour tester le sliding window sans
 *  `vi.useFakeTimers()` (qui complique les `await`). Le défaut est
 *  `Date.now`. Les tests injectent une horloge qu'ils avancent à la
 *  main. */
export type Clock = () => number;

const defaultClock: Clock = () => Date.now();

/** Singleton interne : le store in-memory est partagé entre tous les
 *  appelants du process. C'est ce qui rend le compteur transverse
 *  aux write paths de `serverStore`. */
let _registry: QuotaRegistry | null = null;

/** Renvoie le registry process-globale. Crée l'instance au premier
 *  appel. Le helper `__resetQuotaRegistryForTest` (exporté plus bas)
 *  remet le singleton à zéro — à utiliser dans les `beforeEach`
 *  pour isoler les tests. */
export function getQuotaRegistry(): QuotaRegistry {
  if (!_registry) {
    _registry = new QuotaRegistry();
  }
  return _registry;
}

/** Réinitialise le singleton global. Réservé aux tests : appeler en
 *  production effacerait tous les compteurs. Le préfixe `__` marque
 *  l'usage interne, comme `__resetServerStoreForTest` (cf. serverStore.ts:194). */
export function __resetQuotaRegistryForTest(): void {
  _registry = null;
}

export interface QuotaCheckOptions {
  /** Injecteur d'horloge — défaut `Date.now`. Utile aux tests. */
  readonly clock?: Clock;
  /** Limite explicite — défaut `quotaLimitFor(action)` à partir de
   *  `QUOTA_DEFAULTS`. Permet de surcharger dans un test pour, par
   *  exemple, baisser la fenêtre à 1 seconde. */
  readonly limit?: QuotaLimit;
}

/** Compteur par `(tenantId, action)`. Une `Deque<Timestamp>` interne
 *  garde les N derniers timestamps ; la taille est plafonnée par la
 *  limite la plus haute connue (les valeurs > max sont purgées
 *  tôt). */
export class QuotaRegistry {
  /** Couplage (tenantId, action) → deque de timestamps (ms epoch). */
  private readonly buckets = new Map<string, number[]>();
  /** Horloge courante ; remplaçable pour les tests. */
  private clock: Clock;
  /** Limite courante par action ; surchargeable par `check()`. */
  private readonly limits: Map<QuotaAction, QuotaLimit>;

  constructor(opts: { clock?: Clock } = {}) {
    this.clock = opts.clock ?? defaultClock;
    // Initialise aux défauts ; l'appelant peut surcharger via
    // `check({ limit })` ou via `setLimit` (test-only).
    this.limits = new Map([
      ['write', quotaLimitFor('write')],
      ['proposal', quotaLimitFor('proposal')],
    ]);
  }

  /** Surcharge l'horloge. Réservé aux tests : la production veut
   *  toujours `Date.now`. */
  __setClockForTest(clock: Clock): void {
    this.clock = clock;
  }

  /** Surcharge la limite d'une action. Réservé aux tests pour
   *  baisser la fenêtre (1s) sans attendre 60 secondes réelles. */
  __setLimitForTest(action: QuotaAction, limit: QuotaLimit): void {
    this.limits.set(action, limit);
  }

  /** Vide toutes les buckets. Équivalent d'un reset complet —
   *  utilisé par `__resetServerStoreForTest` côté serveur pour que
   *  les tests rejouant 100 écritures ne s'arrêtent pas à la 61ᵉ
   *  sur un faux positif. */
  reset(): void {
    this.buckets.clear();
  }

  /** Vide la bucket d'un `(tenantId, action)` précis. Utile aux
   *  tests qui veulent isoler un scénario sans vider les autres. */
  resetKey(tenantId: string, action: QuotaAction): void {
    this.buckets.delete(this.key(tenantId, action));
  }

  /** Test : renvoie le nombre d'entrées dans la bucket. N'est pas
   *  exporté via l'API publique ; reste ici pour servir les tests. */
  sizeForTest(tenantId: string, action: QuotaAction): number {
    return this.buckets.get(this.key(tenantId, action))?.length ?? 0;
  }

  private key(tenantId: string, action: QuotaAction): string {
    return `${tenantId}::${action}`;
  }

  /** Test : la `bucket` brute. Réservé aux tests. */
  __peekForTest(tenantId: string, action: QuotaAction): readonly number[] {
    return this.buckets.get(this.key(tenantId, action)) ?? [];
  }

  /** Vérifie qu'une écriture est autorisée, et — si oui — la
   *  **comptabilise**. L'opération est en deux temps parce que c'est
   *  le seul moyen d'éviter une fenêtre entre check et record où un
   *  appelant pourrait rejouer. Si un `_consume`-separé suivait un
   *  check, deux requêtes quasi-simultanées pourraient passer toutes
   *  les deux avant la première à avoir compté. */
  check(tenantId: string, action: QuotaAction, opts: QuotaCheckOptions = {}): QuotaResult {
    const clock = opts.clock ?? this.clock;
    const limit = opts.limit ?? this.limits.get(action)!;
    const k = this.key(tenantId, action);
    const now = clock();
    const cutoff = now - limit.windowSeconds * 1000;
    const existing = this.buckets.get(k);
    const filtered = existing ? existing.filter((t) => t > cutoff) : [];

    if (filtered.length >= limit.max) {
      // La plus ancienne entrée restant dans la fenêtre fixe le
      // moment où l'appelant pourra retenter.
      const oldest = filtered[0]!;
      const retry_after_sec = Math.max(
        1,
        Math.ceil((oldest + limit.windowSeconds * 1000 - now) / 1000),
      );
      // On **n'écrit pas** dans la bucket — sinon le refus
      // repousserait la fenêtre au lieu de la débloquer.
      this.buckets.set(k, filtered);
      return { ok: false, retry_after_sec, reason: 'quota_exceeded' };
    }

    filtered.push(now);
    this.buckets.set(k, filtered);
    return { ok: true };
  }
}

/** Helper de commodité : applique `check()` et lève une
 *  `QuotaExceededError` typée si le compteur refuse. C'est la forme
 *  appelée par les write paths de `serverStore`. Le retour `void`
 *  évite à l'appelant de manipuler un `QuotaResult` qu'il jette. */
export function consumeQuotaOrThrow(
  tenantId: string,
  action: QuotaAction,
  opts: QuotaCheckOptions = {},
): void {
  const result = getQuotaRegistry().check(tenantId, action, opts);
  if (!result.ok) {
    throw new QuotaExceededError(tenantId, action, result.retry_after_sec);
  }
}

/** Compile-time sanity check : si quelqu'un retire `QUOTA_DEFAULTS`,
 *  on veut que TS hurle ici. Le bloc est mort à l'exécution. */
const _defaultsCheck: typeof QUOTA_DEFAULTS = QUOTA_DEFAULTS;
void _defaultsCheck;
