// api/agent/roster.ts
// GET /api/agent/roster — catalogue des agents + disponibilite des dos.

import { listBackendStatuses } from '../_agent/backends.js';
import { ROSTER, listAgents } from '../_agent/roster.js';
import { listProviderStatuses } from '../_agent/providers.js';
import { verifierAcces } from '../_agent/garde.js'

export const config = {
  runtime: 'nodejs',
}

export default function handler(request: Request): Response {
  const refus = verifierAcces(request)
  if (refus) return new Response(JSON.stringify({ error: refus.message }), { status: refus.status, headers: { 'Content-Type': 'application/json' } })

  const backends = listBackendStatuses();
  const providers = listProviderStatuses();
  const agents = listAgents().map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    personnageId: agent.personnageId,
    backend: agent.backend,
    provider: agent.provider ?? null,
    buzzModel: agent.buzzModel ?? null,
    multicaAgentId: agent.multicaAgentId ?? null,
    multicaSquadId: agent.multicaSquadId ?? null,
    available: backends.find((b) => b.id === agent.backend)?.available ?? false,
  }));

  return new Response(
    JSON.stringify({
      agents,
      backends,
      providers,
      count: ROSTER.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}