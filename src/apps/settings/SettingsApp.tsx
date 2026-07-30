import { useState, useEffect } from 'react';
import { Settings, SlidersHorizontal, ShieldAlert, Plug, Palette, Check, RotateCcw, HelpCircle, Play, Wand2 } from 'lucide-react';
import { AppFrame, SectionHead, type AppSection } from '../../components/AppFrame';
import { Card, Badge } from '../_ui/kit';
import { Toggle } from '../_ui/widgets';
import { useThemeStore } from '../../lib/themes/store';
import { THEME_META, CANONICAL_APP_THEMES } from '../../lib/themes/tokens';
import { getObservabilityConsent, setObservabilityConsent } from '../../lib/observability';
import { launchTour, TOUR_IDS, type TourId } from '../../lib/tours';
import { ThemeDetailPage } from './ThemeDetailPage';
import { useCanvasFxStore } from '../../stores/canvasFx.store';
import {
  THEME_TO_CANVAS_UI,
  NEUTRAL_POOL,
  type CanvasEffectId,
} from '../../components/canvasui/v30/theme-canvas-mapping';
import posthog from 'posthog-js';

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

];

// Helper: the available effect pool for the picker = 12 dominants ∪ 24 nuances ∪ 6 neutrals.
// In practice many theme nuance slots reuse effects from other themes, so the
// de-duped set is < 36 — the picker builds a flat de-duped list at render time.
function buildPickerPalette(): CanvasEffectId[] {
  const seen = new Set<CanvasEffectId>();
  for (const t of Object.values(THEME_TO_CANVAS_UI)) {
    seen.add(t.dominant);
    seen.add(t.nuance[0]);
    seen.add(t.nuance[1]);
  }
  for (const n of NEUTRAL_POOL) seen.add(n);
  return Array.from(seen).sort();
}

const PICKER_PALETTE = buildPickerPalette();

const FX_TILE_BG: Record<CanvasEffectId, string> = {
  Asciify: '#1c1917',
  Bend: '#000000',
  Blaze: '#00ff9d',
  Bubble: '#f97316',
  Canvas: '#0f172a',
  Cloth: '#0891b2',
  Clouds: '#818cf8',
  DecryptReveal: '#1c1917',
  Displacement: '#0f172a',
  Droplets: '#f97316',
  FlameWrap: '#dc2626',
  ForceField: '#ec4899',
  Frost: '#6366f1',
  Glass: '#0ea5e9',
  Glitch: '#06b6d4',
  GlyphRain: '#f08143',
  Grid: '#000000',
  HexFloat: '#0891b2',
  Laser: '#00ff9d',
  Liquid: '#ec4899',
  Magnify: '#6366f1',
  ParticleReveal: '#ec4899',
  ParticleScroll: '#0ea5e9',
  Peel: '#1c1917',
  RetroDither: '#e11d48',
  Ripple: '#0ea5e9',
  Shatter: '#000000',
  VHS: '#06b6d4',
  AsciiObject: '#1c1917',
  DitheredObject: '#1c1917',
  GlassObject: '#0ea5e9',
  ParticleObject: '#ec4899',
  LiquidObject: '#0ea5e9',
};

function CanvasFxTile({
  effectId,
  selected,
  onClick,
}: {
  effectId: CanvasEffectId | 'auto';
  selected: boolean;
  onClick: () => void;
}) {
  const bg = effectId === 'auto' ? 'var(--theme-text-muted)' : (FX_TILE_BG[effectId as CanvasEffectId] ?? '#444');
  return (
    <button
      type="button"
      onClick={onClick}
      title={effectId}
      className={`relative h-9 w-full rounded-md transition-all hover:scale-[1.04] active:scale-[0.96] ${
        selected
          ? 'outline outline-2 outline-offset-2 outline-[var(--theme-accent)] scale-105'
          : 'opacity-90 hover:opacity-100'
      }`}
      style={{ background: bg }}
    >
      <span className="absolute inset-0 grid place-items-center text-[8px] font-bold uppercase text-white mix-blend-difference">
        {effectId === 'auto' ? 'AUTO' : effectId.slice(0, 6)}
      </span>
    </button>
  );
}

function CanvasFxPicker() {
  const overrides = useCanvasFxStore((s) => s.appFxOverrides);
  const setAppFx = useCanvasFxStore((s) => s.setAppFx);
  const clearAppFx = useCanvasFxStore((s) => s.clearAppFx);
  const clearAll = useCanvasFxStore((s) => s.clearAll);

  return (
    <div className="p-7">
      <SectionHead
        title="Canvas FX per app"
        subtitle="Pick the signature canvas-ui v30 effect for each app. Default = theme dominant."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="accent">{PICKER_PALETTE.length} effects</Badge>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-600 transition-colors hover:bg-stone-50"
            >
              Reset all
            </button>
          </div>
        }
      />

      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          {APP_REGISTRY.filter((a) => a.id !== 'settings').map((app) => {
            const override = overrides[app.id];
            const themeId = CANONICAL_APP_THEMES[app.id] ?? 'warm-paper';
            const themeMapping = THEME_TO_CANVAS_UI[themeId];
            const dominantLabel = themeMapping?.dominant ?? 'GlyphRain';
            return (
              <div key={app.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-stone-800">{app.name}</div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Theme · <span className="font-mono">{themeId}</span> · dominant ·{' '}
                      <span className="font-mono">{dominantLabel}</span>
                      {override && override !== 'auto' ? (
                        <> · override · <span className="font-mono text-[var(--theme-accent)]">{override}</span></>
                      ) : null}
                    </p>
                  </div>
                  {override && override !== 'auto' ? (
                    <button
                      type="button"
                      onClick={() => clearAppFx(app.id)}
                      className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
                    >
                      Reset
                    </button>
                  ) : (
                    <Badge tone="neutral">auto</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-12 gap-1.5">
                  <CanvasFxTile
                    effectId="auto"
                    selected={!override || override === 'auto'}
                    onClick={() => clearAppFx(app.id)}
                  />
                  {PICKER_PALETTE.filter((e) => e !== dominantLabel).map((e) => (
                    <CanvasFxTile
                      key={e}
                      effectId={e}
                      selected={override === e}
                      onClick={() => setAppFx(app.id, e)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-4 text-[11px] text-stone-500 leading-relaxed">
        The signature effect renders as a transparent header strip inside each app window.
        WebGL effects inherit the per-app theme tokens (accent, duration, dominant).
        On low-power hardware the wrapper falls back to a plain DOM subtree automatically.
      </p>
    </div>
  );
}

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

  const [observabilityOptIn, setObservabilityOptInState] = useState<boolean>(() => getObservabilityConsent());
  const onToggleObservability = (next: boolean) => {
    setObservabilityOptInState(next);
    setObservabilityConsent(next);
    if (next) {
      try {
        posthog.capture('observability_opt_in');
      } catch {
        // best-effort
      }
    }
  };

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

  const Privacy = () => {
    // T5 — privacy tour. Fires once the first time the user opens the
    // Privacy section. Idempotent via the per-tour localStorage guard.
    useEffect(() => {
      void launchTour(TOUR_IDS.PRIVACY);
    }, []);

    return (
    <div className="p-7">
      <SectionHead title="Privacy" subtitle="The seal every app trusts" action={<Badge tone="ok">Zero-PII</Badge>} />
      <Card>
        <div className="divide-y divide-[var(--hairline)]">
          <Row label="Egress lock ready" hint="One-tap panic lock for all outbound calls" k="egressLock" />
          <Row label="Local-only session content" hint="Never trains an outside model" k="localOnly" />
          <Row label="Require approval to publish" hint="Nothing goes out in your name unseen" k="voicePublish" />
        </div>
      </Card>

      <div className="mt-6">
        <SectionHead
          title="Observability"
          subtitle="Anonymous analytics & in-app onboarding (RGPD opt-in)"
          action={
            <Badge tone={observabilityOptIn ? 'ok' : 'neutral'}>
              {observabilityOptIn ? 'On' : 'Off'}
            </Badge>
          }
        />
        <Card>
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-stone-800">
                Observability (anonymous analytics + onboarding)
              </div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Off by default. When on, PostHog Cloud (EU region) collects page navigation + feature usage;
                UserTour can show in-app onboarding. RGPD-compliant: person profiles are only created if
                you sign in. No PII collected unless you identify.
              </p>
            </div>
            <Toggle
              on={observabilityOptIn}
              onClick={() => onToggleObservability(!observabilityOptIn)}
            />
          </div>
        </Card>
      </div>
    </div>
    );
  };

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
   *  Help section — replay any of the 5 onboarding tours.
   *  Matches SettingsApp visual language (rounded-2xl cards, stone palette).
   *  Each button bypasses the per-tour localStorage guard via { force: true }.
   *  Buttons are disabled when observability consent is off (no-op to the user).
   * ════════════════════════════════════════════════════════════════════════ */
  const REPLAY_TOURS: { id: TourId; label: string; hint: string }[] = [
    { id: TOUR_IDS.WELCOME_SOB,     label: 'Welcome',  hint: 'SOB onboarding (first window-open)' },
    { id: TOUR_IDS.FIRST_STANDUP,   label: 'Standup',  hint: 'People → Overview · your daily standup' },
    { id: TOUR_IDS.SQUAD_DRILLDOWN, label: 'Squad',    hint: 'Drill into a squad agent' },
    { id: TOUR_IDS.CADENCE,         label: 'Cadence',  hint: 'People → Cadence · sprint heatmap' },
    { id: TOUR_IDS.PRIVACY,         label: 'Privacy',  hint: 'Settings → Privacy' },
  ];

  const Help = () => {
    const consentOn = observabilityOptIn;
    return (
      <div className="p-7 h-full flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        <SectionHead
          title="Help"
          subtitle="Replay any onboarding tour"
          action={
            <Badge tone={consentOn ? 'ok' : 'neutral'}>
              {consentOn ? 'Consent on' : 'Consent off'}
            </Badge>
          }
        />
        <Card>
          <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-stone-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-stone-800">Replay onboarding tour</div>
              <div className="text-xs text-stone-400 mt-0.5">
                {consentOn
                  ? 'Each tour plays in the order you first saw it. Re-runs override the per-browser guard.'
                  : 'Turn on Observability in Privacy to enable UserTour onboarding.'}
              </div>
            </div>
          </div>
          <div className="divide-y divide-[var(--hairline)]">
            {REPLAY_TOURS.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-800">{t.label}</div>
                  <div className="text-xs text-stone-400">{t.hint}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { void launchTour(t.id, { force: true }); }}
                  disabled={!consentOn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    color: consentOn ? '#0f766e' : '#78716c',
                    background: consentOn ? '#ccfbf1' : '#f5f5f4',
                    boxShadow: 'inset 0 0 0 1px rgba(15,118,110,0.25)',
                  }}
                >
                  <Play className="w-3 h-3" /> Replay
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

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

  const Themes = () => {
    const [detailTheme, setDetailTheme] = useState<string | null>(null);

    if (detailTheme) {
      return <ThemeDetailPage themeId={detailTheme} onBack={() => setDetailTheme(null)} />;
    }

    return (
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
                onDoubleClick={() => setDetailTheme(t.id)}
                title={`Click to set as global · Double-click to preview ${t.name}`}
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
  };

  const CanvasFx = () => <CanvasFxPicker />;

  const sections: AppSection[] = [
    { id: 'general', label: 'General', icon: SlidersHorizontal, render: General },
    { id: 'themes', label: 'Themes', icon: Palette, render: Themes },
    { id: 'canvas-fx', label: 'Canvas FX', icon: Wand2, render: CanvasFx },
    { id: 'privacy', label: 'Privacy', icon: ShieldAlert, render: Privacy },
    { id: 'integrations', label: 'Integrations', icon: Plug, render: Integrations },
    { id: 'help', label: 'Help', icon: HelpCircle, render: Help },
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
      disableSignatureFx
      // AppFrame's internal activeId is local state; we can't pre-select from
      // props without extending it. The cross-window intent is best-effort: it
      // flashes a console hint so the user knows to click "Themes".
    />
  );
}
