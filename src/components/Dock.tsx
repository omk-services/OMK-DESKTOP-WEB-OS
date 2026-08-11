/** Dock — les apps OUVERTES, en bas de l'ecran ou sur le bord droit.
 *
 *  A ne pas confondre avec `DesktopIcons`, qui pose sur le fond d'ecran les
 *  icones de TOUTES les apps installees. Le dock ne montre que ce qui tourne :
 *  c'est le seul endroit d'ou l'on retrouve une fenetre reduite, qui autrement
 *  disparait sans laisser de trace.
 *
 *  Deux reglages, portes par `useDockStore` et persistes :
 *   - la POSITION : barre horizontale en bas, ou colonne verticale a droite,
 *     comme les moniteurs flottants qu'on epingle au bord d'un bureau ;
 *   - l'HABILLAGE : les vingt styles du catalogue UI UX Pro Max, declares dans
 *     `src/lib/dockSkins.ts`.
 *
 *  Le bouton de reglages vit DANS la barre, donc il apparait avec elle des la
 *  premiere app ouverte et reste tant qu'il en reste une. Le poser ailleurs
 *  l'aurait laisse visible sur un bureau vide, a regler une barre absente.
 */
import { useEffect, useRef, useState } from 'react';
import { useShellStore } from '../stores/shell.store';
import { useDockStore } from '../stores/dock.store';
import { DOCK_SKINS, dockSkinById } from '../lib/dockSkins';
import { getAllApps } from '../lib/app-registry';
import { X, Settings2, PanelBottom, PanelRight, Check } from 'lucide-react';

/** Encombrement du dock horizontal, marge comprise.
 *
 *  50 et non 92 : la barre a ete reduite de moitie a la demande. Les pastilles
 *  passent de 48 a 28 px et les icones de 24 a 16 — assez pour rester
 *  cliquables a la souris, sans manger le bas du bureau.
 *
 *  Le chiffre est MESURE, pas estime : 28 px de pastille + 12 px de marge
 *  interieure (`py-1.5`) + 2 px de bordure = 42 px de barre, plus 8 px de
 *  `mb-2`. Il valait 46 — quatre pixels de moins que la realite, que
 *  `DesktopIcons` reservait donc en trop peu.
 *
 *  `DesktopIcons` l'importe pour s'arreter au-dessus de la barre. En position
 *  droite, cette reserve du bas n'a plus lieu d'etre : voir `LARGEUR_DOCK`. */
export const HAUTEUR_DOCK = 50;

/** Encombrement du dock vertical, marge comprise. */
export const LARGEUR_DOCK = 50;

const TAILLE_PASTILLE = 28;
const TAILLE_ICONE = 16;

export function Dock(): import('react').ReactNode {
  // `windows` est une reference stable du magasin : on filtre DANS le composant,
  // jamais dans le selecteur. Un selecteur qui construit un tableau neuf a chaque
  // appel fait boucler React (cf. CLAUDE.md, piege de l'instantane).
  const windows = useShellStore(s => s.windows);
  const activeWindowId = useShellStore(s => s.activeWindowId);
  const focusApp = useShellStore(s => s.focusApp);
  const minimizeApp = useShellStore(s => s.minimizeApp);
  const closeApp = useShellStore(s => s.closeApp);

  const position = useDockStore(s => s.position);
  const skinId = useDockStore(s => s.skinId);
  const setPosition = useDockStore(s => s.setPosition);
  const setSkin = useDockStore(s => s.setSkin);

  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const panneauRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic exterieur et a Echap — meme geste que les menus de la
  // barre du haut, pour que le bureau reponde partout de la meme facon.
  useEffect(() => {
    if (!reglagesOuverts) return;
    const surClic = (e: MouseEvent): void => {
      if (panneauRef.current && !panneauRef.current.contains(e.target as Node)) {
        setReglagesOuverts(false);
      }
    };
    const surTouche = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setReglagesOuverts(false);
    };
    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surTouche);
    };
  }, [reglagesOuverts]);

  const ouvertes = windows.filter(w => w.isOpen);
  if (ouvertes.length === 0) return null;

  const registre = getAllApps();
  const skin = dockSkinById(skinId);
  const vertical = position === 'right';

  return (
    <div
      data-dock
      data-dock-position={position}
      className={
        vertical
          ? 'fixed inset-y-0 right-0 z-30 flex items-center justify-end pointer-events-none'
          : 'fixed inset-x-0 bottom-0 z-30 flex items-end justify-center pointer-events-none'
      }
      style={vertical ? { width: LARGEUR_DOCK } : { height: HAUTEUR_DOCK }}
    >
      {/* La barre elle-meme ne coupe RIEN : `overflow` est confine au defileur
          des pastilles, juste en dessous. Le porter ici clippait le panneau de
          reglages qui se deploie au-dessus — a l'ecran, le panneau paraissait
          « fondre » dans la barre au lieu de s'ouvrir. */}
      <div
        className={`pointer-events-auto flex border ${
          vertical
            ? 'mr-2 max-h-[86vh] flex-col items-center gap-1.5 px-1.5 py-2'
            : 'mb-2 max-w-[92vw] items-end gap-1.5 px-2 py-1.5'
        }`}
        style={{
          background: skin.background,
          borderColor: skin.border,
          boxShadow: skin.shadow,
          borderRadius: skin.radius,
          backdropFilter: skin.backdrop || undefined,
        }}
      >
      {/* Defileur des pastilles.
       *
       *  `overflow-x-auto` + `overflow-y-visible` etait une paire ILLEGALE : le
       *  CSS force l'axe `visible` a `auto` des que l'autre ne l'est pas. Les
       *  decorations posees HORS de la pastille — bouton de fermeture en
       *  `-top-1 -right-1`, pastille d'etat en `-bottom-1` — devenaient donc du
       *  debordement defilable au lieu de deborder librement.
       *
       *  Mesure faite sur la production : survoler la DERNIERE pastille revelait
       *  son bouton de fermeture, `scrollWidth` gagnait 4 px, une barre de
       *  defilement horizontale apparaissait et prenait 15 px de hauteur — la
       *  barre passait de 42 a 57 px. Le dock etant ancre en bas, il grandissait
       *  VERS LE HAUT : la pastille fuyait sous le curseur, qui la perdait, ce
       *  qui refermait le bouton, ce qui ramenait la pastille. D'ou le
       *  tremblement, plusieurs fois par seconde.
       *
       *  Deux verrous. Une marge interieure qui LOGE les decorations (4 px de
       *  debord, plus 1,4 px pris par `hover:scale-110` : 6 px suffisent), rendue
       *  invisible par la marge negative qui la compense — rien ne bouge a
       *  l'ecran. Et `no-scrollbar`, pour qu'un debordement legitime, quand
       *  beaucoup d'apps sont ouvertes, ne reprenne jamais de place dans la mise
       *  en page. Les deux axes sont desormais declares explicitement : plus de
       *  paire illegale, donc plus de valeur calculee en douce. */}
      <div
        className={`no-scrollbar -m-1.5 flex min-w-0 p-1.5 ${
          vertical
            ? 'max-h-[70vh] flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden'
            : 'max-w-[78vw] items-end gap-1.5 overflow-x-auto overflow-y-hidden'
        }`}
      >
        {ouvertes.map(win => {
          const app = registre.find(a => a.id === win.id);
          const Icon = app?.icon;
          const accent = app?.accent ?? 'var(--theme-accent)';
          const actif = activeWindowId === win.id && !win.isMinimized;

          return (
            <div key={win.id} className="group relative shrink-0">
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
                className={`flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${
                  win.isMinimized ? 'opacity-55' : ''
                }`}
                style={{
                  width: TAILLE_PASTILLE,
                  height: TAILLE_PASTILLE,
                  borderRadius: skin.tileRadius,
                  background: `linear-gradient(160deg, #ffffff, ${accent}22)`,
                  borderColor: actif ? accent : 'rgba(255,255,255,0.6)',
                  boxShadow: actif ? `0 0 0 2px ${accent}55` : '0 4px 10px -6px rgba(41,37,36,0.4)',
                }}
              >
                {Icon ? <Icon style={{ width: TAILLE_ICONE, height: TAILLE_ICONE, color: accent }} /> : null}
              </button>

              {/* Fermer — apparait au survol. Sans lui, le dock permettrait
                  d'ouvrir et de reduire, mais jamais de fermer. */}
              <button
                onClick={(e) => { e.stopPropagation(); closeApp(win.id); }}
                title={`Fermer ${win.title}`}
                aria-label={`Fermer ${win.title}`}
                className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--theme-text)] text-[var(--theme-on-accent)] shadow group-hover:flex hover:bg-[var(--theme-danger)]"
              >
                <X className="h-2 w-2" />
              </button>

              {/* Pastille d'etat : une fenetre ouverte se distingue d'une reduite. */}
              <span
                className={`absolute h-1 w-1 rounded-full ${
                  vertical ? '-left-1 top-1/2 -translate-y-1/2' : '-bottom-1 left-1/2 -translate-x-1/2'
                }`}
                style={{ background: win.isMinimized ? 'transparent' : accent }}
              />
            </div>
          );
        })}
      </div>

        {/* Separateur puis reglages — toujours en queue de barre, HORS du
            defileur pour que le panneau puisse deborder de la barre. */}
        <span
          className="shrink-0 rounded-full"
          style={{
            background: skin.dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)',
            width: vertical ? 18 : 1,
            height: vertical ? 1 : 18,
            margin: vertical ? '2px 0' : '0 2px',
          }}
        />

        <div className="relative shrink-0" ref={panneauRef}>
          <button
            onClick={() => setReglagesOuverts(v => !v)}
            title="Réglages du dock — position et habillage"
            aria-label="Réglages du dock"
            aria-expanded={reglagesOuverts}
            data-dock-settings
            className="flex items-center justify-center border transition-all hover:scale-110 active:scale-95"
            style={{
              width: TAILLE_PASTILLE,
              height: TAILLE_PASTILLE,
              borderRadius: skin.tileRadius,
              background: skin.dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)',
              borderColor: skin.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)',
              color: skin.dark ? '#ffffff' : 'var(--theme-text)',
            }}
          >
            <Settings2 style={{ width: TAILLE_ICONE, height: TAILLE_ICONE }} />
          </button>

          {reglagesOuverts && (
            <div
              className={`absolute z-40 w-60 rounded-xl border p-3 shadow-2xl ${
                vertical ? 'right-full top-0 mr-2' : 'bottom-full right-0 mb-2'
              }`}
              style={{
                background: 'var(--theme-surface)',
                borderColor: 'var(--panel-border)',
                boxShadow: '0 18px 44px -18px rgba(0,0,0,0.6)',
              }}
            >
              <div
                className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                Position
              </div>
              <div className="mb-3 grid grid-cols-2 gap-1.5">
                {([
                  { id: 'bottom' as const, label: 'Bas', Icone: PanelBottom },
                  { id: 'right' as const, label: 'Droite', Icone: PanelRight },
                ]).map(({ id, label, Icone }) => {
                  const on = position === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setPosition(id)}
                      data-dock-position-choice={id}
                      className="flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors"
                      style={{
                        background: on ? 'var(--theme-surface-hover)' : 'transparent',
                        borderColor: on ? 'var(--theme-accent)' : 'var(--panel-border)',
                        color: 'var(--theme-text)',
                      }}
                    >
                      <Icone className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div
                className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--theme-text-dim)' }}
              >
                Habillage · {DOCK_SKINS.length} styles
              </div>
              <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto custom-scrollbar">
                {DOCK_SKINS.map((s) => {
                  const on = s.id === skinId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSkin(s.id)}
                      data-dock-skin={s.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition-colors hover:bg-[var(--theme-surface-hover)]"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {/* Vignette : l'habillage réel, en miniature. */}
                      <span
                        className="h-4 w-6 shrink-0 border"
                        style={{
                          background: s.background,
                          borderColor: s.border,
                          borderRadius: Math.min(6, s.radius),
                        }}
                      />
                      <span className="flex-1 truncate">{s.label}</span>
                      {on ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--theme-accent)' }} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
