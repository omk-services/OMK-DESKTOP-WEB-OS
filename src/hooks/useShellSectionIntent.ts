/**
 * useShellSectionIntent — bridge that lets one app drive another's section.
 *
 * Use case: the Dashboard's CEO Cockpit wants to drill into Sales → Pipeline
 * with a single click. `openApp(id)` opens the window, but each app's active
 * section lives in local useState — there's no global API to set it. So we
 * dispatch a `coach-os:open-app-section` window event; apps that opt in via
 * this hook jump to the matching section on receipt.
 *
 * The hook filters by `appId` so an intent for `sales` doesn't leak into
 * `finance`. The callback is invoked with the requested section id; the
 * consumer is responsible for the actual `setActiveSection` (or whatever
 * local setter it uses).
 */
import { useEffect } from 'react';

interface ShellSectionIntent {
  appId: string;
  sectionId: string;
}

export function useShellSectionIntent(
  appId: string,
  onSection: (sectionId: string) => void,
): void {
  useEffect(() => {
    const handler = (e: Event): void => {
      const detail = (e as CustomEvent<ShellSectionIntent>).detail;
      if (!detail || detail.appId !== appId) return;
      if (typeof detail.sectionId === 'string' && detail.sectionId.length > 0) {
        onSection(detail.sectionId);
      }
    };
    window.addEventListener('coach-os:open-app-section', handler);
    return () => window.removeEventListener('coach-os:open-app-section', handler);
  }, [appId, onSection]);
}
