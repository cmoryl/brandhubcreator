import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ClientLogo, ClientLogoFile } from '@/types/brand';

export interface HydratedClientLogo extends ClientLogo {
  /** ID in `global_client_logos` if the logo is sourced from the shared library */
  globalLogoId?: string;
  category?: string | null;
}

/**
 * Hydrate per-brand `clientLogos` against the org's shared `global_client_logos` library.
 * - Matches by case-insensitive name
 * - When matched, replaces files/websiteUrl with the library version (single source of truth)
 * - Falls back to the stored values when no match exists (legacy back-compat)
 */
export function useHydratedClientLogos(
  organizationId: string | undefined,
  clientLogos: ClientLogo[],
) {
  const [library, setLibrary] = useState<
    Record<string, { id: string; files: ClientLogoFile[]; website_url: string | null; category: string; description: string | null }>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchLibrary = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_client_logos')
        .select('id, name, files, website_url, category, description')
        .eq('organization_id', organizationId);
      if (error) throw error;
      const map: typeof library = {};
      for (const row of data || []) {
        map[(row.name || '').toLowerCase()] = {
          id: row.id,
          files: (Array.isArray(row.files) ? row.files : []) as unknown as ClientLogoFile[],
          website_url: row.website_url,
          category: row.category,
          description: row.description,
        };
      }
      setLibrary(map);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const hydrated: HydratedClientLogo[] = clientLogos.map((l) => {
    const match = library[(l.name || '').toLowerCase()];
    if (!match) return { ...l };
    return {
      ...l,
      globalLogoId: match.id,
      files: match.files.length ? match.files : l.files,
      websiteUrl: l.websiteUrl ?? match.website_url ?? undefined,
      description: l.description ?? match.description ?? undefined,
      category: match.category,
    };
  });

  return { hydrated, isLoading, refresh: fetchLibrary };
}
