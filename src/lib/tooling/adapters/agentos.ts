// src/lib/tooling/adapters/agentos.ts
// AgentOS — pile d execution pour agents a longue duree de vie.
//
// LA QUESTION A LAQUELLE IL REPOND, ET AUCUN AUTRE
//
// Les autres protocoles decrivent un APPEL. AgentOS decrit un PROCESSUS : un
// agent qui vit des jours, qu il faut ordonnancer, brider, isoler et redemarrer.
//
// C est le vocabulaire dont le lights-out a besoin. Un agent qui tourne en
// continu sans etranglement de debit ni gestion de dependance ne tient pas une
// nuit — et c est exactement le mode d echec mesure sur CEO-Bench, ou la
// plupart des agents font faillite avant la fin de la simulation.

export interface Ressources {
  /** Plafond de jetons par fenetre. L absence de plafond est un plafond infini. */
  jetons_par_heure: number;
  /** Appels simultanes. Brider en amont coute moins qu un 429 en aval. */
  concurrence: number;
  memoire_mo: number;
}

export interface ProcessusAgent {
  id: string;
  domaine: string;
  /** Dependances : demarrees avant, arretees apres. */
  depend_de: string[];
  ressources: Ressources;
  /** Politique de reprise. `jamais` est un choix legitime pour une tache a effet durable. */
  redemarrage: 'toujours' | 'sur_echec' | 'jamais';
  etat: 'arrete' | 'demarrage' | 'vivant' | 'bride' | 'echoue';
}

/**
 * Plafonds par defaut, derives de mesures locales et non de convenance :
 * l empilement de lancements a deja epuise le commit Windows
 * (`MEM_COMMIT failed`), et deux agents simultanes sur une meme voie gratuite
 * rendent 429 tous les deux.
 */
export const RESSOURCES_DEFAUT: Ressources = {
  jetons_par_heure: 2_000_000,
  concurrence: 2,
  memoire_mo: 512,
};

/**
 * Ordre de demarrage par tri topologique.
 * Un cycle est refuse explicitement : demarrer dans un ordre arbitraire donne
 * une panne intermittente, la pire a diagnostiquer.
 */
export function ordreDemarrage(procs: ProcessusAgent[]): { ok: boolean; ordre?: string[]; cycle?: string[] } {
  const restants = new Map(procs.map((p) => [p.id, new Set(p.depend_de)]));
  const ordre: string[] = [];
  while (restants.size) {
    const prets = [...restants.entries()].filter(([, d]) => [...d].every((x) => ordre.includes(x)));
    if (!prets.length) return { ok: false, cycle: [...restants.keys()] };
    for (const [id] of prets) {
      ordre.push(id);
      restants.delete(id);
    }
  }
  return { ok: true, ordre };
}

/** Doit-on brider ? Repondre avant l appel, pas apres le refus. */
export function doitBrider(p: ProcessusAgent, jetonsConsommes: number, enVol: number): { brider: boolean; motif: string } {
  if (jetonsConsommes >= p.ressources.jetons_par_heure)
    return { brider: true, motif: `plafond de jetons atteint (${jetonsConsommes}/${p.ressources.jetons_par_heure})` };
  if (enVol >= p.ressources.concurrence)
    return { brider: true, motif: `concurrence saturee (${enVol}/${p.ressources.concurrence})` };
  return { brider: false, motif: 'sous les plafonds' };
}

/**
 * Recul exponentiel avec alea.
 * Sans l alea, deux reprises retombent en phase et frappent la meme seconde :
 * c est ce qui transforme un 429 isole en panne generale.
 */
export function recul(tentative: number, baseMs = 45_000, alea = () => Math.random()): number {
  return Math.round(baseMs * 2 ** (tentative - 1) + alea() * 30_000);
}
