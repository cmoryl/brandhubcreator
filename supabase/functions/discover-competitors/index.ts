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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Poll action - check job status
    if (action === "poll") {
      const { jobId } = body;
      if (!jobId) {
        return new Response(
          JSON.stringify({ error: "jobId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: job, error: jobError } = await supabase
        .from("brand_intelligence_jobs")
        .select("status, result, error_message")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          status: job.status,
          result: job.result,
          error: job.error_message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default action: start discovery
    const { entityType, entityId, entityName, industry, additionalContext } = body;

    if (!entityId || !entityName) {
      return new Response(
        JSON.stringify({ error: "entityId and entityName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from("brand_intelligence_jobs")
      .insert({
        entity_id: entityId,
        entity_type: entityType || "brand",
        user_id: user.id,
        status: "processing",
        progress: 0,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw new Error("Failed to create job: " + jobError?.message);
    }

    // Background processing via waitUntil
    EdgeRuntime.waitUntil(
      processDiscovery(supabase, job.id, entityType, entityId, entityName, industry, additionalContext)
        .catch(async (error) => {
          console.error(`Job ${job.id} failed:`, error);
          await supabase
            .from("brand_intelligence_jobs")
            .update({ status: "failed", error_message: error.message, completed_at: new Date().toISOString() })
            .eq("id", job.id);
        })
    );

    // Return immediately
    return new Response(
      JSON.stringify({ jobId: job.id, status: "processing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in discover-competitors:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processDiscovery(
  supabase: any,
  jobId: string,
  entityType: string,
  entityId: string,
  entityName: string,
  industry?: string,
  additionalContext?: string
) {
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
}
