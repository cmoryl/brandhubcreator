/**
 * Hook for uploading files to Supabase Storage
 * Uses the organization-assets bucket for public asset storage
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

const BUCKET_NAME = 'organization-assets';

interface UploadResult {
  url: string;
  path: string;
}

interface UseStorageUploadOptions {
  /** Entity type for folder organization (brand, event, product) */
  entityType: 'brand' | 'event' | 'product';
  /** Entity ID for folder organization */
  entityId?: string;
}

export const useStorageUpload = ({ entityType, entityId }: UseStorageUploadOptions) => {
  const { organization } = useOrganization();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Upload a file to Supabase Storage
   * @param file The file to upload
   * @param fileType Type of file for folder organization (hero, logo, etc.)
   * @returns The public URL of the uploaded file
   */
  const uploadFile = useCallback(async (
    file: File,
    fileType: 'hero' | 'logo' | 'cover' | 'asset' | 'award',
    customFileName?: string
  ): Promise<UploadResult | null> => {
    if (!organization?.id) {
      toast.error('Organization not found. Please try again.');
      return null;
    }

    if (!entityId) {
      toast.error('Entity ID not provided. Please save first.');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique filename with timestamp to avoid cache issues
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = customFileName 
        ? `${customFileName}-${timestamp}.${fileExt}`
        : `${fileType}-${timestamp}.${fileExt}`;
      
      // Path structure: orgId/entityType/entityId/fileName
      const filePath = `${organization.id}/${entityType}s/${entityId}/${fileName}`;

      // Check if there's an existing file of this type and delete it
      const folderPath = `${organization.id}/${entityType}s/${entityId}`;
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath);

      if (existingFiles) {
        const oldFiles = existingFiles.filter(f => f.name.startsWith(`${fileType}-`));
        if (oldFiles.length > 0) {
          const pathsToDelete = oldFiles.map(f => `${folderPath}/${f.name}`);
          await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
        }
      }

      setUploadProgress(30);

      // Upload the new file
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('[useStorageUpload] Upload error:', error);
        toast.error(`Failed to upload: ${error.message}`);
        return null;
      }

      setUploadProgress(80);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      setUploadProgress(100);

      // Add cache-busting query param
      const publicUrl = `${urlData.publicUrl}?t=${timestamp}`;

      toast.success('Image uploaded successfully');
      
      return {
        url: publicUrl,
        path: filePath,
      };
    } catch (err) {
      console.error('[useStorageUpload] Unexpected error:', err);
      toast.error('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [organization?.id, entityType, entityId]);

  /**
   * Delete a file from storage by its URL
   */
  const deleteFile = useCallback(async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract the path from the URL
      const urlObj = new URL(fileUrl);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
      
      if (!pathMatch) {
        console.warn('[useStorageUpload] Could not extract path from URL:', fileUrl);
        return false;
      }

      const filePath = pathMatch[1].split('?')[0]; // Remove query params

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('[useStorageUpload] Delete error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[useStorageUpload] Delete failed:', err);
      return false;
    }
  }, []);

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress,
  };
};
