/**
 * Brand Learning Signals Hook
 * Captures guide_data changes as learning signals for brand intelligence
 * Triggers re-analysis when significant changes are detected
 */

import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandGuide, ProductGuide } from '@/types/brand';
import { logger } from '@/lib/logger';

// Sections that indicate significant changes worth tracking
const SIGNIFICANT_SECTIONS = [
  'identity',
  'values',
  'hero',
  'tagline',
  'colors',
  'typography',
  'services',
  'imagery'
] as const;

// Minimum changes before triggering re-analysis
const CHANGES_THRESHOLD_FOR_REANALYSIS = 5;

interface ChangeSignal {
  section: string;
  changeType: 'add' | 'update' | 'delete';
  timestamp: string;
  summary: string;
}

interface LearningSignalState {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  pendingSignals: ChangeSignal[];
  lastSnapshotHash: string;
}

function generateSnapshotHash(guide: Partial<BrandGuide | ProductGuide>): string {
  const significant = SIGNIFICANT_SECTIONS.reduce((acc, section) => {
    const value = (guide as Record<string, unknown>)[section];
    if (value !== undefined) {
      acc[section] = JSON.stringify(value);
    }
    return acc;
  }, {} as Record<string, string>);
  return JSON.stringify(significant);
}

function detectChanges(
  prevHash: string,
  currentHash: string,
  guide: Partial<BrandGuide | ProductGuide>
): ChangeSignal[] {
  if (prevHash === currentHash) return [];
  
  try {
    const prev = prevHash ? JSON.parse(prevHash) : {};
    const current = JSON.parse(currentHash);
    const changes: ChangeSignal[] = [];
    
    for (const section of SIGNIFICANT_SECTIONS) {
      const prevVal = prev[section];
      const currVal = current[section];
      
      if (prevVal !== currVal) {
        // Determine change type
        let changeType: 'add' | 'update' | 'delete' = 'update';
        if (!prevVal && currVal) changeType = 'add';
        if (prevVal && !currVal) changeType = 'delete';
        
        // Generate summary
        let summary = `${section} was ${changeType}d`;
        
        // Add specific details based on section
        if (section === 'values' && Array.isArray((guide as Record<string, unknown>).values)) {
          const values = (guide as Record<string, unknown>).values as Array<{ name?: string }>;
          summary = `Brand values ${changeType}d: ${values.map((v) => v.name || String(v)).slice(0, 3).join(', ')}`;
        } else if (section === 'identity') {
          const identity = (guide as Record<string, unknown>).identity as Record<string, unknown> | undefined;
          if (identity?.missionStatement) {
            summary = `Mission statement ${changeType}d`;
          }
        } else if (section === 'colors' && Array.isArray((guide as Record<string, unknown>).colors)) {
          const colors = (guide as Record<string, unknown>).colors as unknown[];
          summary = `Color palette ${changeType}d: ${colors.length} colors defined`;
        }
        
        changes.push({
          section,
          changeType,
          timestamp: new Date().toISOString(),
          summary,
        });
      }
    }
    
    return changes;
  } catch {
    return [];
  }
}

export function useBrandLearningSignals(
  entityId: string | undefined,
  entityType: 'brand' | 'product' | 'event',
  organizationId: string | null | undefined
) {
  const stateRef = useRef<LearningSignalState | null>(null);
  const pendingSignalsRef = useRef<ChangeSignal[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state for new entity
  useEffect(() => {
    if (entityId && (!stateRef.current || stateRef.current.entityId !== entityId)) {
      stateRef.current = {
        entityId,
        entityType,
        pendingSignals: [],
        lastSnapshotHash: '',
      };
      pendingSignalsRef.current = [];
    }
  }, [entityId, entityType]);

  // Capture a change signal
  const captureChange = useCallback((guide: Partial<BrandGuide | ProductGuide>) => {
    if (!stateRef.current || !entityId) return;
    
    const currentHash = generateSnapshotHash(guide);
    const changes = detectChanges(stateRef.current.lastSnapshotHash, currentHash, guide);
    
    if (changes.length > 0) {
      pendingSignalsRef.current = [...pendingSignalsRef.current, ...changes];
      stateRef.current.lastSnapshotHash = currentHash;
      
      // Debounce flush to backend
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushTimeoutRef.current = setTimeout(() => {
        flushSignals();
      }, 5000); // Flush after 5s of inactivity
    }
  }, [entityId]);

  // Flush pending signals to brand intelligence
  const flushSignals = useCallback(async () => {
    if (!entityId || pendingSignalsRef.current.length === 0) return;
    
    const signalsToFlush = [...pendingSignalsRef.current];
    pendingSignalsRef.current = [];
    
    try {
      // Add each change as a learning entry
      for (const signal of signalsToFlush) {
        await supabase.functions.invoke('brand-intelligence', {
          body: {
            action: 'add_entry',
            entityType,
            entityId,
            organizationId,
            entry: {
              type: 'learning',
              content: signal.summary,
              source: 'manual',
              category: `user-edit-${signal.section}`,
            },
          },
        });
      }
      
      logger.sync(`LearningSignals: Flushed ${signalsToFlush.length} signals for ${entityType}:${entityId}`);
      
      // Check if we should trigger re-analysis
      if (signalsToFlush.length >= CHANGES_THRESHOLD_FOR_REANALYSIS) {
        logger.sync('LearningSignals: Threshold reached, suggesting re-analysis');
        // Return true to indicate re-analysis should be suggested
        return true;
      }
    } catch (err) {
      console.error('[LearningSignals] Failed to flush signals:', err);
      // Re-queue failed signals
      pendingSignalsRef.current = [...signalsToFlush, ...pendingSignalsRef.current];
    }
    
    return false;
  }, [entityId, entityType, organizationId]);

  // Set initial snapshot (call when guide first loads)
  const setInitialSnapshot = useCallback((guide: Partial<BrandGuide | ProductGuide>) => {
    if (stateRef.current) {
      stateRef.current.lastSnapshotHash = generateSnapshotHash(guide);
    }
  }, []);

  // Manual trigger for significant updates
  const recordSignificantChange = useCallback(async (
    section: string,
    summary: string
  ) => {
    if (!entityId) return;
    
    try {
      await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'add_entry',
          entityType,
          entityId,
          organizationId,
          entry: {
            type: 'milestone',
            content: summary,
            source: 'manual',
            category: section,
          },
        },
      });
      logger.sync(`LearningSignals: Recorded milestone: ${summary}`);
    } catch (err) {
      console.error('[LearningSignals] Failed to record milestone:', err);
    }
  }, [entityId, entityType, organizationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      // Flush any remaining signals
      if (pendingSignalsRef.current.length > 0) {
        flushSignals();
      }
    };
  }, [flushSignals]);

  return {
    captureChange,
    flushSignals,
    setInitialSnapshot,
    recordSignificantChange,
    pendingSignalsCount: pendingSignalsRef.current.length,
  };
}
