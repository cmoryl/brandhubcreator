// Hard search via Firecrawl to find authentic brand logos and generate proper
// monochrome black/white variants. Targets brands whose current B/W are
// favicon-based or non-genuine wikimedia PNGs.
//
// Workflow per brand:
//  1. Firecrawl scrape `website_url` with formats=["branding"] → pick best logo
//     (prefer SVG, then PNG; prefer transparent).
//  2. If SVG → derive true monochrome black/white SVGs.
//     If raster → render high-res (2048w) monochrome PNGs via imagescript.
//  3. Upload to global-logos bucket and replace weak B/W entries (and color
//     when current color is favicon-quality).
//
// POST body: { names?: string[], dryRun?: boolean, lockup?: "icon"|"wordmark"|"both" }
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

function extFromCT(ct: string|null, fb="png") {
  if (!ct) return fb;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg")||ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  return fb;
}

async function dl(url: string): Promise<{bytes: Uint8Array, ct: string|null}> {
  const res = await fetch(url, { headers:{ "User-Agent":"LovableLogoBot/1.0" }, redirect:"follow" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 200) throw new Error(`tiny ${bytes.length}`);
  return { bytes, ct: res.headers.get("content-type") };
}

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}

function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  const style = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function monoPng(srcBytes: Uint8Array, color: "black"|"white"): Promise<Uint8Array> {
  let img = await Image.decode(srcBytes);
  if (img.width < TARGET_W) {
    const scale = TARGET_W / img.width;
    img = img.resize(TARGET_W, Math.round(img.height * scale));
  }
  let opaque = 0, sampled = 0;
  for (let y = 0; y < img.height; y += 4)
    for (let x = 0; x < img.width; x += 4) {
      sampled++;
      if ((img.getPixelAt(x+1, y+1) & 0xff) > 250) opaque++;
    }
  const useLum = (opaque / sampled) > 0.95;
  const c = color === "black" ? 0 : 255;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const px = img.getPixelAt(x+1, y+1);
      const pr=(px>>24)&0xff, pg=(px>>16)&0xff, pb=(px>>8)&0xff, pa=px&0xff;
      const alpha = useLum
        ? Math.max(0, Math.min(255, Math.round(255 - (0.299*pr + 0.587*pg + 0.114*pb))))
        : pa;
      img.setPixelAt(x+1, y+1, ((c<<24)|(c<<16)|(c<<8)|alpha) >>> 0);
    }
  return await img.encode();
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

interface FCBranding {
  logo?: string; symbol?: string; icon?: string;
  images?: { logo?: string; symbol?: string; icon?: string; ogImage?: string };
}

async function firecrawlBranding(url: string, key: string): Promise<FCBranding> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify({ url, formats:["branding"], onlyMainContent:false }),
  });
  const j = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`firecrawl ${res.status}`);
  return (j?.data?.branding ?? j?.branding ?? {}) as FCBranding;
}

function pickAssets(b: FCBranding): { wordmark?: string; icon?: string } {
  const out: { wordmark?: string; icon?: string } = {};
  out.wordmark = b.logo || b.images?.logo || undefined;
  out.icon = b.symbol || b.icon || b.images?.symbol || b.images?.icon || undefined;
  return out;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; website_url: string|null; files: FileEntry[] },
  firecrawlKey: string,
  lockupFilter: "icon"|"wordmark"|"both",
  dryRun: boolean,
) {
  const actions: string[] = [];
  if (!row.website_url) return { name: row.name, skipped: "no-website" };
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  let branding: FCBranding;
  try { branding = await firecrawlBranding(row.website_url, firecrawlKey); }
  catch (e) { return { name: row.name, error: `firecrawl: ${(e as Error).message}` }; }
  const picks = pickAssets(branding);

  const upsert = (e: FileEntry) => {
    const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
    if (i>=0) files[i]=e; else files.push(e);
  };

  async function handle(lockup: "wordmark"|"icon", url: string) {
    const { bytes, ct } = await dl(url);
    const ext = extFromCT(ct, "png");
    const colorPath = `${slug}/${lockup}-color.${ext}`;
    const colorUrl = dryRun ? "(dry)" : await uploadSign(supabase, colorPath, bytes, ct ?? `image/${ext}`);
    if (!dryRun) upsert({ url: colorUrl, format: ext, lockup, variant: "color", source: "firecrawl-hard" });
    actions.push(`wrote:${lockup}-color.${ext}`);
    if (ext === "svg") {
      const txt = new TextDecoder().decode(bytes);
      const blackBytes = new TextEncoder().encode(monoSvg(txt, "#000000"));
      const whiteBytes = new TextEncoder().encode(monoSvg(txt, "#ffffff"));
      if (!dryRun) {
        const bUrl = await uploadSign(supabase, `${slug}/${lockup}-black.svg`, blackBytes, "image/svg+xml");
        const wUrl = await uploadSign(supabase, `${slug}/${lockup}-white.svg`, whiteBytes, "image/svg+xml");
        upsert({ url: bUrl, format:"svg", lockup, variant:"black", source:"firecrawl-hard" });
        upsert({ url: wUrl, format:"svg", lockup, variant:"white", source:"firecrawl-hard" });
      }
      actions.push(`wrote:${lockup}-black/white.svg`);
    } else {
      const blackPng = await monoPng(bytes, "black");
      const whitePng = await monoPng(bytes, "white");
      if (!dryRun) {
        const bUrl = await uploadSign(supabase, `${slug}/${lockup}-black-mono.png`, blackPng, "image/png");
        const wUrl = await uploadSign(supabase, `${slug}/${lockup}-white-mono.png`, whitePng, "image/png");
        upsert({ url: bUrl, format:"png", lockup, variant:"black", source:"firecrawl-hard-mono" });
        upsert({ url: wUrl, format:"png", lockup, variant:"white", source:"firecrawl-hard-mono" });
      }
      actions.push(`wrote:${lockup}-black/white-mono.png (${Math.round(blackPng.length/1024)}KB)`);
    }
  }

  if ((lockupFilter==="both"||lockupFilter==="wordmark") && picks.wordmark) {
    try { await handle("wordmark", picks.wordmark); }
    catch (e) { actions.push(`wordmark-error: ${(e as Error).message}`); }
  }
  if ((lockupFilter==="both"||lockupFilter==="icon") && picks.icon) {
    try { await handle("icon", picks.icon); }
    catch (e) { actions.push(`icon-error: ${(e as Error).message}`); }
  }

  if (!dryRun && actions.some(a => a.startsWith("wrote:"))) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, actions, error: error.message };
  }
  return { name: row.name, actions, picks };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY missing");
    const body = await req.json().catch(()=>({} as any));
    const names: string[]|null = Array.isArray(body.names) && body.names.length ? body.names : null;
    const dryRun = body.dryRun === true;
    const lockup = (body.lockup ?? "both") as "icon"|"wordmark"|"both";

    let q = supabase.from("global_client_logos").select("id, name, website_url, files").order("name");
    if (names) q = q.in("name", names);
    const { data, error } = await q;
    if (error) throw error;
    const results: any[] = [];
    // Sequential to be gentle on Firecrawl + edge memory
    for (const r of (data ?? [])) {
      try { results.push(await processOne(supabase, r as any, firecrawlKey, lockup, dryRun)); }
      catch (e) { results.push({ name:(r as any).name, error:(e as Error).message }); }
    }
    return new Response(JSON.stringify({ ok:true, processed: results.length, results }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
