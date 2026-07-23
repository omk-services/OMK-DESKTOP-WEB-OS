/** Desktop — wallpaper + desktop-icon launcher + window rendering + persistence (Coach OS) */
import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useDemoShellStore, hasSeenCitadel, markCitadelSeen } from '../lib/demoShell';
import { TopBar } from './TopBar';
import { Wallpaper } from './Wallpaper';
import { DesktopIcons } from './DesktopIcons';
import { WindowFrame } from './WindowFrame';
import { ToastContainer } from './Toast';
import { AppDrawer } from './AppDrawer';
import { ViewportGuard } from './ViewportGuard';
import { ErrorBoundary } from './ErrorBoundary';
import { useShellStore } from '../stores/shell.store';
import { getApp } from '../lib/app-registry';

export function Desktop() {
  const windows = useShellStore(s => s.windows);
  const restoreLayout = useShellStore(s => s.restoreLayout);
  const saveLayout = useShellStore(s => s.saveLayout);
  const openApp = useShellStore(s => s.openApp);

  useEffect(() => {
    try {
      restoreLayout();
      const restored = useShellStore.getState().windows.filter(w => w.isOpen);
      if (restored.length > 0) return;
      // Migration: the previous Vercel build had a hydration race that left
      // only the citadel window in the macro's persisted layout. Clear that
      // legacy state so the first-visit branch can fire on a re-load.
      try {
        const raw = localStorage.getItem('coach-os-shell-layout-v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          const wins = parsed?.state?.windows ?? [];
          const citadelOnly = wins.length === 1 && wins[0].id === 'onboarding' && wins[0].isOpen;
          if (citadelOnly) localStorage.removeItem('coach-os-shell-layout-v1');
        }
      } catch { /* noop */ }
      const isFirstVisit = !hasSeenCitadel();
      if (isFirstVisit) {
        const onboarding = getApp('onboarding');
        if (onboarding) openApp(onboarding.id, onboarding.name);
        // Pre-seed the citadel + 4 demo panels in a single atomic setState.
        useDemoShellStore.setState({
          windows: [
            { id: '__citadel__', title: 'demo-coach · your Nexus preview', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 100, position: { x: 443, y: 75 }, size: { width: 820, height: 640 } },
            { id: 'ip-vault',    title: 'IP Vault',                 isOpen: true, isMinimized: false, isMaximized: false, zIndex: 101, position: { x: 18,  y: 16 }, size: { width: 320, height: 260 } },
            { id: 'apps',         title: 'Mini-apps Library',        isOpen: true, isMinimized: false, isMaximized: false, zIndex: 102, position: { x: 350, y: 16 }, size: { width: 320, height: 260 } },
            { id: 'quiz-result',  title: 'QuizResult',               isOpen: true, isMinimized: false, isMaximized: false, zIndex: 103, position: { x: 18,  y: 288 }, size: { width: 320, height: 260 } },
            { id: 'compliance',  title: 'Compliance',               isOpen: true, isMinimized: false, isMaximized: false, zIndex: 104, position: { x: 350, y: 288 }, size: { width: 320, height: 260 } },
          ],
          activeWindowId: 'ip-vault',
        });
        markCitadelSeen();
      } else {
        const home = getApp('dashboard');
        if (home) openApp(home.id, home.name);
      }
    } catch (err) {
      console.error('[Desktop] boot effect failed', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleUnload = () => saveLayout();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveLayout]);

  return (
    <ViewportGuard>
      <Wallpaper />

      <div className="w-full h-screen overflow-hidden relative text-stone-800 bg-transparent">
        <TopBar />
        <DesktopIcons />

        <div className="absolute inset-0 z-10 pointer-events-none">
          <AnimatePresence>
            {windows.map(win => {
              if (win.id === 'drawer' || !win.isOpen) return null;
              const app = getApp(win.id);
              const Icon = app?.icon;
              const Component = app?.component;
              return (
                <div key={win.id} className="pointer-events-auto">
                  <WindowFrame id={win.id} title={win.title} icon={Icon ? <Icon className="w-3.5 h-3.5" /> : undefined}>
                    <ErrorBoundary>
                      {Component ? <Component /> : <MissingApp title={win.title} />}
                    </ErrorBoundary>
                  </WindowFrame>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        <ToastContainer />
        <AppDrawer />
      </div>
    </ViewportGuard>
  );
}

function MissingApp({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
      <div className="w-16 h-16 rounded-2xl bg-[var(--canvas)] border border-[var(--panel-border)] flex items-center justify-center text-2xl">🚧</div>
      <h3 className="text-base font-bold text-stone-700">{title}</h3>
      <p className="text-sm text-stone-400 max-w-xs">This app is not registered.</p>
    </div>
  );
}
