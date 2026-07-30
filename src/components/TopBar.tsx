/** TopBar — Coach OS global bar (Codex/Buzz style):
 *  - Brand tile (rounded-xl gradient, like Codex/Buzz app icons)
 *  - Soft menus with hover + active states (no harsh borders)
 *  - Right cluster: ecosystem seal + theme switcher + voice + bell + clock
 *  - Theme-aware accents (var(--theme-*)) + soft drop shadow (no border-b)
 *  - Global theme quick-switcher dropdown in the middle. */
import { useState, useEffect, useRef } from 'react';
import { Bell, RotateCcw, Leaf, Mic, MicOff, Palette, Check, ChevronDown, User, Power, CreditCard, Sparkles, LogOut, Settings as SettingsIcon, ListChecks, History } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { useThemeStore } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';
import { getAllApps } from '../lib/app-registry';
import { useAppVisibility } from '../stores/appVisibility.store';
import { CHANGELOG } from '../data/changelog';
import { TopBarMenu } from './TopBarMenu';
// canvas-ui v30 — no upstream equivalent for the retired BorderBeam / ThinkingOrbs
// (they were v1 CSS-only sister patterns). Replaced with a styled accent strip
// on the ecosystem seal + a CSS pulse dot in the voice button.

export function TopBar() {
  const [time, setTime] = useState(new Date());
  const bootClean = useShellStore((s) => s.bootClean);
  const notificationCount = useShellStore((s) => s.notificationCount);
  const clearNotifications = useShellStore((s) => s.clearNotifications);
  const openApp = useShellStore((s) => s.openApp);
  const userHidden = useAppVisibility((s) => s.hidden);
  const toggleAppVisibility = useAppVisibility((s) => s.toggle);
  const resetAppVisibility = useAppVisibility((s) => s.reset);
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

          {/* Menu items — Profile / Apps / Changelog */}
          <div className="hidden md:flex items-center gap-0.5 px-1">
            {/* Profile menu */}
            <TopBarMenu
              triggerLabel="Profile"
              triggerIcon={<User className="w-3.5 h-3.5" />}
              width={260}
              isDark={globalTokens.isDark}
              ariaLabel="Profile menu"
            >
              <div className="flex items-center gap-3 px-2 py-2.5 mb-1 rounded-xl" style={{ background: 'var(--theme-surface-hover)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  AK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--theme-text)' }}>Amadou Kone</div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-muted)' }}>amdkn777@gmail.com</div>
                </div>
              </div>
              <button onClick={() => { openApp('settings', 'Settings'); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]" style={{ color: 'var(--theme-text)' }}>
                <SettingsIcon className="w-3.5 h-3.5" /> Account settings
              </button>
              <button onClick={() => { openApp('finance', 'Finance'); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]" style={{ color: 'var(--theme-text)' }}>
                <CreditCard className="w-3.5 h-3.5" /> Billing & subscription
              </button>
              <button onClick={() => { openApp('cognition', 'Cognition'); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]" style={{ color: 'var(--theme-text)' }}>
                <Sparkles className="w-3.5 h-3.5" /> AI preferences
              </button>
              <div className="my-1.5 border-t" style={{ borderColor: 'var(--theme-border-subtle)' }} />
              <button onClick={() => { console.info('[Coach OS] Sign out clicked (stub)'); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-left transition-colors hover:bg-[var(--theme-surface-hover)]" style={{ color: 'var(--theme-text-muted)' }}>
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </TopBarMenu>

            {/* Apps menu — toggle visibility */}
            <TopBarMenu
              triggerLabel="Apps"
              triggerIcon={<ListChecks className="w-3.5 h-3.5" />}
              width={320}
              isDark={globalTokens.isDark}
              ariaLabel="Apps menu"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: 'var(--theme-text-muted)' }}>Desktop visibility</div>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                {getAllApps().map((app) => {
                  const Icon = app.icon;
                  const hidden = userHidden[app.id] === true;
                  return (
                    <div key={app.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--theme-surface-hover)]">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: (app.accent ?? '#64748b') + '22' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: app.accent ?? '#64748b' }} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-medium truncate" style={{ color: 'var(--theme-text)' }}>{app.name}</div>
                        <div className="text-[10px] truncate" style={{ color: 'var(--theme-text-muted)' }}>{app.description}</div>
                      </span>
                      <button
                        onClick={() => toggleAppVisibility(app.id)}
                        role="switch"
                        aria-checked={!hidden}
                        aria-label={`Toggle ${app.name} visibility`}
                        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                        style={{ background: hidden ? 'var(--theme-border-subtle)' : 'var(--theme-accent)' }}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                          style={{ transform: hidden ? 'translateX(2px)' : 'translateX(18px)' }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--theme-border-subtle)' }}>
                <button onClick={() => resetAppVisibility()} className="w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-left rounded-lg hover:bg-[var(--theme-surface-hover)]" style={{ color: 'var(--theme-text-muted)' }}>
                  Reset all to visible
                </button>
              </div>
            </TopBarMenu>

            {/* Changelog menu */}
            <TopBarMenu
              triggerLabel="Changelog"
              triggerIcon={<History className="w-3.5 h-3.5" />}
              width={320}
              isDark={globalTokens.isDark}
              ariaLabel="Changelog menu"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: 'var(--theme-text-muted)' }}>Dev milestones</div>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                {CHANGELOG.map((m) => (
                  <div key={m.version} className="px-2 py-2 rounded-lg hover:bg-[var(--theme-surface-hover)]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-bold" style={{ color: 'var(--theme-text)' }}>{m.title}</span>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{m.version} · {m.date}</span>
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {m.highlights.map((h, i) => (
                        <li key={i} className="text-[10.5px] flex gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
                          <span style={{ color: 'var(--theme-accent)' }}>•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </TopBarMenu>
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
          {/* Ecosystem seal — wrap pill in a thin animated accent strip (BorderBeam replacement).
              The strip travels along the bottom edge of the pill, mimicking the v1 BorderBeam
              but as a single keyframe'd box-shadow rather than a sibling component. */}
          <div
            className="relative hidden sm:block"
            style={{
              padding: 1,
              borderRadius: 10,
              background: 'transparent',
            }}
          >
            <span
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: globalTokens.isDark ? '#10b981' : '#047857',
                background: globalTokens.isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.10)',
                boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.20)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ecosystem healthy · 24/7
            </span>
            {/* Trailing accent strip — replaces BorderBeam's beam with a CSS-animated bottom border. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 bottom-0 h-[1.5px] w-full overflow-hidden"
              style={{ borderRadius: '0 0 9px 9px' }}
            >
              <span
                className="block h-full w-1/3"
                style={{
                  background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                  animation: 'topbar-beam-slide 6s linear infinite',
                }}
              />
            </span>
          </div>

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
              {voice.listening ? (
                <>
                  <Mic className="w-3 h-3 animate-pulse" />
                  {/* ThinkingOrbs replacement — three CSS-pulse dots. No upstream equivalent. */}
                  <span className="flex items-center gap-[2px]" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block w-[3px] h-[3px] rounded-full bg-white"
                        style={{
                          animation: `topbar-orb-pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
                        }}
                      />
                    ))}
                  </span>
                </>
              ) : (
                <MicOff className="w-3 h-3" />
              )}
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
