/**
 * Imagery Preference Learning Hook
 * Tracks approved/skipped/removed image interactions and manages Visual DNA
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface VisualDNADataSources {
  interaction_signals: number;
  vault_assets: number;
  approved_imagery: number;
  brand_colors: number;
  collateral_items: number;
  logos: number;
  patterns: number;
  gradients: number;
  has_visual_analysis: boolean;
  has_inclusive_assessment: boolean;
}

export interface VisualDNA {
  preferred_categories: Array<{ name: string; weight: number; reason?: string }>;
  preferred_colors: Array<{ color: string; weight: number }>;
  preferred_styles: Array<{ style: string; weight: number }>;
  preferred_compositions: Array<{ type: string; preference: string }>;
  mood_keywords: string[];
  avoid_keywords: string[];
  approval_patterns: {
    summary?: string;
    top_themes?: string[];
    rejection_reasons?: string[];
    style_preference?: string;
    diversity_inclination?: string;
  };
  total_approved: number;
  total_skipped: number;
  total_removed: number;
  confidence_score: number;
  last_analyzed_at: string | null;
  data_sources?: VisualDNADataSources;
}

interface SignalEntry {
  imageId: string;
  action: 'approved' | 'skipped' | 'removed';
  imageMetadata?: Record<string, unknown>;
  searchContext?: Record<string, unknown>;
  sectionName?: string;
}

// Auto-analyze threshold: after N new signals, trigger analysis
const AUTO_ANALYZE_THRESHOLD = 10;

export function useImageryPreferenceLearning(
  entityId: string | undefined,
  entityType: string = 'brand',
  organizationId: string | null | undefined
) {
  const [visualDna, setVisualDna] = useState<VisualDNA | null>(null);
  const [signalCount, setSignalCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pendingSignalsRef = useRef<SignalEntry[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newSignalsSinceAnalysisRef = useRef(0);

  // Fetch Visual DNA on mount
  useEffect(() => {
    if (entityId) {
      fetchVisualDna();
    }
    return () => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    };
  }, [entityId, entityType]);

  const fetchVisualDna = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shutterstock-learn', {
        body: { action: 'get_dna', entityId, entityType, organizationId },
      });
      if (error) throw error;
      if (data?.visual_dna) {
        setVisualDna(data.visual_dna as VisualDNA);
      }
      setSignalCount(data?.signal_count || 0);
    } catch (err) {
      logger.sync('ImageryPreference: Failed to fetch Visual DNA');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, organizationId]);

  // Record a single signal (debounced batch)
  const recordSignal = useCallback((signal: SignalEntry) => {
    pendingSignalsRef.current.push(signal);
    newSignalsSinceAnalysisRef.current++;

    // Debounce flush
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = setTimeout(() => {
      flushSignals();
    }, 2000);
  }, []);

  // Flush pending signals to backend
  const flushSignals = useCallback(async () => {
    if (!entityId || pendingSignalsRef.current.length === 0) return;

    const signals = [...pendingSignalsRef.current];
    pendingSignalsRef.current = [];

    try {
      const { error } = await supabase.functions.invoke('shutterstock-learn', {
        body: {
          action: 'record_batch',
          entityId,
          entityType,
          organizationId,
          signals: signals.map(s => ({
            imageId: s.imageId,
            action: s.action,
            imageMetadata: s.imageMetadata,
            searchContext: s.searchContext,
            sectionName: s.sectionName,
          })),
        },
      });
      if (error) throw error;
      setSignalCount(prev => prev + signals.length);
      logger.sync(`ImageryPreference: Flushed ${signals.length} signals`);

      // Auto-trigger analysis if threshold reached
      if (newSignalsSinceAnalysisRef.current >= AUTO_ANALYZE_THRESHOLD) {
        analyzePreferences();
        newSignalsSinceAnalysisRef.current = 0;
      }
    } catch (err) {
      // Re-queue failed signals
      pendingSignalsRef.current = [...signals, ...pendingSignalsRef.current];
      logger.sync('ImageryPreference: Failed to flush signals');
    }
  }, [entityId, entityType, organizationId]);

  // Trigger AI analysis of preferences
  const analyzePreferences = useCallback(async () => {
    if (!entityId) return;
    setIsAnalyzing(true);
    try {
      // Flush any pending signals first
      await flushSignals();

      const { data, error } = await supabase.functions.invoke('shutterstock-learn', {
        body: { action: 'analyze', entityId, entityType, organizationId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limited. Please try again shortly.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Add credits to continue.');
        } else {
          toast.error(data.error);
        }
        return;
      }
      if (data?.visual_dna) {
        setVisualDna(data.visual_dna as VisualDNA);
        toast.success('Visual preferences analyzed!');
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (err) {
      logger.sync('ImageryPreference: Analysis failed');
      toast.error('Failed to analyze preferences');
    } finally {
      setIsAnalyzing(false);
    }
  }, [entityId, entityType, organizationId, flushSignals]);

  // Convenience: record approved images
  const recordApproved = useCallback((images: Array<{
    id: string;
    description?: string;
    categories?: string[];
    media_type?: string;
    width?: number;
    height?: number;
  }>, searchContext?: Record<string, unknown>, sectionName?: string) => {
    for (const img of images) {
      recordSignal({
        imageId: img.id,
        action: 'approved',
        imageMetadata: {
          description: img.description,
          categories: img.categories,
          media_type: img.media_type,
          width: img.width,
          height: img.height,
        },
        searchContext,
        sectionName,
      });
    }
  }, [recordSignal]);

  // Record skipped images (shown but not selected)
  const recordSkipped = useCallback((images: Array<{
    id: string;
    description?: string;
    categories?: string[];
    media_type?: string;
  }>, searchContext?: Record<string, unknown>) => {
    for (const img of images) {
      recordSignal({
        imageId: img.id,
        action: 'skipped',
        imageMetadata: {
          description: img.description,
          categories: img.categories,
          media_type: img.media_type,
        },
        searchContext,
      });
    }
  }, [recordSignal]);

  // Record removed image
  const recordRemoved = useCallback((imageId: string, metadata?: Record<string, unknown>) => {
    recordSignal({
      imageId,
      action: 'removed',
      imageMetadata: metadata,
    });
  }, [recordSignal]);

  return {
    visualDna,
    signalCount,
    isAnalyzing,
    isLoading,
    recordApproved,
    recordSkipped,
    recordRemoved,
    analyzePreferences,
    fetchVisualDna,
  };
}
