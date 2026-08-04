/** TopBar — Coach OS global bar (Codex/Buzz style):
 *  - Brand tile (rounded-xl gradient, like Codex/Buzz app icons)
 *  - Soft menus with hover + active states (no harsh borders)
 *  - Right cluster: ecosystem seal + theme switcher + voice + bell + clock
 *  - Theme-aware accents (var(--theme-*)) + soft drop shadow (no border-b)
 *  - Global theme quick-switcher dropdown in the middle. */
import { useState, useEffect, useRef } from 'react';
import { Bell, RotateCcw, Leaf, Mic, MicOff, Palette, Check, ChevronDown } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { useThemeStore } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const bootClean = useShellStore((s) => s.bootClean);
  const notificationCount = useShellStore((s) => s.notificationCount);
  const clearNotifications = useShellStore((s) => s.clearNotifications);
  const voice = useVoiceNavigation();

  // Theme quick-switcher state
  const globalTheme = useThemeStore((s) => s.globalTheme);
  const setGlobalTheme = useThemeStore((s) => s.setGlobalTheme);
  const globalTokens = useThemeStore((s) => s.tokensFor('__global__') ?? (THEME_META.find(t => t.id === globalTheme) ? { accent: THEME_META.find(t => t.id === globalTheme)!.accent, isDark: THEME_META.find(t => t.id === globalTheme)!.isDark } : { accent: '#f08143', isDark: false }));
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
    <div className="fixed top-0 w-full z-[5000] select-none top-bar" style={{ padding: '6px 12px' }}>
      <div
        className="h-11 w-full flex items-center justify-between px-3 text-xs font-medium rounded-2xl"
        style={{
          background: globalTokens.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: globalTokens.isDark
            ? '0 4px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 4px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* LEFT cluster — brand tile + menu + reset + theme */}
        <div className="flex items-center gap-1.5">
          {/* Brand tile */}
          <div className="flex items-center gap-2 pr-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #10b981, #0891b2)',
                boxShadow: '0 2px 6px rgba(16,185,129,0.35)',
              }}
            >
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold tracking-tight text-[13px]" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-display)' }}>
              Coach OS
            </span>
          </div>

          {/* Menu items — soft rounded pills */}
          <div className="hidden md:flex items-center gap-0.5 px-1">
            {['File', 'View', 'Window'].map(m => (
              <button
                key={m}
                className="px-2.5 h-7 text-[11.5px] font-medium rounded-lg transition-colors hover:bg-[var(--theme-surface-hover)]"
                style={{ color: 'var(--theme-text-muted)' }}
                onClick={() => {}}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Action chips: Reset + Theme */}
          <button
            onClick={() => { if (window.confirm('Reset window layout?')) bootClean(); }}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text-muted)' }}
            title="Reset window layout"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>

          {/* Global theme quick-switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setThemesOpen(!themesOpen)}
              title={`Theme: ${activeMeta?.name ?? '—'} (global). Per-app overrides live in the sidebar.`}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                color: 'var(--theme-text)',
                background: globalTokens.isDark ? `${globalTokens.accent}25` : `${globalTokens.accent}14`,
                boxShadow: `inset 0 0 0 1px ${globalTokens.accent}30`,
              }}
            >
              <Palette className="w-3 h-3" style={{ color: globalTokens.accent }} />
              <span>{activeMeta?.name ?? 'Theme'}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            {themesOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-[5100] w-[280px] rounded-2xl p-2 grid grid-cols-2 gap-1.5"
                role="menu"
                style={{
                  background: globalTokens.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)',
                }}
              >
                {THEME_META.map(t => {
                  const isActive = t.id === globalTheme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setGlobalTheme(t.id); setThemesOpen(false); }}
                      className="relative text-left p-2 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: t.isDark ? '#0a0a0a' : '#fafaf9',
                        boxShadow: isActive ? `inset 0 0 0 2px ${t.accent}` : 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                      }}
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

        {/* RIGHT cluster — status + voice + bell + clock */}
        <div className="flex items-center gap-1.5">
          <span
            className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: globalTokens.isDark ? '#10b981' : '#047857',
              background: globalTokens.isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.10)',
              boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.20)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ecosystem healthy · 24/7
          </span>

          {voice.supported && (
            <button
              onClick={voice.toggle}
              title={voice.listening ? `Écoute… dernier: "${voice.lastTranscript}"` : 'Activer le contrôle vocal'}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={voice.listening ? {
                background: 'var(--theme-accent)',
                color: 'white',
                boxShadow: `0 2px 8px ${globalTokens.accent}50`,
              } : {
                color: 'var(--theme-text-muted)',
                background: 'var(--theme-surface)',
                boxShadow: 'inset 0 0 0 1px var(--theme-border-subtle)',
              }}
            >
              {voice.listening ? <Mic className="w-3 h-3 animate-pulse" /> : <MicOff className="w-3 h-3" />}
              {voice.listening ? 'Écoute' : 'Voix'}
            </button>
          )}

          <button
            onClick={clearNotifications}
            className="relative h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--theme-surface-hover)]"
            style={{ color: 'var(--theme-text-muted)' }}
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {notificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
                style={{ background: 'var(--theme-accent)', boxShadow: '0 0 0 2px white' }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div
            className="flex items-center gap-2 h-7 px-2.5 rounded-lg font-mono text-[11px] tracking-tight"
            style={{
              color: 'var(--theme-text)',
              background: 'var(--theme-surface)',
              boxShadow: 'inset 0 0 0 1px var(--theme-border-subtle)',
            }}
          >
            <span className="font-semibold tabular-nums">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="opacity-60 uppercase text-[10px]">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
