/** AppFrame — internal window shell: every app gets its OWN left sidebar + content,
 *  in the Life OS app style. Each app supplies its sections & distinct content.
 *  The sidebar collapses to an icon rail — manually via toggle, or automatically
 *  once the window is resized narrow (desktop-first, but each window stays usable
 *  down to mobile widths since Coach OS windows are freely resizable). */
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useWindowPage } from '../contexts/WindowContext';

export interface AppSection {
  id: string;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

interface AppFrameProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent: string;
  sections: AppSection[];
  /** optional group labels: map section id -> group header shown above it */
  groups?: Record<string, string>;
}

const NARROW_BREAKPOINT = 640;

export function AppFrame({ title, subtitle, icon: Icon, accent, sections, groups }: AppFrameProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [isNarrow, setIsNarrow] = useState(false);
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { setActivePage } = useWindowPage();
  const active = sections.find(s => s.id === activeId) ?? sections[0];

  useEffect(() => {
    if (active) setActivePage(active.label);
  }, [activeId, active, setActivePage]);

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
