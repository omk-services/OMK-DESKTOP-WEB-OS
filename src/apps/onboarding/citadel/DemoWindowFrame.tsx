/** DemoWindowFrame — Mini Desktop OS window shell. Mirrors Macro Coach OS
 *  WindowFrame visually (PostHog-light skin + glass effects + draggable +
 *  resizable) but binds to useDemoShellStore instead of useShellStore so the
 *  citadel's windows never collide with Macro Coach OS state. */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useDemoShellStore } from '../../../lib/demoShell';

interface DemoWindowFrameProps {
  id: string;
  title: string;
  accent: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function DemoWindowFrame({ id, title, accent, icon, children }: DemoWindowFrameProps) {
  const windowState = useDemoShellStore(s => s.windows.find(w => w.id === id));
  const closeApp = useDemoShellStore(s => s.closeApp);
  const minimizeApp = useDemoShellStore(s => s.minimizeApp);
  const maximizeApp = useDemoShellStore(s => s.maximizeApp);
  const focusApp = useDemoShellStore(s => s.focusApp);
  const updatePosition = useDemoShellStore(s => s.updatePosition);
  const updateWindowState = useDemoShellStore(s => s.updateWindowState);

  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const resizeStartRef = React.useRef<{ x: number; y: number; pos: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

  if (!windowState || !windowState.isOpen || windowState.isMinimized) return null;

  const isMax = windowState.isMaximized;

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (isMax) return;
    setIsDragging(true);
    focusApp(id);
    setDragOffset({ dx: e.clientX - windowState.position.x, dy: e.clientY - windowState.position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const x = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.dx));
      const y = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.dy));
      updatePosition(id, x, y);
    } else if (resizeDir) {
      const start = resizeStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      let nx = start.pos.x, ny = start.pos.y, nw = start.size.width, nh = start.size.height;
      if (resizeDir.includes('e')) nw = Math.max(280, start.size.width + dx);
      if (resizeDir.includes('s')) nh = Math.max(220, start.size.height + dy);
      if (resizeDir.includes('w')) { nw = Math.max(280, start.size.width - dx); nx = start.pos.x + (start.size.width - nw); }
      if (resizeDir.includes('n')) { nh = Math.max(220, start.size.height - dy); ny = start.pos.y + (start.size.height - nh); }
      updateWindowState(id, { x: nx, y: ny }, { width: nw, height: nh });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeDir(null);
    resizeStartRef.current = null;
  };

  React.useEffect(() => {
    if (isDragging || resizeDir) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  const handleResizeStart = (e: React.MouseEvent, dir: string) => {
    if (isMax) return;
    e.stopPropagation();
    setResizeDir(dir);
    focusApp(id);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pos: { ...windowState.position },
      size: { ...windowState.size },
    };
  };

  return (
    <div
      onMouseDown={() => focusApp(id)}
      data-citadel-window={id}
      className={`absolute flex flex-col overflow-hidden bg-[var(--theme-bg)] ${isMax ? 'rounded-none' : 'rounded-xl'}`}
      style={{
        top: isMax ? 32 : windowState.position.y,
        left: isMax ? 0 : windowState.position.x,
        width: isMax ? '100vw' : windowState.size.width,
        height: isMax ? 'calc(100% - 32px)' : windowState.size.height,
        zIndex: windowState.zIndex,
        transition: isDragging || resizeDir ? 'none' : 'all 0.2s',
        border: '1px solid var(--panel-border)',
        boxShadow: 'var(--shadow-window)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full h-full flex flex-col"
      >
        {/* Title bar */}
        <div
          onMouseDown={handleTitleBarMouseDown}
          onDoubleClick={() => maximizeApp(id)}
          className="h-9 flex items-center justify-between px-3 bg-white/85 backdrop-blur border-b border-[var(--panel-border-subtle)] cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div className="flex items-center gap-2 w-1/4">
            <button
              onClick={(e) => { e.stopPropagation(); closeApp(id); }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Close window"
              className="w-3 h-3 rounded-full bg-[#ff5f56] ring-1 ring-black/10 hover:opacity-80"
            />
            <button
              onClick={(e) => { e.stopPropagation(); minimizeApp(id); }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Minimize window"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] ring-1 ring-black/10 hover:opacity-80"
            />
            <button
              onClick={(e) => { e.stopPropagation(); maximizeApp(id); }}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Maximize window"
              className="w-3 h-3 rounded-full bg-[#27c93f] ring-1 ring-black/10 hover:opacity-80"
            />
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-tight uppercase"
            style={{ background: `${accent}14`, color: accent }}
          >
            {icon && <span className="flex items-center">{icon}</span>}
            <span className="truncate max-w-[260px]">{title}</span>
          </div>

          <div className="w-1/4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-[var(--theme-bg)]">
          {children}
        </div>
      </motion.div>

      {/* Resize handles */}
      {!isMax && (
        <>
          <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize z-50" onMouseDown={e => handleResizeStart(e, 'n')} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize z-50" onMouseDown={e => handleResizeStart(e, 's')} />
          <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize z-50" onMouseDown={e => handleResizeStart(e, 'w')} />
          <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize z-50" onMouseDown={e => handleResizeStart(e, 'e')} />
          <div className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" onMouseDown={e => handleResizeStart(e, 'nw')} />
          <div className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" onMouseDown={e => handleResizeStart(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" onMouseDown={e => handleResizeStart(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" onMouseDown={e => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  );
}

