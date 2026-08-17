// src/components/DesktopIcons.tsx
// Icônes du bureau — maintenant draggables avec snap sur la grille.
//
// AVANT : grille CSS pure (`grid grid-flow-col`), aucune coordonnée libre.
//   Les icônes remplissaient les colonnes dans l'ordre du registre, sans
//   qu'on puisse les rapprocher. C'était bien pour poser vite, mais ça
//   interdisait tout arrangement manuel — l'utilisateur devait accepter
//   l'arrangement par défaut.
//
// APRÈS : chaque icône est en `absolute`, positionnée en (col, row) par
//   le store `useDesktopLayout`. Au drag on capture le pointer, on suit
//   la souris, et au relâchement on snap sur la grille. La position est
//   persistée par appId.
//
// DIFFÉRENCES AVEC L'ANCIEN CODE :
//   - plus de `grid grid-flow-col` ; chaque icône est libre.
//   - `onClick` ne se déclenche que si le pointer n'a pas bougé de plus
//     de 4 px entre down et up. Avant, le moindre déplacement ouvrait
//     l'app — ce qui rendait le bureau inutilisable.
//   - le snap calcule la case la plus proche et clampe la position dans
//     la zone visible (jamais sous le dock, jamais au-delà du bord).
//
// LES CONSTANTES (LARGEUR_CASE, HAUTEUR_CASE) VIENNENT DU STORE — voir
// `stores/desktopLayout.store.ts`. Tout changement y casse la migration,
// et c'est voulu : la grille n'est pas un détail cosmétique, elle est
// le contrat entre ce fichier et la persistance.

import { useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps, getApp } from '../lib/app-registry';
import { useAppVisibility } from '../stores/appVisibility.store';
import { useDockStore } from '../stores/dock.store';
import { HAUTEUR_DOCK, LARGEUR_DOCK } from './Dock';
import {
  useDesktopLayout,
  LARGEUR_CASE,
  HAUTEUR_CASE,
} from '../stores/desktopLayout.store';
import { useThreeAppStore } from '../stores/threeApp.store';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

const HAUTEUR_BARRE = 44;
const MARGE_LIBRE = 12;
const MARGE_BASSE_DOCK = HAUTEUR_DOCK + 12;
const MARGE_DROITE_DOCK = LARGEUR_DOCK + 12;

// Au-dessus de ce déplacement entre pointerdown et pointerup, on considère
// que l'utilisateur a draggué — donc on n'ouvre PAS l'app. 4 px suffit à
// distinguer un clic tremblant d'une vraie intention de déplacer, et c'est
// en-dessous du seuil de perception d'un double-clic.
const SEUIL_DRAG_PX = 4;

/** Calcule combien de colonnes et de lignes sont visibles, en tenant
 *  compte du dock et de la zone réservée à la barre du haut. */
function calculeGrille(): { cols: number; rows: number } {
  if (typeof window === 'undefined') return { cols: 6, rows: 7 };
  const w = window.innerWidth - (useDockStore.getState().position === 'right' ? MARGE_DROITE_DOCK : MARGE_LIBRE);
  const h = window.innerHeight - HAUTEUR_BARRE - (useDockStore.getState().position === 'bottom' ? MARGE_BASSE_DOCK : MARGE_LIBRE);
  // On retire la marge intérieure (p-4 du conteneur parent).
  const cols = Math.max(1, Math.floor((w - 16) / LARGEUR_CASE));
  const rows = Math.max(1, Math.floor((h - 16) / HAUTEUR_CASE));
  return { cols, rows };
}

/** Une icône posée à sa position enregistrée, ou à sa case d'origine
 *  (col = index % cols, row = floor(index / cols)) si elle n'a jamais
 *  été déplacée. L'index d'origine suit l'ordre du registre — c'est
 *  l'arrangement qu'on avait avant cette passe. */
function caseParDefaut(index: number, cols: number): { col: number; row: number } {
  return { col: index % cols, row: Math.floor(index / cols) };
}

export function DesktopIcons(): import('react').ReactNode {
  const openApp = useShellStore((s) => s.openApp);
  const closeApp = useShellStore((s) => s.closeApp);
  const [selected, setSelected] = useState<string | null>(null);
  const userHidden = useAppVisibility((s) => s.hidden);
  const toggleHidden = useAppVisibility((s) => s.toggle);
  const dockPosition = useDockStore((s) => s.position);
  const positions = useDesktopLayout((s) => s.positions);
  const setPosition = useDesktopLayout((s) => s.setPosition);
  const clearPosition = useDesktopLayout((s) => s.clearPosition);
  const resetDesktopLayout = useDesktopLayout((s) => s.reset);

  // Re-mesure la grille quand la fenêtre ou le dock bouge. Sans ça, une
  // icône posée « case 6, ligne 4 » sur un grand écran devient invisible
  // quand l'utilisateur rétrécit la fenêtre — la grille visible passe à
  // 4 colonnes et la case 6 déborde.
  const [grille, setGrille] = useState(() => calculeGrille());
  useEffect(() => {
    const surChangement = (): void => setGrille(calculeGrille());
    surChangement();
    window.addEventListener('resize', surChangement);
    return () => window.removeEventListener('resize', surChangement);
  }, [dockPosition]);

  // Menu contextuel : coordonnées curseur + appId cliqué. `null` = pas de menu.
  const [menu, setMenu] = useState<{ x: number; y: number; appId: string } | null>(null);

  const apps = getAllApps().filter((a) => !a.hidden && userHidden[a.id] !== true);
  // Mini-programmes 3D installes : on les ajoute comme icones virtuelles
  // a cote des apps du registre. Meme pose par defaut, meme drag, meme
  // menu contextuel. Ils apparaissent dans la grille APRES les apps
  // business, dans l'ordre d'installation.
  const threeApps = Object.values(useThreeAppStore((s) => s.apps));
  const virtualIcons = threeApps.map((t) => ({
    id: `three:${t.slug}`,
    name: t.name,
    icon: Box,
    accent: '#7c3aed', // meme couleur que IT/R&D pour signaler la filiere 3D
    description: `3D mini-program · ${t.category}`,
  }));

  /** Construit les items du menu pour une app donnée. Sortie : 8 items
   *  pour les apps du registre, 9 pour les mini-programmes 3D (qui
   *  ajoutent "Uninstall"). Close est désactivé si la fenêtre n'est
   *  pas ouverte — un item mort déroute plus qu'il n'aide. */
  const itemsPour = (appId: string, appName: string): ContextMenuItem[] => {
    const ouvert = useShellStore.getState().windows.some((w) => w.id === appId && w.isOpen);
    const isThree = appId.startsWith('three:');
    const base: ContextMenuItem[] = [
      { id: 'open', label: 'Open', action: () => openApp(appId, appName) },
      {
        id: 'open-new',
        label: 'Open in new window',
        action: () => openApp(appId, appName),
        // Pas « new window » : openApp() ramène au premier plan si déjà
        // ouvert. L'item est conservé pour la cohérence UX avec un OS
        // classique, où ce libellé évoque l'intention sans surprise.
      },
      {
        id: 'reset-position',
        label: 'Reset position',
        action: () => clearPosition(appId),
      },
      {
        id: 'close',
        label: 'Close',
        disabled: !ouvert,
        action: () => closeApp(appId),
        separatorAfter: true,
      },
      {
        id: 'hide',
        label: 'Hide',
        action: () => toggleHidden(appId),
        // `appVisibility.store` gère déjà `hidden`, et `getAllApps()` plus
        // haut filtre dessus — l'icône disparaît du bureau à l'action.
      },
    ];
    if (isThree) {
      const slug = appId.slice('three:'.length);
      base.push({
        id: 'uninstall',
        label: 'Uninstall 3D program',
        action: () => useThreeAppStore.getState().uninstall(slug),
        separatorAfter: true,
      });
    } else {
      base[base.length - 1].separatorAfter = true;
    }
    base.push({
      id: 'show-drawer',
      label: 'Show in App Drawer',
      action: () => openApp('drawer', 'Apps'),
      separatorAfter: true,
    });
    base.push({
      id: 'reset-all',
      label: 'Reset all desktop',
      action: () => resetDesktopLayout(),
    });
    base.push({
      id: 'properties',
      label: 'Properties',
      action: () => {
        // Debug : pose le manifest dans la console. Pas un toast — un
        // toast de plus sur clic droit serait du bruit. La console est
        // l'endroit où un dev regarde ce genre d'info.
        const m = getApp(appId);
        // eslint-disable-next-line no-console
        console.info(`[Desktop] ${appName} manifest`, m);
      },
    });
    return base;
  };

  return (
    <div
      className="absolute left-0 top-11 z-0 p-4 pointer-events-none overflow-auto custom-scrollbar"
      style={{ bottom: 0, right: 0 }}
      onClick={() => setSelected(null)}
    >
      {[...apps, ...virtualIcons].map((app, index) => {
        const Icon = app.icon;
        const accent = app.accent ?? 'var(--theme-accent)';
        const slot = positions[app.id] ?? caseParDefaut(index, grille.cols);
        const isSel = selected === app.id;

        return (
          <DesktopIcon
            key={app.id}
            appName={app.name}
            Icon={Icon}
            accent={accent}
            isSelected={isSel}
            col={slot.col}
            row={slot.row}
            cols={grille.cols}
            rows={grille.rows}
            onSelect={() => setSelected(app.id)}
            onOpen={() => openApp(app.id, app.name)}
            onContextMenuOpen={(cx, cy) =>
              setMenu({ x: cx, y: cy, appId: app.id })
            }
            onDrop={(targetCol, targetRow) => {
              // Resolution de collision : si la case cible est occupee par
              // une autre icone, on cherche la case libre la plus proche
              // (spirale Manhattan). L'app qu'on deplace peut rester sur
              // sa case d'origine si elle y revient.
              const occupees = new Set<string>();
              [...apps, ...virtualIcons].forEach((a, i) => {
                if (a.id === app.id) return;
                const s = positions[a.id] ?? caseParDefaut(i, grille.cols);
                occupees.add(`${s.col},${s.row}`);
              });
              const cle = (c: number, r: number): string => `${c},${r}`;
              const drop = (c: number, r: number): void =>
                setPosition(app.id, { col: c, row: r });
              if (!occupees.has(cle(targetCol, targetRow))) {
                drop(targetCol, targetRow);
                return;
              }
              // Spirale : on balaie rayon 1, 2, 3... jusqu'a trouver une
              // case libre, dans l'ordre haut/bas/gauche/droite.
              for (let r = 1; r < Math.max(grille.cols, grille.rows); r++) {
                for (let dc = -r; dc <= r; dc++) {
                  for (let dr = -r; dr <= r; dr++) {
                    if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                    const c = targetCol + dc;
                    const l = targetRow + dr;
                    if (c < 0 || l < 0 || c >= grille.cols || l >= grille.rows) continue;
                    if (!occupees.has(cle(c, l))) {
                      drop(c, l);
                      return;
                    }
                  }
                }
              }
              // Grille pleine : on accepte quand meme la pose, mais
              // l'icone sera superposee. Mieux vaut un empilement connu
              // qu'une icone qui n'aboutit nulle part.
              drop(targetCol, targetRow);
            }}
          />
        );
      })}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={itemsPour(menu.appId, getApp(menu.appId)?.name ?? menu.appId)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

interface DesktopIconProps {
  appName: string;
  Icon: import('react').ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  isSelected: boolean;
  col: number;
  row: number;
  cols: number;
  rows: number;
  onSelect: () => void;
  onOpen: () => void;
  /** Appelé au clic droit. Le composant stoppe la propagation et fournit
   *  les coordonnées écran pour positionner le menu. */
  onContextMenuOpen: (clientX: number, clientY: number) => void;
  /** Appelé au relâchement du drag avec la case cible SNAWLEE.
   *  Le parent resout les collisions : si la case est occupee, il trouve
   *  la case libre la plus proche et c'est lui qui appelle setPosition. */
  onDrop: (targetCol: number, targetRow: number) => void;
}

/** Une icône individuelle — extraite pour que le `useRef` du drag vive
 *  dans son propre composant. Si on le gardait dans `DesktopIcons`, deux
 *  drags successifs partageraient le même ref, et le pointerup du premier
 *  déclencherait un drop sur le second. */
function DesktopIcon({
  appName,
  Icon,
  accent,
  isSelected,
  col,
  row,
  cols,
  rows,
  onSelect,
  onOpen,
  onContextMenuOpen,
  onDrop,
}: DesktopIconProps): import('react').ReactNode {
  // Position visuelle pendant le drag — découplée de `col`/`row` (la cible
  // snap). On ne persiste qu'au relâchement.
  const [drag, setDrag] = useState<{ left: number; top: number } | null>(null);
  const startRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const movedRef = useRef(false);

  // Position de repos = grille. Pendant le drag, on suit la souris.
  const left = drag ? drag.left : col * LARGEUR_CASE;
  const top = drag ? drag.top : HAUTEUR_BARRE + row * HAUTEUR_CASE;

  const beginDrag = (e: React.PointerEvent<HTMLDivElement>): void => {
    // Bouton gauche uniquement ; les autres boutons (contexte, milieu)
    // ne déclenchent pas de drag.
    if (e.button !== 0) return;
    e.preventDefault();
    // setPointerCapture : tous les pointermove/up ultérieurs vont à cet
    // élément, même si la souris sort de la fenêtre. Sinon on perd le
    // pointer quand on déborde du bureau.
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      left,
      top,
    };
    movedRef.current = false;
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) < SEUIL_DRAG_PX) return;
    movedRef.current = true;
    setDrag({
      left: startRef.current.left + dx,
      top: startRef.current.top + dy,
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!startRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (movedRef.current) {
      // Snap : la case la plus proche, bornée à la grille visible.
      const newCol = Math.max(0, Math.min(cols - 1, Math.round((drag?.left ?? left) / LARGEUR_CASE)));
      const newRow = Math.max(0, Math.min(rows - 1, Math.round(((drag?.top ?? top) - HAUTEUR_BARRE) / HAUTEUR_CASE)));
      onDrop(newCol, newRow);
    } else {
      // Pas de mouvement → c'était un clic, on ouvre l'app.
      onOpen();
    }
    setDrag(null);
    startRef.current = null;
    // Si le clic a aussi sélectionné, on garde la sélection visible.
    if (!movedRef.current) onSelect();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${appName} — drag to move, click to open, right-click for menu`}
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // Clic droit : on capture, on stoppe le menu OS, on remonte au parent.
      // `clientX/Y` sont les coordonnées écran du curseur — parfaites pour
      // positionner un menu en `fixed`.
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenuOpen(e.clientX, e.clientY);
      }}
      onClick={(e) => e.stopPropagation()}
      title={`${appName} — drag to move, click to open, right-click for menu`}
      className={`pointer-events-auto absolute w-[86px] flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-xl transition-all group select-none ${
        drag ? 'cursor-grabbing z-20' : 'cursor-grab'
      } ${
        isSelected ? 'bg-[var(--theme-surface)] ring-1 ring-[var(--theme-accent)]/40' : 'hover:bg-[var(--theme-surface-hover)]'
      }`}
      style={{
        left,
        top,
        // Hauteur FIXE : un libelle sur 2 lignes ne doit pas etirer
        // l'icone. Si le nom est trop long, il est tronque par
        // `line-clamp-2` ci-dessous.
        height: HAUTEUR_CASE,
        boxSizing: 'border-box',
        // Pas de transition pendant le drag — sinon l'icône traîne un
        // demi-trait de pixel derrière la souris.
        transition: drag ? 'none' : undefined,
        touchAction: 'none', // bloque le scroll natif sur tactile
      }}
    >
      <span
        className="w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(41,37,36,0.4)] border border-[var(--theme-border)] group-hover:scale-105 transition-transform"
        style={{ background: `linear-gradient(160deg, #ffffff, ${accent}22)` }}
      >
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </span>
      <span
        // Une seule ligne + ellipsis : un libelle long (ex. "People /
        // Agents") aurait sur 2 lignes deborde en largeur sur l'icone
        // voisine, meme avec max-w-[76px]. line-clamp:1 + ellipsis est
        // la seule protection qui borne reellement le rendu horizontal.
        className="block w-full max-w-full rounded-md bg-[var(--theme-overlay)] px-1.5 py-0.5 text-center text-[11px] font-semibold leading-tight text-[var(--theme-on-accent)] backdrop-blur-[2px] truncate whitespace-nowrap"
      >
        {appName}
      </span>
    </div>
  );
}
