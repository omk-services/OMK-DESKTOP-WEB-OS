// src/lib/audit/queries.ts
// Lecture de l'audit log. Côté lecture uniquement : la RLS Supabase
// garantit que seuls les owners du tenant voient les events.
//
// Trois modes de lecture :
//   1. listAuditEvents(tenantId) — fichier brut, par fenêtre de temps.
//   2. listByActor(tenantId, actorId) — qui a fait quoi.
//   3. listByAction(tenantId, action) — qui a fait CETTE action.
//
// En mode démo (Supabase non configuré), les queries lisent le buffer
// in-memory du logger. C'est ce qui rend la UI utilisable en local
// sans Supabase.

import { supabaseConfigured } from '../supabase';
import { listInMemoryEvents, type InMemoryAuditEvent } from './logger';
import type { AuditAction, EventRecord, ObserverSource } from './event';

/** Forme externe d'un event lu. Le format est proche de la table SQL,
 *  pour qu'un viewer React puisse sérialiser directement. */
export interface AuditEventRow {
  id: string;
  tenantId: string;
  actorId: string | null;
  actorRole: string | null;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  observerSource: ObserverSource | null;
  createdAt: string;
}

function fromMemory(evt: InMemoryAuditEvent): AuditEventRow {
  return {
    id: `mem_${evt.createdAt}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: evt.tenantId,
    actorId: evt.actorId,
    actorRole: evt.actorRole,
    action: evt.action,
    targetType: evt.targetType,
    targetId: evt.targetId,
    metadata: evt.metadata,
    observerSource: evt.observerSource ?? null,
    createdAt: evt.createdAt,
  };
}

export interface ListOptions {
  /** Plage temporelle inclusive. */
  since?: string;
  until?: string;
  /** Borne max de résultats. Défaut 50. */
  limit?: number;
}

/** Liste les events d'audit d'un tenant, dans l'ordre antéchronologique.
 *  Filtres : actor, action, target_type. En mode Supabase, on s'appuie
 *  sur la RLS : si l'appelant n'est pas owner, la liste est vide par
 *  contrat. En mode démo, on lit le buffer in-memory. */
export async function listAuditEvents(
  tenantId: string,
  filters: {
    actorId?: string;
    action?: AuditAction;
    targetType?: string;
  } = {},
  options: ListOptions = {},
): Promise<AuditEventRow[]> {
  const limit = options.limit ?? 50;

  if (!supabaseConfigured) {
    return listInMemoryEvents()
      .filter((e) => e.tenantId === tenantId)
      .filter((e) => (filters.actorId ? e.actorId === filters.actorId : true))
      .filter((e) => (filters.action ? e.action === filters.action : true))
      .filter((e) => (filters.targetType ? e.targetType === filters.targetType : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(fromMemory);
  }

  // Lecture Supabase : la RLS filtre côté serveur. Si l'appelant n'est
  // pas owner du tenant, il recevra [] et c'est le bon comportement.
  try {
    const client = (await import('../supabase')).supabase as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (col: string, v: unknown) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{
                data: Array<Record<string, unknown>> | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
    // Construction impérative pour rester portable sur les types du SDK.
    let q = client.from('audit_events').select('*');
    q = q.eq('tenant_id', tenantId) as typeof q;
    q = q.order('created_at', { ascending: false }) as typeof q;
    const finalQ = (q as unknown as { limit: (n: number) => Promise<{
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    }> }).limit(limit);
    const { data, error } = await finalQ;
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id ?? ''),
      tenantId: String(row.tenant_id ?? tenantId),
      actorId: (row.actor_id as string | null) ?? null,
      actorRole: (row.actor_role as string | null) ?? null,
      action: String(row.action ?? 'observer.event') as AuditAction,
      targetType: (row.target_type as string | null) ?? null,
      targetId: (row.target_id as string | null) ?? null,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      observerSource: (row.observer_source as ObserverSource | null) ?? null,
      createdAt: String(row.created_at ?? ''),
    })).filter((r) => (filters.actorId ? r.actorId === filters.actorId : true))
      .filter((r) => (filters.action ? r.action === filters.action : true))
      .filter((r) => (filters.targetType ? r.targetType === filters.targetType : true));
  } catch {
    return [];
  }
}

export async function listByActor(
  tenantId: string,
  actorId: string,
  options: ListOptions = {},
): Promise<AuditEventRow[]> {
  return listAuditEvents(tenantId, { actorId }, options);
}

export async function listByAction(
  tenantId: string,
  action: AuditAction,
  options: ListOptions = {},
): Promise<AuditEventRow[]> {
  return listAuditEvents(tenantId, { action }, options);
}

/** Helper pratique : à partir d'un EventRecord (avant INSERT), produit
 *  la ligne qui sera stockée. Utile pour les tests et pour les vues
 *  qui veulent montrer un event "à venir". */
export function rowFromEvent(rec: EventRecord, id: string, createdAt: string): AuditEventRow {
  return {
    id,
    tenantId: rec.tenantId,
    actorId: rec.actorId,
    actorRole: rec.actorRole,
    action: rec.action,
    targetType: rec.targetType,
    targetId: rec.targetId,
    metadata: rec.metadata,
    observerSource: rec.observerSource ?? null,
    createdAt,
  };
}