/** OnboardingApp — Mini Desktop OS rendered INSIDE the Macro Coach OS WindowFrame.
 *
 *  Layer model (outside → inside):
 *    1. Macro Coach OS (Desktop.tsx) — full product, all business domain apps
 *    2. Macro WindowFrame — provides the mac-style traffic lights (red/amber/green)
 *       via the global WindowFrame component, giving the prospect the standard
 *       desktop-window affordances on the Onboarding app window itself
 *    3. THIS Mini Desktop OS — wallpaper + mini topbar + dock + window area,
 *       a faithful reproduction of the Macro Desktop OS (Life OS-inspired design)
 *    4. Mini-app windows (citadel quiz, IP Vault, Audit, Compliance, etc.) —
 *       live INSIDE the Mini Desktop, each is a real draggable/resizable window
 *
 *  Close flow: clicking the red light on the Macro WindowFrame reveals the full
 *  Macro Desktop with all business domain apps — the "prospect reveals the
 *  product" handoff per the GTM campaign. */

import { useEffect, useState } from 'react';
import { Sparkles, Lock, ShieldCheck, ArrowRight, RotateCcw, Leaf, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDemoShellStore, hasSeenCitadel, markCitadelSeen } from '../../lib/demoShell';
import { DemoWindowFrame } from './citadel/DemoWindowFrame';
import { DEMO_PANELS } from './citadel/demoApps';
import { MiniDock } from './citadel/MiniDock';

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

/** OpenPanelsLayer — renders ALL demo panels currently open in the Mini
 *  Desktop (the 4 reveal-phase panels + the audit panel, all dock-launched).
 *  Each is a FULL free-floating Mini Desktop window with its own DemoWindowFrame
 *  (traffic lights, drag, resize, focus). They render in the Mini Desktop's
 *  window area, NOT nested inside the citadel. */
function OpenPanelsLayer() {
  const demoWindows = useDemoShellStore(s => s.windows);
  return (
    <>
      {demoWindows
        .filter(w => w.id !== '__citadel__' && w.isOpen && !w.isMinimized)
        .map(w => {
          const panel = DEMO_PANELS.find(p => p.id === w.id);
          if (!panel) return null;
          const PanelBody = panel.render;
          return (
            <DemoWindowFrame key={w.id} id={w.id} title={panel.title} accent={panel.accent}>
              <PanelBody />
            </DemoWindowFrame>
          );
        })}
    </>
  );
}

/** CitadelPanel — the citadel quiz + reveal flow. During QUIZ phase it shows
 *  the full quiz UI (left panel = questions + options, right panel = future
 *  demo instance preview). During REVEAL phase it shrinks to a slim score-band
 *  window at the top, and the 4 personal-preview panels open as FREE-FLOATING
 *  windows in the Mini Desktop window area (rendered by OpenPanelsLayer).
 *  This makes the audit results feel like real desktop windows the prospect
 *  can drag, resize, and arrange — matching the Life OS / Macro Desktop UX. */
function CitadelPanel() {
  const windows = useDemoShellStore(s => s.windows);
  const [phase, setPhase] = useState<'quiz' | 'reveal'>('quiz');
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const citadelId = '__citadel__';
  const citadelWin = windows.find(w => w.id === citadelId);

  // When entering reveal phase:
  //   1. SHRINK the citadel to a slim score-band window at the top
  //   2. OPEN the 4 personal-preview panels as FREE-FLOATING windows in the
  //      Mini Desktop window area (2×2 grid, large)
  useEffect(() => {
    if (phase !== 'reveal') return;
    const store = useDemoShellStore.getState();
    // 1. Shrink citadel to score-band only (slim 60px)
    useDemoShellStore.setState({
      windows: useDemoShellStore.getState().windows.map(w =>
        w.id === '__citadel__'
          ? { ...w, position: { x: 12, y: 38 }, size: { width: 720, height: 60 } }
          : w
      ),
    });
    // 2. Open the 4 panels as large free-floating windows (2×2 grid)
    DEMO_PANELS.slice(0, 4).forEach((p, i) => {
      store.openApp(p.id, p.title);
      const col = i % 2;
      const row = Math.floor(i / 2);
      useDemoShellStore.setState({
        windows: useDemoShellStore.getState().windows.map(w =>
          w.id === p.id
            ? { ...w, position: { x: 12 + col * 358, y: 110 + row * 200 }, size: { width: 348, height: 188 } }
            : w
        ),
      });
    });
  }, [phase]);

  if (!citadelWin || !citadelWin.isOpen) return null;

  const score = computeScore(answers);
  const band = phase === 'reveal' ? ScoreBand({ score }) : null;
  const q = QUIZ[stepIdx];
  const isLast = stepIdx === QUIZ.length - 1;
  const allAnswered = Object.keys(answers).length === QUIZ.length;

  return (
    <DemoWindowFrame
      id={citadelId}
      title="Nexus Quiz · your personal preview"
      accent="#0d9488"
      icon={<Sparkles className="w-3.5 h-3.5" />}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(circle at top right, #0d948815 0%, transparent 60%), linear-gradient(135deg, #f0fdfa 0%, #fafaf9 100%)' }}>
        <div className="h-6 px-3 flex items-center justify-between text-[10px] font-medium text-stone-500 border-b border-emerald-100 bg-emerald-50/40">
          <div className="flex items-center gap-1.5">
            <Lock className="w-2.5 h-2.5 text-emerald-600" />
            <span>Zero-PII sandbox · runs entirely in your browser</span>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'quiz' && <span>Q{stepIdx + 1} / {QUIZ.length}</span>}
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
              <div className="w-[42%] p-5 flex flex-col justify-center border-r border-emerald-100 bg-white/60 overflow-auto custom-scrollbar">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{q.id === 'capture' ? 'Step 1 of 4 · Capture' : q.id === 'volume' ? 'Step 2 of 4 · Volume' : q.id === 'leverage' ? 'Step 3 of 4 · Leverage' : 'Step 4 of 4 · Compliance'}</div>
                <h2 className="text-[18px] font-bold tracking-tight text-stone-900 font-outfit mt-1.5 leading-tight">{q.prompt}</h2>
                {q.helper && <p className="text-[12px] text-stone-500 mt-1.5 leading-snug">{q.helper}</p>}

                <div className="mt-4 flex flex-col gap-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                        className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-500' : 'border-stone-300'
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                          </span>
                          <span className={`text-[12.5px] font-medium ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>{opt.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                    disabled={stepIdx === 0}
                    className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold text-white shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: '#0d9488' }}
                  >
                    {isLast ? 'See your demo' : 'Next'} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 mt-4">
                  {QUIZ.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-emerald-500' : 'bg-stone-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 relative p-4 overflow-hidden bg-stone-50">
                <div className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">Your future demo instance</div>
                <div className="mt-5 grid grid-cols-2 grid-rows-2 gap-2 h-[calc(100%-2rem)]">
                  {DEMO_PANELS.slice(0, 4).map((p, i) => {
                    const IconChar = MINI_APP_ICONS[i];
                    return (
                      <div key={p.id} className="relative bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                        <div className="h-5 px-2 flex items-center gap-1 bg-stone-50 border-b border-stone-100">
                          <span className="w-1 h-1 rounded-full bg-stone-300" />
                          <span className="w-1 h-1 rounded-full bg-stone-300" />
                          <span className="w-1 h-1 rounded-full bg-stone-300" />
                          <span className="ml-1.5 text-[8.5px] font-semibold uppercase tracking-wider truncate" style={{ color: p.accent }}>{p.title}</span>
                        </div>
                        <div className="aspect-[3/2] flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold shadow-sm"
                               style={{ background: `${p.accent}1f`, color: p.accent }}>
                            {IconChar}
                          </div>
                          <div className="text-[9.5px] font-bold text-stone-600 mt-1.5 uppercase tracking-wider">{p.title}</div>
                          <div className="text-[8.5px] text-stone-400 mt-0.5 px-2 text-center">{p.id === 'ip-vault' ? 'Sanctuary' : p.id === 'apps' ? 'Compounding' : p.id === 'quiz-result' ? 'Diagnostic' : 'Compliance'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!allAnswered && (
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1 text-[9.5px] font-semibold text-stone-500 border border-stone-200">
                      Answer all four to populate each panel
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
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full px-4 flex items-center gap-3" style={{ background: band.bg }}>
                <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: band.color }} />
                <div className="flex-1 min-w-0 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: band.color }}>Fit band</span>
                    <span className="text-[14px] font-bold" style={{ color: band.color }}>{band.tone} · {score}/12</span>
                  </div>
                  <p className="text-[10.5px] text-stone-700 mt-0.5 leading-snug truncate">{band.sub}</p>
                </div>
                <button
                  onClick={() => { setPhase('quiz'); setStepIdx(0); setAnswers({}); }}
                  className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 shrink-0 px-2 py-1 rounded-md hover:bg-white/50"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Restart
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoWindowFrame>
  );
}

/** MiniTopBar — local top bar INSIDE the Onboarding window (distinct from
 *  Macro's TopBar). Shows demo-coach branding, sandbox status, maximize hint.
 *  Pattern forked from Life OS topbar glass + small status pills. */
function MiniTopBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const maximizeApp = useDemoShellStore(s => s.maximizeApp);

  return (
    <div className="absolute top-0 inset-x-0 z-[100] h-8 px-3 flex items-center justify-between text-[10.5px] font-medium text-stone-600 border-b border-emerald-100/80 backdrop-blur-md"
         style={{ background: 'linear-gradient(180deg, rgba(236,253,245,0.92) 0%, rgba(240,253,250,0.78) 100%)' }}>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-[5px] bg-emerald-600 flex items-center justify-center text-white">
          <Leaf className="w-2 h-2" />
        </span>
        <span className="font-bold tracking-tight text-stone-800 font-outfit">demo-coach</span>
        <span className="text-stone-300">·</span>
        <span className="text-stone-500">your Nexus preview</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <Lock className="w-2.5 h-2.5" /> Zero-PII sandbox
        </span>
        <span className="text-stone-300">·</span>
        <button
          onClick={() => maximizeApp('__citadel__')}
          className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors"
          title="Expand the Nexus Quiz window"
        >
          <Maximize2 className="w-2.5 h-2.5" /> Expand
        </button>
        <span className="text-stone-300">·</span>
        <span className="font-mono text-stone-500 tabular-nums">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

/** MiniWallpaper — emerald/teal gradient with sun glow + paper grain + rolling
 *  hills (pattern forked from Macro Wallpaper for visual consistency). Stronger
 *  contrast than the previous pastel version so the background reads as a real
 *  "desktop" even when the citadel + panels cover the central area — the user
 *  should see the wallpaper as a defined layer, not a flat field. */
function MiniWallpaper() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(180deg, #a7f3d0 0%, #6ee7b7 45%, #5eead4 100%)' }}>
      {/* Soft sun glow upper right */}
      <div
        className="absolute -top-32 right-[8%] w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,225,150,0.6), transparent 62%)' }}
      />
      {/* Soft secondary glow lower left */}
      <div
        className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.35), transparent 60%)' }}
      />
      {/* Paper grain */}
      <div
        className="absolute inset-0 opacity-[0.45] mix-blend-multiply"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(120,113,108,0.04) 0 1px, transparent 1px 3px),' +
            'repeating-linear-gradient(0deg, rgba(120,113,108,0.035) 0 1px, transparent 1px 3px)',
        }}
      />
      {/* Rolling paper hills */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 280" preserveAspectRatio="none" style={{ height: '38vh' }}>
        <path d="M0,160 C260,110 480,180 720,150 C980,118 1180,180 1440,140 L1440,280 L0,280 Z" fill="#34d399" opacity="0.55" />
        <path d="M0,210 C300,170 560,220 860,200 C1120,182 1300,220 1440,194 L1440,280 L0,280 Z" fill="#10b981" opacity="0.6" />
        <path d="M0,250 C340,222 620,260 960,242 C1200,228 1320,254 1440,240 L1440,280 L0,280 Z" fill="#059669" opacity="0.7" />
      </svg>
      {/* Faint dot grid in upper area for "desktop wallpaper" texture */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(6,78,59,0.5) 0.5px, transparent 0.5px)',
          backgroundSize: '22px 22px',
          backgroundPosition: '0 0',
        }}
      />
    </div>
  );
}

/** Mount effect — resize/reposition the citadel + panels for the Mini Desktop
 *  context. Citadel sits in the upper area; reveal-phase panels + dock icons
 *  live in a smaller coordinate space. */
function useMiniDesktopLayout() {
  useEffect(() => {
    const state = useDemoShellStore.getState();
    useDemoShellStore.setState({
      windows: state.windows.map(w => {
        if (w.id === '__citadel__') {
          return { ...w, position: { x: 12, y: 38 }, size: { width: 700, height: 440 } };
        }
        // Reveal-phase panels: 2×2 grid inside the citadel
        const idx = DEMO_PANELS.slice(0, 4).findIndex(p => p.id === w.id);
        if (idx >= 0) {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          return { ...w, position: { x: 12 + col * 342, y: 12 + row * 158 }, size: { width: 332, height: 150 } };
        }
        // Audit panel (and any other dock-opened panels) — small 2×2 grid below citadel
        if (w.id === 'audit') {
          return { ...w, position: { x: 12, y: 488 }, size: { width: 700, height: 200 } };
        }
        return w;
      }),
    });
  }, []);
}

/** MiniDesktopShell — the actual Mini Desktop OS rendered inside the Macro
 *  WindowFrame. Hosts the wallpaper, mini topbar, citadel + open panels, dock. */
export function MiniDesktopShell() {
  useMiniDesktopLayout();
  return (
    <div className="absolute inset-0 overflow-hidden" data-mini-desktop-shell>
      <MiniWallpaper />
      <MiniTopBar />

      {/* Window area — provides the positioning context for DemoWindowFrames.
          Bottom padding reserves space for the dock (~80px). */}
      <div className="absolute inset-0 pt-8 pb-[88px]">
        <div className="relative w-full h-full">
          <CitadelPanel />
          <OpenPanelsLayer />
        </div>
      </div>

      <MiniDock />
    </div>
  );
}

/** OnboardingApp entry — the Macro AppRegistry routes here. Renders the
 *  MiniDesktopShell inside the Macro WindowFrame (which provides the mac
 *  traffic lights). Closing the Macro WindowFrame (red light) reveals the
 *  full Macro Desktop OS with all business domain apps. */
export function OnboardingApp() {
  // Pre-warm the citadel window on first mount if missing
  useEffect(() => {
    const win = useDemoShellStore.getState().windows.find(w => w.id === '__citadel__');
    if (!win || !win.isOpen) {
      useDemoShellStore.getState().openApp('__citadel__', 'Nexus Quiz · your personal preview');
    }
    if (!hasSeenCitadel()) markCitadelSeen();
  }, []);

  // When the audit panel is opened (via dock or any other path), reposition
  // it into the visible Mini Desktop window area so it doesn't cascade
  // off-screen by the default openApp grid logic.
  const auditWin = useDemoShellStore(s => s.windows.find(w => w.id === 'audit'));
  useEffect(() => {
    if (!auditWin || !auditWin.isOpen || auditWin.isMinimized) return;
    // Only reposition if it's currently at a default-cascade position
    // (i.e., x=350, y=560 from openApp). If the user has dragged it,
    // leave it alone.
    if (auditWin.position.x === 350 && auditWin.position.y === 560) {
      useDemoShellStore.setState({
        windows: useDemoShellStore.getState().windows.map(w =>
          w.id === 'audit'
            ? { ...w, position: { x: 12, y: 524 }, size: { width: 720, height: 160 } }
            : w
        ),
      });
    }
  }, [auditWin?.isOpen, auditWin?.isMinimized]);
  return <MiniDesktopShell />;
}
