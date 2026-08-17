// src/lib/saas-builder/engines/minimax.ts
// Engine MiniMax : hailuo direct via platform.minimax.io.
// SPEC §4.2. Cf. generate.py:178 (run_minimax_direct).
// Regle de precedence (SPEC §2.2, generate.py:351) : si MiniMax direct
// ET fal sont dispos, MiniMax direct gagne ($0.25/clip vs $0.28).

import { viteEnvDefinie } from '../../env';
import type { EngineModule } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'minimax';
const ENV_KEY = 'VITE_MINIMAX_API_KEY';

export const minimaxEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'MiniMax (hailuo direct)',
  vendor: 'MiniMax',
  output: 'video',
  costUsd: 0.25,
  costConfidence: 'verified',
  available: () => viteEnvDefinie(ENV_KEY),
  promptHint:
    'Physical verbs. Motion expressive, realisme physique a petit budget. 6s, 768P par defaut.',
  async run(args, signal) {
    if (!minimaxEngine.available()) {
      throw new Error(`MiniMax non disponible : ${ENV_KEY} manquant dans .env.`);
    }
    const { signal: tSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, tSignal]);
    try {
      void chained;
      throw new Error(
        `minimax engine V1 stub : V2 wired platform.minimax.io video_generation pour ${args.routeId}.`,
      );
    } finally {
      cancel();
    }
  },
};
