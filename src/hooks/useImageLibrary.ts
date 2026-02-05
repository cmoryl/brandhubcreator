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
  const { user } = useAuth();
  const [images, setImages] = useState<OrganizationImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Helper to infer category from folder name (hoisted so it can be used inside callbacks safely)
  function inferCategory(folderName: string): ImageCategory {
    const lower = (folderName || '').toLowerCase();
    if (lower.includes('logo')) return 'Logos';
    if (lower.includes('background') || lower.includes('hero')) return 'Backgrounds';
    if (lower.includes('product')) return 'Product Images';
    if (lower.includes('icon')) return 'Icons';
    return 'General';
  }

  const fetchImages = useCallback(async (orgId?: string) => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) return;

    setIsLoading(true);
    try {
      // Fetch from organization_images table (new library)
      const { data: dbImages, error: dbError } = await supabase
        .from('organization_images')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      // Also scan organization-assets bucket for legacy/existing uploads
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('organization-assets')
        .list(targetOrgId, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

      // Convert storage files to OrganizationImage format (that aren't already in DB)
      const existingPaths = new Set((dbImages || []).map((img: any) => img.file_path));
      const legacyImages: OrganizationImage[] = [];

      if (!storageError && storageFiles) {
        // Recursively get files from subdirectories
        for (const item of storageFiles) {
          if (item.id === null) {
            // It's a folder - list its contents
            const { data: folderFiles } = await supabase.storage
              .from('organization-assets')
              .list(`${targetOrgId}/${item.name}`, { limit: 100 });
            
            if (folderFiles) {
              for (const file of folderFiles) {
                if (file.id && file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                  const filePath = `${targetOrgId}/${item.name}/${file.name}`;
                  if (!existingPaths.has(filePath)) {
                    const { data: urlData } = supabase.storage
                      .from('organization-assets')
                      .getPublicUrl(filePath);
                    
                    legacyImages.push({
                      id: `legacy-${file.id}`,
                      organization_id: targetOrgId,
                      name: file.name.replace(/\.[^.]+$/, ''),
                      file_path: filePath,
                      public_url: urlData.publicUrl,
                      category: inferCategory(item.name),
                      file_size_bytes: file.metadata?.size || null,
                      mime_type: file.metadata?.mimetype || null,
                      uploaded_by: null,
                      created_at: file.created_at || new Date().toISOString(),
                      updated_at: file.updated_at || new Date().toISOString(),
                    });
                  }
                }
              }
            }
          } else if (item.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            // It's a file at root level
            const filePath = `${targetOrgId}/${item.name}`;
            if (!existingPaths.has(filePath)) {
              const { data: urlData } = supabase.storage
                .from('organization-assets')
                .getPublicUrl(filePath);
              
              legacyImages.push({
                id: `legacy-${item.id}`,
                organization_id: targetOrgId,
                name: item.name.replace(/\.[^.]+$/, ''),
                file_path: filePath,
                public_url: urlData.publicUrl,
                category: 'General' as ImageCategory,
                file_size_bytes: item.metadata?.size || null,
                mime_type: item.metadata?.mimetype || null,
                uploaded_by: null,
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString(),
              });
            }
          }
        }
      }

      // Combine DB images with legacy storage images
      const allImages = [...(dbImages as unknown as OrganizationImage[] || []), ...legacyImages];
      setImages(allImages);
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

  /**
   * Upload multiple images in batch with progress tracking
   */
  const uploadBatch = useCallback(async (
    files: File[],
    category: ImageCategory = 'General',
    onProgress?: (completed: number, total: number, currentFile: string) => void,
    orgId?: string
  ): Promise<{ successful: OrganizationImage[]; failed: string[] }> => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) {
      toast.error('No organization selected');
      return { successful: [], failed: files.map(f => f.name) };
    }

    setIsUploading(true);
    const successful: OrganizationImage[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(i, files.length, file.name);

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          failed.push(file.name);
          continue;
        }

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

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          failed.push(file.name);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('org-image-library')
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        const imageName = file.name.replace(/\.[^.]+$/, '');

        // Insert record into database
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

        if (insertError) {
          console.error(`Failed to save ${file.name} to database:`, insertError);
          // Clean up storage if DB insert failed
          await supabase.storage.from('org-image-library').remove([filePath]);
          failed.push(file.name);
          continue;
        }

        successful.push(imageRecord as unknown as OrganizationImage);
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        failed.push(file.name);
      }
    }

    // Final progress update
    onProgress?.(files.length, files.length, '');

    // Refresh the list
    await fetchImages(targetOrgId);

    // Show summary toast
    if (successful.length > 0 && failed.length === 0) {
      toast.success(`${successful.length} image${successful.length > 1 ? 's' : ''} uploaded successfully`);
    } else if (successful.length > 0 && failed.length > 0) {
      toast.warning(`${successful.length} uploaded, ${failed.length} failed`);
    } else if (failed.length > 0) {
      toast.error(`Failed to upload ${failed.length} image${failed.length > 1 ? 's' : ''}`);
    }

    setIsUploading(false);
    return { successful, failed };
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
    uploadBatch,
    deleteImage,
    updateImageCategory,
    getImagesByCategory,
  };
};
