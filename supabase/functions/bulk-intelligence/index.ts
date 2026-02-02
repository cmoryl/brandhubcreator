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
  competitive_landscape?: {
    tracked_competitors: string[];
    positioning_summary: string;
    competitive_gaps: string[];
    differentiation_opportunities: string[];
    threat_assessment: Array<{
      competitor: string;
      threat_level: 'high' | 'medium' | 'low';
      key_threat: string;
    }>;
    market_share_estimate: string;
  };
}

interface FavoriteCompetitor {
  name: string;
  competitor_type: string;
  reason: string | null;
  industry: string | null;
}

interface CompetitiveReport {
  competitors: string[];
  report_data: {
    marketPerception?: {
      keyStrengths?: string[];
      criticalGaps?: string[];
      risks?: string[];
    };
    brandPositioning?: {
      differentiation?: string[];
    };
  };
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
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user client to verify the caller
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { entityId, entityType, skipRecent = true } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // If specific entity provided, process only that one
    if (entityId && entityType) {
      const tableName = entityType === 'brand' ? 'brands' : 'products';
      const { data: entity, error } = await supabaseAdmin
        .from(tableName)
        .select('id, name, guide_data, organization_id')
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
        skipRecent,
        entity.organization_id
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
  skipRecent: boolean,
  organizationId?: string | null
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

    // Fetch favorite competitors for this organization
    let favoriteCompetitors: FavoriteCompetitor[] = [];
    if (organizationId) {
      const { data: favoritesRaw } = await supabaseAdmin
        .from('favorite_competitors')
        .select('name, competitor_type, reason, industry')
        .eq('organization_id', organizationId);
      favoriteCompetitors = (favoritesRaw || []) as FavoriteCompetitor[];
    }

    // Fetch recent competitive analysis reports for this entity
    let competitiveReports: CompetitiveReport[] = [];
    const { data: reportsRaw } = await supabaseAdmin
      .from('competitive_analysis_reports')
      .select('competitors, report_data')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
      .limit(3);
    competitiveReports = (reportsRaw || []) as CompetitiveReport[];

    // Build analysis prompt with competitive context
    const analysisPrompt = buildAnalysisPrompt(entityName, entityType, guideData, favoriteCompetitors, competitiveReports);

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
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "competitive_landscape": {
    "tracked_competitors": ["Competitor 1", "Competitor 2"],
    "positioning_summary": "How this brand is positioned relative to competitors",
    "competitive_gaps": ["Gap 1", "Gap 2"],
    "differentiation_opportunities": ["Opportunity 1", "Opportunity 2"],
    "threat_assessment": [
      {"competitor": "Competitor name", "threat_level": "high|medium|low", "key_threat": "Description of threat"}
    ],
    "market_share_estimate": "Estimated market position (e.g., 'Top 5 in enterprise segment')"
  }
}

IMPORTANT: If competitor information is provided in the prompt, use it to inform your competitive_landscape analysis. Be specific about how this brand compares to named competitors. If no competitor data is provided, make reasonable inferences based on the brand's market and positioning.

Be specific, actionable, and insightful. Base analysis on the actual brand data provided.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
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

function buildAnalysisPrompt(
  name: string,
  entityType: string,
  guideData: Record<string, unknown>,
  favoriteCompetitors: FavoriteCompetitor[],
  competitiveReports: CompetitiveReport[]
): string {
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

  // Add competitive context if available
  if (favoriteCompetitors.length > 0 || competitiveReports.length > 0) {
    sections.push(`\n## Competitive Context`);
    
    if (favoriteCompetitors.length > 0) {
      sections.push(`\n### Tracked Competitors (${favoriteCompetitors.length})`);
      favoriteCompetitors.forEach((c, i) => {
        const details = [c.competitor_type];
        if (c.industry) details.push(`industry: ${c.industry}`);
        if (c.reason) details.push(`reason: ${c.reason}`);
        sections.push(`${i + 1}. ${c.name} (${details.join(', ')})`);
      });
    }

    if (competitiveReports.length > 0) {
      sections.push(`\n### Previous Competitive Analysis Insights`);
      competitiveReports.forEach((report, i) => {
        const reportData = report.report_data || {};
        sections.push(`\nReport ${i + 1} (vs ${report.competitors?.join(', ') || 'unknown'}):`);
        
        if (reportData.marketPerception?.keyStrengths?.length) {
          sections.push(`- Key Strengths: ${reportData.marketPerception.keyStrengths.slice(0, 3).join('; ')}`);
        }
        if (reportData.marketPerception?.criticalGaps?.length) {
          sections.push(`- Critical Gaps: ${reportData.marketPerception.criticalGaps.slice(0, 3).join('; ')}`);
        }
        if (reportData.brandPositioning?.differentiation?.length) {
          sections.push(`- Differentiation: ${reportData.brandPositioning.differentiation.slice(0, 3).join('; ')}`);
        }
        if (reportData.marketPerception?.risks?.length) {
          sections.push(`- Risks: ${reportData.marketPerception.risks.slice(0, 2).join('; ')}`);
        }
      });
    }
  }

  sections.push(`\n\nPlease analyze this ${entityType} and provide comprehensive brand intelligence insights. ${favoriteCompetitors.length > 0 || competitiveReports.length > 0 ? 'Use the competitive context provided to inform your competitive_landscape analysis with specific insights about how this brand compares to its tracked competitors.' : ''}`);

  return sections.join('\n');
}
