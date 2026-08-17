// src/lib/saas-builder/engines/index.ts
// Registry des engines : liste ordonnee + dispatch par routeId.
//
// SPEC §4.2. L'UI iterre sur `engines()` pour la sidebar Models ; le
// ledger / le builder appellent `engineForRoute(routeId)` pour trouver
// le bon engine.
//
// PREFERENCE (SPEC §2.2, generate.py:351) : MiniMax direct bat fal.ai
// quand les deux sont dispos. Applique ici au dispatch : si la route
// est 'fal-hailuo' ET MiniMax est dispo, on retourne MiniMax.

import type { EngineModule } from './types';
import { falEngine } from './fal';
import { googleEngine } from './google';
import { openaiEngine } from './openai';
import { qwenCloudEngine } from './qwenCloud';
import { klingEngine } from './kling';
import { minimaxEngine } from './minimax';

/** Ordre d'affichage dans la sidebar : agregateur principal d'abord,
 *  puis providers directes. SPEC §2.2 (ordre editorial). */
export const ENGINES: readonly EngineModule[] = [
  falEngine,       // 37 routes, agregateur principal
  googleEngine,    // gemini-image + veo
  openaiEngine,    // gpt-image
  qwenCloudEngine, // qwen-image + wan direct
  minimaxEngine,   // hailuo direct, bat fal si present (precedence)
  klingEngine,     // kling direct
] as const;

/** Liste a plat pour l'UI : id + label + vendor + output + cost + available. */
export interface EngineSummary {
  id: string;
  label: string;
  vendor: string;
  output: 'image' | 'video';
  costUsd: number;
  costConfidence: 'verified' | 'estimated';
  available: boolean;
  promptHint: string;
}

export function engines(): EngineSummary[] {
  return ENGINES.map((e) => ({
    id: e.id,
    label: e.label,
    vendor: e.vendor,
    output: e.output,
    costUsd: e.costUsd,
    costConfidence: e.costConfidence,
    available: e.available(),
    promptHint: e.promptHint,
  }));
}

/** Trouve l'engine adapte pour une route fal.ai (SPEC §2.2). V1 : on
 *  retourne toujours `fal` car les 37 routes fal.ai sont couvertes par
 *  ce seul engine. V2 : switch sur le prefix de routeId pour
 *  basculer vers MiniMax/Kling si la cle directe est dispo. */
export function engineForRoute(routeId: string): EngineModule | undefined {
  // Regle de precedence V2 : si routeId commence par 'fal-hailuo' ET
  // MiniMax direct dispo, on prefere MiniMax (moins cher).
  if (routeId.startsWith('fal-hailuo') && minimaxEngine.available()) {
    return minimaxEngine;
  }
  // Idem fal-wan : Qwen Cloud direct si dispo.
  if (routeId.startsWith('fal-wan') && qwenCloudEngine.available()) {
    return qwenCloudEngine;
  }
  // Idem fal-kling : Kling direct si dispo.
  if (routeId.startsWith('fal-kling') && klingEngine.available()) {
    return klingEngine;
  }
  // Defaut : fal.ai couvre toutes les autres routes.
  return ENGINES.find((e) => e.id === 'fal');
}

/** Pour les tests : reset du module entre runs (Zustand-style). */
export function _resetForTests(): void {
  // Rien a reset pour V1 (les engines sont stateless).
}
