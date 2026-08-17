// src/lib/saas-builder/engines/openai.ts
// Engine OpenAI : gpt-image (OpenAI.images.generate).
// SPEC §4.2. Cf. generate.py:132.

import type { EngineModule } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'openai';
const ENV_KEY = 'VITE_OPENAI_API_KEY';

export const openaiEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'OpenAI (gpt-image)',
  vendor: 'OpenAI',
  output: 'image',
  costUsd: 0.04,
  costConfidence: 'verified',
  available: () => Boolean(import.meta.env[ENV_KEY]),
  promptHint:
    'Precis, instruction-like. Sujet et layout en premier, puis attributs. Suit litteralement les instructions spatiales.',
  async run(args, signal) {
    if (!openaiEngine.available()) {
      throw new Error(`OpenAI non disponible : ${ENV_KEY} manquant dans .env.`);
    }
    const { signal: tSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, tSignal]);
    try {
      void chained;
      throw new Error(
        `openai engine V1 stub : V2 wired OpenAI.images.generate pour ${args.routeId}.`,
      );
    } finally {
      cancel();
    }
  },
};
