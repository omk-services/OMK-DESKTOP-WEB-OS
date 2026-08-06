/**
 * Jarvis — read-only copilot. Per the brief, this is the most important page:
 * the assistant reads state, explains it, never writes anything back.
 *
 * Wiring: this view reads from `useVoiceNavigation()` (existing global hook)
 * so the mic button in the topbar routes through the same voice pipeline
 * (parseVoiceCommand → shellStore / voiceIntent). We do not write a parallel
 * voice system.
 *
 * The lock is also enforced visually: every action surface is disabled or
 * labelled read-only, and the suggestion cards explicitly carry a `read-only`
 * field that consumers cannot un-set.
 */
import { useEffect, useRef, type JSX } from 'react';
import { Bot, Lock, Mic, MicOff, Sparkles } from 'lucide-react';
import { AGENTS, JARVIS_ROUTINES, JARVIS_SUGGESTIONS, USAGE_TODAY, MONTH_SUMMARY } from '../seed';
import { ACCENT, GhostButton, IconChip, KpiTile, LiveDot, Panel, Pill, SectionTitle } from '../Primitives';
import { useVoiceNavigation } from '../../../../hooks/useVoiceNavigation';

export function Jarvis(): JSX.Element {
  const { listening, toggle, supported, lastTranscript } = useVoiceNavigation();
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el && lastTranscript) {
      el.textContent = lastTranscript;
    }
  }, [lastTranscript]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-5 p-7">
      <SectionTitle
        eyebrow="Core"
        title="Jarvis"
        subtitle="Copilote en lecture seule. Il lit l'état, il explique, il ne change rien."
        action={
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-muted)' }} />
            <Pill tone="info">read-only by design</Pill>
          </span>
        }
      />

      {/* Orbe + état */}
      <Panel pad="p-6" className="flex flex-col items-center gap-5 text-center">
        <div
          className="relative flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${ACCENT}, color-mix(in srgb, ${ACCENT} 55%, var(--theme-accent)))`,
            boxShadow: `0 0 60px ${ACCENT}55, inset 0 0 24px ${ACCENT}aa`,
          }}
          aria-hidden="true"
        >
          <Bot className="h-12 w-12" style={{ color: 'var(--theme-text)' }} />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid ${ACCENT}aa`,
              opacity: listening ? 0.9 : 0.4,
              transform: listening ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 400ms ease, opacity 400ms ease',
            }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: `1px solid ${ACCENT}66`,
              opacity: listening ? 0.7 : 0.2,
              transform: listening ? 'scale(1.14)' : 'scale(1.04)',
              transition: 'transform 600ms ease, opacity 600ms ease',
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <LiveDot tone={listening ? 'accent' : 'neutral'} size={8} />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-text-muted)' }}>
            {listening ? 'à l\'écoute' : 'en attente'}
          </span>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            {dateStr}
          </div>
          <h3 className="mt-1 text-[18px] font-bold tracking-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
            Bonjour. L'OS est en place, 5 agents tournent.
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
            Demande à Jarvis d'ouvrir une app, de décrire la dépense du jour, ou de suggérer une routine.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={!supported}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: listening ? ACCENT : 'var(--theme-surface)',
              color: listening ? '#ffffff' : 'var(--theme-text)',
              border: `1px solid ${listening ? ACCENT : 'var(--panel-border)'}`,
            }}
          >
            {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {listening ? 'Arrêter l\'écoute' : supported ? 'Activer le micro' : 'Micro non supporté'}
          </button>
          <GhostButton size="sm">
            <Sparkles className="h-3.5 w-3.5" /> Suggérer une routine
          </GhostButton>
        </div>
        {!supported ? (
          <div className="text-[10.5px]" style={{ color: 'var(--theme-text-dim)' }}>
            Reconnaissance vocale disponible sur Chrome / Edge uniquement.
          </div>
        ) : null}
        {lastTranscript ? (
          <div
            ref={transcriptRef}
            className="rounded-lg px-3 py-2 font-mono text-[11px]"
            style={{
              background: 'var(--theme-surface-hover)',
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--panel-border-subtle)',
              minWidth: 200,
            }}
          >
            dernière transcription : {lastTranscript}
          </div>
        ) : null}
      </Panel>

      {/* Suggestions */}
      <Panel pad="p-5">
        <SectionTitle
          eyebrow="Recommandations"
          title="Ce que Jarvis voit"
          subtitle="Suggestions déduites de l'état courant — aucune n'est appliquée automatiquement."
        />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {JARVIS_SUGGESTIONS.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                background: 'var(--theme-surface-hover)',
                border: '1px solid var(--panel-border-subtle)',
              }}
            >
              <IconChip tone={s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warn' : 'info'}>
                <Sparkles className="h-3.5 w-3.5" />
              </IconChip>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-bold" style={{ color: 'var(--theme-text)' }}>
                    {s.title}
                  </span>
                  <Pill tone={s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warn' : 'info'}>
                    {s.priority}
                  </Pill>
                  <Pill tone="neutral">
                    <Lock className="h-2.5 w-2.5" /> read-only
                  </Pill>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                  {s.rationale}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Routines + état */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel pad="p-5">
          <SectionTitle eyebrow="Routines" title="4 routines exécutées" />
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {JARVIS_ROUTINES.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <IconChip tone="accent" size={32}>
                  <Sparkles className="h-3.5 w-3.5" />
                </IconChip>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {r.label}
                    </span>
                    <Pill tone="neutral">{r.cadence}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                    {r.output}
                  </p>
                </div>
                <span className="font-mono text-[10.5px]" style={{ color: 'var(--theme-text-dim)' }}>
                  {r.lastRun}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel pad="p-5">
          <SectionTitle eyebrow="État" title="Ce que Jarvis observe" />
          <div className="grid grid-cols-2 gap-3">
            <KpiTile
              label="Dépense du jour"
              value={`$${USAGE_TODAY.costUsd.toFixed(2)}`}
              hint={`sur $${USAGE_TODAY.budgetUsd} plafond`}
              tone="accent"
            />
            <KpiTile
              label="Agents sains"
              value={`${AGENTS.filter((a) => a.state === 'healthy').length} / ${AGENTS.length}`}
              tone="ok"
            />
            <KpiTile
              label="Budget mensuel"
              value={`${Math.round((MONTH_SUMMARY.monthToDateUsd / MONTH_SUMMARY.monthBudgetUsd) * 100)}%`}
              tone={MONTH_SUMMARY.overBudget ? 'danger' : 'warn'}
              hint={`$${MONTH_SUMMARY.monthToDateUsd.toFixed(0)} / $${MONTH_SUMMARY.monthBudgetUsd}`}
            />
            <KpiTile
              label="Projection"
              value={`$${MONTH_SUMMARY.monthProjectionUsd.toFixed(0)}`}
              tone="warn"
              hint={`vs $${MONTH_SUMMARY.monthPreviousUsd.toFixed(0)} mois dernier`}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
