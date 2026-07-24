/** AppFrame — internal window shell: every app gets its OWN left sidebar + content,
 *  in the Life OS app style. Each app supplies its sections & distinct content.
 *  The sidebar collapses to an icon rail — manually via toggle, or automatically
 *  once the window is resized narrow (desktop-first, but each window stays usable
 *  down to mobile widths since Coach OS windows are freely resizable).
 *
 *  Optional 3-column layout (AgenticOS-style "Tools" panel on the right):
 *  apps can declare AI assistants via the `tools` prop — they render as a
 *  collapsible right panel with per-tool status + action buttons. The pattern
 *  mirrors Hugo's AgenticOS Monica/Sider cards. */
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Play, CircleDashed, AlertCircle } from 'lucide-react';
import { useWindowPage } from '../contexts/WindowContext';
import { useVoiceIntentStore } from '../lib/voiceIntent';

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
      {/* Internal sidebar — collapses to an icon rail */}
      <aside
        className={`shrink-0 border-r border-[var(--panel-border-subtle)] bg-[var(--canvas)] flex flex-col transition-[width] duration-200 overflow-hidden ${
          collapsed ? 'w-14' : 'w-52'
        }`}
      >
        <div className={`py-3 border-b border-[var(--panel-border-subtle)] flex items-center ${collapsed ? 'flex-col gap-2 px-0' : 'px-4 justify-between gap-2'}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? '' : 'flex-1'}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1a` }}>
              <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-stone-800 tracking-tight truncate font-outfit">{title}</div>
                {subtitle && <div className="text-[10px] text-stone-400 uppercase tracking-wide truncate">{subtitle}</div>}
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-white transition-colors shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

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
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{group}</div>
                )}
                <button
                  onClick={() => setActiveId(s.id)}
                  title={collapsed ? s.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all ${
                    collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2'
                  } ${isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800 hover:bg-white'}`}
                  style={isActive ? { background: `${accent}14` } : undefined}
                >
                  <SIcon className="w-4 h-4 shrink-0" style={{ color: isActive ? accent : undefined }} />
                  {!collapsed && <span className="truncate">{s.label}</span>}
                  {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />}
                </button>
              </div>
            );
          })}
        </nav>
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
