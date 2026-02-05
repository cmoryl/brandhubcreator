/**
 * useSaveToLibrary Hook
 * Saves generated or uploaded images to the organization image library
 * for easy reuse across the build
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCategory } from './useImageLibrary';

interface SaveToLibraryResult {
  id: string;
  publicUrl: string;
  filePath: string;
}

export const useSaveToLibrary = () => {
  const { organization } = useOrganization();
  const { user } = useAuth();

  /**
   * Convert base64 data URL to Blob
   */
  const base64ToBlob = (dataUrl: string): Blob | null => {
    try {
      const parts = dataUrl.split(',');
      if (parts.length !== 2) return null;
      
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const byteString = atob(parts[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      
      return new Blob([uint8Array], { type: mimeType });
    } catch (err) {
      console.error('Failed to convert base64 to blob:', err);
      return null;
    }
  };

  /**
   * Save an image (base64 or URL) to the organization image library
   */
  const saveToLibrary = useCallback(async (
    imageSource: string,
    name: string,
    category: ImageCategory = 'General',
    orgId?: string
  ): Promise<SaveToLibraryResult | null> => {
    const targetOrgId = orgId || organization?.id;
    if (!targetOrgId) {
      console.error('No organization ID available');
      return null;
    }

    try {
      let blob: Blob | null = null;
      let mimeType = 'image/png';
      
      // Check if it's a base64 data URL
      if (imageSource.startsWith('data:')) {
        blob = base64ToBlob(imageSource);
        const mimeMatch = imageSource.match(/data:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
      } else if (imageSource.startsWith('http')) {
        // Fetch from URL
        try {
          const response = await fetch(imageSource);
          blob = await response.blob();
          mimeType = blob.type || 'image/png';
        } catch (err) {
          console.error('Failed to fetch image from URL:', err);
          return null;
        }
      }

      if (!blob) {
        console.error('Could not process image source');
        return null;
      }

      // Generate unique file path
      const fileExt = mimeType.split('/')[1] || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const categoryFolder = category.toLowerCase().replace(/\s+/g, '-');
      const filePath = `${targetOrgId}/${categoryFolder}/${fileName}`;

      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('org-image-library')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('org-image-library')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Insert record into organization_images table
      const { data: imageRecord, error: insertError } = await supabase
        .from('organization_images')
        .insert({
          organization_id: targetOrgId,
          name: name,
          file_path: filePath,
          public_url: publicUrl,
          category,
          file_size_bytes: blob.size,
          mime_type: mimeType,
          uploaded_by: user?.id || null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        // Clean up storage if DB insert failed
        await supabase.storage.from('org-image-library').remove([filePath]);
        return null;
      }

      return {
        id: imageRecord.id,
        publicUrl,
        filePath,
      };
    } catch (err) {
      console.error('Error saving to library:', err);
      return null;
    }
  }, [organization?.id, user?.id]);

  /**
   * Save multiple images to the library in batch
   */
  const saveMultipleToLibrary = useCallback(async (
    images: Array<{ source: string; name: string; category?: ImageCategory }>,
    defaultCategory: ImageCategory = 'General',
    orgId?: string
  ): Promise<SaveToLibraryResult[]> => {
    const results: SaveToLibraryResult[] = [];
    
    for (const image of images) {
      const result = await saveToLibrary(
        image.source,
        image.name,
        image.category || defaultCategory,
        orgId
      );
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [saveToLibrary]);

  return {
    saveToLibrary,
    saveMultipleToLibrary,
    base64ToBlob,
  };
};
