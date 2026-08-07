// api/agent/invoke.ts
// POST /api/agent/invoke — envoie un message a un agent, streame la sortie.
//
// Requete : { agentId, messages, system? }.
// Reponse : flux SSE (text/event-stream) avec des events `delta`, `status`,
// `done`. Chaque event : data: <json>\n\n.
//
// Strategie d'erreur : pas de 200 qui contient une erreur. Si le dos est
// indisponible, on renvoie un 502 avec un JSON lisible. Si la session
// plante en cours, le `done` event contient `error`.

import type { UIMessage } from 'ai'
import { getAgent } from '../_agent/roster.js'
import { isBackendAvailable } from '../_agent/backends.js'
import { demarrerSessionBuzz, type BuzzHandle } from '../_agent/backends/buzz.js'
import { demarrerSessionMultica, type MulticaHandle } from '../_agent/backends/multica.js'
import { demarrerSessionModel, type ModelHandle } from '../_agent/backends/model.js'
import { verifierAcces, verifierTaille, MAX_MESSAGES } from '../_agent/garde.js'

export const config = {
  runtime: 'nodejs',
}

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

/** Renvoie le dernier texte utilisateur, pour les backends sync qui ne
 *  parlent pas en UIMessage[] (Buzz, Multica). On ne garde que le tout
 *  dernier message — c'est ce que l'agent overlay envoie au clic. */
function dernierTexteUtilisateur(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'user') continue
    for (const p of m.parts ?? []) {
      if (p.type === 'text' && typeof (p as { text?: string }).text === 'string') {
        return (p as { text: string }).text
      }
    }
  }
  return ''
}

export default async function handler(request: Request): Promise<Response> {
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

  const { agentId, messages, system } = body as {
    agentId?: unknown
    messages?: unknown
    system?: unknown
  }

  if (typeof agentId !== 'string' || !agentId) {
    return jsonError(400, 'Champ "agentId" (string) obligatoire.')
  }
  if (!isUIMessageArray(messages)) {
    return jsonError(400, 'Champ "messages" doit etre un UIMessage[].')
  }

  const agent = getAgent(agentId)
  if (!agent) {
    return jsonError(404, `Agent inconnu : "${agentId}".`)
  }
  if (!isBackendAvailable(agent.backend)) {
    return jsonError(
      502,
      `Le dos "${agent.backend}" de l'agent "${agent.name}" est indisponible sur ce serveur. Voir GET /api/agent/roster pour la liste detaillee.`,
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const emit = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Le client a coupe : on laisse le backend terminer, le close
          // ci-dessous clot le flux.
        }
      }
      const promptTexte = dernierTexteUtilisateur(messages)
      const extraSystem = typeof system === 'string' ? system : undefined

      let handle: ModelHandle | BuzzHandle | MulticaHandle | null = null

      if (agent.backend === 'modele') {
        handle = demarrerSessionModel({
          messages,
          provider: agent.provider ?? process.env.AGENT_PROVIDER,
          system: extraSystem,
          onChunk: (c) => emit('delta', c),
          onDone: (info) => {
            emit('done', info)
            try {
              controller.close()
            } catch {
              // already closed
            }
          },
        })
      } else if (agent.backend === 'buzz') {
        // Pour Buzz, on envoie le texte brut du dernier message utilisateur.
        // Les messages precedents ne sont pas conserves entre invocations :
        // c'est une API sans memoire. On inclut un prompt systeme si passe.
        const texte = extraSystem ? `${extraSystem}\n\n${promptTexte}` : promptTexte
        handle = demarrerSessionBuzz({
          prompt: texte,
          provider: 'anthropic',
          model: agent.buzzModel ?? process.env.BUZZ_AGENT_MODEL ?? 'claude-haiku-4-5-20251001',
          apiKey: process.env.ANTHROPIC_API_KEY,
          cwd: process.cwd(),
          onChunk: (c) => emit('delta', c),
          onDone: (info) => {
            emit('done', info)
            try {
              controller.close()
            } catch {
              // already closed
            }
          },
        })
      } else if (agent.backend === 'multica') {
        if (!agent.multicaAgentId) {
          emit('done', { stopReason: 'error', error: `L'agent "${agent.id}" (dos multica) n'a pas d'UUID Multica renseigne.` })
          try {
            controller.close()
          } catch {
            // already closed
          }
          return
        }
        handle = demarrerSessionMultica({
          agentId: agent.multicaAgentId,
          prompt: promptTexte,
          title: `Coach OS — ${agent.name} — ${new Date().toISOString().slice(0, 16)}`,
          onChunk: (c) => emit('delta', c),
          onDone: (info) => {
            emit('done', info)
            try {
              controller.close()
            } catch {
              // already closed
            }
          },
        })
      } else {
        emit('done', { stopReason: 'error', error: `Dos inconnu : ${agent.backend}` })
        try {
          controller.close()
        } catch {
          // already closed
        }
        return
      }

      // Si le client ferme la connexion : on tente d'annuler le backend.
      const abort = () => {
        try {
          handle?.kill()
        } catch {
          // best-effort
        }
      }
      // Note: `request.signal` est un AbortSignal ; on s'y abonne.
      request.signal.addEventListener('abort', abort)
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}