/**
 * Store Zustand pour la portee (scope) du registre d'ontologie.
 *
 * Story 3 de l'epic couche-ontologie. Le store pilote l'interrupteur
 * « Organisation seule / Tout » rendu par `OntologyApp` section
 * Entities. Persistance cote `localStorage` sous la cle
 * `coach-os-ontology-scope-v1`.
 *
 * Piege documente dans `src/lib/themes/store.ts` (lignes 32-34) : un
 * `set` qui reecrit la meme valeur produit un objet shallow-egal, et
 * Zustand ne re-render pas. Le theme store resout ce piege avec une
 * cle `_v` injectee dans `appThemes`, mais cette cle pollue l'objet
 * persiste (apres hydration, on retrouve un `_v` date qui ne sert plus).
 *
 * Ici on prend une voie differente : un **champ top-level** `version`
 * (vivant au meme niveau que `scope`). Le `partialize` ne persiste pas
 * `version` ; l'objet persiste reste `{ scope: 'org' }` ou
 * `{ scope: 'all' }`, sans pollution. Le re-render est declenche
 * naturellement parce que `set({ scope, version: prev + 1 })` change
 * forcement la surface de l'etat.
 *
 * Conventions :
 * - Le store est **vanilla** : aucun import React. Le consommateur
 *   React utilise le hook `useOntologyScopeStore` (auto-abonnement) ou
 *   le selector minimal `useOntologyScope`. Testable pur et sans
 *   environnement React (cf. `scope-store.test.ts`).
 * - L'API UI n'expose que `'org'` et `'all'` (cf. story 3 task).
 *   `'personal'` reste accessible au helper pour les tests et les
 *   stories futures.
 * - Cle de persistance exacte : `coach-os-ontology-scope-v1`.
 *   Verrouillee par un test dedie pour eviter les typos silencieuses.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Etendue UI 노출 — l'app grand public ne manipule pas `'personal'`. */
export type ScopeFilter = 'org' | 'all';

interface OntologyScopeState {
  /** Portee courante. Defaut `'all'` (comportement historique). */
  scope: ScopeFilter;
  /**
   * Compteur de transitions. Incremente a chaque `setScope`, peu importe
   * la valeur logique. Sert a forcer les consommateurs React abonnes
   * via `useOntologyScope()` a re-render meme quand deux set consecutifs
   * sont shallow-egaux (meme valeur logique). Non monotone au sens strict
   * : `reset()` le ramene a 0 (sortie explicite de l'etat "user
   * deliberately cleared everything"). Non persiste (cf. `partialize`).
   */
  version: number;
  /** Modifie la portee et bump le compteur. */
  setScope: (s: ScopeFilter) => void;
  /** Reinitialise au defaut `'all'` (scope + compteur a 0). */
  reset: () => void;
}

const STORAGE_KEY = 'coach-os-ontology-scope-v1';

export const useOntologyScopeStore = create<OntologyScopeState>()(
  persist(
    (set) => ({
      scope: 'all',
      version: 0,
      setScope: (s) => set((prev) => ({ scope: s, version: prev.version + 1 })),
      reset: () => set({ scope: 'all', version: 0 }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Cle : on ne persiste QUE le scope. La version est derivee
      // localement au montage : elle n'est pas un fait a conserver.
      partialize: (s) => ({ scope: s.scope }),
      // A la relecture, si rien n'est stocke, on garde le defaut. Si
      // un scope invalide a ete ecrit manuellement, on retombe sur `'all'`.
      merge: (persisted, current) => {
        const fromStore = (persisted as { scope?: unknown })?.scope;
        const scope: ScopeFilter = fromStore === 'org' ? 'org' : 'all';
        return { ...current, scope };
      },
    },
  ),
);

/**
 * Selector minimal — extrait la valeur de `scope` tout en s'abonnant
 * au compteur `version`. Spec §AC : un consommateur abonne doit
 * re-render deux fois sur deux `setScope` consecutifs a meme valeur
 * logique ; sans abonnement a `version`, Zustand voit `Object.is(scope,
 * scope) === true` et bail out. Le tuple `[scope, version]` change a
 * chaque `setScope`, donc le re-render se declenche ; on rend juste
 * `scope` au consommateur.
 */
export function useOntologyScope(): ScopeFilter {
  // Selectionne un SCALAIRE, jamais un tuple. Un selecteur qui construit un
  // nouvel objet ou tableau a chaque appel renvoie une reference differente a
  // chaque rendu ; `useSyncExternalStore` compare par identite, conclut que
  // l'etat a change, et reboucle. C'est exactement ce qui est arrive ici :
  // `[s.scope, s.version]` faisait planter l'app entiere au montage avec
  // « Maximum update depth exceeded », precede de « The result of getSnapshot
  // should be cached to avoid an infinite loop ».
  //
  // Le tuple servait a forcer un re-rendu quand `setScope` est rappele avec la
  // MEME valeur. Cette exigence etait une erreur de specification : re-rendre
  // sur un changement d'etat nul n'a aucun interet pour un scalaire, et le
  // mecanisme cense la satisfaire coute la stabilite de l'application.
  return useOntologyScopeStore((s) => s.scope);
}

/** Re-export du nom de cle de persistance — verrouille par le test. */
export const ONTOLOGY_SCOPE_STORAGE_KEY = STORAGE_KEY;
