/**
 * DataForce Auto-Compliance Hook
 * Triggers compliance checks automatically on guide save when enabled
 */

import { useCallback, useRef, useEffect } from 'react';
import { useComplianceCheck } from './useComplianceCheck';
import { useDataForceConfig } from './useDataForceConfig';
import { toast } from 'sonner';

interface UseAutoComplianceOptions {
  organizationId: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseAutoComplianceReturn {
  triggerAutoCheck: (guideData: Record<string, unknown>) => void;
  isAutoCheckEnabled: boolean;
  lastAutoCheckScore: number | null;
}

export function useAutoCompliance({
  organizationId,
  entityType,
  entityId,
  entityName,
  enabled = true,
  debounceMs = 5000 // 5 second debounce to avoid spamming
}: UseAutoComplianceOptions): UseAutoComplianceReturn {
  const { config, isServiceEnabled } = useDataForceConfig({ organizationId });
  const { runCheck, result } = useComplianceCheck({
    organizationId,
    entityType,
    entityId,
    entityName,
  });
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastGuideDataHash = useRef<string>('');

  // Check if auto-compliance is enabled in config
  const isAutoCheckEnabled = enabled && 
    isServiceEnabled('compliance') && 
    (config?.complianceAutoScan ?? false);

  // Simple hash function for guide data
  const hashGuideData = useCallback((data: Record<string, unknown>): string => {
    return JSON.stringify(data).slice(0, 500); // Simple comparison
  }, []);

  const triggerAutoCheck = useCallback((guideData: Record<string, unknown>) => {
    if (!isAutoCheckEnabled) return;

    // Check if data actually changed
    const newHash = hashGuideData(guideData);
    if (newHash === lastGuideDataHash.current) return;
    lastGuideDataHash.current = newHash;

    // Debounce the check
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      toast.info('Running auto-compliance check...', { duration: 2000 });
      const checkResult = await runCheck(guideData);
      
      if (checkResult) {
        const threshold = config?.complianceThreshold ?? 80;
        if (checkResult.score < threshold) {
          toast.warning(
            `Compliance score (${checkResult.score}%) is below threshold (${threshold}%)`,
            { duration: 5000 }
          );
        }
      }
    }, debounceMs);
  }, [isAutoCheckEnabled, hashGuideData, runCheck, config, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    triggerAutoCheck,
    isAutoCheckEnabled,
    lastAutoCheckScore: result?.score ?? null,
  };
}
