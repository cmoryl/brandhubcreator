/**
 * Imagery preference signals helper.
 * Reads the brand's imageryAvoidList + recent imagery_preference_signals (action='reject')
 * and produces a compact prompt fragment that biases new generations away from rejected styles.
 *
 * Used by client-side previews ("Learning from N rejections" badges) and by edge functions
 * (Creative Studio, Icon Studio, Social Asset gen, Layout Template gen, PDF cover gen).
 */
import { supabase } from '@/integrations/supabase/client';

export interface ImagerySignals {
  count: number;
  reasons: string[];
  recentUrls: string[];
}

export interface AvoidClause {
  promptFragment: string;
  count: number;
  hasSignals: boolean;
}

export async function loadImagerySignals(
  entityId: string,
  entityType: 'brand' | 'product' | 'event' = 'brand',
  guideData?: { imageryAvoidList?: Array<{ url?: string; name?: string; reason?: string; rejectedAt?: string }> } | null,
): Promise<ImagerySignals> {
  const reasons: string[] = [];
  const recentUrls: string[] = [];

  // 1. Avoid list embedded in guide_data
  const avoidList = guideData?.imageryAvoidList || [];
  for (const item of avoidList.slice(0, 20)) {
    if (item.reason) reasons.push(item.reason);
    if (item.url) recentUrls.push(item.url);
  }

  // 2. Recent rejection signals
  try {
    const { data } = await supabase
      .from('imagery_preference_signals')
      .select('image_metadata, search_context, action')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('action', 'reject')
      .order('created_at', { ascending: false })
      .limit(15);

    for (const row of data || []) {
      const meta = (row.image_metadata as any) || {};
      const ctx = (row.search_context as any) || {};
      if (meta.reason && !reasons.includes(meta.reason)) reasons.push(meta.reason);
      if (ctx.style_tags && Array.isArray(ctx.style_tags)) {
        for (const tag of ctx.style_tags) if (!reasons.includes(tag)) reasons.push(tag);
      }
      if (meta.url && recentUrls.length < 8 && !recentUrls.includes(meta.url)) {
        recentUrls.push(meta.url);
      }
    }
  } catch (err) {
    console.warn('[imagerySignals] preference signal fetch failed:', err);
  }

  return {
    count: avoidList.length + (recentUrls.length - avoidList.length > 0 ? recentUrls.length - avoidList.length : 0),
    reasons: reasons.slice(0, 10),
    recentUrls: recentUrls.slice(0, 8),
  };
}

export function buildAvoidClause(signals: ImagerySignals): AvoidClause {
  if (!signals.count && !signals.reasons.length) {
    return { promptFragment: '', count: 0, hasSignals: false };
  }

  const parts: string[] = ['CRITICAL — Brand team has rejected past imagery. Do NOT reproduce these patterns:'];
  if (signals.reasons.length) {
    parts.push(`Avoid styles/themes: ${signals.reasons.join('; ')}.`);
  }
  if (signals.recentUrls.length) {
    parts.push(`Avoid visual similarity to rejected references (${signals.recentUrls.length} prior rejections logged).`);
  }

  return {
    promptFragment: parts.join(' '),
    count: signals.count,
    hasSignals: true,
  };
}
