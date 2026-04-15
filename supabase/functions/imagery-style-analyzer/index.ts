import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
      if (!canUse) {
        return new Response(JSON.stringify({ error: "AI features not available" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { entityId, entityType, images } = await req.json();

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch entity context
    const tableMap: Record<string, string> = { brand: "brands", product: "products", event: "events" };
    const { data: entityData } = await supabase
      .from(tableMap[entityType] || "brands")
      .select("name, guide_data")
      .eq("id", entityId)
      .maybeSingle();

    const guideData = (entityData as any)?.guide_data || {};
    const brandContext = {
      name: (entityData as any)?.name || "Unknown",
      archetype: guideData.identity?.archetype || "",
      colors: (guideData.colors || []).slice(0, 6).map((c: any) => c?.hex || c?.value).filter(Boolean),
      values: (guideData.values || []).slice(0, 5).map((v: any) => v?.text || v).filter(Boolean),
    };

    // Limit to 15 images max for speed, send only titles (not URLs - AI can't see them anyway)
    const limitedImages = images.slice(0, 15);
    const imageDescriptions = limitedImages.map((img: any, i: number) =>
      `${i + 1}. "${img.title || 'Untitled'}" (ID: ${img.id})`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a visual brand consistency analyst. Analyze imagery for "${brandContext.name}" (${entityType}).
Brand: archetype "${brandContext.archetype}", colors: [${brandContext.colors.join(", ")}], values: [${brandContext.values.join(", ")}].
Based on the image titles/descriptions, evaluate visual consistency. Be concise.`;

    // Use AbortController with 50s timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze these ${limitedImages.length} images for visual style consistency:\n\n${imageDescriptions}\n\nProvide cohesion score, palette, style tags, any outliers, and recommendations.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "report_style_analysis",
              description: "Return the visual style analysis results",
              parameters: {
                type: "object",
                properties: {
                  cohesionScore: { type: "number", description: "Overall style cohesion score 0-100" },
                  dominantPalette: { type: "array", items: { type: "string" }, description: "Up to 5 dominant hex colors" },
                  styleTags: { type: "array", items: { type: "string" }, description: "3-6 visual style descriptors" },
                  outliers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        imageId: { type: "string" },
                        imageUrl: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["imageId", "imageUrl", "reason"],
                    },
                    description: "Images that don't fit the overall style (max 3)",
                  },
                  recommendations: { type: "array", items: { type: "string" }, description: "2-4 actionable recommendations" },
                },
                required: ["cohesionScore", "dominantPalette", "styleTags", "outliers", "recommendations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "report_style_analysis" } },
        }),
        signal: controller.signal,
      });
    } catch (abortErr: any) {
      if (abortErr.name === 'AbortError') {
        return new Response(JSON.stringify({ error: "Analysis timed out. Try with fewer images." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw abortErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: try to parse from content
      const content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        console.log("No tool call, got content instead:", content.slice(0, 200));
      }
      throw new Error("No analysis returned from AI");
    }

    const analysis = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    // Ensure outliers have imageUrl from our input data
    if (analysis.outliers) {
      const imageMap = new Map(limitedImages.map((img: any) => [img.id, img.url]));
      analysis.outliers = analysis.outliers.map((o: any) => ({
        ...o,
        imageUrl: o.imageUrl || imageMap.get(o.imageId) || '',
      }));
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("imagery-style-analyzer error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
