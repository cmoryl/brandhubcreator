/**
 * enrich-demos-orchestrator
 * Iterates all active demos and invokes enrich-demo-content sequentially.
 * Also fires off brand-intelligence + competitive-intelligence + dataforce compliance triggers.
 *
 * Body: { onlyDemoIds?: string[], skipImagery?: boolean, triggerStrategic?: boolean }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const ORG_ID = "ec180296-dfe8-4345-869e-66b524e0a12c";

interface Demo {
  id: string;
  name: string;
  slug: string;
  type: string;
}

async function createJob(entityId: string, entityType: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/brand_intelligence_jobs`, {
    method: "POST",
    headers: { ...restHeaders, Prefer: "return=representation" },
    body: JSON.stringify({
      entity_id: entityId,
      entity_type: entityType,
      status: "pending",
      progress: 0,
      organization_id: ORG_ID,
      user_id: "00000000-0000-0000-0000-000000000000",
    }),
  });
  if (!res.ok) {
    console.error("Create job failed:", await res.text());
    return null;
  }
  const rows = await res.json();
  return rows[0]?.id ?? null;
}

async function invokeFn(name: string, body: unknown): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, body: parsed ?? text };
}

async function processAll(demos: Demo[], triggerStrategic: boolean) {
  const summary: any[] = [];

  for (const d of demos) {
    console.log(`▶ Enriching ${d.name} (${d.slug})...`);
    const jobId = await createJob(d.id, "demo_enrichment");

    const r = await invokeFn("enrich-demo-content", { demoId: d.id, jobId });
    const item: any = { demo: d.name, slug: d.slug, enrichment: r.ok ? "ok" : `failed: ${r.body?.error || r.status}` };

    if (triggerStrategic && r.ok) {
      // Fire-and-forget; these write to their own tables/jobs
      const intel = await invokeFn("brand-intelligence", {
        entityType: d.type,
        entityId: d.id,
        entityName: d.name,
        analysisType: "comprehensive",
      });
      item.intelligence = intel.ok ? "queued" : `failed: ${intel.status}`;
    }

    summary.push(item);
    console.log(`✓ ${d.name}:`, item);
  }

  return summary;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const onlyIds: string[] | undefined = body.onlyDemoIds;
    const triggerStrategic = body.triggerStrategic ?? true;

    let url = `${SUPABASE_URL}/rest/v1/demo_brands?is_active=eq.true&select=id,name,slug,type&order=type,display_order`;
    if (onlyIds?.length) {
      url += `&id=in.(${onlyIds.join(",")})`;
    }

    const dRes = await fetch(url, { headers: restHeaders });
    const demos = (await dRes.json()) as Demo[];
    if (!demos.length) {
      return new Response(JSON.stringify({ error: "No demos found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Starting enrichment for ${demos.length} demos`);

    // Run in background so the request can return immediately
    // @ts-ignore — EdgeRuntime is provided by Supabase
    EdgeRuntime.waitUntil(processAll(demos, triggerStrategic));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Enrichment started in background",
        demos: demos.map((d) => ({ id: d.id, name: d.name, slug: d.slug, type: d.type })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
