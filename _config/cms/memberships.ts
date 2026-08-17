// _config/cms/memberships.ts
// Seuils et règles métier des memberships (campagne 2026-08-15, MEMBERSHIPS).
//
// Ce fichier vit à la racine du dépôt (sous `_config/`), pas dans `src/` :
// c'est de la configuration, pas du code de domaine. Comme `quota.ts`, il
// est volontairement plat : exporter une constante. Une V2 lira Supabase
// par tenant ; ce fichier sera alors remplacé par un lookup dynamique.
//
// Régles métier transverses (Phase 3) :
//   - Un tenant ne peut pas inviter plus de N personnes par jour.
//   - Une invitation expire après K jours si elle n'est pas acceptée.
//   - Le nombre d'owners actifs est plafonné (anti-orphan : on n'éjecte
//     pas le dernier owner).

/** Plafond d'invitations envoyées par tenant par jour. Au-delà, le
 *  court-circuit refuse l'invitation. C'est le pendant humain de la
 *  quota `proposals_per_minute` côté store. */
export const MEMBERSHIP_INVITE_PER_DAY = 25;

/** Durée de validité d'une invitation non acceptée, en jours. Passé
 *  ce délai, l'invitation est marquée `revoked` par le sweeper (cf.
 *  AUDIT_LOG chantier). */
export const MEMBERSHIP_INVITE_TTL_DAYS = 7;

/** Nombre maximal d'owners simultanés par tenant. Au-delà, le store
 *  refuse une nouvelle promotion. C'est le filet anti-orphan : on
 *  ne peut pas involontairement créer trois owners d'un cabinet. */
export const MEMBERSHIP_MAX_OWNERS = 1;

/** Comportement attendu quand un user a plusieurs memberships actives
 *  pour le même tenant. Le brief demande **refus** — état incohérent. */
export const MULTIPLE_ACTIVE_POLICY = 'refuse' as const;

/** Rôles autorisés pour un changement de rôle. Un owner peut être
 *  promu en admin, member ou guest ; un guest peut être promu en
 *  member, admin (si Max_owners n'est pas atteint), owner (pareil). */
export const ROLE_PROMOTION_ALLOWED: ReadonlyArray<{
  from: 'owner' | 'admin' | 'member' | 'guest';
  to: 'owner' | 'admin' | 'member' | 'guest';
}> = [
  { from: 'member', to: 'admin' },
  { from: 'member', to: 'guest' },
  { from: 'admin', to: 'member' },
  { from: 'admin', to: 'guest' },
  { from: 'guest', to: 'member' },
];

/** Whitelist canonique des rôles, utilisée par l'UI d'invitation pour
 *  peupler le `<select>`. Gardée alignée avec `MembershipRole` du
 *  contract. */
export const MEMBERSHIP_ROLES_UI: ReadonlyArray<{
  value: 'owner' | 'admin' | 'member' | 'guest';
  label: string;
  description: string;
}> = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Tous droits. Peut inviter, révoquer, gérer les rôles.',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Tous droits sauf gérer les owners.',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Lit et écrit. Ne peut pas inviter ni gérer les rôles.',
  },
  {
    value: 'guest',
    label: 'Guest',
    description: 'Lecture seule. Ne peut pas proposer d\'écriture.',
  },
];
