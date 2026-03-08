/**
 * Booth Furniture / Asset Catalog
 * Predefined 3D assets with exact real-world sizing for trade show booths.
 * All dimensions in meters. Conversion: 1 foot = 0.3048m, 1 inch = 0.0254m
 */

export type FurnitureCategory = 'tables' | 'displays' | 'seating' | 'signage' | 'accessories' | 'flooring';

export interface FurnitureAsset {
  id: string;
  name: string;
  category: FurnitureCategory;
  /** [width, height, depth] in meters */
  size: [number, number, number];
  /** Default color (hex) */
  color: string;
  /** Optional icon name from lucide */
  icon?: string;
  /** Description for tooltip */
  description: string;
  /** Whether it supports an image/screen texture */
  hasScreen?: boolean;
  /** Screen area within the asset [width, height] in meters, offset from center */
  screenSize?: [number, number];
  /** Screen Y offset from base */
  screenYOffset?: number;
  /** Whether this asset supports a table cover */
  hasTableCover?: boolean;
  /** Whether this asset is wall-mountable (drags on vertical plane) */
  wallMountable?: boolean;
  /** Custom thumbnail image URL for asset library preview */
  thumbnailUrl?: string;
  /** Whether this asset supports a custom surface texture/decal */
  hasCustomTexture?: boolean;
}

export interface PlacedAsset {
  instanceId: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  /** Custom size override [w, h, d] in meters */
  customSize?: [number, number, number];
  /** Custom color override */
  customColor?: string;
  /** Image URL for screens */
  screenImageUrl?: string;
  /** Label */
  label?: string;
  /** Table cover fabric color (hex) */
  tableCoverColor?: string;
  /** Table cover front image URL */
  tableCoverImageUrl?: string;
  /** Table cover style */
  tableCoverStyle?: 'fitted' | 'draped' | 'throw';
  /** Custom surface texture/decal image URL */
  customTextureUrl?: string;
  /** Custom thumbnail override for asset library */
  customThumbnailUrl?: string;
}

const FT = 0.3048;
const IN = 0.0254;

export const FURNITURE_CATALOG: FurnitureAsset[] = [
  // Tables
  {
    id: 'table-6ft',
    name: "6' Table",
    category: 'tables',
    size: [6 * FT, 30 * IN, 30 * IN],
    color: '#1e293b',
    description: "Standard 6' folding table (72\" × 30\" × 30\")",
    hasTableCover: true,
    hasCustomTexture: true,
  },
  {
    id: 'table-8ft',
    name: "8' Table",
    category: 'tables',
    size: [8 * FT, 30 * IN, 30 * IN],
    color: '#1e293b',
    description: "Standard 8' folding table (96\" × 30\" × 30\")",
    hasTableCover: true,
    hasCustomTexture: true,
  },
  {
    id: 'table-6ft-covered',
    name: "6' Covered Table",
    category: 'tables',
    size: [6 * FT, 30 * IN, 30 * IN],
    color: '#1e3a5f',
    description: "6' table with fitted fabric cover — customizable color & print",
    hasTableCover: true,
  },
  {
    id: 'table-8ft-covered',
    name: "8' Covered Table",
    category: 'tables',
    size: [8 * FT, 30 * IN, 30 * IN],
    color: '#1e3a5f',
    description: "8' table with fitted fabric cover — customizable color & print",
    hasTableCover: true,
  },
  {
    id: 'counter-reception',
    name: 'Reception Counter',
    category: 'tables',
    size: [4 * FT, 42 * IN, 24 * IN],
    color: '#334155',
    description: "Standing-height reception counter (48\" × 42\" × 24\")",
    hasTableCover: true,
    hasCustomTexture: true,
  },
  {
    id: 'podium',
    name: 'Podium / Lectern',
    category: 'tables',
    size: [24 * IN, 46 * IN, 20 * IN],
    color: '#1e293b',
    description: "Standard speaker podium (24\" × 46\" × 20\")",
  },
  {
    id: 'cocktail-table',
    name: 'Cocktail Table',
    category: 'tables',
    size: [30 * IN, 42 * IN, 30 * IN],
    color: '#475569',
    description: "Round cocktail/highboy table (30\" dia × 42\" tall)",
    hasTableCover: true,
  },

  // Displays / TVs
  {
    id: 'tv-42',
    name: '42" TV on Stand',
    category: 'displays',
    size: [38 * IN, 70 * IN, 18 * IN], // stand footprint + height
    color: '#0f172a',
    description: '42" TV on adjustable floor stand (total height ~70")',
    hasScreen: true,
    screenSize: [37 * IN, 21 * IN],
    screenYOffset: 50 * IN,
  },
  {
    id: 'tv-55',
    name: '55" TV on Stand',
    category: 'displays',
    size: [49 * IN, 72 * IN, 20 * IN],
    color: '#0f172a',
    description: '55" TV on adjustable floor stand (total height ~72")',
    hasScreen: true,
    screenSize: [48.5 * IN, 27.5 * IN],
    screenYOffset: 50 * IN,
  },
  {
    id: 'tv-65',
    name: '65" TV on Stand',
    category: 'displays',
    size: [58 * IN, 75 * IN, 22 * IN],
    color: '#0f172a',
    description: '65" TV on heavy-duty floor stand',
    hasScreen: true,
    screenSize: [57 * IN, 32 * IN],
    screenYOffset: 50 * IN,
  },
  {
    id: 'tv-wall-42',
    name: '42" Wall-Mounted TV',
    category: 'displays',
    size: [37 * IN, 21 * IN, 3 * IN],
    color: '#0f172a',
    description: '42" wall-mounted display (no stand)',
    hasScreen: true,
    screenSize: [37 * IN, 21 * IN],
    screenYOffset: 0,
    wallMountable: true,
  },
  {
    id: 'tv-wall-55',
    name: '55" Wall-Mounted TV',
    category: 'displays',
    size: [48.5 * IN, 27.5 * IN, 3 * IN],
    color: '#0f172a',
    description: '55" wall-mounted display (no stand)',
    hasScreen: true,
    screenSize: [48.5 * IN, 27.5 * IN],
    screenYOffset: 0,
    wallMountable: true,
  },

  // Seating
  {
    id: 'bar-stool',
    name: 'Bar Stool',
    category: 'seating',
    size: [16 * IN, 30 * IN, 16 * IN],
    color: '#475569',
    description: "Standard bar stool (16\" × 30\")",
  },
  {
    id: 'lounge-chair',
    name: 'Lounge Chair',
    category: 'seating',
    size: [30 * IN, 32 * IN, 30 * IN],
    color: '#334155',
    description: "Lounge chair (30\" × 32\" × 30\")",
  },

  // Signage
  {
    id: 'banner-stand',
    name: 'Retractable Banner',
    category: 'signage',
    size: [33.5 * IN, 80 * IN, 12 * IN],
    color: '#1e293b',
    description: 'Standard retractable banner stand (33.5" × 80")',
    hasScreen: true,
    screenSize: [33 * IN, 78 * IN],
    screenYOffset: 1 * IN,
  },
  {
    id: 'banner-wide',
    name: 'Wide Banner Stand',
    category: 'signage',
    size: [47 * IN, 80 * IN, 14 * IN],
    color: '#1e293b',
    description: 'Wide retractable banner stand (47" × 80")',
    hasScreen: true,
    screenSize: [46 * IN, 78 * IN],
    screenYOffset: 1 * IN,
  },

  // Accessories
  {
    id: 'literature-rack',
    name: 'Literature Rack',
    category: 'accessories',
    size: [24 * IN, 60 * IN, 14 * IN],
    color: '#94a3b8',
    description: "Brochure / literature display rack",
  },
  {
    id: 'kiosk-ipad',
    name: 'iPad Kiosk',
    category: 'accessories',
    size: [14 * IN, 48 * IN, 14 * IN],
    color: '#334155',
    description: "iPad/tablet kiosk stand",
    hasScreen: true,
    screenSize: [10 * IN, 8 * IN],
    screenYOffset: 44 * IN,
  },
  {
    id: 'custom-box',
    name: 'Custom Asset',
    category: 'accessories',
    size: [1, 1, 1],
    color: '#64748b',
    description: 'Custom-sized box primitive — specify your own dimensions',
  },

  // Flooring — Rugs & Carpets
  {
    id: 'rug-4x6',
    name: "4' × 6' Area Rug",
    category: 'flooring',
    size: [4 * FT, 0.01, 6 * FT],
    color: '#1e3a5f',
    description: "4' × 6' area rug with custom color",
  },
  {
    id: 'rug-6x8',
    name: "6' × 8' Area Rug",
    category: 'flooring',
    size: [6 * FT, 0.01, 8 * FT],
    color: '#1e3a5f',
    description: "6' × 8' area rug with custom color",
  },
  {
    id: 'rug-8x10',
    name: "8' × 10' Area Rug",
    category: 'flooring',
    size: [8 * FT, 0.01, 10 * FT],
    color: '#1e3a5f',
    description: "8' × 10' full booth carpet",
  },
  {
    id: 'rug-10x10',
    name: "10' × 10' Carpet",
    category: 'flooring',
    size: [10 * FT, 0.01, 10 * FT],
    color: '#334155',
    description: "10' × 10' full booth carpet pad",
  },
  {
    id: 'rug-runner',
    name: "Runner Rug (2' × 8')",
    category: 'flooring',
    size: [2 * FT, 0.01, 8 * FT],
    color: '#7c3aed',
    description: "Narrow runner rug for aisles (2' × 8')",
  },
  {
    id: 'rug-round',
    name: "6' Round Rug",
    category: 'flooring',
    size: [6 * FT, 0.01, 6 * FT],
    color: '#be185d',
    description: "6' diameter round area rug",
  },
];

export const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  tables: 'Tables & Counters',
  displays: 'TVs & Displays',
  seating: 'Seating',
  signage: 'Signage & Banners',
  accessories: 'Accessories',
  flooring: 'Rugs & Carpets',
};

export function getFurnitureById(id: string): FurnitureAsset | undefined {
  return FURNITURE_CATALOG.find(f => f.id === id);
}
