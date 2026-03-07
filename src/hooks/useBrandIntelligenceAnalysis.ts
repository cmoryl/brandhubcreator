/**
 * Brand Intelligence Analysis Hook
 * Handles async analysis job submission and polling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface AnalysisJob {
  id: string;
  entity_type: string;
  entity_id: string;
  organization_id: string | null;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result: any | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface UseAnalysisOptions {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  pollingInterval?: number;
}

export function useBrandIntelligenceAnalysis(
  entityId: string | undefined,
  entityType: 'brand' | 'product' | 'event',
  organizationId: string | null | undefined,
  options: UseAnalysisOptions = {}
) {
  const { onComplete, onError, pollingInterval = 2000 } = options;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [progress, setProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('brand_intelligence_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (error || !data) {
        console.error('[BrandIntelligenceAnalysis] Polling error:', error);
        return null;
      }

      // Type assertion since we know the structure
      const job = data as unknown as AnalysisJob;
      setCurrentJob(job);
      setProgress(job.progress);

      if (job.status === 'completed') {
        setIsAnalyzing(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.success('Analysis complete!');
        onComplete?.(job.result);
        return job;
      }

      if (job.status === 'failed') {
        setIsAnalyzing(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        const errorMsg = job.error_message || 'Analysis failed';
        toast.error(errorMsg);
        onError?.(errorMsg);
        return job;
      }

      return job;
    } catch (err) {
      console.error('[BrandIntelligenceAnalysis] Poll error:', err);
      return null;
    }
  }, [onComplete, onError]);

  // Start analysis
  const startAnalysis = useCallback(async () => {
    if (!entityId) {
      toast.error('No entity selected');
      return null;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentJob(null);

    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'analyze',
          entityType,
          entityId,
          organizationId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.job_id) {
        throw new Error('No job ID returned');
      }

      logger.sync('BrandIntelligenceAnalysis: Job started:', data.job_id);
      toast.info('Analysis started...');

      // Start polling
      pollingRef.current = setInterval(() => {
        pollJobStatus(data.job_id);
      }, pollingInterval);

      // Initial poll
      const initialJob = await pollJobStatus(data.job_id);
      return initialJob;
    } catch (err) {
      console.error('[BrandIntelligenceAnalysis] Start error:', err);
      setIsAnalyzing(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start analysis';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return null;
    }
  }, [entityId, entityType, organizationId, pollJobStatus, pollingInterval, onError]);

  // Cancel polling (but job continues in background)
  const cancelPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  // Get latest job for entity
  const getLatestJob = useCallback(async () => {
    if (!entityId) return null;

    try {
      const { data, error } = await supabase
        .from('brand_intelligence_jobs')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const job = data as unknown as AnalysisJob;
        setCurrentJob(job);
        setProgress(job.progress);
        
        // If job is still running, start polling
        if (job.status === 'pending' || job.status === 'processing') {
          setIsAnalyzing(true);
          pollingRef.current = setInterval(() => {
            pollJobStatus(job.id);
          }, pollingInterval);
        }
        
        return job;
      }
      
      return null;
    } catch (err) {
      console.error('[BrandIntelligenceAnalysis] Get latest job error:', err);
      return null;
    }
  }, [entityId, entityType, pollJobStatus, pollingInterval]);

  return {
    isAnalyzing,
    currentJob,
    progress,
    startAnalysis,
    cancelPolling,
    getLatestJob,
  };
}
