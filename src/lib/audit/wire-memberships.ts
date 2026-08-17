// src/lib/audit/wire-memberships.ts
// Pont entre audit et memberships.
//
// Le brief MEMBERSHIPS crée `src/lib/auth/memberships.ts` en parallèle.
// Ce module déclare l'interface attendue et fournit un stub qui ne
// lève PAS — tant que le fichier memberships.ts n'existe pas, les
// events d'invitation ne sont tout simplement pas émis. C'est le
// comportement attendu du brief AUDIT_LOG : un audit qui casse l'app
// est pire qu'un audit qui perd un event.
//
// TODO MEMBERSHIPS — quand src/lib/auth/memberships.ts arrive :
//   1. Définir `MembershipAction = 'invite' | 'accept' | 'revoke' | 'role_change'`.
//   2. Importer `invite`, `accept`, `revoke`, `changeRole` depuis
//      '../auth/memberships'.
//   3. Pour chaque fonction, appeler `appendEvent(...)` avec l'action
//      correspondante — voir la matrice plus bas.
//   4. NE PAS throw si appendEvent échoue : il est no-throw.
//   5. Ajouter les tests #7 (member_invite_genere_event) à
//      src/lib/auth/memberships.test.ts (le test vivra avec le fichier
//      source).

import { appendEvent } from './logger';

export type MembershipAction = 'invite' | 'accept' | 'revoke' | 'role_change';

/** Stub no-op : tant que memberships.ts n'existe pas, ce wrapper ne
 *  fait rien. Quand le brief MEMBERSHIPS sera livré, on remplacera
 *  l'implémentation par un re-export réel. */
export function recordMembershipEvent(opts: {
  tenantId: string;
  actorId: string;
  targetUserId: string;
  action: MembershipAction;
  metadata?: Record<string, unknown>;
}): void {
  // TODO: relier à appendEvent() une fois src/lib/auth/memberships.ts livré.
  // Le contrat cible :
  //   action = 'invite'        → AuditAction 'member.invite'
  //   action = 'accept'        → AuditAction 'member.accept'
  //   action = 'revoke'        → AuditAction 'member.revoke'
  //   action = 'role_change'   → AuditAction 'member.role_change'
  //   targetType = 'membership', targetId = targetUserId
  //
  // Pour l'instant, on NE TENTE PAS l'import dynamique de
  // '../auth/memberships' : si le fichier n'existe pas, un import
  // dynamique ferait planter l'audit (cf. règle #1 du GARDE-FOU :
  // appendEvent ne lève JAMAIS). On attend le wiring explicite.
  void appendEvent({
    tenantId: opts.tenantId,
    actorId: opts.actorId,
    actorRole: null,
    action: actionToAuditAction(opts.action),
    targetType: 'membership',
    targetId: opts.targetUserId,
    metadata: opts.metadata ?? {},
  }).catch(() => {
    /* no-throw — le wrapper memberships catch tout */
  });
}

function actionToAuditAction(action: MembershipAction):
  | 'member.invite'
  | 'member.accept'
  | 'member.revoke'
  | 'member.role_change' {
  switch (action) {
    case 'invite':
      return 'member.invite';
    case 'accept':
      return 'member.accept';
    case 'revoke':
      return 'member.revoke';
    case 'role_change':
      return 'member.role_change';
  }
}

/** Vrai à partir du jour où src/lib/auth/memberships.ts existe.
 *  Utilisé par les tests pour skipper proprement tant que le module
 *  source n'est pas prêt. */
export function membershipsModuleReady(): boolean {
  try {
    // Détection par `require` synchrone : on ne dépend PAS du module
    // (qui n'existe peut-être pas encore). On se contente de son
    // existence sur disque.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    if (typeof require !== 'undefined') {
      try {
        // @ts-expect-error — probing optionnel
        require('../auth/memberships');
        return true;
      } catch {
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
}