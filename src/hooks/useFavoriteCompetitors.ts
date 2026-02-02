import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FavoriteCompetitor {
  id: string;
  name: string;
  competitor_type: 'direct' | 'indirect' | 'emerging';
  reason: string | null;
  industry: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
}

interface UseFavoriteCompetitorsOptions {
  organizationId?: string | null;
}

export function useFavoriteCompetitors({ organizationId }: UseFavoriteCompetitorsOptions = {}) {
  const [favorites, setFavorites] = useState<FavoriteCompetitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      let query = supabase
        .from('favorite_competitors')
        .select('*')
        .order('name', { ascending: true });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFavorites((data || []) as FavoriteCompetitor[]);
    } catch (error) {
      console.error('Error fetching favorite competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (competitor: {
    name: string;
    competitor_type?: 'direct' | 'indirect' | 'emerging';
    reason?: string;
    industry?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save favorites');
        return null;
      }

      const { data, error } = await supabase
        .from('favorite_competitors')
        .insert({
          name: competitor.name,
          competitor_type: competitor.competitor_type || 'direct',
          reason: competitor.reason || null,
          industry: competitor.industry || null,
          organization_id: organizationId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This competitor is already in your favorites');
          return null;
        }
        throw error;
      }

      setFavorites(prev => [...prev, data as FavoriteCompetitor]);
      toast.success(`${competitor.name} added to favorites`);
      return data as FavoriteCompetitor;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('Failed to add favorite');
      return null;
    }
  };

  const addMultipleFavorites = async (competitors: Array<{
    name: string;
    competitor_type?: 'direct' | 'indirect' | 'emerging';
    reason?: string;
    industry?: string;
  }>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save favorites');
        return [];
      }

      const inserts = competitors.map(c => ({
        name: c.name,
        competitor_type: c.competitor_type || 'direct',
        reason: c.reason || null,
        industry: c.industry || null,
        organization_id: organizationId || null,
        created_by: user.id,
      }));

      const { data, error } = await supabase
        .from('favorite_competitors')
        .upsert(inserts, { onConflict: 'organization_id,name', ignoreDuplicates: true })
        .select();

      if (error) throw error;

      const added = (data || []) as FavoriteCompetitor[];
      if (added.length > 0) {
        setFavorites(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...added.filter(a => !existing.has(a.id))];
        });
        toast.success(`${added.length} competitor(s) saved to favorites`);
      }
      return added;
    } catch (error) {
      console.error('Error adding favorites:', error);
      toast.error('Failed to save favorites');
      return [];
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_competitors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== id));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const isFavorite = useCallback((name: string) => {
    return favorites.some(f => f.name.toLowerCase() === name.toLowerCase());
  }, [favorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    addMultipleFavorites,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
