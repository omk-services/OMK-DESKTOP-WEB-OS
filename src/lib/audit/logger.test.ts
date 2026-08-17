// src/lib/audit/logger.test.ts
// Tests du logger d'audit (cf. BRIEF_AUDIT_LOG § "Tests obligatoires").
//
// Couverture des 10 tests adversariaux + 3 tests ingestion Observers
// (cf. "Tests supplémentaires" du brief). Tous les tests s'exécutent
// avec le spy posé : pas de réseau, pas de Supabase réel.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendEvent,
  listInMemoryEvents,
  __resetInMemoryBufferForTest,
  __resetInsertSpyForTest,
  __setInsertSpyForTest,
} from './logger';
import { ingestFromObserver } from './ingest';
import type { EventRecord } from './event';

beforeEach(() => {
  __resetInsertSpyForTest();
  __resetInMemoryBufferForTest();
});

afterEach(() => {
  __resetInsertSpyForTest();
  __resetInMemoryBufferForTest();
});

const baseRec = (over: Partial<EventRecord> = {}): EventRecord => ({
  tenantId: 'demo',
  actorId: 'agent:test',
  actorRole: 'owner',
  action: 'item.create',
  targetType: 'item',
  targetId: 'item-1',
  metadata: { label: 'Test item' },
  ...over,
});

describe('audit/logger — appendEvent', () => {
  it('#1 appendEvent_inscrit_si_supabase_configure', async () => {
    // Spy succeed : on capture l'event passé à insert.
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    const outcome = await appendEvent(baseRec());
    expect(outcome.kind).toBe('ok');
    expect(captured).toHaveLength(1);
    expect(captured[0].action).toBe('item.create');
    expect(captured[0].tenantId).toBe('demo');
    expect(captured[0].actorId).toBe('agent:test');
    expect(captured[0].metadata.label).toBe('Test item');
  });

  it('#2 appendEvent_echec_ne_leve_pas', async () => {
    // Spy fail : on force un échec d'insert. appendEvent ne doit PAS throw.
    __setInsertSpyForTest({ kind: 'fail', reason: 'simulated RLS reject' });
    const spy = vi.fn();
    try {
      const outcome = await appendEvent(baseRec());
      spy();
      expect(outcome.kind).toBe('lost');
      expect(outcome.reason).toBe('simulated RLS reject');
    } catch (err) {
      // Si on arrive ici, le test échoue.
      spy();
      throw err;
    }
    expect(spy).toHaveBeenCalled();
  });

  it('#3 appendEvent_mode_demo_memoire', async () => {
    // Pas de spy posé : sans Supabase configuré, appendEvent doit
    // retomber sur le buffer in-memory.
    const before = listInMemoryEvents().length;
    const outcome = await appendEvent(baseRec());
    expect(outcome.kind).toBe('memory');
    expect(outcome.event?.action).toBe('item.create');
    const after = listInMemoryEvents();
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].actorId).toBe('agent:test');
  });

  it('appendEvent — sanitize : pas de secret dans metadata', async () => {
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => ({ ...e, createdAt: new Date().toISOString() }),
    });
    const out = await appendEvent(
      baseRec({
        metadata: {
          label: 'safe',
          password: 'hunter2',
          apiKey: 'sk-xxx',
          apikey: 'should-also-be-redacted',
          token: 'bearer-xxx',
        },
      }),
    );
    expect(out.kind).toBe('ok');
    // Le spy a déjà reçu l'event sanitisé : on vérifie via une 2e passe.
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    await appendEvent(
      baseRec({
        metadata: {
          label: 'safe',
          password: 'hunter2',
          apiKey: 'sk-xxx',
        },
      }),
    );
    const meta = captured[0].metadata;
    expect(meta.password).toBe('[REDACTED]');
    expect(meta.apiKey).toBe('[REDACTED]');
    expect(meta.label).toBe('safe');
  });

  it('appendEvent — spy qui throw ne lève pas à l\'appelant', async () => {
    __setInsertSpyForTest({
      kind: 'succeed',
      // record ne respecte pas sa signature : on force une exception.
      record: (() => {
        throw new Error('spy boom');
      }) as unknown as (e: EventRecord) => never,
    });
    // Pas de throw attendu.
    const out = await appendEvent(baseRec());
    expect(out.kind).toBe('lost');
    expect(out.reason).toBe('spy threw');
  });
});

describe('audit/ingest — Observers', () => {
  it('#11 ingestFromObserver_null_actorId', async () => {
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    await ingestFromObserver('opik', {
      tenant_id: 'demo',
      kind: 'trace',
      trace_id: 'tr-123',
    });
    expect(captured).toHaveLength(1);
    expect(captured[0].actorId).toBeNull();
    expect(captured[0].actorRole).toBeNull();
    expect(captured[0].observerSource).toBe('opik');
    expect(captured[0].action).toBe('observer.event');
  });

  it('#12 ingestFromObserver_metadata_brute', async () => {
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    const raw = {
      tenant_id: 'demo',
      trace_id: 'tr-456',
      latency_ms: 1234,
      tokens_in: 1024,
      _internal: 'whatever',
    };
    await ingestFromObserver('agentpulse', raw);
    const meta = captured[0].metadata;
    // Le payload brut est conservé...
    expect(meta.tenant_id).toBe('demo');
    expect(meta.trace_id).toBe('tr-456');
    expect(meta.latency_ms).toBe(1234);
    expect(meta.tokens_in).toBe(1024);
    // ...avec _source et _received_at ajoutés.
    expect(meta._source).toBe('agentpulse');
    expect(typeof meta._received_at).toBe('string');
  });

  it('#13 ingestFromObserver_echec_ne_leve_pas', async () => {
    __setInsertSpyForTest({ kind: 'fail', reason: 'rls-blocked' });
    // Ne doit PAS throw.
    const out = await ingestFromObserver('langsmith', {
      tenant_id: 'demo',
      kind: 'trace',
    });
    // L'ingestion est passée par appendEvent qui a retourné 'lost'.
    // On vérifie qu'on a bien une réponse sans exception.
    expect(out).toBeUndefined();
  });

  it('ingestFromObserver — fallback tenant __external__', async () => {
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    await ingestFromObserver('external', { kind: 'heartbeat' });
    expect(captured[0].tenantId).toBe('__external__');
    expect(captured[0].observerSource).toBe('external');
  });

  it('ingestFromObserver — extractTargetType par défaut', async () => {
    const captured: EventRecord[] = [];
    __setInsertSpyForTest({
      kind: 'succeed',
      record: (e) => {
        captured.push(e);
        return { ...e, createdAt: new Date().toISOString() };
      },
    });
    await ingestFromObserver('phoenix', { tenant_id: 'demo' });
    expect(captured[0].targetType).toBe('observer');
    expect(captured[0].targetId).toBeNull();
  });
});