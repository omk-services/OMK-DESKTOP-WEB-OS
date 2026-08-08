// api/agent/roster.ts
// GET /api/agent/roster — catalogue des agents + disponibilite des dos.

import { listBackendStatuses } from '../_agent/backends.js';
import { ROSTER, listAgents } from '../_agent/roster.js';
import { listProviderStatuses } from '../_agent/providers.js';
import { versNode } from '../_agent/adapt.js'

function gestionnaire(_request: Request): Response {

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

// Enveloppe pour le runtime Node de Vercel (cf. adapt.ts).
export default versNode(gestionnaire)
