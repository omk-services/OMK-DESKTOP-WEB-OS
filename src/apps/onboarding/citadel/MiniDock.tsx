/** MiniDock — Life OS-style dock at the bottom of the Onboarding Mini Desktop OS.
 *  Translucent bar, hover scale, indicator dot for open windows. Each dock icon
 *  opens or focuses a mini-app window inside the citadel via the demoShell store.
 *  Pattern forked from Life OS IKIGAI dock (10.7K★ Aden Hive verified visual
 *  pattern: rounded bar, backdrop-blur, dot indicator, single-tap focus). */
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles, ShieldCheck, FileBarChart } from 'lucide-react';
import { useDemoShellStore } from '../../../lib/demoShell';

interface DockEntry {
  id: string;
  label: string;
  short: string;
  accent: string;
  iconChar: string;
  Icon?: LucideIcon;
}

const ENTRIES: DockEntry[] = [
  {
    id: '__citadel__',
    label: 'Nexus Quiz',
    short: 'Take the 4-question fit quiz to unlock your demo instance',
    accent: '#0d9488',
    iconChar: 'Q',
    Icon: Sparkles,
  },
  {
    id: 'ip-vault',
    label: 'IP Vault',
    short: 'Capture session notes, frameworks, decisions — byte-level encrypted',
    accent: '#2563eb',
    iconChar: 'V',
  },
  {
    id: 'apps',
    label: 'Mini-apps Library',
    short: '4 showcase apps already running on your demo instance',
    accent: '#9333ea',
    iconChar: 'L',
  },
  {
    id: 'quiz-result',
    label: 'QuizResult · Diagnostic',
    short: 'Personalised audit dashboard — first-month Nexus preview',
    accent: '#0891b2',
    iconChar: 'D',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    short: 'CCPA + Colorado AI Act 2026 + EO 14110 audit-pack export',
    accent: '#16a34a',
    iconChar: 'C',
    Icon: ShieldCheck,
  },
  {
    id: 'audit',
    label: 'Audit Simulation',
    short: '4 findings · 1 critical · est. $9k-$22k exposure — full report in-window',
    accent: '#ea580c',
    iconChar: 'A',
    Icon: FileBarChart,
  },
];

export function MiniDock() {
  const windows = useDemoShellStore(s => s.windows);
  const openApp = useDemoShellStore(s => s.openApp);
  const focusApp = useDemoShellStore(s => s.focusApp);
  const closeApp = useDemoShellStore(s => s.closeApp);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      data-mini-dock
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
      onMouseLeave={() => setHoveredId(null)}
    >
      <div
        className="flex items-end gap-1.5 px-2.5 py-2 rounded-2xl border border-white/40 shadow-[0_8px_32px_-8px_rgba(13,148,136,0.45)]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,250,0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        }}
      >
        {ENTRIES.map(entry => {
          const win = windows.find(w => w.id === entry.id);
          const isOpen = !!win && win.isOpen;
          const isFocused = win && !win.isMinimized;
          const Icon = entry.Icon;
          const isHovered = hoveredId === entry.id;
          return (
            <button
              key={entry.id}
              data-dock-icon={entry.id}
              onMouseEnter={() => setHoveredId(entry.id)}
              onClick={() => {
                if (!isOpen) {
                  openApp(entry.id, entry.label);
                } else if (isFocused) {
                  closeApp(entry.id);
                } else {
                  focusApp(entry.id);
                }
              }}
              className="group relative flex flex-col items-center"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(41,37,36,0.5)] border border-white/60 transition-all"
                style={{
                  background: isOpen
                    ? `linear-gradient(160deg, #ffffff, ${entry.accent}40)`
                    : 'linear-gradient(160deg, #ffffff, #f5f5f4)',
                  transform: isHovered ? 'translateY(-6px) scale(1.12)' : 'translateY(0) scale(1)',
                  transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isHovered ? `0 8px 20px -6px ${entry.accent}88` : undefined,
                }}
              >
                {Icon ? (
                  <Icon className="w-5 h-5" style={{ color: isOpen ? entry.accent : '#78716c' }} />
                ) : (
                  <span
                    className="text-lg font-extrabold tracking-tight"
                    style={{ color: isOpen ? entry.accent : '#78716c' }}
                  >
                    {entry.iconChar}
                  </span>
                )}
              </div>
              {/* Open indicator dot */}
              <span
                className="w-1 h-1 rounded-full mt-1 transition-all"
                style={{
                  background: isOpen ? entry.accent : 'transparent',
                  transform: isFocused ? 'scale(1.4)' : 'scale(1)',
                }}
              />
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap z-[300] pointer-events-none">
                  <div className="px-3 py-1.5 rounded-lg bg-stone-900/95 backdrop-blur text-white text-[11px] font-semibold shadow-xl">
                    <div className="text-[10px] uppercase tracking-wider text-white/60">Step</div>
                    <div>{entry.label}</div>
                    <div className="text-[10px] font-normal text-white/70 mt-0.5 max-w-[260px] whitespace-normal">{entry.short}</div>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-stone-900/95" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
