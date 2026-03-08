/**
 * useSavePillarsToLibrary Hook
 * Saves all 8 philosophical pillar images to the organization image library
 * on first invocation, skipping if already saved.
 */

import { useCallback, useState } from 'react';
import { useSaveToLibrary } from './useSaveToLibrary';
import { pillarImagesWithLabels } from '@/assets/pillars';

export const useSavePillarsToLibrary = () => {
  const { saveMultipleToLibrary } = useSaveToLibrary();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const savePillarsToLibrary = useCallback(async (orgId?: string) => {
    if (isSaving || saved) return;
    setIsSaving(true);

    try {
      // Pillar URLs are Vite asset imports (relative paths like /assets/xxx.jpg)
      // Filter out any that can't be processed as valid image sources
      const images = pillarImagesWithLabels
        .filter((pillar) => pillar.url && typeof pillar.url === 'string' && pillar.url.length > 0)
        .map((pillar) => ({
          source: pillar.url,
          name: `Pillar - ${pillar.label}`,
          category: 'General' as const,
        }));

      if (images.length === 0) return;

      const results = await saveMultipleToLibrary(images, 'General', orgId);
      
      if (results.length > 0) {
        setSaved(true);
      }
      
      return results;
    } catch {
      // Silently handle — pillar library save is non-critical
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, saved, saveMultipleToLibrary]);

  return { savePillarsToLibrary, isSaving, saved };
};
