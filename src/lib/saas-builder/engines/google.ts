// src/lib/saas-builder/engines/google.ts
// Engine Google : gemini-image + veo (genai.Client).
// SPEC §4.2. Cf. generate.py:113 (gemini-image) et generate.py:151 (veo).
// V1 : stub. V2 : client.models.generate_content / generate_videos.

import { viteEnvDefinie } from '../../env';
import type { EngineModule } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'google';
const ENV_KEY = 'VITE_GOOGLE_API_KEY';

export const googleEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'Google (gemini-image + veo)',
  vendor: 'Google',
  output: 'image', // veo est 'video', determine par routeId
  costUsd: 0.039,
  costConfidence: 'verified', // genai retourne le cout exact
  available: () => viteEnvDefinie(ENV_KEY),
  promptHint:
    'Paragraphe descriptif dense. Sujet, composition, eclairage, lentille, palette, mood, style reference. Gemini recompense la densite. Si du texte doit apparaitre dans l\'image, le citer exactement.',
  async run(args, signal) {
    if (!googleEngine.available()) {
      throw new Error(`Google non disponible : ${ENV_KEY} manquant dans .env.`);
    }
    const { signal: tSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, tSignal]);
    try {
      void chained;
      throw new Error(
        `google engine V1 stub : V2 wired genai.Client.models.generate_content pour ${args.routeId}.`,
      );
    } finally {
      cancel();
    }
  },
};
