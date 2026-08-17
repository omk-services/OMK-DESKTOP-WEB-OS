// src/lib/saas-builder/engines/fal.ts
// Engine fal.ai : couvre les 37 routes de capabilities.json (SPEC §2.2).
// V1 : stub honnete. V2 : appel reel via queue.fal.run (cf. generate.py:371).
//
// SPEC §4.2 : c'est l'agregateur principal. Le cout est 'estimated'
// jusqu'a ce que fal retourne le cout final ; on le bascule en 'verified'
// dans le retour si disponible.

import { viteEnvDefinie } from '../../env';
import type { EngineModule, GenerateArgs, Generated } from './types';
import { withTimeout } from './types';

const ENGINE_ID = 'fal';
const ENV_KEY = 'VITE_FAL_KEY';

export const falEngine: EngineModule = {
  id: ENGINE_ID,
  label: 'fal.ai (37 routes)',
  vendor: 'Black Forest Labs + Google + OpenAI + ByteDance + Recraft + Alibaba + Lightricks + Kling',
  output: 'image', // peut etre 'video' ; le caller decide via routeId
  costUsd: 0.039, // moyenne ponderee indicative ; voir capabilities.json
  costConfidence: 'estimated',
  available: () => viteEnvDefinie(ENV_KEY),
  promptHint:
    'Sujet et action en premiere phrase, puis camera, puis style. Sous 120 mots. Chaque engine fal a ses tags : Kling repond au film grammar (35mm, shallow depth of field), Wan aux style tags.',
  async run(args: GenerateArgs, signal: AbortSignal): Promise<Generated> {
    if (!falEngine.available()) {
      throw new Error(
        `fal.ai non disponible : ${ENV_KEY} manquant dans .env. Voir README du kit (bench_studio_ownership_kit).`,
      );
    }
    // SPEC §6.2 : timeout 5s obligatoire sur les fetch externes.
    const { signal: timeoutSignal, cancel } = withTimeout(5000);
    const chained = AbortSignal.any([signal, timeoutSignal]);
    try {
      // V1 : stub. V2 : POST https://queue.fal.run/<endpoint> + poll
      // status_url + response_url (cf. generate.py:380-394).
      // On laisse la signature exacte : un V2 qui respecte ce contrat
      // pourra remplacer cette implementation sans toucher le caller.
      void chained;
      throw new Error(
        `fal engine V1 stub : V2 wired a queue.fal.run pour ${args.routeId}. Prompt : ${args.prompt.slice(0, 80)}...`,
      );
    } finally {
      cancel();
    }
  },
};
