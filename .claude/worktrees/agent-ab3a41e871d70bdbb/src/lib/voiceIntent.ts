/** Voice-navigation intent bridge — lets useVoiceNavigation (mounted once, globally,
 *  outside any window) hand a section/item target to one specific WindowFrame +
 *  useCollectionDrill instance without threading props through every app.
 *  Each window consumes its own entry once; consuming a field clears only that
 *  field (fire-once semantics), so a section target and an item target set in the
 *  same command survive the two-step render cycle (activePage settles, then the
 *  matching useCollectionDrill instance becomes active and reads its item). */
import { create } from 'zustand';

export interface VoiceIntent {
  section?: string;
  itemId?: string;
}

interface VoiceIntentState {
  byWindow: Record<string, VoiceIntent>;
  setIntent: (windowId: string, intent: VoiceIntent) => void;
  consumeSection: (windowId: string) => string | undefined;
  consumeItem: (windowId: string) => string | undefined;
}

export const useVoiceIntentStore = create<VoiceIntentState>((set, get) => ({
  byWindow: {},

  setIntent: (windowId, intent) => set((s) => ({
    byWindow: { ...s.byWindow, [windowId]: { ...s.byWindow[windowId], ...intent } },
  })),

  consumeSection: (windowId) => {
    const section = get().byWindow[windowId]?.section;
    if (section === undefined) return undefined;
    set((s) => ({
      byWindow: { ...s.byWindow, [windowId]: { ...s.byWindow[windowId], section: undefined } },
    }));
    return section;
  },

  consumeItem: (windowId) => {
    const itemId = get().byWindow[windowId]?.itemId;
    if (itemId === undefined) return undefined;
    set((s) => ({
      byWindow: { ...s.byWindow, [windowId]: { ...s.byWindow[windowId], itemId: undefined } },
    }));
    return itemId;
  },
}));
