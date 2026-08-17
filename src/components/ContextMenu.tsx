// src/components/ContextMenu.tsx
// Menu contextuel du bureau — clic droit sur une icône d'app.
//
// Choix de design :
//   - menu HTML natif (`<button>` dans un `<div role="menu">`), pas de lib.
//   - positionné en `fixed` aux coordonnées du curseur, ajusté pour rester
//     dans le viewport (sinon le menu déborde en bas/droite et l'utilisateur
//     doit faire défiler pour cliquer le dernier item).
//   - fermeture sur clic hors menu, sur Escape, ou après une action.
//   - les actions sont déclaratives : un tableau `{ id, label, action }`.
//     `Desktop.tsx` passe ce tableau, chaque entrée dispatche vers le bon
//     store. Le menu ne connaît pas les stores.
//
// Ce que ce composant NE FAIT PAS :
//   - il ne capture pas le `contextmenu` du navigateur (c'est DesktopIcon
//     qui appelle `onContextMenu`).
//   - il ne sait pas ce que fait l'action ; il appelle un callback et se
//     ferme. Tester une action, c'est tester le caller, pas ce menu.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  /** Identifiant unique, pour les tests. */
  id: string;
  /** Libellé affiché. */
  label: string;
  /** Action à exécuter. Le menu se ferme après, sauf si l'action lance
   *  une navigation. Ici on choisit toujours de fermer. */
  action: () => void;
  /** Si true, l'item est affiché mais non cliquable (ex. "Close" sur une
   *  app qui n'est pas ouverte). */
  disabled?: boolean;
  /** Séparateur visuel après cet item. */
  separatorAfter?: boolean;
}

interface ContextMenuProps {
  /** Coordonnées écran du clic droit. */
  x: number;
  y: number;
  /** Items à afficher, dans l'ordre. */
  items: ContextMenuItem[];
  /** Appelé quand le menu se ferme (Escape, clic hors, ou après une action). */
  onClose: () => void;
}

/** Hauteur approximative d'un item + séparateurs — estimation haute
 *  pour le clamp quand le menu n'a pas encore mesuré sa hauteur réelle. */
const HAUTEUR_PAR_ITEM = 32;

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps): import('react').ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  // Position corrigée : si le menu déborde du viewport, on le déplace pour
  // rester visible. Calculé après le premier render (le menu doit exister
  // pour mesurer sa taille).
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Estimation grossière si le menu n'a pas encore de hauteur (premier
    // render) : on suppose `items.length * HAUTEUR_PAR_ITEM`.
    const hauteurEstimee = rect.height || items.length * HAUTEUR_PAR_ITEM;
    setPos({
      left: Math.min(x, Math.max(8, vw - rect.width - 8)),
      top: Math.min(y, Math.max(8, vh - hauteurEstimee - 8)),
    });
  }, [x, y, items.length]);

  // Fermeture sur Escape. `keydown` est sur document pour capter Escape
  // même si le focus est ailleurs. Un menu contextuel ouvert prend le
  // focus clavier implicitement — le `tabIndex={-1}` n'est pas nécessaire
  // ici, on n'attend pas de navigation clavier dans le menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fermeture sur clic hors menu. `mousedown` plutôt que `click` pour
  // capturer aussi les drags qui se terminent hors menu.
  useEffect(() => {
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  // Bloque le menu contextuel du navigateur SI un futur re-render le
  // redéclenche. Sans ça, le menu OS apparaîtrait sous le nôtre.
  useEffect(() => {
    const onContext = (e: MouseEvent): void => e.preventDefault();
    document.addEventListener('contextmenu', onContext);
    return () => document.removeEventListener('contextmenu', onContext);
  }, []);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Context menu"
      // Le clic gauche sur le menu NE ferme PAS le menu contextuel du
      // navigateur (déjà intercepté). Le clic DROIT non plus, parce que
      // on veut qu'un deuxième clic droit ailleurs ferme l'ancien menu
      // et en ouvre un nouveau — pas qu'il empile.
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 min-w-[200px] max-w-[280px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]/95 backdrop-blur-md shadow-2xl py-1 text-[12.5px] text-[var(--theme-text)]"
      style={{ left: pos.left, top: pos.top }}
    >
      {items.map((item) => (
        <ContextMenuRow
          key={item.id}
          item={item}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

interface ContextMenuRowProps {
  item: ContextMenuItem;
  onClose: () => void;
}

function ContextMenuRow({ item, onClose }: ContextMenuRowProps): import('react').ReactNode {
  const handle = (): void => {
    if (item.disabled) return;
    item.action();
    onClose();
  };
  return (
    <>
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={handle}
        className={`w-full text-left px-3 py-1.5 transition-colors ${
          item.disabled
            ? 'text-[var(--theme-text-dim)] cursor-not-allowed'
            : 'hover:bg-[var(--theme-surface-hover)] focus:bg-[var(--theme-surface-hover)] focus:outline-none'
        }`}
      >
        {item.label}
      </button>
      {item.separatorAfter && (
        <div
          role="separator"
          aria-orientation="horizontal"
          className="my-1 h-px bg-[var(--theme-border)]"
        />
      )}
    </>
  );
}
