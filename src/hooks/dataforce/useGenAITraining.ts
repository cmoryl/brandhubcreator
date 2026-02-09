/**
 * DataForce GenAI Training Hook
 * Manages AI model training and brand content generation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrainingJob, TrainingMetrics, dbToTrainingJob } from '@/lib/dataforce/types';

interface UseGenAITrainingOptions {
  organizationId: string;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  pollInterval?: number;
}

interface TrainingResult {
  jobId: string;
  status: string;
  trainingType: string;
  samplesCollected: number;
  samplesTarget: number;
  metrics?: TrainingMetrics;
  isDemo: boolean;
  estimatedCompletion?: string;
}

interface GeneratedContent {
  content: string;
  contentType: string;
  entityName: string;
}

interface UseGenAITrainingReturn {
  isTraining: boolean;
  isGenerating: boolean;
  activeJob: TrainingResult | null;
  recentJobs: TrainingJob[];
  generatedContent: GeneratedContent | null;
  isPolling: boolean;
  startTraining: (trainingType: 'voice' | 'visual' | 'content', config?: TrainingConfig) => Promise<TrainingResult | null>;
  generateContent: (prompt: string, contentType: string) => Promise<GeneratedContent | null>;
  fetchHistory: () => Promise<void>;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  clearActiveJob: () => void;
  clearGeneratedContent: () => void;
}

interface TrainingConfig {
  baseModel?: string;
  learningRate?: number;
  epochs?: number;
  customPrompts?: string[];
}

export function useGenAITraining({
  organizationId,
  entityType,
  entityId,
  pollInterval = 30000
}: UseGenAITrainingOptions): UseGenAITrainingReturn {
  const [isTraining, setIsTraining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJob, setActiveJob] = useState<TrainingResult | null>(null);
  const [recentJobs, setRecentJobs] = useState<TrainingJob[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollForUpdates = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('dataforce_training_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      if (data.status === 'completed') {
        setActiveJob({
          jobId: data.id,
          status: data.status,
          trainingType: data.training_type,
          samplesCollected: data.samples_collected || 0,
          samplesTarget: data.samples_target || 100,
          metrics: data.metrics as unknown as TrainingMetrics,
          isDemo: false,
        });
        stopPolling();
        toast.success('Training complete!');
      } else if (data.status === 'failed') {
        stopPolling();
        toast.error('Training failed');
      } else {
        setActiveJob(prev => prev ? {
          ...prev,
          status: data.status,
          samplesCollected: data.samples_collected || 0,
        } : null);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsPolling(true);
    pollIntervalRef.current = setInterval(() => pollForUpdates(jobId), pollInterval);
  }, [pollForUpdates, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startTraining = useCallback(async (
    trainingType: 'voice' | 'visual' | 'content',
    config?: TrainingConfig
  ): Promise<TrainingResult | null> => {
    if (!organizationId) {
      toast.error('Organization not found');
      return null;
    }

    setIsTraining(true);
    try {
      const response = await supabase.functions.invoke('dataforce-training', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          training_type: trainingType,
          training_config: config,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Training failed to start');
      }

      const result: TrainingResult = {
        jobId: data.jobId,
        status: data.status,
        trainingType: data.trainingType,
        samplesCollected: data.samplesCollected,
        samplesTarget: data.samplesTarget,
        metrics: data.metrics,
        isDemo: data.isDemo,
        estimatedCompletion: data.estimatedCompletion,
      };

      setActiveJob(result);

      if (data.status !== 'completed' && !data.isDemo) {
        startPolling(data.jobId);
      }

      toast.success(data.status === 'completed' 
        ? 'Training complete!' 
        : 'Training job started');

      return result;
    } catch (error) {
      console.error('Training error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start training');
      return null;
    } finally {
      setIsTraining(false);
    }
  }, [organizationId, entityType, entityId, startPolling]);

  const generateContent = useCallback(async (
    prompt: string,
    contentType: string
  ): Promise<GeneratedContent | null> => {
    if (!organizationId || !entityType || !entityId) {
      toast.error('Entity context required for content generation');
      return null;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('dataforce-training?action=generate', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          prompt,
          content_type: contentType,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Content generation failed');
      }

      const result: GeneratedContent = {
        content: data.content,
        contentType: data.contentType,
        entityName: data.entityName,
      };

      setGeneratedContent(result);
      toast.success('Content generated!');
      return result;
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [organizationId, entityType, entityId]);

  const fetchHistory = useCallback(async () => {
    if (!organizationId) return;

    try {
      const query = supabase
        .from('dataforce_training_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (entityId) {
        query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecentJobs((data || []).map(dbToTrainingJob));
    } catch (error) {
      console.error('Failed to fetch training history:', error);
    }
  }, [organizationId, entityId]);

  const clearActiveJob = useCallback(() => {
    stopPolling();
    setActiveJob(null);
  }, [stopPolling]);

  const clearGeneratedContent = useCallback(() => {
    setGeneratedContent(null);
  }, []);

  return {
    isTraining,
    isGenerating,
    activeJob,
    recentJobs,
    generatedContent,
    isPolling,
    startTraining,
    generateContent,
    fetchHistory,
    startPolling,
    stopPolling,
    clearActiveJob,
    clearGeneratedContent,
  };
}
