/** TasksApp — local seed for the three sections added on top of the
 *  existing Today / Upcoming / Done surfaces.
 *
 *  - dods             · Definition of Done — what "done" actually means
 *  - comparators      · verification of a deliverable against a reference
 *  - exposed_actions  · weekly count of publicly delivered actions
 *
 *  Every collection follows the same `def` + `items` + `registerCollection`
 *  contract as `src/lib/cms/seed.ts`, but lives here so the tasks app stays
 *  self-contained. `seedTasksCms()` is called once at module load from
 *  TasksApp.tsx — idempotent thanks to `registerCollection`'s early-return.
 *
 *  Design notes:
 *   - Every entry is concrete (real-looking owner, dates, percentages). No
 *     "Item 1 / Item 2" placeholders.
 *   - Tone carries domain meaning: DoD status (missing > implicit > explicit)
 *     and comparator verdict (match > drift > fail) drive the badge color via
 *     `badgeTone()`.
 *   - exposed_actions spans 5 weeks so the section can render a real time
 *     series, not a one-bar sparkline.
 */

import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Definitions of Done — the contract per task ═══ */

const dodsDef = def({
  id: 'dods', name: 'Definitions of Done', singular: 'DoD', accent: '#059669',
  titleField: 'name', subtitleField: 'context', badgeField: 'status',
  fields: [
    { key: 'context', label: 'Context', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'lastEdited', label: 'Last edited', type: 'text' },
    { key: 'dod', label: 'Definition of Done', type: 'longtext' },
    { key: 'signal', label: 'Why it matters', type: 'longtext' },
  ],
});

const dodsItems: CmsItem[] = [
  {
    id: 'dod-onboarding-v3-tour',
    name: 'Onboarding tour v3 — ship to 100% of new accounts',
    context: 'Product · this week',
    owner: 'Léo Martin',
    status: 'missing',
    lastEdited: '3 days ago',
    dod: '',
    signal: 'The tour has shipped behind a flag for 12 days, but the team has not written what "done" looks like — no acceptance criteria, no review owner, no rollback trigger. The risk is silent reverts.',
  },
  {
    id: 'dod-stripe-retry-flaky',
    name: 'Stripe webhook retry burst — close the flaky',
    context: 'Operations · benchmark #3',
    owner: 'Sasha Mendes',
    status: 'implicit',
    lastEdited: 'Yesterday 09:14',
    dod: 'Currently relies on a comment in the runbook — "the dedup table should not drop entries". Needs to become a benchmark assertion: pass rate ≥ 95% over 5 consecutive runs.',
    signal: 'Without a written DoD, the next incident fixes the symptom, not the cause. The flaky benchmark is currently being watched by one engineer, not the system.',
  },
  {
    id: 'dod-compliance-export',
    name: 'Compliance export regeneration — byte-for-byte match',
    context: 'Operations · quarterly audit',
    owner: 'Sasha Mendes',
    status: 'explicit',
    lastEdited: '12h ago',
    dod: 'Re-running the audit pack against a clean checkout produces a byte-identical artifact. Verified by the compliance-export benchmark, run weekly. Pass rate must stay at 100% for 3 consecutive weeks before a release can ship to audit-grade clients.',
    signal: 'A drift here is regulator-grade. The DoD is also the incident trigger — any deviation opens a P0.',
  },
  {
    id: 'dod-newsletter-22',
    name: 'Newsletter #22 — "What to ship when nothing ships"',
    context: 'Growth · Tuesday send',
    owner: 'Marc Lefèvre',
    status: 'explicit',
    lastEdited: '2 days ago',
    dod: 'Draft approved by Marc and one peer. Subject line A/B settled (winner must beat the control by ≥ 5% open). Send at 09:00 Paris, archived in the public archive by 18:00. Open rate above 30% in the first 24h.',
    signal: 'Newsletters are easy to slip — the DoD is the schedule. Without it, Tuesday becomes Wednesday and the cadence dies quietly.',
  },
  {
    id: 'dod-voice-fidelity-rollback',
    name: 'Voice-clone v3 — rollback to v2',
    context: 'Operations · watchdog incident',
    owner: 'Jules Royer',
    status: 'explicit',
    lastEdited: '4h ago',
    dod: 'Rollback merge lands before 17:00 Paris. Outbound copy uses v2 model for 100% of sends. Fidelity benchmark returns to ≥ 95% pass rate within 24h. The Knowledge Agent confirms no v3-specific output leaked to clients.',
    signal: 'The decision is reversible only if the DoD is clean. A partial rollback re-introduces the failure mode.',
  },
  {
    id: 'dod-quarterly-renewal-pipeline',
    name: 'Quarterly renewal pipeline — 24 renewals booked',
    context: 'Sales · Q3 close',
    owner: 'Marc Lefèvre',
    status: 'implicit',
    lastEdited: '5 days ago',
    dod: 'Currently lives in a spreadsheet — "all 24 accounts get a renewal call before Sep 30". Needs to become: every renewal-eligible account has a health score and a confirmed call slot, listed in the renewals view, with a backup if the primary slot misses twice.',
    signal: 'Implicit DoDs are the ones that blow up quarter-end. The "we always do it" assumption has not been written down once in the last three cycles.',
  },
  {
    id: 'dod-ip-vault-search',
    name: 'IP Vault — tag-based search',
    context: 'Operations · proposed change',
    owner: 'Priya Nandan',
    status: 'explicit',
    lastEdited: 'Yesterday 18:02',
    dod: 'Tag search returns results in under 200ms p95 for vaults up to 5,000 entries. The substring search remains as a fallback. Adoption: 80% of vault searches use tags within 30 days of release.',
    signal: 'This DoD is the difference between "feature shipped" and "feature used". A shipped feature nobody uses is worse than nothing.',
  },
];

/* ═══ Comparators — verify a deliverable against a reference ═══ */

const comparatorsDef = def({
  id: 'comparators', name: 'Comparators', singular: 'Comparator', accent: '#059669',
  titleField: 'name', subtitleField: 'compared', badgeField: 'verdict',
  fields: [
    { key: 'compared', label: 'Compared', type: 'text' },
    { key: 'against', label: 'Against', type: 'text' },
    { key: 'verdict', label: 'Verdict', type: 'badge' },
    { key: 'delta', label: 'Delta', type: 'longtext' },
    { key: 'reviewer', label: 'Reviewer', type: 'text' },
    { key: 'reviewed', label: 'Reviewed', type: 'text' },
  ],
});

const comparatorsItems: CmsItem[] = [
  {
    id: 'comp-onboarding-mockup',
    name: 'Onboarding tour — mockup vs. shipped',
    compared: 'Figma mockup v3.2 (Anna Bauer)',
    against: 'Live /onboarding on omk-svc-os, EU region',
    verdict: 'match',
    delta: '4 visual drifts: icon weight (-1 step in mockup), card spacing 8px vs 12px (intentional simplification), two illustrations dropped. All four are documented in the design review PR — verdict is match-with-deliberate-edits.',
    reviewer: 'Anna Bauer',
    reviewed: 'Yesterday 16:42',
  },
  {
    id: 'comp-voice-clone-fidelity',
    name: 'Voice-clone v2 output vs. original transcripts',
    compared: '100 held-out session transcripts (English + French)',
    against: 'Voice-clone v2 generated output, MOS scored by 3 reviewers',
    verdict: 'drift',
    delta: 'Overall MOS 4.18 (target ≥ 4.20). Drift concentrated on breath markers and laughter — the clone suppresses them. Two samples (4%, 4.1) clip below 3.5 and were routed to manual transcription.',
    reviewer: 'Jules Royer',
    reviewed: 'Yesterday 11:08',
  },
  {
    id: 'comp-compliance-pack',
    name: 'Compliance export — second run vs. first',
    compared: 'Compliance pack, clean checkout SHA ef2cc36',
    against: 'Re-run on SHA ef2cc36 + 0 manual edits',
    verdict: 'match',
    delta: 'SHA-256 match on the zip artifact, byte-for-byte. The pack is reproducible — audit-grade.',
    reviewer: 'Sasha Mendes',
    reviewed: '2 days ago',
  },
  {
    id: 'comp-newsletter-ab',
    name: 'Newsletter #21 — subject A/B vs. baseline',
    compared: 'Subject A "curiosity hook" vs. Subject B "direct benefit"',
    against: 'Newsletter #20 baseline (open rate 34%)',
    verdict: 'match',
    delta: 'A beat B by 12% on opens (39% vs 27%) and 4% on clicks. Both beat the baseline — Subject A is the new default, B is archived for future re-tests.',
    reviewer: 'Marc Lefèvre',
    reviewed: '4 days ago',
  },
  {
    id: 'comp-rls-isolation',
    name: 'RLS isolation — Org A session vs. Org B tables',
    compared: 'Org A authenticated session, REST and Postgres roles',
    against: 'Org B rows in clients, invoices, session_notes',
    verdict: 'match',
    delta: '5 of 5 attempts blocked at the Postgres layer (zero rows returned, zero leakage in pg_stat_statements). The JWT custom_access_token_hook is re-provisioned on Supabase Cloud — the boundary holds.',
    reviewer: 'Jules Royer',
    reviewed: '6h ago',
  },
  {
    id: 'comp-behavior-parity',
    name: 'Voice outbound — parity check',
    compared: '5 reference sessions (canonical transcripts)',
    against: 'Voice-clone v2 with the v2 fidelity model, no manual fallback',
    verdict: 'drift',
    delta: '4 of 5 reference sessions match within MOS 4.0. Session 03 (coaching tone shift mid-session) drops to MOS 3.7 — the clone flattens the dynamic. One session, not a regression, but flagged for next review.',
    reviewer: 'Jules Royer',
    reviewed: 'Yesterday 09:30',
  },
];

/* ═══ Exposed actions — weekly count of publicly delivered actions ═══ */

const exposedActionsDef = def({
  id: 'exposed_actions', name: 'Exposed actions', singular: 'Exposed action', accent: '#059669',
  titleField: 'name', subtitleField: 'audience', badgeField: 'channel',
  fields: [
    { key: 'audience', label: 'Audience', type: 'text' },
    { key: 'channel', label: 'Channel', type: 'badge' },
    { key: 'shippedAt', label: 'Shipped at', type: 'date' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'summary', label: 'Summary', type: 'longtext' },
    { key: 'metric', label: 'Metric', type: 'text' },
  ],
});

/** shippedAt is an ISO date (YYYY-MM-DD). The section sorts by week and draws
 *  the sparkline from these dates. The list spans 5 weeks (≈ 7 weeks back to
 *  current) so the time series carries signal, not a single dot. */
const exposedActionsItems: CmsItem[] = [
  {
    id: 'action-newsletter-21',
    name: 'Newsletter #21 — "Why your DoD is your client\'s trust"',
    audience: '482 coaches',
    channel: 'email',
    shippedAt: '2026-07-07',
    owner: 'Marc Lefèvre',
    summary: 'Subject A/B (curiosity vs. direct) — A won by 12%. The piece argues that explicit DoDs compound trust over time. Cited in three coach group chats by Thursday.',
    metric: '39% open · 7.2% click',
  },
  {
    id: 'action-product-changelog-jul',
    name: 'Product changelog — July release notes',
    audience: 'Public web',
    channel: 'release',
    shippedAt: '2026-07-12',
    owner: 'Léo Martin',
    summary: 'Aggregated 14 merged PRs into a single changelog. Tagged by audience (coaches, ops, finance) so each segment reads what they care about. Linked from the in-app "What\'s new" rail.',
    metric: '1,240 unique reads',
  },
  {
    id: 'action-coach-spotlight-04',
    name: 'Coach Spotlight #4 — Sasha Mendes on monthly close',
    audience: 'LinkedIn + 482 coaches',
    channel: 'social',
    shippedAt: '2026-07-18',
    owner: 'Marc Lefèvre',
    summary: '90-second interview cut from a 30-minute recording. Sasha walks through the close-without-Spreadsheet ritual. Posted on LinkedIn, archived in the public vault.',
    metric: '2,300 LinkedIn views · 14 replies',
  },
  {
    id: 'action-newsletter-22',
    name: 'Newsletter #22 — "What to ship when nothing ships"',
    audience: '496 coaches',
    channel: 'email',
    shippedAt: '2026-07-21',
    owner: 'Marc Lefèvre',
    summary: 'A short piece on the rhythm of shipping when the calendar looks empty. Subject A/B settled — direct benefit won again. Open rate above 30% in 24h.',
    metric: '36% open · 5.8% click',
  },
  {
    id: 'action-status-report-h2',
    name: 'H2 status report — public summary',
    audience: 'Public web',
    channel: 'release',
    shippedAt: '2026-07-26',
    owner: 'Léo Martin',
    summary: 'Mid-year status — what shipped, what slipped, what changed in the model. Two charts: weekly exposed-action count and the share that came from the agents vs. humans.',
    metric: '640 unique reads · 22% returning',
  },
  {
    id: 'action-newsletter-23',
    name: 'Newsletter #23 — "The case for one weekly number"',
    audience: '503 coaches',
    channel: 'email',
    shippedAt: '2026-07-28',
    owner: 'Marc Lefèvre',
    summary: 'Argues that one weekly exposed-action count is a better north star than NPS. Beats last week\'s open rate by 3 points — the cadence is starting to compound.',
    metric: '42% open · 6.1% click',
  },
  {
    id: 'action-product-tour-100',
    name: 'Onboarding tour v3 — 100% rollout',
    audience: 'All new accounts',
    channel: 'ship',
    shippedAt: '2026-08-02',
    owner: 'Léo Martin',
    summary: 'Tour v3 reached 100% of new accounts. Median time-to-first-session down 22% (from 6.4 days to 5.0 days). Two clients wrote in unprompted — the tour is doing its job.',
    metric: '−22% time-to-first-session',
  },
  {
    id: 'action-newsletter-24',
    name: 'Newsletter #24 — "Three ways to read a benchmark"',
    audience: '512 coaches',
    channel: 'email',
    shippedAt: '2026-08-04',
    owner: 'Marc Lefèvre',
    summary: 'Subject A/B: "Three ways…" (curiosity) vs. "How to read a benchmark" (direct). Curiosity won by 6 points. Cites the flaky auto-promote change as a worked example.',
    metric: '38% open · 6.4% click',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedTasksCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(dodsDef, dodsItems);
  store.registerCollection(comparatorsDef, comparatorsItems);
  store.registerCollection(exposedActionsDef, exposedActionsItems);
}
