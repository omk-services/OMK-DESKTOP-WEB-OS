// src/lib/audit/ingest.ts
// Ingestion d'events depuis les Observers externes (NOUVEAU 2026-08-15).
//
// Chaque Observer a son endpoint, son format, son timing — mais tous
// tapent `ingestFromObserver()` qui normalise vers appendEvent() avec
// `observerSource` rempli et `actor_id = null` (l'event vient de
// l'extérieur, pas d'un humain).
//
// Le test #11 garantit que `actor_id = NULL`, le test #12 que
// `metadata` contient le payload brut + `_source`, et le test #13
// que l'INSERT qui échoue ne lève pas (cf. règle #5 du GARDE-FOU).

import { appendEvent } from './logger';
import type { EventRecord, ObserverSource } from './event';

/** Forme brute d'un payload Observer. Chaque source a son propre
 *  dialecte ; on accepte tout et on stocke brut dans `metadata`. */
export type ObserverPayload = Record<string, unknown>;

/** Extrait un tenantId depuis un payload Observer. Si l'Observer ne
 *  porte pas de tenant (par ex. une trace opik d'un agent hors
 *  coach-os), on retombe sur '__external__'. */
export function extractTenantId(raw: ObserverPayload): string {
  const candidates = [
    raw.tenant_id,
    raw.tenantId,
    raw.org_id,
    raw.orgId,
    (raw.tenant as { id?: unknown } | undefined)?.id,
    raw.metadata && typeof raw.metadata === 'object'
      ? (raw.metadata as Record<string, unknown>).tenant_id
      : undefined,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0 && c.length <= 64) return c;
  }
  return '__external__';
}

/** Extrait le targetType — défaut 'observer' pour ne pas perdre l'info. */
export function extractTargetType(raw: ObserverPayload): string {
  const candidates = [raw.target_type, raw.targetType, raw.kind, raw.event_type, raw.eventType];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0 && c.length <= 64) return c;
  }
  return 'observer';
}

/** Extrait le targetId — optionnel, beaucoup d'events Observer n'en
 *  portent pas (heartbeats, traces anonymes). */
export function extractTargetId(raw: ObserverPayload): string | null {
  const candidates = [
    raw.target_id,
    raw.targetId,
    raw.id,
    raw.trace_id,
    raw.traceId,
    raw.run_id,
    raw.runId,
    raw.session_id,
    raw.sessionId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
    if (typeof c === 'number') return String(c);
  }
  return null;
}

/** Ingestion principale. Ajoute `_source` et `_received_at` dans
 *  metadata pour que la trace reste traçable côté coach-os même si
 *  l'Observer mute son payload. Ne lève JAMAIS (délègue à appendEvent). */
export async function ingestFromObserver(
  source: ObserverSource,
  raw: ObserverPayload,
): Promise<void> {
  const tenantId = extractTenantId(raw);
  const targetType = extractTargetType(raw);
  const targetId = extractTargetId(raw);

  const metadata: Record<string, unknown> = {
    ...raw,
    _source: source,
    _received_at: new Date().toISOString(),
  };

  const rec: EventRecord = {
    tenantId,
    actorId: null,
    actorRole: null,
    action: 'observer.event',
    targetType,
    targetId,
    metadata,
    observerSource: source,
  };

  await appendEvent(rec);
}

/** Endpoint HTTP générique pour brancher un Observer. Le format
 *  accepté est volontairement minimal : `{ "source": "...", "raw": {...} }`.
 *  Renvoie `{ ok: true }` même si l'append a échoué — c'est un
 *  observability pipe, jamais une source de panne côté Observer. */
export async function handleIngestRequest(body: unknown): Promise<{ ok: boolean; reason?: string }> {
  if (!body || typeof body !== 'object') {
    return { ok: false, reason: 'body invalide' };
  }
  const b = body as { source?: unknown; raw?: unknown };
  if (typeof b.source !== 'string') {
    return { ok: false, reason: '`source` manquant ou non-string' };
  }
  if (!b.raw || typeof b.raw !== 'object') {
    return { ok: false, reason: '`raw` manquant ou non-object' };
  }
  // On ne type-assert pas la source ici : ingestFromObserver accepte
  // n'importe quel ObserverSource. Si b.source est invalide, on
  // retombe sur 'external'.
  const src = (b.source as ObserverSource) ?? 'external';
  await ingestFromObserver(src, b.raw as ObserverPayload);
  return { ok: true };
}