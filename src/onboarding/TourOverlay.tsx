/** TourOverlay — the bubble + driver.
 *
 *  Lives at the root of the app (mounted from OnboardingApp). Reads from the
 *  tour store. For each running step:
 *    - subscribes to the shell store for window-position updates,
 *    - recomputes the bubble box on `requestAnimationFrame`,
 *    - if the target disappears (window closed, minimized, or selector miss)
 *      the step auto-advances — no orphan bubble ever sits on screen.
 *
 *  Rendered into a React Portal at `document.body` so its z-index escapes
 *  the stacking context of whatever window the source component lives in
 *  (the onboarding-app window has `motion.div` ancestors that create a
 *  stacking context — without the portal, our `z-index: 9999` is local).
 *
 *  This component renders NOTHING when the tour is idle / finished.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTourStore, resolveStepTarget, computeBubble, type TourDef } from './tourStore';
import { useShellStore } from '../stores/shell.store';

interface Props {
  /** Tour catalogue — looked up by id from the running tour. */
  catalogue: Record<string, TourDef>;
}

interface BubbleGeometry {
  top: number; left: number; placement: 'top' | 'bottom' | 'left' | 'right'; width: number;
  box: { top: number; left: number; right: number; bottom: number };
}

export function TourOverlay({ catalogue }: Props) {
  const status = useTourStore((s) => s.status);
  const tourId = useTourStore((s) => s.tourId);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const stop = useTourStore((s) => s.stop);
  const lastLostReason = useTourStore((s) => s.lastLostReason);

  const tour = tourId ? catalogue[tourId] : null;
  const step = tour?.steps[stepIndex];

  const [geom, setGeom] = useState<BubbleGeometry | null>(null);
  const lostRef = useRef(false);
  const advanceRef = useRef(false);

  // ─── Position tracking loop ───
  useEffect(() => {
    if (status !== 'running' || !step) {
      setGeom(null);
      return;
    }
    lostRef.current = false;
    advanceRef.current = false;

    let raf = 0;
    const tick = () => {
      const target = resolveStepTarget(step);
      if (!target) {
        // Target lost — surface reason.
        if (!lostRef.current) {
          lostRef.current = true;
          const win = step.windowId
            ? useShellStore.getState().windows.find((w) => w.id === step.windowId)
            : null;
          const reason: 'window-closed' | 'window-minimized' | 'selector-missing' =
            !win ? 'window-closed'
            : win.isMinimized ? 'window-minimized'
            : 'selector-missing';
          useTourStore.setState({ lastLostReason: reason });
        }
        // Action-bearing steps pause on "target lost" — the user is expected
        // to click the action button (e.g. "Ouvrir Clients") to open the
        // target themselves. Auto-advancing here would race the click.
        if (!step.onAction && !advanceRef.current) {
          advanceRef.current = true;
          // Wait a beat so the user sees the "lost" hint, then advance.
          window.setTimeout(() => {
            const cur = useTourStore.getState();
            if (cur.tourId === tourId && cur.stepIndex === stepIndex && cur.status === 'running') {
              if (stepIndex + 1 < (tour?.steps.length ?? 0)) {
                useTourStore.getState().next();
              } else {
                useTourStore.getState().stop();
              }
            }
          }, 900);
        }
        setGeom(null);
        return;
      }
      const next = computeBubble(target, step.anchor ?? 'auto');
      setGeom({ ...next, box: target.box });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, tourId, stepIndex, step, tour?.steps.length]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    if (status !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { useTourStore.getState().stop(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { useTourStore.getState().next(); }
      else if (e.key === 'ArrowLeft') { useTourStore.getState().back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  // Render even without a resolved target when the step has an `onAction` —
  // the user is expected to click the action button (e.g. "Ouvrir Clients")
  // to make the target appear. Without this, action steps are unreachable
  // from the UI when the target window isn't open yet.
  if (status !== 'running' || !tour || !step) return null;
  const hasAction = !!(step.onAction && step.actionLabel);
  if (!geom && !hasAction) return null;

  // When the target is missing but we still have an action, render the bubble
  // at a sensible fixed position (center-top of the viewport).
  const renderGeom = geom ?? { top: 80, left: 80, placement: 'top' as const, width: 320, box: { top: 0, left: 0, right: 0, bottom: 0 } };

  const isLast = stepIndex === tour.steps.length - 1;
  const isFirst = stepIndex === 0;

  // Render into document.body so z-index escapes the parent stacking context
  // (the onboarding window has `motion.div` ancestors that create one).
  const node = (
    <div
      data-testid="tour-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}
      aria-live="polite"
    >
      {/* spotlight ring around the target. Hidden when we only have an
          action button and no resolved target (the user is expected to
          click the button to make the target appear). */}
      {geom && (
        <div
          style={{
            position: 'absolute',
            top: geom.box.top - 4,
            left: geom.box.left - 4,
            width: geom.box.right - geom.box.left + 8,
            height: geom.box.bottom - geom.box.top + 8,
            border: '2px solid rgba(99, 102, 241, 0.85)',
            borderRadius: 8,
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            transition: 'top 80ms linear, left 80ms linear, width 80ms linear, height 80ms linear',
          }}
        />
      )}
      <AnimatePresence>
        <motion.div
          key={`${tourId}:${stepIndex}`}
          initial={{ opacity: 0, scale: 0.95, y: renderGeom.placement === 'top' ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'absolute',
            top: renderGeom.top + (renderGeom.placement === 'top' ? -1 : 0),
            left: renderGeom.left,
            width: renderGeom.width,
            pointerEvents: 'auto',
          }}
        >
          <div
            className="rounded-2xl shadow-2xl ring-1 ring-black/10"
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(8px)',
              padding: 16,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {tour.title} · {stepIndex + 1}/{tour.steps.length}
                </div>
                {step.title && (
                  <div className="mt-0.5 text-base font-semibold text-slate-900">{step.title}</div>
                )}
              </div>
              <button
                aria-label="Fermer la visite"
                onClick={() => stop()}
                className="text-slate-400 hover:text-slate-700 transition"
                style={{ pointerEvents: 'auto' }}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-snug text-slate-700 mb-3">{step.body}</p>

            {lastLostReason === 'window-closed' && !hasAction && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                La fenêtre ciblée a été fermée — passage à l'étape suivante.
              </p>
            )}
            {lastLostReason === 'window-closed' && hasAction && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                Cliquez sur le bouton ci-dessous pour ouvrir la fenêtre.
              </p>
            )}
            {lastLostReason === 'window-minimized' && !hasAction && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                La fenêtre ciblée a été réduite — passage à l'étape suivante.
              </p>
            )}
            {lastLostReason === 'window-minimized' && hasAction && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
                Cliquez sur le bouton ci-dessous pour ouvrir la fenêtre.
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {tour.steps.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: 999,
                      background: i === stepIndex ? '#6366f1' : 'rgba(99,102,241,0.25)',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {!isFirst && (
                  <button
                    onClick={() => back()}
                    className="px-2 py-1 text-xs rounded-lg text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Précédent
                  </button>
                )}
                {step.onAction && step.actionLabel && (
                  <button
                    onClick={() => step.onAction?.()}
                    className="px-3 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  >
                    {step.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => isLast ? stop() : next()}
                  className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1"
                >
                  {isLast ? 'Terminer' : 'Suivant'}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}
