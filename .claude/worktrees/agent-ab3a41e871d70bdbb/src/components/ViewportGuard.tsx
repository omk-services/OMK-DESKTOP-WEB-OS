/** ViewportGuard — keeps windows within safe screen boundaries (Life OS canon) */
import { useEffect } from 'react';
import React from 'react';
import { useShellStore } from '../stores/shell.store';

export function ViewportGuard({ children }: { children: React.ReactNode }) {
  const windows = useShellStore(s => s.windows);
  const updatePosition = useShellStore(s => s.updatePosition);

  useEffect(() => {
    const checkBoundaries = () => {
      const topBarHeight = 40;
      const dockHeight = 96;
      const vWidth = window.innerWidth;
      const vHeight = window.innerHeight;

      windows.forEach(win => {
        if (!win.isOpen || win.isMinimized || win.isMaximized) return;
        let newX = win.position.x;
        let newY = win.position.y;
        let changed = false;

        if (newY < topBarHeight) { newY = topBarHeight; changed = true; }
        if (newY + 40 > vHeight - dockHeight) { newY = vHeight - dockHeight - 40; changed = true; }
        if (newX < 0) { newX = 0; changed = true; }
        if (newX + 100 > vWidth) { newX = vWidth - 100; changed = true; }

        if (changed) updatePosition(win.id, newX, newY);
      });
    };

    window.addEventListener('resize', checkBoundaries);
    const interval = setInterval(checkBoundaries, 2000);
    return () => { window.removeEventListener('resize', checkBoundaries); clearInterval(interval); };
  }, [windows, updatePosition]);

  return <>{children}</>;
}
