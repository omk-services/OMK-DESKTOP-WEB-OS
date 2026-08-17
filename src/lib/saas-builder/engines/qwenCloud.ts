// src/lib/saas-builder/engines/qwenCloud.ts
// Engine Qwen Cloud : qwen-image + wan direct (DashScope intl).
// SPEC §4.2. Cf. generate.py:213 (qwen-image) et generate.py:243 (wan direct).

import type { EngineModule } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'qwen-cloud';
const ENV_KEYS = ['VITE_QWEN_CLOUD_API_KEY', 'VITE_DASHSCOPE_API_KEY'] as const;

export const qwenCloudEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'Qwen Cloud (qwen-image + wan direct)',
  vendor: 'Alibaba',
  output: 'image',
  costUsd: 0.03,
  costConfidence: 'verified',
  available: () => ENV_KEYS.some((k) => Boolean(import.meta.env[k])),
  promptHint:
    'Image poster-style, rendu de texte fort. Specifique au modele qwen-image-3.0.',
  async run(args, signal) {
    if (!qwenCloudEngine.available()) {
      throw new Error(
        `Qwen Cloud non disponible : ${ENV_KEYS.join(' ou ')} manquant dans .env.`,
      );
    }
    const { signal: tSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, tSignal]);
    try {
      void chained;
      throw new Error(
        `qwen-cloud engine V1 stub : V2 wired DashScope multimodal-generation pour ${args.routeId}.`,
      );
    } finally {
      cancel();
    }
  },
};
