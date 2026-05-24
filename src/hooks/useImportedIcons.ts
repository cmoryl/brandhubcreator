/**
 * useImportedIcons — loads the bundled icon-library manifest and provides
 * helpers to fetch SVG contents for export / inline rendering.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { BrandIconography } from '@/types/brand';

export interface ImportedIconEntry {
  id: string;
  slug: string;
  name: string;
  variant: 'light-blue' | 'white';
  category: string;
  path: string;
}

export interface ImportedIconLibrary {
  id: 'imported';
  name: string;
  level: 'core';
  description: string;
  icons: BrandIconography[];
  is_active: true;
  iconCount: number;
}

const MANIFEST_URL = '/icon-library/manifest.json';

async function fetchSvgAsBrandIconography(entry: ImportedIconEntry): Promise<BrandIconography> {
  const text = await fetch(entry.path).then((r) => r.text());
  // Extract the first <path d="..."> or use the whole SVG inner content
  const pathMatch = text.match(/<path[^>]*d="([^"]*)"/);
  const svgPath = pathMatch ? pathMatch[1] : text;
  const viewBoxMatch = text.match(/viewBox="([^"]*)"/);
  return {
    id: entry.id,
    name: entry.name,
    svgPath,
    category: entry.category,
    viewBox: viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24',
    fillMode: 'stroke',
  };
}

export const useImportedIcons = () => {
  const [entries, setEntries] = useState<ImportedIconEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(MANIFEST_URL)
      .then((r) => r.json())
      .then((data: ImportedIconEntry[]) => setEntries(data))
      .catch((e) => {
        logger.debug('[useImportedIcons] manifest load failed', e);
        toast.error('Failed to load imported icon library');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [entries]);

  const countsByVariant = useMemo(() => {
    const out: Record<string, number> = { 'light-blue': 0, white: 0 };
    entries.forEach((e) => {
      out[e.variant] = (out[e.variant] || 0) + 1;
    });
    return out;
  }, [entries]);

  const asBrandIconography = useCallback(
    async (filterVariant?: 'light-blue' | 'white', limit?: number): Promise<BrandIconography[]> => {
      const subset = entries
        .filter((e) => !filterVariant || e.variant === filterVariant)
        .slice(0, limit ?? entries.length);
      const results = await Promise.all(
        subset.map((e) =>
          fetchSvgAsBrandIconography(e).catch((err) => {
            logger.debug('[useImportedIcons] fetch failed', e.path, err);
            return null;
          })
        )
      );
      return results.filter(Boolean) as BrandIconography[];
    },
    [entries]
  );

  const virtualLibrary = useMemo((): ImportedIconLibrary => {
    // lightweight: only first 6 icons fetched for preview; rest on demand
    return {
      id: 'imported',
      name: 'Imported Assets',
      level: 'core',
      description: `${entries.length} bundled SVG icons — curated asset library`,
      icons: [], // populated on demand
      is_active: true,
      iconCount: entries.length,
    };
  }, [entries.length]);

  return {
    entries,
    loading,
    categories,
    countsByVariant,
    virtualLibrary,
    asBrandIconography,
  };
};
