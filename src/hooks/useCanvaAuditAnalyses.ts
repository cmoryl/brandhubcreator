import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CanvaAuditAnalysis {
  id: string;
  brand_slug: string;
  audit_slug: string;
  audit_title: string | null;
  template_count: number;
  flag_count: number;
  category_count: number;
  health_score: number;
  findings: Array<{
    key: string;
    severity: 'high' | 'medium' | 'low';
    type: string;
    message: string;
    templateNames?: string[];
  }>;
  summary: string | null;
  recommendations: Array<{
    title: string;
    rationale?: string;
    severity?: string;
    key?: string;
  }>;
  category_breakdown: Record<string, number>;
  last_analyzed_at: string;
  model_used: string | null;
}

const SESSION_KEY_PREFIX = 'canva-audit-autosync:';

/**
 * Loads cached canva_audit_analyses rows for the given brand slug.
 * Subscribes to realtime so manual + auto-sync runs surface immediately.
 */
export function useCanvaAuditAnalyses(brandSlug?: string | null) {
  const [analyses, setAnalyses] = useState<CanvaAuditAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!brandSlug) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('canva_audit_analyses' as any)
        .select('*')
        .eq('brand_slug', brandSlug)
        .order('last_analyzed_at', { ascending: false });
      if (error) throw error;
      setAnalyses((data ?? []) as unknown as CanvaAuditAnalysis[]);
    } catch (e) {
      console.warn('[useCanvaAuditAnalyses] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [brandSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { analyses, loading, refresh };
}

interface SyncArgs {
  brandSlug: string;
  brandId?: string | null;
  organizationId: string;
  auditSlug?: string;
  force?: boolean;
  silent?: boolean;
}

/** Imperative trigger — call from a button click or programmatic sync. */
export function useCanvaAuditSync() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const sync = useCallback(async (args: SyncArgs) => {
    setSyncing(args.auditSlug || 'all');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-canva-audit', {
        body: args,
      });
      if (error) throw error;
      if (!args.silent) {
        const results = (data as any)?.results ?? [];
        const ran = results.filter((r: any) => r.ok && !r.skipped).length;
        const cached = results.filter((r: any) => r.skipped).length;
        const failed = results.filter((r: any) => !r.ok).length;
        if (failed > 0) {
          toast.error(`Canva audit sync: ${failed} failed`);
        } else if (ran > 0) {
          toast.success(`Brain updated from ${ran} Canva audit${ran === 1 ? '' : 's'}`);
        } else if (cached > 0) {
          toast.info('Canva audit already analyzed in the last 24h');
        }
      }
      return data;
    } catch (e) {
      const msg = (e as Error).message;
      if (!args.silent) toast.error(`Canva audit sync failed: ${msg}`);
      logger.error('[useCanvaAuditSync]', e);
      throw e;
    } finally {
      setSyncing(null);
    }
  }, []);

  return { sync, syncing };
}

/**
 * Once-per-day auto-sync (per browser session) for a given audit. Mount
 * this hook inside an audit detail page; it fires the edge function
 * silently in the background after a short delay so the iframe loads first.
 */
export function useCanvaAuditAutoSync(args: SyncArgs | null) {
  const { sync } = useCanvaAuditSync();

  useEffect(() => {
    if (!args?.brandSlug || !args.organizationId || !args.auditSlug) return;
    const key = `${SESSION_KEY_PREFIX}${args.brandSlug}:${args.auditSlug}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 24 * 3600_000) return;

    const t = setTimeout(() => {
      sync({ ...args, silent: true })
        .then(() => sessionStorage.setItem(key, String(Date.now())))
        .catch(() => {
          /* surfaced by the manual button anyway */
        });
    }, 4000);
    return () => clearTimeout(t);
  }, [args?.brandSlug, args?.auditSlug, args?.organizationId, args?.brandId, sync]);
}
