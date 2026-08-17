// src/lib/saas-builder/engines/kling.ts
// Engine Kling : direct via api-singapore.klingai.com, JWT auth.
// SPEC §4.2. Cf. generate.py:298 (run_kling_direct) et generate.py:281
// (_kling_jwt, HS256 hand-rolled).

import { viteEnvDefinie } from '../../env';
import type { EngineModule } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'kling';
const ENV_KEYS = ['VITE_KLING_ACCESS_KEY', 'VITE_KLING_SECRET_KEY'] as const;

export const klingEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'Kling (direct, JWT)',
  vendor: 'Kling',
  output: 'video',
  costUsd: 0.35,
  costConfidence: 'estimated',
  available: () => ENV_KEYS.every((k) => viteEnvDefinie(k)),
  promptHint:
    'Film grammar : 35mm, shallow depth of field. Camera, action, style. Sous 120 mots.',
  async run(args, signal) {
    if (!klingEngine.available()) {
      throw new Error(
        `Kling non disponible : ${ENV_KEYS.join(' et ')} manquants dans .env.`,
      );
    }
    const { signal: tSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, tSignal]);
    try {
      void chained;
      throw new Error(
        `kling engine V1 stub : V2 wired api-singapore.klingai.com + JWT HS256 pour ${args.routeId}.`,
      );
    } finally {
      cancel();
    }
  },
};
