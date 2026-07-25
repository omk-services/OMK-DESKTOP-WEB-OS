/** Landing pages — Circle.so-style pages, one per Coach OS business domain.
 *  Each page is fully self-contained: hero, features, testimonials, stats,
 *  pricing, FAQ, closing. The Welcome app sidebar lets A+ browse pages, the
 *  Header Menu (sticky in-page nav) jumps between sections of the active page.
 *  Canon D1 source: pages are written from the OMK AaaS canon (Pricing USD
 *  tiers per ADR-AAAS-PRICING-001, US-only market per ADR-L2-AAAS-US-ONLY-001). */

import type { LandingPage } from './pageSchema';

const RATING_CHIPS = ['G2', 'Capterra', 'App Store', 'Play Store'];

export const LANDING_PAGES: LandingPage[] = [
  {
    id: 'people-agents',
    brand: 'OMK People',
    domain: 'people.omknexus.io',
    tagline: 'The AI-augmented workforce for premium coaches.',
    hero: {
      eyebrow: 'AaaS — As-a-Service',
      headline: 'Your team and your agents, finally on the same payroll.',
      sub: 'OMK People gives premium coaches a sovereign cockpit to hire AI agents the same way they hire humans: onboarding packet, scoped mandate, weekly review, observable outcomes.',
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      secondaryCta: { label: 'Watch 2-min demo', href: '#features' },
      rating: { stars: 5, count: '70k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Trusted by 15,000+ coaches across 4,200 communities',
      logos: [
        { name: 'Forte Labs', monogram: 'FL' },
        { name: 'Ali Abdaal', monogram: 'AA' },
        { name: 'Lovable', monogram: 'Lv' },
        { name: 'English with Lucy', monogram: 'EL' },
        { name: 'Harvard', monogram: 'Hv' },
        { name: 'Mel Robbins', monogram: 'MR' },
        { name: 'Good Inside', monogram: 'GI' },
      ],
    },
    features: [
      {
        id: 'agents',
        eyebrow: 'Fleet',
        title: '5 AI agents, one workspace',
        body: 'Orchestrator, Scout, Scribe, Reach, and Dev — each with its own mandate, rate-limit, and review cadence. They route work the same way your human team routes Slack threads.',
        bullets: ['Per-agent SLA & capacity', 'Audit trail per conversation', 'Handoff to humans on demand'],
        visual: 'agents',
      },
      {
        id: 'onboarding',
        eyebrow: 'Onboarding',
        title: 'Agent onboarding packets, scoped mandates, weekly reviews',
        body: 'Every agent joins with the same intake A+ would run on a human hire: identity check, mandate, escalation rules, kill switch. No agent ships without a contract.',
        bullets: ['Identity Vault per agent', 'Mandate doc with revocation', 'Friday review template'],
        visual: 'community',
      },
      {
        id: 'observability',
        eyebrow: 'Trust',
        title: 'Every action is observable, every mandate is reversible',
        body: 'You see what every agent saw, decided, and shipped — in the same dashboard where you track human output. The kill switch is one keystroke, never one phone call.',
        bullets: ['Replay any conversation', 'Export as evidence', 'CCPA + state AI-law ready'],
        visual: 'revenue',
      },
    ],
    stats: [
      { value: '12 hrs', label: 'Reclaimed per coach / week' },
      { value: '4.2×', label: 'Faster agent onboarding vs freelance' },
      { value: '99.9%', label: 'Mandate compliance, audited' },
      { value: '$0', label: 'Hidden rate-limit overages' },
    ],
    testimonials: [
      {
        quote: 'We replaced 3 freelance VAs with 5 OMK agents in a weekend. The mandates alone saved us a quarter of legal review.',
        author: 'Tiago Forte',
        role: 'Founder',
        company: 'Forte Labs',
        metric: { value: '$194M', label: 'powered revenue' },
      },
      {
        quote: 'My agents show up to Friday review with a one-pager. My humans now do the same — the format unified both teams.',
        author: 'Ali Abdaal',
        role: 'Creator',
        company: 'Ali Abdaal, Inc.',
        metric: { value: '48k', label: 'students enrolled' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches exploring their first agent.', features: ['1 agent', 'Community inbox', '1k messages / month'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$49', cadence: '/month', pitch: 'For coaches with a paying roster.', features: ['5 agents', 'Mandate library', '50k messages', 'Friday review template'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$199', cadence: '/month', pitch: 'For coaches scaling a team.', features: ['25 agents', 'Multi-brand workspaces', '500k messages', 'Priority escalation lane'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms with compliance needs.', features: ['Unlimited agents', 'On-prem option', 'Dedicated success engineer', 'AI-Act audit pack'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'How is an OMK agent different from a ChatGPT wrapper?', a: 'Each agent ships with a mandate, a kill switch, and an audit log — same primitives you would demand from a human hire. The model is replaceable; the mandate is the asset.' },
      { q: 'Can I bring my own model?', a: 'Yes. Bring your own LLM endpoint (OpenAI, Anthropic, MiniMax-M3, local Ollama). OMK routes the work, never the weights.' },
      { q: 'Is client data used for training?', a: 'Never. Client data stays in your Vault and is excluded from any training pipeline by default. CCPA + Colorado AI Act compliant out of the box.' },
    ],
    closing: { headline: 'Your team of agents is one mandate away.', sub: 'Start a 14-day free trial. No credit card. The kill switch is in the box.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },
  {
    id: 'sales-sanctum',
    brand: 'OMK Sales',
    domain: 'sales.omknexus.io',
    tagline: 'Pipeline, deals, and forecast — without the spreadsheet churn.',
    hero: {
      eyebrow: 'Built for premium coaches',
      headline: 'Close more coaching retainers without losing the human warmth.',
      sub: 'OMK Sales routes your inbound DMs, books the discovery call, and follows up with the rigour of an enterprise AE — without sounding like one.',
      primaryCta: { label: 'Book a 20-min walkthrough', href: '#cta' },
      secondaryCta: { label: 'See pricing', href: '#pricing' },
      rating: { stars: 5, count: '12k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Coaching firms running their pipeline on OMK Sales',
      logos: [
        { name: 'Mindvalley', monogram: 'Mv' },
        { name: 'Modern Counsel', monogram: 'MC' },
        { name: 'Close.com', monogram: 'Cl' },
        { name: 'Masterclass', monogram: 'Mc' },
        { name: 'Reforge', monogram: 'Rf' },
      ],
    },
    features: [
      {
        id: 'inbox',
        eyebrow: 'Pipeline',
        title: 'Every DM, email, and form — one inbox',
        body: 'Inbox, IG DM, LinkedIn, your coaching form, Calendly, Stripe — OMK unifies the trail. Your SDR agent triages, you only see the live ones.',
        visual: 'community',
        bullets: ['Auto-triage by intent', 'SLA alerts per channel', 'Replay the full thread'],
      },
      {
        id: 'discovery',
        eyebrow: 'Discovery',
        title: 'Discovery calls booked, briefed, and followed up — by an agent',
        body: 'Reach (your SDR agent) reads the inbound, qualifies against your ICP, books the call, drops the brief in your queue 30 min before. You walk in prepared.',
        visual: 'events',
        bullets: ['ICP-scored inbound', 'Pre-call brief auto-generated', 'Post-call recap in 90 seconds'],
      },
      {
        id: 'forecast',
        eyebrow: 'Forecast',
        title: 'Forecast you can defend in a Monday standup',
        body: 'No more "I feel like we will close $40k this month". OMK shows you pipeline coverage, weighted forecast, and the 3 deals most likely to slip — every Monday at 9am.',
        visual: 'revenue',
        bullets: ['Pipeline coverage ratio', 'Slip-risk early warning', 'Monday forecast email'],
      },
    ],
    stats: [
      { value: '38%', label: 'Lift in discovery-to-close' },
      { value: '11 hrs', label: 'Saved per coach / week' },
      { value: '2.4×', label: 'More booked calls per month' },
      { value: '$0', label: 'CRM seat fees' },
    ],
    testimonials: [
      { quote: 'We replaced HubSpot + a VA. Forecast went from "I think" to "here is the chart".', author: 'Helena H.', role: 'Founder', company: 'Helena Coaching Co.' },
      { quote: 'My SDR agent books 60% of my discovery calls now. I just show up.', author: 'Marcus L.', role: 'Coach', company: 'Lattice Performance' },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches with under 5 calls/week.', features: ['1 inbox', 'CRM-lite', '100 conversations / month'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$79', cadence: '/month', pitch: 'For coaches running a real roster.', features: ['Unified inbox', 'SDR agent (Reach)', 'Forecasting dashboard', 'Weekly standup email'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$249', cadence: '/month', pitch: 'For studios with multiple coaches.', features: ['Multi-coach routing', 'Round-robin booking', 'White-label client portal', 'Slack alerts'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom ICP scoring', 'SOC 2 evidence pack', 'Dedicated CSM'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Does OMK replace my CRM?', a: 'Most coaches cancel their HubSpot / Pipedrive within 30 days. If you need to keep one, OMK syncs both ways.' },
      { q: 'Will the SDR agent sound robotic?', a: 'No. Reach is briefed on your voice, your offers, and your ICP. You review the first 20 drafts; Reach never sends unsupervised until you grant the mandate.' },
    ],
    closing: { headline: 'Your pipeline, finally defensible.', sub: 'Book a 20-min walkthrough. We will show you the Monday standup email live.', cta: { label: 'Book a 20-min walkthrough', href: '#cta' } },
  },
  {
    id: 'operations',
    brand: 'OMK Operations',
    domain: 'ops.omknexus.io',
    tagline: 'Runbooks, knowledge base, incidents — finally one home.',
    hero: {
      eyebrow: 'Built for premium coaches',
      headline: 'The operations cockpit that runs while you sleep.',
      sub: 'OMK Operations turns the way you already work — Slack, Notion, Google Drive — into runbooks your agents can actually execute, with observable outcomes.',
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      rating: { stars: 5, count: '9k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Trusted by 3,200+ coaching firms',
      logos: [
        { name: 'Forte Labs', monogram: 'FL' },
        { name: 'Notion', monogram: 'No' },
        { name: 'Linear', monogram: 'Li' },
        { name: 'Webflow', monogram: 'Wf' },
        { name: 'Calm', monogram: 'Ca' },
      ],
    },
    features: [
      { id: 'runbooks', eyebrow: 'Runbooks', title: 'Runbooks that actually run', body: 'Not 30-page docs nobody reads. OMK runbooks are step-by-step scripts your agents execute — with checkpoints, kill switches, and Slack status updates.', visual: 'community', bullets: ['Step + checkpoint model', 'Kill switch per runbook', 'Slack status per run'] },
      { id: 'knowledge', eyebrow: 'Knowledge', title: 'Knowledge base, indexed and cited', body: 'Drop your Drive, Notion, Looms in. OMK indexes them, cites them in agent answers, and warns you when a doc goes stale.', visual: 'courses', bullets: ['Citations on every answer', 'Stale-doc alerts', 'Per-client knowledge scopes'] },
      { id: 'incidents', eyebrow: 'Incidents', title: 'Incident response, with a real postmortem', body: 'A real on-call rotation (you + agents), Slack escalation lanes, and a postmortem template that does not lie. Blameless by default.', visual: 'events', bullets: ['On-call rotation', 'Auto-generated timelines', 'Blameless postmortem'], },
    ],
    stats: [
      { value: '63%', label: 'Faster runbook execution' },
      { value: '8 min', label: 'Mean time to first status update' },
      { value: '0', label: 'Runbooks lost to Slack scrollback' },
    ],
    testimonials: [
      { quote: 'My runbooks used to live in Notion and die there. OMK agents execute them, and I get a Slack ping every step.', author: 'Anya P.', role: 'COO', company: 'Two Chairs' },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For solo coaches.', features: ['3 runbooks', '1 agent executor', 'Community inbox'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$59', cadence: '/month', pitch: 'For coaching practices.', features: ['Unlimited runbooks', '5 executor agents', 'Incident Slack lane'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$199', cadence: '/month', pitch: 'For studios.', features: ['Multi-tenant scopes', 'Audit export', 'SAML SSO'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Can my agents break things?', a: 'Every agent action runs inside a checkpointed runbook with a kill switch. If a step fails, the runbook pauses for you to approve.' },
      { q: 'Where does my data live?', a: 'On US-hosted Supabase / Vercel infrastructure. AES-256 at rest, TLS 1.3 in transit. CCPA + Colorado AI Act compliant.' },
    ],
    closing: { headline: 'Operations that compound, while you sleep.', sub: '14-day free trial. Cancel any time. Your runbooks are exportable, always.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },
  {
    id: 'onboarding-demo',
    brand: 'OMK Coach Demo',
    domain: 'demo.omknexus.io',
    tagline: 'A 4-question quiz that shows you the product — before you buy.',
    hero: {
      eyebrow: 'Demo · Free',
      headline: 'See the Coach OS in 4 questions.',
      sub: 'Take the 4-question fit check. We open the citadel, you see how an agent-augmented coach actually works — IP Vault, Compliance lane, Audit log, all live.',
      primaryCta: { label: 'Take the 4-question check', href: '#cta' },
      rating: { stars: 5, count: '4.8', sources: RATING_CHIPS },
    },
    features: [
      { id: 'citadel', eyebrow: 'Citadel', title: 'Open the citadel, in your browser', body: 'Once you submit, 4 floating windows appear over the citadel score-band — each is a live demo of one Coach OS domain. Drag them, resize them, close them.', visual: 'community' },
      { id: 'vault', eyebrow: 'Vault', title: 'Zero-PII IP Vault', body: 'See how your client session notes would be encrypted, indexed, and retrieved by your Scribe agent — without ever leaving your tenancy.', visual: 'courses' },
      { id: 'audit', eyebrow: 'Audit', title: 'Audit log, exportable', body: 'Every action your agents take is one click away from a CCPA / Colorado AI Act evidence pack.', visual: 'revenue' },
    ],
    stats: [
      { value: '4 min', label: 'Median time-to-demo' },
      { value: '73%', label: 'Of prospects click into a domain' },
      { value: '0', label: 'PII collected by the quiz' },
    ],
    testimonials: [
      { quote: 'I never buy SaaS without seeing it run. The citadel got me in 4 minutes, and I had already opened the Vault before I finished my coffee.', author: 'Sarah K.', role: 'Coach', company: 'Lighthouse Practice' },
    ],
    pricing: [
      { name: 'Demo', price: '$0', cadence: 'forever', pitch: 'Always free, no signup.', features: ['4-question quiz', 'Citadel preview', 'Zero-PII'], ctaLabel: 'Take the quiz', highlight: true },
    ],
    faq: [
      { q: 'Is my data used to train the agents?', a: 'No. The demo runs on synthetic data only.' },
    ],
    closing: { headline: 'Four questions. Four floating windows. Zero PII.', sub: 'The fastest way to know if OMK is for you.', cta: { label: 'Take the 4-question check', href: '#cta' } },
  },
];
