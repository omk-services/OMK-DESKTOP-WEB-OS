/**
 * Table des relations typées entre les 12 entites.
 *
 * Verbe obligatoire (forme imperative ou nominale courte) et cardinalite
 * obligatoire parmi `'1-1' | '1-n' | 'n-n'`. Toute relation dont `source`
 * ou `target` ne pointe pas vers une entite existante de `entities.ts`
 * fait echouer la suite vitest en nommant l'identifiant fautif.
 *
 * Ce module n'est pas importe directement par les apps — il vit derriere
 * la fermeture d'`index.ts`.
 */

import type { EntityId } from './entities';

export type Cardinality = '1-1' | '1-n' | 'n-n';

export interface Relation {
  id: string;
  source: EntityId;
  target: EntityId;
  verb: string;
  cardinality: Cardinality;
}

export const RELATIONS: readonly Relation[] = [
  // Organization portee racine : 1-n sur tout ce qui est lie au locataire
  { id: 'org-has-memberships', source: 'Organization', target: 'Membership', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-clients', source: 'Organization', target: 'Client', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-offerings', source: 'Organization', target: 'Offering', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-sops', source: 'Organization', target: 'SOP', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-runbooks', source: 'Organization', target: 'Runbook', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-agents', source: 'Organization', target: 'Agent', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-routines', source: 'Organization', target: 'Routine', verb: 'has', cardinality: '1-n' },
  { id: 'org-has-incidents', source: 'Organization', target: 'Incident', verb: 'has', cardinality: '1-n' },

  // Membership : un profil peut etre membre de plusieurs orgs, un membre gere plusieurs clients
  { id: 'profile-binds-memberships', source: 'Profile', target: 'Membership', verb: 'binds', cardinality: '1-n' },
  { id: 'membership-manages-clients', source: 'Membership', target: 'Client', verb: 'manages', cardinality: '1-n' },

  // Agent : pivot operationnel, relie aux Runbooks, Routines, Skills, Incidents, Personas
  { id: 'agent-executes-runbooks', source: 'Agent', target: 'Runbook', verb: 'executes', cardinality: 'n-n' },
  { id: 'agent-runs-routines', source: 'Agent', target: 'Routine', verb: 'runs', cardinality: 'n-n' },
  { id: 'agent-acquires-skills', source: 'Agent', target: 'Skill', verb: 'acquires', cardinality: 'n-n' },
  { id: 'agent-incarnates-personas', source: 'Agent', target: 'Persona', verb: 'incarnates', cardinality: 'n-n' },

  // Persona : profil synthetique qui projette des Skills
  { id: 'persona-projects-skills', source: 'Persona', target: 'Skill', verb: 'projects', cardinality: 'n-n' },

  // SOP : procedure de reference, guide les Runbooks, requiert des Skills
  { id: 'sop-guides-runbooks', source: 'SOP', target: 'Runbook', verb: 'guides', cardinality: '1-n' },
  { id: 'sop-requires-skills', source: 'SOP', target: 'Skill', verb: 'requires', cardinality: 'n-n' },

  // Incident : evenement qui peut etre mitige par un Runbook, declenche par une Routine
  { id: 'runbook-mitigates-incidents', source: 'Runbook', target: 'Incident', verb: 'mitigates', cardinality: 'n-n' },
  { id: 'routine-triggers-incidents', source: 'Routine', target: 'Incident', verb: 'triggers', cardinality: '1-n' },

  // Client : consomme les Offerings cataloguees
  { id: 'client-engages-offerings', source: 'Client', target: 'Offering', verb: 'engages', cardinality: 'n-n' },
];
