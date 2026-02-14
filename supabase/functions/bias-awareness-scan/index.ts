/**
 * Bias Awareness Scan Edge Function
 * Analyzes brand/product/event content across 4 dimensions:
 * 1. Language & Messaging
 * 2. Visual Representation
 * 3. Accessibility (WCAG 2.2)
 * 4. AI Governance
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScanRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  entity_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ScanRequest = await req.json();
    const { organization_id, entity_type, entity_id, entity_name } = body;

    if (!organization_id || !entity_type || !entity_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending scan record
    const { data: scan, error: scanError } = await supabase
      .from('bias_awareness_scans')
      .insert({
        organization_id,
        entity_id,
        entity_type,
        entity_name,
        status: 'processing',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (scanError) {
      console.error('Failed to create scan record:', scanError);
      throw new Error('Failed to create scan record');
    }

    // Get entity context via RPC
    const tableMap = { brand: 'brands', product: 'products', event: 'events' };
    const { data: entityContext } = await supabase.rpc('get_entity_text_context', {
      p_table: tableMap[entity_type],
      p_id: entity_id
    });

    // Get brand intelligence for additional context
    const { data: intelligence } = await supabase
      .from('brand_intelligence')
      .select('brand_summary, brand_voice_profile, cultural_insights, target_audience')
      .eq('entity_id', entity_id)
      .eq('entity_type', entity_type)
      .maybeSingle();

    // Build context string
    const contextStr = JSON.stringify({
      entity: entityContext || { name: entity_name },
      intelligence: intelligence ? {
        summary: intelligence.brand_summary,
        voice: intelligence.brand_voice_profile,
        cultural: intelligence.cultural_insights,
        audience: intelligence.target_audience
      } : null
    });

    // Process in background
    // @ts-ignore - EdgeRuntime available in Supabase
    EdgeRuntime.waitUntil((async () => {
      try {
        const systemPrompt = `You are a Bias Awareness & Inclusion Auditor for brand ecosystems. Analyze the provided brand/product/event data across four dimensions and return a structured JSON assessment.

DIMENSIONS TO EVALUATE:

1. LANGUAGE & MESSAGING (language_score 0-100):
- Check for asset-based vs deficit-focused framing
- Identify non-inclusive terminology (e.g., "minority", "handicapped", "blacklist/whitelist", gendered terms like "fireman")
- Evaluate plain language accessibility
- Check cultural sensitivity in messaging
- Assess person-first vs identity-first appropriateness

2. VISUAL REPRESENTATION (visual_score 0-100):
- Evaluate diversity signals in imagery descriptions/guidelines
- Check for stereotyping risks in visual direction
- Assess persona spectrum coverage (permanent, temporary, situational constraints)
- Check photography/imagery guidelines for inclusivity

3. ACCESSIBILITY (accessibility_score 0-100):
- Evaluate against WCAG 2.2 key criteria awareness
- Check for target size considerations (24x24px minimum)
- Assess authentication accessibility
- Check for multi-sensory design considerations
- Evaluate event accessibility (if applicable)

4. AI GOVERNANCE (ai_governance_score 0-100):
- Assess AI-generated content oversight
- Check for bias detection in automated workflows
- Evaluate human-in-the-loop processes
- Check prompt engineering guidelines for inclusivity

RESPONSE FORMAT (strict JSON):
{
  "inclusion_score": <number 0-100, weighted average>,
  "language_score": <0-100>,
  "visual_score": <0-100>,
  "accessibility_score": <0-100>,
  "ai_governance_score": <0-100>,
  "language_analysis": {
    "strengths": ["..."],
    "issues": [{"term": "...", "suggestion": "...", "severity": "high|medium|low"}],
    "framing_assessment": "asset-based|mixed|deficit-focused"
  },
  "visual_analysis": {
    "diversity_signals": ["..."],
    "gaps": ["..."],
    "stereotyping_risks": ["..."]
  },
  "accessibility_analysis": {
    "wcag_strengths": ["..."],
    "wcag_gaps": ["..."],
    "multi_sensory_coverage": "strong|moderate|weak"
  },
  "ai_governance_analysis": {
    "safeguards_detected": ["..."],
    "risks": ["..."],
    "policy_as_code_readiness": "high|medium|low"
  },
  "persona_coverage": {
    "mobility": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "vision": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "hearing": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "speech": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "cognitive": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "coverage_percentage": <0-100>
  },
  "findings": [
    {"dimension": "language|visual|accessibility|ai_governance", "severity": "critical|high|medium|low", "title": "...", "description": "...", "recommendation": "..."}
  ],
  "recommendations": [
    {"priority": "immediate|short_term|long_term", "dimension": "...", "action": "...", "impact": "high|medium|low"}
  ]
}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Analyze this entity for bias awareness and inclusion:\n\n${contextStr}` }
            ],
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('AI gateway error:', response.status, errText);
          
          await supabase.from('bias_awareness_scans').update({
            status: 'failed',
            error_message: response.status === 429 ? 'Rate limit exceeded' : response.status === 402 ? 'AI credits exhausted' : `AI error: ${response.status}`,
            updated_at: new Date().toISOString(),
          }).eq('id', scan.id);
          return;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr);
          result = null;
        }

        if (!result) {
          await supabase.from('bias_awareness_scans').update({
            status: 'failed',
            error_message: 'Failed to parse AI response',
            updated_at: new Date().toISOString(),
          }).eq('id', scan.id);
          return;
        }

        // Update scan record with results
        await supabase.from('bias_awareness_scans').update({
          status: 'completed',
          inclusion_score: result.inclusion_score || 0,
          language_score: result.language_score || 0,
          visual_score: result.visual_score || 0,
          accessibility_score: result.accessibility_score || 0,
          ai_governance_score: result.ai_governance_score || 0,
          language_analysis: result.language_analysis || {},
          visual_analysis: result.visual_analysis || {},
          accessibility_analysis: result.accessibility_analysis || {},
          ai_governance_analysis: result.ai_governance_analysis || {},
          persona_coverage: result.persona_coverage || {},
          findings: result.findings || [],
          recommendations: result.recommendations || [],
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', scan.id);

        // Update brand intelligence with bias profile
        const biasProfile = {
          last_scan_id: scan.id,
          last_scan_at: new Date().toISOString(),
          inclusion_score: result.inclusion_score,
          dimension_scores: {
            language: result.language_score,
            visual: result.visual_score,
            accessibility: result.accessibility_score,
            ai_governance: result.ai_governance_score,
          },
          persona_coverage: result.persona_coverage,
          top_findings: (result.findings || []).slice(0, 5),
        };

        const { data: existingIntel } = await supabase
          .from('brand_intelligence')
          .select('id')
          .eq('entity_id', entity_id)
          .eq('entity_type', entity_type)
          .maybeSingle();

        if (existingIntel) {
          await supabase.from('brand_intelligence').update({
            bias_awareness_profile: biasProfile,
            updated_at: new Date().toISOString(),
          }).eq('id', existingIntel.id);
        }

        // Update oracle intelligence with aggregated bias insights
        const { data: existingOracle } = await supabase
          .from('oracle_intelligence')
          .select('id, bias_awareness_insights')
          .eq('organization_id', organization_id)
          .maybeSingle();

        if (existingOracle) {
          const existingInsights = (existingOracle.bias_awareness_insights as Record<string, unknown>) || {};
          const entityScores = (existingInsights.entity_scores as Record<string, unknown>) || {};
          
          const updatedEntityScores = {
            ...entityScores,
            [entity_id]: {
              entity_name,
              entity_type,
              inclusion_score: result.inclusion_score,
              dimensions: {
                language: result.language_score,
                visual: result.visual_score,
                accessibility: result.accessibility_score,
                ai_governance: result.ai_governance_score,
              },
              scanned_at: new Date().toISOString(),
            }
          };

          // Calculate org-wide average
          const scores = Object.values(updatedEntityScores) as Array<{ inclusion_score: number }>;
          const orgAvg = scores.reduce((sum, s) => sum + (s.inclusion_score || 0), 0) / scores.length;

          await supabase.from('oracle_intelligence').update({
            bias_awareness_insights: {
              org_inclusion_score: Math.round(orgAvg * 100) / 100,
              entity_scores: updatedEntityScores,
              entities_scanned: scores.length,
              last_updated: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }).eq('id', existingOracle.id);
        }

        console.log(`[BiasAwareness] Scan completed for ${entity_name}: ${result.inclusion_score}/100`);

      } catch (err) {
        console.error('[BiasAwareness] Background processing error:', err);
        await supabase.from('bias_awareness_scans').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', scan.id);
      }
    })());

    return new Response(
      JSON.stringify({ success: true, scan_id: scan.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BiasAwareness] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
