/**
 * AssistantSettings.tsx — the Settings panel for the desktop assistant.
 *
 * Pattern matches the existing Themes / Canvas-FX panels (SectionHead + Card).
 * The picker shows a preview tile per character with the live sprite; the
 * active tile carries a border ring. Two toggles (active, voice) and a
 * position-reset button round out the controls.
 *
 * Perf: each sprite sheet is ~1.3 MB. We mount the SpriteAgent only on
 * first hover (or for the currently active character), so the panel's
 * initial paint doesn't load 12 MB of binary.
 */
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Volume2, Power } from 'lucide-react';
import { SectionHead } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useAssistantStore } from '../../stores/assistant.store';
import { CHARACTERS, getCharacter, type Intent } from '../../agent/characters';
import { SpriteAgent } from '../../agent/SpriteAgent';

interface PreviewTileProps {
  characterId: string;
  isActive: boolean;
  onPick: () => void;
}

function CharacterPreviewTile({ characterId, isActive, onPick }: PreviewTileProps) {
  const ch = getCharacter(characterId);
  const hostRef = useRef<HTMLDivElement>(null);
  // The active tile mounts immediately so the user sees their current
  // character; other tiles mount on first hover to avoid 12× the network.
  const [mounted, setMounted] = useState(isActive);

  useEffect(() => {
    if (mounted) return;
    const el = hostRef.current;
    if (!el) return;
    const onOver = () => setMounted(true);
    el.addEventListener('pointerover', onOver, { once: true });
    return () => el.removeEventListener('pointerover', onOver);
  }, [mounted]);

  // Sync `mounted` if the tile becomes active from outside (e.g. via
  // "Reset position" picking the default character).
  useEffect(() => {
    if (isActive && !mounted) setMounted(true);
  }, [isActive, mounted]);

  if (!ch) return null;
  return (
    <button
      type="button"
      onClick={onPick}
      className={`relative text-left rounded-xl border-2 transition-all p-3 flex flex-col items-center gap-2 ${
        isActive
          ? 'border-[var(--theme-text)] ring-2 ring-[var(--theme-text)]/30'
          : 'border-[var(--panel-border)] hover:border-[var(--theme-text)]/40'
      }`}
      style={{ background: ch.bubble.background }}
      data-character-tile={characterId}
      data-active={isActive}
    >
      <div
        ref={hostRef}
        className="flex items-center justify-center"
        style={{ width: ch.width, height: ch.height, minHeight: ch.height }}
      >
        {mounted && <SpriteAgent character={ch} intent={'idle' as Intent} loop />}
      </div>
      <div className="text-[11px] font-bold text-center" style={{ color: ch.bubble.ink }}>
        {ch.name}
      </div>
      {isActive && (
        <Badge tone="accent">Active</Badge>
      )}
    </button>
  );
}

export function AssistantSettings() {
  const active = useAssistantStore((s) => s.active);
  const setActive = useAssistantStore((s) => s.setActive);
  const characterId = useAssistantStore((s) => s.characterId);
  const setCharacter = useAssistantStore((s) => s.setCharacter);
  const voiceEnabled = useAssistantStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAssistantStore((s) => s.setVoiceEnabled);
  const resetPosition = useAssistantStore((s) => s.resetPosition);

  return (
    <div className="p-7">
      <SectionHead
        title="Desktop assistant"
        subtitle="A friendly sprite that lives on the desktop and answers questions about your workspace"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={active ? 'ok' : 'neutral'}>{active ? 'On' : 'Off'}</Badge>
            <button
              type="button"
              onClick={resetPosition}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--panel-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-[var(--theme-surface-hover)]"
              style={{ color: 'var(--theme-muted)' }}
            >
              <RotateCcw className="w-3 h-3" /> Reset position
            </button>
          </div>
        }
      />

      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Power className="w-4 h-4 text-[var(--theme-muted)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--theme-text)]">Show on desktop</div>
                <div className="text-xs text-[var(--theme-muted)]">The sprite always sits on the wallpaper. Click it to open the bubble.</div>
              </div>
            </div>
            <Toggle on={active} onClick={() => setActive(!active)} />
          </div>

          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-[var(--theme-muted)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--theme-text)]">Read out loud</div>
                <div className="text-xs text-[var(--theme-muted)]">Speak the assistant's reply with the browser's voice. Off by default.</div>
              </div>
            </div>
            <Toggle on={voiceEnabled} onClick={() => setVoiceEnabled(!voiceEnabled)} />
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <SectionHead
          title="Choose your character"
          subtitle="12 Microsoft-Office-era sprites. Hover a tile to preview."
          action={<Badge tone="accent">{CHARACTERS.length} sprites</Badge>}
        />
        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {CHARACTERS.map((c) => (
              <CharacterPreviewTile
                key={c.id}
                characterId={c.id}
                isActive={characterId === c.id}
                onPick={() => setCharacter(c.id)}
              />
            ))}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-[11px] text-[var(--theme-muted)] leading-relaxed">
        The sprite loads its <code>agent.json</code> + <code>map.png</code> lazily on hover. All physics
        happen in your browser — no round-trip to a server. The chat bubble lives behind
        <code> POST /api/chat</code> (MiniMax-M3 by default).
      </p>
    </div>
  );
}
