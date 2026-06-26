// Commit a pre-built color SVG for a brand: derives black/white SVG variants,
// rasterizes all three to high-res PNGs, uploads to global-logos bucket, and
// updates the global_client_logos.files JSONB (replacing existing matching
// lockup/variant entries).
//
// POST body: { items: [{ name: string, lockup: "wordmark"|"icon", svgBase64: string }] }
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

function monoSvg(svgText: string, color: "#000000" | "#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  const style = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
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
    const items = (body.items ?? []) as Array<{ name: string; lockup: "wordmark" | "icon"; svgBase64: string }>;
    if (!items.length) throw new Error("no items");

    const results: any[] = [];
    for (const item of items) {
      try {
        const svgText = new TextDecoder().decode(Uint8Array.from(atob(item.svgBase64), c => c.charCodeAt(0)));
        const slug = slugify(item.name);

        const { data: row, error: rErr } = await supabase
          .from("global_client_logos").select("id, files").eq("name", item.name).maybeSingle();
        if (rErr) throw rErr;
        if (!row) throw new Error(`brand not found: ${item.name}`);
        const files: any[] = Array.isArray(row.files) ? [...row.files] : [];

        const colorSvg = svgText;
        const blackSvg = monoSvg(svgText, "#000000");
        const whiteSvg = monoSvg(svgText, "#ffffff");

        const colorPng = await rasterize(colorSvg);
        const blackPng = await rasterize(blackSvg);
        const whitePng = await rasterize(whiteSvg);

        const ts = Date.now();
        const enc = new TextEncoder();
        const writes: Array<[string, "wordmark"|"icon", "color"|"black"|"white", "svg"|"png", Uint8Array, string]> = [
          [`${slug}/${item.lockup}-color-${ts}.svg`, item.lockup, "color", "svg", enc.encode(colorSvg), "image/svg+xml"],
          [`${slug}/${item.lockup}-black-${ts}.svg`, item.lockup, "black", "svg", enc.encode(blackSvg), "image/svg+xml"],
          [`${slug}/${item.lockup}-white-${ts}.svg`, item.lockup, "white", "svg", enc.encode(whiteSvg), "image/svg+xml"],
          [`${slug}/${item.lockup}-color-${ts}.png`, item.lockup, "color", "png", colorPng, "image/png"],
          [`${slug}/${item.lockup}-black-${ts}.png`, item.lockup, "black", "png", blackPng, "image/png"],
          [`${slug}/${item.lockup}-white-${ts}.png`, item.lockup, "white", "png", whitePng, "image/png"],
        ];

        const newEntries: any[] = [];
        for (const [path, lockup, variant, fmt, bytes, ct] of writes) {
          const url = await uploadSign(supabase, path, bytes, ct);
          newEntries.push({ url, format: fmt, lockup, variant, source: "manual-svg-commit" });
        }

        // Remove old entries for this lockup (color/black/white)
        const kept = files.filter((f: any) => f?.lockup !== item.lockup);
        const merged = [...kept, ...newEntries];

        const { error: uErr } = await supabase.from("global_client_logos")
          .update({ files: merged, updated_at: new Date().toISOString() }).eq("id", row.id);
        if (uErr) throw uErr;

        results.push({ name: item.name, ok: true, written: newEntries.length });
      } catch (e) {
        results.push({ name: item.name, ok: false, error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
