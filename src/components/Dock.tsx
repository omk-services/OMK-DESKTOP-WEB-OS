/** Dock — les apps OUVERTES, en bas de l'ecran.
 *
 *  A ne pas confondre avec `DesktopIcons`, qui pose sur le fond d'ecran les
 *  icones de TOUTES les apps installees. Le dock ne montre que ce qui tourne :
 *  c'est le seul endroit d'ou l'on retrouve une fenetre reduite, qui autrement
 *  disparait sans laisser de trace.
 *
 *  `ViewportGuard` reserve deja 96 px en bas pour un dock — la constante lui
 *  preexistait, le dock avait ete retire. `HAUTEUR_DOCK` est exportee pour que
 *  `DesktopIcons` s'arrete au-dessus plutot que de glisser dessous.
 */
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';
import { X } from 'lucide-react';

/** Hauteur reservee au dock, marge du bas comprise.
 *  92 et non 84 : la pastille d'etat depasse sous le bouton, et a 84 les coins
 *  bas de la barre touchaient le bord de la fenetre. */
export const HAUTEUR_DOCK = 92;

export function Dock(): import('react').ReactNode {
  // `windows` est une reference stable du magasin : on filtre DANS le composant,
  // jamais dans le selecteur. Un selecteur qui construit un tableau neuf a chaque
  // appel fait boucler React (cf. CLAUDE.md, piege de l'instantane).
  const windows = useShellStore(s => s.windows);
  const activeWindowId = useShellStore(s => s.activeWindowId);
  const focusApp = useShellStore(s => s.focusApp);
  const minimizeApp = useShellStore(s => s.minimizeApp);
  const closeApp = useShellStore(s => s.closeApp);

  const ouvertes = windows.filter(w => w.isOpen);
  if (ouvertes.length === 0) return null;

  const registre = getAllApps();

  return (
    <div
      // `items-end` sur le CONTENEUR, pas seulement sur la barre. Sans lui,
      // l'alignement par defaut (`stretch`) etire la barre sur les 92 px
      // reserves : elle touchait le bord bas de la fenetre et ses coins arrondis
      // disparaissaient.
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-center pointer-events-none"
      style={{ height: HAUTEUR_DOCK }}
    >
      <div
        className="pointer-events-auto mb-4 flex max-w-[92vw] items-end gap-2 overflow-x-auto rounded-2xl border px-3 py-2.5 backdrop-blur-xl"
        style={{
          // 92 % et non 78 % : a 78 %, la barre posee sur une fenetre d'app
          // blanche disparaissait dans le fond. Le liesere sombre en `ring`
          // la detache aussi bien d'un mur blanc que d'un fond d'ecran charge —
          // on ne sait pas sur quoi elle se posera.
          background: 'color-mix(in srgb, var(--theme-surface) 92%, transparent)',
          borderColor: 'var(--panel-border)',
          boxShadow:
            '0 0 0 1px rgba(0,0,0,0.14), 0 12px 34px -12px rgba(0,0,0,0.55)',
        }}
      >
        {ouvertes.map(win => {
          const app = registre.find(a => a.id === win.id);
          const Icon = app?.icon;
          const accent = app?.accent ?? 'var(--theme-accent)';
          const actif = activeWindowId === win.id && !win.isMinimized;

          return (
            <div key={win.id} className="group relative">
              <button
                onClick={() => {
                  // Un clic sur la fenetre deja au premier plan la range — c'est
                  // le geste attendu d'un dock. Sinon on la ramene devant, ce qui
                  // la restaure aussi si elle etait reduite (cf. focusApp).
                  if (actif) minimizeApp(win.id);
                  else focusApp(win.id);
                }}
                title={win.isMinimized ? `${win.title} — réduite, cliquer pour rouvrir` : win.title}
                aria-label={win.title}
                className={`flex h-12 w-12 items-center justify-center rounded-[15px] border transition-all hover:scale-110 active:scale-95 ${
                  win.isMinimized ? 'opacity-55' : ''
                }`}
                style={{
                  background: `linear-gradient(160deg, #ffffff, ${accent}22)`,
                  borderColor: actif ? accent : 'rgba(255,255,255,0.6)',
                  boxShadow: actif ? `0 0 0 2px ${accent}55` : '0 6px 16px -6px rgba(41,37,36,0.4)',
                }}
              >
                {Icon ? <Icon className="h-6 w-6" style={{ color: accent }} /> : null}
              </button>

              {/* Fermer — apparait au survol. Sans lui, le dock permettrait
                  d'ouvrir et de reduire, mais jamais de fermer. */}
              <button
                onClick={(e) => { e.stopPropagation(); closeApp(win.id); }}
                title={`Fermer ${win.title}`}
                aria-label={`Fermer ${win.title}`}
                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[var(--theme-text)] text-[var(--theme-on-accent)] shadow group-hover:flex hover:bg-[var(--theme-danger)]"
              >
                <X className="h-2.5 w-2.5" />
              </button>

              {/* Pastille d'etat : une fenetre ouverte se distingue d'une reduite. */}
              <span
                className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                style={{ background: win.isMinimized ? 'transparent' : accent }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
