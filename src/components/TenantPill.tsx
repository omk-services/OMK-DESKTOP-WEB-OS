/** TenantPill — visible multi-tenant selector in the TopBar.
 *
 *  Reads from `useTenantStore` (Phase 3 store) and renders the active
 *  tenant with a dropdown to switch. Today there's only one known
 *  tenant (demo-coach) — switching is a no-op for state beyond the
 *  display name, but the contract and persistence are real so adding
 *  a second tenant is a one-line change in `tenant.store.ts`.
 *
 *  Surfaces a feature that was wired in the backend (cms.store mirrors
 *  tenant id, seedFor hydrates per-tenant) but invisible to the user.
 */
import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useTenantStore, TENANT_DEMO_COACH } from '../stores/tenant.store';
import { useShellStore } from '../stores/shell.store';
import type { TenantId } from '../lib/tenant/contract';

export function TenantPill() {
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const displayName = useTenantStore((s) => s.displayName);
  const knownTenants = useTenantStore((s) => s.knownTenants);
  const switchTenant = useTenantStore((s) => s.switchTenant);
  const registerTenant = useTenantStore((s) => s.registerTenant);
  const addToast = useShellStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (id: TenantId) => {
    if (id === activeTenantId) {
      setOpen(false);
      return;
    }
    await switchTenant(id);
    setOpen(false);
    addToast({
      source: 'Tenant',
      type: 'success',
      message: `Switched to ${knownTenants.find((t) => t.tenantId === id)?.displayName ?? id}`,
    });
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32) as TenantId;
    if (knownTenants.some((t) => t.tenantId === id)) {
      addToast({ source: 'Tenant', type: 'warning', message: `Tenant "${id}" already exists.` });
      return;
    }
    registerTenant({ tenantId: id, displayName: name });
    addToast({
      source: 'Tenant',
      type: 'success',
      message: `Registered ${name}. Switch to it to see their seeded data.`,
    });
    setNewName('');
    setAdding(false);
  };

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Tenant selector"
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10.5px] font-semibold uppercase tracking-wider transition-all hover:opacity-90"
        style={{
          color: 'var(--theme-text)',
          background: 'var(--theme-surface-hover)',
          boxShadow: 'inset 0 0 0 1px var(--panel-border)',
        }}
      >
        <Building2 className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-[6000] w-72 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--panel-border)',
          }}
          role="menu"
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Tenants
          </div>
          <div className="max-h-64 overflow-y-auto">
            {knownTenants.map((t) => (
              <button
                key={t.tenantId}
                type="button"
                onClick={() => handleSelect(t.tenantId)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors hover:bg-[var(--theme-surface-hover)]"
                style={{ color: 'var(--theme-text)' }}
                role="menuitem"
              >
                <Building2 className="w-3.5 h-3.5 opacity-70" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.displayName}</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-dim)' }}>
                    {t.tenantId}
                  </div>
                </div>
                {t.tenantId === activeTenantId && (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            ))}
            {knownTenants.length === 0 && (
              <div className="px-3 py-3 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                No tenants yet.
              </div>
            )}
          </div>

          <div className="border-t" style={{ borderColor: 'var(--panel-border-subtle)' }}>
            {adding ? (
              <div className="p-2 flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                  placeholder="New tenant name"
                  className="flex-1 px-2 py-1.5 rounded-md text-[12px] outline-none"
                  style={{
                    background: 'var(--theme-bg)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--panel-border)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold"
                  style={{ background: 'var(--theme-accent)', color: '#fff' }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(''); }}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold"
                  style={{ background: 'var(--theme-surface-hover)', color: 'var(--theme-text-muted)' }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-[var(--theme-surface-hover)]"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Register a tenant
              </button>
            )}
          </div>

          <div className="px-3 py-2 text-[10px] border-t" style={{ color: 'var(--theme-text-dim)', borderColor: 'var(--panel-border-subtle)' }}>
            Demo seed only. The store and CMS are partitioned per tenant — adding a second tenant
            with `seedFor(tenantId)` will hydrate its own data.
          </div>
        </div>
      )}
    </div>
  );
}

// Default to demo-coach for back-compat with anything that imported the
// symbol directly before the store was created.
export const _TENANT_DEMO_COACH_HINT = TENANT_DEMO_COACH;
