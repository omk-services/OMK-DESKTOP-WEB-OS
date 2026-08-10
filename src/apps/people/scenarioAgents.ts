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
 * Pourquoi cette liaison existe : un scenario vide cree depuis la page
 * Approvals n'a pas de contexte ; un scenario cree depuis la fiche
 * d'un agent doit porter cette liaison pour qu'on puisse remonter.
 */

const links: Record<string, string> = {};

export function linkScenarioToAgent(scenarioId: string, agentCode: string): void {
  links[scenarioId] = agentCode;
}

export function unlinkScenario(scenarioId: string): void {
  delete links[scenarioId];
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
}