// api/_agent/roster.ts
// Registre canonique des agents Coach OS.
//
// Douze agents par defaut : les douze squads Multica (cf. export_2026-08-02/
// squads_2026-08-02.json), apparieses 1:1 aux douze sprites du bureau.
//
// Chaque agent declare :
//   - son identifiant canonique (stable, persistant)
//   - son nom affiche (lisible)
//   - sa description courte (montree dans la reglage)
//   - le sprite par defaut qu'on lui attribue
//   - son "dos" par defaut (modele | multica | buzz)
//   - pour le dos multica : l'UUID Multica qu'on lui reserve ; pour buzz :
//     le modele a demander ; pour modele : l'identifiant du fournisseur
//
// Le roster NE CONTIENT aucun secret. Le token Multica est lu cote serveur au
// moment de l'invocation, jamais transmis au navigateur.

import type { BackendId } from './backends.js';

export interface AgentRosterEntry {
  id: string;
  name: string;
  description: string;
  personnageId: string;     // 1 des 12 sprites — voir src/agent/characters.ts
  backend: BackendId;
  /** Pour dos=modele, le provider id a utiliser (defaut: AGENT_PROVIDER). */
  provider?: 'minimax' | 'anthropic' | 'openai' | 'google';
  /** Pour dos=buzz, le modele a demander a buzz-agent. */
  buzzModel?: string;
  /** Pour dos=multica, l'UUID Multica de l'agent reserve. */
  multicaAgentId?: string;
  /** Pour dos=multica, l'UUID Multica du squad. */
  multicaSquadId?: string;
}

/** Douze agents = douze squads Multica, apparies dans l'ordre aux douze
 *  sprites. Le premier agent (Cerritos-HoloDeck) prend Clippy (le defaut
 *  historique), le second (Squad-Orville) prend Links, etc. Si le reglage
 *  utilisateur change, on garde la possibilite d'une attribution differente
 *  par agent — voir `DEFAULT_BACKEND_OVERRIDES`. */
export const ROSTER: AgentRosterEntry[] = [
  { id: 'cerritos-holodeck', name: 'Cerritos-HoloDeck', personnageId: 'clippy', backend: 'modele', provider: 'minimax',
    description: "USS Cerritos = Lower Deck = Holo Deck. Cascade GTD 5 etapes : Capture → Clarify → Organize → Reflect → Engage." },
  { id: 'squad-orville', name: 'Squad-Orville', personnageId: 'links', backend: 'modele', provider: 'minimax',
    description: "USS Orville = A2 Meaning Engine. Ikigai 4 Pillars + 5 Horizons, verdict GO/NO-GO." },
  { id: 'squad-discovery', name: 'Squad-Discovery', personnageId: 'rover', backend: 'modele', provider: 'minimax',
    description: "USS Discovery = A2 Observation Engine. 8 Life Wheel drift detection." },
  { id: 'squad-snw', name: 'Squad-SNW', personnageId: 'merlin', backend: 'modele', provider: 'minimax',
    description: "USS SNW = A2 Execution Engine (Curie). 12WY sprint bridge." },
  { id: 'squad-enterprise', name: 'Squad-Enterprise', personnageId: 'genie', backend: 'modele', provider: 'minimax',
    description: "USS Enterprise = A2 Structure Engine. PARA canonization." },
  { id: 'squad-protostar', name: 'Squad-Protostar', personnageId: 'peedy', backend: 'modele', provider: 'minimax',
    description: "USS Protostar = A2 Liberation Engine. DEAL Define / Eliminate / Automate / Liberate." },
  { id: 'squad-greenlantern', name: 'Squad-GreenLantern-People', personnageId: 'genius', backend: 'modele', provider: 'minimax',
    description: "nanoSquad X-Men sous GreenLantern-People-B2 (LD03 Health/People)." },
  { id: 'jerry-systemize', name: 'Jerry-SYSTEMIZE-Squad', personnageId: 'rocky', backend: 'modele', provider: 'minimax',
    description: "Jerry SYSTEMIZE E-Myth orchestrateur des 8 B2 DC-Hero VPs (V4 Triptyque)." },
  { id: 'kernel-core-13th', name: 'Kernel-Core-13th', personnageId: 'f1', backend: 'modele', provider: 'minimax',
    description: "L0 noyau, infra, harness (13e Docteur : Yaz, Ryan, Graham)." },
  { id: 'life-core-11th', name: 'Life-Core-11th', personnageId: 'officelogo', backend: 'modele', provider: 'minimax',
    description: "L1 vie OS, logbook, santé (11e Docteur : Amy, Rory, River)." },
  { id: 'buzz-core-12th', name: 'Buzz-Core-12th', personnageId: 'saeko', backend: 'buzz', buzzModel: 'claude-haiku-4-5-20251001',
    description: "L2 buzz, business OS (12e Docteur : Clara, Nardole, Bill). Branche Buzz locale." },
  { id: 'dlq-rick', name: 'DLQ-Rick', personnageId: 'monkeyking', backend: 'modele', provider: 'minimax',
    description: "DLQ Rick — entrepreneur, dispatch DLQ critique vers les Doctors." },
  // Pour tester rapidement le dos multica, on pre-rattache deux squads a
  // un agent Multica reel (A3-Bortus). En production, l'attribution Multica
  // est faite par l'utilisateur dans le reglage — ce branchement permet
  // juste de verifier le canal. L'UUID est public (champ d'un agent) ; il
  // n'est pas un secret.
  { id: 'a3-bortus-multica', name: 'A3-Bortus (multica)', personnageId: 'f1', backend: 'multica',
    multicaAgentId: '1f7cf1dd-e9af-4353-882f-f29fdd2b8264',
    description: "Canal multica de test : delegue a l'agent A3-Bortus via `multica issue create`." },
];

export function getAgent(id: string): AgentRosterEntry | undefined {
  return ROSTER.find((a) => a.id === id);
}

export function listAgents(): AgentRosterEntry[] {
  return ROSTER;
}