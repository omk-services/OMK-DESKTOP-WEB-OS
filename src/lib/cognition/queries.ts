import type { SupabaseClient } from '@supabase/supabase-js';

export const COGNITION_ORG_ID = '00000000-0000-0000-0000-000000000001';

export interface Routine {
  id: string;
  org_id: string;
  name: string;
  cadence: string;
  time_of_day: string | null;
  prompt_template: string | null;
  skills_invoked: string[];
  is_active: boolean;
}

export interface Manifest {
  id: string;
  org_id: string;
  graph_version: string;
  source_scope: string | null;
  knowledge_sovereignty_score: number;
  next_review_at: string | null;
}

export interface EventTypeCount {
  eventType: string;
  count: number;
}

interface RoutineRow {
  id: string;
  org_id: string;
  name: string;
  cadence: string;
  time_of_day: string | null;
  prompt_template: string | null;
  skills_invoked: unknown;
  is_active: boolean;
}

interface ManifestRow {
  id: string;
  org_id: string;
  graph_version: string;
  source_scope: string | null;
  knowledge_sovereignty_score: number | string | null;
  next_review_at: string | null;
}

interface EventRow {
  event_type: string | null;
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function parseScore(value: number | string | null): number {
  const score = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(score) ? score : 0;
}

function queryErrorMessage(error: { message: string }): Error {
  return new Error(`Cognition query failed: ${error.message}`);
}

export async function fetchRoutines(client: SupabaseClient): Promise<Routine[]> {
  const { data, error } = await client
    .schema('cognition')
    .from('routines')
    .select('id, org_id, name, cadence, time_of_day, prompt_template, skills_invoked, is_active')
    .eq('org_id', COGNITION_ORG_ID)
    .order('time_of_day', { ascending: true, nullsFirst: false });

  if (error) throw queryErrorMessage(error);

  const rows = (data ?? []) as RoutineRow[];
  return rows.map((row) => ({
    id: row.id,
    org_id: row.org_id,
    name: row.name,
    cadence: row.cadence,
    time_of_day: row.time_of_day,
    prompt_template: row.prompt_template,
    skills_invoked: parseStringList(row.skills_invoked),
    is_active: row.is_active,
  }));
}

export async function fetchEventCount(client: SupabaseClient, member?: string): Promise<number> {
  let query = client
    .schema('cognition')
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', COGNITION_ORG_ID);

  if (member) query = query.eq('member', member);

  const { count, error } = await query;
  if (error) throw queryErrorMessage(error);
  return count ?? 0;
}

export async function fetchLatestManifest(client: SupabaseClient): Promise<Manifest | null> {
  const { data, error } = await client
    .schema('cognition')
    .from('yggdrasil_manifest')
    .select('id, org_id, graph_version, source_scope, knowledge_sovereignty_score, next_review_at')
    .eq('org_id', COGNITION_ORG_ID)
    .order('graph_version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw queryErrorMessage(error);
  if (!data) return null;

  const row = data as ManifestRow;
  return {
    id: row.id,
    org_id: row.org_id,
    graph_version: row.graph_version,
    source_scope: row.source_scope,
    knowledge_sovereignty_score: parseScore(row.knowledge_sovereignty_score),
    next_review_at: row.next_review_at,
  };
}

export async function fetchEventTypeCounts(client: SupabaseClient): Promise<EventTypeCount[]> {
  const { data, error } = await client
    .schema('cognition')
    .from('events')
    .select('event_type')
    .eq('org_id', COGNITION_ORG_ID);

  if (error) throw queryErrorMessage(error);

  const rows = (data ?? []) as EventRow[];
  const grouped = rows.reduce<Record<string, number>>((counts, row) => {
    if (!row.event_type) return counts;
    return { ...counts, [row.event_type]: (counts[row.event_type] ?? 0) + 1 };
  }, {});

  return Object.entries(grouped).map(([eventType, count]) => ({ eventType, count }));
}
