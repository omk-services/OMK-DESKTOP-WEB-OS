/** App Drawer — Launchpad for every Citadelle app (Life OS canon, light skin) */
import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Search } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';
import { useAppVisibility } from '../stores/appVisibility.store';

export function AppDrawer(): import('react').ReactNode {
  const isDrawerOpen = useShellStore(s => s.windows.some(w => w.id === 'drawer' && w.isOpen));
  const closeApp = useShellStore(s => s.closeApp);
  const openApp = useShellStore(s => s.openApp);
  const userHidden = useAppVisibility((s) => s.hidden);
  const [query, setQuery] = useState('');

  if (!isDrawerOpen) return null;

  const apps = getAllApps().filter(a =>
    userHidden[a.id] !== true && (
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[3000] bg-[var(--canvas)]/85 backdrop-blur-2xl p-12 flex flex-col items-center"
    >
      <button
        type="button"
        onClick={() => closeApp('drawer')}
        aria-label="Close launchpad"
        className="absolute top-8 right-12 p-3 rounded-full bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-muted)] transition-all border border-[var(--panel-border)] shadow-sm"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-xl mb-14 space-y-6 text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-text)] tracking-tight font-outfit">Launchpad</h2>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--theme-text-dim)]" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            type="text"
            placeholder="Search apps…"
            aria-label="Search apps"
            className="w-full bg-[var(--theme-surface)] border border-[var(--panel-border)] rounded-2xl py-3.5 pl-14 pr-6 text-base text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {apps.map((app, i) => {
          const Icon = app.icon;
          const accent = app.accent ?? 'var(--theme-accent)';
          return (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { openApp(app.id, app.name); closeApp('drawer'); }}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-20 h-20 rounded-[26px] bg-[var(--theme-surface)] border border-[var(--panel-border)] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:border-[var(--theme-accent)] transition-all duration-300">
                <Icon className="w-9 h-9" style={{ color: accent }} />
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text)] transition-colors">{app.name}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
