/**
 * usePresentationTemplates - Hook for managing presentation templates in the database
 * Provides CRUD operations for all document types: presentations, PDFs, design files, cloud folders, external links
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PresentationTemplate, PresentationSlide, PresentationFileType, PresentationCategory } from '@/types/brand';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface DatabasePresentationTemplate {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: string | null;
  file_type: string | null;
  slides: PresentationSlide[];
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  card_image_url: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  is_embedded_folder: boolean | null;
}

// Convert database record to frontend type
const toFrontendTemplate = (record: DatabasePresentationTemplate): PresentationTemplate => ({
  id: record.id,
  name: record.name,
  description: record.description || undefined,
  fileUrl: record.file_url,
  fileName: record.file_name,
  fileSize: record.file_size || undefined,
  fileType: (record.file_type as PresentationFileType) || 'pptx',
  slides: record.slides || [],
  category: (record.category as PresentationCategory) || 'presentations',
  createdAt: record.created_at,
  cardImageUrl: record.card_image_url || undefined,
  thumbnailUrl: record.thumbnail_url || undefined,
  externalUrl: record.external_url || undefined,
  isEmbeddedFolder: record.is_embedded_folder || false,
});

// Query key factory
export const presentationKeys = {
  all: ['presentations'] as const,
  entity: (entityType: string, entityId: string) => 
    [...presentationKeys.all, entityType, entityId] as const,
};

export function usePresentationTemplates(
  entityType: 'brand' | 'product' | 'event',
  entityId: string | undefined
) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  // Fetch presentations for entity
  const { data: presentations = [], isLoading, error } = useQuery({
    queryKey: presentationKeys.entity(entityType, entityId || ''),
    queryFn: async () => {
      if (!entityId) return [];
      
      const { data, error } = await supabase
        .from('presentation_templates')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[usePresentationTemplates] Fetch error:', error);
        throw error;
      }

      // Parse slides from JSON
      return (data || []).map((record: any) => toFrontendTemplate({
        ...record,
        slides: typeof record.slides === 'string' ? JSON.parse(record.slides) : record.slides,
      }));
    },
    enabled: !!entityId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Add presentation mutation
  const addMutation = useMutation({
    mutationFn: async (template: Omit<PresentationTemplate, 'id' | 'createdAt'>) => {
      if (!organization?.id || !entityId) {
        throw new Error('Missing organization or entity ID');
      }

      const { data: session } = await supabase.auth.getSession();
      
      const insertData = {
        organization_id: organization.id,
        entity_type: entityType,
        entity_id: entityId,
        name: template.name,
        description: template.description || null,
        file_url: template.fileUrl,
        file_name: template.fileName,
        file_size: template.fileSize || null,
        file_type: template.fileType || 'pptx',
        slides: template.slides || [],
        category: template.category || 'presentations',
        created_by: session.session?.user?.id || null,
        thumbnail_url: template.thumbnailUrl || null,
        external_url: template.externalUrl || null,
        is_embedded_folder: template.isEmbeddedFolder || false,
      };
      
      const { data, error } = await supabase
        .from('presentation_templates')
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error('[usePresentationTemplates] Insert error:', error);
        throw error;
      }

      return toFrontendTemplate({
        ...data,
        slides: typeof data.slides === 'string' ? JSON.parse(data.slides) : data.slides,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.entity(entityType, entityId || '') });
    },
    onError: (error) => {
      toast.error(`Failed to save presentation: ${error.message}`);
    },
  });

  // Delete presentation mutation
  const deleteMutation = useMutation({
    mutationFn: async (presentationId: string) => {
      const { error } = await supabase
        .from('presentation_templates')
        .delete()
        .eq('id', presentationId);

      if (error) {
        console.error('[usePresentationTemplates] Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.entity(entityType, entityId || '') });
      toast.success('Presentation removed');
    },
    onError: (error) => {
      toast.error(`Failed to delete presentation: ${error.message}`);
    },
  });

  // Update presentation mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PresentationTemplate> }) => {
      // Build update payload – only include fields that are explicitly passed
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.category !== undefined) updateData.category = updates.category || 'presentations';
      if (updates.cardImageUrl !== undefined) updateData.card_image_url = updates.cardImageUrl || null;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl || null;
      if (updates.externalUrl !== undefined) updateData.external_url = updates.externalUrl || null;
      if (updates.isEmbeddedFolder !== undefined) updateData.is_embedded_folder = updates.isEmbeddedFolder || false;
      if (updates.fileType !== undefined) updateData.file_type = updates.fileType || 'pptx';

      const { error } = await supabase
        .from('presentation_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('[usePresentationTemplates] Update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: presentationKeys.entity(entityType, entityId || '') });
    },
    onError: (error) => {
      toast.error(`Failed to update presentation: ${error.message}`);
    },
  });

  return {
    presentations,
    isLoading,
    error,
    addPresentation: addMutation.mutateAsync,
    deletePresentation: deleteMutation.mutateAsync,
    updatePresentation: updateMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
