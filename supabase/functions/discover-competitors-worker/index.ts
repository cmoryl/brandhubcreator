import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  try {
    const { jobId, entityType, entityId, entityName, industry, additionalContext } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch minimal entity context
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";
    const { data } = await supabase
      .from(tableName)
      .select("guide_data")
      .eq("id", entityId)
      .single();

    const guideData = (data?.guide_data as Record<string, any>) || {};
    const hero = guideData.hero || {};
    const identity = guideData.identity || {};

    const contextParts = [
      `Name: ${entityName}`,
      `Type: ${entityType}`,
      hero.tagline ? `Tagline: ${hero.tagline}` : "",
      identity.archetype ? `Archetype: ${identity.archetype}` : "",
      industry ? `Industry: ${industry}` : "",
      additionalContext || "",
    ].filter(Boolean).join(". ");

    await supabase
      .from("brand_intelligence_jobs")
      .update({ progress: 30 })
      .eq("id", jobId);

    const prompt = `Identify 5-8 competitors for: ${contextParts}

Return ONLY a JSON object: {"competitors":[{"name":"string","reason":"string","type":"direct|indirect|emerging"}]}`;

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
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    const jsonMatch = rawContent.match(/\{[\s\S]*"competitors"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse competitors from AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    await supabase
      .from("brand_intelligence_jobs")
      .update({
        status: "completed",
        progress: 100,
        result: { competitors: result.competitors || [], entityName },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`Discovered ${result.competitors?.length || 0} competitors for ${entityName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Worker error:", error);

    // Try to update job status
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { jobId } = await req.clone().json().catch(() => ({ jobId: null }));
      if (jobId) {
        await supabase
          .from("brand_intelligence_jobs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
    } catch { /* best effort */ }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
