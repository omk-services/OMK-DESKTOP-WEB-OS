// src/lib/audit/event.ts
// Types de l'audit log (campagne 2026-08-15, phase 4).
//
// Le contrat :
//   - Un AuditAction est un verbe.suffixe. Le suffixe (create/update/
//     delete/approve/etc.) sert à grouper ; le préfixe (item/proposal/
//     auth/member/workspace/quota/observer) sert à filtrer.
//   - actor_id peut être NULL : un event Observer vient de l'extérieur,
//     pas d'un humain (cf. ingest.ts).
//   - observer_source reste NULL pour les events internes. Il pointe
//     vers l'un des Observers listés dans le REGISTRY pour les events
//     ingérés depuis l'extérieur.

/** Actions métier couvertes par l'audit. Le tableau est fermé :
 *  ajouter une action = ajouter un cas dans la matrice d'observabilité.
 *  Pour les events générés par un Observer externe, l'action est
 *  'observer.event' et la nature réelle est portée par metadata.kind. */
export type AuditAction =
  // Items / collections
  | 'item.create' | 'item.update' | 'item.delete'
  // Proposals
  | 'proposal.create' | 'proposal.approve' | 'proposal.reject'
  // Auth
  | 'auth.signin' | 'auth.signup' | 'auth.signout'
  // Memberships
  | 'member.invite' | 'member.accept' | 'member.revoke' | 'member.role_change'
  // Workspace (branches / PRs)
  | 'workspace.branch_create' | 'workspace.merge'
  | 'workspace.pr_open' | 'workspace.pr_review' | 'workspace.pr_merge'
  // Quota
  | 'quota.exceeded'
  // Observer externe (NOUVEAU 2026-08-15)
  | 'observer.event';

/** Sources d'ingestion externes. Le REGISTRY des Observers peut être
 *  étendu ; cette union EST le miroir TypeScript de ce REGISTRY.
 *  Si un nouvel Observer est ajouté au REGISTRY sans être listé ici,
 *  TypeScript refusera l'ingest — c'est l'invariant. */
export type ObserverSource =
  | 'opik'
  | 'agentpulse'
  | 'agents-observe'
  | 'agent-super-spy'
  | 'langsmith'
  | 'phoenix'
  | 'pocketbase-vec'
  | 'sssf'
  | 'aios'
  | 'posthog'
  | 'external';

/** Forme normalisée d'un event à passer à appendEvent. Le `tenantId`
 *  est obligatoire : la cloison est l'alpha et l'oméga. */
export interface EventRecord {
  tenantId: string;
  actorId: string | null;
  actorRole: string | null;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  /** Présent et non-null = event ingéré depuis un Observer externe. */
  observerSource?: ObserverSource;
  /** IP de l'auteur (utile en REST, ignoré côté serveur MCP). */
  ipAddress?: string | null;
  /** User-Agent (idem). */
  userAgent?: string | null;
}

/** Métadonnée d'observabilité portée par chaque event : permet de
 *  rejouer une session, débugger une boucle d'agent, ou corréler avec
 *  un dashboard Observer. Jamais de secret ici : cf. règle de
 *  sanitisation dans logger.ts. */
export interface AuditMetadata {
  /** Identifiant de corrélation (idem côté Observer / coach-os). */
  correlationId?: string;
  /** Catégorie Observer (opik trace / agentpulse heartbeat / etc.). */
  kind?: string;
  /** Toute information jugée non sensible par l'appelant. */
  [key: string]: unknown;
}