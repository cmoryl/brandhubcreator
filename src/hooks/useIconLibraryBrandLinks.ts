/**
 * useIconLibraryBrandLinks - Manages linking icon collections to brands, products, and events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IconLibraryEntityLink {
  id: string;
  library_id: string;
  brand_id: string | null;
  product_id: string | null;
  event_id: string | null;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string;
  allow_overrides: boolean;
  color_overrides: Record<string, string> | null;
  created_at: string;
  created_by: string | null;
}

// Keep backward compat alias
export type IconLibraryBrandLink = IconLibraryEntityLink;

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
      return (data || []) as unknown as IconLibraryEntityLink[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Generic link mutation
  const linkLibraryToEntity = useMutation({
    mutationFn: async ({ libraryId, entityId, entityType }: { libraryId: string; entityId: string; entityType: 'brand' | 'product' | 'event' }) => {
      const payload: any = {
        library_id: libraryId,
        organization_id: organizationId,
      };
      if (entityType === 'brand') payload.brand_id = entityId;
      else if (entityType === 'product') payload.product_id = entityId;
      else if (entityType === 'event') payload.event_id = entityId;

      const { error } = await supabase
        .from('icon_library_brand_links' as any)
        .insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Icon collection linked');
    },
    onError: (err: any) => {
      if (err?.code === '23505') {
        toast.info('This collection is already linked');
      } else {
        toast.error('Failed to link collection');
      }
    },
  });

  // Generic unlink mutation
  const unlinkLibraryFromEntity = useMutation({
    mutationFn: async ({ libraryId, entityId, entityType }: { libraryId: string; entityId: string; entityType: 'brand' | 'product' | 'event' }) => {
      const col = entityType === 'brand' ? 'brand_id' : entityType === 'product' ? 'product_id' : 'event_id';
      const { error } = await supabase
        .from('icon_library_brand_links' as any)
        .delete()
        .eq('library_id', libraryId)
        .eq(col, entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Collection unlinked');
    },
    onError: () => toast.error('Failed to unlink collection'),
  });

  // Backward-compat wrappers
  const linkLibraryToBrand = useMutation({
    mutationFn: async ({ libraryId, brandId }: { libraryId: string; brandId: string }) => {
      return linkLibraryToEntity.mutateAsync({ libraryId, entityId: brandId, entityType: 'brand' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unlinkLibraryFromBrand = useMutation({
    mutationFn: async ({ libraryId, brandId }: { libraryId: string; brandId: string }) => {
      return unlinkLibraryFromEntity.mutateAsync({ libraryId, entityId: brandId, entityType: 'brand' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
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
    return links.filter(l => l.library_id === libraryId && l.brand_id).map(l => l.brand_id!);
  };

  // Helper: get linked library IDs for a specific brand
  const getLinkedLibraryIds = (brandId: string): string[] => {
    return links.filter(l => l.brand_id === brandId).map(l => l.library_id);
  };

  // Generic helpers for any entity type
  const getLinkedEntityIds = (libraryId: string, entityType: 'brand' | 'product' | 'event'): string[] => {
    return links
      .filter(l => l.library_id === libraryId && l.entity_type === entityType)
      .map(l => (entityType === 'brand' ? l.brand_id : entityType === 'product' ? l.product_id : l.event_id)!)
      .filter(Boolean);
  };

  const getLinkedLibraryIdsForEntity = (entityId: string, entityType: 'brand' | 'product' | 'event'): string[] => {
    const col = entityType === 'brand' ? 'brand_id' : entityType === 'product' ? 'product_id' : 'event_id';
    return links.filter(l => l[col] === entityId).map(l => l.library_id);
  };

  return {
    links,
    isLoading,
    linkLibraryToBrand,
    unlinkLibraryFromBrand,
    linkLibraryToEntity,
    unlinkLibraryFromEntity,
    toggleOverrides,
    getLinkedBrandIds,
    getLinkedLibraryIds,
    getLinkedEntityIds,
    getLinkedLibraryIdsForEntity,
  };
};
