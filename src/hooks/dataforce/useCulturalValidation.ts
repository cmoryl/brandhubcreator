/**
 * DataForce Cultural Validation Hook
 * Manages human validation requests with polling for results
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValidationRequest, ValidationFeedback, dbToValidationRequest } from '@/lib/dataforce/types';

interface UseCulturalValidationOptions {
  organizationId: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  variantId?: string;
  pollInterval?: number; // ms between polls, default 30000
}

interface ValidationResult {
  requestId: string;
  status: string;
  validationScore?: number;
  feedback?: ValidationFeedback;
  isDemo: boolean;
  estimatedCompletion?: string;
}

interface UseCulturalValidationReturn {
  isSubmitting: boolean;
  activeRequest: ValidationResult | null;
  recentRequests: ValidationRequest[];
  isPolling: boolean;
  submitValidation: (regions: string[], panelSize: number, guideData: Record<string, unknown>) => Promise<ValidationResult | null>;
  fetchHistory: () => Promise<void>;
  startPolling: (requestId: string) => void;
  stopPolling: () => void;
  clearActiveRequest: () => void;
}

export function useCulturalValidation({
  organizationId,
  entityType,
  entityId,
  entityName,
  variantId,
  pollInterval = 30000
}: UseCulturalValidationOptions): UseCulturalValidationReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ValidationResult | null>(null);
  const [recentRequests, setRecentRequests] = useState<ValidationRequest[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollForUpdates = useCallback(async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('dataforce_validation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      if (data.status === 'completed') {
        setActiveRequest({
          requestId: data.id,
          status: data.status,
          validationScore: data.validation_score,
          feedback: data.feedback_summary as unknown as ValidationFeedback,
          isDemo: false,
          estimatedCompletion: undefined,
        });
        stopPolling();
        toast.success('Validation complete!');
      } else {
        setActiveRequest(prev => prev ? {
          ...prev,
          status: data.status,
        } : null);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, []);

  const startPolling = useCallback((requestId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsPolling(true);
    pollIntervalRef.current = setInterval(() => pollForUpdates(requestId), pollInterval);
  }, [pollForUpdates, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const submitValidation = useCallback(async (
    regions: string[], 
    panelSize: number, 
    guideData: Record<string, unknown>
  ): Promise<ValidationResult | null> => {
    if (!organizationId || regions.length === 0) {
      toast.error('Please select at least one region');
      return null;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke('dataforce-validation', {
        body: {
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          variant_id: variantId,
          target_regions: regions,
          panel_size: panelSize,
          content_snapshot: guideData,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Validation request failed');
      }

      const result: ValidationResult = {
        requestId: data.requestId,
        status: data.status,
        validationScore: data.validationScore,
        feedback: data.feedbackSummary,
        isDemo: data.isDemo,
        estimatedCompletion: data.estimatedCompletion,
      };

      setActiveRequest(result);

      // Start polling if not completed (live mode)
      if (data.status !== 'completed' && !data.isDemo) {
        startPolling(data.requestId);
      }

      toast.success(data.status === 'completed' 
        ? 'Validation complete!' 
        : 'Validation request submitted');

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Validation request failed');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [organizationId, entityType, entityId, entityName, variantId, startPolling]);

  const fetchHistory = useCallback(async () => {
    if (!organizationId || !entityId) return;

    try {
      const { data, error } = await supabase
        .from('dataforce_validation_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentRequests((data || []).map(dbToValidationRequest));
    } catch (error) {
      console.error('Failed to fetch validation history:', error);
    }
  }, [organizationId, entityId]);

  const clearActiveRequest = useCallback(() => {
    stopPolling();
    setActiveRequest(null);
  }, [stopPolling]);

  return {
    isSubmitting,
    activeRequest,
    recentRequests,
    isPolling,
    submitValidation,
    fetchHistory,
    startPolling,
    stopPolling,
    clearActiveRequest,
  };
}
