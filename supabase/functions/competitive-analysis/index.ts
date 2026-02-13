import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const svcHeaders = {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { entityType, entityId, organizationId, competitors, region, country } = await req.json();

    if (!entityType || !["brand", "product", "event"].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: "Invalid entityType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!entityId || !competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return new Response(
        JSON.stringify({ error: "entityId and competitors are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user via REST
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { "apikey": anonKey, "Authorization": authHeader },
    });
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = await userRes.json();

    // Rate limit check (5 per hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const rlRes = await fetch(
      `${supabaseUrl}/rest/v1/competitive_analysis_reports?created_by=eq.${user.id}&created_at=gte.${oneHourAgo}&select=id`,
      { headers: { ...svcHeaders, "Prefer": "count=exact" } }
    );
    const countHeader = rlRes.headers.get("content-range");
    const count = countHeader ? parseInt(countHeader.split("/")[1] || "0") : 0;
    if (count >= 5) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 5 reports per hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create job record
    const jobRes = await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs`, {
      method: "POST",
      headers: { ...svcHeaders, "Prefer": "return=representation" },
      body: JSON.stringify({
        entity_id: entityId,
        entity_type: entityType,
        user_id: user.id,
        organization_id: organizationId || null,
        status: "processing",
        progress: 0,
      }),
    });
    const jobs = await jobRes.json();
    const jobId = jobs?.[0]?.id;
    if (!jobId) throw new Error("Failed to create job");

    // Fire worker in background
    // @ts-ignore EdgeRuntime available in Supabase
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/competitive-analysis-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          jobId,
          entityType,
          entityId,
          organizationId,
          competitors: competitors.slice(0, 10),
          region,
          country,
          userId: user.id,
          userAuth: authHeader,
        }),
      }).catch(async (error) => {
        console.error(`Worker call failed for job ${jobId}:`, error);
        await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
          method: "PATCH",
          headers: { ...svcHeaders, "Prefer": "return=minimal" },
          body: JSON.stringify({
            status: "failed",
            error_message: error.message || "Worker invocation failed",
            completed_at: new Date().toISOString(),
          }),
        });
      })
    );

    return new Response(
      JSON.stringify({ jobId, status: "processing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[competitive-analysis] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
