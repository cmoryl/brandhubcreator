/**
 * Scheduled Intelligence Edge Function
 * Runs Oracle Brain synthesis, health snapshots, portfolio insights extraction,
 * and generates intelligence_alerts for significant score drops.
 * 
 * Can be triggered manually or via pg_cron.
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const body = await req.json().catch(() => ({}));
    const { organization_id, triggered_by = 'manual' } = body;

    // For manual triggers, verify JWT
    if (triggered_by === 'manual') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: authHeader, apikey: anonKey },
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

    // Get target organizations
    let orgIds: string[] = [];
    if (organization_id) {
      orgIds = [organization_id];
    } else {
      // Cron mode: process all orgs
      const orgsRes = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id&limit=100`, { headers });
      const orgs = await orgsRes.json();
      orgIds = (orgs || []).map((o: any) => o.id);
    }

    const results: any[] = [];

    for (const orgId of orgIds) {
      const orgResult: any = { organization_id: orgId, steps: {} };

      // Step 1: Trigger Oracle Brain synthesis
      try {
        const oracleRes = await fetch(`${supabaseUrl}/functions/v1/oracle-brain`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ action: 'synthesize', organizationId: orgId }),
        });
        const oracleData = await oracleRes.json();
        orgResult.steps.oracle = { success: oracleRes.ok, job_id: oracleData?.job_id };
      } catch (err) {
        orgResult.steps.oracle = { success: false, error: String(err) };
      }

      // Step 2: Trigger health snapshots for all entities
      try {
        const snapRes = await fetch(`${supabaseUrl}/functions/v1/health-snapshot`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ organization_id: orgId, triggered_by: 'cron' }),
        });
        const snapData = await snapRes.json();
        orgResult.steps.health_snapshot = { success: snapRes.ok, count: snapData?.count };

        // Step 2b: Check for significant score drops and generate alerts
        if (snapData?.results) {
          await generateScoreAlerts(supabaseUrl, headers, orgId, snapData.results);
        }
      } catch (err) {
        orgResult.steps.health_snapshot = { success: false, error: String(err) };
      }

      // Step 3: Trigger portfolio insights extraction
      try {
        const insightsRes = await fetch(`${supabaseUrl}/functions/v1/portfolio-insights-extractor`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${serviceRoleKey}` },
          body: JSON.stringify({ organization_id: orgId }),
        });
        const insightsData = await insightsRes.json();
        orgResult.steps.portfolio_insights = { success: insightsRes.ok, insights: insightsData?.insights_count };
      } catch (err) {
        orgResult.steps.portfolio_insights = { success: false, error: String(err) };
      }

      // Step 4: Create a synthesis-complete alert
      await insertAlert(supabaseUrl, headers, {
        organization_id: orgId,
        alert_type: 'synthesis_complete',
        severity: 'info',
        title: 'Scheduled Intelligence Run Complete',
        message: `Automated intelligence pipeline completed: Oracle synthesis, health snapshots, and portfolio insights extracted.`,
        metadata: { triggered_by, steps: orgResult.steps },
      });

      results.push(orgResult);
    }

    return new Response(JSON.stringify({ success: true, organizations_processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scheduled intelligence error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Analyze health snapshot results and create alerts for significant score drops
 */
async function generateScoreAlerts(
  supabaseUrl: string,
  headers: Record<string, string>,
  orgId: string,
  snapResults: any[]
) {
  const DROP_THRESHOLD = -5; // Alert if score drops by 5+ points

  for (const snap of snapResults) {
    if (!snap?.score_deltas) continue;

    const deltas = snap.score_deltas;
    const entityName = snap.entity_name || 'Unknown';
    const entityType = snap.entity_type || 'brand';

    // Check each score dimension for significant drops
    const checks = [
      { key: 'brand_health', label: 'Brand Health', type: 'health_warning' },
      { key: 'compliance', label: 'Compliance', type: 'compliance_drop' },
      { key: 'bias', label: 'Bias & Inclusion', type: 'bias_drop' },
      { key: 'website', label: 'Website', type: 'score_drop' },
      { key: 'competitive', label: 'Competitive', type: 'score_drop' },
    ];

    for (const check of checks) {
      const delta = deltas[check.key];
      if (delta != null && delta <= DROP_THRESHOLD) {
        const severity = delta <= -15 ? 'critical' : delta <= -10 ? 'warning' : 'info';
        await insertAlert(supabaseUrl, headers, {
          organization_id: orgId,
          entity_name: entityName,
          entity_type: entityType,
          alert_type: check.type,
          severity,
          title: `${check.label} Score Drop: ${entityName}`,
          message: `${entityName}'s ${check.label.toLowerCase()} score dropped by ${Math.abs(delta).toFixed(1)} points since the last snapshot.`,
          metadata: { delta, dimension: check.key, current_score: snap.brand_health_score },
        });
      }
    }
  }
}

async function insertAlert(
  supabaseUrl: string,
  headers: Record<string, string>,
  alert: Record<string, any>
) {
  try {
    await fetch(`${supabaseUrl}/rest/v1/intelligence_alerts`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(alert),
    });
  } catch (err) {
    console.error('Failed to insert alert:', err);
  }
}
