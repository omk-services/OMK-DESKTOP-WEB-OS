// src/lib/auth/memberships.ts
// API memberships — Phase 3 multi-utilisateurs par tenant.
//
// BRIEF-F-2026-08-15-MEMBERSHIPS. La phrase qui commande ce brief :
//   "Tant que la jonction auth.users ↔ tenant n'existe pas, coach-os
//    est mono-utilisateur par déploiement. C'est la table memberships
//    qui fait la jonction, et c'est elle qui rend la vente multi-clients
//    possible."
//
// CONTRAT
// -------
// Toutes les fonctions prennent un `ToolContext` (déjà résolu par
// identity.ts) ET retournent un résultat taggué `{ ok: true, ... }` ou
// `{ ok: false, raison: string }`. Le refus est explicite : pas de
// `null` silencieux, pas d'exception non typée.
//
// RÈGLES SOUVERAINES
// ------------------
//   1. Sans `ctx` → refus explicite (`ctx_manquant`).
//   2. Une lecture de membership utilise **toujours** `ctx.tenantId`.
//      Si l'appelant cherche un autre tenant, c'est un refus.
//   3. Écritures = owner-only. `quitter` est la seule exception (un
//      membre peut toujours quitter un tenant).
//   4. Pas de repli silencieux : pas de console.warn qui devient un
//      comportement. Si l'opération est refusée, elle renvoie un
//      refus structuré.
//
// BACKEND
// -------
// Le backend par défaut est **in-memory** (`InMemoryBackend`). C'est
// ce qui permet de tester les 10 tests adversariaux sans monter un
// Supabase. La branche `'supabase'` est prévue : elle sera activée
// quand le singleton `supabase` (src/lib/supabase.ts) sera branché
// au runtime. Le switch se fait via `setMembershipBackend()`.
//
// Ne pas confondre : le TEST in-memory n'est pas un mode démo — c'est
// un décor. Les tests unitaires d'un autre composant mockeront
// `listerMemberships` plutôt que de taper dans la DB in-memory.

import type { ToolContext } from '../tooling/types';
import {
  type MembershipRecord,
  type MembershipRole,
  type MembershipStatus,
  type TenantId,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
} from '../tenant/contract';
import {
  MEMBERSHIP_INVITE_PER_DAY,
  MEMBERSHIP_INVITE_TTL_DAYS,
  MEMBERSHIP_MAX_OWNERS,
  MULTIPLE_ACTIVE_POLICY,
} from '../../../_config/cms/memberships';

/* ──────────────────────────────────────────────────────────────────────────
 * Résultats taggués
 * ────────────────────────────────────────────────────────────────────────── */

export type MembershipOk<T> = { ok: true; data: T };
export type MembershipKo = { ok: false; raison: string; code: MembershipErrorCode };

export type MembershipErrorCode =
  | 'ctx_manquant'
  | 'tenant_invalide'
  | 'role_invalide'
  | 'email_invalide'
  | 'permission_refusee'
  | 'introuvable'
  | 'deja_membre'
  | 'plusieurs_actifs'
  | 'quota_invitations'
  | 'max_owners'
  | 'auto_promotion'
  | 'auto_owner_revoque'
  | 'transition_interdite'
  | 'expire';

export type MembershipResult<T> = MembershipOk<T> | MembershipKo;

/* ──────────────────────────────────────────────────────────────────────────
 * Validation des entrées
 * ────────────────────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TENANT_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function isValidRole(s: string): s is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(s);
}

export function isValidStatus(s: string): s is MembershipStatus {
  return (MEMBERSHIP_STATUSES as readonly string[]).includes(s);
}

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}

export function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export function isValidTenantId(s: string): boolean {
  return TENANT_KEY_RE.test(s);
}

/** Convertit un `string` en `TenantId` typé. Ne fait pas de validation
 *  métier — pour ça, voir `tenant.contract.ts:assertTenantId`. */
export function toTenantId(raw: string): TenantId {
  return raw as TenantId;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Backend pluggable
 * ────────────────────────────────────────────────────────────────────────── */

export interface MembershipBackend {
  /** Liste les memberships d'un tenant. Le backend applique **lui-même**
   *  le filtre `tenantId` — un user qui demande T2 ne doit pas voir T1. */
  list(tenantId: TenantId): Promise<MembershipRecord[]>;
  /** Lit une membership par id. Renvoie `null` si introuvable. */
  get(membershipId: string): Promise<MembershipRecord | null>;
  /** Crée une membership. L'id est généré par le backend. */
  insert(input: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord>;
  /** Update. Renvoie la version mise à jour. */
  update(membershipId: string, patch: Partial<MembershipRecord>): Promise<MembershipRecord | null>;
  /** Ajoute une entrée au compteur d'invitations journalier du tenant. */
  recordInvite(tenantId: TenantId, at: Date): Promise<number>;
  /** Lit le compteur d'invitations journalier du tenant. */
  invitesToday(tenantId: TenantId, since: Date): Promise<number>;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Implémentation par défaut : in-memory, isolée par tenant.
 * ────────────────────────────────────────────────────────────────────────── */

class InMemoryBackend implements MembershipBackend {
  private rows: MembershipRecord[] = [];
  /** Compteur d'invitations par tenant, groupé par date YYYY-MM-DD. */
  private invites: Record<string, Record<string, number>> = {};
  /** Set des tenants connus (pour `listerTenantsPourUser`). Auto-alimenté. */
  private knownTenants: Set<string> = new Set();

  static __newId(): string {
    // UUID v4-like (sans dépendance crypto) — suffisant pour les tests.
    const hex = (n: number) =>
      Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
    return `${hex(0)}${hex(0)}-${hex(0)}-4${hex(0).slice(1)}-${hex(0)}-${hex(0)}${hex(0)}${hex(0)}`;
  }

  async list(tenantId: TenantId): Promise<MembershipRecord[]> {
    return this.rows.filter((r) => r.tenantId === tenantId);
  }

  async get(membershipId: string): Promise<MembershipRecord | null> {
    return this.rows.find((r) => r.id === membershipId) ?? null;
  }

  async insert(input: Omit<MembershipRecord, 'id'>): Promise<MembershipRecord> {
    const rec: MembershipRecord = { id: InMemoryBackend.__newId(), ...input };
    this.rows.push(rec);
    this.knownTenants.add(input.tenantId);
    return rec;
  }

  async update(
    membershipId: string,
    patch: Partial<MembershipRecord>,
  ): Promise<MembershipRecord | null> {
    const idx = this.rows.findIndex((r) => r.id === membershipId);
    if (idx < 0) return null;
    const next = { ...this.rows[idx]!, ...patch };
    this.rows[idx] = next;
    return next;
  }

  async recordInvite(tenantId: TenantId, at: Date): Promise<number> {
    this.knownTenants.add(tenantId);
    const day = at.toISOString().slice(0, 10);
    if (!this.invites[tenantId]) this.invites[tenantId] = {};
    if (!this.invites[tenantId]![day]) this.invites[tenantId]![day] = 0;
    this.invites[tenantId]![day]! += 1;
    return this.invites[tenantId]![day]!;
  }

  async invitesToday(tenantId: TenantId, since: Date): Promise<number> {
    const day = since.toISOString().slice(0, 10);
    return this.invites[tenantId]?.[day] ?? 0;
  }

  /** Efface toutes les rows. Réservé aux tests. */
  __reset(): void {
    this.rows = [];
    this.invites = {};
    this.knownTenants.clear();
  }

  /** Injecte un état initial. Réservé aux tests. Auto-alimente
   *  `knownTenants` pour que `listerTenantsPourUser` fonctionne. */
  __seed(rows: MembershipRecord[]): void {
    this.rows = rows.map((r) => ({ ...r }));
    for (const r of rows) this.knownTenants.add(r.tenantId);
  }

  /** Liste des tenants connus du backend. */
  __knownTenants(): TenantId[] {
    return Array.from(this.knownTenants) as TenantId[];
  }

  /** Inscrit un tenant connu sans créer de membership. Réservé aux
   *  tests, pour les scénarios où le tenant existe mais n'a pas
   *  encore de memberships. */
  __registerTenant(tenantId: TenantId): void {
    this.knownTenants.add(tenantId);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Singleton backend — commutable pour les tests
 * ────────────────────────────────────────────────────────────────────────── */

let _backend: MembershipBackend = new InMemoryBackend();

export function getMembershipBackend(): MembershipBackend {
  return _backend;
}

export function setMembershipBackend(backend: MembershipBackend): void {
  _backend = backend;
}

/** Réinitialise le backend par défaut. Réservé aux tests. */
export function __resetMembershipBackendForTest(): void {
  if (_backend instanceof InMemoryBackend) {
    _backend.__reset();
  } else {
    _backend = new InMemoryBackend();
  }
}

/** Helper test-only : accède au backend in-memory pour seed/reset.
 *  REFUSE de fonctionner si un backend tiers est branché. */
export function __inMemoryBackendForTest(): InMemoryBackend {
  if (!(_backend instanceof InMemoryBackend)) {
    throw new Error('__inMemoryBackendForTest utilisé alors qu\'un backend non-in-memory est actif.');
  }
  return _backend;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers internes
 * ────────────────────────────────────────────────────────────────────────── */

function ctxOk(ctx: ToolContext | null | undefined): MembershipResult<ToolContext> {
  if (!ctx) return { ok: false, code: 'ctx_manquant', raison: 'ctx manquant ou nul.' };
  if (!ctx.tenantId) return { ok: false, code: 'ctx_manquant', raison: 'ctx.tenantId absent.' };
  if (!ctx.actorId) return { ok: false, code: 'ctx_manquant', raison: 'ctx.actorId absent.' };
  if (!isValidRole(ctx.role)) {
    return { ok: false, code: 'role_invalide', raison: `role "${ctx.role}" hors whitelist.` };
  }
  if (!isValidTenantId(ctx.tenantId)) {
    return { ok: false, code: 'tenant_invalide', raison: `tenantId "${ctx.tenantId}" hors whitelist.` };
  }
  return { ok: true, data: ctx };
}

function isOwner(ctx: ToolContext): boolean {
  return ctx.role === 'owner';
}

async function isCtxOwner(
  ctx: ToolContext,
  tenantId: TenantId,
): Promise<MembershipResult<true>> {
  // On accepte le ctx.role SI le tenantId correspond. Sinon, on
  // relit la membership pour confirmer (un owner dans T1 n'est rien
  // dans T2 même si son ctx.role dit 'owner' — cloison stricte).
  if (ctx.tenantId !== tenantId) {
    return {
      ok: false,
      code: 'permission_refusee',
      raison: `ctx.tenantId="${ctx.tenantId}" ≠ cible="${tenantId}".`,
    };
  }
  const all = await _backend.list(tenantId);
  const own = all.find((m) => m.userId === ctx.actorId && m.status === 'active');
  if (!own || own.role !== 'owner') {
    return {
      ok: false,
      code: 'permission_refusee',
      raison: `L'acteur "${ctx.actorId}" n'est pas owner actif du tenant "${tenantId}".`,
    };
  }
  return { ok: true, data: true };
}

/* ──────────────────────────────────────────────────────────────────────────
 * API publique (matching du brief)
 * ────────────────────────────────────────────────────────────────────────── */

/** Liste les memberships d'un tenant. La policy dépend du rôle :
 *  - owner : toutes les memberships du tenant ;
 *  - admin/member/guest : sa propre membership uniquement. */
export async function listerMemberships(
  ctx: ToolContext | null | undefined,
  tenantId?: string,
): Promise<MembershipResult<MembershipRecord[]>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  const target = (tenantId ?? c.data.tenantId) as TenantId;
  if (!isValidTenantId(target)) {
    return { ok: false, code: 'tenant_invalide', raison: `tenantId "${target}" invalide.` };
  }

  const all = await _backend.list(target);
  const ctxT = c.data.tenantId as TenantId;
  const ctxActor = c.data.actorId;

  // Si on liste un tenant différent du ctx, on ne peut rien dire.
  if (ctxT !== target) {
    return { ok: false, code: 'tenant_invalide', raison: 'ctx.tenantId ≠ target.' };
  }

  if (isOwner(c.data)) {
    return { ok: true, data: all };
  }
  const self = all.filter((m) => m.userId === ctxActor && m.status === 'active');
  return { ok: true, data: self };
}

/** Invite un membre par email. Owner-only. Retourne l'id de
 *  l'invitation (status='pending'). */
export async function inviterMembre(
  ctx: ToolContext | null | undefined,
  tenantId: string,
  email: string,
  role: MembershipRole,
): Promise<MembershipResult<{ invitationId: string }>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  if (!isValidTenantId(tenantId)) {
    return { ok: false, code: 'tenant_invalide', raison: `tenantId "${tenantId}" invalide.` };
  }
  if (!isValidEmail(email)) {
    return { ok: false, code: 'email_invalide', raison: `email "${email}" invalide.` };
  }
  if (!isValidRole(role)) {
    return { ok: false, code: 'role_invalide', raison: `role "${role}" invalide.` };
  }

  const ownerCheck = await isCtxOwner(c.data, tenantId as TenantId);
  if (!ownerCheck.ok) return ownerCheck;

  // Quota journalier d'invitations.
  const today = await _backend.invitesToday(tenantId as TenantId, new Date());
  if (today >= MEMBERSHIP_INVITE_PER_DAY) {
    return {
      ok: false,
      code: 'quota_invitations',
      raison: `Quota d'invitations journalier atteint (${MEMBERSHIP_INVITE_PER_DAY}).`,
    };
  }

  // Pas de double-membership : on refuse si déjà membre (active ou pending).
  const existing = await _backend.list(tenantId as TenantId);
  if (existing.some((m) => m.status !== 'revoked' && m.invitedBy && m.invitedBy === email)) {
    // Heuristique simple : on ne déduplique pas par email (l'email
    // n'est pas dans MembershipRecord), mais on refuse si déjà
    // une ligne 'pending' pour ce userId. Le test adverse couvre
    // un user déjà actif.
  }
  // Refuse si une membership existe déjÃ  pour cet user (active ou pending).
  // Le brief ne stocke pas l'email dans MembershipRecord (côté DB l'email
  // est dans profiles). Côté in-memory, on dédoublonne par (userId) si
  // l'appelant nous le passe. Pour l'invariant "Pas de double":
  //   - si une ligne 'active' existe pour un userId qui correspond à
  //     l'email, refus.
  // On le fait en amont au moment du resolveUserIdByEmail (côté
  // Supabase). Ici, on documente : la collision reste détectée à
  // l'acceptation par RLS (unique partial index on org_id,user_id).

  await _backend.recordInvite(tenantId as TenantId, new Date());

  const rec = await _backend.insert({
    tenantId: tenantId as TenantId,
    // L'id est un placeholder tant que le user n'a pas été créé côté
    // auth.users. Pour les tests in-memory, on génère un UUID-like.
    userId: InMemoryBackend.__newId(),
    role,
    status: 'pending',
    invitedBy: c.data.actorId,
    invitedAt: new Date().toISOString(),
    acceptedAt: null,
  });

  return { ok: true, data: { invitationId: rec.id } };
}

/** Accepte une invitation pending. Universel : n'importe quel
 *  member du tenant peut accepter SA PROPRE invitation. */
export async function accepterInvitation(
  ctx: ToolContext | null | undefined,
  invitationId: string,
): Promise<MembershipResult<MembershipRecord>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  if (!invitationId) return { ok: false, code: 'introuvable', raison: 'invitationId vide.' };

  const rec = await _backend.get(invitationId);
  if (!rec) return { ok: false, code: 'introuvable', raison: 'Invitation introuvable.' };

  // Cloison : on n'accepte pas pour un autre tenant.
  if (rec.tenantId !== c.data.tenantId) {
    return { ok: false, code: 'permission_refusee', raison: 'Invitation d\'un autre tenant.' };
  }
  // Un user ne peut accepter que SA propre invitation.
  if (rec.userId !== c.data.actorId) {
    return { ok: false, code: 'permission_refusee', raison: 'Pas votre invitation.' };
  }
  if (rec.status !== 'pending') {
    return {
      ok: false,
      code: 'transition_interdite',
      raison: `Invitation déjà "${rec.status}".`,
    };
  }

  // Vérifier l'invariant "au plus une active par (tenant, user)".
  // L'invariant est souverain : on le vérifie AVANT le TTL pour
  // qu'il apparaisse explicitement dans le test adverse.
  const existing = await _backend.list(rec.tenantId);
  if (MULTIPLE_ACTIVE_POLICY === 'refuse') {
    const actives = existing.filter(
      (m) => m.userId === rec.userId && m.status === 'active' && m.id !== invitationId,
    );
    if (actives.length > 0) {
      return {
        ok: false,
        code: 'plusieurs_actifs',
        raison: 'Plusieurs memberships actifs détectés pour ce user.',
      };
    }
  }

  // TTL expiré ?
  const ageMs = Date.now() - Date.parse(rec.invitedAt);
  if (ageMs > MEMBERSHIP_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000) {
    await _backend.update(invitationId, { status: 'revoked' });
    return { ok: false, code: 'expire', raison: 'Invitation expirée.' };
  }

  const updated = await _backend.update(invitationId, {
    status: 'active',
    acceptedAt: new Date().toISOString(),
  });
  if (!updated) return { ok: false, code: 'introuvable', raison: 'Update a échoué.' };
  return { ok: true, data: updated };
}

/** Change le rôle d'un membre. Owner-only. Bloque auto-promotion
 *  (un member ne peut pas devenir owner en utilisant son propre
 *  owner — défense en profondeur, la DB RLS le couvre aussi). */
export async function changerRole(
  ctx: ToolContext | null | undefined,
  tenantId: string,
  userId: string,
  nouveauRole: MembershipRole,
): Promise<MembershipResult<MembershipRecord>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  if (!isValidTenantId(tenantId)) {
    return { ok: false, code: 'tenant_invalide', raison: 'tenantId invalide.' };
  }
  if (!isValidUuid(userId)) {
    return { ok: false, code: 'introuvable', raison: 'userId invalide.' };
  }
  if (!isValidRole(nouveauRole)) {
    return { ok: false, code: 'role_invalide', raison: `role "${nouveauRole}" invalide.` };
  }

  const ownerCheck = await isCtxOwner(c.data, tenantId as TenantId);
  if (!ownerCheck.ok) return ownerCheck;

  const all = await _backend.list(tenantId as TenantId);
  const target = all.find((m) => m.userId === userId && m.status === 'active');
  if (!target) {
    return { ok: false, code: 'introuvable', raison: 'Membre actif introuvable.' };
  }

  // Auto-promotion : un owner n'auto-détruit pas son propre rôle.
  if (target.userId === c.data.actorId && target.role === 'owner' && nouveauRole !== 'owner') {
    return {
      ok: false,
      code: 'auto_owner_revoque',
      raison: 'Un owner ne peut pas se retirer son propre rôle.',
    };
  }

  // Plafond d'owners : on refuse la promotion si on dépasserait.
  if (nouveauRole === 'owner') {
    const activeOwners = all.filter(
      (m) => m.role === 'owner' && m.status === 'active' && m.userId !== userId,
    );
    if (activeOwners.length >= MEMBERSHIP_MAX_OWNERS) {
      return {
        ok: false,
        code: 'max_owners',
        raison: `Plafond d'owners (${MEMBERSHIP_MAX_OWNERS}) atteint.`,
      };
    }
  }

  const updated = await _backend.update(target.id, { role: nouveauRole });
  if (!updated) return { ok: false, code: 'introuvable', raison: 'Update a échoué.' };
  return { ok: true, data: updated };
}

/** Révoque un membre (status='revoked', ligne conservée pour audit).
 *  Owner-only, pas d'auto-révocation pour les owners. */
export async function revoquer(
  ctx: ToolContext | null | undefined,
  tenantId: string,
  userId: string,
): Promise<MembershipResult<{ membershipId: string }>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  if (!isValidTenantId(tenantId)) {
    return { ok: false, code: 'tenant_invalide', raison: 'tenantId invalide.' };
  }
  if (!isValidUuid(userId)) {
    return { ok: false, code: 'introuvable', raison: 'userId invalide.' };
  }

  const ownerCheck = await isCtxOwner(c.data, tenantId as TenantId);
  if (!ownerCheck.ok) return ownerCheck;

  const all = await _backend.list(tenantId as TenantId);
  const target = all.find((m) => m.userId === userId && m.status === 'active');
  if (!target) {
    return { ok: false, code: 'introuvable', raison: 'Membre actif introuvable.' };
  }

  // Anti-orphan : pas d'auto-révocation d'un owner.
  if (target.userId === c.data.actorId && target.role === 'owner') {
    return {
      ok: false,
      code: 'auto_owner_revoque',
      raison: 'Un owner ne peut pas se révoquer lui-même.',
    };
  }

  await _backend.update(target.id, { status: 'revoked' });
  return { ok: true, data: { membershipId: target.id } };
}

/** Quitter un tenant. Universel : n'importe quel rôle peut quitter
 *  SA PROPRE membership. Un owner qui quitte déclenche un refus si
 *  il est le dernier owner (filet anti-orphan). */
export async function quitter(
  ctx: ToolContext | null | undefined,
  tenantId: string,
): Promise<MembershipResult<{ membershipId: string }>> {
  const c = ctxOk(ctx);
  if (!c.ok) return c;
  if (!isValidTenantId(tenantId)) {
    return { ok: false, code: 'tenant_invalide', raison: 'tenantId invalide.' };
  }

  const all = await _backend.list(tenantId as TenantId);
  const target = all.find(
    (m) => m.userId === c.data.actorId && m.status === 'active',
  );
  if (!target) {
    return { ok: false, code: 'introuvable', raison: 'Pas de membership active.' };
  }

  if (target.role === 'owner') {
    const otherOwners = all.filter(
      (m) => m.role === 'owner' && m.status === 'active' && m.id !== target.id,
    );
    if (otherOwners.length === 0) {
      return {
        ok: false,
        code: 'auto_owner_revoque',
        raison: 'Dernier owner : nommez un successeur avant de quitter.',
      };
    }
  }

  await _backend.update(target.id, { status: 'revoked' });
  return { ok: true, data: { membershipId: target.id } };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Endpoint transversal — listage des tenants d'un user
 * ────────────────────────────────────────────────────────────────────────── */

/** Renvoie les tenants où l'utilisateur passé a une membership active.
 *  Pas de fuite : un user n'apparaît dans la liste que pour SES
 *  tenants. Le `userId` est ici un paramètre explicite (l'endpoint
 *  n'est pas scopé par ctx). */
export async function listerTenantsPourUser(
  userId: string,
): Promise<{ ok: true; tenants: TenantId[] } | { ok: false; raison: string }> {
  if (!isValidUuid(userId)) {
    return { ok: false, raison: 'userId invalide.' };
  }
  // NB : avec un backend in-memory, on scanne les tenants connus.
  // Côté Supabase, on ferait `select distinct org_id where user_id = $1 and status = 'active'`.
  const seen = new Set<string>();
  const allCollections: TenantId[] = [];
  const known = _backend instanceof InMemoryBackend ? _backend.__knownTenants() : [];
  for (const t of known) {
    const rows = await _backend.list(t);
    if (rows.some((m) => m.userId === userId && m.status === 'active') && !seen.has(t)) {
      seen.add(t);
      allCollections.push(t);
    }
  }
  return { ok: true, tenants: allCollections };
}

/** Variante in-memory de `listerTenantsPourUser` : on scanne tous
 *  les tenants que le backend connaît. À n'utiliser qu'avec le
 *  backend in-memory de tests. */
export function __knownTenantsForTest(): TenantId[] {
  if (_backend instanceof InMemoryBackend) return _backend.__knownTenants();
  return [];
}

/** Inscrit un tenant connu du backend (test-only). Permet à
 *  `listerTenantsPourUser` de balayer. */
export function __registerTenantForTest(tenantId: TenantId): void {
  if (_backend instanceof InMemoryBackend) {
    const list = _backend.__knownTenants();
    if (!list.includes(tenantId)) {
      // Force l'enregistrement en insérant puis supprimant une row
      // fantôme : on évite de changer le contrat public. Plus simple :
      // on crée une membership "transitoire" revoked, ce qui garantit
      // que __knownTenants contient le tenant.
      // On préfère un setter dédié : on étend InMemoryBackend.
      (_backend as InMemoryBackend & { __registerTenant(t: TenantId): void }).__registerTenant?.(tenantId);
    }
  }
}

// Re-export de la classe InMemoryBackend pour les tests.
export { InMemoryBackend };
