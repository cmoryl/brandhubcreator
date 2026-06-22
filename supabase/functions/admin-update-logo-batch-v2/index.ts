import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const BRANDS: Array<{
  name: string;
  appendIcons?: boolean;
  uploads: Array<{ path: string; lockup: string; variant: string; format: string; source: string }>;
}> = [
  {
    name: "Iberostar",
    uploads: [
      { path: "iberostar/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "worldvectorlogo:iberostar" },
      { path: "iberostar/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "derived-from-color-svg" },
      { path: "iberostar/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "derived-from-color-svg" },
    ],
  },
  {
    name: "Nike",
    uploads: [
      { path: "nike/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "composed:swoosh+nike-text" },
      { path: "nike/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "composed:swoosh+nike-text" },
      { path: "nike/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "composed:swoosh+nike-text" },
    ],
  },
  {
    name: "Pepsi",
    uploads: [
      { path: "pepsi/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "worldvectorlogo:pepsi" },
      { path: "pepsi/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "derived-from-color-svg" },
      { path: "pepsi/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "derived-from-color-svg" },
    ],
  },
  {
    name: "Adidas",
    uploads: [
      { path: "adidas/wordmark-color-v3.svg", lockup: "wordmark", variant: "color", format: "svg", source: "worldvectorlogo:adidas-2" },
      { path: "adidas/wordmark-black-v3.svg", lockup: "wordmark", variant: "black", format: "svg", source: "derived-from-color-svg" },
      { path: "adidas/wordmark-white-v3.svg", lockup: "wordmark", variant: "white", format: "svg", source: "derived-from-color-svg" },
    ],
  },
  {
    name: "American Express",
    uploads: [
      { path: "amex/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "wikimedia:american-express" },
      { path: "amex/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "derived-from-color-svg" },
      { path: "amex/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "derived-from-color-svg" },
    ],
  },
  {
    name: "Apple",
    appendIcons: true,
    uploads: [
      { path: "apple/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "composed:apple-silhouette+text" },
      { path: "apple/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "composed:apple-silhouette+text" },
      { path: "apple/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "composed:apple-silhouette+text" },
    ],
  },
  {
    name: "Charles Schwab",
    uploads: [
      { path: "charles-schwab/wordmark-color-v2.svg", lockup: "wordmark", variant: "color", format: "svg", source: "worldvectorlogo:charles-schwab" },
      { path: "charles-schwab/wordmark-black-v2.svg", lockup: "wordmark", variant: "black", format: "svg", source: "derived-from-color-svg" },
      { path: "charles-schwab/wordmark-white-v2.svg", lockup: "wordmark", variant: "white", format: "svg", source: "derived-from-color-svg" },
    ],
  },
  {
    name: "Contentserv",
    uploads: [
      { path: "contentserv/wordmark-color-v2.png", lockup: "wordmark", variant: "color", format: "png", source: "official:contentserv.com" },
      { path: "contentserv/wordmark-black-v2.png", lockup: "wordmark", variant: "black", format: "png", source: "official:contentserv.com" },
      { path: "contentserv/wordmark-white-v2.png", lockup: "wordmark", variant: "white", format: "png", source: "derived-from-color-png" },
    ],
  },
  {
    name: "Eloqua",
    uploads: [
      { path: "eloqua/wordmark-color-v2.png", lockup: "wordmark", variant: "color", format: "png", source: "seeklogo:eloqua-classic" },
      { path: "eloqua/wordmark-black-v2.png", lockup: "wordmark", variant: "black", format: "png", source: "derived-from-color-png" },
      { path: "eloqua/wordmark-white-v2.png", lockup: "wordmark", variant: "white", format: "png", source: "derived-from-color-png" },
      { path: "eloqua/icon-color-v2.svg", lockup: "icon", variant: "color", format: "svg", source: "letterform:e-red" },
      { path: "eloqua/icon-black-v2.svg", lockup: "icon", variant: "black", format: "svg", source: "letterform:e-black" },
      { path: "eloqua/icon-white-v2.svg", lockup: "icon", variant: "white", format: "svg", source: "letterform:e-white" },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const results: any[] = [];
  for (const brand of BRANDS) {
    const { data: row, error: rerr } = await sb
      .from("global_client_logos")
      .select("id, name, files")
      .ilike("name", brand.name)
      .maybeSingle();
    if (rerr || !row) {
      results.push({ name: brand.name, error: rerr?.message || "not found" });
      continue;
    }
    const newFiles: any[] = [];
    for (const up of brand.uploads) {
      const { data: signed, error: serr } = await sb.storage
        .from("global-logos")
        .createSignedUrl(up.path, 60 * 60 * 24 * 365 * 10);
      if (serr || !signed) {
        results.push({ name: brand.name, error: `sign ${up.path}: ${serr?.message}` });
        continue;
      }
      newFiles.push({
        lockup: up.lockup,
        variant: up.variant,
        format: up.format,
        source: up.source,
        url: signed.signedUrl,
      });
    }
    const existing: any[] = Array.isArray(row.files) ? row.files : [];
    // Build set of (lockup,variant) tuples we're replacing
    const replacing = new Set(newFiles.map((f) => `${f.lockup}:${f.variant}`));
    // Keep entries that aren't being replaced UNLESS appendIcons=false and we're replacing icon
    const kept = existing.filter((f) => !replacing.has(`${f.lockup}:${f.variant}`));
    const merged = [...newFiles, ...kept];
    const { error: uerr } = await sb
      .from("global_client_logos")
      .update({ files: merged })
      .eq("id", row.id);
    results.push({ name: brand.name, updated: !uerr, error: uerr?.message, fileCount: merged.length });
  }
  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
