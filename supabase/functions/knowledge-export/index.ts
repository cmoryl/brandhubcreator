// One-shot knowledge export. Returns all oracle + brand intelligence as JSON.
// Uses service role internally; safe to call from server contexts only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [oi, okb, bi] = await Promise.all([
    supabase.from("oracle_intelligence").select("*"),
    supabase.from("oracle_knowledge_base").select("*"),
    supabase.from("brand_intelligence").select("id, entity_type, entity_id, organization_id, knowledge_entries, brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, competitive_landscape, cultural_insights, updated_at"),
  ]);

  return new Response(
    JSON.stringify({
      exported_at: new Date().toISOString(),
      oracle_intelligence: oi.data || [],
      oracle_knowledge_base: okb.data || [],
      brand_intelligence: bi.data || [],
      errors: { oi: oi.error?.message, okb: okb.error?.message, bi: bi.error?.message },
    }, null, 2),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
