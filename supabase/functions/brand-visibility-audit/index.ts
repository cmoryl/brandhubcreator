/**
 * brand-visibility-audit — AI-powered brand visibility gap analysis
 * Analyzes search visibility, AI platform presence, and social/media gaps
 * Uses async job pattern for heavy processing
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
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

    const body = await req.json();
    const { entityId, entityType, entityName, organizationId, websites, socialProfiles } = body;

    if (!entityId || !entityType || !entityName) {
      return new Response(JSON.stringify({ error: "entityId, entityType, entityName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the audit job record
    const { data: audit, error: insertError } = await supabase
      .from("brand_visibility_audits")
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        entity_name: entityName,
        organization_id: organizationId || null,
        created_by: userId,
        status: "processing",
        websites_analyzed: websites || [],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run analysis in background
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    EdgeRuntime.waitUntil(
      runVisibilityAnalysis(serviceClient, audit.id, {
        entityId,
        entityType,
        entityName,
        organizationId,
        websites: websites || [],
        socialProfiles: socialProfiles || [],
      })
    );

    return new Response(
      JSON.stringify({ audit_id: audit.id, status: "processing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("brand-visibility-audit error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function runVisibilityAnalysis(
  supabase: any,
  auditId: string,
  context: {
    entityId: string;
    entityType: string;
    entityName: string;
    organizationId: string | null;
    websites: string[];
    socialProfiles: string[];
  }
) {
  try {
    // Fetch entity context from DB
    const { data: entityContext } = await supabase.rpc("get_entity_text_context", {
      p_table: context.entityType === "brand" ? "brands" : context.entityType === "product" ? "products" : "events",
      p_id: context.entityId,
    });

    const brandContext = entityContext
      ? `Brand: ${entityContext.name || context.entityName}
Tagline: ${entityContext.hero_tagline || "N/A"}
Mission: ${entityContext.mission || "N/A"}
Industry: ${entityContext.industry || "N/A"}
Archetype: ${entityContext.archetype || "N/A"}
Colors: ${JSON.stringify(entityContext.colors || [])}
Values: ${JSON.stringify(entityContext.values || [])}
Services: ${JSON.stringify(entityContext.services || [])}
Websites: ${JSON.stringify(entityContext.websites || context.websites)}
Social Profiles: ${JSON.stringify(entityContext.social_profiles || context.socialProfiles)}
Website Analyses: ${JSON.stringify(entityContext.website_analyses || [])}`
      : `Brand: ${context.entityName}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a brand visibility analyst specializing in digital presence auditing.
You analyze brands across three key visibility dimensions:
1. SEARCH VISIBILITY — SEO health, keyword rankings, domain authority signals, content gaps, schema markup
2. AI PLATFORM PRESENCE — How well the brand appears in AI assistants (ChatGPT, Gemini, Perplexity, Claude), knowledge graph inclusion, structured data readiness
3. SOCIAL/MEDIA VISIBILITY — Social platform coverage, media mention gaps, competitor platform analysis

CRITICAL ACCURACY RULES:
- Only flag a website, social platform, or asset as "missing" if it does NOT appear in the provided Brand Context.
- If a website URL is listed in the context, do NOT claim the brand has no website. Acknowledge what exists, then evaluate quality/SEO/coverage gaps.
- If social profiles are listed, do NOT claim those platforms are missing — instead evaluate them for activity, content quality, or coverage of additional platforms.
- Treat the Brand Context as the source of truth for what assets exist. Do not fabricate missing items.
- When you list a gap, reference the actual data: e.g., "LinkedIn profile present but no YouTube" rather than "no social presence".

Provide actionable, specific recommendations. Score each dimension 0-100.
Always identify specific visibility GAPS — only where they actually exist based on the provided context.`;

    const userPrompt = `Perform a comprehensive visibility gap analysis for this brand using ONLY the data provided below as ground truth for what exists today:

${brandContext}

Analyze and return results using the provided tool schema. Be specific about:
- Which search queries this brand should rank for but likely doesn't (do not assume the website is missing if one is listed above)
- Which AI platforms might not have good knowledge of this brand and why
- Which social/media platforms are underutilized OR missing relative to the listed profiles
- Specific actionable steps to close each gap
- Overall visibility score and per-dimension scores

Do NOT invent missing assets that contradict the context above.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_visibility_audit",
              description: "Submit the complete brand visibility audit results",
              parameters: {
                type: "object",
                properties: {
                  overall_visibility_score: { type: "number", description: "Overall visibility score 0-100" },
                  search_visibility_score: { type: "number", description: "Search visibility score 0-100" },
                  ai_platform_score: { type: "number", description: "AI platform presence score 0-100" },
                  social_media_score: { type: "number", description: "Social/media visibility score 0-100" },
                  search_analysis: {
                    type: "object",
                    properties: {
                      seo_health: { type: "string", description: "Overall SEO health assessment" },
                      keyword_gaps: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            keyword: { type: "string" },
                            difficulty: { type: "string", enum: ["low", "medium", "high"] },
                            potential_impact: { type: "string", enum: ["low", "medium", "high"] },
                            recommendation: { type: "string" },
                          },
                          required: ["keyword", "difficulty", "potential_impact", "recommendation"],
                        },
                      },
                      content_gaps: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            topic: { type: "string" },
                            content_type: { type: "string" },
                            priority: { type: "string", enum: ["low", "medium", "high"] },
                          },
                          required: ["topic", "content_type", "priority"],
                        },
                      },
                      technical_issues: { type: "array", items: { type: "string" } },
                      strengths: { type: "array", items: { type: "string" } },
                    },
                    required: ["seo_health", "keyword_gaps", "content_gaps"],
                  },
                  ai_platform_analysis: {
                    type: "object",
                    properties: {
                      overall_readiness: { type: "string", description: "How AI-ready is this brand's content" },
                      platforms: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            platform: { type: "string" },
                            presence_level: { type: "string", enum: ["none", "minimal", "moderate", "strong"] },
                            issues: { type: "array", items: { type: "string" } },
                            improvements: { type: "array", items: { type: "string" } },
                          },
                          required: ["platform", "presence_level"],
                        },
                      },
                      structured_data_gaps: { type: "array", items: { type: "string" } },
                      knowledge_graph_status: { type: "string" },
                    },
                    required: ["overall_readiness", "platforms"],
                  },
                  social_media_analysis: {
                    type: "object",
                    properties: {
                      coverage_assessment: { type: "string" },
                      platform_gaps: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            platform: { type: "string" },
                            status: { type: "string", enum: ["missing", "inactive", "underperforming", "active"] },
                            opportunity: { type: "string" },
                            priority: { type: "string", enum: ["low", "medium", "high"] },
                          },
                          required: ["platform", "status", "opportunity", "priority"],
                        },
                      },
                      media_mention_gaps: { type: "array", items: { type: "string" } },
                      competitor_advantages: { type: "array", items: { type: "string" } },
                    },
                    required: ["coverage_assessment", "platform_gaps"],
                  },
                  visibility_gaps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["search", "ai", "social", "media", "content"] },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        action_items: { type: "array", items: { type: "string" } },
                        estimated_effort: { type: "string", enum: ["quick-win", "moderate", "significant"] },
                      },
                      required: ["category", "severity", "title", "description", "action_items"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "number", description: "1 = highest priority" },
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["search", "ai", "social", "content", "technical"] },
                        impact: { type: "string", enum: ["low", "medium", "high"] },
                        effort: { type: "string", enum: ["quick-win", "moderate", "significant"] },
                      },
                      required: ["priority", "title", "description", "category", "impact"],
                    },
                  },
                },
                required: [
                  "overall_visibility_score",
                  "search_visibility_score",
                  "ai_platform_score",
                  "social_media_score",
                  "search_analysis",
                  "ai_platform_analysis",
                  "social_media_analysis",
                  "visibility_gaps",
                  "recommendations",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_visibility_audit" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add credits in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error: ${response.status} ${errText}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured result from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Update the audit record with results
    await supabase
      .from("brand_visibility_audits")
      .update({
        status: "completed",
        overall_visibility_score: result.overall_visibility_score,
        search_visibility_score: result.search_visibility_score,
        ai_platform_score: result.ai_platform_score,
        social_media_score: result.social_media_score,
        search_analysis: result.search_analysis,
        ai_platform_analysis: result.ai_platform_analysis,
        social_media_analysis: result.social_media_analysis,
        visibility_gaps: result.visibility_gaps,
        recommendations: result.recommendations,
        completed_at: new Date().toISOString(),
      })
      .eq("id", auditId);

    console.log(`Visibility audit ${auditId} completed successfully`);
  } catch (err) {
    console.error(`Visibility audit ${auditId} failed:`, err);
    await supabase
      .from("brand_visibility_audits")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", auditId);
  }
}
