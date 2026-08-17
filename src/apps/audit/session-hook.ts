// src/apps/audit/session-hook.ts
// Hook tolérant pour récupérer le tenantId de session sans planter si
// le store n'est pas encore initialisé (mode démo, premier rendu,
// navigation privée).

import { useTenantStore } from '../../stores/tenant.store';

export function useSessionStoreSafe(): { tenantId?: string } | null {
  try {
    const tenant = useTenantStore.getState().activeTenantId;
    return { tenantId: String(tenant) };
  } catch {
    return null;
  }
}