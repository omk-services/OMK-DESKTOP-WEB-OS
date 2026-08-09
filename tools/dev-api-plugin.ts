// tools/dev-api-plugin.ts
// Plugin Vite qui monte les fonctions api/ en middleware Connect.
// Vite ne sert pas api/ tout seul ; sans ce plugin, AGENT-B ne peut pas
// tester son personnage contre mon serveur en local.
//
// Strategie : pour chaque chemin /api/... on declare la correspondance
// avec un module TypeScript, charge via ssrLoadModule pour que les
// imports nus (ai, zod, ...) soient resolus par Vite. On convertit
// IncomingMessage -> Request (Fetch API) et Response -> ServerResponse,
// parce que les handlers api/ sont ecrits en Web Fetch API pour Vercel.

import { loadEnv, type Plugin, type ViteDevServer, type Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

interface Route {
  test: (pathname: string) => boolean
  module: string
}

const ROUTES: Route[] = [
  { test: (p) => p === '/api/chat', module: '/api/chat.ts' },
  { test: (p) => p === '/api/agent/providers', module: '/api/agent/providers.ts' },
  { test: (p) => p === '/api/agent/roster', module: '/api/agent/roster.ts' },
  { test: (p) => p === '/api/agent/invoke', module: '/api/agent/invoke.ts' },
]

async function readNodeBody(req: IncomingMessage): Promise<Uint8Array | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))))
    req.on('error', reject)
  })
}

function buildFetchRequest(req: IncomingMessage, body: Uint8Array | undefined): Request {
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http'
  const host = req.headers.host || 'localhost'
  const url = `${protocol}://${host}${req.url}`
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue
    if (Array.isArray(v)) headers.set(k, v.join(', '))
    else headers.set(k, String(v))
  }
  const init: RequestInit = {
    method: req.method ?? 'GET',
    headers,
  }
  if (body !== undefined) {
    init.body = body as RequestInit['body']
    ;(init as RequestInit & { duplex: 'half' }).duplex = 'half'
  }
  return new Request(url, init)
}

async function writeFetchResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  if (response.body == null) {
    res.end()
    return
  }
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    res.write(Buffer.from(value))
  }
  res.end()
}

export function devApiPlugin(): Plugin {
  return {
    name: 'coach-os-dev-api',
    configureServer(server: ViteDevServer) {
      // Charge .env.local dans process.env pour que les handlers api/
      // voient MINIMAX_API_KEY etc. Vite ne le fait pas tout seul pour
      // le code serveur (uniquement pour import.meta.env).
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }
      const middleware: Connect.NextHandleFunction = async (req, res, next) => {
        const rawUrl = req.url ?? ''
        const pathname = rawUrl.split('?')[0]
        const route = ROUTES.find((r) => r.test(pathname))
        if (!route) return next()

        try {
          const mod = (await server.ssrLoadModule(route.module)) as {
            default: (req: Request) => Promise<Response> | Response
          }
          const body = await readNodeBody(req)
          const fetchReq = buildFetchRequest(req, body)
          const fetchRes = await mod.default(fetchReq)
          await writeFetchResponse(res, fetchRes)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          const message = err instanceof Error ? err.message : String(err)
          res.end(JSON.stringify({ error: `Erreur interne : ${message}` }))
        }
      }
      server.middlewares.use(middleware)
    },
  }
}