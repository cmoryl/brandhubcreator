/**
 * Generate Portfolio Relationships Edge Function
 * Analyzes all entities in an org and creates relationship mappings using AI.
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

    // Fetch all entities
    const [brandsRes, productsRes, eventsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/brands?organization_id=eq.${organization_id}&select=id,name,slug,guide_data&limit=50`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/products?organization_id=eq.${organization_id}&select=id,name,slug,parent_brand_id,guide_data&limit=100`, { headers: svcHeaders }),
      fetch(`${supabaseUrl}/rest/v1/events?organization_id=eq.${organization_id}&select=id,name,slug,parent_brand_id,guide_data&limit=100`, { headers: svcHeaders }),
    ]);

    const [brands, products, events] = await Promise.all([
      brandsRes.json(), productsRes.json(), eventsRes.json(),
    ]);

    // Build entity summaries for AI
    const entities: any[] = [];
    for (const b of (brands || [])) {
      const gd = b.guide_data || {};
      entities.push({
        id: b.id, name: b.name, type: 'brand',
        archetype: gd.identity?.archetype,
        mission: gd.identity?.missionStatement?.slice(0, 100),
        industry: gd.industry,
        tagline: gd.hero?.tagline?.slice(0, 80),
      });
    }
    for (const p of (products || [])) {
      const gd = p.guide_data || {};
      entities.push({
        id: p.id, name: p.name, type: 'product',
        parent_brand_id: p.parent_brand_id,
        tagline: gd.hero?.tagline?.slice(0, 80),
        archetype: gd.identity?.archetype,
      });
    }
    for (const e of (events || [])) {
      const gd = e.guide_data || {};
      entities.push({
        id: e.id, name: e.name, type: 'event',
        parent_brand_id: e.parent_brand_id,
        tagline: gd.hero?.tagline?.slice(0, 80),
      });
    }

    if (entities.length < 2) {
      return new Response(JSON.stringify({ error: 'Need at least 2 entities to map relationships' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to determine relationships
    const systemPrompt = `You are a brand portfolio analyst. Given a list of brand entities, identify meaningful relationships between them. For each relationship, provide:
- source_id: entity id
- target_id: entity id  
- relationship_type: one of "alignment" (strategic/voice alignment), "voice_consistency" (similar tone), "audience_overlap" (shared audience), "parent_child" (hierarchical)
- strength_score: 0-100 (how strong the relationship is)
- rationale: one sentence why

Return a JSON array of relationship objects. Focus on the most meaningful connections (max 30). Always include parent_child relationships where parent_brand_id exists.

Respond with ONLY valid JSON array, no markdown.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(entities) },
        ],
        max_tokens: 3000,
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
    let rawText = aiData.choices?.[0]?.message?.content || '[]';
    
    // Clean markdown fences
    rawText = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let aiRelationships: any[];
    try {
      aiRelationships = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse AI relationships:', rawText.slice(0, 200));
      aiRelationships = [];
    }

    if (!Array.isArray(aiRelationships)) aiRelationships = [];

    // Build entity lookup
    const entityMap = new Map(entities.map(e => [e.id, e]));

    // Clear existing and insert new
    await fetch(`${supabaseUrl}/rest/v1/portfolio_relationships?organization_id=eq.${organization_id}`, {
      method: 'DELETE',
      headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
    });

    let insertCount = 0;
    for (const rel of aiRelationships) {
      const src = entityMap.get(rel.source_id);
      const tgt = entityMap.get(rel.target_id);
      if (!src || !tgt || src.id === tgt.id) continue;

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
          metadata: { rationale: rel.rationale || '' },
        }),
      });

      if (insertRes.ok) insertCount++;
    }

    return new Response(JSON.stringify({
      success: true,
      relationships_count: insertCount,
      entities_analyzed: entities.length,
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
