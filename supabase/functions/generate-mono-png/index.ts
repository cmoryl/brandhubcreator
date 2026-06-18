// Generate high-resolution monochrome PNG black/white wordmark variants for
// brands that have only a color raster wordmark and no genuine SVG B/W.
// Uses imagescript (pure TS) — no native canvas needed.
//
// POST body: { names?: string[], dryRun?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;
const TARGET_W = 2048;

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function downloadBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { headers:{ "User-Agent":"LovableMono/1.0" }, redirect:"follow" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function uploadAndSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

// Generate monochrome PNG: derive alpha mask from existing alpha (transparent
// logos) or from inverted luminance (opaque/JPG logos). Paint with target color.
async function monoPng(srcBytes: Uint8Array, color: "black"|"white"): Promise<Uint8Array> {
  let img = await Image.decode(srcBytes);
  if (img.width < TARGET_W) {
    const scale = TARGET_W / img.width;
    img = img.resize(TARGET_W, Math.round(img.height * scale));
  }
  // Sample alpha: if >95% pixels are opaque, treat as no-alpha → use luminance.
  const total = img.width * img.height;
  let opaque = 0;
  for (let y = 0; y < img.height; y += 4) {
    for (let x = 0; x < img.width; x += 4) {
      const px = img.getPixelAt(x + 1, y + 1);
      if ((px & 0xff) > 250) opaque++;
    }
  }
  const sampled = Math.ceil(img.height/4) * Math.ceil(img.width/4);
  const useLuminance = (opaque / sampled) > 0.95;

  const r = color === "black" ? 0 : 255;
  const g = r, b = r;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const px = img.getPixelAt(x + 1, y + 1);
      const pr = (px >> 24) & 0xff;
      const pg = (px >> 16) & 0xff;
      const pb = (px >> 8) & 0xff;
      const pa = px & 0xff;
      let alpha: number;
      if (useLuminance) {
        const lum = 0.299*pr + 0.587*pg + 0.114*pb;
        alpha = Math.max(0, Math.min(255, Math.round(255 - lum)));
      } else {
        alpha = pa;
      }
      img.setPixelAt(x + 1, y + 1, ((r<<24)|(g<<16)|(b<<8)|alpha) >>> 0);
    }
  }
  return await img.encode();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const dryRun = body.dryRun === true;
    let q = supabase.from("global_client_logos").select("id, name, files").order("name");
    if (Array.isArray(body.names) && body.names.length) q = q.in("name", body.names);
    const { data, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    for (const row of (data ?? [])) {
      const r = row as any;
      const files: FileEntry[] = Array.isArray(r.files) ? [...r.files] : [];
      const actions: string[] = [];
      const slug = slugify(r.name);
      const word = (v: string) => files.find(f => f?.lockup==="wordmark" && f?.variant===v);
      const color = word("color");
      if (!color) { results.push({name:r.name, skipped:"no-color-wordmark"}); continue; }
      const black = word("black"), white = word("white");
      // Skip if both already exist as genuine non-duplicate SVG
      const isReal = (e?: FileEntry) => e && e.format==="svg" && e.url !== color.url;
      if (isReal(black) && isReal(white)) { results.push({name:r.name, skipped:"already-svg-mono"}); continue; }
      // Need PNG fallback when missing or duplicates color
      const needs: ("black"|"white")[] = [];
      for (const v of ["black","white"] as const) {
        const e = word(v);
        if (!e || e.url === color.url) needs.push(v);
      }
      if (!needs.length) { results.push({name:r.name, skipped:"present"}); continue; }
      try {
        const src = await downloadBytes(color.url);
        for (const v of needs) {
          const png = await monoPng(src, v);
          if (dryRun) { actions.push(`would-write:wordmark-${v}-mono.png (${Math.round(png.length/1024)}KB)`); continue; }
          const url = await uploadAndSign(supabase, `${slug}/wordmark-${v}-mono.png`, png, "image/png");
          const idx = files.findIndex(f => f?.lockup==="wordmark" && f?.variant===v);
          const entry: FileEntry = { url, format:"png", lockup:"wordmark", variant:v, source:"mono-fallback" };
          if (idx >= 0) files[idx] = entry; else files.push(entry);
          actions.push(`wrote:wordmark-${v}-mono.png (${Math.round(png.length/1024)}KB)`);
        }
        if (!dryRun && actions.length) {
          const { error: uerr } = await supabase.from("global_client_logos")
            .update({ files, updated_at: new Date().toISOString() }).eq("id", r.id);
          if (uerr) throw new Error(uerr.message);
        }
        results.push({ name: r.name, actions });
      } catch (e) {
        results.push({ name: r.name, error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok:true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
