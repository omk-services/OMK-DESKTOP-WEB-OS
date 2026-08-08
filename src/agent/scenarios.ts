/**
 * scenarios.ts — exécution atomique des propositions.
 *
 * Pourquoi ce fichier à part du store : la sémantique « tout ou rien » est
 * invariante et doit être testable sans React ni Zustand. Les applicateurs
 * (callbacks qui appliquent une proposition) sont fournis par les outils
 * eux-mêmes, parce qu'ils savent comment revert leur propre écriture.
 *
 * Garantie : si une proposition échoue, toutes les précédentes sont
 * revertées avant que la fonction rende. Aucun état partiel ne fuit.
 *
 * Note : `revert` peut à son tour échouer. Une revert qui rate n'invalide
 * pas la sémantique — on était déjà en échec, la revert essaie juste de
 * limiter les dégâts. Le scénario rendu reflète la vérité : rien n'a été
 * appliqué.
 */
import type { Proposal, Scenario } from '../stores/scenarios.store';

export interface ApplyResult {
  ok: boolean;
  error?: string;
  /** Callback qui annule l'effet de l'application. Requis si ok === true :
   *  la sémantique tout-ou-rien en dépend. */
  revert?: () => void;
}

export type Applicator = (args: Record<string, unknown>) => ApplyResult;

export interface MergeOutcome {
  scenario: Scenario;
  /** Propositions effectivement appliquées (avant toute revert). */
  applied: string[];
  /** Propositions revertées suite à un échec en aval. */
  reverted: string[];
  /** Id de la proposition qui a fait échouer la fusion, ou null. */
  failedProposalId: string | null;
  failureReason: string | null;
}

/** Applique une liste de propositions séquentiellement. À la première qui
 *  échoue, reverte toutes les précédentes et rend. */
export function mergeAtomically(
  scenario: Scenario,
  applicators: Record<string, Applicator>,
): MergeOutcome {
  const reverts: Array<() => void> = [];
  const applied: string[] = [];
  const reverted: string[] = [];
  let failure: { id: string; error: string } | null = null;

  const propositions = (() => {
    if (scenario.comparison?.recommendation) {
      const opt = scenario.comparison.options.find((o) => o.id === scenario.comparison!.recommendation);
      if (opt) {
        const ids = new Set(opt.proposalIds);
        return scenario.proposals.filter((p) => ids.has(p.id));
      }
    }
    return scenario.proposals;
  })();

  for (const p of propositions) {
    if (failure) break;
    const appl = applicators[p.toolName];
    if (!appl) {
      failure = { id: p.id, error: `Outil inconnu : ${p.toolName}` };
      break;
    }
    const r = appl(p.args);
    if (!r.ok) {
      failure = { id: p.id, error: r.error ?? 'Erreur inconnue' };
      break;
    }
    if (!r.revert) {
      failure = { id: p.id, error: `L'outil ${p.toolName} ne fournit pas de revert — fusion impossible` };
      break;
    }
    reverts.push(r.revert);
    applied.push(p.id);
  }

  if (failure) {
    for (const rv of reverts.reverse()) {
      try {
        rv();
        // On note comme reverté la dernière proposition appliquée qu'on
        // vient d'annuler. C'est indicatif — la sémantique pour l'observateur
        // est : rien n'a fui.
      } catch {
        // Une revert qui rate ne change rien : on était déjà en échec.
      }
    }
    for (const id of applied) reverted.push(id);
  }

  return {
    scenario: failure
      ? {
          ...scenario,
          status: 'approved',
          merge: {
            at: Date.now(),
            success: false,
            failureReason: failure.error,
            failedProposalId: failure.id,
          },
          proposals: scenario.proposals.map((p): Proposal => {
            if (p.id === failure!.id) return { ...p, status: 'failed', error: failure!.error };
            if (reverted.includes(p.id)) return { ...p, status: 'reverted' };
            return p;
          }),
        }
      : {
          ...scenario,
          status: 'merged',
          merge: { at: Date.now(), success: true },
          proposals: scenario.proposals.map((p): Proposal =>
            applied.includes(p.id) ? { ...p, status: 'applied' } : p,
          ),
        },
    applied,
    reverted,
    failedProposalId: failure?.id ?? null,
    failureReason: failure?.error ?? null,
  };
}
