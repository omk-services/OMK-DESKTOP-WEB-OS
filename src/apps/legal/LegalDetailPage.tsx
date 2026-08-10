/**
 * LegalDetailPage.tsx — Contract & policy dossier, trust theme (Cormorant + Inter).
 *
 * Spec: docs/superpowers/specs/2026-07-30-coach-os-app-detail-pages-design.md §4 row 12
 *       + sovereignty brief 2026-08-06 (IndyDevDan "stealing your data").
 *
 * Five good-detail-page principles:
 *   1. Header — name, status, breadcrumb, last update.
 *   2. Structured attributes — label/value pairs grouped by meaning.
 *   3. History — a real timeline, not a status line.
 *   4. Relations — clauses link to obligations; contracts link to clients.
 *   5. Actions — what can be done with this document.
 *
 * Plus the four sovereignty sections:
 *   - Sovereignty scale (six levels, 0–5).
 *   - Commodity-vs-IP register (the "trace test").
 *   - Dependency register (key-man risk applied to technology).
 *   - Terms & retention (what the conditions of service actually say).
 *
 * Theme rules:
 *   - No Tailwind palette classes: every color is var(--theme-text | muted |
 *     text-dim | surface | etc.) or the trust accent (#0f172a) where meaning
 *     demands it.
 *   - The trust theme is serif display + Inter body — the rest is build from
 *     theme radius (6px) and borders.
 */
import { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  CircleDot,
  Clock3,
  FileSignature,
  Handshake,
  History,
  Landmark,
  Layers,
  Link2,
  Network,
  Printer,
  Send,
  ShieldAlert,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import type { DetailField } from '../../components/DetailPage';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';

/* ── The accent (trust theme) — the only non-theme color, per the brief. */
const APP_ACCENT = '#0f172a';

/* ── Types carried up from the App. The App supplies what it already knows;
 *    the page derives the rest. ───────────────────────────────────────────── */
export interface LegalDetailItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  /** Already-split clauses (App does this off the body). */
  clauses: { title: string; body: string }[];
  fields: DetailField[];
  /** Optional, surfaced when the App has them. */
  collection?: 'contracts' | 'policies';
  signed?: string;
  updated?: string;
  party?: string;
  body?: string;
}

interface LegalDetailPageProps {
  item: LegalDetailItem;
  onBack: () => void;
  backLabel?: string;
}

/* ── Sovereignty model — six levels, IndyDevDan order. Note level 2/3
 *    uncertainty is the author's own; we keep it. ────────────────────────── */

interface SovereigntyLevel {
  index: number;
  name: string;
  one: string;
  gain: string;
  keep: string;
  cost: string;
  orgSize: string;
  flagship: string;
  examples: string[];
  isCurrent?: boolean;
}

const SOVEREIGNTY_LEVELS: SovereigntyLevel[] = [
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

/* ── Trace-test registry — what the coach has, and what falls if a vendor
 *    pulled out. Reads as a register of key-man risk, applied to technology. */

interface Dependency {
  vendor: string;
  category: 'model' | 'platform' | 'storage' | 'edge' | 'auth';
  replaces: string;
  traceIfLost: string;
  /** What the trace test yields: "commodity" — read free; "ip" — read for IP. */
  verdict: 'commodity' | 'ip';
}

const DEPENDENCIES: Dependency[] = [
  {
    vendor: 'Anthropic (Claude)',
    category: 'model',
    replaces: 'Mistral Large · OpenAI · local Llama',
    traceIfLost: 'Coaching prompts, agent traces, eval sets.',
    verdict: 'ip',
  },
  {
    vendor: 'OpenAI (GPT family)',
    category: 'model',
    replaces: 'Anthropic · Google · local',
    traceIfLost: 'Same as above — the prompt surface is the value.',
    verdict: 'ip',
  },
  {
    vendor: 'Vercel (hosting)',
    category: 'edge',
    replaces: 'Cloudflare Pages · Netlify · self-host',
    traceIfLost: 'No data loss — only deployment surface.',
    verdict: 'commodity',
  },
  {
    vendor: 'Supabase (Postgres + Auth)',
    category: 'storage',
    replaces: 'Self-hosted Postgres · Neon · PlanetScale',
    traceIfLost: 'Every row of client and policy data.',
    verdict: 'ip',
  },
  {
    vendor: 'LiteLLM gateway',
    category: 'platform',
    replaces: 'OpenRouter · custom proxy',
    traceIfLost: 'Routing, retry, logging — the ops brain.',
    verdict: 'ip',
  },
  {
    vendor: 'Google Workspace',
    category: 'auth',
    replaces: 'Any OIDC provider',
    traceIfLost: 'Login flow, not content.',
    verdict: 'commodity',
  },
];

/* ── Terms-vs-actual table. The columns: what the TOS do, what they exclude,
 *    what differs by tier. Distinguishes verified from speculation. ────────── */

interface TermsRow {
  clause: string;
  consumer: string;
  commercial: string;
  enterprise: string;
  /** confidence — what the table is honest about. */
  confidence: 'verified' | 'speculation';
}

const TERMS_ROWS: TermsRow[] = [
  {
    clause: 'Training on customer data',
    consumer: 'Often yes (opt-out available)',
    commercial: 'No — opted out by default',
    enterprise: 'No — contractual exclusion',
    confidence: 'verified',
  },
  {
    clause: 'Retention of prompts/outputs',
    consumer: 'Up to 30 days for abuse review',
    commercial: 'Up to 30 days unless 0-retention enabled',
    enterprise: 'Configurable — 0-retention on request',
    confidence: 'verified',
  },
  {
    clause: 'Aggregate use of patterns',
    consumer: 'Yes',
    commercial: 'Yes — but no content matching',
    enterprise: 'Negotiable',
    confidence: 'verified',
  },
  {
    clause: 'Sub-processor transparency',
    consumer: 'Public list, no notice on change',
    commercial: 'Public list, 30-day notice',
    enterprise: 'Contracted list, named individuals',
    confidence: 'verified',
  },
  {
    clause: 'Right to audit',
    consumer: 'No',
    commercial: 'No',
    enterprise: 'Yes — SOC 2, ISO 27001, DPA on request',
    confidence: 'verified',
  },
  {
    clause: 'Human review of flagged prompts',
    consumer: 'Yes — for abuse and safety',
    commercial: 'Yes — same breadth',
    enterprise: 'Scope-limited by contract',
    confidence: 'speculation',
  },
];

/* ── Commodity / IP register — the "trace test" applied to artefacts. */
interface IpEntry {
  artifact: string;
  tag: 'commodity' | 'ip';
  one: string;
}

const IP_REGISTER: IpEntry[] = [
  { artifact: 'Glue code (CRUD, scaffolds, prototypes)', tag: 'commodity', one: 'Replaceable in hours. The vendor owns the shape.' },
  { artifact: 'Coaching prompts (the 7-step welcome)', tag: 'ip', one: 'Years of iteration. The trace test: a competitor would copy.' },
  { artifact: 'Eval sets per client outcome', tag: 'ip', one: 'Hand-built, asymmetric, cumulative. The cheapest thing you cannot reproduce.' },
  { artifact: 'Session notes (IP Vault)', tag: 'ip', one: "The actual coach's capturable knowledge. Sanctuarize." },
  { artifact: 'Pricing tables, marketplace listings', tag: 'commodity', one: 'Public information. The market already knows.' },
  { artifact: 'Runbooks & SOPs', tag: 'ip', one: 'Built-in-house across incidents. The trace test: a competitor would pay.' },
  { artifact: 'Onboarding scripts', tag: 'ip', one: 'Voice, rhythm, the way you handle the first call.' },
  { artifact: 'Standard config (tsconfig, ci, configs)', tag: 'commodity', one: 'Foundational. The cost is the time to set it up, not the artefact.' },
];

/* ── Timeline derivation — every contract / policy has a history. */
interface TimelineEntry {
  eyebrow: string;
  headline: string;
  detail: string;
  tone: 'good' | 'warn' | 'neutral';
}

function buildTimeline(item: LegalDetailItem): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  if (item.signed && item.signed !== '—') {
    out.push({
      eyebrow: 'Signed',
      headline: item.signed,
      detail: 'Wet-ink milestone — both parties committed.',
      tone: 'good',
    });
  } else if (item.signed === '—') {
    out.push({
      eyebrow: 'Awaiting',
      headline: 'Out for signature',
      detail: 'Sent to the counter-party. No return yet.',
      tone: 'warn',
    });
  }
  if (item.updated) {
    out.push({
      eyebrow: 'Last updated',
      headline: item.updated,
      detail: 'Last published revision.',
      tone: 'neutral',
    });
  }
  if (item.status) {
    out.push({
      eyebrow: 'Standing',
      headline: item.status,
      detail: 'Current contract standing.',
      tone: 'neutral',
    });
  }
  if (item.body || item.clauses.length > 0) {
    out.push({
      eyebrow: 'Filed',
      headline: `${item.clauses.length ?? 0} clauses on file`,
      detail: 'Canonical template, with the real parties substituted in.',
      tone: 'neutral',
    });
  }
  return out;
}

/* ── Section primitives — built from theme tokens, never hardcoded colors. */

function Panel({
  children,
  padding = 'p-7',
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <section
      className={`${padding} rounded-md`}
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
        borderRadius: 'calc(var(--theme-radius) * 1.4)',
      }}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  caption: string;
}) {
  return (
    <header className="mb-5 border-b pb-4" style={{ borderColor: 'var(--panel-border)' }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: 'var(--theme-muted)' }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        className="text-[26px] font-semibold leading-tight"
        style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
      >
        {title}
      </h2>
      <p
        className="mt-1 text-sm italic"
        style={{ color: 'var(--theme-muted)' }}
      >
        {caption}
      </p>
    </header>
  );
}

/* ── The page itself. ──────────────────────────────────────────────────── */

export function LegalDetailPage({
  item,
  onBack,
  backLabel = 'Back to Legal',
}: LegalDetailPageProps) {
  const [openClause, setOpenClause] = useState<number>(0);
  const isPolicy = item.collection === 'policies';
  const collection = item.collection ?? 'contracts';
  const timeline = buildTimeline(item);
  const addToast = useShellStore((s) => s.addToast);

  /* « Envoyer pour signature » et « Contre-signature » ne poussaient qu'un
   * toast — un toast n'est pas une fonctionnalite : il disparait en cinq
   * secondes et ne laisse aucune trace dans la fiche ni dans la liste. Pire,
   * le premier calculait un booleen `ok` pour ensuite emettre le meme message
   * dans les deux branches. Les deux actions ecrivent desormais le statut du
   * contrat dans le CMS, ce que la fiche et la liste affichent. */
  const updateItem = useCmsStore((s) => s.updateItem);
  const setContractStatus = (status: string, message: string) => {
    updateItem(collection, item.id, { status });
    addToast({ source: 'Legal', type: 'success', message });
  };

  const currentLevel = SOVEREIGNTY_LEVELS.find((l) => l.isCurrent);

  return (
    <div
      className="min-h-full w-full pb-16"
      style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)', fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 pt-10 sm:px-10">
        {/* ── Top rail ─────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="group inline-flex items-center gap-2 border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors"
            style={{
              borderColor: 'var(--panel-border)',
              color: 'var(--theme-muted)',
              background: 'transparent',
              borderRadius: 'var(--theme-radius-sm)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            {backLabel}
          </button>
          <span
            className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: 'var(--theme-muted)' }}
          >
            <Landmark className="h-3.5 w-3.5" />
            Legal · {isPolicy ? 'Policy' : 'Contract'}
          </span>
        </div>

        {/* ── 1 · Hero — the dossier identity ─────────────────────────── */}
        <header className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{
                background: `${APP_ACCENT}14`,
                color: APP_ACCENT,
              }}
            >
              <CircleDot className="h-3 w-3" />
              {item.status}
            </span>
            {item.signed && (
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--theme-muted)' }}
              >
                Signed · {item.signed}
              </span>
            )}
            {item.updated && (
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--theme-muted)' }}
              >
                Last updated · {item.updated}
              </span>
            )}
          </div>

          <h1
            tabIndex={-1}
            className="text-[40px] font-semibold leading-[1.05] tracking-tight md:text-[52px]"
            style={{
              color: 'var(--theme-text)',
              fontFamily: 'var(--theme-font-display)',
            }}
          >
            {item.title}
          </h1>

          {item.subtitle && (
            <p
              className="mt-3 max-w-2xl text-lg italic"
              style={{
                color: 'var(--theme-muted)',
                fontFamily: 'var(--theme-font-display)',
              }}
            >
              {collection === 'contracts'
                ? `Between ${item.subtitle} and the Coach. Filed under the canonical coaching engagement template.`
                : item.subtitle}
            </p>
          )}

          <hr
            className="mt-6 border-0 border-t-2"
            style={{ borderTopColor: APP_ACCENT, borderTopWidth: '2px' }}
          />
        </header>

        {/* ── 2 · Structured attributes ──────────────────────────────── */}
        <div className="mb-10">
          <Panel>
            <SectionHeader
              icon={Layers}
              eyebrow="Filed under"
              title="Constituted facts"
              caption="Everything recorded on this document — readers in diagonals"
            />
            <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
              {item.fields.map((f) => (
                  <div key={f.label}>
                    <dt
                      className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      {f.label}
                    </dt>
                    <dd
                      className="mt-1.5 text-[15px] font-medium"
                      style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                    >
                      {f.value || '—'}
                    </dd>
                  </div>
                ))}
              {collection === 'contracts' && (
                <>
                  <div>
                    <dt
                      className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Counter-party
                    </dt>
                    <dd
                      className="mt-1.5 text-[15px] font-medium"
                      style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                    >
                      {item.subtitle || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt
                      className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Effective
                    </dt>
                    <dd
                      className="mt-1.5 text-[15px] font-medium"
                      style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                    >
                      {item.signed || '—'}
                    </dd>
                  </div>
                </>
              )}
              {collection === 'policies' && (
                <div>
                  <dt
                    className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    Last updated
                  </dt>
                  <dd
                    className="mt-1.5 text-[15px] font-medium"
                    style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                  >
                    {item.updated || '—'}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>

        {/* ── 3 · History — read top-to-bottom ───────────────────────── */}
        {timeline.length > 0 && (
          <div className="mb-10">
            <Panel>
              <SectionHeader
                icon={History}
                eyebrow="Document history"
                title="The paper trail"
                caption="Every documented step on this file"

              />
              <ol className="relative space-y-3 pl-9">
                <span
                  className="absolute bottom-3 left-[11px] top-3 w-px"
                  style={{ background: 'var(--panel-border)' }}
                  aria-hidden="true"
                />
                {timeline.map((entry, i) => {
                  const hue = entry.tone === 'good' ? 'var(--ok)' : entry.tone === 'warn' ? 'var(--warn)' : APP_ACCENT;
                  return (
                    <li
                      key={`${entry.eyebrow}-${i}`}
                      className="relative"
                    >
                      <span
                        className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full"
                        style={{ background: hue, boxShadow: `0 0 0 4px var(--theme-bg)` }}
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <span
                          className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {entry.eyebrow}
                        </span>
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                        >
                          {entry.headline}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 text-[12.5px] italic"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {entry.detail}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </div>
        )}

        {/* ── 4 · Relations — clauses ledger + counterparties ───────── */}
        {item.clauses.length > 0 && (
          <div className="mb-10">
            <Panel>
              <SectionHeader
                icon={Link2}
                eyebrow="Clauses on file"
                title="The contractual ledger"
                caption="Each clause is a commitment — read them, track them"

              />
              <ol className="divide-y" style={{ borderColor: 'var(--panel-border)' }}>
                {item.clauses.map((c, i) => {
                  const isOpen = openClause === i;
                  return (
                    <li
                      key={i}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenClause(isOpen ? -1 : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors"
                      >
                        <div className="flex items-baseline gap-4 min-w-0">
                          <span
                            className="text-xs font-bold tabular-nums w-12"
                            style={{ color: APP_ACCENT }}
                          >
                            § {i + 1}
                          </span>
                          <span
                            className="text-base font-semibold md:text-lg"
                            style={{
                              color: 'var(--theme-text)',
                              fontFamily: 'var(--theme-font-display)',
                            }}
                          >
                            {c.title}
                          </span>
                        </div>
                        <ChevronDown
                          className="h-4 w-4 shrink-0 transition-transform"
                          style={{
                            color: 'var(--theme-muted)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </button>
                      {isOpen && (
                        <div className="pb-5 pl-16 pr-4">
                          <p
                            className="text-[14.5px] leading-[1.8]"
                            style={{
                              color: 'var(--theme-text)',
                              fontFamily: 'var(--theme-font-display)',
                            }}
                          >
                            {c.body}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {/* Counterparties callout */}
              <div
                className="mt-6 flex items-center gap-3 border-l-2 pl-4 py-2"
                style={{ borderColor: APP_ACCENT }}
              >
                <Users className="h-4 w-4" style={{ color: APP_ACCENT }} />
                <p
                  className="text-[12.5px] italic"
                  style={{ color: 'var(--theme-muted)' }}
                >
                  This document binds {item.subtitle || 'the parties named above'} and the coach. Filed under the canonical coaching template.
                </p>
              </div>
            </Panel>
          </div>
        )}

        {/* ── 5 · Actions — what can be done with this document ──────── */}
        <div className="mb-12">
          <Panel>
            <SectionHeader
              icon={Handshake}
              eyebrow="Operations"
              title="What can be done with this document"
              caption="An open dossier is a closed action — wire the next move"

            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                data-legal-action="send-for-signature"
                onClick={() => setContractStatus(
                  'pending signature',
                  `Envoyé pour signature : ${String(item.title ?? '')}`,
                )}
                className="flex items-center gap-3 border px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: 'var(--panel-border)',
                  background: 'transparent',
                  borderRadius: 'var(--theme-radius-sm)',
                }}
              >
                <Send className="h-4 w-4" style={{ color: APP_ACCENT }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                  Send for signature
                </span>
              </button>
              <button
                type="button"
                data-legal-action="print-export"
                onClick={() => {
                  const t = String(item.title ?? '');
                  const ok = typeof window !== 'undefined' && Boolean(window.print);
                  if (ok) {
                    window.print();
                  }
                  addToast({
                    source: 'Legal',
                    type: 'info',
                    message: ok
                      ? `Impression lancée : ${t}`
                      : `Export prêt : ${t} (ouvre le presse-papier dans le shell).`,
                  });
                }}
                className="flex items-center gap-3 border px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: 'var(--panel-border)',
                  background: 'transparent',
                  borderRadius: 'var(--theme-radius-sm)',
                }}
              >
                <Printer className="h-4 w-4" style={{ color: APP_ACCENT }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                  Print or export
                </span>
              </button>
              <button
                type="button"
                data-legal-action="counter-sign"
                onClick={() => setContractStatus(
                  'counter-signature requested',
                  `Contre-signature demandée : ${String(item.title ?? '')}`,
                )}
                className="flex items-center gap-3 border px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: 'var(--panel-border)',
                  background: 'transparent',
                  borderRadius: 'var(--theme-radius-sm)',
                }}
              >
                <FileSignature className="h-4 w-4" style={{ color: APP_ACCENT }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                  Counter-sign
                </span>
              </button>
            </div>
          </Panel>
        </div>

        {/* ── Sovereignty — the four sections, in the source's order ──── */}

        {/* 6 · Sovereignty scale ───────────────────────────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={Landmark}
              eyebrow="IndyDevDan · sovereignty"
              title="The sovereignty scale"
              caption="Six levels, from the least to the most sovereign. Coach OS is marked where it stands today."

            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SOVEREIGNTY_LEVELS.map((level) => {
                const isCurrent = level.isCurrent === true;
                return (
                  <article
                    key={level.index}
                    className="p-4 transition-colors"
                    style={{
                      borderRadius: 'var(--theme-radius-sm)',
                      background: isCurrent ? `${APP_ACCENT}0a` : 'transparent',
                      border: `1px solid ${isCurrent ? APP_ACCENT : 'var(--panel-border)'}`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: isCurrent ? APP_ACCENT : 'var(--theme-muted)' }}
                      >
                        Level {level.index}
                      </span>
                      {isCurrent && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            background: APP_ACCENT,
                            color: '#ffffff',
                          }}
                        >
                          You are here
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-[16px] font-semibold"
                      style={{
                        color: 'var(--theme-text)',
                        fontFamily: 'var(--theme-font-display)',
                      }}
                    >
                      {level.name}
                    </h3>
                    <p
                      className="mt-0.5 text-[12px] italic"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      {level.one}
                    </p>
                    <dl className="mt-3 grid grid-cols-1 gap-1.5 text-[12px]">
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>
                          Gain
                        </dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.gain}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>
                          Keep
                        </dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.keep}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>
                          Cost
                        </dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.cost}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>
                          Fits
                        </dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.orgSize}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        Flagship
                      </span>
                      <span
                        className="text-[11.5px] font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {level.flagship}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {currentLevel && (
              <p
                className="mt-6 border-l-2 pl-4 py-1 text-[12.5px] italic"
                style={{ borderColor: APP_ACCENT, color: 'var(--theme-muted)' }}
              >
                Coach OS operates at <strong style={{ color: 'var(--theme-text)' }}>Level {currentLevel.index} — {currentLevel.name}</strong>. The trace test: every prompt that touches the coach's notes is logged on our side, in our schema, behind our gateway. The lab sees aggregate only.
              </p>
            )}

            <p
              className="mt-3 text-[11px] italic"
              style={{ color: 'var(--theme-muted)' }}
            >
              The author flags his own hesitation on the order of Level 2 vs Level 3. We keep his order; the bedrock is that Level 3 wins when you begin to swap models in a day, not weeks.
            </p>
          </Panel>
        </div>

        {/* 7 · Commodity vs IP register ───────────────────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="The trace test"
              title="Commodity or intellectual property"
              caption="What a competitor would pay to read, and what they'd shrug at — applied to the artefacts of this practice"

            />
            <div className="overflow-hidden border" style={{ borderColor: 'var(--panel-border)' }}>
              <table className="w-full text-[12.5px]">
                <thead style={{ background: 'var(--theme-surface-hover)' }}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Artefact
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Verdict
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {IP_REGISTER.map((row, i) => (
                    <tr
                      key={row.artifact}
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)',
                      }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {row.artifact}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            background: row.tag === 'ip' ? `${APP_ACCENT}1a` : 'transparent',
                            color: row.tag === 'ip' ? APP_ACCENT : 'var(--theme-muted)',
                            border: `1px solid ${row.tag === 'ip' ? APP_ACCENT : 'var(--panel-border)'}`,
                          }}
                        >
                          {row.tag === 'ip' ? <ShieldAlert className="h-3 w-3" /> : <Network className="h-3 w-3" />}
                          {row.tag.toUpperCase()}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 italic"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {row.one}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p
              className="mt-4 text-[11.5px] italic"
              style={{ color: 'var(--theme-muted)' }}
            >
              The trace test: <em>if a competitor could read the complete trace of my agent, would it change anything?</em> If yes — defend it. If no — move on.
            </p>
          </Panel>
        </div>

        {/* 8 · Dependencies register ───────────────────────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={Network}
              eyebrow="Key-man risk, applied to technology"
              title="Register of dependencies"
              caption="Which vendors this practice runs on, and what falls if one pulls out"

            />
            <div className="overflow-hidden border" style={{ borderColor: 'var(--panel-border)' }}>
              <table className="w-full text-[12.5px]">
                <thead style={{ background: 'var(--theme-surface-hover)' }}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Vendor
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Category
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Replaces
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Trace if lost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEPENDENCIES.map((d, i) => (
                    <tr
                      key={d.vendor}
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)',
                      }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {d.vendor}
                      </td>
                      <td
                        className="px-4 py-3 uppercase tracking-[0.14em] text-[10.5px]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {d.category}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {d.replaces}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{
                          color: d.verdict === 'ip' ? APP_ACCENT : 'var(--theme-muted)',
                          fontWeight: d.verdict === 'ip' ? 600 : 400,
                        }}
                      >
                        {d.traceIfLost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* 9 · Terms & retention — the columns ─────────────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={Warehouse}
              eyebrow="Reading the small print"
              title="Terms & retention"
              caption="What the conditions of service actually say — and what they exclude. Tier by tier."

            />
            <div className="overflow-x-auto border" style={{ borderColor: 'var(--panel-border)' }}>
              <table className="w-full min-w-[640px] text-[12.5px]">
                <thead style={{ background: 'var(--theme-surface-hover)' }}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Clause
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Consumer
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Commercial
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Enterprise
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TERMS_ROWS.map((row, i) => (
                    <tr
                      key={row.clause}
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)',
                      }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {row.clause}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>
                        {row.consumer}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>
                        {row.commercial}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>
                        {row.enterprise}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            color: row.confidence === 'verified' ? 'var(--ok)' : 'var(--warn)',
                          }}
                        >
                          <Clock3 className="h-3 w-3" />
                          {row.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p
              className="mt-4 text-[11.5px] italic"
              style={{ color: 'var(--theme-muted)' }}
            >
              The author of the source insists: customer tiers are not equal. The commercial tier is materially better protected than the consumer tier; the enterprise tier is the only one where the contractually negotiable terms apply. <span style={{ color: 'var(--warn)' }}>Verified</span> rows are pulled from the published terms of service; <span style={{ color: 'var(--warn)' }}>speculation</span> rows are inferred from behaviours and may be wrong.
            </p>
          </Panel>
        </div>

        {/* ── Closing — back to the dossier ───────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5" style={{ borderColor: 'var(--panel-border)' }}>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: 'var(--theme-muted)' }}
          >
            End of dossier
          </span>
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] transition-colors"
            style={{
              background: APP_ACCENT,
              color: '#ffffff',
              borderRadius: 'var(--theme-radius-sm)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
