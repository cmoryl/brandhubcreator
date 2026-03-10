/**
 * Hook for managing social asset analyses - triggers AI analysis and polls for results
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SocialAssetAnalysis {
  id: string;
  placement_id: string;
  platform: string;
  format: string;
  image_url: string;
  // Bias
  bias_score: number | null;
  bias_findings: any[];
  representation_analysis: any;
  cultural_sensitivity: any;
  accessibility_findings: any;
  // Compliance
  compliance_score: number | null;
  color_compliance: any;
  logo_compliance: any;
  typography_compliance: any;
  compliance_details: any[];
  // Engagement
  predicted_engagement_rate: number | null;
  predicted_reach: string | null;
  optimal_posting_time: string | null;
  engagement_factors: any[];
  content_quality_score: number | null;
  // Text Content
  text_content_analysis: any;
  text_content_score: number | null;
  // Overall
  overall_score: number | null;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  error_message: string | null;
  analyzed_at: string | null;
}

interface BrandContext {
  name?: string;
  colors?: Array<{ name: string; hex: string; role?: string }>;
  typography?: Array<{ family: string; weight?: string; usage?: string }>;
  archetype?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  logos?: Array<{ url?: string; name?: string }>;
}

export const useSocialAssetAnalysis = (placementId?: string) => {
  const [analysis, setAnalysis] = useState<SocialAssetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch existing analysis for placement
  const fetchAnalysis = useCallback(async () => {
    if (!placementId) return;
    try {
      const { data, error } = await supabase
        .from('social_asset_analyses')
        .select('*')
        .eq('placement_id', placementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setAnalysis(data as unknown as SocialAssetAnalysis);
    } catch (err) {
      logger.storage('Failed to fetch social asset analysis', err);
    }
  }, [placementId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Poll for results when analyzing
  useEffect(() => {
    if (analysis?.status === 'analyzing') {
      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('social_asset_analyses')
          .select('*')
          .eq('id', analysis.id)
          .single();

        if (data) {
          const updated = data as unknown as SocialAssetAnalysis;
          setAnalysis(updated);
          if (updated.status === 'completed' || updated.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setLoading(false);
            if (updated.status === 'completed') {
              toast.success('Asset analysis complete');
            } else {
              toast.error(updated.error_message || 'Analysis failed');
            }
          }
        }
      }, 2500);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [analysis?.status, analysis?.id]);

  // Trigger analysis
  const triggerAnalysis = useCallback(async (params: {
    placement_id: string;
    organization_id: string;
    entity_id: string;
    entity_type: string;
    platform: string;
    format: string;
    image_url: string;
    brand_context?: BrandContext;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-social-asset', {
        body: params,
      });

      if (error) throw error;
      if (data?.id) {
        setAnalysis({
          id: data.id,
          placement_id: params.placement_id,
          platform: params.platform,
          format: params.format,
          image_url: params.image_url,
          status: 'analyzing',
          bias_score: null,
          bias_findings: [],
          representation_analysis: null,
          cultural_sensitivity: null,
          accessibility_findings: null,
          compliance_score: null,
          color_compliance: null,
          logo_compliance: null,
          typography_compliance: null,
          compliance_details: [],
          predicted_engagement_rate: null,
          predicted_reach: null,
          optimal_posting_time: null,
          engagement_factors: [],
          content_quality_score: null,
          overall_score: null,
          error_message: null,
          analyzed_at: null,
        });
      }
    } catch (err: any) {
      setLoading(false);
      logger.storage('Failed to trigger social asset analysis', err);
      toast.error('Failed to start analysis');
    }
  }, []);

  return { analysis, loading, triggerAnalysis, refetch: fetchAnalysis };
};
