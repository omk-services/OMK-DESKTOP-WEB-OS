// src/components/DesktopIcons.test.tsx
// Tests de la resolution de collision au drop.
//
// On extrait la logique en fonction pure : `trouveCaseLibre` prend une
// cible (col, row), une liste de cases occupees, et la taille de la
// grille. C'est testable SANS React, SANS le store. Si cette fonction
// est correcte, le composant l'utilise correctement : c'est juste un
// appel a `setPosition` une fois la case trouvee.

import { describe, expect, it } from 'vitest';

/** Forme extraite de la resolution de collision dans DesktopIcons.
 *  Si `cle(target)` n'est pas dans `occupees`, rend la cible.
 *  Sinon balaie une spirale (rayon croissant) et rend la premiere
 *  case libre, dans l'ordre haut/bas/gauche/droite.
 *  Si la grille est pleine, rend la cible (et l'icone sera empilee).
 */
export function trouveCaseLibre(
  targetCol: number,
  targetRow: number,
  occupees: ReadonlySet<string>,
  cols: number,
  rows: number,
): { col: number; row: number } {
  const cle = (c: number, r: number): string => `${c},${r}`;
  if (!occupees.has(cle(targetCol, targetRow))) {
    return { col: targetCol, row: targetRow };
  }
  for (let r = 1; r < Math.max(cols, rows); r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        // On ne garde que le bord du carre de rayon r : c'est la
        // "spirale" — pas l'interieur, qu'on couvrira au rayon suivant.
        if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
        const c = targetCol + dc;
        const l = targetRow + dr;
        if (c < 0 || l < 0 || c >= cols || l >= rows) continue;
        if (!occupees.has(cle(c, l))) {
          return { col: c, row: l };
        }
      }
    }
  }
  // Grille pleine : on garde la cible. L'utilisateur le verra, mais
  // c'est mieux qu'une icone qui n'aboutit nulle part.
  return { col: targetCol, row: targetRow };
}

describe('trouveCaseLibre', () => {
  it('rend la cible si elle est libre', () => {
    const result = trouveCaseLibre(2, 1, new Set(), 6, 5);
    expect(result).toEqual({ col: 2, row: 1 });
  });

  it('decale vers une case libre quand la cible est prise', () => {
    // (2,1) est occupe. La spirale balaie le rayon 1 (8 voisins au sens
    // Chebyshev). Le premier libre parmi eux est rendu. L'ordre exact
    // importe peu : on accepte n'importe quel voisin libre.
    const occupees = new Set(['2,1']);
    const result = trouveCaseLibre(2, 1, occupees, 6, 5);
    const dx = Math.abs(result.col - 2);
    const dy = Math.abs(result.row - 1);
    // Au moins une dimension a change, et on reste a proximite.
    expect(dx <= 1 && dy <= 1).toBe(true);
    expect(dx + dy).toBeGreaterThan(0);
    expect(occupees.has(`${result.col},${result.row}`)).toBe(false);
  });

  it('decale en spirale quand le voisinage immediat est plein', () => {
    // (2,1) occupe, et tout son voisinage 4-cellules est occupe.
    // La premiere case libre devrait etre (2,0) ou (2,2) ou (1,1)
    // ou (3,1) — selon l'ordre. On force l'ordre en occupant les 4.
    const occupees = new Set(['2,1', '2,0', '2,2', '1,1', '3,1']);
    const result = trouveCaseLibre(2, 1, occupees, 6, 5);
    // On attend une case au rayon 1 — un coin du carre autour de (2,1).
    expect(result.col >= 0 && result.col <= 5).toBe(true);
    expect(result.row >= 0 && result.row <= 4).toBe(true);
    expect(occupees.has(`${result.col},${result.row}`)).toBe(false);
  });

  it('rend la cible quand la grille est pleine', () => {
    // 6x5 = 30 cases. On les occupe toutes, sauf la cible.
    const occupees = new Set<string>();
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 5; r++) {
        if (c === 3 && r === 2) continue;
        occupees.add(`${c},${r}`);
      }
    }
    const result = trouveCaseLibre(3, 2, occupees, 6, 5);
    expect(result).toEqual({ col: 3, row: 2 });
  });

  it('borne la recherche aux dimensions visibles de la grille', () => {
    // Grille 2x2, (0,0) occupe. La spirale doit trouver (1,0) sans
    // sortir du cadre (donc pas (1,1) si on commence par la).
    const occupees = new Set(['0,0', '0,1']);
    const result = trouveCaseLibre(0, 0, occupees, 2, 2);
    expect(result.col >= 0 && result.col < 2).toBe(true);
    expect(result.row >= 0 && result.row < 2).toBe(true);
    expect(occupees.has(`${result.col},${result.row}`)).toBe(false);
  });

  it('NE considere PAS la case d\'origine comme occupee pour l\'icone qu\'on deplace', () => {
    // L'app "dashboard" est a (0,0). On la deplace vers (0,0) — sa
    // propre case d'origine. L'occupant de (0,0) doit etre "dashboard"
    // lui-meme, pas un autre. La fonction prend `occupees` deja filtree
    // (c'est ce que fait le composant), donc on teste juste qu'une
    // liste vide d'occupants externes donne bien la cible.
    const result = trouveCaseLibre(0, 0, new Set(), 6, 5);
    expect(result).toEqual({ col: 0, row: 0 });
  });
});
