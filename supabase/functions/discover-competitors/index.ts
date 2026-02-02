import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscoverCompetitorsRequest {
  entityType: "brand" | "product" | "event";
  entityId: string;
  entityName: string;
  industry?: string;
  additionalContext?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entityType, entityId, entityName, industry, additionalContext } =
      (await req.json()) as DiscoverCompetitorsRequest;

    if (!entityId || !entityName) {
      return new Response(
        JSON.stringify({ error: "entityId and entityName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch entity data to get more context
    let entityData: any = null;
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";
    
    const { data, error } = await supabase
      .from(tableName)
      .select("guide_data, name")
      .eq("id", entityId)
      .single();

    if (!error && data) {
      entityData = data.guide_data;
    }

    // Extract relevant context from entity data
    const guideData = entityData || {};
    const hero = guideData.hero || {};
    const identity = guideData.identity || {};
    const services = guideData.services || [];
    const values = guideData.values || [];

    // Build context for the AI
    const entityContext = `
Entity Name: ${entityName}
Entity Type: ${entityType}
${hero.tagline ? `Tagline: ${hero.tagline}` : ""}
${identity.mission ? `Mission: ${identity.mission}` : ""}
${identity.archetype ? `Brand Archetype: ${identity.archetype}` : ""}
${services.length > 0 ? `Services/Products: ${services.map((s: any) => s.name || s.title).filter(Boolean).join(", ")}` : ""}
${values.length > 0 ? `Core Values: ${values.map((v: any) => v.title || v.name).filter(Boolean).join(", ")}` : ""}
${industry ? `Industry: ${industry}` : ""}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}
    `.trim();

    const systemPrompt = `You are a competitive intelligence expert. Your task is to identify the top competitors for a given brand, product, or event.

Based on the entity information provided, identify 5-8 relevant competitors. Consider:
1. Direct competitors offering similar products/services
2. Indirect competitors in adjacent markets
3. Emerging disruptors in the space
4. Market leaders that set industry standards

For each competitor, provide:
- name: The company/brand name
- reason: A brief explanation of why they're a competitor (1 sentence)
- type: Either "direct", "indirect", or "emerging"

Return your response as a JSON object with a "competitors" array.`;

    const userPrompt = `Identify the top competitors for:

${entityContext}

Return a JSON object with the following structure:
{
  "competitors": [
    { "name": "Competitor Name", "reason": "Why they compete", "type": "direct|indirect|emerging" }
  ]
}`;

    console.log("Discovering competitors for:", entityName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_competitors",
              description: "Return the list of discovered competitors",
              parameters: {
                type: "object",
                properties: {
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Competitor company/brand name" },
                        reason: { type: "string", description: "Brief explanation of competitive relationship" },
                        type: { 
                          type: "string", 
                          enum: ["direct", "indirect", "emerging"],
                          description: "Type of competitor" 
                        },
                      },
                      required: ["name", "reason", "type"],
                    },
                  },
                },
                required: ["competitors"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_competitors" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        competitors: result.competitors || [],
        entityName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error discovering competitors:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to discover competitors" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
