/** Sovereignty scale — the single source of truth for the six levels of
 *  model-hosting sovereignty as laid out by IndyDevDan. Both LegalDetailPage
 *  and LegalItemDetail render from this array; nothing here is duplicated.
 *
 *  Level 2 vs Level 3 uncertainty is the author's own. We keep his order.
 *  Coach OS is currently at Level 3 — see the brief on the sovereignty
 *  scale 2026-08-06 (IndyDevDan "stealing your data"). The isCurrent flag
 *  marks where the OS stands today.
 *
 *  Kept inside src/apps/legal/ on purpose: this is legal-domain content,
 *  not a UI primitive. If a non-legal app ever needs the same scale it
 *  can be promoted to src/components/ later, but for now it stays where
 *  it is owned. */

export interface SovereigntyLevel {
  index: number;
  name: string;
  one: string;
  gain: string;
  keep: string;
  cost: string;
  orgSize: string;
  flagship: string;
  /** Optional — present in the full Legal detail page, omitted on the
   *  per-item page where space is tighter. */
  examples?: string[];
  isCurrent?: boolean;
}

export const SOVEREIGNTY_LEVELS: SovereigntyLevel[] = [
  {
    index: 0,
    name: 'Consumer subscription',
    one: 'One prompt, one assistant',
    gain: 'Lowest friction. No build, no contract, no key.',
    keep: 'Nothing. The lab sees every prompt and stores the trace.',
    cost: 'Cheapest plan, highest exposure.',
    orgSize: 'Individuals, hobbyists, casuals.',
    flagship: 'Claude.ai · ChatGPT · Gemini',
    examples: ['Free consumer tiers', 'Personal accounts', 'Trials'],
  },
  {
    index: 1,
    name: 'Commercial API',
    one: 'Programmatic access, billed by tokens',
    gain: 'Reliability, longer context, batch jobs, structured outputs.',
    keep: 'Prompts and outputs belong to the lab, used in aggregate form unless you opt out.',
    cost: 'Per-token price, but BYO-keys unlock models not on consumer tier.',
    orgSize: 'Startups, prototypes, agencies (the "glue" tier).',
    flagship: 'Anthropic API · OpenAI API · Google AI Studio',
    examples: ['Commercial subscriptions', 'Per-seat enterprise plans'],
  },
  {
    index: 2,
    name: 'Model cloud',
    one: 'A hyperscaler resells the lab under contract',
    gain: 'Provider sits between you and the lab. The lab sees aggregate at best.',
    keep: 'Your prompts and outputs are governed by the cloud contract, not the lab TOS.',
    cost: 'Higher per-token, but the abstraction is one layer thicker.',
    orgSize: 'Mid-market companies wanting isolation without owning hardware.',
    flagship: 'AWS Bedrock · GCP Vertex · Azure AI Foundry',
    examples: ['Hyperscaler marketplaces'],
  },
  {
    index: 3,
    name: 'Owned control plane',
    one: 'A small machine, a gateway, your routing',
    gain: 'Every trace is yours. Swap models in a day: Anthropic, OpenAI, local.',
    keep: 'The control plane, the logs, the evaluation set, the model choice.',
    cost: 'Engineering time — more than token spend, less than a data team.',
    orgSize: 'SMEs that have decided model choice and log ownership are existential.',
    flagship: 'Self-hosted LiteLLM · OpenRouter · custom gateway',
    examples: ['Operative sovereignty without owning weights'],
    isCurrent: true,
  },
  {
    index: 4,
    name: 'Private hybrid',
    one: 'Open weights on rented or owned GPU',
    gain: 'The model itself is yours. No telemetry leaves the box.',
    keep: 'The weights, the fine-tune, the inference path, the egress.',
    cost: 'GPU bills and the ML ops to run them.',
    orgSize: 'Regulated industries, defence, anything where the trace is the product.',
    flagship: 'Llama on H100 · Mistral on-prem · Qwen fine-tunes',
    examples: ['Open-weight deployments'],
  },
  {
    index: 5,
    name: 'Owned hardware',
    one: 'Silicon, rack, power, and a hardening team',
    gain: 'The chain ends at the wall socket.',
    keep: 'Everything. The lab sees nothing, by construction.',
    cost: 'Capital, real estate, energy, and a security regime of your own.',
    orgSize: 'Sovereign states, defence primes, the few who can afford it.',
    flagship: 'National AI initiatives · on-prem LLM labs',
    examples: ['Air-gapped installations'],
  },
];

/** Returns the level flagged `isCurrent: true`, or undefined if none. */
export function getCurrentSovereigntyLevel(): SovereigntyLevel | undefined {
  return SOVEREIGNTY_LEVELS.find((l) => l.isCurrent === true);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Product sovereignty tiers — distinct from IndyDevDan's six levels above.
 *  Those describe the global sovereignty scale (model host, weights, silicon).
 *  These describe the **product offering** tiers, where the customer's data
 *  physically lives at each stage and what it takes to climb to the next.
 *
 *  Brief-F (2026-08-11) — the user is non-technical and asked: "where does
 *  my data actually live at each stage, and what does it take to move up?"
 *  This is the answer, kept here so it stays in lock-step with the legal
 *  app's sovereignty section. Distinct from SOVEREIGNTY_LEVELS on purpose:
 *  one is the academic ladder, the other is the commercial staircase.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface SovereigntyTier {
  index: 0 | 1 | 2 | 3;
  name: 'PoC' | 'SaaS' | 'White Label' | 'Souveraineté';
  one: string;
  dataLocation: string;
  modelHost: string;
  isolation: string;
  upgrade: string;
  price: string;
  isCurrent?: boolean;
}

export const SOVEREIGNTY_TIERS: SovereigntyTier[] = [
  {
    index: 0,
    name: 'PoC',
    one: 'Single-tenant demo on a shared Supabase project. Free, fast, proof of value.',
    dataLocation: 'Supabase Cloud — project OMK SERVICES INTERN (US, multi-tenant shared).',
    modelHost: 'OpenRouter, free router, byok optional.',
    isolation: 'None. Rows tagged by `tenant_id`; RLS depends on a working JWT hook.',
    upgrade: 'Move to a dedicated Supabase project + custom JWT hook (2 hours of engineering).',
    price: 'Free, time-boxed to 14 days.',
    isCurrent: true,
  },
  {
    index: 1,
    name: 'SaaS',
    one: 'Multi-tenant production on a dedicated project. Pay-as-you-grow.',
    dataLocation: 'Supabase Cloud — project OMK SERVICES CUSTOMERS (US, dedicated to Coach OS).',
    modelHost: 'OpenRouter, byok on enterprise. LiteLLM gateway in front of all calls.',
    isolation: 'RLS-enforced at the row level; per-tenant API keys; full audit log.',
    upgrade: 'Provision a dedicated Supabase project per client + bring your own model keys.',
    price: '$279–$999 / month, billed monthly.',
  },
  {
    index: 2,
    name: 'White Label',
    one: 'Dedicated Supabase project per client. Branded tenant. Custom domain.',
    dataLocation: 'Supabase Cloud — one project per client (US or EU, chosen at signup).',
    modelHost: 'Per-tenant model choice: Anthropic, OpenAI, Mistral, or local on Render.',
    isolation: 'Full project isolation + per-tenant JWT hook + per-tenant RLS policies.',
    upgrade: 'Move the project out of Supabase Cloud onto the client\'s own infrastructure.',
    price: 'From $1,800 / month, annual contract.',
  },
  {
    index: 3,
    name: 'Souveraineté',
    one: 'The whole stack on the client\'s hardware or a sovereign cloud of their choice.',
    dataLocation: 'On the client\'s infrastructure — VPS, bare metal, OVH SecNumCloud, Scaleway Sovereign, or similar.',
    modelHost: 'Open weights on rented or owned GPU (Mistral, Llama, Qwen) — no prompt ever leaves the box.',
    isolation: 'Air-gap optional. Hardware-level key custody. The chain ends at the wall socket.',
    upgrade: 'Nothing above. The chain ends here.',
    price: 'On request — scoped per deployment, typically $25k–$80k setup + $4k–$12k / month ops.',
  },
];

/** Returns the tier flagged `isCurrent: true`, or undefined if none. */
export function getCurrentSovereigntyTier(): SovereigntyTier | undefined {
  return SOVEREIGNTY_TIERS.find((t) => t.isCurrent === true);
}
