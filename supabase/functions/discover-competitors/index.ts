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

    const { entityType, entityId, entityName, industry, additionalContext } = await req.json();

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

    // Delegate to worker function via HTTP (separate isolate = separate memory)
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/discover-competitors-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          jobId: job.id,
          entityType,
          entityId,
          entityName,
          industry,
          additionalContext,
        }),
      }).catch(async (error) => {
        console.error(`Worker call failed for job ${job.id}:`, error);
        await supabase
          .from("brand_intelligence_jobs")
          .update({ status: "failed", error_message: error.message, completed_at: new Date().toISOString() })
          .eq("id", job.id);
      })
    );

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
