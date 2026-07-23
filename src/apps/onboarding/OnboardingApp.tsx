/** OnboardingApp — the citadel funnel: 4-question quiz → reveal screen
 *  presenting the personal live demo of the assigned Nexus instance (4 mini-apps
 *  in a real mini-Desktop-OS). The citadel is rendered via a portal into the
 *  document body (it owns its own windowed layers — not constrained to the
 *  Macro Coach OS AppFrame). The Macro WindowFrame wrapping here is left
 *  visually empty intentionally so that the desktop icon + close-workflow
 *  plumbing still works without duplicating visual chrome. */

import { Sparkles, Lock, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useDemoShellStore } from '../../lib/demoShell';
import { DemoWindowFrame } from './citadel/DemoWindowFrame';
import { DEMO_PANELS } from './citadel/demoApps';

interface QuizQuestion {
  id: string;
  prompt: string;
  helper?: string;
  options: { label: string; value: number }[];
}

const QUIZ: QuizQuestion[] = [
  {
    id: 'capture',
    prompt: 'Where do your client session notes live today?',
    helper: 'One answer — closest to reality.',
    options: [
      { label: 'On paper, in a notebook', value: 0 },
      { label: 'On my laptop (Dropbox / Drive / folders)', value: 1 },
      { label: 'In a CRM or dedicated tool', value: 2 },
    ],
  },
  {
    id: 'volume',
    prompt: 'How many premium sessions do you run per week?',
    helper: 'Avg over last 90 days.',
    options: [
      { label: 'Less than 5', value: 0 },
      { label: '5 to 12', value: 1 },
      { label: 'More than 12', value: 2 },
    ],
  },
  {
    id: 'leverage',
    prompt: 'If you stepped away for six months, how much of your IP would walk out the door with you?',
    helper: 'A gut-check, not an exact number.',
    options: [
      { label: 'Most of it — I carry it in my head', value: 0 },
      { label: 'Most of it would still be there in notes', value: 1 },
      { label: 'Honestly not sure', value: 2 },
    ],
  },
  {
    id: 'compliance',
    prompt: 'Do you currently document client work in a way that would survive a CCPA / Colorado AI Act audit?',
    options: [
      { label: 'No', value: 0 },
      { label: 'Partially', value: 1 },
      { label: 'Yes, fully', value: 2 },
    ],
  },
];

const ANSWER_SCORE = {
  capture: [3, 2, 0],
  volume: [1, 2, 3],
  leverage: [3, 1, 2],
  compliance: [3, 1, 0],
} as const;

function computeScore(answers: Record<string, number>): number {
  return Object.entries(answers).reduce((sum, [qid, idx]) => {
    const weights = ANSWER_SCORE[qid as keyof typeof ANSWER_SCORE];
    return sum + (weights?.[idx] ?? 0);
  }, 0);
}

function ScoreBand({ score }: { score: number }) {
  const maxScore = 12;
  const pct = Math.round((score / maxScore) * 100);
  if (pct >= 75) return { tone: 'Strong fit', color: '#15803d', bg: '#dcfce7', sub: 'Your onboarding answers indicate Nexus covers all four of your current gaps.' };
  if (pct >= 50) return { tone: 'Partial fit', color: '#b45309', bg: '#fef3c7', sub: 'Two of four gaps addressed directly. Book a 30-min audit to confirm.' };
  return { tone: 'Low fit', color: '#b91c1c', bg: '#fee2e2', sub: 'Your current stack is mature. A sales check-in can confirm whether Nexus adds anything.' };
}

const MINI_APP_ICONS = ['V', 'L', 'Q', 'C'] as const;

/** RevealLayer — owns the 4 real DemoWindowFrames that overlay each other.
 *  Hooks are called at the top of this component (never inside conditionals). */
function RevealLayer() {
  const demoWindows = useDemoShellStore(s => s.windows);
  return (
    <>
      {DEMO_PANELS.map(p => {
        const win = demoWindows.find(w => w.id === p.id);
        if (!win) return null;
        const PanelBody = p.render;
        return (
          <DemoWindowFrame key={p.id} id={p.id} title={p.title} accent={p.accent}>
            <PanelBody />
          </DemoWindowFrame>
        );
      })}
    </>
  );
}

/** CitadelLayer — owns the citadel window (DemoWindowFrame) and its quiz/reveal UI.
 *  Position is fixed (anchored to viewport) because the parent portal target is <body>,
 *  so the citadel owns the full screen until maximized. */
function CitadelLayer() {
  const windows = useDemoShellStore(s => s.windows);
  const [phase, setPhase] = useState<'quiz' | 'reveal'>('quiz');
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const citadelId = '__citadel__';
  const citadelWin = windows.find(w => w.id === citadelId);

  if (!citadelWin || !citadelWin.isOpen) return null;

  const score = computeScore(answers);
  const band = phase === 'reveal' ? ScoreBand({ score }) : null;
  const isMaximized = citadelWin.isMaximized;
  const q = QUIZ[stepIdx];
  const isLast = stepIdx === QUIZ.length - 1;
  const allAnswered = Object.keys(answers).length === QUIZ.length;

  // The citadel window is rendered as a fullscreen anchored frame (top:0,
  // height: 100vh, width: 100vw) — visually it's the Onboarding experience in
  // its own screen. Only the QUIZ phase shows inside it; the reveal phase ALSO
  // opens the 4 mini-apps (which register themselves in the demo shell store)
  // and overlays them on top of this citadel surface.
  return (
    <div
      data-citrine-citadel
      className="fixed inset-x-0 top-0 bottom-0 z-[10000] bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-none"
      style={{ height: '100vh' }}
    >
      <div
        className="absolute pointer-events-auto"
        style={{
          top: isMaximized ? 32 : citadelWin.position.y,
          left: isMaximized ? 0 : citadelWin.position.x,
          width: isMaximized ? '100vw' : Math.min(citadelWin.size.width, window.innerWidth),
          height: isMaximized ? 'calc(100vh - 32px)' : Math.min(citadelWin.size.height, window.innerHeight),
          zIndex: 50,
        }}
      >
        <DemoWindowFrame
          id={citadelId}
          title="demo-coach · your Nexus preview"
          accent={isMaximized ? '#0f766e' : '#0d9488'}
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(circle at top right, #0d948815 0%, transparent 60%), linear-gradient(135deg, #f0fdfa 0%, #fafaf9 100%)' }}>
            <div className="h-7 px-3 flex items-center justify-between text-[10px] font-medium text-stone-500 border-b border-emerald-100 bg-emerald-50/40">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Zero-PII sandbox · this preview runs entirely in your browser</span>
              </div>
              <div className="flex items-center gap-3">
                {phase === 'quiz' && <span>Q{stepIdx + 1} / {QUIZ.length}</span>}
                {phase === 'reveal' && (
                  <button
                    onClick={() => { setPhase('quiz'); setStepIdx(0); setAnswers({}); }}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800"
                  >
                    <RotateCcw className="w-3 h-3" /> Restart
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {phase === 'quiz' && (
                <motion.div
                  key={`quiz-${stepIdx}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-x-0 top-7 bottom-0 flex"
                >
                  <div className="w-[42%] p-7 flex flex-col justify-center border-r border-emerald-100 bg-white/60">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{q.id === 'capture' ? 'Step 1 of 4 · Capture' : q.id === 'volume' ? 'Step 2 of 4 · Volume' : q.id === 'leverage' ? 'Step 3 of 4 · Leverage' : 'Step 4 of 4 · Compliance'}</div>
                    <h2 className="text-[22px] font-bold tracking-tight text-stone-900 font-outfit mt-2 leading-tight">{q.prompt}</h2>
                    {q.helper && <p className="text-[13px] text-stone-500 mt-2 leading-snug">{q.helper}</p>}

                    <div className="mt-5 flex flex-col gap-2.5">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                            className={`text-left rounded-xl border px-4 py-3 transition-all ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-emerald-500' : 'border-stone-300'
                              }`}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                              </span>
                              <span className={`text-[13px] font-medium ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>{opt.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                        disabled={stepIdx === 0}
                        className="text-[12px] font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => {
                          if (answers[q.id] === undefined) return;
                          if (isLast) setPhase('reveal');
                          else setStepIdx(stepIdx + 1);
                        }}
                        disabled={answers[q.id] === undefined}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: '#0d9488' }}
                      >
                        {isLast ? 'See your demo instance' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-5">
                      {QUIZ.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-emerald-500' : 'bg-stone-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 relative p-5 overflow-hidden bg-stone-50">
                    <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Your future demo instance</div>
                    <div className="mt-6 grid grid-cols-2 grid-rows-2 gap-3 h-[calc(100%-2.25rem)]">
                      {DEMO_PANELS.map((p, i) => {
                        const IconChar = MINI_APP_ICONS[i];
                        return (
                          <div key={p.id} className="relative bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="h-6 px-2 flex items-center gap-1 bg-stone-50 border-b border-stone-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                              <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wider truncate" style={{ color: p.accent }}>{p.title}</span>
                            </div>
                            <div className="aspect-[3/2] flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-extrabold shadow-sm"
                                   style={{ background: `${p.accent}1f`, color: p.accent }}>
                                {IconChar}
                              </div>
                              <div className="text-[10.5px] font-bold text-stone-600 mt-2 uppercase tracking-wider">{p.title}</div>
                              <div className="text-[9px] text-stone-400 mt-0.5 px-2 text-center">{p.id === 'ip-vault' ? 'Sanctuary' : p.id === 'apps' ? 'Compounding' : p.id === 'quiz-result' ? 'Diagnostic' : 'Compliance'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!allAnswered && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1 text-[10px] font-semibold text-stone-500 border border-stone-200">
                          Answer all four to populate each panel with your numbers
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {phase === 'reveal' && band && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-x-0 top-7 bottom-0 flex flex-col"
                >
                  <div className="px-7 py-4 border-b border-emerald-100" style={{ background: band.bg }}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5" style={{ color: band.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: band.color }}>Your fit band</div>
                        <div className="text-[15px] font-bold mt-0.5" style={{ color: band.color }}>{band.tone} · score {score} / 12</div>
                        <p className="text-[12px] text-stone-700 mt-0.5">{band.sub}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DemoWindowFrame>
      </div>

      {/* Reveal-phase mini-app windows sit on top of the citadel. */}
      {phase === 'reveal' && <RevealLayer />}
    </div>
  );
}

/** Lifecycle hook — opens the citadel window + pre-opens the 4 mini-app windows
 *  on every mount. Boot order is intentional: citadel first (so opening via
 *  the desktop icon gives the user the quiz first), then mini-apps revealed. */
function useCitadelBoot() {
  const openApp = useDemoShellStore(s => s.openApp);
  const closeAll = useDemoShellStore(s => s.closeAll);
  const bootCitadel = useDemoShellStore(s => s.bootCitadel);
  const windows = useDemoShellStore(s => s.windows);

  useEffect(() => {
    closeAll();
    openApp('__citadel__', 'demo-coach · your Nexus preview');
    DEMO_PANELS.forEach(p => {
      if (!windows.some(w => w.id === p.id)) openApp(p.id, p.title);
    });
    bootCitadel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function OnboardingApp() {
  useCitadelBoot();
  // Render the citadel into <body> so it survives unmounts of the Macro shell
  // chrome (Zustand-persisted) and so its drag-to-desktop coordinates hit the
  // viewport, not a small AppFrame.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (typeof document === 'undefined') return null;
  return createPortal(<CitadelLayer />, document.body);
}
