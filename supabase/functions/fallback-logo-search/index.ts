// Fallback logo fetcher: searches Wikimedia Commons (and optionally
// worldvectorlogo / seeklogo direct guesses) for brand SVG logos when the
// brand's own site refuses our user-agent or fails. Derives true monochrome
// black/white SVGs from the color SVG and uploads to global-logos bucket.
//
// POST body: { names: string[], dryRun?: boolean, lockup?: "wordmark"|"icon" }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const UA = "LovableLogoBot/1.0 (https://lovable.dev; contact: support@lovable.dev)";

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}

function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  // strip gradient defs and url(#...) fills/strokes to ensure single color
  s = s.replace(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi, "");
  s = s.replace(/url\(#[^)]+\)/gi, color);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi,"");
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

async function commonsSearch(brand: string): Promise<string[]> {
  // Try a few query variants ordered by quality
  const queries = [
    `${brand} logo filetype:svg`,
    `${brand} wordmark filetype:svg`,
    `${brand} logo.svg`,
  ];
  const titles: string[] = [];
  for (const q of queries) {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(q)}`;
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept":"application/json" } });
    if (!r.ok) continue;
    const j: any = await r.json().catch(()=>({}));
    for (const hit of (j?.query?.search ?? [])) {
      if (typeof hit.title === "string" && hit.title.toLowerCase().endsWith(".svg")) {
        if (!titles.includes(hit.title)) titles.push(hit.title);
      }
    }
    if (titles.length) break;
  }
  return titles;
}

async function commonsFileUrl(title: string): Promise<string|null> {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size&titles=${encodeURIComponent(title)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA, "Accept":"application/json" } });
  if (!r.ok) return null;
  const j: any = await r.json().catch(()=>({}));
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    const ii = pages[k]?.imageinfo?.[0];
    if (ii?.url && (ii?.mime?.includes("svg") || ii.url.toLowerCase().endsWith(".svg"))) {
      return ii.url as string;
    }
  }
  return null;
}

function scoreTitle(title: string, brand: string): number {
  const t = title.toLowerCase();
  const b = brand.toLowerCase();
  let s = 0;
  if (t.includes(b)) s += 5;
  // prefer canonical names
  if (/logo\.svg$/.test(t)) s += 4;
  if (/wordmark/.test(t)) s += 2;
  // penalize odd variants
  if (/(old|historical|former|1[09]\d{2}|20\d{2}|alternative|variant|small|tiny|outline)/.test(t)) s -= 3;
  if (/(country|flag|map)/.test(t)) s -= 5;
  // shorter titles tend to be canonical
  s -= Math.min(3, Math.floor(t.length / 40));
  return s;
}

async function pickBestSvg(brand: string): Promise<{ title: string; url: string; bytes: Uint8Array } | null> {
  const titles = await commonsSearch(brand);
  if (!titles.length) return null;
  const ranked = titles
    .map(t => ({ t, s: scoreTitle(t, brand) }))
    .sort((a,b) => b.s - a.s)
    .slice(0, 4);
  for (const { t } of ranked) {
    try {
      const url = await commonsFileUrl(t);
      if (!url) continue;
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) continue;
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.length < 300) continue;
      const head = new TextDecoder().decode(buf.slice(0, 200)).toLowerCase();
      if (!head.includes("<svg") && !head.includes("<?xml")) continue;
      return { title: t, url, bytes: buf };
    } catch (_) { /* try next */ }
  }
  return null;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  lockup: "wordmark"|"icon",
  dryRun: boolean,
) {
  const actions: string[] = [];
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  const pick = await pickBestSvg(row.name);
  if (!pick) return { name: row.name, skipped: "no-commons-match" };
  actions.push(`commons:${pick.title}`);

  const upsert = (e: FileEntry) => {
    const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
    if (i>=0) files[i]=e; else files.push(e);
  };

  const svgText = new TextDecoder().decode(pick.bytes);
  const colorBytes = new TextEncoder().encode(sanitizeSvg(svgText));
  const blackBytes = new TextEncoder().encode(monoSvg(svgText, "#000000"));
  const whiteBytes = new TextEncoder().encode(monoSvg(svgText, "#ffffff"));

  if (!dryRun) {
    const colorUrl = await uploadSign(supabase, `${slug}/${lockup}-color.svg`, colorBytes, "image/svg+xml");
    const blackUrl = await uploadSign(supabase, `${slug}/${lockup}-black.svg`, blackBytes, "image/svg+xml");
    const whiteUrl = await uploadSign(supabase, `${slug}/${lockup}-white.svg`, whiteBytes, "image/svg+xml");
    upsert({ url: colorUrl, format:"svg", lockup, variant:"color", source:"wikimedia-commons" });
    upsert({ url: blackUrl, format:"svg", lockup, variant:"black", source:"wikimedia-commons" });
    upsert({ url: whiteUrl, format:"svg", lockup, variant:"white", source:"wikimedia-commons" });
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, actions, error: error.message };
  }
  actions.push(`wrote:${lockup}-color/black/white.svg`);
  return { name: row.name, actions, picked: pick.title };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const names: string[] = Array.isArray(body.names) ? body.names : [];
    if (!names.length) throw new Error("names required");
    const dryRun = body.dryRun === true;
    const lockup = (body.lockup ?? "wordmark") as "wordmark"|"icon";

    const { data, error } = await supabase
      .from("global_client_logos").select("id, name, files").in("name", names);
    if (error) throw error;

    const results: any[] = [];
    for (const r of (data ?? [])) {
      try { results.push(await processOne(supabase, r as any, lockup, dryRun)); }
      catch (e) { results.push({ name:(r as any).name, error:(e as Error).message }); }
    }
    return new Response(JSON.stringify({ ok:true, processed: results.length, results }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
