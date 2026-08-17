// api/agent/providers.ts
// GET /api/agent/providers : liste les fournisseurs avec leur disponibilite.
// Le client l'utilise pour afficher le selecteur sans deviner.

import { listProviderStatuses } from '../_agent/providers.js'
import { verifierAcces } from '../_agent/garde.js'
import { versNode } from '../_agent/adapt.js'

/** Gestionnaire de la route — exporté pour les tests du garde.
 *
 *  Aucun appelant côté client (recherche exhaustive `src/`) — la route
 *  n'est pas branchée. Elle divulguait jusqu'ici l'inventaire complet
 *  des fournisseurs sans authentification. Gardée comme les autres pour
 *  cohérence. */
export function gestionnaire(request: Request): Response {
  const refus = verifierAcces(request);
  if (refus) {
    return new Response(
      JSON.stringify({ error: refus.message }),
      { status: refus.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      providers: listProviderStatuses(),
      default: 'minimax',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

// Enveloppe pour le runtime Node de Vercel (cf. adapt.ts).
export default versNode(gestionnaire)
