/**
 * cmsAgents — bridge between the dashboard's local AGENTS seed and the
 * CMS partition used by `CollectionRepeater`.
 *
 * Per Brief D (vague 3 2026-08-10), the only "user-creatable" entity in the
 * dashboard scope is the agent. SESSIONS, AUDIT_LOG, PLAYGROUND_MODELS are
 * system-side or vendor-side and stay read-only with filters/export already
 * wired in their respective sections.
 *
 * Approach: the seed is registered as a CMS collection on first import. The
 * agent detail page (AgentDetail) reads from the CMS items map and falls
 * back to the seed only for fields not present in the CMS row (defensive —
 * the seed has rich shape beyond the titleField/fields schema).
 *
 * The list also derives the dashboard-typed `DashboardAgent` view by
 * coalescing the CMS item with the matching seed entry. New agents created
 * via CollectionRepeater are reflected immediately: the list hook is reactive
 * over the CMS items map, and the seed-coalesce falls through cleanly when
 * no seed entry matches (the CMS row carries the full title and purpose).
 */
import { useMemo } from 'react';
import { useCmsStore } from '../../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../../lib/cms/types';
import { AGENTS as AGENT_SEED, type DashboardAgent } from './seed';

export const AGENTS_COLLECTION_ID = 'dashboard_agents';

/** CMS schema for the agent collection. titleField = name (the human label);
 *  subtitleField = role; badgeField = state (drives the green/amber/red pill
 *  on the repeater). Secondary fields capture purpose, model, health, etc. */
export const agentsDef: CmsCollectionDef = {
  id: AGENTS_COLLECTION_ID,
  name: 'Agents',
  singular: 'Agent',
  accent: '#059669',
  titleField: 'name',
  subtitleField: 'role',
  badgeField: 'state',
  fields: [
    { key: 'role',        label: 'Role',        type: 'text' },
    { key: 'purpose',     label: 'Purpose',     type: 'longtext' },
    { key: 'model',       label: 'Model',       type: 'text' },
    { key: 'state',       label: 'State',       type: 'badge' },
    { key: 'health',      label: 'Health',      type: 'number' },
  ],
};

/** Build the seed CMS items from the rich local seed. Keeps `systemPrompt`,
 *  `connections`, `guardrails`, `lastUpdated`, `costLast24h` etc. on the
 *  seed side — the agent detail overlay reads them by id when the row exists
 *  in the seed. Newly created CMS rows keep their data in the CMS only. */
function buildSeedItems(): CmsItem[] {
  return AGENT_SEED.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    purpose: a.purpose,
    model: a.model,
    state: a.state,
    health: a.health,
    sessionsLast24h: a.sessionsLast24h,
    costLast24h: a.costLast24h,
    memories: a.memories,
  }));
}

let registered = false;

/** Idempotent: registers the collection on first call. Called by both the
 *  hook (when the dashboard app mounts) and any test/dev tooling that needs
 *  the schema without the hook. */
export function ensureAgentsCollection(): void {
  if (registered) return;
  if (typeof window === 'undefined') return;
  const state = useCmsStore.getState();
  const existing = state.collections[AGENTS_COLLECTION_ID];
  if (existing) {
    registered = true;
    return;
  }
  state.registerCollection(agentsDef, buildSeedItems());
  registered = true;
}

/** Resolve a CMS row + the matching seed entry (if any) into the rich
 *  `DashboardAgent` shape that AgentDetail already consumes. New CMS rows
 *  without a seed counterpart get sensible defaults for the missing
 *  secondary fields. */
function coalesceAgent(item: CmsItem): DashboardAgent {
  const seedMatch = AGENT_SEED.find((s) => s.id === item.id);
  if (seedMatch) return seedMatch;
  return {
    id: String(item.id),
    name: String(item.name ?? item.id),
    role: String(item.role ?? '—'),
    purpose: typeof item.purpose === 'string' ? item.purpose : '',
    model: typeof item.model === 'string' && item.model ? item.model : 'claude-sonnet-4-5',
    systemPrompt: typeof item.systemPrompt === 'string' ? item.systemPrompt : '',
    state: (typeof item.state === 'string' ? item.state : 'healthy') as DashboardAgent['state'],
    health: typeof item.health === 'number' && Number.isFinite(item.health) ? item.health : 80,
    sessionsLast24h: typeof item.sessionsLast24h === 'number' ? item.sessionsLast24h : 0,
    costLast24h: typeof item.costLast24h === 'number' ? item.costLast24h : 0,
    connections: [],
    memories: typeof item.memories === 'number' ? item.memories : 0,
    guardrails: [],
    lastUpdated: new Date().toISOString(),
  };
}

/** Reactive list of `DashboardAgent` derived from the CMS. Auto-registers the
 *  collection on first call so consumers can mount without explicit
 *  bootstrap. */
export function useDashboardAgents(): DashboardAgent[] {
  ensureAgentsCollection();
  const items = useCmsStore((s) => s.items[AGENTS_COLLECTION_ID]);
  return useMemo(() => {
    if (!items) return AGENT_SEED;
    return items.map(coalesceAgent);
  }, [items]);
}

/** Resolve a single agent by id. Returns null if the id is unknown. */
export function useDashboardAgent(id: string | null): DashboardAgent | null {
  const agents = useDashboardAgents();
  if (!id) return null;
  return agents.find((a) => a.id === id) ?? null;
}
