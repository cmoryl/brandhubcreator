/**
 * Map Theme Configuration Types
 * Supports full customization of map tiles, markers, and UI overlays
 */

export type MapTileStyle = 
  | 'dark' 
  | 'light' 
  | 'satellite' 
  | 'streets'
  | 'toner'
  | 'watercolor'
  | 'terrain'
  | 'voyager'
  | 'positron'
  | 'dark-matter'
  | 'alidade-smooth'
  | 'alidade-dark';

export interface MapTileConfig {
  id: MapTileStyle;
  label: string;
  url: string;
  attribution: string;
  preview: string;
  category?: 'basic' | 'artistic' | 'professional';
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
  // Basic styles
  dark: {
    id: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '🌙',
    category: 'basic',
  },
  light: {
    id: 'light',
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '☀️',
    category: 'basic',
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    preview: '🛰️',
    category: 'basic',
  },
  streets: {
    id: 'streets',
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🗺️',
    category: 'basic',
  },
  // Professional CARTO styles
  voyager: {
    id: 'voyager',
    label: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '🧭',
    category: 'professional',
  },
  positron: {
    id: 'positron',
    label: 'Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '⚪',
    category: 'professional',
  },
  'dark-matter': {
    id: 'dark-matter',
    label: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: '⚫',
    category: 'professional',
  },
  // Artistic styles (Stadia Maps - free tier)
  'alidade-smooth': {
    id: 'alidade-smooth',
    label: 'Smooth',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🎨',
    category: 'artistic',
  },
  'alidade-dark': {
    id: 'alidade-dark',
    label: 'Alidade Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🌑',
    category: 'artistic',
  },
  // Artistic styles (Stamen via Stadia)
  toner: {
    id: 'toner',
    label: 'Toner',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🖤',
    category: 'artistic',
  },
  watercolor: {
    id: 'watercolor',
    label: 'Watercolor',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '🎨',
    category: 'artistic',
  },
  terrain: {
    id: 'terrain',
    label: 'Terrain',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    preview: '⛰️',
    category: 'artistic',
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
  minimal: {
    tileStyle: 'positron',
    markerColors: {
      studio: '#1e293b',
      office: '#64748b',
      headquarters: '#0f172a',
      datacenter: '#475569',
      partner: '#334155',
    },
    uiTheme: {
      panelBackground: 'rgba(255, 255, 255, 0.98)',
      panelText: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      accentColor: '#1e293b',
    },
  },
  toner: {
    tileStyle: 'toner',
    markerColors: {
      studio: '#ef4444',
      office: '#3b82f6',
      headquarters: '#000000',
      datacenter: '#22c55e',
      partner: '#f97316',
    },
    uiTheme: {
      panelBackground: 'rgba(255, 255, 255, 0.95)',
      panelText: 'rgba(0, 0, 0, 0.85)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      accentColor: '#000000',
    },
  },
  artistic: {
    tileStyle: 'watercolor',
    markerColors: {
      studio: '#dc2626',
      office: '#2563eb',
      headquarters: '#7c2d12',
      datacenter: '#15803d',
      partner: '#7e22ce',
    },
    uiTheme: {
      panelBackground: 'rgba(254, 243, 199, 0.95)',
      panelText: 'rgba(120, 53, 15, 0.9)',
      borderColor: 'rgba(120, 53, 15, 0.2)',
      accentColor: '#b45309',
    },
  },
  midnight: {
    tileStyle: 'dark-matter',
    markerColors: {
      studio: '#f472b6',
      office: '#60a5fa',
      headquarters: '#c084fc',
      datacenter: '#34d399',
      partner: '#fbbf24',
    },
    uiTheme: {
      panelBackground: 'rgba(3, 7, 18, 0.95)',
      panelText: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      accentColor: '#c084fc',
    },
  },
  explorer: {
    tileStyle: 'terrain',
    markerColors: {
      studio: '#ef4444',
      office: '#3b82f6',
      headquarters: '#f97316',
      datacenter: '#22c55e',
      partner: '#8b5cf6',
    },
    uiTheme: {
      panelBackground: 'rgba(68, 64, 60, 0.9)',
      panelText: 'rgba(255, 255, 255, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      accentColor: '#f97316',
    },
  },
};

// Helper to group tile configs by category
export const TILE_CONFIGS_BY_CATEGORY = {
  basic: Object.values(MAP_TILE_CONFIGS).filter(c => c.category === 'basic'),
  professional: Object.values(MAP_TILE_CONFIGS).filter(c => c.category === 'professional'),
  artistic: Object.values(MAP_TILE_CONFIGS).filter(c => c.category === 'artistic'),
};
