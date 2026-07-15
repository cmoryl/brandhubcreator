// Streams a Next 2026 division .pptx from the private `next2026-pptx` bucket.
// Public endpoint — no auth required. Uses service role internally.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const DIVISIONS: Record<string, string> = {
  transperfect: "transperfect/transperfect-next-master-ppt.pptx",
  globallink: "globallink/globallink-next-master-ppt.pptx",
  dataforce: "dataforce/dataforce-next-master-ppt.pptx",
  games: "games/games-next-master-ppt.pptx",
  lifesci: "lifesci/lifesci-next-master-ppt.pptx",
  legal: "legal/legal-next-master-ppt.pptx",
  finance: "finance/finance-next-master-ppt.pptx",
  media: "media/media-next-master-ppt.pptx",
  learn: "learn/learn-next-master-ppt.pptx",
  digital: "digital/digital-next-master-ppt.pptx",
  experience: "experience/experience-next-master-ppt.pptx",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const division = (url.searchParams.get("division") || "").toLowerCase();
  const path = DIVISIONS[division];
  if (!path) {
    return new Response(JSON.stringify({ error: "unknown division" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.storage.from("next2026-pptx").download(path);
  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || "not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const filename = path.split("/").pop()!;
  return new Response(data, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
});
