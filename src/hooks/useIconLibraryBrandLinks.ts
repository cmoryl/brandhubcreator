/**
 * useIconLibraryBrandLinks - Manages linking icon collections to specific brands
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IconLibraryBrandLink {
  id: string;
  library_id: string;
  brand_id: string;
  organization_id: string;
  allow_overrides: boolean;
  color_overrides: Record<string, string> | null;
  created_at: string;
  created_by: string | null;
}

export const useIconLibraryBrandLinks = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();
  const queryKey = ['icon-library-brand-links', organizationId];

  const { data: links = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('icon_library_brand_links' as any)
        .select('*')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return (data || []) as unknown as IconLibraryBrandLink[];
    },
    enabled: !!organizationId,
  });

  const linkLibraryToBrand = useMutation({
    mutationFn: async ({ libraryId, brandId }: { libraryId: string; brandId: string }) => {
      const { error } = await supabase
        .from('icon_library_brand_links' as any)
        .insert({
          library_id: libraryId,
          brand_id: brandId,
          organization_id: organizationId,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Icon collection linked to brand');
    },
    onError: (err: any) => {
      if (err?.code === '23505') {
        toast.info('This collection is already linked to that brand');
      } else {
        toast.error('Failed to link collection');
      }
    },
  });

  const unlinkLibraryFromBrand = useMutation({
    mutationFn: async ({ libraryId, brandId }: { libraryId: string; brandId: string }) => {
      const { error } = await supabase
        .from('icon_library_brand_links' as any)
        .delete()
        .eq('library_id', libraryId)
        .eq('brand_id', brandId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Collection unlinked from brand');
    },
    onError: () => toast.error('Failed to unlink collection'),
  });

  const toggleOverrides = useMutation({
    mutationFn: async ({ linkId, allowOverrides }: { linkId: string; allowOverrides: boolean }) => {
      const { error } = await supabase
        .from('icon_library_brand_links' as any)
        .update({ allow_overrides: allowOverrides } as any)
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Helper: get linked brand IDs for a specific library
  const getLinkedBrandIds = (libraryId: string): string[] => {
    return links.filter(l => l.library_id === libraryId).map(l => l.brand_id);
  };

  // Helper: get linked library IDs for a specific brand
  const getLinkedLibraryIds = (brandId: string): string[] => {
    return links.filter(l => l.brand_id === brandId).map(l => l.library_id);
  };

  return {
    links,
    isLoading,
    linkLibraryToBrand,
    unlinkLibraryFromBrand,
    toggleOverrides,
    getLinkedBrandIds,
    getLinkedLibraryIds,
  };
};
