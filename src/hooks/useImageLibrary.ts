/**
 * useImageLibrary Hook
 * Manages organization image library - upload, fetch, delete images
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ImageCategory = 'Logos' | 'Backgrounds' | 'Product Images' | 'Icons' | 'General';

export interface OrganizationImage {
  id: string;
  organization_id: string;
  name: string;
  file_path: string;
  public_url: string;
  category: ImageCategory;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const IMAGE_CATEGORIES: ImageCategory[] = [
  'Logos',
  'Backgrounds',
  'Product Images',
  'Icons',
  'General',
];

export const useImageLibrary = () => {
  const { organization } = useOrganization();
  const { user, isAdmin } = useAuth();
  const [images, setImages] = useState<OrganizationImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchImages = useCallback(async (orgId?: string) => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_images')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data as unknown as OrganizationImage[]) || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      toast.error('Failed to load image library');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const uploadImage = useCallback(async (
    file: File,
    category: ImageCategory = 'General',
    customName?: string,
    orgId?: string
  ): Promise<OrganizationImage | null> => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) {
      toast.error('No organization selected');
      return null;
    }

    setIsUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${targetOrgId}/${category.toLowerCase().replace(/\s+/g, '-')}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('org-image-library')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('org-image-library')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Insert record into database
      const imageName = customName || file.name.replace(/\.[^.]+$/, '');
      const { data: imageRecord, error: insertError } = await supabase
        .from('organization_images')
        .insert({
          organization_id: targetOrgId,
          name: imageName,
          file_path: filePath,
          public_url: publicUrl,
          category,
          file_size_bytes: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Image "${imageName}" uploaded to library`);
      
      // Refresh the list
      await fetchImages(targetOrgId);
      
      return imageRecord as unknown as OrganizationImage;
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [organization?.id, user?.id, fetchImages]);

  const deleteImage = useCallback(async (image: OrganizationImage): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('org-image-library')
        .remove([image.file_path]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
        // Continue to delete record even if storage fails
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('organization_images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      toast.success(`"${image.name}" deleted`);
      setImages(prev => prev.filter(img => img.id !== image.id));
      return true;
    } catch (err) {
      console.error('Error deleting image:', err);
      toast.error('Failed to delete image');
      return false;
    }
  }, []);

  const updateImageCategory = useCallback(async (
    imageId: string,
    newCategory: ImageCategory
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organization_images')
        .update({ category: newCategory })
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, category: newCategory } : img
      ));
      toast.success('Category updated');
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('Failed to update category');
      return false;
    }
  }, []);

  const getImagesByCategory = useCallback((category: ImageCategory): OrganizationImage[] => {
    return images.filter(img => img.category === category);
  }, [images]);

  return {
    images,
    isLoading,
    isUploading,
    fetchImages,
    uploadImage,
    deleteImage,
    updateImageCategory,
    getImagesByCategory,
  };
};
