import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, BookOpen, BriefcaseBusiness, BrainCircuit, Calendar, CircleDashed, Cloud, Cpu,
  Handshake, Phone, Settings2, ShieldCheck, Sparkles, Sun, Target, TrendingUp, WalletCards,
} from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { AppDetailOverlay } from '../../components/cms/AppDetailOverlay';
import { StatCard, Badge } from '../_ui/kit';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { readTrustScore, silentReject, COGNITION_TRUST_FLOOR } from '../../lib/observability';
import {
  fetchEventCount, fetchEventTypeCounts, fetchLatestManifest, fetchRoutines,
  type EventTypeCount, type Manifest, type Routine,
} from '../../lib/cognition/queries';
import { useShellStore } from '../../stores/shell.store';
import { useWindowPage } from '../../contexts/WindowContext';
import { SalesDetailPage, type DetailField, type DetailItem } from './SalesDetailPage';
import { registerItemDetail } from '../../components/cms/itemDetailRegistry';
import { SalesItemDetail } from './SalesItemDetail';

registerItemDetail('sales', SalesItemDetail);
import { CognitionOverviewContent } from '../cognition/CognitionApp';

const ACCENT = '#ea580c';
const SALES_TITLE = 'Sales Sanctum';

type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'neutral';
type ToolStatus = 'connected' | 'pending';

interface CallRecord { id: string; title: string; company: string; time: string; stage: string; tone: Tone; summary: string; fields: DetailField[]; }
interface DealRecord { id: string; title: string; company: string; stage: string; value: string; owner: string; nextStep: string; tone: Tone; summary: string; }
interface TaskRecord { id: string; title: string; when: string; priority: string; tone: Tone; summary: string; }
interface ContextDocument { id: string; title: string; description: string; preview: string; fields: DetailField[]; icon: typeof BookOpen; }
interface StackTool { id: string; name: string; description: string; status: ToolStatus; category: string; }
interface StackCategory { name: string; tools: StackTool[]; }
interface CognitionState { routines: Routine[]; eventCount: number; eventTypes: EventTypeCount[]; manifest: Manifest | null; live: boolean; loading: boolean; error: string | null; }

const FALLBACK_ROUTINES: Routine[] = [
  { id: 'fallback-morning', org_id: '', name: 'Morning Routine', cadence: 'daily', time_of_day: '08:00:00', prompt_template: 'Prepare the sales day.', skills_invoked: ['pipeline-review'], is_active: true },
  { id: 'fallback-hygiene', org_id: '', name: 'Pipeline Hygiene', cadence: 'daily', time_of_day: '08:45:00', prompt_template: 'Find stale opportunities and assign next actions.', skills_invoked: ['pipeline-review'], is_active: true },
  { id: 'fallback-prep', org_id: '', name: 'Call Prep', cadence: 'daily', time_of_day: null, prompt_template: 'Prepare the next prospect brief.', skills_invoked: ['call-prep', 'client-onepager'], is_active: true },
  { id: 'fallback-followup', org_id: '', name: 'Post-Disc Followup', cadence: 'daily', time_of_day: null, prompt_template: 'Draft the next follow-up from call context.', skills_invoked: ['post-disc-followup', 'outreach'], is_active: true },
  { id: 'fallback-scoring', org_id: '', name: 'Rep Scoring', cadence: 'weekly', time_of_day: null, prompt_template: 'Score recent sales conversations.', skills_invoked: ['sales-rep-analyzer'], is_active: true },
  { id: 'fallback-weekly', org_id: '', name: 'Weekly Pipeline Review', cadence: 'weekly', time_of_day: null, prompt_template: 'Review conversion and stalled deals.', skills_invoked: ['pipeline-review', 'win-loss-analysis'], is_active: true },
  { id: 'fallback-monthly', org_id: '', name: 'Monthly Intelligence Report', cadence: 'monthly', time_of_day: null, prompt_template: 'Extract recurring patterns from the month.', skills_invoked: ['win-loss-analysis'], is_active: true },
];

const CALLS: CallRecord[] = [
  { id: 'call-anish', title: 'Anish · scale-up review', company: 'Anish Labs', time: '12:20', stage: 'Qualified', tone: 'accent', summary: 'Anish has a funded team and a clear operational trigger. The call should validate the decision process, budget owner, and implementation window before a proposal is drafted.', fields: [{ label: 'Meeting type', value: 'Discovery and qualification' }, { label: 'Decision signal', value: 'Funded scale-up with active pain' }, { label: 'Next action', value: 'Confirm budget owner and close path' }] },
  { id: 'call-itay', title: 'Itay · rebook', company: 'Itay Studio', time: '16:45', stage: 'Rebooked', tone: 'warn', summary: 'The original conversation moved. Keep the rebook focused on the cost of the current workflow and leave with a concrete next step rather than another open-ended exploration.', fields: [{ label: 'Meeting type', value: 'Rescheduled discovery' }, { label: 'Risk', value: 'Momentum can decay before the new slot' }, { label: 'Next action', value: 'Send a concise pre-call confirmation' }] },
  { id: 'call-louis', title: 'Louis · offer fit', company: 'Louis Conseil', time: '18:00', stage: 'Proposal fit', tone: 'ok', summary: 'Louis is close to the offer boundary. Use the call to test the strongest outcome, identify the buying constraint, and decide whether the standard package or a narrower first engagement is appropriate.', fields: [{ label: 'Meeting type', value: 'Offer and positioning review' }, { label: 'Decision signal', value: 'Clear outcome, package still open' }, { label: 'Next action', value: 'Align scope before pricing discussion' }] },
];

const DEALS: DealRecord[] = [
  { id: 'deal-anish', title: 'Anish Labs', company: 'Funded scale-up', stage: 'Qualified', value: '$18,000', owner: 'Amadou', nextStep: 'Budget-owner call', tone: 'accent', summary: 'ICP-edge opportunity with a strong trigger and an unresolved buying committee.' },
  { id: 'deal-tim', title: 'Tim · proposal', company: 'Tim Advisory', stage: 'Proposal', value: '$12,000', owner: 'Amadou', nextStep: 'Send proposal', tone: 'danger', summary: 'Proposal is ready. The immediate constraint is a time-critical send and explicit decision date.' },
  { id: 'deal-louis', title: 'Louis Conseil', company: 'Independent advisory', stage: 'Discovery', value: '$8,000', owner: 'Amadou', nextStep: 'Offer-fit call', tone: 'ok', summary: 'Good fit for a focused first engagement if scope is kept narrow and outcome-led.' },
  { id: 'deal-ita', title: 'Itay Studio', company: 'Creative services', stage: 'Rebooked', value: '$5,000', owner: 'Amadou', nextStep: 'Attend rebook', tone: 'warn', summary: 'Rebooked opportunity with a meaningful follow-up obligation and a risk of losing momentum.' },
  { id: 'deal-nova', title: 'Nova Systems', company: 'Operations software', stage: 'New', value: '$9,500', owner: 'Amadou', nextStep: 'Qualify trigger', tone: 'neutral', summary: 'New inbound lead awaiting a first qualification pass against the canonical ICP.' },
  { id: 'deal-arc', title: 'Arc Mobility', company: 'Mobile-first operator', stage: 'Negotiation', value: '$14,500', owner: 'Amadou', nextStep: 'Resolve objection', tone: 'accent', summary: 'Late-stage deal where the open question is objection handling, not product awareness.' },
];

const TASKS: TaskRecord[] = [
  { id: 'task-proposal', title: "Send Tim's proposal", when: 'Today · time-critical', priority: 'Priority 1', tone: 'danger', summary: 'Send the prepared proposal, include the decision date, and create a clear follow-up task.' },
  { id: 'task-rebook', title: 'Confirm Itay rebook', when: 'Today · owed', priority: 'Priority 2', tone: 'warn', summary: 'Confirm the 16:45 slot and include the one question that keeps the opportunity qualified.' },
  { id: 'task-qualify', title: 'Qualify Nova trigger', when: 'Today · pipeline', priority: 'Priority 2', tone: 'accent', summary: 'Check the buying trigger and route the opportunity to the correct stage.' },
  { id: 'task-louis', title: 'Prepare Louis offer fit', when: 'Today · 18:00 call', priority: 'Priority 1', tone: 'ok', summary: 'Bring the outcome, scope boundary, and next-step question into the call brief.' },
];

const DOCUMENTS: ContextDocument[] = [
  { id: 'doc-icp', title: 'ICP', description: 'Ideal Customer Profile and buying triggers', preview: 'The ICP is the first filter for every lead, call brief, and pipeline decision.', fields: [{ label: 'Use first', value: 'Lead qualification and call prep' }, { label: 'Grounding rule', value: 'Do not promote an opportunity without a verified trigger' }], icon: BriefcaseBusiness },
  { id: 'doc-offer', title: 'Offer', description: 'What we sell, scope, and pricing logic', preview: 'The offer turns a qualified pain into a bounded first engagement with a measurable outcome.', fields: [{ label: 'Use first', value: 'Proposal drafting' }, { label: 'Grounding rule', value: 'Scope the first win before expanding the package' }], icon: WalletCards },
  { id: 'doc-positioning', title: 'Positioning', description: 'Differentiation and buyer language', preview: 'Positioning keeps the sales conversation tied to the buyer outcome instead of feature comparison.', fields: [{ label: 'Use first', value: 'Discovery and objection handling' }, { label: 'Grounding rule', value: 'Lead with the change the buyer needs to create' }], icon: Target },
  { id: 'doc-process', title: 'Sales process', description: 'Stages, handoffs, and next-action rules', preview: 'Every open deal must have a stage, an owner, and a next action that can be observed.', fields: [{ label: 'Use first', value: 'Pipeline hygiene' }, { label: 'Grounding rule', value: 'No opportunity remains open without a dated next step' }], icon: TrendingUp },
  { id: 'doc-stack', title: 'Stack', description: 'Connectors that feed the second brain', preview: 'The connector map separates live cognition sources from tools that are still awaiting configuration.', fields: [{ label: 'Use first', value: 'Workflow routing and diagnostics' }, { label: 'Grounding rule', value: 'A pending connector cannot be treated as a live source' }], icon: Cpu },
  { id: 'doc-voice', title: 'Voice', description: 'Tone, vocabulary, and brand constraints', preview: 'Voice keeps outreach direct, specific, and grounded in the customer context.', fields: [{ label: 'Use first', value: 'Outreach and follow-up' }, { label: 'Grounding rule', value: 'Prefer a precise next step over generic enthusiasm' }], icon: BookOpen },
];

const STACK: StackCategory[] = [
  { name: 'CRM', tools: [
    { id: 'tool-attio', name: 'Attio', description: 'Primary account and opportunity workspace.', status: 'connected', category: 'CRM' },
    { id: 'tool-hubspot', name: 'HubSpot', description: 'Secondary CRM connector for historical records.', status: 'pending', category: 'CRM' },
    { id: 'tool-pipedrive', name: 'Pipedrive', description: 'Pipeline migration and comparison source.', status: 'pending', category: 'CRM' },
  ] },
  { name: 'Transcription', tools: [
    { id: 'tool-fireflies', name: 'Fireflies', description: 'Conversation capture and transcript source.', status: 'connected', category: 'Transcription' },
    { id: 'tool-gong', name: 'Gong', description: 'Conversation intelligence connector.', status: 'pending', category: 'Transcription' },
    { id: 'tool-otter', name: 'Otter', description: 'Fallback transcript source.', status: 'pending', category: 'Transcription' },
  ] },
  { name: 'Proposal', tools: [
    { id: 'tool-pandadoc', name: 'PandaDoc', description: 'Proposal assembly and signature workflow.', status: 'connected', category: 'Proposal' },
    { id: 'tool-qwilr', name: 'Qwilr', description: 'Interactive proposal surface.', status: 'pending', category: 'Proposal' },
    { id: 'tool-better-proposals', name: 'Better Proposals', description: 'Proposal template connector.', status: 'pending', category: 'Proposal' },
  ] },
  { name: 'Workspace', tools: [
    { id: 'tool-gmail', name: 'Gmail', description: 'Outbound email and follow-up source.', status: 'connected', category: 'Workspace' },
    { id: 'tool-calendar', name: 'Google Calendar', description: 'Meeting and rebook source.', status: 'connected', category: 'Workspace' },
    { id: 'tool-slack', name: 'Slack', description: 'Internal handoff and alert channel.', status: 'pending', category: 'Workspace' },
  ] },
  { name: 'Calling', tools: [
    { id: 'tool-aircall', name: 'Aircall', description: 'Outbound calling connector.', status: 'pending', category: 'Calling' },
    { id: 'tool-dialpad', name: 'Dialpad', description: 'Call routing and recording connector.', status: 'pending', category: 'Calling' },
  ] },
  { name: 'Lead DB', tools: [
    { id: 'tool-apollo', name: 'Apollo', description: 'Lead enrichment and prospect search.', status: 'connected', category: 'Lead DB' },
    { id: 'tool-linkedin', name: 'LinkedIn Sales Navigator', description: 'Account and buyer discovery source.', status: 'pending', category: 'Lead DB' },
    { id: 'tool-vibe', name: 'Vibe Prospecting', description: 'Target-account discovery workflow.', status: 'pending', category: 'Lead DB' },
  ] },
  { name: 'Scraping', tools: [
    { id: 'tool-apify', name: 'Apify', description: 'Web and profile extraction connector.', status: 'pending', category: 'Scraping' },
    { id: 'tool-browser', name: 'Browser extraction', description: 'Controlled research capture path.', status: 'pending', category: 'Scraping' },
  ] },
  { name: 'Hosting', tools: [
    { id: 'tool-vercel', name: 'Vercel', description: 'Sales OS deployment surface.', status: 'connected', category: 'Hosting' },
    { id: 'tool-supabase', name: 'Supabase', description: 'Live cognition memory and event source.', status: 'connected', category: 'Hosting' },
  ] },
];

const SKILLS: ReadonlyArray<readonly [string, string]> = [
  ['call-prep', 'Prepare a grounded brief for an upcoming call.'],
  ['client-onepager', 'Turn second-brain context into a buyer one-pager.'],
  ['lead-generation', 'Find and qualify target accounts through connected sources.'],
  ['linkedin-post-engagement', 'Engage target prospects with relevant context.'],
  ['outreach', 'Draft direct email and LinkedIn sequences.'],
  ['pipeline-review', 'Flag stale deals and missing next actions.'],
  ['post-disc-followup', 'Draft follow-up and proposal actions from a call.'],
  ['sales-rep-analyzer', 'Score five dimensions of call performance.'],
  ['win-loss-analysis', 'Extract patterns from won and lost opportunities.'],
];

const TAB_DEFS: ReadonlyArray<{ id: string; label: string; icon: typeof Sun }> = [
  { id: 'cognition', label: 'Cognition', icon: BrainCircuit },
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'context', label: 'Context', icon: BookOpen },
  { id: 'capabilities', label: 'Capabilities', icon: Sparkles },
  { id: 'stack', label: 'Stack', icon: Cpu },
];

const FUNNEL_STAGES: ReadonlyArray<{ label: string; aliases: readonly string[]; tone: Tone }> = [
  { label: 'Leads', aliases: ['lead_created', 'lead_captured', 'prospect_created'], tone: 'neutral' },
  { label: 'Calls', aliases: ['call_booked', 'call_completed', 'meeting_booked', 'meeting_completed'], tone: 'accent' },
  { label: 'Qualified', aliases: ['qualified', 'deal_qualified'], tone: 'warn' },
  { label: 'Proposals', aliases: ['proposal_sent', 'proposal_created'], tone: 'accent' },
  { label: 'Won', aliases: ['won', 'deal_won'], tone: 'ok' },
];

const EMPTY_COGNITION: CognitionState = { routines: [], eventCount: 0, eventTypes: [], manifest: null, live: false, loading: true, error: null };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cognition data could not be loaded.';
}

function useCognitionData(): CognitionState {
  const [state, setState] = useState<CognitionState>(EMPTY_COGNITION);

  useEffect(() => {
    let cancelled = false;
    if (!supabaseConfigured) {
      setState({ ...EMPTY_COGNITION, routines: FALLBACK_ROUTINES, live: false, loading: false });
      return () => { cancelled = true; };
    }

    void Promise.all([
      fetchRoutines(supabase),
      fetchEventCount(supabase),
      fetchEventTypeCounts(supabase),
      fetchLatestManifest(supabase),
    ]).then(([routines, eventCount, eventTypes, manifest]) => {
      if (cancelled) return;
      setState({ routines, eventCount, eventTypes, manifest, live: true, loading: false, error: null });
    }).catch((error: unknown) => {
      if (cancelled) return;
      const message = errorMessage(error);
      silentReject('sales-os:cognition-hydration', message);
      setState({ ...EMPTY_COGNITION, loading: false, error: message });
    });

    return () => { cancelled = true; };
  }, []);

  return state;
}

function formatRoutineTime(time: string | null): string {
  return time ? time.slice(0, 5) : 'event-driven';
}

function routineDetail(routine: Routine): DetailItem {
  return {
    id: routine.id,
    kind: 'routine',
    title: routine.name,
    subtitle: routine.cadence + ' · ' + formatRoutineTime(routine.time_of_day),
    status: routine.is_active ? 'active' : 'paused',
    summary: routine.prompt_template ?? 'This routine has no prompt template exposed.',
    fields: [
      { label: 'Cadence', value: routine.cadence },
      { label: 'Skills invoked', value: routine.skills_invoked.length > 0 ? routine.skills_invoked.join(', ') : 'None declared' },
      { label: 'Source', value: 'cognition.routines' },
    ],
  };
}

function callDetail(call: CallRecord): DetailItem {
  return { id: call.id, kind: 'call', title: call.title, subtitle: call.company + ' · ' + call.time, status: call.stage, summary: call.summary, fields: call.fields };
}

function dealDetail(deal: DealRecord): DetailItem {
  return {
    id: deal.id,
    kind: 'deal',
    title: deal.title,
    subtitle: deal.company + ' · ' + deal.value,
    status: deal.stage,
    summary: deal.summary,
    fields: [
      { label: 'Owner', value: deal.owner },
      { label: 'Next action', value: deal.nextStep },
      { label: 'Pipeline value', value: deal.value },
    ],
  };
}

function taskDetail(task: TaskRecord): DetailItem {
  return {
    id: task.id,
    kind: 'task',
    title: task.title,
    subtitle: task.when,
    status: task.priority,
    summary: task.summary,
    fields: [
      { label: 'Timing', value: task.when },
      { label: 'Priority', value: task.priority },
      { label: 'Workspace', value: 'Tasks app' },
    ],
  };
}

function docDetail(doc: ContextDocument): DetailItem {
  return { id: doc.id, kind: 'doc', title: doc.title, subtitle: doc.description, status: 'canonical', summary: doc.preview, fields: doc.fields };
}

function toolDetail(tool: StackTool): DetailItem {
  return {
    id: tool.id,
    kind: 'tool',
    title: tool.name,
    subtitle: tool.category,
    status: tool.status,
    summary: tool.description,
    fields: [
      { label: 'Category', value: tool.category },
      { label: 'Status', value: tool.status },
      { label: 'Source role', value: 'Sales OS connector' },
    ],
  };
}

function findEventCount(eventTypes: EventTypeCount[], aliases: readonly string[]): number {
  return aliases.reduce((total, alias) => total + (eventTypes.find((entry) => entry.eventType === alias)?.count ?? 0), 0);
}

function trustLabel(score: number): string {
  return score >= COGNITION_TRUST_FLOOR ? 'gate armed' : 'gate review';
}

interface PanelProps {
  cognition: CognitionState;
  onSelect: (item: DetailItem) => void;
  onNavigate: (appId: string) => void;
}

function TodayPanel({ cognition, onSelect, onNavigate }: PanelProps) {
  const openApp = useShellStore((state) => state.openApp);
  const trustScore = readTrustScore();
  const repScore = cognition.eventCount > 0 ? cognition.eventCount + ' events' : '0 events';

  return (
    <div className="space-y-5 p-6">
      <SectionHead
        title="What to focus on today"
        subtitle="Calls, next actions, and the cognition signal behind the rep view"
        action={
          <button type="button" onClick={() => openApp('tasks', 'Tasks')} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50">Open Tasks app</button>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Calls today" value="3" tone="accent" hint="12:20 · 16:45 · 18:00" />
        <StatCard label="Open deals" value="6" tone="warn" hint="$67k mock pipeline view" />
        <StatCard label="Rep score" value={repScore} tone={cognition.eventCount > 0 ? 'ok' : 'neutral'} hint="cognition.events count" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Knowledge sovereignty {cognition.manifest ? Math.round(cognition.manifest.knowledge_sovereignty_score * 100) + '%' : 'not published'}</span>
        <span className="inline-flex items-center gap-1.5"><CircleDashed className="h-3.5 w-3.5 text-orange-600" /> Trust {trustScore.toFixed(2)} · {trustLabel(trustScore)}</span>
        <span className="font-mono text-[10px] text-stone-400">{cognition.live ? 'live cognition' : 'local configuration'}</span>
      </div>
      {cognition.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Live cognition is unavailable. The routine surface is intentionally empty until the connection returns.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section>
          <SectionHead title="Calls" subtitle="Open a call brief and route it to the Sovereign Gate" />
          <div className="grid gap-3">
            {CALLS.map((call) => (
              <button type="button" key={call.id} onClick={() => onSelect(callDetail(call))} className="flex w-full items-start gap-3 rounded-xl border border-[var(--panel-border)] bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Phone className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-stone-800">{call.title}</span><Badge tone={call.tone}>{call.time}</Badge></div>
                  <p className="mt-1 text-xs text-stone-500">{call.company} · {call.stage}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section>
          <SectionHead title="Tasks" subtitle="Execution stays connected to the Tasks app" />
          <div className="grid gap-2">
            {TASKS.map((task) => (
              <button type="button" key={task.id} onClick={() => onSelect(taskDetail(task))} className="flex w-full items-center gap-2.5 rounded-lg border border-[var(--panel-border)] bg-white px-3 py-2.5 text-left transition-colors hover:bg-white">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: task.tone === 'danger' ? '#dc2626' : task.tone === 'warn' ? '#d97706' : task.tone === 'ok' ? '#16a34a' : ACCENT }} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-stone-700">{task.title}</span>
                <span className="shrink-0 text-[10px] text-stone-400">{task.when.split(' · ')[0]}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onNavigate('tasks')} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900">View all tasks <TrendingUp className="h-3 w-3" /></button>
        </section>
      </div>
    </div>
  );
}

function PipelinePanel({ cognition, onSelect }: PanelProps) {
  return (
    <div className="space-y-5 p-6">
      <SectionHead title="Pipeline overview" subtitle="Event-backed funnel plus six opportunities that need a next action" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {FUNNEL_STAGES.map((stage) => (
          <StatCard
            key={stage.label}
            label={stage.label}
            value={findEventCount(cognition.eventTypes, stage.aliases)}
            tone={stage.tone === 'neutral' ? 'default' : stage.tone}
            hint="cognition.events"
          />
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
        <span className="text-xs text-stone-600">{cognition.loading ? 'Hydrating event funnel…' : cognition.eventTypes.length + ' event types grouped from cognition.events'}</span>
        <span className="font-mono text-[10px] text-stone-400">{cognition.live ? 'live' : 'offline'}</span>
      </div>
      <section>
        <SectionHead title="Open deals" subtitle="Six clickable deal files · mock sales surface until CRM sync is enabled" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DEALS.map((deal) => (
            <button type="button" key={deal.id} onClick={() => onSelect(dealDetail(deal))} className="group rounded-2xl border border-[var(--panel-border)] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-stone-900">{deal.title}</div>
                  <div className="mt-0.5 text-xs text-stone-500">{deal.company}</div>
                </div>
                <Badge tone={deal.tone}>{deal.stage}</Badge>
              </div>
              <div className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900">{deal.value}</div>
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-400">
                <span>{deal.owner}</span>
                <span className="font-semibold text-stone-600">Next · {deal.nextStep}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}function ContextPanel({ onSelect }: PanelProps) {
  return (
    <div className="space-y-5 p-6">
      <SectionHead title="Sales second brain" subtitle="Canonical context docs ground every call, proposal, and follow-up" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.icon;
          return (
            <button type="button" key={doc.id} onClick={() => onSelect(docDetail(doc))} className="rounded-2xl border border-[var(--panel-border)] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><Icon className="h-4 w-4" /></span>
                <span className="text-sm font-bold text-stone-800">{doc.title}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-stone-500">{doc.description}</p>
              <span className="mt-4 inline-flex text-[10px] font-semibold uppercase tracking-wider text-violet-700">Preview document <BookOpen className="ml-1 h-3 w-3" /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}function CapabilitiesPanel({ cognition, onSelect }: PanelProps) {
  return (
    <div className="space-y-5 p-6">
      <SectionHead title="Sales skills + routines" subtitle="Nine skills canon plus the live cognition.routines execution layer" />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {SKILLS.map(([name, description]) => (
          <div key={name} className="rounded-xl border border-[var(--panel-border)] bg-white p-3">
            <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-orange-600" /><span className="text-sm font-semibold text-stone-800">{name}</span></div>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
          </div>
        ))}
      </div>
      <section className="border-t border-[var(--panel-border)] pt-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionHead title="Live routines" subtitle={(cognition.routines.length || 0) + ' loaded from cognition.routines'} />
          <span className="font-mono text-[10px] text-stone-400">{cognition.live ? 'live' : (supabaseConfigured ? 'unavailable' : 'fallback')}</span>
        </div>
        <div className="grid gap-2">
          {cognition.routines.map((routine) => (
            <button type="button" key={routine.id} onClick={() => onSelect(routineDetail(routine))} className="flex items-center gap-3 rounded-xl border border-[var(--panel-border)] bg-white p-3 text-left transition-colors hover:bg-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                {routine.cadence === 'daily' ? <Sun className="h-4 w-4" /> : routine.cadence === 'weekly' ? <Calendar className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-800">{routine.name}</span>
                <span className="block text-[11px] text-stone-500">{routine.cadence} · {formatRoutineTime(routine.time_of_day)}</span>
              </span>
              <Badge tone={routine.is_active ? 'ok' : 'neutral'}>{routine.is_active ? 'active' : 'paused'}</Badge>
            </button>
          ))}
        </div>
        {cognition.routines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-xs text-stone-400">No live routines available from cognition.routines.</div>
        ) : null}
      </section>
    </div>
  );
}function StackPanel({ onSelect }: PanelProps) {
  return (
    <div className="space-y-5 p-6">
      <SectionHead title="Stack connectors" subtitle="Eight categories with explicit connector status — connected sources are the only live inputs" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {STACK.map((category) => (
          <section key={category.name} className="rounded-2xl border border-[var(--panel-border)] bg-white p-4">
            <div className="mb-3 flex items-center gap-2"><Settings2 className="h-4 w-4 text-stone-500" /><h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">{category.name}</h3></div>
            <div className="space-y-2">
              {category.tools.map((tool) => (
                <button type="button" key={tool.id} onClick={() => onSelect(toolDetail(tool))} className="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-100 bg-white px-3 py-2 text-left transition-colors hover:border-stone-200">
                  <span className="flex min-w-0 items-center gap-2"><Cloud className="h-3.5 w-3.5 shrink-0 text-stone-400" /><span className="truncate text-xs font-medium text-stone-700">{tool.name}</span></span>
                  <Badge tone={tool.status === 'connected' ? 'ok' : 'warn'}>{tool.status}</Badge>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}export function SalesApp() {
  const cognition = useCognitionData();
  const openApp = useShellStore((state) => state.openApp);
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const { setDetail: setWindowDetail } = useWindowPage();

  const navigate = (appId: string): void => {
    if (appId === 'tasks') openApp('tasks', 'Tasks');
    if (appId === 'settings') openApp('settings', 'Settings');
    if (appId === 'sales') openApp('sales', SALES_TITLE);
    setDetail(null);
  };

  // D2/D6 honest: in-place detail page must KEEP the AppFrame (sidebar) visible.
  // Sister pattern (canonical): AppFrame wrapper stable + content slot swap.
  // Old early-return `if (detail) return <DetailPage />` was killing the sidebar.
  // Fix: AppFrame always renders; content is either <ActiveSection> or <DetailPage>.
  // See commit message Phase 48 for the regression.

  // Mirror local detail selection into the canonical window detail state,
  // so the Coach OS topbar shows the in-app page title (sister to PeopleApp Fleet).
  useEffect(() => {
    if (detail) {
      setWindowDetail({ label: detail.title, onBack: () => setDetail(null) });
    } else {
      setWindowDetail(null);
    }
  }, [detail, setWindowDetail]);

  // useMemo MUST be called before any conditional return (Rules of Hooks).
  const sections: AppSection[] = useMemo(() => TAB_DEFS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    render: () => {
      // Cognition overview is rendered as the first sidebar entry — same depth
      // as a sibling app's standalone window, but in-place to preserve Sales
      // shell continuity (sidebar + content + drill pages stay reachable).
      if (tab.id === 'cognition') return <CognitionOverviewContent />;
      const panelProps: PanelProps = { cognition, onSelect: setDetail, onNavigate: navigate };
      if (tab.id === 'today') return <TodayPanel {...panelProps} />;
      if (tab.id === 'pipeline') return <PipelinePanel {...panelProps} />;
      if (tab.id === 'context') return <ContextPanel {...panelProps} />;
      if (tab.id === 'capabilities') return <CapabilitiesPanel {...panelProps} />;
      return <StackPanel {...panelProps} />;
    },
  })), [cognition]);

  // Drawbridge task #7 (a55d436b) — sidebar must NEVER show a "Detail" entry.
  // The detail page overlays ONLY the content area, NOT the sidebar.
  // The sidebar (Cognition/Today/Pipeline/Context/Capabilities/Stack) stays
  // visible at all times. Item count = 6 stable.
  // The detail overlay is positioned via `[margin-left: 240px]` to skip the
  // AppFrame internal sidebar (which is 240px wide when expanded, 68px when
  // collapsed). z-index 50 keeps it above the AppFrame content but below
  // any modal overlays.
  return (
    <div className="relative h-full">
      <AppFrame
        title={SALES_TITLE}
        subtitle="Unified AI Sales OS · cognition-backed"
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