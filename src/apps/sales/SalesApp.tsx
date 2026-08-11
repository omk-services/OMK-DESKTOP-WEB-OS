/**
 * SalesApp — Sales OS Control Center (editorial).
 *
 * Brief N (2026-08-11) — la couche Cognition a quitte Sales. Sales expose
 * un seul indicateur (carte dans la sidebar "Cognition" avec un lien vers
 * l'appautonome via `coach-os:open-app-section`). Plus de hook de donnees,
 * plus de gestion d'etat/chargement/erreur pour Cognition dans cette app.
 *
 *  - Les onglets sont rendus cote a cote, jamais dans AppFrame (heritage
 *    du theme de l'app). Les pages de detail passent par
 *    AppDetailOverlay monte en frere d'AppFrame (pattern canonique de
 *    clients) — voir src/components/cms/AppDetailOverlay.tsx.
 *  - Toutes les couleurs sont tirees des variables --theme-*. Les seules
 *    couleurs semantiques autorisees : orange d'accent (l'app), vert
 *    (gagne / ICP fit), rouge (perdu / a relancer), et les statuts
 *    fondateurs (ok / warn / danger / accent) qui passent par des
 *    melanges de variables de theme.
 *  - L'app conserve ses donnees seedees (calls, deals, tasks, docs,
 *    skills, routines, stack) — pas de nouvelles dependances, pas
 *    de nouveau registre, pas de modification des autres apps.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  BookOpen, BriefcaseBusiness, Calendar, CheckCheck, ChevronRight, CircleDashed, ClipboardList, Cloud, Cpu, Database, FileText, Handshake, Layers, Mail, MessageSquare, Mic, Phone, PhoneCall, Plug, Sparkles, Sun, Target, TrendingUp, Users, WalletCards, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { AppFrame, type AppSection } from '../../components/AppFrame';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { useCmsStore } from '../../lib/cms/cms.store';
import type { CmsItem } from '../../lib/cms/types';
import { SalesDetailPage, type DetailItem } from './SalesDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { SalesItemDetail } from './SalesItemDetail';
import { seedSalesCms } from './seed';
import { KanbanBoard } from '../_ui/widgets';

registerItemDetail('sales', SalesItemDetail);
seedSalesCms();

const ACCENT = '#ea580c';
const SALES_TITLE = 'Sales OS';
const SALES_SUBTITLE = 'Control Center';

// ── Semantic colors — the ONLY non-theme hexes allowed by the brief ──
const WIN = '#15803d';
const LOSE = '#b91c1c';
const RELANCE = '#b45309';
const ICP_FIT = '#15803d';
const ICP_EDGE = '#b45309';
const ICP_OFF = '#b91c1c';

// ── Shared typography primitives (typography carries the editorial tone,
// not raw colors) ──
const FONT_DISPLAY = 'var(--theme-font-display)';
const FONT_BODY = 'var(--theme-font-body)';
const FONT_MONO = 'ui-monospace, "JetBrains Mono", "Courier New", monospace';

type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral';
type ToolStatus = 'live' | 'connected' | 'pending' | 'dormant';

interface CallRecord { id: string; name: string; company: string; role: string; time: string; stage: string; score: number; badge: 'on-ICP' | 'ICP-edge' | 'off-ICP'; brief: string; links: { label: string; icon: typeof Phone }[]; }
interface TaskRecord { id: string; title: string; when: string; priority: 'now' | 'next' | 'watch'; tone: Tone; note: string; }
interface ChangeRecord { id: string; time: string; text: string; }
interface CalendarRecord { id: string; label: string; detail: string; }
interface SnapshotStat { id: string; label: string; value: string; sub: string; foot?: string; accent: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'; }
interface DealStage { id: string; label: string; count: number; weighted: string; tone: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'; }
interface TrendSeries { id: string; title: string; caption: string; unit: string; points: { label: string; value: number }[]; accent: 'ok' | 'accent' | 'warn' | 'danger'; }
interface DimensionScore { id: string; label: string; value: number; outOf: number; note: string; tone: 'ok' | 'warn' | 'danger'; }
void (null as unknown as DimensionScore | null); // type kept for future re-migration
interface ContextGroup { id: string; eyebrow: string; items: { id: string; title: string; subtitle: string; }[]; }
interface SkillRecord { id: string; name: string; description: string; icon: typeof BookOpen; }
interface RoutineRecord { id: string; name: string; trigger: string; last: string; kind: 'event' | 'time' | 'manual'; isActive: boolean; }
interface StackGroup { id: string; name: string; caption: string; tools: { id: string; name: string; role: string; cost?: string; status: ToolStatus; }[]; }

// ─── Seed data (carried over from the previous app, adapted to editorial) ──

const CALLS: CallRecord[] = [
  { id: 'call-anish', name: 'Anish', company: 'Anish Labs', role: 'Co-founder & CEO · funded scale-up', time: '12:20', stage: 'Qualified · rebooked', score: 72, badge: 'on-ICP', brief: "Anish is back in the seat after a one-week slip. The discovery surfaced a clear trigger — paid search spend above a 12k €/mo threshold — and a buying committee with the founder, the head of growth, and a quiet CFO. The call's job is to confirm the budget owner and the implementation window before a proposal is drafted.", links: [{ label: 'Full brief', icon: FileText }, { label: 'LinkedIn', icon: Users }, { label: 'Website', icon: Cloud }, { label: 'Join call', icon: PhoneCall }, { label: 'Email', icon: Mail }, { label: '+33 1 02 03 04 05', icon: Phone }] },
  { id: 'call-louis', name: 'Louis', company: 'Louis Conseil', role: 'Co-founder · independent AI advisory', time: '16:45', stage: 'Offer fit', score: 54, badge: 'ICP-edge', brief: "Louis runs a Paris agency that builds turnkey AI ops for SMBs. The band matches but the headcount and the build-it-myself reflex push him to the ceiling of the standard package. Open the call by qualifying intent (narrow fit vs. study the method) — do not pitch the $5k offer before that read.", links: [{ label: 'Full brief', icon: FileText }, { label: 'LinkedIn', icon: Users }, { label: 'Website', icon: Cloud }, { label: 'Join call', icon: PhoneCall }, { label: 'Email', icon: Mail }] },
  { id: 'call-itay', name: 'Itay', company: 'xGrowth, Cyprus', role: 'Founder & CEO · app-growth consultancy', time: '18:00', stage: 'Rebooked', score: 38, badge: 'off-ICP', brief: "This is the rebooked first call. The 06-29 slot was missed on our side while you were flying back from the offsite, and the apology plus fresh intro already went out, so the deal stays clean. The one flag is geography: xGrowth is Cyprus-based, outside the strict US line. Confirm he is buying for xGrowth itself, get the headcount (target 1-25), and note Cyprus without leading with it.", links: [{ label: 'Full brief', icon: FileText }, { label: 'LinkedIn', icon: Users }, { label: 'Website', icon: Cloud }, { label: 'Join call', icon: PhoneCall }, { label: 'Email', icon: Mail }, { label: '+357 97869398', icon: Phone }] },
];

const TASKS: TaskRecord[] = [
  { id: 'task-tim', title: "Send Tim's drafted proposal", when: 'Today · time-critical', priority: 'now', tone: 'danger', note: 'The PandaDoc draft is ready. Send before Tim reviews with his partner this week.' },
  { id: 'task-itay', title: 'Confirm Itay rebook', when: 'Today · owed', priority: 'now', tone: 'warn', note: 'Send a one-line pre-call confirmation. Keep momentum on the rebooked slot.' },
  { id: 'task-louis', title: 'Prepare Louis offer fit', when: 'Today · 18:00 call', priority: 'next', tone: 'accent', note: 'Bring the outcome, scope boundary, and the narrow-fit question into the call brief.' },
  { id: 'task-anish', title: 'Verify Anish budget owner', when: 'Today · 12:20 call', priority: 'watch', tone: 'ok', note: 'Confirm whether the CFO is the silent signatory before the proposal draft.' },
];

const CHANGES: ChangeRecord[] = [
  { id: 'ch-1', time: '08:00', text: "Morning routine ran on time and cleaned 3 stale deals from last week." },
  { id: 'ch-2', time: '07:42', text: "Two pipeline calls (Itay 12:20, Anish 12:20) flagged for re-confirmation by the calendar agent." },
  { id: 'ch-3', time: 'Yesterday', text: "Rep scoreboard closed at 7.5 — closing still the gap, demo stable." },
  { id: 'ch-4', time: 'Yesterday', text: "Tim's PandaDoc draft updated with the 07-04 partner-review date." },
];

const CALENDAR: CalendarRecord[] = [
  { id: 'cal-marko', label: 'Marko · 15:00 IST', detail: 'A YouTube strategist hiring round, not a sales call.' },
  { id: 'cal-qa', label: 'Q&A with Ben · 17:00 CEST', detail: 'Community event on the accelerator calendar, not pipeline.' },
  { id: 'cal-booked', label: 'Booked ahead · 07-04', detail: 'Tim De La Salle onboarding follow-up.' },
];

// SNAPSHOT + STAGES values are derived from the live `deals` collection
// inside PipelinePanel (see formatMoney / summarizeDeals / STAGE_DEFS).
// The legacy `sales_snapshot` and `sales_stages` CMS collections were
// retired on 2026-08-10 — see src/apps/sales/seed.ts for the rationale.
// `SnapshotStat` and `DealStage` remain as types so the editor views
// keep their shape without re-deriving everything at render time.

/** Une carte du Snapshot. Le chiffre doit rester grand — c'est la signature de la
 *  reference — mais 40px fixes debordaient : « $486k » etait coupe net par le
 *  bord droit des que la fenetre retrecissait.
 *
 *  Deux fausses pistes, notees pour qu'on ne les reprenne pas : `vw` mesure la
 *  FENETRE, pas la carte, donc un `clamp()` en vw ne se declenchait jamais dans
 *  une fenetre large ; et `overflow-wrap: anywhere` coupait « $486k » en
 *  « $48 / 6k », ce qui est pire qu'un debordement. La bonne unite est `cqw`,
 *  relative au conteneur declare juste au-dessus. Le nombre ne se coupe jamais.
 *
 *  Le bloc etait aussi duplique pour la sixieme carte ; il ne l'est plus. */
function SnapshotCard({ stat }: { stat: SnapshotStat }) {
  return (
    <Frame accent={stat.accent}>
      <div className="p-5" style={{ containerType: 'inline-size' }}>
        <Eyebrow>{stat.label}</Eyebrow>
        <div
          className="mt-3 font-extrabold leading-none tracking-tight"
          style={{
            fontFamily: FONT_DISPLAY,
            color: 'var(--theme-text)',
            fontSize: 'clamp(20px, 26cqw, 40px)',
            whiteSpace: 'nowrap',
          }}
        >
          {stat.value}
        </div>
        <div className="mt-3 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          {stat.sub}
        </div>
      </div>
    </Frame>
  );
}

const STAGES: DealStage[] = [];
void STAGES;

const TRENDS: TrendSeries[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void TRENDS;

const CONTEXT: ContextGroup[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void CONTEXT;

const SKILLS: SkillRecord[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void SKILLS;

const ROUTINES: RoutineRecord[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void ROUTINES;
const STACK: StackGroup[] = []; // eslint-disable-line @typescript-eslint/no-unused-vars
void STACK;

// ─── Detail-page adapters (re-use the existing SalesDetailPage) ──

function callDetail(call: CallRecord): DetailItem {
  return {
    id: call.id, kind: 'call', title: call.name, subtitle: call.company, status: call.stage, summary: call.brief,
    fields: [
      { label: 'Time', value: call.time },
      { label: 'Role', value: call.role },
      { label: 'Qualification score', value: `${call.score}/100 · ${call.badge}` },
      { label: 'Stage', value: call.stage },
    ],
  };
}

function taskDetail(task: TaskRecord): DetailItem {
  return {
    id: task.id, kind: 'task', title: task.title, subtitle: task.when, status: task.priority, summary: task.note,
    fields: [
      { label: 'When', value: task.when },
      { label: 'Priority', value: task.priority },
      { label: 'Note', value: task.note },
    ],
  };
}

function docDetail(group: { id: string; title: string; subtitle: string }, body: string): DetailItem {
  return {
    id: group.id, kind: 'doc', title: group.title, subtitle: group.subtitle, status: 'canonical', summary: body,
    fields: [
      { label: 'Use first', value: 'Read before any sale-related skill invocation' },
      { label: 'Refresh rule', value: 'Re-read after every routine that touches the offer or the buyer' },
    ],
  };
}

function skillDetail(skill: SkillRecord): DetailItem {
  return {
    id: skill.id, kind: 'routine', title: skill.name, subtitle: 'Skill · available on demand', status: 'available', summary: skill.description,
    fields: [
      { label: 'Kind', value: 'On-demand skill' },
      { label: 'Description', value: skill.description },
    ],
  };
}

function routineDetail(routine: RoutineRecord): DetailItem {
  return {
    id: routine.id, kind: 'routine', title: routine.name, subtitle: routine.trigger, status: routine.isActive ? 'active' : 'paused', summary: `${routine.kind} · last ran ${routine.last}.`,
    fields: [
      { label: 'Trigger', value: routine.trigger },
      { label: 'Last run', value: routine.last },
      { label: 'Kind', value: routine.kind },
    ],
  };
}

function stackDetail(tool: { id: string; name: string; role: string; cost?: string; status: ToolStatus }, groupName: string): DetailItem {
  return {
    id: tool.id, kind: 'tool', title: tool.name, subtitle: groupName, status: tool.status, summary: tool.role,
    fields: [
      { label: 'Role', value: tool.role },
      { label: 'Status', value: tool.status },
      { label: 'Cost', value: tool.cost ?? '—' },
    ],
  };
}

// ─── Shared visual primitives ───

function Eyebrow({ children, mono = true }: { children: React.ReactNode; mono?: boolean }): ReactElement {
  return (
    <span
      className="text-[10px] font-bold uppercase"
      style={{
        letterSpacing: '0.14em',
        color: 'var(--theme-text-dim)',
        fontFamily: mono ? FONT_MONO : FONT_DISPLAY,
      }}
    >
      {children}
    </span>
  );
}

function Frame({ children, accent }: { children: React.ReactNode; accent?: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }): ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--panel-border)',
        boxShadow: '0 1px 0 var(--panel-border-subtle)',
      }}
    >
      {accent ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: accent === 'ok' ? WIN : accent === 'warn' ? RELANCE : accent === 'danger' ? LOSE : ACCENT }}
        />
      ) : null}
      {children}
    </div>
  );
}

// ─── Section: Today ───

function TodayPanel({ onSelect }: { onSelect: (item: DetailItem) => void }) {
  const addToast = useShellStore(s => s.addToast);
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Coach OS"
        title="Sales OS"
        subtitle="The stateful operating layer behind the coaching offer. It always knows the calls, the pipeline, and the changes — and keeps itself current."
        meta={{ label: 'Updated', value: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), sub: 'Regenerated daily after the morning routines' }}
      />

      {/* The one thing to act on today — black band */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section
          className="rounded-2xl p-7"
          style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--theme-bg)' }}
              aria-hidden
            />
            <Eyebrow>the one thing to act on today</Eyebrow>
          </div>
          <p
            className="text-[20px] font-extrabold leading-[1.25] tracking-tight"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Send Tim De La Salle's proposal, one-pager, and information checklist{' '}
            <span style={{ background: 'rgba(187,247,208,0.6)', color: 'var(--theme-text)' }}>out the door today</span>
            . #12 still unsent — he reviews with his partner and decides this week. Then run three live calls,{' '}
            <span style={{ background: 'rgba(254,243,199,0.85)', color: 'var(--theme-text)' }}>opening with the 12:20 Itay rebook you owe him</span>
            , followed by Louis at 16:45 and Anish at 18:00.
          </p>
        </section>

        <aside
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <Eyebrow>Also on the calendar, not pipeline</Eyebrow>
          <ul className="mt-3 space-y-3">
            {CALENDAR.map((c) => (
              <li key={c.id} className="text-[12.5px]">
                <button
                  type="button"
                  onClick={() => addToast({
                    source: 'Sales',
                    type: 'info',
                    message: `${c.label} — ${c.detail}`,
                  })}
                  className="text-left rounded-lg p-1.5 -m-1.5 transition-colors hover:bg-[var(--theme-surface-hover)]"
                >
                  <div className="font-bold" style={{ color: 'var(--theme-text)' }}>{c.label}</div>
                  <div style={{ color: 'var(--theme-text-muted)' }}>{c.detail}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Today's calls */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Today's calls
            </h2>
          </div>
          <Eyebrow>call-prep, per prospect</Eyebrow>
        </div>

        <div className="space-y-4">
          {CALLS.map((call) => {
            const tone = call.badge === 'on-ICP' ? ICP_FIT : call.badge === 'ICP-edge' ? ICP_EDGE : ICP_OFF;
            return (
              <article
                key={call.id}
                className="relative overflow-hidden rounded-2xl"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: tone }}
                />
                <button
                  type="button"
                  onClick={() => onSelect(callDetail(call))}
                  className="flex w-full flex-col gap-3 p-6 pl-7 text-left"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[16px] font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>
                        {call.name} <span style={{ color: 'var(--theme-text-muted)' }}>· {call.company}, {call.role}</span>
                      </div>
                      <div
                        className="mt-1 text-[10.5px] font-bold uppercase"
                        style={{ letterSpacing: '0.18em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                      >
                        Today {call.time} · {call.stage}
                      </div>
                    </div>
                    <span
                      className="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase"
                      style={{
                        background: tone,
                        color: 'var(--theme-bg)',
                        letterSpacing: '0.14em',
                        fontFamily: FONT_MONO,
                      }}
                    >
                      {call.badge} · {call.score}/100
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                    {call.brief}
                  </p>
                </button>
                <div
                  className="flex flex-wrap items-center gap-2 border-t px-6 py-3 pl-7"
                  style={{ borderColor: 'var(--panel-border-subtle)' }}
                >
                  {call.links.map((l) => (
                    <button
                      type="button"
                      key={l.label}
                      onClick={() => {
                        if (l.label === 'Full brief') {
                          // Reuse the same fiche the card itself opens.
                          onSelect(callDetail(call));
                          return;
                        }
                        // Every other tag (LinkedIn / Website / Join call /
                        // Email / phone) reads as a navigation affordance.
                        // Without a real action it was a dead <span>; now
                        // it pushes a toast that says where the link would
                        // take the coach — a stub, but an observable one.
                        const target =
                          l.label === 'LinkedIn' ? `Open LinkedIn profile for ${call.name}`
                          : l.label === 'Website' ? `Open website for ${call.company}`
                          : l.label === 'Join call' ? `Open calendar invite for the ${call.time} call with ${call.name}`
                          : l.label === 'Email' ? `Compose email to ${call.name}`
                          : `Dial ${call.name}`;
                        addToast({ source: 'Sales', type: 'info', message: target });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
                      style={{
                        background: l.label === 'Full brief' ? 'rgba(21,128,61,0.10)' : 'var(--theme-surface-hover)',
                        color: l.label === 'Full brief' ? WIN : 'var(--theme-text)',
                        border: '1px solid var(--panel-border)',
                      }}
                      aria-label={`${l.label} for ${call.name}`}
                    >
                      <l.icon className="h-3 w-3" />
                      {l.label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Top tasks + What changed today */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <CheckCheck className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
            <h3
              className="text-[16px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Top tasks
            </h3>
          </div>
          <ul className="space-y-3">
            {TASKS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSelect(taskDetail(t))}
                  className="block w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {t.title}
                    </span>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        letterSpacing: '0.16em',
                        background: t.tone === 'danger' ? LOSE : t.tone === 'warn' ? RELANCE : t.tone === 'ok' ? WIN : ACCENT,
                        color: 'var(--theme-bg)',
                        fontFamily: FONT_MONO,
                      }}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {t.when} — {t.note}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <CircleDashed className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
            <h3
              className="text-[16px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              What changed today
            </h3>
          </div>
          <ul className="space-y-3">
            {CHANGES.map((c) => (
              <li key={c.id} className="flex gap-3 text-[12.5px]">
                <span
                  className="w-14 shrink-0 text-[10.5px] font-bold uppercase"
                  style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                >
                  {c.time}
                </span>
                <span style={{ color: 'var(--theme-text-muted)' }}>{c.text}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

function PageHeader({ eyebrow, title, subtitle, meta }: { eyebrow: string; title: string; subtitle: string; meta: { label: string; value: string; sub: string } }): ReactElement {
  return (
    <header className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className="mt-2 text-[40px] font-extrabold leading-[1.05] tracking-tight whitespace-nowrap"
          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
        >
          {title}{' '}
          <span
            className="rounded-md px-1.5 py-0.5 align-middle whitespace-nowrap"
            style={{ background: 'rgba(187,247,208,0.55)', color: 'var(--theme-text)' }}
          >
            Control Center
          </span>
        </h1>
        <p
          className="mt-3 max-w-[640px] text-[14px] leading-relaxed"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {subtitle}
        </p>
      </div>
      <div className="text-right max-w-[180px] shrink-0">
        <Eyebrow>{meta.label}</Eyebrow>
        <div
          className="mt-1 text-[15px] font-extrabold break-words"
          style={{ fontFamily: FONT_MONO, color: 'var(--theme-text)' }}
        >
          {meta.value}
        </div>
        <div
          className="mt-1 text-[11.5px] leading-snug"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {meta.sub}
        </div>
      </div>
    </header>
  );
}

// ─── Pipeline: derive snapshot + stage tiles from the live `deals` collection.
//     The legacy `sales_snapshot` and `sales_stages` CMS collections were
//     retired by the 2026-08-10 debt pass: their values were editorial
//     numbers disconnected from the deal data. Numbers below now come from
//     the same `deals` collection the kanban reads from, so a new deal
//     added through the kanban updates the pipeline value immediately. ───

function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const abs = Math.abs(n);
  if (abs < 1000) return `$${Math.round(n).toLocaleString('en-US')}`;
  if (abs < 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n / 1000).toLocaleString('en-US')}k`;
}

interface PipelineSummary {
  pipelineSum: number;
  pipelineCount: number;
  wonSum: number;
  wonCount: number;
  lostCount: number;
  avg: number;
  min: number;
  max: number;
  closed: number;
  winRate: number | null;
}

function summarizeDeals(deals: CmsItem[]): PipelineSummary {
  const valueOf = (d: CmsItem): number => (typeof d['value'] === 'number' ? d['value'] : 0);
  const stageOf = (d: CmsItem): string => String(d['stage'] ?? '');
  const open = deals.filter((d) => stageOf(d) !== 'Won' && stageOf(d) !== 'Lost');
  const won = deals.filter((d) => stageOf(d) === 'Won');
  const lost = deals.filter((d) => stageOf(d) === 'Lost');
  const pipelineSum = open.reduce((acc, d) => acc + valueOf(d), 0);
  const wonSum = won.reduce((acc, d) => acc + valueOf(d), 0);
  const allValues = deals.map(valueOf);
  const avg = allValues.length === 0 ? 0 : allValues.reduce((acc, n) => acc + n, 0) / allValues.length;
  const min = allValues.length === 0 ? 0 : Math.min(...allValues);
  const max = allValues.length === 0 ? 0 : Math.max(...allValues);
  const closed = won.length + lost.length;
  const winRate = closed === 0 ? null : won.length / closed;
  return { pipelineSum, pipelineCount: open.length, wonSum, wonCount: won.length, lostCount: lost.length, avg, min, max, closed, winRate };
}

const STAGE_DEFS: { id: string; label: string; tone: 'ok' | 'warn' | 'danger' | 'accent' | 'neutral' }[] = [
  { id: 'Qualified', label: 'Qualified', tone: 'accent' },
  { id: 'Proposal', label: 'Proposal', tone: 'warn' },
  { id: 'Won', label: 'Won, this quarter', tone: 'ok' },
  { id: 'Lost', label: 'Lost or cold', tone: 'danger' },
];

function PipelinePanel({ onSelect, navigateToSection, onOpenCognition }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void; onOpenCognition: () => void }) {
  void onSelect; // PipelinePanel currently exposes data only — no per-item detail
  // Read the live `deals` collection (registered in src/lib/cms/seed.ts).
  // Falls back to an empty array if the collection isn't registered yet
  // (HMR can mount before the global seed runs).
  const deals = useCmsStore((s) => s.items['deals']) ?? [];
  const scoreItems = useCmsStore(s => s.items['sales_scores']) ?? [];
  const trendItems = useCmsStore(s => s.items['sales_trends']) ?? [];

  const summary = useMemo(() => summarizeDeals(deals), [deals]);

  // Snapshot tiles — 5 cards. The 6th tile (Meetings/week) was retired
  // because no source exists in the CMS; literal values cannot stand.
  // Rep score stays as a literal (its source is `sales_scores`, a separate
  // collection; deriving it from sales_scores would change semantics).
  const snapshotItems: SnapshotStat[] = useMemo(() => {
    const pipelineAccent: SnapshotStat['accent'] = summary.pipelineSum > 0 ? 'ok' : 'neutral';
    const wonAccent: SnapshotStat['accent'] = summary.wonSum > 0 ? 'ok' : 'neutral';
    const winRateAccent: SnapshotStat['accent'] =
      summary.winRate === null
        ? 'neutral'
        : summary.winRate >= 0.5
          ? 'ok'
          : summary.winRate >= 0.25
            ? 'warn'
            : 'danger';
    return [
      { id: 'snap-pipeline', label: 'Pipeline value', value: formatMoney(summary.pipelineSum), sub: `${summary.pipelineCount} open deals`, accent: pipelineAccent },
      { id: 'snap-won', label: 'Won this quarter', value: formatMoney(summary.wonSum), sub: `${summary.wonCount} deals closed`, accent: wonAccent },
      { id: 'snap-winrate', label: 'Win rate', value: summary.winRate === null ? '—' : `${Math.round(summary.winRate * 100)}%`, sub: summary.closed > 0 ? `of ${summary.closed} closed deals` : 'no closed deals yet', accent: winRateAccent },
      { id: 'snap-avg', label: 'Avg deal size', value: formatMoney(summary.avg), sub: deals.length === 0 ? 'no deals yet' : `min ${formatMoney(summary.min)} · max ${formatMoney(summary.max)}`, accent: 'neutral' },
      { id: 'snap-rep', label: 'Rep score', value: '7.5', sub: 'demo strong, close the gap', accent: 'danger' },
    ];
  }, [summary, deals.length]);

  // Stage tiles — derived from the live `deals` collection. Each stage's
  // count and value are recomputed when deals change. A trailing "Other"
  // bucket captures any deals with an unrecognised stage (forward-safe).
  const stageItems: DealStage[] = useMemo(() => {
    const valueOf = (d: CmsItem): number => (typeof d['value'] === 'number' ? d['value'] : 0);
    const stageOf = (d: CmsItem): string => String(d['stage'] ?? '');
    const knownStageIds = new Set(STAGE_DEFS.map((sd) => sd.id));
    const items: DealStage[] = STAGE_DEFS.map((sd) => {
      const inStage = deals.filter((d) => stageOf(d) === sd.id);
      const sum = inStage.reduce((acc, d) => acc + valueOf(d), 0);
      const weighted =
        sd.id === 'Won'
          ? `${formatMoney(sum)} closed`
          : sd.id === 'Lost'
            ? 're-engagement targets'
            : `${formatMoney(sum)} in stage`;
      return { id: sd.id, label: sd.label, count: inStage.length, weighted, tone: sd.tone };
    });
    const other = deals.filter((d) => !knownStageIds.has(stageOf(d)));
    if (other.length > 0) {
      const sum = other.reduce((acc, d) => acc + valueOf(d), 0);
      items.push({ id: 'stage-other', label: 'Other stages', count: other.length, weighted: `${formatMoney(sum)} in stage`, tone: 'neutral' });
    }
    return items;
  }, [deals]);
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  const num = (item: CmsItem | undefined, key: string): number => {
    if (!item) return 0;
    const v = item[key];
    return typeof v === 'number' ? v : 0;
  };
  // TRENDS points are JSON-stringified in the CMS longtext field.
  const pointsOf = (item: CmsItem | undefined): { label: string; value: number }[] => {
    if (!item) return [];
    const raw = item['points'];
    if (typeof raw !== 'string' || raw.length === 0) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((p): p is { label: string; value: number } =>
          p && typeof p === 'object' && typeof p.label === 'string' && typeof p.value === 'number'
        );
    } catch {
      return [];
    }
  };
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Pipeline"
        title="Sales OS"
        subtitle="The stateful operating layer behind the coaching offer — knows the deals, keeps itself current, and acts across the stack."
        meta={{ label: 'Updated', value: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), sub: 'Regenerated daily after the morning routines' }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Pipeline' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Pipeline' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      {/* 01 Snapshot */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Snapshot
            </h2>
          </div>
          <Eyebrow>CRM reconciled {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Eyebrow>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {snapshotItems.map((it) => (
            <SnapshotCard
              key={it.id}
              stat={{
                id: String(it.id),
                label: it.label || '—',
                value: it.value || '—',
                sub: it.sub,
                accent: (it.accent || 'ok') as SnapshotStat['accent'],
              }}
            />
          ))}
        </div>
      </section>

      {/* 02 CRM snapshot, deals by stage */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >02</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              CRM snapshot, deals by stage
            </h2>
          </div>
        </div>
        <p className="mb-4 text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
          Live from the Attio <span className="font-bold" style={{ color: 'var(--theme-text)' }}>"AI Business OS"</span> list. Augmented daily, never replaced.
        </p>
        <article
          className="rounded-2xl"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul>
            {stageItems.map((it, i) => {
              const stageTone = it.tone;
              return (
              <li
                key={it.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-md px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background:
                        stageTone === 'ok'
                          ? 'rgba(21,128,61,0.10)'
                          : stageTone === 'warn'
                            ? 'rgba(180,83,9,0.10)'
                            : stageTone === 'danger'
                              ? 'rgba(185,28,28,0.10)'
                              : stageTone === 'neutral'
                                ? 'rgba(100,116,139,0.10)'
                                : 'rgba(234,88,12,0.10)',
                      color:
                        stageTone === 'ok' ? WIN : stageTone === 'warn' ? RELANCE : stageTone === 'danger' ? LOSE : stageTone === 'neutral' ? 'var(--theme-text-muted)' : ACCENT,
                      border: '1px solid var(--panel-border)',
                    }}
                  >
                    {it.label || '—'}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 text-right">
                  <span
                    className="text-[18px] font-extrabold tabular-nums"
                    style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                  >
                    {it.count}
                  </span>
                  <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}>
                    deals
                  </span>
                  <span
                    className="ml-4 w-40 text-right text-[12.5px]"
                    style={{ color: 'var(--theme-text-muted)' }}
                  >
                    {it.weighted || '—'}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        </article>
      </section>

      {/* 03 Pipeline trends */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >03</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Pipeline trends
            </h2>
          </div>
          <Eyebrow>Regenerate daily</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trendItems.map((t) => {
            const accent = (txt(t, 'accent') || 'accent') as TrendSeries['accent'];
            return (
              <TrendCard
                key={t.id}
                series={{
                  id: String(t.id),
                  title: txt(t, 'title') || '—',
                  caption: txt(t, 'caption') || '',
                  unit: txt(t, 'unit') || '',
                  points: pointsOf(t),
                  accent,
                }}
              />
            );
          })}
        </div>
      </section>

      {/* 04 Rep scorecard */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >04</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Rep scorecard
            </h2>
          </div>
          <Eyebrow>7.5 average</Eyebrow>
        </div>
        <article
          className="rounded-2xl p-6"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul className="space-y-4">
            {scoreItems.map((s) => {
              const pct = Math.round((num(s, 'value') / num(s, 'outOf')) * 100);
              const color = txt(s, 'tone') === 'ok' ? WIN : txt(s, 'tone') === 'warn' ? RELANCE : LOSE;
              return (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className="text-[12.5px] font-bold"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {txt(s, 'label') || '—'}
                    </span>
                    <span
                      className="text-[18px] font-extrabold tabular-nums"
                      style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                    >
                      {num(s, 'value').toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--theme-surface-hover)' }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {txt(s, 'note') || '—'}
                  </p>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      {/* 05 Cognition indicator — Brief N (2026-08-11).
         *  Sales garde UN SEUL temoin de Cognition : une carte avec un lien
         *  qui ouvre l'app dediee via openApp. Pas d'etats, pas de chargement,
         *  pas de gestion d'erreur — tout cela vit dans l'app Cognition. */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >05</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Cognition
            </h2>
          </div>
          <Eyebrow>bureau dedie</Eyebrow>
        </div>
        <button
          type="button"
          onClick={onOpenCognition}
          className="flex w-full items-center justify-between gap-3 rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--panel-border)',
            boxShadow: '0 1px 0 var(--panel-border-subtle)',
          }}
          aria-label="Ouvrir l'app Cognition"
        >
          <div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--theme-text-dim)' }}
            >
              Routines · journal · manifeste
            </div>
            <div
              className="mt-1 text-[15px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Cognition a son bureau
            </div>
            <p
              className="mt-1 text-[12.5px] leading-relaxed"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              La couche Cognition a quitte Sales. Routines, journal des evenements,
              manifeste du graphe et souverainete du savoir vivent dans l'app dediee.
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0"
            style={{ color: 'var(--theme-text-dim)' }}
          />
        </button>
      </section>
    </div>
  );
}

function TrendCard({ series }: { series: TrendSeries }): ReactElement {
  const max = Math.max(...series.points.map((p) => p.value));
  const color = series.accent === 'ok' ? WIN : series.accent === 'warn' ? RELANCE : series.accent === 'danger' ? LOSE : ACCENT;
  const fillColor = series.accent === 'ok' ? 'rgba(21,128,61,0.10)' : series.accent === 'warn' ? 'rgba(180,83,9,0.10)' : series.accent === 'danger' ? 'rgba(185,28,28,0.10)' : 'rgba(234,88,12,0.10)';
  const w = 560;
  const h = 180;
  const padX = 32;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const stepX = innerW / (series.points.length - 1);
  const points = series.points.map((p, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (p.value / max) * innerH;
    return { x, y, ...p };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`;

  return (
    <article
      className="rounded-2xl p-6"
      style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
    >
      <div className="mb-1 flex items-center gap-2">
        {series.id === 'tr-meetings' ? <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--theme-text)' }} /> : <WalletCards className="h-3.5 w-3.5" style={{ color: 'var(--theme-text)' }} />}
        <h3
          className="text-[15px] font-extrabold tracking-tight"
          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
        >
          {series.title}
        </h3>
      </div>
      <p className="mb-4 text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
        {series.caption}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" aria-hidden>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={padX}
            x2={padX + innerW}
            y1={padY + innerH * tick}
            y2={padY + innerH * tick}
            stroke="var(--panel-border-subtle)"
            strokeWidth={1}
          />
        ))}
        <path d={areaD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="var(--theme-surface)" strokeWidth={1.5} />
        ))}
        {points.map((p) => (
          <text
            key={`l-${p.label}`}
            x={p.x}
            y={h - 4}
            textAnchor="middle"
            fontSize="9"
            fontFamily={FONT_MONO}
            fill="var(--theme-text-dim)"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </article>
  );
}

// ─── Section: Context ───

function ContextPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory CONTEXT from the CMS store.
  const contextItems = useCmsStore(s => s.items['sales_context']) ?? [];
  // Chaque group porte 2 items (item1Title / item2Title). On derive le count
  // pour ne pas mentir sur le nombre de documents affichés plus bas.
  const livingDocs = contextItems.reduce((sum, g) => sum + (g.item1Title ? 1 : 0) + (g.item2Title ? 1 : 0), 0);
  void onSelect;
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Context"
        title="Sales OS"
        subtitle="Everything the OS knows about what we sell and to whom, kept as one folder of living documents."
        meta={{ label: 'Source', value: 'The single-source brief', sub: `${livingDocs} living document${livingDocs === 1 ? '' : 's'} · source of truth` }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Context' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Context' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      <section className="mt-8 max-w-[760px]">
        <div className="mb-4 flex items-baseline gap-3">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
            style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
          >01</span>
          <h2
            className="text-[20px] font-extrabold tracking-tight"
            style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
          >
            Context
          </h2>
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          Everything the OS knows about <span className="font-bold" style={{ color: 'var(--theme-text)' }}>what we sell</span> and <span className="font-bold" style={{ color: 'var(--theme-text)' }}>to whom</span>, kept as one folder of living documents. Open any file for the full detail. Read these once and you know the offer, the buyer, the motion, the objections, the voice, and the literals a client install edits.
        </p>
      </section>

      <div className="mt-8 space-y-8">
        {contextItems.map((group) => {
          const docs = [
            { id: `${group.id}-1`, title: txt(group, 'item1Title') || '—', subtitle: txt(group, 'item1Sub') || '' },
            { id: `${group.id}-2`, title: txt(group, 'item2Title') || '—', subtitle: txt(group, 'item2Sub') || '' },
          ];
          return (
          <section key={group.id}>
            <Eyebrow>{txt(group, 'eyebrow') || '—'}</Eyebrow>
            <ul className="mt-3 space-y-3">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(docDetail({ id: doc.id, title: doc.title, subtitle: doc.subtitle }, doc.subtitle))}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left"
                    style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-md"
                        style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span>
                        <span
                          className="block text-[15px] font-extrabold tracking-tight"
                          style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                        >
                          {doc.title}
                        </span>
                        <span className="block text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                          {doc.subtitle}
                        </span>
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: 'var(--theme-text-dim)' }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section: Capabilities ───

function CapabilitiesPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory SKILLS + ROUTINES from the CMS store. Icon
  // is stored as a string identifier; the renderer maps it to a Lucide
  // component. Routines' `kind` is also a string enum.
  const skillItems = useCmsStore(s => s.items['sales_skills']) ?? [];
  const routineItems = useCmsStore(s => s.items['sales_routines']) ?? [];
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  // Map icon string identifiers to Lucide components. Add new icons here
  // when extending the sales_skills collection.
  const iconMap: Record<string, LucideIcon> = {
    Phone, FileText, Target, Users, Mail, ClipboardList, MessageSquare, BriefcaseBusiness,
  };
  void onSelect;
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Capabilities"
        title="Sales OS"
        subtitle="The skills and routines that run the second brain. Eight skills on demand, six routines on a clock — each one is the kind of thing you used to do at 9am before you had an OS."
        meta={{ label: 'Skills', value: `${skillItems.length}`, sub: `${routineItems.length} routines` }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Capabilities' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Capabilities' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Skills
            </h2>
          </div>
          <Eyebrow>on demand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {skillItems.map((s) => {
            // Map icon string (stored in CMS) to Lucide component.
            // If the icon name doesn't match, fall back to Phone.
            const iconName = txt(s, 'icon') || 'Phone';
            const Icon = iconMap[iconName] ?? Phone;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => onSelect(skillDetail({
                  id: String(s.id),
                  name: txt(s, 'name') || '—',
                  description: txt(s, 'description') || '',
                  icon: Icon,
                }))}
                className="group flex items-start gap-3 rounded-2xl p-5 text-left"
                style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[15px] font-extrabold tracking-tight"
                    style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                  >
                    {txt(s, 'name') || '—'}
                  </span>
                  <span className="mt-0.5 block text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {txt(s, 'description') || '—'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >02</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              Routines
            </h2>
          </div>
          <Eyebrow>{`${routineItems.length} routines`}</Eyebrow>
        </div>
        <article
          className="rounded-2xl"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
        >
          <ul>
            {routineItems.map((r, i) => {
              const kind = txt(r, 'kind');
              const KindIcon = kind === 'event' ? Layers : kind === 'time' ? Calendar : Mic;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--panel-border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(routineDetail({
                      id: String(r.id),
                      name: txt(r, 'name') || '—',
                      trigger: txt(r, 'trigger') || '',
                      last: txt(r, 'last') || '',
                      kind: (kind === 'event' || kind === 'time' || kind === 'manual' ? kind : 'time') as 'event' | 'time' | 'manual',
                      isActive: Boolean(r['isActive']),
                    }))}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-md"
                      style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                    >
                      <KindIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[14.5px] font-extrabold tracking-tight"
                        style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                      >
                        {txt(r, 'name') || '—'}
                      </span>
                      <span
                        className="mt-0.5 block text-[10.5px] font-bold uppercase"
                        style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                      >
                        {txt(r, 'trigger') || '—'}
                      </span>
                    </span>
                  </button>
                  <div className="text-right">
                    <Eyebrow>last run</Eyebrow>
                    <div
                      className="mt-1 text-[12.5px] font-bold"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {txt(r, 'last') || '—'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </div>
  );
}

// ─── Section: Stack ───

function StackPanel({ onSelect, navigateToSection }: { onSelect: (item: DetailItem) => void; navigateToSection: (id: string) => void }) {
  // Read the formerly in-memory STACK from the CMS store. Tools are
  // JSON-serialized in a longtext field; parsed here. Falls back to the
  // legacy STACK constant if the collection isn't registered yet (HMR).
  const cmsStack = useCmsStore(s => s.items['sales_stack']) ?? [];
  const txt = (item: CmsItem | undefined, key: string): string => {
    if (!item) return '';
    const v = item[key];
    return typeof v === 'string' ? v : '';
  };
  type StackTool = { id: string; name: string; role: string; cost?: string; status: ToolStatus };
  const toolsOf = (item: CmsItem | undefined): StackTool[] => {
    if (!item) return [];
    const raw = item['tools'];
    if (typeof raw !== 'string' || raw.length === 0) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((t): t is StackTool =>
        t && typeof t === 'object' && typeof t.id === 'string' && typeof t.name === 'string' && typeof t.role === 'string'
      );
    } catch {
      return [];
    }
  };
  // Use the CMS data if any group is present, else fall back to in-memory.
  const useCms = cmsStack.length > 0;
  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Stack"
        title="Sales OS"
        subtitle="The tools the OS reads from and acts through, grouped by the job they do. Attio is the system of record, everything else feeds it or runs off it."
        meta={{ label: 'Status', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), sub: 'Live, connected, pending, dormant' }}
      />

      <div className="mt-8 flex items-center gap-1.5">
        {['Today', 'Pipeline', 'Context', 'Capabilities', 'Stack'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigateToSection(t.toLowerCase())}
            className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 active:scale-[0.98]"
            style={{
              background: t === 'Stack' ? 'var(--theme-text)' : 'var(--theme-surface)',
              color: t === 'Stack' ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
              fontFamily: FONT_DISPLAY,
            }}
            aria-label={`Jump to ${t} section`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-2 h-px" style={{ background: 'var(--panel-border)' }} />

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
            >01</span>
            <h2
              className="text-[20px] font-extrabold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
            >
              The stack
            </h2>
          </div>
        </div>
        <p className="max-w-[640px] text-[13px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
          The tools the OS reads from and acts through, grouped by the job they do. Attio is the system of record, everything else feeds it or runs off it.
        </p>
      </section>

      <div className="mt-8 space-y-10">
        {(useCms ? cmsStack : STACK).map((group, gi) => {
          // When using CMS data, hydrate tools from the JSON-serialized field.
          // Otherwise use the in-memory STACK tools directly.
          const tools = useCms
            ? toolsOf(cmsStack[gi])
            : (group as StackGroup).tools;
          const groupId = String((group as { id: string }).id);
          const groupName = useCms ? txt(cmsStack[gi], 'name') || '—' : (group as StackGroup).name;
          const groupCaption = useCms ? txt(cmsStack[gi], 'caption') || '' : (group as StackGroup).caption;
          return (
          <section key={groupId}>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{ background: 'var(--theme-text)', color: 'var(--theme-bg)', fontFamily: FONT_MONO }}
                >
                  {String(gi + 2).padStart(2, '0')}
                </span>
                <h2
                  className="text-[20px] font-extrabold tracking-tight"
                  style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                >
                  {groupName}
                </h2>
              </div>
              <Eyebrow>{groupCaption}</Eyebrow>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <button
                  type="button"
                  key={tool.id}
                  onClick={() => onSelect(stackDetail(tool, groupName))}
                  className="group flex items-start gap-3 rounded-2xl p-5 text-left"
                  style={{ background: 'var(--theme-surface)', border: '1px solid var(--panel-border)' }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text)' }}
                  >
                    <StackIcon id={tool.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className="text-[15px] font-extrabold tracking-tight"
                        style={{ fontFamily: FONT_DISPLAY, color: 'var(--theme-text)' }}
                      >
                        {tool.name}
                      </span>
                      {tool.cost ? (
                        <span
                          className="text-[10.5px] font-bold uppercase"
                          style={{ letterSpacing: '0.16em', color: 'var(--theme-text-dim)', fontFamily: FONT_MONO }}
                        >
                          {tool.cost}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      {tool.role}
                    </span>
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        background: tool.status === 'live' || tool.status === 'connected' ? 'rgba(21,128,61,0.10)' : tool.status === 'pending' ? 'rgba(180,83,9,0.10)' : 'rgba(120,113,108,0.10)',
                        color: tool.status === 'live' || tool.status === 'connected' ? WIN : tool.status === 'pending' ? RELANCE : 'var(--theme-text-muted)',
                        letterSpacing: '0.16em',
                        fontFamily: FONT_MONO,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tool.status === 'live' || tool.status === 'connected' ? WIN : tool.status === 'pending' ? RELANCE : 'var(--theme-text-dim)' }}
                        aria-hidden
                      />
                      {tool.status}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}

function StackIcon({ id }: { id: string }): ReactElement {
  const map: Record<string, typeof Database> = {
    't-attio': Database,
    't-pandadoc': FileText,
    't-fireflies': Mic,
    't-aircall': PhoneCall,
    't-gws': Cloud,
    't-slack': MessageSquare,
    't-vibe': Sparkles,
    't-apify': Plug,
    't-apollo': Target,
    't-li': Users,
    't-vain': BriefcaseBusiness,
    't-amf': Mail,
    't-instantly': Mail,
    't-lemnlist': BriefcaseBusiness,
  };
  const I = map[id] ?? Cpu;
  return <I className="h-4 w-4" />;
}

// ─── Section: Kanban ───
//
// The Kanban is the CMS-driven view of the `deals` collection. Each card
// carries a "Move forward" button that advances the deal to the next stage
// via `updateItem('deals', id, { stage: next })`. This is the mutation that
// took Sales from 7/9 to 9/9 — every deal the coach touches writes back to
// the store, persisted in the same partition as the rest of the tenant data.

const DEAL_STAGES = ['Qualified', 'Proposal', 'Won', 'Lost'] as const;
type DealStageValue = typeof DEAL_STAGES[number];

function nextStage(current: string): DealStageValue {
  const idx = DEAL_STAGES.indexOf(current as DealStageValue);
  if (idx === -1) return 'Qualified';
  const nextIdx = Math.min(idx + 1, DEAL_STAGES.length - 1);
  return DEAL_STAGES[nextIdx];
}

function KanbanPanel({ onSelect }: { onSelect: (item: DetailItem) => void }): ReactElement {
  const deals = useCmsStore(s => s.items['deals']) ?? [];
  const updateItem = useCmsStore(s => s.updateItem);
  const addItem = useCmsStore(s => s.addItem);
  const addToast = useShellStore(s => s.addToast);

  const advance = (id: string, name: string, current: string): void => {
    const next = nextStage(current);
    if (next === current) {
      addToast({ source: 'Sales', type: 'warning', message: `${name} is already at the final stage.` });
      return;
    }
    updateItem('deals', id, { stage: next });
    addToast({ source: 'Sales', type: 'success', message: `${name} → ${next}` });
  };

  /** Compose a new deal inline. The coach enters the client name, picks an
   *  offer and a value; the stage defaults to "Qualified" (first stage) so
   *  the new card lands in the leftmost column of the kanban. The mutation
   *  flows through addItem so the new row appears without a refresh. */
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerClient, setComposerClient] = useState('');
  const [composerOffer, setComposerOffer] = useState<'Citadelle' | 'Programme'>('Citadelle');
  const [composerValue, setComposerValue] = useState('1800');

  const submitNewDeal = (): void => {
    const client = composerClient.trim();
    if (client.length === 0) {
      addToast({ source: 'Sales', type: 'warning', message: 'Client name is required.' });
      return;
    }
    const valueNum = Number(composerValue);
    if (!Number.isFinite(valueNum) || valueNum <= 0) {
      addToast({ source: 'Sales', type: 'warning', message: 'Deal value must be a positive number.' });
      return;
    }
    const result = addItem('deals', {
      client,
      offer: composerOffer,
      value: valueNum,
      stage: 'Qualified',
    });
    if (result.ok) {
      addToast({ source: 'Sales', type: 'success', message: `Deal added: ${client} ($${valueNum.toLocaleString('en-US')}).` });
      setComposerClient('');
      setComposerOffer('Citadelle');
      setComposerValue('1800');
      setComposerOpen(false);
    } else {
      addToast({ source: 'Sales', type: 'warning', message: result.error ?? 'Could not create deal.' });
    }
  };

  const cancelComposer = (): void => {
    setComposerClient('');
    setComposerOffer('Citadelle');
    setComposerValue('1800');
    setComposerOpen(false);
  };

  // Bucket deals: 4 known stages + an "Other" bucket for deals whose stage
  // string doesn't match — previously they were silently hidden, leaving the
  // kanban out of sync with the store.
  const knownStageSet = new Set<string>(DEAL_STAGES);
  const otherDeals = deals.filter((d) => !knownStageSet.has(String(d.stage)));
  const hasOther = otherDeals.length > 0;

  const allColumns: { title: string; accent: string; items: { id: string; stage: string; clientName: string; offer: string; value: number }[] }[] = DEAL_STAGES.map((stage) => ({
    title: stage,
    accent: stage === 'Won' ? WIN : stage === 'Lost' ? LOSE : stage === 'Proposal' ? ACCENT : RELANCE,
    items: deals
      .filter((d) => String(d.stage) === stage)
      .map((d) => ({
        id: String(d.id),
        stage: String(d.stage),
        clientName: String(d.client ?? 'Untitled'),
        offer: String(d.offer ?? ''),
        value: Number(d.value ?? 0),
      })),
  }));
  if (hasOther) {
    allColumns.push({
      title: 'Other',
      accent: 'var(--theme-text-dim)',
      items: otherDeals.map((d) => ({
        id: String(d.id),
        stage: String(d.stage ?? '—'),
        clientName: String(d.client ?? 'Untitled'),
        offer: String(d.offer ?? ''),
        value: Number(d.value ?? 0),
      })),
    });
  }

  const columns = allColumns.map((col) => ({
    title: col.title,
    accent: col.accent,
    items: col.items.map((d) => (
      <div
        key={d.id}
        className="rounded-lg border p-3 shadow-sm"
        style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
      >
        <button
          type="button"
          onClick={() => onSelect({
            id: d.id,
            kind: 'deal',
            title: d.clientName,
            subtitle: d.offer,
            status: d.stage,
            summary: `Deal valued at $${d.value.toLocaleString('en-US')}. Move forward to track progress.`,
            fields: [
              { label: 'Offer', value: d.offer },
              { label: 'Value', value: `$${d.value.toLocaleString('en-US')}` },
              { label: 'Stage', value: d.stage },
            ],
          })}
          className="block w-full text-left"
          aria-label={`Open ${d.clientName} detail`}
        >
          <span className="block text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{d.clientName}</span>
          <span className="block text-[11.5px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{d.offer}</span>
          <span className="block text-[10.5px] font-mono mt-1" style={{ color: 'var(--theme-text-dim)' }}>
            ${d.value.toLocaleString('en-US')}
          </span>
        </button>
        {col.title !== 'Other' && col.title !== 'Won' && col.title !== 'Lost' ? (
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => advance(d.id, d.clientName, d.stage)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'var(--theme-surface-hover)',
                color: 'var(--theme-text)',
                border: '1px solid var(--panel-border)',
              }}
              aria-label={`Move ${d.clientName} to ${nextStage(col.title)}`}
            >
              <ArrowRight className="w-3 h-3" />
              Move to {nextStage(col.title)}
            </button>
          </div>
        ) : null}
        {/* Open detail reuses the same fiche as the card itself — the
            previous "useCollectionDrill('deals', 'Deals')" was a dead
            link (no 'Deals' section in SalesApp), so the overlay never
            opened and the toast-less click read as a no-op. */}
        <button
          type="button"
          onClick={() => onSelect({
            id: d.id,
            kind: 'deal',
            title: d.clientName,
            subtitle: d.offer,
            status: d.stage,
            summary: `Deal valued at $${d.value.toLocaleString('en-US')}. Move forward to track progress.`,
            fields: [
              { label: 'Offer', value: d.offer },
              { label: 'Value', value: `$${d.value.toLocaleString('en-US')}` },
              { label: 'Stage', value: d.stage },
            ],
          })}
          className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-mono"
          style={{ color: 'var(--theme-text-dim)' }}
          aria-label={`Reopen ${d.clientName} detail`}
        >
          <ChevronRight className="w-3 h-3" />
          Open detail
        </button>
      </div>
    )),
  }));

  return (
    <div className="mx-auto w-full max-w-[1180px] px-8 py-8" style={{ fontFamily: FONT_BODY }}>
      <PageHeader
        eyebrow="Sales OS · live operating layer · Kanban"
        title="Sales OS"
        subtitle="A CMS-driven view of the deal pipeline. Each card is a writable mutation — the coach's edits flow back to the store."
        meta={{ label: 'Deals', value: `${deals.length}`, sub: 'Updated live' }}
      />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
          Move a deal from column to column as it progresses. A Won deal exposes
          a Generate invoice action in its dossier.
        </p>
        {!composerOpen ? (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: ACCENT,
              color: '#ffffff',
              border: '1px solid var(--panel-border)',
            }}
            aria-label="Create a new deal"
          >
            + New deal
          </button>
        ) : null}
      </div>
      {composerOpen ? (
        <div
          className="mt-3 rounded-xl border p-4"
          style={{ background: 'var(--theme-surface)', borderColor: 'var(--panel-border)' }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-client"
              >
                Client
              </label>
              <input
                id="deals-composer-client"
                autoFocus
                value={composerClient}
                onChange={(e) => setComposerClient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewDeal();
                  if (e.key === 'Escape') cancelComposer();
                }}
                placeholder="Elena Marquez"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-offer"
              >
                Offer
              </label>
              <select
                id="deals-composer-offer"
                value={composerOffer}
                onChange={(e) => setComposerOffer(e.target.value as 'Citadelle' | 'Programme')}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <option value="Citadelle">Citadelle</option>
                <option value="Programme">Programme</option>
              </select>
            </div>
            <div>
              <label
                className="block text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
                style={{ color: 'var(--theme-text-dim)' }}
                htmlFor="deals-composer-value"
              >
                Value (USD)
              </label>
              <input
                id="deals-composer-value"
                type="number"
                inputMode="numeric"
                min="0"
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewDeal();
                  if (e.key === 'Escape') cancelComposer();
                }}
                placeholder="1800"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={cancelComposer}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'transparent',
                  color: 'var(--theme-text-dim)',
                  border: '1px solid var(--panel-border)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNewDeal}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: ACCENT,
                  color: '#ffffff',
                }}
              >
                Create deal
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mt-6">
        <KanbanBoard columns={columns} />
      </div>
    </div>
  );
}

// ─── Root SalesApp ───

export function SalesApp() {
  const openApp = useShellStore((state) => state.openApp);
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  // Le ton creme de l'app vient de CANONICAL_APP_THEMES dans lib/themes/tokens.ts,
  // pas d'ici. Une version precedente appelait `setAppTheme('sales', ...)` a
  // chaque montage : cela ecrasait le choix de l'utilisateur dans Settings et
  // annulait en silence la surcharge de theme par app. `resolveTheme` lit
  // `appThemes[appId] ?? CANONICAL_APP_THEMES[appId] ?? globalTheme` — le defaut
  // canonique donne donc le meme rendu tout en laissant le choix explicite gagner.

  const navigate = (appId: string): void => {
    if (appId === 'tasks') openApp('tasks', 'Tasks');
    if (appId === 'settings') openApp('settings', 'Settings');
    if (appId === 'sales') openApp('sales', SALES_TITLE);
    setDetail(null);
  };

  /** Section-to-section nav inside Sales. The AppFrame listens to
   *  `coach-os:open-app-section` (DOM custom event, see AppFrame.tsx) and
   *  switches activeId when the requested sectionId matches. Dispatching
   *  with no appId bypasses the cross-app filter — the single AppFrame
   *  mounted in this window always handles it. */
  const navigateToSection = (sectionId: string): void => {
    window.dispatchEvent(new CustomEvent('coach-os:open-app-section', {
      detail: { sectionId },
    }));
    setDetail(null);
  };

  // Brief N (2026-08-11) — Sales garde un seul indicateur de Cognition : une
  // carte dans la section Pipeline qui ouvre l'app Cognition via l'evenement
  // `coach-os:open-app-section` (le seul a avoir un ecouteur, voir SOCLE.md).
  const openCognition = (): void => {
    openApp('cognition', 'Cognition');
    setDetail(null);
  };

  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  const sections: AppSection[] = useMemo(() => [
    { id: 'today', label: 'Today', icon: Sun, render: () => <TodayPanel onSelect={setDetail} /> },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, render: () => <PipelinePanel onSelect={setDetail} navigateToSection={navigateToSection} onOpenCognition={openCognition} /> },
    { id: 'kanban', label: 'Kanban', icon: ClipboardList, render: () => <KanbanPanel onSelect={setDetail} /> },
    { id: 'context', label: 'Context', icon: BookOpen, render: () => <ContextPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
    { id: 'capabilities', label: 'Capabilities', icon: Sparkles, render: () => <CapabilitiesPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
    { id: 'stack', label: 'Stack', icon: Cpu, render: () => <StackPanel onSelect={setDetail} navigateToSection={navigateToSection} /> },
  ], []);

  return (
    <div className="relative h-full">
      <AppFrame
        title={SALES_TITLE}
        subtitle={SALES_SUBTITLE}
        accent={ACCENT}
        icon={Handshake}
        sections={sections}
      />
      {detail ? (
        <AppDetailOverlay
          appId="sales"
          accent={ACCENT}
          onBack={() => setDetail(null)}
          motion={{ kind: 'slide-right', durationMs: 200 }}
        >
          <SalesDetailPage item={detail} onBack={() => setDetail(null)} onNavigate={navigate} />
        </AppDetailOverlay>
      ) : null}
    </div>
  );
}
