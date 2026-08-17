// src/lib/tooling/adapters/mcp-schema.ts
// Conversion d'un Zod schema en `inputSchema` JSON Schema minimal
// qu'attendent les tool descriptors du SDK MCP.
//
// Le format visé est le JSON Schema 2020-12, sous-ensemble compatible
// avec ce que `Server.setRequestHandler(ListToolsRequestSchema)`
// déclare. On ne couvre que les types atomiques et l'objet — suffisant
// pour la V1 des 14 outils du catalogue.

import { z } from 'zod';
import { readTypeName, unwrapAll, getObjectShape } from './zod-introspect';
// Note : conversion de schéma uniquement — pas de ToolContext ici. La
// résolution d'identité (../identity) est appliquée par mcp.ts avant
// d'appeler tool.execute.

export function zodToInputSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return convert(schema);
}

function describeAny(s: unknown): Record<string, unknown> {
  const { inner, optional } = unwrapAll(s);
  const tn = readTypeName(inner);
  let out: Record<string, unknown>;
  if (tn === 'ZodString' || tn === 'string') {
    out = { type: 'string' };
  } else if (tn === 'ZodNumber' || tn === 'number') {
    out = { type: 'number' };
  } else if (tn === 'ZodBoolean' || tn === 'boolean') {
    out = { type: 'boolean' };
  } else if (tn === 'ZodArray' || tn === 'array') {
    const element = (inner as z.ZodArray<z.ZodTypeAny>).element;
    out = { type: 'array', items: convert(element) };
  } else if (tn === 'ZodRecord' || tn === 'record') {
    const valueType = (inner as { def?: { valueType?: z.ZodTypeAny }; _def?: { valueType?: z.ZodTypeAny } }).def?.valueType
      ?? (inner as { def?: { valueType?: z.ZodTypeAny }; _def?: { valueType?: z.ZodTypeAny } })._def?.valueType;
    out = { type: 'object', additionalProperties: convert(valueType ?? z.string()) };
  } else if (tn === 'ZodObject' || tn === 'object') {
    const shape = getObjectShape(inner) ?? {};
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(shape)) {
      const prop = convert(v as z.ZodTypeAny);
      const desc = (v as { description?: string }).description;
      if (desc) (prop as Record<string, unknown>).description = desc;
      properties[k] = prop;
      if (!unwrapAll(v).optional) required.push(k);
    }
    out = { type: 'object', properties, ...(required.length ? { required } : {}) };
  } else {
    out = { type: 'string' };
  }
  if (optional) {
    return { ...out, _optional: true };
  }
  return out;
}

function convert(s: z.ZodTypeAny): Record<string, unknown> {
  return describeAny(s);
}
