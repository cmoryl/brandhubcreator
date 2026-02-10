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

import { extractFullBrandContext, buildMultimodalContent, fetchDocumentContext, type ImageReference } from '../_shared/extractFullBrandContext.ts';

function extractBrandContext(guideData: Record<string, unknown>, entityName: string, entityType: string): { text: string; imageUrls: ImageReference[] } {
  const { text, imageUrls } = extractFullBrandContext(guideData, entityName, entityType, 3000, true, 10);
  return { text: text || 'No brand data', imageUrls };
}

/** Background worker: runs AI call + saves results */
async function processResearch(
  jobId: string,
  entityId: string,
  entityType: string,
  entityName: string,
  organizationId: string | null,
  brandContext: string,
  brandImageUrls: ImageReference[],
  briefingType: string,
  focusAreas: string[],
  intelligenceSummary: string,
  userId: string,
) {
  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    await adminSupabase.from('brand_intelligence_jobs').update({
      status: 'processing',
      started_at: new Date().toISOString(),
      progress: 10,
    }).eq('id', jobId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const focusText = focusAreas.length > 0 ? `\nFocus on: ${focusAreas.join(', ')}` : '';

    const prompt = `Generate a ${briefingType} research briefing for "${entityName}".

${brandContext}
${intelligenceSummary}${focusText}

Return ONLY valid JSON (no markdown):
{
  "title": "string",
  "summary": "2 sentence executive summary",
  "marketIntelligence": {"industryTrends":["..."],"marketShifts":["..."],"emergingOpportunities":["..."]},
  "competitiveInsights": {"positioningGaps":["..."],"differentiationOpportunities":["..."],"threatAssessment":["..."]},
  "trendAnalysis": {"risingTrends":["..."],"decliningTrends":["..."],"futureProjections":["..."]},
  "sentimentSignals": {"positiveIndicators":["..."],"concernAreas":["..."],"neutralObservations":["..."]},
  "multiculturalInsights": {"expansionOpportunities":[{"market":"...","readiness":"high|medium|low","culturalConsiderations":["..."],"priorityAdaptations":["..."]}],"culturalGaps":["..."],"localizationRecommendations":["..."],"colorImageryNotes":["..."]},
  "globallinkRecommendations": [{"product":"Translation|AI|Connect|Fluent","priority":"high|medium|low","useCase":"...","expectedBenefit":"..."}],
  "strategicRecommendations": [{"priority":"high|medium|low","action":"...","rationale":"...","timeframe":"..."}],
  "growthOpportunities": [{"opportunity":"...","potentialImpact":"...","requiredInvestment":"..."}],
  "riskAlerts": [{"risk":"...","severity":"critical|moderate|low","mitigation":"..."}],
  "priorityActions": ["..."],
  "suggestedUpdates": [{"section":"...","currentState":"...","suggestedChange":"...","reason":"..."}],
  "confidenceScore": 75,
  "urgencyLevel": "low|normal|high|critical"
}`;

    await adminSupabase.from('brand_intelligence_jobs').update({ progress: 25 }).eq('id', jobId);

    // Build multimodal content if images available
    const userContent = brandImageUrls.length > 0
      ? buildMultimodalContent(prompt, brandImageUrls, 5)
      : prompt;

    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: brandImageUrls.length > 0 ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'You are a brand strategy research analyst. Analyze both text data AND visual assets provided. Provide actionable insights with emphasis on multicultural opportunities, visual identity assessment, and GlobalLink product recommendations. Return ONLY valid JSON.' },
          { role: 'user', content: userContent }
        ],
        temperature: 0.4,
          max_tokens: 4500,
      }),
    });

    // If multimodal fails (broken image URLs), retry text-only
    if (!response.ok && brandImageUrls.length > 0) {
      console.warn('[brand-research] Multimodal failed, retrying text-only:', response.status);
      await response.text(); // consume body
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'You are a brand strategy research analyst. Provide actionable insights with emphasis on multicultural opportunities and GlobalLink product recommendations. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 4500,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error('No AI response');

    await adminSupabase.from('brand_intelligence_jobs').update({ progress: 70 }).eq('id', jobId);

    // Parse
    let briefing: Record<string, unknown>;
    try {
      // Try direct parse first
      briefing = JSON.parse(content.trim());
    } catch {
      try {
        // Try extracting from markdown code blocks (closed or unclosed)
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                          content.match(/```(?:json)?\s*([\s\S]*)/) ||
                          content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
        briefing = JSON.parse(jsonStr);
      } catch {
        console.error('[brand-research] Parse failed:', content.substring(0, 300));
        throw new Error('Failed to parse AI response');
      }
    }

    // Save briefing
    const { data: saved } = await adminSupabase
      .from('research_briefings')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId,
        briefing_type: briefingType,
        title: briefing.title,
        summary: briefing.summary,
        market_intelligence: briefing.marketIntelligence,
        competitive_insights: briefing.competitiveInsights,
        trend_analysis: briefing.trendAnalysis,
        sentiment_signals: briefing.sentimentSignals,
        strategic_recommendations: briefing.strategicRecommendations,
        growth_opportunities: briefing.growthOpportunities,
        risk_alerts: briefing.riskAlerts,
        priority_actions: briefing.priorityActions,
        suggested_updates: briefing.suggestedUpdates,
        confidence_score: briefing.confidenceScore,
        urgency_level: briefing.urgencyLevel,
        created_by: userId,
      })
      .select('id')
      .single();

    await adminSupabase.from('brand_intelligence_jobs').update({ progress: 85 }).eq('id', jobId);

    // Lightweight learning feedback — add top insights to brand intelligence
    try {
      const { data: intel } = await adminSupabase
        .from('brand_intelligence')
        .select('id, knowledge_entries, analysis_history')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .single();

      if (intel) {
        const entries = ((intel.knowledge_entries || []) as unknown[]);
        const history = ((intel.analysis_history || []) as unknown[]);
        const recs = (briefing.strategicRecommendations || []) as Array<{ action: string; rationale: string; priority: string }>;

        const newEntries = recs.slice(0, 2).map(r => ({
          id: crypto.randomUUID(),
          type: 'insight',
          content: `[Research] ${r.action} - ${r.rationale}`,
          source: 'ai',
          category: `research-strategy-${r.priority}`,
          created_at: new Date().toISOString(),
          confidence: ((briefing.confidenceScore as number) || 70) / 100,
        }));

        await adminSupabase
          .from('brand_intelligence')
          .update({
            knowledge_entries: [...entries, ...newEntries].slice(-100),
            analysis_history: [...history, {
              date: new Date().toISOString(),
              type: `research-${briefingType}`,
              summary: briefing.summary,
            }].slice(-20),
            updated_at: new Date().toISOString(),
          })
          .eq('id', intel.id);
      }
    } catch (e) {
      console.error('[brand-research] Feedback loop error:', e);
    }

    // Mark job complete
    await adminSupabase.from('brand_intelligence_jobs').update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      result: { briefing, briefingId: saved?.id },
    }).eq('id', jobId);

    console.log(`[brand-research] Completed for ${entityName}`);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[brand-research] Job ${jobId} failed:`, msg);
    await adminSupabase.from('brand_intelligence_jobs').update({
      status: 'failed',
      error_message: msg,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }
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

    // Fetch entity — lightweight query
    const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    const { data: entityData } = await supabaseClient
      .from(tableName)
      .select('name, guide_data, organization_id')
      .eq('id', entityId)
      .single();

    if (!entityData) {
      return new Response(
        JSON.stringify({ error: 'Entity not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guideData = entityData.guide_data as Record<string, unknown>;
    const { text: brandContext, imageUrls: brandImageUrls } = extractBrandContext(guideData, entityData.name, entityType);

    // Fetch document content (PDFs, PPTXs, slide text)
    const { text: docContext, imageUrls: docImageUrls, documentCount } = await fetchDocumentContext(
      supabaseClient, entityId, entityType, guideData, 1500
    );
    const combinedContext = docContext ? `${brandContext}\n${docContext}` : brandContext;
    const combinedImages = [...brandImageUrls, ...docImageUrls.slice(0, 5)];

    // Fetch minimal intelligence summary
    let intelligenceSummary = '';
    const { data: intel } = await supabaseClient
      .from('brand_intelligence')
      .select('brand_summary, market_position')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .single();
    if (intel?.brand_summary) intelligenceSummary += `\nBrand Summary: ${intel.brand_summary}`;
    if (intel?.market_position) intelligenceSummary += `\nMarket Position: ${intel.market_position}`;
    if (documentCount > 0) intelligenceSummary += `\nDocuments Analyzed: ${documentCount}`;

    // Create job record
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: job, error: jobError } = await adminSupabase
      .from('brand_intelligence_jobs')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: entityData.organization_id || null,
        user_id: user.id,
        status: 'pending',
        progress: 0,
      })
      .select('id')
      .single();

    if (jobError || !job) {
      throw new Error('Failed to create job: ' + jobError?.message);
    }

    // Fire background work
    EdgeRuntime.waitUntil(
      processResearch(
        job.id,
        entityId,
        entityType,
        entityData.name,
        entityData.organization_id || null,
        combinedContext,
        combinedImages,
        briefingType,
        focusAreas,
        intelligenceSummary,
        user.id,
      )
    );

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: 'processing',
        message: 'Research briefing is being generated. Poll the job status for results.',
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
