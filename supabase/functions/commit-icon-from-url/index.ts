// Commit icon assets from a list of {name, iconUrl}: downloads, generates
// monochrome black/white variants, uploads all to global-logos, and updates
// global_client_logos.files. Service-role; no user session required.
//
// POST { items: [{ name: string, iconUrl: string }], lockup?: "icon"|"wordmark" }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function extFromCT(ct: string|null, fb="png") {
  if (!ct) return fb;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg")||ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  return fb;
}

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}
function monoSvg(s: string, color: string) {
  s = sanitizeSvg(s);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  const style = `<style>*{fill:${color}!important;color:${color}!important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function monoRaster(bytes: Uint8Array, color: "black"|"white"): Promise<Uint8Array> {
  const img = await Image.decode(bytes);
  // detect mostly-opaque: use luminance to silhouette; else use alpha
  let opaque=0, sampled=0;
  for (let y=0;y<img.height;y+=4) for (let x=0;x<img.width;x+=4) { sampled++; if ((img.getPixelAt(x+1,y+1)&0xff)>250) opaque++; }
  const useLum = (opaque/sampled) > 0.95;
  const c = color==="black"?0:255;
  for (let y=0;y<img.height;y++) for (let x=0;x<img.width;x++) {
    const px = img.getPixelAt(x+1,y+1);
    const pr=(px>>24)&0xff, pg=(px>>16)&0xff, pb=(px>>8)&0xff, pa=px&0xff;
    const a = useLum ? Math.max(0, Math.min(255, Math.round(255-(0.299*pr+0.587*pg+0.114*pb)))) : pa;
    img.setPixelAt(x+1,y+1, ((c<<24)|(c<<16)|(c<<8)|a) >>> 0);
  }
  return await img.encode();
}

async function uploadSign(sb: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await sb.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const items = (body.items ?? []) as Array<{ name: string; iconUrl: string }>;
    const lockup = (body.lockup ?? "icon") as "icon"|"wordmark";
    if (!items.length) throw new Error("no items");
    const results: any[] = [];
    for (const it of items) {
      try {
        const { data: row, error: rErr } = await sb.from("global_client_logos")
          .select("id, files").eq("name", it.name).maybeSingle();
        if (rErr) throw rErr;
        if (!row) throw new Error("brand not found");
        const files: any[] = Array.isArray(row.files) ? [...row.files] : [];

        const res = await fetch(it.iconUrl, { headers:{ "User-Agent":"LovableLogoBot/1.0" }, redirect:"follow" });
        if (!res.ok) throw new Error(`download ${res.status}`);
        const ct = res.headers.get("content-type");
        const ext = extFromCT(ct, "png");
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length < 400) throw new Error(`tiny ${bytes.length}`);

        const ts = Date.now();
        const slug = slugify(it.name);
        const newEntries: any[] = [];

        if (ext === "svg") {
          const txt = new TextDecoder().decode(bytes);
          const writes: Array<["color"|"black"|"white", string]> = [
            ["color", txt],
            ["black", monoSvg(txt, "#000000")],
            ["white", monoSvg(txt, "#ffffff")],
          ];
          for (const [variant, s] of writes) {
            const url = await uploadSign(sb, `${slug}/${lockup}-${variant}-${ts}.svg`,
              new TextEncoder().encode(s), "image/svg+xml");
            newEntries.push({ url, format:"svg", lockup, variant, source:"commit-icon-from-url" });
          }
        } else {
          // color: original
          const cUrl = await uploadSign(sb, `${slug}/${lockup}-color-${ts}.${ext}`, bytes, ct ?? `image/${ext}`);
          newEntries.push({ url: cUrl, format: ext, lockup, variant:"color", source:"commit-icon-from-url" });
          // raster mono variants
          const blk = await monoRaster(bytes, "black");
          const wht = await monoRaster(bytes, "white");
          const bUrl = await uploadSign(sb, `${slug}/${lockup}-black-${ts}.png`, blk, "image/png");
          const wUrl = await uploadSign(sb, `${slug}/${lockup}-white-${ts}.png`, wht, "image/png");
          newEntries.push({ url: bUrl, format:"png", lockup, variant:"black", source:"commit-icon-from-url" });
          newEntries.push({ url: wUrl, format:"png", lockup, variant:"white", source:"commit-icon-from-url" });
        }

        const kept = files.filter((f: any) => f?.lockup !== lockup);
        const merged = [...kept, ...newEntries];
        const { error: uErr } = await sb.from("global_client_logos")
          .update({ files: merged, updated_at: new Date().toISOString() }).eq("id", row.id);
        if (uErr) throw uErr;
        results.push({ name: it.name, ok: true, written: newEntries.length });
      } catch (e) {
        results.push({ name: it.name, ok: false, error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok:true, results }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
