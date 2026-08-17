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
import { resolveIdentityWithMembership } from '../identity';
import { assertPermission } from '../permissions';
import { appendEvent } from '../../audit/logger';
import type { ToolContext, ToolDefinition } from '../types';

export const DEFAULT_TENANT = 'demo';
export const DEFAULT_ACTOR = 'agent:rest';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Extrait l'identité depuis les en-têtes ET la relit côté `memberships`
 *  (FIX_1_identite 2026-08-17). Avant cette passe, le rôle déclaré par
 *  `x-coach-os-role` était cru sur parole : n'importe quel client
 *  pouvait proclamer `owner` et la matrice `permissions.ts` le validait
 *  sans recours. Désormais, le rôle effectif vient de
 *  `resolveIdentityWithMembership`, qui REFUSE en production quand
 *  `setMembershipLookup()` n'a pas été branché au démarrage.
 *
 *  Codes d'erreur :
 *  - 401 si l'identité whitelist est incomplète, si le lookup jette,
 *    si aucune membership active n'est trouvée, ou si aucun lookup
 *    n'est configuré. Tous ces cas sont des échecs d'identité, pas
 *    de permission : le client doit corriger ses en-têtes (ou
 *    l'opérateur doit brancher le lookup avant de servir du trafic).
 *  - 403 reste réservé à `assertPermission` quand le rôle effectif
 *    est valide mais ne couvre pas la catégorie de l'outil. */
export async function ctxFromHeaders(
  request: Request,
): Promise<
  | { ok: true; ctx: ToolContext; source: 'full' | 'demo' | 'membership' }
  | { ok: false; status: number; body: unknown }
> {
  const identity = await resolveIdentityWithMembership({
    tenantId: request.headers.get('x-coach-os-tenant') ?? undefined,
    actorId: request.headers.get('x-coach-os-actor') ?? undefined,
    role: request.headers.get('x-coach-os-role') ?? undefined,
  });
  if (!identity.ok) {
    return {
      ok: false,
      status: 401,
      body: {
        ok: false,
        error: `Identité refusée : ${identity.error}`,
        missing: identity.missing,
      },
    };
  }
  return { ok: true, ctx: identity.ctx, source: identity.source };
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
    const id = await ctxFromHeaders(request);
    if (!id.ok) {
      // Identité rejetée. 401 + envelope identique au reste, pour que
      // les clients existants lisent ok:false sans surprise.
      return json(id.status, id.body);
    }
    try {
      const perm = await assertPermission(id.ctx, tool, parsed.args as Record<string, unknown>);
      if (!perm.ok) {
        // Audit log (NOUVEAU 2026-08-15). On trace les refus de
        // permission aussi bien que les succès.
        try {
          void appendEvent({
            tenantId: id.ctx.tenantId,
            actorId: id.ctx.actorId,
            actorRole: id.ctx.role,
            action: 'observer.event',
            targetType: 'tool',
            targetId: toolName,
            metadata: {
              adapter: 'rest',
              category: tool.category,
              ok: false,
              error: `permission_refused:${perm.code}`,
            },
            observerSource: 'external',
            ipAddress: request.headers.get('x-forwarded-for') ?? null,
            userAgent: request.headers.get('user-agent') ?? null,
          });
        } catch { /* no-throw */ }
        return json(403, {
          ok: false,
          error: `Permission refusée : ${perm.error}`,
          code: perm.code,
        });
      }
      const result = await tool.execute(parsed.args, id.ctx);

      // Audit log (NOUVEAU 2026-08-15). appendEvent ne lève JAMAIS.
      try {
        void appendEvent({
          tenantId: id.ctx.tenantId,
          actorId: id.ctx.actorId,
          actorRole: id.ctx.role,
          action: 'observer.event',
          targetType: 'tool',
          targetId: toolName,
          metadata: {
            adapter: 'rest',
            category: tool.category,
            ok: result.ok,
            ...(result.ok ? {} : { error: result.error }),
          },
          observerSource: 'external',
          ipAddress: request.headers.get('x-forwarded-for') ?? null,
          userAgent: request.headers.get('user-agent') ?? null,
        });
      } catch { /* no-throw */ }

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
