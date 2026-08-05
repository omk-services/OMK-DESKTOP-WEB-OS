/** OperationsApp — local seed for the four sections added on top of the
 *  existing runbooks / knowledge / incidents / context-layer surfaces.
 *
 *  Each collection follows the same `def` + `items` + `registerCollection`
 *  contract as `src/lib/cms/seed.ts`, but lives here so the operations app
 *  stays self-contained. `seedOperationsCms()` is called once at module load
 *  from OperationsApp.tsx — idempotent thanks to `registerCollection`'s
 *  early-return guard.
 *
 *  Design notes:
 *   - Every entry is concrete (real-looking owner, dates, percentages). No
 *     "Item 1 / Item 2" placeholders.
 *   - Tone carries domain meaning (severity → warn/danger/ok; benchmark →
 *     passed/failed/flaky; change status → proposed/approved/rejected).
 *   - Alertes always carry a "trace" (enriched entries include hypothesis +
 *     risk score; raw entries carry only the trace excerpt).
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Processus — cartography of the org's recurring processes ═══ */

const processesDef = def({
  id: 'processes', name: 'Processes', singular: 'Process', accent: '#4f46e5',
  titleField: 'name', subtitleField: 'category', badgeField: 'status',
  fields: [
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'inputs', label: 'Inputs', type: 'text' },
    { key: 'outputs', label: 'Outputs', type: 'text' },
    { key: 'dependsOn', label: 'Depends on', type: 'text' },
    { key: 'cadence', label: 'Cadence', type: 'text' },
    { key: 'edgeCases', label: 'Edge cases', type: 'longtext' },
  ],
});

const processesItems: CmsItem[] = [
  {
    id: 'proc-client-onboarding',
    name: 'Client onboarding — 7 steps',
    category: 'Onboarding',
    status: 'live',
    owner: 'Léo Martin',
    inputs: 'Signed contract · welcome call notes · Zero-PII scope',
    outputs: 'Live Citadelle instance · first session brief · 30-day check-in slot',
    dependsOn: 'Contract drafting · Zero-PII provisioning · Calendar sync',
    cadence: 'On demand (per new client)',
    edgeCases: 'If Zero-PII provisioning stalls past 24h, escalate to the on-call ops and switch the client to a manual welcome. If the contract is signed but the welcome call is missed twice, pause the sequence and route to retention.',
  },
  {
    id: 'proc-monthly-close',
    name: 'Monthly close — finance ops',
    category: 'Finance ops',
    status: 'live',
    owner: 'Sasha Mendes',
    inputs: 'Stripe ledger · invoice status · past-due accounts',
    outputs: 'Closed P&L · month-end report · flag list for follow-up',
    dependsOn: 'Stripe reconciliation · Invoice status check · Export pipeline',
    cadence: 'Monthly — 1st business day',
    edgeCases: 'If Stripe reconciliation reports > 1% delta, hold the close and request a manual review. If a past-due account is older than 60 days, escalate to retention before closing the month.',
  },
  {
    id: 'proc-session-capture',
    name: 'Session transcript capture',
    category: 'Knowledge',
    status: 'live',
    owner: 'Priya Nandan',
    inputs: 'Session recording · client metadata · vault tag rules',
    outputs: 'Structured session note · IP-vault entry · follow-up task list',
    dependsOn: 'Voice-clone fidelity test · Vault storage · Calendar sync',
    cadence: 'Continuous (every booked session)',
    edgeCases: 'If the voice-clone fidelity drifts below the threshold, fall back to manual transcription. If vault storage approaches 90% capacity, archive old sessions before the next write.',
  },
  {
    id: 'proc-incident-triage',
    name: 'Incident triage — watchdog',
    category: 'Security',
    status: 'live',
    owner: 'Jules Royer',
    inputs: 'Watchdog alert · enrichment payload (if any) · on-call roster',
    outputs: 'Triaged incident · runbook activation · post-mortem if post-mortem-grade',
    dependsOn: 'Zero-PII seal · Compliance ledger · Enrichment agent',
    cadence: 'Continuous (per alert)',
    edgeCases: 'If the alert is "raw" (no enrichment), block for manual triage before any auto-action. If the on-call roster has no primary, escalate to the secondary immediately and notify the operations lead.',
  },
  {
    id: 'proc-calendar-sync',
    name: 'Calendar sync — Calendly → Vault',
    category: 'Support',
    status: 'live',
    owner: 'Anna Bauer',
    inputs: 'Calendly webhook · session metadata · client identity',
    outputs: 'Booked session entry · auto-brief draft · reminder pipeline',
    dependsOn: 'Calendly integration · Voice-clone fidelity · Vault storage',
    cadence: 'Continuous (per booking)',
    edgeCases: 'If the Calendly webhook retries more than 3 times, pause the sync and notify the on-call. If the auto-brief draft returns empty, route the session to manual brief creation.',
  },
  {
    id: 'proc-quarterly-renewal',
    name: 'Quarterly renewal',
    category: 'Sales',
    status: 'live',
    owner: 'Marc Lefèvre',
    inputs: 'Renewal-eligible clients · health score · upsell candidate list',
    outputs: 'Renewal call schedule · updated contract · upsell pipeline entry',
    dependsOn: 'Monthly close · Client health score · Voice-clone fidelity',
    cadence: 'Quarterly (1 week before quarter close)',
    edgeCases: 'If a renewal-eligible client has health score below 50, route to retention before scheduling the renewal call. If the upsell pipeline is already saturated, skip the upsell block and focus on retention.',
  },
];

/* ═══ Benchmarks — tests that can say no ═══ */

const benchmarksDef = def({
  id: 'benchmarks', name: 'Benchmarks', singular: 'Benchmark', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'target', badgeField: 'status',
  fields: [
    { key: 'target', label: 'What it checks', type: 'text' },
    { key: 'difficulty', label: 'Difficulty', type: 'text' },
    { key: 'passRate', label: 'Pass rate', type: 'number' },
    { key: 'lastRun', label: 'Last run', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'failureMode', label: 'Failure mode', type: 'longtext' },
  ],
});

const benchmarksItems: CmsItem[] = [
  {
    id: 'bench-quiz-scoring',
    title: 'Quiz scoring accuracy',
    target: '6-signal diagnostic scoring vs. human labels',
    difficulty: 'Hard',
    passRate: 100,
    lastRun: '2h ago',
    status: 'passed',
    failureMode: 'If pass rate drops below 95%, the signal weights are stale — re-run the labelling pass and recalibrate. Below 80% is a P1 incident.',
  },
  {
    id: 'bench-rls-isolation',
    title: 'Multi-tenant RLS isolation',
    target: 'Org A cannot read Org B rows',
    difficulty: 'Brutal',
    passRate: 100,
    lastRun: '4h ago',
    status: 'passed',
    failureMode: 'A single failure is a P0 — the multi-tenant security boundary is the JWT org_id claim. Any drift must trigger immediate lockdown and manual audit.',
  },
  {
    id: 'bench-stripe-idempotency',
    title: 'Stripe webhook idempotency',
    target: 'Replayed webhook produces no duplicate side effects',
    difficulty: 'Medium',
    passRate: 92,
    lastRun: '6h ago',
    status: 'flaky',
    failureMode: 'When flaky, the dedup table is dropping entries under contention. Recovery: backfill dedup table, raise the lock timeout, and re-run. If the flaky rate crosses 80%, file as P2.',
  },
  {
    id: 'bench-voice-fidelity',
    title: 'Voice-clone fidelity',
    target: 'MOS ≥ 4.2 against held-out clips',
    difficulty: 'Brutal',
    passRate: 71,
    lastRun: '1d ago',
    status: 'failed',
    failureMode: 'Below 80% means the cloned voice has noticeable artefacts — fall back to manual transcription for any outbound copy. The failure correlates with the v3 retraining; pause the rollout until pass rate recovers.',
  },
  {
    id: 'bench-compliance-export',
    title: 'Compliance export regeneration',
    target: 'Re-running the audit pack matches the prior run byte-for-byte',
    difficulty: 'Hard',
    passRate: 100,
    lastRun: '12h ago',
    status: 'passed',
    failureMode: 'A mismatch means the audit pack is non-reproducible — this is a regulator-grade failure. Pause the export pipeline, freeze the diff, and escalate to the security lead.',
  },
  {
    id: 'bench-edge-cold-start',
    title: 'Edge function cold start',
    target: 'p95 cold-start ≤ 800ms across regions',
    difficulty: 'Medium',
    passRate: 87,
    lastRun: '30min ago',
    status: 'flaky',
    failureMode: 'Flaky bursts cluster around eu-west-1 between 04:00 and 06:00 UTC. Recovery: pre-warm the function in the impacted region and lower the cold-start budget to 600ms until stable.',
  },
];

/* ═══ Changements — proposed by agents, awaiting human decision ═══ */

const changesDef = def({
  id: 'changes', name: 'Changes', singular: 'Change', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'summary', badgeField: 'status',
  fields: [
    { key: 'summary', label: 'Summary', type: 'text' },
    { key: 'why', label: 'Why', type: 'longtext' },
    { key: 'risk', label: 'Risk', type: 'badge' },
    { key: 'policy', label: 'Policy', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'proposedBy', label: 'Proposed by', type: 'text' },
  ],
});

const changesItems: CmsItem[] = [
  {
    id: 'change-vault-tag-search',
    title: 'Add tag-based search to the IP Vault',
    summary: 'Find a vault entry by tag, faster than the current substring scan',
    why: 'The substring scan is fine for 100 entries but degrades past 1k. Three coaches reported 4-second wait times on their largest vaults. Tag indexing reduces p95 to under 200ms.',
    risk: 'low',
    policy: 'ADR-OPS-013',
    status: 'proposed',
    proposedBy: 'Knowledge Agent',
  },
  {
    id: 'change-calendly-native-sync',
    title: 'Move Calendly sync to a native webhook',
    summary: 'Drop the polling fallback, replace with native webhook delivery',
    why: 'Polling wastes 1.4k calls/day on empty calendars. Native webhooks cut cost and remove the 60-second lag between booking and the auto-brief draft.',
    risk: 'med',
    policy: 'ADR-OPS-007',
    status: 'proposed',
    proposedBy: 'Integration Agent',
  },
  {
    id: 'change-rollback-voice-v3',
    title: 'Roll back voice-clone v3',
    summary: 'Revert to v2 model until v3 fidelity recovers',
    why: 'Voice-clone v3 is failing the fidelity benchmark (71% pass rate). Until it recovers, every outbound copy uses the v2 model — cheaper and stable.',
    risk: 'low',
    policy: 'ADR-OPS-004',
    status: 'approved',
    proposedBy: 'Quality Agent',
  },
  {
    id: 'change-flaky-auto-promote',
    title: 'Auto-promote flaky benchmarks to incidents',
    summary: 'Benchmarks passing < 90% for 24h become an incident',
    why: 'Today the watchdog only sees production errors. Flaky benchmarks slip past it until they fail outright. Surfacing them earlier shortens the gap between regression and fix.',
    risk: 'med',
    policy: 'ADR-OPS-011',
    status: 'proposed',
    proposedBy: 'Watchdog Agent',
  },
  {
    id: 'change-quiz-result-disable-on-slow',
    title: 'Disable QuizResult CTA on slow networks',
    summary: 'Hide the diagnostic CTA when the network is too slow to act on it',
    why: 'Slow-network users tap the CTA, wait, and bounce. Hiding the CTA on bad networks looks better in dashboards and matches what they would have experienced anyway.',
    risk: 'low',
    policy: 'ADR-GROWTH-002',
    status: 'rejected',
    proposedBy: 'Growth Agent',
  },
  {
    id: 'change-notion-export-bundle',
    title: 'Bundle Notion Export with session notes',
    summary: 'Auto-push every session note to a Notion database the coach configures',
    why: 'Six coaches already use Notion as their second brain. Bundling removes the manual export step and lets the agents structure the notes before pushing.',
    risk: 'high',
    policy: 'ADR-OPS-009',
    status: 'proposed',
    proposedBy: 'Knowledge Agent',
  },
];

/* ═══ Alertes — pre-enriched incidents, with trace + hypothesis ═══ */

const alertsDef = def({
  id: 'alerts', name: 'Alerts', singular: 'Alert', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'when', badgeField: 'severity',
  fields: [
    { key: 'when', label: 'When', type: 'text' },
    { key: 'severity', label: 'Severity', type: 'badge' },
    { key: 'enrichment', label: 'Enrichment', type: 'badge' },
    { key: 'source', label: 'Source', type: 'text' },
    { key: 'riskScore', label: 'Risk score', type: 'text' },
    { key: 'hypothesis', label: 'Hypothesis', type: 'longtext' },
    { key: 'trace', label: 'Trace', type: 'longtext' },
  ],
});

const alertsItems: CmsItem[] = [
  {
    id: 'alert-edge-cold-start',
    title: 'Edge function cold start > 4s',
    when: '07:42',
    severity: 'warn',
    enrichment: 'enriched',
    source: 'Edge · sign-up-organization',
    riskScore: '0.42',
    hypothesis: 'Likely a cold region — eu-west-1 has been flaky on cold starts for the past 24h. The benchmark matches. No user impact yet, but the function is borderline against the 800ms p95 budget.',
    trace: '07:42:01 GET /functions/v1/sign-up-organization 5.21s 200\n07:42:09 GET /functions/v1/sign-up-organization 4.83s 200\n07:42:14 GET /functions/v1/sign-up-organization 5.07s 200\n07:42:21 GET /functions/v1/sign-up-organization 4.41s 200',
  },
  {
    id: 'alert-stripe-retry',
    title: 'Stripe webhook retry burst',
    when: '07:11',
    severity: 'warn',
    enrichment: 'enriched',
    source: 'Stripe · billing.invoice.paid',
    riskScore: '0.18',
    hypothesis: 'Transient timeout on the receiving side. The retry succeeded on attempt 2 — no client impact. Pattern matches the known idempotency flaky benchmark.',
    trace: '07:11:03 POST /webhooks/stripe 504 (timeout 2.00s)\n07:11:34 POST /webhooks/stripe 200 (retry 2 of 5)',
  },
  {
    id: 'alert-unknown-useragent',
    title: 'Unknown user-agent blocked',
    when: '06:58',
    severity: 'danger',
    enrichment: 'raw',
    source: 'Edge · egress proxy',
    riskScore: '0.91',
    hypothesis: 'No hypothesis yet — the alert arrived raw. Needs manual triage before any auto-action.',
    trace: '06:58:12 GET /egress/<redacted> 403\n  user_agent: <unknown, length 312>\n  origin: <redacted, 47.91.x.x>',
  },
  {
    id: 'alert-memory-threshold',
    title: 'Memory threshold > 90%',
    when: '05:30',
    severity: 'warn',
    enrichment: 'enriched',
    source: 'Supabase · omk_saas',
    riskScore: '0.55',
    hypothesis: 'Memory crept past 90% after a vault-import batch. The auto-archiver should bring it back under 80% within the next 2h. If not, escalate to ops lead.',
    trace: '05:30:00 vault.ingest batch=42 size=812MB\n05:32:00 supabase.memory 91.4% (warn)\n05:34:00 archive.daemon triggered',
  },
  {
    id: 'alert-brief-email-failed',
    title: 'Failed to send session brief email',
    when: 'Yesterday 22:15',
    severity: 'danger',
    enrichment: 'raw',
    source: 'Voice · outbound mailer',
    riskScore: '0.74',
    hypothesis: 'No hypothesis yet — the alert arrived raw. The mailer returned a 550 response, but the recipient address is redacted in the log.',
    trace: '22:15:08 POST /mailer/send 550\n  recipient: <redacted>\n  template_id: session_brief_v2\n  attempt: 1 of 3',
  },
  {
    id: 'alert-voice-fidelity-drift',
    title: 'Voice-clone fidelity drift',
    when: 'Yesterday 18:02',
    severity: 'warn',
    enrichment: 'enriched',
    source: 'Voice · clone-runner',
    riskScore: '0.66',
    hypothesis: 'Drift correlated with the v3 retraining rollout. Confidence the rollback proposed in change-rollback-voice-v3 will fix this within 24h. Until then, manual fallback is active.',
    trace: '18:02:00 voice.clone.mos 3.91 (target 4.20)\n18:02:00 benchmark.voice-fidelity FAIL\n18:02:00 outbound.fallback=manual triggered',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedOperationsCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(processesDef, processesItems);
  store.registerCollection(benchmarksDef, benchmarksItems);
  store.registerCollection(changesDef, changesItems);
  store.registerCollection(alertsDef, alertsItems);
}