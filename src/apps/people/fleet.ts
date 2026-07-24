/** People/Agents — fleet data (5 AI specialists) + content library + schedule.
 *  Pattern forked from KomputerMechanic Hermes Mission Control template:
 *  - Fleet: 5 specialist agents (Orchestrator / Scout / Scribe / Reach / Dev)
 *    with state, load, latency, tokens, model (template: route-agents + AGENTS)
 *  - Content: per-agent docs (template: route-content + DEMO_CONTENT_DOCS)
 *  - Schedule: 7-day activity heatmap (template: route-schedule + HEAT) */

export interface FleetAgent {
  code: string;
  initials: string;
  name: string;
  role: string;
  channel: string;
  state: 'EXECUTING' | 'IDLE' | 'AWAITING' | 'RETRY' | 'BLOCKED';
  task: string;
  load: number;          // 0-100
  tokens: string;        // e.g. "1.24M"
  latency: string;       // e.g. "14ms" or "—"
  success: number;       // 0-100
  tasksToday: number;
  share: number;         // % of total cycles
  defaultModel: string;
  accent: string;        // hex
}

export const FLEET_AGENTS: FleetAgent[] = [
  {
    code: 'A-00', initials: 'OR', name: 'Orchestrator', role: 'Coordinator',
    channel: '#orchestrator', state: 'EXECUTING',
    task: 'Routing 14 inbound tasks to specialists',
    load: 64, tokens: '892k', latency: '12ms', success: 99.6, tasksToday: 218, share: 28,
    defaultModel: 'gpt-5.5',
    accent: '#f08143',
  },
  {
    code: 'A-01', initials: 'SC', name: 'Scout', role: 'Research',
    channel: '#scout', state: 'EXECUTING',
    task: 'Sweeping 14 sources for Q3 brief',
    load: 72, tokens: '1.24M', latency: '14ms', success: 99.9, tasksToday: 312, share: 34,
    defaultModel: 'gemma-4-free',
    accent: '#2563eb',
  },
  {
    code: 'A-02', initials: 'SB', name: 'Scribe', role: 'Writing',
    channel: '#scribe', state: 'EXECUTING',
    task: 'Drafting longform · 1840 / 2400 words',
    load: 61, tokens: '450k', latency: '118ms', success: 98.7, tasksToday: 142, share: 22,
    defaultModel: 'gpt-5-mini',
    accent: '#9333ea',
  },
  {
    code: 'A-03', initials: 'RE', name: 'Reach', role: 'Outreach',
    channel: '#reach', state: 'IDLE',
    task: 'Awaiting Scribe handoff · last cycle 4m 12s',
    load: 6, tokens: '0', latency: '—', success: 99.1, tasksToday: 96, share: 14,
    defaultModel: 'gpt-5-mini',
    accent: '#16a34a',
  },
  {
    code: 'A-04', initials: 'DV', name: 'Dev', role: 'Engineering',
    channel: '#dev', state: 'RETRY',
    task: 'cron sync · node timeout · retry 1/3',
    load: 18, tokens: '92k', latency: '—', success: 97.2, tasksToday: 68, share: 12,
    defaultModel: 'gpt-5',
    accent: '#0891b2',
  },
];

/** State meta — used by the Fleet subpage to color the state pill. */
export const STATE_META: Record<FleetAgent['state'], { label: string; color: string; bg: string; pulse: boolean }> = {
  EXECUTING: { label: 'Executing', color: '#15803d', bg: '#dcfce7', pulse: true },
  IDLE:      { label: 'Idle',      color: '#78716c', bg: '#f5f5f4', pulse: false },
  AWAITING:  { label: 'Awaiting',  color: '#b45309', bg: '#fef3c7', pulse: false },
  RETRY:     { label: 'Retry',     color: '#b91c1c', bg: '#fee2e2', pulse: true },
  BLOCKED:   { label: 'Blocked',   color: '#1d4ed8', bg: '#dbeafe', pulse: false },
};

/* ════════════════════════════════════════════════════════════════════════
 *  Content Library (template: route-content + DEMO_CONTENT_DOCS)
 * ════════════════════════════════════════════════════════════════════════ */

export interface ContentDoc {
  id: string;
  agentKey: 'orchestrator' | 'scout' | 'scribe' | 'reach' | 'dev';
  filename: string;
  title: string;
  modifiedAt: string;     // ISO
  size: number;           // bytes
  excerpt: string;
  tags: string[];
}

export const CONTENT_DOCS: ContentDoc[] = [
  {
    id: 'doc-001',
    agentKey: 'dev',
    filename: '2026-07-23_mission-control-build-notes.md',
    title: 'Mission Control — Build Notes',
    modifiedAt: '2026-07-23T08:56:46Z',
    size: 1845,
    excerpt: 'Stack: Python stdlib server, read-only on Hermes DBs. SSE live stream + agent drawer + content library. TODO: Telegram alerts, Schedule tab.',
    tags: ['build', 'infra'],
  },
  {
    id: 'doc-002',
    agentKey: 'scribe',
    filename: '2026-07-22_building-ai-agents-on-budget.md',
    title: 'Building AI Agents on a Budget',
    modifiedAt: '2026-07-22T15:18:02Z',
    size: 2540,
    excerpt: 'A short intro draft. You do not need a huge API bill to run a real multi-agent system. With a cheap VPS and a subscription model, you can route simple work to a fast model and keep the premium one for the hard stuff.',
    tags: ['content', 'budget'],
  },
  {
    id: 'doc-003',
    agentKey: 'scout',
    filename: '2026-07-22_multi-agent-trends.md',
    title: 'Multi-Agent Systems Are Trending',
    modifiedAt: '2026-07-22T11:32:18Z',
    size: 2920,
    excerpt: 'Research summary. Why now: orchestrator + specialist pattern is winning. Cheap models make routing viable. gemma-4-free + gpt-5.5 complexity routing cuts load. Sources: Hermes docs.',
    tags: ['research', 'trends'],
  },
  {
    id: 'doc-004',
    agentKey: 'reach',
    filename: '2026-07-21_outreach-cadence-playbook.md',
    title: 'Outreach Cadence Playbook',
    modifiedAt: '2026-07-21T09:14:55Z',
    size: 1670,
    excerpt: 'Day 0 → Day 2 → Day 5 → Day 10 → Day 21. Each touch has a single purpose: warm, qualify, book, close, retain. Never send the same angle twice.',
    tags: ['outreach', 'playbook'],
  },
  {
    id: 'doc-005',
    agentKey: 'orchestrator',
    filename: '2026-07-20_routing-policy.md',
    title: 'Complexity Routing Policy',
    modifiedAt: '2026-07-20T17:42:09Z',
    size: 1230,
    excerpt: 'Default: gemma-4-free. Escalate to gpt-5.5 when: plan steps > 3, code edit length > 200, or tool calls > 5. Demote to gpt-5-mini when: pure classification, single-file refactor < 50 LOC.',
    tags: ['routing', 'policy'],
  },
  {
    id: 'doc-006',
    agentKey: 'scribe',
    filename: '2026-07-19_voice-style-guide.md',
    title: 'Voice & Style Guide',
    modifiedAt: '2026-07-19T14:08:33Z',
    size: 980,
    excerpt: 'Direct, never breathless. Active voice. Concrete numbers over hand-wavy qualifiers. One idea per paragraph. Read aloud — if it sounds like marketing, rewrite.',
    tags: ['voice', 'style'],
  },
];

/* ════════════════════════════════════════════════════════════════════════
 *  Schedule (template: route-schedule + HEAT)
 *  7-day × 24-hour activity heatmap (Mon-Sun, 0h-23h)
 *  Values are normalized 0-100 per (agent, hour)
 * ════════════════════════════════════════════════════════════════════════ */

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Schedule grid: 7 days × 24 hours, value = activity 0-100 (rendered as opacity). */
export const SCHEDULE_GRID: number[][] = [
  // Mon 0..23 — higher in business hours
  [3,2,1,1,2,5,18,42,68,75,82,88,84,76,68,72,80,85,68,42,28,18,10,5],
  // Tue
  [2,1,1,1,2,4,22,48,72,80,86,90,88,80,72,78,85,82,65,38,24,16,8,4],
  // Wed
  [3,2,1,1,2,6,20,45,70,78,85,92,90,82,75,80,88,84,70,40,26,18,10,5],
  // Thu
  [2,1,1,1,2,5,24,50,74,82,88,90,86,78,70,76,82,80,62,36,22,14,7,3],
  // Fri
  [3,2,1,1,2,5,18,42,68,75,82,85,80,72,65,70,72,68,52,30,18,12,6,3],
  // Sat — much lower
  [2,1,1,1,1,2,5,8,12,15,18,22,20,18,15,12,10,8,6,4,3,2,2,1],
  // Sun
  [2,1,1,1,1,2,4,6,8,10,12,15,14,12,10,8,7,5,4,3,2,2,1,1],
];

export interface ScheduleTask {
  id: string;
  day: typeof DAYS[number];
  startHour: number;
  endHour: number;
  agent: string;
  label: string;
  kind: 'sync' | 'run' | 'audit' | 'review' | 'sync-up';
}

export const SCHEDULE_TASKS: ScheduleTask[] = [
  { id: 't-001', day: 'Mon', startHour: 9,  endHour: 11, agent: 'Orchestrator', label: 'Weekly routing audit',          kind: 'audit'  },
  { id: 't-002', day: 'Mon', startHour: 14, endHour: 16, agent: 'Scribe',       label: 'Longform draft · chapter 3',    kind: 'run'    },
  { id: 't-003', day: 'Tue', startHour: 8,  endHour: 9,  agent: 'Scout',        label: 'Source sweep (14 feeds)',       kind: 'run'    },
  { id: 't-004', day: 'Tue', startHour: 13, endHour: 14, agent: 'Reach',        label: 'Outreach batch · 22 accounts',  kind: 'run'    },
  { id: 't-005', day: 'Wed', startHour: 10, endHour: 12, agent: 'Orchestrator', label: 'Cross-agent handoff review',    kind: 'review' },
  { id: 't-006', day: 'Wed', startHour: 15, endHour: 17, agent: 'Dev',          label: 'Cron sync + retry queue',       kind: 'run'    },
  { id: 't-007', day: 'Thu', startHour: 9,  endHour: 11, agent: 'Scribe',       label: 'Editorial pass on chapter 3',   kind: 'review' },
  { id: 't-008', day: 'Fri', startHour: 11, endHour: 13, agent: 'Scout',        label: 'Trend report · weekly',         kind: 'sync'   },
  { id: 't-009', day: 'Fri', startHour: 16, endHour: 17, agent: 'All',          label: 'Weekly retro',                 kind: 'sync-up'},
];
