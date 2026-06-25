// Re-source brand ICONS from simple-icons + Wikimedia Commons (with File: resolver).
// POST body: { names?: string[], dryRun?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const UA = "LovableLogoBot/1.0 (https://lovable.dev)";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Per-brand: `si` simple-icons slug, `hex` brand color (no #),
// `wmFile` Wikimedia Commons file name (without "File:" prefix), `url` direct URL.
type Src = { si?: string; hex?: string; wmFile?: string; url?: string };
const SOURCES: Record<string, Src> = {
  // simple-icons covered
  "CNN":            { si: "cnn",            hex: "CC0000" },
  "LG":             { si: "lg",             hex: "A50034" },
  "Mastercard":     { si: "mastercard",     hex: "EB001B" },
  "Reddit":         { si: "reddit",         hex: "FF4500" },
  "SoundCloud":     { si: "soundcloud",     hex: "FF5500" },
  "YouTube":        { si: "youtube",        hex: "FF0000" },
  "Zendesk":        { si: "zendesk",        hex: "03363D" },

  // Wikimedia Commons (verified file names)
  "Disney":               { wmFile: "Disney+_logo.svg" },
  "Choice Hotels":        { wmFile: "Choice Hotels logo.svg" },
  "Marina Bay Sands":     { wmFile: "Marina Bay Sands logo.svg" },
  "Costa":                { wmFile: "Costa-logo-2021.svg" },
  "Magnolia":             { wmFile: "Magnolia (CMS) logo.svg" },
  "Veeva":                { wmFile: "Veeva Systems logo.svg" },
  "Service now":          { wmFile: "ServiceNow logo.svg" },

  // Resolve via Commons search (function will pick best match)
  "Belmond":              { wmFile: "@search:Belmond logo" },
  "Avis":                 { wmFile: "@search:Avis Budget Group logo" },
  "Blackstone":           { wmFile: "@search:Blackstone Inc logo" },
  "The New York Times":   { wmFile: "@search:The New York Times Company logo" },
  "Cathay Pacific":       { wmFile: "@search:Cathay Pacific logo" },
  "Hyatt":                { wmFile: "@search:Hyatt Hotels Corporation logo" },
  "IHG":                  { wmFile: "@search:InterContinental Hotels Group logo" },
  "Iberostar":            { wmFile: "@search:Iberostar Hotels logo" },
  "Holland America Line": { wmFile: "@search:Holland America Line logo" },
  "Cunard":               { wmFile: "@search:Cunard Line logo" },
  "Peacock":              { wmFile: "@search:Peacock streaming service logo" },
  "Optimizely Episerver": { wmFile: "@search:Optimizely logo" },
  "Coremedia":            { wmFile: "@search:CoreMedia logo" },
  "Amplience":            { wmFile: "@search:Amplience logo" },

  // Life Sciences (Wikimedia Commons)
  "Bayer":                              { wmFile: "Logo_Bayer.svg" },
  "Boehringer Ingelheim":               { wmFile: "Boehringer Ingelheim Logo.svg" },
  "Bristol-Myers Squibb":               { wmFile: "Bristol-Myers Squibb logo.svg" },
  "Daiichi Sankyo":                     { wmFile: "@search:Daiichi Sankyo logo" },
  "Merck":                              { wmFile: "Merck & Co.svg" },
  "Novartis":                           { wmFile: "Novartis-Logo.svg" },
  "Novo Nordisk":                       { wmFile: "Logo Novo Norkisk.png" },
  "Gedeon Richter":                     { wmFile: "@search:Gedeon Richter logo" },
  "Smith & Nephew":                     { wmFile: "@search:Smith Nephew logo" },
  "Karyopharm Therapeutics":            { wmFile: "@search:Karyopharm Therapeutics logo" },
  "Clinipace":                          { url: "" },
  "CTI Clinical Trial and Consulting":  { url: "" },
  "SCOPE International":                { url: "" },

  // No reliable public source — flagged for manual upload
  "1440.io":        { url: "" },
  "Byner":          { url: "" },
  "Knak":           { url: "" },
  "Contentserv":    { url: "" },
  "Visit Estonia":  { url: "" },
};

async function commonsResolve(fileOrQuery: string): Promise<string> {
  let title = fileOrQuery;
  if (fileOrQuery.startsWith("@search:")) {
    const q = fileOrQuery.slice(8);
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=5&srsearch=${encodeURIComponent(q)}`;
    const r = await fetch(u, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
    if (!r.ok) throw new Error(`search ${r.status}`);
    const j = await r.json();
    const hits: any[] = j?.query?.search ?? [];
    // Prefer svg, then png
    const svg = hits.find(h => /\.svg$/i.test(h.title));
    const png = hits.find(h => /\.png$/i.test(h.title));
    const pick = svg ?? png ?? hits[0];
    if (!pick) throw new Error(`search no hits: ${q}`);
    title = pick.title;
  } else if (!title.startsWith("File:")) {
    title = "File:" + title;
  }
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size&titles=${encodeURIComponent(title)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
  if (!r.ok) throw new Error(`imageinfo ${r.status}`);
  const j = await r.json();
  const pages: any = j?.query?.pages ?? {};
  const page: any = Object.values(pages)[0];
  const ii = page?.imageinfo?.[0];
  if (!ii?.url) throw new Error(`no url for ${title}`);
  return ii.url as string;
}

async function dl(url: string): Promise<{ bytes: Uint8Array; ct: string | null }> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 100) throw new Error(`tiny ${bytes.length}`);
  return { bytes, ct: res.headers.get("content-type") };
}

const extFromCT = (ct: string | null, url: string) =>
  (ct?.includes("svg") || url.endsWith(".svg")) ? "svg"
  : (ct?.includes("png") || url.endsWith(".png")) ? "png"
  : (ct?.includes("jpeg") || ct?.includes("jpg") || /\.jpe?g$/i.test(url)) ? "jpg" : "svg";

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
  const slug = slugify(row.name);
  const files: any[] = Array.isArray(row.files) ? [...row.files] : [];
  const ts = Date.now();

  let srcUrl: string | null = null;
  let provenance = "";
  if (src.si) {
    srcUrl = `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${src.si}.svg`;
    provenance = "simple-icons";
  } else if (src.wmFile) {
    srcUrl = await commonsResolve(src.wmFile);
    provenance = "wikimedia";
  } else if (src.url) {
    srcUrl = src.url;
    provenance = "direct";
  }
  if (!srcUrl) return { name: row.name, skipped: "no public source — needs manual upload" };

  const { bytes, ct } = await dl(srcUrl);
  const ext = extFromCT(ct, srcUrl);

  const upsert = (e: any) => {
    const i = files.findIndex(f => f?.lockup === "icon" && f?.variant === e.variant);
    if (i >= 0) files[i] = e; else files.push(e);
  };

  if (ext === "svg") {
    const txt = new TextDecoder().decode(bytes);
    const colorHex = src.hex ? `#${src.hex}` : null;
    const colorSvg = colorHex ? recolorSvg(txt, colorHex) : sanitizeSvg(txt);
    const blackSvg = recolorSvg(txt, "#000000");
    const whiteSvg = recolorSvg(txt, "#ffffff");
    if (!dryRun) {
      const cUrl = await uploadSign(supabase, `${slug}/icon-color-${ts}.svg`, new TextEncoder().encode(colorSvg), "image/svg+xml");
      const bUrl = await uploadSign(supabase, `${slug}/icon-black-${ts}.svg`, new TextEncoder().encode(blackSvg), "image/svg+xml");
      const wUrl = await uploadSign(supabase, `${slug}/icon-white-${ts}.svg`, new TextEncoder().encode(whiteSvg), "image/svg+xml");
      upsert({ url: cUrl, format: "svg", lockup: "icon", variant: "color", source: provenance });
      upsert({ url: bUrl, format: "svg", lockup: "icon", variant: "black", source: provenance });
      upsert({ url: wUrl, format: "svg", lockup: "icon", variant: "white", source: provenance });
    }
  } else {
    if (!dryRun) {
      const cUrl = await uploadSign(supabase, `${slug}/icon-color-${ts}.${ext}`, bytes, ct ?? `image/${ext}`);
      upsert({ url: cUrl, format: ext, lockup: "icon", variant: "color", source: provenance + "-raster" });
    }
  }

  if (!dryRun) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) throw new Error(`db: ${error.message}`);
  }
  return { name: row.name, src: srcUrl, provenance, ext };
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
      await sleep(1200); // be gentle on Wikimedia
    }
    return new Response(JSON.stringify({ ok: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
