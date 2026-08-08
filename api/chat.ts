// api/chat.ts
// Point d'entree POST /api/chat. Conforme a CONTRAT.md.
//
// Strategie d'erreur : un 200 ne contient jamais une erreur.
// Un fournisseur indisponible rend un 400 lisible ; le service reste
// debout pour les autres (cf. la lecon du gateway MCP).

import type { UIMessage } from 'ai'
import {
  convertToModelMessages,
  streamText,
  type ToolSet,
} from 'ai'
import {
  getProvider,
  isProviderAvailable,
  listProviders,
  resolveProviderId,
  type ProviderId,
} from './_agent/providers.js'
import { tools } from './_agent/tools.js'
import { composeSystem } from './_agent/prompt.js'
import { verifierAcces, verifierTaille, MAX_MESSAGES } from './_agent/garde.js'
import { versNode } from './_agent/adapt.js'

const KNOWN_PROVIDERS = listProviders().map((spec) => spec.id)

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function isUIMessageArray(value: unknown): value is UIMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        m != null &&
        typeof m === 'object' &&
        typeof (m as { role?: unknown }).role === 'string',
    )
  )
}

async function gestionnaire(request: Request): Promise<Response> {
  const refus = verifierAcces(request) ?? verifierTaille(request)
  if (refus) return jsonError(refus.status, refus.message)

  if (request.method !== 'POST') {
    return jsonError(405, 'Methode non autorisee. Utiliser POST.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Corps JSON invalide.')
  }

  if (!body || typeof body !== 'object') {
    return jsonError(400, 'Corps de requete invalide.')
  }

  const { messages, provider, system } = body as {
    messages?: unknown
    provider?: unknown
    system?: unknown
  }

  if (!isUIMessageArray(messages)) {
    return jsonError(
      400,
      'Le champ "messages" doit etre un tableau de messages UI du SDK.',
    )
  }
  // Chaque message est reinjecte en entree a chaque tour : sans plafond,
  // mille messages triviaux passent et se paient.
  if (messages.length > MAX_MESSAGES) {
    return jsonError(413, `Trop de messages (${messages.length}). Maximum : ${MAX_MESSAGES}.`)
  }

  let resolvedId: ProviderId
  if (typeof provider === 'string' && provider.length > 0) {
    if (!KNOWN_PROVIDERS.includes(provider as ProviderId)) {
      return jsonError(
        400,
        `Fournisseur inconnu : "${provider}". Fournisseurs connus : ${KNOWN_PROVIDERS.join(', ')}.`,
      )
    }
    resolvedId = provider as ProviderId
  } else {
    const envDefault = process.env.AGENT_PROVIDER
    resolvedId = resolveProviderId(envDefault)
  }

  if (!isProviderAvailable(resolvedId)) {
    const spec = getProvider(resolvedId)
    return jsonError(
      400,
      `Fournisseur "${resolvedId}" indisponible : la variable d'environnement ${spec.envVar} n'est pas definie.`,
    )
  }

  const spec = getProvider(resolvedId)
  const model = spec.build()
  const instructions = composeSystem(
    typeof system === 'string' ? system : undefined,
  )

  const result = streamText({
    model,
    system: instructions,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: tools as unknown as ToolSet,
  })

  return result.toUIMessageStreamResponse()
}

// Enveloppe pour le runtime Node de Vercel (cf. adapt.ts).
export default versNode(gestionnaire)
