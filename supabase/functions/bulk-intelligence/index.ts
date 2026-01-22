import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  brand_summary: string;
  market_position: string;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  };
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  };
  growth_recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }>;
  key_insights: string[];
}

interface ExistingIntelligence {
  id: string;
  analysis_count: number;
  last_analyzed_at: string | null;
  knowledge_entries: Array<Record<string, unknown>>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entityId, entityType, skipRecent = true } = await req.json().catch(() => ({}));

    // Use service role for bulk operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // If specific entity provided, process only that one
    if (entityId && entityType) {
      const tableName = entityType === 'brand' ? 'brands' : 'products';
      const { data: entity, error } = await supabaseAdmin
        .from(tableName)
        .select('id, name, guide_data')
        .eq('id', entityId)
        .single();

      if (error || !entity) {
        return new Response(
          JSON.stringify({ error: 'Entity not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await processEntity(
        supabaseAdmin,
        LOVABLE_API_KEY,
        entity.id,
        entity.name,
        entityType,
        entity.guide_data as Record<string, unknown>,
        skipRecent
      );

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise, return list of entities that need processing
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name');

    const { data: brands } = await supabaseAdmin
      .from('brands')
      .select('id, name');

    return new Response(
      JSON.stringify({
        message: 'Provide entityId and entityType to process a specific entity',
        products: products?.map(p => ({ id: p.id, name: p.name })) || [],
        brands: brands?.map(b => ({ id: b.id, name: b.name })) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[bulk-intelligence] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Operation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processEntity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  apiKey: string,
  entityId: string,
  entityName: string,
  entityType: 'brand' | 'product',
  guideData: Record<string, unknown>,
  skipRecent: boolean
): Promise<{ entity: string; status: string; error?: string }> {
  try {
    console.log(`Processing ${entityType}: ${entityName}`);

    // Check if intelligence already exists
    const { data: existingIntelRaw } = await supabaseAdmin
      .from('brand_intelligence')
      .select('id, analysis_count, last_analyzed_at, knowledge_entries')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .single();

    const existingIntel = existingIntelRaw as ExistingIntelligence | null;

    // Skip if recently analyzed
    if (skipRecent && existingIntel?.last_analyzed_at) {
      const lastAnalyzed = new Date(existingIntel.last_analyzed_at);
      const hoursSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        console.log(`Skipping ${entityName} - analyzed ${hoursSinceAnalysis.toFixed(1)} hours ago`);
        return { entity: entityName, status: 'skipped', error: 'Recently analyzed' };
      }
    }

    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(entityName, entityType, guideData);

    // Call AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a brand strategist and market analyst. Analyze the provided brand/product information and return a comprehensive brand intelligence report.

Return your analysis as a JSON object with this exact structure:
{
  "brand_summary": "2-3 sentence executive summary of the brand/product",
  "market_position": "Description of market positioning and competitive landscape",
  "target_audience": {
    "primary": "Primary target audience description",
    "secondary": ["Secondary audience 1", "Secondary audience 2"],
    "demographics": ["Age range", "Industry", "Role/Title"]
  },
  "competitive_advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "brand_voice_profile": {
    "tone": ["Tone descriptor 1", "Tone descriptor 2"],
    "personality": ["Personality trait 1", "Personality trait 2"],
    "communication_style": "Description of communication approach"
  },
  "growth_recommendations": [
    {"priority": "high", "recommendation": "Recommendation text", "rationale": "Why this matters"},
    {"priority": "medium", "recommendation": "Recommendation text", "rationale": "Why this matters"}
  ],
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"]
}

Be specific, actionable, and insightful. Base analysis on the actual brand data provided.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI error for ${entityName}:`, errorText);
      return { entity: entityName, status: 'failed', error: 'AI gateway error' };
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return { entity: entityName, status: 'failed', error: 'No AI response' };
    }

    // Parse JSON from response
    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch {
      console.error(`Parse error for ${entityName}:`, content);
      return { entity: entityName, status: 'failed', error: 'JSON parse failed' };
    }

    // Merge with existing knowledge entries
    const existingEntries = existingIntel?.knowledge_entries || [];
    const now = new Date().toISOString();
    
    const newInsights = analysisResult.key_insights.map((insight, i) => ({
      id: `ai-insight-${Date.now()}-${i}`,
      type: 'insight',
      content: insight,
      source: 'ai',
      category: 'analysis',
      created_at: now
    }));

    // Upsert intelligence record
    const intelligenceData = {
      entity_id: entityId,
      entity_type: entityType,
      brand_summary: analysisResult.brand_summary,
      market_position: analysisResult.market_position,
      target_audience: analysisResult.target_audience,
      competitive_advantages: analysisResult.competitive_advantages,
      brand_voice_profile: analysisResult.brand_voice_profile,
      growth_recommendations: analysisResult.growth_recommendations,
      knowledge_entries: [...existingEntries.filter((e: Record<string, unknown>) => e.source !== 'ai'), ...newInsights],
      analysis_count: (existingIntel?.analysis_count || 0) + 1,
      last_analyzed_at: now,
      updated_at: now
    };

    if (existingIntel?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('brand_intelligence')
        .update(intelligenceData)
        .eq('id', existingIntel.id);

      if (updateError) {
        console.error(`[bulk-intelligence] Update error for ${entityName}:`, updateError);
        return { entity: entityName, status: 'failed', error: 'Update failed' };
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('brand_intelligence')
        .insert({
          ...intelligenceData,
          created_at: now
        });

      if (insertError) {
        console.error(`[bulk-intelligence] Insert error for ${entityName}:`, insertError);
        return { entity: entityName, status: 'failed', error: 'Insert failed' };
      }
    }

    console.log(`✓ Completed analysis for ${entityName}`);
    return { entity: entityName, status: 'success' };

  } catch (entityError) {
    console.error(`[bulk-intelligence] Error processing ${entityName}:`, entityError);
    return { entity: entityName, status: 'failed', error: 'Processing failed' };
  }
}

function buildAnalysisPrompt(name: string, entityType: string, guideData: Record<string, unknown>): string {
  const sections: string[] = [];

  sections.push(`# ${entityType === 'brand' ? 'Brand' : 'Product'} Analysis Request: ${name}`);

  const hero = guideData.hero as Record<string, unknown> | undefined;
  if (hero) {
    sections.push(`\n## Identity`);
    sections.push(`- Name: ${hero.name || name}`);
    sections.push(`- Tagline: ${hero.tagline || 'Not defined'}`);
  }

  const identity = guideData.identity as Record<string, unknown> | undefined;
  if (identity) {
    sections.push(`\n## Brand Narrative`);
    sections.push(`- Mission: ${identity.missionStatement || 'Not defined'}`);
    sections.push(`- Archetype: ${identity.archetype || 'Not defined'}`);
    const toneOfVoice = identity.toneOfVoice as string[] | undefined;
    sections.push(`- Tone of Voice: ${toneOfVoice?.join(', ') || 'Not defined'}`);
  }

  const values = guideData.values as Array<{ title: string; description: string }> | undefined;
  if (values && values.length > 0) {
    sections.push(`\n## Brand Values`);
    values.forEach((v, i) => {
      sections.push(`${i + 1}. ${v.title}: ${v.description || 'No description'}`);
    });
  }

  const services = guideData.services as Array<{ name: string; description: string }> | undefined;
  if (services && services.length > 0) {
    sections.push(`\n## Services/Features (${services.length})`);
    services.slice(0, 10).forEach((s, i) => {
      sections.push(`${i + 1}. ${s.name}: ${s.description || 'No description'}`);
    });
  }

  const colors = guideData.colors as Array<{ name: string; hex: string }> | undefined;
  if (colors && colors.length > 0) {
    sections.push(`\n## Brand Colors: ${colors.length} defined`);
  }

  const typography = guideData.typography as Array<{ name: string; fontFamily: string }> | undefined;
  if (typography && typography.length > 0) {
    sections.push(`\n## Typography: ${typography.length} styles defined`);
  }

  sections.push(`\n\nPlease analyze this ${entityType} and provide comprehensive brand intelligence insights.`);

  return sections.join('\n');
}
