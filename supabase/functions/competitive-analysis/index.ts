import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { extractFullBrandContext } from '../_shared/extractFullBrandContext.ts';

function extractEntityContext(guideData: Record<string, unknown>, name: string): string {
  const { text } = extractFullBrandContext(guideData, name, 'brand', 3000);
  return text;
}

function buildCompetitiveAnalysisPrompt(
  entityName: string, 
  entityContext: string, 
  competitors: string[],
  regionalContext?: { region?: string; country?: string }
): string {
  const competitorList = competitors.slice(0, 5).map((c, i) => `${i + 1}. ${c}`).join('\n');
  
  const regionalNote = regionalContext?.country || regionalContext?.region
    ? `\n\nREGIONAL FOCUS: This analysis should be tailored for the ${regionalContext.country || ''} ${regionalContext.region ? `(${regionalContext.region} region)` : ''} market. Consider:
- Local competitors that operate primarily in this region
- Cultural factors that affect brand perception in this market
- Regional market dynamics and consumer preferences
- Localization requirements for brand positioning
- Regional regulatory or business environment considerations`
    : '';

  return `You are a brand strategy and design consultant conducting a comprehensive competitive analysis. Analyze the visual identity, design assets, and brand positioning of ${entityName} against its competitors from a design and perception perspective.${regionalNote}

ENTITY TO ANALYZE:
${entityContext}

TOP COMPETITORS:
${competitorList}

Provide a comprehensive analysis using the following structure. Return ONLY valid JSON matching this exact schema:

{
  "visualIdentityAudit": {
    "logoAnalysis": {
      "style": "string describing logo style (wordmark, symbol, combination, emblem)",
      "typography": "string describing typography choices and personality",
      "symbolism": "string describing iconography and symbolism",
      "scalability": "string describing scalability across applications",
      "memorability": "string describing distinctiveness in category"
    },
    "colorPalette": {
      "primary": ["array", "of", "primary", "colors"],
      "secondary": ["array", "of", "secondary", "colors"],
      "psychology": "string describing color psychology and emotions",
      "accessibility": "string describing accessibility considerations",
      "consistency": "string describing consistency across touchpoints"
    },
    "typographySystem": {
      "fonts": ["array", "of", "font", "families"],
      "hierarchy": "string describing hierarchy and readability",
      "personality": "string describing personality conveyed"
    },
    "visualStyle": {
      "photographyStyle": "string describing photography approach",
      "illustrationApproach": "string describing illustration style",
      "iconography": "string describing icon usage",
      "aesthetic": "string describing overall aesthetic"
    },
    "designPatterns": {
      "uiElements": "string describing UI patterns",
      "whitespace": "string describing whitespace usage",
      "interactions": "string describing interactions"
    }
  },
  "digitalPresence": {
    "homepageImpression": {
      "heroImpact": "string describing hero section impact",
      "hierarchy": "string describing visual hierarchy",
      "ctaDesign": "string describing CTA prominence",
      "effectiveness": "string describing overall effectiveness"
    },
    "uxAnalysis": {
      "navigation": "string describing navigation intuitiveness",
      "contentOrganization": "string describing content organization",
      "mobileResponsive": "string describing mobile responsiveness",
      "overallPolish": "string describing overall polish"
    },
    "contentPresentation": {
      "videoUsage": "string describing video usage",
      "dataVisualization": "string describing data viz approaches",
      "caseStudyDesign": "string describing case study presentation"
    }
  },
  "marketingCollateral": {
    "materialQuality": ["array", "of", "material", "assessments"],
    "productMarketing": ["array", "of", "product", "marketing", "notes"],
    "socialConsistency": "string describing social media consistency"
  },
  "brandPositioning": {
    "personalityMatrix": {
      "innovationScore": 8,
      "approachabilityScore": 7,
      "technicalScore": 9,
      "boldnessScore": 6,
      "enterpriseScore": 8,
      "globalScore": 9
    },
    "targetAudienceSignals": ["array", "of", "audience", "signals"],
    "trustIndicators": ["array", "of", "trust", "indicators"],
    "differentiation": ["array", "of", "differentiation", "factors"]
  },
  "strengthsWeaknesses": {
    "designSophistication": 8,
    "visualConsistency": 7,
    "userCentricity": 8,
    "innovation": 7,
    "clarity": 8,
    "emotionalConnection": 6,
    "professionalPolish": 9
  },
  "recommendations": {
    "positioningOpportunities": ["array", "of", "opportunities"],
    "designPriorities": [
      {"title": "Priority 1", "impact": "High", "effort": "Medium"},
      {"title": "Priority 2", "impact": "Medium", "effort": "Low"}
    ],
    "brandRefinements": {
      "logo": "string with logo recommendations",
      "colors": "string with color recommendations",
      "typography": "string with typography recommendations",
      "imagery": "string with imagery recommendations"
    },
    "digitalImprovements": ["array", "of", "digital", "improvements"],
    "assetOptimization": ["array", "of", "asset", "optimizations"]
  },
  "marketPerception": {
    "categoryMaturity": "string describing market maturity",
    "dominantTrends": ["array", "of", "trends"],
    "currentRanking": 7,
    "keyStrengths": ["array", "of", "strengths"],
    "criticalGaps": ["array", "of", "gaps"],
    "risks": ["array", "of", "risks"]
  },${regionalContext?.country || regionalContext?.region ? `
  "regionalInsights": {
    "marketContext": "string describing the regional market context and competitive landscape",
    "localCompetitors": ["array", "of", "local", "competitors", "specific", "to", "this", "region"],
    "culturalConsiderations": ["array", "of", "cultural", "factors", "for", "brand", "localization"],
    "localizationPriorities": ["array", "of", "localization", "recommendations"],
    "regulatoryConsiderations": "string describing any regional regulatory or compliance factors",
    "marketOpportunities": ["array", "of", "regional", "market", "opportunities"],
    "entryBarriers": ["array", "of", "potential", "barriers", "in", "this", "market"]
  },` : ''}
  "executiveSummary": {
    "overview": "2-3 paragraph executive summary",
    "currentPosition": "string describing current market position",
    "topPriorities": ["priority 1", "priority 2", "priority 3"],
    "actionPlan": {
      "thirtyDay": ["30-day action 1", "30-day action 2"],
      "sixtyDay": ["60-day action 1", "60-day action 2"],
      "ninetyDay": ["90-day action 1", "90-day action 2"]
    },
    "successMetrics": ["metric 1", "metric 2", "metric 3"]
  },
  "score": 75,
  "generatedAt": "${new Date().toISOString()}",
  "competitors": ${JSON.stringify(competitors.slice(0, 5))}${regionalContext?.country || regionalContext?.region ? `,
  "region": "${regionalContext.region || ''}",
  "country": "${regionalContext.country || ''}"` : ''}
}

Scores should be 1-10 integers. Be specific, actionable, and insightful. Base your analysis on the entity's brand data provided and your knowledge of the competitors listed.${regionalContext?.country || regionalContext?.region ? ' Pay special attention to regional competitive dynamics and localization opportunities.' : ''}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { entityType, entityId, organizationId, competitors, region, country } = await req.json();

    // Validate inputs
    if (!entityType || !['brand', 'product', 'event'].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityType. Must be brand, product, or event.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!entityId || !uuidRegex.test(entityId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityId format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one competitor is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[competitive-analysis] User authenticated:", user.id);

    // Service client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has permission to use AI features (org admin or higher)
    const { data: canUseAI } = await supabase.rpc('can_use_ai_features', {
      _user_id: user.id,
      _entity_id: entityId,
      _entity_type: entityType
    });

    if (!canUseAI) {
      console.log("[competitive-analysis] User lacks AI permissions:", user.id);
      return new Response(
        JSON.stringify({ error: 'Organization admin role required for competitive analysis' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch entity data
    const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    
    const { data: entityData, error: entityError } = await supabase
      .from(tableName)
      .select('id, name, guide_data, organization_id')
      .eq('id', entityId)
      .single();

    if (entityError || !entityData) {
      console.error("[competitive-analysis] Entity not found:", entityError);
      return new Response(
        JSON.stringify({ error: 'Entity not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check (5 reports per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentReports } = await supabase
      .from('competitive_analysis_reports')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', oneHourAgo);

    if ((recentReports || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 reports per hour.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract entity context
    const guideData = (entityData.guide_data || {}) as EntityGuideData;
    const entityContext = extractEntityContext(guideData, entityData.name);
    const regionalContext = region || country ? { region, country } : undefined;
    const prompt = buildCompetitiveAnalysisPrompt(entityData.name, entityContext, competitors, regionalContext);

    console.log("[competitive-analysis] Calling AI Gateway for entity:", entityData.name, regionalContext ? `(${country || region})` : '');

    console.log("[competitive-analysis] Calling AI Gateway for entity:", entityData.name);

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are an expert brand strategist and competitive analyst. Provide detailed, actionable insights based on the brand data provided. Always respond with valid JSON matching the requested schema exactly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[competitive-analysis] AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let reportData;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      reportData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[competitive-analysis] Failed to parse AI response:", parseError);
      console.error("[competitive-analysis] Raw content:", content.substring(0, 500));
      throw new Error("Failed to parse analysis results");
    }

    // Calculate overall score from the analysis
    const strengthsScores = reportData.strengthsWeaknesses || {};
    const avgScore = Math.round(
      (
        (strengthsScores.designSophistication || 5) +
        (strengthsScores.visualConsistency || 5) +
        (strengthsScores.userCentricity || 5) +
        (strengthsScores.innovation || 5) +
        (strengthsScores.clarity || 5) +
        (strengthsScores.emotionalConnection || 5) +
        (strengthsScores.professionalPolish || 5)
      ) / 7 * 10
    );

    // Store the report
    const { data: savedReport, error: saveError } = await supabase
      .from('competitive_analysis_reports')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        organization_id: organizationId || entityData.organization_id,
        report_type: 'competitive',
        report_data: reportData,
        competitors: competitors.slice(0, 10),
        score: avgScore,
        status: 'completed',
        created_by: user.id,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[competitive-analysis] Failed to save report:", saveError);
      throw new Error("Failed to save report");
    }

    console.log("[competitive-analysis] Report saved successfully:", savedReport.id);

    // Sync competitive insights to brand intelligence for AI advancement
    const competitiveLandscape = {
      last_updated: new Date().toISOString(),
      overall_score: avgScore,
      competitors_analyzed: competitors.slice(0, 5),
      market_position: {
        ranking: reportData.marketPerception?.currentRanking || null,
        category_maturity: reportData.marketPerception?.categoryMaturity || null,
        dominant_trends: reportData.marketPerception?.dominantTrends || [],
      },
      positioning: {
        key_strengths: reportData.marketPerception?.keyStrengths || [],
        critical_gaps: reportData.marketPerception?.criticalGaps || [],
        differentiation: reportData.brandPositioning?.differentiation || [],
        risks: reportData.marketPerception?.risks || [],
      },
      personality_matrix: reportData.brandPositioning?.personalityMatrix || null,
      strengths_weaknesses: reportData.strengthsWeaknesses || null,
      recommendations_summary: {
        positioning_opportunities: reportData.recommendations?.positioningOpportunities?.slice(0, 3) || [],
        design_priorities: reportData.recommendations?.designPriorities?.slice(0, 3) || [],
        digital_improvements: reportData.recommendations?.digitalImprovements?.slice(0, 3) || [],
      },
      action_plan: reportData.executiveSummary?.actionPlan || null,
      report_id: savedReport.id,
    };

    // Update or create brand intelligence record with competitive landscape
    const { data: existingIntel } = await supabase
      .from('brand_intelligence')
      .select('id, competitive_landscape, knowledge_entries, analysis_count')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .single();

    const now = new Date().toISOString();

    // Create knowledge entry from competitive analysis
    const competitiveInsightEntry = {
      id: `competitive-${savedReport.id}`,
      type: 'competitive_analysis',
      content: `Competitive analysis completed against ${competitors.slice(0, 3).join(', ')}${competitors.length > 3 ? ` and ${competitors.length - 3} others` : ''}. Overall score: ${avgScore}/100. Key strengths: ${(reportData.marketPerception?.keyStrengths || []).slice(0, 2).join(', ') || 'N/A'}. Critical gaps: ${(reportData.marketPerception?.criticalGaps || []).slice(0, 2).join(', ') || 'N/A'}.`,
      source: 'competitive_analysis',
      category: 'competitive',
      created_at: now,
      metadata: {
        report_id: savedReport.id,
        competitors: competitors.slice(0, 5),
        score: avgScore,
      }
    };

    if (existingIntel?.id) {
      // Update existing intelligence record
      const existingEntries = (existingIntel.knowledge_entries || []) as Array<Record<string, unknown>>;
      // Remove old competitive analysis entries (keep only the 3 most recent after adding new one)
      const nonCompetitiveEntries = existingEntries.filter((e) => e.type !== 'competitive_analysis');
      const competitiveEntries = existingEntries
        .filter((e) => e.type === 'competitive_analysis')
        .slice(0, 2); // Keep 2 most recent, new one will make 3
      
      const updatedEntries = [...nonCompetitiveEntries, ...competitiveEntries, competitiveInsightEntry];

      const { error: updateIntelError } = await supabase
        .from('brand_intelligence')
        .update({
          competitive_landscape: competitiveLandscape,
          knowledge_entries: updatedEntries,
          updated_at: now,
        })
        .eq('id', existingIntel.id);

      if (updateIntelError) {
        console.error("[competitive-analysis] Failed to update brand intelligence:", updateIntelError);
        // Non-fatal - report is already saved
      } else {
        console.log("[competitive-analysis] Brand intelligence updated with competitive landscape");
      }
    } else {
      // Create new intelligence record
      const { error: createIntelError } = await supabase
        .from('brand_intelligence')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId || entityData.organization_id,
          competitive_landscape: competitiveLandscape,
          knowledge_entries: [competitiveInsightEntry],
          analysis_count: 0,
          created_at: now,
          updated_at: now,
        });

      if (createIntelError) {
        console.error("[competitive-analysis] Failed to create brand intelligence:", createIntelError);
        // Non-fatal - report is already saved
      } else {
        console.log("[competitive-analysis] Brand intelligence created with competitive landscape");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: savedReport 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[competitive-analysis] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
