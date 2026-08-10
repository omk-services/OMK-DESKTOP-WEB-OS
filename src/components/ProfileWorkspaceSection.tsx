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
 *  The Profile menu is fixed-width (260px). The workspace section fits
 *  inside it: section header, list of known tenants with a check on
 *  the active one, click to switch, and an inline "Enregistrer un
 *  espace" form that creates a new tenant id and registers it.
 *
 *  Does not touch the partition layer: this is purely a relocation of
 *  the selector surface. The active tenant id, the registry of known
 *  tenants, and the CMS mirror all keep flowing through
 *  `useTenantStore` exactly as before. */
import { useEffect, useRef, useState } from 'react';
import { Building2, Check, Plus } from 'lucide-react';
import { useTenantStore, TENANT_DEMO_COACH } from '../stores/tenant.store';
import { useShellStore } from '../stores/shell.store';
import type { TenantId } from '../lib/tenant/contract';

export function ProfileWorkspaceSection(): import('react').ReactNode {
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const displayName = useTenantStore((s) => s.displayName);
  const knownTenants = useTenantStore((s) => s.knownTenants);
  const switchTenant = useTenantStore((s) => s.switchTenant);
  const registerTenant = useTenantStore((s) => s.registerTenant);
  const addToast = useShellStore((s) => s.addToast);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}

// Default to demo-coach for back-compat with anything that imported the
// symbol directly before the relocation.
export const _TENANT_DEMO_COACH_HINT = TENANT_DEMO_COACH;
