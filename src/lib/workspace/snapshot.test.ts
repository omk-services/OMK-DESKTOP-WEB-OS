// src/lib/workspace/snapshot.test.ts
// Tests de déterminisme et aller-retour du sérialiseur.

import { describe, it, expect } from 'vitest';
import { canonicalJson, restorer, serialiser } from './snapshot';
import type { WorkspaceData } from './types';

function fixture(): WorkspaceData {
  return {
    collections: [
      { id: 'b', name: 'Beta', singular: 'beta', accent: '#0f0', titleField: 't', subtitleField: '', badgeField: '', fields: [{ key: 'k', label: 'K', type: 'text' }] },
      { id: 'a', name: 'Alpha', singular: 'alpha', accent: '#f00', titleField: 't', subtitleField: '', badgeField: '', fields: [{ key: 'k', label: 'K', type: 'text' }, { key: 'j', label: 'J', type: 'text' }] },
    ],
    items: [
      { id: '2', collectionId: 'a', data: { name: 'second' } },
      { id: '1', collectionId: 'a', data: { name: 'first' } },
    ],
    memberships: [
      { userId: 'u2', role: 'admin', status: 'active' },
      { userId: 'u1', role: 'owner', status: 'active' },
    ],
  };
}

describe('workspace/snapshot', () => {
  it('serialiser_deterministe : même workspace → même hash', async () => {
    const ws = fixture();
    const a = await serialiser(ws);
    const b = await serialiser(ws);
    expect(a.payloadHash).toBe(b.payloadHash);
    expect(a.payload).toBe(b.payload);
  });

  it('serialiser_deterministe : ordre des clés sans effet', async () => {
    const ws1: WorkspaceData = {
      collections: [
        { id: 'a', name: 'Alpha', singular: 'a', accent: '', titleField: '', subtitleField: '', badgeField: '', fields: [] },
        { id: 'b', name: 'Beta',  singular: 'b', accent: '', titleField: '', subtitleField: '', badgeField: '', fields: [] },
      ],
      items: [],
      memberships: [],
    };
    const ws2: WorkspaceData = {
      collections: [
        { id: 'b', name: 'Beta',  singular: 'b', accent: '', titleField: '', subtitleField: '', badgeField: '', fields: [] },
        { id: 'a', name: 'Alpha', singular: 'a', accent: '', titleField: '', subtitleField: '', badgeField: '', fields: [] },
      ],
      items: [],
      memberships: [],
    };
    const a = await serialiser(ws1);
    const b = await serialiser(ws2);
    expect(a.payloadHash).toBe(b.payloadHash);
  });

  it('restorer_inverse_serialiser : aller-retour sans perte', async () => {
    const ws = fixture();
    const { payload } = await serialiser(ws);
    const restored = restorer(payload);
    expect(restored.collections.length).toBe(ws.collections.length);
    expect(restored.items.length).toBe(ws.items.length);
    expect(restored.memberships.length).toBe(ws.memberships.length);
    // Collections normalisées (ordre alphabétique)
    expect(restored.collections[0].id).toBe('a');
    expect(restored.collections[1].id).toBe('b');
    // Items normalisés (triés par id)
    expect(restored.items[0].id).toBe('1');
    expect(restored.items[1].id).toBe('2');
    // Memberships normalisés
    expect(restored.memberships[0].userId).toBe('u1');
    expect(restored.memberships[1].userId).toBe('u2');
  });

  it('canonicalJson produit une chaîne stable', () => {
    const a = canonicalJson(fixture());
    const b = canonicalJson(fixture());
    expect(a).toBe(b);
    expect(a.startsWith('{')).toBe(true);
  });

  it('restorer rejette un payload corrompu', () => {
    expect(() => restorer('{not-json')).toThrow();
    expect(() => restorer('{"foo": 1}')).toThrow(/payload invalide/);
  });
});