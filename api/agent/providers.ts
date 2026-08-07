// api/agent/providers.ts
// GET /api/agent/providers : liste les fournisseurs avec leur disponibilite.
// Le client l'utilise pour afficher le selecteur sans deviner.

import { listProviderStatuses } from '../_agent/providers.js'

export const config = {
  runtime: 'nodejs',
}

export default function handler(_request: Request): Response {
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