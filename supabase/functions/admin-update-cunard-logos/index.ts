// One-off: re-sign and replace Cunard wordmark files with the high-quality SVGs
// already uploaded to global-logos/cunard/.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const paths = [
    { key: "cunard/wordmark-color.svg", variant: "color" },
    { key: "cunard/wordmark-black.svg", variant: "black" },
    { key: "cunard/wordmark-white.svg", variant: "white" },
  ];
  const newFiles: any[] = [];
  for (const p of paths) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(p.key, TTL);
    if (error) return new Response(JSON.stringify({ error: error.message, key: p.key }), { status: 500, headers: cors });
    newFiles.push({
      format: "svg",
      lockup: "wordmark",
      variant: p.variant,
      source: "worldvectorlogo:replacement",
      url: data.signedUrl,
    });
  }

  // Fetch existing icon files, keep them
  const { data: row, error: rErr } = await sb
    .from("global_client_logos")
    .select("id, files")
    .ilike("name", "cunard")
    .maybeSingle();
  if (rErr || !row) return new Response(JSON.stringify({ error: rErr?.message || "not found" }), { status: 500, headers: cors });

  const existing = Array.isArray(row.files) ? row.files : [];
  const iconsKept = existing.filter((f: any) => f.lockup === "icon");
  const merged = [...newFiles, ...iconsKept];

  const { error: uErr } = await sb
    .from("global_client_logos")
    .update({ files: merged })
    .eq("id", row.id);
  if (uErr) return new Response(JSON.stringify({ error: uErr.message }), { status: 500, headers: cors });

  return new Response(JSON.stringify({ ok: true, files: merged }), { headers: { ...cors, "Content-Type": "application/json" } });
});
