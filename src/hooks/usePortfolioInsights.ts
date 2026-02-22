import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PortfolioInsight {
  id: string;
  organization_id: string;
  source_entity_id: string;
  source_entity_type: string;
  source_entity_name: string;
  source_module: string;
  source_scan_id?: string;
  title: string;
  description: string;
  insight_type: string;
  curb_cut_category?: string;
  severity: string;
  applicable_entity_ids: string[];
  applicable_entity_types: string[];
  propagation_status: string;
  propagated_at?: string;
  recommendations: Array<{ action: string; priority: string; effort: string }>;
  confidence_score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function usePortfolioInsights(organizationId?: string) {
  const queryClient = useQueryClient();

  const insightsQuery = useQuery({
    queryKey: ['portfolio-insights', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('portfolio_insights')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PortfolioInsight[];
    },
    enabled: !!organizationId,
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization');
      const { data, error } = await supabase.functions.invoke('portfolio-insights-extractor', {
        body: { organizationId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Extracted ${data?.count || 0} cross-portfolio insights`);
      queryClient.invalidateQueries({ queryKey: ['portfolio-insights', organizationId] });
    },
    onError: (error: Error) => {
      if (error.message?.includes('429')) {
        toast.error('Rate limit reached. Please wait before trying again.');
      } else if (error.message?.includes('402')) {
        toast.error('AI quota exceeded. Please try again later.');
      } else {
        toast.error(`Extraction failed: ${error.message}`);
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ insightId, status, reason }: { insightId: string; status: string; reason?: string }) => {
      const updates: Record<string, unknown> = { propagation_status: status };
      if (status === 'propagated') updates.propagated_at = new Date().toISOString();
      if (status === 'dismissed' && reason) updates.dismissed_reason = reason;
      
      const { error } = await supabase
        .from('portfolio_insights')
        .update(updates)
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-insights', organizationId] });
    },
  });

  return {
    insights: insightsQuery.data || [],
    isLoading: insightsQuery.isLoading,
    isExtracting: extractMutation.isPending,
    extractInsights: extractMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
  };
}

/** Hook for inline entity editor cards - filters insights relevant to a specific entity */
export function useEntityPortfolioInsights(entityId?: string, organizationId?: string) {
  const { insights, isLoading } = usePortfolioInsights(organizationId);
  
  const relevantInsights = insights.filter(i => 
    i.applicable_entity_ids?.includes(entityId || '') ||
    i.source_entity_id === entityId
  );

  return { insights: relevantInsights, isLoading };
}
