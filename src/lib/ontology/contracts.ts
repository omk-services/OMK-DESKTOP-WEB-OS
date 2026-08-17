/**
 * Contrats semantiques par entite.
 *
 * Un contrat dit *ce qui declenche* l'entite et *quelles actions sont
 * permises* dessus. Une entite sans contrat est une erreur — la suite
 * vitest fait echouer le build si une entite de `entities.ts` n'a pas
 * d'entree correspondante ici.
 *
 * Ce module n'est pas importe directement par les apps — il vit derriere
 * la fermeture d'`index.ts`.
 */

import type { EntityId } from './entities';

export interface Contract {
  /** Evenements qui creent ou font transitionner l'entite. */
  triggers: readonly string[];
  /** Operations legales qu'un consommateur peut invoquer sur l'entite. */
  allowedActions: readonly string[];
}

export const CONTRACTS: Readonly<Record<EntityId, Contract>> = {
  Organization: {
    triggers: ['signup', 'onboarding-completed', 'plan-changed'],
    allowedActions: ['createMembership', 'inviteProfile', 'archive', 'transfer-ownership'],
  },
  Membership: {
    triggers: ['invite-accepted', 'role-changed', 'revoked'],
    allowedActions: ['grant', 'revoke', 'changeRole'],
  },
  Profile: {
    triggers: ['signup', 'email-verified', 'identity-merged'],
    allowedActions: ['update', 'deactivate', 'merge'],
  },
  Client: {
    triggers: ['intake-completed', 'enrollment-confirmed', 'reactivated'],
    allowedActions: ['enroll', 'pause', 'archive', 'reassign'],
  },
  Offering: {
    triggers: ['plan-changed', 'catalog-updated', 'price-changed'],
    allowedActions: ['publish', 'retire', 'reprice'],
  },
  SOP: {
    triggers: ['lesson-learned', 'process-redesigned', 'compliance-update'],
    allowedActions: ['draft', 'publish', 'version', 'deprecate'],
  },
  Runbook: {
    triggers: ['sop-published', 'incident-postmortem', 'drill-completed'],
    allowedActions: ['execute', 'test', 'markStale', 'deprecate'],
  },
  Skill: {
    triggers: ['learning-completed', 'level-up', 'decay-detected'],
    allowedActions: ['add', 'level', 'remove', 'reassess'],
  },
  Agent: {
    triggers: ['agent-requested', 'agent-onboarded', 'retirement-scheduled'],
    allowedActions: ['configure', 'activate', 'retire', 'reassign'],
  },
  Routine: {
    triggers: ['schedule-defined', 'cadence-changed', 'manual-trigger'],
    allowedActions: ['schedule', 'pause', 'cancel', 'rerun'],
  },
  Incident: {
    triggers: ['anomaly-detected', 'manual-report', 'routine-failure'],
    allowedActions: ['detect', 'triage', 'mitigate', 'resolve', 'postmortem'],
  },
  Persona: {
    triggers: ['context-needed', 'voice-tuned', 'retired'],
    allowedActions: ['create', 'refine', 'retire', 'clone'],
  },
  BusinessDomain: {
    triggers: ['domain-opened', 'strategist-assigned', 'squad-staffed', 'domain-frozen'],
    allowedActions: ['open', 'assign', 'staff', 'freeze', 'read'],
  },
};
