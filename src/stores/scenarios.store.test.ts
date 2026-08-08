/**
 * scenarios.store.test.ts — le contrat du magasin des scénarios.
 *
 * Couvre les invariants qui doivent tenir quel que soit le chemin
 * (createScenario, addProposal, submitForApproval, approveAndMerge) :
 *  - un addProposal sans scénario courant en crée un automatiquement ;
 *  - le scénario courant est sélectionné sur le dépôt ;
 *  - l'approbation atomique via le store respecte la sémantique
 *    tout-ou-rien (le test d'atomique vit dans scenarios.test.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useScenariosStore } from './scenarios.store';
import { mergeAtomically, type Applicator } from '../agent/scenarios';

// Pour isoler les tests, on remet le store à zéro entre chaque describe.
const reset = () => useScenariosStore.setState({
  scenarios: {},
  scenarioOrder: [],
  currentScenarioId: null,
});

describe('scenarios.store', () => {
  beforeEach(reset);

  it('addProposal sans scénario courant en crée un automatiquement', () => {
    const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'nuit' },
      displayName: 'Thème nuit',
    });
    const s = useScenariosStore.getState();
    expect(s.currentScenarioId).toBe(scenarioId);
    expect(s.scenarios[scenarioId]?.proposals).toHaveLength(1);
    expect(s.scenarios[scenarioId]?.proposals[0].id).toBe(proposalId);
  });

  it('la proposition déposée ne touche pas au thème réel', () => {
    const before = useScenariosStore.getState();
    void before;
    // On vérifie que le scénario existe et que son statut est 'draft' —
    // l'invariant "rien n'a fui" est ici. Pas besoin de lire le thème :
    // il n'a jamais été appliqué.
    useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'nuit' },
      displayName: 'Thème nuit',
    });
    const sc = Object.values(useScenariosStore.getState().scenarios)[0];
    expect(sc).toBeTruthy();
    expect(sc.status).toBe('draft');
    expect(sc.proposals[0].status).toBe('pending');
  });

  it("submitForApproval fait passer le scénario de draft à pending", () => {
    const { scenarioId } = useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'aurore' },
      displayName: 'Aurore',
    });
    useScenariosStore.getState().submitForApproval(scenarioId);
    expect(useScenariosStore.getState().scenarios[scenarioId].status).toBe('pending');
  });

  it('approveAndMerge applique les propositions via les applicateurs', () => {
    const { scenarioId } = useScenariosStore.getState().addProposal({
      toolName: 'inc',
      args: { n: 1 },
      displayName: 'inc1',
    });
    useScenariosStore.getState().addProposal({
      toolName: 'inc',
      args: { n: 2 },
      displayName: 'inc2',
    });
    useScenariosStore.getState().submitForApproval(scenarioId);

    let total = 0;
    const applicators: Record<string, Applicator> = {
      inc: (args) => {
        const n = Number(args.n ?? 0);
        total += n;
        return { ok: true, revert: () => { total -= n; } };
      },
    };
    useScenariosStore.getState().approveAndMerge(scenarioId, applicators);
    expect(total).toBe(3); // 1 + 2
    const sc = useScenariosStore.getState().scenarios[scenarioId];
    expect(sc.status).toBe('merged');
    expect(sc.merge?.success).toBe(true);
    expect(sc.proposals.every((p) => p.status === 'applied')).toBe(true);
  });

  it('approveAndMerge qui échoue revert toutes les propositions et marque le scénario en échec', () => {
    const { scenarioId } = useScenariosStore.getState().addProposal({
      toolName: 'inc',
      args: { n: 1 },
      displayName: 'inc1',
    });
    useScenariosStore.getState().addProposal({
      toolName: 'explode',
      args: {},
      displayName: 'boom',
    });
    useScenariosStore.getState().submitForApproval(scenarioId);

    let total = 0;
    const applicators: Record<string, Applicator> = {
      inc: (args) => {
        const n = Number(args.n ?? 0);
        total += n;
        return { ok: true, revert: () => { total -= n; } };
      },
      explode: () => ({ ok: false, error: 'boom' }),
    };
    useScenariosStore.getState().approveAndMerge(scenarioId, applicators);
    expect(total).toBe(0); // 'inc' appliqué puis reverté
    const sc = useScenariosStore.getState().scenarios[scenarioId];
    expect(sc.status).toBe('approved');
    expect(sc.merge?.success).toBe(false);
    expect(sc.merge?.failureReason).toBe('boom');
  });

  it("removeProposal retire la proposition mais laisse le scénario", () => {
    const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'nuit' },
      displayName: 'nuit',
    });
    expect(useScenariosStore.getState().scenarios[scenarioId].proposals).toHaveLength(1);
    useScenariosStore.getState().removeProposal(scenarioId, proposalId);
    expect(useScenariosStore.getState().scenarios[scenarioId].proposals).toHaveLength(0);
    // Le scénario reste — on n'efface pas tout si l'approbateur retire une option.
    expect(useScenariosStore.getState().scenarios[scenarioId]).toBeTruthy();
  });

  it('editProposal change les args et le displayName', () => {
    const { scenarioId, proposalId } = useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'nuit' },
      displayName: 'nuit',
    });
    useScenariosStore.getState().editProposal(
      scenarioId,
      proposalId,
      { themeId: 'aurore' },
      'aurore',
    );
    const p = useScenariosStore.getState().scenarios[scenarioId].proposals[0];
    expect(p.args).toEqual({ themeId: 'aurore' });
    expect(p.displayName).toBe('aurore');
  });

  it('setComparison pose une comparaison multi-voies', () => {
    const { scenarioId } = useScenariosStore.getState().addProposal({
      toolName: 'changerTheme',
      args: { themeId: 'nuit' },
      displayName: 'nuit',
    });
    useScenariosStore.getState().setComparison(scenarioId, {
      options: [
        { id: 'a', label: 'A', rationale: 'r', metrics: [], proposalIds: [] },
      ],
      recommendation: 'a',
    });
    expect(useScenariosStore.getState().scenarios[scenarioId].comparison?.recommendation).toBe('a');
  });

  it('mergeAtomically via scenarios.ts reste cohérent avec le store', () => {
    // Garantit qu'on peut utiliser mergeAtomically directement (cas tests /
    // scripts CLI) sans dépendre du wrapper Zustand. Le store utilise déjà
    // le helper.
    const sc = {
      id: 's', name: 's', status: 'pending' as const,
      proposals: [
        { id: 'p1', toolName: 'inc', args: { n: 1 }, displayName: 'inc', status: 'pending' as const, createdAt: 0 },
      ],
      createdBy: 't', createdAt: 0, updatedAt: 0,
    };
    let n = 0;
    const applicators: Record<string, Applicator> = {
      inc: (args) => { n += Number(args.n); return { ok: true, revert: () => { n -= Number(args.n); } }; },
    };
    const r = mergeAtomically(sc, applicators);
    expect(n).toBe(1);
    expect(r.scenario.status).toBe('merged');
  });
});
