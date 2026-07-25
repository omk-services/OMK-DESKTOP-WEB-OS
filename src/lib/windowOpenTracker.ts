/** Window-open tracker — fires `first_window_open` exactly once.
 *
 * Subscribes to the desktop shell store (zustand) and watches for the first
 * `isOpen: true` window. The event is persisted in localStorage so it
 * survives reloads within the same browser profile.
 *
 * If observability consent is granted, this also starts any active UserTour
 * flow (`usertour.start` requires a `contentId` — if none is configured we
 * no-op silently).
 */

import { useShellStore } from '../stores/shell.store';
import posthog from 'posthog-js';
import { getObservabilityConsent, isObservabilityReady } from './observability';
import { launchTour, TOUR_IDS } from './tours';

const ONCE_KEY = 'coach-os:first-window-open-fired';
const CONTENT_ID_ENV = (import.meta.env.VITE_USERTOUR_CONTENT_ID as string | undefined) ?? '';

let started = false;

export function initWindowOpenTracker(): void {
  if (started) return;
  started = true;

  // If we already fired in a prior session, don't subscribe.
  try {
    if (localStorage.getItem(ONCE_KEY) === 'true') return;
  } catch {
    // localStorage unavailable — fall through, will dedupe via in-memory flag.
  }

  const unsubscribe = useShellStore.subscribe((state) => {
    const open = state.windows.find((w) => w.isOpen);
    if (!open) return;

    // Mark fired (persisted + in-memory) and unsubscribe.
    try {
      localStorage.setItem(ONCE_KEY, 'true');
    } catch {
      // noop
    }
    unsubscribe();

    const { posthog: phReady, usertour: utReady } = isObservabilityReady();

    if (phReady && getObservabilityConsent()) {
      try {
        posthog.capture('first_window_open', { window_id: open.id, window_title: open.title });
      } catch {
        // capture is best-effort
      }
    }

    if (utReady && getObservabilityConsent() && CONTENT_ID_ENV) {
      import('usertour.js')
        .then((mod) => {
          const usertour = mod.default;
          return usertour.start(CONTENT_ID_ENV).catch(() => undefined);
        })
        .catch(() => undefined);
    }

    // T1 — fire the SOB welcome tour after the first window opens.
    // Replaces the legacy single-content-id flow with the 5-tour paradigm;
    // no-ops cleanly when consent is off or the env content id is missing.
    if (utReady && getObservabilityConsent()) {
      void launchTour(TOUR_IDS.WELCOME_SOB);
    }
  });
}
