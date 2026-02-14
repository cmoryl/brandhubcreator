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
import { scanTextForInclusiveLanguage, buildDeepIntelligencePromptContext, WCAG_22_NEW_CRITERIA, WFA_12_AREAS, PIE_TOUCHPOINTS, IMAGERY_STOP_GO, EVENT_ACCESSIBILITY_CHECKLIST, AI_POLICY_AS_CODE, PERSONA_SPECTRUM_DIMENSIONS, OKLCH_COLOR_STANDARD, COLOR_PSYCHOLOGY_DBA, CULTURAL_COLOR_GEOMETRY, COLOR_TRENDS_2026 } from "../_shared/inclusive-language-patterns.ts";

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

    // Run automated regex scan on entity text context
    const entityText = typeof entityContext === 'string' ? entityContext : JSON.stringify(entityContext || {});
    const regexFindings = scanTextForInclusiveLanguage(entityText);
    const regexSummary = regexFindings.length > 0
      ? `\n\nAUTOMATED REGEX PRE-SCAN (Tier 1 Inclusive Language):\nFound ${regexFindings.length} flagged term(s):\n${regexFindings.slice(0, 20).map(f => `- "${f.matched}" [${f.category}/${f.severity}] → Replace with: ${f.replacements.join(' / ')}`).join('\n')}`
      : '\n\nAUTOMATED REGEX PRE-SCAN: No Tier 1 problematic terms detected.';

    // Build context string with deep intelligence
    const deepIntelCtx = buildDeepIntelligencePromptContext();
    const contextStr = JSON.stringify({
      entity: entityContext || { name: entity_name },
      intelligence: intelligence ? {
        summary: intelligence.brand_summary,
        voice: intelligence.brand_voice_profile,
        cultural: intelligence.cultural_insights,
        audience: intelligence.target_audience
      } : null
    }) + regexSummary + '\n\n' + deepIntelCtx;

    // Process in background
    // @ts-ignore - EdgeRuntime available in Supabase
    EdgeRuntime.waitUntil((async () => {
      try {
        const wcagContext = WCAG_22_NEW_CRITERIA.map(c => `${c.id} ${c.name} [${c.level}]: ${c.objective}`).join('\n');
        const wfaContext = WFA_12_AREAS.map(a => `Stage ${a.stage} ${a.name}: ${a.audit_question}`).join('\n');
        const pieContext = PIE_TOUCHPOINTS.map(t => `${t.name}: ${t.audit_question}`).join('\n');
        const imageryContext = `STOP: ${IMAGERY_STOP_GO.stop_signals.join('; ')}\nGO: ${IMAGERY_STOP_GO.go_signals.join('; ')}`;
        const eventContext = EVENT_ACCESSIBILITY_CHECKLIST.map(e => `${e.category}: ${e.specification}`).join('\n');
        const personaContext = PERSONA_SPECTRUM_DIMENSIONS.map(p => `${p.dimension}: Permanent(${p.permanent}), Temporary(${p.temporary}), Situational(${p.situational})`).join('\n');
        const policyContext = `Disparate Impact: ${AI_POLICY_AS_CODE.disparate_impact_rule.description}\n${AI_POLICY_AS_CODE.governance_pillars.map(p => `${p.name}: ${p.description}`).join('\n')}`;
        const oklchContext = `${OKLCH_COLOR_STANDARD.description}\nContrast: Primary text ${OKLCH_COLOR_STANDARD.contrast_requirements.primary_text}, Focus ${OKLCH_COLOR_STANDARD.contrast_requirements.focus_indicators}, UI components ${OKLCH_COLOR_STANDARD.contrast_requirements.ui_components}.\n${OKLCH_COLOR_STANDARD.key_principles.join('\n')}`;
        const colorPsychContext = `${COLOR_PSYCHOLOGY_DBA.brand_recognition_stat} ${COLOR_PSYCHOLOGY_DBA.consumer_assessment} Colorblind: ${COLOR_PSYCHOLOGY_DBA.colorblind_prevalence}\nHelmholtz-Kohlrausch: ${COLOR_PSYCHOLOGY_DBA.helmholtz_kohlrausch.description}\nPurple fixation: ${COLOR_PSYCHOLOGY_DBA.purple_fixation.description}\nDBA Principles: ${COLOR_PSYCHOLOGY_DBA.dba_principles.map(p => `${p.name}: ${p.description}`).join(' | ')}\nSACM: ${COLOR_PSYCHOLOGY_DBA.sentiment_color_mapping.mappings.map(m => `${m.sentiment} → ${m.color_family}`).join(', ')}`;
        const culturalColorContext = CULTURAL_COLOR_GEOMETRY.mappings.map(m => `${m.color}: W(${m.western}), E(${m.eastern}), AF(${m.african}), ME(${m.middle_east})`).join('\n');
        const colorTrendsContext = COLOR_TRENDS_2026.trending_palettes.map(t => `${t.name}: ${t.meaning}`).join('\n') + `\nDark Mode 2.0: ${COLOR_TRENDS_2026.dark_mode_2_0.description}`;

        const systemPrompt = `You are an advanced Bias Awareness & Inclusion Auditor for brand ecosystems (2026 Foundations of Inclusive Architecture standard). You have access to automated Tier 1 regex pre-scan results AND comprehensive Deep Intelligence modules. Analyze the provided entity data across 4 core dimensions PLUS 5 advanced governance modules. Incorporate the regex pre-scan findings directly into your language score. Apply EAA/Section 508 regulatory requirements to the accessibility score. Return a single structured JSON assessment.

CORE DIMENSIONS (0-100 each):

1. LANGUAGE & MESSAGING (language_score):
- Asset-based vs deficit-focused framing
- Non-inclusive terminology detection (include gender-biased language: fireman→firefighter, chairman→chairperson, guys→folks)
- Plain language accessibility, cultural sensitivity
- Person-first vs identity-first appropriateness

2. VISUAL REPRESENTATION (visual_score):
- Diversity signals in imagery
- Stereotyping risk detection using Stop/Go Imagery Framework:
${imageryContext}
- Persona spectrum coverage across 5 dimensions:
${personaContext}

3. ACCESSIBILITY (accessibility_score):
- WCAG 2.2 compliance — evaluate against ALL 9 new success criteria:
${wcagContext}
- Target sizes (24x24px min per 2.5.8), accessible authentication (3.3.8), redundant entry prevention (3.3.7)
- Multi-sensory design (haptic hierarchy, synchronized timing, accessible affordances)
- Event accessibility standards:
${eventContext}
- EAA enforcement (€3M penalties) + U.S. Section 508 (WCAG 2.1 AA by April 2026)

4. AI GOVERNANCE (ai_governance_score):
- AI content oversight, bias detection in automated workflows
- Human-in-the-loop processes, prompt inclusivity
- Policy-as-Code governance:
${policyContext}

ADVANCED MODULES:

MODULE 1 - PI&E "Who Else?" Framework (Annie Jean-Baptiste/Google):
${pieContext}
Score each touchpoint 0-100. Apply the "Curb-Cut Effect" principle. Address intersectionality.

MODULE 2 - WFA 12 Key Areas Bias Litmus Test (Color-Linked):
${wfaContext}
Commercial impact: inclusive advertising linked to +3.46% short-term and +16.26% long-term sales.
Score key areas 0-100 with specific findings.

MODULE 3 - Policy-as-Code Disparate Impact:
Evaluate content/AI pipelines against the U.S. 80% rule (disparate impact ratio 0.80-1.25). Flag any areas where content skews beyond thresholds. Include Sentiment-to-Color cross-check: verify color choices match emotional valence (e.g., high-saturation red for urgency, not calming wellness). Assess data_journey_traceability, bias_detection_automation, threshold_monitoring readiness.

MODULE 4 - Inclusive Imagery Stop/Go Framework:
Score imagery_inclusion 0-100 based on presence of GO signals and absence of STOP signals.

MODULE 5 - 2026 Master Inclusion Checklist:
Evaluate against key areas: linguistic (CamelCase hashtags for screen readers), technical (no puzzle-based auth per WCAG 3.3.8, 24x24px targets per 2.5.8), physical (32in doors, <5lbs force), communication (roving microphones for Q&A, captions on all videos, speakers describe visuals), digital (WCAG 2.2 AA event apps), color (high-contrast floor indicators, no pinch points from high-saturation branding, sans-serif min 24pt signage). Report completed_count out of applicable_count.

MODULE 6 - Color Accessibility & OKLCH Standard:
${oklchContext}
Evaluate entity's color system for: OKLCH adoption readiness, contrast compliance (7:1 primary text, 3:1 focus/UI), Dark Mode 2.0 (no pure black), colorblind-safe palettes (1 in 12 men affected). Score color_accessibility 0-100.

MODULE 7 - Color Psychology & Distinctive Brand Assets (DBA):
${colorPsychContext}
Evaluate brand colors for: DBA uniqueness/fame, Helmholtz-Kohlrausch awareness, tonal group consistency (Karen Haller Seasons), sentiment-color alignment. Score color_strategy 0-100.

MODULE 8 - Cultural Color Geometry:
${culturalColorContext}
Evaluate color choices against target markets for cultural appropriateness. Flag conflicts (e.g., red for joy vs mourning depending on market). Score cultural_color_readiness 0-100.

RESPONSE FORMAT (strict JSON):
{
  "inclusion_score": <0-100 weighted average>,
  "language_score": <0-100>,
  "visual_score": <0-100>,
  "accessibility_score": <0-100>,
  "ai_governance_score": <0-100>,
  "language_analysis": {
    "strengths": ["..."],
    "issues": ["..."],
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
  "pie_module": {
    "overall_score": <0-100>,
    "touchpoints": {
      "ideation": {"score": <0-100>, "missing_voices": ["..."], "recommendation": "..."},
      "research": {"score": <0-100>, "generalization_risks": ["..."], "recommendation": "..."},
      "design": {"score": <0-100>, "curb_cut_opportunities": ["..."], "recommendation": "..."},
      "testing": {"score": <0-100>, "diversity_gaps": ["..."], "recommendation": "..."},
      "marketing": {"score": <0-100>, "intersectionality_issues": ["..."], "recommendation": "..."}
    }
  },
  "wfa_module": {
    "overall_score": <0-100>,
    "areas": {
      "business_challenge": {"score": <0-100>, "findings": ["..."]},
      "insight_generation": {"score": <0-100>, "findings": ["..."]},
      "creative_briefing": {"score": <0-100>, "findings": ["..."]},
      "media_placement": {"score": <0-100>, "findings": ["..."]}
    }
  },
  "policy_as_code_module": {
    "overall_score": <0-100>,
    "disparate_impact_flags": [{"area": "...", "ratio": <number>, "severity": "critical|warning|ok", "recommendation": "..."}],
    "data_journey_traceability": "high|medium|low",
    "bias_detection_automation": "high|medium|low",
    "threshold_monitoring": "active|partial|absent"
  },
  "inclusive_imagery_module": {
    "imagery_inclusion_score": <0-100>,
    "stop_signals_detected": ["..."],
    "go_signals_present": ["..."],
    "recommendations": ["..."]
  },
  "inclusion_checklist_module": {
    "completed_count": <number>,
    "applicable_count": <number>,
    "score": <0-100>,
    "categories": {
      "linguistic": {"met": ["..."], "unmet": ["..."]},
      "technical": {"met": ["..."], "unmet": ["..."]},
      "physical": {"met": ["..."], "unmet": ["..."]},
      "communication": {"met": ["..."], "unmet": ["..."]},
      "color": {"met": ["..."], "unmet": ["..."]}
    }
  },
  "color_accessibility_module": {
    "overall_score": <0-100>,
    "oklch_readiness": "adopted|partial|not_adopted",
    "contrast_compliance": {"primary_text": "pass|fail", "focus_indicators": "pass|fail", "ui_components": "pass|fail"},
    "dark_mode_compliance": "compliant|partial|non_compliant",
    "colorblind_safe": <bool>,
    "issues": ["..."],
    "recommendations": ["..."]
  },
  "color_strategy_module": {
    "overall_score": <0-100>,
    "dba_uniqueness": <0-100>,
    "dba_fame": <0-100>,
    "tonal_consistency": "consistent|mixed|jarring",
    "sentiment_alignment": "aligned|partial|misaligned",
    "helmholtz_awareness": <bool>,
    "cultural_conflicts": [{"color": "...", "market": "...", "conflict": "...", "severity": "critical|warning"}],
    "recommendations": ["..."]
  },
  "findings": [
    {"dimension": "language|visual|accessibility|ai_governance|pie|wfa|policy|imagery|checklist|color_accessibility|color_strategy", "severity": "critical|high|medium|low", "title": "...", "description": "...", "recommendation": "..."}
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
              { role: "user", content: `Analyze this entity for bias awareness, inclusion, and all 5 advanced modules:\n\n${contextStr}` }
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

        // Update scan record with results including advanced modules
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
          pie_module: result.pie_module || null,
          wfa_module: result.wfa_module || null,
          policy_as_code_module: result.policy_as_code_module || null,
          inclusive_imagery_module: result.inclusive_imagery_module || null,
          inclusion_checklist_module: result.inclusion_checklist_module || null,
          color_accessibility_module: result.color_accessibility_module || null,
          color_strategy_module: result.color_strategy_module || null,
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
