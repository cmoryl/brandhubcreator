/**
 * Hook for managing social asset placements - CRUD operations on social_asset_placements table
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SocialAssetPlacement {
  id: string;
  organization_id: string;
  entity_id: string;
  entity_type: string;
  platform: string;
  format: string;
  size_name: string;
  size_width: number;
  size_height: number;
  aspect_ratio: string;
  image_url: string | null;
  thumbnail_url: string | null;
  status: 'empty' | 'draft' | 'approved' | 'archived';
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSocialAssetPlacements = (entityId?: string, entityType?: string) => {
  const { organization } = useOrganization();
  const [placements, setPlacements] = useState<SocialAssetPlacement[]>([]);
  const [loading, setLoading] = useState(false);

  const orgId = organization?.id;

  const fetchPlacements = useCallback(async () => {
    if (!orgId || !entityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_asset_placements')
        .select('*')
        .eq('organization_id', orgId)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType || 'brand')
        .order('platform', { ascending: true })
        .order('format', { ascending: true });

      if (error) throw error;
      setPlacements((data as SocialAssetPlacement[]) || []);
    } catch (err) {
      logger.storage('Failed to fetch social asset placements', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, entityId, entityType]);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const upsertPlacement = useCallback(async (placement: Partial<SocialAssetPlacement> & {
    platform: string;
    format: string;
    size_name: string;
    size_width: number;
    size_height: number;
    aspect_ratio: string;
  }) => {
    if (!orgId || !entityId) return null;

    try {
      // Check if placement already exists
      const existing = placements.find(
        p => p.platform === placement.platform && 
             p.format === placement.format && 
             p.size_name === placement.size_name
      );

      if (existing) {
        const { data, error } = await supabase
          .from('social_asset_placements')
          .update({
            image_url: placement.image_url,
            thumbnail_url: placement.thumbnail_url,
            status: placement.status || 'draft',
            notes: placement.notes,
            approved_by: placement.approved_by,
            approved_at: placement.approved_at,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        await fetchPlacements();
        return data;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('social_asset_placements')
          .insert({
            organization_id: orgId,
            entity_id: entityId,
            entity_type: entityType || 'brand',
            platform: placement.platform,
            format: placement.format,
            size_name: placement.size_name,
            size_width: placement.size_width,
            size_height: placement.size_height,
            aspect_ratio: placement.aspect_ratio,
            image_url: placement.image_url,
            thumbnail_url: placement.thumbnail_url,
            status: placement.status || 'draft',
            notes: placement.notes,
            created_by: userData?.user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        await fetchPlacements();
        return data;
      }
    } catch (err) {
      logger.storage('Failed to upsert social asset placement', err);
      toast.error('Failed to save asset placement');
      return null;
    }
  }, [orgId, entityId, entityType, placements, fetchPlacements]);

  const approvePlacement = useCallback(async (id: string, approverName: string) => {
    try {
      const { error } = await supabase
        .from('social_asset_placements')
        .update({
          status: 'approved',
          approved_by: approverName,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Asset approved');
      await fetchPlacements();
    } catch (err) {
      logger.storage('Failed to approve placement', err);
      toast.error('Failed to approve asset');
    }
  }, [fetchPlacements]);

  const deletePlacement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_asset_placements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPlacements();
    } catch (err) {
      logger.storage('Failed to delete placement', err);
      toast.error('Failed to delete asset');
    }
  }, [fetchPlacements]);

  return {
    placements,
    loading,
    fetchPlacements,
    upsertPlacement,
    approvePlacement,
    deletePlacement,
  };
};
