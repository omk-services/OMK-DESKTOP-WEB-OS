// src/lib/tooling/adapters/rest.ts
// Adaptateur REST. Génère un handler Web (Request -> Response) à partir
// d'un outil. Le runtime Vercel (via adapt.ts) enrobe ensuite en (req,res).
//
// Endpoint : POST /api/v1/{toolName}  body = JSON des args
// Réponse : 200 { ok: true, data } ou { ok: false, error }
//           400 si args invalides, 404 si outil inconnu, 405 sur autre méthode.
//
// OpenAPI : on expose aussi un manifest sur GET /api/v1/tools qui rend
// { name, description, category, schema } par outil. Assez pour générer
// un client typé ou un fichier de spec.

import { z } from 'zod';
import { parseArgs } from '../defineTool';
import { get, list } from '../registry';
import { readTypeName, unwrapAll, getObjectShape } from './zod-introspect';
import type { ToolContext, ToolDefinition } from '../types';

export const DEFAULT_TENANT = 'demo';
export const DEFAULT_ACTOR = 'agent:rest';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Extrait le tenant et l'acteur depuis les en-têtes. Côté Vercel, ce
 *  sera posé par l'auth ; pour la V1, on retombe sur les défauts. */
function ctxFromHeaders(request: Request): ToolContext {
  const tenantId = request.headers.get('x-coach-os-tenant') ?? DEFAULT_TENANT;
  const actorId = request.headers.get('x-coach-os-actor') ?? DEFAULT_ACTOR;
  return { tenantId, actorId };
}

/** Manifest OpenAPI-ish. Renvoie name, description, category et schema
 *  brut (zod-to-json serait la V2 ; ici on garde le schéma Zod sérialisé
 *  via JSON.stringify-friendly). */
export function manifestTools(): Array<{
  name: string;
  description: string;
  category: ToolDefinition['category'];
  inputSchema: unknown;
}> {
  return list().map((t) => ({
    name: t.name,
    description: t.description,
    category: t.category,
    inputSchema: zodToJsonShape(t.schema),
  }));
}

/** Sérialise un Zod schema en forme JSON Schema-ish. Suffisant pour
 *  décrire les inputs ; les clients outillés inferent ensuite depuis
 *  les noms. La V2 utilise zod-to-json-schema. */
function zodToJsonShape(schema: z.ZodTypeAny): unknown {
  if (readTypeName(schema) === 'ZodObject') {
    const shape = getObjectShape(schema) ?? {};
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(shape)) {
      properties[k] = describe(v as z.ZodTypeAny);
    }
    return { type: 'object', properties };
  }
  return describe(schema);
}

function describe(s: unknown): Record<string, unknown> {
  const { inner, optional } = unwrapAll(s);
  const tn = readTypeName(inner);
  let out: Record<string, unknown>;
  if (tn === 'ZodString' || tn === 'string') {
    out = { type: 'string' };
  } else if (tn === 'ZodNumber' || tn === 'number') {
    out = { type: 'number' };
  } else if (tn === 'ZodBoolean' || tn === 'boolean') {
    out = { type: 'boolean' };
  } else if (tn === 'ZodRecord' || tn === 'record') {
    const valueType = (inner as { def?: { valueType?: z.ZodTypeAny }; _def?: { valueType?: z.ZodTypeAny } }).def?.valueType
      ?? (inner as { def?: { valueType?: z.ZodTypeAny }; _def?: { valueType?: z.ZodTypeAny } })._def?.valueType;
    out = { type: 'object', additionalProperties: describe(valueType ?? z.string()) };
  } else if (tn === 'ZodArray' || tn === 'array') {
    const element = (inner as z.ZodArray<z.ZodTypeAny>).element;
    out = { type: 'array', items: describe(element) };
  } else if (tn === 'ZodObject' || tn === 'object') {
    const shape = getObjectShape(inner) ?? {};
    const properties: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(shape)) {
      properties[k] = describe(v);
    }
    out = { type: 'object', properties };
  } else {
    out = { type: 'unknown' };
  }
  if (optional) {
    return { ...out, optional: true };
  }
  return out;
}

/** Handler HTTP pour un outil. La route /api/v1/[tool].ts importe
 *  `toolHandler(nom)` et rend la fonction. */
export function toolHandler(toolName: string) {
  return async function handle(request: Request): Promise<Response> {
    const tool = get(toolName);
    if (!tool) return json(404, { ok: false, error: `Outil inconnu : "${toolName}".` });
    if (request.method !== 'POST') {
      return json(405, {
        ok: false,
        error: `Méthode non autorisée : ${request.method}. Utiliser POST.`,
        allowed: ['POST'],
      });
    }
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json(400, { ok: false, error: 'Corps JSON invalide.' });
    }
    const parsed = parseArgs(tool, raw);
    if (!parsed.ok) return json(400, { ok: false, error: parsed.error });
    try {
      const ctx = ctxFromHeaders(request);
      const result = await tool.execute(parsed.args, ctx);
      // 200 dans tous les cas : le contrat est que l'enveloppe { ok, ..., error }
      // dicte la vérité, pas le code HTTP. Un 200 peut contenir ok:false si
      // l'outil a refusé (validation applicative). 500 = panne serveur.
      return json(200, result);
    } catch (err) {
      return json(500, {
        ok: false,
        error: `Erreur interne : ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };
}

/** Handler spécial pour GET /api/v1/tools. */
export function toolsIndexHandler(): Response {
  return json(200, {
    count: list().length,
    tools: manifestTools(),
  });
}

/** Helper pour un endpoint générique /api/v1/route qui dispatche par
 *  toolName. Pratique pour les environnements qui n'autorisent pas
 *  une arborescence /api/v1/[tool].ts. */
export async function dispatchRest(toolName: string, request: Request): Promise<Response> {
  return toolHandler(toolName)(request);
}
