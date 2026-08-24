/** Backend Supabase pour `memberships`.
 *
 *  Implémente l'interface `MembershipBackend` du brief MEMBERSHIPS en
 *  utilisant le client Supabase réel. Chaque méthode est isolée par
 *  l'organisation active — un user qui demande une autre org ne doit
 *  pas la voir (cf. RLS policies `est_membre_org` / `est_admin_org`).
 *
 *  2026-08-16 — Chantier 2 du Wargame, sous-tâche "brancher memberships
 *  backend". Appliqué dans `src/main.tsx` à l'init de l'app.
 *
 *  PRÉREQUIS : la table `public.memberships` existe sur le projet
 *  Supabase actif, avec les policies RLS en place. Migration appliquée
 *  le 2026-08-15 — voir `_briefs/2026-08-15_MEMBERSHIPS/`.
 *
 *  2026-08-17 — Canon `org_id uuid`. Le code interrogeait `tenant_id`
 *  (TEXT, slug local). Cette colonne n'existe plus : elle a été
 *  convertie en `org_id` (UUID) par la migration
 *  `supabase/migrations/2026-08-17_canon_rls_uuid.sql`. La source de
 *  vérité pour l'org côté serveur est désormais le **claim `org_id` du
 *  JWT**, posé par le hook `custom_access_token_hook` (même migration).
 *  Si le claim est absent (utilisateur sans adhésion active), le hook
 *  l'omet volontairement pour que la RLS échoue franchement ; on lève
 *  une erreur explicite au lieu de produire un `undefined` qui voyage.
 */

import type { MembershipBackend } from './memberships';
import type { MembershipRecord, OrgId, TenantId } from '../tenant/contract';
import { isValidOrgId, toOrgId } from '../tenant/contract';
import { supabase, supabaseConfigured } from '../supabase';

type SupabaseRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: string;
};

/** Sentinelle pour `MembershipRecord.tenantId` quand la row vient de
 *  Supabase. Le slug local n'a pas de sens côté DB — on pose une
 *  valeur non-vide pour respecter le type, mais aucun code ne doit
 *  l'utiliser pour une requête Supabase (cf. canon 2026-08-17). */
const REMOTE_TENANT_SENTINEL = '__remote__' as TenantId;

const ROW_TO_RECORD = (r: SupabaseRow): MembershipRecord => ({
  id: r.id,
  // tenantId = sentinelle ; l'identité réelle côté DB est `orgId`.
  tenantId: REMOTE_TENANT_SENTINEL,
  // orgId : on a vérifié la forme via isValidOrgId (cf. extractOrgId).
  orgId: toOrgId(r.org_id),
  userId: r.user_id,
  role: r.role as MembershipRecord['role'],
  invitedBy: r.invited_by,
  invitedAt: r.invited_at,
  acceptedAt: r.accepted_at,
  status: r.status as MembershipRecord['status'],
});

/** Erreur explicite levée quand le claim `org_id` du JWT est absent.
 *  Le hook l'omet volontairement quand l'utilisateur n'a aucune
 *  adhésion active ; on ne transforme pas ce silence en `undefined`. */
export class NoActiveMembershipError extends Error {
  readonly code = 'NO_ACTIVE_MEMBERSHIP';
  constructor() {
    super(
      '[memberships.supabase] Le claim JWT `org_id` est absent : ' +
      'aucune adhésion active pour cet utilisateur. Le hook ' +
      'custom_access_token_hook l\'omet volontairement pour que la ' +
      'RLS échoue franchement. Demander à l\'utilisateur d\'accepter ' +
      'une invitation ou de rejoindre une organisation avant ' +
      'd\'interroger memberships.',
    );
    this.name = 'NoActiveMembershipError';
  }
}

/** Extrait le claim `org_id` du JWT courant (Supabase). Le hook
 *  `custom_access_token_hook` pose ce claim top-level sur le payload.
 *  Renvoie une erreur explicite si :
 *  - pas de session (utilisateur non connecté) ;
 *  - claim absent (utilisateur sans adhésion active, choix du hook) ;
 *  - claim mal formé (pas un uuid).
 *
 *  Choix de design (brief 2026-08-17_CANON_UUID §2) : on lit le JWT
 *  plutôt que d'interroger `organizations` parce que le hook garantit
 *  la cohérence entre le claim et la RLS — toute lecture DB
 *  supplémentaire augmenterait la surface d'incohérence sans gain.
 *  Le défaut (claim absent) est rendu visible : c'est lui qui rend la
 *  règle « un user sans org ne peut pas interroger memberships »
 *  exprimable dans le code. */
async function extractOrgIdFromJwt(): Promise<OrgId> {
  // Le client mort-né jette sur .auth ; on l'attrape en amont.
  if (!supabaseConfigured) {
    throw new NoActiveMembershipError();
  }
  const auth = (supabase as unknown as {
    auth: {
      getSession: () => Promise<{
        data: { session: { access_token?: string } | null };
        error: unknown;
      }>;
    };
  }).auth;
  const { data } = await auth.getSession();
  const token = data?.session?.access_token;
  if (!token) {
    throw new NoActiveMembershipError();
  }
  // JWT = header.payload.signature, base64url.
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new NoActiveMembershipError();
  }
  const payloadSeg = parts[1];
  if (!payloadSeg) {
    throw new NoActiveMembershipError();
  }
  let payload: Record<string, unknown> | null = null;
  try {
    // base64url → base64 (+ padding).
    const padded = payloadSeg.replace(/-/g, '+').replace(/_/g, '/')
      + '==='.slice((payloadSeg.length + 3) % 4);
    // atob est disponible en navigateur ET en Node 16+.
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8');
    payload = JSON.parse(json) as Record<string, unknown>;
  } catch {
    throw new NoActiveMembershipError();
  }
  const claim = payload.org_id;
  if (typeof claim !== 'string' || !isValidOrgId(claim)) {
    throw new NoActiveMembershipError();
  }
  return claim;
}

class SupabaseMembershipBackend implements MembershipBackend {
  /** Le slug `tenantId` reçu du caller est IGNORÉ côté Supabase : la
   *  RLS filtre par le claim JWT, et le backend résout l'org réel via
   *  `extractOrgIdFromJwt()`. Le slug reste légitime côté localStorage
   *  (cf. storage-scope.ts) — il n'a simplement pas de sens ici. */
  async list(_tenantId: TenantId): Promise<MembershipRecord[]> {
    // On ignore le slug et on lit l'org depuis le JWT. Si le claim
    // manque, on lève explicitement ; le caller (memberships.ts)
    // distingue refus d'autorisation et refus d'absence d'org via le
    // type de l'erreur, mais c'est une 500 honnête : « pas d'org active
    // pour cet utilisateur » n'est pas un cas métier silencieux.
    const orgId = await extractOrgIdFromJwt();
    const { data, error } = await supabase
      .from('memberships')
      .select('id,org_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .eq('org_id', orgId);
    if (error) throw error;
    return (data ?? []).map(ROW_TO_RECORD);
  }

  async get(membershipId: string): Promise<MembershipRecord | null> {
    // `get` lit une row par id ; la RLS fait foi (un user d'une autre
    // org reçoit null). On n'a pas besoin de l'org_id ici — le filtre
    // par id est suffisant, et la RLS borne la visibilité. Mais le
    // claim est nécessaire pour que la session soit authentifiée :
    // sans claim, la session est anonyme et la policy refuse tout.
    await extractOrgIdFromJwt();
    const { data, error } = await supabase
      .from('memberships')
      .select('id,org_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .eq('id', membershipId)
      .maybeSingle();
    if (error) throw error;
    return data ? ROW_TO_RECORD(data as SupabaseRow) : null;
  }

  async insert(input: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord> {
    const orgId = await extractOrgIdFromJwt();
    const { data, error } = await supabase
      .from('memberships')
      .insert({
        org_id: orgId,
        user_id: input.userId,
        role: input.role,
        invited_by: input.invitedBy,
        invited_at: input.invitedAt,
        accepted_at: input.acceptedAt,
        status: input.status,
      })
      .select('id,org_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .single();
    if (error) throw error;
    return ROW_TO_RECORD(data as SupabaseRow);
  }

  async update(
    membershipId: string,
    patch: Partial<MembershipRecord>,
  ): Promise<MembershipRecord | null> {
    await extractOrgIdFromJwt();
    const dbPatch: Record<string, unknown> = {};
    if (patch.orgId !== undefined) dbPatch.org_id = patch.orgId;
    if (patch.userId !== undefined) dbPatch.user_id = patch.userId;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.invitedBy !== undefined) dbPatch.invited_by = patch.invitedBy;
    if (patch.invitedAt !== undefined) dbPatch.invited_at = patch.invitedAt;
    if (patch.acceptedAt !== undefined) dbPatch.accepted_at = patch.acceptedAt;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    // Note volontaire : on n'autorise PAS `patch.tenantId` à toucher la
    // base. Le slug local n'est pas une colonne ; le contract le
    // conserve pour le backend in-memory. Un caller qui essaierait
    // s'expose à un drop silencieux ici — c'est mieux qu'un cast qui
    // fabrique un uuid à partir d'un slug.
    const { data, error } = await supabase
      .from('memberships')
      .update(dbPatch)
      .eq('id', membershipId)
      .select('id,org_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .maybeSingle();
    if (error) throw error;
    return data ? ROW_TO_RECORD(data as SupabaseRow) : null;
  }

  /** Compteur d'invitations journalier — Supabase ne fournit pas
   *  d'agrégat temporel natif, on fait un count côté client après
   *  `since`. Volumétrie typique : < 100 rows / jour / tenant, OK. */
  async invitesToday(_tenantId: TenantId, since: Date): Promise<number> {
    const orgId = await extractOrgIdFromJwt();
    const { count, error } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('invited_at', since.toISOString());
    if (error) throw error;
    return count ?? 0;
  }

  async recordInvite(tenantId: TenantId, at: Date): Promise<number> {
    // Le compteur est dérivé d'un INSERT. On ne peut pas faire
    // d'INSERT factice pour compter — l'INSERT crée une row. On
    // retourne le count après l'INSERT (l'INSERT lui-même est fait
    // par `insert()`). Le caller doit utiliser `insert()` puis
    // `invitesToday()` pour avoir un count à jour.
    void tenantId; void at;
    throw new Error(
      '[memberships.supabase] recordInvite() doit etre suivi de ' +
      'invitesToday() ; l INSERT se fait par insert() et ce backend ' +
      'ne maintient pas de cache.',
    );
  }
}

/** Exporte la classe pour les tests. Le runtime passe par
 *  `setMembershipBackend()` (cf. `maybeUseSupabaseMembershipBackend`). */
export { SupabaseMembershipBackend };

/** Helper : à appeler à l'init de l'app pour brancher Supabase réel.
 *  En mode démo (pas de config), le backend in-memory par défaut
 *  reste en place.
 *
 *  Cette fonction reste SYNCHRONE : elle se contente de poser le
 *  backend. La résolution réelle de l'`org_id` (lecture JWT) est
 *  paresseuse — elle a lieu à la première requête, pas au boot —
 *  parce que le claim n'existe qu'après un sign-in et qu'on ne veut
 *  pas crasher l'app en mode démo. */
export function maybeUseSupabaseMembershipBackend(): boolean {
  if (!supabaseConfigured) return false;
  // import dynamique pour éviter la circularité memberships.ts → supabase.ts → ...
  // (memberships.ts importe ce fichier, et on veut éviter la boucle).
  // Le module memberships est importé via la signature du type uniquement.
  // Note : le cast `as never` est un mensonge à TypeScript que le
  // runtime ne voit pas. C'est le prix de l'import cyclique contrôlé.
  const { setMembershipBackend } = require('./memberships') as {
    setMembershipBackend: (b: MembershipBackend) => void;
  };
  setMembershipBackend(new SupabaseMembershipBackend());
  return true;
}