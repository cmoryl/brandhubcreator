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

    const body = await req.json();
    const { action = "overall" } = body;

    if (action === "section") {
      return await handleSectionAnalysis(body, user, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY);
    }

    return await handleOverallAnalysis(body, user, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY);
  } catch (e) {
    console.error("booth-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleOverallAnalysis(body: any, user: any, SUPABASE_URL: string, SUPABASE_SERVICE_ROLE_KEY: string, LOVABLE_API_KEY: string) {
  const { division_id, division_name, division_tagline, division_description, division_services, division_color, content_sections, variant_label } = body;

  if (!division_id || !division_name) throw new Error("Missing division data");

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

  const aiResponse = await callAI(LOVABLE_API_KEY, systemPrompt, `Analyze this booth division:\n\n${boothContext}`, [
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
            },
            improvements: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["title", "detail", "priority"] },
            },
            recommendations: {
              type: "array",
              items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string" } }, required: ["action", "impact"] },
            },
          },
          required: ["overall_score", "summary", "messaging_score", "content_score", "differentiation_score", "engagement_score", "strengths", "improvements", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  ], "suggest_booth_analysis");

  const analysis = aiResponse;

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
}

async function handleSectionAnalysis(body: any, user: any, SUPABASE_URL: string, SUPABASE_SERVICE_ROLE_KEY: string, LOVABLE_API_KEY: string) {
  const { division_id, division_name, section_id, section_heading, section_bullets } = body;

  if (!division_id || !section_id || !section_heading) throw new Error("Missing section data");

  const sectionContext = [
    `Booth Division: ${division_name || division_id}`,
    `Section: ${section_heading}`,
    section_bullets?.length ? `Content Points:\n${section_bullets.map((b: string) => `  • ${b}`).join("\n")}` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are a trade show content specialist. Analyze this specific booth content section for quality, clarity, and effectiveness. Be concise and actionable. Focus on:
1. Content clarity and messaging impact
2. Completeness of information
3. Visitor engagement value
4. Suggested improvements

Return your analysis using the analyze_section tool.`;

  const analysis = await callAI(LOVABLE_API_KEY, systemPrompt, `Analyze this booth section:\n\n${sectionContext}`, [
    {
      type: "function",
      function: {
        name: "analyze_section",
        description: "Return structured section analysis",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", description: "Section quality score 0-100" },
            summary: { type: "string", description: "1-2 sentence assessment" },
            clarity_rating: { type: "string", enum: ["excellent", "good", "needs-work", "poor"] },
            strengths: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" } }, required: ["point"] },
              description: "2-3 strengths"
            },
            improvements: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } }, required: ["point", "priority"] },
              description: "2-3 improvements"
            },
          },
          required: ["score", "summary", "clarity_rating", "strengths", "improvements"],
          additionalProperties: false,
        },
      },
    },
  ], "analyze_section");

  // Save to database
  const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/booth_section_analyses`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      division_id,
      section_id,
      section_heading,
      overall_score: analysis.score,
      analysis_data: {
        summary: analysis.summary,
        clarity_rating: analysis.clarity_rating,
      },
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      created_by: user.id,
    }),
  });

  if (!saveRes.ok) {
    const errText = await saveRes.text();
    console.error("Save section analysis error:", errText);
    throw new Error("Failed to save section analysis");
  }

  const [saved] = await saveRes.json();

  return new Response(JSON.stringify({ success: true, analysis: { ...analysis, id: saved.id, created_at: saved.created_at } }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, tools: any[], toolName: string) {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: { type: "function", function: { name: toolName } },
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (aiResponse.status === 402) throw new Error("AI credits exhausted. Please add funds.");
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    throw new Error("AI analysis failed");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("No analysis returned");

  try {
    return JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error("Failed to parse analysis");
  }
}
