/**
 * AgentTile.tsx — un personnage sur le bureau, avec sa bulle.
 *
 * Avant : un AssistantOverlay unique (AssistantOverlay.tsx) faisait office de
 * bureau + bulle. Maintenant : N AgentTile, un par agent, montes par
 * AssistantOverlay. Chaque tile a sa propre conversation, sa propre position,
 * sa propre useChat, sa propre pile de messages.
 *
 * Strategie de streaming : on NE PASSE PAS par useChat/@ai-sdk/react pour les
 * agents de dos non-modele. useChat est cable sur /api/chat qui rend un flux
 * UIMessage du SDK — or les backends multica et buzz renvoient du texte brut.
 * On garde donc useChat pour l'agent "modele" et un EventSource maison
 * pour les autres dos.
 *
 * Bornage : la position est bornee contre la fenetre au montage et au resize.
 * Une position en dur (1180, 700) rendait le personnage invisible sous le
 * bord bas dans un navigateur integre — deja paye sur ce bureau.
 *
 * Charge sprite a la demande : un SpriteAgent par tile. Pas de prechargement
 * global, sinon 12 * 1.3 MB = 16 MB au boot pour rien.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { lastAssistantMessageIsCompleteWithToolCalls, type ChatStatus } from 'ai';
import { Send, X, MessageSquare, Sparkles, AlertTriangle, Mic, Square } from 'lucide-react';
import { SpriteAgent } from './SpriteAgent';
import { VoiceWave } from './VoiceWave';
import { getCharacter, type Intent } from './characters';
import {
  hasRecognition,
  hasSynthesis,
  useVoiceRecognition,
  useVoiceSynthesis,
  type SpeechState,
} from './voice';
import {
  listerApps,
  ouvrirApp,
  allerASection,
  lireCollection,
  changerTheme,
} from './tools';
import { useAssistantStore, type AgentSlot } from '../stores/assistant.store';

// ────────────────────────────────────────────────────────────────────────────
// Status → intent. Stable, memoise hors du composant.
// ────────────────────────────────────────────────────────────────────────────
function intentForStatus(status: ChatStatus, hasError: boolean, isStreaming: boolean): Intent {
  if (hasError) return 'error';
  if (status === 'submitted') return 'thinking';
  if (status === 'streaming' || isStreaming) return 'speaking';
  return 'idle';
}

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

function partText(msg: { parts?: Array<{ type: string; text?: string }> } | undefined): string {
  if (!msg?.parts) return '';
  for (const p of msg.parts) {
    if (p.type === 'text' && typeof p.text === 'string') return p.text;
  }
  return '';
}

export interface AgentTileProps {
  agent: AgentSlot;
  onToggleBubble: (id: string) => void;
  onSetBubbleOpen: (id: string, open: boolean) => void;
  onSetPosition: (id: string, x: number, y: number) => void;
  onAppendTurn: (id: string, turn: { id: string; role: 'user' | 'assistant'; ts: number; text: string }) => void;
  onClearHistory: (id: string) => void;
  /** Borne la fenetre (utile pour les tests). */
  barHaut?: number;
  dockBas?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Streaming via EventSource : pour les dos non-modele (multica, buzz) qui
// renvoient du texte brut, pas un flux UIMessage.
// ────────────────────────────────────────────────────────────────────────────
interface FluxTextStatus {
  status: 'idle' | 'streaming' | 'error';
  text: string;
  error: string | null;
  statusText: string | null;
}

function useTexteFlux(
  agentId: string,
  agent: AgentSlot,
  enabled: boolean,
): [FluxTextStatus, (text: string) => void, () => void] {
  const [state, setState] = useState<FluxTextStatus>({ status: 'idle', text: '', error: null, statusText: null });
  const abortRef = useRef<AbortController | null>(null);

  const envoyer = useCallback(
    (userText: string) => {
      // Reset propre
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setState({ status: 'streaming', text: '', error: null, statusText: 'Connexion au dos…' });

      void fetch('/api/agent/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, messages: [{ id: crypto.randomUUID(), role: 'user', parts: [{ type: 'text', text: userText }] }] }),
        signal: ac.signal,
      })
        .then(async (res) => {
          if (!res.ok || !res.body) {
            const errText = await res.text();
            setState({ status: 'error', text: '', error: `HTTP ${res.status} : ${errText}`, statusText: null });
            return;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          let acc = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let sep: number;
            while ((sep = buf.indexOf('\n\n')) !== -1) {
              const block = buf.slice(0, sep);
              buf = buf.slice(sep + 2);
              // Parse SSE : "event: <name>\ndata: <json>\n\n"
              const evLine = block.split('\n').find((l) => l.startsWith('event: '));
              const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
              if (!evLine || !dataLine) continue;
              const ev = evLine.slice('event: '.length).trim();
              const dataStr = dataLine.slice('data: '.length);
              let data: unknown = null;
              try {
                data = JSON.parse(dataStr);
              } catch {
                continue;
              }
              if (ev === 'delta') {
                const d = data as { type?: string; text?: string };
                if (typeof d.text === 'string') {
                  acc += d.text;
                  setState((s) => ({ ...s, text: acc }));
                }
              } else if (ev === 'done') {
                const d = data as { stopReason?: string; error?: string };
                setState((s) => ({
                  status: d.error ? 'error' : 'idle',
                  text: s.text || acc,
                  error: d.error ?? null,
                  statusText: null,
                }));
                return;
              }
            }
          }
          setState((s) => ({ ...s, status: 'idle' }));
        })
        .catch((err) => {
          if (ac.signal.aborted) return;
          setState({ status: 'error', text: '', error: err instanceof Error ? err.message : String(err), statusText: null });
        });
    },
    [agentId],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, status: 'idle', statusText: null }));
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // On revoie la valeur courante + les actions. L'effet ne tourne que si
  // l'agent change.
  void enabled;
  void agent;
  return [state, envoyer, stop];
}

// ────────────────────────────────────────────────────────────────────────────
// Le composant AgentTile : monte un personnage + sa bulle.
// ────────────────────────────────────────────────────────────────────────────
export function AgentTile(props: AgentTileProps) {
  const { agent, onToggleBubble, onSetBubbleOpen, onSetPosition, onAppendTurn, onClearHistory, barHaut = 44, dockBas = 92 } = props;
  const character = useMemo(() => getCharacter(agent.personnageId) ?? getCharacter('clippy')!, [agent.personnageId]);

  // Reglages vocaux lus a chaque rendu. Scalaires : pas de risque de boucle.
  const voiceEnabled = useAssistantStore((s) => s.voiceEnabled);
  const voiceName = useAssistantStore((s) => s.voiceName);
  const voiceRate = useAssistantStore((s) => s.voiceRate);
  const voicePrivacy = useAssistantStore((s) => s.voicePrivacy);

  // Detection de la disponibilite des APIs navigateur — recalculee au mount
  // uniquement (les flags ne changent pas pendant la session).
  const canListen = useMemo(() => hasRecognition(), []);
  const canSpeak = useMemo(() => hasSynthesis(), []);

  // Entry animation : joue une fois par changement de personnage.
  const [entryDone, setEntryDone] = useState(false);
  const [entryKey, setEntryKey] = useState(agent.personnageId);
  useEffect(() => {
    if (entryKey !== agent.personnageId) {
      setEntryKey(agent.personnageId);
      setEntryDone(false);
    }
  }, [agent.personnageId, entryKey]);

  // Drag refs — variables d'etat transitoires, pas de re-render.
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  // ─── useChat (pour dos=modele) ───
  // Note : on instancie useChat inconditionnellement (memes regles que les
  // hooks React), mais on n'envoie via /api/chat QUE si le dos est modele.
  // Pour multica/buzz, on lit le texte recu via useTexteFlux et on le rend
  // dans la meme bulle — un switch local en bas du composant.
  const chat = useChat({
    id: `agent-${agent.id}`,
    sendAutomaticallyWhen: ({ messages }) =>
      lastAssistantMessageIsCompleteWithToolCalls({ messages }) === true,
    onToolCall: async ({ toolCall }) => {
      try {
        const result = await executeLocalTool(toolCall.toolName, toolCall.input);
        void chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: result });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        void chat.addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: { ok: false, error: msg },
        });
      }
    },
    onError: (err) => {
      console.warn(`[assistant:${agent.id}] error:`, err.message);
    },
  });

  // ─── Flux texte (pour dos != modele) ───
  const [fluxState, envoyerFlux, stopFlux] = useTexteFlux(agent.id, agent, agent.backend !== 'modele');

  // ─── Voix : reconnaissance et synthese ───
  // La reconnaissance recoit la transcription finale via onFinal, qu'on
  // envoie comme un message utilisateur a l'agent (meme canal que send()).
  const recFinalRef = useRef<((text: string) => void) | null>(null);
  const recognition = useVoiceRecognition({
    enabled: voiceEnabled && canListen,
    onFinal: (text) => recFinalRef.current?.(text),
  });
  const synthesis = useVoiceSynthesis({
    enabled: voiceEnabled && canSpeak,
    voiceName,
    rate: voiceRate,
    privacy: voicePrivacy,
    agentId: agent.id,
  });

  // ─── Position : bornee contre la fenetre ───
  const bornerDansCadre = useCallback(
    (p: { x: number; y: number }) => {
      const maxX = Math.max(0, window.innerWidth - character.width - 8);
      const maxY = Math.max(barHaut, window.innerHeight - character.height - dockBas);
      return {
        x: Math.min(Math.max(8, p.x), maxX),
        y: Math.min(Math.max(barHaut, p.y), maxY),
      };
    },
    [character.width, character.height, barHaut, dockBas],
  );

  useEffect(() => {
    const recadrer = () => {
      const borne = bornerDansCadre(agent.position);
      if (borne.x !== agent.position.x || borne.y !== agent.position.y) {
        onSetPosition(agent.id, borne.x, borne.y);
      }
    };
    recadrer();
    window.addEventListener('resize', recadrer);
    return () => window.removeEventListener('resize', recadrer);
  }, [bornerDansCadre, agent.id, agent.position, onSetPosition]);

  // ─── Texte visible ───
  // Pour dos=modele : on lit le dernier message assistant via useChat.
  // Pour dos != modele : on lit fluxState.text.
  const isModele = agent.backend === 'modele';
  const isStreaming = isModele ? chat.status === 'streaming' : fluxState.status === 'streaming';
  const hasError = isModele ? Boolean(chat.error) || chat.status === 'error' : fluxState.status === 'error';

  const lastAssistantText = useMemo(() => {
    if (!isModele) return fluxState.text;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === 'assistant') {
        return partText(chat.messages[i]);
      }
    }
    return '';
  }, [isModele, chat.messages, fluxState.text]);

  const lastUserText = useMemo(() => {
    if (!isModele) return '';
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === 'user') return partText(chat.messages[i]);
    }
    return '';
  }, [isModele, chat.messages]);

  // Persist turns in modele mode
  useEffect(() => {
    if (!isModele) return;
    if (chat.messages.length === 0) return;
    const last = chat.messages[chat.messages.length - 1];
    const text = partText(last);
    if (!text) return;
    if (last.role === 'user') {
      onAppendTurn(agent.id, { id: last.id, role: 'user', ts: Date.now(), text });
    } else if (last.role === 'assistant' && chat.status === 'ready') {
      onAppendTurn(agent.id, { id: last.id, role: 'assistant', ts: Date.now(), text });
    }
  }, [isModele, chat.messages, chat.status, agent.id, onAppendTurn]);

  // Persist turns in non-modele mode (a chaque fin de stream)
  useEffect(() => {
    if (isModele) return;
    if (fluxState.status === 'idle' && fluxState.text) {
      onAppendTurn(agent.id, { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), text: fluxState.text });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fluxState.status]);

  // ─── Status → intent ───
  // Pendant la synthese vocale, l'intent reste 'speaking' meme si le
  // streaming texte est termine : c'est le personnage qui parle, pas
  // seulement la machine qui repond.
  const chatStatusForIntent: ChatStatus = isModele ? chat.status : (isStreaming ? 'streaming' : 'ready');
  const statusIntent = intentForStatus(chatStatusForIntent, hasError, isStreaming);
  const synthActive = synthesis.state === 'speaking';
  const intent: Intent = entryDone
    ? (synthActive ? 'speaking' : statusIntent)
    : 'entree';

  // ─── Branchement de la reconnaissance : envoyer la transcription finale
  // comme un message utilisateur. On utilise un ref pour eviter de
  // re-rendre quand send() change. ───
  recFinalRef.current = (text: string) => {
    if (!text) return;
    setInput('');
    onAppendTurn(agent.id, { id: crypto.randomUUID(), role: 'user', ts: Date.now(), text });
    if (isModele) {
      void chat.sendMessage({ text });
    } else {
      envoyerFlux(text);
    }
  };

  // ─── Transcription intermediaire : on l'injecte dans le champ de saisie
  // au fur et a mesure, par-dessus ce que l'utilisateur aurait tape. Si
  // l'utilisateur tape pendant qu'on ecoute, sa frappe prend la main. ───
  useEffect(() => {
    if (recognition.state !== 'listening') return;
    if (!recognition.interim) return;
    setInput(recognition.interim);
    // On ne depend que de l'etat et du transcript — pas de l'input sinon
    // on boucle : setInput -> re-render -> useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition.state, recognition.interim]);

  // ─── Synthese vocale : chaque nouvelle reponse assistant terminee est
  // dite a voix haute si la voix est activee. ───
  const lastSpokenRef = useRef<string>('');
  useEffect(() => {
    if (!voiceEnabled || !canSpeak) return;
    if (!lastAssistantText) return;
    // On attend que le streaming texte soit termine pour parler : sinon
    // on coupe la parole a chaque token, ce qui est inutile et laid.
    if (isStreaming) return;
    if (lastAssistantText === lastSpokenRef.current) return;
    lastSpokenRef.current = lastAssistantText;
    synthesis.speak(lastAssistantText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAssistantText, isStreaming, voiceEnabled, canSpeak]);

  // ─── Input local ───
  const [input, setInput] = useState('');
  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    onAppendTurn(agent.id, { id: crypto.randomUUID(), role: 'user', ts: Date.now(), text });
    if (isModele) {
      void chat.sendMessage({ text });
    } else {
      envoyerFlux(text);
    }
  }, [input, isModele, chat, envoyerFlux, agent.id, onAppendTurn]);

  const stop = useCallback(() => {
    if (isModele) chat.stop();
    else stopFlux();
  }, [isModele, chat, stopFlux]);

  // ─── Drag ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-bubble-handle="true"]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: agent.position.x,
      originY: agent.position.y,
    };
  }, [agent.position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const p = bornerDansCadre({ x: drag.originX + dx, y: drag.originY + dy });
    onSetPosition(agent.id, p.x, p.y);
  }, [bornerDansCadre, onSetPosition, agent.id]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    dragRef.current = null;
    if (dx < 3 && dy < 3) {
      onToggleBubble(agent.id);
    }
  }, [onToggleBubble, agent.id]);

  // Texte de la bulle, dependant du statut
  const bubbleText = (() => {
    // Refus de permission micro : un message clair, sans re-essai en boucle.
    if (recognition.state === 'denied') {
      return 'Le micro est refuse. Autorise-le dans les reglages du navigateur pour dicter ta question.';
    }
    if (hasError) {
      if (isModele && chat.error) {
        return chat.error.message?.includes('fetch')
          ? "I can't reach the chat server. Is `/api/chat` running?"
          : (chat.error.message ?? 'Something went wrong.');
      }
      return fluxState.error ?? 'Something went wrong.';
    }
    if (isStreaming) {
      if (!isModele && fluxState.statusText) return fluxState.statusText;
      return lastAssistantText || '…';
    }
    if (lastAssistantText) return lastAssistantText;
    if (lastUserText) return '…';
    if (!agent.backendAvailable) {
      return `Dos "${agent.backend}" indisponible sur ce serveur.`;
    }
    return `Salut — je suis ${agent.name}. Pose ta question.`;
  })();

  const showBubble = agent.bubbleOpen;
  const bubbleWidth = 280;

  return (
    <div
      data-assistant-overlay
      data-agent-id={agent.id}
      data-agent-backend={agent.backend}
      data-agent-available={agent.backendAvailable}
      className="fixed z-[4500] select-none"
      style={{ left: agent.position.x, top: agent.position.y }}
    >
      <div className="flex items-end gap-3">
        {showBubble && (
          <AgentBubble
            agent={agent}
            character={character}
            text={bubbleText}
            isStreaming={isStreaming}
            hasError={hasError}
            input={input}
            setInput={setInput}
            onSend={send}
            onStop={stop}
            onClose={() => onSetBubbleOpen(agent.id, false)}
            onClear={() => onClearHistory(agent.id)}
            width={bubbleWidth}
            voiceEnabled={voiceEnabled}
            canListen={canListen}
            recognitionState={recognition.state}
            synthesisState={synthesis.state}
            onStartListening={() => recognition.start()}
            onStopListening={() => recognition.stop()}
            onStopSpeaking={() => synthesis.stop()}
          />
        )}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative cursor-grab active:cursor-grabbing"
          style={{ width: character.width, height: character.height }}
          data-sprite-handle
          title={agent.name}
        >
          <SpriteAgent
            character={character}
            intent={intent}
            loop={entryDone ? isStreaming || hasError : false}
            onFinished={entryDone ? undefined : () => setEntryDone(true)}
          />
          {!showBubble && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleBubble(agent.id); }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-white shadow"
              style={{ background: character.bubble.border, fontSize: 10 }}
              aria-label={`Open ${agent.name}`}
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
// Bulle : portee a droite du sprite.
// ────────────────────────────────────────────────────────────────────────────

interface AgentBubbleProps {
  agent: AgentSlot;
  character: ReturnType<typeof getCharacter> extends infer C ? Exclude<C, undefined> : never;
  text: string;
  isStreaming: boolean;
  hasError: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onClose: () => void;
  onClear: () => void;
  width: number;
  voiceEnabled: boolean;
  canListen: boolean;
  recognitionState: SpeechState;
  synthesisState: SpeechState;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

function AgentBubble({
  agent, character, text, isStreaming, hasError, input, setInput, onSend, onStop, onClose, onClear, width,
  voiceEnabled, canListen, recognitionState, synthesisState,
  onStartListening, onStopListening, onStopSpeaking,
}: AgentBubbleProps) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  // Le bouton Stop arrete : le stream texte s'il tourne, OU la synthese
  // vocale seule si elle seule tourne. Les deux ensemble : stream d'abord,
  // puis synthese.
  const handleStop = () => {
    if (isStreaming) onStop();
    if (synthesisState === 'speaking') onStopSpeaking();
  };
  const showStop = isStreaming || synthesisState === 'speaking';
  // Le bouton micro n'est visible que si : voiceEnabled, canListen,
  // et on n'ecoute pas deja.
  const showMic = voiceEnabled && canListen;
  const showMicStop = voiceEnabled && canListen && recognitionState === 'listening';
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
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: character.bubble.border }} />
          <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: character.bubble.border }}>
            {agent.name}
          </span>
          {!agent.backendAvailable && (
            <span title="Dos indisponible">
              <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#dc2626' }} />
            </span>
          )}
          {/* Indicateur d'etat vocal : visible des que le micro est ouvert
              ou que l'agent parle. Un micro ouvert sans signal est
              inacceptable — on le dit. */}
          {recognitionState === 'listening' && (
            <span data-voice-indicator="listening" aria-label="Micro ouvert" className="flex items-center">
              <VoiceWave state="listening" color={character.bubble.border} size="sm" />
            </span>
          )}
          {synthesisState === 'speaking' && (
            <span data-voice-indicator="speaking" aria-label="L'agent parle" className="flex items-center">
              <VoiceWave state="speaking" color={character.bubble.border} size="sm" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            className="text-[9px] opacity-60 hover:opacity-100 uppercase tracking-wider font-bold"
            title="Vider la conversation"
          >
            clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="opacity-60 hover:opacity-100"
            aria-label="Close assistant"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
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
        {/* Bouton micro : visible SEULEMENT si la reconnaissance est
            disponible ET que la voix est activee. Sinon, pas de bouton
            qui ne fait rien — c'est la regle du brief. */}
        {showMic && !showMicStop && (
          <button
            type="button"
            onClick={onStartListening}
            disabled={hasError || !agent.backendAvailable || recognitionState === 'denied'}
            className="shrink-0 rounded-lg px-1.5 py-1 text-[10px] font-bold flex items-center justify-center disabled:opacity-40"
            style={{
              background: recognitionState === 'denied' ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${character.bubble.border}40`,
              color: character.bubble.ink,
            }}
            title="Dicter"
            data-voice-mic
          >
            <Mic className="w-3 h-3" />
          </button>
        )}
        {showMicStop && (
          <button
            type="button"
            onClick={onStopListening}
            className="shrink-0 rounded-lg px-1.5 py-1 text-[10px] font-bold flex items-center justify-center"
            style={{
              background: character.bubble.border,
              color: '#fff',
            }}
            title="Arreter le micro"
            data-voice-mic-stop
            data-voice-mic-active="true"
          >
            <Square className="w-3 h-3" />
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            recognitionState === 'denied'
              ? 'Micro refuse — utilise le clavier'
              : hasError
                ? 'Try again…'
                : `Demande a ${agent.name}…`
          }
          disabled={hasError || !agent.backendAvailable}
          className="flex-1 min-w-0 rounded-lg px-2 py-1 text-[12px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: `1px solid ${character.bubble.border}40`,
            color: character.bubble.ink,
          }}
          data-assistant-input
        />
        {showStop ? (
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: character.bubble.border, color: '#fff' }}
            aria-label="Stop"
            data-voice-stop
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || hasError || !agent.backendAvailable}
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