/** CMS seed — registers every collection used across every Coach OS app. Import
 *  once as a side-effect (from app-discovery) before any app reads useCmsStore.
 *  This is the fallback/demo dataset; Phase 1 (CmsRepository) replaces it with
 *  live Supabase data once an org is authenticated. */
import { useCmsStore } from './cms.store';
import type { CmsCollectionDef, CmsItem } from './types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Clients — canonical roster, reused by Dashboard + Clients + Sales + Finance ═══ */

const clientsDef = def({
  id: 'clients', name: 'Clients', singular: 'Client', accent: '#2563eb',
  titleField: 'name', subtitleField: 'segment', badgeField: 'status',
  fields: [
    { key: 'segment', label: 'Segment', type: 'text' },
    { key: 'ticket', label: 'Monthly ticket', type: 'currency' },
    { key: 'openThreads', label: 'Open threads', type: 'number' },
    { key: 'nextSession', label: 'Next session', type: 'text' },
    { key: 'health', label: 'Health score', type: 'number' },
    { key: 'onboardingStep', label: 'Onboarding step', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const clientsItems: CmsItem[] = [
  { id: 'ava-chen', name: 'Ava Chen', segment: 'Citadelle — high ticket', ticket: 1800, openThreads: 4, nextSession: 'Thu 14:00', health: 88, onboardingStep: null, status: 'Active' },
  { id: 'marcus-reyes', name: 'Marcus Reyes', segment: 'Programme — 12 weeks', ticket: 2500, openThreads: 2, nextSession: 'Fri 10:30', health: 80, onboardingStep: null, status: 'Active' },
  { id: 'priya-nandan', name: 'Priya Nandan', segment: 'Citadelle — high ticket', ticket: 1800, openThreads: 1, nextSession: 'Mon 09:00', health: 71, onboardingStep: null, status: 'Active' },
  { id: 'atelier-bricolage', name: 'Atelier Bricolage', segment: 'Onboarding — step 3 of 7', ticket: 1000, openThreads: 3, nextSession: 'Not scheduled', health: null, onboardingStep: '3 / 7', status: 'Onboarding' },
  { id: 'techflow', name: 'TechFlow', segment: 'Onboarding — step 1 of 7', ticket: 1000, openThreads: 5, nextSession: 'Not scheduled', health: null, onboardingStep: '1 / 7', status: 'Onboarding' },
  { id: 'studio-nord', name: 'Studio Nord', segment: 'Citadelle — high ticket', ticket: 1800, openThreads: 0, nextSession: 'No session in 21 days', health: null, onboardingStep: null, status: 'At risk' },
];

/* ═══ Knowledge Base articles — Operations ═══ */

const articlesDef = def({
  id: 'articles', name: 'Knowledge Base', singular: 'Article', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'summary', badgeField: 'reads',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'reads', label: 'Cited this month', type: 'number' },
    { key: 'updated', label: 'Last updated', type: 'text' },
    { key: 'body', label: 'Body', type: 'longtext' },
  ],
});

const articlesItems: CmsItem[] = [
  { id: 'quiz-scoring', title: 'How the diagnostic quiz scores a lead', summary: '42 citations this month', category: 'Growth', reads: 42, updated: '2d ago', body: 'The quiz weighs 6 signals — booked-out ratio, delegation gaps, and time-to-decision — into a single 0-100 score. Above 70 routes straight to a demo invite.' },
  { id: 'escalation', title: 'When to escalate to the coach vs. auto-reply', summary: '31 citations this month', category: 'Support', reads: 31, updated: '4d ago', body: 'Auto-reply handles scheduling, billing questions, and FAQ. Anything touching a client\'s emotional state or a contract change escalates immediately.' },
  { id: 'zero-pii', title: 'Data residency & the Zero-PII seal', summary: '27 citations this month', category: 'Security', reads: 27, updated: '1w ago', body: 'Every byte stays inside the client\'s own Citadelle instance. The seal panics-locks all egress on demand and is audited in the Compliance Ledger.' },
  { id: 'onboarding-7', title: 'The 7-step onboarding runbook', summary: '19 citations this month', category: 'Onboarding', reads: 19, updated: '3d ago', body: 'Welcome call → contract → Zero-PII walkthrough → first diagnostic → calendar sync → first session brief → 30-day check-in.' },
];

/* ═══ Team — People app ═══ */

const teamDef = def({
  id: 'team', name: 'Team', singular: 'Member', accent: '#0891b2',
  titleField: 'name', subtitleField: 'role', badgeField: 'status',
  fields: [
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'focus', label: 'Focus', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'bio', label: 'Bio', type: 'longtext' },
  ],
});

const teamItems: CmsItem[] = [
  { id: 'professor-x', name: 'Professor X', role: 'Head of People', focus: 'Strategy · ethics guard', status: 'online', bio: 'Sets the strategic accounts view and the ethics guardrails every People decision runs through.' },
  { id: 'jean-grey', name: 'Jean Grey', role: 'Talent & Conflict', focus: 'Emotional intelligence', status: 'online', bio: 'Reads the room before anyone else does — conflict resolution and telepathic-grade empathy.' },
  { id: 'storm', name: 'Storm', role: 'Culture Weather', focus: 'Diversity · atmosphere', status: 'idle', bio: 'Owns the culture climate: diversity initiatives and the day-to-day atmosphere of the practice.' },
  { id: 'wolverine', name: 'Wolverine', role: 'Hiring — tough roles', focus: 'Retention', status: 'online', bio: 'Handles the hires nobody else wants to make, and keeps the fiercely loyal ones around.' },
  { id: 'beast', name: 'Beast', role: 'Learning & Dev', focus: 'L&D · rigor', status: 'online', bio: 'Scientific rigor applied to every learning path — no hand-wavy training programs.' },
  { id: 'nightcrawler', name: 'Nightcrawler', role: 'Mobility', focus: 'Internal transfers', status: 'idle', bio: 'Bridges teams — internal transfers and talent mobility across the practice.' },
];

const agentsDef = def({
  id: 'people_agents', name: 'Agents', singular: 'Agent', accent: '#0891b2',
  titleField: 'name', subtitleField: 'task', badgeField: 'status',
  fields: [
    { key: 'task', label: 'Task', type: 'longtext' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const agentsItems: CmsItem[] = [
  { id: 'onboarding-agent', name: 'Onboarding Agent', task: 'Runs the 7-step welcome for new clients', status: 'running' },
  { id: 'culture-pulse-agent', name: 'Culture Pulse Agent', task: 'Weekly sentiment scan across channels', status: 'running' },
];

/* ═══ Operations — Runbooks + Incidents ═══ */

const runbooksDef = def({
  id: 'runbooks', name: 'Runbooks', singular: 'Runbook', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'category', badgeField: 'category',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'updated', label: 'Updated', type: 'text' },
    { key: 'steps', label: 'Steps', type: 'longtext' },
  ],
});

const runbooksItems: CmsItem[] = [
  { id: 'onboarding-runbook', title: 'Client onboarding — 7 steps', category: 'Onboarding', updated: '2d ago', steps: 'Welcome call → contract → Zero-PII walkthrough → first diagnostic → calendar sync → first session brief → 30-day check-in.' },
  { id: 'close-checklist', title: 'Monthly close checklist', category: 'Finance ops', updated: '5d ago', steps: 'Reconcile Stripe → verify invoice status → export P&L → flag past-due accounts → archive month.' },
  { id: 'incident-response', title: 'Incident response — data egress', category: 'Security', updated: '1w ago', steps: 'Trigger Zero-PII panic lock → identify source → notify affected client if any → log in Compliance Ledger → post-mortem within 48h.' },
  { id: 'human-handoff', title: 'Handoff to a human specialist', category: 'Support', updated: '3d ago', steps: 'Detect emotional/contract-sensitive topic → draft context summary → route to coach → confirm handoff in thread.' },
];

const incidentsDef = def({
  id: 'incidents', name: 'Incidents', singular: 'Incident', accent: '#4f46e5',
  titleField: 'title', subtitleField: 'when', badgeField: 'severity',
  fields: [
    { key: 'when', label: 'When', type: 'text' },
    { key: 'severity', label: 'Severity', type: 'badge' },
    { key: 'resolution', label: 'Resolution', type: 'longtext' },
  ],
});

const incidentsItems: CmsItem[] = [
  { id: 'egress-blocked', title: 'Egress attempt blocked — unknown integration', when: '09:15', severity: 'danger', resolution: 'Zero-PII seal auto-locked egress. Reviewed the integration request, confirmed it was not authorized, permanently blocked the endpoint.' },
  { id: 'stripe-retry', title: 'Stripe webhook retried (transient)', when: 'Yesterday', severity: 'warn', resolution: 'Webhook delivery failed once due to a timeout, succeeded on automatic retry. No client impact.' },
  { id: 'backup-verified', title: 'Backup verified — 6 clients', when: '2d ago', severity: 'ok', resolution: 'Routine backup integrity check passed for all 6 active client records.' },
];

/* ═══ IT / R&D — Services + Experiments + Deploys ═══ */

const servicesDef = def({
  id: 'services', name: 'Kernel Services', singular: 'Service', accent: '#7c3aed',
  titleField: 'name', subtitleField: 'note', badgeField: 'status',
  fields: [
    { key: 'note', label: 'Note', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'detail', label: 'Detail', type: 'longtext' },
  ],
});

const servicesItems: CmsItem[] = [
  { id: 'supabase-omk-saas', name: 'Supabase — omk_saas', note: 'p95 42ms', status: 'ok', detail: 'Primary Postgres for tenant data. p95 read latency 42ms over the last 24h, 0 failed connections.' },
  { id: 'vercel-coach-dashboard', name: 'Vercel — coach dashboard', note: 'READY', status: 'ok', detail: 'Latest deploy promoted to production, all health checks green.' },
  { id: 'edge-signup-org', name: 'Edge — sign-up-organization', note: 'invoked 12×', status: 'ok', detail: 'Idempotent org-creation function. 12 invocations today, 0 errors.' },
  { id: 'agent-runtime-m3', name: 'Agent runtime (M3)', note: 'queue depth 3', status: 'warn', detail: 'MiniMax M3 runtime queue is backing up slightly — 3 jobs waiting. Not yet critical.' },
];

const itExperimentsDef = def({
  id: 'it_experiments', name: 'Experiments', singular: 'Experiment', accent: '#7c3aed',
  titleField: 'title', subtitleField: 'meta', badgeField: 'stage',
  fields: [
    { key: 'stage', label: 'Stage', type: 'badge' },
    { key: 'meta', label: 'Meta', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const itExperimentsItems: CmsItem[] = [
  { id: 'voice-clone-v3', title: 'Voice-clone tuning v3', meta: 'lift retention?', stage: 'idea', notes: 'Hypothesis: tighter voice-clone fidelity increases reply rate on drafted outreach.' },
  { id: 'auto-brief-calendar', title: 'Auto-brief from calendar', meta: 'spike', stage: 'idea', notes: 'Spike: generate a session brief automatically from the calendar event description.' },
  { id: 'langgraph-supervisor', title: 'LangGraph supervisor', meta: 'Summers → workers', stage: 'building', notes: 'B1 Summers as supervisor node, dispatching to B2/B3 worker agents via LangGraph.' },
  { id: 'zero-pii-lock', title: 'Zero-PII egress lock', meta: 'live', stage: 'shipped', notes: 'Panic-lock button, live in production, audited via Compliance Ledger.' },
  { id: 'audit-quiz-scoring', title: 'Audit-quiz scoring', meta: 'live', stage: 'shipped', notes: '6-signal diagnostic scoring, live on the Pipeline app.' },
];

const deploysDef = def({
  id: 'deploys', name: 'Deploys', singular: 'Deploy', accent: '#7c3aed',
  titleField: 'commit', subtitleField: 'target', badgeField: 'status',
  fields: [
    { key: 'target', label: 'Target', type: 'text' },
    { key: 'when', label: 'When', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const deploysItems: CmsItem[] = [
  { id: 'deploy-b933e4e', commit: 'b933e4e', target: 'coach dashboard', when: '2h ago', status: 'READY' },
  { id: 'deploy-a7c1f02', commit: 'a7c1f02', target: 'edge functions', when: 'yesterday', status: 'READY' },
  { id: 'deploy-4de88ab', commit: '4de88ab', target: 'agent runtime', when: '3d ago', status: 'rolling' },
];

/* ═══ Tasks ═══ */

const tasksDef = def({
  id: 'tasks', name: 'Tasks', singular: 'Task', accent: '#0d9488',
  titleField: 'label', subtitleField: 'when', badgeField: 'group',
  fields: [
    { key: 'when', label: 'When', type: 'text' },
    { key: 'group', label: 'Group', type: 'badge' },
    { key: 'done', label: 'Done', type: 'text' },
  ],
});

const tasksItems: CmsItem[] = [
  { id: 't1', label: 'Approve 2 outreach drafts', when: 'due 11:00', group: 'today', done: false },
  { id: 't2', label: 'Review TechFlow proposal', when: 'due today', group: 'today', done: false },
  { id: 't3', label: 'Renewal call — Ava Chen', when: 'Thu 14:00', group: 'upcoming', done: false },
  { id: 't4', label: 'Quarterly finance close', when: 'next week', group: 'upcoming', done: false },
  { id: 't5', label: 'Publish newsletter #18', when: 'Fri', group: 'upcoming', done: false },
];

/* ═══ Marketplace ═══ */

const marketplaceDef = def({
  id: 'marketplace_listings', name: 'Marketplace', singular: 'Integration', accent: '#db2777',
  titleField: 'name', subtitleField: 'tag', badgeField: 'installed',
  fields: [
    { key: 'tag', label: 'Category', type: 'text' },
    { key: 'blurb', label: 'Description', type: 'longtext' },
    { key: 'installed', label: 'Installed', type: 'badge' },
    { key: 'featured', label: 'Featured', type: 'text' },
  ],
});

const marketplaceItems: CmsItem[] = [
  { id: 'stripe-billing', name: 'Stripe Billing', tag: 'Finance', blurb: 'Invoicing & subscriptions, reconciled nightly', installed: 'Yes', featured: false },
  { id: 'calendly-sync', name: 'Calendly Sync', tag: 'Scheduling', blurb: 'Auto-brief before every booked session', installed: 'Yes', featured: true },
  { id: 'linkedin-reach', name: 'LinkedIn Reach', tag: 'Growth', blurb: 'Draft outreach in your voice', installed: 'No', featured: true },
  { id: 'notion-export', name: 'Notion Export', tag: 'Knowledge', blurb: 'Push session notes to your workspace', installed: 'No', featured: false },
  { id: 'docusign', name: 'DocuSign', tag: 'Legal', blurb: 'Send & track engagement letters', installed: 'No', featured: false },
  { id: 'loom-recaps', name: 'Loom Recaps', tag: 'Delivery', blurb: 'Turn a session into a shareable recap', installed: 'No', featured: true },
];

/* ═══ Product — Roadmap+Backlog unified, Releases separate ═══ */

const productItemsDef = def({
  id: 'product_items', name: 'Product Items', singular: 'Item', accent: '#9333ea',
  titleField: 'title', subtitleField: 'meta', badgeField: 'stage',
  fields: [
    { key: 'stage', label: 'Stage', type: 'badge' },
    { key: 'meta', label: 'Meta', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'badge' },
  ],
});

const productItemsItems: CmsItem[] = [
  { id: 'client-vault-v2', title: 'Client Vault v2', meta: 'auto-brief + notes', stage: 'now', priority: 'high' },
  { id: 'voice-approvals', title: 'Voice Studio approvals', meta: '1-click publish', stage: 'now', priority: 'high' },
  { id: 'pipeline-scoring-v2', title: 'Pipeline scoring v2', meta: 'quiz weighting', stage: 'next', priority: 'med' },
  { id: 'compliance-export', title: 'Compliance export', meta: '1-query audit', stage: 'next', priority: 'med' },
  { id: 'multi-tenancy', title: 'Multi-coach tenancy', meta: 'H90', stage: 'later', priority: 'low' },
  { id: 'keyboard-shortcuts', title: 'Keyboard shortcuts for app launch', meta: 'backlog', stage: 'backlog', priority: 'med' },
  { id: 'dark-mode', title: 'Dark mode for the whole OS', meta: 'backlog', stage: 'backlog', priority: 'med' },
  { id: 'offline-cache', title: 'Offline-first cache for Client Vault', meta: 'backlog', stage: 'backlog', priority: 'high' },
];

const releasesDef = def({
  id: 'product_releases', name: 'Releases', singular: 'Release', accent: '#9333ea',
  titleField: 'name', subtitleField: 'version', badgeField: 'when',
  fields: [
    { key: 'version', label: 'Version', type: 'text' },
    { key: 'when', label: 'Shipped', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const releasesItems: CmsItem[] = [
  { id: 'release-v0-9', name: 'Citadelle shell', version: 'v0.9', when: 'this week', notes: 'Forked the Life OS window shell, re-skinned light, wired 13 Coach OS apps.' },
  { id: 'release-v0-8', name: 'Zero-PII seal', version: 'v0.8', when: '2w ago', notes: 'One-tap panic lock for all outbound calls, audited in Compliance Ledger.' },
  { id: 'release-v0-7', name: 'Audit-quiz pipeline', version: 'v0.7', when: '1mo ago', notes: '6-signal diagnostic scoring live on the Pipeline app.' },
];

/* ═══ Growth — Channels + Experiments ═══ */

const growthChannelsDef = def({
  id: 'growth_channels', name: 'Channels', singular: 'Channel', accent: '#16a34a',
  titleField: 'name', subtitleField: 'leadsLabel', badgeField: 'trend',
  fields: [
    { key: 'leads', label: 'Leads', type: 'number' },
    { key: 'cac', label: 'CAC', type: 'currency' },
    { key: 'trend', label: 'Trend', type: 'badge' },
  ],
});

const growthChannelsItems: CmsItem[] = [
  { id: 'intro-co', name: 'Intro.co marketplace', leadsLabel: '38 leads', leads: 38, cac: 41, trend: '↑ 12%' },
  { id: 'linkedin-voice', name: 'LinkedIn (in your voice)', leadsLabel: '27 leads', leads: 27, cac: 0, trend: '↑ 8%' },
  { id: 'referral', name: 'Referral', leadsLabel: '14 leads', leads: 14, cac: 0, trend: 'flat' },
  { id: 'paid-search', name: 'Paid search', leadsLabel: '7 leads', leads: 7, cac: 188, trend: '↓ 5%' },
];

const growthExperimentsDef = def({
  id: 'growth_experiments', name: 'Growth Experiments', singular: 'Experiment', accent: '#16a34a',
  titleField: 'title', subtitleField: 'lift', badgeField: 'lift',
  fields: [
    { key: 'lift', label: 'Result', type: 'badge' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const growthExperimentsItems: CmsItem[] = [
  { id: 'quiz-headline', title: 'Quiz headline: "score your practice"', lift: '+18% starts', notes: 'Reframing the CTA around self-diagnosis outperformed the generic "take our quiz" framing.' },
  { id: 'followup-timing', title: 'Send follow-up at +2h vs +24h', lift: '+9% replies', notes: 'Faster follow-up while the diagnostic score is still fresh in mind wins meaningfully.' },
  { id: 'video-vs-live', title: 'Video demo vs. live call', lift: 'inconclusive', notes: 'Not enough sample size yet — rerun next quarter with a larger cohort.' },
];

/* ═══ Sales — unified deals (kanban stage + table share one collection) ═══ */

const dealsDef = def({
  id: 'deals', name: 'Deals', singular: 'Deal', accent: '#ea580c',
  titleField: 'client', subtitleField: 'offer', badgeField: 'stage',
  fields: [
    { key: 'offer', label: 'Offer', type: 'text' },
    { key: 'value', label: 'Value', type: 'currency' },
    { key: 'stage', label: 'Stage', type: 'badge' },
  ],
});

const dealsItems: CmsItem[] = [
  { id: 'deal-marcus', client: 'Marcus Reyes', offer: 'Programme', value: 2500, stage: 'Qualified' },
  { id: 'deal-amara', client: 'Amara Bello', offer: 'Citadelle', value: 1000, stage: 'Qualified' },
  { id: 'deal-dara', client: 'Dara Okafor', offer: 'Programme', value: 2500, stage: 'Proposal' },
  { id: 'deal-ava', client: 'Ava Chen', offer: 'Citadelle', value: 1800, stage: 'Won' },
  { id: 'deal-priya', client: 'Priya Nandan', offer: 'Citadelle', value: 1800, stage: 'Won' },
];

/* ═══ Finance — Invoices ═══ */

const invoicesDef = def({
  id: 'invoices', name: 'Invoices', singular: 'Invoice', accent: '#ca8a04',
  titleField: 'client', subtitleField: 'due', badgeField: 'status',
  fields: [
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'due', label: 'Due', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const invoicesItems: CmsItem[] = [
  { id: 'invoice-ava', client: 'Ava Chen', amount: 1800, due: 'Jul 01', status: 'Paid' },
  { id: 'invoice-priya', client: 'Priya Nandan', amount: 1800, due: 'Jul 01', status: 'Paid' },
  { id: 'invoice-marcus', client: 'Marcus Reyes', amount: 2500, due: 'Jul 15', status: 'Sent' },
];

/* ═══ Legal — Contracts + Policies ═══ */

const contractsDef = def({
  id: 'contracts', name: 'Contracts', singular: 'Contract', accent: '#64748b',
  titleField: 'document', subtitleField: 'client', badgeField: 'status',
  fields: [
    { key: 'client', label: 'Client', type: 'text' },
    { key: 'signed', label: 'Signed', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
});

const contractsItems: CmsItem[] = [
  { id: 'contract-ava-eng', document: 'Coaching engagement', client: 'Ava Chen', signed: 'Jun 12', status: 'Active' },
  { id: 'contract-ava-dpa', document: 'DPA — data processing', client: 'Ava Chen', signed: 'Jun 12', status: 'Active' },
  { id: 'contract-marcus-eng', document: 'Coaching engagement', client: 'Marcus Reyes', signed: '—', status: 'Out for signature' },
];

const policiesDef = def({
  id: 'policies', name: 'Policies', singular: 'Policy', accent: '#64748b',
  titleField: 'name', subtitleField: 'updated',
  fields: [
    { key: 'updated', label: 'Last updated', type: 'text' },
    { key: 'body', label: 'Summary', type: 'longtext' },
  ],
});

const policiesItems: CmsItem[] = [
  { id: 'privacy-policy', name: 'Privacy policy', updated: '3mo ago', body: 'Governs how client data is collected, used, and never shared. Zero-PII: nothing trains an outside model.' },
  { id: 'data-residency', name: 'Data residency & Zero-PII', updated: '1mo ago', body: 'Every byte stays inside the coach\'s own Citadelle instance. Egress is filtered and can be panic-locked instantly.' },
  { id: 'cancellation-portability', name: 'Cancellation & data portability', updated: '2mo ago', body: 'Cancel anytime. Full data export available on request — your business data leaves with you.' },
  { id: 'acceptable-use', name: 'Acceptable use', updated: '4mo ago', body: 'Defines what the AI agents may and may not do on the coach\'s behalf, and the human-in-the-loop boundaries.' },
];

/* ═══ Session Notes — Clients app "IP Vault": the coach's captured knowledge,
   the concrete product surface behind the "sanctuarize your IP" Nexus pitch ═══ */

const sessionNotesDef = def({
  id: 'session_notes', name: 'Session Notes', singular: 'Session Note', accent: '#2563eb',
  titleField: 'topic', subtitleField: 'clientName', badgeField: 'sentiment',
  fields: [
    { key: 'clientName', label: 'Client', type: 'text' },
    { key: 'date', label: 'Session date', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'sentiment', label: 'Sentiment', type: 'badge' },
    { key: 'body', label: 'Notes', type: 'longtext' },
  ],
});

const sessionNotesItems: CmsItem[] = [
  { id: 'sn-1', topic: 'Q3 pricing repositioning', clientName: 'Ava Chen', date: 'Thu, Jul 18', duration: '50 min', sentiment: 'Breakthrough', body: 'Ava is ready to raise her flagship offer from $1,800 to $2,400/mo starting Q4. Walked through the objection-handling script for existing clients grandfathered at the old rate. Action: draft the rate-change email by Friday, she reviews before sending.' },
  { id: 'sn-2', topic: 'Burnout check-in', clientName: 'Marcus Reyes', date: 'Fri, Jul 12', duration: '45 min', sentiment: 'Watch', body: 'Marcus mentioned feeling stretched across 3 cohort launches at once. Recommended he pause new enrollment for 2 weeks. He pushed back — flag for next session, do not let this drop.' },
  { id: 'sn-3', topic: 'IP framework: The Weight Method', clientName: 'Priya Nandan', date: 'Mon, Jul 8', duration: '60 min', sentiment: 'Breakthrough', body: 'Priya finally articulated her proprietary "Weight Method" clearly enough to document. Captured the 4-stage structure verbatim — this is the seed for her signature framework page and future book chapter 3.' },
  { id: 'sn-4', topic: 'Contract renewal friction', clientName: 'Studio Nord', date: 'Tue, Jun 30', duration: '30 min', sentiment: 'Watch', body: 'Studio Nord has not scheduled a session in 21 days. Left a voicemail. If no response by next week, escalate to the at-risk retention sequence.' },
];

/* ═══ demo-coach Onboarding Citadel — Q4-2026 GTM launch (G2/Vercel "demo-coach" instance)
   Represents the personalised snapshot a prospect sees INSIDE their assigned Nexus
   instance after taking the 4-question onboarding quiz. All numbers/metrics are
   precomputed against the prospect's quiz answers (see demo_coach_metrics in the
   QuizResult panel of the Onboarding app). No fabricated pricing. ═══ */

const demoCoachAppsDef = def({
  id: 'demo_coach_apps', name: 'Demo Apps', singular: 'App', accent: '#059669',
  titleField: 'name', subtitleField: 'tagline',
  fields: [
    { key: 'category', label: 'Category', type: 'badge' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'metric', label: 'Saving (per month)', type: 'text' },
    { key: 'story', label: 'Story', type: 'longtext' },
  ],
});

const demoCoachAppsItems: CmsItem[] = [
  { id: 'app-ip-vault', name: 'IP Vault', tagline: 'Every session, capturable. Yours forever.',
    category: 'Sanctuary', metric: '~12h capture / month',
    story: 'Ava drafted The Weight Method across three sessions. With Nexus, those notes are auto-structured into a vault the moment the session ends — searchable, exportable, fully owned by you. No SaaS trains on it. Zero data egress.' },
  { id: 'app-session-transcript', name: 'Session Transcript → Content Dam', tagline: 'Speak once. Twelve assets publish.',
    category: 'Compounding', metric: '~40h repurposing / quarter',
    story: 'Marcus ran one podcast episode. Nexus drafted twelve assets from a single transcript: a LinkedIn post, a newsletter, three short social clips, a waitlist magnet, a follow-up nurture email — all drafted in your voice, ready for your approval before publish.' },
  { id: 'app-quiz-result', name: 'QuizResult · Personalised Audit Preview', tagline: 'Diagnose your capture gaps.',
    category: 'Diagnostic', metric: 'audit ready in ~22 min',
    story: 'Your specific pattern: too many client notes still live on paper. Your Nexus recommendation: route everything through the Vault first, then let the agents structure it. Estimated first-month time saved: 6h.' },
  { id: 'app-compliance', name: 'Compliance Dashboard', tagline: 'Audit log, ready when the regulators ask.',
    category: 'Compliance', metric: '0 days to audit pack',
    story: 'Every AI action logged with timestamp + agent id + reversibility flag. Export a CCPA / Colorado AI Act audit pack in two clicks. No public SaaS touches your client data — not for training, not for inference, not ever.' },
];

/* demo-coach: sample extracted session notes (used by IP Vault in the demo instance) */
const demoCoachNotesDef = def({
  id: 'demo_coach_notes', name: 'Demo Vault', singular: 'Note', accent: '#2563eb',
  titleField: 'topic', subtitleField: 'clientName', badgeField: 'sentiment',
  fields: [
    { key: 'clientName', label: 'Client', type: 'text' },
    { key: 'date', label: 'Session date', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'sentiment', label: 'Sentiment', type: 'badge' },
    { key: 'body', label: 'Notes', type: 'longtext' },
  ],
});

const demoCoachNotesItems: CmsItem[] = [
  { id: 'dn-1', topic: 'Q3 pricing repositioning', clientName: 'Ava Chen', date: 'Thu, Jul 18', duration: '50 min', sentiment: 'Breakthrough',
    body: 'Ava is ready to raise her flagship offer from $1,800 to $2,400/mo starting Q4. Walked through the objection-handling script for existing clients grandfathered at the old rate. Action: draft the rate-change email by Friday, she reviews before sending.' },
  { id: 'dn-2', topic: 'Burnout check-in', clientName: 'Marcus Reyes', date: 'Fri, Jul 12', duration: '45 min', sentiment: 'Watch',
    body: 'Marcus mentioned feeling stretched across 3 cohort launches at once. Recommended he pause new enrollment for 2 weeks. He pushed back — flag for next session, do not let this drop.' },
  { id: 'dn-3', topic: 'IP framework: The Weight Method', clientName: 'Priya Nandan', date: 'Mon, Jul 8', duration: '60 min', sentiment: 'Breakthrough',
    body: 'Priya finally articulated her proprietary "Weight Method" clearly enough to document. Captured the 4-stage structure verbatim — this is the seed for her signature framework page and future book chapter 3.' },
];

/* demo-coach: lifecycle metrics for the QuizResult preview panel */
const demoCoachMetricsDef = def({
  id: 'demo_coach_metrics', name: 'Demo Metrics', singular: 'Metric', accent: '#0891b2',
  titleField: 'label', subtitleField: 'unit',
  fields: [
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'story', label: 'Story', type: 'longtext' },
  ],
});

const demoCoachMetricsItems: CmsItem[] = [
  { id: 'm-1', label: 'Time saved / month', unit: 'h', value: 6,
    story: 'Estimated first-month time saved against your current paper-notes routine, based on your onboarding answers.' },
  { id: 'm-2', label: 'Vault entries / week', unit: 'entries', value: 4,
    story: 'How many session-note captures you would actually accumulate in the Vault once it is wired to your calendar.' },
  { id: 'm-3', label: 'Compliance flags / quarter', unit: 'flags', value: 0,
    story: 'Number of prospective compliance gaps Nexus would have flagged in your last 90 days of client interactions.' },
  { id: 'm-4', label: 'Premium tier ready', unit: '/4', value: 4,
    story: 'How many of the four demoed mini-apps match your routine on the audit trail. All four line up against your onboarding answers.' },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedCms(): void {
  if (seeded) return;
  seeded = true;
  useCmsStore.getState().registerCollection(clientsDef, clientsItems);
  useCmsStore.getState().registerCollection(articlesDef, articlesItems);
  useCmsStore.getState().registerCollection(teamDef, teamItems);
  useCmsStore.getState().registerCollection(agentsDef, agentsItems);
  useCmsStore.getState().registerCollection(runbooksDef, runbooksItems);
  useCmsStore.getState().registerCollection(incidentsDef, incidentsItems);
  useCmsStore.getState().registerCollection(servicesDef, servicesItems);
  useCmsStore.getState().registerCollection(itExperimentsDef, itExperimentsItems);
  useCmsStore.getState().registerCollection(deploysDef, deploysItems);
  useCmsStore.getState().registerCollection(tasksDef, tasksItems);
  useCmsStore.getState().registerCollection(marketplaceDef, marketplaceItems);
  useCmsStore.getState().registerCollection(productItemsDef, productItemsItems);
  useCmsStore.getState().registerCollection(releasesDef, releasesItems);
  useCmsStore.getState().registerCollection(growthChannelsDef, growthChannelsItems);
  useCmsStore.getState().registerCollection(growthExperimentsDef, growthExperimentsItems);
  useCmsStore.getState().registerCollection(dealsDef, dealsItems);
  useCmsStore.getState().registerCollection(invoicesDef, invoicesItems);
  useCmsStore.getState().registerCollection(contractsDef, contractsItems);
  useCmsStore.getState().registerCollection(policiesDef, policiesItems);
  useCmsStore.getState().registerCollection(sessionNotesDef, sessionNotesItems);
  // demo-coach Onboarding Citadel (Q4-2026 GTM demo) — 4 mini-apps de vitrine
  useCmsStore.getState().registerCollection(demoCoachAppsDef, demoCoachAppsItems);
  useCmsStore.getState().registerCollection(demoCoachNotesDef, demoCoachNotesItems);
  useCmsStore.getState().registerCollection(demoCoachMetricsDef, demoCoachMetricsItems);
}
