// Bundled icon library types
export interface IconPackMeta {
  id: string;
  name: string;
  license: string;
  author: string;
  url: string;
  priority: number;
  multicolor: boolean;
  count: number;
  categories: Record<string, number>;
  defaultViewBox: string;
}

export interface IconLibraryManifest {
  packs: IconPackMeta[];
  totalIcons: number;
  generatedAt: string;
}

export interface IconIndexEntry {
  /** icon name (slug within pack) */
  n: string;
  /** category */
  c: string;
  /** auto-extracted tags */
  t: string[];
}

/** Per-icon descriptor surfaced to UI/consumers. */
export interface ImportedIconEntry {
  /** Stable id: `${packId}/${name}` */
  id: string;
  /** Pack id (e.g. 'ph', 'lucide') */
  pack: string;
  /** Pack display name */
  packName: string;
  /** Icon slug within pack */
  name: string;
  /** Display label */
  label: string;
  /** Industry/use category */
  category: string;
  /** Searchable tags */
  tags: string[];
  /** License */
  license: string;
  /** Attribution */
  attribution: string;
  /** True if pack ships multi-color SVGs (skip currentColor restyle) */
  multicolor: boolean;
}
