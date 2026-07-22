/** Desktop — wallpaper + desktop-icon launcher + window rendering + persistence (Coach OS) */
import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { TopBar } from './TopBar';
import { Wallpaper } from './Wallpaper';
import { DesktopIcons } from './DesktopIcons';
import { WindowFrame } from './WindowFrame';
import { ToastContainer } from './Toast';
import { AppDrawer } from './AppDrawer';
import { ViewportGuard } from './ViewportGuard';
import { ErrorBoundary } from './ErrorBoundary';
import { useShellStore } from '../stores/shell.store';
import { getApp, getAllApps } from '../lib/app-registry';

export function Desktop() {
  const windows = useShellStore(s => s.windows);
  const restoreLayout = useShellStore(s => s.restoreLayout);
  const saveLayout = useShellStore(s => s.saveLayout);
  const openApp = useShellStore(s => s.openApp);

  useEffect(() => {
    restoreLayout();
    const restored = useShellStore.getState().windows.filter(w => w.isOpen);
    if (restored.length === 0) {
      console.log(`[Coach OS] Registry active: ${getAllApps().length} apps.`);
      const home = getApp('dashboard');
      if (home) openApp(home.id, home.name);
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
