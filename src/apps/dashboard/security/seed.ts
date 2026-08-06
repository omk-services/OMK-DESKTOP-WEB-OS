/**
 * seed.ts — Demo data for the dashboard / security app.
 *
 * Structure mirrors the Enterprise OS blueprint (Mark Kashef) but adapted to
 * Coach OS: Bedrock -> Claude Opus/Sonnet/Haiku + open models, DynamoDB/S3 ->
 * Supabase (Postgres + Storage + Vault). Numbers are credible for a small
 * coaching practice running a multi-agent system.
 *
 * The shape of the data is fixed by the blueprint:
 *   - 42 kill switches, grouped by family
 *   - 9 DLP patterns (7 block, 2 warn)
 *   - ~31 tables, 6 buckets, 3 keys, 5 roles, 4 tiers (constant metadata)
 *   - Turn chokepoint order (rate limit -> load agent -> model kill switch ->
 *     cost cap (fail-closed) -> tool switch -> guardrail -> converse loop ->
 *     tool dispatch -> DLP scan -> audit)
 *
 * This file exports plain data + TypeScript types — no React, no side effects.
 */

export type KillSwitchFamily = 'cost' | 'safety' | 'agents' | 'tools';

export interface KillSwitch {
  id: string;
  label: string;
  family: KillSwitchFamily;
  /** One-line description of what flipping it OFF cuts. */
  cuts: string;
  /** Whether the switch is currently armed (true = behavior running). */
  on: boolean;
  /** Owner attribution. */
  setBy: string;
  /** Last flipped timestamp (human-readable). */
  lastFlipped: string;
}

export type DlpAction = 'block' | 'warn';

export interface DlpPattern {
  id: string;
  /** Regex shape (illustrative — not the live production regex). */
  pattern: string;
  /** Plain-English label shown in the UI. */
  label: string;
  /** Why it matters. */
  rationale: string;
  action: DlpAction;
  /** How many matches the scanner caught in the last 24h (demo data). */
  hitsLast24h: number;
  /** Last triggered timestamp, if any. */
  lastTriggered?: string;
}

export interface PanicState {
  active: boolean;
  releasedBy: string | null;
  releasedAt: string | null;
  reason: string | null;
  /** What gets stopped when the panic trips. */
  stops: string[];
  /** What survives (read-only paths). */
  survives: string[];
  /** Reversibility note. */
  reversal: string;
}

export interface RateLimitRow {
  id: string;
  /** Agent or surface identifier. */
  surface: string;
  /** Window (e.g. "1m", "1h", "24h"). */
  window: string;
  /** Maximum allowed calls in the window. */
  limit: number;
  /** Current usage in the window. */
  used: number;
  /** What happens at limit. */
  overflow: 'queue' | 'throttle' | 'fail-closed';
}

export type PostureLevel = 'conform' | 'partial' | 'gap';

export interface PostureCriterion {
  id: string;
  category: 'access-control' | 'audit-trail' | 'encryption' | 'monitoring' | 'data-handling';
  label: string;
  level: PostureLevel;
  /** Short note explaining the current state. */
  note: string;
}

export type ComplianceFramework = 'soc2' | 'hipaa';

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  category: string;
  label: string;
  status: 'met' | 'partial' | 'gap' | 'manual';
  detail: string;
  subChecks: string[];
  /** The remediation brief to paste into a model. */
  fixPrompt: string;
}

export interface AlertConfig {
  id: string;
  trigger: string;
  /** Threshold expression, plain text. */
  threshold: string;
  /** Channel / recipient. */
  recipient: string;
  /** Last time the alert fired. */
  lastFired: string | null;
  /** Whether the alert is enabled. */
  enabled: boolean;
}

/* ───────────────────────────── kill switches — 42 exactly ───────────────────────────── */

export const KILL_SWITCHES: KillSwitch[] = [
  // ── COST CONTROLS (10) ──────────────────────────────────────────────────────────
  { id: 'cost.bedrock-global',          label: 'bedrock global',          family: 'cost',    cuts: 'Block all Claude / open-model calls. Complete agent shutdown.',                                        on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'cost.cap-per-day',             label: 'cost cap per day',        family: 'cost',    cuts: 'Block any call once daily spend exceeds the configured cap (fail-closed).',                                on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'cost.cap-per-session',         label: 'cost cap per session',    family: 'cost',    cuts: 'Block an individual session above its ticket.',                                                           on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'cost.opus-only',               label: 'opus only',               family: 'cost',    cuts: 'Force every reasoning call to Sonnet/Haiku, drop Opus.',                                                  on: false, setBy: 'admin',     lastFlipped: '2026-07-22' },
  { id: 'cost.open-models-only',        label: 'open models only',        family: 'cost',    cuts: 'Force every call to open-weights models. Drops Claude.',                                                  on: false, setBy: 'owner',     lastFlipped: '2026-06-30' },
  { id: 'cost.supabase-billing',        label: 'supabase billing',        family: 'cost',    cuts: 'Block Supabase writes above a configured monthly spend ceiling.',                                          on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'cost.background-jobs',         label: 'background jobs',         family: 'cost',    cuts: 'Pause scheduled agents (sync, distil, backups) during the cap.',                                          on: true,  setBy: 'operator',  lastFlipped: '2026-07-30' },
  { id: 'cost.voice-claude',            label: 'voice (claude)',          family: 'cost',    cuts: 'Stop Claude voice reasoning (Jarvis becomes read-only).',                                                  on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'cost.embeddings-tier',         label: 'embeddings tier',         family: 'cost',    cuts: 'Force embeddings onto the cheap model (text-embedding-3-small substitute).',                              on: false, setBy: 'admin',     lastFlipped: '2026-07-15' },
  { id: 'cost.budget-alarm-hard',       label: 'budget alarm (hard)',     family: 'cost',    cuts: 'Treat the 80% budget alarm as a trip, not a notification.',                                               on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },

  // ── SAFETY & GUARDRAILS (12) ────────────────────────────────────────────────────
  { id: 'safety.tool-use',              label: 'tool use',                family: 'safety',  cuts: 'Block all tool dispatch. Model can still chat but cannot execute tools.',                                  on: true,  setBy: 'test-harness', lastFlipped: '2026-08-01' },
  { id: 'safety.tool-dispatch-disabled',label: 'tool dispatch disabled',  family: 'safety',  cuts: 'Granular alias for tool_use. Blocks tool execution.',                                                     on: true,  setBy: 'test-harness', lastFlipped: '2026-08-01' },
  { id: 'safety.guardrail-disabled',    label: 'guardrail disabled',      family: 'safety',  cuts: 'Bypass Claude guardrail attachment on requests.',                                                         on: true,  setBy: 'test-harness', lastFlipped: '2026-08-01' },
  { id: 'safety.pii-redaction',         label: 'PII redaction enabled',   family: 'safety',  cuts: 'Disable PII redaction on audit log detail fields.',                                                        on: false, setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'safety.exfil-guard-disabled',  label: 'exfil guard disabled',    family: 'safety',  cuts: 'Bypass DLP exfiltration scanning on outbound content.',                                                   on: true,  setBy: 'test-harness', lastFlipped: '2026-08-01' },
  { id: 'safety.exfil-custom-disabled', label: 'exfil custom patterns',   family: 'safety',  cuts: 'Ignore customer-supplied DLP regex patterns.',                                                             on: true,  setBy: 'test-harness', lastFlipped: '2026-08-01' },
  { id: 'safety.cross-tenant',          label: 'cross-tenant guard',      family: 'safety',  cuts: 'Block every read that crosses an org_id boundary.',                                                        on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'safety.system-prompt-pin',     label: 'system prompt pin',       family: 'safety',  cuts: 'Pin system prompts to the audited SHA. Blocks silent prompt edits.',                                       on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'safety.converse-loop',         label: 'converse loop',           family: 'safety',  cuts: 'Stop the converse loop after one turn (single-shot mode).',                                               on: false, setBy: 'operator',  lastFlipped: '2026-07-04' },
  { id: 'safety.tool-repartition',      label: 'tool repartition',        family: 'safety',  cuts: 'Disable tool repartitioning across agents.',                                                              on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'safety.audit-suppression',     label: 'audit suppression',       family: 'safety',  cuts: 'Suppress the write-once audit log (break-glass; the suppression itself is logged).',                       on: false, setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'safety.break-glass-pin',       label: 'break-glass PIN',         family: 'safety',  cuts: 'Require a second factor before panic or role change.',                                                    on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },

  // ── AGENTS (10) ────────────────────────────────────────────────────────────────
  { id: 'agent.jarvis-voice',           label: 'jarvis (voice)',          family: 'agents',  cuts: 'Stop the voice copilot. Read-only mode still works.',                                                     on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'agent.jarvis-reasoning',       label: 'jarvis (reasoning)',      family: 'agents',  cuts: 'Drop the Claude reasoning layer of Jarvis; voice still answers from a template.',                           on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'agent.sales',                  label: 'sales agent',             family: 'agents',  cuts: 'Stop the sales agent from sending outbound messages.',                                                    on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.retention',              label: 'retention agent',         family: 'agents',  cuts: 'Stop the retention agent (churn-risk pings).',                                                             on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.cognition',              label: 'cognition (manifest)',    family: 'agents',  cuts: 'Stop the cognition.manifest gate. Sovereignty drops to floor.',                                            on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'agent.finance-runway',         label: 'finance runway',          family: 'agents',  cuts: 'Stop the finance runway projection agent.',                                                                on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.people-capacity',        label: 'people capacity',         family: 'agents',  cuts: 'Stop the people capacity agent.',                                                                          on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.operations-incidents',   label: 'operations incidents',    family: 'agents',  cuts: 'Stop the operations incidents agent.',                                                                     on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.it-rd-experiments',      label: 'IT/R&D experiments',      family: 'agents',  cuts: 'Stop the IT/R&D experiments agent.',                                                                        on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'agent.dashboard-narrator',     label: 'dashboard narrator',      family: 'agents',  cuts: 'Stop the dashboard narrator (CEO cockpit insights).',                                                      on: false, setBy: 'operator',  lastFlipped: '2026-07-12' },

  // ── TOOLS (10) ─────────────────────────────────────────────────────────────────
  { id: 'tool.tool-dispatch',           label: 'tool dispatch',           family: 'tools',   cuts: 'Hard-block every tool call regardless of agent.',                                                          on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.tool-repartition',        label: 'tool repartition',        family: 'tools',   cuts: 'Block the orchestrator from rebalancing tools across agents.',                                              on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.email-outbound',          label: 'email outbound',          family: 'tools',   cuts: 'Block SMTP/email tools. Drafts still allowed.',                                                            on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'tool.slack-outbound',          label: 'slack outbound',          family: 'tools',   cuts: 'Block Slack write APIs. Reads stay open.',                                                                 on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'tool.shell-exec',              label: 'shell exec',              family: 'tools',   cuts: 'Block shell execution. Model can no longer run commands.',                                                 on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.fs-read',                 label: 'filesystem read',         family: 'tools',   cuts: 'Block filesystem reads outside the vault.',                                                                 on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.fs-write',                label: 'filesystem write',        family: 'tools',   cuts: 'Block filesystem writes.',                                                                                  on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.web-fetch',               label: 'web fetch',               family: 'tools',   cuts: 'Block outbound HTTP fetches.',                                                                              on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
  { id: 'tool.calendar-write',          label: 'calendar write',          family: 'tools',   cuts: 'Block calendar writes. Reads still open.',                                                                 on: true,  setBy: 'admin',     lastFlipped: '2026-08-01' },
  { id: 'tool.stripe-charge',           label: 'stripe charge',           family: 'tools',   cuts: 'Block Stripe charge / refund calls.',                                                                       on: true,  setBy: 'owner',     lastFlipped: '2026-08-01' },
];

/* ───────────────────────────── DLP patterns — 9 exactly ───────────────────────────── */

export const DLP_PATTERNS: DlpPattern[] = [
  // 7 blocking
  { id: 'aws-access-key',   pattern: 'AKIA[0-9A-Z]{16}',                              label: 'AWS access keys',     rationale: 'Long-lived root credentials. One leak = full account.',        action: 'block', hitsLast24h: 0, lastTriggered: undefined },
  { id: 'api-key-header',    pattern: 'x-api-key:\\s*[A-Za-z0-9-_]{20,}',               label: 'API key headers',     rationale: 'Generic API key shape in any header value.',                   action: 'block', hitsLast24h: 1, lastTriggered: '2026-08-05 14:22' },
  { id: 'pem-private-key',  pattern: '-----BEGIN (RSA |EC |OPENSSH |PRIVATE )',        label: 'Private keys (PEM)',  rationale: 'SSH / TLS private keys. Loss = full impersonation.',           action: 'block', hitsLast24h: 0, lastTriggered: undefined },
  { id: 'slack-token',      pattern: 'xox[baprs]-[0-9]{10,}-[0-9]{10,}',              label: 'Slack tokens',        rationale: 'Bot / user tokens allow channel reads and writes.',            action: 'block', hitsLast24h: 0, lastTriggered: undefined },
  { id: 'github-pat',       pattern: 'ghp_[A-Za-z0-9]{36}',                            label: 'GitHub PATs',         rationale: 'Personal access tokens leak the user account.',                action: 'block', hitsLast24h: 0, lastTriggered: undefined },
  { id: 'credit-card',      pattern: '\\b(?:\\d[ -]?){13,19}\\b',                      label: 'Credit cards',        rationale: 'PAN numbers must never leave the account.',                     action: 'block', hitsLast24h: 2, lastTriggered: '2026-08-05 09:11' },
  { id: 'us-ssn',           pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',                     label: 'US SSNs',             rationale: 'Identity numbers — highest re-identification risk.',            action: 'block', hitsLast24h: 0, lastTriggered: undefined },
  // 2 warning
  { id: 'aws-secret-shaped',pattern: '[A-Za-z0-9/+=]{40}',                             label: 'AWS-secret-key shaped', rationale: 'Matches the AWS secret-key shape but not the access-key prefix.', action: 'warn',  hitsLast24h: 4, lastTriggered: '2026-08-05 18:03' },
  { id: 'jwt',              pattern: 'eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+', label: 'JWTs',              rationale: 'Tokens that may carry session claims.',                          action: 'warn',  hitsLast24h: 3, lastTriggered: '2026-08-05 17:41' },
];

/* ───────────────────────────── Panic — single state ───────────────────────────── */

export const PANIC_STATE: PanicState = {
  active: false,
  releasedBy: null,
  releasedAt: null,
  reason: null,
  stops: [
    'Every kill switch trips to OFF (snapshot then trip)',
    'All agent turns halt mid-flight',
    'All tool dispatch is blocked',
    'Voice copilot drops to read-only',
    'Outbound Slack / email / calendar blocked',
    'Cost cap force-trips regardless of current spend',
  ],
  survives: [
    'Read paths: dashboard, audit log (last 24h)',
    'Write-once audit bucket keeps accepting events',
    'Owner can inspect the snapshot from the same page',
    'Read-only Jarvis answers "what just happened"',
  ],
  reversal: 'One owner re-engages the master kill switch, then re-arms the 42 individually. Snapshot lets you restore in one click. The whole trip is itself audited and reversible.',
};

/* ───────────────────────────── Rate limits — per agent / per surface ───────────────────────────── */

export const RATE_LIMITS: RateLimitRow[] = [
  { id: 'jarvis.1m',         surface: 'jarvis (voice+reason)', window: '1m',   limit: 30,   used: 4,   overflow: 'throttle' },
  { id: 'jarvis.1h',         surface: 'jarvis (voice+reason)', window: '1h',   limit: 600,  used: 87,  overflow: 'throttle' },
  { id: 'sales-agent.1m',    surface: 'sales agent',           window: '1m',   limit: 20,   used: 2,   overflow: 'queue' },
  { id: 'sales-agent.1h',    surface: 'sales agent',           window: '1h',   limit: 300,  used: 41,  overflow: 'queue' },
  { id: 'retention.1h',      surface: 'retention agent',       window: '1h',   limit: 60,   used: 12,  overflow: 'queue' },
  { id: 'cognition.1h',      surface: 'cognition (manifest)',  window: '1h',   limit: 120,  used: 24,  overflow: 'fail-closed' },
  { id: 'finance.1h',        surface: 'finance runway',        window: '1h',   limit: 30,   used: 6,   overflow: 'queue' },
  { id: 'people.1h',         surface: 'people capacity',       window: '1h',   limit: 30,   used: 3,   overflow: 'queue' },
  { id: 'operations.1h',     surface: 'operations incidents',  window: '1h',   limit: 60,   used: 9,   overflow: 'queue' },
  { id: 'it-rd.1h',          surface: 'IT/R&D experiments',    window: '1h',   limit: 60,   used: 14,  overflow: 'queue' },
  { id: 'dashboard.1m',      surface: 'dashboard API',         window: '1m',   limit: 600,  used: 132, overflow: 'throttle' },
  { id: 'slack-in.1m',       surface: 'slack inbound',         window: '1m',   limit: 120,  used: 8,   overflow: 'queue' },
  { id: 'email-out.1h',      surface: 'email outbound',        window: '1h',   limit: 100,  used: 11,  overflow: 'fail-closed' },
  { id: 'stripe.1h',         surface: 'stripe charge',         window: '1h',   limit: 30,   used: 2,   overflow: 'fail-closed' },
];

/* ───────────────────────────── Security posture — 9 criteria (one per Blueprint §14 cat) ───────────────────────────── */

export const POSTURE_CRITERIA: PostureCriterion[] = [
  { id: 'access.rls',       category: 'access-control',  label: 'Row-level security on every tenant table', level: 'conform', note: 'org_id claim wired through JWT hook, 28/28 tables enforce.' },
  { id: 'access.roles',     category: 'access-control',  label: '5-tier role hierarchy (viewer / analyst / operator / admin / owner)', level: 'conform', note: 'All five roles provisioned in omk_saas.memberships.' },
  { id: 'audit.write-once', category: 'audit-trail',     label: 'Write-once audit trail (7-year hold)',       level: 'partial', note: 'Hot copy in Postgres is on; S3 Object Lock mirror in progress.' },
  { id: 'audit.breakglass', category: 'audit-trail',     label: 'Break-glass events always audited',          level: 'conform', note: 'panic, auth-failure, role-change all hit audit_suppression = true path.' },
  { id: 'enc.at-rest',      category: 'encryption',      label: 'Data at rest encrypted with managed keys',  level: 'conform', note: 'Postgres TDE + Supabase Storage default encryption; rotation 90d.' },
  { id: 'enc.in-transit',   category: 'encryption',      label: 'TLS-only inbound (no HTTP fallback)',       level: 'conform', note: 'Vercel + Supabase Cloud enforce TLS 1.3; HSTS on app.' },
  { id: 'mon.alerts',       category: 'monitoring',      label: 'Live alerting on kill-switch flips',        level: 'partial', note: 'Cost + safety trips page; agent/tool trips only logged.' },
  { id: 'data.dlp',         category: 'data-handling',   label: 'DLP scan on every outbound reply',          level: 'conform', note: '9 patterns on, 7 block + 2 warn; last false-positive: 2026-07-12.' },
  { id: 'data.pii',         category: 'data-handling',   label: 'PII redaction in audit log fields',         level: 'gap',      note: 'Switch is OFF (PII redaction disabled). To re-enable, flip safety.pii-redaction.' },
];

/* ───────────────────────────── Compliance — SOC 2 + HIPAA ───────────────────────────── */

export const COMPLIANCE_CONTROLS: ComplianceControl[] = [
  {
    id: 'soc2.cc6.1',
    framework: 'soc2',
    category: 'Logical & Physical Access (CC6)',
    label: 'Data at rest is encrypted with managed keys',
    status: 'met',
    detail: 'Restrict access to data by encrypting it at rest under customer-managed keys with a rotation schedule.',
    subChecks: ['data key rotation', 'curated key rotation', 'logs key rotation', 'audit bucket encrypted'],
    fixPrompt: 'Enable customer-managed KMS keys for Supabase Storage + Postgres; rotate every 90 days; re-encrypt audit bucket with the same key.',
  },
  {
    id: 'soc2.cc6.1.iam',
    framework: 'soc2',
    category: 'Logical & Physical Access (CC6)',
    label: 'Least-privilege IAM on the orchestrator role',
    status: 'partial',
    detail: 'Grant the running workload only the permissions it needs (no wildcard admin, no privilege-escalation actions).',
    subChecks: ['Task role discovery', 'Least-privilege grade', 'Broad grant on sensitive service'],
    fixPrompt: 'Replace wildcard actions/sources on the orchestrator task role with explicit scope. Re-score Security Posture > IAM. See docs/iam-capitol.md.',
  },
  {
    id: 'soc2.cc6.6',
    framework: 'soc2',
    category: 'Logical & Physical Access (CC6)',
    label: 'Network boundary protection (WAF + private subnets)',
    status: 'partial',
    detail: 'Restrict the system perimeter: WAF in front of public assets, public subnets isolated from private subnets.',
    subChecks: ['WAF in front', 'Public/private subnet split', 'NAT egress filtered'],
    fixPrompt: 'Provision Vercel WAF rules (rate, geo-block, bot challenge) and split Supabase egress into private route table. Re-score.',
  },
  {
    id: 'soc2.cc7.2',
    framework: 'soc2',
    category: 'System Operations (CC7)',
    label: 'Detection of anomalous activity',
    status: 'gap',
    detail: 'Detect configuration and security anomalies; analyze events; escalate as needed.',
    subChecks: ['Anomaly alerts wired', 'Escalation policy exists'],
    fixPrompt: 'Wire the cost-cap fail-closed event, every kill-switch trip, and every panic to a single alerting channel (see Alerting section).',
  },
  {
    id: 'soc2.cc8.1',
    framework: 'soc2',
    category: 'Change Management (CC8)',
    label: 'Change-management approval workflow',
    status: 'met',
    detail: 'Authorize, design, develop, configure, document changes before deployment.',
    subChecks: ['PR review required', 'Type-check + tests on CI'],
    fixPrompt: 'No fix — continue current PR review policy.',
  },
  {
    id: 'hipaa.164.312.a1',
    framework: 'hipaa',
    category: 'Technical Safeguards (§164.312)',
    label: 'Access control — unique user identification',
    status: 'met',
    detail: 'Assign a unique name/number for identifying and tracking each user.',
    subChecks: ['org_id claim unique', 'session_id per request'],
    fixPrompt: 'No fix — verified.',
  },
  {
    id: 'hipaa.164.312.a2',
    framework: 'hipaa',
    category: 'Technical Safeguards (§164.312)',
    label: 'Emergency access procedure',
    status: 'partial',
    detail: 'Establish procedures for obtaining necessary ePHI during a contingency.',
    subChecks: ['panic flow documented', 'read-only path verified'],
    fixPrompt: 'Document the panic flow in a runbook; rehearse quarterly; record rehearsal time in audit log.',
  },
  {
    id: 'hipaa.164.312.b',
    framework: 'hipaa',
    category: 'Technical Safeguards (§164.312)',
    label: 'Audit controls — hardware, software, procedural',
    status: 'partial',
    detail: 'Implement hardware, software, procedural mechanisms to record and examine activity.',
    subChecks: ['audit_write_once', 'breakglass override'],
    fixPrompt: 'Finish S3 Object Lock mirror; verify breakglass events always hit audit log even when audit_suppression = true.',
  },
  {
    id: 'hipaa.164.312.c1',
    framework: 'hipaa',
    category: 'Technical Safeguards (§164.312)',
    label: 'Integrity — ePHI not altered or destroyed',
    status: 'gap',
    detail: 'Protect ePHI from improper alteration or destruction.',
    subChecks: ['append-only audit', 'version pinning on prompts'],
    fixPrompt: 'Enable system_prompt_pin kill switch (currently ON). Re-score after one week.',
  },
];

/* ───────────────────────────── Alerting — configured alerts ───────────────────────────── */

export const ALERTS: AlertConfig[] = [
  { id: 'cost-cap.trip',           trigger: 'cost cap trips (fail-closed)',     threshold: 'cost.used_today >= cost.cap',                recipient: 'owner (push + email)',            lastFired: null,                                       enabled: true },
  { id: 'kill-switch.any-trip',    trigger: 'any kill switch flips',            threshold: 'killswitch.event in (cost.*, safety.break-glass)',  recipient: 'owner (push)',         lastFired: '2026-07-22 14:11',                          enabled: true },
  { id: 'panic.engage',            trigger: 'panic engaged',                     threshold: 'panic.active = true',                       recipient: 'owner + admin (push, SMS)',        lastFired: null,                                       enabled: true },
  { id: 'dlp.block',               trigger: 'DLP block (pattern matched)',      threshold: 'dlp.action = block',                        recipient: 'owner (email digest 1h)',         lastFired: '2026-08-05 14:22',                          enabled: true },
  { id: 'dlp.warn-threshold',      trigger: 'DLP warn > 5 in 10m',              threshold: 'count(dlp.warn, 10m) > 5',                  recipient: 'analyst (dashboard)',              lastFired: '2026-08-05 18:03',                          enabled: true },
  { id: 'auth.role-change',        trigger: 'role assignment changes',          threshold: 'memberships.role updated',                  recipient: 'owner (audit-only)',               lastFired: '2026-07-29 09:42',                          enabled: true },
  { id: 'rate.throttle',           trigger: 'rate limit overflow',              threshold: 'rate.overflow in (throttle, fail-closed)',  recipient: 'operator (dashboard)',            lastFired: null,                                       enabled: true },
  { id: 'audit.suppression',       trigger: 'audit suppression flip',           threshold: 'safety.audit-suppression flips',           recipient: 'owner (push, audit-only)',         lastFired: null,                                       enabled: true },
  { id: 'system-prompt.drift',     trigger: 'system prompt hash mismatch',      threshold: 'sha(prompt) != pinned',                     recipient: 'owner (push)',                     lastFired: null,                                       enabled: true },
  { id: 'budget.80pct',            trigger: 'budget 80% reached',               threshold: 'cost.used_month >= 0.8 * budget',          recipient: 'owner (email)',                    lastFired: '2026-08-01 11:00',                          enabled: true },
];

/* ───────────────────────────── Turn chokepoint — canonical order ───────────────────────────── */

/**
 * The turn chokepoint (Enterprise OS blueprint §3). Every agent action, every
 * message, every scheduled job funnels through runAgentTurn in this exact order.
 * Surfaced on the Kill Switches page header and the Security Posture page.
 */
export const CHOKEPOINT_ORDER: readonly string[] = [
  'rate limit',
  'load agent',
  'model kill switch',
  'cost cap (fail-closed)',
  'tool switch',
  'guardrail',
  'converse loop',
  'tool dispatch',
  'DLP scan',
  'audit',
] as const;

/* ───────────────────────────── Static metadata ───────────────────────────── */

export const SECURITY_META = {
  totalKillSwitches: 42,
  totalDlpPatterns: 9,
  dlpBlocking: 7,
  dlpWarning: 2,
  roles: ['viewer', 'analyst', 'operator', 'admin', 'owner'] as const,
  tiers: ['T0 Hobby', 'T1 Standard', 'T2 Pro', 'T3 Enterprise'] as const,
  estimatedTables: 31,
  estimatedBuckets: 6,
  estimatedKeys: 3,
};