// Fallback sourcing for color SVGs not available via svgl.app.
// Sources tried in order, per missing/raster lockup:
//   1. gilbarbara/logos CDN (jsdelivr) - large MIT-licensed color SVG catalog
//   2. Firecrawl `branding` scrape on the brand's website_url
//   3. Firecrawl `links` scrape -> filter <img>/<link> URLs ending in .svg
//
// POST body: { names?: string[], dryRun?: boolean, lockup?: "wordmark"|"icon"|"both",
//              onlyMissingSvg?: boolean (default true), limit?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function dl(url: string, timeoutMs = 12000): Promise<{ bytes: Uint8Array; ct: string|null }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "LovableAudit/1.0" }, redirect: "follow", signal: ctl.signal });
    if (!r.ok) throw new Error(`${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length < 80) throw new Error(`tiny ${bytes.length}`);
    return { bytes, ct: r.headers.get("content-type") };
  } finally { clearTimeout(t); }
}

async function uploadSign(sb: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await sb.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

function paintTokens(svgText: string): string[] {
  const tokens: string[] = [];
  const attr = /\b(?:fill|stroke|color|stop-color|flood-color|lighting-color)\s*=\s*["']([^"']+)["']/gi;
  const css = /(?:fill|stroke|color|stop-color|flood-color|lighting-color)\s*:\s*([^;}"]+)/gi;
  for (const re of [attr, css]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(svgText))) tokens.push(m[1].trim().toLowerCase().replace(/!important/g, "").trim());
  }
  return tokens;
}
function hexNorm(token: string): [number,number,number] | null {
  if (!token) return null;
  if (token === "black") return [0,0,0];
  if (token === "white") return [255,255,255];
  const hex = token.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex.slice(0, 6);
    return [parseInt(full.slice(0,2),16), parseInt(full.slice(2,4),16), parseInt(full.slice(4,6),16)];
  }
  const nums = token.match(/rgba?\(([^)]+)\)/i)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number) ?? [];
  if (nums.length >= 3) return [nums[0], nums[1], nums[2]];
  return null;
}
function svgHasColor(svgText: string): boolean {
  const tokens = paintTokens(svgText);
  let colorful = 0;
  for (const t of tokens) {
    if (!t || t === "none" || t === "transparent" || t === "currentcolor" || t === "inherit") continue;
    if (t.startsWith("url(") || t.startsWith("var(")) { colorful++; continue; }
    const rgb = hexNorm(t);
    if (!rgb) continue;
    const [r,g,b] = rgb;
    const isBlack = r <= 20 && g <= 20 && b <= 20;
    const isWhite = r >= 235 && g >= 235 && b >= 235;
    const isGray = Math.abs(r-g) < 8 && Math.abs(g-b) < 8 && Math.abs(r-b) < 8;
    if (!isBlack && !isWhite && !isGray) colorful++;
  }
  if (/<image\b/i.test(svgText) && colorful === 0) return true;
  return colorful > 0;
}

// ============ Source 1: gilbarbara/logos (jsdelivr) ============
// Catalog only loaded once per invocation.
let GB_CACHE: Set<string> | null = null;
async function loadGilbarbara(): Promise<Set<string>> {
  if (GB_CACHE) return GB_CACHE;
  try {
    const r = await fetch("https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos.json");
    if (!r.ok) throw new Error(`${r.status}`);
    const list = await r.json() as Array<{ name: string; files: string[]; url?: string }>;
    GB_CACHE = new Set(list.map(e => e.name.toLowerCase()));
  } catch { GB_CACHE = new Set(); }
  return GB_CACHE;
}

// brand-name overrides into gilbarbara slugs
const GB_OVERRIDES: Record<string, string> = {
  "coca-cola": "coca-cola",
  "mcdonald's": "mcdonalds",
  "x (twitter)": "twitter",
  "service now": "servicenow",
  "azure cloud": "azure",
  "the new york times": "nytimes",
  "amazon prime video": "amazon-prime-video",
  "1440.io": "1440",
  "agility pim": "agility",
  "azure": "azure",
};

async function gbCandidates(rawName: string, lockup: "wordmark"|"icon"): Promise<string[]> {
  const set = await loadGilbarbara();
  if (!set.size) return [];
  const norm = rawName.toLowerCase().trim();
  const slug = GB_OVERRIDES[norm] ?? slugify(rawName);
  const base = `https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos`;
  const urls: string[] = [];
  // gilbarbara naming: <slug>.svg (wordmark/full), <slug>-icon.svg (icon only)
  if (lockup === "icon") {
    if (set.has(`${slug}-icon`)) urls.push(`${base}/${slug}-icon.svg`);
    if (set.has(slug)) urls.push(`${base}/${slug}.svg`);
  } else {
    if (set.has(`${slug}-wordmark`)) urls.push(`${base}/${slug}-wordmark.svg`);
    if (set.has(slug)) urls.push(`${base}/${slug}.svg`);
  }
  return urls;
}

// ============ Source 2/3: Firecrawl ============
interface FirecrawlBranding {
  logo?: string;
  images?: { logo?: string; favicon?: string; ogImage?: string };
  colors?: Record<string, string>;
}
async function firecrawlBrand(website: string): Promise<{ branding?: FirecrawlBranding; links?: string[] }> {
  if (!FIRECRAWL_KEY) return {};
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Authorization": `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: website, formats: ["branding", "links"], onlyMainContent: false, timeout: 15000 }),
      signal: ctl.signal,
    });
    if (!r.ok) return {};
    const data = await r.json();
    return { branding: data?.branding ?? data?.data?.branding, links: data?.links ?? data?.data?.links };
  } catch { return {}; }
  finally { clearTimeout(t); }
}

function isSvgUrl(u: string): boolean {
  try { return new URL(u).pathname.toLowerCase().endsWith(".svg"); } catch { return false; }
}

async function trySources(rawName: string, website: string | null, lockup: "wordmark"|"icon"):
  Promise<{ svg: string; source: string } | null> {
  // 1. gilbarbara
  for (const u of await gbCandidates(rawName, lockup)) {
    try {
      const { bytes } = await dl(u);
      const text = new TextDecoder().decode(bytes);
      if (text.includes("<svg") && svgHasColor(text)) return { svg: text, source: `gilbarbara:${u.split("/").pop()}` };
    } catch { /* next */ }
  }
  // 2. Firecrawl on official site
  if (website && FIRECRAWL_KEY) {
    const { branding, links } = await firecrawlBrand(website);
    const candidates: string[] = [];
    const push = (u?: string) => { if (u && isSvgUrl(u)) candidates.push(u); };
    push(branding?.logo);
    push(branding?.images?.logo);
    push(branding?.images?.favicon);
    if (Array.isArray(links)) {
      for (const l of links) if (isSvgUrl(l) && /logo|brand|mark|wordmark|icon/i.test(l)) candidates.push(l);
    }
    // dedupe, cap
    const seen = new Set<string>();
    for (const u of candidates.slice(0, 12)) {
      if (seen.has(u)) continue; seen.add(u);
      try {
        const { bytes, ct } = await dl(u);
        const text = new TextDecoder().decode(bytes);
        if (!text.includes("<svg")) continue;
        if (!(ct?.includes("svg") || isSvgUrl(u))) continue;
        if (!svgHasColor(text)) continue;
        return { svg: text, source: `firecrawl:${new URL(u).hostname}${new URL(u).pathname}` };
      } catch { /* next */ }
    }
  }
  return null;
}

async function processRow(
  sb: ReturnType<typeof createClient>,
  row: { id: string; name: string; website_url: string|null; files: FileEntry[] },
  lockups: ("wordmark"|"icon")[],
  dryRun: boolean,
  onlyMissingSvg: boolean,
) {
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];
  const actions: string[] = [];
  const issues: string[] = [];

  for (const lockup of lockups) {
    const colorIdx = files.findIndex(f => f?.lockup===lockup && f?.variant==="color");
    const color = colorIdx >= 0 ? files[colorIdx] : null;
    const colorIsSvg = color ? (color.format === "svg" || color.url.toLowerCase().includes(".svg")) : false;
    if (onlyMissingSvg && colorIsSvg) { issues.push(`${lockup}:already-svg`); continue; }

    const found = await trySources(row.name, row.website_url, lockup);
    if (!found) { issues.push(`${lockup}:no-source-found`); continue; }

    if (dryRun) { actions.push(`would-upgrade:${lockup}-color.svg (${found.source})`); continue; }

    try {
      const path = `${slug}/${lockup}-color-enriched.svg`;
      const bytes = new TextEncoder().encode(found.svg);
      const url = await uploadSign(sb, path, bytes, "image/svg+xml");
      const entryNew: FileEntry = { url, format: "svg", lockup, variant: "color", source: found.source };
      for (let i = files.length - 1; i >= 0; i--) {
        if (files[i]?.lockup===lockup && files[i]?.variant==="color") files.splice(i, 1);
      }
      files.push(entryNew);
      actions.push(`upgraded:${lockup}-color.svg (${found.source})`);
    } catch (e) {
      issues.push(`${lockup}:upload-err:${(e as Error).message}`);
    }
  }

  if (!dryRun && actions.length) {
    const { error } = await sb.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, error: error.message, actions, issues };
  }
  return { name: row.name, actions, issues };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const dryRun = body.dryRun === true;
    const onlyMissingSvg = body.onlyMissingSvg !== false; // default true
    const lockupArg = (body.lockup ?? "both") as "wordmark"|"icon"|"both";
    const lockups: ("wordmark"|"icon")[] = lockupArg === "both" ? ["wordmark","icon"] : [lockupArg];
    const limit: number = typeof body.limit === "number" ? body.limit : 0;

    let q = sb.from("global_client_logos").select("id, name, website_url, files").order("name");
    if (Array.isArray(body.names) && body.names.length) q = q.in("name", body.names);
    const { data, error } = await q;
    if (error) throw error;

    // pre-filter to rows that still have a non-SVG color slot (any lockup)
    const candidates = (data ?? []).filter((r: any) => {
      const arr: FileEntry[] = Array.isArray(r.files) ? r.files : [];
      return lockups.some(lk => {
        const c = arr.find(f => f?.lockup===lk && f?.variant==="color");
        if (!c) return false;
        return !(c.format === "svg" || c.url.toLowerCase().includes(".svg"));
      });
    });
    const work = limit > 0 ? candidates.slice(0, limit) : candidates;

    const results: any[] = [];
    let upgraded = 0, errors = 0;
    for (const r of work) {
      try {
        const out = await processRow(sb, r as any, lockups, dryRun, onlyMissingSvg);
        if (out.actions?.length) upgraded++;
        if ((out as any).error) errors++;
        results.push(out);
      } catch (e) {
        errors++;
        results.push({ name: (r as any).name, error: (e as Error).message });
      }
    }
    console.log("enrich-color-svgs:summary", JSON.stringify({ candidates: candidates.length, processed: work.length, upgraded, errors }));
    return new Response(JSON.stringify({ ok:true, candidates: candidates.length, processed: work.length, upgraded, errors, results }),
      { headers: { ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json" } });
  }
});
