// src/lib/audit/logger.ts
// Logger d'audit — appendEvent, no-throw par construction.
//
// Règle non-négociable (cf. BRIEF_AUDIT_LOG § "Logger") :
//   appendEvent() ne lève JAMAIS. Un audit qui casse l'app est pire
//   qu'un audit qui perd un event. Tout échec (réseau, RLS, table
//   absente, JSON malformé) descend dans console.warn et disparaît.
//
// Trois modes :
//   1. Supabase configuré + service_role disponible : INSERT.
//   2. Supabase configuré mais pas de service_role en navigateur :
//      best-effort INSERT via le client anon (peut être refusé par
//      RLS — l'event est alors bufferisé en mémoire).
//   3. Supabase non configuré (mode démo) : append dans un buffer
//      in-memory, exportable pour debug.
//
// En test, `__setInsertSpyForTest` permet de capturer les appels et
// de simuler un échec sans toucher au réseau.

import { supabase, supabaseConfigured } from '../supabase';
import type { EventRecord } from './event';

/** Forme interne d'un event en mémoire, après sérialisation safe. */
export interface InMemoryAuditEvent extends EventRecord {
  /** ISO 8601, posé au moment de l'append (pas d'horloge externe). */
  createdAt: string;
}

/** Buffer in-memory pour mode démo et pour le test. C'est une file
 *  bornée : un overflow ne lève pas, il écrase les plus anciens. La
 *  mémoire n'est jamais un mode de production — c'est seulement le
 *  filet quand Supabase n'est pas configuré. */
const inMemoryBuffer: InMemoryAuditEvent[] = [];
const IN_MEMORY_LIMIT = 1000;

/** Spy de test : intercepte appendEvent avant l'INSERT réel. Permet
 *  aux tests de mesurer les bons champs, ou de simuler un échec. */
type InsertSpy =
  | { kind: 'succeed'; record: (e: EventRecord) => InMemoryAuditEvent }
  | { kind: 'fail'; reason: string };

let _insertSpy: InsertSpy | null = null;

/** Pose un spy. Réservé aux tests — utiliser `__resetInsertSpyForTest`
 *  après chaque test pour ne pas polluer les suivants. */
export function __setInsertSpyForTest(spy: InsertSpy | null): void {
  _insertSpy = spy;
}

export function __resetInsertSpyForTest(): void {
  _insertSpy = null;
}

/** Liste les events en mémoire (mode démo). Le contenu n'est jamais
 *  persisté disque — c'est le mode démo, qui vit dans la session. */
export function listInMemoryEvents(): readonly InMemoryAuditEvent[] {
  return inMemoryBuffer.slice();
}

/** Vide le buffer. Réservé aux tests. */
export function __resetInMemoryBufferForTest(): void {
  inMemoryBuffer.length = 0;
}

/** Sanitize metadata : drop tout ce qui ressemble à un secret. C'est
 *  une heuristique, pas une garantie — le caller est responsable de
 *  ne PAS passer de secret. On attrape les cas triviaux. */
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    const lower = k.toLowerCase().replace(/[_-]/g, '');
    // Heuristique ciblée : on redacted les clés manifestement sensibles,
    // pas tout ce qui contient un mot générique (sinon "tokens_in" saute,
    // ce qui est absurde pour de la télémétrie).
    const isSensitive =
      lower === 'password' ||
      lower === 'passwd' ||
      lower === 'secret' ||
      lower === 'apikey' ||
      lower === 'apikey' ||
      lower === 'privatekey' ||
      lower === 'accesstoken' ||
      lower === 'refreshtoken' ||
      lower === 'authorization' ||
      lower === 'jwt' ||
      lower === 'cookie' ||
      lower === 'sessionid';
    if (isSensitive) {
      out[k] = '[REDACTED]';
      continue;
    }
    out[k] = v;
  }
  return out;
}

function pushInMemory(rec: EventRecord): InMemoryAuditEvent {
  // Le sanitize est appliqué dans appendEvent avant d'arriver ici.
  const evt: InMemoryAuditEvent = {
    ...rec,
    createdAt: new Date().toISOString(),
  };
  inMemoryBuffer.push(evt);
  while (inMemoryBuffer.length > IN_MEMORY_LIMIT) {
    inMemoryBuffer.shift();
  }
  return evt;
}

/** INSERT asynchrone vers Supabase. Best-effort. Ne lève jamais. */
async function insertSupabase(rec: EventRecord): Promise<{ ok: boolean; reason?: string }> {
  if (!supabaseConfigured) return { ok: false, reason: 'supabase not configured' };
  try {
    const row = {
      tenant_id: rec.tenantId,
      actor_id: rec.actorId,
      actor_role: rec.actorRole,
      action: rec.action,
      target_type: rec.targetType,
      target_id: rec.targetId,
      metadata: rec.metadata ?? {},
      ip_address: rec.ipAddress ?? null,
      user_agent: rec.userAgent ?? null,
      observer_source: rec.observerSource ?? null,
    };
    // Cast en any pour éviter le couplage trop strict au type de la
    // table dans le SDK Supabase. La table peut être absente en local.
    const client = supabase as unknown as {
      from: (t: string) => {
        insert: (row: unknown) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await client.from('audit_events').insert(row);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[audit] insert failed:', error.message);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[audit] insert threw:', err instanceof Error ? err.message : String(err));
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Append un event d'audit. **Ne lève JAMAIS**. Le résultat est rendu
 *  par `outcome` : `ok` si l'INSERT a réussi, `memory` si on est en
 *  mode démo, `lost` si l'INSERT a échoué (l'event n'est pas perdu
 *  mais on l'a affiché — un retry pourrait être ajouté V2). */
export interface AppendOutcome {
  kind: 'ok' | 'memory' | 'lost';
  reason?: string;
  /** Event tel qu'il a été bufferisé (mode démo). */
  event?: InMemoryAuditEvent;
}

export async function appendEvent(rec: EventRecord): Promise<AppendOutcome> {
  // Sanitize d'abord — même en présence d'un spy de test, on ne doit
  // JAMAIS laisser passer un secret. C'est l'invariant qui fait que
  // le test #1 et la prod partagent le même chemin.
  const sanitized: EventRecord = {
    ...rec,
    metadata: sanitizeMetadata(rec.metadata ?? {}),
  };

  // Spy de test — intercepte tout, court-circuite le reste.
  if (_insertSpy) {
    try {
      if (_insertSpy.kind === 'succeed') {
        const evt = _insertSpy.record(sanitized);
        return { kind: 'ok', event: evt };
      }
      // fail
      // eslint-disable-next-line no-console
      console.warn('[audit] insert forced fail:', _insertSpy.reason);
      return { kind: 'lost', reason: _insertSpy.reason };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[audit] spy threw:', err instanceof Error ? err.message : String(err));
      return { kind: 'lost', reason: 'spy threw' };
    }
  }

  // Mode démo : buffer in-memory, pas de réseau.
  if (!supabaseConfigured) {
    const evt = pushInMemory(rec);
    return { kind: 'memory', event: evt };
  }

  // Supabase configuré : INSERT best-effort.
  const result = await insertSupabase(rec);
  if (result.ok) return { kind: 'ok' };
  return { kind: 'lost', reason: result.reason };
}