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
