/**
 * useImageryHubEntities - Fetches all brands, products, and events for the Imagery Hub entity picker
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ImageryEntity {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  slug?: string;
  organizationId?: string | null;
  parentBrandId?: string | null;
  parentBrandName?: string | null;
  isSuiteMaster?: boolean;
  coverImage?: string;
  accentColor?: string;
  imageryCount: number;
}

export interface EntityTreeNode extends ImageryEntity {
  children: EntityTreeNode[];
}

export const useImageryHubEntities = () => {
  const { isAdmin } = useAuth();
  const [entities, setEntities] = useState<ImageryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntities = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, name, slug, organization_id, guide_data').order('name'),
        supabase.from('products').select('id, name, slug, organization_id, parent_brand_id, is_suite_master, guide_data').order('name'),
        supabase.from('events').select('id, name, slug, organization_id, parent_brand_id, guide_data').order('name'),
      ]);

      const all: ImageryEntity[] = [];

      (brandsRes.data || []).forEach((b: any) => {
        const gd = b.guide_data || {};
        const sections = gd.approvedImagery?.sections || [];
        const count = sections.reduce((s: number, sec: any) => s + (sec.images?.length || 0), 0);
        all.push({
          id: b.id, name: b.name, type: 'brand', slug: b.slug,
          organizationId: b.organization_id, parentBrandId: null, parentBrandName: null,
          coverImage: gd.hero?.coverImage || gd.hero?.imageUrl,
          accentColor: gd.colors?.[0]?.hex,
          imageryCount: count,
        });
      });

      const brandMap = new Map(all.filter(e => e.type === 'brand').map(b => [b.id, b.name]));

      (productsRes.data || []).forEach((p: any) => {
        const gd = p.guide_data || {};
        const sections = gd.approvedImagery?.sections || [];
        const count = sections.reduce((s: number, sec: any) => s + (sec.images?.length || 0), 0);
        all.push({
          id: p.id, name: p.name, type: 'product', slug: p.slug,
          organizationId: p.organization_id,
          parentBrandId: p.parent_brand_id,
          parentBrandName: brandMap.get(p.parent_brand_id) || null,
          isSuiteMaster: p.is_suite_master,
          coverImage: gd.hero?.coverImage || gd.hero?.imageUrl,
          accentColor: gd.colors?.[0]?.hex,
          imageryCount: count,
        });
      });

      (eventsRes.data || []).forEach((e: any) => {
        const gd = e.guide_data || {};
        const sections = gd.approvedImagery?.sections || [];
        const count = sections.reduce((s: number, sec: any) => s + (sec.images?.length || 0), 0);
        all.push({
          id: e.id, name: e.name, type: 'event', slug: e.slug,
          organizationId: e.organization_id,
          parentBrandId: e.parent_brand_id,
          parentBrandName: brandMap.get(e.parent_brand_id) || null,
          coverImage: gd.hero?.coverImage || gd.hero?.imageUrl,
          accentColor: gd.colors?.[0]?.hex,
          imageryCount: count,
        });
      });

      setEntities(all);
    } catch (err) {
      console.error('Error fetching imagery hub entities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  // Build tree: brands → products/events as children
  const tree: EntityTreeNode[] = entities
    .filter(e => e.type === 'brand')
    .map(brand => ({
      ...brand,
      children: entities
        .filter(e => e.parentBrandId === brand.id)
        .map(child => ({ ...child, children: [] })),
    }));

  // Orphans (no parent brand)
  const orphans: EntityTreeNode[] = entities
    .filter(e => e.type !== 'brand' && !e.parentBrandId)
    .map(e => ({ ...e, children: [] }));

  return { entities, tree: [...tree, ...orphans], isLoading, refetch: fetchEntities };
};
