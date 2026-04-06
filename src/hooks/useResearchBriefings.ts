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
  cross_entity_insights: Record<string, unknown> | null;
  knowledge_extracted: boolean;
}

export interface ResearchSchedule {
  id: string;
  entity_id: string;
  entity_type: string;
  organization_id: string | null;
  cadence: 'weekly' | 'biweekly' | 'monthly';
  briefing_type: 'daily' | 'weekly' | 'deep-dive';
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
  created_by: string | null;
}

export interface ExternalSource {
  id: string;
  entity_id: string;
  entity_type: string;
  url: string;
  title: string;
  source_type: 'url' | 'rss';
  last_fetched_at: string | null;
  is_active: boolean;
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
        } as any)
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
        } as any)
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
        .update({ status: 'archived' } as any)
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

/**
 * Hook for managing research schedules
 */
export function useResearchSchedules(organizationId: string | null) {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['research-schedules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('research_schedules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ResearchSchedule[];
    },
    enabled: !!organizationId,
  });

  const upsertSchedule = useMutation({
    mutationFn: async (params: {
      entityId: string;
      entityType: 'brand' | 'product' | 'event';
      cadence: 'weekly' | 'biweekly' | 'monthly';
      briefingType: 'daily' | 'weekly' | 'deep-dive';
      isActive: boolean;
    }) => {
      const nextRun = new Date();
      switch (params.cadence) {
        case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
        case 'biweekly': nextRun.setDate(nextRun.getDate() + 14); break;
        case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
      }

      const { error } = await supabase
        .from('research_schedules')
        .upsert({
          entity_id: params.entityId,
          entity_type: params.entityType,
          organization_id: organizationId,
          cadence: params.cadence,
          briefing_type: params.briefingType,
          next_run_at: nextRun.toISOString(),
          is_active: params.isActive,
        } as any, { onConflict: 'entity_id,entity_type' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-schedules', organizationId] });
      toast.success('Schedule updated');
    },
    onError: (err: Error) => {
      toast.error('Failed to update schedule', { description: err.message });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('research_schedules')
        .delete()
        .eq('id', scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-schedules', organizationId] });
      toast.success('Schedule removed');
    },
  });

  return {
    schedules,
    isLoading,
    upsertSchedule: upsertSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,
  };
}

/**
 * Hook for managing external research sources
 */
export function useExternalSources(entityId: string, entityType: string) {
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery({
    queryKey: ['research-external-sources', entityId, entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('research_external_sources')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ExternalSource[];
    },
    enabled: !!entityId && !!entityType,
  });

  const addSource = useMutation({
    mutationFn: async (params: { url: string; title: string; sourceType: 'url' | 'rss'; organizationId?: string }) => {
      const { error } = await supabase
        .from('research_external_sources')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          url: params.url,
          title: params.title,
          source_type: params.sourceType,
          organization_id: params.organizationId || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-external-sources', entityId, entityType] });
      toast.success('Source added');
    },
    onError: (err: Error) => {
      toast.error('Failed to add source', { description: err.message });
    },
  });

  const removeSource = useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await supabase
        .from('research_external_sources')
        .delete()
        .eq('id', sourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-external-sources', entityId, entityType] });
      toast.success('Source removed');
    },
  });

  return {
    sources,
    isLoading,
    addSource: addSource.mutate,
    removeSource: removeSource.mutate,
  };
}
