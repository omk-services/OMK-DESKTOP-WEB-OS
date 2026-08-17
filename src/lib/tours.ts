/** UserTour onboarding — 5 flows mapped to the SOB 8 Domaines paradigm.
 *
 *  Design:
 *  - Each tour is gated by a per-tour env var (VITE_USERTOUR_CONTENT_<NAME>) that
 *    holds the UserTour content ID set in app.usertour.io. Missing → NO-OP.
 *  - Each tour is RGPD-safe: NO-OP unless observability consent is granted.
 *  - Each tour is idempotent per (browser profile, tourId) via localStorage
 *    guard `coach-os:tour-fired:<tourId>`. Pass `{ force: true }` to re-fire
 *    (used by the Settings → Help replay buttons).
 *  - `resetAllTourGuards()` clears every guard; called when the user revokes
 *    observability consent so a future opt-in can re-play the tours.
 *
 *  D1 rule: never hard-fail if the SDK is missing — graceful NO-OP so dev
 *  environments without a UserTour token still load cleanly. */

import usertour from 'usertour.js';
import { getObservabilityConsent, isObservabilityReady } from './observability';
import { createScopedStorage } from './auth/storage-scope';

export const TOUR_IDS = {
  WELCOME_SOB:      'welcome-sob',        // T1 — first window-open, SOB overview
  FIRST_STANDUP:    'first-standup',      // T2 — People → Overview
  SQUAD_DRILLDOWN:  'squad-drilldown',    // T3 — People → Squads, first agent open
  CADENCE:          'cadence',            // T4 — People → Cadence
  PRIVACY:          'privacy',            // T5 — Settings → Privacy
} as const;

export type TourId = typeof TOUR_IDS[keyof typeof TOUR_IDS];

/** Map tourId → env-var name that holds the UserTour content ID. */
const TOUR_CONTENT_ENV: Record<TourId, string> = {
  [TOUR_IDS.WELCOME_SOB]:     'VITE_USERTOUR_CONTENT_WELCOME',
  [TOUR_IDS.FIRST_STANDUP]:   'VITE_USERTOUR_CONTENT_STANDUP',
  [TOUR_IDS.SQUAD_DRILLDOWN]: 'VITE_USERTOUR_CONTENT_SQUAD',
  [TOUR_IDS.CADENCE]:         'VITE_USERTOUR_CONTENT_CADENCE',
  [TOUR_IDS.PRIVACY]:         'VITE_USERTOUR_CONTENT_PRIVACY',
};

// FIX-2 (2026-08-17) — clé logique `tour-fired:<id>` ; le wrapper
// ajoute `coach-os:<user>:<tenant>:` pour fermer la fuite inter-comptes.
const GUARD_PREFIX = 'tour-fired:';

function guardKey(tourId: TourId): string {
  return `${GUARD_PREFIX}${tourId}`;
}

function readGuard(tourId: TourId): boolean {
  try {
    return createScopedStorage().getItem(guardKey(tourId)) === 'true';
  } catch {
    // localStorage unavailable — treat as not-yet-fired so the gate is conservative
    return false;
  }
}

function writeGuard(tourId: TourId): void {
  try {
    createScopedStorage().setItem(guardKey(tourId), 'true');
  } catch {
    // best-effort; if storage is unavailable, the SDK will still fire this once
  }
}

function readContentId(tourId: TourId): string | null {
  const envName = TOUR_CONTENT_ENV[tourId];
  const value = (import.meta.env[envName] as string | undefined) ?? '';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export interface LaunchTourOptions {
  /** Bypass the localStorage guard and re-fire the tour even if already seen. */
  force?: boolean;
}

/** Fire a tour once per (browser profile, tourId).
 *
 *  NO-OP when:
 *    - observability consent is not granted (RGPD),
 *    - the UserTour SDK is not ready (no token / init failed),
 *    - the per-tour content ID env var is empty (A0 has not created the flow yet),
 *    - the tour has already fired in this profile AND options.force is not set.
 *
 *  On success: writes the per-tour localStorage guard. */
export async function launchTour(tourId: TourId, options: LaunchTourOptions = {}): Promise<void> {
  const force = options.force === true;

  if (!getObservabilityConsent()) {
    return; // RGPD: never fire a tour without explicit consent
  }

  const { usertour: utReady } = isObservabilityReady();
  if (!utReady) {
    return; // SDK not initialised (no token / init failed)
  }

  const contentId = readContentId(tourId);
  if (!contentId) {
    // A0 has not pasted the content ID yet — expected during scaffolding.
    console.info(`[tours] ${tourId} skipped: missing ${TOUR_CONTENT_ENV[tourId]}`);
    return;
  }

  if (!force && readGuard(tourId)) {
    return; // already fired in this profile
  }

  try {
    // usertour.start returns a Promise<void>. When force=true we pass
    // `once: false` to bypass the SDK's per-session dedup; the localStorage
    // guard handles cross-session dedup. When force is unset we use
    // `once: true` so a single session can't double-fire.
    await usertour.start(contentId, { once: !force });
    writeGuard(tourId);
  } catch (err: unknown) {
    console.info(`[tours] ${tourId} start failed`, { reason: getErrorMessage(err) });
  }
}

/** Clear every per-tour localStorage guard. Called when the user revokes
 *  observability consent so a future opt-in can re-play the tours. */
export function resetAllTourGuards(): void {
  try {
    const keys: string[] = [];
    // On itère via le wrapper scopé : seules les clés du scope courant
    // sont visibles. Si un autre onglet a posé des guards sous un
    // autre utilisateur, on ne les touche pas.
    const storage = createScopedStorage();
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k && k.startsWith(GUARD_PREFIX)) keys.push(k);
    }
    for (const k of keys) storage.removeItem(k);
  } catch {
    // best-effort
  }
}

/** True if this tour has already fired in the current browser profile. */
export function hasTourFired(tourId: TourId): boolean {
  return readGuard(tourId);
}
