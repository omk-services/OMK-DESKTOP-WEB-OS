// api/agent/roster.ts
// GET /api/agent/roster — catalogue des agents + disponibilite des dos.

import { listBackendStatuses } from '../_agent/backends.js';
import { ROSTER, listAgents } from '../_agent/roster.js';
import { listProviderStatuses } from '../_agent/providers.js';
import { verifierAcces } from '../_agent/garde.js';
import { versNode } from '../_agent/adapt.js'

/** Gestionnaire de la route — exporté pour les tests du garde.
 *
 *  Avant ce correctif (FIX_3 2026-08-17) : la route renvoyait 200 sans
 *  aucune vérification d'accès. N'importe qui pouvait lire le roster
 *  complet (noms d'agents, descriptions, modèles, fournisseurs), bien
 *  que sans secret (`available: false` en production). Le client n'en
 *  a besoin qu'après authentification (AssistantOverlay, AssistantSettings),
 *  donc on garde avec `verifierAcces` comme les autres routes. */
export function gestionnaire(request: Request): Response {
  const refus = verifierAcces(request);
  if (refus) {
    return new Response(
      JSON.stringify({ error: refus.message }),
      { status: refus.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

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
