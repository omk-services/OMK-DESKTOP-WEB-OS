/**
 * characters.ts — sprite registry for the desktop assistant.
 *
 * Each entry pins an id + display name + the two files on disk (map.png is the
 * packed sprite sheet, agent.json is the frame manifest) + two bubble colors
 * (a pastel background and a darker border of the same hue).
 *
 * Intent → animation mapping is per-character because the Microsoft-Office
 * agents don't share an animation vocabulary. The resolver picks the FIRST
 * candidate each character actually owns, so the keys stay declarative even
 * though the underlying animation names differ widely between agents.
 *
 * Extension point: adding a new character is two artefacts on disk + one
 * entry here. The sprite engine itself reads `overlayCount` and the
 * `framesize` from the agent's own JSON, so no engine code needs to change.
 */
export type Intent = 'entree' | 'thinking' | 'speaking' | 'success' | 'error' | 'idle' | 'bye';

export interface CharacterDef {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Pastel bubble background + matching darker border. */
  bubble: { background: string; border: string; ink: string };
  assetBase: string; // e.g. /assets/assistant/clippy
  /**
   * Per-intent list of candidate animation names. Order = preference.
   * First one that exists on the character wins.
   */
  intentMap: Record<Intent, string[]>;
}

/**
 * Candidate lists come straight from the brief. Kept here so the engine has
 * a single source of truth and we can lint-grep when a character's vocabulary
 * drifts in the assets.
 */
const INTENT_CANDIDATES: Record<Intent, string[]> = {
  entree: ['Greeting', 'Show', 'Appear', 'Entrance', 'Greet'],
  thinking: ['Thinking', 'Think', 'Processing', 'CheckingSomething'],
  speaking: ['Explain', 'Speaking', 'GestureRight', 'Announce'],
  success: ['Congratulate', 'Pleased', 'Acknowledge'],
  error: ['Alert', 'Confused', 'DoMagic1'],
  idle: ['Idle'],
  bye: ['GoodBye', 'Goodbye', 'Hide'],
};

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'clippy', name: 'Clippy', width: 124, height: 93,
    bubble: { background: '#dbeafe', border: '#1d4ed8', ink: '#1e3a8a' },
    assetBase: '/assets/assistant/clippy',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'links', name: 'Links', width: 124, height: 93,
    bubble: { background: '#ecfccb', border: '#4d7c0f', ink: '#365314' },
    assetBase: '/assets/assistant/links',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'rover', name: 'Rover', width: 80, height: 80,
    bubble: { background: '#dcfce7', border: '#15803d', ink: '#14532d' },
    assetBase: '/assets/assistant/rover',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'merlin', name: 'Merlin', width: 128, height: 128,
    bubble: { background: '#ede9fe', border: '#6d28d9', ink: '#4c1d95' },
    assetBase: '/assets/assistant/merlin',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'genie', name: 'Genie', width: 128, height: 128,
    bubble: { background: '#ccfbf1', border: '#0f766e', ink: '#134e4a' },
    assetBase: '/assets/assistant/genie',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'peedy', name: 'Peedy', width: 160, height: 128,
    bubble: { background: '#fef9c3', border: '#a16207', ink: '#713f12' },
    assetBase: '/assets/assistant/peedy',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'genius', name: 'Genius', width: 124, height: 93,
    bubble: { background: '#fde68a', border: '#b45309', ink: '#78350f' },
    assetBase: '/assets/assistant/genius',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'rocky', name: 'Rocky', width: 124, height: 93,
    bubble: { background: '#fed7aa', border: '#c2410c', ink: '#7c2d12' },
    assetBase: '/assets/assistant/rocky',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'f1', name: 'F1', width: 124, height: 93,
    bubble: { background: '#e2e8f0', border: '#475569', ink: '#1e293b' },
    assetBase: '/assets/assistant/f1',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'officelogo', name: 'Office Logo', width: 124, height: 93,
    bubble: { background: '#cffafe', border: '#0e7490', ink: '#164e63' },
    assetBase: '/assets/assistant/officelogo',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'saeko', name: 'Saeko', width: 98, height: 115,
    bubble: { background: '#fce7f3', border: '#be185d', ink: '#831843' },
    assetBase: '/assets/assistant/saeko',
    intentMap: INTENT_CANDIDATES,
  },
  {
    id: 'monkeyking', name: 'Monkey King', width: 124, height: 93,
    bubble: { background: '#ffedd5', border: '#c2410c', ink: '#7c2d12' },
    assetBase: '/assets/assistant/monkeyking',
    intentMap: INTENT_CANDIDATES,
  },
];

export function getCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export const DEFAULT_CHARACTER_ID = 'clippy';

// ────────────────────────────────────────────────────────────────────────────
// Manifest types — narrower than the raw JSON, just what the engine reads.
// ────────────────────────────────────────────────────────────────────────────

export interface Frame {
  duration: number;
  /** One [x, y] pair per overlay layer, sourced from agent.json. May be
   *  missing — a frame with no `images` is intentionally blank, the engine
   *  hides that layer for the frame's duration. */
  images?: [number, number][];
  /** If set, jump to frameIndex at the end of this frame (one-shot exit). */
  exitBranch?: number;
  /** Probabilistic branching — `weight` is on a 0-100 scale. */
  branching?: { branches: Array<{ frameIndex: number; weight: number }> };
}

export interface Animation {
  frames: Frame[];
}

export interface AgentManifest {
  framesize: [number, number];
  overlayCount: number;
  animations: Record<string, Animation>;
}

/** Resolve the first candidate animation name that the manifest actually owns.
 *  Returns undefined if none match (the engine falls back to idle). */
export function pickAnimation(
  intent: Intent,
  intentMap: CharacterDef['intentMap'],
  manifest: AgentManifest,
): string | undefined {
  const candidates = intentMap[intent] ?? [];
  for (const name of candidates) {
    if (manifest.animations[name]) return name;
  }
  return undefined;
}

/** Returns the first idle animation (anything starting with "Idle") or the
 *  legacy single "Idle" name. */
export function pickIdleAnimation(manifest: AgentManifest): string | undefined {
  const names = Object.keys(manifest.animations);
  // Prefer the canonical variants Claude/RyOS use.
  const idle = names.filter(n => n.startsWith('Idle'));
  if (idle.length > 0) return idle[0];
  if (manifest.animations['Idle']) return 'Idle';
  return undefined;
}
