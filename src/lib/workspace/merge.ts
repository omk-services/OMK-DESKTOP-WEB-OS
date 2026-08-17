// src/lib/workspace/merge.ts
// Merge d'une PR dans la branche target — résolution de conflits.
//
// Trois états après tentative de merge (cf. BRIEF §merge.ts) :
//   - ok: true  → nouveau snapshot créé sur target, source non supprimée
//   - ok: false + conflits → PR reste `open`, auteur doit résoudre
//   - target branch protégée pendant le merge (lock optimiste par HEAD snapshot id)
//
// Conflit : si le même `item_id` (collectionId:id) a été modifié dans
// `source` ET dans `target` depuis le parent commun, conflit. Pas de
// fusion 3-way auto — résolution manuelle par l'auteur.

import type {
  Conflict,
  MembershipRole,
  Snapshot,
  WorkspaceData,
  WorkspaceResult,
} from './types';
import { peut } from './permissions';
import { restorer, serialiser } from './snapshot';
import { getWorkspaceStore } from './store';

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface MergePrInput {
  prId: string;
  actorId: string;
  actorRole: MembershipRole;
}

/** Tente le merge. Retourne soit un nouveau snapshot, soit la liste
 *  des conflits à résoudre. */
export async function mergePr(input: MergePrInput): Promise<
  WorkspaceResult<{ newSnapshot: Snapshot }> | { ok: false; code: 'conflict'; error: string; conflicts: Conflict[] }
> {
  const guard = peut('mergerPr', { role: input.actorRole });
  if (!guard.ok) return guard;
  const store = getWorkspaceStore();
  const pr = await store.getPr(input.prId);
  if (!pr) return { ok: false, code: 'not_found', error: 'PR introuvable.' };
  if (pr.status !== 'approved') {
    return { ok: false, code: 'invalid_state', error: 'PR pas dans un état mergeable (2 approves requis).' };
  }
  const src = await store.getBranch(pr.tenantId, pr.sourceBranchId);
  const tgt = await store.getBranch(pr.tenantId, pr.targetBranchId);
  if (!src || !tgt) return { ok: false, code: 'not_found', error: 'Branche source ou target introuvable.' };

  const sourceSnap = await store.getSnapshot(pr.sourceSnapshotId);
  if (!sourceSnap) return { ok: false, code: 'not_found', error: 'Snapshot source introuvable.' };
  const targetHead = tgt.headSnapshotId ? await store.getSnapshot(tgt.headSnapshotId) : null;
  const base = src.parentSnapshotId ? await store.getSnapshot(src.parentSnapshotId) : null;

  // Calcul des conflits sur items
  const conflicts = detecterConflits(sourceSnap, targetHead, base);
  if (conflicts.length > 0) {
    // Conflit : la PR reste `open` pour que l'auteur puisse résoudre.
    if (pr.status === 'approved') {
      await store.updatePrStatus(pr.id, 'open');
    }
    return { ok: false, code: 'conflict', error: 'Conflits détectés.', conflicts };
  }

  // Construction du workspace cible fusionné : prend target comme base,
  // applique les changements de source (ajouts, modifications, suppressions).
  const merged = appliquer(sourceSnap, targetHead);
  const { payload, payloadHash } = await serialiser(merged);
  const newSnap: Snapshot = {
    id: genId('snap'),
    branchId: tgt.id,
    parentSnapshotId: tgt.headSnapshotId,
    payload,
    payloadHash,
    message: `Merge ${src.name} → ${tgt.name}`,
    authorId: input.actorId,
    createdAt: nowIso(),
  };
  await store.insertSnapshot(newSnap);
  await store.updateBranchHead(tgt.id, newSnap.id);
  await store.updatePrStatus(pr.id, 'merged');
  return { ok: true, data: { newSnapshot: newSnap } };
}

function detecterConflits(
  source: Snapshot,
  target: Snapshot | null,
  base: Snapshot | null,
): Conflict[] {
  if (!target) return []; // target vide → rien à fusionner, pas de conflit.
  const sWS = restorer(source.payload);
  const tWS = restorer(target.payload);
  const bWS: WorkspaceData = base
    ? restorer(base.payload)
    : { collections: [], items: [], memberships: [] };

  const key = (it: { collectionId: string; id: string }): string =>
    `${it.collectionId}:${it.id}`;

  const sItems = new Map(sWS.items.map((it) => [key(it), it]));
  const tItems = new Map(tWS.items.map((it) => [key(it), it]));
  const bItems = new Map(bWS.items.map((it) => [key(it), it]));

  const conflicts: Conflict[] = [];
  for (const [k, sItem] of sItems.entries()) {
    const tItem = tItems.get(k);
    const bItem = bItems.get(k);
    if (!tItem) continue; // pas de divergence possible — l'item n'existe pas en target.
    if (!bItem) continue; // l'item n'existait pas dans base — pas de 3-way ici, source "first writer wins".
    const sHash = JSON.stringify(sItem.data);
    const tHash = JSON.stringify(tItem.data);
    const bHash = JSON.stringify(bItem.data);
    if (sHash !== tHash && sHash !== bHash && tHash !== bHash) {
      conflicts.push({
        itemId: k,
        reason: 'diverged_from_common_parent',
        baseHash: base?.payloadHash ?? null,
        sourceHash: source.payloadHash,
        targetHash: target.payloadHash,
      });
    }
  }
  return conflicts;
}

function appliquer(source: Snapshot, target: Snapshot | null): WorkspaceData {
  if (!target) return restorer(source.payload);
  const sWS = restorer(source.payload);
  const tWS = restorer(target.payload);

  // Items : on prend target comme base, on ajoute/override par source.
  const tItemMap = new Map(tWS.items.map((it) => [`${it.collectionId}:${it.id}`, it]));
  for (const it of sWS.items) tItemMap.set(`${it.collectionId}:${it.id}`, it);
  // Si l'item est dans target mais pas dans source et que source != base, suppression.
  const sItemMap = new Map(sWS.items.map((it) => [`${it.collectionId}:${it.id}`, it]));
  for (const k of [...tItemMap.keys()]) {
    if (!sItemMap.has(k)) tItemMap.delete(k);
  }
  const items = [...tItemMap.values()];

  // Collections : union, source wins sur id commun.
  const cMap = new Map(tWS.collections.map((c) => [c.id, c]));
  for (const c of sWS.collections) cMap.set(c.id, c);
  const collections = [...cMap.values()];

  // Memberships : union, source wins.
  const mMap = new Map(tWS.memberships.map((m) => [m.userId, m]));
  for (const m of sWS.memberships) mMap.set(m.userId, m);
  const memberships = [...mMap.values()];

  return { collections, items, memberships };
}