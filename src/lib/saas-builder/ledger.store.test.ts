// src/lib/saas-builder/ledger.store.test.ts
// Tests du ledger : append-only, persistance, total cumule correct.
// SPEC §8 : 3 cas minimum.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  useLedgerStore,
  totalUsd,
  summary,
  type LedgerEntry,
} from './ledger.store';
import { ledgerMarkdown } from './ledger.export';

const ORIGINAL_STORAGE = globalThis.localStorage;

beforeEach(() => {
  useLedgerStore.getState().reset();
});

afterEach(() => {
  if (ORIGINAL_STORAGE !== undefined) {
    try {
      ORIGINAL_STORAGE.clear();
    } catch {
      // mode prive : OK
    }
  }
});

function makeEntry(overrides: Partial<LedgerEntry> = {}): Omit<LedgerEntry, 'id' | 'ts'> {
  return {
    routeId: 'fal-ai/flux-2/flash',
    promptSnippet: 'a pizza oven',
    outputPath: 'outputs/pizza.jpg',
    costUsd: 0.039,
    costConfidence: 'verified',
    vendor: 'fal',
    ...overrides,
  };
}

describe('useLedgerStore — append-only', () => {
  it('append ajoute une entree avec id (UUID) et ts (ISO)', () => {
    const e = useLedgerStore.getState().append(makeEntry());
    expect(e.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(e.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('plusieurs append cumulent les entrees sans doublonner', () => {
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.1 }));
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.2 }));
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.05 }));
    expect(useLedgerStore.getState().entries).toHaveLength(3);
    // total cumule
    expect(totalUsd()).toBeCloseTo(0.35, 5);
  });

  it('reset vide toutes les entrees', () => {
    useLedgerStore.getState().append(makeEntry());
    useLedgerStore.getState().append(makeEntry());
    useLedgerStore.getState().reset();
    expect(useLedgerStore.getState().entries).toEqual([]);
  });

  it('ne mute JAMAIS une entree existante (pas de setEntries public)', () => {
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.1 }));
    // L'API publique n'expose pas de setEntries ni de deleteEntry.
    // On verifie en tappant la surface : seul `append` et `reset` sont sur l'objet.
    const state = useLedgerStore.getState();
    expect(Object.keys(state).sort()).toEqual(['append', 'entries', 'reset']);
  });
});

describe('summary', () => {
  it('rend le bon total cumule + moyenne', () => {
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.1 }));
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.2 }));
    const s = summary();
    expect(s.totalGenerations).toBe(2);
    expect(s.allTimeUsd).toBeCloseTo(0.3, 5);
    expect(s.averageUsd).toBeCloseTo(0.15, 5);
  });

  it('compte les verified et estimated separement', () => {
    useLedgerStore.getState().append(makeEntry({ costConfidence: 'verified' }));
    useLedgerStore.getState().append(makeEntry({ costConfidence: 'estimated' }));
    useLedgerStore.getState().append(makeEntry({ costConfidence: 'estimated' }));
    const s = summary();
    expect(s.verifiedCount).toBe(1);
    expect(s.estimatedCount).toBe(2);
  });

  it('rend un summary vide propre quand aucune entree', () => {
    const s = summary();
    expect(s).toEqual({
      totalGenerations: 0,
      allTimeUsd: 0,
      averageUsd: 0,
      verifiedCount: 0,
      estimatedCount: 0,
    });
  });
});

describe('ledgerMarkdown export', () => {
  it('genere le markdown avec header + table + running total', () => {
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.039 }));
    useLedgerStore.getState().append(makeEntry({ costUsd: 0.260, costConfidence: 'estimated', routeId: 'fal-ai/veo3.1/fast' }));
    const md = ledgerMarkdown(useLedgerStore.getState().entries);
    expect(md).toContain('# SaaS Builder');
    expect(md).toContain('| Timestamp | Route |');
    expect(md).toContain('fal-ai/flux-2/flash');
    expect(md).toContain('fal-ai/veo3.1/fast');
    expect(md).toContain('Running total: $0.299');
    expect(md).toContain('~est$0.260'); // estimated = ~est
  });
});
