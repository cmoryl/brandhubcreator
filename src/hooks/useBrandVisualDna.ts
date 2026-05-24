/**
 * useBrandVisualDna — load and train a brand/product/event's visual DNA.
 *
 * - Loads the row from `brand_visual_dna` for the active entity.
 * - Subscribes to realtime updates so training progress arrives without polling.
 * - Exposes `train()` to invoke the `brand-visual-dna` edge function.
 * - Exposes `setAutoTrain()` to toggle the auto-train preference.
 * - Exposes `findSimilar(query, count)` for vector retrieval.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VisualDnaPalette {
  name?: string;
  hex?: string;
  role?: string;
}

export interface VisualDnaProfile {
  palette?: VisualDnaPalette[];
  moods?: string[];
  lighting?: string;
  composition?: string;
  subject_matter?: string[];
  photography_style?: string;
  signature_motifs?: string[];
  do_patterns?: string[];
  dont_patterns?: string[];
  prompt_seed?: string;
}

export interface BrandVisualDnaRow {
  id: string;
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string;
  dna: VisualDnaProfile;
  prompt_seed: string | null;
  source_image_count: number;
  auto_train: boolean;
  last_trained_at: string | null;
  last_training_status: string | null;
  last_training_error: string | null;
  updated_at: string;
}

export interface SimilarImage {
  id: string;
  image_id: string;
  image_url: string;
  caption: string | null;
  tags: string[] | null;
  section_id: string | null;
  similarity: number;
}

interface Options {
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  organizationId?: string | null;
}

export const useBrandVisualDna = ({ entityId, entityType, organizationId }: Options) => {
  const [row, setRow] = useState<BrandVisualDnaRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);

  const fetchRow = useCallback(async () => {
    if (!entityId || !entityType) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_visual_dna')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();
      if (error) throw error;
      setRow((data as BrandVisualDnaRow | null) ?? null);
    } catch (err) {
      console.error('[useBrandVisualDna] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => { void fetchRow(); }, [fetchRow]);

  // Realtime — refetch on any change to this entity's DNA row.
  useEffect(() => {
    if (!entityId || !entityType) return;
    const channel = supabase
      .channel(`visual-dna-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_visual_dna',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          void fetchRow();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [entityId, entityType, fetchRow]);

  const isRunning = row?.last_training_status === 'running' || training;

  const train = useCallback(async () => {
    if (!entityId || !entityType) return;
    setTraining(true);
    try {
      const { error } = await supabase.functions.invoke('brand-visual-dna', {
        body: { entityId, entityType, organizationId },
      });
      if (error) throw error;
      toast.success('Training started', {
        description: 'The brand brain is learning from your approved imagery.',
      });
      // Optimistic status row so UI flips into "running" immediately.
      setRow((prev) =>
        prev
          ? { ...prev, last_training_status: 'running', last_training_error: null }
          : prev,
      );
    } catch (err) {
      console.error('[useBrandVisualDna] train failed:', err);
      toast.error('Could not start training');
    } finally {
      setTraining(false);
    }
  }, [entityId, entityType, organizationId]);

  const setAutoTrain = useCallback(
    async (enabled: boolean) => {
      if (!entityId || !entityType || !organizationId) return;
      try {
        const { error } = await supabase
          .from('brand_visual_dna')
          .upsert(
            {
              entity_id: entityId,
              entity_type: entityType,
              organization_id: organizationId,
              auto_train: enabled,
            },
            { onConflict: 'entity_id,entity_type' },
          );
        if (error) throw error;
        setRow((prev) =>
          prev
            ? { ...prev, auto_train: enabled }
            : ({
                id: '',
                entity_id: entityId,
                entity_type: entityType,
                organization_id: organizationId,
                dna: {},
                prompt_seed: null,
                source_image_count: 0,
                auto_train: enabled,
                last_trained_at: null,
                last_training_status: null,
                last_training_error: null,
                updated_at: new Date().toISOString(),
              } as BrandVisualDnaRow),
        );
      } catch (err) {
        console.error('[useBrandVisualDna] auto-train toggle failed:', err);
        toast.error('Could not update auto-train preference');
      }
    },
    [entityId, entityType, organizationId],
  );

  const findSimilar = useCallback(
    async (query: string, count = 12): Promise<SimilarImage[]> => {
      if (!entityId || !entityType || !query.trim()) return [];
      try {
        const { data, error } = await supabase.functions.invoke('brand-imagery-similar', {
          body: { entityId, entityType, query, matchCount: count },
        });
        if (error) throw error;
        return (data?.matches ?? []) as SimilarImage[];
      } catch (err) {
        console.error('[useBrandVisualDna] findSimilar failed:', err);
        toast.error('Similarity search failed');
        return [];
      }
    },
    [entityId, entityType],
  );

  return useMemo(
    () => ({
      row,
      dna: row?.dna ?? null,
      promptSeed: row?.prompt_seed ?? null,
      sourceImageCount: row?.source_image_count ?? 0,
      autoTrain: row?.auto_train ?? false,
      lastTrainedAt: row?.last_trained_at ?? null,
      status: row?.last_training_status ?? null,
      error: row?.last_training_error ?? null,
      isRunning,
      loading,
      train,
      setAutoTrain,
      findSimilar,
      refetch: fetchRow,
    }),
    [row, isRunning, loading, train, setAutoTrain, findSimilar, fetchRow],
  );
};
