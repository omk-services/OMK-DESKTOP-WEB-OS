/** CmsRepository — Supabase-backed persistence for CMS collections, Phase 1.
 *  Mirrors the exact dual-write pattern already proven in the Life OS `DomainDB`
 *  (idb.ts): try Supabase, fall back silently on any failure or missing auth.
 *  There is no sign-in UI yet, so `getCurrentOrgId()` simply returns null when
 *  no session exists — every caller already handles that as "use the seed".
 *
 *  Brief-B (2026-08-11) — extension. Le repli local doit être EXPLICITE :
 *  on ne simule rien. `supabaseMode()` retourne l'état observé, et chaque
 *  fallback loggue un message d'info (pas warn — c'est attendu en démo).
 *  Le mapping `tableFor()` ouvre la voie au nouveau schéma typé (23 tables)
 *  sans casser le chemin générique existant. */
import { supabase, supabaseConfigured } from '../supabase';
import type { CmsCollectionDef, CmsItem } from './types';

/* ─────────────────────────────────────────────────────────────────────
 * Mode observability — Brief-B §4
 * Le but : un dev qui ouvre la console voit immédiatement si l'app
 * parle à Supabase ou si elle tourne sur le seed local. Pas de
 * silence trompeur, jamais.
 * ──────────────────────────────────────────────────────────────────── */

export type SupabaseMode = 'connected' | 'unconfigured' | 'unreachable' | 'no-org';

let _mode: SupabaseMode = supabaseConfigured ? 'unreachable' : 'unconfigured';
let _modeLogged = false;
let _lastError: string | null = null;

/** Returns the last observed state of the Supabase backend.
 *  - 'unconfigured' : no VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env
 *  - 'unreachable'  : client exists but every call so far has failed
 *  - 'no-org'       : client works, but the user has no membership row
 *  - 'connected'    : client works and org_id is resolved
 */
export function supabaseMode(): SupabaseMode {
  return _mode;
}

export function lastSupabaseError(): string | null {
  return _lastError;
}

function setMode(next: SupabaseMode, err?: unknown): void {
  if (_modeLogged && _mode === next) return;
  _mode = next;
  _lastError = err instanceof Error ? err.message : err ? String(err) : null;
  if (!_modeLogged) {
    _modeLogged = true;
    // L'info-level est volontaire : en mode démo, c'est le comportement
    // attendu. On ne crie pas "warning" pour un comportement correct.
    // eslint-disable-next-line no-console
    console.info(
      `[cms] supabase mode: ${_mode}` +
        (_lastError ? ` (last error: ${_lastError})` : '') +
        ` — falling back to bundled seed is the documented contract.`,
    );
  } else if (next === 'unreachable' || next === 'no-org') {
    // Mode change after first success — useful when DNS comes back or a
    // session is logged out. Bumped to warn to make the regression visible.
    // eslint-disable-next-line no-console
    console.warn(
      `[cms] supabase mode changed → ${next}` +
        (_lastError ? ` (last error: ${_lastError})` : ''),
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────
 * Collection → table mapping — Brief-B §1
 * Le nouveau schéma a une table par collection. Le repository historique
 * utilise `cms_items` (générique) pour rester compatible avec ce qui
 * tourne en prod aujourd'hui. `tableFor()` est l'aiguillage : si la
 * collection a une table typée, on l'utilise ; sinon, on retombe sur
 * `cms_items` (events append-only).
 * ──────────────────────────────────────────────────────────────────── */

const TYPED_TABLES: Record<string, string> = {
  clients: 'cms_clients',
  articles: 'cms_articles',
  team: 'cms_team',
  people_agents: 'cms_people_agents',
  runbooks: 'cms_runbooks',
  incidents: 'cms_incidents',
  services: 'cms_services',
  it_experiments: 'cms_it_experiments',
  deploys: 'cms_deploys',
  tasks: 'cms_tasks',
  marketplace_listings: 'cms_marketplace_listings',
  product_items: 'cms_product_items',
  product_releases: 'cms_product_releases',
  growth_channels: 'cms_growth_channels',
  growth_experiments: 'cms_growth_experiments',
  deals: 'cms_deals',
  invoices: 'cms_invoices',
  contracts: 'cms_contracts',
  policies: 'cms_policies',
  session_notes: 'cms_session_notes',
  demo_coach_apps: 'cms_demo_coach_apps',
  demo_coach_notes: 'cms_demo_coach_notes',
  demo_coach_metrics: 'cms_demo_coach_metrics',
};

export function tableFor(collectionId: string): string {
  return TYPED_TABLES[collectionId] ?? 'cms_items';
}

/* ─────────────────────────────────────────────────────────────────────
 * Original repository — rétro-compat Brief-F (Phase 1) + Brief-B (Phase 4)
 * ──────────────────────────────────────────────────────────────────── */

let cachedOrgId: string | null | undefined;

/** Resolves the signed-in coach's org_id, or null if there is no session yet
 *  (no auth UI exists in Coach OS today — this is the hook Phase 2 wires into). */
export async function getCurrentOrgId(): Promise<string | null> {
  if (!supabaseConfigured) {
    setMode('unconfigured');
    return null;
  }
  if (cachedOrgId !== undefined) return cachedOrgId;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setMode('no-org');
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
      setMode('no-org', error ?? 'no membership row');
      cachedOrgId = null;
      return null;
    }
    cachedOrgId = data.org_id as string;
    setMode('connected');
    return cachedOrgId;
  } catch (err) {
    setMode('unreachable', err);
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

/** Removes one item. Fire-and-forget from the caller's perspective — the
 *  Zustand store already updated optimistically before this resolves.
 *  Brief-F (2026-08-07) — la couche d'écriture appelle ce chemin en miroir
 *  de `upsertItem`. Sans lui, `removeItem` du store laissait la ligne dans
 *  Supabase après un rechargement. */
export async function removeItem(collectionId: string, id: string): Promise<void> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return;

  try {
    await supabase
      .from('cms_items')
      .delete()
      .eq('id', id)
      .eq('collection_id', collectionId)
      .eq('org_id', orgId);
  } catch {
    // best-effort — local state is the source of truth until Supabase confirms
  }
}

/** Append-only event sink used by domain surfaces to record state-changing
 *  decisions without mutating existing rows. D4 append-only compliance, no
 *  UPSERT semantics, no PATCH semantics. */
export async function appendCmsEvent(args: {
  collectionId: string;
  data: Record<string, unknown>;
}): Promise<string | null> {
  const orgId = await getCurrentOrgId();
  if (!orgId) return null;
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await supabase.from('cms_items').insert({
      id,
      collection_id: args.collectionId,
      org_id: orgId,
      data: args.data,
      updated_at: new Date().toISOString(),
    });
    return id;
  } catch {
    return null;
  }
}
