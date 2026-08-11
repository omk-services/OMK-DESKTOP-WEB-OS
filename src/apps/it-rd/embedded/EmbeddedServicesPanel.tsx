/** EmbeddedServicesPanel — the 4-service grid for IT/R&D.
 *
 *  Self-contained: opens itself when the global event
 *  `coach-os:open-embedded-services` is dispatched, OR when the floating
 *  launcher chip is clicked.
 *
 *  Each service is its own ServiceFrame (probe + iframe or error).
 *  The panel is the natural extension of IT/R&D's Kernel section —
 *  where Kernel shows the *catalog* of services, this panel shows the
 *  *live consoles* behind them.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Server, ExternalLink, RotateCw } from 'lucide-react';
import { SERVICES } from './services';
import { ServiceFrame } from './ServiceFrame';

interface Props {
  floating?: boolean;
}

const EVENT_NAME = 'coach-os:open-embedded-services';

function openEmbeddedServices(): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

if (typeof window !== 'undefined') {
  // DEV-only handle — same pattern as `shell.store.ts`'s `window.__coachos`
  // exposure. Lets a Playwright test or the agent open the panel without
  // poking at the React tree.
  if (import.meta.env.DEV) {
    (window as Window & { openEmbeddedServices?: () => void }).openEmbeddedServices = openEmbeddedServices;
  }
}

export function EmbeddedServicesPanel({ floating = false }: Props) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const onOpen = (): void => {
      setOpen(true);
      setNonce((n) => n + 1);
    };
    window.addEventListener(EVENT_NAME, onOpen as EventListener);
    return () => window.removeEventListener(EVENT_NAME, onOpen as EventListener);
  }, []);

  if (floating) {
    return (
      <>
        <button
          onClick={() => { setOpen(true); setNonce((n) => n + 1); }}
          aria-label="Ouvrir les services embarques"
          data-testid="embedded-services-launcher"
          className="fixed bottom-3 right-44 z-[4000] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg ring-1 ring-black/5 transition hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: 'white',
          }}
        >
          <Server size={14} />
          Services embarques
        </button>
        <AnimatePresence>
          {open && (
            <Overlay onClose={() => setOpen(false)} nonce={nonce} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return <AnimatePresence>{open && <Overlay onClose={() => setOpen(false)} nonce={nonce} />}</AnimatePresence>;
}

function Overlay({ onClose, nonce }: { onClose: () => void; nonce: number }) {
  return (
    <motion.div
      key={`overlay-${nonce}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      data-testid="embedded-services-overlay"
      className="fixed inset-0 z-[4500] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="relative w-[min(96vw,1280px)] h-[min(92vh,840px)] rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden flex flex-col"
        style={{ background: 'var(--theme-bg)' }}
      >
        <header
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: 'var(--panel-border)' }}
        >
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
              IT / R&D — consoles embarquees
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              4 services vivants · sondes live · fallbacks explicites
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </header>

        <div
          className="px-5 py-2 text-[10.5px] border-b"
          style={{
            color: 'var(--theme-muted)',
            background: 'var(--canvas)',
            borderColor: 'var(--panel-border)',
          }}
        >
          Chaque cadre est precede d une sonde HEAD/GET. Si le service refuse l embarquement
          (X-Frame-Options, CSP frame-ancestors), un message clair cite l en-tete HTTP en
          cause avec un lien d ouverture externe. Les services morts affichent la raison
          reseau (timeout, connexion refusee).
        </div>

        <div className="flex-1 overflow-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <ServiceFrame key={s.id} service={s} />
          ))}
        </div>

        <footer
          className="px-5 py-2 text-[10.5px] flex items-center justify-between border-t"
          style={{ color: 'var(--theme-muted)', borderColor: 'var(--panel-border)' }}
        >
          <span>
            URLs configurables dans <code>src/apps/it-rd/embedded/services.ts</code>.
            En production : Render.com, pas localhost.
          </span>
          <a
            href="https://dashboard.render.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Render.com <ExternalLink size={10} />
          </a>
        </footer>
      </motion.div>
    </motion.div>
  );
}
