/**
 * SalesApp — section Today : la carte 'the one thing to act on today',
 * les calls du jour, les top tasks, et le journal 'what changed today'.
 * Extrait de SalesApp.tsx.
 */
import { CheckCheck, CircleDashed, Cloud, FileText, Mail, Phone, PhoneCall, Users } from 'lucide-react';
import { useShellStore } from '../../../stores/shell.store';
import type { DetailItem } from '../SalesDetailPage';
import {
  ACCENT, Eyebrow, FONT_BODY, FONT_DISPLAY, FONT_MONO, ICP_EDGE, ICP_FIT, ICP_OFF, LOSE,
  PageHeader, RELANCE, WIN,
  type CallRecord, type CalendarRecord, type ChangeRecord, type TaskRecord,
} from './Primitives';

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

// ─── Section: Today ───

export function TodayPanel({ onSelect }: { onSelect: (item: DetailItem) => void }) {
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
