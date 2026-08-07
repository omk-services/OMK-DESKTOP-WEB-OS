/** DesktopIcons — real openable icons sitting on the wallpaper (replaces the Dock).
 *  Single click = select, double click = open the app window. */
import { useState } from 'react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';
import { useAppVisibility } from '../stores/appVisibility.store';

export function DesktopIcons() {
  const openApp = useShellStore(s => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);
  const userHidden = useAppVisibility((s) => s.hidden);
  // Hide apps flagged with hidden: true (sister Drawbridge Task 1 2026-07-28) OR toggled off by the user.
  const apps = getAllApps().filter(a => !a.hidden && userHidden[a.id] !== true);

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
              {/* Pastille sous le libelle.
               *
               *  Le libelle etait en `text-stone-700` avec une ombre blanche :
               *  lisible sur l'ancienne scene pastel, illisible des que le fond
               *  est devenu une photo. Un texte clair sur un voile sombre tient
               *  sur n'importe quelle image — y compris celle que l'utilisateur
               *  televerse, qu'on ne peut pas connaitre a l'avance. */}
              <span className="max-w-[76px] rounded-md bg-black/45 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-tight text-white backdrop-blur-[2px]">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
