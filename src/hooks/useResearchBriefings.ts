import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResearchBriefing {
  id: string;
  entity_id: string;
  entity_type: string;
  organization_id: string | null;
  briefing_type: string;
  title: string;
  summary: string | null;
  market_intelligence: {
    industryTrends: string[];
    marketShifts: string[];
    emergingOpportunities: string[];
  };
  competitive_insights: {
    positioningGaps: string[];
    differentiationOpportunities: string[];
    threatAssessment: string[];
  };
  trend_analysis: {
    risingTrends: string[];
    decliningTrends: string[];
    futureProjections: string[];
  };
  sentiment_signals: {
    positiveIndicators: string[];
    concernAreas: string[];
    neutralObservations: string[];
  };
  strategic_recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    timeframe: string;
  }>;
  growth_opportunities: Array<{
    opportunity: string;
    potentialImpact: string;
    requiredInvestment: string;
  }>;
  risk_alerts: Array<{
    risk: string;
    severity: 'critical' | 'moderate' | 'low';
    mitigation: string;
  }>;
  priority_actions: string[];
  suggested_updates: Array<{
    section: string;
    currentState: string;
    suggestedChange: string;
    reason: string;
  }>;
  confidence_score: number;
  urgency_level: string;
  status: string;
  read_at: string | null;
  actioned_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  created_by: string | null;
}

interface GenerateBriefingParams {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  briefingType?: 'daily' | 'weekly' | 'deep-dive';
  focusAreas?: string[];
}

interface GenerateBriefingResponse {
  success: boolean;
  briefing: ResearchBriefing;
  briefingId: string;
  entityName: string;
  generatedAt: string;
}

export function useResearchBriefings(entityId: string, entityType: 'brand' | 'product' | 'event') {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch briefings for this entity
  const { data: briefings, isLoading, error } = useQuery({
    queryKey: ['research-briefings', entityId, entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_briefings')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as ResearchBriefing[];
    },
    enabled: !!entityId && !!entityType,
  });

  // Get latest briefing
  const latestBriefing = briefings?.[0] || null;

  // Generate new briefing
  const generateBriefing = useCallback(async (params: Omit<GenerateBriefingParams, 'entityId' | 'entityType'> = {}) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('brand-research', {
        body: {
          entityId,
          entityType,
          briefingType: params.briefingType || 'daily',
          focusAreas: params.focusAreas || [],
        },
      });

      if (error) throw error;

      // New async pattern: poll job status
      const jobId = data?.jobId;
      if (!jobId) throw new Error('No job ID returned');

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 90; // 3 minutes
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: job } = await supabase
          .from('brand_intelligence_jobs')
          .select('status, result, error_message')
          .eq('id', jobId)
          .maybeSingle();

        if (job?.status === 'completed') {
          await queryClient.invalidateQueries({ 
            queryKey: ['research-briefings', entityId, entityType] 
          });

          const result = job.result as Record<string, unknown> | null;
          toast.success('Research briefing generated', {
            description: (result?.briefing as Record<string, string>)?.title || 'Briefing ready',
          });

          return { success: true, briefing: result?.briefing, briefingId: result?.briefingId };
        }

        if (job?.status === 'failed') {
          throw new Error(job.error_message || 'Research generation failed');
        }

        attempts++;
      }

      throw new Error('Research generation timed out');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate briefing';
      toast.error('Research failed', { description: message });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [entityId, entityType, queryClient]);

  // Mark briefing as read
  const markAsRead = useMutation({
    mutationFn: async (briefingId: string) => {
      const { error } = await supabase
        .from('research_briefings')
        .update({ 
          status: 'read', 
          read_at: new Date().toISOString() 
        })
        .eq('id', briefingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['research-briefings', entityId, entityType] 
      });
    },
  });

  // Mark briefing as actioned
  const markAsActioned = useMutation({
    mutationFn: async (briefingId: string) => {
      const { error } = await supabase
        .from('research_briefings')
        .update({ 
          status: 'actioned', 
          actioned_at: new Date().toISOString() 
        })
        .eq('id', briefingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['research-briefings', entityId, entityType] 
      });
      toast.success('Briefing marked as actioned');
    },
  });

  // Archive briefing
  const archiveBriefing = useMutation({
    mutationFn: async (briefingId: string) => {
      const { error } = await supabase
        .from('research_briefings')
        .update({ status: 'archived' })
        .eq('id', briefingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['research-briefings', entityId, entityType] 
      });
      toast.success('Briefing archived');
    },
  });

  return {
    briefings,
    latestBriefing,
    isLoading,
    error,
    isGenerating,
    generateBriefing,
    markAsRead: markAsRead.mutate,
    markAsActioned: markAsActioned.mutate,
    archiveBriefing: archiveBriefing.mutate,
  };
}
