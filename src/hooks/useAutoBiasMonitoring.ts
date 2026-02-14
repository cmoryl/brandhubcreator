/**
 * Continuous Bias Monitoring Hook
 * Automatically triggers bias awareness scans when guide data changes,
 * shifting from periodic audits to real-time continuous monitoring.
 * 
 * Pattern follows useAutoCompliance — debounced, hash-compared, non-blocking.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseAutoBiasMonitoringOptions {
  organizationId: string | null | undefined;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  enabled?: boolean;
  /** Debounce interval in ms (default 8s — longer than compliance to stagger) */
  debounceMs?: number;
  /** Minimum interval between scans in ms (default 5 minutes) */
  cooldownMs?: number;
}

interface UseAutoBiasMonitoringReturn {
  triggerMonitor: (guideData: Record<string, unknown>) => void;
  isMonitoring: boolean;
  lastScore: number | null;
  lastScannedAt: string | null;
}

export function useAutoBiasMonitoring({
  organizationId,
  entityType,
  entityId,
  entityName,
  enabled = true,
  debounceMs = 8000,
  cooldownMs = 5 * 60 * 1000, // 5 minutes
}: UseAutoBiasMonitoringOptions): UseAutoBiasMonitoringReturn {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGuideHash = useRef<string>('');
  const lastScanTime = useRef<number>(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Fetch the latest existing score on mount
  useEffect(() => {
    if (!entityId || !enabled) return;

    const fetchLatest = async () => {
      try {
        const { data } = await supabase
          .from('bias_awareness_scans')
          .select('inclusion_score, completed_at')
          .eq('entity_id', entityId)
          .eq('entity_type', entityType)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setLastScore(Number(data.inclusion_score));
          setLastScannedAt(data.completed_at);
          if (data.completed_at) {
            lastScanTime.current = new Date(data.completed_at).getTime();
          }
        }
      } catch {
        // silent
      }
    };
    fetchLatest();
  }, [entityId, entityType, enabled]);

  // Simple content hash for change detection
  const hashContent = useCallback((data: Record<string, unknown>): string => {
    // Extract key content fields that affect bias scoring
    const relevant = {
      name: data.name,
      tagline: data.tagline,
      mission: data.mission,
      description: data.description,
      values: data.values,
      archetype: data.archetype,
      tone: data.tone,
      voiceAttributes: data.voiceAttributes,
      targetAudience: data.targetAudience,
      services: data.services,
      messaging: data.messaging,
      hero: data.hero,
    };
    return JSON.stringify(relevant);
  }, []);

  const triggerMonitor = useCallback((guideData: Record<string, unknown>) => {
    if (!enabled || !organizationId || !entityId) return;

    // Check if content actually changed
    const newHash = hashContent(guideData);
    if (newHash === lastGuideHash.current) return;
    lastGuideHash.current = newHash;

    // Cooldown check — don't scan too frequently
    const now = Date.now();
    if (now - lastScanTime.current < cooldownMs) return;

    // Debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (!isMounted.current) return;

      // Double-check cooldown after debounce
      if (Date.now() - lastScanTime.current < cooldownMs) return;

      setIsMonitoring(true);

      try {
        const { data, error } = await supabase.functions.invoke('bias-awareness-scan', {
          body: {
            organization_id: organizationId,
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.scan_id) throw new Error('No scan ID');

        // Poll for results (lightweight — max 60s)
        const pollStart = Date.now();
        const pollInterval = setInterval(async () => {
          if (!isMounted.current) {
            clearInterval(pollInterval);
            return;
          }

          if (Date.now() - pollStart > 60000) {
            clearInterval(pollInterval);
            setIsMonitoring(false);
            return;
          }

          try {
            const { data: scanData } = await supabase
              .from('bias_awareness_scans')
              .select('inclusion_score, status, completed_at')
              .eq('id', data.scan_id)
              .single();

            if (!scanData) return;

            if (scanData.status === 'completed') {
              clearInterval(pollInterval);
              const score = Number(scanData.inclusion_score);
              lastScanTime.current = Date.now();

              if (isMounted.current) {
                setLastScore(score);
                setLastScannedAt(scanData.completed_at);
                setIsMonitoring(false);

                // Alert on significant drops or critical scores
                if (lastScore !== null && score < lastScore - 10) {
                  toast.warning(
                    `Inclusion score dropped to ${score}% (was ${lastScore}%)`,
                    { duration: 6000 }
                  );
                } else if (score < 50) {
                  toast.warning(
                    `Inclusion score is critical: ${score}%`,
                    { duration: 6000 }
                  );
                }
              }
            } else if (scanData.status === 'failed') {
              clearInterval(pollInterval);
              if (isMounted.current) setIsMonitoring(false);
            }
          } catch {
            // silent poll error
          }
        }, 3000);
      } catch (err) {
        if (isMounted.current) setIsMonitoring(false);
        console.error('[BiasMonitor] Scan trigger error:', err);
      }
    }, debounceMs);
  }, [enabled, organizationId, entityId, entityType, entityName, hashContent, cooldownMs, debounceMs, lastScore]);

  return {
    triggerMonitor,
    isMonitoring,
    lastScore,
    lastScannedAt,
  };
}
