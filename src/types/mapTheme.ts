/**
 * Map Theme Configuration Types
 * Supports full customization of map tiles, markers, and UI overlays
 */

export type MapTileStyle = 'dark' | 'light' | 'satellite' | 'streets';

export interface MapTileConfig {
  id: MapTileStyle;
  label: string;
  url: string;
  attribution: string;
  preview: string;
}

export interface MarkerTheme {
  studio: string;
  office: string;
  headquarters: string;
  datacenter: string;
  partner: string;
}

export interface MapUITheme {
  /** Background color of the filter panel */
  panelBackground: string;
  /** Text color in the filter panel */
  panelText: string;
  /** Border color of UI overlays */
  borderColor: string;
  /** Accent color for selected items */
  accentColor: string;
}

export interface MapThemeConfig {
  tileStyle: MapTileStyle;
  markerColors: MarkerTheme;
  uiTheme: MapUITheme;
}

// Available tile providers (all free, no API key required)
export const MAP_TILE_CONFIGS: Record<MapTileStyle, MapTileConfig> = {
  dark: {
    id: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '🌙',
  },
  light: {
    id: 'light',
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '☀️',
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    preview: '🛰️',
  },
  streets: {
    id: 'streets',
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🗺️',
  },
};

// Default marker colors by category
export const DEFAULT_MARKER_COLORS: MarkerTheme = {
  studio: '#ec4899',      // Pink
  office: '#6b7280',      // Gray
  headquarters: '#f59e0b', // Amber
  datacenter: '#22c55e',   // Green
  partner: '#8b5cf6',      // Purple
};

// Default UI theme
export const DEFAULT_UI_THEME: MapUITheme = {
  panelBackground: 'rgba(10, 22, 40, 0.9)',
  panelText: 'rgba(255, 255, 255, 0.7)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  accentColor: '#00d4ff',
};

// Default complete theme
export const DEFAULT_MAP_THEME: MapThemeConfig = {
  tileStyle: 'dark',
  markerColors: DEFAULT_MARKER_COLORS,
  uiTheme: DEFAULT_UI_THEME,
};

// Preset themes for quick selection
export const MAP_THEME_PRESETS: Record<string, MapThemeConfig> = {
  default: DEFAULT_MAP_THEME,
  corporate: {
    tileStyle: 'light',
    markerColors: {
      studio: '#0ea5e9',
      office: '#64748b',
      headquarters: '#0369a1',
      datacenter: '#059669',
      partner: '#7c3aed',
    },
    uiTheme: {
      panelBackground: 'rgba(255, 255, 255, 0.95)',
      panelText: 'rgba(15, 23, 42, 0.8)',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      accentColor: '#0ea5e9',
    },
  },
  vibrant: {
    tileStyle: 'dark',
    markerColors: {
      studio: '#f43f5e',
      office: '#06b6d4',
      headquarters: '#fbbf24',
      datacenter: '#10b981',
      partner: '#a855f7',
    },
    uiTheme: {
      panelBackground: 'rgba(15, 23, 42, 0.95)',
      panelText: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      accentColor: '#f43f5e',
    },
  },
  nature: {
    tileStyle: 'satellite',
    markerColors: {
      studio: '#facc15',
      office: '#f8fafc',
      headquarters: '#fb923c',
      datacenter: '#4ade80',
      partner: '#c084fc',
    },
    uiTheme: {
      panelBackground: 'rgba(20, 83, 45, 0.9)',
      panelText: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      accentColor: '#4ade80',
    },
  },
};
