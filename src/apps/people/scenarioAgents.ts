/**
 * scenarioAgents.ts — map scenarioId → agent code (e.g. "A-00" or "PA-01").
 *
 * Pourquoi un module separe : la definition de Scenario (dans
 * src/stores/scenarios.store.ts, hors perimetre) n'a pas de champ
 * `agentId`. On ne peut pas modifier le store. A la place on tient
 * une correspondance cote People, dans la memoire du module, qui
 * survit aux rendus de l'app mais pas au reload. C'est explicite,
 * type, et visible — ce n'est pas une convention de nommage cachee
 * dans un champ existant.
 *
 * Persistance : la table est miroiree dans `localStorage` (cle
 * `coach-os:scenario-agents:v1`) pour survivre a un rechargement.
 * Avant la correction de DETTE 2, l'utilisateur creait un scenario
 * rattache a un agent, rechargeait la page, et le rattachement
 * disparaissait avec l'etat du module.
 *
 * Pourquoi cette liaison existe : un scenario vide cree depuis la page
 * Approvals n'a pas de contexte ; un scenario cree depuis la fiche
 * d'un agent doit porter cette liaison pour qu'on puisse remonter.
 */

const STORAGE_KEY = 'coach-os:scenario-agents:v1';

function loadLinks(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    // Mode prive, quota plein, JSON corrompu — retomber sur un objet vide,
    // jamais planter l'app. La page Approvals rebuildra les liens au fil
    // de l'eau si elle les garde ailleurs.
    return {};
  }
}

function saveLinks(links: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Storage quota ou mode prive : degradation silencieuse vers la
    // memoire du module. Le scenario reste lie jusqu'au prochain reload,
    // puis disparait — comportement documente dans la campagne.
  }
}

// Rehydratation au chargement du module : on lit localStorage une fois
// (avant la premiere ecriture). Toutes les mutations passent ensuite
// par les fonctions exportees, qui ecrivent aussi dans le stockage.
const links: Record<string, string> = loadLinks();

export function linkScenarioToAgent(scenarioId: string, agentCode: string): void {
  links[scenarioId] = agentCode;
  saveLinks(links);
}

export function unlinkScenario(scenarioId: string): void {
  delete links[scenarioId];
  saveLinks(links);
}

export function getAgentCodeForScenario(scenarioId: string): string | undefined {
  return links[scenarioId];
}

/** Return all scenario ids linked to a given agent code. */
export function getScenariosForAgent(agentCode: string): string[] {
  return Object.entries(links)
    .filter(([, code]) => code === agentCode)
    .map(([id]) => id);
}

/** Forget every link — called when the People app is unloaded to avoid leaks. */
export function clearScenarioAgentLinks(): void {
  for (const k of Object.keys(links)) delete links[k];
  saveLinks(links);
}