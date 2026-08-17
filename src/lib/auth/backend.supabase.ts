/** Backend Supabase pour `memberships`.
 *
 *  Implémente l'interface `MembershipBackend` du brief MEMBERSHIPS en
 *  utilisant le client Supabase réel. Chaque méthode est isolée par
 *  `tenantId` — un user qui demande T2 ne doit pas voir T1 (cf. RLS
 *  policies `self_read` et `owner_read` sur la table `memberships`).
 *
 *  2026-08-16 — Chantier 2 du Wargame, sous-tâche "brancher memberships
 *  backend". Appliqué dans `src/main.tsx` à l'init de l'app.
 *
 *  PRÉREQUIS : la table `public.memberships` existe sur le projet
 *  Supabase actif, avec les policies RLS en place. Migration appliquée
 *  le 2026-08-15 — voir `_briefs/2026-08-15_MEMBERSHIPS/`.
 */

import type { MembershipBackend, MembershipRecord } from './memberships';
import type { TenantId } from '../tenant/contract';
import { supabase, supabaseConfigured } from '../supabase';

type SupabaseRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: string;
};

const ROW_TO_RECORD = (r: SupabaseRow): MembershipRecord => ({
  id: r.id,
  tenantId: r.tenant_id as TenantId,
  userId: r.user_id,
  role: r.role as MembershipRecord['role'],
  invitedBy: r.invited_by,
  invitedAt: r.invited_at,
  acceptedAt: r.accepted_at,
  status: r.status as MembershipRecord['status'],
});

class SupabaseMembershipBackend implements MembershipBackend {
  async list(tenantId: TenantId): Promise<MembershipRecord[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('id,tenant_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return (data ?? []).map(ROW_TO_RECORD);
  }

  async get(membershipId: string): Promise<MembershipRecord | null> {
    const { data, error } = await supabase
      .from('memberships')
      .select('id,tenant_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .eq('id', membershipId)
      .maybeSingle();
    if (error) throw error;
    return data ? ROW_TO_RECORD(data as SupabaseRow) : null;
  }

  async insert(input: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord> {
    const { data, error } = await supabase
      .from('memberships')
      .insert({
        tenant_id: input.tenantId,
        user_id: input.userId,
        role: input.role,
        invited_by: input.invitedBy,
        invited_at: input.invitedAt,
        accepted_at: input.acceptedAt,
        status: input.status,
      })
      .select('id,tenant_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .single();
    if (error) throw error;
    return ROW_TO_RECORD(data as SupabaseRow);
  }

  async update(
    membershipId: string,
    patch: Partial<MembershipRecord>,
  ): Promise<MembershipRecord | null> {
    const dbPatch: Record<string, unknown> = {};
    if (patch.tenantId !== undefined) dbPatch.tenant_id = patch.tenantId;
    if (patch.userId !== undefined) dbPatch.user_id = patch.userId;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.invitedBy !== undefined) dbPatch.invited_by = patch.invitedBy;
    if (patch.invitedAt !== undefined) dbPatch.invited_at = patch.invitedAt;
    if (patch.acceptedAt !== undefined) dbPatch.accepted_at = patch.acceptedAt;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    const { data, error } = await supabase
      .from('memberships')
      .update(dbPatch)
      .eq('id', membershipId)
      .select('id,tenant_id,user_id,role,invited_by,invited_at,accepted_at,status')
      .maybeSingle();
    if (error) throw error;
    return data ? ROW_TO_RECORD(data as SupabaseRow) : null;
  }

  /** Compteur d'invitations journalier — Supabase ne fournit pas
   *  d'agrégat temporel natif, on fait un count côté client après
   *  `since`. Volumétrie typique : < 100 rows / jour / tenant, OK. */
  async invitesToday(tenantId: TenantId, since: Date): Promise<number> {
    const { count, error } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
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
      'ne maintient pas de cache.'
    );
  }
}

/** Helper : à appeler à l'init de l'app pour brancher Supabase réel.
 *  En mode démo (pas de config), le backend in-memory par défaut
 *  reste en place. */
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
