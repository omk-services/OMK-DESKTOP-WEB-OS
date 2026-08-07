/**
 * assistant.store.ts — Zustand store for the desktop assistant.
 *
 * Holds: active toggle, current character id, position on the desktop, voice
 * enabled, and a bounded conversation log. The character itself streams
 * through `/api/chat` and is not modelled here — only the *user-visible*
 * state lives in this store.
 *
 * Why persist with a `partialize`:
 * The position must survive a reload so the user doesn't have to re-drag the
 * assistant. The conversation log is intentionally small (40 messages max
 * here, see MAX_HISTORY) — localStorage is shared with theme + wallpaper
 * blobs and a runaway log would evict them all.
 *
 * Selector rule: every selector returns a scalar or a stable reference.
 * `getSnapshot should be cached` is the canonical Zustand error that fires
 * when a selector returns a fresh array/object on every call — it makes
 * `useSyncExternalStore` see a new value every render and re-render forever.
 * Derived shapes (filtered lists, lookups) live in the component, memoized.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../agent/characters';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  /** Timestamp — used for the bounded history to drop the oldest first. */
  ts: number;
  text: string;
}

const MAX_HISTORY = 40;

export interface AssistantState {
  active: boolean;
  characterId: string;
  position: { x: number; y: number };
  voiceEnabled: boolean;
  bubbleOpen: boolean;
  history: ChatTurn[];

  setActive: (active: boolean) => void;
  toggleActive: () => void;
  setCharacter: (id: string) => void;
  setPosition: (x: number, y: number) => void;
  resetPosition: () => void;
  setVoiceEnabled: (v: boolean) => void;
  setBubbleOpen: (open: boolean) => void;
  toggleBubble: () => void;

  /** Append a turn, drop the oldest if we exceeded MAX_HISTORY. */
  appendTurn: (turn: ChatTurn) => void;
  clearHistory: () => void;
}

const DEFAULT_POSITION = { x: 1180, y: 700 };

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      active: true,
      characterId: DEFAULT_CHARACTER_ID,
      position: DEFAULT_POSITION,
      voiceEnabled: false,
      bubbleOpen: false,
      history: [],

      setActive: (active) => set({ active }),
      toggleActive: () => set((s) => ({ active: !s.active })),
      setCharacter: (id) => {
        // Bail silently on unknown ids — the picker only offers valid ones,
        // and a malformed persisted value shouldn't crash the desktop.
        if (!CHARACTERS.some(c => c.id === id)) return;
        set({ characterId: id });
      },
      setPosition: (x, y) => set({ position: { x, y } }),
      resetPosition: () => set({ position: DEFAULT_POSITION }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setBubbleOpen: (open) => set({ bubbleOpen: open }),
      toggleBubble: () => set((s) => ({ bubbleOpen: !s.bubbleOpen })),

      appendTurn: (turn) => set((s) => {
        const next = [...s.history, turn];
        if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
        return { history: next };
      }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'coach-os-assistant-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        active: s.active,
        characterId: s.characterId,
        position: s.position,
        voiceEnabled: s.voiceEnabled,
        // history is part of the persisted slice — the AI conversation
        // survives a reload. The bounded append keeps it under quota.
        history: s.history,
      }),
      version: 1,

      // L'etat persiste est une entree NON FIABLE : il vient de `localStorage`,
      // ou peuvent cohabiter une version anterieure du schema, une entree
      // tronquee par un depassement de quota, ou une valeur posee a la main.
      // Sans cette reparation, une `position` a `null` fait lire `position.x`
      // sur `null` dans l'overlay et emporte TOUT le bureau en page blanche —
      // constate en posant `null` a la main pendant une verification.
      merge: (persiste, courant) => {
        const p = (persiste ?? {}) as Partial<AssistantState>;
        const positionValide =
          p.position != null &&
          typeof p.position === 'object' &&
          Number.isFinite((p.position as { x?: unknown }).x) &&
          Number.isFinite((p.position as { y?: unknown }).y);
        const personnageValide =
          typeof p.characterId === 'string' &&
          CHARACTERS.some((c) => c.id === p.characterId);
        return {
          ...courant,
          ...p,
          position: positionValide ? p.position! : DEFAULT_POSITION,
          characterId: personnageValide ? p.characterId! : DEFAULT_CHARACTER_ID,
          history: Array.isArray(p.history) ? p.history.slice(-MAX_HISTORY) : [],
        };
      },
    },
  ),
);

// DEV-only handle for Playwright capture scripts — matches the pattern used
// by shell.store and theme.store so the shot tool can drive the assistant
// the same way it drives any other panel.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const w = window as unknown as { __coachos?: Record<string, unknown> };
  w.__coachos = { ...w.__coachos, assistant: useAssistantStore };
}
