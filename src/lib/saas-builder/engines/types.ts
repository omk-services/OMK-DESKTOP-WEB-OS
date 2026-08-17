// src/lib/saas-builder/engines/types.ts
// Contrat commun pour les 6 modules d'engine (google, openai, fal,
// qwenCloud, kling, minimax). Cf. SPEC §4.2.
//
// POURQUOI UN CONTRAT UNIQUE :
//   - Chaque engine a la meme forme : on lui donne un prompt + un
//     signal d'annulation, il rend un fichier + un cout.
//   - L'UI builder itere sur le registry pour lister les engines
//     disponibles, sans special-case par provider.
//   - Le ledger est agnostique : il appelle `run()` et recoit un
//     `{ costUsd, costConfidence }` peu importe l'engine.
//
// ABORT :
//   - Chaque appel prend un `AbortSignal`. Timeout 5s obligatoire sur
//     les fetch (cf. SPEC §6.2). Pas de retry silencieux.

export type CostConfidence = 'verified' | 'estimated';

/** Les arguments que tous les engines acceptent en V1. */
export interface GenerateArgs {
  /** Prompt refine (sortie du workhorse gemini-3-flash en V1). */
  prompt: string;
  /** Identifiant de la route (ex. 'fal-ai/veo3.1/fast'). */
  routeId: string;
  /** Output dir : tous les engines ecrivent ici. */
  outDir: string;
}

/** Le resultat d'un engine. */
export interface Generated {
  /** Chemin du fichier produit (image ou video). */
  outputPath: string;
  /** Cout reellement facture, USD. Granularite 0.001. */
  costUsd: number;
  /** 'verified' si le provider a retourne le cout final, 'estimated'
   *  sinon (cf. SPEC §2.4 et Ledger.jsx:11 du repo Bench Studio). */
  costConfidence: CostConfidence;
  /** ID de l'appel provider (pour audit). Optionnel. */
  requestId?: string;
}

/** Forme canonique d'un engine. Chaque module exporte un objet
 *  conforme a cette interface. */
export interface EngineModule {
  /** Identifiant unique, sert de cle dans le registry. */
  id: string;
  /** Nom lisible, affiche dans la sidebar Models. */
  label: string;
  /** Vendor ('Black Forest Labs', 'Google', 'OpenAI', ...). */
  vendor: string;
  /** Modality. */
  output: 'image' | 'video';
  /** Cout par generation, USD. Lu depuis capabilities.json ou la
   *  table du kit. */
  costUsd: number;
  /** Indication de confiance : 'verified' = provider confirme, 'estimated'
   *  = cout catalogue sans retour du provider. */
  costConfidence: CostConfidence;
  /** Indique si la cle d'env requise est disponible. */
  available: () => boolean;
  /** Genere un fichier selon args. Throw si non disponible ou si
   *  l'appel provider echoue. */
  run: (args: GenerateArgs, signal: AbortSignal) => Promise<Generated>;
  /** Conseil de prompt refinement, inspire du kit SKILL.md:46. */
  promptHint: string;
}

/** Helper : AbortController avec timeout dur de 5s. SPEC §6.2. */
export function withTimeout(ms = 5000): { signal: AbortSignal; cancel: () => void } {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(new Error('timeout')), ms);
  return {
    signal: ctl.signal,
    cancel: () => clearTimeout(id),
  };
}
