/**
 * Booth panel configuration types for 3D mapper
 */

export type BoothLayout = 'inline' | 'l-shape' | 'u-shape' | 'island';

export interface PanelConfig {
  id: string;
  label: string;
  /** Position [x, y, z] in 3D space */
  position: [number, number, number];
  /** Rotation [x, y, z] in radians */
  rotation: [number, number, number];
  /** Size [width, height] */
  size: [number, number];
  /** Assigned image URL */
  imageUrl?: string;
}

export interface BoothConfig {
  layout: BoothLayout;
  panels: PanelConfig[];
  /** Physical dimensions label */
  dimensions: string;
}

export type LightingPreset = 'expo-bright' | 'showcase-dim' | 'warm-gallery' | 'cool-neutral';

export interface PanelAssignment {
  panelId: string;
  imageUrl: string;
}

const PANEL_HEIGHT = 2.5;
const PANEL_WIDTH = 3;

/** Generate panel configurations for each layout */
export function getBoothPanels(layout: BoothLayout): BoothConfig {
  switch (layout) {
    case 'inline':
      return {
        layout,
        dimensions: "10' × 8' Inline",
        panels: [
          { id: 'back', label: 'Back Wall', position: [0, PANEL_HEIGHT / 2, 0], rotation: [0, 0, 0], size: [PANEL_WIDTH * 2, PANEL_HEIGHT] },
        ],
      };
    case 'l-shape':
      return {
        layout,
        dimensions: "10' × 10' L-Shape",
        panels: [
          { id: 'back', label: 'Back Wall', position: [0, PANEL_HEIGHT / 2, 0], rotation: [0, 0, 0], size: [PANEL_WIDTH, PANEL_HEIGHT] },
          { id: 'left', label: 'Left Wall', position: [-PANEL_WIDTH / 2, PANEL_HEIGHT / 2, PANEL_WIDTH / 2], rotation: [0, Math.PI / 2, 0], size: [PANEL_WIDTH, PANEL_HEIGHT] },
        ],
      };
    case 'u-shape':
      return {
        layout,
        dimensions: "10' × 10' U-Shape",
        panels: [
          { id: 'back', label: 'Back Wall', position: [0, PANEL_HEIGHT / 2, 0], rotation: [0, 0, 0], size: [PANEL_WIDTH * 1.5, PANEL_HEIGHT] },
          { id: 'left', label: 'Left Wall', position: [-PANEL_WIDTH * 0.75, PANEL_HEIGHT / 2, PANEL_WIDTH / 2], rotation: [0, Math.PI / 2, 0], size: [PANEL_WIDTH, PANEL_HEIGHT] },
          { id: 'right', label: 'Right Wall', position: [PANEL_WIDTH * 0.75, PANEL_HEIGHT / 2, PANEL_WIDTH / 2], rotation: [0, -Math.PI / 2, 0], size: [PANEL_WIDTH, PANEL_HEIGHT] },
        ],
      };
    case 'island':
      return {
        layout,
        dimensions: "20' × 20' Island",
        panels: [
          { id: 'front', label: 'Front Panel', position: [0, PANEL_HEIGHT / 2, PANEL_WIDTH * 0.75], rotation: [0, Math.PI, 0], size: [PANEL_WIDTH * 1.5, PANEL_HEIGHT] },
          { id: 'back', label: 'Back Panel', position: [0, PANEL_HEIGHT / 2, -PANEL_WIDTH * 0.75], rotation: [0, 0, 0], size: [PANEL_WIDTH * 1.5, PANEL_HEIGHT] },
          { id: 'left', label: 'Left Panel', position: [-PANEL_WIDTH * 0.75, PANEL_HEIGHT / 2, 0], rotation: [0, Math.PI / 2, 0], size: [PANEL_WIDTH * 1.5, PANEL_HEIGHT] },
          { id: 'right', label: 'Right Panel', position: [PANEL_WIDTH * 0.75, PANEL_HEIGHT / 2, 0], rotation: [0, -Math.PI / 2, 0], size: [PANEL_WIDTH * 1.5, PANEL_HEIGHT] },
        ],
      };
  }
}

export const LAYOUT_OPTIONS: { value: BoothLayout; label: string; desc: string }[] = [
  { value: 'inline', label: 'Inline', desc: 'Single back wall' },
  { value: 'l-shape', label: 'L-Shape', desc: 'Corner booth' },
  { value: 'u-shape', label: 'U-Shape', desc: 'Peninsula booth' },
  { value: 'island', label: 'Island', desc: '360° freestanding' },
];

export const LIGHTING_PRESETS: { value: LightingPreset; label: string }[] = [
  { value: 'expo-bright', label: 'Expo Bright' },
  { value: 'showcase-dim', label: 'Showcase Dim' },
  { value: 'warm-gallery', label: 'Warm Gallery' },
  { value: 'cool-neutral', label: 'Cool Neutral' },
];
