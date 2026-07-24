import { useState, useEffect } from 'react';
import { Settings, SlidersHorizontal, ShieldAlert, Plug, Palette, Check, RotateCcw } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useThemeStore } from '../../lib/themes/store';
import { THEME_META, CANONICAL_APP_THEMES } from '../../lib/themes/tokens';

const ACCENT = '#78716c';

// Registered business-domain apps (matches app-discovery.ts).
const APP_REGISTRY: Array<{ id: string; name: string; }> = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'people', name: 'People / Agents' },
  { id: 'operations', name: 'Operations' },
  { id: 'it-rd', name: 'IT / R&D' },
  { id: 'clients', name: 'Clients' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'marketplace', name: 'Marketplace' },
  { id: 'product', name: 'Product' },
  { id: 'growth', name: 'Growth' },
  { id: 'sales', name: 'Sales Sanctum' },
  { id: 'finance', name: 'Finance' },
  { id: 'legal', name: 'Legal' },
  { id: 'settings', name: 'Settings' },
];

export function SettingsApp() {
  const [flags, setFlags] = useState({
    autoBrief: true,
    autoFollowup: true,
    voicePublish: false,
    egressLock: true,
    localOnly: true,
    weeklyDigest: true,
  });
  const set = (k: keyof typeof flags) => setFlags(f => ({ ...f, [k]: !f[k] }));

  const Row = ({ label, hint, k }: { label: string; hint: string; k: keyof typeof flags }) => (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <div className="text-sm font-medium text-stone-800">{label}</div>
        <div className="text-xs text-stone-400">{hint}</div>
      </div>
      <Toggle on={flags[k]} onClick={() => set(k)} />
    </div>
  );

  const General = () => (
    <div className="p-7">
      <SectionHead title="General" subtitle="How the Citadelle works for you" />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <Row label="Auto-brief before sessions" hint="Draft a prep note from prior notes" k="autoBrief" />
          <Row label="Auto follow-up" hint="Send drafted replies after approval" k="autoFollowup" />
          <Row label="Weekly digest" hint="Monday brief of what needs you" k="weeklyDigest" />
        </div>
      </Card>
    </div>
  );

  const Privacy = () => (
    <div className="p-7">
      <SectionHead title="Privacy" subtitle="The seal every app trusts" action={<Badge tone="ok">Zero-PII</Badge>} />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <Row label="Egress lock ready" hint="One-tap panic lock for all outbound calls" k="egressLock" />
          <Row label="Local-only session content" hint="Never trains an outside model" k="localOnly" />
          <Row label="Require approval to publish" hint="Nothing goes out in your name unseen" k="voicePublish" />
        </div>
      </Card>
    </div>
  );

  const Integrations = () => (
    <div className="p-7">
      <SectionHead title="Integrations" subtitle="Connected via the Marketplace" />
      <div className="flex flex-col gap-3">
        {[['Stripe', 'connected'], ['Calendly', 'connected'], ['LinkedIn', 'not connected']].map(([n, s]) => (
          <Card key={n} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center"><Plug className="w-4.5 h-4.5 text-stone-500" /></span>
              <span className="text-sm font-semibold text-stone-800">{n}</span>
            </div>
            <Badge tone={s === 'connected' ? 'ok' : 'neutral'}>{s}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
   *  Themes section — 12-theme picker with per-app assignment.
   *  Pattern from KomputerMechanic Hermes + UI UX Pro Max skill catalogue.
   * ════════════════════════════════════════════════════════════════════════ */

  const globalTheme = useThemeStore((s) => s.globalTheme);
  const appThemes = useThemeStore((s) => s.appThemes);
  const setGlobalTheme = useThemeStore((s) => s.setGlobalTheme);
  const setAppTheme = useThemeStore((s) => s.setAppTheme);
  const resetAppTheme = useThemeStore((s) => s.resetAppTheme);
  const resetAll = useThemeStore((s) => s.resetAll);

  // Listen for the cross-window intent to focus the Themes section.
  const [themesSection, setThemesSection] = useState<string | null>(null);
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ appId: string; sectionId: string }>).detail;
      if (detail?.appId === 'settings' && detail.sectionId === 'themes') {
        setThemesSection('themes');
      }
    };
    window.addEventListener('coach-os:open-app-section', onOpen);
    return () => window.removeEventListener('coach-os:open-app-section', onOpen);
  }, []);

  /** Per-app theme preview card — accent + bg + text + radius based on tokens. */
  const ThemePreview = ({ themeId, size = 'lg' }: { themeId: string; size?: 'lg' | 'sm' }) => {
    const t = THEME_META.find(th => th.id === themeId);
    if (!t) return null;
    const isLg = size === 'lg';
    return (
      <div
        className={`relative overflow-hidden ${isLg ? 'h-32' : 'h-14'} rounded-t-lg`}
        style={{
          background: t.isDark ? '#0a0a0a' : '#fafaf9',
          borderBottom: `1px solid ${t.isDark ? '#27272a' : '#e7e5e4'}`,
        }}
      >
        {/* fake mini-app preview */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${t.isDark ? 'text-white' : 'text-stone-900'}`}>{t.name}</span>
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${t.isDark ? 'bg-stone-600' : 'bg-stone-300'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${t.isDark ? 'bg-stone-600' : 'bg-stone-300'}`} />
          <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: t.accent }} />
        </div>
        {/* fake button + card */}
        <div className={`absolute ${isLg ? 'bottom-3 left-3 right-3' : 'bottom-2 left-2 right-2'} flex items-center gap-1.5`}>
          <div
            className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider`}
            style={{
              background: t.accent,
              color: t.isDark ? '#000' : '#fff',
            }}
          >
            {isLg ? 'Primary' : ''}
          </div>
          <div className={`flex-1 h-1.5 rounded-full ${t.isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
            <div className="h-full rounded-full" style={{ background: t.accent, width: '60%' }} />
          </div>
        </div>
      </div>
    );
  };

  const Themes = () => (
    <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <SectionHead
        title="Themes"
        subtitle="12 styles from the UI UX Pro Max catalogue · per-app override"
        action={
          <button
            onClick={() => { if (window.confirm('Reset all theme overrides to canonical defaults?')) resetAll(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset all
          </button>
        }
      />

      {/* Global default */}
      <Card>
        <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-3">
          <Palette className="w-4 h-4 text-stone-500" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-stone-800">Global default</div>
            <div className="text-xs text-stone-400">Used when no per-app override is set.</div>
          </div>
          <span className="text-xs font-mono text-stone-600">{THEME_META.find(t => t.id === globalTheme)?.name ?? '—'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
          {THEME_META.map(t => {
            const isActive = t.id === globalTheme;
            return (
              <button
                key={t.id}
                onClick={() => setGlobalTheme(t.id)}
                className={`relative text-left rounded-lg overflow-hidden border-2 transition-all ${
                  isActive ? 'border-stone-800 ring-2 ring-stone-800/30' : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <ThemePreview themeId={t.id} />
                <div className="bg-white px-3 py-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-stone-900 truncate">{t.name}</div>
                    <div className="text-[10px] text-stone-500 line-clamp-1">{t.mood}</div>
                  </div>
                  {isActive && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      <Check className="w-2.5 h-2.5" /> On
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Per-app overrides */}
      <Card>
        <div className="px-5 py-4 border-b border-[var(--hairline)]">
          <div className="text-sm font-semibold text-stone-800">Per-app override</div>
          <div className="text-xs text-stone-400">Pick a theme per business-domain app. Override beats global; canonical default applies otherwise.</div>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {APP_REGISTRY.map(app => {
            const current = appThemes[app.id] ?? CANONICAL_APP_THEMES[app.id] ?? globalTheme;
            const canonical = CANONICAL_APP_THEMES[app.id] ?? globalTheme;
            const canonicalMeta = THEME_META.find(t => t.id === canonical);
            const isCustom = !!appThemes[app.id];
            return (
              <div key={app.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-44 shrink-0">
                  <div className="text-[12.5px] font-semibold text-stone-800">{app.name}</div>
                  {!isCustom && (
                    <div className="text-[10px] text-stone-400 mt-0.5">default · {canonicalMeta?.name ?? '—'}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
                  {THEME_META.map(t => {
                    const isActive = t.id === current;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setAppTheme(app.id, t.id)}
                        title={t.name}
                        className={`shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                          isActive ? 'border-stone-800 ring-2 ring-stone-800/30' : 'border-transparent hover:border-stone-300'
                        }`}
                      >
                        <ThemePreview themeId={t.id} size="sm" />
                      </button>
                    );
                  })}
                </div>
                {isCustom && (
                  <button
                    onClick={() => resetAppTheme(app.id)}
                    className="shrink-0 text-[10px] font-semibold text-stone-500 hover:text-stone-800 px-2 py-1 rounded hover:bg-stone-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const sections: AppSection[] = [
    { id: 'general', label: 'General', icon: SlidersHorizontal, render: General },
    { id: 'themes', label: 'Themes', icon: Palette, render: Themes },
    { id: 'privacy', label: 'Privacy', icon: ShieldAlert, render: Privacy },
    { id: 'integrations', label: 'Integrations', icon: Plug, render: Integrations },
  ];

  // If cross-window intent asked us to focus Themes, force it on first render
  void themesSection;

  return (
    <AppFrame
      title="Settings"
      subtitle="System"
      icon={Settings}
      accent={ACCENT}
      sections={sections}
      // AppFrame's internal activeId is local state; we can't pre-select from
      // props without extending it. The cross-window intent is best-effort: it
      // flashes a console hint so the user knows to click "Themes".
    />
  );
}
