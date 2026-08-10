/**
 * assistant.store.ts — Zustand store for the desktop assistant (roster multi-agents).
 *
 * Avant : un seul personnage sur le bureau, et une seule conversation.
 * Maintenant : N agents (les 12 squads Multica par defaut), chacun avec son
 * sprite, son dos, et sa conversation isolee. L'overlay affiche tous les
 * agents actifs en meme temps, chacun sa position, sa bulle, son personnage.
 *
 * Etat persiste : pour rester compatible avec la v1, on conserve les champs
 * `active`, `characterId`, `position`, `voiceEnabled`, `history` qui font sens
 * pour UN agent. Le multi-agent vit dans `agents: Record<id, AgentSlot>` et
 * n'est PAS persiste ici — il est recharge depuis /api/agent/roster au boot.
 *
 * Pourquoi ne pas tout persister :
 *  - Le roster vient du serveur ; le client ne fait pas autorite.
 *  - Les positions de N agents dans localStorage ecraseraient les 5 MB de
 *    budget au moindre drag-and-drop intensif. On les garde en memoire.
 *  - Le merge tolere une entree localStorage sans `agents` — la migration
 *    v1 → v2 n'a rien a nettoyer.
 *
 * Selector rule : chaque selector retourne un scalaire ou une ref stable.
 * Un tableau frais a chaque appel fait boucler useSyncExternalStore. Les
 * formes derivees (listes filtreees, lookups) vivent dans le composant,
 * memoizees. Le pattern a deja fait tomber le bureau en page blanche sur ce
 * projet (cf. historique du fichier).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../agent/characters';
import type { PrivacyMode } from '../agent/voice';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  /** Timestamp — used for the bounded history to drop the oldest first. */
  ts: number;
  text: string;
}

const MAX_HISTORY = 40;

/** Un agent affiche sur le bureau. Les valeurs viennent de /api/agent/roster
 *  mais on en garde une copie locale pour la latence et la disponibilite
 *  hors-ligne. */
export interface AgentSlot {
  id: string;
  name: string;
  description: string;
  personnageId: string;
  /** 'modele' | 'multica' | 'buzz' — lu du roster,modifiable par l'utilisateur. */
  backend: 'modele' | 'multica' | 'buzz';
  /** Le dos est-il disponible en ce moment (cote serveur) ? */
  backendAvailable: boolean;
  provider: string | null;
  buzzModel: string | null;
  multicaAgentId: string | null;
  /** Position bornee a la fenetre (px). */
  position: { x: number; y: number };
  /** Bulle ouverte ou fermee. */
  bubbleOpen: boolean;
  /** Historique borne de cette conversation. */
  history: ChatTurn[];
}

/** Ce que l'utilisateur a choisi pour un agent, et qui doit survivre au
 *  rechargement. Le reste (nom, description, disponibilite) revient du
 *  serveur, qui fait autorite. */
export interface PrefsAgent {
  personnageId?: string;
  backend?: 'modele' | 'multica' | 'buzz';
  position?: { x: number; y: number };
}

export interface AssistantState {
  active: boolean;
  /** LEGACY — persiste pour la migration v1. L'agent effectif est dans `agents`. */
  characterId: string;
  /** LEGACY — position de l'agent unique historique. En v2, les positions
   *  vivent dans `agents[id].position`. */
  position: { x: number; y: number };
  voiceEnabled: boolean;
  /** Nom de la voix SpeechSelectionnee. Null = laisser le navigateur choisir. */
  voiceName: string | null;
  /** Vitesse de lecture. 1.0 = normal. Range 0.5..2.0. */
  voiceRate: number;
  /** Mode de sanitisation avant lecture a voix haute. */
  voicePrivacy: PrivacyMode;
  bubbleOpen: boolean;
  history: ChatTurn[];

  /** Registre des agents affiches. Cle = id d'agent. Les valeurs arrivent
   *  depuis /api/agent/roster et sont mises a jour quand le roster change. */
  agents: Record<string, AgentSlot>;
  /** Ordre d'affichage (clefs dans `agents`). Pour la stabilite du DOM. */
  agentOrder: string[];
  /** Agents REELLEMENT poses sur le bureau.
   *
   *  Distinct de `agentOrder`, qui est le roster complet. Les douze
   *  s'ouvraient tous au demarrage : une foule qui recouvre le bureau alors
   *  qu'on en veut un. On garde donc la selection, et elle est persistee —
   *  c'est le meme geste que la Visibilite du bureau pour les apps. */
  agentsVisibles: string[];
  /** Choix par agent, relus a l'hydratation. */
  agentsPrefs: Record<string, PrefsAgent>;

  setActive: (active: boolean) => void;
  toggleActive: () => void;
  /** LEGACY : bascule l'agent actif sur un sprite. En v2, on garde cet
   *  appel pour la migration douce, mais la vraie edition passe par
   *  setAgentPersonnage(). */
  setCharacter: (id: string) => void;
  setPosition: (x: number, y: number) => void;
  resetPosition: () => void;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceName: (name: string | null) => void;
  setVoiceRate: (rate: number) => void;
  setVoicePrivacy: (mode: PrivacyMode) => void;
  setBubbleOpen: (open: boolean) => void;
  toggleBubble: () => void;

  appendTurn: (turn: ChatTurn) => void;
  clearHistory: () => void;

  /** Charge (ou recharge) le roster depuis le serveur. Les agents inconnus
   *  du serveur sont retires ; les nouveaux sont ajoutes en fin. Les
   *  positions et historiques existants sont preserves. */
  hydraterRoster: (
    entries: Array<{
      id: string;
      name: string;
      description: string;
      personnageId: string;
      backend: 'modele' | 'multica' | 'buzz';
      available: boolean;
      provider: string | null;
      buzzModel: string | null;
      multicaAgentId: string | null;
    }>,
  ) => void;
  /** Pose ou retire un agent du bureau. */
  basculerVisible: (agentId: string) => void;
  /** N'en garder qu'un — le geste « je veux juste celui-la ». */
  seulementVisible: (agentId: string) => void;
  setAgentPersonnage: (agentId: string, personnageId: string) => void;
  setAgentBackend: (agentId: string, backend: 'modele' | 'multica' | 'buzz') => void;
  setAgentPosition: (agentId: string, x: number, y: number) => void;
  setAgentBubbleOpen: (agentId: string, open: boolean) => void;
  toggleAgentBubble: (agentId: string) => void;
  appendAgentTurn: (agentId: string, turn: ChatTurn) => void;
  clearAgentHistory: (agentId: string) => void;
}

const DEFAULT_POSITION = { x: 1180, y: 700 };

/** 12 positions de depart, reparties dans la moitie droite du bureau. Les
 *  sprites font 80-160 px de large, on laisse de la marge. La borne
 *  effective est appliquee au montage et au resize par l'overlay. */
function positionsInitiales(n: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  // Trois colonnes, depart en bas a droite comme la position historique.
  const xs = [1080, 1240, 1400];
  const ys = [180, 320, 460, 600];
  let i = 0;
  for (let y = 0; y < ys.length && out.length < n; y++) {
    for (let x = 0; x < xs.length && out.length < n; x++) {
      out.push({ x: xs[x], y: ys[y] });
      i++;
    }
  }
  return out;
}

const POSITIONS_INITIALES = positionsInitiales(12);

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      active: true,
      characterId: DEFAULT_CHARACTER_ID,
      position: DEFAULT_POSITION,
      voiceEnabled: false,
      voiceName: null,
      voiceRate: 1.0,
      voicePrivacy: 'safe',
      bubbleOpen: false,
      history: [],
      agents: {},
      agentOrder: [],
      agentsVisibles: [],
      agentsPrefs: {},

      setActive: (active) => set({ active }),
      toggleActive: () => set((s) => ({ active: !s.active })),
      setCharacter: (id) => {
        if (!CHARACTERS.some(c => c.id === id)) return;
        set({ characterId: id });
      },
      setPosition: (x, y) => set({ position: { x, y } }),
      resetPosition: () => set({ position: DEFAULT_POSITION }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setVoiceName: (name) => set({ voiceName: name }),
      setVoiceRate: (rate) => {
        const r = Math.max(0.5, Math.min(2.0, rate));
        set({ voiceRate: r });
      },
      setVoicePrivacy: (mode) => {
        if (mode !== 'none' && mode !== 'safe' && mode !== 'strict') return;
        set({ voicePrivacy: mode });
      },
      setBubbleOpen: (open) => set({ bubbleOpen: open }),
      toggleBubble: () => set((s) => ({ bubbleOpen: !s.bubbleOpen })),

      appendTurn: (turn) => set((s) => {
        const next = [...s.history, turn];
        if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
        return { history: next };
      }),
      clearHistory: () => set({ history: [] }),

      hydraterRoster: (entries) => set((s) => {
        const nextAgents: Record<string, AgentSlot> = {};
        const nextOrder: string[] = [];
        for (const e of entries) {
          nextOrder.push(e.id);
          const prec = s.agents[e.id];
          nextAgents[e.id] = {
            id: e.id,
            name: e.name,
            description: e.description,
            personnageId: prec?.personnageId ?? s.agentsPrefs[e.id]?.personnageId ?? e.personnageId,
            backend: prec?.backend ?? s.agentsPrefs[e.id]?.backend ?? e.backend,
            backendAvailable: e.available,
            provider: e.provider,
            buzzModel: e.buzzModel,
            multicaAgentId: e.multicaAgentId,
            // Position : on preserve la position persistee si elle existe,
            // sinon on prend la ieme position initiale.
            position:
              prec?.position ??
              s.agentsPrefs[e.id]?.position ??
              POSITIONS_INITIALES[nextOrder.length - 1] ??
              DEFAULT_POSITION,
            bubbleOpen: prec?.bubbleOpen ?? false,
            history: prec?.history ?? [],
          };
        }
        // Au tout premier demarrage, un seul agent est pose. Ensuite on
        // respecte la selection persistee, en ecartant les agents que le
        // serveur ne connait plus — un id disparu laisserait une case vide.
        const connus = new Set(nextOrder);
        const retenus = s.agentsVisibles.filter((id) => connus.has(id));
        const visibles =
          retenus.length > 0 ? retenus : nextOrder.slice(0, 1);
        return { agents: nextAgents, agentOrder: nextOrder, agentsVisibles: visibles };
      }),

      basculerVisible: (agentId) => set((s) => {
        const dedans = s.agentsVisibles.includes(agentId);
        return {
          agentsVisibles: dedans
            ? s.agentsVisibles.filter((x) => x !== agentId)
            : [...s.agentsVisibles, agentId],
        };
      }),

      seulementVisible: (agentId) => set({ agentsVisibles: [agentId] }),

      setAgentPersonnage: (agentId, personnageId) => set((s) => {
        if (!CHARACTERS.some(c => c.id === personnageId)) return {};
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, personnageId } } };
      }),

      setAgentBackend: (agentId, backend) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, backend } } };
      }),

      setAgentPosition: (agentId, x, y) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, position: { x, y } } } };
      }),

      setAgentBubbleOpen: (agentId, open) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, bubbleOpen: open } } };
      }),

      toggleAgentBubble: (agentId) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, bubbleOpen: !prec.bubbleOpen } } };
      }),

      appendAgentTurn: (agentId, turn) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        const next = [...prec.history, turn];
        if (next.length > MAX_HISTORY) next.splice(0, next.length - MAX_HISTORY);
        return { agents: { ...s.agents, [agentId]: { ...prec, history: next } } };
      }),

      clearAgentHistory: (agentId) => set((s) => {
        const prec = s.agents[agentId];
        if (!prec) return {};
        return { agents: { ...s.agents, [agentId]: { ...prec, history: [] } } };
      }),
    }),
    {
      name: 'coach-os-assistant-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        // LEGACY v1 only — la v2 recharge le roster depuis le serveur.
        active: s.active,
        characterId: s.characterId,
        position: s.position,
        voiceEnabled: s.voiceEnabled,
        voiceName: s.voiceName,
        voiceRate: s.voiceRate,
        voicePrivacy: s.voicePrivacy,
        history: s.history,
        // La selection survit au rechargement — sans quoi le reglage se
        // reperd a chaque ouverture et le geste ne sert a rien.
        agentsVisibles: s.agentsVisibles,
        // Les choix par agent aussi : personnage, dos, position. Le reste
        // (nom, description, disponibilite) revient du serveur.
        agentsPrefs: Object.fromEntries(
          Object.values(s.agents).map((a) => [
            a.id,
            { personnageId: a.personnageId, backend: a.backend, position: a.position },
          ]),
        ),
      }),
      version: 1,

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
        // Le merge valide les champs de la parole : un rate forge peut
        // faire crasher speechSynthesis.voice=, ou pire, parler 50x plus
        // vite. Les voix sanitizer le mode inconnu. voiceName est un
        // simple string — il sera ignore par le hook si la liste de voix
        // ne le contient pas (defense en profondeur).
        const voiceRateValide =
          typeof p.voiceRate === 'number' && Number.isFinite(p.voiceRate) &&
          p.voiceRate >= 0.5 && p.voiceRate <= 2.0
            ? p.voiceRate
            : 1.0;
        const voicePrivacyValide: PrivacyMode =
          p.voicePrivacy === 'none' || p.voicePrivacy === 'safe' || p.voicePrivacy === 'strict'
            ? p.voicePrivacy
            : 'safe';
        return {
          ...courant,
          ...p,
          position: positionValide ? p.position! : DEFAULT_POSITION,
          characterId: personnageValide ? p.characterId! : DEFAULT_CHARACTER_ID,
          voiceRate: voiceRateValide,
          voicePrivacy: voicePrivacyValide,
          history: Array.isArray(p.history) ? p.history.slice(-MAX_HISTORY) : [],
          agentsVisibles: Array.isArray((p as { agentsVisibles?: unknown }).agentsVisibles)
            ? ((p as { agentsVisibles: string[] }).agentsVisibles).filter((x) => typeof x === 'string')
            : [],
          agentsPrefs:
            (p as { agentsPrefs?: unknown }).agentsPrefs &&
            typeof (p as { agentsPrefs?: unknown }).agentsPrefs === 'object'
              ? (p as { agentsPrefs: Record<string, PrefsAgent> }).agentsPrefs
              : {},
        };
      },
    },
  ),
);

// DEV-only handle for Playwright capture scripts.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__coachos = { ...window.__coachos, assistant: useAssistantStore };
}