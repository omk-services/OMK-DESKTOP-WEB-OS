/** DesktopIcons — real openable icons sitting on the wallpaper (replaces the Dock).
 *  Single click = select, double click = open the app window. */
import { useState } from 'react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';

export function DesktopIcons() {
  const openApp = useShellStore(s => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);
  const apps = getAllApps();

  return (
    <div
      className="absolute left-0 top-11 bottom-4 z-0 p-4 pointer-events-none"
      onClick={() => setSelected(null)}
    >
      <div className="grid grid-flow-col gap-x-2 gap-y-1 h-full content-start" style={{ gridTemplateRows: 'repeat(7, max-content)' }}>
        {apps.map(app => {
          const Icon = app.icon;
          const accent = app.accent ?? 'var(--theme-accent)';
          const isSel = selected === app.id;
          return (
            <button
              key={app.id}
              onClick={(e) => { e.stopPropagation(); setSelected(app.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); openApp(app.id, app.name); }}
              title={`${app.name} — double-click to open`}
              className={`pointer-events-auto w-[86px] flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-xl transition-all group ${
                isSel ? 'bg-white/55 ring-1 ring-[var(--theme-accent)]/40' : 'hover:bg-white/35'
              }`}
            >
              <span
                className="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(41,37,36,0.4)] border border-white/60 group-hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(160deg, #ffffff, ${accent}22)` }}
              >
                <Icon className="w-6 h-6" style={{ color: accent }} />
              </span>
              <span className="text-[11px] font-semibold text-stone-700 text-center leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
