/**
 * Iconify API Client
 * 
 * Provides access to 200K+ open-source icons via the public Iconify API.
 * Used by the Icon Studio browser for multi-library browsing and search.
 */

const API_BASE = 'https://api.iconify.design';

export interface IconifyCollection {
  name: string;
  total: number;
  author: { name: string; url?: string };
  license: { title: string };
  samples: string[];
  category?: string;
  palette: boolean;
}

export interface IconifySearchResult {
  icons: string[];       // "prefix:name" format
  total: number;
  limit: number;
  start: number;
  collections: Record<string, IconifyCollection>;
}

export interface IconifyCollectionIcons {
  prefix: string;
  total: number;
  icons?: Record<string, unknown>;
  aliases?: Record<string, unknown>;
  categories?: Record<string, string[]>;
  uncategorized?: string[];
  hidden?: string[];
}

// Featured libraries matching IconStack's sidebar
export const FEATURED_LIBRARIES = [
  { prefix: 'tabler', name: 'Tabler' },
  { prefix: 'feather', name: 'Feather' },
  { prefix: 'solar', name: 'Solar' },
  { prefix: 'ph', name: 'Phosphor' },
  { prefix: 'bi', name: 'Bootstrap' },
  { prefix: 'vuesax-linear', name: 'Iconsax' },
  { prefix: 'radix-icons', name: 'Radix' },
  { prefix: 'line-md', name: 'Line' },
  { prefix: 'pixelarticons', name: 'Pixel Art' },
  { prefix: 'hugeicons', name: 'Huge Icons' },
  { prefix: 'mingcute', name: 'Mingcute' },
  { prefix: 'heroicons', name: 'Heroicons' },
  { prefix: 'ic', name: 'Material Design' },
  { prefix: 'fluent', name: 'Fluent UI' },
  { prefix: 'lucide', name: 'Lucide' },
  { prefix: 'carbon', name: 'Carbon' },
  { prefix: 'iconamoon', name: 'Iconamoon' },
  { prefix: 'iconoir', name: 'Iconoir' },
  { prefix: 'majesticons', name: 'Majesticon' },
  { prefix: 'simple-icons', name: 'Brand' },
  { prefix: 'octicon', name: 'Octicons' },
];

/**
 * Fetch all available icon collections with metadata
 */
export async function fetchCollections(): Promise<Record<string, IconifyCollection>> {
  const res = await fetch(`${API_BASE}/collections`);
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

/**
 * Search icons across all or specific collections
 */
export async function searchIcons(
  query: string,
  options?: { prefix?: string; limit?: number }
): Promise<IconifySearchResult> {
  const params = new URLSearchParams({ query });
  if (options?.prefix) params.set('prefix', options.prefix);
  if (options?.limit) params.set('limit', String(options.limit));

  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) throw new Error('Failed to search icons');
  return res.json();
}

/**
 * List all icons in a specific collection
 */
export async function fetchCollectionIcons(prefix: string): Promise<IconifyCollectionIcons> {
  const res = await fetch(`${API_BASE}/collection?prefix=${prefix}`);
  if (!res.ok) throw new Error(`Failed to fetch collection: ${prefix}`);
  return res.json();
}

/**
 * Get SVG for a specific icon
 */
export async function fetchIconSvg(
  prefix: string,
  name: string,
  options?: { color?: string; width?: number; height?: number }
): Promise<string> {
  let url = `${API_BASE}/${prefix}/${name}.svg`;
  const params = new URLSearchParams();
  if (options?.color) params.set('color', options.color);
  if (options?.width) params.set('width', String(options.width));
  if (options?.height) params.set('height', String(options.height));
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch icon SVG: ${prefix}:${name}`);
  return res.text();
}

/**
 * Get JSON data for multiple icons at once
 */
export async function fetchIconsData(
  prefix: string,
  icons: string[]
): Promise<Record<string, { body: string; width?: number; height?: number }>> {
  const res = await fetch(`${API_BASE}/${prefix}.json?icons=${icons.join(',')}`);
  if (!res.ok) throw new Error('Failed to fetch icons data');
  const data = await res.json();
  return data.icons || {};
}
