/**
 * Utility to convert base64 logo URLs from the global library into
 * persistent cloud storage URLs. This prevents stripBase64FromGuideData
 * from clearing them on save.
 *
 * Used by: EventSponsorsSection, SponsorLogosSection, ClientLogosSection
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'organization-assets';

/**
 * Given a base64 data URL, uploads it to storage and returns the public URL.
 * Returns the original URL if it's already a storage URL or if upload fails.
 */
export async function uploadBase64ToStorage(
  base64Url: string,
  storagePath: string,
): Promise<string> {
  if (!base64Url || !base64Url.startsWith('data:')) return base64Url;

  try {
    const res = await fetch(base64Url);
    const blob = await res.blob();
    const ext = blob.type.includes('svg') ? 'svg' : blob.type.includes('png') ? 'png' : 'jpg';
    const timestamp = Date.now();
    const filePath = `${storagePath}-${timestamp}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, { cacheControl: '3600', upsert: true });

    if (error) {
      console.warn('[convertBase64LogosToStorage] Upload failed:', error.message);
      return base64Url; // fallback
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return `${urlData.publicUrl}?t=${timestamp}`;
  } catch (err) {
    console.warn('[convertBase64LogosToStorage] Error:', err);
    return base64Url;
  }
}

/**
 * Converts all base64 URLs in a ClientLogo files array to storage URLs.
 */
export async function convertLogoFilesToStorage(
  files: Array<{ url: string; variant: string; format: string }>,
  orgId: string,
  entityType: string,
  entityId: string,
  logoName: string,
): Promise<Array<{ url: string; variant: string; format: string }>> {
  const safeName = logoName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  const basePath = `${orgId}/${entityType}s/${entityId}/logo-${safeName}`;

  const converted = await Promise.all(
    files.map(async (file) => {
      if (file.url.startsWith('data:')) {
        const newUrl = await uploadBase64ToStorage(file.url, `${basePath}-${file.variant}`);
        return { ...file, url: newUrl };
      }
      return file;
    })
  );

  return converted;
}
