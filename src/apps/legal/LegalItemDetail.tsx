/**
 * LegalItemDetail — trust layout, full dossier.
 *
 * Sister page to LegalDetailPage. Same five principles, same sovereignty
 * stack, same theme rules. Where the two diverge: this one is driven by the
 * CMS dispatcher (DynamicPageView) and reads the raw item fields via
 * `def.titleField` / `def.subtitleField` / `def.fields`.
 *
 * The sovereignty sections are kept identical so the two pages feel like one
 * product surface — they are the same dossier viewed from two routes.
 *
 * Canon: spec §4 #12 Legal — "Hero + contractual accordion (collapsible
 *        clauses)".
 *        + sovereignty brief 2026-08-06.
 *        + 5 good-detail-page principles (header, attributes, history,
 *        relations, actions).
 *
 * Theme rules: theme-var colours only. Trust accent (#0f172a) only where
 * meaning demands it (the rule line, the "You are here" chip, the IP stem).
 * No Tailwind palette classes (stone / white / black / etc.).
 */
import { useState } from 'react';
import {
  ChevronDown,
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
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import {
  BackAffordance,
  PrevNextFooter,
  PillBadge,
  formatField,
} from '../../components/cms/itemDetailShared';
import { useShellStore } from '../../stores/shell.store';
import { useCmsStore } from '../../lib/cms/cms.store';
import { SOVEREIGNTY_LEVELS } from './sovereignty';

/* ── The accent (trust theme) — the one non-theme colour, per the brief. */
const APP_ACCENT = '#0f172a';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

interface Clause {
  number: string;
  title: string;
  body: string;
}

const ENGAGEMENT_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Scope of services',     body: 'The Coach shall provide advisory, training and operational consulting as described in the Order Form attached as Exhibit A.' },
  { number: '§2', title: 'Term & renewal',        body: 'Initial term of twelve (12) months from the Effective Date. Renews automatically for successive one-year terms unless either party gives sixty (60) days notice.' },
  { number: '§3', title: 'Fees & payment',        body: 'Invoices issued monthly, due net thirty (30) days. Late amounts bear interest at 1.5% per month or the maximum rate permitted by law.' },
  { number: '§4', title: 'Confidentiality',       body: 'Each party shall protect Confidential Information with the same degree of care it uses to protect its own, and not less than a reasonable degree of care.' },
  { number: '§5', title: 'Termination',           body: 'Either party may terminate for material breach uncured thirty (30) days after written notice.' },
];

const DPA_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Scope',           body: 'Defines the categories of personal data processed, the purposes of processing, and the duration of processing.' },
  { number: '§2', title: 'Security measures', body: 'Encryption in transit and at rest, role-based access, audited logging on every read of personal data.' },
  { number: '§3', title: 'Sub-processors',  body: 'A list of vetted sub-processors is published; any change is notified thirty (30) days in advance.' },
  { number: '§4', title: 'Data subject rights', body: 'Access, rectification, erasure, restriction and portability as permitted by applicable law.' },
];

const POLICY_TEMPLATE: Clause[] = [
  { number: '§1', title: 'Purpose',          body: 'Defines how personal data is collected, used, retained and disclosed in connection with the Service.' },
  { number: '§2', title: 'Lawful basis',     body: 'Processing relies on contractual necessity, legitimate interest, and where required, consent.' },
  { number: '§3', title: 'Data subject rights', body: 'Access, rectification, erasure, restriction and portability as permitted by applicable law.' },
  { number: '§4', title: 'Retention',        body: 'Data retained only as long as necessary for the purposes outlined in §1, then securely deleted.' },
];

/* ── Sovereignty scale (six levels, IndyDevDan order). The type and data
 *    live in ./sovereignty so both LegalDetailPage and this page share
 *    a single source of truth. */

/* ── Trace-test register — artefacts of this practice, scored. */
interface IpEntry {
  artifact: string;
  tag: 'commodity' | 'ip';
  one: string;
}

const IP_REGISTER: IpEntry[] = [
  { artifact: 'Glue code (CRUD, scaffolds, prototypes)', tag: 'commodity', one: 'Replaceable in hours. The vendor owns the shape.' },
  { artifact: 'Coaching prompts (the 7-step welcome)', tag: 'ip', one: 'Years of iteration. The trace test: a competitor would copy.' },
  { artifact: 'Eval sets per client outcome', tag: 'ip', one: 'Hand-built, asymmetric, cumulative. The cheapest thing you cannot reproduce.' },
  { artifact: 'Session notes (IP Vault)', tag: 'ip', one: 'The actual coach\'s capturable knowledge. Sanctuarize.' },
  { artifact: 'Pricing tables, marketplace listings', tag: 'commodity', one: 'Public information. The market already knows.' },
  { artifact: 'Runbooks & SOPs', tag: 'ip', one: 'Built in-house across incidents. The trace test: a competitor would pay.' },
  { artifact: 'Onboarding scripts', tag: 'ip', one: 'Voice, rhythm, the way you handle the first call.' },
  { artifact: 'Standard config (tsconfig, ci, configs)', tag: 'commodity', one: 'Foundational. The cost is the time to set it up, not the artefact.' },
];

/* ── Dependencies register. */
interface Dependency {
  vendor: string;
  category: 'model' | 'platform' | 'storage' | 'edge' | 'auth';
  replaces: string;
  traceIfLost: string;
  verdict: 'commodity' | 'ip';
}

const DEPENDENCIES: Dependency[] = [
  { vendor: 'Anthropic (Claude)', category: 'model', replaces: 'Mistral Large · OpenAI · local Llama', traceIfLost: 'Coaching prompts, agent traces, eval sets.', verdict: 'ip' },
  { vendor: 'OpenAI (GPT family)', category: 'model', replaces: 'Anthropic · Google · local', traceIfLost: 'Same as above — the prompt surface is the value.', verdict: 'ip' },
  { vendor: 'Vercel (hosting)', category: 'edge', replaces: 'Cloudflare Pages · Netlify · self-host', traceIfLost: 'No data loss — only deployment surface.', verdict: 'commodity' },
  { vendor: 'Supabase (Postgres + Auth)', category: 'storage', replaces: 'Self-hosted Postgres · Neon · PlanetScale', traceIfLost: 'Every row of client and policy data.', verdict: 'ip' },
  { vendor: 'LiteLLM gateway', category: 'platform', replaces: 'OpenRouter · custom proxy', traceIfLost: 'Routing, retry, logging — the ops brain.', verdict: 'ip' },
  { vendor: 'Google Workspace', category: 'auth', replaces: 'Any OIDC provider', traceIfLost: 'Login flow, not content.', verdict: 'commodity' },
];

/* ── Terms & retention. ─────────────────────────────────────── */
interface TermsRow {
  clause: string;
  consumer: string;
  commercial: string;
  enterprise: string;
  confidence: 'verified' | 'speculation';
}

const TERMS_ROWS: TermsRow[] = [
  { clause: 'Training on customer data', consumer: 'Often yes (opt-out available)', commercial: 'No — opted out by default', enterprise: 'No — contractual exclusion', confidence: 'verified' },
  { clause: 'Retention of prompts/outputs', consumer: 'Up to 30 days for abuse review', commercial: 'Up to 30 days unless 0-retention enabled', enterprise: 'Configurable — 0-retention on request', confidence: 'verified' },
  { clause: 'Aggregate use of patterns', consumer: 'Yes', commercial: 'Yes — but no content matching', enterprise: 'Negotiable', confidence: 'verified' },
  { clause: 'Sub-processor transparency', consumer: 'Public list, no notice on change', commercial: 'Public list, 30-day notice', enterprise: 'Contracted list, named individuals', confidence: 'verified' },
  { clause: 'Right to audit', consumer: 'No', commercial: 'No', enterprise: 'Yes — SOC 2, ISO 27001, DPA on request', confidence: 'verified' },
  { clause: 'Human review of flagged prompts', consumer: 'Yes — for abuse and safety', commercial: 'Yes — same breadth', enterprise: 'Scope-limited by contract', confidence: 'speculation' },
];

/* ── Panel + section header — same primitives as in LegalDetailPage. ── */

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
      <p className="mt-1 text-sm italic" style={{ color: 'var(--theme-muted)' }}>
        {caption}
      </p>
    </header>
  );
}

/* ── The page ──────────────────────────────────────────────── */

export function LegalItemDetail(props: ItemDetailProps) {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const addToast = useShellStore((s) => s.addToast);
  /* « Send for signature » et « Counter-sign » ne poussaient qu'un toast.
   * Un toast disparait en cinq secondes et ne laisse aucune trace dans la
   * fiche ni dans la liste : ce n'est pas une fonctionnalite. Les deux
   * ecrivent desormais le statut du document dans le CMS. */
  const updateItem = useCmsStore((s) => s.updateItem);
  const setDocStatus = (next: string, message: string) => {
    updateItem(def.id, String(item.id), { status: next });
    addToast({ source: 'Legal', type: 'success', message });
  };
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const isPolicy = collection === 'policies';
  const status = readString(item, 'status') ?? 'On file';
  const signed = readString(item, 'signed');
  const policyBody = readString(item, 'body', 'summary');
  const updated = readString(item, 'updated');

  let clauses: Clause[] = POLICY_TEMPLATE;
  if (collection === 'contracts') {
    clauses = /dpa/i.test(title) ? DPA_TEMPLATE : ENGAGEMENT_TEMPLATE;
  }

  const [openIdx, setOpenIdx] = useState<number>(0);

  const timeline: { eyebrow: string; headline: string; detail: string; tone: 'good' | 'warn' | 'neutral' }[] = [];
  if (signed && signed !== '—') {
    timeline.push({ eyebrow: 'Signed', headline: signed, detail: 'Wet-ink milestone — both parties committed.', tone: 'good' });
  } else if (signed === '—') {
    timeline.push({ eyebrow: 'Awaiting', headline: 'Out for signature', detail: 'Sent to the counter-party. No return yet.', tone: 'warn' });
  }
  if (updated) {
    timeline.push({ eyebrow: 'Last updated', headline: updated, detail: 'Last published revision.', tone: 'neutral' });
  }
  timeline.push({ eyebrow: 'Standing', headline: status, detail: 'Current contract standing.', tone: 'neutral' });
  timeline.push({ eyebrow: 'Filed', headline: `${clauses.length} clauses on file`, detail: 'Canonical template, with the real parties substituted in.', tone: 'neutral' });

  const currentLevel = SOVEREIGNTY_LEVELS.find((l) => l.isCurrent);

  return (
    <div
      className="min-h-full w-full pb-16"
      style={{ color: 'var(--theme-text)', background: 'var(--theme-bg)', fontFamily: 'var(--theme-font-body)' }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 pt-10 sm:px-10">
        {/* ── Top rail ────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <BackAffordance label="Back to contracts" onBack={onBack} accent={accent} />
          <span
            className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: 'var(--theme-muted)' }}
          >
            <Landmark className="h-3.5 w-3.5" />
            Legal · {isPolicy ? 'Policy' : 'Contract'}
          </span>
        </div>

        {/* ── 1 · Hero ───────────────────────────────────────── */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <PillBadge accent={accent}>{status}</PillBadge>
            {collection === 'contracts' && signed && (
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--theme-muted)' }}
              >
                Signed · {signed}
              </span>
            )}
            {collection === 'policies' && updated && (
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--theme-muted)' }}
              >
                Last updated · {updated}
              </span>
            )}
          </div>

          <h1
            tabIndex={-1}
            className="text-[40px] font-semibold leading-[1.05] tracking-tight md:text-[52px]"
            style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="mt-3 max-w-2xl text-lg italic"
              style={{ color: 'var(--theme-muted)', fontFamily: 'var(--theme-font-display)' }}
            >
              {collection === 'contracts'
                ? `Between ${subtitle} and the Coach. Filed under the canonical coaching engagement template.`
                : subtitle}
            </p>
          )}

          <hr className="mt-6 border-0 border-t-2" style={{ borderTopColor: APP_ACCENT, borderTopWidth: '2px' }} />
        </header>

        {/* ── 2 · Structured attributes ──────────────────────── */}
        <div className="mb-10">
          <Panel>
            <SectionHeader
              icon={Layers}
              eyebrow="Filed under"
              title="Constituted facts"
              caption="Everything recorded on this document — readable in diagonals"
            />
            <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
              {def.fields
                .filter((f) => f.key !== def.titleField && f.key !== def.subtitleField && f.key !== def.badgeField)
                .map((f) => {
                  const raw = item[f.key];
                  const display = raw === undefined || raw === null || raw === ''
                    ? '—'
                    : formatField(raw, f.type);
                  return (
                    <div key={f.key}>
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
                        {display}
                      </dd>
                    </div>
                  );
                })}
              {collection === 'contracts' && (
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
                    {subtitle || '—'}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>

        {/* ── 3 · History ─────────────────────────────────────── */}
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
                  <li key={`${entry.eyebrow}-${i}`} className="relative">
                    <span
                      className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full"
                      style={{ background: hue, boxShadow: '0 0 0 4px var(--theme-bg)' }}
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
                    <p className="mt-0.5 text-[12.5px] italic" style={{ color: 'var(--theme-muted)' }}>
                      {entry.detail}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        {/* ── 4 · Relations — clauses + counterparties ────────── */}
        {collection === 'policies' && policyBody && (
          <div className="mb-10">
            <Panel>
              <SectionHeader
                icon={Link2}
                eyebrow="Body"
                title="The policy text"
                caption="How the rule reads in plain English"
              />
              <p
                className="text-[15px] leading-[1.8]"
                style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
              >
                {policyBody}
              </p>
            </Panel>
          </div>
        )}

        <div className="mb-10">
          <Panel>
            <SectionHeader
              icon={Link2}
              eyebrow="Clauses on file"
              title="The contractual ledger"
              caption="Each clause is a commitment — read them, track them"
            />
            <ol className="divide-y" style={{ borderColor: 'var(--panel-border)' }}>
              {clauses.map((c, i) => {
                const isOpen = openIdx === i;
                return (
                  <li key={c.number} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)' }}>
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors"
                    >
                      <div className="flex items-baseline gap-4 min-w-0">
                        <span
                          className="text-xs font-bold tabular-nums w-12"
                          style={{ color: APP_ACCENT }}
                        >
                          {c.number}
                        </span>
                        <span
                          className="text-base font-semibold md:text-lg"
                          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
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
                          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                        >
                          {c.body}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <div
              className="mt-6 flex items-center gap-3 border-l-2 pl-4 py-2"
              style={{ borderColor: APP_ACCENT }}
            >
              <Users className="h-4 w-4" style={{ color: APP_ACCENT }} />
              <p
                className="text-[12.5px] italic"
                style={{ color: 'var(--theme-muted)' }}
              >
                This document binds {subtitle || 'the parties named above'} and the coach. Filed under the canonical coaching template.
              </p>
            </div>
          </Panel>
        </div>

        {/* ── 5 · Actions ────────────────────────────────────── */}
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
                onClick={() => setDocStatus(
                  'pending signature',
                  `Envoyé pour signature : ${title}`,
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
                  const ok = typeof window !== 'undefined' && Boolean(window.print);
                  if (ok) window.print();
                  addToast({
                    source: 'Legal',
                    type: 'info',
                    message: ok
                      ? `Impression lancée : ${title}`
                      : `Export prêt : ${title} (ouvre le presse-papier dans le shell).`,
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
                onClick={() => setDocStatus(
                  'counter-signature requested',
                  `Contre-signature demandée : ${title}`,
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

        {/* ── 6 · Sovereignty scale ───────────────────────────── */}
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
                const isCur = level.isCurrent === true;
                return (
                  <article
                    key={level.index}
                    className="p-4"
                    style={{
                      borderRadius: 'var(--theme-radius-sm)',
                      background: isCur ? `${APP_ACCENT}0a` : 'transparent',
                      border: `1px solid ${isCur ? APP_ACCENT : 'var(--panel-border)'}`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: isCur ? APP_ACCENT : 'var(--theme-muted)' }}
                      >
                        Level {level.index}
                      </span>
                      {isCur && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.18em]"
                          style={{ background: APP_ACCENT, color: '#ffffff' }}
                        >
                          You are here
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-[16px] font-semibold"
                      style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}
                    >
                      {level.name}
                    </h3>
                    <p className="mt-0.5 text-[12px] italic" style={{ color: 'var(--theme-muted)' }}>
                      {level.one}
                    </p>
                    <dl className="mt-3 grid grid-cols-1 gap-1.5 text-[12px]">
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Gain</dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.gain}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Keep</dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.keep}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Cost</dt>
                        <dd style={{ color: 'var(--theme-text)' }}>{level.cost}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 font-semibold" style={{ color: 'var(--theme-muted)' }}>Fits</dt>
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
                      <span className="text-[11.5px] font-medium" style={{ color: 'var(--theme-text)' }}>
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
            <p className="mt-3 text-[11px] italic" style={{ color: 'var(--theme-muted)' }}>
              The author flags his own hesitation on the order of Level 2 vs Level 3. We keep his order; the bedrock is that Level 3 wins when you begin to swap models in a day, not weeks.
            </p>
          </Panel>
        </div>

        {/* ── 7 · Commodity vs IP register ───────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="The trace test"
              title="Commodity or intellectual property"
              caption="What a competitor would pay to read, and what they'd shrug at"
            />
            <div className="overflow-hidden border" style={{ borderColor: 'var(--panel-border)' }}>
              <table className="w-full text-[12.5px]">
                <thead style={{ background: 'var(--theme-surface-hover)' }}>
                  <tr>
                    {['Artefact', 'Verdict', 'Why'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IP_REGISTER.map((row, i) => (
                    <tr
                      key={row.artifact}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--theme-text)' }}>
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
                      <td className="px-4 py-3 italic" style={{ color: 'var(--theme-muted)' }}>
                        {row.one}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11.5px] italic" style={{ color: 'var(--theme-muted)' }}>
              The trace test: <em>if a competitor could read the complete trace of my agent, would it change anything?</em> If yes — defend it. If no — move on.
            </p>
          </Panel>
        </div>

        {/* ── 8 · Dependencies register ───────────────────────── */}
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
                    {['Vendor', 'Category', 'Replaces', 'Trace if lost'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEPENDENCIES.map((d, i) => (
                    <tr
                      key={d.vendor}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--theme-text)' }}>{d.vendor}</td>
                      <td
                        className="px-4 py-3 uppercase tracking-[0.14em] text-[10.5px]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {d.category}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>{d.replaces}</td>
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

        {/* ── 9 · Terms & retention ──────────────────────────── */}
        <div className="mb-10">
          <Panel padding="p-8">
            <SectionHeader
              icon={Warehouse}
              eyebrow="Reading the small print"
              title="Terms & retention"
              caption="What the conditions of service actually say — tier by tier"
            />
            <div className="overflow-x-auto border" style={{ borderColor: 'var(--panel-border)' }}>
              <table className="w-full min-w-[640px] text-[12.5px]">
                <thead style={{ background: 'var(--theme-surface-hover)' }}>
                  <tr>
                    {['Clause', 'Consumer', 'Commercial', 'Enterprise', 'Source'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TERMS_ROWS.map((row, i) => (
                    <tr
                      key={row.clause}
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--theme-text)' }}>{row.clause}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>{row.consumer}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>{row.commercial}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--theme-text)' }}>{row.enterprise}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: row.confidence === 'verified' ? 'var(--ok)' : 'var(--warn)' }}
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
            <p className="mt-4 text-[11.5px] italic" style={{ color: 'var(--theme-muted)' }}>
              The author of the source insists: customer tiers are not equal. The commercial tier is materially better protected than the consumer tier; the enterprise tier is the only one where the contractually negotiable terms apply. <span style={{ color: 'var(--ok)' }}>Verified</span> rows are pulled from the published terms of service; <span style={{ color: 'var(--warn)' }}>speculation</span> rows are inferred from behaviours and may be wrong.
            </p>
          </Panel>
        </div>

        <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
