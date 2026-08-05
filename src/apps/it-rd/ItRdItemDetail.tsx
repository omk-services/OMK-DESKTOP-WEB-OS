/** ItRdItemDetail — cyberpunk layout.
 *
 * Canon: spec §4 #4 IT / R&D — "Terminal-style header (mono) + 2-col
 *         (Logs stream / Deploys)".
 *
 * Real data shapes:
 *   services:        name, note, status, detail
 *   it_experiments:  title, meta, stage, notes
 *   deploys:         commit, target, when, status
 *   it_journal:      title, actor, action, entity, ts, outcome, projects, note
 *   it_loops:        name, state, capteur, consigne, controleur, actionneur, target, tolerance, lastAction, lastActionAt, note
 *   it_drift:        name, metric, reference, current, detected, threshold, severity, unit, method, note
 *   it_evals:        name, rate, trials, distribution, evalType, failures, ranAt, note
 *
 * Branching is on def.id so each collection surfaces the right structure
 * with the right labels — services read as a kernel card, experiments as
 * a build log, deploys as a build pipeline timeline, journal as a log
 * entry, loops as a 4-organ card, drift as a reference/current gauge,
 * evals as a pass-rate gauge.
 */
import type { JSX } from 'react';
import { Activity, Cpu, FlaskConical, Hash, Rocket, Terminal, Zap, ScrollText, Repeat, TrendingDown, LineChart, GitBranch, AlertOctagon, CheckCircle2, CircleDashed } from 'lucide-react';
import type { ItemDetailProps } from '../../components/cms/itemDetailRegistry';
import { BackAffordance, PrevNextFooter, PillBadge } from '../../components/cms/itemDetailShared';

function readString(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

const STAGE_LABEL: Record<string, string> = {
  idea: 'IDEA',
  building: 'BUILDING',
  shipped: 'SHIPPED',
  ok: 'OK',
  warn: 'WARN',
  ready: 'READY',
  rolling: 'ROLLING',
  stable: 'STABLE',
  drift: 'DRIFT',
  alert: 'ALERT',
  watch: 'WATCH',
  stopped: 'STOPPED',
  auto: 'AUTO',
  review: 'REVIEW',
};

function toneFor(status: string | undefined): { fg: string; bg: string; border: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'warn' || s === 'rolling' || s === 'drift' || s === 'watch') return { fg: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: '#eab30855' };
  if (s === 'ok' || s === 'ready' || s === 'shipped' || s === 'stable' || s === 'auto') return { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: '#22c55e55' };
  if (s === 'danger' || s === 'alert' || s === 'stopped') return { fg: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: '#dc262655' };
  return { fg: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: '#a78bfa55' };
}

export function ItRdItemDetail(props: ItemDetailProps): JSX.Element {
  const { def, item, accent, onBack, prev, next, onNavigate, index, total } = props;
  const title = String(item[def.titleField] ?? '');
  const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? '') : '';
  const collection = def.id;
  const status = readString(item, 'status', 'stage');
  const tone = toneFor(status);

  // Collection-specific 2-col content.
  // Services: left = meta+detail, right = synthetic 6-line heartbeat.
  // Experiments: left = notes, right = stage ladder + random lag chart.
  // Deploys: left = meta+when, right = synthetic deploy log.
  const detail = readString(item, 'detail', 'notes');
  const note = readString(item, 'note', 'meta');
  const when = readString(item, 'when');
  const target = readString(item, 'target');

  // 6 synthetic log lines per item — seeded from title + collection.
  const seedLog = (() => {
    const t = (Date.now() / 1000) | 0;
    return Array.from({ length: 6 }).map((_, i) => ({
      ts: new Date(t - (5 - i) * 91_000).toISOString().slice(11, 19),
      level: i % 3 === 0 ? 'INFO' : i % 3 === 1 ? 'OK' : 'DBG',
      msg: `${title.toLowerCase().slice(0, 32).replace(/\s+/g, '_')} :: ${collection}.${i + 1} :: heartbeat=${1000 - i * 12}ms`,
    }));
  })();

  return (
    <div
      className="min-h-full p-7"
      style={{
        color: 'var(--theme-text)',
        background: 'var(--theme-bg)',
        backgroundImage:
          'linear-gradient(var(--panel-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--panel-border-subtle) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <BackAffordance label={`back // ${collection}`} onBack={onBack} accent={accent} />

      {/* Terminal-style header */}
      <div
        className="mt-4 rounded-md overflow-hidden"
        style={{
          background: 'var(--panel-solid)',
          border: `1px solid ${tone.border}`,
          boxShadow: `0 0 0 1px ${tone.bg}, 0 16px 40px -24px ${tone.border}`,
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-1.5 text-[10.5px] font-mono"
          style={{ background: tone.bg, color: tone.fg }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            <span>~$ coach-os / {collection} / inspect --id={item.id}</span>
          </div>
          <span className="opacity-70">{STAGE_LABEL[status ?? ''] ?? (status ?? 'OK').toUpperCase()}</span>
        </div>

        <div className="p-5 font-mono">
          <div className="text-[11px]" style={{ color: 'var(--theme-muted)' }}>
            {`> ${collection}.locate(${def.singular.toLowerCase()})`}
          </div>
          <h1
            className="mt-1 text-3xl font-bold tracking-tight"
            style={{ color: accent, fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }}
          >
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1 text-sm" style={{ color: 'var(--theme-muted)', fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }}>
              {`# ${subtitle}`}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {status && <PillBadge accent={accent}>{status}</PillBadge>}
            {note && <PillBadge accent={accent}>{note}</PillBadge>}
            {when && <PillBadge accent={accent}>{when}</PillBadge>}
            {target && <PillBadge accent={accent}>{target}</PillBadge>}
            <PillBadge accent={accent}>{collection}</PillBadge>
          </div>
        </div>
      </div>

      {/* 2-col body */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left — Logs stream */}
        <div
          className="rounded-md"
          style={{
            background: 'var(--panel-solid)',
            border: '1px solid var(--panel-border)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
            style={{
              background: 'var(--canvas)',
              color: 'var(--theme-muted)',
              borderBottom: '1px solid var(--panel-border)',
            }}
          >
            <Activity className="w-3 h-3" />
            <span>tail -f /var/log/{collection}/{item.id ?? 'node'}.log</span>
          </div>
          <ul className="font-mono text-[12px] p-3 space-y-1">
            {seedLog.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: 'var(--theme-muted)' }}>{l.ts}</span>
                <span
                  className="font-extrabold"
                  style={{ color: l.level === 'INFO' ? tone.fg : accent }}
                >
                  {l.level}
                </span>
                <span style={{ color: 'var(--theme-text)' }}>{l.msg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — context, depends on collection */}
        {collection === 'deploys' ? (
          <DeploysCard commit={title} target={target} status={status} tone={tone} />
        ) : collection === 'it_experiments' ? (
          <ExperimentCard stage={status} notes={detail} tone={tone} />
        ) : collection === 'it_journal' ? (
          <JournalCard actor={readString(item, 'actor')} action={readString(item, 'action')} entity={readString(item, 'entity')} ts={readString(item, 'ts')} outcome={readString(item, 'outcome')} projects={readString(item, 'projects')} note={readString(item, 'note')} tone={tone} />
        ) : collection === 'it_loops' ? (
          <LoopsCard state={status} capteur={readString(item, 'capteur')} consigne={readString(item, 'consigne')} controleur={readString(item, 'controleur')} actionneur={readString(item, 'actionneur')} target={readString(item, 'target')} tolerance={readString(item, 'tolerance')} lastAction={readString(item, 'lastAction')} lastActionAt={readString(item, 'lastActionAt')} note={readString(item, 'note')} tone={tone} />
        ) : collection === 'it_drift' ? (
          <DriftCard metric={readString(item, 'metric')} reference={readString(item, 'reference')} current={readString(item, 'current')} threshold={readString(item, 'threshold')} unit={readString(item, 'unit')} method={readString(item, 'method')} note={readString(item, 'note')} tone={tone} />
        ) : collection === 'it_evals' ? (
          <EvalsCard rate={readString(item, 'rate')} trials={readString(item, 'trials')} distribution={readString(item, 'distribution')} failures={readString(item, 'failures')} evalType={readString(item, 'evalType')} ranAt={readString(item, 'ranAt')} note={readString(item, 'note')} tone={tone} />
        ) : (
          <ServicesCard note={note} detail={detail} tone={tone} />
        )}
      </div>

      <PrevNextFooter def={def} index={index} total={total} prev={prev} next={next} onNavigate={onNavigate} />
    </div>
  );
}

function ServicesCard({
  note,
  detail,
  tone,
}: {
  note: string | undefined;
  detail: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <Cpu className="w-3 h-3" />
        <span>cat /etc/services/{`{svc}`}.json</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Note</div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--theme-text)' }}>{note ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Detail</div>
          <div className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {detail ?? 'No detail recorded.'}
          </div>
        </div>
        <div className="pt-3" style={{ borderTop: '1px solid var(--panel-border-subtle)' }}>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: tone.fg }}>Health</div>
          <div className="text-[12px] mt-0.5" style={{ color: tone.fg }}>
            {tone.fg === '#eab308' ? 'Watch — at least one health signal degraded.'
              : tone.fg === '#22c55e' ? 'All health signals green.'
              : 'Service reachable, no signal evaluated yet.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperimentCard({
  stage,
  notes,
  tone,
}: {
  stage: string | undefined;
  notes: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  const stages = ['idea', 'building', 'shipped'];
  const stageIdx = Math.max(0, stages.indexOf((stage ?? '').toLowerCase()));
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <FlaskConical className="w-3 h-3" />
        <span>experiments.run({`{id}`})</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider" style={{ color: tone.fg }}>
          <Rocket className="w-3 h-3" />
          <span>Stage ladder</span>
        </div>
        <ol className="flex gap-1">
          {stages.map((s, i) => (
            <li
              key={s}
              className="flex-1 px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-center"
              style={{
                background: i <= stageIdx ? tone.bg : 'var(--canvas)',
                color: i <= stageIdx ? tone.fg : 'var(--theme-muted)',
                border: `1px solid ${i <= stageIdx ? tone.border : 'var(--panel-border-subtle)'}`,
                borderRadius: 0,
              }}
            >
              {s}
            </li>
          ))}
        </ol>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Notes</div>
          <div className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {notes ?? 'No notes recorded.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploysCard({
  commit,
  target,
  status,
  tone,
}: {
  commit: string;
  target: string | undefined;
  status: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  const checkpoints = ['build', 'test', 'deploy', 'verify'];
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <Hash className="w-3 h-3" />
        <span>deploy.trace {commit}</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Target</div>
          <div className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--theme-text)' }}>
            <Zap className="w-3 h-3" style={{ color: tone.fg }} /> {target ?? '—'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider" style={{ color: tone.fg }}>
          <Rocket className="w-3 h-3" />
          <span>Pipeline</span>
        </div>
        <ol className="flex gap-1">
          {checkpoints.map((s, i) => {
            const isFinal = (status ?? '').toLowerCase() === 'ready' && i === 3;
            const done = isFinal || i < 2;
            return (
              <li
                key={s}
                className="flex-1 px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-center"
                style={{
                  background: done ? tone.bg : 'var(--canvas)',
                  color: done ? tone.fg : 'var(--theme-muted)',
                  border: `1px solid ${done ? tone.border : 'var(--panel-border-subtle)'}`,
                  borderRadius: 0,
                }}
              >
                {s}
              </li>
            );
          })}
        </ol>
        <div className="text-[12px]" style={{ color: tone.fg }}>{status ?? '—'}</div>
      </div>
    </div>
  );
}

function JournalCard({
  actor,
  action,
  entity,
  ts,
  outcome,
  projects,
  note,
  tone,
}: {
  actor: string | undefined;
  action: string | undefined;
  entity: string | undefined;
  ts: string | undefined;
  outcome: string | undefined;
  projects: string | undefined;
  note: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <ScrollText className="w-3 h-3" />
        <span>journal.replay --event={ts ?? '?'}</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Actor</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>{actor ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Action</div>
            <div className="text-[12px] mt-0.5" style={{ color: tone.fg }}>{action ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Entity</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>{entity ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Outcome</div>
            <div className="text-[12px] mt-0.5" style={{ color: tone.fg }}>{outcome ?? '—'}</div>
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: tone.fg }}>
            <GitBranch className="w-3 h-3" /> Projected state after this event
          </div>
          <pre
            className="mt-1 rounded-lg px-3 py-2.5 text-[12px] leading-relaxed whitespace-pre-line"
            style={{ background: 'var(--canvas)', color: 'var(--theme-text)' }}
          >
            {projects ?? '—'}
          </pre>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Note</div>
          <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {note ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoopsCard({
  state,
  capteur,
  consigne,
  controleur,
  actionneur,
  target,
  tolerance,
  lastAction,
  lastActionAt,
  note,
  tone,
}: {
  state: string | undefined;
  capteur: string | undefined;
  consigne: string | undefined;
  controleur: string | undefined;
  actionneur: string | undefined;
  target: string | undefined;
  tolerance: string | undefined;
  lastAction: string | undefined;
  lastActionAt: string | undefined;
  note: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  const organs = [
    { label: 'Capteur', value: capteur, hint: 'measures' },
    { label: 'Consigne', value: consigne, hint: 'setpoint' },
    { label: 'Contrôleur', value: controleur, hint: 'decides' },
    { label: 'Actionneur', value: actionneur, hint: 'acts' },
  ];
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <Repeat className="w-3 h-3" />
        <span>loop.inspect --state={state ?? '?'}</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Setpoint</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>{target ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Tolerance</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>{tolerance ?? '—'}</div>
          </div>
        </div>
        {organs.map((organ) => (
          <div key={organ.label}>
            <div className="text-[10.5px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: tone.fg }}>
              <span>{organ.label}</span>
              <span style={{ color: 'var(--theme-muted)' }}>· {organ.hint}</span>
            </div>
            <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
              {organ.value ?? '—'}
            </div>
          </div>
        ))}
        <div
          className="pt-3"
          style={{ borderTop: '1px solid var(--panel-border-subtle)' }}
        >
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Last action</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>
            {lastAction ?? '—'} <span style={{ color: 'var(--theme-muted)' }}>· {lastActionAt ?? '—'}</span>
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Note</div>
          <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {note ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function DriftCard({
  metric,
  reference,
  current,
  threshold,
  unit,
  method,
  note,
  tone,
}: {
  metric: string | undefined;
  reference: string | undefined;
  current: string | undefined;
  threshold: string | undefined;
  unit: string | undefined;
  method: string | undefined;
  note: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  const refNum = Number(reference);
  const curNum = Number(current);
  const thresholdNum = Number(threshold);
  const hasNumbers = !Number.isNaN(refNum) && !Number.isNaN(curNum) && refNum !== 0;
  const deviationPct = hasNumbers ? Math.abs(((curNum - refNum) / Math.abs(refNum)) * 100) : null;
  const exceedThreshold = !Number.isNaN(thresholdNum) && !Number.isNaN(curNum) && Math.abs(curNum) >= Math.abs(thresholdNum);
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        <TrendingDown className="w-3 h-3" />
        <span>drift.measure --ref={reference ?? '?'} --now={current ?? '?'}</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Reference</div>
            <div className="text-[14px] mt-0.5 font-bold tabular-nums" style={{ color: 'var(--theme-text)' }}>
              {reference ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Current</div>
            <div className="text-[14px] mt-0.5 font-bold tabular-nums" style={{ color: tone.fg }}>
              {current ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Threshold</div>
            <div className="text-[14px] mt-0.5 font-bold tabular-nums" style={{ color: exceedThreshold ? tone.fg : 'var(--theme-text)' }}>
              {threshold ?? '—'}
            </div>
          </div>
        </div>
        {deviationPct !== null && (
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Deviation</div>
            <div className="text-[13px] mt-0.5" style={{ color: tone.fg }}>
              {deviationPct.toFixed(1)}% {unit ? `(${unit})` : ''}
              {exceedThreshold && <span className="ml-1.5">· alert threshold exceeded</span>}
            </div>
          </div>
        )}
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Detection method</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>
            {method ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Summary</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>
            {metric ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Note</div>
          <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {note ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvalsCard({
  rate,
  trials,
  distribution,
  failures,
  evalType,
  ranAt,
  note,
  tone,
}: {
  rate: string | undefined;
  trials: string | undefined;
  distribution: string | undefined;
  failures: string | undefined;
  evalType: string | undefined;
  note: string | undefined;
  ranAt: string | undefined;
  tone: { fg: string; bg: string; border: string };
}): JSX.Element {
  const trialsNum = Number(trials);
  const distParts = distribution?.split('/').map(p => Number(p.trim())) ?? [];
  const pass = distParts[0] ?? 0;
  const borderline = distParts[1] ?? 0;
  const fail = distParts[2] ?? 0;
  const isReview = (evalType ?? '').toLowerCase() === 'review';
  return (
    <div
      className="rounded-md"
      style={{
        background: 'var(--panel-solid)',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono"
        style={{
          background: 'var(--canvas)',
          color: 'var(--theme-muted)',
          borderBottom: '1px solid var(--panel-border)',
        }}
      >
        {isReview ? <CircleDashed className="w-3 h-3" /> : <LineChart className="w-3 h-3" />}
        <span>eval.run --type={evalType ?? '?'} --trials={trials ?? '?'}</span>
      </div>
      <div className="p-4 font-mono space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] font-extrabold tabular-nums leading-none" style={{ color: tone.fg }}>
            {rate ?? '—'}
          </span>
          <span className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>
            pass rate
          </span>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider flex items-center justify-between" style={{ color: 'var(--theme-muted)' }}>
            <span>Distribution</span>
            <span>{distribution ?? '— / — / —'}</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--canvas)' }}>
            <div style={{ width: `${trialsNum > 0 ? (pass / trialsNum) * 100 : 0}%`, background: '#22c55e' }} />
            <div style={{ width: `${trialsNum > 0 ? (borderline / trialsNum) * 100 : 0}%`, background: '#eab308' }} />
            <div style={{ width: `${trialsNum > 0 ? (fail / trialsNum) * 100 : 0}%`, background: '#dc2626' }} />
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[10.5px] font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} /> pass {pass}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#eab308' }} /> borderline {borderline}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} /> fail {fail}</span>
          </div>
        </div>
        <div className="pt-2" style={{ borderTop: '1px solid var(--panel-border-subtle)' }}>
          <div className="text-[10.5px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: tone.fg }}>
            {isReview ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            Explicable failures
          </div>
          <div className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {failures ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Ran at</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--theme-text)' }}>
            {ranAt ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--theme-muted)' }}>Note</div>
          <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--theme-text)' }}>
            {note ?? '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
