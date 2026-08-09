import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/app-discovery'; // side-effect: registers all apps before first render
import { initObservability } from './lib/observability';
import { initWindowOpenTracker } from './lib/windowOpenTracker';
import { useTenantStore } from './stores/tenant.store';
import { useCmsStore } from './lib/cms/cms.store';
import App from './App';

initObservability();
initWindowOpenTracker();

/* Bootstrap the tenant store (Phase 3 multi-tenant, 2026-08-09).
 *
 * The tenant store is the single source of truth for "who am I right
 * now". `bootstrap()` reads the persisted id from localStorage, falling
 * back to `demo-coach` (the seed-matching default). After bootstrap, the
 * CMS store is synced with the active tenant and `seedFor(tenantId)`
 * makes sure every collection is registered under that tenant.
 *
 * The `seedCms()` call inside `app-discovery.ts` already registers every
 * collection under the active tenant at module-load, but the explicit
 * `seedFor()` is the canonical wiring: it survives a future where the
 * active tenant changes before any seed has run.
 *
 * Done before `render()` so the first paint already has the right
 * tenant's data — no flash of empty state. */
void useTenantStore
  .getState()
  .bootstrap()
  .then(() => {
    const tenantId = useTenantStore.getState().activeTenantId;
    useCmsStore.getState().setTenant(tenantId);
    return useCmsStore.getState().seedFor(tenantId);
  })
  .catch((err: unknown) => {
    // Bootstrap failure is non-fatal — the demo seed already ran via
    // app-discovery; the user sees the default `demo-coach` tenant
    // either way. Log so it surfaces in observability dashboards.
    // eslint-disable-next-line no-console
    console.warn('[tenant] bootstrap failed:', err);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
