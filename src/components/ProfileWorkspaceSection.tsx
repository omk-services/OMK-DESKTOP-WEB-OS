/** ProfileWorkspaceSection — multi-tenant selector embedded inside the
 *  Profile menu.
 *
 *  S_SOCLE chantier 3 (2026-08-10) — moved out of the TopBar (where the
 *  pill sat next to the clock, treating infrastructure as a status
 *  indicator) into the Profile menu where account-scoped controls live.
 *  The visible vocabulary is "Espace de travail" (the technical
 *  identifier `tenant` stays in code; "tenant" is infra jargon that
 *  does not belong on a UI surface).
 *
 *  2026-08-15 — brief WORKSPACE_BRANCHES : ajout d'un bouton « Brancher »
 *  qui crée une branche WorkSpace sur le tenant actif (rôle owner/admin).
 *
 *  The Profile menu is fixed-width (260px). The workspace section fits
 *  inside it: section header, list of known tenants with a check on
 *  the active one, click to switch, and an inline "Enregistrer un
 *  espace" form that creates a new tenant id and registers it.
 *
 *  Does not touch the partition layer: this is purely a relocation of
 *  the selector surface. The active tenant id, the registry of known
 *  tenants, and the CMS mirror all keep flowing through
 *  `useTenantStore` exactly as before.
 *
 *  2026-08-15 — brief MEMBERSHIPS : ajout d'un bouton « Inviter un
 *  membre » qui ouvre la modale `InviteMember`. Le bouton est visible
 *  **uniquement** si la session résolue a une membership 'owner' active
 *  sur le tenant actif (cloison stricte). L'appel réel `inviterMembre()`
 *  n'est pas branché : la modale remonte l'intention via un toast.
 */
import { useEffect, useRef, useState } from 'react';
import { Building2, Check, GitBranch, Plus, UserPlus } from 'lucide-react';
import { useTenantStore, TENANT_DEMO_COACH } from '../stores/tenant.store';
import { useShellStore } from '../stores/shell.store';
import { useSession } from '../stores/session.store';
import { useMembershipsStore, selectMembersFor } from '../stores/memberships.store';
import { InviteMember } from './InviteMember';
import type { TenantId, MembershipRole } from '../lib/tenant/contract';
import { createBranch } from '../lib/workspace/branches';
import { peutCreerBranche } from '../lib/workspace/permissions';
import type { MembershipRole as WorkspaceMembershipRole } from '../lib/workspace/types';

export function ProfileWorkspaceSection(): import('react').ReactNode {
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const displayName = useTenantStore((s) => s.displayName);
  const knownTenants = useTenantStore((s) => s.knownTenants);
  const switchTenant = useTenantStore((s) => s.switchTenant);
  const registerTenant = useTenantStore((s) => s.registerTenant);
  const addToast = useShellStore((s) => s.addToast);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pour déterminer si l'utilisateur courant est owner du tenant
  // actif, on lit la session pour l'actorId, puis on regarde la
  // membership chargée dans le store. C'est la cloison qui parle :
  // un owner dans tenant A n'est rien dans tenant B.
  const session = useSession((s) => s.session);
  const members = useMembershipsStore(selectMembersFor(activeTenantId));
  const isOwner = (() => {
    if (!session?.user) return false;
    const userId = session.user.id;
    return members.some(
      (m) => m.userId === userId && m.status === 'active' && m.role === 'owner',
    );
  })();

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const handleSelect = async (id: TenantId): Promise<void> => {
    if (id === activeTenantId) return;
    await switchTenant(id);
    addToast({
      source: 'Espace de travail',
      type: 'success',
      message: `Basculé vers ${knownTenants.find((t) => t.tenantId === id)?.displayName ?? id}`,
    });
  };

  const handleAdd = (): void => {
    const name = newName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32) as TenantId;
    if (knownTenants.some((t) => t.tenantId === id)) {
      addToast({
        source: 'Espace de travail',
        type: 'warning',
        message: `L'espace « ${id} » existe déjà.`,
      });
      return;
    }
    registerTenant({ tenantId: id, displayName: name });
    addToast({
      source: 'Espace de travail',
      type: 'success',
      message: `${name} enregistré. Basculez vers lui pour voir ses données.`,
    });
    setNewName('');
    setAdding(false);
  };

  // Rôle effectif — défaut 'owner' tant que MEMBERSHIPS n'est pas branché.
  // Le bouton « Brancher » est désactivé si le rôle ne permet pas la création.
  const actorRole: WorkspaceMembershipRole = 'owner';
  const canBranch = peutCreerBranche(actorRole);

  const handleBrancher = async (): Promise<void> => {
    const name = window.prompt(
      'Nom de la branche WorkSpace (kebab-case, max 64 caractères) :',
      `presentation-${new Date().toISOString().slice(0, 10)}`,
    );
    if (!name) return;
    const trimmed = name.trim();
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(trimmed)) {
      addToast({
        source: 'Brancher',
        type: 'warning',
        message: 'Nom invalide. kebab-case attendu (a-z, 0-9, tirets).',
      });
      return;
    }
    const r = await createBranch({
      tenantId: activeTenantId,
      name: trimmed,
      actorId: 'local-user',
      actorRole,
    });
    if (r.ok) {
      addToast({
        source: 'Brancher',
        type: 'success',
        message: `Branche « ${trimmed} » créée depuis ${activeTenantId}.`,
      });
    } else {
      addToast({
        source: 'Brancher',
        type: 'warning',
        message: `Création refusée : ${r.error}`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider px-2 pt-2 pb-1" style={{ color: 'var(--theme-text-muted)' }}>
        Espace de travail
      </div>

      {/* Current tenant — highlighted, with checkmark, also clickable to no-op. */}
      <div
        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium"
        style={{
          background: 'var(--theme-surface-hover)',
          color: 'var(--theme-text)',
        }}
      >
        <Building2 className="w-3.5 h-3.5" />
        <div className="flex-1 min-w-0">
          <div className="truncate font-semibold">{displayName || activeTenantId}</div>
          <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-dim)' }}>
            {activeTenantId}
          </div>
        </div>
        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      </div>

      {/* Other tenants — clickable to switch. */}
      {knownTenants
        .filter((t) => t.tenantId !== activeTenantId)
        .map((t) => (
          <button
            key={t.tenantId}
            type="button"
            onClick={() => handleSelect(t.tenantId)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Building2 className="w-3.5 h-3.5 opacity-70" />
            <div className="flex-1 min-w-0">
              <div className="truncate">{t.displayName}</div>
              <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-dim)' }}>
                {t.tenantId}
              </div>
            </div>
          </button>
        ))}

      {/* Inline "Register a workspace" form. */}
      {adding ? (
        <div className="flex items-center gap-1.5 px-1 pt-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="Nom de l'espace"
            className="flex-1 px-2 py-1.5 rounded-md text-[11.5px] outline-none"
            style={{
              background: 'var(--theme-bg)',
              color: 'var(--theme-text)',
              border: '1px solid var(--panel-border)',
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'var(--theme-accent)', color: '#fff' }}
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); }}
            aria-label="Annuler"
            className="px-2 py-1.5 rounded-md text-[10px] font-semibold"
            style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Enregistrer un espace
        </button>
      )}

      {/* Bouton « Brancher » — 2026-08-15 brief WORKSPACE_BRANCHES.
          Visible seulement pour les rôles qui peuvent créer une branche. */}
      {canBranch && (
        <button
          type="button"
          onClick={handleBrancher}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Brancher
        </button>
      )}

      {/* Bouton « Inviter un membre » — 2026-08-15 brief MEMBERSHIPS.
          Visible **uniquement** pour les owners du tenant actif. La
          détection lit la session + le store memberships (cf.
          memberships.store.ts). La modale remonte l'intention via
          un toast — l'appel API réel est branché ailleurs. */}
      {isOwner && (
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]"
          style={{ color: 'var(--theme-text-muted)' }}
          data-testid="invite-member-button"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Inviter un membre
        </button>
      )}

      {/* Modal d'invitation. Toujours rendue (cachée via open) pour
          éviter des montées/unmounts qui font perdre le focus. */}
      <InviteMember
        open={inviteOpen}
        tenantLabel={displayName || activeTenantId}
        onClose={() => setInviteOpen(false)}
        onSubmit={(input) => {
          addToast({
            source: 'Invitation',
            type: 'info',
            message: `Invitation ${input.role} envoyée à ${input.email} (en attente d'envoi réel).`,
          });
          setInviteOpen(false);
        }}
      />
    </div>
  );
}

// Default to demo-coach for back-compat with anything that imported the
// symbol directly before the relocation.
export const _TENANT_DEMO_COACH_HINT = TENANT_DEMO_COACH;
