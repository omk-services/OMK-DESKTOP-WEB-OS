-- =====================================================================
-- 20260811000005_seed.sql
-- Compte de démonstration Coach OS — projet INTERN uniquement.
--
-- Brief-F-2026-08-11 §Livrable 3. Le seed ici doit raconter EXACTEMENT
-- la même histoire que src/lib/cms/seed.ts. Sinon, la démo vidéo
-- ment : on voit des chiffres dans l'app qui ne sont pas ceux en base.
--
-- Trois phases :
--   1. L'organisation "Demo Coach" (UUID connu, stable).
--   2. Les 23 collections de la seed, attachées à cet org_id.
--   3. Le profil + la membership pour le user démo (UUID à créer par
--      l'utilisateur via Dashboard ou sign-up edge function — la
--      migration ne peut pas créer un auth.users en SQL seul).
--
-- Si tu lis la seed TypeScript (src/lib/cms/seed.ts), chaque ligne
-- ici correspond 1-1 à une entrée du seed.ts.
-- =====================================================================

-- ─── Phase 1 : l'organisation démo ─────────────────────────────────────
-- UUID fixé pour que les tests, la doc, et le code TS puissent le
-- citer directement. C'est aussi l'UUID que le code TypeScript
-- utilise comme `org_id` de référence.
insert into public.organizations (id, slug, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'demo-coach', 'Demo Coach')
on conflict (id) do nothing;

-- ─── Phase 2 : les 23 collections ──────────────────────────────────────
-- Toutes les lignes sont attachées à l'org '00000000-0000-0000-0000-000000000001'.
-- Le tenant_id est 'demo_coach' (mapping côté TS via TENANT_DEMO_COACH
-- — voir src/lib/tenant/contract.ts §66).

-- ─── 1. clients ────────────────────────────────────────────────────────
insert into public.cms_clients (org_id, tenant_id, slug, name, segment, ticket, open_threads, next_session, health, onboarding_step, status) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'ava-chen',          'Ava Chen',           'Citadelle — high ticket',          1800, 4, 'Thu 14:00',              88, null, 'Active'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'marcus-reyes',       'Marcus Reyes',       'Programme — 12 weeks',             2500, 2, 'Fri 10:30',              80, null, 'Active'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'priya-nandan',       'Priya Nandan',       'Citadelle — high ticket',          1800, 1, 'Mon 09:00',              71, null, 'Active'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'atelier-bricolage',  'Atelier Bricolage',  'Onboarding — step 3 of 7',         1000, 3, 'Not scheduled',          null, '3 / 7', 'Onboarding'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'techflow',           'TechFlow',           'Onboarding — step 1 of 7',         1000, 5, 'Not scheduled',          null, '1 / 7', 'Onboarding'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'studio-nord',        'Studio Nord',        'Citadelle — high ticket',          1800, 0, 'No session in 21 days',  null, null, 'At risk');

-- ─── 2. articles ───────────────────────────────────────────────────────
insert into public.cms_articles (org_id, tenant_id, slug, title, category, reads, updated, body) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'quiz-scoring',       'How the diagnostic quiz scores a lead', 'Growth',    42, '2d ago', 'The quiz weighs 6 signals — booked-out ratio, delegation gaps, and time-to-decision — into a single 0-100 score. Above 70 routes straight to a demo invite.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'escalation',         'When to escalate to the coach vs. auto-reply', 'Support',   31, '4d ago', 'Auto-reply handles scheduling, billing questions, and FAQ. Anything touching a client''s emotional state or a contract change escalates immediately.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'zero-pii',           'Data residency & the Zero-PII seal', 'Security',   27, '1w ago', 'Every byte stays inside the client''s own Citadelle instance. The seal panics-locks all egress on demand and is audited in the Compliance Ledger.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'onboarding-7',       'The 7-step onboarding runbook', 'Onboarding',  19, '3d ago', 'Welcome call → contract → Zero-PII walkthrough → first diagnostic → calendar sync → first session brief → 30-day check-in.');

-- ─── 3. team ───────────────────────────────────────────────────────────
insert into public.cms_team (org_id, tenant_id, slug, name, role, focus, status, bio) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'professor-x',  'Professor X',  'Head of People',    'Strategy · ethics guard',         'online', 'Sets the strategic accounts view and the ethics guardrails every People decision runs through.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'jean-grey',    'Jean Grey',    'Talent & Conflict', 'Emotional intelligence',         'online', 'Reads the room before anyone else does — conflict resolution and telepathic-grade empathy.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'storm',        'Storm',        'Culture Weather',   'Diversity · atmosphere',          'idle',   'Owns the culture climate: diversity initiatives and the day-to-day atmosphere of the practice.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'wolverine',    'Wolverine',    'Hiring — tough roles', 'Retention',                    'online', 'Handles the hires nobody else wants to make, and keeps the fiercely loyal ones around.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'beast',        'Beast',        'Learning & Dev',     'L&D · rigor',                   'online', 'Scientific rigor applied to every learning path — no hand-wavy training programs.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'nightcrawler', 'Nightcrawler', 'Mobility',           'Internal transfers',             'idle',   'Bridges teams — internal transfers and talent mobility across the practice.');

-- ─── 4. people_agents ──────────────────────────────────────────────────
insert into public.cms_people_agents (org_id, tenant_id, slug, name, task, status) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'onboarding-agent',     'Onboarding Agent',     'Runs the 7-step welcome for new clients', 'running'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'culture-pulse-agent',  'Culture Pulse Agent',  'Weekly sentiment scan across channels',   'running');

-- ─── 5. runbooks ───────────────────────────────────────────────────────
insert into public.cms_runbooks (org_id, tenant_id, slug, title, category, updated, steps) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'onboarding-runbook',   'Client onboarding — 7 steps',   'Onboarding',   '2d ago', 'Welcome call → contract → Zero-PII walkthrough → first diagnostic → calendar sync → first session brief → 30-day check-in.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'close-checklist',      'Monthly close checklist',       'Finance ops',  '5d ago', 'Reconcile Stripe → verify invoice status → export P&L → flag past-due accounts → archive month.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'incident-response',    'Incident response — data egress','Security',    '1w ago', 'Trigger Zero-PII panic lock → identify source → notify affected client if any → log in Compliance Ledger → post-mortem within 48h.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'human-handoff',        'Handoff to a human specialist', 'Support',     '3d ago', 'Detect emotional/contract-sensitive topic → draft context summary → route to coach → confirm handoff in thread.');

-- ─── 6. incidents ──────────────────────────────────────────────────────
insert into public.cms_incidents (org_id, tenant_id, slug, title, when_text, severity, resolution) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'egress-blocked', 'Egress attempt blocked — unknown integration', '09:15',     'danger', 'Zero-PII seal auto-locked egress. Reviewed the integration request, confirmed it was not authorized, permanently blocked the endpoint.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'stripe-retry',   'Stripe webhook retried (transient)',           'Yesterday', 'warn',   'Webhook delivery failed once due to a timeout, succeeded on automatic retry. No client impact.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'backup-verified','Backup verified — 6 clients',                  '2d ago',    'ok',     'Routine backup integrity check passed for all 6 active client records.');

-- ─── 7. services ───────────────────────────────────────────────────────
insert into public.cms_services (org_id, tenant_id, slug, name, note, status, detail) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'supabase-omk-saas',  'Supabase — omk_saas',         'p95 42ms',           'ok',   'Primary Postgres for tenant data. p95 read latency 42ms over the last 24h, 0 failed connections.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'vercel-coach-dashboard', 'Vercel — coach dashboard', 'READY',              'ok',   'Latest deploy promoted to production, all health checks green.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'edge-signup-org',  'Edge — sign-up-organization', 'invoked 12×',        'ok',   'Idempotent org-creation function. 12 invocations today, 0 errors.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'agent-runtime-m3', 'Agent runtime (M3)',          'queue depth 3',      'warn', 'MiniMax M3 runtime queue is backing up slightly — 3 jobs waiting. Not yet critical.');

-- ─── 8. it_experiments ──────────────────────────────────────────────────
insert into public.cms_it_experiments (org_id, tenant_id, slug, title, stage, meta, notes) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'voice-clone-v3',     'Voice-clone tuning v3',           'idea',     'lift retention?',        'Hypothesis: tighter voice-clone fidelity increases reply rate on drafted outreach.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'auto-brief-calendar','Auto-brief from calendar',         'idea',     'spike',                  'Spike: generate a session brief automatically from the calendar event description.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'langgraph-supervisor','LangGraph supervisor',           'building', 'Summers → workers',      'B1 Summers as supervisor node, dispatching to B2/B3 worker agents via LangGraph.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'zero-pii-lock',      'Zero-PII egress lock',            'shipped',  'live',                   'Panic-lock button, live in production, audited via Compliance Ledger.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'audit-quiz-scoring', 'Audit-quiz scoring',              'shipped',  'live',                   '6-signal diagnostic scoring, live on the Pipeline app.');

-- ─── 9. deploys ────────────────────────────────────────────────────────
insert into public.cms_deploys (org_id, tenant_id, slug, commit, target, when_text, status) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deploy-b933e4e', 'b933e4e', 'coach dashboard',  '2h ago',     'READY'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deploy-a7c1f02', 'a7c1f02', 'edge functions',   'yesterday',  'READY'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deploy-4de88ab', '4de88ab', 'agent runtime',    '3d ago',     'rolling');

-- ─── 10. tasks ─────────────────────────────────────────────────────────
insert into public.cms_tasks (org_id, tenant_id, slug, label, when_text, "group", done) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 't1', 'Approve 2 outreach drafts',     'due 11:00',  'today',     'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 't2', 'Review TechFlow proposal',      'due today',  'today',     'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 't3', 'Renewal call — Ava Chen',       'Thu 14:00',  'upcoming',  'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 't4', 'Quarterly finance close',       'next week',  'upcoming',  'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 't5', 'Publish newsletter #18',        'Fri',        'upcoming',  'false');

-- ─── 11. marketplace_listings ───────────────────────────────────────────
insert into public.cms_marketplace_listings (org_id, tenant_id, slug, name, tag, blurb, installed, featured) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'stripe-billing', 'Stripe Billing',   'Finance',     'Invoicing & subscriptions, reconciled nightly', 'Yes', 'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'calendly-sync',  'Calendly Sync',    'Scheduling',  'Auto-brief before every booked session',         'Yes', 'true'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'linkedin-reach', 'LinkedIn Reach',   'Growth',      'Draft outreach in your voice',                   'No',  'true'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'notion-export',  'Notion Export',    'Knowledge',   'Push session notes to your workspace',           'No',  'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'docusign',       'DocuSign',         'Legal',       'Send & track engagement letters',                'No',  'false'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'loom-recaps',    'Loom Recaps',      'Delivery',    'Turn a session into a shareable recap',          'No',  'true');

-- ─── 12. product_items ─────────────────────────────────────────────────
insert into public.cms_product_items (org_id, tenant_id, slug, title, stage, meta, priority) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'client-vault-v2',     'Client Vault v2',                 'now',     'auto-brief + notes', 'high'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'voice-approvals',     'Voice Studio approvals',          'now',     '1-click publish',    'high'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'pipeline-scoring-v2', 'Pipeline scoring v2',             'next',    'quiz weighting',     'med'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'compliance-export',   'Compliance export',               'next',    '1-query audit',     'med'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'multi-tenancy',       'Multi-coach tenancy',             'later',   'H90',               'low'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'keyboard-shortcuts',  'Keyboard shortcuts for app launch','backlog', 'backlog',           'med'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'dark-mode',           'Dark mode for the whole OS',      'backlog', 'backlog',           'med'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'offline-cache',       'Offline-first cache for Client Vault','backlog','backlog',         'high');

-- ─── 13. product_releases ──────────────────────────────────────────────
insert into public.cms_product_releases (org_id, tenant_id, slug, name, version, when_text, notes) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'release-v0-9', 'Citadelle shell',     'v0.9', 'this week', 'Forked the Life OS window shell, re-skinned light, wired 13 Coach OS apps.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'release-v0-8', 'Zero-PII seal',       'v0.8', '2w ago',    'One-tap panic lock for all outbound calls, audited in Compliance Ledger.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'release-v0-7', 'Audit-quiz pipeline', 'v0.7', '1mo ago',   '6-signal diagnostic scoring live on the Pipeline app.');

-- ─── 14. growth_channels ────────────────────────────────────────────────
insert into public.cms_growth_channels (org_id, tenant_id, slug, name, leads_label, leads, cac, trend) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'intro-co',        'Intro.co marketplace',  '38 leads', 38,  41,   '↑ 12%'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'linkedin-voice',  'LinkedIn (in your voice)', '27 leads', 27,  0,    '↑ 8%'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'referral',        'Referral',               '14 leads', 14,  0,    'flat'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'paid-search',     'Paid search',            '7 leads',  7,   188,  '↓ 5%');

-- ─── 15. growth_experiments ────────────────────────────────────────────
insert into public.cms_growth_experiments (org_id, tenant_id, slug, title, lift, notes) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'quiz-headline',     'Quiz headline: "score your practice"', '+18% starts',    'Reframing the CTA around self-diagnosis outperformed the generic "take our quiz" framing.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'followup-timing',   'Send follow-up at +2h vs +24h',         '+9% replies',    'Faster follow-up while the diagnostic score is still fresh in mind wins meaningfully.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'video-vs-live',     'Video demo vs. live call',              'inconclusive',  'Not enough sample size yet — rerun next quarter with a larger cohort.');

-- ─── 16. deals ─────────────────────────────────────────────────────────
insert into public.cms_deals (org_id, tenant_id, slug, client, offer, value, stage) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deal-marcus', 'Marcus Reyes', 'Programme',  2500, 'Qualified'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deal-amara',  'Amara Bello',  'Citadelle',  1000, 'Qualified'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deal-dara',   'Dara Okafor',  'Programme',  2500, 'Proposal'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deal-ava',    'Ava Chen',     'Citadelle',  1800, 'Won'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'deal-priya',  'Priya Nandan', 'Citadelle',  1800, 'Won');

-- ─── 17. invoices ──────────────────────────────────────────────────────
insert into public.cms_invoices (org_id, tenant_id, slug, client, amount, due, status) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'invoice-ava',    'Ava Chen',     1800, 'Jul 01', 'Paid'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'invoice-priya',  'Priya Nandan', 1800, 'Jul 01', 'Paid'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'invoice-marcus', 'Marcus Reyes', 2500, 'Jul 15', 'Sent');

-- ─── 18. contracts ─────────────────────────────────────────────────────
insert into public.cms_contracts (org_id, tenant_id, slug, document, client, signed, status) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'contract-ava-eng',    'Coaching engagement', 'Ava Chen',     'Jun 12', 'Active'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'contract-ava-dpa',    'DPA — data processing', 'Ava Chen',    'Jun 12', 'Active'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'contract-marcus-eng', 'Coaching engagement', 'Marcus Reyes', '—',      'Out for signature');

-- ─── 19. policies ──────────────────────────────────────────────────────
insert into public.cms_policies (org_id, tenant_id, slug, name, updated, body) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'privacy-policy',           'Privacy policy',                '3mo ago', 'Governs how client data is collected, used, and never shared. Zero-PII: nothing trains an outside model.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'data-residency',           'Data residency & Zero-PII',     '1mo ago', 'Every byte stays inside the coach''s own Citadelle instance. Egress is filtered and can be panic-locked instantly.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'cancellation-portability', 'Cancellation & data portability','2mo ago', 'Cancel anytime. Full data export available on request — your business data leaves with you.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'acceptable-use',           'Acceptable use',                '4mo ago', 'Defines what the AI agents may and may not do on the coach''s behalf, and the human-in-the-loop boundaries.');

-- ─── 20. session_notes ─────────────────────────────────────────────────
insert into public.cms_session_notes (org_id, tenant_id, slug, topic, client_name, date_text, duration, sentiment, body) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'sn-1', 'Q3 pricing repositioning',  'Ava Chen',     'Thu, Jul 18', '50 min', 'Breakthrough', 'Ava is ready to raise her flagship offer from $1,800 to $2,400/mo starting Q4. Walked through the objection-handling script for existing clients grandfathered at the old rate. Action: draft the rate-change email by Friday, she reviews before sending.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'sn-2', 'Burnout check-in',          'Marcus Reyes', 'Fri, Jul 12', '45 min', 'Watch',       'Marcus mentioned feeling stretched across 3 cohort launches at once. Recommended he pause new enrollment for 2 weeks. He pushed back — flag for next session, do not let this drop.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'sn-3', 'IP framework: The Weight Method', 'Priya Nandan', 'Mon, Jul 8',  '60 min', 'Breakthrough', 'Priya finally articulated her proprietary "Weight Method" clearly enough to document. Captured the 4-stage structure verbatim — this is the seed for her signature framework page and future book chapter 3.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'sn-4', 'Contract renewal friction', 'Studio Nord',  'Tue, Jun 30', '30 min', 'Watch',       'Studio Nord has not scheduled a session in 21 days. Left a voicemail. If no response by next week, escalate to the at-risk retention sequence.');

-- ─── 21. demo_coach_apps ───────────────────────────────────────────────
insert into public.cms_demo_coach_apps (org_id, tenant_id, slug, name, category, tagline, metric, story) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'app-ip-vault',            'IP Vault',                  'Sanctuary',    'Every session, capturable. Yours forever.',         '~12h capture / month', 'Ava drafted The Weight Method across three sessions. With Nexus, those notes are auto-structured into a vault the moment the session ends — searchable, exportable, fully owned by you. No SaaS trains on it. Zero data egress.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'app-session-transcript',  'Session Transcript → Content Dam', 'Compounding', 'Speak once. Twelve assets publish.',           '~40h repurposing / quarter', 'Marcus ran one podcast episode. Nexus drafted twelve assets from a single transcript: a LinkedIn post, a newsletter, three short social clips, a waitlist magnet, a follow-up nurture email — all drafted in your voice, ready for your approval before publish.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'app-quiz-result',         'QuizResult · Personalised Audit Preview', 'Diagnostic', 'Diagnose your capture gaps.', 'audit ready in ~22 min', 'Your specific pattern: too many client notes still live on paper. Your Nexus recommendation: route everything through the Vault first, then let the agents structure it. Estimated first-month time saved: 6h.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'app-compliance',          'Compliance Dashboard',       'Compliance',   'Audit log, ready when the regulators ask.',        '0 days to audit pack', 'Every AI action logged with timestamp + agent id + reversibility flag. Export a CCPA / Colorado AI Act audit pack in two clicks. No public SaaS touches your client data — not for training, not for inference, not ever.');

-- ─── 22. demo_coach_notes ──────────────────────────────────────────────
insert into public.cms_demo_coach_notes (org_id, tenant_id, slug, topic, client_name, date_text, duration, sentiment, body) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'dn-1', 'Q3 pricing repositioning',  'Ava Chen',     'Thu, Jul 18', '50 min', 'Breakthrough', 'Ava is ready to raise her flagship offer from $1,800 to $2,400/mo starting Q4. Walked through the objection-handling script for existing clients grandfathered at the old rate. Action: draft the rate-change email by Friday, she reviews before sending.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'dn-2', 'Burnout check-in',          'Marcus Reyes', 'Fri, Jul 12', '45 min', 'Watch',       'Marcus mentioned feeling stretched across 3 cohort launches at once. Recommended he pause new enrollment for 2 weeks. He pushed back — flag for next session, do not let this drop.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'dn-3', 'IP framework: The Weight Method', 'Priya Nandan', 'Mon, Jul 8',  '60 min', 'Breakthrough', 'Priya finally articulated her proprietary "Weight Method" clearly enough to document. Captured the 4-stage structure verbatim — this is the seed for her signature framework page and future book chapter 3.');

-- ─── 23. demo_coach_metrics ────────────────────────────────────────────
insert into public.cms_demo_coach_metrics (org_id, tenant_id, slug, label, value, unit, story) values
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'm-1', 'Time saved / month',    6,    'h',       'Estimated first-month time saved against your current paper-notes routine, based on your onboarding answers.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'm-2', 'Vault entries / week',  4,    'entries', 'How many session-note captures you would actually accumulate in the Vault once it is wired to your calendar.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'm-3', 'Compliance flags / quarter', 0, 'flags',   'Number of prospective compliance gaps Nexus would have flagged in your last 90 days of client interactions.'),
  ('00000000-0000-0000-0000-000000000001', 'demo_coach', 'm-4', 'Premium tier ready',    4,    '/4',      'How many of the four demoed mini-apps match your routine on the audit trail. All four line up against your onboarding answers.');

-- =====================================================================
-- Phase 3 : profil + membership du user démo.
-- UUID à remplacer par celui créé via Dashboard (Authentication → Users
-- → Add user → "demo@coach-os.app"). L'UUID est visible dans la barre
-- d'URL après création. On ne peut pas créer d'auth.users depuis SQL
-- sans service_role, donc l'utilisateur fait cette étape à la main.
-- =====================================================================

-- Une fois le user créé dans le Dashboard :
--   insert into public.profiles (id, display_name, email) values
--     ('<UUID_DU_DASHBOARD>', 'Demo Coach', 'demo@coach-os.app');
--
--   insert into public.memberships (user_id, org_id, role) values
--     ('<UUID_DU_DASHBOARD>', '00000000-0000-0000-0000-000000000001', 'owner');
--
-- Puis activer le hook JWT (cf. VERIFICATION_RLS.md §1).
-- Tester via :
--   select public.get_my_claims(); -- doit retourner org_id = 00000000-...
--   select count(*) from public.cms_clients; -- doit retourner 6

-- =====================================================================
-- Auth providers — déclarés ici en commentaire.
-- Activation via Dashboard UI : Authentication → Providers.
--   - Email : activé par défaut
--   - Google  : OAuth client_id + secret
--   - Apple   : Services ID + key + team_id
--   - Microsoft (Azure AD) : client_id + secret + tenant
-- La migration SQL n'écrit rien dans auth.config — c'est une config
-- runtime, pas un schema. Voir supabase/README.md pour la procédure.
-- =====================================================================
