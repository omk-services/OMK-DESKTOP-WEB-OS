// src/lib/workspace/diff.test.ts
// Tests du diff sur les 3 catégories (collections / items / membres).

import { describe, it, expect } from 'vitest';
import { diff, diffEstVide } from './diff';
import type { WorkspaceData } from './types';

const base: WorkspaceData = {
  collections: [
    { id: 'a', name: 'Alpha', singular: 'alpha', accent: '#f00', titleField: 't', subtitleField: '', badgeField: '', fields: [] },
  ],
  items: [
    { id: '1', collectionId: 'a', data: { name: 'first' } },
    { id: '2', collectionId: 'a', data: { name: 'second' } },
  ],
  memberships: [
    { userId: 'u1', role: 'owner', status: 'active' },
  ],
};

describe('workspace/diff', () => {
  it('diff_detecte_3_categories : collections / items / membres', () => {
    const b: WorkspaceData = {
      collections: [
        ...base.collections,
        { id: 'b', name: 'Beta', singular: 'beta', accent: '#0f0', titleField: 't', subtitleField: '', badgeField: '', fields: [] },
      ],
      items: [
        ...base.items,
        { id: '3', collectionId: 'a', data: { name: 'third' } },
        { id: '1', collectionId: 'a', data: { name: 'first-updated' } }, // modified
      ],
      memberships: [
        ...base.memberships,
        { userId: 'u2', role: 'member', status: 'active' }, // added
      ],
    };
    const d = diff(base, b);
    expect(d.collectionsAdded.map((c) => c.id)).toEqual(['b']);
    expect(d.itemsAdded.map((it) => it.id)).toEqual(['3']);
    expect(d.itemsModified.length).toBe(1);
    expect(d.itemsModified[0].before.id).toBe('1');
    expect(d.itemsModified[0].after.data.name).toBe('first-updated');
    expect(d.membersAdded.map((m) => m.userId)).toEqual(['u2']);
  });

  it('détecte un item supprimé', () => {
    const b: WorkspaceData = {
      ...base,
      items: base.items.filter((it) => it.id !== '1'),
    };
    const d = diff(base, b);
    expect(d.itemsRemoved).toContain('a:1');
    expect(diffEstVide(d)).toBe(false);
  });

  it('détecte une collection supprimée', () => {
    const b: WorkspaceData = {
      ...base,
      collections: [],
    };
    const d = diff(base, b);
    expect(d.collectionsRemoved).toEqual(['a']);
  });

  it('détecte un membre révoqué', () => {
    const b: WorkspaceData = {
      ...base,
      memberships: [],
    };
    const d = diff(base, b);
    expect(d.membersRevoked).toContain('u1');
  });

  it('diff vide si rien ne change', () => {
    const d = diff(base, { ...base });
    expect(diffEstVide(d)).toBe(true);
  });

  it('membership pending → pas compté comme ajouté', () => {
    const b: WorkspaceData = {
      ...base,
      memberships: [
        ...base.memberships,
        { userId: 'u3', role: 'member', status: 'pending' },
      ],
    };
    const d = diff(base, b);
    expect(d.membersAdded.map((m) => m.userId)).not.toContain('u3');
  });
});