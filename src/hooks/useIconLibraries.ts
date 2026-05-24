/**
 * useIconLibraries - Hook for managing organization icon libraries
 * Supports 3-level hierarchy: Core → Product Line → Brand
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import { logActivity } from '@/lib/auditLog';
import { logger } from '@/lib/logger';

export interface IconLibrary {
  id: string;
  organization_id: string;
  name: string;
  level: 'core' | 'product_line' | 'brand';
  description: string | null;
  icons: BrandIconography[];
  parent_library_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface IconLibraryInsert {
  organization_id: string;
  name: string;
  level: 'core' | 'product_line' | 'brand';
  description?: string;
  icons?: BrandIconography[];
  parent_library_id?: string | null;
  is_active?: boolean;
  display_order?: number;
}

interface IconLibraryUpdate {
  name?: string;
  description?: string;
  icons?: BrandIconography[];
  is_active?: boolean;
  display_order?: number;
  parent_library_id?: string | null;
}

export const useIconLibraries = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: libraries = [], isLoading, error } = useQuery({
    queryKey: ['icon-libraries', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      // Explicit cap: each row carries a large `icons` JSONB. We cap at 500
      // rows to stay well below Supabase's default 1000-row implicit limit and
      // keep payloads predictable. If an org outgrows this we'll move to paged
      // fetching keyed by level.
      const { data, error } = await supabase
        .from('organization_icon_libraries')
        .select('*')
        .eq('organization_id', organizationId)
        .order('level')
        .order('display_order')
        .order('updated_at', { ascending: false })
        .range(0, 499);

      if (error) throw error;
      
      // Parse icons from JSONB
      return (data || []).map(lib => ({
        ...lib,
        icons: (lib.icons as unknown as BrandIconography[]) || [],
      })) as IconLibrary[];
    },
    enabled: !!organizationId,
    // The icons column is a large JSONB (hundreds of SVG paths per library).
    // Cache aggressively so navigating across the Icon Studio doesn't refetch MBs each time.
    // Mutations invalidate ['icon-libraries', organizationId] explicitly.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createLibrary = useMutation({
    mutationFn: async (library: IconLibraryInsert) => {
      const { data, error } = await supabase
        .from('organization_icon_libraries')
        .insert({
          ...library,
          icons: JSON.parse(JSON.stringify(library.icons || [])),
          parent_library_id: library.parent_library_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['icon-libraries', organizationId] });
      toast.success('Icon library created');
      void logActivity({
        entityType: 'icon_library',
        entityId: data?.id,
        entityName: data?.name,
        actionType: 'create',
        organizationId,
        details: { level: data?.level, iconCount: Array.isArray(data?.icons) ? (data.icons as unknown[]).length : 0 },
      });
    },
    onError: (error) => {
      logger.debug('Failed to create icon library', error);
      toast.error('Failed to create icon library');
    },
  });

  const updateLibrary = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: IconLibraryUpdate }) => {
      const payload: Record<string, unknown> = { ...updates };
      if (updates.icons) {
        payload.icons = JSON.parse(JSON.stringify(updates.icons));
      }
      
      const { data, error } = await supabase
        .from('organization_icon_libraries')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['icon-libraries', organizationId] });
      toast.success('Icon library updated');
      void logActivity({
        entityType: 'icon_library',
        entityId: data?.id,
        entityName: data?.name,
        actionType: 'update',
        organizationId,
        details: { changedFields: Object.keys(vars.updates) },
      });
    },
    onError: (error) => {
      logger.debug('Failed to update icon library', error);
      toast.error('Failed to update icon library');
    },
  });

  const deleteLibrary = useMutation({
    mutationFn: async (id: string) => {
      const target = libraries.find((l) => l.id === id);
      const { error } = await supabase
        .from('organization_icon_libraries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name: target?.name, level: target?.level };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['icon-libraries', organizationId] });
      toast.success('Icon library deleted');
      void logActivity({
        entityType: 'icon_library',
        entityId: result.id,
        entityName: result.name,
        actionType: 'delete',
        organizationId,
        details: { level: result.level },
      });
    },
    onError: (error) => {
      logger.debug('Failed to delete icon library', error);
      toast.error('Failed to delete icon library');
    },
  });

  // Get libraries grouped by level, sorted by display_order
  const coreLibraries = libraries
    .filter(l => l.level === 'core' && l.is_active)
    .sort((a, b) => a.display_order - b.display_order);
  const productLineLibraries = libraries
    .filter(l => l.level === 'product_line' && l.is_active)
    .sort((a, b) => a.display_order - b.display_order);
  const brandLibraries = libraries
    .filter(l => l.level === 'brand' && l.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Get all inherited icons for a brand (core + product line)
  const getInheritedIcons = (productLineId?: string) => {
    const inherited: { library: IconLibrary; icons: BrandIconography[] }[] = [];
    
    // Add all core icons
    coreLibraries.forEach(lib => {
      if (lib.icons.length > 0) {
        inherited.push({ library: lib, icons: lib.icons });
      }
    });
    
    // Add product line icons if specified
    if (productLineId) {
      const productLib = productLineLibraries.find(l => l.id === productLineId);
      if (productLib && productLib.icons.length > 0) {
        inherited.push({ library: productLib, icons: productLib.icons });
      }
    } else {
      // Add all product line icons
      productLineLibraries.forEach(lib => {
        if (lib.icons.length > 0) {
          inherited.push({ library: lib, icons: lib.icons });
        }
      });
    }
    
    return inherited;
  };

  return {
    libraries,
    coreLibraries,
    productLineLibraries,
    brandLibraries,
    isLoading,
    error,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    getInheritedIcons,
  };
};
