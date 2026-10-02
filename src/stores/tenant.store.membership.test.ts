// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    purge: vi.fn(),
    getSession: vi.fn(),
    listerTenants: vi.fn(),
    useBackend: vi.fn(),
  };
});

vi.mock('../lib/auth/storage-scope', () => ({
  createScopedStorage: () => ({
    getItem: (key: string) => h.storage.get(key) ?? null,
    setItem: (key: string, value: string) => h.storage.set(key, value),
    removeItem: (key: string) => h.storage.delete(key),
  }),
}));

vi.mock('../lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: { auth: { getSession: (...args: unknown[]) => h.getSession(...args) } },
}));

vi.mock('../lib/auth/backend.supabase', () => ({
  maybeUseSupabaseMembershipBackend: (...args: unknown[]) => h.useBackend(...args),
}));

vi.mock('../lib/auth/memberships', () => ({
  listerTenantsPourUser: (...args: unknown[]) => h.listerTenants(...args),
}));

vi.mock('../lib/cms/cms.store', () => ({
  useCmsStore: { getState: () => ({ purge: h.purge }) },
}));

import { TENANT_DEMO_COACH, useTenantStore } from './tenant.store';

const VERSION_KEY = 'coach-os:activeTenantId.version';
const STORAGE_KEY = 'coach-os:activeTenantId';

function resetStore() {
  useTenantStore.setState({
    activeTenantId: TENANT_DEMO_COACH,
    displayName: 'demo-coach',
    isLoading: false,
    error: null,
    knownTenants: [{ tenantId: TENANT_DEMO_COACH, displayName: 'demo-coach' }],
  });
}

describe('tenant store - authenticated membership hydration', () => {
  beforeEach(() => {
    h.storage.clear();
    h.purge.mockReset();
    h.getSession.mockReset();
    h.listerTenants.mockReset();
    h.useBackend.mockReset();
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    resetStore();
  });

  it('exposes two memberships and rejects a stale persisted tenant', async () => {
    h.storage.set(VERSION_KEY, '1');
    h.storage.set(STORAGE_KEY, 'tenant-stale');
    h.listerTenants.mockResolvedValue({
      ok: true,
      tenants: ['tenant-a', 'tenant-b'],
    });

    await useTenantStore.getState().bootstrap();

    const state = useTenantStore.getState();
    expect(state.knownTenants.map((x) => x.tenantId)).toEqual(['tenant-a', 'tenant-b']);
    expect(state.activeTenantId).toBe('tenant-a');
    expect(state.displayName).toBe('tenant-a');
    expect(h.useBackend).toHaveBeenCalledTimes(1);
    expect(h.listerTenants).toHaveBeenCalledWith('user-1');
  });

  it('preserves an authorized persisted tenant across bootstrap', async () => {
    h.storage.set(VERSION_KEY, '1');
    h.storage.set(STORAGE_KEY, 'tenant-b');
    h.listerTenants.mockResolvedValue({
      ok: true,
      tenants: ['tenant-a', 'tenant-b'],
    });

    await useTenantStore.getState().bootstrap();

    expect(useTenantStore.getState().activeTenantId).toBe('tenant-b');
  });

  it('purges previous tenant CMS state when switching T1 to T2', async () => {
    useTenantStore.setState({
      activeTenantId: 'tenant-a' as never,
      knownTenants: [
        { tenantId: 'tenant-a' as never, displayName: 'Tenant A' },
        { tenantId: 'tenant-b' as never, displayName: 'Tenant B' },
      ],
    });

    await useTenantStore.getState().switchTenant('tenant-b' as never);

    expect(h.purge).toHaveBeenCalledWith('tenant-a');
    expect(useTenantStore.getState().activeTenantId).toBe('tenant-b');
    expect(useTenantStore.getState().displayName).toBe('Tenant B');
    expect(h.storage.get(STORAGE_KEY)).toBe('tenant-b');
    expect(h.storage.get(VERSION_KEY)).toBe('1');
  });

  it('keeps explicit demo fallback for an unauthenticated session', async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    await useTenantStore.getState().bootstrap();

    expect(useTenantStore.getState().activeTenantId).toBe(TENANT_DEMO_COACH);
    expect(useTenantStore.getState().knownTenants).toEqual([
      { tenantId: TENANT_DEMO_COACH, displayName: 'demo-coach' },
    ]);
    expect(h.listerTenants).not.toHaveBeenCalled();
  });
});
