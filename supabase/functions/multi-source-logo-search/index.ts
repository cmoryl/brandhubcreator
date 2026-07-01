// multi-source-logo-search: Fetches logos beyond Wikimedia by trying, in order:
//  1. gilbarbara/logos (svgporn dataset on GitHub, MIT)
//  2. vectorlogo.zone (SVG library, -ar21 for wordmark, -icon for icon)
//  3. simple-icons CDN (monochrome brand icons, for icon lockup)
//  4. Clearbit Logo API (PNG, icon fallback via domain)
//  5. Google s2 favicons (256px PNG, last-resort icon)
//  6. Homepage HTML scrape (finds first <img|source> pointing to a .svg logo)
//
// Derives black/white monochrome SVG variants (for SVG picks) and uploads to
// the global-logos bucket, patching global_client_logos.files with source
// attribution.
//
// POST { names: string[], lockup?: "wordmark"|"icon"|"both", dryRun?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const UA = "Mozilla/5.0 (compatible; LovableLogoBot/1.1; +https://lovable.dev)";

type Variant = "color" | "black" | "white";
type Lockup = "wordmark" | "icon";
interface FileEntry { url: string; format?: string; lockup?: Lockup; source?: string; variant?: Variant; }
interface Attempt { source: string; url: string; ok: boolean; status?: number; bytes?: number; ms: number; error?: string; }
interface BrandResult { name: string; lockup: Lockup; source?: string; outcome: "matched"|"no-match"|"error"; attempts: Attempt[]; error?: string; }

const slugify = (s: string) => s.toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const slugCompact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"");

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}
function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi, "");
  s = s.replace(/url\(#[^)]+\)/gi, color);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi,"");
  const style = `<style>*{fill:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function fetchBytes(url: string, attempts: Attempt[], source: string, init?: RequestInit): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const t0 = performance.now();
  try {
    const r = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init?.headers ?? {}) }, redirect: "follow" });
    const ms = Math.round(performance.now() - t0);
    if (!r.ok) { attempts.push({ source, url, ok:false, status:r.status, ms, error:`HTTP ${r.status}` }); return null; }
    const buf = new Uint8Array(await r.arrayBuffer());
    const ct = r.headers.get("content-type") ?? "";
    attempts.push({ source, url, ok:true, status:r.status, ms, bytes: buf.length });
    if (buf.length < 200) return null;
    return { bytes: buf, contentType: ct };
  } catch (e) {
    attempts.push({ source, url, ok:false, ms: Math.round(performance.now()-t0), error: (e as Error).message });
    return null;
  }
}

function isSvgBytes(bytes: Uint8Array): boolean {
  const head = new TextDecoder().decode(bytes.slice(0, 300)).toLowerCase();
  return head.includes("<svg") || (head.includes("<?xml") && head.includes("svg"));
}
function isPngBytes(bytes: Uint8Array): boolean {
  return bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4E && bytes[3]===0x47;
}

function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./,""); } catch { return null; }
}

// --- Source implementations ---------------------------------------------

async function trySvgporn(name: string, lockup: Lockup, attempts: Attempt[]) {
  const s = slugify(name);
  const s2 = slugCompact(name);
  const base = "https://raw.githubusercontent.com/gilbarbara/logos/main/logos";
  const candidates = lockup === "wordmark"
    ? [`${s}-wordmark.svg`, `${s}.svg`, `${s2}-wordmark.svg`, `${s2}.svg`]
    : [`${s}-icon.svg`, `${s}.svg`, `${s2}-icon.svg`, `${s2}.svg`];
  for (const c of candidates) {
    const r = await fetchBytes(`${base}/${c}`, attempts, "svgporn");
    if (r && isSvgBytes(r.bytes)) return { bytes: r.bytes, contentType: "image/svg+xml", format:"svg" as const };
  }
  return null;
}

async function tryVectorLogoZone(name: string, lockup: Lockup, attempts: Attempt[]) {
  const s = slugify(name);
  const suffix = lockup === "wordmark" ? "ar21" : "icon";
  const url = `https://www.vectorlogo.zone/logos/${s}/${s}-${suffix}.svg`;
  const r = await fetchBytes(url, attempts, "vectorlogo.zone");
  if (r && isSvgBytes(r.bytes)) return { bytes: r.bytes, contentType: "image/svg+xml", format:"svg" as const };
  return null;
}

async function trySimpleIcons(name: string, attempts: Attempt[]) {
  const s = slugCompact(name);
  const url = `https://cdn.simpleicons.org/${s}`;
  const r = await fetchBytes(url, attempts, "simple-icons");
  if (r && isSvgBytes(r.bytes)) return { bytes: r.bytes, contentType: "image/svg+xml", format:"svg" as const };
  return null;
}

async function tryClearbit(domain: string, attempts: Attempt[]) {
  const url = `https://logo.clearbit.com/${domain}?size=512`;
  const r = await fetchBytes(url, attempts, "clearbit");
  if (r && isPngBytes(r.bytes)) return { bytes: r.bytes, contentType: "image/png", format:"png" as const };
  return null;
}

async function tryGoogleFavicon(domain: string, attempts: Attempt[]) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  const r = await fetchBytes(url, attempts, "google-favicon");
  if (r && isPngBytes(r.bytes)) return { bytes: r.bytes, contentType: "image/png", format:"png" as const };
  return null;
}

async function tryHomepageScrape(website: string, name: string, attempts: Attempt[]) {
  const r = await fetchBytes(website, attempts, "homepage-html");
  if (!r) return null;
  const html = new TextDecoder().decode(r.bytes.slice(0, 400_000));
  // Find SVG or PNG asset URLs that look like logos
  const urls = new Set<string>();
  const re = /(?:src|srcset|href|content)\s*=\s*["']([^"']+\.(?:svg|png))(?:\?[^"']*)?["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) urls.add(m[1]);
  const scored = [...urls]
    .map(u => ({ u, s: (/logo|wordmark|brand/i.test(u)?4:0) + (/\.svg/i.test(u)?2:0) + (new RegExp(name.split(/\s+/)[0], "i").test(u)?2:0) }))
    .filter(x => x.s > 0)
    .sort((a,b)=> b.s - a.s)
    .slice(0, 5);
  for (const { u } of scored) {
    const abs = u.startsWith("http") ? u : u.startsWith("//") ? `https:${u}` : new URL(u, website).toString();
    const r2 = await fetchBytes(abs, attempts, "homepage-asset");
    if (!r2) continue;
    if (isSvgBytes(r2.bytes)) return { bytes: r2.bytes, contentType: "image/svg+xml", format:"svg" as const };
    if (isPngBytes(r2.bytes) && r2.bytes.length > 2000) return { bytes: r2.bytes, contentType: "image/png", format:"png" as const };
  }
  return null;
}

// --- Orchestration -------------------------------------------------------

async function findAsset(name: string, lockup: Lockup, website: string | null, attempts: Attempt[]) {
  const domain = extractDomain(website);
  // Order: svgporn -> vectorlogo -> (simple-icons if icon) -> homepage -> clearbit -> favicon
  let picked = await trySvgporn(name, lockup, attempts);
  if (!picked) picked = await tryVectorLogoZone(name, lockup, attempts);
  if (!picked && lockup === "icon") picked = await trySimpleIcons(name, attempts);
  if (!picked && website) picked = await tryHomepageScrape(website, name, attempts);
  if (!picked && lockup === "icon" && domain) picked = await tryClearbit(domain, attempts);
  if (!picked && lockup === "icon" && domain) picked = await tryGoogleFavicon(domain, attempts);
  return picked
    ? {
        ...picked,
        source: attempts.slice().reverse().find(a => a.ok)?.source ?? "unknown",
      }
    : null;
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

async function processBrandLockup(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; website_url: string | null; files: FileEntry[] },
  lockup: Lockup,
  dryRun: boolean,
): Promise<BrandResult> {
  const attempts: Attempt[] = [];
  try {
    const picked = await findAsset(row.name, lockup, row.website_url, attempts);
    if (!picked) return { name: row.name, lockup, outcome: "no-match", attempts };
    const slug = slugify(row.name);
    const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];
    const upsert = (e: FileEntry) => {
      const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
      if (i>=0) files[i]=e; else files.push(e);
    };

    if (picked.format === "svg") {
      const svgText = new TextDecoder().decode(picked.bytes);
      const colorB = new TextEncoder().encode(sanitizeSvg(svgText));
      const blackB = new TextEncoder().encode(monoSvg(svgText, "#000000"));
      const whiteB = new TextEncoder().encode(monoSvg(svgText, "#ffffff"));
      if (!dryRun) {
        const c = await uploadSign(supabase, `${slug}/${lockup}-color.svg`, colorB, "image/svg+xml");
        const b = await uploadSign(supabase, `${slug}/${lockup}-black.svg`, blackB, "image/svg+xml");
        const w = await uploadSign(supabase, `${slug}/${lockup}-white.svg`, whiteB, "image/svg+xml");
        upsert({ url:c, format:"svg", lockup, variant:"color", source: picked.source });
        upsert({ url:b, format:"svg", lockup, variant:"black", source: picked.source });
        upsert({ url:w, format:"svg", lockup, variant:"white", source: picked.source });
      }
    } else {
      // PNG only — store the color variant. Skip mono derivation (needs raster processing).
      if (!dryRun) {
        const c = await uploadSign(supabase, `${slug}/${lockup}-color.png`, picked.bytes, "image/png");
        upsert({ url:c, format:"png", lockup, variant:"color", source: picked.source });
      }
    }

    if (!dryRun) {
      const { error } = await supabase.from("global_client_logos")
        .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    return { name: row.name, lockup, source: picked.source, outcome: "matched", attempts };
  } catch (e) {
    return { name: row.name, lockup, outcome: "error", attempts, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const names: string[] = Array.isArray(body.names) ? body.names : [];
    if (!names.length) throw new Error("names required");
    const lockup = (body.lockup ?? "both") as Lockup | "both";
    const dryRun = body.dryRun === true;
    const lockups: Lockup[] = lockup === "both" ? ["wordmark","icon"] : [lockup];

    const { data, error } = await supabase
      .from("global_client_logos").select("id, name, website_url, files").in("name", names);
    if (error) throw error;

    const results: BrandResult[] = [];
    for (const r of (data ?? [])) {
      for (const lk of lockups) {
        // Skip if brand already has this lockup
        const files = Array.isArray((r as any).files) ? (r as any).files : [];
        if (files.some((f: FileEntry) => f?.lockup === lk)) continue;
        results.push(await processBrandLockup(supabase, r as any, lk, dryRun));
      }
    }
    const summary = {
      matched: results.filter(r=>r.outcome==="matched").length,
      noMatch: results.filter(r=>r.outcome==="no-match").length,
      errors:  results.filter(r=>r.outcome==="error").length,
      bySource: results.filter(r=>r.outcome==="matched").reduce((a: Record<string, number>, r) => { const k = r.source ?? "?"; a[k]=(a[k]??0)+1; return a; }, {} as Record<string, number>),
    };
    console.log("multi-source-logo-search:summary", JSON.stringify(summary));
    return new Response(JSON.stringify({ ok:true, processed: results.length, summary, results }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
