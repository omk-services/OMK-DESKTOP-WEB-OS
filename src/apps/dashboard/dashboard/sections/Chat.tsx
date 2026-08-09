/**
 * Chat — conversation with one agent at a time. Pick from the left rail,
 * the thread fills the right pane. Empty state is intentional, not a fallback.
 *
 * Draft persistence: `Brouillonner` pushes the current textarea content
 * into a local `extrasByAgent` map keyed by agent id, so the user's own
 * messages stay visible in the thread even when switching agents. The
 * map is mirrored to localStorage (key `coach-os:chat-drafts:v1`) so the
 * thread survives a page reload. A real LLM call would replace the
 * seeded assistant replies; for now we keep the seed and append user
 * drafts on top.
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, MessageSquare, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { AGENTS, CHAT_BY_AGENT, type ChatMessage } from '../seed';
import { useShellStore } from '../../../../stores/shell.store';
import { ACCENT, GhostButton, IconChip, Panel, Pill, PrimaryButton, SectionTitle } from '../Primitives';

function nowStamp(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function makeId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const STORAGE_KEY = 'coach-os:chat-drafts:v1';

function loadExtras(): Record<string, ChatMessage[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, ChatMessage[]>;
  } catch {
    return {};
  }
}

function saveExtras(map: Record<string, ChatMessage[]>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage quota or private mode — silently degrade to in-memory only.
  }
}

export function Chat() {
  const [activeId, setActiveId] = useState<string>(AGENTS[0]?.id ?? '');
  const [draft, setDraft] = useState<string>('');
  // User-submitted drafts, per agent. Seed messages stay below; user
  // drafts are appended in the order they were submitted so the thread
  // reads chronologically. Switching agents preserves each agent's draft
  // thread independently. Mirrored to localStorage so a page reload
  // doesn't wipe what the user typed.
  const [extrasByAgent, setExtrasByAgent] = useState<Record<string, ChatMessage[]>>(() => loadExtras());
  const addToast = useShellStore((s) => s.addToast);
  const active = AGENTS.find((a) => a.id === activeId);
  const seedMessages = CHAT_BY_AGENT[activeId] ?? [];
  const extraMessages = extrasByAgent[activeId] ?? [];
  // Render the merged thread: seed first (system/assistant context), then
  // user drafts in submission order.
  const messages = useMemo(() => [...seedMessages, ...extraMessages], [seedMessages, extraMessages]);

  // Persist drafts on every change. The hook runs after the state update
  // is committed, so the value reflects the latest map.
  useEffect(() => {
    saveExtras(extrasByAgent);
  }, [extrasByAgent]);

  const submitDraft = (): void => {
    const trimmed = draft.trim();
    if (!trimmed || !activeId) return;
    const next: ChatMessage = { id: makeId(), role: 'user', at: nowStamp(), content: trimmed };
    setExtrasByAgent((prev) => {
      const existing = prev[activeId] ?? [];
      return { ...prev, [activeId]: [...existing, next] };
    });
    setDraft('');
    addToast({
      source: 'Chat',
      type: 'success',
      message: `Brouillon ajouté au fil · ${trimmed.length} caractère${trimmed.length > 1 ? 's' : ''}`,
    });
  };
  const clearDraft = (): void => setDraft('');
  /** Wipe every draft message for the active agent. Confirms via toast —
   *  the user can refresh to undo, since the persistence layer is local
   *  storage and we snapshot on every change. The seed thread stays. */
  const clearAllDrafts = (): void => {
    setExtrasByAgent((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    addToast({
      source: 'Chat',
      type: 'info',
      message: `Brouillons effacés pour ${active?.name ?? 'cet agent'}`,
    });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 p-7 lg:grid-cols-[260px_1fr]">
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
          <span>Brouillons locaux. Touche <kbd className="rounded border px-1 py-0.5 text-[9.5px]" style={{ borderColor: 'var(--panel-border)' }}>Brouillonner</kbd> ou <kbd className="rounded border px-1 py-0.5 text-[9.5px]" style={{ borderColor: 'var(--panel-border)' }}>Entrée</kbd> pour ajouter au fil.</span>
        </div>
      </Panel>

      {/* Right pane — thread */}
      <Panel pad="p-0" className="flex h-full min-h-0 flex-col overflow-hidden">
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
              {extraMessages.length > 0 ? (
                <button
                  type="button"
                  onClick={clearAllDrafts}
                  data-clear-drafts
                  className="rounded-lg px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider transition-colors hover:bg-[var(--theme-surface-hover)]"
                  style={{ color: 'var(--theme-text-muted)' }}
                  title={`Effacer les ${extraMessages.length} brouillon${extraMessages.length > 1 ? 's' : ''} pour ${active.name}`}
                >
                  Vider ({extraMessages.length})
                </button>
              ) : null}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 custom-scrollbar">
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

            <form
              className="flex flex-wrap items-center gap-2 border-t px-5 py-3"
              style={{ borderColor: 'var(--panel-border)' }}
              onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
            >
              <div
                className="flex flex-1 items-center gap-2 rounded-xl px-3 py-1.5"
                style={{ background: 'var(--theme-surface-hover)', border: '1px solid var(--panel-border-subtle)' }}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--theme-text-dim)' }} />
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDraft(); } }}
                  placeholder="Écris ton message — brouillon envoyé à l'agent pour validation…"
                  rows={1}
                  aria-label="Message brouillon"
                  className="flex-1 resize-none bg-transparent text-[12px] outline-none placeholder:text-[var(--theme-text-dim)]"
                  style={{ color: 'var(--theme-text)', minHeight: 20, maxHeight: 120 }}
                />
              </div>
              <PrimaryButton size="sm" type="submit" disabled={!draft.trim()}>
                <Send className="h-3.5 w-3.5" /> Brouillonner
              </PrimaryButton>
              <GhostButton size="sm" type="button" onClick={clearDraft}>
                Effacer
              </GhostButton>
            </form>
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
