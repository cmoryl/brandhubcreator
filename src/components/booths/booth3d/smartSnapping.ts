/**
 * SmartSnapping - Alignment guide helpers for precision placement
 * Provides snap-to-grid, snap-to-wall, and alignment calculations
 */

export interface SnapConfig {
  gridSize: number; // meters
  snapToGrid: boolean;
  snapToWalls: boolean;
  snapToCenter: boolean;
  snapToObjects: boolean;
  showGuides: boolean;
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  gridSize: 0.1, // 10cm grid
  snapToGrid: true,
  snapToWalls: true,
  snapToCenter: true,
  snapToObjects: true,
  showGuides: true,
};

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical' | 'center';
  position: number; // world coordinate
  label?: string;
}

/**
 * Snap a position to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position to nearby objects or walls
 * Returns the snapped position and any alignment guides to display
 */
export function calculateSnap(
  position: [number, number, number],
  config: SnapConfig,
  wallPositions: number[] = [],
  objectPositions: [number, number, number][] = [],
): { snapped: [number, number, number]; guides: AlignmentGuide[] } {
  let [x, y, z] = position;
  const guides: AlignmentGuide[] = [];
  const threshold = config.gridSize * 2; // snap threshold

  if (config.snapToGrid) {
    x = snapToGrid(x, config.gridSize);
    z = snapToGrid(z, config.gridSize);
  }

  if (config.snapToCenter) {
    // Snap to center lines
    if (Math.abs(x) < threshold) {
      x = 0;
      guides.push({ type: 'vertical', position: 0, label: 'Center X' });
    }
    if (Math.abs(z) < threshold) {
      z = 0;
      guides.push({ type: 'horizontal', position: 0, label: 'Center Z' });
    }
  }

  if (config.snapToWalls) {
    for (const wall of wallPositions) {
      if (Math.abs(x - wall) < threshold) {
        x = wall;
        guides.push({ type: 'vertical', position: wall, label: 'Wall' });
      }
      if (Math.abs(z - wall) < threshold) {
        z = wall;
        guides.push({ type: 'horizontal', position: wall, label: 'Wall' });
      }
    }
  }

  if (config.snapToObjects) {
    for (const obj of objectPositions) {
      if (Math.abs(x - obj[0]) < threshold) {
        x = obj[0];
        guides.push({ type: 'vertical', position: obj[0] });
      }
      if (Math.abs(z - obj[2]) < threshold) {
        z = obj[2];
        guides.push({ type: 'horizontal', position: obj[2] });
      }
    }
  }

  return { snapped: [x, y, z], guides };
}
