/**
 * AssistantOverlay.tsx — the desktop assistant.
 *
 * One floating, draggable sprite + a speech bubble that contains the
 * conversation. The bubble is hidden by default and opens on click. The
 * assistant stays on screen even when the bubble is closed — clicking the
 * sprite toggles the bubble.
 *
 * Wiring: useChat is pointed at `/api/chat`. The server-side AGENT-A process
 * declared the 5 tools; the client (this file) registers `onToolCall` to
 * execute them. When the server emits a tool call, the match runs here,
 * writes its result via `addToolOutput`, and the model continues.
 *
 * Status mapping (chat status → character intent):
 *   'submitted'  → thinking (we just sent the request)
 *   'streaming'  → speaking
 *   'ready'      → idle
 *   'error'      → error
 *
 * Errors that bubble up from useChat land in `error`. We also intercept the
 * fetch response so we can show a friendly message when `/api/chat` is
 * unreachable (Vite dev server off, missing API key, etc.) — the absence of
 * a reachable service must be visible IN the bubble, not just in the console.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls, type ChatStatus } from 'ai';
import { Send, X, MessageSquare, Sparkles } from 'lucide-react';
import { SpriteAgent } from './SpriteAgent';
import { getCharacter, type Intent } from './characters';
import { useAssistantStore } from '../stores/assistant.store';
import {
  listerApps,
  ouvrirApp,
  allerASection,
  lireCollection,
  changerTheme,
} from './tools';

// ────────────────────────────────────────────────────────────────────────────
// Status → intent resolver. Stable reference so the SpriteAgent doesn't
// re-resolve its animation on every parent render.
// ────────────────────────────────────────────────────────────────────────────
function intentForStatus(status: ChatStatus, hasError: boolean, isStreaming: boolean): Intent {
  if (hasError) return 'error';
  if (status === 'submitted') return 'thinking';
  if (status === 'streaming' || isStreaming) return 'speaking';
  return 'idle';
}

/**
 * Translate raw tool name + input into the local implementation. Inputs are
 * validated shape-wise (the server already validates but a malformed wire
 * would silently no-op today; we surface that as a readable error).
 */
/** Asynchrone parce qu'`allerASection` doit attendre que l'app se monte avant de
 *  trouver ses boutons de section. Sans `await` ici, le modele recevrait l'objet
 *  promesse au lieu du resultat — un « succes » vide sur lequel il batirait sa
 *  reponse. */
async function executeLocalTool(name: string, input: unknown): Promise<unknown> {
  const args = (input ?? {}) as Record<string, unknown>;
  switch (name) {
    case 'listerApps':
      return listerApps();
    case 'ouvrirApp':
      if (typeof args.appId !== 'string') return { ok: false, error: 'appId must be a string' };
      return ouvrirApp(String(args.appId));
    case 'allerASection':
      if (typeof args.appId !== 'string' || typeof args.sectionId !== 'string') {
        return { ok: false, error: 'appId and sectionId must be strings' };
      }
      return allerASection(String(args.appId), String(args.sectionId));
    case 'lireCollection':
      if (typeof args.collectionId !== 'string') return { ok: false, error: 'collectionId must be a string' };
      return lireCollection(String(args.collectionId));
    case 'changerTheme':
      if (typeof args.themeId !== 'string') return { ok: false, error: 'themeId must be a string' };
      return changerTheme(String(args.themeId), typeof args.appId === 'string' ? String(args.appId) : undefined);
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

/**
 * Harvest the last text snippet from a message — useChat's UIMessage is a
 * stream of parts, so we have to walk the last TextUIPart to display
 * something. Memoised via ref so the bubble text doesn't re-render every
 * frame during streaming.
 */
function partText(msg: { parts?: Array<{ type: string; text?: string }> } | undefined): string {
  if (!msg?.parts) return '';
  for (const p of msg.parts) {
    if (p.type === 'text' && typeof p.text === 'string') return p.text;
  }
  return '';
}

export function AssistantOverlay() {
  const active = useAssistantStore((s) => s.active);
  const characterId = useAssistantStore((s) => s.characterId);
  const position = useAssistantStore((s) => s.position);
  const bubbleOpen = useAssistantStore((s) => s.bubbleOpen);
  const toggleBubble = useAssistantStore((s) => s.toggleBubble);
  const setBubbleOpen = useAssistantStore((s) => s.setBubbleOpen);
  const setPosition = useAssistantStore((s) => s.setPosition);
  const appendTurn = useAssistantStore((s) => s.appendTurn);

  const character = useMemo(() => getCharacter(characterId) ?? getCharacter('clippy')!, [characterId]);

  // Entry animation — plays once when the character is first mounted, then
  // falls back to the chat-status-driven intent. The latch is per
  // characterId so switching characters replays the entry gesture.
  const [entryDone, setEntryDone] = useState(false);
  const [entryKey, setEntryKey] = useState(characterId);
  useEffect(() => {
    if (entryKey !== characterId) {
      setEntryKey(characterId);
      setEntryDone(false);
    }
  }, [characterId, entryKey]);

  // Drag state — refs because they don't drive rendering.
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ──── useChat ────
  const { messages, sendMessage, status, error, stop, addToolOutput } = useChat({
    // After the assistant emits a tool call and we've fed the result back,
    // automatically re-send so the model can produce its final text reply.
    // Without this, the loop stops at the first tool call and the bubble
    // never shows the human-readable answer.
    sendAutomaticallyWhen: ({ messages }) =>
      lastAssistantMessageIsCompleteWithToolCalls({ messages }) === true,
    onToolCall: async ({ toolCall }) => {
      const name = toolCall.toolName;
      const id = toolCall.toolCallId;
      try {
        // `await` obligatoire : `allerASection` attend que l'app se monte.
        // Sans lui, on renverrait l'objet promesse au modele.
        const result = await executeLocalTool(name, toolCall.input);
        void addToolOutput({ tool: name, toolCallId: id, output: result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        void addToolOutput({
          tool: name,
          toolCallId: id,
          output: { ok: false, error: msg },
        });
      }
    },
    onError: (err) => {
      // The fetch itself failed (network, server down, 502). Keep the
      // message human-readable — the character will show it in the bubble.
      console.warn('[assistant] /api/chat error:', err.message);
    },
  });

  // Drive the character's intent from the chat status.
  const isStreaming = status === 'streaming';
  const hasError = Boolean(error) || status === 'error';
  const statusIntent = intentForStatus(status, hasError, isStreaming);
  // While the entry gesture is playing, override the chat-status intent.
  const intent = entryDone ? statusIntent : 'entree';

  // Derived visible text — last assistant message's text part. Memoised
  // shallow through useMemo over the message array reference; the part
  // itself is a stable reference between streaming updates.
  const lastAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return partText(messages[i]);
      }
    }
    return '';
  }, [messages]);
  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return partText(messages[i]);
    }
    return '';
  }, [messages]);

  // Persist turns (skip the placeholder empty assistant message).
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const text = partText(last);
    if (!text) return;
    if (last.role === 'user') {
      appendTurn({ id: last.id, role: 'user', ts: Date.now(), text });
    } else if (last.role === 'assistant') {
      // Only persist when the assistant is done streaming — this is the
      // last-finished state. We re-write on every update which is fine at
      // ≤40 messages.
      if (status === 'ready') {
        appendTurn({ id: last.id, role: 'assistant', ts: Date.now(), text });
      }
    }
  }, [messages, status, appendTurn]);

  // ──── Local input state ────
  const [input, setInput] = useState('');
  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void sendMessage({ text });
  }, [input, sendMessage]);

  // ──── Position : elle doit suivre la fenetre ────
  //
  //  La position par defaut etait `{ x: 1180, y: 700 }`, en dur. Dans un
  //  navigateur integre, ou la hauteur utile descend sous 800 px, le personnage
  //  etait rendu a 700 + 128 = 828 — sous le bord bas. Present dans le DOM,
  //  anime, et parfaitement invisible : le pire des etats, puisque rien ne
  //  signale l'anomalie.
  //
  //  Meme cause que les icones du bureau, corrigees plus tot : une constante qui
  //  supposait un grand ecran. On borne donc contre la fenetre reelle, au
  //  montage et a chaque redimensionnement, et on remonte la position bornee
  //  dans le magasin pour qu'elle soit persistee reparee.
  const HAUT_BARRE = 44;
  const BAS_DOCK = 92;

  const bornerDansCadre = useCallback(
    (p: { x: number; y: number }) => {
      const largeur = character.width;
      const hauteur = character.height;
      const maxX = Math.max(0, window.innerWidth - largeur - 8);
      const maxY = Math.max(HAUT_BARRE, window.innerHeight - hauteur - BAS_DOCK);
      return {
        x: Math.min(Math.max(8, p.x), maxX),
        y: Math.min(Math.max(HAUT_BARRE, p.y), maxY),
      };
    },
    [character.width, character.height],
  );

  useEffect(() => {
    const recadrer = () => {
      const p = useAssistantStore.getState().position;
      const borne = bornerDansCadre(p);
      if (borne.x !== p.x || borne.y !== p.y) setPosition(borne.x, borne.y);
    };
    recadrer();
    window.addEventListener('resize', recadrer);
    return () => window.removeEventListener('resize', recadrer);
  }, [bornerDansCadre, setPosition]);

  // ──── Drag ────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Ignore drags that started on the bubble.
    const target = e.target as HTMLElement;
    if (target.closest('[data-bubble-handle="true"]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    // Borne aussi pendant le glissement : sans ca on peut deposer le
    // personnage hors de l'ecran et n'avoir plus aucun moyen de le rattraper.
    const p = bornerDansCadre({ x: drag.originX + dx, y: drag.originY + dy });
    setPosition(p.x, p.y);
  }, [setPosition]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    // If the cursor barely moved, treat as a click — toggle the bubble.
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    dragRef.current = null;
    if (dx < 3 && dy < 3) {
      toggleBubble();
    }
  }, [toggleBubble]);

  // ──── Render ────
  if (!active) return null;

  // Approximate badge of streaming text — 4 last chars shimmer.
  const bubbleText = (() => {
    if (hasError) {
      return error?.message?.includes('fetch')
        ? "I can't reach the chat server. Is `/api/chat` running?"
        : (error?.message ?? 'Something went wrong.');
    }
    if (status === 'submitted') return 'Thinking…';
    if (lastAssistantText) return lastAssistantText;
    if (lastUserText) return '…';
    return "Hello — type a question and I'll see what I can do.";
  })();

  // The character box needs to clear the bubble on the right.
  const bubbleWidth = 280;
  const showBubble = bubbleOpen;

  return (
    <div
      ref={containerRef}
      data-assistant-overlay
      className="fixed z-[4500] select-none"
      style={{
        left: position.x,
        top: position.y,
        // Allow the bubble to overflow the sprite's box; this is the
        // container that the drag handle lives on.
      }}
    >
      <div className="flex items-end gap-3">
        {/* Bubble — portaled to the right of the sprite */}
        {showBubble && (
          <AssistantBubble
            character={character}
            text={bubbleText}
            isStreaming={isStreaming}
            hasError={hasError}
            input={input}
            setInput={setInput}
            onSend={send}
            onStop={() => stop()}
            onClose={() => setBubbleOpen(false)}
            width={bubbleWidth}
          />
        )}
        {/* Sprite — draggable */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative cursor-grab active:cursor-grabbing"
          style={{ width: character.width, height: character.height }}
          data-sprite-handle
          title={character.name}
        >
          <SpriteAgent
            character={character}
            intent={intent}
            loop={entryDone ? status === 'ready' || hasError : false}
            onFinished={entryDone ? undefined : () => setEntryDone(true)}
          />
          {/* When the bubble is closed, surface a discreet chat icon so the
              user knows the character is clickable. */}
          {!showBubble && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleBubble(); }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-white shadow"
              style={{ background: character.bubble.border, fontSize: 10 }}
              aria-label="Open assistant"
              data-assistant-open
            >
              <MessageSquare className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AssistantBubble — kept private to this file. Renders the text + form.
// ────────────────────────────────────────────────────────────────────────────

interface AssistantBubbleProps {
  character: ReturnType<typeof getCharacter> extends infer C ? Exclude<C, undefined> : never;
  text: string;
  isStreaming: boolean;
  hasError: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onClose: () => void;
  width: number;
}

function AssistantBubble({ character, text, isStreaming, hasError, input, setInput, onSend, onStop, onClose, width }: AssistantBubbleProps) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  return (
    <div
      data-bubble-handle="true"
      className="relative rounded-2xl shadow-2xl"
      style={{
        width,
        background: character.bubble.background,
        border: `1px solid ${character.bubble.border}`,
        color: character.bubble.ink,
        padding: '10px 12px 8px',
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" style={{ color: character.bubble.border }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: character.bubble.border }}>
            {character.name}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="opacity-60 hover:opacity-100"
          aria-label="Close assistant"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div
        className="text-[12px] leading-[1.45] min-h-[36px] max-h-[160px] overflow-y-auto whitespace-pre-wrap"
        style={{ color: character.bubble.ink }}
        data-bubble-text
        data-status={hasError ? 'error' : isStreaming ? 'streaming' : 'ready'}
      >
        {text}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="mt-2 flex items-center gap-1"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={hasError ? 'Try again…' : 'Ask the assistant…'}
          disabled={hasError}
          className="flex-1 min-w-0 rounded-lg px-2 py-1 text-[12px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: `1px solid ${character.bubble.border}40`,
            color: character.bubble.ink,
          }}
          data-assistant-input
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: character.bubble.border, color: '#fff' }}
            aria-label="Stop"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || hasError}
            className="rounded-lg px-2 py-1 text-white disabled:opacity-40"
            style={{ background: character.bubble.border }}
            aria-label="Send"
          >
            <Send className="w-3 h-3" />
          </button>
        )}
      </form>
    </div>
  );
}
