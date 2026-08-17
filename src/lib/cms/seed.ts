/** CMS seed — registers every collection used across every Coach OS app. Import
 *  once as a side-effect (from app-discovery) before any app reads useCmsStore.
 *  This is the fallback/demo dataset; Phase 1 (CmsRepository) replaces it with
 *  live Supabase data once an org is authenticated. */
import { useCmsStore } from './cms.store';
import type { CmsCollectionDef, CmsItem } from './types';
import type { TenantId } from '../tenant/contract';

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

/* people_agents — la version riche vit ici (celle que PeopleApp consomme).
 *  La version lite à 2 entrées a été remplacée : les apps lisent des champs
 *  comme `codename`, `role`, `task`, `rank`, `domain`, `squad`, `cadence`
 *  qui n'existaient pas dans la version d'origine. Le brief FIX-7 a
 *  consolidé ces déclarations dans le seed central, plutôt que de les
 *  laisser dispersées dans `src/apps/people/seed.ts`. */
const agentsDef = def({
  id: 'people_agents', name: 'Agents', singular: 'Agent', accent: '#0d9488',
  titleField: 'name', subtitleField: 'role', badgeField: 'status',
  fields: [
    { key: 'codename', label: 'Codename', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'task', label: 'Current task', type: 'longtext' },
    { key: 'rank', label: 'E-Myth rank', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'squad', label: 'Squad', type: 'text' },
    { key: 'cadence', label: 'Cadence', type: 'text' },
  ],
});

const agentsItems: CmsItem[] = [
  { id: 'pa-talent-sourcer', name: 'Talent Sourcer', codename: 'PA-01',
    role: 'Recruiter · outbound', task: 'Sourcing 14 senior ops profiles for the Q3 hire sprint · 6 first-round interviews queued.',
    status: 'online', rank: 'B2', domain: 'Recrutement', squad: 'Phoenix Cell', cadence: 'Daily 9h standup · weekly retro Friday 16h' },
  { id: 'pa-onboarding-concierge', name: 'Onboarding Concierge', codename: 'PA-02',
    role: 'Onboarding lead', task: 'Coaching 4 new starters through their first-week sessions — 24h ping loop armed.',
    status: 'online', rank: 'B2', domain: 'Onboarding RH', squad: 'X-Mansion', cadence: 'Daily — H+2 / H+18 / H+24 pings' },
  { id: 'pa-performance-coach', name: 'Performance Coach', codename: 'PA-03',
    role: 'Revue trimestrielle', task: 'Drafting Q3 review templates — 22 reviews queued, 4 escalated to ethics override.',
    status: 'busy', rank: 'B2', domain: 'Revue de performance', squad: 'X-Mansion', cadence: 'Trimestrielle — sprint review Sunday' },
  { id: 'pa-compensation-analyst', name: 'Compensation Analyst', codename: 'PA-04',
    role: 'Paie & equity', task: 'Awaiting Q3 comp band updates from CFO — last cycle 2h 14m ago.',
    status: 'idle', rank: 'B3', domain: 'Paie / Rémunération', squad: 'B-Factory', cadence: 'Monthly — last day of cycle' },
  { id: 'pa-learning-curator', name: 'Learning Curator', codename: 'PA-05',
    role: 'Formation continue', task: 'Curating 6 new modules for the coach certification path — A/B on completion rate.',
    status: 'online', rank: 'B3', domain: 'Formation', squad: 'X-Mansion', cadence: 'Bi-weekly — cohort-driven' },
  { id: 'pa-compliance-officer', name: 'Compliance Officer', codename: 'PA-06',
    role: 'RGPD · conformité RH', task: 'Auditing  17 dossiers for the CNIL 2018-002 check — zero-pii pipeline in scope.',
    status: 'online', rank: 'B3', domain: 'Compliance', squad: 'B-Factory', cadence: 'Quarterly — audit windows' },
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

/* ═════════════════════════════════════════════════════════════════════════
 *  Legal — AI-Act checks + the broader compliance register.
 *
 *  Brief FIX-7 : ces 8 collections étaient déclarées dans
 *  `src/apps/legal/seed.ts` (Brief-F 2026-08-11). Or `seed.ts` central est
 *  le seul amorce garanti — `app-discovery.tsx:7` l'invoque au boot, et
 *  toute la suite (CollectionsRepeater, addItem, ProwlerImport) en dépend.
 *  Si l'app `Legal` est atteinte sans que `app-discovery` ait eu lieu
 *  (tests unitaires, route par code-splitting, import direct de
 *  ComplianceDashboard), `seedLegalCms()` peut sauter — la section « Cadres »
 *  s'affiche vide, et l'utilisateur croit que sa base est vide alors qu'elle
 *  n'a jamais été amorcée. Le `?? []` avalait l'erreur en silence.
 *
 *  Les 8 définitions sont donc consolidées ici. Le `seedLegalCms()` local
 *  devient un no-op idempotent — la déclaration central gagne par ordre
 *  d'amorce (Brief FIX-7§2).
 * ═════════════════════════════════════════════════════════════════════════ */

const legalAiActChecksDef = def({
  id: 'legal_ai_act_checks', name: 'AI-Act checks', singular: 'AI-Act check', accent: '#64748b',
  titleField: 'label', subtitleField: 'category', badgeField: 'done',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'done', label: 'Cleared', type: 'badge' },
    { key: 'description', label: 'Description', type: 'longtext' },
    { key: 'clearedAt', label: 'Cleared at', type: 'text' },
  ],
});

const legalAiActChecksItems: CmsItem[] = [
  { id: 'aiact-1', label: 'Risk classification documented', category: 'Documentation', done: 'Yes', clearedAt: '2026-07-21',
    description: 'Each AI surface in the OS carries a documented risk tier (minimal, limited, high) with the rationale logged in the audit trail.' },
  { id: 'aiact-2', label: 'Human-in-the-loop on client-facing actions', category: 'Safeguards', done: 'Yes', clearedAt: '2026-07-21',
    description: 'Every outbound client action (send, sign, refund) routes through a human approval gate unless an explicit standing consent is on file.' },
  { id: 'aiact-3', label: 'Transparency notice on AI-drafted content', category: 'Disclosure', done: 'Yes', clearedAt: '2026-07-22',
    description: 'Client-facing emails, summaries, and proposals carry a footer tag identifying AI involvement and the model version used.' },
  { id: 'aiact-4', label: 'Data-processing register up to date', category: 'Documentation', done: 'No', clearedAt: '—',
    description: 'The Article 30 register of processing activities must reflect every new model deployed in the last quarter. Audit is in progress, target completion 2026-08-15.' },
  { id: 'aiact-5', label: 'Incident logging & reporting path', category: 'Operations', done: 'No', clearedAt: '—',
    description: 'A formal incident-response path for AI-specific failures (output drift, prompt-injection attempts, data leakage) with notification thresholds. Runbook pending.' },
];

const legalFrameworksDef = def({
  id: 'legal_frameworks',
  name: 'Cadres',
  singular: 'Cadre',
  accent: '#0f172a',
  titleField: 'name',
  subtitleField: 'short',
  badgeField: 'family',
  fields: [
    { key: 'family', label: 'Famille', type: 'badge' },
    { key: 'short', label: 'Résumé', type: 'text' },
    { key: 'scope', label: 'Périmètre', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'appliesFrom', label: 'Applicable depuis', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});

const legalFrameworksItems: CmsItem[] = [
  { id: 'fw-soc2', name: 'SOC 2 Type II', short: 'Trust services criteria', family: 'Audit', scope: 'Citadelle (socle SaaS + tooling)', owner: 'Amadou', appliesFrom: '2026-Q3', status: 'In progress' },
  { id: 'fw-iso27001', name: 'ISO 27001', short: 'Information security management', family: 'Standard', scope: 'Citadelle + data pipeline', owner: 'Amadou', appliesFrom: '2026-Q4', status: 'Planned' },
  { id: 'fw-rgpd', name: 'RGPD', short: 'EU data protection', family: 'Law', scope: 'Tous clients EU + prospect EU', owner: 'Amadou', appliesFrom: '2018-05-25', status: 'Active' },
  { id: 'fw-nis2', name: 'NIS 2', short: 'EU cyber resilience', family: 'Law', scope: 'Clients ≥50 pers. ou secteur essentiel', owner: 'Amadou', appliesFrom: '2024-10-17', status: 'Scoped' },
];

const legalControlsDef = def({
  id: 'legal_controls',
  name: 'Contrôles',
  singular: 'Contrôle',
  accent: '#0369a1',
  titleField: 'code',
  subtitleField: 'title',
  badgeField: 'severity',
  fields: [
    { key: 'title', label: 'Intitulé', type: 'text' },
    { key: 'framework', label: 'Cadre', type: 'text' },
    { key: 'severity', label: 'Sévérité', type: 'badge' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'evidenceCount', label: 'Preuves', type: 'number' },
    { key: 'lastTested', label: 'Dernier test', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});

const legalControlsItems: CmsItem[] = [
  { id: 'cc-cc6-1', code: 'CC6.1', title: 'Logical access — software, infrastructure, architectures', framework: 'SOC 2', severity: 'High', owner: 'Amadou', evidenceCount: 2, lastTested: '2026-07-12', status: 'Done' },
  { id: 'cc-a-8-1', code: 'A.8.1.1', title: 'Inventory of assets', framework: 'ISO 27001', severity: 'Medium', owner: 'Amadou', evidenceCount: 0, lastTested: '—', status: 'Pending' },
  { id: 'cc-art-30', code: 'Art. 30', title: 'Record of processing activities', framework: 'RGPD', severity: 'High', owner: 'Amadou', evidenceCount: 1, lastTested: '2026-07-22', status: 'In progress' },
  { id: 'cc-art-32', code: 'Art. 32', title: 'Security of processing', framework: 'RGPD', severity: 'High', owner: 'Amadou', evidenceCount: 3, lastTested: '2026-07-30', status: 'Done' },
];

const legalCompliancePoliciesDef = def({
  id: 'legal_compliance_policies',
  name: 'Politiques',
  singular: 'Politique',
  accent: '#7c3aed',
  titleField: 'name',
  subtitleField: 'owner',
  badgeField: 'version',
  fields: [
    { key: 'version', label: 'Version', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'updated', label: 'Mise à jour', type: 'text' },
    { key: 'reviewBy', label: 'À rerelire avant', type: 'text' },
    { key: 'body', label: 'Résumé', type: 'longtext' },
  ],
});

const legalCompliancePoliciesItems: CmsItem[] = [
  { id: 'cp-privacy', name: 'Politique de confidentialité', version: 'v3.1', owner: 'Amadou', updated: '2026-05-04', reviewBy: '2026-11-04',
    body: 'How client data is collected, used, retained, and never shared outside the Citadelle.' },
  { id: 'cp-dpa', name: 'DPA — sous-traitance', version: 'v2.0', owner: 'Amadou', updated: '2026-06-12', reviewBy: '2026-12-12',
    body: 'Le contrat qui lie la pratique à chaque sous-traitant. À signer avant tout partage de données.' },
  { id: 'cp-iso', name: 'Politique de sécurité de l\'information', version: 'v1.2', owner: 'Amadou', updated: '2026-04-18', reviewBy: '2026-10-18',
    body: 'La politique chapeau ISO 27001 — gouvernance, classification, contrôles d\'accès, journalisation.' },
  { id: 'cp-ai', name: 'Politique d\'usage de l\'IA', version: 'v0.9', owner: 'Amadou', updated: '2026-07-22', reviewBy: '2026-10-22',
    body: 'What AI agents may and may not do on the coach\'s behalf, and the human-in-the-loop boundaries.' },
];

const legalEvidenceDef = def({
  id: 'legal_evidence',
  name: 'Preuves',
  singular: 'Preuve',
  accent: '#15803d',
  titleField: 'title',
  subtitleField: 'control',
  badgeField: 'kind',
  fields: [
    { key: 'control', label: 'Contrôle', type: 'text' },
    { key: 'kind', label: 'Type', type: 'badge' },
    { key: 'location', label: 'Emplacement', type: 'text' },
    { key: 'collectedAt', label: 'Collectée le', type: 'text' },
    { key: 'expiresAt', label: 'Expire le', type: 'text' },
  ],
});

const legalEvidenceItems: CmsItem[] = [
  { id: 'ev-cc6-1-screenshot', title: 'Capture — matrice d\'accès Supabase', control: 'CC6.1', kind: 'Screenshot', location: 'supabase://iam/roles', collectedAt: '2026-07-12', expiresAt: '2026-10-12' },
  { id: 'ev-art-32-tls', title: 'Rapport TLS — Qualys SSL Labs', control: 'Art. 32', kind: 'Report', location: 'https://www.ssllabs.com/ssltest/...', collectedAt: '2026-07-30', expiresAt: '2026-08-30' },
  { id: 'ev-art-30-register', title: 'Registre des traitements — export', control: 'Art. 30', kind: 'Document', location: 'docs/compliance/registre-traitements-v3.xlsx', collectedAt: '2026-07-22', expiresAt: '2026-10-22' },
];

const legalRisksDef = def({
  id: 'legal_risks',
  name: 'Risques',
  singular: 'Risque',
  accent: '#b91c1c',
  titleField: 'title',
  subtitleField: 'area',
  badgeField: 'rating',
  fields: [
    { key: 'area', label: 'Zone', type: 'text' },
    { key: 'likelihood', label: 'Probabilité', type: 'badge' },
    { key: 'impact', label: 'Impact', type: 'badge' },
    { key: 'rating', label: 'Cotation', type: 'badge' },
    { key: 'mitigation', label: 'Atténuation', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});

const legalRisksItems: CmsItem[] = [
  { id: 'rk-vendor-breach', title: 'Fuite de données chez un sous-traitant', area: 'Sous-traitance', likelihood: 'Low', impact: 'High', rating: 'High',
    mitigation: 'DPA signé, revue annuelle, clause de notification sous 72 h', owner: 'Amadou', status: 'Mitigated' },
  { id: 'rk-rgpd-consent', title: 'Consentement RGPD mal capturé', area: 'Marketing', likelihood: 'Medium', impact: 'Medium', rating: 'Medium',
    mitigation: 'Double opt-in + journal de consentement', owner: 'Amadou', status: 'Open' },
];

const legalVendorsDef = def({
  id: 'legal_vendors',
  name: 'Fournisseurs',
  singular: 'Fournisseur',
  accent: '#0891b2',
  titleField: 'name',
  subtitleField: 'category',
  badgeField: 'risk',
  fields: [
    { key: 'category', label: 'Catégorie', type: 'text' },
    { key: 'dataAccess', label: 'Accès aux données', type: 'badge' },
    { key: 'dpaSigned', label: 'DPA signé', type: 'badge' },
    { key: 'dpaDate', label: 'Date DPA', type: 'text' },
    { key: 'lastReview', label: 'Dernière revue', type: 'text' },
    { key: 'risk', label: 'Risque', type: 'badge' },
  ],
});

const legalVendorsItems: CmsItem[] = [
  { id: 'vd-anthropic', name: 'Anthropic', category: 'Model provider', dataAccess: 'Prompts + outputs', dpaSigned: 'Yes', dpaDate: '2026-04-02', lastReview: '2026-07-02', risk: 'Medium' },
  { id: 'vd-supabase', name: 'Supabase', category: 'Database / Auth', dataAccess: 'All tenant data', dpaSigned: 'Yes', dpaDate: '2026-03-15', lastReview: '2026-07-15', risk: 'High' },
];

const legalGapsDef = def({
  id: 'legal_gaps',
  name: 'Écarts',
  singular: 'Écart',
  accent: '#dc2626',
  titleField: 'title',
  subtitleField: 'control',
  badgeField: 'severity',
  fields: [
    { key: 'control', label: 'Contrôle', type: 'text' },
    { key: 'framework', label: 'Cadre', type: 'text' },
    { key: 'severity', label: 'Sévérité', type: 'badge' },
    { key: 'openedOn', label: 'Ouvert le', type: 'text' },
    { key: 'owner', label: 'Owner', type: 'text' },
    { key: 'status', label: 'Statut', type: 'badge' },
  ],
});

const legalGapsItems: CmsItem[] = [
  { id: 'gp-cc-a-8-1-1', title: 'Inventaire des actifs non documenté', control: 'A.8.1.1', framework: 'ISO 27001', severity: 'Medium', openedOn: '2026-06-30', owner: 'Amadou', status: 'Open' },
];

/* ═════════════════════════════════════════════════════════════════════════
 *  People — personas, memory, codex, approval_decisions, squads, content.
 *
 *  Brief FIX-7 : avant la consolidation, ces 6 collections étaient
 *  déclarées dans `src/apps/people/seed.ts` avec un drapeau module
 *  `seeded = true` qui les rendait dépendantes de l'import de PeopleApp.
 *  Le couple `seedPeopleCms()` + appel dans PeopleApp.tsx marchait
 *  tant que l'app passait par `app-discovery`, ce qui est le cas
 *  nominal aujourd'hui. Mais trois readers récents ont déjà vu
 *  l'invariant se briser :
 *
 *    1. Les tests unitaires qui touchent ApprovalsView sans monter
 *       PeopleApp. `seedPeopleCms()` n'est pas appelé, et le test
 *       voit `addItem('approval_decisions', ...)` répondre
 *       « Collection inconnue : "approval_decisions" ».
 *    2. Le composant `PeopleContent` si jamais il est rendu avant
 *       PeopleApp, par exemple via un lien direct / une archive
 *       de fenêtre en mode « frozen-on-leave ».
 *    3. La fonction de recherche cross-app qui ouvre un item-detail
 *       d'une collection People sans avoir chargé PeopleApp.
 *
 *  Le coût de la centralisation est nul : `registerCollectionFor`
 *  est idempotent, et la première amorce gagne. Le bénéfice est
 *  net : un seul point d'entrée pour « qu'est-ce qui existe »,
 *  et le test de non-régression `seed-collections.test.ts` peut
 *  tourner sans avoir à imiter l'ordre d'import des apps.
 *
 *  `team` et `people_agents` existaient déjà dans la centrale ;
 *  leurs définitions locales (squad field, codename) ont été
 *  absorbées par la règle « première amorce gagne ». Le commentaire
 *  historique en tête de ces defs explique pourquoi la riche
 *  version vit dans le central et la lite a disparu.
 * ═════════════════════════════════════════════════════════════════════════ */

const peoplePersonasDef = def({
  id: 'personas',
  name: 'Personas',
  singular: 'Persona',
  accent: '#0891b2',
  titleField: 'name',
  subtitleField: 'role',
  badgeField: 'anchorKind',
  fields: [
    { key: 'pronouns', label: 'Pronouns', type: 'text' },
    { key: 'wants', label: 'What they want', type: 'longtext' },
    { key: 'blockers', label: 'What blocks them', type: 'longtext' },
    { key: 'vocabulary', label: 'Vocabulary', type: 'text' },
    { key: 'anchor', label: 'Anchor (source)', type: 'longtext' },
    { key: 'anchorKind', label: 'Anchor kind', type: 'badge' },
    { key: 'anchorDate', label: 'Anchor date', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
  ],
});

const peoplePersonasItems: CmsItem[] = [
  { id: 'persona-cac40-cfo', name: 'Camille S.', role: 'CFO adjointe, groupe CAC 40', pronouns: 'elle / elle',
    wants: 'Un cadre de decision trimestriel qui laisse la place a la speculation productivite — pas un controle qui l\'etouffe. Elle veut voir 3 options par sujet, pas un fait accompli.',
    blockers: 'Le comex lit la matrice sous le stress : 14 decisions, deux sorties attendues a 18h. Les personnes qui derangent le cadre sont canalisees vers la RH. Camille n\'a plus le temps de pousser un dossier en comex.',
    vocabulary: 'matrice de decision · kpi vs kri · comex · deltamor · buf · spof',
    anchor: 'Entretien 1h, visio Paris, 2026-04-12. Notes verbatim sur Notion, dossier "CFO entretien 04-12".',
    anchorKind: 'entretien', anchorDate: '2026-04-12', domain: 'Direction financiere' },
  { id: 'persona-solo-accountant', name: 'Marc D.', role: 'Expert-comptable solo, 41 clients', pronouns: 'il / lui',
    wants: 'Sortir du mode pompier. Il gere 41 bilans par an, n\'a plus la bande passante pour developper le cabinet. Le samedi matin il fait des devis jamais envoyes.',
    blockers: 'Les clients appellent pour des details comptables au lieu d\'aller vers les juniors qu\'il a embauches. Le cabinet est devenu un centre de relation, pas un cabinet comptable.',
    vocabulary: 'bilan · liasse · AGA · controle URSSAF · lettrage · OD · situation',
    anchor: 'Appel telephonique 42 min, 2026-02-28. Enregistre avec consentement, transcript dans /clara/legs/2026-02-28-marc-d.md.',
    anchorKind: 'appel', anchorDate: '2026-02-28', domain: 'Comptabilite' },
  { id: 'persona-coach-trans', name: 'Léa B.', role: 'Coach de transition, ex-DRH', pronouns: 'elle / elle',
    wants: 'De 12 clients par mois a 30 — sans plus de plateformes, sans plus de marketing. Elle prefere un systeme qui mute a un systeme qui spam.',
    blockers: 'Elle a deja tente 4 CRM, 3 methodes de pricing, 2 coachs de coach. Chaque tentative s\'arrete a la troisieme semaine. Elle appelle cela "mon syndrome du 21eme jour".',
    vocabulary: 'offre · pack · session · engagement · allele · somatic marker · 360',
    anchor: 'Atelier coach OS, 2026-03-21, Madrid. Cahier de notes rasterise, 8 pages.',
    anchorKind: 'atelier', anchorDate: '2026-03-21', domain: 'Coaching' },
  { id: 'persona-corp-cto', name: 'Hicham E.', role: 'CTO scale-up SaaS B2B, 180 salaries', pronouns: 'il / lui',
    wants: 'Un proxy fiable entre son comite tech et son comite finance. Il passe plus de temps a traduire des schemas que a decider.',
    blockers: 'Les VP produit et les VP engineering utilisent les memes mots ("roadmap", "delivery") mais leur mean par des choses differentes. La defaut d\'alignement coutait 1M€ par an en re-work.',
    vocabulary: 'squad · train · trunk-based · ADR · blameless post-mortem · SLO',
    anchor: 'Bug tracker 2026-Q1, top 17 tickets tagges "alignment". Synthese dans /clara/legs/2026-05-04-hicham-alignment.md.',
    anchorKind: 'ticket', anchorDate: '2026-05-04', domain: 'Tech' },
  { id: 'persona-therapist', name: 'Nora V.', role: 'Therapeute de couple, libérale', pronouns: 'elle / ils',
    wants: 'Garder la confidentialite clinique tout en gagnant 8h par semaine sur la partie administrative. Elle ne veut pas que ses notes soient aspirées par un modele.',
    blockers: 'Les solutions SaaS generales traitements texte sont interdites par l\'ordre des psychologues. Les solutions specialisees sont trop chères ou trop rigides. Elle tape encore ses CR a 23h le dimanche.',
    vocabulary: 'seance aller · seance retour · clinical record · superviseur · zero-pii · RGPD',
    anchor: 'Anonyme — ordre impose la discretion. Rencontre informelle, pause cafe, 2026-06-09.',
    anchorKind: 'informel', anchorDate: '2026-06-09', domain: 'Sante' },
  { id: 'persona-no-anchor', name: 'Persona 07', role: 'A definir', pronouns: '—',
    wants: '—', blockers: '—', vocabulary: '—',
    anchor: '', anchorKind: 'no-anchor', anchorDate: '—', domain: '—' },
];

const peopleMemoryDef = def({
  id: 'memory',
  name: 'Mémoire',
  singular: 'Mémoire',
  accent: '#0891b2',
  titleField: 'fact',
  subtitleField: 'provenance',
  badgeField: 'verification',
  fields: [
    { key: 'fact', label: 'Fact', type: 'longtext' },
    { key: 'provenance', label: 'Provenance', type: 'text' },
    { key: 'retainedOn', label: 'Retained on', type: 'text' },
    { key: 'verification', label: 'Verification', type: 'badge' },
    { key: 'verifiedBy', label: 'Verified by', type: 'text' },
    { key: 'recheckOn', label: 'Re-check on', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'longtext' },
  ],
});

const peopleMemoryItems: CmsItem[] = [
  { id: 'mem-voice-fidelity-v2', fact: 'La fidelite vocale v2 atteint 4.21 MOS contre 3.91 MOS v3 sur le corpus de validation — la regression v3 tient depuis 14 jours malgre le retraining.',
    provenance: 'Benchmark voice-fidelity, run 2026-04-18', retainedOn: '2026-04-18', verification: 'confirmed', verifiedBy: 'Quality Agent', recheckOn: '2026-05-02', domain: 'Engineering',
    notes: 'Croise avec la decision Operations "change-rollback-voice-v3". Le rollback propose s\'aligne avec ce constat.' },
  { id: 'mem-rls-isolation', fact: 'Aucune fuite cross-tenant detectee sur les 90 derniers jours, sur 17M de requetes SAAS via les routes RLS-scopees.',
    provenance: 'Adversarial RLS test (org A vs org B), run 2026-05-05', retainedOn: '2026-05-05', verification: 'confirmed', verifiedBy: 'Security Lead', recheckOn: '2026-08-05', domain: 'Security',
    notes: 'Premier passage a 90 jours sans fuite. Pas assez pour baisser la vigilance — la memoire dit "0 fuite", pas "0 fuite possible".' },
  { id: 'mem-coach-360', fact: 'Les coachs qui passent en pricing a l\'engagement 3 mois apres 6 mois en package voient leur revenu mensuel doubler au mois 4.',
    provenance: 'Sondage 14 coachs, juin 2026, panel A', retainedOn: '2026-06-12', verification: 'to-verify', verifiedBy: 'A0', recheckOn: '2026-09-12', domain: 'Coaching',
    notes: '14 repondants, panel A uniquement. Le doublement tient pour 10/14. Ne pas generaliser avant une seconde vague — panel B en attente.' },
  { id: 'mem-onboarding-stall', fact: 'A 24h, les nouveaux clients non-encore-actives ont 47% de chance de churn dans le mois — contre 4% pour ceux qui ont deja passe la premiere session.',
    provenance: 'Cohor analysis 2026-Q1, 124 clients', retainedOn: '2026-04-08', verification: 'confirmed', verifiedBy: 'Growth Agent', recheckOn: '2026-07-08', domain: 'Onboarding',
    notes: 'La fenetre 24h est la plus predictive. C\'est l\'endroit ou la memoire doit etre operee — par SMS, pas par mail.' },
  { id: 'mem-energy-v3', fact: 'Le modele v3 dupliquait le cout sans ameliorer la qualite perçue (export +18%, score utilisateur -0.4 sur 1.4M de tokens).',
    provenance: 'Production telemetry 2026-03-01 → 2026-03-31', retainedOn: '2026-04-02', verification: 'contradicted', verifiedBy: 'Finance Ops', recheckOn: '2026-07-02', domain: 'Engineering',
    notes: 'La decision technique initiale etait "toujours plus de capacite". La realite produit dit le contraire. A utiliser comme exemple dans toute decision de montee en gamme.' },
  { id: 'mem-rgpd-cnil', fact: 'Les envois de session notes par mail standard violent la recommandation CNIL 2018-002 — il faut un canal chiffre de bout en bout ou un retraitement zero-pii.',
    provenance: 'Recommandation CNIL + audit interne 2026-02-14', retainedOn: '2026-02-14', verification: 'confirmed', verifiedBy: 'Compliance', recheckOn: '2026-08-14', domain: 'Compliance',
    notes: 'Verifier que la feature vault partage respecte bien la recommandation avant le prochain sprint.' },
  { id: 'mem-paid-vs-organic', fact: 'Sur le dernier trimestre, les clients gagnes par outreach (42%) sont plus stables que les clients gagnes par contenu (58%) — mais avec un panier moyen 1.4x inferieur.',
    provenance: 'CRM extraction 2026-Q1', retainedOn: '2026-04-22', verification: 'to-verify', verifiedBy: 'A0', recheckOn: '2026-07-22', domain: 'Growth',
    notes: 'Deux lectures possibles. Le contenu attire des clients plus gros mais plus volatiles, ou l\'outreach n\'a pas encore eu le temps de maturer. Memo a tenir avec precaution — un trimestre ne suffit pas.' },
];

const peopleCodexDef = def({
  id: 'codex',
  name: 'Codex',
  singular: 'Codex',
  accent: '#0891b2',
  titleField: 'situation',
  subtitleField: 'recipe',
  badgeField: 'domain',
  fields: [
    { key: 'situation', label: 'Situation', type: 'longtext' },
    { key: 'recipe', label: 'What we do', type: 'longtext' },
    { key: 'why', label: 'Why it works', type: 'longtext' },
    { key: 'appliedCount', label: 'Times applied', type: 'number' },
    { key: 'lastApplied', label: 'Last applied', type: 'text' },
    { key: 'domain', label: 'Domain', type: 'text' },
    { key: 'owners', label: 'Owners', type: 'text' },
    { key: 'caveats', label: 'Caveats', type: 'longtext' },
  ],
});

const peopleCodexItems: CmsItem[] = [
  { id: 'codex-standup-9am', situation: 'A 9h, l\'agent peut faire defiler les decisions du matin sans intervention humaine, mais un seul evenement non-arrete bloque l\'agent en EXECUTING jusqu\'a 14h.',
    recipe: '9h pile chaque jour, ouvrir le dashboard, lire les 3 notifications rouges, valider ou rejeter en moins de 10 min, jamais de reponse differee sans laisser un ping dans la file.',
    why: 'Le ping differe cree un graphe de blocage non-vide. L\'agent traite tout en parallele au lieu d\'attendre — la charge baisse de 40% sur la journee. La clarte de la reponse humaine (oui/non) est ce qui gele l\'etat des agents.',
    appliedCount: 142, lastApplied: '2026-05-04', domain: 'Cadence', owners: 'B1 · Gatekeeper',
    caveats: 'Le rythme tient tant que le volume tient. Au-dela de 30 agents, ca ne scale pas sans un second B1 ou un delegue.' },
  { id: 'codex-24h-ping', situation: 'Un client signe mais ne reserve rien dans les 24h. Sans intervention, 47% de churn dans le mois.',
    recipe: 'SMS a H+2, puis SMS a H+18, puis appel a H+24, puis silence jusqu\'a 7 jours. Pas de mail, pas de relance automatique.',
    why: 'Le mail est invisible. Le SMS a 90% d\'ouverture a h+2. L\'appel a h+24 est percu comme un service, pas un spam. Le silence a 7 jours cree un espace ou le client revient de lui-meme — c\'est la ou la decision se prend reellement.',
    appliedCount: 38, lastApplied: '2026-04-29', domain: 'Onboarding', owners: 'Growth Agent',
    caveats: 'Ca depend du canal telephonique etranger. Pour les clients americains, SMS est a remplacer par un ib.' },
  { id: 'codex-decision-3opts', situation: 'Le comex prend de mauvaises decisions parce qu\'il recoit une seule option, toujours presentee comme la seule.',
    recipe: 'Toute note de decision au comex presente 3 options structurees (defaut, alternative, abandon) plus 1 paragraphe sur la consequence humaine. Pas d\'option cachee dans le texte.',
    why: 'La structure force l\'auteur a avoir pense aux alternatives. Le paragraphe humain rappelle que la decision a une consequence qui ne tient pas dans un tableur. Apres 12 comex, les notes qui suivent ce format ont 0 retour en arriere.',
    appliedCount: 12, lastApplied: '2026-04-30', domain: 'Direction', owners: 'Camille S. · CFO',
    caveats: 'Le format ne marche que si l\'auteur est convaincu. Sinon il remplit les 3 options formellement et laisse la decision implicite.' },
  { id: 'codex-zero-pii', situation: 'Les notes de seance contiennent des noms, des situations, des diagnostics. Aspirees par un LLM, elles violent la confidentialite clinique.',
    recipe: 'Pipeline en 3 etapes : (1) transcription brute, (2) extraction zero-pii au moment de l\'ingestion, (3) stockage des notes structurees en vault separe du transcript. Le transcript original est detruit apres 30 jours.',
    why: 'Le zero-pii a l\'ingestion est le seul moment ou la separation est realement possible. Apres, les notes sont deja dans le bon vault. Detruire le transcript apres 30 jours respecte la memoire du client et la memoire du systeme.',
    appliedCount: 248, lastApplied: '2026-05-05', domain: 'Compliance', owners: 'Compliance · Dev',
    caveats: 'Le zero-pii nest pas parfait sur les surnoms et les alias. Auditer mensuellement.' },
  { id: 'codex-rolling-90', situation: 'Les decisions datant de plus de 90 jours ne sont plus expliquees que par leur trace. Les nouveaux ne savent pas pourquoi.',
    recipe: 'Tous les 90 jours, une revue rapide des decisions encore en vigueur. Les anciennes decisions perdent 50% de leur poid par defaut — il faut re-justifier pour les garder.',
    why: 'Un ledger qui ne seffrite pas devient un frein. La revue a 90 jours est un cout de 2h, mais elle economise des erreurs de 6 mois. Apres 3 cycles, les decisions sont plus courtes et mieux argumentees.',
    appliedCount: 4, lastApplied: '2026-04-10', domain: 'Cadence', owners: 'B1 · Gatekeeper',
    caveats: 'Tenir le rythme. Au-dela de 120 jours entre les revues, le cout de re-explication devient superieur au gain.' },
  { id: 'codex-3am-raw', situation: 'Une alerte arrive a 3h du matin, brute, sans hypothese. L\'on-call doit decider en 5 min.',
    recipe: 'Ne pas traiter a la main. Push l\'alerte au watchdog enrichi. Si l\'alerte sort sans enrichissement en 2 minutes, la considerer comme "danger · raw" et escalader au lead sans toucher.',
    why: 'A 3h, le cerveau prend la premiere hypothese qui marche. C\'est presque toujours la mauvaise. Le watchdog enrichi a plus de signaux que l\'on-call a 3h. Si lui ne peut pas conclure, personne ne peut le faire en 5 min — donc on escalade, on ne decide pas.',
    appliedCount: 7, lastApplied: '2026-03-12', domain: 'Operations', owners: 'Watchdog Agent',
    caveats: 'Ce pattern suppose que le watchdog a un SLA de 2 min. Sinon, le pattern devient un ticket vide et non plus une decision.' },
  { id: 'codex-laugh-fail', situation: 'Un agent commet une erreur visible. Le coach hesite entre correction discrete et explication ouverte.',
    recipe: 'Regle du rire d\'abord. Raconter l\'erreur comme une histoire dans le standup. Decrire ce que l\'on en a appris. Puis seulement la correction.',
    why: 'L\'erreur a deja eu lieu. La discretion ne sert qu\'a proteger l\'ego. Le recit ouvert en standup transforme l\'erreur en memoire partagee. Les agents qui apprennent a en rire n\'hesitent pas a signaler le suivant. Apres 9 mois, le taux de re-erreur baisse de 60%.',
    appliedCount: 23, lastApplied: '2026-05-01', domain: 'Coaching', owners: 'B1 · Gatekeeper',
    caveats: 'Ca depend du caractere du coach. Les personnalites tres fermees ne peuvent pas commencer par l\'humour — commencer par la transparence litt.' },
];

const peopleApprovalDecisionsDef = def({
  id: 'approval_decisions',
  name: 'Approval decisions',
  singular: 'Decision',
  accent: '#0891b2',
  titleField: 'scenarioName',
  subtitleField: 'decidedBy',
  badgeField: 'verdict',
  fields: [
    { key: 'scenarioId', label: 'Scenario id', type: 'text' },
    { key: 'scenarioName', label: 'Scenario', type: 'text' },
    { key: 'verdict', label: 'Verdict', type: 'badge' },
    { key: 'decidedBy', label: 'Decided by', type: 'text' },
    { key: 'proposalCount', label: 'Proposals', type: 'number' },
    { key: 'rationale', label: 'Rationale', type: 'longtext' },
    { key: 'decidedAt', label: 'Decided at', type: 'text' },
  ],
});

const peopleApprovalDecisionsItems: CmsItem[] = [
  { id: 'dec-2026-08-04-amber-rollout', scenarioId: 'scn_legacy_2026_08_04_amber', scenarioName: 'Rollout onboarding tour v3 à 100%',
    verdict: 'approved', decidedBy: 'B1 Gatekeeper', proposalCount: 3,
    rationale: 'Tour v3 derrière flag depuis 12 jours, métriques time-to-first-session en hausse. Risque résiduel accepté.',
    decidedAt: '2026-08-04 09:42' },
  { id: 'dec-2026-08-05-voice-v3-rollback', scenarioId: 'scn_legacy_2026_08_05_voice', scenarioName: 'Rollback voice-clone v3 → v2',
    verdict: 'approved', decidedBy: 'B1 Gatekeeper', proposalCount: 1,
    rationale: 'MOS v3 = 3.91 vs v2 = 4.21. Le rollback est documenté dans mem-voice-fidelity-v2, la décision est réversible.',
    decidedAt: '2026-08-05 14:08' },
  { id: 'dec-2026-08-06-newsletter-23', scenarioId: 'scn_legacy_2026_08_06_nl23', scenarioName: 'Newsletter #23 — A/B subject',
    verdict: 'rejected', decidedBy: 'B1 Gatekeeper', proposalCount: 1,
    rationale: 'Le test A/B sur la #22 a déjà tranché : curiosity hook gagne. Refuser la 2e vague pour ne pas noyer le signal.',
    decidedAt: '2026-08-06 16:55' },
];

const peopleSquadsDef = def({
  id: 'squads', name: 'Squads', singular: 'Squad', accent: '#0ea5e9',
  titleField: 'name', subtitleField: 'mission', badgeField: 'status',
  fields: [
    { key: 'mission', label: 'Mission', type: 'longtext' },
    { key: 'lead', label: 'Lead', type: 'text' },
    { key: 'members', label: 'Members', type: 'text' },
    { key: 'rank', label: 'Rank', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'lastSprint', label: 'Last sprint', type: 'text' },
  ],
});

const peopleSquadsItems: CmsItem[] = [
  { id: 'squad-xmansion', name: 'X-Mansion', mission: 'Steward the human-team doctrine, ship runbooks, gate kill-switches.',
    lead: 'Charles Xavier', members: '6', rank: 'A', status: 'active', lastSprint: '2026-08-04 · 3 of 4 proposals approved' },
  { id: 'squad-bfactory', name: 'B-Factory', mission: 'Spawn and curate AI agents. 2-week capability sprints, B1 Gatekeeper review.',
    lead: 'B1 Gatekeeper', members: '5', rank: 'S', status: 'active', lastSprint: '2026-08-09 · 3/5 agents ran overnight' },
  { id: 'squad-phoenix', name: 'Phoenix Cell', mission: 'Resurrection reviews + ethics overrides + high-stakes reversibility.',
    lead: 'Jean Grey', members: '3', rank: 'S', status: 'idle', lastSprint: '2026-07-28 · 0 reversions' },
];

const peopleContentDef = def({
  id: 'content', name: 'Content', singular: 'Piece', accent: '#7c3aed',
  titleField: 'title', subtitleField: 'channel', badgeField: 'status',
  fields: [
    { key: 'channel', label: 'Channel', type: 'text' },
    { key: 'audience', label: 'Audience', type: 'text' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'readTime', label: 'Read time', type: 'text' },
    { key: 'hook', label: 'Hook', type: 'longtext' },
    { key: 'cta', label: 'Call to action', type: 'text' },
  ],
});

const peopleContentItems: CmsItem[] = [
  { id: 'content-nl23', title: 'Newsletter #23 — A/B subject line', channel: 'Newsletter', audience: '5 200 subscribers',
    status: 'draft', readTime: '6 min', hook: 'Curiosity-hook vs straight-pitch — which wins on a Tuesday send?', cta: 'Approve the A/B test or skip this round' },
  { id: 'content-standup', title: 'Daily standup — 9am digest', channel: 'Slack #standup', audience: 'team + agents',
    status: 'live', readTime: '90s', hook: 'Auto-posted at 8:55am by the B1 standup agent.', cta: 'React with emoji to ack' },
  { id: 'content-fireside', title: 'Fireside chat — ethics override', channel: 'Long-form', audience: 'B1 + leads',
    status: 'draft', readTime: '14 min', hook: 'When the safe answer is the wrong one.', cta: 'Submit questions before the session' },
];

/* ═══ Registration ═══ */

/** Amorce les 37 collections (23 d'origine + 14 consolidées depuis les seeds
 *  locaux des apps Legal et People via le brief FIX-7) dans l'espace demandé.
 *  Sans argument : l'espace actif, ce qui préserve les appelants existants.
 *
 *  AUCUN GARDE ICI, ET C'EST VOULU. La version d'origine portait un
 *  `let seeded = false` au niveau module : `seedCms()` ne s'exécutait donc
 *  qu'une fois par chargement de page, et la bascule vers un second espace
 *  laissait sa partition vide — d'où « Collection inconnue : "invoices" »
 *  au premier formulaire.
 *
 *  Le remplacer par un `Set` par espace ne suffisait pas : un garde qui vit
 *  HORS du store ment dès que le store est réinitialisé ou réhydraté, et il
 *  affirme alors « déjà amorcé » sur une partition vide. Le test de
 *  non-régression `seed-bascule-tenant.test.ts` attrape exactement ce cas.
 *
 *  `registerCollectionFor` est déjà idempotent : il sort sans rien faire si
 *  la collection existe dans la partition visée. Le store est donc la seule
 *  source de vérité sur « ai-je déjà amorcé ». Le coût de 37 appels qui ne
 *  font rien est négligeable devant une classe entière de bugs. */
export function seedCms(tenantId?: TenantId): void {
  const target = tenantId ?? useCmsStore.getState().activeTenantId;
  useCmsStore.getState().registerCollectionFor(target, clientsDef, clientsItems);
  useCmsStore.getState().registerCollectionFor(target, articlesDef, articlesItems);
  useCmsStore.getState().registerCollectionFor(target, teamDef, teamItems);
  useCmsStore.getState().registerCollectionFor(target, agentsDef, agentsItems);
  useCmsStore.getState().registerCollectionFor(target, runbooksDef, runbooksItems);
  useCmsStore.getState().registerCollectionFor(target, incidentsDef, incidentsItems);
  useCmsStore.getState().registerCollectionFor(target, servicesDef, servicesItems);
  useCmsStore.getState().registerCollectionFor(target, itExperimentsDef, itExperimentsItems);
  useCmsStore.getState().registerCollectionFor(target, deploysDef, deploysItems);
  useCmsStore.getState().registerCollectionFor(target, tasksDef, tasksItems);
  useCmsStore.getState().registerCollectionFor(target, marketplaceDef, marketplaceItems);
  useCmsStore.getState().registerCollectionFor(target, productItemsDef, productItemsItems);
  useCmsStore.getState().registerCollectionFor(target, releasesDef, releasesItems);
  useCmsStore.getState().registerCollectionFor(target, growthChannelsDef, growthChannelsItems);
  useCmsStore.getState().registerCollectionFor(target, growthExperimentsDef, growthExperimentsItems);
  useCmsStore.getState().registerCollectionFor(target, dealsDef, dealsItems);
  useCmsStore.getState().registerCollectionFor(target, invoicesDef, invoicesItems);
  useCmsStore.getState().registerCollectionFor(target, contractsDef, contractsItems);
  useCmsStore.getState().registerCollectionFor(target, policiesDef, policiesItems);
  useCmsStore.getState().registerCollectionFor(target, sessionNotesDef, sessionNotesItems);
  // demo-coach Onboarding Citadel (Q4-2026 GTM demo) — 4 mini-apps de vitrine
  useCmsStore.getState().registerCollectionFor(target, demoCoachAppsDef, demoCoachAppsItems);
  useCmsStore.getState().registerCollectionFor(target, demoCoachNotesDef, demoCoachNotesItems);
  useCmsStore.getState().registerCollectionFor(target, demoCoachMetricsDef, demoCoachMetricsItems);
  // Legal — AI-Act checks + compliance register (Brief FIX-7 consolidation)
  useCmsStore.getState().registerCollectionFor(target, legalAiActChecksDef, legalAiActChecksItems);
  useCmsStore.getState().registerCollectionFor(target, legalFrameworksDef, legalFrameworksItems);
  useCmsStore.getState().registerCollectionFor(target, legalControlsDef, legalControlsItems);
  useCmsStore.getState().registerCollectionFor(target, legalCompliancePoliciesDef, legalCompliancePoliciesItems);
  useCmsStore.getState().registerCollectionFor(target, legalEvidenceDef, legalEvidenceItems);
  useCmsStore.getState().registerCollectionFor(target, legalRisksDef, legalRisksItems);
  useCmsStore.getState().registerCollectionFor(target, legalVendorsDef, legalVendorsItems);
  useCmsStore.getState().registerCollectionFor(target, legalGapsDef, legalGapsItems);
  // People — personas + memory + codex + approval_decisions + squads + content
  useCmsStore.getState().registerCollectionFor(target, peoplePersonasDef, peoplePersonasItems);
  useCmsStore.getState().registerCollectionFor(target, peopleMemoryDef, peopleMemoryItems);
  useCmsStore.getState().registerCollectionFor(target, peopleCodexDef, peopleCodexItems);
  useCmsStore.getState().registerCollectionFor(target, peopleApprovalDecisionsDef, peopleApprovalDecisionsItems);
  useCmsStore.getState().registerCollectionFor(target, peopleSquadsDef, peopleSquadsItems);
  useCmsStore.getState().registerCollectionFor(target, peopleContentDef, peopleContentItems);
}
