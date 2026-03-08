/**
 * Booth panel configuration types for 3D mapper
 * 
 * Industry-standard trade show booth sizes:
 * - Inline 10×8:   10'×8' back wall (standard pipe & drape)
 * - Inline 10×10:  10'×10' back wall (tall inline)
 * - Inline 10×20:  10'×20' double inline back wall
 * - Inline 10×30:  10'×30' triple inline
 * - L-Shape 10×10: Two 10' walls meeting at 90°
 * - L-Shape 10×20: Corner booth with 20' back + 10' side
 * - U-Shape 10×10: Peninsula — back + two side returns
 * - U-Shape 10×20: Wide peninsula — 20' back + two returns
 * - T-Shape 10×20: Back wall with centered perpendicular wing
 * - Peninsula 20×20: 20'×20' three-sided open front
 * - Island 20×20:  Four-sided freestanding
 * - Island 20×30:  Large island
 * - Island 30×30:  Major island exhibit
 * - Island 40×40:  Anchor / mega booth
 * 
 * Conversion: 1 foot = 0.3048 meters
 */

import type { PanelZones } from './specParser';

export type BoothLayout =
  | 'inline'
  | 'inline-10x10'
  | 'inline-10x20'
  | 'inline-10x30'
  | 'l-shape'
  | 'l-shape-10x20'
  | 'u-shape'
  | 'u-shape-10x20'
  | 't-shape-10x20'
  | 'peninsula-20x20'
  | 'island'
  | 'island-20x30'
  | 'island-30x30'
  | 'island-40x40';

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
  /** Assigned front image URL */
  imageUrl?: string;
  /** Assigned back image URL */
  backImageUrl?: string;
  /** Production spec zone data (visual/cut/bleed) for safe zone overlays */
  zones?: PanelZones;
}

export interface BoothConfig {
  layout: BoothLayout;
  panels: PanelConfig[];
  /** Physical dimensions label */
  dimensions: string;
  /** Total footprint in feet */
  footprint: string;
}

export type LightingPreset = 'expo-bright' | 'showcase-dim' | 'warm-gallery' | 'cool-neutral' | 'dark-hall' | 'stage-lighting';

export interface PanelAssignment {
  panelId: string;
  imageUrl: string;
}

// Real production measurements in feet, converted to meters for 3D
const FT = 0.3048; // 1 foot in meters

// Standard booth panel heights
const H8 = 8 * FT;   // 2.44m - standard inline back wall
const H10 = 10 * FT;  // 3.05m - tall panels
const H12 = 12 * FT;  // 3.66m - island headers

/** Helper: classify layout into a base family for traffic/people logic */
export function getLayoutFamily(layout: BoothLayout): 'inline' | 'l-shape' | 'u-shape' | 'island' {
  if (layout.startsWith('inline')) return 'inline';
  if (layout.startsWith('l-shape')) return 'l-shape';
  if (layout.startsWith('u-shape') || layout.startsWith('peninsula') || layout === 't-shape-10x20') return 'u-shape';
  if (layout.startsWith('island')) return 'island';
  // fallback for original 4
  if (layout === 'l-shape') return 'l-shape';
  if (layout === 'u-shape') return 'u-shape';
  if (layout === 'island') return 'island';
  return 'inline';
}

/** Generate panel configurations for each layout using real production specs */
export function getBoothPanels(layout: BoothLayout): BoothConfig {
  switch (layout) {
    // ── INLINE FAMILY ──────────────────────────────────────────
    case 'inline': {
      const backW = 10 * FT;
      return {
        layout, dimensions: "10' × 8' Inline", footprint: "10' × 10' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "10' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
        ],
      };
    }
    case 'inline-10x10': {
      const backW = 10 * FT;
      return {
        layout, dimensions: "10' × 10' Inline", footprint: "10' × 10' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "10' × 10'", position: [0, H10 / 2, 0], rotation: [0, 0, 0], size: [backW, H10] },
        ],
      };
    }
    case 'inline-10x20': {
      const backW = 20 * FT;
      return {
        layout, dimensions: "10' × 20' Inline", footprint: "10' × 20' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "20' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
        ],
      };
    }
    case 'inline-10x30': {
      const backW = 30 * FT;
      return {
        layout, dimensions: "10' × 30' Inline", footprint: "10' × 30' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "30' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
        ],
      };
    }

    // ── L-SHAPE FAMILY ─────────────────────────────────────────
    case 'l-shape': {
      const wallW = 10 * FT;
      return {
        layout, dimensions: "10' × 10' L-Shape", footprint: "10' × 10' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "10' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [wallW, H8] },
          { id: 'left', label: 'Left Wall', specLabel: "10' × 8'", position: [-wallW / 2, H8 / 2, wallW / 2], rotation: [0, Math.PI / 2, 0], size: [wallW, H8] },
        ],
      };
    }
    case 'l-shape-10x20': {
      const backW = 20 * FT;
      const sideW = 10 * FT;
      return {
        layout, dimensions: "10' × 20' L-Shape", footprint: "10' × 20' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "20' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
          { id: 'left', label: 'Left Wall', specLabel: "10' × 8'", position: [-backW / 2, H8 / 2, sideW / 2], rotation: [0, Math.PI / 2, 0], size: [sideW, H8] },
        ],
      };
    }

    // ── U-SHAPE / PENINSULA FAMILY ─────────────────────────────
    case 'u-shape': {
      const backW = 10 * FT;
      const sideW = 8 * FT;
      return {
        layout, dimensions: "10' × 10' U-Shape", footprint: "10' × 10' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "10' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
          { id: 'left', label: 'Left Return', specLabel: "8' × 8'", position: [-backW / 2, H8 / 2, sideW / 2], rotation: [0, Math.PI / 2, 0], size: [sideW, H8] },
          { id: 'right', label: 'Right Return', specLabel: "8' × 8'", position: [backW / 2, H8 / 2, sideW / 2], rotation: [0, -Math.PI / 2, 0], size: [sideW, H8] },
        ],
      };
    }
    case 'u-shape-10x20': {
      const backW = 20 * FT;
      const sideW = 10 * FT;
      return {
        layout, dimensions: "10' × 20' U-Shape", footprint: "10' × 20' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "20' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
          { id: 'left', label: 'Left Return', specLabel: "10' × 8'", position: [-backW / 2, H8 / 2, sideW / 2], rotation: [0, Math.PI / 2, 0], size: [sideW, H8] },
          { id: 'right', label: 'Right Return', specLabel: "10' × 8'", position: [backW / 2, H8 / 2, sideW / 2], rotation: [0, -Math.PI / 2, 0], size: [sideW, H8] },
        ],
      };
    }
    case 't-shape-10x20': {
      const backW = 20 * FT;
      const wingW = 10 * FT;
      return {
        layout, dimensions: "10' × 20' T-Shape", footprint: "10' × 20' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "20' × 8'", position: [0, H8 / 2, 0], rotation: [0, 0, 0], size: [backW, H8] },
          { id: 'center-wing', label: 'Center Wing', specLabel: "10' × 8'", position: [0, H8 / 2, wingW / 2], rotation: [0, Math.PI / 2, 0], size: [wingW, H8] },
        ],
      };
    }
    case 'peninsula-20x20': {
      const backW = 20 * FT;
      const sideW = 20 * FT;
      return {
        layout, dimensions: "20' × 20' Peninsula", footprint: "20' × 20' floor",
        panels: [
          { id: 'back', label: 'Back Wall', specLabel: "20' × 10'", position: [0, H10 / 2, 0], rotation: [0, 0, 0], size: [backW, H10] },
          { id: 'left', label: 'Left Wall', specLabel: "20' × 10'", position: [-backW / 2, H10 / 2, sideW / 2], rotation: [0, Math.PI / 2, 0], size: [sideW, H10] },
          { id: 'right', label: 'Right Wall', specLabel: "20' × 10'", position: [backW / 2, H10 / 2, sideW / 2], rotation: [0, -Math.PI / 2, 0], size: [sideW, H10] },
        ],
      };
    }

    // ── ISLAND FAMILY ──────────────────────────────────────────
    case 'island': {
      const panelW = 16 * FT;
      const offset = 10 * FT;
      return {
        layout, dimensions: "20' × 20' Island", footprint: "20' × 20' floor",
        panels: [
          { id: 'front', label: 'Front Panel', specLabel: "16' × 10'", position: [0, H10 / 2, offset], rotation: [0, Math.PI, 0], size: [panelW, H10] },
          { id: 'back', label: 'Back Panel', specLabel: "16' × 10'", position: [0, H10 / 2, -offset], rotation: [0, 0, 0], size: [panelW, H10] },
          { id: 'left', label: 'Left Panel', specLabel: "16' × 10'", position: [-offset, H10 / 2, 0], rotation: [0, Math.PI / 2, 0], size: [panelW, H10] },
          { id: 'right', label: 'Right Panel', specLabel: "16' × 10'", position: [offset, H10 / 2, 0], rotation: [0, -Math.PI / 2, 0], size: [panelW, H10] },
        ],
      };
    }
    case 'island-20x30': {
      const shortW = 16 * FT;
      const longW = 26 * FT;
      const offsetS = 10 * FT;
      const offsetL = 15 * FT;
      return {
        layout, dimensions: "20' × 30' Island", footprint: "20' × 30' floor",
        panels: [
          { id: 'front', label: 'Front Panel', specLabel: "26' × 10'", position: [0, H10 / 2, offsetS], rotation: [0, Math.PI, 0], size: [longW, H10] },
          { id: 'back', label: 'Back Panel', specLabel: "26' × 10'", position: [0, H10 / 2, -offsetS], rotation: [0, 0, 0], size: [longW, H10] },
          { id: 'left', label: 'Left Panel', specLabel: "16' × 10'", position: [-offsetL, H10 / 2, 0], rotation: [0, Math.PI / 2, 0], size: [shortW, H10] },
          { id: 'right', label: 'Right Panel', specLabel: "16' × 10'", position: [offsetL, H10 / 2, 0], rotation: [0, -Math.PI / 2, 0], size: [shortW, H10] },
        ],
      };
    }
    case 'island-30x30': {
      const panelW = 26 * FT;
      const offset = 15 * FT;
      return {
        layout, dimensions: "30' × 30' Island", footprint: "30' × 30' floor",
        panels: [
          { id: 'front', label: 'Front Panel', specLabel: "26' × 12'", position: [0, H12 / 2, offset], rotation: [0, Math.PI, 0], size: [panelW, H12] },
          { id: 'back', label: 'Back Panel', specLabel: "26' × 12'", position: [0, H12 / 2, -offset], rotation: [0, 0, 0], size: [panelW, H12] },
          { id: 'left', label: 'Left Panel', specLabel: "26' × 12'", position: [-offset, H12 / 2, 0], rotation: [0, Math.PI / 2, 0], size: [panelW, H12] },
          { id: 'right', label: 'Right Panel', specLabel: "26' × 12'", position: [offset, H12 / 2, 0], rotation: [0, -Math.PI / 2, 0], size: [panelW, H12] },
        ],
      };
    }
    case 'island-40x40': {
      const panelW = 36 * FT;
      const offset = 20 * FT;
      return {
        layout, dimensions: "40' × 40' Island", footprint: "40' × 40' floor",
        panels: [
          { id: 'front', label: 'Front Panel', specLabel: "36' × 12'", position: [0, H12 / 2, offset], rotation: [0, Math.PI, 0], size: [panelW, H12] },
          { id: 'back', label: 'Back Panel', specLabel: "36' × 12'", position: [0, H12 / 2, -offset], rotation: [0, 0, 0], size: [panelW, H12] },
          { id: 'left', label: 'Left Panel', specLabel: "36' × 12'", position: [-offset, H12 / 2, 0], rotation: [0, Math.PI / 2, 0], size: [panelW, H12] },
          { id: 'right', label: 'Right Panel', specLabel: "36' × 12'", position: [offset, H12 / 2, 0], rotation: [0, -Math.PI / 2, 0], size: [panelW, H12] },
        ],
      };
    }
  }
}

export const LAYOUT_OPTIONS: { value: BoothLayout; label: string; desc: string; category: string }[] = [
  // Inline / Linear
  { value: 'inline', label: 'Inline', desc: "10'×8' single wall", category: 'Inline' },
  { value: 'inline-10x10', label: 'Inline Tall', desc: "10'×10' tall back wall", category: 'Inline' },
  { value: 'inline-10x20', label: 'Inline Double', desc: "10'×20' double inline", category: 'Inline' },
  { value: 'inline-10x30', label: 'Inline Triple', desc: "10'×30' triple inline", category: 'Inline' },
  // Corner / L-Shape
  { value: 'l-shape', label: 'L-Shape', desc: "10'×10' corner", category: 'Corner' },
  { value: 'l-shape-10x20', label: 'L-Shape Wide', desc: "10'×20' corner", category: 'Corner' },
  // Peninsula / U-Shape
  { value: 'u-shape', label: 'U-Shape', desc: "10'×10' peninsula", category: 'Peninsula' },
  { value: 'u-shape-10x20', label: 'U-Shape Wide', desc: "10'×20' peninsula", category: 'Peninsula' },
  { value: 't-shape-10x20', label: 'T-Shape', desc: "10'×20' back + center wing", category: 'Peninsula' },
  { value: 'peninsula-20x20', label: 'Peninsula', desc: "20'×20' three-sided", category: 'Peninsula' },
  // Island / Freestanding
  { value: 'island', label: 'Island', desc: "20'×20' freestanding", category: 'Island' },
  { value: 'island-20x30', label: 'Island 20×30', desc: "20'×30' large island", category: 'Island' },
  { value: 'island-30x30', label: 'Island 30×30', desc: "30'×30' major exhibit", category: 'Island' },
  { value: 'island-40x40', label: 'Island 40×40', desc: "40'×40' anchor booth", category: 'Island' },
];

export const LIGHTING_PRESETS: { value: LightingPreset; label: string; desc: string }[] = [
  { value: 'expo-bright', label: 'Expo Bright', desc: 'Full convention center lighting — high visibility' },
  { value: 'showcase-dim', label: 'Standard Hall', desc: 'Typical exhibit hall ambient — balanced contrast' },
  { value: 'dark-hall', label: 'Dark Hall', desc: 'Minimal ambient — dramatic spotlight focus' },
  { value: 'stage-lighting', label: 'Stage Lighting', desc: 'Concert-style colored wash with dramatic beams' },
  { value: 'warm-gallery', label: 'Warm Gallery', desc: 'Museum-quality warm directional lighting' },
  { value: 'cool-neutral', label: 'Cool Neutral', desc: 'Daylight-balanced neutral tones' },
];
