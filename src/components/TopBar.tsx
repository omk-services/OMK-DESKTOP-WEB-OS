/** TopBar — Coach OS global bar: brand, ecosystem seal, bell, clock (light skin)
 *  + global theme quick-switcher dropdown (between RESET and ecosystem seal). */
import { useState, useEffect, useRef } from 'react';
import { Bell, RotateCcw, Leaf, Mic, MicOff, Palette, Check, ChevronDown } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { useThemeStore } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const bootClean = useShellStore(s => s.bootClean);
  const notificationCount = useShellStore(s => s.notificationCount);
  const clearNotifications = useShellStore(s => s.clearNotifications);
  const voice = useVoiceNavigation();

  // Theme quick-switcher state
  const globalTheme = useThemeStore((s) => s.globalTheme);
  const setGlobalTheme = useThemeStore((s) => s.setGlobalTheme);
  const [themesOpen, setThemesOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close themes dropdown on outside click
  useEffect(() => {
    if (!themesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [themesOpen]);

  const activeMeta = THEME_META.find(t => t.id === globalTheme);

  return (
    <div className="fixed top-0 w-full z-[5000] select-none top-bar">
      <div className="h-full w-full glass border-b border-[var(--panel-border-subtle)] flex items-center justify-between px-4 text-xs font-medium text-stone-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[var(--panel-border-subtle)]">
            <span className="w-4 h-4 rounded-[5px] bg-emerald-600 flex items-center justify-center text-white">
              <Leaf className="w-2.5 h-2.5" />
            </span>
            <span className="font-bold tracking-tight text-stone-800 font-outfit">Coach OS</span>
          </div>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">File</span>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">View</span>
          <span className="hidden sm:inline text-stone-400 hover:text-stone-600 cursor-default">Window</span>
          <button
            onClick={() => { if (window.confirm('Reset window layout?')) bootClean(); }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all"
            title="Reset window layout"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>

          {/* Global theme quick-switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setThemesOpen(!themesOpen)}
              title={`Theme: ${activeMeta?.name ?? '—'} (global). Per-app overrides live in the sidebar.`}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest text-stone-600 hover:bg-stone-100 transition-all"
              style={{ background: `${activeMeta?.id === 'warm-paper' ? '' : '#f5f5f4'}` }}
            >
              <Palette className="w-3 h-3" style={{ color: activeMeta?.accent }} />
              {activeMeta?.name ?? 'Theme'}
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            {themesOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-[5100] w-[260px] bg-white rounded-xl border border-stone-200 shadow-lg p-2 grid grid-cols-2 gap-1.5"
                role="menu"
              >
                {THEME_META.map(t => {
                  const isActive = t.id === globalTheme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setGlobalTheme(t.id); setThemesOpen(false); }}
                      className={`relative text-left p-2 rounded-lg border transition-all ${
                        isActive ? 'border-stone-800 ring-1 ring-stone-800' : 'border-stone-200 hover:border-stone-400'
                      }`}
                      style={{ background: t.isDark ? '#0a0a0a' : '#fafaf9' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.accent }} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${t.isDark ? 'text-white' : 'text-stone-900'}`}>{t.name}</span>
                        {isActive && <Check className="w-2.5 h-2.5 ml-auto text-emerald-500 shrink-0" />}
                      </div>
                      <p className={`text-[9px] mt-0.5 line-clamp-1 ${t.isDark ? 'text-stone-400' : 'text-stone-500'}`}>{t.mood}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ecosystem healthy · 24/7
          </span>

          {voice.supported && (
            <button
              onClick={voice.toggle}
              title={voice.listening ? `Écoute… dernier: "${voice.lastTranscript}"` : 'Activer le contrôle vocal'}
              className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all ${
                voice.listening
                  ? 'bg-[var(--theme-accent)] text-white'
                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
              }`}
            >
              {voice.listening ? <Mic className="w-3 h-3 animate-pulse" /> : <MicOff className="w-3 h-3" />}
              {voice.listening ? 'Écoute' : 'Voix'}
            </button>
          )}

          <button onClick={clearNotifications} className="relative group p-1" title="Notifications">
            <Bell className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[var(--theme-accent)] text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 shadow">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 font-mono text-[11px] tracking-tight pl-3 border-l border-[var(--panel-border-subtle)]">
            <span className="text-stone-700 font-semibold">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-stone-400 uppercase">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
