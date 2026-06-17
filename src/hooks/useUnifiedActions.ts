/**
 * Unified Action Center hook
 * Normalizes recommendation_actions + competitive_recommendation_actions + intelligence_alerts
 * into a single BrandAction[] queue scoped to an entity/org.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { computeActionBreakdown } from '@/lib/actionConsistency';

export type ActionSource = 'competitive' | 'compliance' | 'audit' | 'alert' | 'recommendation';
export type ActionSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ActionStatus = 'open' | 'in_progress' | 'done' | 'snoozed' | 'dismissed';

export interface BrandAction {
  id: string;
  source: ActionSource;
  sourceTable: 'recommendation_actions' | 'competitive_recommendation_actions' | 'intelligence_alerts';
  title: string;
  description?: string;
  severity: ActionSeverity;
  status: ActionStatus;
  entityId?: string | null;
  entityType?: string | null;
  organizationId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Options {
  entityId?: string | null;
  entityType?: string | null;
  organizationId?: string | null;
  /** When true, automatically refetch on detected drift (max once per ~10s, capped at 3 attempts per mount). */
  autoFixDrift?: boolean;
}

const SEVERITY_RANK: Record<ActionSeverity, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4,
};

function mapSeverity(s: string | null | undefined): ActionSeverity {
  const v = (s || '').toLowerCase();
  if (v === 'critical' || v === 'urgent') return 'critical';
  if (v === 'high' || v === 'warning') return 'high';
  if (v === 'medium' || v === 'moderate') return 'medium';
  if (v === 'low') return 'low';
  return 'info';
}

function mapStatus(s: string | null | undefined): ActionStatus {
  const v = (s || '').toLowerCase();
  if (v === 'done' || v === 'completed' || v === 'approved' || v === 'applied') return 'done';
  if (v === 'in_progress' || v === 'pending') return 'in_progress';
  if (v === 'snoozed') return 'snoozed';
  if (v === 'dismissed' || v === 'rejected') return 'dismissed';
  return 'open';
}

export function useUnifiedActions({ entityId, entityType, organizationId }: Options) {
  const [actions, setActions] = useState<BrandAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!organizationId && !entityId) return;
    setIsLoading(true);
    try {
      const [recRes, compRes, alertRes] = await Promise.all([
        organizationId
          ? supabase.from('recommendation_actions').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50)
          : Promise.resolve({ data: [], error: null } as any),
        entityId && entityType
          ? supabase.from('competitive_recommendation_actions').select('*').eq('entity_id', entityId).eq('entity_type', entityType).order('created_at', { ascending: false }).limit(50)
          : Promise.resolve({ data: [], error: null } as any),
        organizationId
          ? supabase.from('intelligence_alerts').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const out: BrandAction[] = [];

      for (const r of (recRes.data || [])) {
        out.push({
          id: `rec-${r.id}`,
          source: (r.source as ActionSource) || 'recommendation',
          sourceTable: 'recommendation_actions',
          title: r.recommendation_text?.slice(0, 120) || 'Recommendation',
          description: r.notes || undefined,
          severity: 'medium',
          status: mapStatus(r.status),
          organizationId: r.organization_id,
          createdAt: r.created_at,
          metadata: { recommendation_key: r.recommendation_key, assigned_to: r.assigned_to },
        });
      }

      for (const c of (compRes.data || [])) {
        out.push({
          id: `comp-${c.id}`,
          source: 'competitive',
          sourceTable: 'competitive_recommendation_actions',
          title: c.recommendation_title,
          description: c.notes || undefined,
          severity: c.recommendation_type === 'urgent' ? 'high' : 'medium',
          status: mapStatus(c.status),
          entityId: c.entity_id,
          entityType: c.entity_type,
          organizationId: c.organization_id,
          createdAt: c.created_at,
          metadata: { report_id: c.report_id, recommendation_type: c.recommendation_type, applied: c.applied_to_imagery_hub },
        });
      }

      for (const a of (alertRes.data || [])) {
        if (entityId && a.entity_id && a.entity_id !== entityId) continue;
        out.push({
          id: `alert-${a.id}`,
          source: 'alert',
          sourceTable: 'intelligence_alerts',
          title: a.title,
          description: a.message,
          severity: mapSeverity(a.severity),
          status: a.acknowledged ? 'done' : 'open',
          entityId: a.entity_id,
          entityType: a.entity_type,
          organizationId: a.organization_id,
          createdAt: a.created_at,
          metadata: { alert_type: a.alert_type, ...((a.metadata as object) || {}) },
        });
      }

      out.sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (b.status === 'done' && a.status !== 'done') return -1;
        const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
        if (s !== 0) return s;
        return b.createdAt.localeCompare(a.createdAt);
      });

      setActions(out);
    } catch (err) {
      console.error('[useUnifiedActions] fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, organizationId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markDone = useCallback(async (action: BrandAction) => {
    try {
      const rawId = action.id.replace(/^(rec|comp|alert)-/, '');
      if (action.sourceTable === 'intelligence_alerts') {
        await supabase.from('intelligence_alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() } as any).eq('id', rawId);
      } else if (action.sourceTable === 'competitive_recommendation_actions') {
        await supabase.from('competitive_recommendation_actions').update({ status: 'done', applied_at: new Date().toISOString() } as any).eq('id', rawId);
      } else {
        await supabase.from('recommendation_actions').update({ status: 'done' } as any).eq('id', rawId);
      }
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'done' } : a));
    } catch {
      toast.error('Failed to mark action done');
    }
  }, []);

  const openCount = useMemo(() => actions.filter(a => (a.status === 'open' || a.status === 'in_progress') && a.severity !== 'info').length, [actions]);

  // Automated consistency check: flags drift between badge total and per-source openCount sources.
  const consistency = useMemo(
    () => computeActionBreakdown(actions, openCount, { entityId, brandLabel: entityType ?? undefined }),
    [actions, openCount, entityId, entityType],
  );

  return { actions, isLoading, openCount, refetch: fetchAll, markDone, consistency };
}
