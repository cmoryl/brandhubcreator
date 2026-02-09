import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ResearchRequest {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  briefingType?: 'daily' | 'weekly' | 'deep-dive';
  focusAreas?: string[];
}

interface BriefingResult {
  title: string;
  summary: string;
  marketIntelligence: {
    industryTrends: string[];
    marketShifts: string[];
    emergingOpportunities: string[];
  };
  competitiveInsights: {
    positioningGaps: string[];
    differentiationOpportunities: string[];
    threatAssessment: string[];
  };
  trendAnalysis: {
    risingTrends: string[];
    decliningTrends: string[];
    futureProjections: string[];
  };
  sentimentSignals: {
    positiveIndicators: string[];
    concernAreas: string[];
    neutralObservations: string[];
  };
  strategicRecommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    timeframe: string;
  }[];
  growthOpportunities: {
    opportunity: string;
    potentialImpact: string;
    requiredInvestment: string;
  }[];
  riskAlerts: {
    risk: string;
    severity: 'critical' | 'moderate' | 'low';
    mitigation: string;
  }[];
  priorityActions: string[];
  suggestedUpdates: {
    section: string;
    currentState: string;
    suggestedChange: string;
    reason: string;
  }[];
  confidenceScore: number;
  urgencyLevel: 'low' | 'normal' | 'high' | 'critical';
}

function extractBrandContext(guideData: Record<string, unknown>): string {
  const hero = guideData?.hero as Record<string, string> | undefined;
  const identity = guideData?.identity as Record<string, unknown> | undefined;
  const values = guideData?.values as Array<{ text: string; description: string }> | undefined;
  const colors = guideData?.colors as Array<{ name: string; hex: string }> | undefined;
  const services = guideData?.services as Array<{ name: string; description: string }> | undefined;
  const tagline = guideData?.tagline as Record<string, unknown> | undefined;
  const voice = guideData?.voice as Record<string, unknown> | undefined;
  const social = guideData?.social as Array<{ platform: string; handle: string }> | undefined;
  
  const parts: string[] = [];
  
  if (hero?.name) parts.push(`Brand Name: ${hero.name}`);
  if (hero?.tagline) parts.push(`Tagline: ${hero.tagline}`);
  if (tagline?.primary) parts.push(`Primary Tagline: ${tagline.primary}`);
  if (identity?.missionStatement) parts.push(`Mission: ${identity.missionStatement}`);
  if (identity?.visionStatement) parts.push(`Vision: ${identity.visionStatement}`);
  if (identity?.archetype) parts.push(`Brand Archetype: ${identity.archetype}`);
  if (identity?.toneOfVoice) parts.push(`Tone: ${(identity.toneOfVoice as string[])?.join(', ')}`);
  if (identity?.industry) parts.push(`Industry: ${identity.industry}`);
  
  if (values?.length) {
    parts.push(`Core Values:\n${values.slice(0, 5).map(v => `  - ${v.text}: ${v.description || ''}`).join('\n')}`);
  }
  
  if (services?.length) {
    parts.push(`Products/Services:\n${services.slice(0, 5).map(s => `  - ${s.name}: ${s.description || ''}`).join('\n')}`);
  }
  
  if (voice?.pillars) {
    const pillars = voice.pillars as Array<{ title: string; description: string }>;
    parts.push(`Voice Pillars:\n${pillars.slice(0, 4).map(p => `  - ${p.title}`).join('\n')}`);
  }
  
  if (social?.length) {
    parts.push(`Social Presence: ${social.slice(0, 4).map(s => s.platform).join(', ')}`);
  }
  
  if (colors?.length) {
    parts.push(`Brand Colors: ${colors.slice(0, 4).map(c => c.name).join(', ')}`);
  }
  
  return parts.join('\n\n') || 'No detailed brand data available';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { entityId, entityType, briefingType = 'daily', focusAreas = [] } = await req.json() as ResearchRequest;

    if (!entityId || !entityType) {
      return new Response(
        JSON.stringify({ error: 'entityId and entityType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch entity data
    let entityData: { name: string; guide_data: Record<string, unknown>; organization_id?: string } | null = null;
    
    if (entityType === 'brand') {
      const { data } = await supabaseClient
        .from('brands')
        .select('name, guide_data, organization_id')
        .eq('id', entityId)
        .single();
      entityData = data;
    } else if (entityType === 'product') {
      const { data } = await supabaseClient
        .from('products')
        .select('name, guide_data, organization_id')
        .eq('id', entityId)
        .single();
      entityData = data;
    } else if (entityType === 'event') {
      const { data } = await supabaseClient
        .from('events')
        .select('name, guide_data, organization_id')
        .eq('id', entityId)
        .single();
      entityData = data;
    }

    if (!entityData) {
      return new Response(
        JSON.stringify({ error: 'Entity not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing brand intelligence
    const { data: intelligence } = await supabaseClient
      .from('brand_intelligence')
      .select('brand_summary, market_position, competitive_landscape, growth_recommendations')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .single();

    // Fetch recent competitive reports
    const { data: competitiveReports } = await supabaseClient
      .from('competitive_analysis_reports')
      .select('report_data, created_at')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(2);

    // Fetch favorite competitors for context
    const { data: competitors } = await supabaseClient
      .from('favorite_competitors')
      .select('name, competitor_type, industry')
      .limit(5);

    const brandContext = extractBrandContext(entityData.guide_data);
    
    const contextSections: string[] = [
      `# ${entityData.name} - Brand Research Briefing`,
      '',
      '## Current Brand Profile',
      brandContext,
    ];

    if (intelligence?.brand_summary) {
      contextSections.push('', '## AI-Generated Brand Summary', intelligence.brand_summary);
    }

    if (intelligence?.market_position) {
      contextSections.push('', '## Current Market Position', intelligence.market_position);
    }

    if (intelligence?.competitive_landscape) {
      const landscape = intelligence.competitive_landscape as Record<string, unknown>;
      if (landscape.summary) {
        contextSections.push('', '## Competitive Landscape', landscape.summary as string);
      }
    }

    if (competitors?.length) {
      contextSections.push('', '## Key Competitors Being Tracked', 
        competitors.map(c => `- ${c.name} (${c.competitor_type})`).join('\n'));
    }

    if (competitiveReports?.length) {
      contextSections.push('', '## Recent Competitive Analysis',
        `${competitiveReports.length} report(s) on file, latest from ${new Date(competitiveReports[0].created_at).toLocaleDateString()}`);
    }

    const focusAreasText = focusAreas.length > 0 
      ? `\n\nFocus especially on: ${focusAreas.join(', ')}` 
      : '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an elite brand strategy research analyst with expertise in:
- Market intelligence and trend forecasting
- Competitive positioning and differentiation strategy
- Brand health monitoring and sentiment analysis
- Growth opportunity identification
- Risk assessment and mitigation planning

Your role is to analyze brand data and generate actionable research briefings that help brand managers make strategic decisions.

IMPORTANT GUIDELINES:
1. Be specific and actionable - every insight should lead to a clear next step
2. Prioritize insights by business impact
3. Consider both short-term tactics and long-term strategy
4. Base recommendations on the brand's values, positioning, and industry context
5. Identify both opportunities and risks with equal rigor
6. Suggest concrete updates to brand sections when improvements would help

Output format: Return ONLY valid JSON matching the specified structure. No markdown formatting, no code blocks.`;

    const userPrompt = `Generate a ${briefingType} research briefing for ${entityData.name}.

${contextSections.join('\n')}${focusAreasText}

Analyze all available data and produce a comprehensive briefing with:
1. Market intelligence - current industry trends and shifts affecting this brand
2. Competitive insights - positioning gaps, differentiation opportunities, threats
3. Trend analysis - rising/declining trends relevant to this brand's space
4. Sentiment signals - positive indicators and areas of concern
5. Strategic recommendations - prioritized actions with rationale
6. Growth opportunities - specific areas for expansion or improvement
7. Risk alerts - potential threats with mitigation strategies
8. Priority actions - top 3-5 things to focus on immediately
9. Suggested updates - specific changes to brand guide sections
10. Confidence score (0-100) based on data quality
11. Urgency level (low/normal/high/critical)

Return JSON matching this exact structure:
{
  "title": "Briefing title",
  "summary": "2-3 sentence executive summary",
  "marketIntelligence": {
    "industryTrends": ["trend1", "trend2"],
    "marketShifts": ["shift1"],
    "emergingOpportunities": ["opp1"]
  },
  "competitiveInsights": {
    "positioningGaps": ["gap1"],
    "differentiationOpportunities": ["diff1"],
    "threatAssessment": ["threat1"]
  },
  "trendAnalysis": {
    "risingTrends": ["trend1"],
    "decliningTrends": ["trend1"],
    "futureProjections": ["projection1"]
  },
  "sentimentSignals": {
    "positiveIndicators": ["indicator1"],
    "concernAreas": ["concern1"],
    "neutralObservations": ["obs1"]
  },
  "strategicRecommendations": [
    {"priority": "high", "action": "...", "rationale": "...", "timeframe": "Q1 2026"}
  ],
  "growthOpportunities": [
    {"opportunity": "...", "potentialImpact": "...", "requiredInvestment": "..."}
  ],
  "riskAlerts": [
    {"risk": "...", "severity": "moderate", "mitigation": "..."}
  ],
  "priorityActions": ["action1", "action2"],
  "suggestedUpdates": [
    {"section": "identity", "currentState": "...", "suggestedChange": "...", "reason": "..."}
  ],
  "confidenceScore": 75,
  "urgencyLevel": "normal"
}`;

    console.log(`[brand-research] Generating ${briefingType} briefing for ${entityData.name}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    let briefingResult: BriefingResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      briefingResult = JSON.parse(jsonStr);
    } catch {
      console.error('[brand-research] Failed to parse AI response:', content.substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'Failed to parse research results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the briefing in the database
    const { data: savedBriefing, error: saveError } = await supabaseClient
      .from('research_briefings')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: entityData.organization_id || null,
        briefing_type: briefingType,
        title: briefingResult.title,
        summary: briefingResult.summary,
        market_intelligence: briefingResult.marketIntelligence,
        competitive_insights: briefingResult.competitiveInsights,
        trend_analysis: briefingResult.trendAnalysis,
        sentiment_signals: briefingResult.sentimentSignals,
        strategic_recommendations: briefingResult.strategicRecommendations,
        growth_opportunities: briefingResult.growthOpportunities,
        risk_alerts: briefingResult.riskAlerts,
        priority_actions: briefingResult.priorityActions,
        suggested_updates: briefingResult.suggestedUpdates,
        confidence_score: briefingResult.confidenceScore,
        urgency_level: briefingResult.urgencyLevel,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[brand-research] Failed to save briefing:', saveError);
    }

    console.log(`[brand-research] Briefing generated for ${entityData.name}. Confidence: ${briefingResult.confidenceScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        briefing: briefingResult,
        briefingId: savedBriefing?.id,
        entityName: entityData.name,
        entityType,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Research failed';
    console.error('[brand-research] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
