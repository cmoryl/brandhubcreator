/**
 * Edge Function: analyze-social-asset
 * Runs Bias & Inclusion scan, Brand Compliance check, and Engagement Prediction
 * on uploaded social assets using the Lovable AI Gateway.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  placement_id: string;
  organization_id: string;
  entity_id: string;
  entity_type: string;
  platform: string;
  format: string;
  image_url: string;
  brand_context?: {
    name?: string;
    colors?: Array<{ name: string; hex: string; role?: string }>;
    typography?: Array<{ family: string; weight?: string; usage?: string }>;
    archetype?: string;
    industry?: string;
    mission?: string;
    values?: string[];
    logos?: Array<{ url?: string; name?: string }>;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const body: AnalysisRequest = await req.json();
    const { placement_id, organization_id, entity_id, entity_type, platform, format, image_url, brand_context } = body;

    if (!placement_id || !organization_id || !image_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create or update analysis record as pending
    const { data: existingAnalysis } = await supabase
      .from("social_asset_analyses")
      .select("id")
      .eq("placement_id", placement_id)
      .maybeSingle();

    let analysisId: string;
    if (existingAnalysis) {
      analysisId = existingAnalysis.id;
      await supabase
        .from("social_asset_analyses")
        .update({ status: "analyzing", error_message: null })
        .eq("id", analysisId);
    } else {
      const { data: newAnalysis, error: insertErr } = await supabase
        .from("social_asset_analyses")
        .insert({
          placement_id,
          organization_id,
          entity_id,
          entity_type,
          platform,
          format,
          image_url,
          status: "analyzing",
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      analysisId = newAnalysis.id;
    }

    // Run analysis in background
    const analysisPromise = (async () => {
      try {
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

        const brandCtx = brand_context || {};
        const colorList = (brandCtx.colors || []).map((c) => `${c.name}: ${c.hex} (${c.role || "unspecified"})`).join(", ");
        const fontList = (brandCtx.typography || []).map((t) => t.family).join(", ");
        const valueList = (brandCtx.values || []).join(", ");

        const systemPrompt = `You are an expert social media asset analyst specializing in brand compliance, inclusive design, and engagement optimization. You analyze social media images for professional brands.

Return your analysis as a single JSON object with these exact keys:
{
  "bias": {
    "score": <0-100>,
    "representation": { "diversity_score": <0-100>, "findings": ["..."], "demographics_detected": ["..."] },
    "cultural_sensitivity": { "score": <0-100>, "flags": ["..."], "recommendations": ["..."] },
    "accessibility": { "alt_text_suggestion": "...", "contrast_adequate": <boolean>, "text_readable": <boolean>, "findings": ["..."] },
    "findings": [{ "type": "...", "severity": "low|medium|high", "description": "...", "recommendation": "..." }]
  },
  "compliance": {
    "score": <0-100>,
    "color_match": { "score": <0-100>, "detected_colors": ["#hex"], "brand_colors_used": <boolean>, "findings": ["..."] },
    "logo_placement": { "detected": <boolean>, "position": "...", "size_appropriate": <boolean>, "findings": ["..."] },
    "typography": { "score": <0-100>, "fonts_consistent": <boolean>, "findings": ["..."] },
    "details": [{ "area": "...", "status": "pass|warning|fail", "detail": "..." }]
  },
  "engagement": {
    "predicted_rate": <0.0-15.0>,
    "predicted_reach": "low|medium|high|viral",
    "optimal_posting_time": "...",
    "content_quality_score": <0-100>,
    "factors": [{ "factor": "...", "impact": "positive|neutral|negative", "detail": "..." }]
  },
  "overall_score": <0-100>
}`;

        const userPrompt = `Analyze this social media asset for ${platform} (${format} format).

Brand Context:
- Name: ${brandCtx.name || "Unknown"}
- Industry: ${brandCtx.industry || "Not specified"}
- Archetype: ${brandCtx.archetype || "Not specified"}
- Mission: ${brandCtx.mission || "Not specified"}
- Brand Colors: ${colorList || "Not specified"}
- Typography: ${fontList || "Not specified"}
- Brand Values: ${valueList || "Not specified"}
- Logo count: ${(brandCtx.logos || []).length}

Image URL: ${image_url}

Perform a comprehensive analysis covering:
1. BIAS & INCLUSION: Evaluate representation diversity, cultural sensitivity, and accessibility (alt text needs, contrast, text readability)
2. BRAND COMPLIANCE: Check color usage against brand palette, logo presence/placement, typography consistency
3. ENGAGEMENT PREDICTION: Predict engagement rate for ${platform} ${format}, estimate reach potential, suggest optimal posting time, identify content quality factors

Be specific and actionable in your findings. Score each dimension 0-100.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  { type: "image_url", image_url: { url: image_url } },
                ],
              },
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          if (status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
          if (status === 402) throw new Error("AI quota exceeded. Please check your plan.");
          throw new Error(`AI request failed with status ${status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        // Parse JSON from response (handle markdown code blocks)
        let parsed: any;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const rawJson = jsonMatch ? jsonMatch[1].trim() : content.trim();
        try {
          parsed = JSON.parse(rawJson);
        } catch {
          // Try to find JSON object in text
          const objMatch = rawJson.match(/\{[\s\S]*\}/);
          if (objMatch) {
            parsed = JSON.parse(objMatch[0]);
          } else {
            throw new Error("Failed to parse AI response as JSON");
          }
        }

        const bias = parsed.bias || {};
        const compliance = parsed.compliance || {};
        const engagement = parsed.engagement || {};

        await supabase
          .from("social_asset_analyses")
          .update({
            // Bias
            bias_score: bias.score ?? null,
            bias_findings: bias.findings || [],
            representation_analysis: bias.representation || null,
            cultural_sensitivity: bias.cultural_sensitivity || null,
            accessibility_findings: bias.accessibility || null,
            // Compliance
            compliance_score: compliance.score ?? null,
            color_compliance: compliance.color_match || null,
            logo_compliance: compliance.logo_placement || null,
            typography_compliance: compliance.typography || null,
            compliance_details: compliance.details || [],
            // Engagement
            predicted_engagement_rate: engagement.predicted_rate ?? null,
            predicted_reach: engagement.predicted_reach || null,
            optimal_posting_time: engagement.optimal_posting_time || null,
            engagement_factors: engagement.factors || [],
            content_quality_score: engagement.content_quality_score ?? null,
            // Overall
            overall_score: parsed.overall_score ?? null,
            status: "completed",
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", analysisId);
      } catch (err: any) {
        console.error("Analysis failed:", err);
        await supabase
          .from("social_asset_analyses")
          .update({
            status: "failed",
            error_message: err.message || "Analysis failed",
          })
          .eq("id", analysisId);
      }
    })();

    // Use waitUntil for background processing
    (globalThis as any).EdgeRuntime?.waitUntil?.(analysisPromise);

    return new Response(
      JSON.stringify({ id: analysisId, status: "analyzing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
