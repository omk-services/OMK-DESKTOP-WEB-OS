/**
 * scenarios.store.ts — le magasin des scénarios.
 *
 * Modèle : un scénario est un bac à sable persistant où l'agent dépose des
 * propositions de modifications au lieu d'agir directement. Les outils de
 * lecture (lireCollection) continuent de lire les données réelles ; les outils
 * d'écriture (changerTheme et ceux qui viendront) déposent une proposition
 * dans le scénario courant. La navigation (ouvrirApp, allerASection) reste
 * immédiate : c'est un geste d'affichage, pas une écriture de données.
 *
 * Le scénario survit à la fermeture (persist en localStorage). Seule la
 * fusion (atomicExecute) écrit dans les données réelles.
 *
 * Pourquoi un scénario par défaut et pas un nullable :
 *  - l'agent a TOUJOURS un scénario courant où il peut proposer sans déranger
 *    l'utilisateur avec « crée un scénario d'abord » ;
 *  - on ne distingue pas « pas de scénario » et « scénario vide en attente » :
 *    la file d'approbation montre la file, le scénario courant est juste celui
 *    que l'agent remplit.
 *
 * Selector rule : chaque selector expose un scalaire ou une ref stable. Un
 * tableau frais à chaque appel fait boucler React (déjà payé plusieurs fois
 * sur ce projet, voir assistant.store.ts pour le pattern).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Une proposition de modification faite par l'agent.
 *
 *  C'est l'unité atomique : un scénario = un ensemble de propositions.
 *  À la fusion, on les applique une par une ; si l'une échoue, on a déjà
 *  reverté les précédentes — c'est la sémantique tout-ou-rien. */
export interface Proposal {
  id: string;
  /** Nom canonique de l'outil à appeler pour appliquer. */
  toolName: string;
  /** Arguments à passer à l'outil. Sérialisés en JSON, lus à la fusion. */
  args: Record<string, unknown>;
  /** Étiquette humaine : « Thème clair sur l'app Finance ». */
  displayName: string;
  /** État de la proposition. `pending` au dépôt. */
  status: 'pending' | 'applied' | 'reverted' | 'failed';
  /** Raison d'échec si status === 'failed'. Vide sinon. */
  error?: string;
  /** Timestamp (ms epoch). */
  createdAt: number;
}

/** Une option dans une comparaison côte à côte (cf. démo Palantir).
 *
 *  Quand l'agent hésite entre plusieurs voies, il range chaque voie dans une
 *  option. Une seule option sera la voie finale retenue pour la fusion —
 *  les autres options restent dans le scénario comme des « voies non
 *  retenues », consultables mais non fusionnées. */
export interface ComparisonOption {
  id: string;
  label: string;
  /** Phrase qui distingue cette voie des autres. */
  rationale: string;
  /** Métriques comparatives (« 3 déplacements de moins »). */
  metrics: Array<{ label: string; value: string }>;
  /** Propositions attachées à cette option. */
  proposalIds: string[];
}

/** Comparaison multi-voies, posée par l'agent quand il hésite. */
export interface Comparison {
  options: ComparisonOption[];
  /** Option recommandée par l'agent (id dans options). */
  recommendation?: string;
}

export type ScenarioStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'merged';

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  status: ScenarioStatus;
  proposals: Proposal[];
  /** Comparaison posée par l'agent, optionnelle. */
  comparison?: Comparison;
  /** Qui a créé ce scénario ('agent:<id>' ou 'human'). */
  createdBy: string;
  /** Note libre de l'agent : pourquoi cette proposition. */
  rationale?: string;
  /** Résultat de la fusion, si tenté. */
  merge?: {
    /** ISO ms. */
    at: number;
    /** Toutes les propositions sont passées. */
    success: boolean;
    /** Première erreur rencontrée (si !success). */
    failureReason?: string;
    /** Id de proposition qui a fait échouer la fusion. */
    failedProposalId?: string;
  };
  createdAt: number;
  updatedAt: number;
}

interface ScenariosState {
  /** Tous les scénarios, par id. */
  scenarios: Record<string, Scenario>;
  /** Ordre d'affichage (le plus récent d'abord). */
  scenarioOrder: string[];
  /** Le scénario dans lequel l'agent dépose ses propositions actuellement.
   *  S'il est null, l'agent en crée un nouveau (auto) à la première
   *  proposition. */
  currentScenarioId: string | null;

  /** Crée un scénario vide, le pose comme courant. */
  createScenario: (init: { name: string; description?: string; createdBy?: string; rationale?: string }) => Scenario;
  /** Détruit un scénario. */
  deleteScenario: (id: string) => void;
  /** Renomme un scénario. */
  renameScenario: (id: string, name: string) => void;
  /** Pose le scénario courant (celui dans lequel l'agent dépose). */
  setCurrentScenario: (id: string | null) => void;

  /** Dépose une proposition dans le scénario courant (en crée un si besoin).
   *  Retourne l'id du scénario courant et l'id de la proposition. */
  addProposal: (init: { toolName: string; args: Record<string, unknown>; displayName: string; rationale?: string }) => { scenarioId: string; proposalId: string };
  /** Retire une proposition. */
  removeProposal: (scenarioId: string, proposalId: string) => void;
  /** Édite les arguments d'une proposition (avant fusion seulement). */
  editProposal: (scenarioId: string, proposalId: string, args: Record<string, unknown>, displayName?: string) => void;

  /** Pose une comparaison multi-voies. */
  setComparison: (scenarioId: string, comparison: Comparison) => void;

  /** Soumet à l'approbation : draft → pending. */
  submitForApproval: (scenarioId: string) => void;
  /** Rejette un scénario en attente. */
  rejectScenario: (scenarioId: string) => void;

  /** Fusionne atomiquement les propositions retenues.
   *  Appelle les callbacks `applicateurs` pour chaque proposition retenue ;
   *  applique d'abord (test), puis commit. Si une étape échoue, on reverte
   *  toutes les précédentes et le scénario passe en `approved` avec
   *  `merge.success = false`. Voir agent/scenarios.ts pour la sémantique. */
  approveAndMerge: (
    scenarioId: string,
    applicateurs: Record<string, (args: Record<string, unknown>) => { ok: boolean; error?: string; revert?: () => void }>,
  ) => Scenario;

  /** Sélecteur scalaire : compte des scénarios en attente. */
  pendingCount: () => number;
}

function emptyScenario(name: string, createdBy: string, description?: string, rationale?: string): Scenario {
  const now = Date.now();
  return {
    id: `scn_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    description,
    status: 'draft',
    proposals: [],
    createdBy,
    rationale,
    createdAt: now,
    updatedAt: now,
  };
}

export const useScenariosStore = create<ScenariosState>()(
  persist(
    (set, get) => ({
      scenarios: {},
      scenarioOrder: [],
      currentScenarioId: null,

      createScenario: ({ name, description, createdBy = 'human', rationale }) => {
        const sc = emptyScenario(name, createdBy, description, rationale);
        set((s) => ({
          scenarios: { ...s.scenarios, [sc.id]: sc },
          scenarioOrder: [sc.id, ...s.scenarioOrder],
          currentScenarioId: sc.id,
        }));
        return sc;
      },

      deleteScenario: (id) => set((s) => {
        const { [id]: _, ...rest } = s.scenarios;
        return {
          scenarios: rest,
          scenarioOrder: s.scenarioOrder.filter((x) => x !== id),
          currentScenarioId: s.currentScenarioId === id ? null : s.currentScenarioId,
        };
      }),

      renameScenario: (id, name) => set((s) => {
        const sc = s.scenarios[id];
        if (!sc) return {};
        return {
          scenarios: { ...s.scenarios, [id]: { ...sc, name, updatedAt: Date.now() } },
        };
      }),

      setCurrentScenario: (id) => set({ currentScenarioId: id }),

      addProposal: ({ toolName, args, displayName, rationale }) => {
        // On détermine l'id du scénario cible : courant si draft, sinon on
        // en crée un nouveau. TypeScript ne suit pas le narrowing à travers
        // un set() asynchrone — on extrait la valeur dans une variable locale.
        const currentId = get().currentScenarioId;
        const currentSc = currentId ? get().scenarios[currentId] : undefined;
        let finalId: string;
        if (currentSc && currentSc.status === 'draft') {
          finalId = currentSc.id;
        } else {
          const newSc = emptyScenario(`Scénario ${new Date().toLocaleString()}`, 'agent:auto', undefined, rationale);
          finalId = newSc.id;
          set((s) => ({
            scenarios: { ...s.scenarios, [newSc.id]: newSc },
            scenarioOrder: [newSc.id, ...s.scenarioOrder],
            currentScenarioId: newSc.id,
          }));
        }
        const proposal: Proposal = {
          id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          toolName,
          args,
          displayName,
          status: 'pending',
          createdAt: Date.now(),
        };
        set((s) => {
          const cur = s.scenarios[finalId];
          if (!cur) return {};
          const next: Scenario = {
            ...cur,
            proposals: [...cur.proposals, proposal],
            updatedAt: Date.now(),
          };
          return {
            scenarios: { ...s.scenarios, [finalId]: next },
          };
        });
        return { scenarioId: finalId, proposalId: proposal.id };
      },

      removeProposal: (scenarioId, proposalId) => set((s) => {
        const sc = s.scenarios[scenarioId];
        if (!sc) return {};
        return {
          scenarios: {
            ...s.scenarios,
            [scenarioId]: {
              ...sc,
              proposals: sc.proposals.filter((p) => p.id !== proposalId),
              updatedAt: Date.now(),
            },
          },
        };
      }),

      editProposal: (scenarioId, proposalId, args, displayName) => set((s) => {
        const sc = s.scenarios[scenarioId];
        if (!sc) return {};
        return {
          scenarios: {
            ...s.scenarios,
            [scenarioId]: {
              ...sc,
              proposals: sc.proposals.map((p) =>
                p.id !== proposalId
                  ? p
                  : { ...p, args, displayName: displayName ?? p.displayName, updatedAt: Date.now() } as Proposal
              ),
              updatedAt: Date.now(),
            },
          },
        };
      }),

      setComparison: (scenarioId, comparison) => set((s) => {
        const sc = s.scenarios[scenarioId];
        if (!sc) return {};
        return {
          scenarios: {
            ...s.scenarios,
            [scenarioId]: { ...sc, comparison, updatedAt: Date.now() },
          },
        };
      }),

      submitForApproval: (scenarioId) => set((s) => {
        const sc = s.scenarios[scenarioId];
        if (!sc) return {};
        return {
          scenarios: {
            ...s.scenarios,
            [scenarioId]: { ...sc, status: 'pending', updatedAt: Date.now() },
          },
        };
      }),

      rejectScenario: (scenarioId) => set((s) => {
        const sc = s.scenarios[scenarioId];
        if (!sc) return {};
        return {
          scenarios: {
            ...s.scenarios,
            [scenarioId]: { ...sc, status: 'rejected', updatedAt: Date.now() },
          },
        };
      }),

      approveAndMerge: (scenarioId, applicateurs) => {
        const before = get().scenarios[scenarioId];
        if (!before) return before as unknown as Scenario;

        // Détermine la liste de propositions à fusionner.
        // Si une comparaison a une recommandation, on ne garde que les
        // propositions des options non-recommandées qui NE SONT PAS dans
        // l'option recommandée, et TOUTES celles de l'option recommandée.
        // Si pas de comparaison, on garde toutes les propositions.
        let toMerge = before.proposals;
        if (before.comparison?.recommendation) {
          const recOption = before.comparison.options.find(
            (o) => o.id === before.comparison!.recommendation,
          );
          if (recOption) {
            const recIds = new Set(recOption.proposalIds);
            toMerge = before.proposals.filter((p) => recIds.has(p.id));
          }
        }

        const reverts: Array<() => void> = [];
        const updated: Proposal[] = [];
        let failure: { id: string; error: string } | null = null;

        for (const p of toMerge) {
          if (failure) {
            updated.push({ ...p, status: 'pending' });
            continue;
          }
          const appl = applicateurs[p.toolName];
          if (!appl) {
            failure = { id: p.id, error: `Outil inconnu : ${p.toolName}` };
            updated.push({ ...p, status: 'failed', error: failure.error });
            continue;
          }
          const r = appl(p.args);
          if (!r.ok) {
            failure = { id: p.id, error: r.error ?? 'Erreur inconnue' };
            updated.push({ ...p, status: 'failed', error: failure.error });
            continue;
          }
          if (r.revert) reverts.push(r.revert);
          updated.push({ ...p, status: 'applied' });
        }

        // Si on a une failure, on revert TOUT ce qui a déjà été appliqué.
        if (failure) {
          for (const rv of reverts.reverse()) {
            try { rv(); } catch { /* une revert qui échoue n'invalide pas la sémantique tout-ou-rien : on a déjà échoué */ }
          }
          // Et on remet toutes les propositions à pending — aucune n'est appliquée.
          for (const u of updated) {
            if (u.status === 'applied') {
              const idx = updated.findIndex((x) => x.id === u.id);
              updated[idx] = { ...u, status: 'reverted' };
            }
          }
        }

        const mergeRec = failure
          ? { at: Date.now(), success: false, failureReason: failure.error, failedProposalId: failure.id }
          : { at: Date.now(), success: true };

        const next: Scenario = {
          ...before,
          proposals: before.proposals.map((p) => updated.find((u) => u.id === p.id) ?? p),
          status: failure ? 'approved' : 'merged',
          merge: mergeRec,
          updatedAt: Date.now(),
        };

        set((s) => ({
          scenarios: { ...s.scenarios, [scenarioId]: next },
          currentScenarioId: s.currentScenarioId === scenarioId ? null : s.currentScenarioId,
        }));

        return next;
      },

      pendingCount: () => {
        const s = get();
        return s.scenarioOrder.filter((id) => s.scenarios[id]?.status === 'pending').length;
      },
    }),
    {
      name: 'coach-os-scenarios-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // La règle des projets : un état persisté est une entrée NON FIABLE.
      // On répare à la lecture plutôt que de croire aveuglément le blob.
      merge: (persiste, courant) => {
        const p = (persiste ?? {}) as Partial<ScenariosState>;
        const scenarios = p.scenarios && typeof p.scenarios === 'object' ? p.scenarios : {};
        const order = Array.isArray(p.scenarioOrder) ? p.scenarioOrder.filter((x) => typeof x === 'string' && x in scenarios) : [];
        return {
          ...courant,
          scenarios,
          scenarioOrder: order,
          currentScenarioId:
            typeof p.currentScenarioId === 'string' && p.currentScenarioId in scenarios
              ? p.currentScenarioId
              : null,
        };
      },
    },
  ),
);

/** DEV-only handle for Playwright capture scripts. */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as { __coachos?: Record<string, unknown> };
  w.__coachos = { ...w.__coachos, scenarios: useScenariosStore };
}
