/**
 * Generate Portfolio Relationships Edge Function
 * Analyzes all entities in an org and creates enriched relationship mappings using AI.
 * Includes anomaly detection, multi-dimensional scoring, and portfolio coherence analysis.
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

    // Verify AI permissions
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/can_use_ai_features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey },
      body: JSON.stringify({ _user_id: userData.id }),
    });
    if (!(await rpcRes.json())) {
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

    // Fetch all entities with richer context
    const [brandsRes, productsRes, eventsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/brands?organization_id=eq.${organization_id}&select=id,name,slug,guide_data&limit=50`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/products?organization_id=eq.${organization_id}&select=id,name,slug,parent_brand_id,guide_data&limit=100`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/events?organization_id=eq.${organization_id}&select=id,name,slug,parent_brand_id,guide_data&limit=100`, { headers: svcHeaders }),
    ]);

    const [brands, products, events] = await Promise.all([
      brandsRes.json(), productsRes.json(), eventsRes.json(),
    ]);

    // Build enriched entity summaries
    const entities: any[] = [];
    for (const b of (brands || [])) {
      const gd = b.guide_data || {};
      const colors = Array.isArray(gd.colors) ? gd.colors.slice(0, 5).map((c: any) => c?.hex || c?.name).filter(Boolean) : [];
      const values = Array.isArray(gd.values) ? gd.values.slice(0, 5).map((v: any) => v?.text).filter(Boolean) : [];
      const fonts = Array.isArray(gd.typography) ? gd.typography.slice(0, 3).map((t: any) => t?.fontFamily || t?.family).filter(Boolean) : [];
      entities.push({
        id: b.id, name: b.name, type: 'brand',
        archetype: gd.identity?.archetype,
        mission: gd.identity?.missionStatement?.slice(0, 150),
        vision: gd.identity?.visionStatement?.slice(0, 100),
        industry: gd.industry,
        tagline: gd.hero?.tagline?.slice(0, 100),
        voiceTone: gd.identity?.voiceTone?.slice(0, 80),
        colors, values, fonts,
      });
    }
    for (const p of (products || [])) {
      const gd = p.guide_data || {};
      const colors = Array.isArray(gd.colors) ? gd.colors.slice(0, 5).map((c: any) => c?.hex || c?.name).filter(Boolean) : [];
      entities.push({
        id: p.id, name: p.name, type: 'product',
        parent_brand_id: p.parent_brand_id,
        tagline: gd.hero?.tagline?.slice(0, 100),
        archetype: gd.identity?.archetype,
        voiceTone: gd.identity?.voiceTone?.slice(0, 80),
        colors,
      });
    }
    for (const e of (events || [])) {
      const gd = e.guide_data || {};
      entities.push({
        id: e.id, name: e.name, type: 'event',
        parent_brand_id: e.parent_brand_id,
        tagline: gd.hero?.tagline?.slice(0, 100),
        voiceTone: gd.identity?.voiceTone?.slice(0, 80),
      });
    }

    if (entities.length < 2) {
      return new Response(JSON.stringify({ error: 'Need at least 2 entities to map relationships' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enriched AI prompt with anomaly detection and dimensional scoring
    const systemPrompt = `You are an expert brand portfolio analyst performing deep relationship and coherence analysis. Given a list of brand entities, perform three analyses:

## 1. RELATIONSHIPS
For each meaningful pair, score across dimensions:
- relationship_type: "alignment" | "voice_consistency" | "audience_overlap" | "parent_child" | "visual_coherence" | "strategic_complement" | "competitive_tension"
- strength_score: 0-100 overall strength
- dimensions: { voice: 0-100, visual: 0-100, audience: 0-100, strategic: 0-100 }
- rationale: one concise sentence

Include parent_child for any entity with parent_brand_id. Max 40 relationships. Focus on meaningful connections.

## 2. ANOMALIES
Detect problematic patterns:
- entity_pair: [source_id, target_id]
- anomaly_type: "voice_mismatch" | "audience_conflict" | "visual_inconsistency" | "strategic_misalignment" | "orphan_entity" | "over_coupling"
- anomaly_score: 0-100 (severity)
- description: what's wrong and why it matters

For orphan entities (no parent, no clear relationship), use the entity id for both source and target.

## 3. PORTFOLIO COHERENCE
Overall org-level scores:
- overall_score: 0-100
- voice_coherence: 0-100 (how consistent is the voice across entities)
- visual_coherence: 0-100 (color/font alignment)
- audience_coherence: 0-100 (audience overlap vs fragmentation)
- strategic_coherence: 0-100 (do entities support a unified strategy)
- insights: string[] (3-5 key strategic observations)

Respond with ONLY valid JSON in this exact shape:
{
  "relationships": [...],
  "anomalies": [...],
  "coherence": { overall_score, voice_coherence, visual_coherence, audience_coherence, strategic_coherence, insights }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(entities) },
        ],
        max_tokens: 6000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    let rawText = aiData.choices?.[0]?.message?.content || '{}';
    rawText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = {}; }
      } else {
        parsed = {};
      }
    }

    const aiRelationships = Array.isArray(parsed.relationships) ? parsed.relationships : [];
    const aiAnomalies = Array.isArray(parsed.anomalies) ? parsed.anomalies : [];
    const coherence = parsed.coherence || {};

    const entityMap = new Map(entities.map(e => [e.id, e]));

    // Clear existing relationships
    await fetch(`${supabaseUrl}/rest/v1/portfolio_relationships?organization_id=eq.${organization_id}`, {
      method: 'DELETE',
      headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
    });

    // Insert enriched relationships
    let insertCount = 0;
    for (const rel of aiRelationships) {
      const srcId = rel.source_id || rel.source;
      const tgtId = rel.target_id || rel.target;
      const src = entityMap.get(srcId);
      const tgt = entityMap.get(tgtId);
      if (!src || !tgt || src.id === tgt.id) continue;

      // Check if this pair has an anomaly
      const matchingAnomaly = aiAnomalies.find((a: any) => {
        const pair = a.entity_pair || [];
        return (pair[0] === src.id && pair[1] === tgt.id) || (pair[0] === tgt.id && pair[1] === src.id);
      });

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/portfolio_relationships`, {
        method: 'POST',
        headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          organization_id,
          source_entity_id: src.id,
          source_entity_type: src.type,
          source_entity_name: src.name,
          target_entity_id: tgt.id,
          target_entity_type: tgt.type,
          target_entity_name: tgt.name,
          relationship_type: rel.relationship_type || 'alignment',
          strength_score: Math.min(100, Math.max(0, rel.strength_score || 50)),
          rationale: rel.rationale || '',
          dimensions: rel.dimensions || {},
          anomaly_type: matchingAnomaly?.anomaly_type || null,
          anomaly_score: matchingAnomaly?.anomaly_score || null,
          metadata: {
            rationale: rel.rationale || '',
            anomaly_description: matchingAnomaly?.description || null,
          },
        }),
      });

      if (insertRes.ok) insertCount++;
    }

    // Upsert portfolio coherence
    const coherencePayload = {
      organization_id,
      overall_score: Math.min(100, Math.max(0, coherence.overall_score || 0)),
      voice_coherence: Math.min(100, Math.max(0, coherence.voice_coherence || 0)),
      visual_coherence: Math.min(100, Math.max(0, coherence.visual_coherence || 0)),
      audience_coherence: Math.min(100, Math.max(0, coherence.audience_coherence || 0)),
      strategic_coherence: Math.min(100, Math.max(0, coherence.strategic_coherence || 0)),
      anomaly_count: aiAnomalies.length,
      anomalies: aiAnomalies,
      insights: Array.isArray(coherence.insights) ? coherence.insights : [],
      entity_count: entities.length,
      relationship_count: insertCount,
    };

    await fetch(`${supabaseUrl}/rest/v1/portfolio_coherence`, {
      method: 'POST',
      headers: { ...svcHeaders, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(coherencePayload),
    });

    return new Response(JSON.stringify({
      success: true,
      relationships_count: insertCount,
      anomalies_count: aiAnomalies.length,
      entities_analyzed: entities.length,
      coherence: {
        overall: coherencePayload.overall_score,
        voice: coherencePayload.voice_coherence,
        visual: coherencePayload.visual_coherence,
        audience: coherencePayload.audience_coherence,
        strategic: coherencePayload.strategic_coherence,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate relationships error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
