import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };

const BRANDS: Array<{
  name: string;
  uploads: Array<{ path: string; lockup: string; variant: string; format: string; source: string }>;
}> = [
  { name: "Holland America Line", uploads: tri("holland-america-line", "wordmark", "svg", "worldvectorlogo") },
  { name: "LG",                   uploads: tri("lg",                   "icon",     "svg", "worldvectorlogo") },
  { name: "Mastercard",           uploads: tri("mastercard",           "wordmark", "svg", "worldvectorlogo") },
  { name: "Pepsi",                uploads: tri("pepsi",                "icon",     "svg", "wikimedia:pepsi-2023") },
  { name: "Starbucks",            uploads: tri("starbucks",            "icon",     "svg", "worldvectorlogo") },
  { name: "UPS",                  uploads: tri("ups",                  "icon",     "svg", "wikimedia:ups-2017") },
  { name: "Reddit",               uploads: tri("reddit",               "icon",     "svg", "worldvectorlogo") },
  { name: "Snapchat",             uploads: tri("snapchat",             "icon",     "svg", "wikimedia:svgrepo") },
  { name: "Twitch",               uploads: tri("twitch",               "wordmark", "svg", "wikimedia:wordmark-only") },
  { name: "YouTube",              uploads: tri("youtube",              "icon",     "svg", "worldvectorlogo") },
  { name: "Hewlett Packard",      uploads: [
    ...tri("hewlett-packard", "icon",     "svg", "worldvectorlogo:hp"),
    ...tri("hewlett-packard", "wordmark", "svg", "worldvectorlogo:hewlett-packard"),
  ]},
];

function tri(brand: string, lockup: string, format: string, source: string) {
  return ["color", "black", "white"].map((variant) => ({
    path: `${brand}/${lockup}-${variant}-v2.${format}`,
    lockup, variant, format,
    source: variant === "color" ? source : "derived-from-color-svg",
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const results: any[] = [];
  for (const brand of BRANDS) {
    const { data: row, error: rerr } = await sb
      .from("global_client_logos").select("id, name, files")
      .ilike("name", brand.name).maybeSingle();
    if (rerr || !row) { results.push({ name: brand.name, error: rerr?.message || "not found" }); continue; }
    const newFiles: any[] = [];
    for (const up of brand.uploads) {
      const { data: signed, error: serr } = await sb.storage.from("global-logos")
        .createSignedUrl(up.path, 60 * 60 * 24 * 365 * 10);
      if (serr || !signed) { results.push({ name: brand.name, error: `sign ${up.path}: ${serr?.message}` }); continue; }
      newFiles.push({ lockup: up.lockup, variant: up.variant, format: up.format, source: up.source, url: signed.signedUrl });
    }
    const existing: any[] = Array.isArray(row.files) ? row.files : [];
    const replacing = new Set(newFiles.map((f) => `${f.lockup}:${f.variant}`));
    const kept = existing.filter((f) => !replacing.has(`${f.lockup}:${f.variant}`));
    const merged = [...newFiles, ...kept];
    const { error: uerr } = await sb.from("global_client_logos").update({ files: merged }).eq("id", row.id);
    results.push({ name: brand.name, updated: !uerr, error: uerr?.message, fileCount: merged.length });
  }
  return new Response(JSON.stringify({ results }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
});
