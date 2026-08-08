/**
 * scenarios.test.ts — la sémantique atomique est testée ici, sans React ni
 * Zustand. C'est la garantie qu'un échec en milieu de chaîne ne laisse pas
 * un état partiel : ou tout passe, ou rien ne fuit.
 *
 * Ces tests sont la raison d'être du brief D. Le test #3 ("une étape échoue
 * → aucune modification appliquée") est la capture preuve 6 — et c'est
 * celui qui est le plus escamoté dans les audits passés. On le rend
 * explicite ici, avec des assertions sur les revert() réellement appelés.
 */
import { describe, it, expect } from 'vitest';
import { mergeAtomically, type Applicator } from './scenarios';
import type { Scenario, Proposal } from '../stores/scenarios.store';

function p(toolName: string, args: Record<string, unknown>, displayName?: string): Proposal {
  return {
    id: `p_${toolName}_${Math.random().toString(36).slice(2, 6)}`,
    toolName,
    args,
    displayName: displayName ?? toolName,
    status: 'pending',
    createdAt: Date.now(),
  };
}

function scenario(proposals: Proposal[]): Scenario {
  return {
    id: 'scn_test',
    name: 'test',
    status: 'pending',
    proposals,
    createdBy: 'test',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('mergeAtomically', () => {
  it('applique toutes les propositions quand aucune ne plante', () => {
    let a = 0; let b = 0;
    const applicators: Record<string, Applicator> = {
      incA: () => { a++; return { ok: true, revert: () => { a--; } }; },
      incB: () => { b++; return { ok: true, revert: () => { b--; } }; },
    };
    const r = mergeAtomically(scenario([p('incA', {}), p('incB', {})]), applicators);
    expect(r.applied).toHaveLength(2);
    expect(r.failedProposalId).toBeNull();
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(r.scenario.status).toBe('merged');
    expect(r.scenario.merge?.success).toBe(true);
  });

  it('CAS CRITIQUE — une étape qui échoue → AUCUNE modification appliquée', () => {
    let a = 0; let b = 0;
    const applicators: Record<string, Applicator> = {
      incA: () => { a++; return { ok: true, revert: () => { a--; } }; },
      explode: () => ({ ok: false, error: 'Oups — étape 2 a échoué' }),
      incB: () => { b++; return { ok: true, revert: () => { b--; } }; },
    };
    const r = mergeAtomically(
      scenario([p('incA', {}), p('explode', {}), p('incB', {})]),
      applicators,
    );
    // Aucune fuite : a a été revertée, b n'a jamais été touché.
    expect(a).toBe(0);
    expect(b).toBe(0);
    expect(r.failedProposalId).not.toBeNull();
    expect(r.failureReason).toBe('Oups — étape 2 a échoué');
    // La sémantique : 'applied' liste ce qui a été appliqué avant revert,
    // 'reverted' liste ce qui a été annulé. Pour l'observateur, la somme
    // est nulle. La proposition 'incA' a été appliquée puis revertée — elle
    // apparaît dans les deux listes ; c'est l'audit de la séquence, pas
    // l'état final.
    expect(r.applied.length).toBe(1);
    expect(r.reverted.length).toBe(1);
    // Le scénario reste 'approved' (jamais 'merged') avec merge.success=false
    expect(r.scenario.status).toBe('approved');
    expect(r.scenario.merge?.success).toBe(false);
    // La proposition 'incA' doit être marquée reverted.
    const incA = r.scenario.proposals.find((x) => x.toolName === 'incA');
    expect(incA?.status).toBe('reverted');
    // 'incB' reste pending — elle n'a jamais été tentée.
    const incB = r.scenario.proposals.find((x) => x.toolName === 'incB');
    expect(incB?.status).toBe('pending');
  });

  it('CAS CRITIQUE — étape 1 qui échoue → étapes suivantes jamais tentées', () => {
    let a = 0;
    const applicators: Record<string, Applicator> = {
      explode: () => ({ ok: false, error: 'boom' }),
      incA: () => { a++; return { ok: true, revert: () => { a--; } }; },
    };
    const r = mergeAtomically(
      scenario([p('explode', {}), p('incA', {})]),
      applicators,
    );
    expect(a).toBe(0);
    expect(r.failedProposalId).not.toBeNull();
    expect(r.scenario.status).toBe('approved');
    expect(r.scenario.merge?.success).toBe(false);
  });

  it('revert qui échoue ne casse pas la sémantique tout-ou-rien', () => {
    let a = 0;
    const applicators: Record<string, Applicator> = {
      incA: () => {
        a++;
        return {
          ok: true,
          revert: () => { throw new Error('revert cassé'); },
        };
      },
      explode: () => ({ ok: false, error: 'boom' }),
    };
    const r = mergeAtomically(scenario([p('incA', {}), p('explode', {})]), applicators);
    // a peut rester à 1 si la revert a planté, mais le scénario doit être
    // marqué en échec — la sémantique contractuelle pour l'observateur est
    // préservée : le scénario est 'approved' avec merge.success=false.
    expect(r.scenario.status).toBe('approved');
    expect(r.scenario.merge?.success).toBe(false);
    expect(r.failedProposalId).not.toBeNull();
  });

  it('outil sans applicateur → échec franc', () => {
    const r = mergeAtomically(scenario([p('unknown', {})]), {});
    expect(r.failedProposalId).not.toBeNull();
    expect(r.failureReason).toContain('Outil inconnu');
  });

  it('applicateur sans revert → échec franc', () => {
    const applicators: Record<string, Applicator> = {
      noRevert: () => ({ ok: true }),
    };
    const r = mergeAtomically(scenario([p('noRevert', {})]), applicators);
    expect(r.failedProposalId).not.toBeNull();
    expect(r.failureReason).toContain('ne fournit pas de revert');
  });

  it("avec comparaison et recommandation, seules les propositions de l'option retenue sont fusionnées", () => {
    let a = 0; let b = 0; let c = 0;
    const applicators: Record<string, Applicator> = {
      A: () => { a++; return { ok: true, revert: () => { a--; } }; },
      B: () => { b++; return { ok: true, revert: () => { b--; } }; },
      C: () => { c++; return { ok: true, revert: () => { c--; } }; },
    };
    const pA = p('A', {}); const pB = p('B', {}); const pC = p('C', {});
    const sc: Scenario = {
      ...scenario([pA, pB, pC]),
      comparison: {
        options: [
          { id: 'optA', label: 'Voie A', rationale: '', metrics: [], proposalIds: [pA.id] },
          { id: 'optB', label: 'Voie B', rationale: '', metrics: [], proposalIds: [pB.id] },
          { id: 'optC', label: 'Voie C', rationale: '', metrics: [], proposalIds: [pC.id] },
        ],
        recommendation: 'optB',
      },
    };
    const r = mergeAtomically(sc, applicators);
    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(c).toBe(0);
    expect(r.applied).toEqual([pB.id]);
  });

  it('scénario sans proposition → succès vide', () => {
    const r = mergeAtomically(scenario([]), {});
    expect(r.applied).toEqual([]);
    expect(r.failedProposalId).toBeNull();
    expect(r.scenario.status).toBe('merged');
    expect(r.scenario.merge?.success).toBe(true);
  });
});
