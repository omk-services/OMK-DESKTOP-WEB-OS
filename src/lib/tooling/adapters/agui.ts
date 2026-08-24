// src/lib/tooling/adapters/agui.ts
// AG-UI — l etat d un agent qui travaille, diffuse a l humain.
//
// DISTINCTION AVEC A2UI, ET ELLE DECIDE DU LIGHTS-OUT
//
// A2UI : l agent COMPOSE une interface.        agent -> composant
// AG-UI : l agent DIT ce qu il est en train de faire.  agent -> humain
//
// Sans AG-UI, le lights-out est aveugle pour l arbitre : l usine tourne, et le
// seul moment ou l humain apprend quelque chose est l echec. Cette surface est
// ce qui distingue « sans operateur » de « sans temoin ».
//
// `in-app.ts` porte l appel direct depuis l interface. Ce fichier porte le flux
// inverse : l interface ecoute.

export type TypeEvenementUI =
  | 'agent.demarre'
  | 'agent.pense'
  | 'outil.appele'
  | 'outil.rendu'
  | 'porte.franchie'
  | 'porte.refusee'
  | 'agent.termine'
  | 'agent.echoue';

export interface EvenementUI {
  type: TypeEvenementUI;
  agent: string;
  domaine: string | null;
  /** Identifiant de l evenement declencheur. Le flux reste causal. */
  cause_par: string | null;
  horodatage: string;
  charge: Record<string, unknown>;
}

/**
 * Serialise en Server-Sent Events.
 *
 * SSE plutot que WebSocket : le flux est unidirectionnel — l agent parle,
 * l humain regarde. Un canal bidirectionnel offrirait une voie de commande que
 * cette surface n a aucune raison d ouvrir.
 */
export function versSSE(e: EvenementUI): string {
  return `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`;
}

export function evenement(
  type: TypeEvenementUI,
  agent: string,
  charge: Record<string, unknown> = {},
  domaine: string | null = null,
  cause_par: string | null = null,
): EvenementUI {
  return { type, agent, domaine, cause_par, horodatage: new Date().toISOString(), charge };
}

/**
 * Filtre ce qui part vers l interface.
 *
 * Un flux qui diffuse tout est un flux que personne ne lit. Par defaut on
 * garde ce qui appelle une decision ou signale une fin ; `agent.pense` est
 * ecarte sauf demande explicite — c est du bruit pour l arbitre, meme si c est
 * rassurant a regarder.
 */
const DECISIFS = new Set<TypeEvenementUI>([
  'porte.refusee', 'agent.echoue', 'agent.termine', 'porte.franchie',
]);

export function filtrer(evts: EvenementUI[], tout = false): EvenementUI[] {
  return tout ? evts : evts.filter((e) => DECISIFS.has(e.type));
}

/** Resume d un flux : ce que l arbitre doit savoir sans tout relire. */
export function resumer(evts: EvenementUI[]): Record<string, unknown> {
  const parType = new Map<string, number>();
  for (const e of evts) parType.set(e.type, (parType.get(e.type) ?? 0) + 1);
  return {
    total: evts.length,
    par_type: Object.fromEntries(parType),
    refus: evts.filter((e) => e.type === 'porte.refusee').map((e) => e.charge),
    echecs: evts.filter((e) => e.type === 'agent.echoue').map((e) => e.charge),
    // Un flux sans evenement decisif est un flux muet, pas un flux sain.
    muet: !evts.some((e) => DECISIFS.has(e.type)),
  };
}
