/**
 * Booth panel configuration types for 3D mapper
 * 
 * Panel sizes are derived from real booth production specs:
 * - Inline: 10'×8' back wall (approx 3.05m × 2.44m)
 * - L-Shape: 10'×10' corner (two 10' walls)
 * - U-Shape: 10'×10' peninsula (back + two side walls)
 * - Island: 20'×20' freestanding (four panel faces)
 * 
 * Conversion: 1 foot = 0.3048 meters
 */

export type BoothLayout = 'inline' | 'l-shape' | 'u-shape' | 'island';

export interface PanelConfig {
  id: string;
  label: string;
  /** Position [x, y, z] in 3D space (meters) */
  position: [number, number, number];
  /** Rotation [x, y, z] in radians */
  rotation: [number, number, number];
  /** Size [width, height] in meters */
  size: [number, number];
  /** Physical dimensions label (feet) */
  specLabel?: string;
  /** Assigned image URL */
  imageUrl?: string;
}

export interface BoothConfig {
  layout: BoothLayout;
  panels: PanelConfig[];
  /** Physical dimensions label */
  dimensions: string;
  /** Total footprint in feet */
  footprint: string;
}

export type LightingPreset = 'expo-bright' | 'showcase-dim' | 'warm-gallery' | 'cool-neutral';

export interface PanelAssignment {
  panelId: string;
  imageUrl: string;
}

// Real production measurements in feet, converted to meters for 3D
const FT = 0.3048; // 1 foot in meters

// Standard booth panel heights
const STANDARD_HEIGHT_8FT = 8 * FT;  // 2.44m - standard inline back wall
const STANDARD_HEIGHT_10FT = 10 * FT; // 3.05m - tall panels
const STANDARD_HEIGHT_3FT = 3 * FT;   // 0.91m - counter/table height

/** Generate panel configurations for each layout using real production specs */
export function getBoothPanels(layout: BoothLayout): BoothConfig {
  switch (layout) {
    case 'inline': {
      // 10' × 8' Inline - Single back wall, standard 10' wide × 8' tall
      const backW = 10 * FT;
      const backH = STANDARD_HEIGHT_8FT;
      return {
        layout,
        dimensions: "10' × 8' Inline",
        footprint: "10' × 10' floor",
        panels: [
          {
            id: 'back',
            label: 'Back Wall',
            specLabel: "10' × 8'",
            position: [0, backH / 2, 0],
            rotation: [0, 0, 0],
            size: [backW, backH],
          },
        ],
      };
    }
    case 'l-shape': {
      // 10' × 10' L-Shape - Two walls meeting at corner
      const wallW = 10 * FT;
      const wallH = STANDARD_HEIGHT_8FT;
      return {
        layout,
        dimensions: "10' × 10' L-Shape",
        footprint: "10' × 10' floor",
        panels: [
          {
            id: 'back',
            label: 'Back Wall',
            specLabel: "10' × 8'",
            position: [0, wallH / 2, 0],
            rotation: [0, 0, 0],
            size: [wallW, wallH],
          },
          {
            id: 'left',
            label: 'Left Wall',
            specLabel: "10' × 8'",
            position: [-wallW / 2, wallH / 2, wallW / 2],
            rotation: [0, Math.PI / 2, 0],
            size: [wallW, wallH],
          },
        ],
      };
    }
    case 'u-shape': {
      // 10' × 10' U-Shape (Peninsula) - Back wall + two side returns
      const backW = 10 * FT;
      const sideW = 8 * FT;  // side returns are typically shorter
      const wallH = STANDARD_HEIGHT_8FT;
      return {
        layout,
        dimensions: "10' × 10' U-Shape",
        footprint: "10' × 10' floor",
        panels: [
          {
            id: 'back',
            label: 'Back Wall',
            specLabel: "10' × 8'",
            position: [0, wallH / 2, 0],
            rotation: [0, 0, 0],
            size: [backW, wallH],
          },
          {
            id: 'left',
            label: 'Left Return',
            specLabel: "8' × 8'",
            position: [-backW / 2, wallH / 2, sideW / 2],
            rotation: [0, Math.PI / 2, 0],
            size: [sideW, wallH],
          },
          {
            id: 'right',
            label: 'Right Return',
            specLabel: "8' × 8'",
            position: [backW / 2, wallH / 2, sideW / 2],
            rotation: [0, -Math.PI / 2, 0],
            size: [sideW, wallH],
          },
        ],
      };
    }
    case 'island': {
      // 20' × 20' Island - Four-sided freestanding
      const panelW = 16 * FT; // panels inset from edges for structure
      const wallH = STANDARD_HEIGHT_10FT; // taller for island
      const offset = 10 * FT; // half of 20' footprint
      return {
        layout,
        dimensions: "20' × 20' Island",
        footprint: "20' × 20' floor",
        panels: [
          {
            id: 'front',
            label: 'Front Panel',
            specLabel: "16' × 10'",
            position: [0, wallH / 2, offset],
            rotation: [0, Math.PI, 0],
            size: [panelW, wallH],
          },
          {
            id: 'back',
            label: 'Back Panel',
            specLabel: "16' × 10'",
            position: [0, wallH / 2, -offset],
            rotation: [0, 0, 0],
            size: [panelW, wallH],
          },
          {
            id: 'left',
            label: 'Left Panel',
            specLabel: "16' × 10'",
            position: [-offset, wallH / 2, 0],
            rotation: [0, Math.PI / 2, 0],
            size: [panelW, wallH],
          },
          {
            id: 'right',
            label: 'Right Panel',
            specLabel: "16' × 10'",
            position: [offset, wallH / 2, 0],
            rotation: [0, -Math.PI / 2, 0],
            size: [panelW, wallH],
          },
        ],
      };
    }
  }
}

export const LAYOUT_OPTIONS: { value: BoothLayout; label: string; desc: string }[] = [
  { value: 'inline', label: 'Inline', desc: "10'×8' single wall" },
  { value: 'l-shape', label: 'L-Shape', desc: "10'×10' corner" },
  { value: 'u-shape', label: 'U-Shape', desc: "10'×10' peninsula" },
  { value: 'island', label: 'Island', desc: "20'×20' freestanding" },
];

export const LIGHTING_PRESETS: { value: LightingPreset; label: string }[] = [
  { value: 'expo-bright', label: 'Expo Bright' },
  { value: 'showcase-dim', label: 'Showcase Dim' },
  { value: 'warm-gallery', label: 'Warm Gallery' },
  { value: 'cool-neutral', label: 'Cool Neutral' },
];
