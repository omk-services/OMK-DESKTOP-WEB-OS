/**
 * SpriteAgent.tsx — the sprite engine.
 *
 * Loads one agent.json + one map.png, advances through the requested animation
 * frame by frame, stacking `overlayCount` background-positioned layers so
 * multi-layer characters (Merlin/Genie/Peedy = 3 layers) render correctly.
 *
 * Design choices
 * - Lazy: agent.json + map.png only fetch when a character is mounted. Each
 *   sprite sheet is ~1.3 MB compressed + the JSON manifest; preloading all 12
 *   would burn 16 MB of bandwidth on first paint for nothing.
 * - Renders nothing while the manifest is in flight (avoids a "pop in" of
 *   frame 0 at the wrong position).
 * - All timing goes through a single setTimeout chain. The chain is cancelled
 *   on unmount and on animation change, so a region switch mid-gesture does
 *   not leave a stray timer in the event loop.
 * - Branching is probabilistic: weights are normalised to 100, the RNG rolls
 *   an integer 0..99, and the result is the next frame index. Misses fall
 *   back to the natural sequence follow-up.
 * - A frame with no `images` is intentionally blank — the engine hides that
 *   layer for the frame's duration. This is how characters materialise
 *   (entry animations start with empty frames).
 */
import { useEffect, useRef, useState } from 'react';
import {
  type AgentManifest,
  type CharacterDef,
  type Intent,
  pickAnimation,
  pickIdleAnimation,
} from './characters';

interface SpriteAgentProps {
  character: CharacterDef;
  intent: Intent;
  /** Loop the animation if it ends naturally. Default true (idle behaviour).
   *  One-shot animations (greeting, error) set this to false. */
  loop?: boolean;
  /** Called when a non-looping animation finishes. */
  onFinished?: () => void;
}

// Module-scope cache: re-using the same manifest across re-mounts saves one
// network round-trip per character per session. Keys are assetBase URLs.
const manifestCache = new Map<string, Promise<AgentManifest>>();
function fetchManifest(assetBase: string): Promise<AgentManifest> {
  const cached = manifestCache.get(assetBase);
  if (cached) return cached;
  const p = fetch(`${assetBase}/agent.json`, { cache: 'force-cache' })
    .then(r => {
      if (!r.ok) throw new Error(`agent.json ${assetBase} HTTP ${r.status}`);
      return r.json() as Promise<AgentManifest>;
    });
  manifestCache.set(assetBase, p);
  return p;
}

export function SpriteAgent({ character, intent, loop = true, onFinished }: SpriteAgentProps) {
  const [manifest, setManifest] = useState<AgentManifest | null>(null);
  const [frame, setFrame] = useState(0);
  const [animName, setAnimName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Refs mirror state without re-triggering effects — the timer needs the
  // latest value but shouldn't re-bind on every frame advance.
  const manifestRef = useRef<AgentManifest | null>(null);
  const animNameRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  // Load the manifest when the character changes.
  useEffect(() => {
    cancelledRef.current = false;
    setLoadError(null);
    setFrame(0);
    setAnimName(null);
    // Le manifeste aussi doit repartir a zero. Sans ca, en changeant de
    // personnage on garde celui du precedent pendant que le nouveau charge, et
    // le rendu tente de lire une animation de Clippy dans le manifeste de
    // Merlin — qui ne l'a pas.
    setManifest(null);
    manifestRef.current = null;
    animNameRef.current = null;
    fetchManifest(character.assetBase)
      .then(m => {
        if (cancelledRef.current) return;
        manifestRef.current = m;
        setManifest(m);
      })
      .catch(err => {
        if (cancelledRef.current) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelledRef.current = true;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [character.assetBase]);

  // When the manifest arrives OR the intent changes, pick the right animation
  // and reset to frame 0. Skipping this on every frame is what would otherwise
  // re-trigger the timer effect and cause infinite loops.
  useEffect(() => {
    if (!manifest) return;
    const chosen = pickAnimation(intent, character.intentMap, manifest) ?? pickIdleAnimation(manifest);
    if (!chosen) {
      animNameRef.current = null;
      setAnimName(null);
      return;
    }
    if (animNameRef.current !== chosen) {
      animNameRef.current = chosen;
      setAnimName(chosen);
      setFrame(0);
    }
  }, [manifest, intent, character.intentMap]);

  // The frame ticker. Re-bound whenever the animation mtimes (new intent or
  // new manifest) — that's the correct granularity: a frame advance should
  // not cancel/restart the timer.
  useEffect(() => {
    if (!manifest || !animName) return;
    const anim = manifest.animations[animName];
    if (!anim || anim.frames.length === 0) return;

    let cancelled = false;
    const tick = (i: number) => {
      if (cancelled) return;
      let f = anim.frames[i];
      if (!f) {
        if (loop) { setFrame(0); i = 0; f = anim.frames[0]; }
        else { onFinished?.(); return; }
      }
      if (!f) return; // animation has zero frames — already filtered above, but be defensive.
      // Probabilistic branching — applies when the frame advertises one.
      // If the branch references an out-of-range frame, just continue.
      let nextIndex = i + 1;
      if (f.branching && f.branching.branches.length > 0) {
        const total = f.branching.branches.reduce((s, b) => s + b.weight, 0);
        if (total > 0) {
          let roll = Math.random() * total;
          for (const b of f.branching.branches) {
            roll -= b.weight;
            if (roll <= 0) {
              if (b.frameIndex >= 0 && b.frameIndex < anim.frames.length) {
                nextIndex = b.frameIndex;
              }
              break;
            }
          }
        }
      }
      // `exitBranch` n'est PAS un saut de sequence.
      //
      // Dans le format Microsoft Agent, c'est le chemin de SORTIE : la frame
      // vers laquelle aller quand on demande a l'animation de s'interrompre
      // proprement, pour qu'elle se termine sur une pose nette au lieu d'etre
      // coupee net. clippy.js ne le suit que lorsqu'il est en train de sortir.
      //
      // L'appliquer a chaque frame fige le personnage : la frame 0 de l'idle de
      // Merlin porte `exitBranch: 23`, la 23 renvoie en arriere, et le sprite ne
      // bouge plus d'un pixel. Mesure a l'appui — une seule position distincte
      // sur dix secondes.
      //
      // On le garde donc pour plus tard (une sortie propre au changement de
      // personnage), mais on ne le suit pas dans le cours normal.
      const dur = Math.max(1, f.duration);
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setFrame(i);
        tick(nextIndex);
      }, dur);
    };

    // Kick off: show frame 0 immediately. For multi-frame animations, schedule
    // the advance to frame 1 (or the branched-from-frame-0 target). For
    // single-frame animations (e.g. RestPose), nothing to schedule — the
    // frame holds for the rest of the session.
    setFrame(0);
    if (anim.frames.length > 1) {
      const f0 = anim.frames[0];
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        tick(1);
      }, Math.max(1, f0.duration));
    } else if (!loop && anim.frames.length === 1) {
      // length === 1 and not looping — fire onFinished after the duration.
      const f0 = anim.frames[0];
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        onFinished?.();
      }, Math.max(1, f0.duration));
    }

    return () => {
      cancelled = true;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [manifest, animName, loop, onFinished]);

  // Render: a stack of `overlayCount` layers, each carrying the sprite sheet
  // as a background and shifted to the frame's coordinate on layer N.
  if (loadError) {
    return (
      <div
        title={loadError}
        style={{ width: character.width, height: character.height, display: 'grid', placeItems: 'center', fontSize: 10, color: '#a16207' }}
      >
        !
      </div>
    );
  }
  if (!manifest || !animName) {
    // Reserve the footprint so the parent layout doesn't shift when the
    // sprite appears. Same width/height as the character but transparent.
    return <div style={{ width: character.width, height: character.height }} aria-hidden />;
  }

  // `animName` et `manifest` sont poses par DEUX effets distincts : entre les
  // deux, un rendu peut voir le nouveau manifeste avec l'ancien nom d'animation.
  // Les personnages n'ont pas le meme repertoire — « Greeting » existe chez
  // Clippy, pas chez Merlin — et `anim` est alors indefini. Sans ce garde, tout
  // le bureau tombe en page blanche au changement de personnage.
  const anim = manifest.animations[animName];
  if (!anim || anim.frames.length === 0) {
    return <div style={{ width: character.width, height: character.height }} aria-hidden />;
  }
  const f = anim.frames[frame] ?? anim.frames[0];
  const layers = manifest.overlayCount;
  const [fw, fh] = manifest.framesize;
  // Container + each layer measure `framesize`. Center the character within
  // its full declared bounds so multi-layer characters (where layers may
  // draw outside the sprite tile) stay aligned with the bubble.
  const offsetX = (character.width - fw) / 2;
  const offsetY = (character.height - fh) / 2;
  const boxStyle = {
    width: character.width,
    height: character.height,
    position: 'relative' as const,
  };
  const layerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: fw,
    height: fh,
    backgroundImage: `url(${character.assetBase}/map.png)`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    pointerEvents: 'none',
  };

  return (
    <div style={boxStyle} aria-hidden data-sprite={character.id} data-anim={animName}>
      {Array.from({ length: layers }).map((_, layerIdx) => {
        const coords = f?.images?.[layerIdx];
        if (!coords) return null; // empty frame on this layer — hide it
        const [x, y] = coords;
        return (
          <div
            key={layerIdx}
            style={{
              ...layerBaseStyle,
              left: offsetX,
              top: offsetY,
              backgroundPosition: `-${x}px -${y}px`,
            }}
          />
        );
      })}
    </div>
  );
}
