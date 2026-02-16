import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify JWT
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!userRes.ok) throw new Error("Unauthorized");
    const user = await userRes.json();

    const { division_id, division_name, division_tagline, division_description, division_services, division_color, content_sections, variant_label } = await req.json();

    if (!division_id || !division_name) throw new Error("Missing division data");

    // Build context for the AI
    const boothContext = [
      `Division: ${division_name}`,
      division_tagline ? `Tagline: ${division_tagline}` : null,
      division_description ? `Description: ${division_description}` : null,
      division_services?.length ? `Services: ${division_services.join(", ")}` : null,
      division_color ? `Brand Color: ${division_color}` : null,
      variant_label ? `Current Variant: ${variant_label}` : null,
      content_sections?.length ? `Content Sections:\n${content_sections.map((s: any) => `  - ${s.heading}: ${s.bullets?.join("; ")}`).join("\n")}` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a trade show booth and brand presence analyst. You audit exhibition booth divisions for messaging effectiveness, visual branding, content quality, and trade show best practices.

Analyze the following booth division and provide a structured audit. Be specific, actionable, and constructive. Consider:
1. Messaging clarity and impact
2. Service offering completeness
3. Content organization and hierarchy
4. Brand differentiation
5. Trade show visitor engagement potential
6. Call-to-action effectiveness

Return your analysis using the suggest_booth_analysis tool.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this booth division:\n\n${boothContext}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_booth_analysis",
              description: "Return structured booth analysis results",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall booth quality score from 0-100" },
                  summary: { type: "string", description: "2-3 sentence executive summary of booth quality" },
                  messaging_score: { type: "number", description: "Messaging clarity score 0-100" },
                  content_score: { type: "number", description: "Content quality score 0-100" },
                  differentiation_score: { type: "number", description: "Brand differentiation score 0-100" },
                  engagement_score: { type: "number", description: "Visitor engagement potential score 0-100" },
                  strengths: {
                    type: "array",
                    items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } }, required: ["title", "detail"] },
                    description: "3-5 key strengths"
                  },
                  improvements: {
                    type: "array",
                    items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["title", "detail", "priority"] },
                    description: "3-5 areas for improvement with priority"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string" } }, required: ["action", "impact"] },
                    description: "3-5 specific actionable recommendations"
                  },
                },
                required: ["overall_score", "summary", "messaging_score", "content_score", "differentiation_score", "engagement_score", "strengths", "improvements", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_booth_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No analysis returned");

    let analysis;
    try {
      analysis = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse analysis");
    }

    // Save to database
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/booth_ai_analyses`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        division_id,
        variant_label: variant_label || null,
        overall_score: analysis.overall_score,
        analysis_data: {
          summary: analysis.summary,
          messaging_score: analysis.messaging_score,
          content_score: analysis.content_score,
          differentiation_score: analysis.differentiation_score,
          engagement_score: analysis.engagement_score,
        },
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        recommendations: analysis.recommendations,
        created_by: user.id,
      }),
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Save error:", errText);
      throw new Error("Failed to save analysis");
    }

    const [saved] = await saveRes.json();

    return new Response(JSON.stringify({ success: true, analysis: { ...analysis, id: saved.id, created_at: saved.created_at } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("booth-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
