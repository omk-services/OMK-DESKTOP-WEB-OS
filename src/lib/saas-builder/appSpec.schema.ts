// src/lib/saas-builder/appSpec.schema.ts
// Schema Zod de l'AppSpec produit par le SaaS builder et consomme par
// App Store / ThreeProgram. Cf. SPEC §4.1.
//
// POURQUOI UN SCHEMA SEPARE :
//   - L'AppSpec est le format qu'App Store accepte pour publier une
//     nouvelle app. Il est l'interface entre le builder et le reste
//     du systeme.
//   - La validation Zod est faite UNE fois ici. Tout consommateur
//     (ThreeProgram, App Store publish, MCP tool) peut reutiliser
//     `parseAppSpec` sans reimplementer la validation.
//   - Le type `AppSpec` est derive via `z.infer`, donc le schema est
//     l'unique source de verite.
//
// CONVERSION VERS ThreeApp :
//   `appSpecToThreeApp` mappe un AppSpec valide vers le format
//   `ThreeApp` deja utilise par App Store (cf. threeApp.store.ts).
//   Pour V1, on ne supporte que level='easy' (iframeUrl). Les autres
//   levels donnent une erreur explicite -- c'est une feature V2.

import { z } from 'zod';

// Le slug : kebab-case, 1-63 chars, commence par [a-z0-9].
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
// Semver strict : X.Y.Z, pas de pre-release ni de build metadata.
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
// Couleur hex 6 chars.
const HEX_RE = /^#[0-9a-f]{6}$/;

export const AppSpecSchema = z.object({
  slug: z.string().regex(SLUG_RE, 'slug doit etre kebab-case (1-63 chars)'),
  name: z.string().min(1).max(64),
  version: z.string().regex(SEMVER_RE, 'version doit etre semver X.Y.Z'),
  level: z.enum(['easy', 'hard', 'expert']),
  category: z.string().min(1).max(32),
  description: z.string().max(280).optional(),
  // inputs et outputs sont des records : la cle est un nom de champ /
  // un mime type, la valeur est le schema ou la ref. On accepte
  // z.unknown() car la forme precise depend de l'app ; le consumer
  // valide plus finement s'il en a besoin.
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.string().url()),
  uiHint: z.object({
    layout: z.enum(['window', 'sidebar', 'fullscreen']),
    accent: z.string().regex(HEX_RE).optional(),
  }),
  modelHints: z
    .object({
      routeId: z.string().optional(),
      refinedPrompt: z.string().optional(),
    })
    .optional(),
});

export type AppSpec = z.infer<typeof AppSpecSchema>;

/** Valide un objet inconnu comme AppSpec. Une seule passe, un seul endroit. */
export function parseAppSpec(raw: unknown):
  | { ok: true; spec: AppSpec }
  | { ok: false; error: string } {
  const r = AppSpecSchema.safeParse(raw);
  if (!r.success) {
    const issues = r.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return { ok: false, error: `Invalid AppSpec: ${issues}` };
  }
  return { ok: true, spec: r.data };
}

/**
 * Forme d'un ThreeApp (cf. threeApp.store.ts:28).
 * Declare ici pour eviter une dependance circulaire avec threeApp.store.
 */
export interface ThreeAppShape {
  slug: string;
  name: string;
  category: string;
  level: 'easy' | 'hard' | 'expert';
  iframeUrl?: string;
  codeSource?: string;
  bundleUrl?: string;
  installedAt: string;
}

/**
 * Mappe un AppSpec vers un ThreeApp pour publication dans App Store.
 * V1 : seul `level: 'easy'` est supporte (le builder ne genere pas
 * encore de code three.js runtime ni de bundle signe). Les autres
 * levels retournent une erreur explicite -- le caller decide ce qu'il
 * en fait (message dans l'UI, pas d'installation silencieuse).
 */
export function appSpecToThreeApp(spec: AppSpec): ThreeAppShape {
  if (spec.level !== 'easy') {
    throw new Error(
      `AppSpec level='${spec.level}' non supporte en V1. Seuls les AppSpec level='easy' (iframe) peuvent etre publies.`,
    );
  }
  const firstOutputUrl = Object.values(spec.outputs)[0];
  if (!firstOutputUrl) {
    throw new Error(`AppSpec outputs vide : aucun URL a publier pour '${spec.slug}'.`);
  }
  return {
    slug: spec.slug,
    name: spec.name,
    category: spec.category,
    level: spec.level,
    iframeUrl: firstOutputUrl,
    installedAt: new Date().toISOString(),
  };
}
