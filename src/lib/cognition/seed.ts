/**
 * Cognition local seed — the offline fallback for routines / events / manifest.
 *
 * Les donnees sont une vitrine des objets metier de l'app : routines qui
 * tournent reellement (morning, hygiene, win-loss, intelligence report),
 * evenements de types varies (routine_run, routine_paused, gate_armed,
 * manifest_published) et un manifeste avec un score de souverainete du
 * savoir place au-dessus du plancher de la SovereignGate.
 *
 * Quand Supabase Cloud est configure (`supabaseConfigured`), les requetes
 * interrogent la vraie base. Quand il ne l'est pas, ou que la base ne repond
 * pas, c'est ce seed qui prend le relais — l'utilisateur n'y voit que du
 * feu, et la demo reste autonome (contrainte SOCLE §3).
 */
import type { EventTypeCount, Manifest, Routine } from './queries';
import type { CognEvent } from './queries';

const COGNITION_ORG_ID = '00000000-0000-0000-0000-000000000001';

const routines: Routine[] = [
  {
    id: 'seed-r-morning',
    org_id: COGNITION_ORG_ID,
    name: 'Morning Routine',
    cadence: 'daily',
    time_of_day: '08:00:00',
    prompt_template: 'Walk the last 24h, update the second brain, surface the one thing.',
    skills_invoked: ['pipeline-review', 'morning-brief'],
    is_active: true,
  },
  {
    id: 'seed-r-hygiene',
    org_id: COGNITION_ORG_ID,
    name: 'Pipeline Hygiene',
    cadence: 'daily',
    time_of_day: '08:45:00',
    prompt_template: 'Find stale opportunities and assign next actions.',
    skills_invoked: ['pipeline-review'],
    is_active: true,
  },
  {
    id: 'seed-r-prep',
    org_id: COGNITION_ORG_ID,
    name: 'Call Prep',
    cadence: 'daily',
    time_of_day: null,
    prompt_template: 'Prepare the next prospect brief.',
    skills_invoked: ['call-prep', 'client-onepager'],
    is_active: true,
  },
  {
    id: 'seed-r-followup',
    org_id: COGNITION_ORG_ID,
    name: 'Post-Disc Followup',
    cadence: 'daily',
    time_of_day: null,
    prompt_template: 'Draft the next follow-up from call context.',
    skills_invoked: ['post-disc-followup', 'outreach'],
    is_active: true,
  },
  {
    id: 'seed-r-scoring',
    org_id: COGNITION_ORG_ID,
    name: 'Rep Scoring',
    cadence: 'weekly',
    time_of_day: null,
    prompt_template: 'Score recent sales conversations.',
    skills_invoked: ['sales-rep-analyzer'],
    is_active: true,
  },
  {
    id: 'seed-r-weekly',
    org_id: COGNITION_ORG_ID,
    name: 'Weekly Pipeline Review',
    cadence: 'weekly',
    time_of_day: null,
    prompt_template: 'Review conversion and stalled deals.',
    skills_invoked: ['pipeline-review', 'win-loss-analysis'],
    is_active: true,
  },
  {
    id: 'seed-r-monthly',
    org_id: COGNITION_ORG_ID,
    name: 'Monthly Intelligence Report',
    cadence: 'monthly',
    time_of_day: null,
    prompt_template: 'Extract recurring patterns from the month.',
    skills_invoked: ['win-loss-analysis', 'monthly-intelligence'],
    is_active: false,
  },
];

const events: CognEvent[] = [
  { id: 'e-1', event_type: 'routine_run', member: 'morning', payload: { routine_id: 'seed-r-morning', duration_ms: 4200 }, created_at: '2026-08-11T08:00:04Z' },
  { id: 'e-2', event_type: 'routine_run', member: 'hygiene', payload: { routine_id: 'seed-r-hygiene', stale_deals: 3 }, created_at: '2026-08-11T08:45:02Z' },
  { id: 'e-3', event_type: 'skill_invoked', member: 'pipeline-review', payload: { mode: 'morning' }, created_at: '2026-08-11T08:00:11Z' },
  { id: 'e-4', event_type: 'skill_invoked', member: 'call-prep', payload: { prospect: 'Itay' }, created_at: '2026-08-11T11:55:30Z' },
  { id: 'e-5', event_type: 'gate_armed', member: null, payload: { floor: 0.62, score: 0.84 }, created_at: '2026-08-10T22:14:11Z' },
  { id: 'e-6', event_type: 'manifest_published', member: null, payload: { graph_version: '1.4.0', source_scope: 'cognition' }, created_at: '2026-08-10T22:14:00Z' },
  { id: 'e-7', event_type: 'win_loss_analysis', member: null, payload: { deals_analyzed: 4, won: 1, lost: 1 }, created_at: '2026-08-10T18:00:08Z' },
  { id: 'e-8', event_type: 'routine_paused', member: 'monthly-intelligence', payload: { reason: 'awaiting new source corpus' }, created_at: '2026-08-09T09:12:00Z' },
  { id: 'e-9', event_type: 'skill_invoked', member: 'sales-rep-analyzer', payload: { conversations: 7 }, created_at: '2026-08-09T15:00:00Z' },
  { id: 'e-10', event_type: 'routine_run', member: 'morning', payload: { routine_id: 'seed-r-morning', duration_ms: 4001 }, created_at: '2026-08-10T08:00:03Z' },
  { id: 'e-11', event_type: 'routine_run', member: 'morning', payload: { routine_id: 'seed-r-morning', duration_ms: 3998 }, created_at: '2026-08-09T08:00:02Z' },
  { id: 'e-12', event_type: 'routine_run', member: 'morning', payload: { routine_id: 'seed-r-morning', duration_ms: 4102 }, created_at: '2026-08-08T08:00:01Z' },
];

const manifest: Manifest = {
  id: 'seed-manifest-1',
  org_id: COGNITION_ORG_ID,
  graph_version: '1.4.0',
  source_scope: 'cognition · sales · people',
  knowledge_sovereignty_score: 0.84,
  next_review_at: '2026-09-10T00:00:00Z',
};

const eventTypeCounts: EventTypeCount[] = (() => {
  const grouped: Record<string, number> = {};
  for (const e of events) {
    grouped[e.event_type] = (grouped[e.event_type] ?? 0) + 1;
  }
  return Object.entries(grouped).map(([eventType, count]) => ({ eventType, count }));
})();

export const localSeed = { routines, events, manifest, eventTypeCounts };
