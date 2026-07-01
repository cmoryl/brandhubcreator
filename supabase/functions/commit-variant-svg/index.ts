// Commit a user-provided SVG for a specific brand + lockup + variant slot.
// Uploads the SVG, rasterizes it to a 2048px PNG, and replaces the matching
// (lockup, variant) svg + png entries in global_client_logos.files.
//
// POST body: { items: [{ name, lockup: "wordmark"|"icon", variant: "color"|"black"|"white", svgBase64 }] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const TARGET_W = 2048;

let wasmReady = false;
async function ensureWasm() {
  if (wasmReady) return;
  const wasm = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm").then(r => r.arrayBuffer());
  await initWasm(wasm);
  wasmReady = true;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/\son\w+=["'][^"']*["']/gi, "");
}

async function rasterize(svgText: string): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svgText, { fitTo: { mode: "width", value: TARGET_W }, background: "rgba(0,0,0,0)" });
  return resvg.render().asPng();
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const items = (body.items ?? []) as Array<{ name: string; lockup: "wordmark"|"icon"; variant: "color"|"black"|"white"; svgBase64: string }>;
    if (!items.length) throw new Error("no items");

    const results: any[] = [];
    for (const item of items) {
      try {
        const svgText = sanitizeSvg(new TextDecoder().decode(Uint8Array.from(atob(item.svgBase64), c => c.charCodeAt(0))));
        const slug = slugify(item.name);

        const { data: rows, error: rErr } = await supabase
          .from("global_client_logos").select("id, files").eq("name", item.name);
        if (rErr) throw rErr;
        if (!rows || rows.length === 0) throw new Error(`brand not found: ${item.name}`);
        for (const row of rows) {
        const files: any[] = Array.isArray(row.files) ? [...row.files] : [];

        const png = await rasterize(svgText);
        const ts = Date.now();
        const enc = new TextEncoder();

        const svgPath = `${slug}/${item.lockup}-${item.variant}-${ts}.svg`;
        const pngPath = `${slug}/${item.lockup}-${item.variant}-${ts}.png`;
        const svgUrl = await uploadSign(supabase, svgPath, enc.encode(svgText), "image/svg+xml");
        const pngUrl = await uploadSign(supabase, pngPath, png, "image/png");

        const kept = files.filter((f: any) => !(f?.lockup === item.lockup && f?.variant === item.variant));
        const merged = [
          ...kept,
          { url: svgUrl, format: "svg", lockup: item.lockup, variant: item.variant, source: "dropbox-manual" },
          { url: pngUrl, format: "png", lockup: item.lockup, variant: item.variant, source: "dropbox-manual" },
        ];

        const { error: uErr } = await supabase.from("global_client_logos")
          .update({ files: merged, updated_at: new Date().toISOString() }).eq("id", row.id);
        if (uErr) throw uErr;

        results.push({ name: item.name, lockup: item.lockup, variant: item.variant, ok: true });
      } catch (e) {
        results.push({ name: item.name, lockup: item.lockup, variant: item.variant, ok: false, error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
