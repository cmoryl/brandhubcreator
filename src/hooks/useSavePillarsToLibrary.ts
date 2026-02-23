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
      const images = pillarImagesWithLabels.map((pillar) => ({
        source: pillar.url,
        name: `Pillar - ${pillar.label}`,
        category: 'General' as const,
      }));

      const results = await saveMultipleToLibrary(images, 'General', orgId);
      
      if (results.length > 0) {
        setSaved(true);
      }
      
      return results;
    } catch (err) {
      console.error('Failed to save pillars to library:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, saved, saveMultipleToLibrary]);

  return { savePillarsToLibrary, isSaving, saved };
};
