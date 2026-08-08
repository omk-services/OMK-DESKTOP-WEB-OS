/**
 * VoiceWave.tsx — indicateur visuel de l'etat vocal.
 *
 * Trois modes :
 *  - listening : barres animees qui montent et descendent, comme la demo
 *    Palantir. Indique que le micro est ouvert et que l'agent ecoute.
 *  - speaking : barres plus hautes et plus stables, le personnage parle.
 *  - idle : rien, ou un point discret.
 *
 * Indicateur d'etat, pas une decoration : un micro ouvert sans signal
 * est inacceptable chez un avocat ou un comptable. La forme en barres
 * verticales se lit d'un coup d'oeil, comme les LED d'un equaliseur.
 */
import { useEffect, useState } from 'react';

interface VoiceWaveProps {
  state: 'idle' | 'listening' | 'speaking';
  /** Couleur des barres (bord de la bulle par defaut). */
  color?: string;
  /** Taille en pixels. Petit : 24px dans la bulle. Plus grand : 56px a cote. */
  size?: 'sm' | 'md';
}

const BARS = 4;
const MIN_H = 0.25;
const MAX_H = 1.0;

export function VoiceWave({ state, color = '#1d4ed8', size = 'sm' }: VoiceWaveProps) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: BARS }, () => MIN_H));

  useEffect(() => {
    if (state === 'idle') {
      setHeights(Array.from({ length: BARS }, () => MIN_H));
      return;
    }
    let raf = 0;
    const tick = () => {
      setHeights(
        Array.from({ length: BARS }, (_, i) => {
          // Phase decalee par barre : la i-ieme est en avance de i*PI/4.
          const t = performance.now() / 240;
          const base = state === 'speaking' ? 0.55 : 0.4;
          const amp = state === 'speaking' ? 0.35 : 0.45;
          const phase = (i * Math.PI) / 3;
          const v = base + amp * Math.sin(t + phase);
          return Math.max(MIN_H, Math.min(MAX_H, v));
        }),
      );
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [state]);

  if (state === 'idle') return null;

  const barW = size === 'sm' ? 2.5 : 4;
  const gap = size === 'sm' ? 2 : 3;
  const totalW = BARS * barW + (BARS - 1) * gap;
  const maxBarH = size === 'sm' ? 14 : 28;

  return (
    <div
      role="status"
      aria-label={state === 'listening' ? 'Micro ouvert' : 'L\'agent parle'}
      data-voice-wave={state}
      className="inline-flex items-center justify-center"
      style={{ width: totalW, height: maxBarH }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: barW,
            marginRight: i === BARS - 1 ? 0 : gap,
            height: `${Math.round(h * maxBarH)}px`,
            background: color,
            borderRadius: 1,
            transition: 'height 60ms linear',
            opacity: state === 'speaking' ? 1 : 0.85,
          }}
        />
      ))}
    </div>
  );
}