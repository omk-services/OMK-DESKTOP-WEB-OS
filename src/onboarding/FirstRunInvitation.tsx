/** FirstRunInvitation — discreet welcome card on the very first launch.
 *
 *  Why this exists (BRIEF L §1):
 *    TourOverlay lives at the shell level so a tour survives the closing
 *    of any window. But the user who has never seen Coach OS does not
 *    know tours exist — they would never open Onboarding, where the
 *    replay launcher lives. So we surface the offer once, on the real
 *    desktop, immediately after authentication.
 *
 *  Rules (per the brief):
 *    - Proposes, never imposes. No veil that blocks input.
 *    - Persists: a refusal or a launch both mark the tour as fired.
 *      The card never reappears of its own accord.
 *    - Launching the tour here opens the tour on the real shell.
 *    - Replay always available from the Onboarding app.
 *
 *  Mount: <Desktop /> in src/components/Desktop.tsx. The card sits in a
 *  Portal at document.body so its z-index escapes whatever window is on
 *  top when authentication completes.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { hasTourV2Fired, useTourStore } from './tourStore';
import { TOURS } from '../apps/onboarding/tours/threeTours';

const FIRST_RUN_TOUR_ID = 'g-first-open';
const FIRST_RUN_DISMISS_KEY = 'coach-os:welcome-card:dismissed:v1';

interface FirstRunInvitationProps {
  /** When true, the card mounts. Pass an app-level flag — for example
   *  `boot.mode === 'demo'` or just the post-authentication moment. The
   *  card itself decides whether it should appear via the localStorage
   *  guard. */
  enabled: boolean;
}

export function FirstRunInvitation({ enabled }: FirstRunInvitationProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const start = useTourStore((s) => s.start);
  const replay = useTourStore((s) => s.replay);
  const status = useTourStore((s) => s.status);

  // Decide visibility once on mount. We never re-decide — once dismissed
  // (by any path), the card stays dismissed for this browser profile.
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(FIRST_RUN_DISMISS_KEY) === 'true') return;
    } catch {
      // localStorage may be unavailable (private mode, quota): fall through
      // to the tour-fired guard which also writes to localStorage.
    }
    if (hasTourV2Fired(FIRST_RUN_TOUR_ID)) return;
    setShouldShow(true);
  }, [enabled]);

  // If a tour starts running (e.g. the user clicked "Faire le tour"), hide
  // the card. TourOverlay takes over the screen with the spotlight ring.
  useEffect(() => {
    if (status === 'running') setShouldShow(false);
  }, [status]);

  const dismissPermanently = (): void => {
    try {
      window.localStorage.setItem(FIRST_RUN_DISMISS_KEY, 'true');
    } catch { /* best-effort */ }
    setShouldShow(false);
  };

  const handleStart = (): void => {
    if (hasTourV2Fired(FIRST_RUN_TOUR_ID)) {
      replay(FIRST_RUN_TOUR_ID);
    } else {
      start(FIRST_RUN_TOUR_ID);
    }
    dismissPermanently();
  };

  const handleSkip = (): void => {
    dismissPermanently();
  };

  if (typeof document === 'undefined') return null;

  const tour = TOURS[FIRST_RUN_TOUR_ID];
  const stepCount = tour?.steps.length ?? 0;

  return createPortal(
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="first-run-invitation"
          data-testid="first-run-invitation"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[4900] w-[min(96vw,420px)] rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(10px)',
          }}
          role="dialog"
          aria-labelledby="first-run-invitation-title"
        >
          <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
              <div className="min-w-0">
                <div id="first-run-invitation-title" className="text-[13px] font-semibold text-slate-900">
                  Faire le tour ?
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  {stepCount > 0
                    ? `${stepCount} étapes · ~1 minute · on suit vos fenêtres`
                    : 'Une visite guidée du bureau'}
                </div>
              </div>
            </div>
            <button
              onClick={handleSkip}
              aria-label="Fermer l'invitation"
              className="text-slate-400 hover:text-slate-700 -mt-1 -mr-1 p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </div>

          <p className="px-4 text-[11.5px] text-slate-600 leading-snug pb-3">
            On ouvre le bureau, le dock, la barre du haut — et on vous montre
            comment lancer votre première app. Échap interrompt à tout moment.
          </p>

          <div className="flex items-center justify-end gap-1 px-3 py-2 border-t border-slate-100" style={{ background: 'var(--theme-surface-hover)' }}>
            <button
              onClick={handleSkip}
              data-testid="first-run-skip"
              className="px-3 py-1.5 text-[11.5px] font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              Plus tard
            </button>
            <button
              onClick={handleStart}
              data-testid="first-run-start"
              className="px-3 py-1.5 text-[11.5px] font-semibold rounded-lg text-white transition flex items-center gap-1 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Faire le tour <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}