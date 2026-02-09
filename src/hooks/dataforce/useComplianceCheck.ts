/**
 * DataForce Compliance Check Hook
 * Manages brand compliance scanning with polling for async jobs
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ComplianceJob, ComplianceIssue, dbToComplianceJob } from '@/lib/dataforce/types';

interface UseComplianceCheckOptions {
  organizationId: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  onComplete?: (result: ComplianceResult) => void;
}

interface ComplianceResult {
  jobId: string;
  score: number;
  issues: ComplianceIssue[];
  isDemo: boolean;
  assetsScanned: number;
}

interface UseComplianceCheckReturn {
  isChecking: boolean;
  result: ComplianceResult | null;
  recentJobs: ComplianceJob[];
  runCheck: (guideData: Record<string, unknown>) => Promise<ComplianceResult | null>;
  fetchHistory: () => Promise<void>;
  clearResult: () => void;
}

export function useComplianceCheck({
  organizationId,
  entityType,
  entityId,
  entityName,
  onComplete
}: UseComplianceCheckOptions): UseComplianceCheckReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [recentJobs, setRecentJobs] = useState<ComplianceJob[]>([]);

  const runCheck = useCallback(async (guideData: Record<string, unknown>): Promise<ComplianceResult | null> => {
    if (!organizationId) {
      toast.error('Organization not found');
      return null;
    }

    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to run compliance checks');
        return null;
      }

      const response = await supabase.functions.invoke('dataforce-compliance', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          guide_data: guideData,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Compliance check failed');
      }

      const complianceResult: ComplianceResult = {
        jobId: data.jobId,
        score: data.complianceScore,
        issues: data.issues || [],
        isDemo: data.isDemo,
        assetsScanned: data.assetsScanned || 0,
      };

      setResult(complianceResult);
      onComplete?.(complianceResult);
      
      toast.success(`Compliance check complete: ${complianceResult.score}% score`);
      return complianceResult;
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error(error instanceof Error ? error.message : 'Compliance check failed');
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [organizationId, entityType, entityId, entityName, onComplete]);

  const fetchHistory = useCallback(async () => {
    if (!organizationId || !entityId) return;

    try {
      const { data, error } = await supabase
        .from('dataforce_compliance_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentJobs((data || []).map(dbToComplianceJob));
    } catch (error) {
      console.error('Failed to fetch compliance history:', error);
    }
  }, [organizationId, entityId]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isChecking,
    result,
    recentJobs,
    runCheck,
    fetchHistory,
    clearResult,
  };
}
