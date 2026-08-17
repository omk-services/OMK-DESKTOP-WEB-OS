// api/v1/[tool].ts
// Route catch-all pour les outils. Le Vercel runtime passe
// `req.query.tool` (Node) ou on lit le path côté Web (dev/Vercel récent).
// On délègue à l'adaptateur REST.
//
// Pourquoi `registerAll()` n'est PAS au top level :
//   `catalog/index.ts` appelle `registerAll()` à l'évaluation du
//   module, qui charge `saasBuilderTools` → `useThreeAppStore` (zustand
//   + persist avec `localStorage`). En serverless Node, `localStorage`
//   n'est pas défini : l'import jette, l'invocation Vercel rend
//   `FUNCTION_INVOCATION_FAILED` (500). Détail dans RAPPORT_FIX_3 §3.
//
//   `toolHandler` (depuis `adapters/rest.ts`) n'a, lui, aucune
//   dépendance vers le catalogue : on peut l'importer statiquement
//   sans risque. C'est l'appel à `get(nom)` qui échoue avec 404 quand
//   le registre est vide — pour cette raison, on enregistre le
//   catalogue dans le gestionnaire, après le garde, dans un try/catch.

import { toolHandler } from '../../src/lib/tooling/adapters/rest';
import { verifierAcces } from '../_agent/garde';

function readToolName(request: Request): string | null {
  // URL-based : /api/v1/<tool>
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('v1');
  if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
  return null;
}

/** Enregistre le catalogue à la demande. `null` en cas d'échec —
 *  par exemple quand le runtime n'a pas `localStorage` (cf.
 *  RAPPORT_FIX_5 §3 pour le diagnostic). */
async function enregistrerCatalogue(): Promise<boolean> {
  try {
    const { registerAll } = await import('../../src/lib/tooling/catalog');
    registerAll();
    return true;
  } catch {
    return false;
  }
}

/** Gestionnaire de la route — exporté pour les tests du garde.
 *
 *  Le garde d'authentification est posé en tête, comme dans `chat.ts:48`,
 *  pour que `collection.create`, `scenario.approve` et le reste du
 *  catalogue ne soient pas exposés en production sans jeton. */
export async function gestionnaire(request: Request): Promise<Response> {
  const refus = verifierAcces(request);
  if (refus) {
    return new Response(
      JSON.stringify({ ok: false, error: refus.message }),
      { status: refus.status, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Méthode non autorisée. Utiliser POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const toolName = readToolName(request);
  if (!toolName) {
    return new Response(
      JSON.stringify({ ok: false, error: "Nom d'outil manquant dans l'URL." }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const enregistre = await enregistrerCatalogue();
  if (!enregistre) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Catalogue d'outils indisponible côté serveur. Le déploiement attend un correctif dans `src/` (cf. RAPPORT_FIX_5).",
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return toolHandler(toolName)(request);
}

export default async function handler(req: unknown, res?: unknown): Promise<unknown> {
  if (res === undefined) {
    return gestionnaire(req as Request);
  }
  const { versNode } = await import('../_agent/adapt.js');
  return versNode(gestionnaire)(req as never, res as never);
}
