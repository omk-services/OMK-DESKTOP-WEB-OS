/** CmsRepository — Supabase-backed persistence for CMS collections, Phase 1.
 *  Mirrors the exact dual-write pattern already proven in the Life OS `DomainDB`
 *  (idb.ts): try Supabase, fall back silently on any failure or missing auth.
 *  There is no sign-in UI yet, so `getCurrentOrgId()` simply returns null when
 *  no session exists — every caller already handles that as "use the seed". */
import { supabase, supabaseConfigured } from '../supabase';
import type { CmsCollectionDef, CmsItem } from './types';

let cachedOrgId: string | null | undefined;

/** Resolves the signed-in coach's org_id, or null if there is no session yet
 *  (no auth UI exists in Coach OS today — this is the hook Phase 2 wires into). */
export async function getCurrentOrgId(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  if (cachedOrgId !== undefined) return cachedOrgId;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      cachedOrgId = null;
      return null;
    }
    const { data, error } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      cachedOrgId = null;
      return null;
    }
    cachedOrgId = data.org_id as string;
    return cachedOrgId;
  } catch {
    cachedOrgId = null;
    return null;
  }
}

/** Hydrates a collection's live items from Supabase for the given org.
 *  Returns null (not []) when there is no session/org yet, so callers can
 *  distinguish "no data" from "not authenticated — use the bundled seed". */
export async function hydrateCollection(collectionId: string): Promise<CmsItem[] | null> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return null;

  try {
    const { data, error } = await supabase
      .from('cms_items')
      .select('id, data')
      .eq('org_id', orgId)
      .eq('collection_id', collectionId);
    if (error || !data) return null;
    return data.map((row) => ({ id: row.id as string, ...(row.data as Record<string, unknown>) }));
  } catch {
    return null;
  }
}

/** Ensures the collection definition itself exists remotely (idempotent upsert). */
export async function upsertCollectionDef(def: CmsCollectionDef): Promise<void> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return;

  try {
    await supabase.from('cms_collections').upsert({
      id: def.id,
      org_id: orgId,
      name: def.name,
      singular: def.singular,
      accent: def.accent,
      title_field: def.titleField,
      subtitle_field: def.subtitleField ?? null,
      badge_field: def.badgeField ?? null,
      fields: def.fields,
    });
  } catch {
    // best-effort — the in-memory store already has the definition either way
  }
}

/** Upserts one item. Fire-and-forget from the caller's perspective — the
 *  Zustand store already updated optimistically before this resolves. */
export async function upsertItem(collectionId: string, item: CmsItem): Promise<void> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return;

  try {
    const { id, ...data } = item;
    await supabase.from('cms_items').upsert({
      id, collection_id: collectionId, org_id: orgId, data, updated_at: new Date().toISOString(),
    });
  } catch {
    // best-effort — local state is the source of truth until Supabase confirms
  }
}
