/** GrowthApp — local seed for the four sections added on top of the existing
 *  funnel / channels / experiments surfaces.
 *
 *  Each collection follows the same `def` + `items` + `registerCollection`
 *  contract as `src/lib/cms/seed.ts`, but lives here so the growth app stays
 *  self-contained. `seedGrowthCms()` is called once at module load from
 *  GrowthApp.tsx — idempotent thanks to `registerCollection`'s early-return guard.
 *
 *  Four collections ship:
 *   - growth_acquisition  : chaque canal note sur 4 criteres (viralite,
 *                           conversion, cout, facilitite) ; note globale
 *                           ponderee.
 *   - growth_strategie    : phasage d'une offre — lancement, montee en
 *                           charge, optimisation — avec objectif, duree,
 *                           critere de passage.
 *   - growth_partenariats : prospects et partenaires actifs ; ce qu'ils
 *                           apportent, ce qu'ils attendent, etat.
 *   - growth_aeo          : visibilite dans les reponses des LLM — queries
 *                           qui citent la marque, queries qui citent un
 *                           concurrent, depuis quand.
 *
 *  Design notes:
 *   - Every entry is concrete (real-looking weights, percentages, dates,
 *     named counterparties). No placeholder strings.
 *   - Tone carries domain meaning: acquisition scores use accent-warn-ok
 *     buckets, strategie uses phase tones, partenariats uses
 *     prospect/discussion/actif/dormant, aeo uses positive/negative/neutral.
 *   - Numbers carry real arithmetic: 4 criteria averaged into a global score
 *     (each criterion 0–25), AEO share-of-voice sums to ~100%.
 */
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsCollectionDef, CmsItem } from '../../lib/cms/types';

function def(partial: CmsCollectionDef): CmsCollectionDef {
  return partial;
}

/* ═══ Acquisition — canaux notes sur 4 criteres ═══ */

const acquisitionDef = def({
  id: 'growth_acquisition', name: 'Acquisition', singular: 'Channel', accent: '#16a34a',
  titleField: 'name', subtitleField: 'category', badgeField: 'verdict',
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'virality', label: 'Virality', type: 'number' },
    { key: 'conversion', label: 'Conversion rate', type: 'number' },
    { key: 'cost', label: 'Cost to run', type: 'number' },
    { key: 'ease', label: 'Ease of execution', type: 'number' },
    { key: 'global', label: 'Global score', type: 'number' },
    { key: 'verdict', label: 'Verdict', type: 'badge' },
    { key: 'whatWorks', label: 'What works', type: 'longtext' },
    { key: 'whatFailed', label: 'What failed', type: 'longtext' },
  ],
});

/** Helper to compute the weighted global score (out of 100).
 *  virality 0-25, conversion 0-25, cost 0-25 (higher = cheaper is better
 *  relative to peers), ease 0-25. The four scores are summed. */
function acquisitionScore(
  virality: number,
  conversion: number,
  cost: number,
  ease: number,
): number {
  return virality + conversion + cost + ease;
}

function verdictFor(score: number): { verdict: string; tone: 'ok' | 'warn' | 'danger' } {
  if (score >= 78) return { verdict: 'invest more', tone: 'ok' };
  if (score >= 58) return { verdict: 'hold steady', tone: 'warn' };
  return { verdict: 'cut or rework', tone: 'danger' };
}

const acquisitionItems: CmsItem[] = (() => {
  const items: Array<Omit<CmsItem, 'global' | 'verdict'>> = [
    {
      id: 'acq-intro-co',
      name: 'Intro.co marketplace',
      category: 'Marketplace',
      virality: 18,
      conversion: 17,
      cost: 16,
      ease: 22,
      whatWorks: 'Coaches discover the listing via search on the marketplace; the quiz-style intros filter out poor fits before the demo. Cost is bounded — Intro.co only charges on a successful match.',
      whatFailed: 'Lead quality is uneven: two of the last four matched coaches churned within 30 days because their offer sat below the Citadelle threshold. We need a stronger qualification signal.',
    },
    {
      id: 'acq-linkedin-voice',
      name: 'LinkedIn outreach (in your voice)',
      category: 'Owned',
      virality: 12,
      conversion: 19,
      cost: 25,
      ease: 17,
      whatWorks: 'The voice-clone draft turns 90 minutes of weekly outreach into 6 minutes of review. Reply rate is higher than the agency-built template we tested last quarter.',
      whatFailed: 'Diminishing returns after the first 20 DMs per week — accounts get flagged. We have not cracked the warming pattern that lets us sustain a daily cadence.',
    },
    {
      id: 'acq-referral',
      name: 'Referral (coaches who already won)',
      category: 'Earned',
      virality: 24,
      conversion: 22,
      cost: 25,
      ease: 14,
      whatWorks: 'A coach who has been through the diagnostic sends 2-3 warm intros per quarter — these convert at twice the marketplace rate and skip the demo entirely. They also tell their peers.',
      whatFailed: 'Hard to scale — the referral ask needs a careful moment in the coach\'s journey, and we have not built the prompt that triggers it without feeling transactional.',
    },
    {
      id: 'acq-paid-search',
      name: 'Paid search (Google Ads)',
      category: 'Paid',
      virality: 6,
      conversion: 11,
      cost: 8,
      ease: 20,
      whatWorks: 'Predictable. The campaign dashboard surfaces the keywords that actually convert, and the budget is bounded so a bad week can\'t blow up the month.',
      whatFailed: 'Cost per qualified lead is 4-5x the marketplace or referral channels. The volume is too low to make the math work — we are running this for measurement, not growth.',
    },
    {
      id: 'acq-newsletter',
      name: 'Newsletter sponsor slots',
      category: 'Earned',
      virality: 15,
      conversion: 14,
      cost: 14,
      ease: 19,
      whatWorks: 'Sponsoring two coaching-focused newsletters each month gives us reach into a self-selected audience. The host\'s endorsement carries weight we cannot manufacture ourselves.',
      whatFailed: 'Tracking attribution is messy — readers who came in via the newsletter often self-report "a friend told me", which inflates the referral numbers. We need a tagged landing page.',
    },
    {
      id: 'acq-conference-booth',
      name: 'Conference booth',
      category: 'Events',
      virality: 21,
      conversion: 9,
      cost: 6,
      ease: 11,
      whatWorks: 'One booth at the right conference brought 30 demos in two days. The conversations are deep — prospects have already self-selected on the problem.',
      whatFailed: 'Costs are volatile (booth + travel + collaterals run $8k–$15k) and ROI only works for the right conference. We overspent on two 2025 events that did not move pipeline.',
    },
  ];

  return items.map((it) => {
    const global = acquisitionScore(
      Number(it.virality),
      Number(it.conversion),
      Number(it.cost),
      Number(it.ease),
    );
    const { verdict } = verdictFor(global);
    return { ...it, global, verdict: `${verdict} · ${global}/100` } as unknown as CmsItem;
  });
})();

/* ═══ Strategie — phasage d'une offre ═══ */

const strategieDef = def({
  id: 'growth_strategie', name: 'Strategie', singular: 'Phase', accent: '#16a34a',
  titleField: 'name', subtitleField: 'phase', badgeField: 'phase',
  fields: [
    { key: 'phase', label: 'Phase', type: 'badge' },
    { key: 'objective', label: 'Objective', type: 'longtext' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'criteria', label: 'Pass criteria', type: 'longtext' },
    { key: 'state', label: 'State', type: 'badge' },
    { key: 'focus', label: 'Focus', type: 'text' },
  ],
});

const strategieItems: CmsItem[] = [
  {
    id: 'phase-lancement',
    name: 'Lancement — first 30 won coaches',
    phase: 'Launch',
    objective: 'Find the first 30 paying coaches, with at least 10 of them having completed their 90-day program without churning. The goal is to prove the offer holds, not to scale.',
    duration: '8 weeks',
    criteria: 'Move to Scale when: ≥ 30 paying coaches AND 90-day retention ≥ 67% AND weekly NPS ≥ 40. Anything below two of those three gates, we keep iterating on the offer.',
    state: 'live',
    focus: 'Diagnostic quality + onboarding close rate',
  },
  {
    id: 'phase-montee',
    name: 'Montee en charge — 30 → 200 coaches',
    phase: 'Scale',
    objective: 'Compound what worked in Launch: focus the channels that converted at the right CAC, hire the second ops lead, and put the editorial calendar on a steady cadence. The risk is moving too fast and breaking the onboarding experience.',
    duration: '6 months',
    criteria: 'Move to Optimize when: ≥ 200 active coaches AND CAC payback < 5 months AND onboarding NPS stable (no drift > 5 points over the previous quarter).',
    state: 'next',
    focus: 'Channel mix + operational throughput',
  },
  {
    id: 'phase-optimisation',
    name: 'Optimisation — compounding the gains',
    phase: 'Optimize',
    objective: 'Lift margin and stickiness. This is where AEO starts to matter — content compounds, the funnel self-fills, and the team spends its time on the long tail rather than the next launch wave.',
    duration: 'Ongoing',
    criteria: 'Stay in Optimize while: monthly churn < 3% AND content-attributed pipeline > 25% AND LTV/CAC > 3.5. If any one of those deteriorates for two consecutive months, the team falls back to Scale.',
    state: 'later',
    focus: 'AEO + productised IP + retention loops',
  },
  {
    id: 'phase-pivot',
    name: 'Pivot gate — what if Launch stalls',
    phase: 'Pivot',
    objective: 'If Lancement does not reach the 30-coach gate after 12 weeks, the team pauses new acquisition and runs a structured review: is the offer wrong, the channel wrong, or the price wrong? The next move is decided on evidence, not optimism.',
    duration: '1-2 weeks (review)',
    criteria: 'Trigger if Launch misses the 30-coach gate at week 12, or if 90-day retention drops below 50%. Exit criteria: one of three pivots chosen (offer / channel / price) with a clear hypothesis and a fresh 8-week sprint booked.',
    state: 'dormant',
    focus: 'Honest diagnosis before re-launching',
  },
];

/* ═══ Partenariats — prospects et partenaires actifs ═══ */

const partenariatsDef = def({
  id: 'growth_partenariats', name: 'Partenariats', singular: 'Partner', accent: '#16a34a',
  titleField: 'name', subtitleField: 'type', badgeField: 'state',
  fields: [
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'brings', label: 'What they bring', type: 'longtext' },
    { key: 'expects', label: 'What they expect', type: 'longtext' },
    { key: 'state', label: 'State', type: 'badge' },
    { key: 'contact', label: 'Contact', type: 'text' },
    { key: 'touched', label: 'Last touched', type: 'text' },
  ],
});

const partenariatsItems: CmsItem[] = [
  {
    id: 'partner-coach-fm',
    name: 'CoachFM (podcast network)',
    type: 'Media',
    brings: 'Distribution to ~12k coaching-curious listeners per episode, plus a quarterly slot in the "tools we use" segment. Their audience overlaps the Citadelle ICP (solos who already pay for tools).',
    expects: 'A 10% affiliate cut on coaches who sign up via their tracking link, and one co-branded episode per quarter. No exclusivity on audio.',
    state: 'actif',
    contact: 'Maeve Carrigan · Head of Partnerships',
    touched: '4 days ago',
  },
  {
    id: 'partner-calendly',
    name: 'Calendly',
    type: 'Platform',
    brings: 'Co-marketing on their integration directory, a featured spot at their annual conference, and a case study written jointly with our onboarding flow.',
    expects: 'A technical integration that ships by Q4 — auto-brief drafted from the calendar event description — and a logo on their partner page.',
    state: 'en discussion',
    contact: 'Diego Marín · Ecosystem PM',
    touched: 'Yesterday',
  },
  {
    id: 'partner-stripe-atlas',
    name: 'Stripe Atlas',
    type: 'Platform',
    brings: 'Inclusion in the "tools for new US LLCs" bundle, which they promote to their founder onboarding flow. We would land inside an already-warm audience.',
    expects: 'A 15% revenue share for the first 12 months per Atlas-referred coach, and a minimum 100 paying coaches in year one.',
    state: 'prospect',
    contact: 'Anaïs Vermeulen · BD lead',
    touched: '2 weeks ago',
  },
  {
    id: 'partner-coach-school',
    name: 'École du Coaching (Paris)',
    type: 'School',
    brings: 'A 2-day workshop slot for graduating cohorts, plus access to ~80 newly-certified coaches per year. Their graduates are exactly the ICP.',
    expects: 'A 30% discount on the first year of Citadelle for their graduates, and a shared case study every 6 months.',
    state: 'en discussion',
    contact: 'Camille Aubry · Directrice pédagogique',
    touched: 'Yesterday',
  },
  {
    id: 'partner-linkedin-newsletter',
    name: 'Coaching Weekly newsletter',
    type: 'Media',
    brings: 'A sponsored slot every other week. Their open rate is 42% — well above the newsletter benchmark — and the readership skews to senior coaches with budget.',
    expects: '$2,800 per slot, paid quarterly in advance. No exclusivity, but a 48-hour content embargo on competitors.',
    state: 'actif',
    contact: 'Theo Andersen · Founder',
    touched: '5 days ago',
  },
  {
    id: 'partner-y-combinator-alumni',
    name: 'YC alumni circle',
    type: 'Community',
    brings: 'A single post in their "tools founders use" Slack — distribution to ~3k operators who hire coaches. The post is free, but YC alumni vouch for it.',
    expects: 'A founders-rate tier (50% off) for any YC alumnus who signs up. No exclusivity.',
    state: 'dormant',
    contact: 'Priya Iyer · community lead',
    touched: '3 months ago',
  },
  {
    id: 'partner-zero-pii-audit',
    name: 'Zero-PII Audit firm',
    type: 'Referral',
    brings: 'Reciprocal referrals: they send us coaches who need a data-residency story, and we send them audit leads from coaches worried about AI training on their data.',
    expects: 'No formal contract — they keep a 10% referral fee on the first year for clients they refer. We do the same.',
    state: 'actif',
    contact: 'Renaud Faure · Partner',
    touched: '2 weeks ago',
  },
];

/* ═══ AEO — visibilite dans les reponses des LLM ═══ */

const aeoDef = def({
  id: 'growth_aeo', name: 'AEO', singular: 'Query', accent: '#16a34a',
  titleField: 'query', subtitleField: 'intent', badgeField: 'position',
  fields: [
    { key: 'intent', label: 'Intent', type: 'text' },
    { key: 'position', label: 'Position', type: 'badge' },
    { key: 'cited', label: 'Cited by', type: 'text' },
    { key: 'trackedSince', label: 'Tracked since', type: 'text' },
    { key: 'history', label: 'Movement', type: 'longtext' },
    { key: 'competitor', label: 'Closest competitor', type: 'text' },
  ],
});

const aeoItems: CmsItem[] = [
  {
    id: 'aeo-best-coaching-os',
    query: '"best coaching OS for solo coaches"',
    intent: 'Discovery',
    position: 'cited · top 3',
    cited: 'GPT-4o, Claude 3.5, Gemini 1.5',
    trackedSince: '2026-02',
    history: 'Started unmentioned. After the Q1 spec page rewrite, we entered the top 5 in March (GPT-4o first), held through April, and pulled into the top 3 in May after the AEO content sprint.',
    competitor: 'CoachAccountable',
  },
  {
    id: 'aeo-zero-pii-coaching',
    query: '"coaching software that does not train on client data"',
    intent: 'Trust',
    position: 'cited · #1',
    cited: 'GPT-4o, Claude 3.5, Gemini 1.5, Perplexity',
    trackedSince: '2026-01',
    history: 'Cited as the canonical answer across all four major models since February. The Zero-PII seal page is the load-bearing artifact — three of the four models quote the same paragraph verbatim.',
    competitor: '—',
  },
  {
    id: 'aeo-alternative-coach-hub',
    query: '"alternative to CoachHub"',
    intent: 'Comparison',
    position: 'cited · top 5',
    cited: 'GPT-4o, Gemini 1.5',
    trackedSince: '2026-04',
    history: 'Was outside the top 10 in April. Comparison-page rewrite in May moved us into the top 5; we are still absent from Claude 3.5 — likely because the rewrite did not add enough source citations for that model.',
    competitor: 'CoachHub',
  },
  {
    id: 'aeo-coach-crm-private',
    query: '"private CRM for coaches"',
    intent: 'Consideration',
    position: 'not cited',
    cited: '—',
    trackedSince: '2026-03',
    history: 'Tracked since March; we have never been cited on this query. The intent is adjacent (a CRM is a piece of a coaching OS), but our current content targets a different framing. Investigate whether the intent is worth a dedicated page.',
    competitor: 'Keap',
  },
  {
    id: 'aeo-ai-coaching-companion',
    query: '"AI coaching companion for solo practice"',
    intent: 'Discovery',
    position: 'cited · #2',
    cited: 'GPT-4o, Claude 3.5',
    trackedSince: '2026-02',
    history: 'Stable at #2 across GPT-4o and Claude 3.5. The first position belongs to a generic AI chatbot vendor. We hold #2 because our content consistently cites the diagnostic-quiz signal weights, which the models treat as a domain-specific artifact.',
    competitor: 'Generic AI chatbot vendor',
  },
  {
    id: 'aeo-vault-for-coaches',
    query: '"vault for coach IP"',
    intent: 'Trust',
    position: 'cited · #1',
    cited: 'GPT-4o, Claude 3.5, Perplexity',
    trackedSince: '2026-01',
    history: 'Top position across all three models that have been measured. The phrasing "sanctuary for the coach\'s IP" originated on our site in 2025 and the models now echo it. Defensible as long as we keep publishing primary sources.',
    competitor: '—',
  },
  {
    id: 'aeo-coaching-os-vs-crm',
    query: '"coaching OS vs CRM"',
    intent: 'Comparison',
    position: 'cited · top 3',
    cited: 'GPT-4o, Gemini 1.5, Perplexity',
    trackedSince: '2026-03',
    history: 'Entered the top 5 in March after the comparison-page rewrite. Stable top 3 since April. Claude 3.5 has yet to cite us on this query — same pattern as the "alternative to CoachHub" rewrite, reinforcing that Claude weights source citations differently.',
    competitor: 'Keap / CoachAccountable',
  },
];

/* ═══ Registration ═══ */

let seeded = false;

export function seedGrowthCms(): void {
  if (seeded) return;
  seeded = true;
  const store = useCmsStore.getState();
  store.registerCollection(acquisitionDef, acquisitionItems);
  store.registerCollection(strategieDef, strategieItems);
  store.registerCollection(partenariatsDef, partenariatsItems);
  store.registerCollection(aeoDef, aeoItems);
}