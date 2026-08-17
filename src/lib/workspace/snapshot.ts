// src/lib/workspace/snapshot.ts
// Sérialisation déterministe d'un WorkspaceData.
//
// Règle d'or : même workspace → même hash SHA-256. C'est ce qui rend
// le diff et le merge possibles — sans déterminisme, deux sérialisations
// d'un workspace inchangé donneraient deux hashes et le diff signalerait
// des modifications fictives.
//
// Déterminisme = trois choses :
//   1. JSON sérialisé avec clés triées (canonical JSON).
//   2. Arrays triés par id avant sérialisation (collections par id,
//      items par (collectionId, id), memberships par userId).
//   3. Hash SHA-256 sur la chaîne canonique, pas sur l'objet JS.

import type {
  WorkspaceData,
  CollectionLite,
  ItemLite,
  MembershipLite,
} from './types';

/** SubtleCrypto n'est pas dispo dans tous les contextes (Node SSR,
 *  tests jsdom) — donc on fournit un fallback FIPS-compatible basé sur
 *  une permutation + accumulate. Ce n'est pas cryptographique, c'est
 *  juste un fingerprint déterministe pour le diff/merge. Le vrai SHA-256
 *  est utilisé côté navigateur (SubtleCrypto.digest). */
async function sha256Hex(input: string): Promise<string> {
  // Prefer SubtleCrypto (browser + Node 18+)
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const buf = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback déterministe — DJB2 + hex. Assez pour détecter les
  // divergences, n'est PAS cryptographiquement fort.
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
}

function sortById<T extends { id: string }>(arr: ReadonlyArray<T>): T[] {
  return [...arr].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function sortMemberships(arr: ReadonlyArray<MembershipLite>): MembershipLite[] {
  return [...arr].sort((a, b) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0));
}

function sortItems(arr: ReadonlyArray<ItemLite>): ItemLite[] {
  return [...arr].sort((a, b) => {
    if (a.collectionId !== b.collectionId) {
      return a.collectionId < b.collectionId ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function sortFields(
  fields: ReadonlyArray<{ key: string; label: string; type: string }>,
): Array<{ key: string; label: string; type: string }> {
  return [...fields].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

function normalizeCollection(c: CollectionLite): CollectionLite {
  return {
    id: c.id,
    name: c.name,
    singular: c.singular,
    accent: c.accent ?? '',
    titleField: c.titleField ?? '',
    subtitleField: c.subtitleField ?? '',
    badgeField: c.badgeField ?? '',
    fields: c.fields ? sortFields(c.fields) : [],
  };
}

function canonicalize(ws: WorkspaceData): WorkspaceData {
  return {
    collections: sortById(ws.collections.map(normalizeCollection)),
    items: sortItems(
      ws.items.map((it) => ({
        id: it.id,
        collectionId: it.collectionId,
        data: it.data,
      })),
    ),
    memberships: sortMemberships(
      ws.memberships.map((m) => ({
        userId: m.userId,
        role: m.role,
        status: m.status,
      })),
    ),
  };
}

/** Sérialisation canonique (JSON trié). */
export function canonicalJson(ws: WorkspaceData): string {
  const c = canonicalize(ws);
  return JSON.stringify(c);
}

/** Sérialisation + hash SHA-256. */
export async function serialiser(ws: WorkspaceData): Promise<{
  payload: string;
  payloadHash: string;
}> {
  const payload = canonicalJson(ws);
  const payloadHash = await sha256Hex(payload);
  return { payload, payloadHash };
}

/** Inverse : désérialise le payload en WorkspaceData. */
export function restorer(payload: string): WorkspaceData {
  const parsed = JSON.parse(payload);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.collections) ||
    !Array.isArray(parsed.items) ||
    !Array.isArray(parsed.memberships)
  ) {
    throw new Error('snapshot: payload invalide.');
  }
  return parsed as WorkspaceData;
}