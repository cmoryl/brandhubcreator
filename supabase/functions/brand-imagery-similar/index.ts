/**
 * brand-imagery-similar
 *
 * Given a text query (or a free-form prompt) and a target entity, returns the
 * top-N approved images from that entity's library, ranked by cosine
 * similarity in vector space. Powered by the embeddings stored by
 * `brand-visual-dna`.
 *
 * The actual ACL is enforced inside the `match_brand_imagery` RPC, which is
 * SECURITY DEFINER and checks organization_members ↔ auth.uid().
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMBED_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBED_MODEL = "openai/text-embedding-3-small";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      entityId,
      entityType,
      query,
      matchCount = 12,
    } = body as {
      entityId?: string;
      entityType?: "brand" | "product" | "event";
      query?: string;
      matchCount?: number;
    };

    if (!entityId || !entityType || !query?.trim()) {
      return new Response(
        JSON.stringify({ error: "entityId, entityType, and query are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Embed the query through Lovable AI gateway.
    const embedRes = await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: query }),
    });
    if (!embedRes.ok) {
      const txt = await embedRes.text();
      const status = embedRes.status === 429 || embedRes.status === 402 ? embedRes.status : 502;
      return new Response(
        JSON.stringify({ error: `Embedding failed: ${txt.slice(0, 200)}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const embedJson = await embedRes.json();
    const embedding: number[] | undefined = embedJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      return new Response(
        JSON.stringify({ error: "Embedding response malformed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run match_brand_imagery as the calling user so RLS / membership applies.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data, error } = await supabase.rpc("match_brand_imagery", {
      p_entity_id: entityId,
      p_entity_type: entityType,
      p_query_embedding: embedding,
      p_match_count: Math.min(Math.max(Number(matchCount) || 12, 1), 48),
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ matches: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[brand-imagery-similar] error:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
