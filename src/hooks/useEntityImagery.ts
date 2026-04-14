/**
 * useEntityImagery - Loads and manages approved imagery for a specific entity
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImagerySubSection, ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';

interface UseEntityImageryOptions {
  entityId?: string;
  entityType: 'brand' | 'product' | 'event';
}

const tableMap = { brand: 'brands', product: 'products', event: 'events' } as const;

export const useEntityImagery = ({ entityId, entityType }: UseEntityImageryOptions) => {
  const [sections, setSections] = useState<ApprovedImagerySubSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchImagery = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const table = tableMap[entityType];
      const { data, error } = await supabase
        .from(table)
        .select('guide_data, organization_id')
        .eq('id', entityId)
        .maybeSingle();

      if (error) throw error;
      const gd = (data as any)?.guide_data || {};
      setSections(gd.approvedImagery?.sections || []);
      setOrganizationId((data as any)?.organization_id || null);
    } catch (err) {
      console.error('Error fetching entity imagery:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { fetchImagery(); }, [fetchImagery]);

  const saveImagery = useCallback(async (newSections: ApprovedImagerySubSection[]) => {
    if (!entityId) return;
    try {
      const table = tableMap[entityType];
      // Fetch current guide_data, merge, save
      const { data } = await supabase.from(table).select('guide_data').eq('id', entityId).maybeSingle();
      const currentGuide = (data as any)?.guide_data || {};
      const updated = { ...currentGuide, approvedImagery: { sections: newSections } };
      
      const { error } = await supabase.from(table).update({ guide_data: updated } as any).eq('id', entityId);
      if (error) throw error;
      setSections(newSections);
    } catch (err) {
      console.error('Error saving imagery:', err);
      toast.error('Failed to save imagery changes');
    }
  }, [entityId, entityType]);

  const addImages = useCallback(async (sectionId: string, images: ApprovedImage[]) => {
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      const existingIds = new Set(s.images.map(img => img.id));
      const newImages = images.filter(img => !existingIds.has(img.id));
      return { ...s, images: [...s.images, ...newImages] };
    });
    await saveImagery(updated);
  }, [sections, saveImagery]);

  const removeImage = useCallback(async (sectionId: string, imageId: string) => {
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, images: s.images.filter(img => img.id !== imageId) };
    });
    await saveImagery(updated);
  }, [sections, saveImagery]);

  const addSection = useCallback(async (name: string) => {
    const newSection: ApprovedImagerySubSection = {
      id: crypto.randomUUID(), name, description: '', images: [],
    };
    await saveImagery([...sections, newSection]);
    return newSection.id;
  }, [sections, saveImagery]);

  const removeSection = useCallback(async (sectionId: string) => {
    await saveImagery(sections.filter(s => s.id !== sectionId));
  }, [sections, saveImagery]);

  const copyImagesToEntity = useCallback(async (
    images: ApprovedImage[],
    targetEntityId: string,
    targetEntityType: 'brand' | 'product' | 'event',
    targetSectionName: string,
  ) => {
    try {
      const table = tableMap[targetEntityType];
      const { data } = await supabase.from(table).select('guide_data').eq('id', targetEntityId).maybeSingle();
      const gd = (data as any)?.guide_data || {};
      const existingSections: ApprovedImagerySubSection[] = gd.approvedImagery?.sections || [];
      
      let targetSection = existingSections.find(s => s.name === targetSectionName);
      let updatedSections: ApprovedImagerySubSection[];
      
      if (targetSection) {
        const existingIds = new Set(targetSection.images.map(img => img.id));
        const newImages = images.filter(img => !existingIds.has(img.id));
        updatedSections = existingSections.map(s =>
          s.id === targetSection!.id ? { ...s, images: [...s.images, ...newImages] } : s
        );
      } else {
        const newSection: ApprovedImagerySubSection = {
          id: crypto.randomUUID(), name: targetSectionName, description: '', images,
        };
        updatedSections = [...existingSections, newSection];
      }
      
      const updatedGuide = { ...gd, approvedImagery: { sections: updatedSections } };
      const { error } = await supabase.from(table).update({ guide_data: updatedGuide } as any).eq('id', targetEntityId);
      if (error) throw error;
      toast.success(`Copied ${images.length} image(s) to ${targetSectionName}`);
    } catch (err) {
      console.error('Error copying images:', err);
      toast.error('Failed to copy images');
    }
  }, []);

  return {
    sections, isLoading, organizationId,
    saveImagery, addImages, removeImage, addSection, removeSection,
    copyImagesToEntity, refetch: fetchImagery,
  };
};
