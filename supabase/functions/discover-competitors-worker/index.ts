import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  let jobId: string | null = null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const headers = {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const updateJob = async (updates: Record<string, unknown>) => {
    if (!jobId) return;
    await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify(updates),
    });
  };

  try {
    const body = await req.json();
    jobId = body.jobId;
    const { entityType, entityId, entityName, industry, additionalContext } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch minimal entity context via REST
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";
    const entityRes = await fetch(
      `${supabaseUrl}/rest/v1/${tableName}?id=eq.${entityId}&select=guide_data`,
      { headers }
    );
    const entityRows = await entityRes.json();
    const guideData = (entityRows?.[0]?.guide_data as Record<string, unknown>) || {};
    const hero = (guideData.hero as Record<string, string>) || {};
    const identity = (guideData.identity as Record<string, string>) || {};

    const contextParts = [
      `Name: ${entityName}`,
      `Type: ${entityType}`,
      hero.tagline ? `Tagline: ${hero.tagline}` : "",
      identity.archetype ? `Archetype: ${identity.archetype}` : "",
      industry ? `Industry: ${industry}` : "",
      additionalContext || "",
    ].filter(Boolean).join(". ");

    await updateJob({ progress: 30 });

    const prompt = `Identify 5-8 competitors for: ${contextParts}

Return ONLY a JSON object: {"competitors":[{"name":"string","reason":"string","type":"direct|indirect|emerging"}]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || "";

    const jsonMatch = rawContent.match(/\{[\s\S]*"competitors"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse competitors from AI response");
    }

    const result = JSON.parse(jsonMatch[0]);

    await updateJob({
      status: "completed",
      progress: 100,
      result: { competitors: result.competitors || [], entityName },
      completed_at: new Date().toISOString(),
    });

    console.log(`Discovered ${result.competitors?.length || 0} competitors for ${entityName}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Worker error:", error);
    await updateJob({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
