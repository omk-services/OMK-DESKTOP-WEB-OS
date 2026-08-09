/**
 * Chat — conversation with one agent at a time. Pick from the left rail,
 * the thread fills the right pane. Empty state is intentional, not a fallback.
 */
import { useState } from 'react';
import { ArrowRight, Bot, MessageSquare, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { AGENTS, CHAT_BY_AGENT } from '../seed';
import { ACCENT, GhostButton, IconChip, Panel, Pill, PrimaryButton, SectionTitle } from '../Primitives';

export function Chat() {
  const [activeId, setActiveId] = useState<string>(AGENTS[0]?.id ?? '');
  const active = AGENTS.find((a) => a.id === activeId);
  const messages = CHAT_BY_AGENT[activeId] ?? [];

  return (
    <div className="grid h-full min-h-[520px] grid-cols-1 gap-4 p-7 lg:grid-cols-[260px_1fr]">
      {/* Left rail — agents */}
      <Panel pad="p-4" className="flex flex-col gap-3">
        <SectionTitle eyebrow="Choisis" title="Un agent" />
        <ul className="flex flex-col gap-1.5">
          {AGENTS.map((a) => {
            const on = a.id === activeId;
            const tone = a.state === 'healthy' ? 'ok' : a.state === 'degraded' ? 'warn' : 'danger';
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(a.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all"
                  style={{
                    background: on ? 'var(--theme-surface-hover)' : 'transparent',
                    border: on ? `1px solid ${ACCENT}55` : '1px solid transparent',
                  }}
                >
                  <IconChip tone={tone} size={28}>
                    <Bot className="h-3.5 w-3.5" />
                  </IconChip>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--theme-text)' }}>
                      {a.name}
                    </div>
                    <div className="truncate text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                      {a.model}
                    </div>
                  </div>
                  {on ? <ArrowRight className="h-3.5 w-3.5" style={{ color: ACCENT }} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div
          className="mt-auto flex items-start gap-2 rounded-xl p-3 text-[10.5px] leading-relaxed"
          style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}
        >
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
          <span>Aucune mutation n'est faite depuis cette vue. Les réponses sont des brouillons ; tu valides avant chaque envoi.</span>
        </div>
      </Panel>

      {/* Right pane — thread */}
      <Panel pad="p-0" className="flex flex-col overflow-hidden">
        {active ? (
          <>
            <div
              className="flex flex-wrap items-center gap-3 border-b px-5 py-4"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              <IconChip tone={active.state === 'healthy' ? 'ok' : active.state === 'degraded' ? 'warn' : 'danger'}>
                <Bot className="h-4 w-4" />
              </IconChip>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
                    {active.name}
                  </span>
                  <Pill tone={active.state === 'healthy' ? 'ok' : active.state === 'degraded' ? 'warn' : 'danger'}>
                    {active.state}
                  </Pill>
                </div>
                <div className="text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
                  {active.role} · {active.model}
                </div>
              </div>
              <Pill tone="info">session live</Pill>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar" style={{ minHeight: 280 }}>
              {messages.length === 0 ? (
                <EmptyThread agent={active.name} />
              ) : (
                <ol className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className="flex gap-3"
                      style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      {m.role !== 'user' ? (
                        <IconChip tone="accent" size={28}>
                          <Bot className="h-3.5 w-3.5" />
                        </IconChip>
                      ) : null}
                      <div
                        className="max-w-[78%] rounded-2xl px-4 py-2.5"
                        style={{
                          background: m.role === 'user' ? ACCENT : 'var(--theme-surface-hover)',
                          color: m.role === 'user' ? '#ffffff' : 'var(--theme-text)',
                          border: m.role === 'user' ? 'none' : '1px solid var(--panel-border-subtle)',
                        }}
                      >
                        <div className="text-[10px] font-mono" style={{ opacity: 0.7 }}>
                          {m.role} · {m.at}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed">{m.content}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div
              className="flex flex-wrap items-center gap-2 border-t px-5 py-3"
              style={{ borderColor: 'var(--panel-border)' }}
            >
              <div
                className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--theme-text-dim)' }} />
                <span className="truncate text-[12px]" style={{ color: 'var(--theme-text-dim)' }}>
                  Écris ton message — brouillon envoyé à l'agent pour validation…
                </span>
              </div>
              <PrimaryButton size="sm">
                <Send className="h-3.5 w-3.5" /> Brouillonner
              </PrimaryButton>
              <GhostButton size="sm">Effacer</GhostButton>
            </div>
          </>
        ) : null}
      </Panel>
    </div>
  );
}

function EmptyThread({ agent }: { agent: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
      <IconChip tone="neutral" size={56}>
        <MessageSquare className="h-5 w-5" />
      </IconChip>
      <div className="text-[14px] font-semibold" style={{ color: 'var(--theme-text)' }}>
        Pas encore de conversation avec {agent}
      </div>
      <div className="max-w-sm text-[12px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
        Démarre une session en écrivant ton premier message. La réponse est un brouillon — elle n'est
        envoyée nulle part sans ta validation.
      </div>
    </div>
  );
}
