/**
 * useSectionFavorites - Hook for managing user's favorite sections
 * Provides CRUD operations with database persistence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SectionFavorite {
  id: string;
  sectionId: string;
  createdAt: string;
}

interface UseSectionFavoritesOptions {
  entityType: 'brand' | 'product' | 'event';
  entityId: string | undefined;
}

// Query key factory
export const sectionFavoritesKeys = {
  all: ['section-favorites'] as const,
  entity: (entityType: string, entityId: string) =>
    [...sectionFavoritesKeys.all, entityType, entityId] as const,
};

export function useSectionFavorites({ entityType, entityId }: UseSectionFavoritesOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch favorites for this entity
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: sectionFavoritesKeys.entity(entityType, entityId || ''),
    queryFn: async () => {
      if (!entityId || !user?.id) return [];

      const { data, error } = await supabase
        .from('user_section_favorites')
        .select('id, section_id, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[useSectionFavorites] Fetch error:', error);
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        sectionId: row.section_id,
        createdAt: row.created_at,
      }));
    },
    enabled: !!entityId && !!user?.id,
    staleTime: 30000,
  });

  // Get set of favorited section IDs for quick lookup
  const favoritedSectionIds = new Set(favorites.map((f) => f.sectionId));

  // Check if a section is favorited
  const isFavorited = (sectionId: string): boolean => {
    return favoritedSectionIds.has(sectionId);
  };

  // Toggle favorite mutation
  const toggleMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      if (!entityId || !user?.id) {
        throw new Error('Must be logged in to favorite sections');
      }

      const existing = favorites.find((f) => f.sectionId === sectionId);

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('user_section_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed', sectionId };
      } else {
        // Add favorite
        const { error } = await supabase.from('user_section_favorites').insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          section_id: sectionId,
        });

        if (error) throw error;
        return { action: 'added', sectionId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sectionFavoritesKeys.entity(entityType, entityId || ''),
      });
    },
  });

  // Clear all favorites for this entity
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!entityId || !user?.id) {
        throw new Error('Must be logged in');
      }

      const { error } = await supabase
        .from('user_section_favorites')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sectionFavoritesKeys.entity(entityType, entityId || ''),
      });
    },
  });

  return {
    favorites,
    favoritedSectionIds,
    isLoading,
    isFavorited,
    toggleFavorite: toggleMutation.mutateAsync,
    clearAllFavorites: clearAllMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    isClearing: clearAllMutation.isPending,
    hasFavorites: favorites.length > 0,
    favoriteCount: favorites.length,
    isAuthenticated: !!user?.id,
  };
}
