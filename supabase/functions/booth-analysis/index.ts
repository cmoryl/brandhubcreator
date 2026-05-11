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

  const systemPrompt = `You are an expert trade show booth designer, brand presence analyst, and global cultural strategist. You audit exhibition booth divisions for design excellence, messaging effectiveness, and cross-cultural performance. You have deep expertise in exhibition design, visual communication, spatial branding, trade show best practices, and international market dynamics.

Analyze the following booth division and provide a structured audit. Be specific, actionable, and constructive. Evaluate across these dimensions:

**Design & Visual Identity:**
1. Color palette effectiveness — contrast, harmony, brand consistency, visibility from distance
2. Visual hierarchy — layout flow, focal points, typography scale, information density
3. Spatial design — use of space, traffic flow considerations, sightlines, modularity
4. Brand cohesion — consistency across materials, logo placement, visual language
5. Production quality signals — material choices, finish quality, lighting considerations

**Content & Messaging:**
6. Messaging clarity and impact — headline strength, value proposition clarity
7. Service offering completeness and presentation
8. Content organization and information architecture
9. Brand differentiation — unique positioning, competitive standout
10. Visitor engagement potential — interactive elements, dwell-time drivers
11. Call-to-action effectiveness — conversion pathways, lead capture

**Cultural & Geographic Performance:**
12. Analyze how this booth's messaging, design, and services would perform in 5-6 key global regions/markets (e.g., North America, Western Europe, Middle East/North Africa, East Asia, Latin America, South/Southeast Asia). For each region, provide:
  - A predicted performance score (0-100)
  - Key cultural considerations (color symbolism, messaging tone, imagery sensitivities)
  - Specific adaptation recommendations
  - Local trade show norms that could affect reception

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
            summary: { type: "string", description: "2-3 sentence executive summary covering both design and messaging quality" },
            messaging_score: { type: "number", description: "Messaging clarity and impact score 0-100" },
            content_score: { type: "number", description: "Content quality and information architecture score 0-100" },
            differentiation_score: { type: "number", description: "Brand differentiation and competitive standout score 0-100" },
            engagement_score: { type: "number", description: "Visitor engagement and dwell-time potential score 0-100" },
            design_score: { type: "number", description: "Visual design quality — color palette, hierarchy, spatial layout, brand cohesion 0-100" },
            production_score: { type: "number", description: "Production readiness — material specs, finish quality, scalability 0-100" },
            score_explanations: {
              type: "object",
              description: "Detailed 2-3 sentence explanation for each dimension score, explaining what drove the score up or down",
              properties: {
                design: { type: "string", description: "Why the design score is what it is — specific color, layout, hierarchy observations" },
                production: { type: "string", description: "Why the production score is what it is — material, finish, scalability observations" },
                messaging: { type: "string", description: "Why the messaging score is what it is — headline strength, value prop clarity" },
                content: { type: "string", description: "Why the content score is what it is — info architecture, completeness" },
                differentiation: { type: "string", description: "Why the differentiation score is what it is — unique positioning, competitive standout" },
                engagement: { type: "string", description: "Why the engagement score is what it is — interactive elements, dwell-time drivers" },
              },
              required: ["design", "production", "messaging", "content", "differentiation", "engagement"],
            },
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
            regional_insights: {
              type: "array",
              description: "Cultural and geographic performance analysis for 5-6 key global regions",
              items: {
                type: "object",
                properties: {
                  region: { type: "string", description: "Region name e.g. 'North America', 'East Asia', 'Middle East & North Africa'" },
                  predicted_score: { type: "number", description: "Predicted performance score 0-100 for this region" },
                  cultural_considerations: { type: "string", description: "Key cultural factors affecting reception — color symbolism, messaging tone, imagery sensitivities, business etiquette" },
                  adaptations: { type: "string", description: "Specific recommendations for adapting the booth for this region" },
                  trade_show_norms: { type: "string", description: "Local trade show conventions and expectations that could affect reception" },
                },
                required: ["region", "predicted_score", "cultural_considerations", "adaptations", "trade_show_norms"],
              },
            },
          },
          required: ["overall_score", "summary", "messaging_score", "content_score", "differentiation_score", "engagement_score", "design_score", "production_score", "score_explanations", "strengths", "improvements", "recommendations", "regional_insights"],
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
        design_score: analysis.design_score,
        production_score: analysis.production_score,
        score_explanations: analysis.score_explanations || {},
        regional_insights: analysis.regional_insights || [],
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

  // Bubble up booth insights to Brand Intelligence & Oracle Knowledge Base
  try {
    await bubbleUpToIntelligence(analysis, division_name, variant_label, user.id, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (bubbleErr) {
    console.warn("Non-fatal: Failed to bubble up booth insights:", bubbleErr);
  }

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
      model: "google/gemini-3.1-flash-lite-preview",
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

/**
 * Bubble up booth analysis insights into Brand Intelligence knowledge entries
 * and Oracle Knowledge Base for cross-entity strategic reference.
 */
async function bubbleUpToIntelligence(
  analysis: any,
  divisionName: string,
  variantLabel: string | null,
  userId: string,
  supabaseUrl: string,
  serviceKey: string,
) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // Build knowledge entry from booth analysis
  const regionalSummary = Array.isArray(analysis.regional_insights)
    ? analysis.regional_insights.map((r: any) => `${r.region}: ${r.predicted_score}/100`).join(", ")
    : "";

  const knowledgeContent = [
    `Booth Division "${divisionName}"${variantLabel ? ` (${variantLabel})` : ""} scored ${analysis.overall_score}/100.`,
    analysis.summary || "",
    `Dimension scores: Design ${analysis.design_score}, Production ${analysis.production_score}, Messaging ${analysis.messaging_score}, Content ${analysis.content_score}, Differentiation ${analysis.differentiation_score}, Engagement ${analysis.engagement_score}.`,
    regionalSummary ? `Regional performance: ${regionalSummary}.` : "",
    Array.isArray(analysis.strengths) && analysis.strengths.length > 0
      ? `Key strengths: ${analysis.strengths.slice(0, 3).map((s: any) => s.title).join(", ")}.`
      : "",
    Array.isArray(analysis.improvements) && analysis.improvements.length > 0
      ? `Priority improvements: ${analysis.improvements.filter((i: any) => i.priority === "high").slice(0, 3).map((i: any) => i.title).join(", ")}.`
      : "",
  ].filter(Boolean).join(" ");

  const knowledgeEntry = {
    id: crypto.randomUUID(),
    type: "booth_analysis",
    source: "auto",
    title: `Booth Analysis: ${divisionName}${variantLabel ? ` — ${variantLabel}` : ""}`,
    content: knowledgeContent,
    tags: ["booth", "trade-show", "exhibition", divisionName.toLowerCase().replace(/\s+/g, "-")],
    created_at: new Date().toISOString(),
    confidence: 0.8,
    overall_score: analysis.overall_score,
  };

  // 1. Find any existing brand_intelligence records and append knowledge entry
  // We look for org-level intelligence records to bubble up to
  const intelRes = await fetch(
    `${supabaseUrl}/rest/v1/brand_intelligence?entity_type=eq.brand&select=id,knowledge_entries,cultural_insights,learning_context&limit=5`,
    { headers }
  );

  if (intelRes.ok) {
    const intelRecords = await intelRes.json();
    for (const intel of intelRecords) {
      const entries = Array.isArray(intel.knowledge_entries) ? intel.knowledge_entries : [];

      // Deduplicate by title
      const isDuplicate = entries.some(
        (e: any) => e.title === knowledgeEntry.title && e.type === "booth_analysis"
      );

      const updatedEntries = isDuplicate
        ? entries.map((e: any) =>
            e.title === knowledgeEntry.title && e.type === "booth_analysis"
              ? knowledgeEntry
              : e
          )
        : [...entries, knowledgeEntry];

      // Merge regional insights into cultural_insights
      const existingCultural = (intel.cultural_insights as any) || {};
      const boothRegionalData = Array.isArray(analysis.regional_insights)
        ? analysis.regional_insights.map((r: any) => ({
            region: r.region,
            score: r.predicted_score,
            source: "booth_analysis",
            division: divisionName,
            considerations: r.cultural_considerations,
          }))
        : [];

      const existingBoothRegional = Array.isArray(existingCultural.booth_regional_performance)
        ? existingCultural.booth_regional_performance
        : [];

      // Merge: keep latest per region+division
      const mergedRegional = [...existingBoothRegional];
      for (const newR of boothRegionalData) {
        const idx = mergedRegional.findIndex(
          (e: any) => e.region === newR.region && e.division === newR.division
        );
        if (idx >= 0) mergedRegional[idx] = newR;
        else mergedRegional.push(newR);
      }

      const updatedCultural = {
        ...existingCultural,
        booth_regional_performance: mergedRegional,
      };

      // Merge booth context into learning_context
      const existingLearning = (intel.learning_context as any) || {};
      const updatedLearning = {
        ...existingLearning,
        booth_analyses: {
          ...(existingLearning.booth_analyses || {}),
          [divisionName]: {
            overall_score: analysis.overall_score,
            variant: variantLabel,
            design_score: analysis.design_score,
            messaging_score: analysis.messaging_score,
            updated_at: new Date().toISOString(),
          },
        },
        last_updated: new Date().toISOString(),
      };

      await fetch(`${supabaseUrl}/rest/v1/brand_intelligence?id=eq.${intel.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          knowledge_entries: updatedEntries,
          cultural_insights: updatedCultural,
          learning_context: updatedLearning,
        }),
      });
    }
  }

  console.log(`[booth-analysis] Bubbled up insights for "${divisionName}" to Brand Intelligence & Oracle`);
}
