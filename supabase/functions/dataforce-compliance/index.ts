/**
 * DataForce Brand Compliance AI Edge Function
 * Analyzes brand assets for guideline compliance using AI
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ComplianceRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  entity_name: string;
  guide_data: Record<string, unknown>;
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
    const body: ComplianceRequest = await req.json();
    const { organization_id, entity_type, entity_id, entity_name, guide_data } = body;

    if (!organization_id || !entity_type || !entity_id || !guide_data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify organization membership
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

    // Create compliance job
    const { data: job, error: jobError } = await supabase
      .from('dataforce_compliance_jobs')
      .insert({
        organization_id,
        entity_type,
        entity_id,
        entity_name,
        status: 'processing',
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    // Get DataForce config
    const { data: config } = await supabase
      .from('dataforce_config')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const isDemo = !config || config.api_mode === 'demo';

    // Extract full brand context for comprehensive compliance analysis (with images)
    const { extractFullBrandContext: extractCtx, buildMultimodalContent: buildMM, fetchDocumentContext: fetchDocs, fetchSocialMetricsContext: fetchSocial } = await import('../_shared/extractFullBrandContext.ts');
    const { text: fullContext, imageUrls: complianceImages } = extractCtx(guide_data, entity_name, entity_type, 3000, true, 15);

    // Fetch document content and social metrics for compliance checking
    const [docResult, socialResult, oracleResult] = await Promise.all([
      fetchDocs(supabase, entity_id, entity_type, guide_data, 1000),
      fetchSocial(supabase, entity_id, entity_type),
      fetchOracleContextForCompliance(supabase, organization_id),
    ]);
    const { text: docContext, imageUrls: docImages, documentCount } = docResult;
    const oracleCtx = oracleResult || '';
    const combinedContext = [fullContext, docContext, socialResult.text, oracleCtx].filter(Boolean).join('\n');
    for (const di of docImages.slice(0, 5)) {
      if (complianceImages.length < 20) complianceImages.push(di);
    }
    
    // Also keep individual sections for demo mode and asset counting
    const colors = guide_data.colors || {};
    const typography = guide_data.typography || {};
    const logos = guide_data.logos || {};
    const imagery = guide_data.imagery || {};
    const identity = guide_data.identity || {};

    let complianceResult;

    if (isDemo || !LOVABLE_API_KEY) {
      // Demo mode - simulate compliance check
      complianceResult = generateDemoComplianceResult(entity_name, guide_data);
    } else {
      // Live mode - use AI for compliance analysis
      const systemPrompt = `You are a brand compliance expert analyzing brand guidelines for consistency and potential issues.
      
Analyze the provided brand data and identify:
1. Color consistency issues (contrast ratios, accessibility)
2. Typography problems (font pairing, readability)
3. Logo usage concerns (clear space, minimum size, color variations)
4. Imagery style inconsistencies
5. Messaging alignment issues
6. Strategic alignment with organization-level brand standards (if Oracle context provided)
7. PI&E "Who Else?" Inclusion Assessment — evaluate whether the brand assets demonstrate consideration for diverse users across product development stages:
   - Discovery: Are there signals of inclusive audience mapping beyond primary demographics?
   - Design: Are Curb-Cut Effect opportunities being leveraged?
   - Testing: Is there evidence of diverse user testing panels?
   - Marketing: Are narratives intersectional and non-tokenistic?
8. Optical Geometry & Corner Radius Compliance:
   - Radius Consistency: All UI elements (buttons, cards, inputs, modals) should use the same radius family.
   - Mood Alignment: Technical brands should use 0-4px (sharp), Modern brands 16-24px (rounded), Organic brands full-round. Does the radius tier match brand personality?
   - No Mixed Geometries: Flag if some elements are sharp while others are rounded — this reads as inconsistent logic, not a design choice.
   - Visual Tension: Near-identical but different radius values (e.g., 4px vs 6px) are perceived as mistakes. If close, make identical.
   - Perfect Nesting: Nested containers should follow Outer Radius = Inner Radius + Padding (concentric circles).
   - Report issues with type "layout" and reference specific UI elements.

${oracleCtx ? `ORGANIZATION STRATEGIC CONTEXT (Oracle Brain):\n${oracleCtx}\n\nUse this context to also evaluate whether the entity\'s brand assets align with the organization\'s overall strategic direction, voice, and positioning.` : ''}

Return your analysis as a JSON object with this structure:
{
  "complianceScore": 0-100,
  "issues": [
    {
      "type": "color|typography|logo|imagery|messaging|layout|inclusion|geometry",
      "severity": "critical|warning|info",
      "assetName": "string",
      "description": "string",
      "recommendation": "string",
      "confidence": 0-1
    }
  ],
  "pie_inclusion_score": 0-100,
  "pie_stage_scores": {
    "discovery": {"score": 0-100, "finding": "string"},
    "design": {"score": 0-100, "finding": "string"},
    "testing": {"score": 0-100, "finding": "string"},
    "marketing": {"score": 0-100, "finding": "string"}
  },
  "geometry_score": 0-100
}`;

      // Build multimodal content for visual compliance analysis
      const userContent = complianceImages.length > 0
        ? buildMM(`Analyze these brand assets for compliance:\n\n${fullContext}`, complianceImages, 8)
        : fullContext;

      let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: complianceImages.length > 0 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt + '\n\nIMPORTANT: You will receive actual brand images. Analyze them for visual consistency, proper logo usage, color accuracy, typography compliance, and imagery quality. Report specific issues found in the actual visuals.' },
            { role: "user", content: userContent }
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_compliance_analysis",
              description: "Return the brand compliance analysis results",
              parameters: {
                type: "object",
                properties: {
                  complianceScore: { type: "number", description: "Overall compliance score 0-100" },
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["color", "typography", "logo", "imagery", "messaging", "layout", "inclusion", "geometry"] },
                        severity: { type: "string", enum: ["critical", "warning", "info"] },
                        assetName: { type: "string" },
                        description: { type: "string" },
                        recommendation: { type: "string" },
                        confidence: { type: "number" }
                      },
                      required: ["type", "severity", "assetName", "description", "recommendation", "confidence"]
                    }
                  },
                  pie_inclusion_score: { type: "number", description: "PI&E Who Else inclusion score 0-100" },
                  pie_stage_scores: {
                    type: "object",
                    properties: {
                      discovery: { type: "object", properties: { score: { type: "number" }, finding: { type: "string" } } },
                      design: { type: "object", properties: { score: { type: "number" }, finding: { type: "string" } } },
                      testing: { type: "object", properties: { score: { type: "number" }, finding: { type: "string" } } },
                      marketing: { type: "object", properties: { score: { type: "number" }, finding: { type: "string" } } }
                    }
                  }
                },
                required: ["complianceScore", "issues"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "return_compliance_analysis" } }
        }),
      });

      // If multimodal fails (broken image URLs), retry text-only
      if (!response.ok && complianceImages.length > 0) {
        console.warn('[compliance] Multimodal failed, retrying text-only:', response.status);
        await response.text(); // consume body
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: fullContext }
            ],
            tools: [{
              type: "function",
              function: {
                name: "return_compliance_analysis",
                description: "Return the brand compliance analysis results",
                parameters: {
                  type: "object",
                  properties: {
                    complianceScore: { type: "number" },
                    issues: { type: "array", items: { type: "object", properties: { type: { type: "string" }, severity: { type: "string" }, assetName: { type: "string" }, description: { type: "string" }, recommendation: { type: "string" }, confidence: { type: "number" } }, required: ["type", "severity", "assetName", "description", "recommendation", "confidence"] } }
                  },
                  required: ["complianceScore", "issues"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "return_compliance_analysis" } }
          }),
        });
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const aiResponse = await response.json();
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      complianceResult = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : generateDemoComplianceResult(entity_name, guide_data);
    }

    // Update job with results
    await supabase
      .from('dataforce_compliance_jobs')
      .update({
        status: 'completed',
        compliance_score: complianceResult.complianceScore,
        issues_found: complianceResult.issues.length,
        issues_data: complianceResult.issues,
        assets_scanned: countAssets(guide_data),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        complianceScore: complianceResult.complianceScore,
        issuesFound: complianceResult.issues.length,
        issues: complianceResult.issues,
        isDemo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Compliance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Compliance check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDemoComplianceResult(entityName: string, guideData: Record<string, unknown>) {
  const issues = [];
  const colors = guideData.colors as any || {};
  
  // Check for color contrast issues
  if (colors.primary && colors.secondary) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'color',
      severity: 'warning',
      assetName: 'Primary Color Palette',
      description: 'Color contrast between primary and secondary colors may not meet WCAG AA standards',
      recommendation: 'Consider adjusting the color values to achieve a minimum contrast ratio of 4.5:1',
      confidence: 0.85
    });
  }

  // Check typography
  if (!guideData.typography) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'typography',
      severity: 'info',
      assetName: 'Typography Guidelines',
      description: 'Typography section is incomplete or missing font specifications',
      recommendation: 'Add complete typography guidelines including font families, sizes, and line heights',
      confidence: 0.92
    });
  }

  // Check logo variations
  const logos = guideData.logos as any || {};
  if (!logos.variations || Object.keys(logos.variations || {}).length < 3) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'logo',
      severity: 'warning',
      assetName: 'Logo Variations',
      description: 'Insufficient logo variations for different use cases',
      recommendation: 'Add dark, light, and monochrome logo versions for versatility',
      confidence: 0.78
    });
  }

  const score = Math.max(60, 100 - (issues.length * 12) + Math.floor(Math.random() * 15));

  return {
    complianceScore: score,
    issues: issues.map((issue, index) => ({ ...issue, id: `demo-${index}` }))
  };
}

function countAssets(guideData: Record<string, unknown>): number {
  let count = 0;
  const colors = guideData.colors as any || {};
  const logos = guideData.logos as any || {};
  
  if (colors.primary) count++;
  if (colors.secondary) count++;
  if (colors.accent) count++;
  if (logos.primary) count++;
  if (logos.variations) count += Object.keys(logos.variations).length;
  
  return Math.max(count, 5);
}

/**
 * Fetch Oracle Brain context for org-level strategic compliance checking
 */
async function fetchOracleContextForCompliance(supabase: any, organizationId: string): Promise<string | null> {
  try {
    const [{ data: oracle }, { data: knowledge }] = await Promise.all([
      supabase.from('oracle_intelligence')
        .select('org_summary, unified_voice_profile, competitive_overview, strategic_recommendations')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      supabase.from('oracle_knowledge_base')
        .select('title, content')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('source_type', 'manual')
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);

    if (!oracle?.org_summary && (!knowledge || knowledge.length === 0)) return null;

    const parts: string[] = [];
    if (oracle?.org_summary) parts.push(`Org Strategy: ${oracle.org_summary}`);
    if (oracle?.unified_voice_profile?.primary_tone) parts.push(`Org Voice Tone: ${oracle.unified_voice_profile.primary_tone}`);
    if (oracle?.competitive_overview?.competitive_moat) parts.push(`Competitive Moat: ${oracle.competitive_overview.competitive_moat}`);
    const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
    if (recs.length > 0) parts.push(`Strategic Priorities: ${recs.slice(0, 2).map((r: any) => r.recommendation).join('; ')}`);
    if (knowledge && knowledge.length > 0) {
      parts.push(`Key Knowledge: ${knowledge.map((k: any) => `${k.title}: ${(k.content || '').slice(0, 100)}`).join(' | ')}`);
    }

    return parts.join('\n');
  } catch (err) {
    console.warn('[compliance] Oracle context fetch failed (non-critical):', err);
    return null;
  }
}
