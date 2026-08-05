/**
 * it-rd seed — 4 collections used by the new sections (Journal, Boucles,
 * Drift, Evals). Registered alongside the canonical CMS seed without
 * touching it. Run once via registerItRdSeed() from ItRdApp.tsx.
 *
 * Each entry is a single fact that could have been logged by an agent or a
 * human operator. The projection state in `it_journal.projects` is a
 * frozen-in-time snapshot of the system state AFTER the event was applied —
 * the Journal section reads the latest one to render the projected state.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Journal — append-only log + projection snapshot per event ═══ */

const journalDef = def({
  id: 'it_journal', name: 'Journal', singular: 'Journal Entry', accent: '#7c3aed',
  titleField: 'title', subtitleField: 'actor', badgeField: 'action',
  fields: [
    { key: 'actor', label: 'Actor', type: 'text' },
    { key: 'action', label: 'Action', type: 'badge' },
    { key: 'entity', label: 'Entity touched', type: 'text' },
    { key: 'ts', label: 'Timestamp', type: 'text' },
    { key: 'outcome', label: 'Outcome', type: 'badge' },
    { key: 'projects', label: 'Projected state', type: 'longtext' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const journalItems: CmsItem[] = [
  {
    id: 'jrn-001',
    title: 'Deploy b933e4e — coach dashboard',
    actor: 'agent:ci-runner',
    action: 'deploy',
    entity: 'coach dashboard',
    ts: '2026-08-05 09:42',
    outcome: 'ready',
    projects: 'coach dashboard@b933e4e = READY · 0 regressions · 0 alerts',
    note: 'Production promotion of commit b933e4e. All health checks green at T+15min. No follow-up needed.',
  },
  {
    id: 'jrn-002',
    title: 'P95 latency drift — supabase-omk-saas',
    actor: 'agent:drift-watcher',
    action: 'drift',
    entity: 'supabase-omk-saas',
    ts: '2026-08-05 06:11',
    outcome: 'open',
    projects: 'open drifts = 3 (p95 latency, voice fidelity, auto-brief acceptance) · 1 threshold exceeded',
    note: 'Detection of p95 latency climbing to 78ms against 40ms reference. Threshold 50ms — exceeds since 04:00, flagged for triage.',
  },
  {
    id: 'jrn-003',
    title: 'Zero-PII panic lock — unknown integration',
    actor: 'agent:zero-pii-watch',
    action: 'lock',
    entity: 'edge / egress',
    ts: '2026-08-05 03:57',
    outcome: 'sealed',
    projects: 'egress = sealed · last open channel = 0 · integrations blocked = 1',
    note: 'Integration request to an endpoint not on the allowlist. Zero-PII seal auto-engaged, no data left the perimeter. Operator notified.',
  },
  {
    id: 'jrn-004',
    title: 'Eval run — quiz scoring v2',
    actor: 'agent:eval-runner',
    action: 'eval',
    entity: 'audit-quiz-scoring',
    ts: '2026-08-04 22:30',
    outcome: 'completed',
    projects: 'last eval = 92% (92/100) · loop quiz-scoring = stable',
    note: '100 trials run. 92 pass, 6 borderline, 2 failures (both explicable: edge case in lead scoring weights).',
  },
  {
    id: 'jrn-005',
    title: 'Auto-brief acceptance loop correction',
    actor: 'agent:loop-controller',
    action: 'correction',
    entity: 'auto-brief-acceptance',
    ts: '2026-08-04 18:14',
    outcome: 'applied',
    projects: 'auto-brief acceptance = 68% (was 65%) · threshold = 70% · loop correction_count = 4',
    note: 'Controller raised the prompt-weight on context hint after third consecutive failure. Acceptance recovered 3 points, still below threshold.',
  },
  {
    id: 'jrn-006',
    title: 'Rollback deploy-4de88ab — agent runtime',
    actor: 'human:amdkn',
    action: 'rollback',
    entity: 'agent runtime',
    ts: '2026-08-04 11:02',
    outcome: 'rolled-back',
    projects: 'agent runtime@4de88ab = rolled-back · last green = a7c1f02',
    note: 'Manual rollback after deploy 4de88ab surfaced a regression in supervisor dispatch. Previous green a7c1f02 restored.',
  },
  {
    id: 'jrn-007',
    title: 'Wake event — onboarding-agent',
    actor: 'agent:scheduler',
    action: 'wake',
    entity: 'onboarding-agent',
    ts: '2026-08-04 08:00',
    outcome: 'running',
    projects: 'active agents = 2 · queues drained = 3 · pending = 0',
    note: 'Scheduled wake. Three queued onboarding tasks processed (Ava Chen step 6, Priya Nandan step 4, Studio Nord re-engagement). No anomalies.',
  },
];

/* ═══ Boucles — feedback loops with their 4 organs + state ═══ */

const loopsDef = def({
  id: 'it_loops', name: 'Boucles', singular: 'Boucle', accent: '#7c3aed',
  titleField: 'name', subtitleField: 'state', badgeField: 'state',
  fields: [
    { key: 'state', label: 'State', type: 'badge' },
    { key: 'metric', label: 'Metric', type: 'text' },
    { key: 'capteur', label: 'Capteur', type: 'longtext' },
    { key: 'consigne', label: 'Consigne', type: 'longtext' },
    { key: 'controleur', label: 'Contrôleur', type: 'longtext' },
    { key: 'actionneur', label: 'Actionneur', type: 'longtext' },
    { key: 'target', label: 'Setpoint', type: 'text' },
    { key: 'tolerance', label: 'Tolerance', type: 'text' },
    { key: 'lastAction', label: 'Last action', type: 'text' },
    { key: 'lastActionAt', label: 'Last action at', type: 'text' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const loopsItems: CmsItem[] = [
  {
    id: 'loop-zero-pii',
    name: 'Egress sealing',
    state: 'stable',
    metric: 'unauthorized egress / day',
    capteur: 'eBPF filter on every outbound connection — matches against the allowlist / denylist.',
    consigne: '0 egress per day, full stop. Any unauthorized request must be blocked before data leaves.',
    controleur: 'Zero-PII panic-lock controller — counts blocked attempts, escalates to operator if pattern recurs.',
    actionneur: 'Edge gateway: drop the request, log the source, panic-lock the egress if anything tries to write.',
    target: '0 / day',
    tolerance: '0',
    lastAction: 'panic-lock at 03:57 — unknown integration',
    lastActionAt: '2026-08-05 03:57',
    note: 'Loop has been stable for 41 days. The single intervention this week was correctly identified as probing, not a fault.',
  },
  {
    id: 'loop-drift',
    name: 'Drift limiter',
    state: 'drift',
    metric: 'current deviation vs reference',
    capteur: 'Drift-watcher agent — re-measures every metric against its reference on a 6h cadence.',
    consigne: 'All managed metrics within 5% of reference. Anything outside the band opens a journal entry.',
    controleur: 'Threshold logic — escalates alert level when 3 consecutive measurements exceed tolerance.',
    actionneur: 'Posts a journal entry tagged `drift`, pages the on-call if the value crosses the alert threshold.',
    target: '≤ 5% deviation',
    tolerance: '5%',
    lastAction: 'opened 3 drift entries (p95 latency, voice fidelity, auto-brief acceptance)',
    lastActionAt: '2026-08-05 06:11',
    note: 'Loop is in drift state — three open entries older than 24h. One (p95 latency) has crossed the alert threshold.',
  },
  {
    id: 'loop-eval-quality',
    name: 'Eval quality gate',
    state: 'stable',
    metric: 'pass rate on the rolling 100 trials',
    capteur: 'Eval runner — runs the eval suite on every code change.',
    consigne: '≥ 90% pass rate on the rolling 100 trials. Below 90% blocks the deploy.',
    controleur: 'Statistical controller — distinguishes regressions from noise (z-score on the delta).',
    actionneur: 'Marks the deploy as `blocked`, posts a journal entry, opens a drift entry if the regression persists.',
    target: '≥ 90%',
    tolerance: '± 2%',
    lastAction: 'blocked 1 deploy (4de88ab) on regression',
    lastActionAt: '2026-08-04 11:02',
    note: 'Loop is doing exactly its job. The block on 4de88ab caught the regression before it reached production.',
  },
  {
    id: 'loop-budget',
    name: 'Budget guard',
    state: 'stable',
    metric: 'spend vs monthly cap',
    capteur: 'Cost meter — pulls Stripe + Vercel + Supabase + OpenRouter hourly.',
    consigne: '≤ $250 / month. Above 90% triggers a watch state; above 100% triggers an alert.',
    controleur: 'Rolling average controller — distinguishes a one-off spike from a sustained trend.',
    actionneur: 'Posts a journal entry on the watch state, alerts the operator on the alert state.',
    target: '≤ $250 / month',
    tolerance: '± $25',
    lastAction: 'watch state opened (84% of cap on day 28)',
    lastActionAt: '2026-08-03 14:00',
    note: 'Loop is in watch state, not alert. The trend is on track to close the month at $239 — under cap.',
  },
  {
    id: 'loop-deploy',
    name: 'Deploy readiness',
    state: 'stable',
    metric: 'time-to-green on the build pipeline',
    capteur: 'CI pipeline — build, test, deploy, verify checkpoints.',
    consigne: 'All checkpoints green within 18 minutes. Anything longer counts as a regression.',
    controleur: 'Time-budget controller — compares the current run to the rolling 10-run average.',
    actionneur: 'Promotes the deploy on green, rolls back on red, posts a journal entry if the time budget is exceeded.',
    target: '≤ 18 min',
    tolerance: '± 3 min',
    lastAction: 'promoted b933e4e in 14m22s',
    lastActionAt: '2026-08-05 09:42',
    note: 'Loop is stable. The latest run was under budget; no intervention needed.',
  },
  {
    id: 'loop-voice-fidelity',
    name: 'Voice fidelity guard',
    state: 'drift',
    metric: 'voice-clone similarity score',
    capteur: 'Voice-clone eval — runs every Friday on the 50-trial audio benchmark.',
    consigne: '≥ 0.90 similarity score on the rolling 50 trials. Below 0.90 opens a drift entry.',
    controleur: 'Trend controller — flags when the score has dropped for 2 consecutive weeks.',
    actionneur: 'Opens a drift entry, suggests a fine-tune run, but does NOT block production.',
    target: '≥ 0.90',
    tolerance: '± 0.02',
    lastAction: 'drift entry opened (0.88 vs 0.91 reference)',
    lastActionAt: '2026-08-01 16:00',
    note: 'Loop is in drift. The controller has flagged the trend but the actionneur has not been triggered — fine-tune optional.',
  },
];

/* ═══ Drift — gap between model spec and actual behavior ═══ */

const driftDef = def({
  id: 'it_drift', name: 'Drift', singular: 'Drift Entry', accent: '#7c3aed',
  titleField: 'name', subtitleField: 'metric', badgeField: 'severity',
  fields: [
    { key: 'metric', label: 'Metric', type: 'text' },
    { key: 'severity', label: 'Severity', type: 'badge' },
    { key: 'reference', label: 'Reference', type: 'text' },
    { key: 'current', label: 'Current', type: 'text' },
    { key: 'detected', label: 'Detected', type: 'text' },
    { key: 'threshold', label: 'Alert threshold', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'method', label: 'Detection method', type: 'text' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const driftItems: CmsItem[] = [
  {
    id: 'drift-p95-latency',
    name: 'p95 read latency — supabase-omk-saas',
    metric: '+95% over reference',
    severity: 'drift',
    reference: '40 ms',
    current: '78 ms',
    detected: '2026-08-05 06:11',
    threshold: '50 ms',
    unit: 'ms',
    method: 'drift-watcher, 6h cadence',
    note: 'Detected during the 06:00 sweep. Read latency climbed past the alert threshold at 04:00. No incident reported by tenants yet. Owner: data infra.',
  },
  {
    id: 'drift-voice-fidelity',
    name: 'Voice-clone similarity score',
    metric: '−3.3% under reference',
    severity: 'drift',
    reference: '0.91',
    current: '0.88',
    detected: '2026-08-01 16:00',
    threshold: '0.90',
    unit: 'score',
    method: 'weekly voice-eval, 50 trials',
    note: 'Second consecutive week below the setpoint. The model is holding up functionally but the fine-tune is overdue. Suggest scheduling a tune-up on the next quiet cycle.',
  },
  {
    id: 'drift-auto-brief',
    name: 'Auto-brief acceptance rate',
    metric: '−15 points under setpoint',
    severity: 'drift',
    reference: '80%',
    current: '65%',
    detected: '2026-08-04 10:00',
    threshold: '70%',
    unit: '%',
    method: 'rolling 100 briefs, weekly',
    note: 'Acceptance rate has been below the threshold for 3 days. The loop controller has applied 4 corrections, lifting the rate from 65% to 68% — still not enough. Probable cause: stale prompt context.',
  },
  {
    id: 'drift-eval-quiz',
    name: 'Audit quiz scoring accuracy',
    metric: '−8 points under reference',
    severity: 'drift',
    reference: '92%',
    current: '84%',
    detected: '2026-07-28 14:00',
    threshold: '85%',
    unit: '%',
    method: 'eval-runner, 100 trials',
    note: 'Two consecutive eval runs below reference. The failures share a pattern: trial cases where the lead score is on a boundary. Re-evaluate the weighting on the 6-signal scoring.',
  },
  {
    id: 'drift-egress-attempts',
    name: 'Unauthorized egress attempts',
    metric: '> 0 (setpoint breached)',
    severity: 'drift',
    reference: '0 / day',
    current: '2 / day',
    detected: '2026-08-05 03:57',
    threshold: '0 / day',
    unit: 'attempts',
    method: 'eBPF egress filter',
    note: 'Two probe attempts in the last 24h. Both blocked by the seal. Probe 1: unknown integration; probe 2: misconfigured webhook. No data left the perimeter.',
  },
  {
    id: 'drift-queue-depth',
    name: 'Agent runtime queue depth',
    metric: '+0 depth (setpoint met)',
    severity: 'ok',
    reference: '≤ 1',
    current: '3',
    detected: '2026-08-05 09:42',
    threshold: '5',
    unit: 'jobs',
    method: 'agent-runtime heartbeat',
    note: 'Queue depth is above the rolling median but below the alert threshold. Drift-watcher has opened a watch entry. Manual intervention not required.',
  },
];

/* ═══ Evals — evaluations of the system ═══ */

const evalsDef = def({
  id: 'it_evals', name: 'Evals', singular: 'Eval', accent: '#7c3aed',
  titleField: 'name', subtitleField: 'rate', badgeField: 'evalType',
  fields: [
    { key: 'rate', label: 'Pass rate', type: 'text' },
    { key: 'evalType', label: 'Type', type: 'badge' },
    { key: 'trials', label: 'Trials', type: 'number' },
    { key: 'distribution', label: 'Distribution (pass / borderline / fail)', type: 'text' },
    { key: 'failures', label: 'Explicable failures', type: 'longtext' },
    { key: 'ranAt', label: 'Ran at', type: 'text' },
    { key: 'note', label: 'Note', type: 'longtext' },
  ],
});

const evalsItems: CmsItem[] = [
  {
    id: 'eval-quiz-scoring-v2',
    name: 'Quiz scoring v2 — 6-signal audit',
    rate: '92% (92 / 100)',
    evalType: 'auto',
    trials: 100,
    distribution: '92 / 6 / 2',
    ranAt: '2026-08-04 22:30',
    failures: 'Trial 47: lead scored 51 instead of 68 (delegation-gap signal underweighted). Trial 83: lead scored 73 instead of 81 (booked-out ratio misread). Both are explainable by the 6-signal weighting in the spec.',
    note: 'Run on the rolling 100 trial suite. Two failures are within the explicable-failure budget. No regression vs last run.',
  },
  {
    id: 'eval-voice-tone',
    name: 'Voice tone match — outreach drafts',
    rate: '78% (23 / 30)',
    evalType: 'review',
    trials: 30,
    distribution: '23 / 5 / 2',
    ranAt: '2026-08-03 11:00',
    failures: 'Awaiting human review. The 2 hard failures are drafts where the agent invented a metric not in the source session — exact match to the v0.8 known-issue list.',
    note: 'Touch-tone eval: 30 drafts sampled, 23 matched the coach voice without correction. Pending a human review pass on the 5 borderline cases before the 2 failures are classified.',
  },
  {
    id: 'eval-auto-brief',
    name: 'Auto-brief context completeness',
    rate: '88% (44 / 50)',
    evalType: 'auto',
    trials: 50,
    distribution: '44 / 4 / 2',
    ranAt: '2026-08-04 18:14',
    failures: 'Trial 12: brief omitted the client\'s 30-day check-in note. Trial 28: brief dropped the pricing-objection thread. Both failures share a routing gap when the calendar event description is sparse.',
    note: 'Acceptance test on the auto-brief pipeline. 88% pass rate is below the 90% setpoint, matches the open drift entry on auto-brief acceptance.',
  },
  {
    id: 'eval-rls-probe',
    name: 'RLS isolation — multi-tenant probe',
    rate: '100% (200 / 200)',
    evalType: 'auto',
    trials: 200,
    distribution: '200 / 0 / 0',
    ranAt: '2026-08-05 02:00',
    failures: 'None. All 200 cross-tenant probes were correctly blocked by the RLS policy. Both the omk_saas and omk_internal schemas pass the adversarial test.',
    note: 'Critical security eval. Run nightly on the 200-probe adversarial suite. No failures in 14 consecutive runs.',
  },
  {
    id: 'eval-hallucination',
    name: 'Hallucination probe — agent responses',
    rate: 'pending review',
    evalType: 'review',
    trials: 15,
    distribution: '12 / 0 / 3',
    ranAt: '2026-08-04 09:00',
    failures: 'Cases where the agent cited a metric not in the source data. 3 such cases in the 15-trial sample. Awaiting human review to classify as hallucination vs extrapolation.',
    note: 'Smaller sample (15 trials) because every trial needs a human review. Sample size increases next week once the routing pattern stabilises.',
  },
  {
    id: 'eval-reward-model',
    name: 'Reward model — preference match',
    rate: '81% (61 / 75)',
    evalType: 'auto',
    trials: 75,
    distribution: '61 / 9 / 5',
    ranAt: '2026-08-04 23:45',
    failures: '5 failures are preference-boundary cases where the model picked the higher-confidence option but the human reviewer would have preferred the lower-confidence one. No pattern across the 5 — likely irreducible noise.',
    note: '81% is below the 90% setpoint but the loop has not flagged this as a regression (the same delta has held for 3 weeks). Acceptable within the noise band.',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function registerItRdSeed(): void {
  if (seeded) return;
  seeded = true;
  useCmsStore.getState().registerCollection(journalDef, journalItems);
  useCmsStore.getState().registerCollection(loopsDef, loopsItems);
  useCmsStore.getState().registerCollection(driftDef, driftItems);
  useCmsStore.getState().registerCollection(evalsDef, evalsItems);
}
