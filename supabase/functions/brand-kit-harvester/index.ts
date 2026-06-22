// Brand-kit harvester: targets /brand, /press, /media-kit, /newsroom, /about/brand
// pages on each brand's website to find official high-fidelity logo downloads
// (SVG/EPS/ZIP/PNG). Falls back to Firecrawl search if direct paths 404.
//
// POST body: {
//   names?: string[],         // restrict to these brand names
//   dryRun?: boolean,         // do everything except upload + DB write
//   limit?: number,           // cap brands processed
//   minBytes?: number,        // ignore assets smaller than this (default 2000)
// }
//
// For each brand:
//   1. Probe likely brand-kit paths on website_url.
//   2. For each reachable page, Firecrawl scrape with formats=["links","html"]
//      and harvest direct logo asset URLs (svg/png/eps/ai/zip).
//   3. If nothing usable, run Firecrawl search:
//        "<brand> logo svg site:<domain>"
//        "<brand> brand guidelines download"
//   4. Classify each asset: lockup (wordmark|icon), variant (color|black|white),
//      format. Download, sanity-check size, upload to global-logos bucket,
//      generate mono variants from SVG color, sign 10y URLs, merge into
//      global_client_logos.files (deduped by lockup+variant, prefer higher
//      byte count / vector over raster).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;
const DEFAULT_MIN_BYTES = 2000;
const TARGET_W = 2048;

const BRAND_PATHS = [
  "/brand", "/brand-assets", "/brand-resources", "/brand-guidelines",
  "/brandkit", "/brand-kit", "/branding",
  "/press", "/press-kit", "/press-room", "/pressroom",
  "/newsroom", "/news/media-kit",
  "/media", "/media-kit", "/media-resources", "/media-assets",
  "/about/brand", "/about/press", "/about/media",
  "/company/brand", "/company/press", "/company/media", "/company/newsroom",
  "/resources/brand", "/resources/press", "/resources/logos",
  "/logos", "/logo", "/identity",
];

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white"; bytes?: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function extFromUrl(u: string): string | undefined {
  try {
    const m = new URL(u).pathname.toLowerCase().match(/\.([a-z0-9]+)(?:$|[?#])/);
    return m ? m[1] : undefined;
  } catch { return undefined; }
}

function extFromCT(ct: string|null, fb="png") {
  if (!ct) return fb;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg")||ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("zip")) return "zip";
  return fb;
}

function classify(url: string, brand: string): { lockup: "wordmark"|"icon"; variant: "color"|"black"|"white" } {
  const u = url.toLowerCase();
  const b = brand.toLowerCase().replace(/[^a-z0-9]+/g,"");
  let lockup: "wordmark"|"icon" = "wordmark";
  if (/(^|[-_/])(icon|symbol|mark|favicon|glyph|monogram)([-_./]|$)/.test(u)) lockup = "icon";
  if (/(^|[-_/])(logo|wordmark|lockup|full|primary|horizontal|vertical)([-_./]|$)/.test(u)) lockup = "wordmark";
  let variant: "color"|"black"|"white" = "color";
  if (/(^|[-_/])(white|reverse|reversed|knockout|onblack|on-dark|inverse|inverted|negative)([-_./]|$)/.test(u)) variant = "white";
  else if (/(^|[-_/])(black|onwhite|on-light|positive|mono|monochrome|dark)([-_./]|$)/.test(u)) variant = "black";
  // brand-name hint reduces false-positives
  if (b && u.includes(b)) { /* keep classification */ }
  return { lockup, variant };
}

async function dl(url: string): Promise<{bytes: Uint8Array, ct: string|null}> {
  const res = await fetch(url, {
    headers: { "User-Agent":"Mozilla/5.0 LovableBrandKitBot/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
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
  const c = color === "black" ? 0 : 255;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const px = img.getPixelAt(x+1, y+1);
      const pa = px & 0xff;
      img.setPixelAt(x+1, y+1, ((c<<24)|(c<<16)|(c<<8)|pa) >>> 0);
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

async function firecrawlScrape(url: string, key: string, formats: string[]) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify({ url, formats, onlyMainContent: false }),
    signal: AbortSignal.timeout(45000),
  });
  const j = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`firecrawl scrape ${res.status}`);
  return j?.data ?? j ?? {};
}

async function firecrawlSearch(query: string, key: string, limit = 8) {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify({ query, limit }),
    signal: AbortSignal.timeout(45000),
  });
  const j = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(`firecrawl search ${res.status}`);
  const arr = j?.data?.web ?? j?.web ?? j?.data ?? [];
  return Array.isArray(arr) ? arr : [];
}


function harvestAssetUrlsFromHtml(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const re = /(?:href|src|data-src|data-href)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!/\.(svg|png|eps|ai|zip|pdf)(\?|#|$)/i.test(raw)) continue;
    try { out.add(new URL(raw, baseUrl).toString()); } catch { /* skip */ }
  }
  return [...out];
}

interface HarvestResult {
  name: string;
  candidates: { url: string; lockup: string; variant: string; ext?: string }[];
  written: string[];
  errors: string[];
  skipped?: string;
}

async function processBrand(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; website_url: string|null; files: FileEntry[] },
  firecrawlKey: string,
  dryRun: boolean,
  minBytes: number,
): Promise<HarvestResult> {
  const result: HarvestResult = { name: row.name, candidates: [], written: [], errors: [] };
  if (!row.website_url) { result.skipped = "no-website"; return result; }

  let origin: string;
  try { origin = new URL(row.website_url).origin; }
  catch { result.skipped = "bad-website"; return result; }

  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  // Step 1: probe brand-kit paths, harvest pages that respond OK
  const candidateUrls = new Set<string>();
  const probedPages: string[] = [];
  for (const path of BRAND_PATHS) {
    const probe = `${origin}${path}`;
    try {
      const head = await fetch(probe, { method:"GET", redirect:"follow", signal: AbortSignal.timeout(8000) });
      if (!head.ok) continue;
      probedPages.push(probe);
      const html = await head.text();
      harvestAssetUrlsFromHtml(html, probe).forEach(u => candidateUrls.add(u));
    } catch { /* skip */ }
    if (probedPages.length >= 3) break;
  }

  // Step 2: Firecrawl-scrape the most promising probed page for deeper harvest
  if (probedPages.length > 0) {
    try {
      const data = await firecrawlScrape(probedPages[0], firecrawlKey, ["links","html"]);
      const html = data?.html ?? "";
      const links: string[] = Array.isArray(data?.links) ? data.links : [];
      if (html) harvestAssetUrlsFromHtml(html, probedPages[0]).forEach(u => candidateUrls.add(u));
      for (const l of links) {
        if (/\.(svg|png|eps|ai|zip)(\?|#|$)/i.test(l)) {
          try { candidateUrls.add(new URL(l, probedPages[0]).toString()); } catch { /* skip */ }
        }
      }
    } catch (e) { result.errors.push(`scrape: ${(e as Error).message}`); }
  }

  // Step 3: search fallback if we still have nothing useful
  if (candidateUrls.size === 0) {
    try {
      const domain = new URL(origin).hostname.replace(/^www\./,"");
      const hits = await firecrawlSearch(`${row.name} logo svg site:${domain}`, firecrawlKey, 6);
      for (const h of hits ?? []) {
        const u: string | undefined = h?.url;
        if (!u) continue;
        if (/\.(svg|png|eps|zip)(\?|#|$)/i.test(u)) candidateUrls.add(u);
      }
    } catch (e) { result.errors.push(`search: ${(e as Error).message}`); }
  }

  if (candidateUrls.size === 0) { result.skipped = "no-candidates"; return result; }

  // Step 4: classify + download + dedupe (keep best per lockup+variant)
  const best = new Map<string, { url: string; bytes: Uint8Array; ct: string|null; ext: string; lockup: "wordmark"|"icon"; variant: "color"|"black"|"white" }>();
  for (const url of [...candidateUrls].slice(0, 25)) {
    try {
      const { lockup, variant } = classify(url, row.name);
      const ext = extFromUrl(url) ?? "png";
      if (ext === "zip" || ext === "ai" || ext === "eps" || ext === "pdf") continue; // skip non-web for now
      const { bytes, ct } = await dl(url);
      if (bytes.length < minBytes) continue;
      result.candidates.push({ url, lockup, variant, ext });
      const key = `${lockup}:${variant}`;
      const prev = best.get(key);
      const isSvg = ext === "svg";
      const prevIsSvg = prev?.ext === "svg";
      if (!prev) best.set(key, { url, bytes, ct, ext, lockup, variant });
      else if (isSvg && !prevIsSvg) best.set(key, { url, bytes, ct, ext, lockup, variant });
      else if (isSvg === prevIsSvg && bytes.length > prev.bytes.length) best.set(key, { url, bytes, ct, ext, lockup, variant });
    } catch (e) { result.errors.push(`dl ${url}: ${(e as Error).message}`); }
  }

  if (best.size === 0) { result.skipped = "no-usable-candidates"; return result; }

  const upsert = (e: FileEntry) => {
    const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
    if (i>=0) files[i]=e; else files.push(e);
  };

  for (const [, pick] of best) {
    try {
      const path = `${slug}/${pick.lockup}-${pick.variant}.${pick.ext}`;
      const url = dryRun ? "(dry)" : await uploadSign(supabase, path, pick.bytes, pick.ct ?? `image/${pick.ext}`);
      if (!dryRun) upsert({ url, format: pick.ext, lockup: pick.lockup, variant: pick.variant, source: "brand-kit", bytes: pick.bytes.length });
      result.written.push(`${pick.lockup}-${pick.variant}.${pick.ext} (${Math.round(pick.bytes.length/1024)}KB)`);

      // Auto-derive mono variants when we only have color
      if (pick.variant === "color") {
        if (pick.ext === "svg") {
          const txt = new TextDecoder().decode(pick.bytes);
          for (const [variant, hex] of [["black","#000000"],["white","#ffffff"]] as const) {
            if (best.has(`${pick.lockup}:${variant}`)) continue;
            const monoBytes = new TextEncoder().encode(monoSvg(txt, hex as "#000000"|"#ffffff"));
            const mp = `${slug}/${pick.lockup}-${variant}.svg`;
            const u = dryRun ? "(dry)" : await uploadSign(supabase, mp, monoBytes, "image/svg+xml");
            if (!dryRun) upsert({ url: u, format:"svg", lockup: pick.lockup, variant, source:"brand-kit-derived", bytes: monoBytes.length });
            result.written.push(`${pick.lockup}-${variant}.svg (derived)`);
          }
        } else if (pick.ext === "png") {
          for (const variant of ["black","white"] as const) {
            if (best.has(`${pick.lockup}:${variant}`)) continue;
            try {
              const monoBytes = await monoPng(pick.bytes, variant);
              const mp = `${slug}/${pick.lockup}-${variant}-mono.png`;
              const u = dryRun ? "(dry)" : await uploadSign(supabase, mp, monoBytes, "image/png");
              if (!dryRun) upsert({ url: u, format:"png", lockup: pick.lockup, variant, source:"brand-kit-derived", bytes: monoBytes.length });
              result.written.push(`${pick.lockup}-${variant}-mono.png (derived)`);
            } catch (e) { result.errors.push(`mono ${variant}: ${(e as Error).message}`); }
          }
        }
      }
    } catch (e) { result.errors.push(`write: ${(e as Error).message}`); }
  }

  if (!dryRun && result.written.length > 0) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) result.errors.push(`db: ${error.message}`);
  }

  return result;
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
    const limit = typeof body.limit === "number" ? body.limit : undefined;
    const minBytes = typeof body.minBytes === "number" ? body.minBytes : DEFAULT_MIN_BYTES;

    let q = supabase.from("global_client_logos").select("id, name, website_url, files").order("name");
    if (names) q = q.in("name", names);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;

    const results: HarvestResult[] = [];
    for (const r of (data ?? [])) {
      try { results.push(await processBrand(supabase, r as any, firecrawlKey, dryRun, minBytes)); }
      catch (e) { results.push({ name:(r as any).name, candidates:[], written:[], errors:[(e as Error).message] }); }
    }

    const summary = {
      processed: results.length,
      withWrites: results.filter(r => r.written.length).length,
      skipped: results.filter(r => r.skipped).length,
      errored: results.filter(r => r.errors.length).length,
    };
    return new Response(JSON.stringify({ ok:true, summary, results }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
