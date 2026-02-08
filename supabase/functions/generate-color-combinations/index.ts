import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ColorInput {
  id: string;
  name: string;
  hex: string;
  usage?: string;
}

interface ColorCombination {
  id: string;
  name: string;
  colors: string[];
  status: 'approved' | 'rejected';
  notes: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const authSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await authSupabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { entityType, entityId, colors, entityName } = await req.json();
    
    if (!colors || colors.length < 2) {
      return new Response(
        JSON.stringify({ error: "At least 2 colors required to generate combinations" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const colorList = colors.map((c: ColorInput) => `${c.name} (${c.hex})`).join(", ");
    
    const systemPrompt = `You are a professional brand color consultant. Your task is to analyze brand color palettes and create color combinations.

For APPROVED combinations: Create harmonious pairings that follow color theory principles - complementary, analogous, or triadic relationships. These should be visually appealing and suitable for professional brand materials.

For REJECTED combinations: Create examples of what NOT to do - clashing colors, poor contrast, or combinations that would be difficult to read or visually jarring. These serve as anti-patterns to help brand teams avoid mistakes.

Always return exactly 6 combinations total: 3 approved and 3 rejected.`;

    const userPrompt = `Analyze the color palette for "${entityName}" and generate color combinations.

Available colors: ${colorList}

Generate exactly 6 color combinations:
- 3 APPROVED combinations (harmonious, professional, good contrast)
- 3 REJECTED combinations (clashing, poor contrast, anti-patterns)

For each combination, select 2-4 colors from the palette.

Use the suggest_combinations function to return your results.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_combinations",
              description: "Return color combinations for the brand",
              parameters: {
                type: "object",
                properties: {
                  combinations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { 
                          type: "string",
                          description: "Descriptive name for this combination (e.g., 'Primary Corporate', 'Digital Accent', 'Warning: Low Contrast')"
                        },
                        colors: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Array of 2-4 hex color values from the palette"
                        },
                        status: { 
                          type: "string", 
                          enum: ["approved", "rejected"],
                          description: "Whether this combination is approved or rejected"
                        },
                        notes: { 
                          type: "string",
                          description: "Brief explanation of why this combination works or doesn't work"
                        }
                      },
                      required: ["name", "colors", "status", "notes"]
                    }
                  }
                },
                required: ["combinations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_combinations" } }
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
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "suggest_combinations") {
      throw new Error("Unexpected response format from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Add unique IDs to each combination
    const combinations: ColorCombination[] = result.combinations.map((combo: any) => ({
      id: crypto.randomUUID(),
      name: combo.name,
      colors: combo.colors,
      status: combo.status,
      notes: combo.notes
    }));

    // Update the entity in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let tableName: string;
    switch (entityType) {
      case 'brand':
        tableName = 'brands';
        break;
      case 'product':
        tableName = 'products';
        break;
      case 'event':
        tableName = 'events';
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Get current guide_data and update colorCombinations
    const { data: entity, error: fetchError } = await supabase
      .from(tableName)
      .select('guide_data')
      .eq('id', entityId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch entity: ${fetchError.message}`);
    }

    const updatedGuideData = {
      ...entity.guide_data,
      colorCombinations: combinations
    };

    const { error: updateError } = await supabase
      .from(tableName)
      .update({ guide_data: updatedGuideData })
      .eq('id', entityId);

    if (updateError) {
      throw new Error(`Failed to update entity: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        entityName,
        combinations,
        message: `Generated ${combinations.length} color combinations for ${entityName}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating color combinations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
