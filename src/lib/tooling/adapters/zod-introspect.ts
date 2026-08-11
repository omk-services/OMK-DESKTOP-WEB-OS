// src/lib/tooling/adapters/zod-introspect.ts
// Helpers pour lire les internals d'un Zod schema. Les deux versions
// (v3 `_def.typeName`, v4 `def.type`) coexistent — on lit les deux et
// on prend ce qui est lisible. C'est ce qui rend les introspections
// (rest.ts, mcp-schema.ts, skill.ts) compatibles avec les deux
// versions majeures.

export function readTypeName(s: unknown): string {
  if (!s || typeof s !== 'object') return '';
  const obj = s as { _def?: { typeName?: string }; def?: { type?: string } };
  return obj._def?.typeName ?? obj.def?.type ?? '';
}

export function isOptional(s: unknown): boolean {
  if (!s || typeof s !== 'object') return false;
  const obj = s as { _def?: { typeName?: string }; def?: { type?: string; innerType?: unknown } };
  const tn = readTypeName(obj);
  if (tn === 'ZodOptional' || tn === 'ZodNullable' || tn === 'optional' || tn === 'nullable') {
    return true;
  }
  if (obj.def?.innerType) return true;
  return false;
}

export function unwrapOptional(s: unknown): unknown {
  if (!isOptional(s)) return s;
  const obj = s as { def?: { innerType?: unknown }; _def?: { innerType?: unknown } };
  if (obj.def?.innerType) return obj.def.innerType;
  if (obj._def?.innerType) return obj._def.innerType;
  return s;
}

export function unwrapAll(s: unknown): { inner: unknown; optional: boolean } {
  let cur = s;
  let optional = false;
  for (let i = 0; i < 5; i++) {
    if (!isOptional(cur)) break;
    optional = true;
    cur = unwrapOptional(cur);
  }
  return { inner: cur, optional };
}

export function getObjectShape(obj: unknown): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as { shape?: Record<string, unknown> };
  return o.shape;
}

export function getInnerType(s: unknown): string {
  // Pour ZodObject : on regarde les valeurs de shape et on retourne
  // 'object'. Pour les autres, on retourne le type de base.
  return readTypeName(s);
}
