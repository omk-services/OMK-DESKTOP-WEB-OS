/** WindowFrame — draggable/resizable window with breadcrumbs (Life OS canon, PostHog-light skin) */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useShellStore } from '../stores/shell.store';
import { X, Minus, Maximize2 } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { useWindowManager } from '../hooks/useWindowManager';
import { WindowContext, type DetailCrumb } from '../contexts/WindowContext';

interface WindowFrameProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function WindowFrame({ id, title, icon, children }: WindowFrameProps) {
  const windowState = useShellStore(s => s.windows.find(w => w.id === id));
  const closeApp = useShellStore(s => s.closeApp);
  const minimizeApp = useShellStore(s => s.minimizeApp);
  const maximizeApp = useShellStore(s => s.maximizeApp);
  const focusApp = useShellStore(s => s.focusApp);

  const {
    windowPosition, windowSize, isDragging, resizeDir, snapZone,
    handleTitleBarMouseDown, handleResizeStart,
  } = useWindowManager(id);

  const [activePage, setActivePage] = useState('Overview');
  const [detail, setDetail] = useState<DetailCrumb | null>(null);

  if (!windowState || !windowState.isOpen || windowState.isMinimized) return null;

  const isMax = windowState.isMaximized;

  return (
    <div
      data-window-frame
      onMouseDown={() => focusApp(id)}
      className={`absolute flex flex-col overflow-hidden bg-[var(--theme-bg)] ${isMax ? 'rounded-none' : 'rounded-2xl'}`}
      style={{
        top: isMax ? 40 : windowPosition.y,
        left: isMax ? 0 : windowPosition.x,
        width: isMax ? '100vw' : windowSize.width,
        height: isMax ? 'calc(100vh - 40px)' : windowSize.height,
        zIndex: windowState?.zIndex ?? 1,
        transition: isDragging || resizeDir ? 'none' : 'top 0.28s, left 0.28s, width 0.28s, height 0.28s',
        border: isMax ? 'none' : '1px solid var(--panel-border)',
        boxShadow: isMax ? 'none' : 'var(--shadow-window)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full h-full flex flex-col"
      >
        {/* Title bar — draggable */}
        <div
          onMouseDown={handleTitleBarMouseDown}
          className="h-11 flex items-center justify-between px-4 bg-white/70 backdrop-blur border-b border-[var(--panel-border-subtle)] cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div className="flex items-center gap-2 w-1/4">
            <TrafficLight color="red" onClick={() => closeApp(id)} label="Close window" icon={<X className="w-2.5 h-2.5" />} />
            <TrafficLight color="amber" onClick={() => minimizeApp(id)} label="Minimize window" icon={<Minus className="w-2.5 h-2.5" />} />
            <TrafficLight color="green" onClick={() => maximizeApp(id)} label="Maximize window" icon={<Maximize2 className="w-2 h-2" />} />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--canvas)] border border-[var(--panel-border-subtle)]">
            {icon && <span className="text-[var(--theme-accent)] flex items-center">{icon}</span>}
            <span className="text-[11px] font-semibold text-stone-600 tracking-tight truncate max-w-[220px]">{title}</span>
          </div>

          <div className="w-1/4" />
        </div>

        <WindowContext.Provider value={{ activePage, setActivePage, detail, setDetail }}>
          <div className="bg-white/50 border-b border-[var(--panel-border-subtle)] px-4 h-8 flex items-center shrink-0">
            <Breadcrumbs
              appTitle={title}
              activePage={activePage}
              detailLabel={detail?.label ?? null}
              onBackToActivePage={detail?.onBack}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-[var(--theme-bg)] relative flex flex-col">
            <div className="flex-1 w-full h-full min-h-[280px]">{children}</div>
          </div>
        </WindowContext.Provider>
      </motion.div>

      {!isMax && (
        <>
          <div className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-50" onMouseDown={e => handleResizeStart(e, 'n')} />
          <div className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-50" onMouseDown={e => handleResizeStart(e, 's')} />
          <div className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize z-50" onMouseDown={e => handleResizeStart(e, 'w')} />
          <div className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize z-50" onMouseDown={e => handleResizeStart(e, 'e')} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" onMouseDown={e => handleResizeStart(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" onMouseDown={e => handleResizeStart(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" onMouseDown={e => handleResizeStart(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" onMouseDown={e => handleResizeStart(e, 'se')} />
        </>
      )}

      {snapZone && (
        <div
          className={`fixed top-[44px] ${snapZone === 'left' ? 'left-0' : 'right-0'} w-1/2 bottom-[104px] rounded-2xl z-[9999] pointer-events-none transition-all duration-300`}
          style={{ background: 'rgba(var(--theme-accent-rgb), 0.10)', border: '2px solid rgba(var(--theme-accent-rgb), 0.35)' }}
        />
      )}
    </div>
  );
}

interface TrafficLightProps {
  color: 'red' | 'amber' | 'green';
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function TrafficLight({ color, onClick, label, icon }: TrafficLightProps) {
  const themes = { red: 'bg-[#ff5f56]', amber: 'bg-[#ffbd2e]', green: 'bg-[#27c93f]' };
  return (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      className={`w-3.5 h-3.5 rounded-full ${themes[color]} flex items-center justify-center group transition-transform active:scale-90 ring-1 ring-black/10`}
    >
      <span className="text-black/55 opacity-0 group-hover:opacity-100 transition-opacity">{icon}</span>
    </button>
  );
}
