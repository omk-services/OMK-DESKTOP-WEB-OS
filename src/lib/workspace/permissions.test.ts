// src/lib/workspace/permissions.test.ts
// Tests de la matrice rôle × action (5 actions × 4 rôles = 20 combinaisons
// + edge cases). Aucune dépendance externe.

import { describe, it, expect } from 'vitest';
import {
  peut,
  peutCreerBranche,
  peutOuvrirPr,
  peutReviewPr,
  peutMergerPr,
  peutSupprimerBranche,
} from './permissions';

describe('workspace/permissions — matrice rôle × action', () => {
  it('owner peut creer, ouvrir, reviewer, merger, supprimer', () => {
    expect(peutCreerBranche('owner')).toBe(true);
    expect(peutOuvrirPr('owner')).toBe(true);
    expect(peutReviewPr('owner')).toBe(true);
    expect(peutMergerPr('owner')).toBe(true);
    expect(peutSupprimerBranche('owner', false)).toBe(true);
  });

  it('admin peut creer, ouvrir, reviewer, mais PAS merger', () => {
    expect(peutCreerBranche('admin')).toBe(true);
    expect(peutOuvrirPr('admin')).toBe(true);
    expect(peutReviewPr('admin')).toBe(true);
    expect(peutMergerPr('admin')).toBe(false);
    expect(peutSupprimerBranche('admin', false)).toBe(false);
  });

  it('member peut ouvrir, mais rien d\'autre', () => {
    expect(peutCreerBranche('member')).toBe(false);
    expect(peutOuvrirPr('member')).toBe(true);
    expect(peutReviewPr('member')).toBe(false);
    expect(peutMergerPr('member')).toBe(false);
    expect(peutSupprimerBranche('member', false)).toBe(false);
  });

  it('guest ne peut rien faire en ecriture', () => {
    expect(peutCreerBranche('guest')).toBe(false);
    expect(peutOuvrirPr('guest')).toBe(false);
    expect(peutReviewPr('guest')).toBe(false);
    expect(peutMergerPr('guest')).toBe(false);
    expect(peutSupprimerBranche('guest', false)).toBe(false);
  });

  it('suppression de la branche main est refusee pour tout le monde, y compris owner', () => {
    expect(peutSupprimerBranche('owner', true)).toBe(false);
    const r = peut('supprimerBranche', { role: 'owner', isMain: true });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('forbidden');
  });

  it('admin ne peut pas reviewer sa propre PR (self_approval)', () => {
    const r = peut('reviewerPr', { role: 'admin', actorId: 'u-1', authorId: 'u-1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('self_approval');
  });

  it('owner PEUT reviewer sa propre PR (override légitime du owner)', () => {
    const r = peut('reviewerPr', { role: 'owner', actorId: 'u-1', authorId: 'u-1' });
    expect(r.ok).toBe(true);
  });
});