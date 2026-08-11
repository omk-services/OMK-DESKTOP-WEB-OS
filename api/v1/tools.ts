// api/v1/tools.ts
// GET /api/v1/tools — manifest des outils. Le client REST s'en sert
// pour hydrater sa liste (équivalent de `coach-os tools list`).

import { registerAll } from '../../src/lib/tooling/catalog';
import { manifestTools } from '../../src/lib/tooling/adapters/rest';
import { list } from '../../src/lib/tooling/registry';

registerAll();

async function gestionnaire(_request: Request): Promise<Response> {
  const tools = list();
  return new Response(
    JSON.stringify({ count: tools.length, tools: manifestTools() }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

export default async function handler(req: unknown, res?: unknown): Promise<unknown> {
  // Pas de versNode — Vercel gère les routes en /api/v1/*.ts directement
  // via son runtime qui passe des Request. Pour le dev (vite plugin),
  // on accepte aussi (req,res).
  if (res === undefined) {
    return gestionnaire(req as Request);
  }
  // Branche Node/Vercel — délègue à versNode de _agent/adapt.ts.
  const { versNode } = await import('../_agent/adapt.js');
  return versNode(gestionnaire)(req as never, res as never);
}
