/**
 * useLogoFavorites Hook
 * Manages user's logo favorites with database persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LogoFavorite {
  id: string;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  logoId: string;
  logoName: string | null;
  logoUrl: string | null;
  logoVariant: string | null;
  entityName: string | null;
  entitySlug: string | null;
  createdAt: string;
}

interface UseLogoFavoritesReturn {
  favorites: LogoFavorite[];
  isLoading: boolean;
  isFavorite: (entityId: string, logoId: string) => boolean;
  toggleFavorite: (logo: {
    entityId: string;
    entityType: 'brand' | 'product' | 'event';
    logoId: string;
    logoName: string;
    logoUrl: string;
    logoVariant: string;
    entityName: string;
    entitySlug?: string;
  }) => Promise<void>;
  removeFavorite: (entityId: string, logoId: string) => Promise<void>;
}

export const useLogoFavorites = (): UseLogoFavoritesReturn => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<LogoFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorites on mount
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_logo_favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setFavorites(
          (data || []).map((row: any) => ({
            id: row.id,
            entityId: row.entity_id,
            entityType: row.entity_type,
            logoId: row.logo_id,
            logoName: row.logo_name,
            logoUrl: row.logo_url,
            logoVariant: row.logo_variant,
            entityName: row.entity_name,
            entitySlug: row.entity_slug,
            createdAt: row.created_at,
          }))
        );
      } catch (error) {
        console.error('[useLogoFavorites] Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // Create a lookup set for fast isFavorite checks
  const favoriteKeys = useMemo(() => {
    return new Set(favorites.map((f) => `${f.entityId}-${f.logoId}`));
  }, [favorites]);

  const isFavorite = useCallback(
    (entityId: string, logoId: string) => {
      return favoriteKeys.has(`${entityId}-${logoId}`);
    },
    [favoriteKeys]
  );

  const toggleFavorite = useCallback(
    async (logo: {
      entityId: string;
      entityType: 'brand' | 'product' | 'event';
      logoId: string;
      logoName: string;
      logoUrl: string;
      logoVariant: string;
      entityName: string;
      entitySlug?: string;
    }) => {
      if (!user) {
        toast.error('Please sign in to save favorites');
        return;
      }

      const key = `${logo.entityId}-${logo.logoId}`;
      const existing = favorites.find((f) => `${f.entityId}-${f.logoId}` === key);

      if (existing) {
        // Remove favorite
        try {
          const { error } = await supabase
            .from('user_logo_favorites')
            .delete()
            .eq('id', existing.id);

          if (error) throw error;

          setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
          toast.success('Removed from favorites');
        } catch (error) {
          console.error('[useLogoFavorites] Error removing favorite:', error);
          toast.error('Failed to remove favorite');
        }
      } else {
        // Add favorite
        try {
          const { data, error } = await supabase
            .from('user_logo_favorites')
            .insert({
              user_id: user.id,
              entity_id: logo.entityId,
              entity_type: logo.entityType,
              logo_id: logo.logoId,
              logo_name: logo.logoName,
              logo_url: logo.logoUrl,
              logo_variant: logo.logoVariant,
              entity_name: logo.entityName,
              entity_slug: logo.entitySlug || null,
            })
            .select()
            .single();

          if (error) throw error;

          const newFavorite: LogoFavorite = {
            id: data.id,
            entityId: data.entity_id,
            entityType: data.entity_type as 'brand' | 'product' | 'event',
            logoId: data.logo_id,
            logoName: data.logo_name,
            logoUrl: data.logo_url,
            logoVariant: data.logo_variant,
            entityName: data.entity_name,
            entitySlug: data.entity_slug,
            createdAt: data.created_at,
          };

          setFavorites((prev) => [newFavorite, ...prev]);
          toast.success('Added to favorites');
        } catch (error) {
          console.error('[useLogoFavorites] Error adding favorite:', error);
          toast.error('Failed to add favorite');
        }
      }
    },
    [user, favorites]
  );

  const removeFavorite = useCallback(
    async (entityId: string, logoId: string) => {
      if (!user) return;

      const existing = favorites.find(
        (f) => f.entityId === entityId && f.logoId === logoId
      );

      if (!existing) return;

      try {
        const { error } = await supabase
          .from('user_logo_favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      } catch (error) {
        console.error('[useLogoFavorites] Error removing favorite:', error);
        toast.error('Failed to remove favorite');
      }
    },
    [user, favorites]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
};
