// api/agent/roster.ts
// GET /api/agent/roster — catalogue des agents + disponibilite des dos.

import { listBackendStatuses } from '../_agent/backends.js';
import { ROSTER, listAgents } from '../_agent/roster.js';
import { listProviderStatuses } from '../_agent/providers.js';
import { versNode } from '../_agent/adapt.js'

/** Gestionnaire de la route — exporté pour les tests.
 *
 *  HISTORIQUE, ET POURQUOI IL N'Y A PAS DE GARDE ICI
 *
 *  FIX_3 (2026-08-17) a posé `verifierAcces` sur cette route, en partant du
 *  principe que « le client n'en a besoin qu'après authentification ».
 *  **C'était faux, et la production l'a démontré** : le bureau affichait
 *  un badge « Roster HTTP 503 » au chargement.
 *
 *  Les appelants réels sont `src/agent/AssistantOverlay.tsx:68` et
 *  `src/apps/settings/AssistantSettings.tsx:84`. Ce sont des `fetch()` de
 *  navigateur, sans jeton — ils n'ont aucun moyen d'en présenter un.
 *  Garder cette route revenait à casser le bureau pour protéger une donnée
 *  qui ne contient aucun secret.
 *
 *  LE COMPROMIS ASSUMÉ
 *
 *  La route reste ouverte, mais ne rend plus que ce dont l'interface a
 *  besoin pour dessiner sa liste. Les `description` internes — qui
 *  racontaient l'architecture d'agents (« USS Cerritos = Lower Deck »,
 *  cadences, doctrine) — ne sortent plus. Un visiteur non authentifié voit
 *  des identifiants et des états de disponibilité, pas la conception.
 *
 *  RÈGLE GÉNÉRALE À RETENIR : avant de garder une route, vérifier QUI
 *  l'appelle. Un garde posé sur un appel pré-authentification ne protège
 *  rien — il casse. */
export function gestionnaire(_request: Request): Response {
  const backends = listBackendStatuses();
  const providers = listProviderStatuses();
  const agents = listAgents().map((agent) => ({
    id: agent.id,
    name: agent.name,
    personnageId: agent.personnageId,
    backend: agent.backend,
    provider: agent.provider ?? null,
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
