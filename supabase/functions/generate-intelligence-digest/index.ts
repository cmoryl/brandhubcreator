/**
 * Generate Intelligence Digest Edge Function
 * Compiles Oracle summaries, health deltas, alerts, and portfolio insights
 * into an AI-generated executive summary for in-app display.
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify JWT
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
    const userData = await userRes.json();
    const userId = userData.id;

    // Verify AI permissions
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/can_use_ai_features`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ _user_id: userId }),
    });
    const canUseAI = await rpcRes.json();
    if (!canUseAI) {
      return new Response(JSON.stringify({ error: 'AI features not available' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { organization_id } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const svcHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    };

    // Fetch data in parallel: oracle intelligence, recent alerts, recent health snapshots, org info, prior digests
    const [oracleRes, alertsRes, snapshotsRes, orgRes, priorDigestsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/oracle_intelligence?organization_id=eq.${organization_id}&select=org_summary,strategic_recommendations,cross_entity_patterns,cultural_readiness,portfolio_analysis,competitive_overview,unified_voice_profile,longitudinal_trends,last_synthesis_at,entity_brain_count,synthesis_count&limit=1`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/intelligence_alerts?organization_id=eq.${organization_id}&order=created_at.desc&limit=15&select=alert_type,severity,title,message,entity_name,entity_type,created_at`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/health_snapshots?organization_id=eq.${organization_id}&order=snapshot_date.desc&limit=20&select=entity_name,entity_type,brand_health_score,compliance_score,bias_inclusion_score,score_deltas,snapshot_date`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${organization_id}&select=name&limit=1`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/intelligence_digests?organization_id=eq.${organization_id}&order=generated_at.desc&limit=3&select=digest,generated_at`, { headers: svcHeaders }),
    ]);

    const [oracleData, alerts, snapshots, orgData, priorDigests] = await Promise.all([
      oracleRes.json(), alertsRes.json(), snapshotsRes.json(), orgRes.json(), priorDigestsRes.json(),
    ]);

    const oracle = Array.isArray(oracleData) ? oracleData[0] : null;
    const orgName = Array.isArray(orgData) && orgData[0] ? orgData[0].name : 'Organization';

    // Build context for AI
    const contextParts: string[] = [];
    contextParts.push(`Organization: ${orgName}`);

    if (oracle?.org_summary) {
      contextParts.push(`\nOracle Summary:\n${oracle.org_summary}`);
    }
    if (oracle?.last_synthesis_at) {
      contextParts.push(`Last synthesis: ${oracle.last_synthesis_at}`);
      contextParts.push(`Entity brains analyzed: ${oracle.entity_brain_count || 0}`);
    }

    // Strategic recommendations
    const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
    if (recs.length > 0) {
      contextParts.push(`\nStrategic Recommendations (${recs.length}):`);
      recs.slice(0, 5).forEach((r: any, i: number) => {
        contextParts.push(`${i + 1}. [${r.priority || 'medium'}] ${r.recommendation}${r.rationale ? ` — ${r.rationale}` : ''}`);
      });
    }

    // Cultural readiness
    if (oracle?.cultural_readiness?.overall_score != null) {
      contextParts.push(`\nCultural Readiness: ${oracle.cultural_readiness.overall_score}%`);
    }

    // Portfolio analysis
    if (oracle?.portfolio_analysis) {
      const pa = oracle.portfolio_analysis;
      if (pa.synergies) contextParts.push(`Portfolio Synergies: ${JSON.stringify(pa.synergies).slice(0, 300)}`);
      if (pa.gaps) contextParts.push(`Portfolio Gaps: ${JSON.stringify(pa.gaps).slice(0, 300)}`);
    }

    // Recent alerts
    const criticalAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'warning') : [];
    if (criticalAlerts.length > 0) {
      contextParts.push(`\nRecent Critical/Warning Alerts (${criticalAlerts.length}):`);
      criticalAlerts.slice(0, 5).forEach((a: any) => {
        contextParts.push(`- [${a.severity.toUpperCase()}] ${a.title}: ${a.message}`);
      });
    }

    // Health snapshot summary
    if (Array.isArray(snapshots) && snapshots.length > 0) {
      contextParts.push(`\nRecent Health Snapshots (${snapshots.length} entities):`);
      snapshots.slice(0, 10).forEach((s: any) => {
        const parts = [`${s.entity_name} (${s.entity_type}): Health=${s.brand_health_score || 'N/A'}`];
        if (s.compliance_score != null) parts.push(`Compliance=${s.compliance_score}`);
        if (s.bias_inclusion_score != null) parts.push(`Inclusion=${s.bias_inclusion_score}`);
        if (s.score_deltas) {
          const deltas = s.score_deltas;
          const drops = Object.entries(deltas).filter(([, v]) => typeof v === 'number' && (v as number) < -3);
          if (drops.length > 0) {
            parts.push(`Drops: ${drops.map(([k, v]) => `${k} ${v}`).join(', ')}`);
          }
        }
        contextParts.push(`- ${parts.join(' | ')}`);
      });
    }

    // Competitive overview
    if (oracle?.competitive_overview?.market_position) {
      contextParts.push(`\nCompetitive Position: ${oracle.competitive_overview.market_position}`);
    }

    // Longitudinal trends from Oracle synthesis
    if (oracle?.longitudinal_trends) {
      const lt = oracle.longitudinal_trends;
      contextParts.push(`\nLongitudinal Trends (from Oracle synthesis):`);
      if (Array.isArray(lt.improvements) && lt.improvements.length) contextParts.push(`Improvements: ${lt.improvements.join('; ')}`);
      if (Array.isArray(lt.regressions) && lt.regressions.length) contextParts.push(`Regressions: ${lt.regressions.join('; ')}`);
      if (Array.isArray(lt.stagnant_areas) && lt.stagnant_areas.length) contextParts.push(`Stagnant: ${lt.stagnant_areas.join('; ')}`);
      if (lt.cycle_over_cycle_insight) contextParts.push(`Cycle Insight: ${lt.cycle_over_cycle_insight}`);
    }

    // Prior digests for historical continuity
    const priorDigestList = Array.isArray(priorDigests) ? priorDigests : [];
    if (priorDigestList.length > 0) {
      contextParts.push(`\nPrior Executive Digests (${priorDigestList.length} most recent):`);
      priorDigestList.forEach((d: any, i: number) => {
        const date = d.generated_at ? new Date(d.generated_at).toLocaleDateString() : 'Unknown';
        contextParts.push(`--- Digest ${i + 1} (${date}) ---\n${(d.digest || '').slice(0, 400)}\n`);
      });
    }

    const systemPrompt = `You are an executive intelligence analyst for a brand management platform. Generate a concise, actionable executive digest based on the data provided. You have access to prior digests — use them to highlight what CHANGED, what IMPROVED, and what REGRESSED since the last cycle. Structure it as:

1. **Executive Summary** (2-3 sentences capturing the big picture and key changes since last cycle)
2. **Key Highlights** (3-5 bullet points of positive developments)
3. **Trend Analysis** (2-3 bullet points comparing this cycle to prior cycles — what improved, what declined)
4. **Attention Required** (2-4 bullet points of concerns or declining metrics)
5. **Strategic Priorities** (2-3 actionable next steps)
6. **Health Pulse** (one-line summary of overall portfolio health)

Use markdown formatting. Be specific with numbers and entity names. Reference prior digest data when noting trends. Keep the total under 700 words. Tone: professional, direct, insight-driven.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-lite-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextParts.join('\n') },
        ],
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const digest = aiData.choices?.[0]?.message?.content || 'Unable to generate digest.';

    return new Response(JSON.stringify({
      success: true,
      digest,
      generated_at: new Date().toISOString(),
      data_sources: {
        has_oracle: !!oracle?.org_summary,
        alerts_count: Array.isArray(alerts) ? alerts.length : 0,
        critical_alerts: criticalAlerts.length,
        snapshots_count: Array.isArray(snapshots) ? snapshots.length : 0,
        recommendations_count: recs.length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate digest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
