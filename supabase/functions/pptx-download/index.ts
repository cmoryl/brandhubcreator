// Streams a Next 2026 division .pptx from the private `next2026-pptx` bucket.
// Public endpoint — no auth required. Uses service role internally.
//
// Query params:
//   division: one of the keys below (required)
//   kind:     "canva" (default) | "native"
//             - "canva"  = Canva-exported deck (sections 4/7)
//             - "native" = Native PowerPoint Slide Master deliverable (section 10)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const CANVA_DIVISIONS: Record<string, string> = {
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

const NATIVE_DIVISIONS: Record<string, string> = {
  transperfect: "native-masters/transperfect/TransPerfect_NEXT_Master_PPT_Template.pptx",
  dataforce: "native-masters/dataforce/Dataforce_NEXT_Master_PPT_Template.pptx",
  games: "native-masters/games/Games_NEXT_Master_PPT_Template.pptx",
  lifesci: "native-masters/lifesci/Life_Sci_NEXT_Master_PPT_Template.pptx",
  legal: "native-masters/legal/Legal_NEXT_Master_PPT_Template.pptx",
  finance: "native-masters/finance/Finance_NEXT_Master_PPT_Template.pptx",
  media: "native-masters/media/Media_NEXT_Master_PPT_Template.pptx",
  learn: "native-masters/learn/Learn_NEXT_Master_PPT_Template.pptx",
  digital: "native-masters/digital/Digital_NEXT_Master_PPT_Template.pptx",
  experience: "native-masters/experience/Experience_NEXT_Master_PPT_Template.pptx",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const division = (url.searchParams.get("division") || "").toLowerCase();
  const kind = (url.searchParams.get("kind") || "canva").toLowerCase();
  const map = kind === "native" ? NATIVE_DIVISIONS : CANVA_DIVISIONS;
  const path = map[division];
  if (!path) {
    return new Response(JSON.stringify({ error: "unknown division or kind" }), {
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
  // disposition=inline is used by the Office Online preview viewer; default to attachment for Download links.
  const disposition = (url.searchParams.get("disposition") || "attachment").toLowerCase() === "inline"
    ? "inline"
    : "attachment";
  return new Response(data, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
});
