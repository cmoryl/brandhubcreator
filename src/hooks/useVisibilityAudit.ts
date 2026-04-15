/**
 * useVisibilityAudit — Hook for brand visibility gap analysis
 * Submits audit jobs and polls for results
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VisibilityAudit {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  organization_id: string | null;
  status: string;
  overall_visibility_score: number | null;
  search_visibility_score: number | null;
  ai_platform_score: number | null;
  social_media_score: number | null;
  search_analysis: any;
  ai_platform_analysis: any;
  social_media_analysis: any;
  visibility_gaps: any[];
  recommendations: any[];
  websites_analyzed: string[];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface UseVisibilityAuditOptions {
  entityId: string | undefined;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string | null;
}

export function useVisibilityAudit({
  entityId,
  entityType,
  entityName,
  organizationId,
}: UseVisibilityAuditOptions) {
  const [audit, setAudit] = useState<VisibilityAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Fetch latest audit for this entity
  const fetchLatest = useCallback(async () => {
    if (!entityId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brand_visibility_audits')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const a = data as unknown as VisibilityAudit;
        setAudit(a);

        // Resume polling if still processing
        if (a.status === 'processing' || a.status === 'pending') {
          setIsAnalyzing(true);
          startPolling(a.id);
        }
      }
    } catch (err) {
      console.error('[useVisibilityAudit] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const startPolling = useCallback((auditId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('brand_visibility_audits')
          .select('*')
          .eq('id', auditId)
          .maybeSingle();

        if (error || !data) return;

        const a = data as unknown as VisibilityAudit;
        setAudit(a);

        if (a.status === 'completed') {
          setIsAnalyzing(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.success('Visibility audit complete!');
        } else if (a.status === 'failed') {
          setIsAnalyzing(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.error(a.error_message || 'Visibility audit failed');
        }
      } catch {
        // continue polling
      }
    }, 3000);
  }, []);

  const runAudit = useCallback(async (websites?: string[], socialProfiles?: string[]) => {
    if (!entityId) {
      toast.error('No entity selected');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('brand-visibility-audit', {
        body: {
          entityId,
          entityType,
          entityName,
          organizationId: organizationId || null,
          websites: websites || [],
          socialProfiles: socialProfiles || [],
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.info('Visibility audit started...');
      startPolling(data.audit_id);
    } catch (err) {
      console.error('[useVisibilityAudit] run error:', err);
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'Failed to start audit';
      if (msg.includes('Rate limit') || msg.includes('429')) {
        toast.error('Rate limit reached', { description: 'Please wait a moment and try again.' });
      } else if (msg.includes('credits') || msg.includes('402')) {
        toast.error('AI credits exhausted', { description: 'Add credits in Settings → Workspace → Usage.' });
      } else {
        toast.error('Audit failed', { description: msg });
      }
    }
  }, [entityId, entityType, entityName, organizationId, startPolling]);

  // Fetch all audits for an org (for dashboard)
  const fetchOrgAudits = useCallback(async (orgId: string) => {
    const { data, error } = await supabase
      .from('brand_visibility_audits')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useVisibilityAudit] org audits error:', error);
      return [];
    }
    return (data || []) as unknown as VisibilityAudit[];
  }, []);

  return {
    audit,
    isLoading,
    isAnalyzing,
    runAudit,
    fetchLatest,
    fetchOrgAudits,
  };
}
