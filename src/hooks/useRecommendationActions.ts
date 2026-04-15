import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecommendationAction {
  id: string;
  report_id: string;
  entity_id: string;
  entity_type: string;
  organization_id: string | null;
  recommendation_index: number;
  recommendation_title: string;
  recommendation_type: string;
  status: string;
  applied_to_imagery_hub: boolean;
  applied_at: string | null;
  applied_by: string | null;
  notes: string | null;
  created_at: string;
}

interface UseRecommendationActionsOptions {
  reportId?: string;
  entityId: string;
  entityType: string;
  organizationId?: string | null;
}

export function useRecommendationActions({
  reportId,
  entityId,
  entityType,
  organizationId,
}: UseRecommendationActionsOptions) {
  const [actions, setActions] = useState<RecommendationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActions = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('competitive_recommendation_actions')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      if (reportId) {
        query = query.eq('report_id', reportId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActions((data || []) as RecommendationAction[]);
    } catch (err) {
      console.error('Error fetching recommendation actions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [reportId, entityId, entityType]);

  const approveRecommendation = useCallback(async (
    recReportId: string,
    index: number,
    title: string,
    type: string = 'design_priority',
  ) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      const { data, error } = await supabase
        .from('competitive_recommendation_actions')
        .upsert({
          report_id: recReportId,
          entity_id: entityId,
          entity_type: entityType,
          organization_id: organizationId || null,
          recommendation_index: index,
          recommendation_title: title,
          recommendation_type: type,
          status: 'approved',
          applied_to_imagery_hub: true,
          applied_at: new Date().toISOString(),
          applied_by: userId || null,
          created_by: userId || null,
        }, {
          onConflict: 'report_id,recommendation_index,recommendation_type',
        })
        .select()
        .single();

      if (error) throw error;

      // Sync approved recommendation into brand_intelligence knowledge_entries
      try {
        const { data: intel } = await supabase
          .from('brand_intelligence')
          .select('id, knowledge_entries')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .maybeSingle();

        const knowledgeEntry = {
          type: 'competitive_recommendation',
          source: 'competitive_analysis',
          recommendation_type: type,
          title,
          status: 'approved',
          applied_at: new Date().toISOString(),
          report_id: recReportId,
        };

        if (intel) {
          const existing = Array.isArray(intel.knowledge_entries) ? intel.knowledge_entries : [];
          // Avoid duplicates by checking title + type
          const filtered = existing.filter((e: any) =>
            !(e.type === 'competitive_recommendation' && e.title === title && e.recommendation_type === type)
          );
          await supabase
            .from('brand_intelligence')
            .update({
              knowledge_entries: [...filtered, knowledgeEntry] as any,
            })
            .eq('id', intel.id);
        } else if (organizationId) {
          await supabase
            .from('brand_intelligence')
            .insert({
              entity_type: entityType,
              entity_id: entityId,
              organization_id: organizationId,
              knowledge_entries: [knowledgeEntry] as any,
            });
        }
      } catch (syncErr) {
        console.warn('Failed to sync recommendation to brand intelligence:', syncErr);
      }

      setActions(prev => {
        const existing = prev.findIndex(
          a => a.report_id === recReportId && a.recommendation_index === index && a.recommendation_type === type
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data as RecommendationAction;
          return updated;
        }
        return [...prev, data as RecommendationAction];
      });

      toast.success(`"${title}" approved and synced to Brand Intelligence`);
      return data;
    } catch (err) {
      console.error('Error approving recommendation:', err);
      toast.error('Failed to approve recommendation');
      return null;
    }
  }, [entityId, entityType, organizationId]);

  const isUtilized = useCallback((reportIdCheck: string, index: number, type: string = 'design_priority') => {
    return actions.some(
      a => a.report_id === reportIdCheck && a.recommendation_index === index && a.recommendation_type === type && a.applied_to_imagery_hub
    );
  }, [actions]);

  const getAction = useCallback((reportIdCheck: string, index: number, type: string = 'design_priority') => {
    return actions.find(
      a => a.report_id === reportIdCheck && a.recommendation_index === index && a.recommendation_type === type
    ) || null;
  }, [actions]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return {
    actions,
    isLoading,
    approveRecommendation,
    isUtilized,
    getAction,
    refetch: fetchActions,
  };
}
