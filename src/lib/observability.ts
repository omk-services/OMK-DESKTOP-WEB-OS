/** Observability — PostHog Cloud (EU) + UserTour, RGPD opt-in gated.
 *
 * Design:
 *  - Both SDKs are loaded at boot (lazy, non-blocking) but start in opted-out state.
 *  - Consent is persisted in `localStorage` under `coach-os:observability-opt-in`.
 *  - PostHog events sent before opt-in are no-ops (`opt_out_capturing_by_default`
 *    is mirrored at the SDK level via `opt_out_persistence_by_default`).
 *  - UserTour is initialized but no content is shown until a tour is started
 *    (which only happens on opt-in).
 *  - `identifyUser()` is a no-op when consent is not granted (RGPD: no profile
 *    is ever created without explicit opt-in).
 *
 * Dev note: `opt_out_capturing_by_default` is NOT a real PostHog key in
 * posthog-js@1.407.2; the correct key is `opt_out_persistence_by_default`.
 * Capture is suppressed at the persistence layer until consent is granted.
 */

import posthog from 'posthog-js';
import usertour from 'usertour.js';
import type { PostHogConfig } from 'posthog-js';
import { resetAllTourGuards } from './tours';

const CONSENT_KEY = 'coach-os:observability-opt-in';
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.posthog.com';
const UT_TOKEN = import.meta.env.VITE_USERTOUR_TOKEN as string | undefined;
const DEFAULT_OPT_IN = String(import.meta.env.VITE_OBSERVABILITY_OPT_IN ?? 'false').toLowerCase() === 'true';

let initialized = false;
let posthogReady = false;
let usertourReady = false;

/** Reads the persisted opt-in flag. Falls back to the build-time default. */
function readPersistedConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === null) return DEFAULT_OPT_IN;
    return raw === 'true';
  } catch {
    return DEFAULT_OPT_IN;
  }
}

/** Persists the opt-in flag. */
function writePersistedConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'true' : 'false');
  } catch {
    // localStorage unavailable — in-memory state still reflects the decision
  }
}

/** Initialises both SDKs once at app boot. Safe to call multiple times. */
export function initObservability(): void {
  if (initialized) return;
  initialized = true;

  // PostHog — only init if a project key is configured.
  if (PH_KEY && !PH_KEY.startsWith('phc_REPLACE_ME')) {
    const config: Partial<PostHogConfig> = {
      api_host: PH_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: false,
      cookieless_mode: 'on_reject',
      opt_out_persistence_by_default: true,
    };
    try {
      posthog.init(PH_KEY, config);
      posthogReady = true;
    } catch (err: unknown) {
      console.info('[observability] PostHog init skipped', { reason: getErrorMessage(err) });
    }
  }

  // UserTour — only init if a token is configured.
  if (UT_TOKEN && !UT_TOKEN.startsWith('ut_REPLACE_ME')) {
    try {
      usertour.init(UT_TOKEN);
      usertourReady = true;
    } catch (err: unknown) {
      console.info('[observability] UserTour init skipped', { reason: getErrorMessage(err) });
    }
  }

  // Apply the persisted consent state to both SDKs.
  const consent = readPersistedConsent();
  if (consent) {
    if (posthogReady) posthog.opt_in_capturing();
  } else {
    if (posthogReady) posthog.opt_out_capturing();
  }

  if (posthogReady || usertourReady) {
    console.info('[observability] initialised', { posthog: posthogReady, usertour: usertourReady, consent });
  }
}

/** Toggles consent for both SDKs and persists the decision. */
export function setObservabilityConsent(granted: boolean): void {
  writePersistedConsent(granted);

  if (posthogReady) {
    if (granted) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }

  if (usertourReady) {
    if (!granted) {
      // No `hide()` in usertour.js@0.0.24 — `endAll()` stops any active tour,
      // `reset()` clears the identified user so no profile is retained.
      void usertour.endAll().catch(() => undefined);
      usertour.reset();
      // Clear per-tour localStorage guards so a future opt-in can re-play
      // the tours (RGPD: the user is no longer "the same" consenting user).
      resetAllTourGuards();
    }
  }
}

/** Returns the current persisted consent state. */
export function getObservabilityConsent(): boolean {
  return readPersistedConsent();
}

/** Identifies the current user on both SDKs. NO-OP without consent. */
export function identifyUser(userId: string, traits: Record<string, unknown>): void {
  if (!readPersistedConsent()) return;

  if (posthogReady) {
    try {
      posthog.identify(userId, traits as Record<string, unknown>);
    } catch (err: unknown) {
      console.info('[observability] posthog.identify skipped', { reason: getErrorMessage(err) });
    }
  }

  if (usertourReady) {
    // usertour.identify expects Attributes, not free-form Record<string, unknown>;
    // narrow values that are not string|number|boolean|null|undefined.
    const safe: Record<string, string | number | boolean | null | undefined> = {};
    for (const [k, v] of Object.entries(traits)) {
      if (v === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof v)) {
        safe[k] = v as string | number | boolean | null | undefined;
      } else {
        safe[k] = String(v);
      }
    }
    void usertour.identify(userId, safe).catch((err: unknown) => {
      console.info('[observability] usertour.identify skipped', { reason: getErrorMessage(err) });
    });
  }
}

/** True if at least one SDK is ready to receive events. */
export function isObservabilityReady(): { posthog: boolean; usertour: boolean } {
  return { posthog: posthogReady, usertour: usertourReady };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
