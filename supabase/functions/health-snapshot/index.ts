/**
 * Health Snapshot Edge Function
 * Captures point-in-time scores from all analysis systems into health_snapshots table.
 * Supports both manual triggers and cron-based monthly automation.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { organization_id, entity_id, entity_type, triggered_by = 'manual' } = body;

    // For manual triggers, verify JWT
    if (triggered_by === 'manual') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      // Verify user can use AI features
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: authHeader, apikey: Deno.env.get('SUPABASE_ANON_KEY')! },
      });
      if (!userRes.ok) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    };

    // If specific entity provided, snapshot just that one
    if (entity_id && entity_type && organization_id) {
      const snapshot = await captureEntitySnapshot(supabaseUrl, headers, organization_id, entity_id, entity_type, triggered_by);
      return new Response(JSON.stringify({ success: true, snapshot }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If org provided, snapshot all entities in the org
    if (organization_id) {
      const results = await captureOrgSnapshots(supabaseUrl, headers, organization_id, triggered_by);
      return new Response(JSON.stringify({ success: true, count: results.length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('Health snapshot error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});

async function captureOrgSnapshots(supabaseUrl: string, headers: Record<string, string>, orgId: string, triggeredBy: string) {
  const results: any[] = [];

  // Fetch all brands for this org
  const brandsRes = await fetch(`${supabaseUrl}/rest/v1/brands?organization_id=eq.${orgId}&select=id,name`, { headers });
  const brands = await brandsRes.json();
  for (const brand of (brands || [])) {
    const snap = await captureEntitySnapshot(supabaseUrl, headers, orgId, brand.id, 'brand', triggeredBy);
    if (snap) results.push(snap);
  }

  // Fetch all products
  const productsRes = await fetch(`${supabaseUrl}/rest/v1/products?organization_id=eq.${orgId}&select=id,name`, { headers });
  const products = await productsRes.json();
  for (const product of (products || [])) {
    const snap = await captureEntitySnapshot(supabaseUrl, headers, orgId, product.id, 'product', triggeredBy);
    if (snap) results.push(snap);
  }

  // Fetch all events
  const eventsRes = await fetch(`${supabaseUrl}/rest/v1/events?organization_id=eq.${orgId}&select=id,name`, { headers });
  const events = await eventsRes.json();
  for (const event of (events || [])) {
    const snap = await captureEntitySnapshot(supabaseUrl, headers, orgId, event.id, 'event', triggeredBy);
    if (snap) results.push(snap);
  }

  return results;
}

async function captureEntitySnapshot(supabaseUrl: string, headers: Record<string, string>, orgId: string, entityId: string, entityType: string, triggeredBy: string) {
  try {
    // Fetch entity name
    const table = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    const entityRes = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${entityId}&select=name`, { headers });
    const entityData = await entityRes.json();
    const entityName = entityData?.[0]?.name || 'Unknown';

    // Fetch latest compliance score
    const complianceRes = await fetch(
      `${supabaseUrl}/rest/v1/dataforce_compliance_jobs?entity_id=eq.${entityId}&status=eq.completed&order=created_at.desc&limit=1&select=compliance_score,issues_data`,
      { headers }
    );
    const complianceData = await complianceRes.json();
    // Use ?? not || so a legitimate 0 score is preserved instead of being coerced to null
    const complianceScore = complianceData?.[0]?.compliance_score ?? null;

    // Fetch latest bias scan
    const biasRes = await fetch(
      `${supabaseUrl}/rest/v1/bias_awareness_scans?entity_id=eq.${entityId}&status=eq.completed&order=created_at.desc&limit=1&select=inclusion_score,language_score,visual_score,accessibility_score,ai_governance_score`,
      { headers }
    );
    const biasData = await biasRes.json();
    const biasScore = biasData?.[0]?.inclusion_score ?? null;
    const biasDetails = biasData?.[0] ? {
      language: biasData[0].language_score,
      visual: biasData[0].visual_score,
      accessibility: biasData[0].accessibility_score,
      ai_governance: biasData[0].ai_governance_score,
    } : {};

    // Fetch latest website analysis
    const websiteRes = await fetch(
      `${supabaseUrl}/rest/v1/website_analysis_reports?entity_id=eq.${entityId}&order=created_at.desc&limit=1&select=overall_score,grade,report_data`,
      { headers }
    );
    const websiteData = await websiteRes.json();
    const websiteScore = websiteData?.[0]?.overall_score ?? null;

    // Fetch latest competitive report
    const competitiveRes = await fetch(
      `${supabaseUrl}/rest/v1/competitive_analysis_reports?entity_id=eq.${entityId}&order=created_at.desc&limit=1&select=score`,
      { headers }
    );
    const competitiveData = await competitiveRes.json();
    const competitiveScore = competitiveData?.[0]?.score ?? null;

    // Fetch latest social metrics
    const socialRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_aggregated_social_metrics`,
      { method: 'POST', headers, body: JSON.stringify({ p_entity_id: entityId, p_entity_type: entityType }) }
    );
    const socialData = await socialRes.json();

    // Get previous snapshot for delta calculation
    const prevRes = await fetch(
      `${supabaseUrl}/rest/v1/health_snapshots?entity_id=eq.${entityId}&entity_type=eq.${entityType}&order=snapshot_date.desc&limit=1&select=brand_health_score,compliance_score,bias_inclusion_score,website_score,competitive_score`,
      { headers }
    );
    const prevData = await prevRes.json();
    const prev = prevData?.[0];

    // Calculate brand health as average of available scores. Use explicit null check
    // so a legitimate 0 score is included in the average.
    const scores = [complianceScore, biasScore, websiteScore, competitiveScore].filter(s => s !== null && s !== undefined);
    const brandHealthScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    // Calculate deltas
    const scoreDeltas: Record<string, number | null> = {};
    if (prev) {
      if (brandHealthScore !== null && prev.brand_health_score !== null) scoreDeltas.brand_health = brandHealthScore - prev.brand_health_score;
      if (complianceScore !== null && prev.compliance_score !== null) scoreDeltas.compliance = complianceScore - prev.compliance_score;
      if (biasScore !== null && prev.bias_inclusion_score !== null) scoreDeltas.bias = biasScore - prev.bias_inclusion_score;
      if (websiteScore !== null && prev.website_score !== null) scoreDeltas.website = websiteScore - prev.website_score;
      if (competitiveScore !== null && prev.competitive_score !== null) scoreDeltas.competitive = competitiveScore - prev.competitive_score;
    }

    // Upsert snapshot (unique on entity_id + entity_type + snapshot_date)
    const snapshot = {
      organization_id: orgId,
      entity_id: entityId,
      entity_type: entityType,
      entity_name: entityName,
      snapshot_date: new Date().toISOString().split('T')[0],
      period_type: triggeredBy === 'cron' ? 'monthly' : 'manual',
      brand_health_score: brandHealthScore,
      compliance_score: complianceScore,
      bias_inclusion_score: biasScore,
      website_score: websiteScore,
      competitive_score: competitiveScore,
      compliance_details: complianceData?.[0]?.issues_data || {},
      bias_details: biasDetails,
      website_details: websiteData?.[0]?.report_data || {},
      competitive_details: {},
      social_metrics: socialData || {},
      score_deltas: scoreDeltas,
      triggered_by: triggeredBy,
    };

    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/health_snapshots`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(snapshot),
      }
    );

    if (!upsertRes.ok) {
      const err = await upsertRes.text();
      console.error(`Failed to upsert snapshot for ${entityName}:`, err);
      return null;
    }

    return { entity_name: entityName, entity_type: entityType, brand_health_score: brandHealthScore, score_deltas: scoreDeltas };
  } catch (error) {
    console.error(`Error capturing snapshot for ${entityId}:`, error);
    return null;
  }
}
