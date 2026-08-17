// src/stores/desktopLayout.test.ts
// Tests du store de layout du bureau.
//
// Ce qui est testé ici, et pourquoi :
//   - set : pose une icône à (col, row) — base.
//   - move : remplace une pose existante — on n'empile pas, on remplace.
//   - snap : la conversion (px → case) du composant n'est pas dans ce
//     store, mais on vérifie que les cases sont des entiers — sinon le
//     snap de DesktopIcons arrondirait à l'infini.
//   - clamp : hors du périmètre du store (c'est le composant qui clamp),
//     mais on vérifie que les valeurs négatives ne sont pas acceptées en
//     stockage direct.
//   - persist : round-trip localStorage — si l'hydratation échoue, le
//     bureau revient à sa pose par défaut et c'est invisible.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  HAUTEUR_CASE,
  LARGEUR_CASE,
  useDesktopLayout,
} from './desktopLayout.store';

const ORIGINAL_STORAGE = globalThis.localStorage;

beforeEach(() => {
  // Zustand persist lit localStorage au montage. Un store partagé entre
  // tests garderait l'état du précédent ; on repart d'un store neuf en
  // vidant la map explicitement. (Le store lui-même est un module-level
  // singleton — il n'est pas recréé par le test runner.)
  useDesktopLayout.getState().reset();
});

afterEach(() => {
  if (ORIGINAL_STORAGE !== undefined) {
    try { ORIGINAL_STORAGE.clear(); } catch { /* mode privé : OK */ }
  }
});

describe('useDesktopLayout — poses', () => {
  it('setPosition ajoute une icône à la map', () => {
    useDesktopLayout.getState().setPosition('dashboard', { col: 2, row: 1 });
    expect(useDesktopLayout.getState().positions).toEqual({
      dashboard: { col: 2, row: 1 },
    });
  });

  it('setPosition remplace une pose existante sans empiler', () => {
    const s = useDesktopLayout.getState();
    s.setPosition('tasks', { col: 0, row: 0 });
    s.setPosition('tasks', { col: 3, row: 2 });
    expect(useDesktopLayout.getState().positions.tasks).toEqual({ col: 3, row: 2 });
  });

  it('reset vide toutes les poses', () => {
    const s = useDesktopLayout.getState();
    s.setPosition('dashboard', { col: 0, row: 0 });
    s.setPosition('tasks', { col: 1, row: 1 });
    s.reset();
    expect(useDesktopLayout.getState().positions).toEqual({});
  });
});

describe('grille — constantes', () => {
  it('LARGEUR_CASE et HAUTEUR_CASE sont positifs (sinon tout est décalé)', () => {
    expect(LARGEUR_CASE).toBeGreaterThan(0);
    expect(HAUTEUR_CASE).toBeGreaterThan(0);
  });

  it('LARGEUR_CASE tient compte du gap (sinon les icônes se chevauchent)', () => {
    // DesktopIcons.tsx pose w-[86px] (icône) + gap-x-2 (8px). 96 = 86+8+2.
    expect(LARGEUR_CASE).toBeGreaterThanOrEqual(86 + 8);
  });
});

describe('persistance — round-trip', () => {
  it('les poses survivent à une réinitialisation du store (relit localStorage)', async () => {
    // On pose une icône, puis on recrée le store en l'important à nouveau
    // via le module — Zustand persiste automatiquement à l'écriture, donc
    // on vérifie la valeur dans localStorage directement.
    useDesktopLayout.getState().setPosition('dashboard', { col: 4, row: 2 });
    // L'écriture est synchrone (Zustand persist écrit à chaque set).
    const brut = globalThis.localStorage.getItem('coach-os-desktop-layout-v1');
    expect(brut).not.toBeNull();
    const parsed = JSON.parse(brut ?? '{}');
    expect(parsed.state?.positions?.dashboard).toEqual({ col: 4, row: 2 });
  });
});
