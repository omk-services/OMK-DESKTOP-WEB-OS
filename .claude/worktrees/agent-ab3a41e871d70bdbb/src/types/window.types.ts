/** Window Manager types — shared contracts for drag/resize/snap (forked from Life OS canon) */

export interface WindowPosition { x: number; y: number }
export interface WindowSize { width: number; height: number }

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | '';
export type SnapZone = 'left' | 'right' | null;

export interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
}

export const WINDOW_CONSTRAINTS = {
  MIN_WIDTH: 420,
  MIN_HEIGHT: 320,
  TOPBAR_HEIGHT: 40,
  DOCK_HEIGHT: 100,
  VISIBLE_MIN: 80,
  SNAP_THRESHOLD: 20,
} as const;
