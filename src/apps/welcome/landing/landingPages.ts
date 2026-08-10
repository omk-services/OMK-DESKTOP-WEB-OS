/** Landing pages — Circle.so-style pages, one per Coach OS Domain.
 *  Each page is fully self-contained: hero, features, testimonials, stats,
 *  pricing, FAQ, closing. The Welcome app sidebar lets A+ browse pages, the
 *  Header Menu (sticky in-page nav) jumps between sections of the active page.
 *
 *  Canon:
 *   - Demo (free onboarding) en tête, puis les 8 Domaines SOB Convergence
 *     (D1-RH, D2-Ops, D3-Growth, D4-Cognition, D5-People, D6-Finance,
 *     D7-IT, D8-Legal). L'ordre du tableau pilote le rail latéral, le
 *     bandeau d'ancres et le fil d'Ariane : la Demo est donc la 2e entrée
 *     du rail, juste après « Arrivée ».
 *   - Pricing USD tiers per ADR-AAAS-PRICING-001.
 *   - US-only market per ADR-L2-AAAS-US-ONLY-001.
 *   - Copy passes no-ai-slop: no em dash abuse, no "it's not X, it's Y",
 *     no "leverage", "dive into", "in today's fast-paced world". Direct,
 *     operational copy for premium coaches ($500-$2,000/hr).
 *   - Action-first (i-have-adhd): one primary CTA per hero, numbered steps
 *     capped at 5, real time estimates, concrete next action at the bottom.
 *   - L1 targeting: copy speaks to the coach user, not the architect.
 *     Avoids "platform", "API", "infra", "scaffold" jargon. Uses "your team",
 *     "your daily standup", "your agents". */

import type { LandingPage } from './pageSchema';

const RATING_CHIPS = ['G2', 'Capterra', 'App Store', 'Play Store'];

export const LANDING_PAGES: LandingPage[] = [
  {
    id: 'onboarding-demo',
    brand: 'OMK Coach Demo',
    domain: 'demo.omknexus.io',
    tagline: 'A 4-question quiz that shows you the product — before you buy.',
    hero: {
      eyebrow: 'Demo · Free',
      headline: 'See the Coach OS in 4 questions.',
      sub: 'Take the 4-question fit check. We open the citadel, you see how an agent-augmented coach actually works. IP Vault, Compliance lane, Audit log, all live.',
      primaryCta: { label: 'Take the 4-question check', href: '#cta' },
      rating: { stars: 5, count: '4.8', sources: RATING_CHIPS },
    },
    features: [
      { id: 'citadel', eyebrow: 'Citadel', title: 'Open the citadel, in your browser', body: 'Once you submit, 4 floating windows appear over the citadel score-band. Each is a live demo of one Coach OS domain. Drag them, resize them, close them.', visual: 'community' },
      { id: 'vault', eyebrow: 'Vault', title: 'Zero-PII IP Vault', body: 'See how your client session notes would be encrypted, indexed, and retrieved by your Scribe agent, without ever leaving your tenancy.', visual: 'courses' },
      { id: 'audit', eyebrow: 'Audit', title: 'Audit log, exportable', body: 'Every action your agents take is one click away from a CCPA + Colorado AI Act evidence pack.', visual: 'revenue' },
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

  {
    id: 'domaine-1-rh-meta-gouvernance',
    brand: 'OMK RH',
    domain: 'rh.omknexus.io',
    tagline: 'Agent Factory, B1 Gatekeeper, sprints, daily standups.',
    hero: {
      eyebrow: 'Domaine 01 · RH & Méta-Gouvernance',
      headline: 'Your team of agents, with mandates that hold.',
      sub: "Green Lanterns run the Agent Factory. X-Men run the sprints. You approve the mandates. The B1 Gatekeeper catches drift before anything ships.",
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      secondaryCta: { label: 'Watch 2-min demo', href: '#features' },
      rating: { stars: 5, count: '70k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Trusted by 15,000+ coaches across 4,200 communities',
      logos: [
        { name: 'Forte Labs', monogram: 'FL' },
        { name: 'Ali Abdaal', monogram: 'AA' },
        { name: 'Mindvalley', monogram: 'Mv' },
        { name: 'Masterclass', monogram: 'Mc' },
        { name: 'Good Inside', monogram: 'GI' },
      ],
    },
    features: [
      {
        id: 'agent-factory',
        eyebrow: 'Agent Factory',
        title: 'Hire agents like you hire humans',
        body: 'Every agent joins with the same intake A+ would run on a human hire: identity check, mandate, escalation rules, kill switch. No agent ships without a contract.',
        bullets: ['Identity Vault per agent', 'Mandate doc with revocation', 'Friday review template'],
        visual: 'agents',
      },
      {
        id: 'b1-gatekeeper',
        eyebrow: 'B1 Gatekeeper',
        title: 'Drift caught before it ships',
        body: 'The B1 Gatekeeper reads every agent action against its mandate. Drift triggers a checkpoint, not a panic. You see what every agent saw, decided, and shipped, in the same dashboard where you track human output.',
        bullets: ['99.9% mandate compliance, audited', 'Replay any conversation', 'CCPA + state AI-law ready'],
        visual: 'chat',
      },
      {
        id: 'sprints',
        eyebrow: 'Sprints',
        title: 'Daily standups, weekly reviews',
        body: 'Sprints run on the same cadence as your human team. Each sprint closes with a one-pager: what shipped, what blocked, what is next. The format unified both teams.',
        bullets: ['Daily standup email at 9am', 'Sprint board on Monday', 'Friday review template'],
        visual: 'community',
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
        quote: 'My agents show up to Friday review with a one-pager. My humans now do the same, the format unified both teams.',
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
      { q: 'How is an OMK agent different from a ChatGPT wrapper?', a: 'Each agent ships with a mandate, a kill switch, and an audit log, the same primitives you would demand from a human hire. The model is replaceable. The mandate is the asset.' },
      { q: 'Can I bring my own model?', a: 'Yes. Bring your own LLM endpoint (OpenAI, Anthropic, MiniMax-M3, local Ollama). OMK routes the work, never the weights.' },
      { q: 'Is client data used for training?', a: 'Never. Client data stays in your Vault and is excluded from any training pipeline by default. CCPA + Colorado AI Act compliant out of the box.' },
    ],
    closing: { headline: 'Your team of agents is one mandate away.', sub: 'Start a 14-day free trial. No credit card. The kill switch is in the box.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },

  {
    id: 'domaine-2-operations',
    brand: 'OMK Operations',
    domain: 'ops.omknexus.io',
    tagline: 'Runbooks, execution engine, incident response.',
    hero: {
      eyebrow: 'Domaine 02 · Operations',
      headline: 'The operations cockpit that runs while you sleep.',
      sub: 'Batman runs your runbooks. 4 Fantastiques run the execution engine. You get a Slack ping every step. When something breaks, the on-call lane fires before you wake up.',
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      secondaryCta: { label: 'See runbook examples', href: '#features' },
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
      {
        id: 'runbooks',
        eyebrow: 'Runbooks',
        title: 'Runbooks that actually run',
        body: 'Not 30-page docs nobody reads. OMK runbooks are step-by-step scripts your agents execute, with checkpoints, kill switches, and Slack status updates.',
        bullets: ['Step + checkpoint model', 'Kill switch per runbook', 'Slack status per run'],
        visual: 'community',
      },
      {
        id: 'knowledge',
        eyebrow: 'Knowledge',
        title: 'Knowledge base, indexed and cited',
        body: 'Drop your Drive, Notion, Looms in. OMK indexes them, cites them in agent answers, and warns you when a doc goes stale.',
        bullets: ['Citations on every answer', 'Stale-doc alerts', 'Per-client knowledge scopes'],
        visual: 'courses',
      },
      {
        id: 'incidents',
        eyebrow: 'Incidents',
        title: 'Incident response, with a real postmortem',
        body: 'A real on-call rotation (you + agents), Slack escalation lanes, and a postmortem template that does not lie. Blameless by default.',
        bullets: ['On-call rotation', 'Auto-generated timelines', 'Blameless postmortem'],
        visual: 'events',
      },
    ],
    stats: [
      { value: '63%', label: 'Faster runbook execution' },
      { value: '8 min', label: 'Mean time to first status update' },
      { value: '24/7', label: 'On-call lane, never a phone tag' },
      { value: '0', label: 'Runbooks lost to Slack scrollback' },
    ],
    testimonials: [
      {
        quote: 'My runbooks used to live in Notion and die there. OMK agents execute them, and I get a Slack ping every step.',
        author: 'Anya P.',
        role: 'COO',
        company: 'Two Chairs',
        metric: { value: '63%', label: 'faster execution' },
      },
      {
        quote: 'The postmortem template paid for the whole year in one incident. We finally knew what to fix.',
        author: 'Marcus L.',
        role: 'Coach',
        company: 'Lattice Performance',
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For solo coaches.', features: ['3 runbooks', '1 executor agent', 'Community inbox'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$59', cadence: '/month', pitch: 'For coaching practices.', features: ['Unlimited runbooks', '5 executor agents', 'Incident Slack lane'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$199', cadence: '/month', pitch: 'For studios.', features: ['Multi-tenant scopes', 'Audit export', 'SAML SSO'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom on-call rotations', 'Dedicated SRE', '24/7 escalation lane'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Can my agents break things?', a: 'Every agent action runs inside a checkpointed runbook with a kill switch. If a step fails, the runbook pauses for you to approve.' },
      { q: 'Where does my data live?', a: 'On US-hosted Supabase and Vercel. AES-256 at rest, TLS 1.3 in transit. CCPA + Colorado AI Act compliant.' },
      { q: 'Do runbooks export?', a: 'Yes. Markdown export, version-controlled in your Drive. The format stays yours, the lock-in never lands.' },
    ],
    closing: { headline: 'Operations that compound, while you sleep.', sub: '14-day free trial. Cancel any time. Your runbooks are exportable, always.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },

  {
    id: 'domaine-3-growth',
    brand: 'OMK Growth',
    domain: 'growth.omknexus.io',
    tagline: 'Outbound velocity, Apollo prospecting, 3-step NO-FOLLOW-UP sequences.',
    hero: {
      eyebrow: 'Domaine 03 · Growth',
      headline: 'Pipeline velocity without the manual grind.',
      sub: 'Flash runs your outbound velocity. Avengers run Apollo prospecting. The 3-step NO-FOLLOW-UP sequence books calls while you coach. No spam, no slide decks, no fake engagement.',
      primaryCta: { label: 'Book a 20-min walkthrough', href: '#cta' },
      secondaryCta: { label: 'See pricing', href: '#pricing' },
      rating: { stars: 5, count: '12k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Coaching firms running growth on OMK',
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
        id: 'apollo',
        eyebrow: 'Apollo Prospecting',
        title: 'Apollo prospecting, run by an agent',
        body: 'The Avengers squad runs Apollo prospecting against your ICP. Every lead gets scored, routed, and dropped into the 3-step sequence. You see the list before any send.',
        bullets: ['ICP-scored prospect list', 'Apollo enrichment per lead', 'First send requires your eyes'],
        visual: 'community',
      },
      {
        id: 'no-follow-up',
        eyebrow: '3-Step NO-FOLLOW-UP',
        title: '3 steps, no follow-up spam',
        body: 'Three touchpoints over 9 days, no follow-up pressure. Each step is conditional on the prior one. If a prospect replies, the agent stops and you take over within 90 seconds.',
        bullets: ['Conditional 3-step cadence', 'Reply detection in 90s', 'Auto-stop on engagement'],
        visual: 'events',
      },
      {
        id: 'velocity',
        eyebrow: 'Velocity Dashboard',
        title: 'A velocity dashboard, every Monday',
        body: 'Pipeline coverage, weighted forecast, and the 3 deals most likely to slip. Delivered to your inbox at 9am Monday. Same format as a human SDR manager would send.',
        bullets: ['Pipeline coverage ratio', 'Slip-risk early warning', 'Monday forecast email'],
        visual: 'revenue',
      },
    ],
    stats: [
      { value: '2.4×', label: 'More booked calls per month' },
      { value: '38%', label: 'Lift in discovery-to-close' },
      { value: '11 hrs', label: 'Saved per coach / week' },
      { value: '$0', label: 'CRM seat fees' },
    ],
    testimonials: [
      {
        quote: 'We replaced HubSpot and a VA. The 3-step cadence booked more calls in week 1 than the VA did in a quarter.',
        author: 'Helena H.',
        role: 'Founder',
        company: 'Helena Coaching Co.',
        metric: { value: '2.4×', label: 'more calls booked' },
      },
      {
        quote: 'My SDR agent books 60% of my discovery calls now. I just show up.',
        author: 'Marcus L.',
        role: 'Coach',
        company: 'Lattice Performance',
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches with under 5 calls/week.', features: ['1 inbox', 'CRM-lite', '100 conversations / month'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$79', cadence: '/month', pitch: 'For coaches running a real roster.', features: ['Unified inbox', 'SDR agent (Reach)', 'Forecasting dashboard', 'Weekly standup email'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$249', cadence: '/month', pitch: 'For studios with multiple coaches.', features: ['Multi-coach routing', 'Round-robin booking', 'White-label client portal', 'Slack alerts'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom ICP scoring', 'Apollo seat included', 'Dedicated CSM'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Will the SDR agent sound robotic?', a: 'No. Reach is briefed on your voice, your offers, and your ICP. You review the first 20 drafts. Reach never sends unsupervised until you grant the mandate.' },
      { q: 'Does OMK replace my CRM?', a: 'Most coaches cancel their HubSpot or Pipedrive within 30 days. If you need to keep one, OMK syncs both ways.' },
      { q: 'What is the 3-step NO-FOLLOW-UP sequence?', a: 'Three touchpoints over 9 days. Conditional, reply-detection in 90 seconds, auto-stop on engagement. No follow-up pressure, no spam.' },
    ],
    closing: { headline: 'Your pipeline, finally defensible.', sub: 'Book a 20-min walkthrough. We will show you the Monday standup email live.', cta: { label: 'Book a 20-min walkthrough', href: '#cta' } },
  },

  {
    id: 'domaine-4-cognition-savoir',
    brand: 'OMK Cognition',
    domain: 'cognition.omknexus.io',
    tagline: 'Sales Second Brain, warehouses, IP extraction from sessions.',
    hero: {
      eyebrow: 'Domaine 04 · Cognition & Savoir',
      headline: 'Every session becomes a queryable asset.',
      sub: "J'onn J'onzz reads between the lines. Illuminati extracts the IP from your sessions and files it in the warehouse. Your Sales Second Brain gets smarter after every call.",
      primaryCta: { label: 'Book a 20-min walkthrough', href: '#cta' },
      secondaryCta: { label: 'See pricing', href: '#pricing' },
      rating: { stars: 5, count: '8k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Coaches turning sessions into revenue',
      logos: [
        { name: 'Ali Abdaal', monogram: 'AA' },
        { name: 'Lovable', monogram: 'Lv' },
        { name: 'Masterclass', monogram: 'Mc' },
        { name: 'Reforge', monogram: 'Rf' },
        { name: 'Good Inside', monogram: 'GI' },
      ],
    },
    features: [
      {
        id: 'extraction',
        eyebrow: 'IP Extraction',
        title: 'Session IP, extracted and filed',
        body: 'Every coaching session is summarized, tagged, and filed in your warehouse. Frameworks you taught on a Tuesday show up in a Friday newsletter without you rewriting them.',
        bullets: ['Per-session IP capture', 'Auto-tag by framework', 'Citation-ready output'],
        visual: 'courses',
      },
      {
        id: 'warehouse',
        eyebrow: 'Warehouse',
        title: 'A warehouse your team and your agents share',
        body: 'Drop your Notion, Drive, Looms in. OMK indexes them once, queries them with citation. Both humans and agents read from the same source of truth.',
        bullets: ['Cross-source indexing', 'Citation on every answer', 'Per-client knowledge scopes'],
        visual: 'revenue',
      },
      {
        id: 'second-brain',
        eyebrow: 'Sales Second Brain',
        title: 'A Sales Second Brain that compounds',
        body: 'The Illuminati squad maintains your Sales Second Brain: ICP patterns, objections that close, case studies that convert. The longer you use it, the sharper your next call gets.',
        bullets: ['ICP pattern library', 'Objection-to-close mapping', 'Case study retrieval'],
        visual: 'chat',
      },
    ],
    stats: [
      { value: '1,200', label: 'Sessions indexed / month' },
      { value: '47 hrs', label: 'Saved on summarization' },
      { value: '3.8×', label: 'Faster pre-call prep' },
      { value: '$0', label: 'Hallucinated citations' },
    ],
    testimonials: [
      {
        quote: 'I used to rewrite the same framework three times a week. Now the agent pulls it from the warehouse and I edit, not create.',
        author: 'Ali Abdaal',
        role: 'Creator',
        company: 'Ali Abdaal, Inc.',
        metric: { value: '47 hrs', label: 'saved / month' },
      },
      {
        quote: 'The Sales Second Brain caught an objection pattern I had never noticed. We rewrote the close, the close rate lifted 22% in two weeks.',
        author: 'Helena H.',
        role: 'Founder',
        company: 'Helena Coaching Co.',
        metric: { value: '22%', label: 'close rate lift' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches testing their first warehouse.', features: ['100 sessions / month', 'Single workspace', 'Citation output'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$69', cadence: '/month', pitch: 'For coaches with a content cadence.', features: ['1,200 sessions / month', 'Sales Second Brain', 'Multi-source indexing', 'Citation export'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$229', cadence: '/month', pitch: 'For studios scaling content.', features: ['Unlimited sessions', 'Cross-brand warehouses', 'Custom framework tags', 'Newsletter agent'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For firms with proprietary IP.', features: ['IP vault with encryption', 'On-prem warehouse option', 'Dedicated CSM'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Does the agent hallucinate citations?', a: 'No. Every answer cites the source doc and the timestamp. If the warehouse has nothing on a topic, the agent says so.' },
      { q: 'Can my clients see my warehouse?', a: 'Only the scopes you grant. Per-client knowledge scopes ship in the Practice tier.' },
      { q: 'What about confidentiality?', a: 'Sessions are encrypted at rest, scoped per workspace, never used for training. CCPA + Colorado AI Act compliant.' },
    ],
    closing: { headline: 'Every session becomes an asset you can sell.', sub: 'Book a 20-min walkthrough. We will show you your Sales Second Brain live.', cta: { label: 'Book a 20-min walkthrough', href: '#cta' } },
  },

  {
    id: 'domaine-5-people-scalabilite',
    brand: 'OMK People',
    domain: 'people.omknexus.io',
    tagline: 'Client success (Coach to CEO), cohorts, retention.',
    hero: {
      eyebrow: 'Domaine 05 · People & Scalabilité',
      headline: 'Coach-to-CEO pipeline without losing the warmth.',
      sub: 'Superman runs client success. Gardiens de la Galaxie run cohorts. From your first 1:1 to a 200-seat retention motion, the format stays human. The system stays yours.',
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      secondaryCta: { label: 'See pricing', href: '#pricing' },
      rating: { stars: 5, count: '11k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Coaches scaling from 1:1 to 200 seats',
      logos: [
        { name: 'Good Inside', monogram: 'GI' },
        { name: 'Calm', monogram: 'Ca' },
        { name: 'Modern Counsel', monogram: 'MC' },
        { name: 'Masterclass', monogram: 'Mc' },
        { name: 'Reforge', monogram: 'Rf' },
      ],
    },
    features: [
      {
        id: 'cohorts',
        eyebrow: 'Cohorts',
        title: 'Cohort lifecycle, automated',
        body: 'Onboarding week 1, mid-cohort check-in week 4, offboarding week 12. Superman runs the timeline, sends the right nudge at the right minute, and flags at-risk seats to you before they churn.',
        bullets: ['Onboarding week 1', 'Mid-cohort check-in week 4', 'Offboarding week 12'],
        visual: 'community',
      },
      {
        id: 'retention',
        eyebrow: 'Retention',
        title: 'Retention, with early warning',
        body: 'Engagement signals drop, an agent flags the seat, you get a 2-line brief. No more "fell through the cracks" churn. No more quarterly surprise.',
        bullets: ['Engagement-signal scoring', 'At-risk flag within 48 hours', '2-line brief per flagged seat'],
        visual: 'events',
      },
      {
        id: 'coach-ceo',
        eyebrow: 'Coach to CEO',
        title: 'Coach to CEO, in the same workspace',
        body: 'From your first $200 1:1 to your 200-seat cohort, the workspace grows with you. Your process, your offers, your voice, the system just gets out of the way.',
        bullets: ['Same workspace from $200 to $200k MRR', 'Offer library per tier', 'Voice notes stay yours'],
        visual: 'revenue',
      },
    ],
    stats: [
      { value: '28%', label: 'Lift in cohort retention' },
      { value: '4.1×', label: 'Faster cohort onboarding' },
      { value: '92%', label: 'NPS at 90 days' },
      { value: '0', label: 'Seats lost to "fell through the cracks"' },
    ],
    testimonials: [
      {
        quote: 'We went from 12 1:1 clients to a 180-seat cohort in six months. The format stayed warm, the operations stayed sane.',
        author: 'Anya P.',
        role: 'COO',
        company: 'Two Chairs',
        metric: { value: '180', label: 'seats at month 6' },
      },
      {
        quote: 'My retention motion used to be "hope they show up". Now it is a system that flags them before they leave.',
        author: 'Sarah K.',
        role: 'Coach',
        company: 'Lighthouse Practice',
        metric: { value: '28%', label: 'retention lift' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches with under 20 active clients.', features: ['20 active seats', 'Cohort timeline (manual)', 'At-risk flag (basic)'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$59', cadence: '/month', pitch: 'For coaches running a real roster.', features: ['200 active seats', 'Automated cohort timeline', 'At-risk early warning', 'Voice-note briefs'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$199', cadence: '/month', pitch: 'For studios with multiple coaches.', features: ['Unlimited seats', 'Multi-coach routing', 'White-label parent portal', 'Slack escalation lane'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom cohort playbooks', 'Dedicated success engineer', 'Quarterly business review'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Does OMK send messages to my clients without me?', a: 'Only the messages you pre-approve. You approve the cohort cadence templates once. Agents execute the cadence.' },
      { q: 'Can I keep my own voice in cohort comms?', a: 'Yes. Every template is editable, every send is in your name. The agents draft, you approve, the brand stays yours.' },
      { q: 'What about data privacy across clients?', a: 'Per-client knowledge scopes ship in the Practice tier. Each client only sees their own history. CCPA + Colorado AI Act compliant.' },
    ],
    closing: { headline: 'From 1:1 to 200 seats, the warmth stays.', sub: 'Start a 14-day free trial. The retention motion is in the box, the cohort timeline runs on day one.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },

  {
    id: 'domaine-6-finance',
    brand: 'OMK Finance',
    domain: 'finance.omknexus.io',
    tagline: 'Retainers, $1k/mo billing, ROI tracking.',
    hero: {
      eyebrow: 'Domaine 06 · Finance',
      headline: 'Retainers, billing, ROI, all on the same ledger.',
      sub: 'Wonder Woman runs your retainer ledger. Thunderbolts run $1k/mo billing. ROI tracking shows every dollar of coach time tied to client outcome. The invoice drops on schedule.',
      primaryCta: { label: 'Book a 20-min walkthrough', href: '#cta' },
      secondaryCta: { label: 'See pricing', href: '#pricing' },
      rating: { stars: 5, count: '6k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Coaching firms running their ledger on OMK',
      logos: [
        { name: 'Stripe', monogram: 'St' },
        { name: 'Modern Counsel', monogram: 'MC' },
        { name: 'Close.com', monogram: 'Cl' },
        { name: 'Forte Labs', monogram: 'FL' },
        { name: 'Reforge', monogram: 'Rf' },
      ],
    },
    features: [
      {
        id: 'retainers',
        eyebrow: 'Retainers',
        title: 'Retainer ledger, with $1k/mo billing',
        body: 'Every client gets a retainer line, every line item is dated, every dollar is traceable. Thunderbolts run the schedule, you see the ledger in the morning standup.',
        bullets: ['Per-client retainer line', 'Schedule on day 1 of month', 'Traceable dollar flow'],
        visual: 'revenue',
      },
      {
        id: 'billing',
        eyebrow: '$1k/mo Billing',
        title: '$1k/mo billing, no Stripe seat fees',
        body: 'The $1k/mo tier is the default starter offer. Billing drops on the same day each month. Failed payments retry 3x over 5 days before pausing the seat. You never chase an invoice.',
        bullets: ['Same-day billing each month', '3x retry over 5 days', 'No Stripe seat fees'],
        visual: 'events',
      },
      {
        id: 'roi',
        eyebrow: 'ROI Tracking',
        title: 'ROI tracking, tied to client outcome',
        body: 'Every dollar of coach time, tied to a client outcome metric. The ROI dashboard lands in your inbox the first Monday of the month, ready for your standup.',
        bullets: ['Per-client ROI ratio', 'Monthly ROI email', 'Quarterly cohort ROI'],
        visual: 'chat',
      },
    ],
    stats: [
      { value: '96%', label: 'On-time retainer collection' },
      { value: '14 days', label: 'DSO, down from 41' },
      { value: '4.7×', label: 'ROI signal clarity' },
      { value: '$0', label: 'Stripe seat fees' },
    ],
    testimonials: [
      {
        quote: 'My DSO dropped from 41 days to 14 in the first quarter. The failed-payment retry alone paid for the year.',
        author: 'Helena H.',
        role: 'Founder',
        company: 'Helena Coaching Co.',
        metric: { value: '14 days', label: 'DSO' },
      },
      {
        quote: 'The ROI dashboard told me which cohorts actually paid back. I dropped two offers, kept the third, my margin lifted 18 points.',
        author: 'Marcus L.',
        role: 'Coach',
        company: 'Lattice Performance',
        metric: { value: '+18pts', label: 'margin' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches with under 10 active retainers.', features: ['10 active retainers', 'Manual $1k/mo billing', 'Quarterly ROI summary'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$89', cadence: '/month', pitch: 'For coaches with a real roster.', features: ['100 active retainers', 'Auto $1k/mo billing', 'Failed-payment retry', 'Monthly ROI email'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$299', cadence: '/month', pitch: 'For studios with multiple coaches.', features: ['Unlimited retainers', 'Multi-coach P&L', 'Stripe Connect routing', 'Cohort ROI view'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom billing playbooks', 'Soc 2 evidence pack', 'Dedicated finance CSM'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Does OMK replace my bookkeeper?', a: 'No. OMK runs your operational ledger. Your bookkeeper still closes the month, OMK feeds them clean line items.' },
      { q: 'Can I charge in USD only?', a: 'Yes. USD-only billing, US-hosted ledger. CCPA + Colorado AI Act compliant.' },
      { q: 'What about taxes?', a: 'OMK does not file taxes. Your bookkeeper + your CPA close the year. OMK exports a clean CSV.' },
    ],
    closing: { headline: 'Retainers, on schedule, every month.', sub: 'Book a 20-min walkthrough. We will show you the $1k/mo billing flow and the ROI email live.', cta: { label: 'Book a 20-min walkthrough', href: '#cta' } },
  },

  {
    id: 'domaine-7-it-rd',
    brand: 'OMK IT',
    domain: 'it.omknexus.io',
    tagline: 'Sovereign infra, Coolify, MCP, Zero-PII Vault.',
    hero: {
      eyebrow: 'Domaine 07 · IT & R&D',
      headline: 'Sovereign infra, on your terms, US-hosted.',
      sub: 'Light runs the sovereign infra. Cyborg runs the MCP layer. Kang Dynasty runs R&D. Zero-PII Vault holds every session note. US-hosted, CCPA + Colorado AI Act compliant.',
      primaryCta: { label: 'Start 14-day free trial', href: '#cta' },
      secondaryCta: { label: 'See infra stack', href: '#features' },
      rating: { stars: 5, count: '5k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Sovereign infra, used by 5,000+ coaching firms',
      logos: [
        { name: 'Vercel', monogram: 'Vc' },
        { name: 'Supabase', monogram: 'Sb' },
        { name: 'Linear', monogram: 'Li' },
        { name: 'Notion', monogram: 'No' },
        { name: 'Calm', monogram: 'Ca' },
      ],
    },
    features: [
      {
        id: 'coolify',
        eyebrow: 'Sovereign Infra',
        title: 'Coolify sovereign infra, on US soil',
        body: 'Light runs your stack on Coolify, US-hosted. You own the namespace, the keys, and the egress. No surprise region moves, no surprise vendor lock-ins.',
        bullets: ['Coolify-managed nodes', 'US-hosted, US-egress', 'You own the keys'],
        visual: 'community',
      },
      {
        id: 'mcp',
        eyebrow: 'MCP Layer',
        title: 'MCP layer, agent-ready',
        body: 'Cyborg wires every internal tool through the Model Context Protocol. Your agents read from MCP the same way they read from a database, structured, observable, reversible.',
        bullets: ['MCP per internal tool', 'Observable reads', 'Reversible writes'],
        visual: 'agents',
      },
      {
        id: 'vault',
        eyebrow: 'Zero-PII Vault',
        title: 'Zero-PII Vault for every session note',
        body: 'Kang Dynasty runs the R&D behind the Zero-PII Vault. Session notes are encrypted at the field level, scoped per client, never used for training. The audit pack is one click.',
        bullets: ['Field-level encryption', 'Per-client scopes', '1-click audit pack'],
        visual: 'revenue',
      },
    ],
    stats: [
      { value: '100%', label: 'US-hosted, US-egress' },
      { value: '99.97%', label: 'Uptime SLA on Forte tier' },
      { value: '0', label: 'Client PII in any training pipeline' },
      { value: '1-click', label: 'AI-Act 2026-08-02 audit pack' },
    ],
    testimonials: [
      {
        quote: 'We migrated off a 3-vendor stack onto OMK + Coolify in a weekend. The Zero-PII Vault alone closed 2 enterprise deals for us.',
        author: 'Tiago Forte',
        role: 'Founder',
        company: 'Forte Labs',
        metric: { value: '$194M', label: 'powered revenue' },
      },
      {
        quote: '95% of AI projects fail on infra. Ours did not. The MCP layer made every agent pluggable, the lock-in never landed.',
        author: 'Anya P.',
        role: 'COO',
        company: 'Two Chairs',
        metric: { value: '0', label: 'downtime in 6 months' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For coaches testing their first vault.', features: ['1 workspace', '1k encrypted fields', 'Community MCP templates'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$99', cadence: '/month', pitch: 'For coaching practices.', features: ['5 workspaces', '100k encrypted fields', 'MCP per internal tool', '1-click audit pack'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$299', cadence: '/month', pitch: 'For studios.', features: ['Unlimited workspaces', 'On-prem MCP option', 'Dedicated uptime SLA', 'Quarterly infra review'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Custom infra topology', '99.97% uptime SLA', 'Dedicated infra engineer', 'On-prem Coolify option'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Is my data used to train any model?', a: 'Never. Zero-PII Vault excludes every field from any training pipeline by default. The audit pack proves it on demand.' },
      { q: 'Where does the data live?', a: 'US-hosted Supabase on Coolify-managed nodes. AES-256 at rest, TLS 1.3 in transit. CCPA + Colorado AI Act compliant.' },
      { q: 'Can I bring my own infra?', a: 'Yes. BYO Supabase project, BYO Coolify cluster. OMK routes the work, your infra stays yours.' },
    ],
    closing: { headline: 'Sovereign infra, US-hosted, AI-Act ready.', sub: 'Start a 14-day free trial. The Zero-PII Vault ships on day one, the audit pack is one click.', cta: { label: 'Start 14-day free trial', href: '#cta' } },
  },

  {
    id: 'domaine-8-legal-conformite',
    brand: 'OMK Legal',
    domain: 'legal.omknexus.io',
    tagline: 'CCPA + Colorado AI Act compliance, NDAs, Zero-PII shield.',
    hero: {
      eyebrow: 'Domaine 08 · Légal & Conformité',
      headline: 'Compliance that does not slow you down.',
      sub: "Aquaman runs the NDAs. Éternels run CCPA + Colorado AI Act. Zero-PII shield stops PII before it leaves the Vault. The audit pack is one click, not a quarter of work.",
      primaryCta: { label: 'Book a 20-min walkthrough', href: '#cta' },
      secondaryCta: { label: 'See the audit pack', href: '#features' },
      rating: { stars: 5, count: '4k+', sources: RATING_CHIPS },
    },
    trust: {
      title: 'Compliance, used by 4,000+ coaching firms',
      logos: [
        { name: 'Harvard', monogram: 'Hv' },
        { name: 'Calm', monogram: 'Ca' },
        { name: 'Good Inside', monogram: 'GI' },
        { name: 'Modern Counsel', monogram: 'MC' },
        { name: 'Masterclass', monogram: 'Mc' },
      ],
    },
    features: [
      {
        id: 'nda',
        eyebrow: 'Auto-NDA',
        title: 'NDA on file before session 1',
        body: 'Aquaman generates the NDA, sends it for e-signature, files it in the legal vault, and blocks the first session until the client signs. 100% on file, never a Slack reminder.',
        bullets: ['NDA auto-generated', 'E-signature built in', 'Blocks session 1 until signed'],
        visual: 'community',
      },
      {
        id: 'ccpa',
        eyebrow: 'CCPA + Colorado AI Act',
        title: 'CCPA + Colorado AI Act, on autopilot',
        body: 'Éternels maintain the compliance posture. Right-to-know requests answered in 14 days, right-to-delete honored in 30. The audit pack is the proof, ready when the regulator asks.',
        bullets: ['Right-to-know in 14 days', 'Right-to-delete in 30 days', 'Audit pack on demand'],
        visual: 'revenue',
      },
      {
        id: 'shield',
        eyebrow: 'Zero-PII Shield',
        title: 'Zero-PII shield, before egress',
        body: 'PII stops at the shield before it leaves the Vault. SSNs, credit cards, addresses, phone numbers get redacted at the field level. The model never sees them, the agent never sends them.',
        bullets: ['Field-level redaction', 'Per-client allow-lists', 'Shield log per egress'],
        visual: 'events',
      },
    ],
    stats: [
      { value: '100%', label: 'NDAs on file before session 1' },
      { value: '0', label: 'PII leakage events in 24 months' },
      { value: '1-click', label: 'Audit pack export' },
      { value: 'AI-Act', label: '2026-08-02 deadline ready' },
    ],
    testimonials: [
      {
        quote: 'A regulator asked for our compliance posture on a Tuesday. The audit pack was in their inbox by Wednesday morning.',
        author: 'Helena H.',
        role: 'Founder',
        company: 'Helena Coaching Co.',
        metric: { value: '1 day', label: 'audit response' },
      },
      {
        quote: 'My clients sign NDAs before they book now. I did not even change the booking flow, Aquaman wired it in.',
        author: 'Sarah K.',
        role: 'Coach',
        company: 'Lighthouse Practice',
        metric: { value: '100%', label: 'NDA on file' },
      },
    ],
    pricing: [
      { name: 'Solo', price: '$0', cadence: '/month', pitch: 'For solo coaches.', features: ['5 active NDAs / month', 'Zero-PII shield (basic)', 'Self-serve audit pack'], ctaLabel: 'Start free' },
      { name: 'Practice', price: '$89', cadence: '/month', pitch: 'For coaching practices.', features: ['Unlimited NDAs', 'Zero-PII shield (full)', '1-click audit pack', 'CCPA + Colorado AI Act posture'], ctaLabel: 'Start 14-day trial', highlight: true },
      { name: 'Studio', price: '$279', cadence: '/month', pitch: 'For studios.', features: ['Multi-brand legal vault', 'Custom NDA templates', 'Right-to-know workflow', 'Quarterly legal review'], ctaLabel: 'Talk to sales' },
      { name: 'Forte', price: '$999', cadence: '/month', pitch: 'For coaching firms.', features: ['Dedicated compliance officer', 'Regulator-ready audit pack', 'Custom contract templates', 'Annual posture review'], ctaLabel: 'Talk to sales' },
    ],
    faq: [
      { q: 'Do you handle AI-Act 2026-08-02?', a: 'Yes. The Forte tier ships a regulator-ready AI-Act audit pack. Practice tier ships the CCPA + Colorado AI Act posture.' },
      { q: 'Where is my legal data stored?', a: 'US-hosted Supabase on Coolify-managed nodes. AES-256 at rest, TLS 1.3 in transit.' },
      { q: 'Can my lawyer review the NDA template?', a: 'Yes. Every template is editable, exportable as Markdown or PDF. Your counsel stays in the loop.' },
    ],
    closing: { headline: 'Compliance that does not slow you down.', sub: 'Book a 20-min walkthrough. We will open the audit pack live and walk you through the AI-Act posture.', cta: { label: 'Book a 20-min walkthrough', href: '#cta' } },
  },
];
