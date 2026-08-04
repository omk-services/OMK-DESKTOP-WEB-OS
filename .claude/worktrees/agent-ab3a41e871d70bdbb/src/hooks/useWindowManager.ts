/** useWindowManager — native drag/resize/snap hook (forked from Life OS / RyOS pattern) */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useShellStore } from '../stores/shell.store';
import type { WindowPosition, WindowSize, ResizeDirection, ResizeStart, SnapZone } from '../types/window.types';
import { WINDOW_CONSTRAINTS as WC } from '../types/window.types';

export function useWindowManager(windowId: string) {
  const windowState = useShellStore(s => s.windows.find(w => w.id === windowId));
  const updateWindowState = useShellStore(s => s.updateWindowState);

  const [windowPosition, setWindowPosition] = useState<WindowPosition>(windowState?.position ?? { x: 100, y: 80 });
  const [windowSize, setWindowSize] = useState<WindowSize>(windowState?.size ?? { width: 920, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDirection>('');
  const [snapZone, setSnapZone] = useState<SnapZone>(null);

  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef<ResizeStart>({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const preSnapStateRef = useRef<{ position: WindowPosition, size: WindowSize } | null>(null);
  const posRef = useRef(windowPosition);
  const sizeRef = useRef(windowSize);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDragging && !resizeDir && windowState) {
      setWindowPosition(windowState.position);
      setWindowSize(windowState.size);
      posRef.current = windowState.position;
      sizeRef.current = windowState.size;
    }
  }, [windowState?.position, windowState?.size, isDragging, resizeDir]);

  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState?.isMaximized) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).closest('[data-window-frame]')!.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }, [windowState?.isMaximized]);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      x: e.clientX, y: e.clientY,
      width: sizeRef.current.width, height: sizeRef.current.height,
      left: posRef.current.x, top: posRef.current.y,
    };
    setResizeDir(dir);
  }, []);

  useEffect(() => {
    if (!isDragging && !resizeDir) return;

    const handleMove = (e: MouseEvent) => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        if (isDragging) {
          if (preSnapStateRef.current) {
            const { size } = preSnapStateRef.current;
            dragOffsetRef.current = { x: size.width / 2, y: 20 };
            setWindowSize(size);
            sizeRef.current = size;
            preSnapStateRef.current = null;
          }

          const x = Math.min(
            Math.max(-(sizeRef.current.width - WC.VISIBLE_MIN), e.clientX - dragOffsetRef.current.x),
            window.innerWidth - WC.VISIBLE_MIN
          );
          const y = Math.min(
            Math.max(WC.TOPBAR_HEIGHT, e.clientY - dragOffsetRef.current.y),
            window.innerHeight - WC.VISIBLE_MIN
          );
          posRef.current = { x, y };
          setWindowPosition({ x, y });

          if (e.clientX <= WC.SNAP_THRESHOLD) setSnapZone('left');
          else if (e.clientX >= window.innerWidth - WC.SNAP_THRESHOLD) setSnapZone('right');
          else setSnapZone(null);
        }

        if (resizeDir) {
          const rs = resizeStartRef.current;
          const dx = e.clientX - rs.x;
          const dy = e.clientY - rs.y;
          let { width, height, left, top } = { width: rs.width, height: rs.height, left: rs.left, top: rs.top };

          if (resizeDir.includes('e')) width = Math.max(WC.MIN_WIDTH, rs.width + dx);
          if (resizeDir.includes('w')) {
            const newW = Math.max(WC.MIN_WIDTH, rs.width - dx);
            left = rs.left + (rs.width - newW);
            width = newW;
          }
          if (resizeDir.includes('s')) height = Math.max(WC.MIN_HEIGHT, rs.height + dy);
          if (resizeDir.includes('n')) {
            const newH = Math.max(WC.MIN_HEIGHT, rs.height - dy);
            top = Math.max(WC.TOPBAR_HEIGHT, rs.top + (rs.height - newH));
            height = newH;
          }

          posRef.current = { x: left, y: top };
          sizeRef.current = { width, height };
          setWindowPosition({ x: left, y: top });
          setWindowSize({ width, height });
        }
      });
    };

    const handleUp = () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

      if (isDragging && snapZone) {
        preSnapStateRef.current = { position: { ...windowPosition }, size: { ...windowSize } };
        const snapH = window.innerHeight - WC.TOPBAR_HEIGHT - WC.DOCK_HEIGHT;
        const snapW = Math.floor(window.innerWidth / 2);
        const newPos = { x: snapZone === 'left' ? 0 : snapW, y: WC.TOPBAR_HEIGHT };
        const newSize = { width: snapW, height: snapH };
        posRef.current = newPos;
        sizeRef.current = newSize;
        setWindowPosition(newPos);
        setWindowSize(newSize);
        updateWindowState(windowId, newPos, newSize);
      } else {
        updateWindowState(windowId, posRef.current, sizeRef.current);
      }

      setIsDragging(false);
      setResizeDir('');
      setSnapZone(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, resizeDir, snapZone, windowId, updateWindowState, windowPosition, windowSize]);

  return { windowPosition, windowSize, isDragging, resizeDir, snapZone, handleTitleBarMouseDown, handleResizeStart };
}
