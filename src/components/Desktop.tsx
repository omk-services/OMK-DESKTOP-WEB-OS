/** Desktop — wallpaper + desktop-icon launcher + window rendering + persistence (Coach OS) */
import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useDemoShellStore, markCitadelSeen } from '../lib/demoShell';
import { TopBar } from './TopBar';
import { Wallpaper } from './Wallpaper';
import { Dock } from './Dock';
import { DesktopIcons } from './DesktopIcons';
import { WindowFrame } from './WindowFrame';
import { ToastContainer } from './Toast';
import { AppDrawer } from './AppDrawer';
import { ViewportGuard } from './ViewportGuard';
import { ErrorBoundary } from './ErrorBoundary';
import { useShellStore } from '../stores/shell.store';
import { getApp } from '../lib/app-registry';
import { useWallpaper } from '../lib/wallpaper';
import { AssistantOverlay } from '../agent/AssistantOverlay';

/** Onboarding-only routes: when the prospect hits /onboarding or /demo, the
 *  Macro Desktop opens with the Onboarding window auto-launched + maximized.
 *  This is the GTM campaign entry-point: every outreach CTA links to one of
 *  these two paths. */
const ONBOARDING_PATHS = new Set(['/onboarding', '/demo', '/onboarding/', '/demo/']);

function isOnboardingPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  return ONBOARDING_PATHS.has(path) || path.startsWith('/onboarding/') || path.startsWith('/demo/');
}

export function Desktop(): import('react').ReactNode {
  const windows = useShellStore(s => s.windows);
  const restoreLayout = useShellStore(s => s.restoreLayout);
  const saveLayout = useShellStore(s => s.saveLayout);
  const openApp = useShellStore(s => s.openApp);
  const maximizeApp = useShellStore(s => s.maximizeApp);

  useEffect(() => {
    try {
      // Wipe the macro's persisted layout BEFORE restoreLayout so the
      // first-visit branch actually fires. The macro's beforeunload saveLayout()
      // persists whatever is open, which can accidentally skip first-visit.
      // The citadel is a self-contained setState in the demoShell store, so
      // the macro layout doesn't need to remember anything.
      restoreLayout();
      const restored = useShellStore.getState().windows.filter(w => w.isOpen);
      if (restored.length > 0) {
        // Layout already exists — but if we're on an onboarding path, ensure
        // the Onboarding window is open + maximized on top.
        if (isOnboardingPath()) {
          const onboarding = getApp('onboarding');
          if (onboarding) {
            openApp(onboarding.id, onboarding.name);
            requestAnimationFrame(() => maximizeApp(onboarding.id));
          }
        }
        return;
      }
      const onboardingPath = isOnboardingPath();
      const onboarding = getApp('onboarding');
      if (onboardingPath && onboarding) {
        openApp(onboarding.id, onboarding.name);
        requestAnimationFrame(() => maximizeApp(onboarding.id));
      } else {
        // No persisted layout + normal URL — leave the desktop empty. Do NOT force onboarding.
        return;
      }
      // Pre-seed the citadel + 4 demo panels in the demoShell store. Panels
      // start CLOSED — they're opened by the citadel's reveal phase OR by the
      // user clicking dock icons. This avoids the bug where panels would
      // overlay the citadel during the quiz phase.
      useDemoShellStore.setState({
        windows: [
          { id: '__citadel__', title: 'demo-coach · your Nexus preview', isOpen: true, isMinimized: false, isMaximized: false, zIndex: 100, position: { x: 443, y: 75 }, size: { width: 820, height: 640 } },
          { id: 'ip-vault',    title: 'IP Vault',                  isOpen: false, isMinimized: false, isMaximized: false, zIndex: 101, position: { x: 18,  y: 16 }, size: { width: 320, height: 260 } },
          { id: 'apps',         title: 'Mini-apps Library',         isOpen: false, isMinimized: false, isMaximized: false, zIndex: 102, position: { x: 350, y: 16 }, size: { width: 320, height: 260 } },
          { id: 'quiz-result',  title: 'QuizResult',                isOpen: false, isMinimized: false, isMaximized: false, zIndex: 103, position: { x: 18,  y: 288 }, size: { width: 320, height: 260 } },
          { id: 'compliance',  title: 'Compliance',                isOpen: false, isMinimized: false, isMaximized: false, zIndex: 104, position: { x: 350, y: 288 }, size: { width: 320, height: 260 } },
          { id: 'audit',        title: 'Audit Simulation',          isOpen: false, isMinimized: false, isMaximized: false, zIndex: 105, position: { x: 200, y: 488 }, size: { width: 320, height: 260 } },
        ],
        activeWindowId: '__citadel__',
      });
      markCitadelSeen();
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
      {/* The wallpaper component renders the canonical paper-garden scene.
        If the user uploaded a custom wallpaper via Settings, we overlay an
        extra <div> on top of it with the user's image + fit. Falls back to
        the canonical scene when no image is set — keeps the rest of Desktop
        untouched. */}
      <Wallpaper />
      <CustomWallpaperLayer />

      <div className="w-full h-screen overflow-hidden relative text-[var(--theme-text)] bg-transparent">
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

        <Dock />
        <ToastContainer />
        <AppDrawer />
        <AssistantOverlay />
      </div>
    </ViewportGuard>
  );
}

/** Couche du fond d'ecran choisi par l'utilisateur, posee au-dessus de la scene
 *  par defaut (`<Wallpaper />`, z-[-10]) et sous tout le reste.
 *
 *  Composant a part entiere, et non une fonction appelee dans le rendu du
 *  bureau : c'est ce qui lui permet de s'abonner par `useWallpaper()`. La
 *  version precedente lisait `localStorage` directement dans le corps de
 *  `Desktop`, sans abonnement — televerser une image ne repeignait rien tant
 *  qu'un autre evenement ne provoquait pas de rendu. */
function CustomWallpaperLayer() {
  const { dataUrl, fit } = useWallpaper();
  if (!dataUrl) return null;
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[-9] pointer-events-none"
      style={{
        backgroundImage: `url(${dataUrl})`,
        backgroundRepeat: fit === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundSize: fit === 'repeat' ? 'auto' : fit,
        backgroundPosition: 'center center',
      }}
    />
  );
}

function MissingApp({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
      <div className="w-16 h-16 rounded-2xl bg-[var(--canvas)] border border-[var(--panel-border)] flex items-center justify-center text-2xl">🚧</div>
      <h3 className="text-base font-bold text-[var(--theme-text)]">{title}</h3>
      <p className="text-sm text-[var(--theme-text-dim)] max-w-xs">This app is not registered.</p>
    </div>
  );
}
