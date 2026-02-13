import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authSupabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { entityType, entityId, entityName, industry, additionalContext } = await req.json();

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

    // Fetch minimal entity context
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";
    
    const { data } = await supabase
      .from(tableName)
      .select("guide_data")
      .eq("id", entityId)
      .single();

    const guideData = (data?.guide_data as Record<string, any>) || {};
    const hero = guideData.hero || {};
    const identity = guideData.identity || {};

    // Build a compact context string
    const contextParts = [
      `Name: ${entityName}`,
      `Type: ${entityType}`,
      hero.tagline ? `Tagline: ${hero.tagline}` : "",
      identity.archetype ? `Archetype: ${identity.archetype}` : "",
      industry ? `Industry: ${industry}` : "",
      additionalContext || "",
    ].filter(Boolean).join(". ");

    const prompt = `Identify 5-8 competitors for: ${contextParts}

Return ONLY a JSON object: {"competitors":[{"name":"string","reason":"string","type":"direct|indirect|emerging"}]}`;

    console.log("Discovering competitors for:", entityName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
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
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*"competitors"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse competitors from AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

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
        error: error instanceof Error ? error.message : "Failed to discover competitors",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});