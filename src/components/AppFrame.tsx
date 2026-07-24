/** AppFrame — internal window shell: every app gets its OWN left sidebar + content,
 *  in the Life OS app style. Each app supplies its sections & distinct content.
 *  The sidebar collapses to an icon rail — manually via toggle, or automatically
 *  once the window is resized narrow (desktop-first, but each window stays usable
 *  down to mobile widths since Coach OS windows are freely resizable).
 *
 *  Optional 3-column layout (AgenticOS-style "Tools" panel on the right):
 *  apps can declare AI assistants via the `tools` prop — they render as a
 *  collapsible right panel with per-tool status + action buttons. The pattern
 *  mirrors Hugo's AgenticOS Monica/Sider cards.
 *
 *  Theming: AppFrame applies the per-app theme tokens (from the ThemeStore)
 *  as scoped CSS variables on its root element, so each app window can render
 *  with its own design identity (e.g. Brutalism for Product, Dark OLED for
 *  Finance). The sidebar header shows the active theme name as a preview chip. */
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Play, CircleDashed, AlertCircle, Palette } from 'lucide-react';
import { useWindowPage } from '../contexts/WindowContext';
import { useVoiceIntentStore } from '../lib/voiceIntent';
import { useThemeStore, applyThemeTokens, useThemeIdFor } from '../lib/themes/store';
import { THEME_META } from '../lib/themes/tokens';

export interface AppSection {
  id: string;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

export type ToolStatus = 'idle' | 'running' | 'awaiting' | 'error';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  lastActivity?: string;
  icon: LucideIcon;
  modelLabel?: string;
  onRun?: () => void;
}

interface AppFrameProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent: string;
  sections: AppSection[];
  /** optional group labels: map section id -> group header shown above it */
  groups?: Record<string, string>;
  /** optional AI tools rendered in the right panel (AgenticOS-style). */
  tools?: ToolDef[];
}

const NARROW_BREAKPOINT = 640;
const TOOLS_PANEL_WIDTH = 300;

export function AppFrame({ title, subtitle, icon: Icon, accent, sections, groups, tools }: AppFrameProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [isNarrow, setIsNarrow] = useState(false);
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const [toolsOpen, setToolsOpen] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const { windowId, setActivePage } = useWindowPage();
  const active = sections.find(s => s.id === activeId) ?? sections[0];

  // Per-app theme: resolve + apply tokens as scoped CSS variables on rootRef.
  // Normalize the title to lowercase to match the app-registry IDs (e.g. "Product" → "product").
  const appId = title.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const activeThemeId = useThemeIdFor(appId);
  const tokens = useThemeStore((s) => s.tokensFor(appId));
  useEffect(() => {
    if (rootRef.current) applyThemeTokens(rootRef.current, tokens);
  }, [tokens, activeThemeId]);
  const themeMeta = THEME_META.find(t => t.id === activeThemeId);
  const appThemeOverride = useThemeStore((s) => s.appThemes[appId]);
  const openSettings = () => {
    // Open the Settings app and navigate to the Themes section via a window intent.
    // The Settings app is at id 'settings' in the app registry.
    window.dispatchEvent(new CustomEvent('coach-os:open-app-section', {
      detail: { appId: 'settings', sectionId: 'themes' }
    }));
  };

  useEffect(() => {
    if (active) setActivePage(active.label);
  }, [activeId, active?.label, setActivePage]);

  // Voice-navigation bridge: a spoken "ouvre <app> sur <section>" command sets a
  // pending section label on this window's intent slot. activeId is the only
  // state that actually drives which section renders — setActivePage (above)
  // is a one-way mirror to the breadcrumb, not the source of truth — so the
  // intent must be consumed here, against activeId, not upstream in WindowFrame.
  const sectionIntent = useVoiceIntentStore(s => (windowId ? s.byWindow[windowId]?.section : undefined));
  const consumeSectionIntent = useVoiceIntentStore(s => s.consumeSection);
  useEffect(() => {
    if (!sectionIntent || !windowId) return;
    const match = sections.find(s => s.label === sectionIntent);
    if (match) {
      setActiveId(match.id);
      consumeSectionIntent(windowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIntent, windowId]);

  /* Watch this window's own content width — collapse the sidebar when the
     window is resized down to mobile-ish width, independent of the other windows. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth;
      setIsNarrow(width < NARROW_BREAKPOINT);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const collapsed = manualCollapsed ?? isNarrow;
  const toggleCollapsed = () => setManualCollapsed(!collapsed);
  const hasTools = tools && tools.length > 0;

  return (
    <div ref={rootRef} className="flex h-full min-h-0 bg-[var(--theme-bg)] relative">
      {/* Internal sidebar — Codex/Buzz style: rounded nav items, Header Menu + Search
          + grouped sections, soft hover states, prominent active fill. */}
      <aside
        className={`shrink-0 flex flex-col transition-[width] duration-200 overflow-hidden ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
        style={{ background: 'var(--theme-canvas)' }}
      >
        {/* Header Menu — app identity + collapse button (rounded, no harsh borders) */}
        <div className={`p-3 flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? '' : 'flex-1'}`}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 2px 8px ${accent}30` }}
            >
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div
                  className="text-[14px] font-bold text-[var(--theme-text)] tracking-tight truncate"
                  style={{ fontFamily: 'var(--theme-font-display)' }}
                >
                  {title}
                </div>
                {subtitle && (
                  <div className="text-[10px] text-[var(--theme-text-dim)] uppercase tracking-wider truncate mt-0.5">{subtitle}</div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--theme-text-dim)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)] transition-all shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Search input — Codex-style rounded */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border-subtle)] hover:border-[var(--theme-border)] transition-colors cursor-text">
              <svg className="w-3.5 h-3.5 text-[var(--theme-text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <span className="text-[11.5px] text-[var(--theme-text-dim)]">Search {title.toLowerCase()}</span>
              <span className="ml-auto text-[9px] font-mono text-[var(--theme-text-dim)] bg-[var(--theme-surface-hover)] px-1.5 py-0.5 rounded">⌘K</span>
            </div>
          </div>
        )}

        {/* Theme chip — rounded card showing the active theme (Codex-style) */}
        {!collapsed && themeMeta && (
          <div className="px-3 pb-2">
            <button
              onClick={openSettings}
              title={`Theme: ${themeMeta.name} — click to change in Settings`}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: tokens.isDark ? `${tokens.accent}20` : `linear-gradient(135deg, ${tokens.accent}15, ${tokens.accent}05)`,
                border: `1px solid ${tokens.accent}30`,
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-extrabold"
                style={{ background: tokens.accent }}
              >
                {themeMeta.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11.5px] font-semibold text-[var(--theme-text)] truncate" style={{ fontFamily: 'var(--theme-font-display)' }}>
                  {themeMeta.name}
                </div>
                <div className="text-[9.5px] text-[var(--theme-text-dim)] uppercase tracking-wider truncate">
                  {tokens.isDark ? 'Dark' : 'Light'} · {appThemeOverride ? 'custom' : 'default'}
                </div>
              </div>
              <Palette className="w-3 h-3 text-[var(--theme-text-dim)] shrink-0" />
            </button>
          </div>
        )}

        {/* Sidebar Menu — rounded nav items, soft hover, prominent active fill */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-0.5 ${collapsed ? 'items-center' : ''}`}>
          {sections.map((s, i) => {
            const group = groups?.[s.id];
            const prevGroup = i > 0 ? groups?.[sections[i - 1].id] : undefined;
            const showGroup = group && group !== prevGroup;
            const SIcon = s.icon;
            const isActive = s.id === activeId;
            return (
              <div key={s.id} className={collapsed ? 'w-full flex justify-center' : ''}>
                {showGroup && !collapsed && (
                  <div className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--theme-text-dim)] flex items-center gap-1.5">
                    <span className="flex-1">{group}</span>
                  </div>
                )}
                <button
                  onClick={() => setActiveId(s.id)}
                  title={collapsed ? s.label : undefined}
                  className={`relative flex items-center gap-2.5 rounded-xl text-[12.5px] font-medium transition-all ${
                    collapsed ? 'w-10 h-10 justify-center' : 'w-full px-2.5 py-2'
                  } ${
                    isActive
                      ? 'text-[var(--theme-text)] font-semibold'
                      : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]'
                  }`}
                  style={isActive ? {
                    background: tokens.isDark ? `${tokens.accent}25` : `${tokens.accent}14`,
                    boxShadow: tokens.isDark ? `inset 0 0 0 1px ${tokens.accent}50` : `inset 0 0 0 1px ${tokens.accent}30`,
                  } : undefined}
                >
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full" style={{ background: tokens.accent }} />
                  )}
                  <SIcon className="w-4 h-4 shrink-0" style={{ color: isActive ? tokens.accent : undefined }} />
                  {!collapsed && <span className="truncate flex-1 text-left">{s.label}</span>}
                  {!collapsed && isActive && <span className="text-[9px] font-mono text-[var(--theme-text-dim)]">●</span>}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Footer area — theme indicator + collapse button (round, no borders) */}
        {!collapsed && (
          <div className="p-2 flex items-center justify-between text-[9px] font-mono text-[var(--theme-text-dim)] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
            </span>
            <span>v2.0</span>
          </div>
        )}
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar">
        {active?.render()}
      </div>

      {/* Optional AI Tools panel (right) — AgenticOS Monica/Sider pattern */}
      {hasTools && (
        <aside
          className="shrink-0 border-l border-[var(--panel-border-subtle)] bg-[var(--canvas)] flex flex-col transition-[width] duration-200 overflow-hidden"
          style={{ width: toolsOpen ? TOOLS_PANEL_WIDTH : 40 }}
        >
          <div className={`py-3 border-b border-[var(--panel-border-subtle)] flex items-center ${toolsOpen ? 'px-4 justify-between gap-2' : 'flex-col gap-2 px-0'}`}>
            {toolsOpen && (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1a` }}>
                  <span className="text-base">⚡</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-800 tracking-tight truncate font-outfit">AI Tools</div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wide truncate">{tools.length} assistants</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              title={toolsOpen ? 'Collapse tools' : 'Expand tools'}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-white transition-colors shrink-0"
            >
              {toolsOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2.5 ${toolsOpen ? '' : 'items-center'}`}>
            {tools?.map(t => <ToolCard key={t.id} tool={t} accent={accent} collapsed={!toolsOpen} />)}
          </div>

          {toolsOpen && (
            <div className="px-4 py-2.5 border-t border-[var(--panel-border-subtle)] text-[10px] text-stone-400 leading-snug">
              Powered by OpenRouter · <span className="text-stone-500">free model router</span> on overload
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

/** Standard content header inside an app section */
export function SectionHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-stone-900 font-outfit">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** ToolCard — single AI assistant card rendered in the right Tools panel.
 *  Mirrors AgenticOS Monica/Sider card style. */
function ToolCard({ tool, accent, collapsed }: { tool: ToolDef; accent: string; collapsed: boolean }) {
  const statusMeta: Record<ToolStatus, { label: string; color: string; bg: string; Icon: LucideIcon }> = {
    idle:      { label: 'Idle',     color: '#78716c', bg: '#f5f5f4', Icon: CircleDashed },
    running:   { label: 'Running',  color: '#1d4ed8', bg: '#dbeafe', Icon: Play },
    awaiting:  { label: 'Awaiting', color: '#b45309', bg: '#fef3c7', Icon: CircleDashed },
    error:     { label: 'Error',    color: '#b91c1c', bg: '#fee2e2', Icon: AlertCircle },
  };
  const meta = statusMeta[tool.status];
  const TIcon = tool.icon;
  const SIcon = meta.Icon;

  if (collapsed) {
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: meta.bg }} title={`${tool.name} — ${meta.label}`}>
        <TIcon className="w-4 h-4" style={{ color: meta.color }} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--panel-border)] shadow-sm p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1a` }}>
          <TIcon className="w-4.5 h-4.5" style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-bold text-stone-900 truncate">{tool.name}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: meta.color, background: meta.bg }}>
              <SIcon className="w-2.5 h-2.5" /> {meta.label}
            </span>
            {tool.lastActivity && (
              <span className="text-[10px] text-stone-400 truncate">{tool.lastActivity}</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-stone-600 leading-snug">{tool.description}</p>
      {tool.modelLabel && (
        <div className="text-[9.5px] font-mono text-stone-400">model · {tool.modelLabel}</div>
      )}
      <div className="flex items-center gap-1.5 mt-0.5">
        <button
          disabled={tool.status === 'running'}
          onClick={tool.onRun}
          className="flex-1 text-[11px] font-semibold text-white rounded-lg py-1 transition-all disabled:opacity-50"
          style={{ background: accent }}
        >
          {tool.status === 'running' ? 'Running…' : 'Run'}
        </button>
        <button className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-50">
          Logs
        </button>
      </div>
    </div>
  );
}
