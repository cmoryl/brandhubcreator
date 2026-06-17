/**
 * Edge-function-side copy of src/lib/imagerySignals.ts (no client SDK dep — uses fetch + service role).
 * Returns a prompt fragment that biases generators away from rejected styles.
 */

export interface AvoidClause {
  promptFragment: string;
  count: number;
  hasSignals: boolean;
}

export async function buildAvoidClauseForEntity(
  supabaseUrl: string,
  serviceKey: string,
  entityId: string,
  entityType: 'brand' | 'product' | 'event' = 'brand',
): Promise<AvoidClause> {
  if (!entityId) return { promptFragment: '', count: 0, hasSignals: false };

  const reasons: string[] = [];
  const recentUrls: string[] = [];

  try {
    // 1) guide_data.imageryAvoidList
    const tableMap = { brand: 'brands', product: 'products', event: 'events' } as const;
    const table = tableMap[entityType] || 'brands';
    const guideRes = await fetch(
      `${supabaseUrl}/rest/v1/${table}?id=eq.${entityId}&select=guide_data`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (guideRes.ok) {
      const rows = await guideRes.json();
      const avoid = rows?.[0]?.guide_data?.imageryAvoidList || [];
      for (const item of avoid.slice(0, 20)) {
        if (item?.reason) reasons.push(item.reason);
        if (item?.url) recentUrls.push(item.url);
      }
    }

    // 2) recent signals
    const sigRes = await fetch(
      `${supabaseUrl}/rest/v1/imagery_preference_signals?entity_id=eq.${entityId}&entity_type=eq.${entityType}&action=eq.reject&order=created_at.desc&limit=15`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (sigRes.ok) {
      const rows = await sigRes.json();
      for (const row of rows || []) {
        const meta = row.image_metadata || {};
        const ctx = row.search_context || {};
        if (meta.reason && !reasons.includes(meta.reason)) reasons.push(meta.reason);
        if (Array.isArray(ctx.style_tags)) {
          for (const t of ctx.style_tags) if (!reasons.includes(t)) reasons.push(t);
        }
        if (meta.url && !recentUrls.includes(meta.url)) recentUrls.push(meta.url);
      }
    }
  } catch (err) {
    console.warn('[imagerySignals] fetch failed:', err);
  }

  if (!reasons.length && !recentUrls.length) {
    return { promptFragment: '', count: 0, hasSignals: false };
  }

  const parts = ['CRITICAL — Brand team rejected past imagery. Do NOT reproduce these patterns:'];
  if (reasons.length) parts.push(`Avoid: ${reasons.slice(0, 10).join('; ')}.`);
  if (recentUrls.length) parts.push(`(${recentUrls.length} prior rejections logged.)`);

  return {
    promptFragment: parts.join(' '),
    count: reasons.length + recentUrls.length,
    hasSignals: true,
  };
}
