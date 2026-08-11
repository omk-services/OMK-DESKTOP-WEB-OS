// api/v1/[tool].ts
// Route catch-all pour les outils. Le Vercel runtime passe
// `req.query.tool` (Node) ou on lit le path côté Web (dev/Vercel récent).
// On délègue à l'adaptateur REST.

import { registerAll } from '../../src/lib/tooling/catalog';
import { toolHandler } from '../../src/lib/tooling/adapters/rest';

registerAll();

function readToolName(request: Request): string | null {
  // URL-based : /api/v1/<tool>
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('v1');
  if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
  return null;
}

async function gestionnaire(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Méthode non autorisée. Utiliser POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const toolName = readToolName(request);
  if (!toolName) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Nom d\'outil manquant dans l\'URL.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
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
