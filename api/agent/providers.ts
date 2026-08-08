// api/agent/providers.ts
// GET /api/agent/providers : liste les fournisseurs avec leur disponibilite.
// Le client l'utilise pour afficher le selecteur sans deviner.

import { listProviderStatuses } from '../_agent/providers.js'
import { verifierAcces } from '../_agent/garde.js'
import { versNode } from '../_agent/adapt.js'

function gestionnaire(request: Request): Response {
  const refus = verifierAcces(request)
  if (refus) return new Response(JSON.stringify({ error: refus.message }), { status: refus.status, headers: { 'Content-Type': 'application/json' } })

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
