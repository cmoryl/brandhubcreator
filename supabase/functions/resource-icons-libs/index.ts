// Re-source brand ICONS from simple-icons + wikimedia commons.
// Color variant: simple-icons SVG recolored to brand hex (or upstream color file).
// Black/white variants: same SVG monochromed.
// POST body: { names?: string[], dryRun?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Per-brand icon source. `si` = simple-icons slug, `hex` = brand color (no #),
// or `url` for a direct (typically Wikimedia Commons) SVG/PNG.
type Src = { si?: string; hex?: string; url?: string };
const SOURCES: Record<string, Src> = {
  "1440.io":              { url: "https://1440.io/favicon.svg" },
  "Amplience":            { url: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Amplience_logo.svg" },
  "Avis":                 { url: "https://upload.wikimedia.org/wikipedia/commons/0/03/Avis_logo_2012.svg" },
  "Belmond":              { url: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Belmond_logo.svg" },
  "Blackstone":           { url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/The_Blackstone_Group_logo.svg" },
  "Byner":                { url: "https://www.byner.com/favicon.svg" },
  "CNN":                  { si: "cnn", hex: "CC0000" },
  "Cathay Pacific":       { si: "cathaypacific", hex: "367878" },
  "Choice Hotels":        { url: "https://upload.wikimedia.org/wikipedia/commons/4/40/Choice_Hotels_logo.svg" },
  "Contentserv":          { url: "https://www.contentserv.com/favicon.svg" },
  "Coremedia":            { url: "https://www.coremedia.com/favicon.svg" },
  "Costa":                { url: "https://upload.wikimedia.org/wikipedia/commons/3/38/Costa_Crociere_logo.svg" },
  "Cunard":               { url: "https://upload.wikimedia.org/wikipedia/commons/9/91/Cunard_Line_logo.svg" },
  "Disney":               { url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" },
  "Holland America Line": { url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Holland_America_Line_logo.svg" },
  "Hyatt":                { url: "https://upload.wikimedia.org/wikipedia/commons/0/01/Hyatt_Logo.svg" },
  "IHG":                  { url: "https://upload.wikimedia.org/wikipedia/commons/9/97/InterContinental_Hotels_Group_logo.svg" },
  "Iberostar":            { url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Iberostar_logo.svg" },
  "Knak":                 { url: "https://www.knak.com/favicon.svg" },
  "LG":                   { si: "lg", hex: "A50034" },
  "Magnolia":             { url: "https://www.magnolia-cms.com/favicon.svg" },
  "Marina Bay Sands":     { url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Marina_Bay_Sands_logo.svg" },
  "Mastercard":           { si: "mastercard", hex: "EB001B" },
  "Optimizely Episerver": { url: "https://www.optimizely.com/favicon.svg" },
  "Peacock":              { url: "https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg" },
  "Reddit":               { si: "reddit", hex: "FF4500" },
  "Service now":          { url: "https://upload.wikimedia.org/wikipedia/commons/5/57/ServiceNow_logo.svg" },
  "SoundCloud":           { si: "soundcloud", hex: "FF5500" },
  "The New York Times":   { url: "https://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.svg" },
  "Veeva":                { url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Veeva_Systems_logo.svg" },
  "Visit Estonia":        { url: "https://www.visitestonia.com/favicon.svg" },
  "YouTube":              { si: "youtube", hex: "FF0000" },
  "Zendesk":              { si: "zendesk", hex: "03363D" },
};

async function dl(url: string): Promise<{ bytes: Uint8Array; ct: string | null }> {
  const res = await fetch(url, { headers: { "User-Agent": "LovableLogoBot/1.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 100) throw new Error(`tiny ${bytes.length}`);
  return { bytes, ct: res.headers.get("content-type") };
}

function extFromCT(ct: string | null, url: string): string {
  if (ct?.includes("svg") || url.endsWith(".svg")) return "svg";
  if (ct?.includes("png") || url.endsWith(".png")) return "png";
  if (ct?.includes("jpeg") || ct?.includes("jpg")) return "jpg";
  return "svg";
}

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
          .replace(/\son\w+=["'][^"']*["']/gi, "");
}

function recolorSvg(svgText: string, color: string) {
  let s = sanitizeSvg(svgText);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  const style = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: any[] },
  src: Src,
  dryRun: boolean,
) {
  const actions: string[] = [];
  const slug = slugify(row.name);
  const files: any[] = Array.isArray(row.files) ? [...row.files] : [];
  const ts = Date.now();

  // Source URL: simple-icons CDN or direct URL
  const srcUrl = src.url
    ?? (src.si ? `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${src.si}.svg` : null);
  if (!srcUrl) throw new Error("no source");

  const { bytes, ct } = await dl(srcUrl);
  const ext = extFromCT(ct, srcUrl);

  const upsert = (e: any) => {
    const i = files.findIndex(f => f?.lockup === "icon" && f?.variant === e.variant);
    if (i >= 0) files[i] = e; else files.push(e);
  };

  if (ext === "svg") {
    const txt = new TextDecoder().decode(bytes);
    const colorHex = src.hex ? `#${src.hex}` : null;
    // If we have brand hex (simple-icons path), recolor; otherwise keep as-is.
    const colorSvg = colorHex ? recolorSvg(txt, colorHex) : sanitizeSvg(txt);
    const blackSvg = recolorSvg(txt, "#000000");
    const whiteSvg = recolorSvg(txt, "#ffffff");
    if (!dryRun) {
      const cUrl = await uploadSign(supabase, `${slug}/icon-color-${ts}.svg`, new TextEncoder().encode(colorSvg), "image/svg+xml");
      const bUrl = await uploadSign(supabase, `${slug}/icon-black-${ts}.svg`, new TextEncoder().encode(blackSvg), "image/svg+xml");
      const wUrl = await uploadSign(supabase, `${slug}/icon-white-${ts}.svg`, new TextEncoder().encode(whiteSvg), "image/svg+xml");
      upsert({ url: cUrl, format: "svg", lockup: "icon", variant: "color", source: src.si ? "simple-icons" : "wikimedia" });
      upsert({ url: bUrl, format: "svg", lockup: "icon", variant: "black", source: src.si ? "simple-icons" : "wikimedia" });
      upsert({ url: wUrl, format: "svg", lockup: "icon", variant: "white", source: src.si ? "simple-icons" : "wikimedia" });
    }
    actions.push(`wrote svg color/black/white from ${src.si ?? srcUrl}`);
  } else {
    // PNG/raster — store as-is for color, skip B/W (already 2048 on these brands).
    if (!dryRun) {
      const cUrl = await uploadSign(supabase, `${slug}/icon-color-${ts}.${ext}`, bytes, ct ?? `image/${ext}`);
      upsert({ url: cUrl, format: ext, lockup: "icon", variant: "color", source: "wikimedia-raster" });
    }
    actions.push(`wrote ${ext} color from ${srcUrl}`);
  }

  if (!dryRun) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) throw new Error(`db: ${error.message}`);
  }
  return { name: row.name, actions, src: srcUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({} as any));
    const requested: string[] = Array.isArray(body.names) && body.names.length ? body.names : Object.keys(SOURCES);
    const dryRun = body.dryRun === true;

    const { data, error } = await supabase.from("global_client_logos").select("id, name, files").in("name", requested);
    if (error) throw error;

    const results: any[] = [];
    for (const r of (data ?? [])) {
      const src = SOURCES[(r as any).name];
      if (!src) { results.push({ name: (r as any).name, skipped: "no source mapping" }); continue; }
      try { results.push(await processOne(supabase, r as any, src, dryRun)); }
      catch (e) { results.push({ name: (r as any).name, error: (e as Error).message }); }
    }
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
