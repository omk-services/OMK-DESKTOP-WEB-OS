// src/lib/workspace/branches.ts
// Création, lecture, fork et suppression des branches WorkSpace.
//
// Règle clé : `main` est créé AUTOMATIQUEMENT lors de la première lecture
// pour un nouveau tenant. Pas de bouton « créer main ». Un owner peut
// renommer une branche mais pas supprimer `main`.
//
// Concurrence : on accepte qu'un snapshot puisse être créé deux fois si
// deux onglets s'exécutent en parallèle — le `payloadHash` UNIQUE
// remonte l'erreur côté Supabase. Côté in-memory, le store rejette les
// doublons.

import type {
  Branch,
  Snapshot,
  WorkspaceData,
  WorkspaceResult,
  MembershipRole,
} from './types';
import { peutCreerBranche, peutSupprimerBranche } from './permissions';
import { serialiser } from './snapshot';
import { getWorkspaceStore } from './store';

const MAIN_BRANCH_NAME = 'main';

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface CreateBranchInput {
  tenantId: string;
  name: string;
  parentBranchName?: string; // défaut : 'main'
  initialData?: WorkspaceData;
  actorId: string;
  actorRole: MembershipRole;
}

/** Crée une branche. `name` doit être unique dans le tenant. */
export async function createBranch(input: CreateBranchInput): Promise<WorkspaceResult<Branch>> {
  if (!peutCreerBranche(input.actorRole)) {
    return {
      ok: false,
      code: 'forbidden',
      error: `Rôle "${input.actorRole}" ne peut pas créer de branche.`,
    };
  }
  const store = getWorkspaceStore();
  const existing = await store.getBranchByName(input.tenantId, input.name);
  if (existing) {
    return {
      ok: false,
      code: 'duplicate_name',
      error: `Une branche nommée "${input.name}" existe déjà dans ce tenant.`,
    };
  }
  const parentName = input.parentBranchName ?? MAIN_BRANCH_NAME;
  const parent = await store.getBranchByName(input.tenantId, parentName);
  if (!parent) {
    return {
      ok: false,
      code: 'not_found',
      error: `Branche parente "${parentName}" introuvable.`,
    };
  }

  const branch: Branch = {
    id: genId('br'),
    tenantId: input.tenantId,
    name: input.name,
    parentBranchId: parent.id,
    parentSnapshotId: parent.headSnapshotId,
    headSnapshotId: null,
    createdBy: input.actorId,
    createdAt: nowIso(),
    isDefault: false,
  };
  await store.insertBranch(branch);

  // Toute branche doit avoir un HEAD snapshot, même vide. Si l'appelant
  // passe `initialData`, on sérialise dessus ; sinon on crée un snapshot
  // "forked from main" qui duplique le payload parent (clone exact du
  // moment du fork).
  const basePayload = parent.headSnapshotId
    ? (await store.getSnapshot(parent.headSnapshotId))?.payload
    : null;
  const data = input.initialData
    ? input.initialData
    : basePayload
      ? JSON.parse(basePayload)
      : { collections: [], items: [], memberships: [] };

  const { payload, payloadHash } = await serialiser(data);
  const snap: Snapshot = {
    id: genId('snap'),
    branchId: branch.id,
    parentSnapshotId: parent.headSnapshotId,
    payload,
    payloadHash,
    message: input.initialData ? 'Initial snapshot' : `Forked from ${parent.name}`,
    authorId: input.actorId,
    createdAt: nowIso(),
  };
  await store.insertSnapshot(snap);
  await store.updateBranchHead(branch.id, snap.id);
  branch.headSnapshotId = snap.id;
  return { ok: true, data: branch };
}

/** Liste les branches d'un tenant (par défaut : triées par createdAt asc). */
export async function listBranches(tenantId: string): Promise<Branch[]> {
  const store = getWorkspaceStore();
  const all = await store.listBranches(tenantId);
  return [...all].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/** Récupère la branche `main` d'un tenant, en la créant si absente. */
export async function getMainBranch(tenantId: string): Promise<Branch> {
  const store = getWorkspaceStore();
  const existing = await store.getBranchByName(tenantId, MAIN_BRANCH_NAME);
  if (existing) return existing;
  const main: Branch = {
    id: genId('br'),
    tenantId,
    name: MAIN_BRANCH_NAME,
    parentBranchId: null,
    parentSnapshotId: null,
    headSnapshotId: null,
    createdBy: 'system',
    createdAt: nowIso(),
    isDefault: true,
  };
  await store.insertBranch(main);
  return main;
}

/** Récupère une branche par id (cloisonnée par tenant). */
export async function getBranch(tenantId: string, branchId: string): Promise<WorkspaceResult<Branch>> {
  const store = getWorkspaceStore();
  const b = await store.getBranch(tenantId, branchId);
  if (!b) return { ok: false, code: 'not_found', error: 'Branche introuvable.' };
  return { ok: true, data: b };
}

/** Snapshot une branche — incrémente le HEAD. Le payload doit être
 *  passé par l'appelant (le workspace UI l'a déjà assemblé). */
export async function snapshotBranch(args: {
  tenantId: string;
  branchId: string;
  message: string;
  data: WorkspaceData;
  authorId: string;
}): Promise<WorkspaceResult<Snapshot>> {
  const store = getWorkspaceStore();
  const branch = await store.getBranch(args.tenantId, args.branchId);
  if (!branch) return { ok: false, code: 'not_found', error: 'Branche introuvable.' };

  const { payload, payloadHash } = await serialiser(args.data);
  const snap: Snapshot = {
    id: genId('snap'),
    branchId: branch.id,
    parentSnapshotId: branch.headSnapshotId,
    payload,
    payloadHash,
    message: args.message,
    authorId: args.authorId,
    createdAt: nowIso(),
  };
  await store.insertSnapshot(snap);
  await store.updateBranchHead(branch.id, snap.id);
  return { ok: true, data: snap };
}

export async function deleteBranch(args: {
  tenantId: string;
  branchId: string;
  actorId: string;
  actorRole: MembershipRole;
}): Promise<WorkspaceResult<true>> {
  const store = getWorkspaceStore();
  const branch = await store.getBranch(args.tenantId, args.branchId);
  if (!branch) return { ok: false, code: 'not_found', error: 'Branche introuvable.' };
  if (!peutSupprimerBranche(args.actorRole, branch.isDefault)) {
    if (branch.isDefault) {
      return { ok: false, code: 'protected_branch', error: 'La branche "main" est protégée.' };
    }
    return { ok: false, code: 'forbidden', error: `Rôle "${args.actorRole}" ne peut pas supprimer une branche.` };
  }
  await store.deleteBranch(branch.id);
  return { ok: true, data: true };
}